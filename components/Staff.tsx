import React, { useState, useMemo } from 'react';
import { Note as NoteType, DrumPart, NoteDuration, TimeSignature, PlaybackCursor, Tool, LoopRegion, TextAnnotation } from '../types';
import {
  STAFF_HEIGHT, STAFF_LINE_GAP,
  NUM_MEASURES, STAFF_Y_OFFSET, STAFF_X_OFFSET, CLEF_WIDTH,
  SUBDIVISIONS_PER_BEAT, DRUM_PART_Y_POSITIONS,
  MEASURE_PADDING_HORIZONTAL, TIME_SIGNATURE_WIDTH, MEASURES_PER_LINE, STAFF_VERTICAL_GAP
} from '../constants';
import { Note } from './Note';
import { PercussionClef, PlaybackArrowIcon, TrashIcon, AddLineIcon } from './Icons';
import { BeamedNoteGroup, NotePosition } from './BeamedNoteGroup';
import { DraggableText } from './DraggableText';
import { Rest } from './Rest';

export interface StaffClickInfo {
  measureIndex: number;
  beat: number;
  part?: DrumPart;
  x: number;
  y: number;
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
  onUpdateAnnotationText: (id: string, text: string) => void;
  onInsertLine: (afterLineIndex: number) => void;
  onDeleteLine: (lineIndex: number) => void;
  selectedTool: Tool;
  selectedDrumPart: DrumPart;
  selectedDuration: NoteDuration;
  isPlaying: boolean;
  playbackCursor: PlaybackCursor;
  playbackProgress: number;
  tempo: number;
  timeSignature: TimeSignature;
  loopRegion: LoopRegion;
  loopStartMeasure: number | null;
  deleteStartMeasure: number | null;
  selectedAnnotationId: string | null;
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

const Staff: React.FC<StaffProps> = ({
  notes, numMeasures, textAnnotations, onStaffClick, onNoteClick, onAnnotationClick, onMeasureClick, onUpdateTextAnnotation, onUpdateAnnotationText, onInsertLine, onDeleteLine,
  selectedTool, selectedDrumPart, selectedDuration, isPlaying, playbackCursor, playbackProgress, tempo, timeSignature, loopRegion, loopStartMeasure, deleteStartMeasure, selectedAnnotationId
}) => {
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number; part: DrumPart } | null>(null);
  const [hoverMeasure, setHoverMeasure] = useState<number | null>(null);
  
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

    const totalWidth = Math.max(...lineTotalWidths) + STAFF_X_OFFSET;
    return { measureWidths, measureStartXs, lineTotalWidths, totalWidth };
  }, [notes, numMeasures]);

  const totalHeight = useMemo(() => numLines * STAFF_HEIGHT + (numLines - 1) * STAFF_VERTICAL_GAP + 20, [numLines]);

  const { rests, musicNotes } = useMemo(() => {
    const rests: NoteType[] = [];
    const musicNotes: NoteType[] = [];
    notes.forEach(note => {
      if (note.part === DrumPart.REST) {
        rests.push(note);
      } else {
        musicNotes.push(note);
      }
    });
    return { rests, musicNotes };
  }, [notes]);

  const noteGroups = useMemo(() => {
    const voice1Notes = musicNotes.filter(n => n.voice === 1);
    const voice2Notes = musicNotes.filter(n => n.voice === 2);
    const voice3Notes = musicNotes.filter(n => n.voice === 3);
    return [...groupNotesForBeaming(voice1Notes), ...groupNotesForBeaming(voice2Notes), ...groupNotesForBeaming(voice3Notes)];
  }, [musicNotes]);
  
  const getPositionFromMouseEvent = (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = e.currentTarget;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const { x, y } = pt.matrixTransform(svg.getScreenCTM()?.inverse());

      const lineIndex = Math.floor(y / (STAFF_HEIGHT + STAFF_VERTICAL_GAP));
      if (lineIndex < 0 || lineIndex >= numLines) return null;

      const lineMeasureStartXs = layout.measureStartXs[lineIndex];
      if (!lineMeasureStartXs) return null;

      let measureInLine = lineMeasureStartXs.findIndex((startX, i) => {
        const measureIndex = lineIndex * MEASURES_PER_LINE + i;
        const nextStartX = lineMeasureStartXs[i+1] || (startX + layout.measureWidths[measureIndex]);
        return x >= startX && x < nextStartX;
      });

      if (measureInLine === -1) return null;

      const measureIndex = lineIndex * MEASURES_PER_LINE + measureInLine;
      if (measureIndex >= numMeasures) return null;

      const xInMeasure = x - lineMeasureStartXs[measureInLine];
      const currentMeasureWidth = layout.measureWidths[measureIndex];
      const paddedXInMeasure = xInMeasure - MEASURE_PADDING_HORIZONTAL;
      const noteAreaWidth = currentMeasureWidth - 2 * MEASURE_PADDING_HORIZONTAL;
      if (paddedXInMeasure < 0 || paddedXInMeasure > noteAreaWidth) return null;

      return { x, y, lineIndex, measureIndex, currentMeasureWidth, xInMeasure, paddedXInMeasure, noteAreaWidth };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPlaying) return;
    const pos = getPositionFromMouseEvent(e);

    if (selectedTool === Tool.LOOP || selectedTool === Tool.COPY || selectedTool === Tool.DELETE) {
      setHoverPosition(null);
      setHoverMeasure(pos ? pos.measureIndex : null);
    } else {
      setHoverMeasure(null);
      if (!pos) {
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
    if (isPlaying) return;
    
    const pos = getPositionFromMouseEvent(e);
    if(!pos) return;
    
    if (selectedTool === Tool.LOOP || selectedTool === Tool.COPY || selectedTool === Tool.DELETE) {
      onMeasureClick(pos.measureIndex);
    } else {
      const { measureIndex, paddedXInMeasure, noteAreaWidth, x, y } = pos;
      const beatInMeasure = (paddedXInMeasure / noteAreaWidth) * beatsPerMeasure;
      const beatUnit = timeSignature.bottom === 8 ? 2 : 1;
      let subdivision = 1 * beatUnit;
      if (selectedDuration === NoteDuration.SIXTEENTH) subdivision = SUBDIVISIONS_PER_BEAT * beatUnit;
      else if (selectedDuration === NoteDuration.EIGHTH) subdivision = 2 * beatUnit;
      else if (selectedDuration === NoteDuration.THIRTY_SECOND) subdivision = 8 * beatUnit;

      const quantizedBeat = Math.max(0, Math.round(beatInMeasure * subdivision) / subdivision);
      
      onStaffClick({ measureIndex, beat: quantizedBeat, x, y });
    }
  };
  
  return (
    <div className="w-full overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 relative">
        <div className="absolute bottom-4 right-4 no-print">
            <button onClick={() => onAddLine()} className="p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition">
                <AddLineIcon />
            </button>
        </div>

        <svg
            width={layout.totalWidth}
            height={totalHeight}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => { setHoverPosition(null); setHoverMeasure(null); }}
            onClick={handleClick}
            className="select-none text-black dark:text-white"
        >
          {Array.from({ length: numLines }).map((_, lineIndex) => {
            const lineYOffset = lineIndex * (STAFF_HEIGHT + STAFF_VERTICAL_GAP);
            const measuresOnThisLine = Array.from({ length: MEASURES_PER_LINE }).map((_, i) => lineIndex * MEASURES_PER_LINE + i).filter(m => m < numMeasures);

            return (
              <g key={`line-${lineIndex}`} className="staff-line-group">
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
              </g>
            );
          })}

            {/* Hover effect for measure selection */}
            {(hoverMeasure !== null || loopStartMeasure !== null || deleteStartMeasure !== null) &&
              [hoverMeasure, loopStartMeasure, deleteStartMeasure].filter(m => m !== null).map(m => {
                const measureIndex = m as number;
                const lineIndex = Math.floor(measureIndex / MEASURES_PER_LINE);
                const measureInLine = measureIndex % MEASURES_PER_LINE;
                const lineYOffset = lineIndex * (STAFF_HEIGHT + STAFF_VERTICAL_GAP);
                const x = layout.measureStartXs[lineIndex][measureInLine];
                return <rect key={`hover-${m}`} x={x} y={lineYOffset + STAFF_Y_OFFSET} width={layout.measureWidths[measureIndex]} height={STAFF_LINE_GAP * 4} fill="rgba(37, 99, 235, 0.2)" className="pointer-events-none" />
              })
            }

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

            {/* Render Rests */}
            {rests.map(rest => {
              const lineIndex = Math.floor(rest.measure / MEASURES_PER_LINE);
              const measureInLine = rest.measure % MEASURES_PER_LINE;
              const measureStart = layout.measureStartXs[lineIndex][measureInLine];
              const beatWidth = (layout.measureWidths[rest.measure] - MEASURE_PADDING_HORIZONTAL * 2) / beatsPerMeasure;
              const x = measureStart + MEASURE_PADDING_HORIZONTAL + rest.beat * beatWidth;
              return <Rest key={rest.id} note={rest} x={x} />;
            })}


            {textAnnotations.map(ann => (
                <DraggableText key={ann.id} annotation={ann} onUpdate={onUpdateTextAnnotation} onUpdateText={onUpdateAnnotationText} onClick={onAnnotationClick} isSelected={ann.id === selectedAnnotationId} />
            ))}
          
            {hoverPosition && !isPlaying && selectedTool === Tool.PEN && <circle cx={hoverPosition.x} cy={hoverPosition.y} r="5" fill="rgba(37, 99, 235, 0.5)" />}

            {/* Playback Cursor */}
            {isPlaying && playbackCursor && (
                <PlaybackArrowIcon x={playbackCursor.x} y={playbackCursor.y} />
            )}
            {isPlaying && playbackProgress > 0 && (
              <line
                x1={layout.totalWidth * playbackProgress}
                y1={0}
                x2={layout.totalWidth * playbackProgress}
                y2={totalHeight}
                stroke="rgba(255, 50, 50, 0.8)"
                strokeWidth="1.5"
                className="pointer-events-none"
              />
            )}
        </svg>
    </div>
  );
};

export default Staff;