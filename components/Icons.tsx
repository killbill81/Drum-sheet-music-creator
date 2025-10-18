import React from 'react';

export const PenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
  </svg>
);

export const EraserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export const QuarterNoteIcon = () => (
  <svg viewBox="0 0 30 50" className="h-6 w-auto">
    <circle cx="10" cy="45" r="5" fill="currentColor"/>
    <line x1="15" y1="45" x2="15" y2="10" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export const EighthNoteIcon = () => (
  <svg viewBox="0 0 30 50" className="h-6 w-auto">
    <circle cx="10" cy="45" r="5" fill="currentColor"/>
    <line x1="15" y1="45" x2="15" y2="10" stroke="currentColor" strokeWidth="2" />
    <path d="M 15 10 Q 25 15, 15 25" stroke="currentColor" strokeWidth="2.5" fill="none" />
  </svg>
);

export const SixteenthNoteIcon = () => (
  <svg viewBox="0 0 30 50" className="h-6 w-auto">
    <circle cx="10" cy="45" r="5" fill="currentColor"/>
    <line x1="15" y1="45" x2="15" y2="10" stroke="currentColor" strokeWidth="2" />
    <path d="M 15 10 Q 25 15, 15 25" stroke="currentColor" strokeWidth="2.5" fill="none" />
    <path d="M 15 16 Q 25 21, 15 31" stroke="currentColor" strokeWidth="2.5" fill="none" />
  </svg>
);

export const PercussionClef = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x}, ${y}) scale(0.8)`}>
    <rect x="5" y="12" width="4" height="40" fill="currentColor" />
    <rect x="15" y="12" width="4" height="40" fill="currentColor" />
  </g>
);

export const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const StopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
  </svg>
);
