import React from 'react';

// Common Notehead path from Bravura (SMuFL U+E0A4)
const BravuraNoteheadBlack = () => (
  <path d="M133.77936 79.77712C133.89168 79.77712,134.06016 79.77712,134.08823999999998 79.77712C134.08823999999998 79.77712,134.11632 79.77712,134.11632 79.77712C134.11632 79.77712,134.2848 79.77712,134.4252 79.77712C136.9524 79.91752,138.44064 81.57424,138.44064 83.65216C138.44064 84.66304,138.10368 85.81432,137.26128 86.90944C135.66072 89.0716,133.04928 90.25096,130.7748 90.25096C129.00576 90.25096,127.48944 89.54896,126.75936 88.11688C126.53472 87.55528,126.4224 87.02176,126.4224 86.43208C126.4224 83.37136,129.84816 79.97368,133.77936 79.77712M136.69968 81.32152C136.58736 81.26536,136.44696 81.23728,136.30656 81.23728C135.43608 81.23728,133.97592 81.7708,132.57192 82.72552C129.96048 84.35416,127.82639999999999 86.74096,127.74216 88.11688C127.74216 88.11688,127.74216 88.14496,127.74216 88.14496C127.74216 88.62232,128.05104 88.81888000000001,128.58456 88.81888000000001C129.73584 88.81888000000001,131.86992 87.83608,133.83552 86.2636C135.85728 84.66304,137.14896 82.86592,137.14896 81.93928C137.14896 81.6304,137.00856 81.37768,136.69968 81.32152" />
);

// Flag path from Bravura (SMuFL U+E240)
const BravuraFlag8thUp = () => (
  <path d="M187.69063999999997 23M187.01671999999996 27.52088L187.01671999999996 23.1404L187.12903999999997 23.1404C187.43791999999996 23.1404,187.63447999999997 23.33696,187.69063999999997 23.67392C188.28031999999996 26.48192,190.04935999999998 29.54264,192.49231999999998 31.8452C195.21607999999998 34.40048,196.59199999999998 37.91048,196.59199999999998 41.5328C196.59199999999998 44.958560000000006,195.38455999999996 48.52472,192.94159999999997 51.47312C192.52039999999997 52.03472,192.49231999999998 52.03472,192.21151999999998 52.03472C191.87455999999997 52.03472,191.64991999999998 51.782,191.64991999999998 51.445040000000006C191.64991999999998 51.19232,191.67799999999997 51.136160000000004,191.95879999999997 50.82728C194.09287999999998 48.24392,195.15991999999997 45.12704,195.15991999999997 42.15056C195.15991999999997 39.51104,194.31751999999997 36.98384,192.57655999999997 35.0744C191.50951999999998 33.89504,189.54391999999999 32.77184,187.04479999999998 31.90136C187.04479999999998 31.87328,187.01671999999996 31.0028,187.01671999999996 27.52088" />
);

// Correction des translations pour que tout soit dans la zone positive du viewBox [0, 32]
// X: ~126 -> Center sur 16 (-110)
// Y: ~60 (top stem) -> Center sur 16 (-44)
const NoteTransform = "translate(-122, -58)";

export const QuarterNoteIcon = () => (
  <svg viewBox="0 0 32 40" className="h-8 w-auto" fill="currentColor">
    <g transform={NoteTransform}>
      <BravuraNoteheadBlack />
      <rect x="137.5" y="60" width="1.2" height="23" />
    </g>
  </svg>
);

export const EighthNoteIcon = () => (
  <svg viewBox="0 0 32 40" className="h-8 w-auto" fill="currentColor">
    <g transform={NoteTransform}>
      <BravuraNoteheadBlack />
      <rect x="137.5" y="60" width="1.2" height="23" />
      <g transform="translate(-50, 37)">
        <BravuraFlag8thUp />
      </g>
    </g>
  </svg>
);

export const SixteenthNoteIcon = () => (
  <svg viewBox="0 0 32 40" className="h-8 w-auto" fill="currentColor">
    <g transform={NoteTransform}>
      <BravuraNoteheadBlack />
      <rect x="137.5" y="60" width="1.2" height="23" />
      <g transform="translate(-50, 37)">
        <BravuraFlag8thUp />
        <g transform="translate(0, 8)">
          <BravuraFlag8thUp />
        </g>
      </g>
    </g>
  </svg>
);

export const ThirtySecondNoteIcon = () => (
  <svg viewBox="0 0 32 40" className="h-8 w-auto" fill="currentColor">
    <g transform={NoteTransform}>
      <BravuraNoteheadBlack />
      <rect x="137.5" y="60" width="1.2" height="23" />
      <g transform="translate(-50, 37)">
        <BravuraFlag8thUp />
        <g transform="translate(0, 8)">
          <BravuraFlag8thUp />
          <g transform="translate(0, 8)">
            <BravuraFlag8thUp />
          </g>
        </g>
      </g>
    </g>
  </svg>
);

export const SixtyFourthNoteIcon = () => (
  <svg viewBox="0 0 32 40" className="h-8 w-auto" fill="currentColor">
    <g transform={NoteTransform}>
      <BravuraNoteheadBlack />
      <rect x="137.5" y="60" width="1.2" height="23" />
      <g transform="translate(-50, 37)">
        <BravuraFlag8thUp />
        <g transform="translate(0, 6)">
          <BravuraFlag8thUp />
          <g transform="translate(0, 6)">
            <BravuraFlag8thUp />
            <g transform="translate(0, 6)">
              <BravuraFlag8thUp />
            </g>
          </g>
        </g>
      </g>
    </g>
  </svg>
);

export const EighthTripletIcon = () => (
  <svg viewBox="0 0 32 40" className="h-8 w-auto" fill="currentColor">
    <g transform={NoteTransform}>
      <BravuraNoteheadBlack />
      <rect x="137.5" y="60" width="1.2" height="23" />
      <g transform="translate(-50, 37)">
        <BravuraFlag8thUp />
      </g>
      <text x="145" y="68" fontSize="14" fontWeight="bold" fill="currentColor">3</text>
    </g>
  </svg>
);

// System icons
export const PenIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

export const EraserIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Tilted block eraser design */}
    <path d="M7 21L3 17L13 7L17 11L7 21Z" />
    <path d="M13 7L17 3L21 7L17 11" />
    <path d="M14 8L18 12" opacity="0.5" />
  </svg>
);

export const LoopIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 2.1l4 4-4 4" />
    <path d="M3 12.2v-2a4 4 0 0 1 4-4h14" />
    <path d="M7 21.9l-4-4 4-4" />
    <path d="M21 11.8v2a4 4 0 0 1-4 4H3" />
  </svg>
);

export const PlayIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

export const StopIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="1" />
  </svg>
);

export const SaveIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

export const LoadIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export const PdfIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

export const TrashIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export const PlusIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const DeleteIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

export const CopyIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export const AddLineIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <line x1="12" y1="5" x2="12" y2="19" />
  </svg>
);

export const AddMeasureIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

export const TextIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 7 4 4 20 4 20 7" />
    <line x1="12" y1="4" x2="12" y2="20" />
  </svg>
);

// Rests - X[601, 610], Y[75, 104] -> Translate (-595, -73) for 24x36
const RestTransform = "translate(-594, -72)";

export const WholeRestIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-auto" fill="currentColor">
    <rect x="4" y="6" width="16" height="6" />
    <line x1="2" y1="6" x2="22" y2="6" stroke="currentColor" strokeWidth="1" />
  </svg>
);

export const HalfRestIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-auto" fill="currentColor">
    <rect x="4" y="12" width="16" height="6" />
    <line x1="2" y1="18" x2="22" y2="18" stroke="currentColor" strokeWidth="1" />
  </svg>
);

export const QuarterRestIcon = () => (
  <svg viewBox="0 0 24 36" className="h-8 w-auto" fill="currentColor">
    <g transform={RestTransform}>
      <path d="M601.4224 90M602.79832 75.8196C602.8264 75.8196,602.8544800000001 75.79152,602.9106400000001 75.79152C603.0510400000001 75.79152,603.16336 75.87576,603.388 76.07232C603.47224 76.18464,603.61264 76.29696,603.6968800000001 76.3812L604.1180800000001 76.71816L604.5392800000001 77.11128L604.84816 77.39207999999999L605.18512 77.70096L606.53296 78.88032L608.5828 80.7336C609.62176 81.63216,609.62176 81.63216,609.62176 81.82872L609.62176 81.85679999999999L609.62176 82.02528L609.36904 82.4184C607.9931200000001 84.46824,607.2911200000001 86.82696,607.2911200000001 88.98912C607.2911200000001 91.23552,608.0212 93.34152,609.50944 94.7736C609.706 95.02632,609.8183200000001 95.08248,609.8183200000001 95.16672C609.8464 95.25096,609.8464 95.27904,609.8464 95.36328C609.8464 95.58792,609.6779200000001 95.78448,609.4252 95.78448C609.36904 95.78448,609.3128800000001 95.78448,609.2848 95.78448C609.004 95.67216,608.6951200000001 95.64408,608.35816 95.64408C607.68424 95.64408,606.95416 95.84064000000001,606.3644800000001 96.23376C605.2412800000001 96.99192,604.62352 98.19936,604.62352 99.5472C604.62352 100.78272,605.18512 102.15864,606.25216 103.22568C606.53296 103.50648,606.6172 103.67496,606.6172 103.81536C606.6172 103.92768,606.56104 104.01192,606.5048800000001 104.09616C606.3644800000001 104.1804,606.3083200000001 104.26464,606.2240800000001 104.26464C606.0836800000001 104.26464,605.9152 104.12424,605.69056 103.98384C603.2476 102.01824,601.75936 99.88416,601.4224 97.97472C601.4224 97.80624,601.4224 97.5816,601.4224 97.3008C601.4224 97.07616,601.4224 96.79536,601.4504800000001 96.68304C601.8716800000001 94.97015999999999,603.47224 93.9312,605.57824 93.9312C606.11176 93.9312,606.7295200000001 93.98736,607.2911200000001 94.15584C607.37536 94.15584,607.4596 94.18392,607.4596 94.18392C607.4596 94.18392,607.4596 94.18392,607.4596 94.18392L607.4596 94.18392C607.4596 94.15584,607.2911200000001 93.98736,607.0664800000001 93.81888000000001L605.83096 92.72376L604.1180800000001 91.15128C602.0120800000001 89.32608,601.89976 89.18568,601.89976 89.04528C601.89976 88.98912,601.89976 88.98912,601.89976 88.96104C601.89976 88.96104,601.89976 88.93296,601.89976 88.93296C601.89976 88.76448,601.89976 88.76448,602.1244 88.42752C603.6968800000001 86.32152,604.5112 83.85048,604.5112 81.63216C604.5112 79.69463999999999,603.89344 77.89752,602.7140800000001 76.69008C602.5456 76.5216,602.4894400000001 76.32504,602.4894400000001 76.21272C602.4894400000001 76.01616,602.60176 75.90384,602.79832 75.8196" />
    </g>
  </svg>
);

const EighthRestPath = () => (
  <path d="M628.89344 81.51984C629.03384 81.51984,629.17424 81.49176,629.31464 81.49176C630.6063200000001 81.49176,631.7856800000001 82.4184,632.09456 83.71008C632.1507200000001 83.93472,632.1788 84.15935999999999,632.1788 84.41208C632.1788 85.14216,631.9260800000001 85.87224,631.42064 86.37768L631.3364 86.46192L631.53296 86.43384C633.0492800000001 86.01264,634.3971200000001 84.6648,635.04296 83.00808C635.07104 82.86768000000001,635.1552800000001 82.75536,635.21144 82.72728C635.32376 82.5588,635.49224 82.50264,635.6607200000001 82.50264C635.9696 82.50264,636.2223200000001 82.72728,636.2223200000001 83.06424C636.2223200000001 83.20464,632.1507200000001 97.24464,632.0664800000001 97.38504C631.95416 97.5816,631.7576 97.66584,631.53296 97.66584C631.3083200000001 97.66584,631.0836800000001 97.55352,630.99944 97.3008C630.9432800000001 97.27272,630.9432800000001 97.24464,630.9432800000001 97.18848C630.9432800000001 96.96384,631.196 96.1776,632.51576 91.65672C633.35816 88.79256,634.06016 86.43384,634.06016 86.37768C634.06016 86.37768,634.06016 86.37768,634.06016 86.37768C634.06016 86.37768,633.94784 86.46192,633.8355200000001 86.57424C632.79656 87.36048,631.56104 87.7536,630.3536 87.7536C629.28656 87.7536,628.2476 87.44472,627.4332800000001 86.7708C626.7032 86.18111999999999,626.4224 85.3668,626.4224 84.55248C626.4224 83.14848,627.32096 81.80064,628.89344 81.51984" />
);

// X: ~626 -> Center on 10 (-616)
// Y: ~81 -> Center on 12 (-69)
const EighthRestTransform = "translate(-622, -73)";

export const EighthRestIcon = () => (
  <svg viewBox="0 0 24 36" className="h-8 w-auto" fill="currentColor">
    <g transform={EighthRestTransform}>
      <EighthRestPath />
      <rect x="632" y="85" width="1" height="12" />
    </g>
  </svg>
);

export const SixteenthRestIcon = () => (
  <svg viewBox="0 0 24 36" className="h-8 w-auto" fill="currentColor">
    <g transform={EighthRestTransform}>
      <EighthRestPath />
      <g transform="translate(0, 8)">
        <EighthRestPath />
      </g>
      <rect x="632" y="85" width="1" height="18" />
    </g>
  </svg>
);

export const ThirtySecondRestIcon = () => (
  <svg viewBox="0 0 24 36" className="h-8 w-auto" fill="currentColor">
    <g transform={EighthRestTransform}>
      {[0, 8, 16].map(y => (
        <g key={y} transform={`translate(0, ${y})`}>
          <EighthRestPath />
        </g>
      ))}
      <rect x="632" y="85" width="1" height="24" />
    </g>
  </svg>
);

export const SixtyFourthRestIcon = () => (
  <svg viewBox="0 0 24 36" className="h-8 w-auto" fill="currentColor">
    <g transform={EighthRestTransform}>
      {[0, 6, 12, 18].map(y => (
        <g key={y} transform={`translate(0, ${y})`}>
          <EighthRestPath />
        </g>
      ))}
      <rect x="632" y="85" width="1" height="30" />
    </g>
  </svg>
);

// Articulations
export const FlamIcon = () => (
  <svg viewBox="0 0 32 32" className="h-6 w-auto" fill="currentColor">
    {/* Optimized transform to fit 32x32 viewbox */}
    <g transform="translate(-108, -50) scale(0.85)">
      {/* 1. Main Note */}
      <g transform="translate(132, 85)">
        <g transform="translate(-132, -85)">
          <BravuraNoteheadBlack />
          <rect x="137.5" y="65" width="1.5" height="18" />
        </g>
      </g>

      {/* 2. Grace Note (Acciaccatura) - Sized for clarity in icon */}
      <g transform="translate(116, 85) scale(0.7)">
        <g transform="translate(-132, -85)">
          <BravuraNoteheadBlack />
          <rect x="137.5" y="50" width="2" height="37" />
          {/* Thick, professional slash */}
          <path d="M125 76 L150 63" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        </g>
      </g>

      {/* 3. Dramatic musical slur */}
      <path d="M116 95 C124 108, 132 108, 140 95 C132 112, 124 112, 116 95 Z" />
    </g>
  </svg>
);

export const AccentIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 7l10 5-10 5" />
  </svg>
);

export const BuzzRollIcon = () => (
  <svg viewBox="0 0 32 32" className="h-6 w-auto" fill="currentColor">
    <g transform="translate(-122, -58)">
      <BravuraNoteheadBlack />
      <rect x="137.5" y="60" width="1.2" height="23" />
      {/* Triple Tremolo (Z-style strokes) */}
      <g transform="translate(138, 68)">
        <path d="M-6 0 L6 -4 L6 -2 L-6 2 Z" />
        <path d="M-6 6 L6 2 L6 4 L-6 8 Z" />
        <path d="M-6 12 L6 8 L6 10 L-6 14 Z" />
      </g>
    </g>
  </svg>
);

export const GhostNoteIcon = () => (
  <svg viewBox="0 0 32 32" className="h-6 w-auto" fill="currentColor">
    <g transform="translate(-122, -58)">
      <BravuraNoteheadBlack />
      <rect x="137.5" y="60" width="1.2" height="23" />
      {/* Musical Parentheses - Curvature tuned for Bravura aesthetics */}
      <path d="M126 94 C123 90 123 78 126 74 L125 73 C121 78 121 90 125 95 Z" />
      <path d="M142 74 C145 78 145 90 142 94 L143 95 C147 90 147 78 143 73 Z" />
    </g>
  </svg>
);

export const PercussionClef = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x}, ${y}) scale(0.8)`}>
    <rect x="5" y="12" width="4" height="40" fill="currentColor" rx="1" />
    <rect x="15" y="12" width="4" height="40" fill="currentColor" rx="1" />
  </g>
);

export const PlaybackArrowIcon = ({ x, y }: { x: number; y: number }) => (
  <svg x={x - 8} y={y - 12} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500">
    <path d="M12 21l-8-12h16z" />
  </svg>
);

export const NoteheadCrossIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-auto" fill="currentColor">
    <g transform="translate(-362, -37)">
      <path d="M365.3632 45M365.3632 41.51808L365.3632 39.74904L367.07608 39.74904L368.78896000000003 39.74904L368.78896000000003 41.12496L368.78896000000003 42.44472L369.65944 43.28712L370.50184 44.1576L371.34424 43.28712L372.18664 42.44472L372.18664 41.12496L372.18664 39.74904L373.95568000000003 39.74904L375.66856 39.74904L375.66856 41.51808L375.66856 43.28712L374.37688 43.28712L373.05712 43.28712L372.18664 44.1576L371.34424 45" />
    </g>
  </svg>
);
