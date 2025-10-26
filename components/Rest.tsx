import React from 'react';
import { Note as NoteType, NoteDuration } from '../types';
import { WholeRestIcon, HalfRestIcon, QuarterRestIcon, EighthRestIcon, SixteenthRestIcon, ThirtySecondRestIcon, SixtyFourthRestIcon } from './Icons';
import { STAFF_Y_OFFSET, STAFF_LINE_GAP } from '../constants';

interface RestProps {
  note: NoteType;
  x: number;
}

const RestIconComponents: Partial<Record<NoteDuration, React.FC<any>>> = {
  [NoteDuration.WHOLE]: WholeRestIcon,
  [NoteDuration.HALF]: HalfRestIcon,
  [NoteDuration.QUARTER]: QuarterRestIcon,
  [NoteDuration.EIGHTH]: EighthRestIcon,
  [NoteDuration.SIXTEENTH]: SixteenthRestIcon,
  [NoteDuration.THIRTY_SECOND]: ThirtySecondRestIcon,
  [NoteDuration.SIXTY_FOURTH]: SixtyFourthRestIcon,
};

export const Rest: React.FC<RestProps> = ({ note, x }) => {
  const RestIcon = RestIconComponents[note.duration];
  if (!RestIcon) return null;

  if (note.duration === NoteDuration.WHOLE) {
    // Hangs from the 4th line
    return <g transform={`translate(${x}, 0)`}><RestIcon y={STAFF_Y_OFFSET + 3 * STAFF_LINE_GAP} /></g>;
  } else if (note.duration === NoteDuration.HALF) {
    // Sits on the 3rd line
    return <g transform={`translate(${x}, 0)`}><RestIcon y={STAFF_Y_OFFSET + 2 * STAFF_LINE_GAP - 6} /></g>;
  }

  // For quarter and smaller rests, center them vertically
  const yPos = STAFF_Y_OFFSET + 1.5 * STAFF_LINE_GAP;

  return (
    <g transform={`translate(${x}, ${yPos})`}>
      <RestIcon />
    </g>
  );
};
