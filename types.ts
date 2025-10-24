export enum DrumPart {
  BASS_DRUM = 'BASS_DRUM',
  SNARE = 'SNARE',
  SIDESTICK = 'SIDESTICK',
  HIGH_TOM = 'HIGH_TOM',
  MID_TOM = 'MID_TOM',
  FLOOR_TOM = 'FLOOR_TOM',
  HI_HAT_CLOSED = 'HI_HAT_CLOSED',
  HI_HAT_OPEN = 'HI_HAT_OPEN',
  HI_HAT_PEDAL = 'HI_HAT_PEDAL',
  CRASH_CYMBAL = 'CRASH_CYMBAL',
  RIDE_CYMBAL = 'RIDE_CYMBAL',
}

export enum NoteDuration {
  WHOLE = 'whole',
  HALF = 'half',
  QUARTER = 'quarter',
  EIGHTH = 'eighth',
  SIXTEENTH = 'sixteenth',
  THIRTY_SECOND = 'thirty_second',
}

export enum Tool {
  PEN = 'pen',
  ERASER = 'eraser',
  LOOP = 'loop',
  COPY = 'copy',
  DELETE = 'delete',
}

export interface TextAnnotation {
  id: string;
  text: string;
  x: number;
  y: number;
}

export type NoteHeadType = 'x' | 'normal' | 'open_x';

export enum Articulation {
  NONE = 'none',
  FLAM = 'flam',
  BUZZ_ROLL = 'buzz_roll',
}

export interface Note {
  id: string;
  part: DrumPart;
  duration: NoteDuration;
  beat: number;
  measure: number;
  stemDirection: 'up' | 'down';
  voice: 1 | 2 | 3;
  articulation?: Articulation;
}

export interface TimeSignature {
  top: number;
  bottom: number;
}

export type LoopRegion = { startMeasure: number; endMeasure: number } | null;

export interface Partition {
  id: string;
  name: string;
  notes: Note[];
  timeSignature: TimeSignature;
  tempo: number;
  numMeasures: number;
  textAnnotations: TextAnnotation[];
}
