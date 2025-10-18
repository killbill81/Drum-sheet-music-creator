export enum NoteDuration {
  QUARTER = 'QUARTER',
  EIGHTH = 'EIGHTH',
  SIXTEENTH = 'SIXTEENTH',
  HALF = 'HALF',
  WHOLE = 'WHOLE',
}

export enum DrumPart {
  CRASH_CYMBAL = 'CRASH_CYMBAL',
  HI_HAT_CLOSED = 'HI_HAT_CLOSED',
  RIDE_CYMBAL = 'RIDE_CYMBAL',
  HIGH_TOM = 'HIGH_TOM',
  MID_TOM = 'MID_TOM',
  SNARE = 'SNARE',
  FLOOR_TOM = 'FLOOR_TOM',
  BASS_DRUM = 'BASS_DRUM',
}

export type NoteHeadType = 'normal' | 'x';

export interface TimeSignature {
  top: number;
  bottom: number;
}

export interface Note {
  id: string;
  part: DrumPart;
  duration: NoteDuration;
  beat: number; 
  measure: number;
  stemDirection: 'up' | 'down';
  voice: 1 | 2;
}

export enum Tool {
  PEN = 'PEN',
  ERASER = 'ERASER',
}

export type PlaybackCursor = {
  x: number;
  y1: number;
  y2: number;
} | null;
