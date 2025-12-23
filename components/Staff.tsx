import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Note as NoteType, DrumPart, NoteDuration, TimeSignature, PlaybackCursor, Tool, LoopRegion, TextAnnotation, Articulation } from '../types';
import {
  STAFF_HEIGHT, STAFF_LINE_GAP,
  NUM_MEASURES, STAFF_Y_OFFSET, STAFF_X_OFFSET, CLEF_WIDTH,
  SUBDIVISIONS_PER_BEAT, DRUM_PART_Y_POSITIONS,
  MEASURE_PADDING_HORIZONTAL, TIME_SIGNATURE_WIDTH, MEASURES_PER_LINE, STAFF_VERTICAL_GAP,
  VEXFLOW_DRUM_MAPPING, VEXFLOW_CONFIG
} from '../constants';
import { PercussionClef, PlaybackArrowIcon, TrashIcon, AddLineIcon } from './Icons';
import { DraggableText } from './DraggableText';
import { Renderer, Stave, StaveNote, Beam, Voice, Formatter, Articulation as VexArticulation, Accidental } from 'vexflow';

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
  currentBeat: number | null;
  tempo: number;
  timeSignature: TimeSignature;
  loopRegion: LoopRegion;
  loopStartMeasure: number | null;
  deleteStartMeasure: number | null;
  selectedAnnotationId: string | null;
}

const DURATION_MAP: Record<NoteDuration, string> = {
  [NoteDuration.WHOLE]: 'w',
  [NoteDuration.HALF]: 'h',
  [NoteDuration.QUARTER]: 'q',
  [NoteDuration.EIGHTH]: '8',
  [NoteDuration.SIXTEENTH]: '16',
  [NoteDuration.THIRTY_SECOND]: '32',
  [NoteDuration.SIXTY_FOURTH]: '64',
  [NoteDuration.EIGHTH_TRIPLET]: '8', // Needs special handling for triplets later
};

const Staff: React.FC<StaffProps> = ({
  notes, numMeasures, textAnnotations, onStaffClick, onNoteClick, onAnnotationClick, onMeasureClick, onUpdateTextAnnotation, onUpdateAnnotationText, onInsertLine, onDeleteLine, onAddLine,
  selectedTool, selectedDrumPart, selectedDuration, isPlaying, currentBeat, tempo, timeSignature, loopRegion, loopStartMeasure, deleteStartMeasure, selectedAnnotationId
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number; part: DrumPart } | null>(null);
  const [hoverMeasure, setHoverMeasure] = useState<number | null>(null);

  const beatsPerMeasure = timeSignature.top;
  const numLines = Math.ceil(numMeasures / MEASURES_PER_LINE);

  const layout = useMemo(() => {
    const measureWidths = Array.from({ length: numMeasures }).map((_, mIndex) => {
      const notesInMeasure = notes.filter(n => n.measure === mIndex);
      const isFirstInLine = mIndex % MEASURES_PER_LINE === 0;
      let baseWidth = 220;
      if (isFirstInLine) baseWidth += CLEF_WIDTH + TIME_SIGNATURE_WIDTH;

      const durations = notesInMeasure.map(n => n.duration);
      if (durations.includes(NoteDuration.THIRTY_SECOND)) return baseWidth + 150;
      if (durations.includes(NoteDuration.SIXTEENTH)) return baseWidth + 80;
      if (notesInMeasure.length > 8) return baseWidth + 40;
      return baseWidth;
    });

    const measureStartXs: number[][] = [];
    const lineTotalWidths: number[] = [];

    for (let i = 0; i < numLines; i++) {
      measureStartXs[i] = [];
      let currentX = STAFF_X_OFFSET;
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
  }, [notes, numMeasures, numLines]);

  const totalHeight = useMemo(() => numLines * (STAFF_HEIGHT + STAFF_VERTICAL_GAP) + 20, [numLines]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous rendering
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    renderer.resize(layout.totalWidth, totalHeight);
    const context = renderer.getContext();
    context.setFont('Arial', 10);

    for (let lineIndex = 0; lineIndex < numLines; lineIndex++) {
      const lineYOffset = lineIndex * (STAFF_HEIGHT + STAFF_VERTICAL_GAP) + STAFF_Y_OFFSET;
      const measuresOnThisLine = Array.from({ length: MEASURES_PER_LINE })
        .map((_, i) => lineIndex * MEASURES_PER_LINE + i)
        .filter(m => m < numMeasures);

      measuresOnThisLine.forEach((mIndex, i) => {
        const x = layout.measureStartXs[lineIndex][i];
        const width = layout.measureWidths[mIndex];
        const stave = new Stave(x, lineYOffset, width);

        if (i === 0) {
          stave.addClef('percussion');
          stave.addTimeSignature(`${timeSignature.top}/${timeSignature.bottom}`);
        }

        stave.setContext(context).draw();

        // Render notes for this measure
        const notesInMeasure = notes.filter(n => n.measure === mIndex).sort((a, b) => a.beat - b.beat);
        if (notesInMeasure.length > 0) {
          // VexFlow needs voices. To simplify, we group by beat and voice.
          // For now, let's just group everything in one voice and use chords if multiple notes at same beat.
          const beatsGroups = new Map<number, NoteType[]>();
          notesInMeasure.forEach(note => {
            const beat = note.beat;
            if (!beatsGroups.has(beat)) beatsGroups.set(beat, []);
            beatsGroups.get(beat)!.push(note);
          });

          const staveNotes: StaveNote[] = [];
          const sortedBeats = Array.from(beatsGroups.keys()).sort((a, b) => a - b);

          sortedBeats.forEach(beat => {
            const beatNotes = beatsGroups.get(beat)!;
            const vfDuration = DURATION_MAP[beatNotes[0].duration] || 'q';

            const keys = beatNotes.map(n => VEXFLOW_DRUM_MAPPING[n.part]?.keys[0] || 'c/5');
            const noteheads = beatNotes.map(n => VEXFLOW_DRUM_MAPPING[n.part]?.notehead || 'normal');

            const staveNote = new StaveNote({
              keys: keys,
              duration: vfDuration,
              clef: 'percussion',
            });

            // Set noteheads
            noteheads.forEach((head, index) => {
              if (head !== 'normal') {
                // In VexFlow 5, use glyph or setNoteHead. 
                // Using a known-working way if setNoteHeadGlyph is missing.
                (staveNote as any).setGlyph(index, { code: head === 'x' ? 'v3f' : (head === 'open_x' ? 'v3e' : 'v0') });
              }
            });

            // Highlights
            if (isPlaying && currentBeat !== null) {
              const measureStartBeat = mIndex * beatsPerMeasure;
              const absoluteBeat = measureStartBeat + beat;
              // Highlighting logic: if the current beat is within the duration of this note
              const noteDuration = 4 / parseInt(vfDuration.replace('q', '4').replace('h', '2').replace('w', '1') || '4');
              if (currentBeat >= absoluteBeat && currentBeat < absoluteBeat + noteDuration) {
                staveNote.setStyle({ fillStyle: VEXFLOW_CONFIG.HIGHLIGHT_COLOR, strokeStyle: VEXFLOW_CONFIG.HIGHLIGHT_COLOR });
              }
            }

            // Articulations
            beatNotes.forEach((n, index) => {
              if (n.articulation === Articulation.ACCENT) {
                staveNote.addModifier(new VexArticulation('a>').setPosition(3), index); // 3 is ABOVE, VexFlow constant might vary
              }
              if (n.articulation === Articulation.FLAM) {
                // Flam is tricky in VexFlow, usually a grace note. Skip for now or use simplified indicator.
              }
            });

            staveNotes.push(staveNote);

            // Store note ID for interaction
            // VexFlow 5 allows attaching data or using custom attributes on SVG
          });

          if (staveNotes.length > 0) {
            const voice = new Voice({
              numBeats: timeSignature.top,
              beatValue: timeSignature.bottom,
            }).setMode(Voice.Mode.SOFT);

            voice.addTickables(staveNotes);

            // Beaming logic by beat - MUST BE DONE BEFORE voice.draw to hide flags
            const groups: StaveNote[][] = [];
            let currentBeamNotes: StaveNote[] = [];
            let lastBeatFloor = -1;

            staveNotes.forEach((sn, index) => {
              const beat = sortedBeats[index];
              const beatFloor = Math.floor(beat);
              const duration = sn.getDuration();
              const isBeameable = duration !== 'q' && duration !== 'h' && duration !== 'w';

              if (isBeameable && beatFloor === lastBeatFloor) {
                currentBeamNotes.push(sn);
              } else {
                if (currentBeamNotes.length > 1) {
                  groups.push(currentBeamNotes);
                }
                currentBeamNotes = isBeameable ? [sn] : [];
                lastBeatFloor = beatFloor;
              }
            });
            if (currentBeamNotes.length > 1) {
              groups.push(currentBeamNotes);
            }

            // Create beams
            const beams = groups.map(group => new Beam(group));

            // In VexFlow 5, we can link beams to notes to help with flag suppression
            // but usually Beam.draw(context) handles it if called correctly.

            // Match formatting width with noteAreaWidth from getPositionFromMouseEvent
            const isFirstInLine = i === 0;
            const noteAreaStart = isFirstInLine ? CLEF_WIDTH + TIME_SIGNATURE_WIDTH + MEASURE_PADDING_HORIZONTAL : MEASURE_PADDING_HORIZONTAL;
            const noteAreaWidth = width - noteAreaStart - MEASURE_PADDING_HORIZONTAL;

            new Formatter().joinVoices([voice]).format([voice], noteAreaWidth);

            // Draw stave, then voice (notes), then beams
            voice.draw(context, stave);
            beams.forEach(b => b.setContext(context).draw());
          }
        }
      });
    }

  }, [notes, layout, numLines, numMeasures, timeSignature, totalHeight, isPlaying, currentBeat, beatsPerMeasure]);

  const getPositionFromMouseEvent = (e: React.MouseEvent<HTMLDivElement | SVGSVGElement>) => {
    const container = containerRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lineIndex = Math.floor(y / (STAFF_HEIGHT + STAFF_VERTICAL_GAP));
    if (lineIndex < 0 || lineIndex >= numLines) return null;

    const lineMeasureStartXs = layout.measureStartXs[lineIndex];
    if (!lineMeasureStartXs) return null;

    let measureInLine = lineMeasureStartXs.findIndex((startX, i) => {
      const measureIndex = lineIndex * MEASURES_PER_LINE + i;
      const nextStartX = lineMeasureStartXs[i + 1] || (startX + layout.measureWidths[measureIndex]);
      return x >= startX && x < nextStartX;
    });

    if (measureInLine === -1) return null;

    const measureIndex = lineIndex * MEASURES_PER_LINE + measureInLine;
    if (measureIndex >= numMeasures) return null;

    const xInMeasure = x - lineMeasureStartXs[measureInLine];
    const isFirstInLine = measureInLine === 0;

    let noteAreaStart = MEASURE_PADDING_HORIZONTAL;
    if (isFirstInLine) {
      noteAreaStart += CLEF_WIDTH + TIME_SIGNATURE_WIDTH;
    }

    const currentMeasureWidth = layout.measureWidths[measureIndex];
    const paddedXInMeasure = xInMeasure - noteAreaStart;
    const noteAreaWidth = currentMeasureWidth - noteAreaStart - MEASURE_PADDING_HORIZONTAL;

    if (paddedXInMeasure < 0 || paddedXInMeasure > noteAreaWidth) return null;

    return { x, y, lineIndex, measureIndex, currentMeasureWidth, xInMeasure, paddedXInMeasure, noteAreaWidth };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
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

      const isFirstInLine = (pos.measureIndex % MEASURES_PER_LINE) === 0;
      const noteAreaStart = isFirstInLine ? CLEF_WIDTH + TIME_SIGNATURE_WIDTH + MEASURE_PADDING_HORIZONTAL : MEASURE_PADDING_HORIZONTAL;
      const beatX = layout.measureStartXs[lineIndex][pos.measureIndex % MEASURES_PER_LINE] + noteAreaStart + quantizedBeat * beatWidth;
      const partY = lineYOffset + DRUM_PART_Y_POSITIONS[selectedDrumPart];

      setHoverPosition({ x: beatX, y: partY, part: selectedDrumPart });
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPlaying) return;

    // Check if clicked a note (VexFlow SVG element)
    // For now we use our grid.
    const pos = getPositionFromMouseEvent(e);
    if (!pos) return;

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

      // Check for erasure (click near existing note)
      if (selectedTool === Tool.ERASER) {
        const notesInMeasure = notes.filter(n => n.measure === measureIndex);
        const clickedNote = notesInMeasure.find(n => Math.abs(n.beat - quantizedBeat) < 0.1);
        if (clickedNote) {
          onNoteClick(clickedNote.id);
          return;
        }
      }

      onStaffClick({ measureIndex, beat: quantizedBeat, x, y });
    }
  };

  return (
    <div
      className="w-full overflow-x-auto bg-white rounded-lg shadow-xl relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { setHoverPosition(null); setHoverMeasure(null); }}
      onClick={handleClick}
      style={{ background: VEXFLOW_CONFIG.BACKGROUND_COLOR }}
    >
      <div className="absolute bottom-4 right-4 no-print">
        <button onClick={() => onAddLine()} className="p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition">
          <AddLineIcon />
        </button>
      </div>

      {/* VexFlow Container */}
      <div ref={containerRef} className="select-none" style={{ minWidth: layout.totalWidth, minHeight: totalHeight }} />

      {/* Interaction Overlay (Annotations and Cursor) */}
      <svg
        className="absolute top-0 left-0 pointer-events-none select-none"
        width={layout.totalWidth}
        height={totalHeight}
        style={{ pointerEvents: 'none' }}
      >
        {/* Loop Region Highlight */}
        {loopRegion && Array.from({ length: numLines }).map((_, lineIndex) => {
          const lineYOffset = lineIndex * (STAFF_HEIGHT + STAFF_VERTICAL_GAP);
          const measuresOnThisLine = Array.from({ length: MEASURES_PER_LINE }).map((_, i) => lineIndex * MEASURES_PER_LINE + i).filter(m => m < numMeasures);
          return (
            <g key={`loop-line-${lineIndex}`}>
              {measuresOnThisLine.map((m, i) => {
                if (m >= loopRegion.startMeasure && m <= loopRegion.endMeasure) {
                  const x = layout.measureStartXs[lineIndex][i];
                  return <rect key={`loop-highlight-${m}`} x={x} y={lineYOffset + STAFF_Y_OFFSET - STAFF_LINE_GAP} width={layout.measureWidths[m]} height={STAFF_LINE_GAP * 6} fill="rgba(59, 130, 246, 0.1)" />
                }
                return null;
              })}
            </g>
          );
        })}

        {/* Hover effect for measure selection */}
        {(hoverMeasure !== null || loopStartMeasure !== null || deleteStartMeasure !== null) &&
          [hoverMeasure, loopStartMeasure, deleteStartMeasure].filter(m => m !== null).map((m, idx) => {
            const measureIndex = m as number;
            const lineIndex = Math.floor(measureIndex / MEASURES_PER_LINE);
            const measureInLine = measureIndex % MEASURES_PER_LINE;
            const lineYOffset = lineIndex * (STAFF_HEIGHT + STAFF_VERTICAL_GAP);
            const x = layout.measureStartXs[lineIndex][measureInLine];
            return <rect key={`hover-${idx}`} x={x} y={lineYOffset + STAFF_Y_OFFSET} width={layout.measureWidths[measureIndex]} height={STAFF_LINE_GAP * 4} fill="rgba(37, 99, 235, 0.1)" />
          })
        }

        {textAnnotations.map(ann => (
          <DraggableText key={ann.id} annotation={ann} onUpdate={onUpdateTextAnnotation} onUpdateText={onUpdateAnnotationText} onClick={onAnnotationClick} isSelected={ann.id === selectedAnnotationId} />
        ))}

        {hoverPosition && !isPlaying && selectedTool === Tool.PEN && <circle cx={hoverPosition.x} cy={hoverPosition.y} r="5" fill="rgba(37, 99, 235, 0.3)" />}

        {/* Playback Cursor */}
        {isPlaying && currentBeat !== null && (() => {
          const measureIndex = Math.floor(currentBeat / beatsPerMeasure);
          if (measureIndex >= numMeasures) return null;

          const beatInMeasure = currentBeat % beatsPerMeasure;
          const lineIndex = Math.floor(measureIndex / MEASURES_PER_LINE);
          const measureInLine = measureIndex % MEASURES_PER_LINE;

          if (lineIndex >= layout.measureStartXs.length || measureInLine >= layout.measureStartXs[lineIndex].length) return null;

          const measureStart = layout.measureStartXs[lineIndex][measureInLine];

          const isFirstInLine = measureInLine === 0;
          const noteAreaStart = isFirstInLine ? CLEF_WIDTH + TIME_SIGNATURE_WIDTH + MEASURE_PADDING_HORIZONTAL : MEASURE_PADDING_HORIZONTAL;
          const noteAreaWidth = layout.measureWidths[measureIndex] - noteAreaStart - MEASURE_PADDING_HORIZONTAL;

          const beatWidth = noteAreaWidth / beatsPerMeasure;
          const x = measureStart + noteAreaStart + beatInMeasure * beatWidth;
          const lineYOffset = lineIndex * (STAFF_HEIGHT + STAFF_VERTICAL_GAP);
          const staffStartY = lineYOffset + STAFF_Y_OFFSET;

          return (
            <line
              x1={x}
              y1={staffStartY - STAFF_LINE_GAP}
              x2={x}
              y2={staffStartY + 5 * STAFF_LINE_GAP}
              stroke={VEXFLOW_CONFIG.HIGHLIGHT_COLOR}
              strokeWidth="2"
              strokeOpacity="0.8"
            />
          );
        })()}
      </svg>
    </div>
  );
};

export default Staff;