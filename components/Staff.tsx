import React, { useState, useMemo } from 'react';
import { Note as NoteType, DrumPart, NoteDuration, TimeSignature, PlaybackCursor } from '../types';
import {
  STAFF_HEIGHT, STAFF_LINE_GAP, MEASURE_WIDTH,
  NUM_MEASURES, STAFF_Y_OFFSET, STAFF_X_OFFSET, CLEF_WIDTH,
  SUBDIVISIONS_PER_BEAT, DRUM_PART_Y_POSITIONS,
  MEASURE_PADDING_HORIZONTAL, TIME_SIGNATURE_WIDTH, MEASURES_PER_LINE, STAFF_VERTICAL_GAP
} from '../constants';
import { Note } from './Note';
import { PercussionClef } from './Icons';
import { BeamedNoteGroup, NotePosition } from './BeamedNoteGroup';

interface StaffProps {
  notes: NoteType[];
  onAddNote: (measure: number, beat: number, part: DrumPart) => void;
  onRemoveNote: (noteId: string) => void;
  selectedDrumPart: DrumPart;
  selectedDuration: NoteDuration;
  isPlaying: boolean;
  playbackCursor: PlaybackCursor;
  timeSignature: TimeSignature;
}

const groupNotesForBeaming = (notes: NoteType[]): NoteType[][] => {
  if (!notes || notes.length === 0) return [];
  const sortedNotes = [...notes].sort((a, b) => a.measure * 100 + a.beat - (b.measure * 100 + b.beat));
  const groups: NoteType[][] = [];
  let currentGroup: NoteType[] = [];

  for (const note of sortedNotes) {
    if (note.duration !== NoteDuration.EIGHTH && note.duration !== NoteDuration.SIXTEENTH) {
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

export const Staff: React.FC<StaffProps> = ({ notes, onAddNote, onRemoveNote, selectedDrumPart, selectedDuration, isPlaying, playbackCursor, timeSignature }) => {
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number; part: DrumPart } | null>(null);
  
  const beatsPerMeasure = timeSignature.top;
  const beatWidth = (MEASURE_WIDTH - MEASURE_PADDING_HORIZONTAL * 2) / beatsPerMeasure;
  const numLines = Math.ceil(NUM_MEASURES / MEASURES_PER_LINE);
  
  const totalWidth = useMemo(() => STAFF_X_OFFSET + (MEASURE_WIDTH * MEASURES_PER_LINE) + STAFF_X_OFFSET, []);
  const totalHeight = useMemo(() => numLines * STAFF_HEIGHT + (numLines - 1) * STAFF_VERTICAL_GAP + 20, [numLines]);

  const noteGroups = useMemo(() => {
    const voice1Notes = notes.filter(n => n.voice === 1);
    const voice2Notes = notes.filter(n => n.voice === 2);
    return [...groupNotesForBeaming(voice1Notes), ...groupNotesForBeaming(voice2Notes)];
  }, [notes]);
  
  const getNotePositionFromMouseEvent = (e: React.MouseEvent<SVGSVGElement>): {measure: number, beat: number, part: DrumPart, x: number, y: number} | null => {
      const svg = e.currentTarget;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const { x, y } = pt.matrixTransform(svg.getScreenCTM()?.inverse());

      const lineIndex = Math.floor(y / (STAFF_HEIGHT + STAFF_VERTICAL_GAP));
      if (lineIndex < 0 || lineIndex >= numLines) return null;
      
      const measuresStartX = STAFF_X_OFFSET + CLEF_WIDTH + TIME_SIGNATURE_WIDTH;
      const musicAreaX = x - measuresStartX;
      if (musicAreaX < 0) return null;

      const measureInLine = Math.floor(musicAreaX / MEASURE_WIDTH);
      if (measureInLine < 0 || measureInLine >= MEASURES_PER_LINE) return null;
      
      const measureIndex = lineIndex * MEASURES_PER_LINE + measureInLine;
      if (measureIndex >= NUM_MEASURES) return null;

      const xInMeasure = musicAreaX % MEASURE_WIDTH;
      const paddedXInMeasure = xInMeasure - MEASURE_PADDING_HORIZONTAL;
      const noteAreaWidth = MEASURE_WIDTH - 2 * MEASURE_PADDING_HORIZONTAL;
      if (paddedXInMeasure < 0 || paddedXInMeasure > noteAreaWidth) return null;

      const beatInMeasure = (paddedXInMeasure / noteAreaWidth) * beatsPerMeasure;
      const beatUnit = timeSignature.bottom === 8 ? 2 : 1;
      const subdivision = selectedDuration === NoteDuration.SIXTEENTH ? SUBDIVISIONS_PER_BEAT * beatUnit : (selectedDuration === NoteDuration.EIGHTH ? 2 * beatUnit : 1 * beatUnit);
      const quantizedBeat = Math.max(0, Math.round(beatInMeasure * subdivision) / subdivision);
      
      const lineYOffset = lineIndex * (STAFF_HEIGHT + STAFF_VERTICAL_GAP);
      const beatX = measuresStartX + measureInLine * MEASURE_WIDTH + MEASURE_PADDING_HORIZONTAL + quantizedBeat * beatWidth;
      const partY = lineYOffset + DRUM_PART_Y_POSITIONS[selectedDrumPart];

      return { measure: measureIndex, beat: quantizedBeat, part: selectedDrumPart, x: beatX, y: partY };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPlaying) return;
    const pos = getNotePositionFromMouseEvent(e);
    setHoverPosition(pos ? { x: pos.x, y: pos.y, part: pos.part } : null);
  };

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPlaying) return;
    const pos = getNotePositionFromMouseEvent(e);
    if(pos) onAddNote(pos.measure, pos.beat, pos.part);
  };
  
  return (
    <div className="w-full overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4">
        <svg
            width={totalWidth}
            height={totalHeight}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverPosition(null)}
            onClick={handleClick}
            className="select-none text-black dark:text-white"
        >
          {Array.from({ length: numLines }).map((_, lineIndex) => {
            const lineYOffset = lineIndex * (STAFF_HEIGHT + STAFF_VERTICAL_GAP);
            const measuresOnThisLine = Array.from({ length: MEASURES_PER_LINE }).map((_, i) => lineIndex * MEASURES_PER_LINE + i).filter(m => m < NUM_MEASURES);
            const measuresStartX = STAFF_X_OFFSET + CLEF_WIDTH + TIME_SIGNATURE_WIDTH;

            return (
              <g key={`line-${lineIndex}`}>
                {/* Staff lines */}
                {Array.from({ length: 5 }).map((_, i) => (
                    <line
                        key={i} x1={STAFF_X_OFFSET} y1={lineYOffset + STAFF_Y_OFFSET + i * STAFF_LINE_GAP}
                        x2={measuresStartX + measuresOnThisLine.length * MEASURE_WIDTH} y2={lineYOffset + STAFF_Y_OFFSET + i * STAFF_LINE_GAP}
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
                {measuresOnThisLine.map((_, i) => (
                    <line
                        key={i}
                        x1={measuresStartX + i * MEASURE_WIDTH} y1={lineYOffset + STAFF_Y_OFFSET}
                        x2={measuresStartX + i * MEASURE_WIDTH} y2={lineYOffset + STAFF_Y_OFFSET + 4 * STAFF_LINE_GAP}
                        stroke="currentColor" strokeWidth={i === 0 ? '2' : '1'}
                    />
                ))}
                <line
                  x1={measuresStartX + measuresOnThisLine.length * MEASURE_WIDTH} y1={lineYOffset + STAFF_Y_OFFSET}
                  x2={measuresStartX + measuresOnThisLine.length * MEASURE_WIDTH} y2={lineYOffset + STAFF_Y_OFFSET + 4 * STAFF_LINE_GAP}
                  stroke="currentColor" strokeWidth="2"
                />
              </g>
            );
          })}

            {/* Render Notes */}
            {noteGroups.map((group, index) => {
              const lineIndex = Math.floor(group[0].measure / MEASURES_PER_LINE);
              const lineYOffset = lineIndex * (STAFF_HEIGHT + STAFF_VERTICAL_GAP);
              const measuresStartX = STAFF_X_OFFSET + CLEF_WIDTH + TIME_SIGNATURE_WIDTH;
              
              const calculateX = (note: NoteType) => measuresStartX + (note.measure % MEASURES_PER_LINE) * MEASURE_WIDTH + MEASURE_PADDING_HORIZONTAL + note.beat * beatWidth;
              const calculateY = (note: NoteType) => lineYOffset + DRUM_PART_Y_POSITIONS[note.part];

              if (group.length > 1) {
                const notePositions: NotePosition[] = group.map(note => ({ note, x: calculateX(note), y: calculateY(note) }));
                return <BeamedNoteGroup key={`group-${index}`} notePositions={notePositions} onNoteClick={onRemoveNote} />;
              }
              if (group.length === 1) {
                const note = group[0];
                return <Note key={note.id} note={note} x={calculateX(note)} y={calculateY(note)} onClick={onRemoveNote} />;
              }
              return null;
            })}
          
            {hoverPosition && !isPlaying && <circle cx={hoverPosition.x} cy={hoverPosition.y} r="5" fill="rgba(37, 99, 235, 0.5)" />}

            {/* Playback Cursor */}
            {isPlaying && playbackCursor && (
                <line
                    x1={playbackCursor.x} y1={playbackCursor.y1}
                    x2={playbackCursor.x} y2={playbackCursor.y2}
                    stroke="rgba(239, 68, 68, 0.8)" strokeWidth="2" className="pointer-events-none"
                />
            )}
        </svg>
    </div>
  );
};
