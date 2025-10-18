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

// Y positions on the staff (0 is top line)
const L = STAFF_LINE_GAP;
export const DRUM_PART_Y_POSITIONS: Record<DrumPart, number> = {
  [DrumPart.CRASH_CYMBAL]: STAFF_Y_OFFSET - L,
  [DrumPart.HI_HAT_CLOSED]: STAFF_Y_OFFSET - 0.5 * L,
  [DrumPart.RIDE_CYMBAL]: STAFF_Y_OFFSET,
  [DrumPart.HIGH_TOM]: STAFF_Y_OFFSET + 0.5 * L,
  [DrumPart.MID_TOM]: STAFF_Y_OFFSET + 1.5 * L,
  [DrumPart.SNARE]: STAFF_Y_OFFSET + 2 * L,
  [DrumPart.FLOOR_TOM]: STAFF_Y_OFFSET + 3 * L,
  [DrumPart.BASS_DRUM]: STAFF_Y_OFFSET + 4 * L,
};

// Voice assignment for stem direction
export const DRUM_PART_VOICE: Record<DrumPart, 1 | 2> = {
  [DrumPart.CRASH_CYMBAL]: 1, // Stems up
  [DrumPart.HI_HAT_CLOSED]: 1, // Stems up
  [DrumPart.RIDE_CYMBAL]: 1, // Stems up
  [DrumPart.SNARE]: 2, // Stems down
  [DrumPart.HIGH_TOM]: 2, // Stems down
  [DrumPart.MID_TOM]: 2, // Stems down
  [DrumPart.FLOOR_TOM]: 2, // Stems down
  [DrumPart.BASS_DRUM]: 2, // Stems down
};

// Stem direction threshold
export const MIDDLE_LINE_Y = STAFF_Y_OFFSET + 2 * L;

export const DRUM_PART_NOTE_HEAD: Record<DrumPart, NoteHeadType> = {
  [DrumPart.CRASH_CYMBAL]: 'x',
  [DrumPart.HI_HAT_CLOSED]: 'x',
  [DrumPart.RIDE_CYMBAL]: 'x',
  [DrumPart.SNARE]: 'normal',
  [DrumPart.BASS_DRUM]: 'normal',
  [DrumPart.HIGH_TOM]: 'normal',
  [DrumPart.MID_TOM]: 'normal',
  [DrumPart.FLOOR_TOM]: 'normal',
};

// Represents note durations as a fraction of a whole note.
export const NOTE_TYPE_TO_FRACTIONAL_VALUE: Record<NoteDuration, number> = {
  [NoteDuration.WHOLE]: 1,
  [NoteDuration.HALF]: 1/2,
  [NoteDuration.QUARTER]: 1/4,
  [NoteDuration.EIGHTH]: 1/8,
  [NoteDuration.SIXTEENTH]: 1/16,
};


export const TOOLBAR_TOOLS = [
  { id: Tool.PEN, label: 'Pen' },
  { id: Tool.ERASER, label: 'Eraser' },
  { id: Tool.LOOP, label: 'Loop' },
];

export const TOOLBAR_DURATIONS = [
  { id: NoteDuration.QUARTER, label: 'Quarter' },
  { id: NoteDuration.EIGHTH, label: 'Eighth' },
  { id: NoteDuration.SIXTEENTH, label: 'Sixteenth' },
];

export const TOOLBAR_DRUM_PARTS = [
  { id: DrumPart.BASS_DRUM, label: 'Bass' },
  { id: DrumPart.SNARE, label: 'Snare' },
  { id: DrumPart.HI_HAT_CLOSED, label: 'Hi-Hat' },
  { id: DrumPart.CRASH_CYMBAL, label: 'Crash' },
  { id: DrumPart.RIDE_CYMBAL, label: 'Ride' },
  { id: DrumPart.HIGH_TOM, label: 'High Tom' },
  { id: DrumPart.MID_TOM, label: 'Mid Tom' },
  { id: DrumPart.FLOOR_TOM, label: 'Floor Tom' },
];