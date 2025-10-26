import { DrumPart, NoteDuration, NoteHeadType, Tool } from './types';

// Staff dimensions
export const STAFF_HEIGHT = 120;
export const STAFF_LINE_GAP = 12;
export const NUM_MEASURES = 16;
export const MEASURES_PER_LINE = 4;
export const STAFF_VERTICAL_GAP = 80; // Space between staff lines
export const MEASURE_WIDTH = 300;
export const MEASURE_PADDING_HORIZONTAL = 15;
export const SUBDIVISIONS_PER_BEAT = 4; // 16th note precision
export const STAFF_Y_OFFSET = 50;
export const STAFF_X_OFFSET = 20;
export const CLEF_WIDTH = 50;
export const TIME_SIGNATURE_WIDTH = 30;

// Y positions on the staff (from top line at STAFF_Y_OFFSET)
const L = STAFF_LINE_GAP;
export const DRUM_PART_Y_POSITIONS: Record<DrumPart, number> = {
  // French Notation from PDF
  [DrumPart.CRASH_CYMBAL]: STAFF_Y_OFFSET - 1.5 * L, // Space above ledger line
  [DrumPart.RIDE_CYMBAL]: STAFF_Y_OFFSET - L, // Ledger line above
  [DrumPart.HI_HAT_OPEN]: STAFF_Y_OFFSET - 0.5 * L, // Space above staff
  [DrumPart.HI_HAT_CLOSED]: STAFF_Y_OFFSET - 0.5 * L, // Space above staff
  [DrumPart.HIGH_TOM]: STAFF_Y_OFFSET + 0.5 * L, // Top space
  [DrumPart.MID_TOM]: STAFF_Y_OFFSET + L, // 2nd line
  [DrumPart.SNARE]: STAFF_Y_OFFSET + 1.5 * L, // 2nd space
  [DrumPart.SIDESTICK]: STAFF_Y_OFFSET + 1.5 * L, // 2nd space
  [DrumPart.FLOOR_TOM]: STAFF_Y_OFFSET + 2.5 * L, // 3rd space
  [DrumPart.BASS_DRUM]: STAFF_Y_OFFSET + 4.5 * L, // Space below staff
  [DrumPart.HI_HAT_PEDAL]: STAFF_Y_OFFSET + 4.5 * L, // Space below staff
};

// Voice assignment for stem direction
export const DRUM_PART_VOICE: Record<DrumPart, 1 | 2 | 3> = {
  [DrumPart.CRASH_CYMBAL]: 1, // Stems up
  [DrumPart.RIDE_CYMBAL]: 1, // Stems up
  [DrumPart.HI_HAT_OPEN]: 1, // Stems up
  [DrumPart.HI_HAT_CLOSED]: 1, // Stems up
  [DrumPart.SNARE]: 2, // Stems down
  [DrumPart.SIDESTICK]: 1, // Stems up (as per convention for 'x' head on snare line)
  [DrumPart.HIGH_TOM]: 2, // Stems down
  [DrumPart.MID_TOM]: 2, // Stems down
  [DrumPart.FLOOR_TOM]: 2, // Stems down
  [DrumPart.BASS_DRUM]: 3, // Stems down, separate voice
  [DrumPart.HI_HAT_PEDAL]: 2, // Stems down (foot)
};

// The Y position of the middle line of the staff, used to determine stem direction.
export const MIDDLE_LINE_Y = STAFF_Y_OFFSET + 2 * STAFF_LINE_GAP;

export const DRUM_PART_NOTE_HEAD: Record<DrumPart, NoteHeadType> = {
  [DrumPart.CRASH_CYMBAL]: 'x',
  [DrumPart.RIDE_CYMBAL]: 'x',
  [DrumPart.HI_HAT_OPEN]: 'open_x',
  [DrumPart.HI_HAT_CLOSED]: 'x',
  [DrumPart.HI_HAT_PEDAL]: 'x',
  [DrumPart.SIDESTICK]: 'x',
  [DrumPart.SNARE]: 'normal',
  [DrumPart.BASS_DRUM]: 'normal',
  [DrumPart.HIGH_TOM]: 'normal',
  [DrumPart.MID_TOM]: 'normal',
  [DrumPart.FLOOR_TOM]: 'normal',
};

export const NOTE_TYPE_TO_FRACTIONAL_VALUE: Record<NoteDuration, number> = {
  [NoteDuration.WHOLE]: 1,
  [NoteDuration.HALF]: 1/2,
  [NoteDuration.QUARTER]: 1/4,
  [NoteDuration.EIGHTH]: 1/8,
  [NoteDuration.SIXTEENTH]: 1/16,
  [NoteDuration.THIRTY_SECOND]: 1/32,
  [NoteDuration.EIGHTH_TRIPLET]: 1/12,
};

export const DURATION_TO_INTEGER_VALUE: Record<NoteDuration, number> = {
  [NoteDuration.WHOLE]: 96,
  [NoteDuration.HALF]: 48,
  [NoteDuration.QUARTER]: 24,
  [NoteDuration.EIGHTH]: 12,
  [NoteDuration.SIXTEENTH]: 6,
  [NoteDuration.THIRTY_SECOND]: 3,
  [NoteDuration.EIGHTH_TRIPLET]: 8, // 24 / 3
};

export const TOOLBAR_TOOLS = [
  { id: Tool.PEN, label: 'Pen' },
  { id: Tool.ERASER, label: 'Eraser' },
  { id: Tool.TEXT, label: 'Text' },
  { id: Tool.LOOP, label: 'Loop' },
  { id: Tool.COPY, label: 'Copy' },
  { id: Tool.DELETE, label: 'Delete' },
  { id: Tool.ADD_MEASURE, label: 'Add Measure' },
  { id: Tool.DELETE_MEASURE, label: 'Delete Measure' },
];

export const TOOLBAR_DURATIONS = [
  { id: NoteDuration.QUARTER, label: 'Quarter' },
  { id: NoteDuration.EIGHTH, label: 'Eighth' },
  { id: NoteDuration.SIXTEENTH, label: 'Sixteenth' },
  { id: NoteDuration.THIRTY_SECOND, label: 'Thirty-second' },
  { id: NoteDuration.EIGHTH_TRIPLET, label: 'Eighth Triplet' },
];

export const TOOLBAR_DRUM_PARTS = [
  { id: DrumPart.BASS_DRUM, label: 'Grosse caisse' },
  { id: DrumPart.SNARE, label: 'Caisse claire' },
  { id: DrumPart.SIDESTICK, label: 'Sidestick' },
  { id: DrumPart.HIGH_TOM, label: 'Tom alto' },
  { id: DrumPart.MID_TOM, label: 'Tom medium' },
  { id: DrumPart.FLOOR_TOM, label: 'Tom basse' },
  { id: DrumPart.HI_HAT_CLOSED, label: 'Charleston' },
  { id: DrumPart.HI_HAT_OPEN, label: 'Charleston ouvert' },
  { id: DrumPart.HI_HAT_PEDAL, label: 'Charleston au pied' },
  { id: DrumPart.CRASH_CYMBAL, label: 'Cymbale crash' },
  { id: DrumPart.RIDE_CYMBAL, label: 'Cymbale ride' },
];
