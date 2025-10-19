import React from 'react';
import { Note as NoteType, NoteDuration, Tool } from '../types';
import { DRUM_PART_NOTE_HEAD } from '../constants';

interface NoteProps {
  note: NoteType;
  x: number;
  y: number;
  onClick: (noteId: string) => void;
  selectedTool: Tool;
}

export const Note: React.FC<NoteProps> = ({ note, x, y, onClick, selectedTool }) => {
  const noteHeadType = DRUM_PART_NOTE_HEAD[note.part];
  const stemHeight = 35;
  const stemDirection = note.stemDirection === 'up' ? -1 : 1;
  const noteRadius = 6;
  
  const handleNoteClick = (e: React.MouseEvent) => {
    if (selectedTool === Tool.ERASER) {
      e.stopPropagation();
    }
    onClick(note.id);
  }

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

  const renderFlag = () => {
    if (note.duration === NoteDuration.QUARTER) return null;

    const flagX = x + (note.stemDirection === 'up' ? noteRadius : -noteRadius);
    const flagY = y + stemDirection * stemHeight;
    const flagPath = note.stemDirection === 'up' 
        ? `M ${flagX} ${flagY} Q ${flagX + 15} ${flagY + 5}, ${flagX} ${flagY + 15}`
        : `M ${flagX} ${flagY} Q ${flagX - 15} ${flagY - 5}, ${flagX} ${flagY - 15}`;
    
    const flagPath2 = note.stemDirection === 'up' 
        ? `M ${flagX} ${flagY + 6} Q ${flagX + 15} ${flagY + 11}, ${flagX} ${flagY + 21}`
        : `M ${flagX} ${flagY - 6} Q ${flagX - 15} ${flagY - 11}, ${flagX} ${flagY - 21}`;

    const flagPath3 = note.stemDirection === 'up' 
        ? `M ${flagX} ${flagY + 12} Q ${flagX + 15} ${flagY + 17}, ${flagX} ${flagY + 27}`
        : `M ${flagX} ${flagY - 12} Q ${flagX - 15} ${flagY - 17}, ${flagX} ${flagY - 27}`;

    return (
      <g>
        { (note.duration === NoteDuration.EIGHTH || note.duration === NoteDuration.SIXTEENTH || note.duration === NoteDuration.THIRTY_SECOND) &&
            <path d={flagPath} stroke="currentColor" strokeWidth="2" fill="none" />
        }
        { (note.duration === NoteDuration.SIXTEENTH || note.duration === NoteDuration.THIRTY_SECOND) &&
            <path d={flagPath2} stroke="currentColor" strokeWidth="2" fill="none" />
        }
        { note.duration === NoteDuration.THIRTY_SECOND &&
            <path d={flagPath3} stroke="currentColor" strokeWidth="2" fill="none" />
        }
      </g>
    );
  };

  return (
    <g className="cursor-pointer" onClick={handleNoteClick}>
      {renderNoteHead()}
      <line
        x1={x + (note.stemDirection === 'up' ? noteRadius : -noteRadius)}
        y1={y}
        x2={x + (note.stemDirection === 'up' ? noteRadius : -noteRadius)}
        y2={y + stemDirection * stemHeight}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {renderFlag()}
    </g>
  );
};