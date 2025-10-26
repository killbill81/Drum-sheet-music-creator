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

export const LoopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.65-4.65L20 5M20 15a9 9 0 01-14.65 4.65L4 19" />
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

export const ThirtySecondNoteIcon = () => (
  <svg viewBox="0 0 30 50" className="h-6 w-auto">
    <circle cx="10" cy="45" r="5" fill="currentColor"/>
    <line x1="15" y1="45" x2="15" y2="10" stroke="currentColor" strokeWidth="2" />
    <path d="M 15 10 Q 25 15, 15 25" stroke="currentColor" strokeWidth="2.5" fill="none" />
    <path d="M 15 16 Q 25 21, 15 31" stroke="currentColor" strokeWidth="2.5" fill="none" />
    <path d="M 15 22 Q 25 27, 15 37" stroke="currentColor" strokeWidth="2.5" fill="none" />
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

export const PlaybackArrowIcon = ({ x, y }: { x: number; y: number }) => (
    <svg x={x - 8} y={y - 16} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500">
        <path d="M12 21l-12-18h24z"/>
    </svg>
);

export const SaveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3l-4-4-4 4z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v-4" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11h.01" />
  </svg>
);

export const LoadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

export const PdfIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0L8 8m4-4v12" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 11V9a2 2 0 012-2h2" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 7h2a2 2 0 012 2v2" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 21H8a2 2 0 01-2-2v-2" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 15v-2a2 2 0 00-2-2h-2" />
  </svg>
);

export const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 7h14m-4 0V4a2 2 0 00-2-2H9a2 2 0 00-2 2v3m4 4v6m-4-6v6m1-12l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" />
  </svg>
);

export const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h12m-6-6v12" />
  </svg>
);

export const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

export const FlamIcon = () => (
  <svg viewBox="0 0 30 50" className="h-6 w-auto">
    <circle cx="18" cy="45" r="5" fill="currentColor"/>
    <line x1="23" y1="45" x2="23" y2="10" stroke="currentColor" strokeWidth="2" />
    <circle cx="8" cy="38" r="3" fill="currentColor" />
    <line x1="11" y1="38" x2="11" y2="20" stroke="currentColor" strokeWidth="1.5" />
    <line x1="8" y1="28" x2="14" y2="24" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export const BuzzRollIcon = () => (
  <svg viewBox="0 0 30 50" className="h-6 w-auto">
    <circle cx="10" cy="45" r="5" fill="currentColor"/>
    <line x1="15" y1="45" x2="15" y2="10" stroke="currentColor" strokeWidth="2" />
    <line x1="12" y1="25" x2="18" y2="28" stroke="currentColor" strokeWidth="2" />
    <line x1="12" y1="28" x2="18" y2="31" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    <line x1="10" y1="11" x2="14" y2="11" strokeWidth="2" />
  </svg>
);

export const AddLineIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

export const AddMeasureIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6M12 9v6" />
    <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} fill="none" />
  </svg>
);

export const TextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
  </svg>
);