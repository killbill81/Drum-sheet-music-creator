import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Note, Tool, NoteDuration, DrumPart, TimeSignature, PlaybackCursor, LoopRegion, Partition } from './types';
import { Staff } from './components/Staff';
import { Toolbar } from './components/Toolbar';
import { DRUM_PART_VOICE, MEASURE_PADDING_HORIZONTAL, NOTE_TYPE_TO_FRACTIONAL_VALUE, STAFF_HEIGHT, STAFF_VERTICAL_GAP, STAFF_LINE_GAP, DRUM_PART_Y_POSITIONS } from './constants';
import { initializeAudio, playSoundForPart } from './audio';
import { STAFF_X_OFFSET, CLEF_WIDTH, NUM_MEASURES, MEASURE_WIDTH, TIME_SIGNATURE_WIDTH, MEASURES_PER_LINE, STAFF_Y_OFFSET } from './constants';

const App: React.FC = () => {
  const [partitions, setPartitions] = useState<Partition[]>([]);
  const [currentPartitionId, setCurrentPartitionId] = useState<string | null>(null);

  const [selectedTool, setSelectedTool] = useState<Tool>(Tool.PEN);
  const [selectedDuration, setSelectedDuration] = useState<NoteDuration>(NoteDuration.QUARTER);
  const [selectedDrumPart, setSelectedDrumPart] = useState<DrumPart>(DrumPart.SNARE);
  const [loopRegion, setLoopRegion] = useState<LoopRegion>(null);
  const [loopStartMeasure, setLoopStartMeasure] = useState<number | null>(null);
  
  const [copiedMeasureNotes, setCopiedMeasureNotes] = useState<Note[] | null>(null);
  const [copyStep, setCopyStep] = useState<'copy' | 'paste' | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackCursor, setPlaybackCursor] = useState<PlaybackCursor>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const scheduledSourcesRef = useRef<AudioScheduledSourceNode[]>([]);
  const nextLoopTimeoutRef = useRef<number | undefined>();
  const playbackTimeoutsRef = useRef<number[]>([]);

  // Load partitions from localStorage on initial render
  useEffect(() => {
    try {
      const savedPartitions = localStorage.getItem('drum-partitions');
      if (savedPartitions) {
        const parsedPartitions = JSON.parse(savedPartitions);
        if (Array.isArray(parsedPartitions) && parsedPartitions.length > 0) {
          setPartitions(parsedPartitions);
          setCurrentPartitionId(parsedPartitions[0].id);
        } else {
          createNewPartition();
        }
      } else {
        createNewPartition();
      }
    } catch (error) {
      console.error("Failed to load partitions from localStorage:", error);
      createNewPartition();
    }
  }, []);

  // Save partitions to localStorage whenever they change
  useEffect(() => {
    if (partitions.length > 0) {
      localStorage.setItem('drum-partitions', JSON.stringify(partitions));
    }
  }, [partitions]);

  const currentPartition = useMemo(() => {
    return partitions.find(p => p.id === currentPartitionId) || null;
  }, [partitions, currentPartitionId]);

  const updateCurrentPartition = useCallback((updatedFields: Partial<Partition>) => {
    if (!currentPartitionId) return;
    setPartitions(prev =>
      prev.map(p =>
        p.id === currentPartitionId ? { ...p, ...updatedFields } : p
      )
    );
  }, [currentPartitionId]);

  const createNewPartition = () => {
    const newPartition: Partition = {
      id: crypto.randomUUID(),
      name: `New Score ${partitions.length + 1}`,
      notes: [],
      timeSignature: { top: 4, bottom: 4 },
      tempo: 120,
    };
    setPartitions(prev => [...prev, newPartition]);
    setCurrentPartitionId(newPartition.id);
  };

  const handleDeletePartition = (idToDelete: string) => {
    if (partitions.length <= 1) {
      alert("You cannot delete the last partition.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this partition?")) {
      const newPartitions = partitions.filter(p => p.id !== idToDelete);
      setPartitions(newPartitions);
      if (currentPartitionId === idToDelete) {
        setCurrentPartitionId(newPartitions[0]?.id || null);
      }
    }
  };

  const handleRenamePartition = (newName: string) => {
    updateCurrentPartition({ name: newName });
  };

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    setPlaybackCursor(null);
    if (nextLoopTimeoutRef.current) {
      clearTimeout(nextLoopTimeoutRef.current);
      nextLoopTimeoutRef.current = undefined;
    }
    playbackTimeoutsRef.current.forEach(clearTimeout);
    playbackTimeoutsRef.current = [];
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;
    scheduledSourcesRef.current = [];
  }, []);

  useEffect(() => {
    return () => stopPlayback();
  }, [stopPlayback]);

  const handleAddNote = useCallback((measure: number, beat: number, part: DrumPart) => {
    if (!currentPartition) return;
    if (selectedTool !== Tool.PEN) return;

    const { notes, timeSignature } = currentPartition;
    const noteToReplace = notes.find(n => n.measure === measure && n.beat === beat && n.part === part);
    if (noteToReplace && noteToReplace.duration === selectedDuration) return;

    const voice = DRUM_PART_VOICE[part];
    const measureCapacity = timeSignature.top / timeSignature.bottom;
    const newNoteValue = NOTE_TYPE_TO_FRACTIONAL_VALUE[selectedDuration];
    const valueOfOtherNotes = notes
      .filter(n => n.measure === measure && n.voice === voice && n.id !== noteToReplace?.id)
      .reduce((sum, note) => sum + NOTE_TYPE_TO_FRACTIONAL_VALUE[note.duration], 0);

    if (valueOfOtherNotes + newNoteValue > measureCapacity + 1e-6) {
      console.warn(`Cannot add note: exceeds measure capacity for voice ${voice}.`);
      return;
    }

    const newNote: Note = {
      id: crypto.randomUUID(),
      part,
      duration: selectedDuration,
      beat,
      measure,
      stemDirection: voice === 1 ? 'up' : 'down',
      voice,
    };

    const notesWithoutReplaced = noteToReplace ? notes.filter(n => n.id !== noteToReplace.id) : notes;
    const newNotes = [...notesWithoutReplaced, newNote].sort((a, b) => a.measure - b.measure || a.beat - b.beat);
    updateCurrentPartition({ notes: newNotes });
  }, [selectedTool, selectedDuration, currentPartition, updateCurrentPartition]);

  const handleNoteClick = useCallback((noteId: string) => {
    if (selectedTool === Tool.ERASER && currentPartition) {
      const newNotes = currentPartition.notes.filter(note => note.id !== noteId);
      updateCurrentPartition({ notes: newNotes });
    }
  }, [selectedTool, currentPartition, updateCurrentPartition]);

  const handleTimeSignatureChange = (newTimeSignature: TimeSignature) => {
    if (currentPartition?.notes.length > 0) {
      if (window.confirm("Changing the time signature will clear all notes in this partition. Are you sure?")) {
        updateCurrentPartition({ notes: [], timeSignature: newTimeSignature });
        setLoopRegion(null);
      } else {
        return;
      }
    } else {
      updateCurrentPartition({ timeSignature: newTimeSignature });
    }
  };

  const handleTempoChange = (newTempo: number) => {
    updateCurrentPartition({ tempo: newTempo });
  };

  const handleLoopButtonClick = () => {
    if (loopRegion || selectedTool === Tool.LOOP) {
      setLoopRegion(null);
      setLoopStartMeasure(null);
      setSelectedTool(Tool.PEN);
    } else {
      setSelectedTool(Tool.LOOP);
    }
  };
  
  const handleToolSelect = (tool: Tool) => {
    if (tool === Tool.COPY) {
      setSelectedTool(Tool.COPY);
      setCopyStep('copy');
      setLoopRegion(null); // Disable other modes
      setLoopStartMeasure(null);
    } else {
      setSelectedTool(tool);
      setCopyStep(null);
      setCopiedMeasureNotes(null);
    }
  };

  const handleMeasureClick = (measureIndex: number) => {
    if (selectedTool === Tool.LOOP) {
      if (loopStartMeasure === null) {
        setLoopStartMeasure(measureIndex);
      } else {
        const start = Math.min(loopStartMeasure, measureIndex);
        const end = Math.max(loopStartMeasure, measureIndex);
        setLoopRegion({ startMeasure: start, endMeasure: end });
        setLoopStartMeasure(null);
        setSelectedTool(Tool.PEN);
      }
    } else if (selectedTool === Tool.COPY && currentPartition) {
      if (copyStep === 'copy') {
        const notesToCopy = currentPartition.notes.filter(n => n.measure === measureIndex);
        setCopiedMeasureNotes(notesToCopy);
        setCopyStep('paste');
      } else if (copyStep === 'paste' && copiedMeasureNotes) {
        // Remove existing notes in the target measure
        const notesOutsideTarget = currentPartition.notes.filter(n => n.measure !== measureIndex);
        // Create new notes for the target measure
        const newNotesForMeasure = copiedMeasureNotes.map(note => ({
          ...note,
          id: crypto.randomUUID(),
          measure: measureIndex,
        }));
        const newNotes = [...notesOutsideTarget, ...newNotesForMeasure].sort((a, b) => a.measure - b.measure || a.beat - b.beat);
        updateCurrentPartition({ notes: newNotes });
        // Reset copy state
        setCopyStep(null);
        setCopiedMeasureNotes(null);
        setSelectedTool(Tool.PEN);
      }
    }
  };

  const handlePlay = useCallback(() => {
    if (!currentPartition) return;
    if (isPlaying) {
      stopPlayback();
      return;
    }

    const { notes, tempo, timeSignature } = currentPartition;
    const notesToPlay = loopRegion
      ? notes.filter(n => n.measure >= loopRegion.startMeasure && n.measure <= loopRegion.endMeasure)
      : notes;

    if (notesToPlay.length === 0) return;

    const context = initializeAudio();
    audioContextRef.current = context;
    setIsPlaying(true);

    const performanceStartTime = performance.now();
    const audioStartTime = context.currentTime + 0.1;
    const clockDelta = performanceStartTime - (audioStartTime * 1000);

    scheduledSourcesRef.current = [];
    playbackTimeoutsRef.current = [];

    const scheduleLoop = (loopAudioStartTime: number) => {
      scheduledSourcesRef.current.forEach(source => { try { source.stop(0); } catch (e) { /* Ignore */ } });
      scheduledSourcesRef.current = [];

      const secondsPerBeat = 60 / tempo * (4 / timeSignature.bottom);
      const beatsPerMeasure = timeSignature.top;
      const startMeasure = loopRegion ? loopRegion.startMeasure : 0;
      const currentLoopTimeouts: number[] = [];

      const notesByTime: { [key: string]: Note[] } = {};
      notesToPlay.forEach(note => {
        const timeKey = `${note.measure}-${note.beat}`;
        if (!notesByTime[timeKey]) notesByTime[timeKey] = [];
        notesByTime[timeKey].push(note);
      });

      Object.values(notesByTime).forEach(chord => {
        const firstNote = chord[0];
        const noteBeatRelativeToStart = (firstNote.measure - startMeasure) * beatsPerMeasure + firstNote.beat;
        const noteTimeInSeconds = noteBeatRelativeToStart * secondsPerBeat;
        const scheduledAudioTime = loopAudioStartTime + noteTimeInSeconds;

        if (scheduledAudioTime > context.currentTime) {
          chord.forEach(note => {
            const source = playSoundForPart(context, note.part, scheduledAudioTime);
            if (source) scheduledSourcesRef.current.push(...(Array.isArray(source) ? source : [source]));
          });
        }

        const scheduledPerformanceTime = (scheduledAudioTime * 1000) + clockDelta;
        const delay = Math.max(0, scheduledPerformanceTime - performance.now());

        const timeoutId = setTimeout(() => {
          const lineIndex = Math.floor(firstNote.measure / MEASURES_PER_LINE);
          const lineYOffset = lineIndex * (STAFF_HEIGHT + STAFF_VERTICAL_GAP);
          const measuresStartX = STAFF_X_OFFSET + CLEF_WIDTH + TIME_SIGNATURE_WIDTH;
          const beatWidth = (MEASURE_WIDTH - MEASURE_PADDING_HORIZONTAL * 2) / beatsPerMeasure;
          const x = measuresStartX + (firstNote.measure % MEASURES_PER_LINE) * MEASURE_WIDTH + MEASURE_PADDING_HORIZONTAL + firstNote.beat * beatWidth;
          const y = lineYOffset + STAFF_Y_OFFSET - (STAFF_LINE_GAP * 2);
          setPlaybackCursor({ x, y });
        }, delay);
        playbackTimeoutsRef.current.push(timeoutId);
        currentLoopTimeouts.push(timeoutId);
      });

      const endMeasure = loopRegion ? loopRegion.endMeasure : NUM_MEASURES - 1;
      const totalDurationInBeats = (endMeasure - startMeasure + 1) * beatsPerMeasure;
      const totalDurationInSeconds = totalDurationInBeats * secondsPerBeat;

      if (loopRegion) {
        const nextLoopAudioStartTime = loopAudioStartTime + totalDurationInSeconds;
        const nextLoopPerformanceTime = (nextLoopAudioStartTime * 1000) + clockDelta;
        const delayForNextLoop = Math.max(0, nextLoopPerformanceTime - performance.now() - 50);

        nextLoopTimeoutRef.current = setTimeout(() => {
          playbackTimeoutsRef.current = playbackTimeoutsRef.current.filter(id => !currentLoopTimeouts.includes(id));
          scheduleLoop(nextLoopAudioStartTime);
        }, delayForNextLoop);
      } else {
        const endPerformanceTime = ((loopAudioStartTime + totalDurationInSeconds) * 1000) + clockDelta;
        const endDelay = Math.max(0, endPerformanceTime - performance.now());
        const endTimeoutId = setTimeout(stopPlayback, endDelay);
        playbackTimeoutsRef.current.push(endTimeoutId);
      }
    };

    scheduleLoop(audioStartTime);
  }, [currentPartition, loopRegion, isPlaying, stopPlayback]);

  const handleSave = () => {
    const jsonString = JSON.stringify(partitions, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'drum-scores.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') throw new Error("File is not readable");
        const loadedData = JSON.parse(result);

        if (Array.isArray(loadedData) && loadedData.every(p => p.id && p.name && p.notes && p.timeSignature && p.tempo)) {
          setPartitions(loadedData);
          setCurrentPartitionId(loadedData[0]?.id || null);
        } else {
          throw new Error("Invalid file format");
        }
      } catch (error) {
        console.error("Failed to load or parse file:", error);
        alert("Error: Could not load scores. The file might be corrupted or in the wrong format.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleExportPdf = () => window.print();

  if (!currentPartition) {
    return <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col items-center p-4 pt-48 font-sans print:p-0 print:pt-12">
      <style>{`
        @media print {
          body { background-color: #fff; }
          .no-print { display: none; }
          main { max-width: 100%; padding: 0; margin: 0; }
          .print-container { width: 100%; transform: scale(0.95); transform-origin: top left; }
        }
      `}</style>
      <Toolbar
        className="no-print"
        partitions={partitions}
        currentPartitionId={currentPartitionId}
        onSelectPartition={setCurrentPartitionId}
        onCreatePartition={createNewPartition}
        onDeletePartition={handleDeletePartition}
        onRenamePartition={handleRenamePartition}
        selectedTool={selectedTool}
        setSelectedTool={handleToolSelect}
        selectedDuration={selectedDuration}
        setSelectedDuration={setSelectedDuration}
        selectedDrumPart={selectedDrumPart}
        setSelectedDrumPart={setSelectedDrumPart}
        isPlaying={isPlaying}
        onPlay={handlePlay}
        onStop={stopPlayback}
        tempo={currentPartition.tempo}
        onTempoChange={handleTempoChange}
        timeSignature={currentPartition.timeSignature}
        onTimeSignatureChange={handleTimeSignatureChange}
        loopRegion={loopRegion}
        onLoopButtonClick={handleLoopButtonClick}
        onSave={handleSave}
        onLoad={handleLoad}
        onExportPdf={handleExportPdf}
      />
      <main className="w-full max-w-7xl flex-grow flex flex-col items-center print-container">
        <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-100 no-print">{currentPartition.name}</h1>
        <p className="mb-8 text-gray-600 dark:text-gray-400 no-print">
          {copyStep === 'copy' && "Select a measure to copy."}
          {copyStep === 'paste' && "Select a measure to paste to."}
          {copyStep === null && loopRegion && "Playing looped section."}
          {copyStep === null && !loopRegion && selectedTool !== Tool.LOOP && "Set the time signature, add notes, and press play to listen."}
          {selectedTool === Tool.LOOP && !loopStartMeasure && " Click a measure to start a loop."}
          {selectedTool === Tool.LOOP && loopStartMeasure !== null && ` First measure selected (${loopStartMeasure + 1}). Click another measure to end the loop.`}
        </p>
        <Staff
          notes={currentPartition.notes}
          onAddNote={handleAddNote}
          onRemoveNote={handleNoteClick}
          onMeasureClick={handleMeasureClick}
          selectedTool={selectedTool}
          selectedDrumPart={selectedDrumPart}
          selectedDuration={selectedDuration}
          isPlaying={isPlaying}
          playbackCursor={playbackCursor}
          timeSignature={currentPartition.timeSignature}
          loopRegion={loopRegion}
          loopStartMeasure={loopStartMeasure}
        />
      </main>
    </div>
  );
}

export default App;