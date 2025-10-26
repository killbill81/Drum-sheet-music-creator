import React from 'react';
import { NoteDuration, DrumPart, Tool, TimeSignature, LoopRegion, Partition, Articulation, TextAnnotation } from '../types';
import { TOOLBAR_TOOLS, TOOLBAR_DURATIONS, TOOLBAR_DRUM_PARTS, TOOLBAR_RESTS } from '../constants';
import { PenIcon, EraserIcon, QuarterNoteIcon, EighthNoteIcon, SixteenthNoteIcon, ThirtySecondNoteIcon, PlayIcon, StopIcon, LoopIcon, SaveIcon, LoadIcon, PdfIcon, TrashIcon, PlusIcon, CopyIcon, FlamIcon, BuzzRollIcon, DeleteIcon, AddLineIcon, AddMeasureIcon, TextIcon, WholeRestIcon, HalfRestIcon, QuarterRestIcon, EighthRestIcon, SixteenthRestIcon, ThirtySecondRestIcon, SixtyFourthRestIcon } from './Icons';

interface ToolbarProps {
  className?: string;
  partitions: Partition[];
  currentPartitionId: string | null;
  onSelectPartition: (id: string) => void;
  onCreatePartition: () => void;
  onDeletePartition: (id: string) => void;
  onRenamePartition: (name: string) => void;
  onAddLine: () => void;
  onInsertLine: (afterLineIndex: number) => void;
  onDeleteLine: (lineIndex: number) => void;
  selectedTool: Tool;
  setSelectedTool: (tool: Tool) => void;
  selectedDuration: NoteDuration;
  setSelectedDuration: (duration: NoteDuration) => void;
  selectedArticulation: Articulation;
  setSelectedArticulation: (articulation: Articulation) => void;
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
  onSave: () => void;
  onLoad: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExportPdf: () => void;
  selectedFontSize: number;
  selectedFontWeight: 'normal' | 'bold';
  selectedFontStyle: 'normal' | 'italic';
  onUpdateAnnotationStyle: (style: Partial<TextAnnotation>) => void;
}

const DurationIcons: Record<NoteDuration, React.ReactNode> = {
  [NoteDuration.QUARTER]: <QuarterNoteIcon />,
  [NoteDuration.EIGHTH]: <EighthNoteIcon />,
  [NoteDuration.SIXTEENTH]: <SixteenthNoteIcon />,
  [NoteDuration.THIRTY_SECOND]: <ThirtySecondNoteIcon />,
  [NoteDuration.HALF]: <QuarterNoteIcon />, // Placeholder
  [NoteDuration.WHOLE]: <QuarterNoteIcon />, // Placeholder
};

const ArticulationIcons: Record<Articulation, React.ReactNode> = {
  [Articulation.NONE]: <QuarterNoteIcon />,
  [Articulation.FLAM]: <FlamIcon />,
  [Articulation.BUZZ_ROLL]: <BuzzRollIcon />,
};

const articulationsToShow = [Articulation.FLAM, Articulation.BUZZ_ROLL];

const RestIcons: Record<NoteDuration, React.ReactNode> = {
  [NoteDuration.WHOLE]: <WholeRestIcon />,
  [NoteDuration.HALF]: <HalfRestIcon />,
  [NoteDuration.QUARTER]: <QuarterRestIcon />,
  [NoteDuration.EIGHTH]: <EighthRestIcon />,
  [NoteDuration.SIXTEENTH]: <SixteenthRestIcon />,
  [NoteDuration.THIRTY_SECOND]: <ThirtySecondRestIcon />,
  [NoteDuration.SIXTY_FOURTH]: <SixtyFourthRestIcon />,
};

const ToolIcons: Record<Tool, React.ReactNode> = {
    [Tool.PEN]: <PenIcon />,
    [Tool.ERASER]: <EraserIcon />,
    [Tool.LOOP]: <LoopIcon />,
    [Tool.COPY]: <CopyIcon />,
    [Tool.DELETE]: <DeleteIcon />,
    [Tool.ADD_MEASURE]: <AddMeasureIcon />,
    [Tool.DELETE_MEASURE]: <TrashIcon />,
    [Tool.TEXT]: <TextIcon />,
};

const timeSignatureNumerators = [2, 3, 4, 6];
const timeSignatureDenominators = [4, 8]; // Force recompilation

export const Toolbar: React.FC<ToolbarProps> = ({
  partitions,
  currentPartitionId,
  onSelectPartition,
  onCreatePartition,
  onDeletePartition,
  onRenamePartition,
  onAddLine,
  selectedTool,
  setSelectedTool,
  selectedDuration,
  setSelectedDuration,
  selectedArticulation,
  setSelectedArticulation,
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
  onLoopButtonClick,
  onSave,
  onLoad,
  onExportPdf,
  className,
  selectedFontSize,
  selectedFontWeight,
  selectedFontStyle,
  onUpdateAnnotationStyle
}) => {
  const getButtonClass = (isSelected: boolean) =>
    `p-2 rounded-lg transition-colors duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 ${
      isSelected
        ? 'bg-blue-600 text-white shadow-md'
        : 'bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
    }`;

  const loadInputRef = React.useRef<HTMLInputElement>(null);
  const currentPartitionName = partitions.find(p => p.id === currentPartitionId)?.name || '';

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-gray-300 dark:border-gray-700 flex flex-wrap gap-4 items-center justify-center ${className || ''}`}>
      {/* Partition Management */}
      <div className="flex items-center bg-gray-100 dark:bg-gray-900 p-1 rounded-lg gap-2 px-2">
        <select
          value={currentPartitionId || ''}
          onChange={(e) => onSelectPartition(e.target.value)}
          className="bg-white dark:bg-gray-700 p-2 rounded-lg text-gray-800 dark:text-gray-200 border-2 border-transparent focus:border-blue-500 focus:outline-none transition"
        >
          {partitions.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <input 
          type="text" 
          value={currentPartitionName}
          onChange={(e) => onRenamePartition(e.target.value)}
          className="bg-white dark:bg-gray-700 p-2 rounded-lg w-32"
        />
        <button onClick={onCreatePartition} className={getButtonClass(false)} title="Nouvelle Partition">
          <PlusIcon />
        </button>
        <button onClick={() => currentPartitionId && onDeletePartition(currentPartitionId)} className={`${getButtonClass(false)} hover:bg-red-500`} title="Supprimer Partition">
          <TrashIcon />
        </button>
      </div>

      <div className="flex items-center bg-gray-100 dark:bg-gray-900 p-1 rounded-lg gap-2 px-2">
        <button onClick={onAddLine} className={getButtonClass(false)} title="Ajouter une ligne à la fin">
          <AddLineIcon />
        </button>
        <button onClick={() => {
          const line = window.prompt("Entrez le numéro de la ligne après laquelle insérer :");
          if (line) onInsertLine(parseInt(line, 10) - 1);
        }} className={getButtonClass(false)} title="Insérer une ligne">
          <PlusIcon />
        </button>
        <button onClick={() => {
          const line = window.prompt("Entrez le numéro de la ligne à supprimer :");
          if (line) onDeleteLine(parseInt(line, 10) - 1);
        }} className={`${getButtonClass(false)} hover:bg-red-500`} title="Supprimer la ligne">
          <TrashIcon />
        </button>
      </div>

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

      {selectedTool === Tool.TEXT && (
        <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg items-center gap-2">
          <input
            type="number"
            value={selectedFontSize}
            onChange={(e) => onUpdateAnnotationStyle({ fontSize: Number(e.target.value) })}
            className="w-16 bg-white dark:bg-gray-700 p-1 rounded text-sm"
            min="8"
            max="72"
          />
          <button 
            onClick={() => onUpdateAnnotationStyle({ fontWeight: selectedFontWeight === 'bold' ? 'normal' : 'bold' })} 
            className={getButtonClass(selectedFontWeight === 'bold')}
            title="Gras"
          >
            <span className="font-bold">B</span>
          </button>
          <button 
            onClick={() => onUpdateAnnotationStyle({ fontStyle: selectedFontStyle === 'italic' ? 'normal' : 'italic' })} 
            className={getButtonClass(selectedFontStyle === 'italic')}
            title="Italique"
          >
            <span className="italic">I</span>
          </button>
        </div>
      )}

      <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
        {TOOLBAR_DURATIONS.map(({ id, label }) => (
          <button key={id} onClick={() => setSelectedDuration(id)} className={getButtonClass(selectedDuration === id)} title={label}>
            {DurationIcons[id]}
          </button>
        ))}
      </div>

      <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
        {TOOLBAR_RESTS.map(({ id, label }) => (
          <button 
            key={id} 
            onClick={() => {
              setSelectedTool(Tool.PEN);
              setSelectedDrumPart(DrumPart.REST);
              setSelectedDuration(id);
            }}
            className={getButtonClass(selectedDrumPart === DrumPart.REST && selectedDuration === id)} 
            title={label}
          >
            {RestIcons[id]}
          </button>
        ))}
      </div>

      <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
        {articulationsToShow.map((articulation) => (
          <button key={articulation} onClick={() => setSelectedArticulation(selectedArticulation === articulation ? Articulation.NONE : articulation)} className={getButtonClass(selectedArticulation === articulation)} title={articulation}>
            {ArticulationIcons[articulation]}
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
         <select value={timeSignature.top} onChange={(e) => onTimeSignatureChange({ ...timeSignature, top: Number(e.target.value) })} className="bg-white dark:bg-gray-700 p-1 rounded text-sm">
           {timeSignatureNumerators.map(n => <option key={n} value={n}>{n}</option>)}
         </select>
         <span className="font-bold">/</span>
         <select value={timeSignature.bottom} onChange={(e) => onTimeSignatureChange({ ...timeSignature, bottom: Number(e.target.value) })} className="bg-white dark:bg-gray-700 p-1 rounded text-sm">
            {timeSignatureDenominators.map(d => <option key={d} value={d}>{d}</option>)}
         </select>
      </div>

      <div className="flex items-center bg-gray-100 dark:bg-gray-900 p-1 rounded-lg gap-2">
        <button onClick={isPlaying ? onStop : onPlay} className={`${getButtonClass(false)} w-12`} title={isPlaying ? 'Arrêt' : 'Lecture'}>
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

      <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg gap-2">
        <button onClick={onSave} className={getButtonClass(false)} title="Exporter les partitions">
          <SaveIcon />
        </button>
        <button onClick={() => loadInputRef.current?.click()} className={getButtonClass(false)} title="Importer les partitions">
          <LoadIcon />
        </button>
        <input type="file" accept=".json" onChange={onLoad} ref={loadInputRef} className="hidden" />
        <button onClick={onExportPdf} className={getButtonClass(false)} title="Exporter en PDF">
          <PdfIcon />
        </button>
      </div>
    </div>
  );
};