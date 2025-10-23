import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Note as NoteType, DrumPart, NoteDuration, TimeSignature, Tool, LoopRegion, TextAnnotation } from '../types';
import {
  STAFF_HEIGHT, STAFF_LINE_GAP,
  STAFF_Y_OFFSET, STAFF_X_OFFSET, CLEF_WIDTH,
  SUBDIVISIONS_PER_BEAT, DRUM_PART_Y_POSITIONS,
  MEASURE_PADDING_HORIZONTAL, TIME_SIGNATURE_WIDTH, MEASURES_PER_LINE, STAFF_VERTICAL_GAP
} from '../constants';
import { Note } from './Note';
import { PercussionClef, PlusIcon, TrashIcon } from './Icons';
import { BeamedNoteGroup, NotePosition } from './BeamedNoteGroup';

export interface StaffClickInfo {
  x: number;
  y: number;
  measureIndex: number;
  beat: number;
}

interface StaffProps {
  notes: NoteType[];
  numMeasures: number;
  textAnnotations: TextAnnotation[];
  onStaffClick: (info: StaffClickInfo) => void;
  onNoteClick: (noteId: string) => void;
  onAnnotationClick: (annotationId: string) => void;
  onMeasureClick: (measureIndex: number) => void;
  onUpdateTextAnnotation: (id: string, x: number, y: number) => void;
  onInsertLine: (afterLineIndex: number) => void;
  onDeleteLine: (lineIndex: number) => void;
  selectedTool: Tool;
  selectedDrumPart: DrumPart;
  selectedDuration: NoteDuration;
  isPlaying: boolean;
  playbackStartTime: number | null;
  tempo: number;
  timeSignature: TimeSignature;
  loopRegion: LoopRegion;
  loopStartMeasure: number | null;
  deleteStartMeasure: number | null;
}

const groupNotesForBeaming = (notes: NoteType[]): NoteType[][] => {
  if (!notes || notes.length === 0) return [];
  const sortedNotes = [...notes].sort((a, b) => a.measure * 100 + a.beat - (b.measure * 100 + b.beat));
  const groups: NoteType[][] = [];
  let currentGroup: NoteType[] = [];

  for (const note of sortedNotes) {
    if (note.duration !== NoteDuration.EIGHTH && note.duration !== NoteDuration.SIXTEENTH && note.duration !== NoteDuration.THIRTY_SECOND) {
      if (currentGroup.length > 0) groups.push(currentGroup);
      groups.push([note]);
      currentGroup = [];
      continue;
    }
    if (currentGroup.length === 0) {
      currentGroup.push(note);
      continue;
    }
    const lastNote = currentGroup[currentGroup.length - 1];
    const canBeBeamed = note.voice === lastNote.voice && note.measure === lastNote.measure && Math.floor(note.beat) === Math.floor(lastNote.beat);
    if (canBeBeamed) {
      currentGroup.push(note);
    } else {
      groups.push(currentGroup);
      currentGroup = [note];
    }
  }
  if (currentGroup.length > 0) groups.push(currentGroup);
  return groups;
}

export const Staff: React.FC<StaffProps> = ({
  notes, numMeasures, textAnnotations, onStaffClick, onNoteClick, onAnnotationClick, onMeasureClick, onUpdateTextAnnotation, onInsertLine, onDeleteLine, selectedTool, selectedDrumPart, selectedDuration,
  isPlaying, playbackStartTime, tempo, timeSignature, loopRegion, loopStartMeasure, deleteStartMeasure
}) => {
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number; part: DrumPart } | null>(null);
  const [hoverMeasure, setHoverMeasure] = useState<number | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; line: number } | null>(null);
  const [hoveredGapIndex, setHoveredGapIndex] = useState<number | null>(null);
  const animationFrameRef = useRef<number>();

  const beatsPerMeasure = timeSignature.top;
  const numLines = Math.ceil(numMeasures / MEASURES_PER_LINE);

  const layout = useMemo(() => {
    const measureWidths = Array.from({ length: numMeasures }).map((_, mIndex) => {
      const notesInMeasure = notes.filter(n => n.measure === mIndex);
      if (notesInMeasure.length === 0) return 200;
      const has32nds = notesInMeasure.some(n => n.duration === NoteDuration.THIRTY_SECOND);
      const has16ths = notesInMeasure.some(n => n.duration === NoteDuration.SIXTEENTH);
      if (has32nds) return 400;
      if (has16ths) return 300;
      if (notesInMeasure.length > 8) return 250;
      return 200;
    });

    const measureStartXs: number[][] = [];
    const lineTotalWidths: number[] = [];
    const lineStartX = STAFF_X_OFFSET + CLEF_WIDTH + TIME_SIGNATURE_WIDTH;

    for (let i = 0; i < numLines; i++) {
      measureStartXs[i] = [];
      let currentX = lineStartX;
      for (let j = 0; j < MEASURES_PER_LINE; j++) {
        const measureIndex = i * MEASURES_PER_LINE + j;
        if (measureIndex < numMeasures) {
          measureStartXs[i][j] = currentX;
          currentX += measureWidths[measureIndex];
        }
      }
      lineTotalWidths[i] = currentX;
    }

    const totalWidth = Math.max(...lineTotalWidths, 1000) + STAFF_X_OFFSET;
    return { measureWidths, measureStartXs, lineTotalWidths, totalWidth };
  }, [notes, numMeasures]);

  const totalHeight = useMemo(() => numLines * STAFF_HEIGHT + (numLines - 1) * STAFF_VERTICAL_GAP + 20, [numLines]);

  useEffect(() => {
    if (isPlaying && playbackStartTime) {
      const animate = () => {
        const elapsedTime = performance.now() - playbackStartTime;
        const totalBeatsElapsed = (elapsedTime / 1000) * (tempo / 60);
        
        let currentMeasureIndex = Math.floor(totalBeatsElapsed / beatsPerMeasure);
        let beatInCurrentMeasure = totalBeatsElapsed % beatsPerMeasure;

        if (loopRegion) {
          const loopDurationInBeats = (loopRegion.endMeasure - loopRegion.startMeasure + 1) * beatsPerMeasure;
          const beatsIntoLoop = totalBeatsElapsed % loopDurationInBeats;
          currentMeasureIndex = loopRegion.startMeasure + Math.floor(beatsIntoLoop / beatsPerMeasure);
          beatInCurrentMeasure = beatsIntoLoop % beatsPerMeasure;
        }

        if (currentMeasureIndex >= numMeasures) {
          setCursorPosition(null);
          return;
        }

        const lineIndex = Math.floor(currentMeasureIndex / MEASURES_PER_LINE);
        const measureInLine = currentMeasureIndex % MEASURES_PER_LINE;
        const measureStartPx = layout.measureStartXs[lineIndex][measureInLine];
        const measureWidth = layout.measureWidths[currentMeasureIndex];
        const beatWidth = (measureWidth - MEASURE_PADDING_HORIZONTAL * 2) / beatsPerMeasure;
        
        const newCursorX = measureStartPx + MEASURE_PADDING_HORIZONTAL + beatInCurrentMeasure * beatWidth;
        setCursorPosition({ x: newCursorX, line: lineIndex });

        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setCursorPosition(null);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, playbackStartTime, tempo, timeSignature, loopRegion, layout, beatsPerMeasure, numMeasures]);

  const noteGroups = useMemo(() => {
    const voice1Notes = notes.filter(n => n.voice === 1);
    const voice2Notes = notes.filter(n => n.voice === 2);
    return [...groupNotesForBeaming(voice1Notes), ...groupNotesForBeaming(voice2Notes)];
  }, [notes]);
  
  const getPositionFromMouseEvent = (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = e.currentTarget;
      const point = new DOMPoint(e.clientX, e.clientY);
      const { x, y } = point.matrixTransform(svg.getScreenCTM()?.inverse());

      const lineIndex = Math.floor(y / (STAFF_HEIGHT + STAFF_VERTICAL_GAP));
      if (lineIndex < 0 || lineIndex >= numLines) return { x, y, lineIndex: -1, measureIndex: -1, paddedXInMeasure: -1, noteAreaWidth: -1 };

      const lineMeasureStartXs = layout.measureStartXs[lineIndex];
      if (!lineMeasureStartXs) return { x, y, lineIndex, measureIndex: -1, paddedXInMeasure: -1, noteAreaWidth: -1 };

      let measureInLine = lineMeasureStartXs.findIndex((startX, i) => {
        const measureIndex = lineIndex * MEASURES_PER_LINE + i;
        const nextStartX = lineMeasureStartXs[i+1] || (startX + layout.measureWidths[measureIndex]);
        return x >= startX && x < nextStartX;
      });

      if (measureInLine === -1) return { x, y, lineIndex, measureIndex: -1, paddedXInMeasure: -1, noteAreaWidth: -1 };

      const measureIndex = lineIndex * MEASURES_PER_LINE + measureInLine;
      if (measureIndex >= numMeasures) return { x, y, lineIndex, measureIndex: -1, paddedXInMeasure: -1, noteAreaWidth: -1 };

      const xInMeasure = x - lineMeasureStartXs[measureInLine];
      const currentMeasureWidth = layout.measureWidths[measureIndex];
      const paddedXInMeasure = xInMeasure - MEASURE_PADDING_HORIZONTAL;
      const noteAreaWidth = currentMeasureWidth - 2 * MEASURE_PADDING_HORIZONTAL;
      
      return { x, y, lineIndex, measureIndex, currentMeasureWidth, xInMeasure, paddedXInMeasure, noteAreaWidth };
  };

  const handleTextMouseDown = (e: React.MouseEvent, annotation: TextAnnotation) => {
    if (selectedTool !== Tool.PEN && selectedTool !== Tool.TEXT) return;
    e.stopPropagation();
    const { x, y } = getPositionFromMouseEvent(e);
    setDraggedItem({
      id: annotation.id,
      offsetX: x - annotation.x,
      offsetY: y - annotation.y,
    });
  };

  const handleMouseUp = () => {
    setDraggedItem(null);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const pos = getPositionFromMouseEvent(e);

    if (draggedItem) {
      onUpdateTextAnnotation(draggedItem.id, pos.x - draggedItem.offsetX, pos.y - draggedItem.offsetY);
      return;
    }

    if (isPlaying) return;

    if (selectedTool === Tool.LOOP || selectedTool === Tool.COPY || selectedTool === Tool.TEXT || selectedTool === Tool.DELETE) {
      setHoverPosition(null);
      setHoverMeasure(pos.measureIndex !== -1 ? pos.measureIndex : null);
    } else {
      setHoverMeasure(null);
      if (pos.measureIndex === -1 || pos.paddedXInMeasure < 0) {
        setHoverPosition(null);
        return;
      }
      
      const { measureIndex, paddedXInMeasure, noteAreaWidth, lineIndex } = pos;
      const beatInMeasure = (paddedXInMeasure / noteAreaWidth) * beatsPerMeasure;
      const beatUnit = timeSignature.bottom === 8 ? 2 : 1;
      let subdivision = 1 * beatUnit;
      if (selectedDuration === NoteDuration.SIXTEENTH) subdivision = SUBDIVISIONS_PER_BEAT * beatUnit;
      else if (selectedDuration === NoteDuration.EIGHTH) subdivision = 2 * beatUnit;
      else if (selectedDuration === NoteDuration.THIRTY_SECOND) subdivision = 8 * beatUnit;

      const quantizedBeat = Math.max(0, Math.round(beatInMeasure * subdivision) / subdivision);
      
      const lineYOffset = lineIndex * (STAFF_HEIGHT + STAFF_VERTICAL_GAP);
      const beatWidth = noteAreaWidth / beatsPerMeasure;
      const beatX = layout.measureStartXs[lineIndex][measureIndex % MEASURES_PER_LINE] + MEASURE_PADDING_HORIZONTAL + quantizedBeat * beatWidth;
      const partY = lineYOffset + DRUM_PART_Y_POSITIONS[selectedDrumPart];

      setHoverPosition({ x: beatX, y: partY, part: selectedDrumPart });
    }
  };

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggedItem) return;
    if (isPlaying) return;
    const pos = getPositionFromMouseEvent(e);
    if(pos.measureIndex === -1) return;

    if (selectedTool === Tool.LOOP || selectedTool === Tool.COPY || selectedTool === Tool.DELETE) {
      onMeasureClick(pos.measureIndex);
    } else {
      const beatInMeasure = (pos.paddedXInMeasure / pos.noteAreaWidth) * beatsPerMeasure;
      const beatUnit = timeSignature.bottom === 8 ? 2 : 1;
      let subdivision = 1 * beatUnit;
      if (selectedDuration === NoteDuration.SIXTEENTH) subdivision = SUBDIVISIONS_PER_BEAT * beatUnit;
      else if (selectedDuration === NoteDuration.EIGHTH) subdivision = 2 * beatUnit;
      else if (selectedDuration === NoteDuration.THIRTY_SECOND) subdivision = 8 * beatUnit;

      const quantizedBeat = Math.max(0, Math.round(beatInMeasure * subdivision) / subdivision);
      
      onStaffClick({ x: pos.x, y: pos.y, measureIndex: pos.measureIndex, beat: quantizedBeat });
    }
  };
  
  return (
    <div className="w-full overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 print:overflow-visible print:shadow-none print:p-0">
        <svg
            width={layout.totalWidth}
            height={totalHeight}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleClick}
            className="select-none text-black dark:text-white"
        >
          {Array.from({ length: numLines }).map((_, lineIndex) => {
            const lineYOffset = lineIndex * (STAFF_HEIGHT + STAFF_VERTICAL_GAP);
            const measuresOnThisLine = Array.from({ length: MEASURES_PER_LINE }).map((_, i) => lineIndex * MEASURES_PER_LINE + i).filter(m => m < numMeasures);

            return (
              <g key={`line-group-${lineIndex}`}>
                {/* Staff lines */}
                {Array.from({ length: 5 }).map((_, i) => (
                    <line
                        key={i} x1={STAFF_X_OFFSET} y1={lineYOffset + STAFF_Y_OFFSET + i * STAFF_LINE_GAP}
                        x2={layout.lineTotalWidths[lineIndex]} y2={lineYOffset + STAFF_Y_OFFSET + i * STAFF_LINE_GAP}
                        stroke="currentColor" strokeWidth="1"
                    />
                ))}
                
                <PercussionClef x={STAFF_X_OFFSET} y={lineYOffset + STAFF_Y_OFFSET - 2 * STAFF_LINE_GAP + 2} />
                
                {/* Time Signature */}
                <g transform={`translate(${STAFF_X_OFFSET + CLEF_WIDTH + (TIME_SIGNATURE_WIDTH / 2)}, ${lineYOffset + STAFF_Y_OFFSET})`} className="font-serif font-bold text-4xl">
                  <text x="0" y={STAFF_LINE_GAP * 1.5} textAnchor="middle" dominantBaseline="middle">{timeSignature.top}</text>
                  <text x="0" y={STAFF_LINE_GAP * 3.5} textAnchor="middle" dominantBaseline="middle">{timeSignature.bottom}</text>
                </g>

                {/* Measure lines */}
                {measuresOnThisLine.map((m, i) => {
                  const x = layout.measureStartXs[lineIndex][i];
                  return (
                    <line
                        key={i}
                        x1={x} y1={lineYOffset + STAFF_Y_OFFSET}
                        x2={x} y2={lineYOffset + STAFF_Y_OFFSET + 4 * STAFF_LINE_GAP}
                        stroke="currentColor" strokeWidth={i === 0 ? '2' : '1'}
                    />
                  );
                })}

                <line
                  x1={layout.lineTotalWidths[lineIndex]} y1={lineYOffset + STAFF_Y_OFFSET}
                  x2={layout.lineTotalWidths[lineIndex]} y2={lineYOffset + STAFF_Y_OFFSET + 4 * STAFF_LINE_GAP}
                  stroke="currentColor" strokeWidth="2"
                />

                {/* Loop Region Highlight */}
                {loopRegion && (
                  <g>
                    {measuresOnThisLine.map((m, i) => {
                      if (m >= loopRegion.startMeasure && m <= loopRegion.endMeasure) {
                        const x = layout.measureStartXs[lineIndex][i];
                        return <rect key={`loop-highlight-${m}`} x={x} y={lineYOffset + STAFF_Y_OFFSET - STAFF_LINE_GAP} width={layout.measureWidths[m]} height={STAFF_LINE_GAP * 6} fill="rgba(59, 130, 246, 0.15)" className="pointer-events-none" />
                      }
                      return null;
                    })}
                  </g>
                )}

                {/* Insert Line UI */}
                {lineIndex < numLines - 1 && (
                  <g 
                    onMouseEnter={() => setHoveredGapIndex(lineIndex)}
                    onMouseLeave={() => setHoveredGapIndex(null)}
                  >
                    <rect 
                      x={STAFF_X_OFFSET} 
                      y={lineYOffset + STAFF_HEIGHT}
                      width={layout.totalWidth - STAFF_X_OFFSET * 2}
                      height={STAFF_VERTICAL_GAP}
                      fill="transparent"
                    />
                    {hoveredGapIndex === lineIndex && (
                      <g 
                        className="cursor-pointer" 
                        onClick={() => onInsertLine(lineIndex)}
                      >
                        <rect 
                          x={layout.totalWidth / 2 - 100}
                          y={lineYOffset + STAFF_HEIGHT + STAFF_VERTICAL_GAP / 2 - 15}
                          width={200}
                          height={30}
                          rx={8}
                          fill="rgba(59, 130, 246, 0.8)"
                        />
                        <text 
                          x={layout.totalWidth / 2} 
                          y={lineYOffset + STAFF_HEIGHT + STAFF_VERTICAL_GAP / 2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="white"
                          className="font-sans font-semibold pointer-events-none"
                        >
                          [ + ] Insert new line here
                        </text>
                      </g>
                    )}
                  </g>
                )}

                {/* Delete Line Button */}
                <g 
                  className="cursor-pointer opacity-20 hover:opacity-100 transition-opacity"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onDeleteLine(lineIndex); 
                  }}
                >
                  <TrashIcon x={layout.lineTotalWidths[lineIndex] + 10} y={lineYOffset + STAFF_Y_OFFSET + STAFF_LINE_GAP * 1.5} />
                </g>
              </g>
            );
          })}

            {/* Hover effect for measure selection */}
            {hoverMeasure !== null && (
              (() => {
                const measureIndex = hoverMeasure;
                const lineIndex = Math.floor(measureIndex / MEASURES_PER_LINE);
                const measureInLine = measureIndex % MEASURES_PER_LINE;
                const lineYOffset = lineIndex * (STAFF_HEIGHT + STAFF_VERTICAL_GAP);
                const x = layout.measureStartXs[lineIndex][measureInLine];
                
                let fillColor = "rgba(37, 99, 235, 0.2)"; // Default blue
                if (selectedTool === Tool.DELETE) {
                  fillColor = "rgba(239, 68, 68, 0.4)"; // Red for delete
                }

                return <rect key={`hover-${measureIndex}`} x={x} y={lineYOffset + STAFF_Y_OFFSET} width={layout.measureWidths[measureIndex]} height={STAFF_LINE_GAP * 4} fill={fillColor} className="pointer-events-none" />
              })()
            )}
            {(loopStartMeasure !== null || deleteStartMeasure !== null) && (
                 (() => {
                    const startMeasure = loopStartMeasure ?? deleteStartMeasure;
                    if (startMeasure === null) return null;
                    const measureIndex = startMeasure;
                    const lineIndex = Math.floor(measureIndex / MEASURES_PER_LINE);
                    const measureInLine = measureIndex % MEASURES_PER_LINE;
                    const lineYOffset = lineIndex * (STAFF_HEIGHT + STAFF_VERTICAL_GAP);
                    const x = layout.measureStartXs[lineIndex][measureInLine];
                    const fillColor = selectedTool === Tool.DELETE ? "rgba(239, 68, 68, 0.5)" : "rgba(37, 99, 235, 0.3)";
                    return <rect key={`start-highlight`} x={x} y={lineYOffset + STAFF_Y_OFFSET} width={layout.measureWidths[measureIndex]} height={STAFF_LINE_GAP * 4} fill={fillColor} className="pointer-events-none" />
                 })()
            )}

            {/* Render Notes */}
            {noteGroups.map((group, index) => {
              const lineIndex = Math.floor(group[0].measure / MEASURES_PER_LINE);
              const lineYOffset = lineIndex * (STAFF_HEIGHT + STAFF_VERTICAL_GAP);
              
              const calculateX = (note: NoteType) => {
                const measureIndex = note.measure;
                const measureInLine = measureIndex % MEASURES_PER_LINE;
                const measureStart = layout.measureStartXs[lineIndex][measureInLine];
                const beatWidth = (layout.measureWidths[measureIndex] - MEASURE_PADDING_HORIZONTAL * 2) / beatsPerMeasure;
                return measureStart + MEASURE_PADDING_HORIZONTAL + note.beat * beatWidth;
              };
              const calculateY = (note: NoteType) => lineYOffset + DRUM_PART_Y_POSITIONS[note.part];

              if (group.length > 1) {
                const notePositions: NotePosition[] = group.map(note => ({ note, x: calculateX(note), y: calculateY(note) }));
                return <BeamedNoteGroup key={`group-${index}`} notePositions={notePositions} onNoteClick={onNoteClick} selectedTool={selectedTool} />;
              }
              if (group.length === 1) {
                const note = group[0];
                return <Note key={note.id} note={note} x={calculateX(note)} y={calculateY(note)} onClick={onNoteClick} selectedTool={selectedTool} />;
              }
              return null;
            })}

            {/* Render Text Annotations */}
            {textAnnotations.map(annotation => (
              <text 
                key={annotation.id} 
                x={annotation.x} 
                y={annotation.y} 
                fill="currentColor" 
                fontSize="16" 
                textAnchor="middle"
                onMouseDown={(e) => handleTextMouseDown(e, annotation)}
                onClick={() => onAnnotationClick(annotation.id)}
                className="cursor-grab active:cursor-grabbing"
              >
                {annotation.text}
              </text>
            ))}
          
            {hoverPosition && !isPlaying && selectedTool === Tool.PEN && <circle cx={hoverPosition.x} cy={hoverPosition.y} r="5" fill="rgba(37, 99, 235, 0.5)" />}

            {/* Playback Cursor */}
            {cursorPosition && (
              (() => {
                const lineYOffset = cursorPosition.line * (STAFF_HEIGHT + STAFF_VERTICAL_GAP);
                return (
                  <line
                    x1={cursorPosition.x}
                    y1={lineYOffset + STAFF_Y_OFFSET - STAFF_LINE_GAP}
                    x2={cursorPosition.x}
                    y2={lineYOffset + STAFF_Y_OFFSET + 5 * STAFF_LINE_GAP}
                    stroke="rgba(59, 130, 246, 0.7)"
                    strokeWidth="2"
                    className="pointer-events-none"
                  />
                );
              })()
            )}
        </svg>
    </div>
  );
};