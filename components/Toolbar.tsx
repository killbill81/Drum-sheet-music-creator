import React from 'react';
import { NoteDuration, DrumPart, Tool, TimeSignature, LoopRegion, Partition, Articulation, TextAnnotation } from '../types';
import { TOOLBAR_TOOLS, TOOLBAR_DURATIONS, TOOLBAR_DRUM_PARTS, TOOLBAR_RESTS } from '../constants';
import { PenIcon, EraserIcon, QuarterNoteIcon, EighthNoteIcon, SixteenthNoteIcon, ThirtySecondNoteIcon, SixtyFourthNoteIcon, EighthTripletIcon, PlayIcon, StopIcon, LoopIcon, SaveIcon, LoadIcon, PdfIcon, TrashIcon, PlusIcon, CopyIcon, FlamIcon, BuzzRollIcon, AccentIcon, GhostNoteIcon, DeleteIcon, AddLineIcon, AddMeasureIcon, TextIcon, WholeRestIcon, HalfRestIcon, QuarterRestIcon, EighthRestIcon, SixteenthRestIcon, ThirtySecondRestIcon, SixtyFourthRestIcon } from './Icons';

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
  [NoteDuration.SIXTY_FOURTH]: <SixtyFourthNoteIcon />,
  [NoteDuration.EIGHTH_TRIPLET]: <EighthTripletIcon />,
  [NoteDuration.HALF]: <QuarterNoteIcon />, // Placeholder
  [NoteDuration.WHOLE]: <QuarterNoteIcon />, // Placeholder
};

const ArticulationIcons: Record<Articulation, React.ReactNode> = {
  [Articulation.NONE]: <QuarterNoteIcon />,
  [Articulation.FLAM]: <FlamIcon />,
  [Articulation.BUZZ_ROLL]: <BuzzRollIcon />,
  [Articulation.ACCENT]: <AccentIcon />,
  [Articulation.GHOST_NOTE]: <GhostNoteIcon />,
};

const articulationsToShow = [Articulation.ACCENT, Articulation.GHOST_NOTE, Articulation.FLAM, Articulation.BUZZ_ROLL];

const RestIcons: Record<NoteDuration, React.ReactNode> = {
  [NoteDuration.WHOLE]: <WholeRestIcon />,
  [NoteDuration.HALF]: <HalfRestIcon />,
  [NoteDuration.QUARTER]: <QuarterRestIcon />,
  [NoteDuration.EIGHTH]: <EighthRestIcon />,
  [NoteDuration.SIXTEENTH]: <SixteenthRestIcon />,
  [NoteDuration.THIRTY_SECOND]: <ThirtySecondRestIcon />,
  [NoteDuration.SIXTY_FOURTH]: <SixtyFourthRestIcon />,
  [NoteDuration.EIGHTH_TRIPLET]: <EighthRestIcon />, // Placeholder for triplet rest
};

const ToolIcons: Record<Tool, React.ReactNode> = {
  [Tool.PEN]: <PenIcon />,
  [Tool.ERASER]: <EraserIcon />,
  [Tool.LOOP]: <LoopIcon />,
  [Tool.COPY]: <CopyIcon />,
  [Tool.DELETE]: <DeleteIcon />,
  [Tool.ADD_MEASURE]: <AddMeasureIcon />,
  [Tool.DELETE_MEASURE]: <TrashIcon />,
  [Tool.ADD_LINE]: <AddLineIcon />,
  [Tool.DELETE_LINE]: <TrashIcon />,
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
  onInsertLine,
  onDeleteLine,
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
    `p-2 rounded-lg transition-colors duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 ${isSelected
      ? 'bg-blue-600 text-white shadow-md'
      : 'bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-black dark:text-gray-200'
    }`;

  const loadInputRef = React.useRef<HTMLInputElement>(null);
  const currentPartitionName = partitions.find(p => p.id === currentPartitionId)?.name || '';

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md p-1.5 rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/30 flex flex-wrap gap-2 items-stretch justify-center max-w-[95vw] ${className || ''}`}>

      {/* GROUPE 1: PROJET & EXPORT */}
      <div className="flex flex-col bg-gray-50/50 dark:bg-gray-900/50 p-1.5 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        <label className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight text-center mb-1">PROJET</label>
        <div className="flex items-center gap-1">
          <button onClick={onSave} className={getButtonClass(false)} title="Sauvegarder">
            <SaveIcon />
          </button>
          <button onClick={() => loadInputRef.current?.click()} className={getButtonClass(false)} title="Charger">
            <LoadIcon />
          </button>
          <input type="file" accept=".json" onChange={onLoad} ref={loadInputRef} className="hidden" />
          <button onClick={onExportPdf} className={getButtonClass(false)} title="Export PDF">
            <PdfIcon />
          </button>
        </div>
      </div>

      {/* GROUPE 2: GESTION DES PARTITIONS */}
      <div className="flex flex-col bg-gray-50/50 dark:bg-gray-900/50 p-1.5 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        <label className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight text-center mb-1">SCORE</label>
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <select
              value={currentPartitionId || ''}
              onChange={(e) => onSelectPartition(e.target.value)}
              className="bg-white dark:bg-gray-700 py-1 px-2 rounded-lg text-sm font-medium text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 transition shadow-sm"
            >
              {partitions.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input
              type="text"
              value={currentPartitionName}
              onChange={(e) => onRenamePartition(e.target.value)}
              placeholder="Nom du score..."
              className="bg-white dark:bg-gray-700 py-1 px-2 rounded-lg text-xs w-32 border border-gray-200 dark:border-gray-600 focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div className="flex gap-1">
            <button onClick={onCreatePartition} className={getButtonClass(false)} title="Nouveau Score">
              <PlusIcon />
            </button>
            <button onClick={() => currentPartitionId && onDeletePartition(currentPartitionId)} className={`${getButtonClass(false)} hover:bg-red-500 hover:text-white`} title="Supprimer Score">
              <TrashIcon />
            </button>
          </div>
        </div>
      </div>

      {/* GROUPE 3: STRUCTURE (Lignes) */}
      <div className="flex flex-col bg-gray-50/50 dark:bg-gray-900/50 p-1.5 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        <label className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight text-center mb-1">LIGNES</label>
        <div className="flex items-center gap-1">
          <button onClick={onAddLine} className={getButtonClass(false)} title="Ajouter Ligne">
            <AddLineIcon />
          </button>
          <button onClick={() => {
            const line = window.prompt("Insérer après la ligne :");
            if (line) onInsertLine(parseInt(line, 10) - 1);
          }} className={getButtonClass(false)} title="Insérer Ligne">
            <PlusIcon />
          </button>
          <button onClick={() => {
            const line = window.prompt("Numéro de ligne à supprimer :");
            if (line) onDeleteLine(parseInt(line, 10) - 1);
          }} className={`${getButtonClass(false)} hover:bg-red-500 hover:text-white`} title="Supprimer Ligne">
            <DeleteIcon />
          </button>
        </div>
      </div>

      {/* GROUPE 4: STRUCTURE (Mesures) */}
      <div className="flex flex-col bg-gray-50/50 dark:bg-gray-900/50 p-1.5 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        <label className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight text-center mb-1">MESURES</label>
        <div className="flex items-center gap-1">
          <button onClick={() => setSelectedTool(Tool.ADD_MEASURE)} className={getButtonClass(selectedTool === Tool.ADD_MEASURE)} title="Ajouter Mesure">
            <AddMeasureIcon />
          </button>
          <button onClick={() => setSelectedTool(Tool.DELETE_MEASURE)} className={`${getButtonClass(selectedTool === Tool.DELETE_MEASURE)} hover:bg-red-500 hover:text-white`} title="Supprimer Mesure">
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* GROUPE 5: OUTILS D'ÉDITION */}
      <div className="flex flex-col bg-gray-50/50 dark:bg-gray-900/50 p-1.5 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        <label className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight text-center mb-1">ÉDITION</label>
        <div className="flex gap-1">
          {[Tool.PEN, Tool.ERASER, Tool.TEXT, Tool.LOOP, Tool.COPY, Tool.DELETE].map((id) => {
            const label = TOOLBAR_TOOLS.find(t => t.id === id)?.label || '';
            const isSelected = id === Tool.LOOP ? (selectedTool === id || !!loopRegion) : (selectedTool === id);
            return (
              <button key={id} onClick={() => id === Tool.LOOP ? onLoopButtonClick() : setSelectedTool(id)} className={getButtonClass(isSelected)} title={label}>
                {ToolIcons[id]}
              </button>
            )
          })}
        </div>
      </div>

      {/* GROUPE 6: SAISIE MUSICALE */}
      <div className="flex flex-col bg-blue-50/30 dark:bg-blue-900/20 p-1.5 rounded-xl border border-blue-200/50 dark:border-blue-700/50 items-center gap-1">
        <label className="text-[10px] font-bold text-blue-400 dark:text-blue-500 uppercase tracking-tight text-center">SAISIE</label>
        <div className="flex gap-2 items-center">
          {/* Durées de Notes */}
          <div className="flex gap-0.5 bg-white/50 dark:bg-gray-800/50 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
            {TOOLBAR_DURATIONS.map(({ id, label }) => (
              <button key={id} onClick={() => setSelectedDuration(id)} className={getButtonClass(selectedDuration === id)} title={label}>
                {DurationIcons[id]}
              </button>
            ))}
          </div>

          {/* Silences */}
          <div className="flex gap-0.5 bg-white/50 dark:bg-gray-800/50 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
            {TOOLBAR_RESTS.slice(2, 6).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => {
                  setSelectedTool(Tool.PEN);
                  setSelectedDrumPart(DrumPart.REST);
                  setSelectedDuration(id);
                }}
                className={getButtonClass(selectedDrumPart === DrumPart.REST && selectedDuration === id)}
                title={`Silence: ${label}`}
              >
                {RestIcons[id]}
              </button>
            ))}
          </div>

          {/* Articulations */}
          <div className="flex gap-0.5 bg-white/50 dark:bg-gray-800/50 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
            {articulationsToShow.map((articulation) => (
              <button key={articulation} onClick={() => setSelectedArticulation(selectedArticulation === articulation ? Articulation.NONE : articulation)} className={getButtonClass(selectedArticulation === articulation)} title={articulation}>
                {ArticulationIcons[articulation]}
              </button>
            ))}
          </div>

          {/* Sélecteur d'Instrument */}
          <select
            value={selectedDrumPart}
            onChange={(e) => setSelectedDrumPart(e.target.value as DrumPart)}
            className="bg-white dark:bg-gray-700 py-2 px-3 rounded-lg text-sm font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 focus:ring-2 focus:ring-blue-500 shadow-sm min-w-[140px]"
          >
            {TOOLBAR_DRUM_PARTS.map(({ id, label }) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* GROUPE 7: TRANSPORT & RÉGLAGES */}
      <div className="flex flex-col bg-gray-50/50 dark:bg-gray-900/50 p-1.5 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        <label className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight text-center mb-1">LECTURE</label>
        <div className="flex items-center gap-3">
          <button onClick={isPlaying ? onStop : onPlay} className={`${getButtonClass(false)} w-12 h-10 ${isPlaying ? 'bg-red-500 text-white animate-pulse' : 'bg-green-500 text-white'}`} title={isPlaying ? 'Stop' : 'Play'}>
            {isPlaying ? <StopIcon /> : <PlayIcon />}
          </button>

          <div className="flex flex-col gap-1 px-1">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold uppercase text-gray-500">Tempo</label>
              <span className="text-xs font-mono font-bold w-7 text-blue-600">{tempo}</span>
            </div>
            <input
              type="range"
              min="40"
              max="240"
              value={tempo}
              onChange={(e) => onTempoChange(Number(e.target.value))}
              className="w-20 h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:bg-gray-700"
              disabled={isPlaying}
            />
          </div>

          <div className="flex items-center gap-1 bg-white/50 dark:bg-gray-800/50 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
            <select value={timeSignature.top} onChange={(e) => onTimeSignatureChange({ ...timeSignature, top: Number(e.target.value) })} className="bg-transparent font-bold text-xs ring-0 border-none p-0 focus:ring-0">
              {timeSignatureNumerators.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className="text-xs font-bold text-gray-400">/</span>
            <select value={timeSignature.bottom} onChange={(e) => onTimeSignatureChange({ ...timeSignature, bottom: Number(e.target.value) })} className="bg-transparent font-bold text-xs ring-0 border-none p-0 focus:ring-0">
              {timeSignatureDenominators.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Annotations flottantes (si activées) */}
      {selectedTool === Tool.TEXT && (
        <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-1.5 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="text-[10px] font-bold text-gray-400 pl-2">TEXT STYLE</label>
          <input
            type="number"
            value={selectedFontSize}
            onChange={(e) => onUpdateAnnotationStyle({ fontSize: Number(e.target.value) })}
            className="w-14 bg-gray-100 dark:bg-gray-700 p-1 rounded font-mono text-xs text-center"
            min="8"
            max="72"
          />
          <button
            onClick={() => onUpdateAnnotationStyle({ fontWeight: selectedFontWeight === 'bold' ? 'normal' : 'bold' })}
            className={getButtonClass(selectedFontWeight === 'bold')}
          >
            <span className="font-bold">B</span>
          </button>
          <button
            onClick={() => onUpdateAnnotationStyle({ fontStyle: selectedFontStyle === 'italic' ? 'normal' : 'italic' })}
            className={getButtonClass(selectedFontStyle === 'italic')}
          >
            <span className="italic">I</span>
          </button>
        </div>
      )}
    </div>
  );
};