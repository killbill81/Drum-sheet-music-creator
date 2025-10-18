export enum DrumPart {
  BASS_DRUM = 'BASS_DRUM',
  SNARE = 'SNARE',
  HI_HAT_CLOSED = 'HI_HAT_CLOSED',
  CRASH_CYMBAL = 'CRASH_CYMBAL',
  RIDE_CYMBAL = 'RIDE_CYMBAL',
  HIGH_TOM = 'HIGH_TOM',
  MID_TOM = 'MID_TOM',
  FLOOR_TOM = 'FLOOR_TOM',
}

export enum NoteDuration {
  WHOLE = 'whole',
  HALF = 'half',
  QUARTER = 'quarter',
  EIGHTH = 'eighth',
  SIXTEENTH = 'sixteenth',
}

export enum Tool {
  PEN = 'pen',
  ERASER = 'eraser',
  LOOP = 'loop',
}

export type NoteHeadType = 'x' | 'normal';

export interface Note {
  id: string;
  part: DrumPart;
  duration: NoteDuration;
  beat: number;
  measure: number;
  stemDirection: 'up' | 'down';
  voice: 1 | 2;
}

export interface TimeSignature {
  top: number;
  bottom: number;
}

export type PlaybackCursor = { x: number; y: number } | null;

export type LoopRegion = { startMeasure: number; endMeasure: number } | null;
