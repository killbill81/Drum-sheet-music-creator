import React from 'react';
import { Note as NoteType, NoteDuration, Tool, DrumPart, Articulation } from '../types';
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

        if ((posA.note.duration === NoteDuration.SIXTEENTH || posA.note.duration === NoteDuration.THIRTY_SECOND) &&
            (posB.note.duration === NoteDuration.SIXTEENTH || posB.note.duration === NoteDuration.THIRTY_SECOND)) {
            beams.push(<line key={`beam2-${i}`} x1={startX} y1={secondBeamY} x2={endX} y2={secondBeamY} stroke="currentColor" strokeWidth={beamThickness} />);
        }

        if (posA.note.duration === NoteDuration.THIRTY_SECOND && posB.note.duration === NoteDuration.THIRTY_SECOND) {
            beams.push(<line key={`beam3-${i}`} x1={startX} y1={thirdBeamY} x2={endX} y2={thirdBeamY} stroke="currentColor" strokeWidth={beamThickness} />);
        }
    }
    return <g>{beams}</g>;
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
      
      {renderSecondaryBeams()}

      {/* Note Heads and Articulations */}
      {notePositions.map(({ note, x, y }) => {
        const noteHeadType = DRUM_PART_NOTE_HEAD[note.part] || 'normal';
        
        const renderNoteHead = () => {
          switch (noteHeadType) {
            case 'x':
              return <>
                  <line x1={x - noteRadius} y1={y - noteRadius} x2={x + noteRadius} y2={y + noteRadius} stroke="currentColor" strokeWidth="2" />
                  <line x1={x - noteRadius} y1={y + noteRadius} x2={x + noteRadius} y2={y - noteRadius} stroke="currentColor" strokeWidth="2" />
              </>;
            case 'open_x':
              return <>
                  <line x1={x - noteRadius} y1={y - noteRadius} x2={x + noteRadius} y2={y + noteRadius} stroke="currentColor" strokeWidth="1.5" />
                  <line x1={x - noteRadius} y1={y + noteRadius} x2={x + noteRadius} y2={y - noteRadius} stroke="currentColor" strokeWidth="1.5" />
                  <circle cx={x} cy={y} r={noteRadius + 2} fill="none" stroke="currentColor" strokeWidth="1" />
              </>;
            default:
              return <circle cx={x} cy={y} r={noteRadius} fill="currentColor" />;
          }
        };

        const renderArticulation = () => {
            if (note.articulation === Articulation.FLAM) {
                const graceNoteRadius = 4;
                const graceNoteX = x - 12;
                const graceNoteY = y + 4;
                return (
                  <g>
                    <circle cx={graceNoteX} cy={graceNoteY} r={graceNoteRadius} fill="currentColor" />
                    <line x1={graceNoteX + graceNoteRadius} y1={graceNoteY} x2={graceNoteX + graceNoteRadius} y2={graceNoteY - 20} stroke="currentColor" strokeWidth="1.5" />
                    <line x1={graceNoteX - 2} y1={graceNoteY - 10} x2={graceNoteX + graceNoteRadius + 4} y2={graceNoteY - 15} stroke="currentColor" strokeWidth="1.5" />
                  </g>
                );
            }
            if (note.articulation === Articulation.BUZZ_ROLL) {
                const stemX = x + (groupStemDirection === 'up' ? noteRadius : -noteRadius);
                const noteStemEndY = beamAnchorY;
                const stemMidY = (y + noteStemEndY) / 2;
                return (
                    <g stroke="currentColor" strokeWidth="1.5">
                        <line x1={stemX - 4} y1={stemMidY - 3} x2={stemX + 4} y2={stemMidY + 3} />
                        <line x1={stemX - 4} y1={stemMidY + 3} x2={stemX + 4} y2={stemMidY - 3} />
                    </g>
                );
            }
            return null;
        }

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
            {renderArticulation()}
          </g>
        );
      })}
    </g>
  );
};