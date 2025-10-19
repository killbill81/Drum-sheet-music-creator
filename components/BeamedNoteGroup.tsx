import React from 'react';
import { Note as NoteType, NoteDuration, Tool } from '../types';
import { DRUM_PART_NOTE_HEAD, MIDDLE_LINE_Y } from '../constants';

export type NotePosition = { note: NoteType; x: number; y: number; };

interface BeamedNoteGroupProps {
  notePositions: NotePosition[];
  onNoteClick: (noteId: string) => void;
  selectedTool: Tool;
}

export const BeamedNoteGroup: React.FC<BeamedNoteGroupProps> = ({ notePositions, onNoteClick, selectedTool }) => {
  if (!notePositions || notePositions.length < 2) return null;

  const stemHeight = 35;
  const noteRadius = 6;

  const furthestNotePos = notePositions.reduce((furthest, current) => {
    const furthestDist = Math.abs(furthest.y - MIDDLE_LINE_Y);
    const currentDist = Math.abs(current.y - MIDDLE_LINE_Y);
    return currentDist > furthestDist ? current : furthest;
  });
  const groupStemDirection = furthestNotePos.note.stemDirection;
  const stemDirection = groupStemDirection === 'up' ? -1 : 1;

  const firstNotePos = notePositions[0];
  const lastNotePos = notePositions[notePositions.length - 1];

  const beamThickness = 4;

  const beamAnchorY = stemDirection === -1
      ? Math.min(...notePositions.map(p => p.y)) - stemHeight
      : Math.max(...notePositions.map(p => p.y)) + stemHeight;

  const renderSecondaryBeams = () => {
    const beams: React.ReactNode[] = [];
    const secondBeamY = beamAnchorY + stemDirection * (beamThickness + 2);
    const thirdBeamY = beamAnchorY + stemDirection * (beamThickness * 2 + 4);

    for (let i = 0; i < notePositions.length - 1; i++) {
        const posA = notePositions[i];
        const posB = notePositions[i+1];

        const startX = posA.x + (groupStemDirection === 'up' ? noteRadius : -noteRadius);
        const endX = posB.x + (groupStemDirection === 'up' ? noteRadius : -noteRadius);

        // Draw second beam if both notes are 16th or 32nd
        if ((posA.note.duration === NoteDuration.SIXTEENTH || posA.note.duration === NoteDuration.THIRTY_SECOND) &&
            (posB.note.duration === NoteDuration.SIXTEENTH || posB.note.duration === NoteDuration.THIRTY_SECOND)) {
            beams.push(<line key={`beam2-${i}`} x1={startX} y1={secondBeamY} x2={endX} y2={secondBeamY} stroke="currentColor" strokeWidth={beamThickness} />);
        }

        // Draw third beam if both notes are 32nd
        if (posA.note.duration === NoteDuration.THIRTY_SECOND && posB.note.duration === NoteDuration.THIRTY_SECOND) {
            beams.push(<line key={`beam3-${i}`} x1={startX} y1={thirdBeamY} x2={endX} y2={thirdBeamY} stroke="currentColor" strokeWidth={beamThickness} />);
        }
    }
    return beams;
  };

  return (
    <g>
      {/* Stems */}
      {notePositions.map(({ note, x, y }) => (
        <line
          key={`${note.id}-stem`}
          x1={x + (groupStemDirection === 'up' ? noteRadius : -noteRadius)}
          y1={y}
          x2={x + (groupStemDirection === 'up' ? noteRadius : -noteRadius)}
          y2={beamAnchorY}
          stroke="currentColor"
          strokeWidth="1.5"
        />
      ))}

      {/* Main Beam */}
      <line
        x1={firstNotePos.x + (groupStemDirection === 'up' ? noteRadius : -noteRadius)}
        y1={beamAnchorY}
        x2={lastNotePos.x + (groupStemDirection === 'up' ? noteRadius : -noteRadius)}
        y2={beamAnchorY}
        stroke="currentColor"
        strokeWidth={beamThickness}
      />
      
      {/* Secondary and Tertiary Beams */}
      {renderSecondaryBeams()}

      {/* Note Heads */}
      {notePositions.map(({ note, x, y }) => {
        const noteHeadType = DRUM_PART_NOTE_HEAD[note.part];
        const renderNoteHead = () => {
          switch (noteHeadType) {
            case 'x':
              return (
                <g>
                  <line x1={x - noteRadius} y1={y - noteRadius} x2={x + noteRadius} y2={y + noteRadius} stroke="currentColor" strokeWidth="2" />
                  <line x1={x - noteRadius} y1={y + noteRadius} x2={x + noteRadius} y2={y - noteRadius} stroke="currentColor" strokeWidth="2" />
                </g>
              );
            case 'open_x':
              return (
                <g>
                  <line x1={x - noteRadius} y1={y - noteRadius} x2={x + noteRadius} y2={y + noteRadius} stroke="currentColor" strokeWidth="1.5" />
                  <line x1={x - noteRadius} y1={y + noteRadius} x2={x + noteRadius} y2={y - noteRadius} stroke="currentColor" strokeWidth="1.5" />
                  <circle cx={x} cy={y} r={noteRadius + 2} fill="none" stroke="currentColor" strokeWidth="1" />
                </g>
              );
            default:
              return <circle cx={x} cy={y} r={noteRadius} fill="currentColor" />;
          }
        };

        return (
          <g
            key={note.id}
            className="cursor-pointer"
            onClick={(e) => {
              if (selectedTool === Tool.ERASER) {
                e.stopPropagation();
              }
              onNoteClick(note.id);
            }}
          >
            {renderNoteHead()}
          </g>
        );
      })}
    </g>
  );
};