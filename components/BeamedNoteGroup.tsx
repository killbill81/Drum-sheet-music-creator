import React from 'react';
import { Note as NoteType, NoteDuration } from '../types';
import { DRUM_PART_NOTE_HEAD } from '../constants';

export type NotePosition = { note: NoteType; x: number; y: number; };

interface BeamedNoteGroupProps {
  notePositions: NotePosition[];
  onNoteClick: (noteId: string) => void;
}


export const BeamedNoteGroup: React.FC<BeamedNoteGroupProps> = ({ notePositions, onNoteClick }) => {
  if (!notePositions || notePositions.length < 2) return null;

  const stemHeight = 35;
  const noteRadius = 6;
  const firstNote = notePositions[0].note;
  const stemDirection = firstNote.stemDirection === 'up' ? -1 : 1;

  const firstNotePos = notePositions[0];
  const lastNotePos = notePositions[notePositions.length - 1];

  const beamThickness = 4;

  const beamAnchorY = stemDirection === -1 // stems up
      ? Math.min(...notePositions.map(p => p.y)) - stemHeight
      : Math.max(...notePositions.map(p => p.y)) + stemHeight;

  const renderSecondaryBeams = () => {
    const sixteenthGroups: NotePosition[][] = [];
    let currentGroup: NotePosition[] = [];

    for (const pos of notePositions) {
        if (pos.note.duration === NoteDuration.SIXTEENTH) {
            currentGroup.push(pos);
        } else {
            if (currentGroup.length > 0) sixteenthGroups.push(currentGroup);
            currentGroup = [];
        }
    }
    if (currentGroup.length > 0) sixteenthGroups.push(currentGroup);

    return sixteenthGroups.map((group, index) => {
        if (group.length < 1) return null;
        
        const firstSixteenth = group[0];
        const lastSixteenth = group[group.length-1];

        const startX = firstSixteenth.x + (stemDirection === 1 ? noteRadius : -noteRadius);
        const endX = lastSixteenth.x + (stemDirection === 1 ? noteRadius : -noteRadius);
        
        const secondaryBeamY = beamAnchorY + stemDirection * (beamThickness + 2);

        return (
            <line
                key={`secondary-beam-${index}`}
                x1={startX}
                y1={secondaryBeamY}
                x2={endX}
                y2={secondaryBeamY}
                stroke="currentColor"
                strokeWidth={beamThickness}
            />
        );
    });
  };

  return (
    <g>
      {/* Stems */}
      {notePositions.map(({ note, x, y }) => (
        <line
          key={`${note.id}-stem`}
          x1={x + (stemDirection === 1 ? noteRadius : -noteRadius)}
          y1={y}
          x2={x + (stemDirection === 1 ? noteRadius : -noteRadius)}
          y2={beamAnchorY}
          stroke="currentColor"
          strokeWidth="1.5"
        />
      ))}

      {/* Main Beam */}
      <line
        x1={firstNotePos.x + (stemDirection === 1 ? noteRadius : -noteRadius)}
        y1={beamAnchorY}
        x2={lastNotePos.x + (stemDirection === 1 ? noteRadius : -noteRadius)}
        y2={beamAnchorY}
        stroke="currentColor"
        strokeWidth={beamThickness}
      />
      
      {/* Secondary Beams */}
      {renderSecondaryBeams()}

      {/* Note Heads */}
      {notePositions.map(({ note, x, y }) => {
        const noteHeadType = DRUM_PART_NOTE_HEAD[note.part];
        return (
          <g
            key={note.id}
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onNoteClick(note.id);
            }}
          >
            {noteHeadType === 'x' ? (
              <g>
                <line x1={x - noteRadius} y1={y - noteRadius} x2={x + noteRadius} y2={y + noteRadius} stroke="currentColor" strokeWidth="2" />
                <line x1={x - noteRadius} y1={y + noteRadius} x2={x + noteRadius} y2={y - noteRadius} stroke="currentColor" strokeWidth="2" />
              </g>
            ) : (
              <circle cx={x} cy={y} r={noteRadius} fill="currentColor" />
            )}
          </g>
        );
      })}
    </g>
  );
};