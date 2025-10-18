import React from 'react';
import { NoteDuration, DrumPart, Tool, TimeSignature, LoopRegion } from '../types';
import { TOOLBAR_TOOLS, TOOLBAR_DURATIONS, TOOLBAR_DRUM_PARTS } from '../constants';
import { PenIcon, EraserIcon, QuarterNoteIcon, EighthNoteIcon, SixteenthNoteIcon, PlayIcon, StopIcon, LoopIcon } from './Icons';

interface ToolbarProps {
  selectedTool: Tool;
  setSelectedTool: (tool: Tool) => void;
  selectedDuration: NoteDuration;
  setSelectedDuration: (duration: NoteDuration) => void;
  selectedDrumPart: DrumPart;
  setSelectedDrumPart: (part: DrumPart) => void;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  tempo: number;
  onTempoChange: (newTempo: number) => void;
  timeSignature: TimeSignature;
  onTimeSignatureChange: (newTimeSignature: TimeSignature) => void;
  loopRegion: LoopRegion;
  onLoopButtonClick: () => void;
}

const DurationIcons: Record<NoteDuration, React.ReactNode> = {
  [NoteDuration.QUARTER]: <QuarterNoteIcon />,
  [NoteDuration.EIGHTH]: <EighthNoteIcon />,
  [NoteDuration.SIXTEENTH]: <SixteenthNoteIcon />,
  [NoteDuration.HALF]: <QuarterNoteIcon />, // Placeholder
  [NoteDuration.WHOLE]: <QuarterNoteIcon />, // Placeholder
};

const ToolIcons: Record<Tool, React.ReactNode> = {
    [Tool.PEN]: <PenIcon />,
    [Tool.ERASER]: <EraserIcon />,
    [Tool.LOOP]: <LoopIcon />,
};

const timeSignatureNumerators = [2, 3, 4, 6];
const timeSignatureDenominators = [4, 8];

export const Toolbar: React.FC<ToolbarProps> = ({
  selectedTool,
  setSelectedTool,
  selectedDuration,
  setSelectedDuration,
  selectedDrumPart,
  setSelectedDrumPart,
  isPlaying,
  onPlay,
  onStop,
  tempo,
  onTempoChange,
  timeSignature,
  onTimeSignatureChange,
  loopRegion,
  onLoopButtonClick
}) => {
  const getButtonClass = (isSelected: boolean) =>
    `p-2 rounded-lg transition-colors duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 ${
      isSelected
        ? 'bg-blue-600 text-white shadow-md'
        : 'bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
    }`;

  const handleNumeratorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onTimeSignatureChange({ ...timeSignature, top: Number(e.target.value) });
  };
  
  const handleDenominatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onTimeSignatureChange({ ...timeSignature, bottom: Number(e.target.value) });
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-gray-300 dark:border-gray-700 flex flex-wrap gap-4 items-center justify-center">
      <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
        {TOOLBAR_TOOLS.map(({ id, label }) => {
          if (id === Tool.LOOP) {
            return (
              <button key={id} onClick={onLoopButtonClick} className={getButtonClass(selectedTool === id || !!loopRegion)} title={label}>
                {ToolIcons[id]}
              </button>
            )
          }
          return (
            <button key={id} onClick={() => setSelectedTool(id)} className={getButtonClass(selectedTool === id)} title={label}>
              {ToolIcons[id]}
            </button>
          )
        })}
      </div>

      <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
        {TOOLBAR_DURATIONS.map(({ id, label }) => (
          <button key={id} onClick={() => setSelectedDuration(id)} className={getButtonClass(selectedDuration === id)} title={label}>
            {DurationIcons[id]}
          </button>
        ))}
      </div>
      
      <div className="flex-grow md:flex-grow-0">
        <select
          value={selectedDrumPart}
          onChange={(e) => setSelectedDrumPart(e.target.value as DrumPart)}
          className="w-full bg-white dark:bg-gray-700 p-2 rounded-lg text-gray-800 dark:text-gray-200 border-2 border-transparent focus:border-blue-500 focus:outline-none transition"
        >
          {TOOLBAR_DRUM_PARTS.map(({ id, label }) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
      </div>

       <div className="flex items-center bg-gray-100 dark:bg-gray-900 p-1 rounded-lg gap-2 px-2">
         <label className="text-sm font-medium">Time Sig</label>
         <select value={timeSignature.top} onChange={handleNumeratorChange} className="bg-white dark:bg-gray-700 p-1 rounded text-sm">
           {timeSignatureNumerators.map(n => <option key={n} value={n}>{n}</option>)}
         </select>
         <span className="font-bold">/</span>
         <select value={timeSignature.bottom} onChange={handleDenominatorChange} className="bg-white dark:bg-gray-700 p-1 rounded text-sm">
            {timeSignatureDenominators.map(d => <option key={d} value={d}>{d}</option>)}
         </select>
      </div>

      <div className="flex items-center bg-gray-100 dark:bg-gray-900 p-1 rounded-lg gap-2">
        <button onClick={isPlaying ? onStop : onPlay} className={`${getButtonClass(false)} w-12`} title={isPlaying ? 'Stop' : 'Play'}>
          {isPlaying ? <StopIcon /> : <PlayIcon />}
        </button>
        <div className="flex items-center gap-2 px-2">
          <label htmlFor="tempo" className="text-sm font-medium">BPM</label>
          <input
            type="range"
            id="tempo"
            min="40"
            max="240"
            value={tempo}
            onChange={(e) => onTempoChange(Number(e.target.value))}
            className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            disabled={isPlaying}
          />
          <span className="text-sm font-semibold w-8 text-center">{tempo}</span>
        </div>
      </div>
    </div>
  );
};