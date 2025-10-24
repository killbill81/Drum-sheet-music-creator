import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Note, Tool, NoteDuration, DrumPart, TimeSignature, PlaybackCursor, LoopRegion, Partition, Articulation, TextAnnotation } from './types';
import Staff, { StaffClickInfo } from './components/Staff';
import { Toolbar } from './components/Toolbar';
import { DRUM_PART_VOICE, MEASURE_PADDING_HORIZONTAL, DURATION_TO_INTEGER_VALUE, STAFF_HEIGHT, STAFF_VERTICAL_GAP, STAFF_LINE_GAP, DRUM_PART_Y_POSITIONS, MEASURES_PER_LINE, STAFF_Y_OFFSET } from './constants';
import { initializeAudio, playSoundForPart } from './audio';

const App: React.FC = () => {
  const [partitions, setPartitions] = useState<Partition[]>([]);
  const [currentPartitionId, setCurrentPartitionId] = useState<string | null>(null);

  const [selectedTool, setSelectedTool] = useState<Tool>(Tool.PEN);
  const [selectedDuration, setSelectedDuration] = useState<NoteDuration>(NoteDuration.QUARTER);
  const [selectedDrumPart, setSelectedDrumPart] = useState<DrumPart>(DrumPart.SNARE);
  const [selectedArticulation, setSelectedArticulation] = useState<Articulation>(Articulation.NONE);
  const [loopRegion, setLoopRegion] = useState<LoopRegion>(null);
  const [loopStartMeasure, setLoopStartMeasure] = useState<number | null>(null);
  const [deleteStartMeasure, setDeleteStartMeasure] = useState<number | null>(null);
  
  const [copiedMeasureNotes, setCopiedMeasureNotes] = useState<Note[] | null>(null);
  const [copyStep, setCopyStep] = useState<'copy' | 'paste' | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const scheduledSourcesRef = useRef<AudioScheduledSourceNode[]>([]);
  const animationFrameRef = useRef<number>();
  const playbackStartTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);

  const createNewPartition = useCallback(() => {
    const newPartition: Partition = {
      id: crypto.randomUUID(),
      name: `New Score ${partitions.length + 1}`,
      notes: [],
      timeSignature: { top: 4, bottom: 4 },
      tempo: 120,
      numMeasures: 8,
      textAnnotations: [],
    };
    setPartitions(prev => [...prev, newPartition]);
    setCurrentPartitionId(newPartition.id);
  }, [partitions.length]);

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
  }, [createNewPartition]);

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

  const handleAddLine = () => {
    if (!currentPartition) return;
    updateCurrentPartition({ numMeasures: currentPartition.numMeasures + MEASURES_PER_LINE });
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

  const handleDeleteLine = (lineIndex: number) => {
    if (!currentPartition || currentPartition.numMeasures <= MEASURES_PER_LINE) {
      alert("You cannot delete the last line.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this entire line?")) {
      const startMeasure = lineIndex * MEASURES_PER_LINE;
      const endMeasure = startMeasure + MEASURES_PER_LINE - 1;

      const updatedNotes = currentPartition.notes
        .filter(note => note.measure < startMeasure || note.measure > endMeasure)
        .map(note => {
          if (note.measure > endMeasure) {
            return { ...note, measure: note.measure - MEASURES_PER_LINE };
          }
          return note;
        });

      const updatedAnnotations = currentPartition.textAnnotations
        .filter(ann => {
          const annLineIndex = Math.floor((ann.y - STAFF_Y_OFFSET) / (STAFF_HEIGHT + STAFF_VERTICAL_GAP));
          return annLineIndex !== lineIndex;
        })
        .map(ann => {
          const annLineIndex = Math.floor((ann.y - STAFF_Y_OFFSET) / (STAFF_HEIGHT + STAFF_VERTICAL_GAP));
          if (annLineIndex > lineIndex) {
            return { ...ann, y: ann.y - (STAFF_HEIGHT + STAFF_VERTICAL_GAP) };
          }
          return ann;
        });

      const newNumMeasures = currentPartition.numMeasures - MEASURES_PER_LINE;
      updateCurrentPartition({
        notes: updatedNotes,
        textAnnotations: updatedAnnotations,
        numMeasures: newNumMeasures
      });
    }
  };

  const handleDeleteMeasureRange = (start: number, end: number) => {
    if (!currentPartition) return;
    if (window.confirm(`Are you sure you want to delete measures ${start + 1} through ${end + 1}?`)) {
      const measuresToDelete = Array.from({ length: end - start + 1 }, (_, i) => start + i);
      const updatedNotes = currentPartition.notes
        .filter(note => !measuresToDelete.includes(note.measure))
        .map(note => {
          if (note.measure > end) {
            return { ...note, measure: note.measure - measuresToDelete.length };
          }
          return note;
        });

      const updatedAnnotations = currentPartition.textAnnotations.filter(ann => {
        const annLineIndex = Math.floor((ann.y - STAFF_Y_OFFSET) / (STAFF_HEIGHT + STAFF_VERTICAL_GAP));
        const annMeasureInLine = Math.floor(ann.x / 250); // Approximate
        const annMeasureIndex = annLineIndex * MEASURES_PER_LINE + annMeasureInLine;
        return !measuresToDelete.includes(annMeasureIndex);
      });

      const newNumMeasures = currentPartition.numMeasures - measuresToDelete.length;
      updateCurrentPartition({
        notes: updatedNotes,
        textAnnotations: updatedAnnotations,
        numMeasures: newNumMeasures
      });
    }
  };

  const handleUpdateTextAnnotation = (id: string, x: number, y: number) => {
    if (!currentPartition) return;
    const newAnnotations = currentPartition.textAnnotations.map(ann => 
      ann.id === id ? { ...ann, x, y } : ann
    );
    updateCurrentPartition({ textAnnotations: newAnnotations });
  };

  const handleInsertLine = (afterLineIndex: number) => {
    if (!currentPartition) return;

    const measuresToShiftFrom = (afterLineIndex + 1) * MEASURES_PER_LINE;

    const updatedNotes = currentPartition.notes.map(note => {
      if (note.measure >= measuresToShiftFrom) {
        return { ...note, measure: note.measure + MEASURES_PER_LINE };
      }
      return note;
    });

    const updatedAnnotations = currentPartition.textAnnotations.map(ann => {
      const annLineIndex = Math.floor((ann.y - STAFF_Y_OFFSET) / (STAFF_HEIGHT + STAFF_VERTICAL_GAP));
      if (annLineIndex > afterLineIndex) {
        return { ...ann, y: ann.y + STAFF_HEIGHT + STAFF_VERTICAL_GAP };
      }
      return ann;
    });

    const newNumMeasures = currentPartition.numMeasures + MEASURES_PER_LINE;
    updateCurrentPartition({
      notes: updatedNotes,
      textAnnotations: updatedAnnotations,
      numMeasures: newNumMeasures
    });
  };

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    setPlaybackProgress(0);
    pauseTimeRef.current = 0;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    scheduledSourcesRef.current.forEach(source => {
      try {
        source.stop(0);
      } catch (e) {}
    });
    scheduledSourcesRef.current = [];

    if (audioContextRef.current && audioContextRef.current.state === 'running') {
      audioContextRef.current.suspend();
    }
  }, []);

  useEffect(() => {
    return () => stopPlayback();
  }, [stopPlayback]);

  const handleNoteClick = useCallback((noteId: string) => {
    if (selectedTool === Tool.ERASER && currentPartition) {
      const newNotes = currentPartition.notes.filter(note => note.id !== noteId);
      updateCurrentPartition({ notes: newNotes });
    }
  }, [selectedTool, currentPartition, updateCurrentPartition]);

  const handleAnnotationClick = (annotationId: string) => {
    if (selectedTool === Tool.ERASER && currentPartition) {
      const newAnnotations = currentPartition.textAnnotations.filter(ann => ann.id !== annotationId);
      updateCurrentPartition({ textAnnotations: newAnnotations });
    }
  };

  const handleStaffClick = (info: StaffClickInfo) => {
    if (!currentPartition) return;

    if (selectedTool === Tool.PEN) {
      const { notes, timeSignature } = currentPartition;
      const noteToReplace = notes.find(n => n.measure === info.measureIndex && n.beat === info.beat && n.part === selectedDrumPart);
      if (noteToReplace && noteToReplace.duration === selectedDuration) return;

      const voice = DRUM_PART_VOICE[selectedDrumPart];
            const measureCapacity = (timeSignature.top / timeSignature.bottom) * 96; // 96 is the integer value for a whole note
            const newNoteValue = DURATION_TO_INTEGER_VALUE[selectedDuration];
      
            const valueOfOtherNotes = notes
              .filter(n => n.measure === info.measureIndex && n.voice === voice && n.id !== noteToReplace?.id)
              .reduce((sum, note) => sum + DURATION_TO_INTEGER_VALUE[note.duration], 0);
      
            if (valueOfOtherNotes + newNoteValue > measureCapacity) {
        console.warn(`Cannot add note: exceeds measure capacity for voice ${voice}.`);
        return;
      }

      const newNote: Note = {
        id: crypto.randomUUID(),
        part: selectedDrumPart,
        duration: selectedDuration,
        beat: info.beat,
        measure: info.measureIndex,
        stemDirection: voice === 1 ? 'up' : 'down',
        voice,
        articulation: selectedArticulation !== Articulation.NONE ? selectedArticulation : undefined,
      };

      const notesWithoutReplaced = noteToReplace ? notes.filter(n => n.id !== noteToReplace.id) : notes;
      const newNotes = [...notesWithoutReplaced, newNote].sort((a, b) => a.measure - b.measure || a.beat - b.beat);
      updateCurrentPartition({ notes: newNotes });
    } else if (selectedTool === Tool.TEXT) {
      const text = window.prompt("Enter text:");
      if (text) {
        const newAnnotation: TextAnnotation = {
          id: crypto.randomUUID(),
          text,
          x: info.x,
          y: info.y,
        };
        updateCurrentPartition({ textAnnotations: [...currentPartition.textAnnotations, newAnnotation] });
        setSelectedTool(Tool.PEN);
      }
    }
  };

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
      setLoopRegion(null);
      setLoopStartMeasure(null);
      setDeleteStartMeasure(null);
    } else if (tool === Tool.DELETE) {
      setSelectedTool(Tool.DELETE);
      setCopyStep(null);
      setCopiedMeasureNotes(null);
      setLoopRegion(null);
      setLoopStartMeasure(null);
    } else {
      setSelectedTool(tool);
      setCopyStep(null);
      setCopiedMeasureNotes(null);
      setDeleteStartMeasure(null);
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
        const notesOutsideTarget = currentPartition.notes.filter(n => n.measure !== measureIndex);
        const newNotesForMeasure = copiedMeasureNotes.map(note => ({
          ...note,
          id: crypto.randomUUID(),
          measure: measureIndex,
        }));
        const newNotes = [...notesOutsideTarget, ...newNotesForMeasure].sort((a, b) => a.measure - b.measure || a.beat - b.beat);
        updateCurrentPartition({ notes: newNotes });
        setCopyStep(null);
        setCopiedMeasureNotes(null);
        setSelectedTool(Tool.PEN);
      }
    } else if (selectedTool === Tool.DELETE) {
      if (deleteStartMeasure === null) {
        setDeleteStartMeasure(measureIndex);
      } else {
        const start = Math.min(deleteStartMeasure, measureIndex);
        const end = Math.max(deleteStartMeasure, measureIndex);
        handleDeleteMeasureRange(start, end);
        setDeleteStartMeasure(null);
      }
    }
  };

  const handlePlay = useCallback((startTime = 0) => {
    if (!currentPartition) return;

    if (isPlaying) {
      pauseTimeRef.current = audioContextRef.current!.currentTime - playbackStartTimeRef.current;
      audioContextRef.current?.suspend();
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const { notes, tempo, timeSignature, numMeasures } = currentPartition;
    const context = initializeAudio();
    audioContextRef.current = context;

    if (context.state === 'suspended') {
      context.resume();
    }

    const notesToPlay = notes;
    if (notesToPlay.length === 0 && !loopRegion) {
        stopPlayback();
        return;
    }

    setIsPlaying(true);
    const audioContextStartTime = context.currentTime;
    const playbackOffset = pauseTimeRef.current;
    playbackStartTimeRef.current = audioContextStartTime - playbackOffset;
    pauseTimeRef.current = 0;

    scheduledSourcesRef.current.forEach(source => { try { source.stop(0); } catch(e) {} });
    scheduledSourcesRef.current = [];

    const secondsPerBeat = 60 / tempo;
    const beatsPerMeasure = timeSignature.top * (4 / timeSignature.bottom);

    notesToPlay.forEach(note => {
      if (note.measure * beatsPerMeasure + note.beat >= playbackOffset / secondsPerBeat) {
        const scheduledAudioTime = playbackStartTimeRef.current + (note.measure * beatsPerMeasure + note.beat) * secondsPerBeat;
        const source = playSoundForPart(context, note.part, scheduledAudioTime, note.duration, tempo, note.articulation);
        if (source) scheduledSourcesRef.current.push(...(Array.isArray(source) ? source : [source]));
      }
    });

    const animate = () => {
      const elapsedTime = context.currentTime - playbackStartTimeRef.current;
      const totalBeats = numMeasures * beatsPerMeasure;
      const totalDuration = totalBeats * secondsPerBeat;

      let currentProgress = (elapsedTime % totalDuration) / totalDuration;

      if (loopRegion) {
        const loopStartBeat = loopRegion.startMeasure * beatsPerMeasure;
        const loopEndBeat = (loopRegion.endMeasure + 1) * beatsPerMeasure;
        const loopDuration = (loopEndBeat - loopStartBeat) * secondsPerBeat;
        const loopStartTime = loopStartBeat * secondsPerBeat;

        if (elapsedTime >= loopStartTime) {
            const timeInLoop = elapsedTime - loopStartTime;
            const currentProgressInLoop = (timeInLoop % loopDuration) / loopDuration;
            currentProgress = (loopStartBeat * secondsPerBeat + currentProgressInLoop * loopDuration) / totalDuration;
        } else {
            currentProgress = elapsedTime / totalDuration;
        }
      }

      setPlaybackProgress(currentProgress);

      if (elapsedTime >= totalDuration && !loopRegion) {
        stopPlayback();
      } else {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

  }, [currentPartition, isPlaying, stopPlayback, loopRegion]);

  const handleExport = () => {
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

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') throw new Error("File is not readable");
        const loadedData = JSON.parse(result);

        if (Array.isArray(loadedData) && loadedData.every(p => p.id && p.name && p.notes && p.timeSignature && p.tempo && p.numMeasures)) {
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col items-center p-4 pt-48 font-sans print:p-0 print:pt-12 print:bg-transparent">
      <style>{`
        @media print {
          body {
            background-color: #fff;
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none;
          }
          main.print-container {
            max-width: 100%;
            padding: 0 !important;
            margin: 0 !important;
            width: 100%;
            box-sizing: border-box;
            page-break-after: always;
          }
          .print-container:last-child {
            page-break-after: avoid;
          }
          .staff-line-group {
            page-break-inside: avoid;
          }
          svg {
            width: 100%;
            height: auto;
          }
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
        onAddLine={handleAddLine}
        selectedTool={selectedTool}
        setSelectedTool={handleToolSelect}
        selectedDuration={selectedDuration}
        setSelectedDuration={setSelectedDuration}
        selectedArticulation={selectedArticulation}
        setSelectedArticulation={setSelectedArticulation}
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
        onSave={handleExport} // Renamed for clarity
        onLoad={handleImport}   // Renamed for clarity
        onExportPdf={handleExportPdf}
      />
      <main className="w-full px-8 flex-grow flex flex-col items-center print-container">
        <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-100 no-print">{currentPartition.name}</h1>
        <p className="mb-8 text-gray-600 dark:text-gray-400 no-print">
          {copyStep === 'copy' && "Select a measure to copy."}
          {copyStep === 'paste' && "Select a measure to paste to."}
          {selectedTool === Tool.TEXT && "Click on the score to add text."}
          {selectedTool === Tool.DELETE && deleteStartMeasure === null && "Click a measure to start deleting."}
          {selectedTool === Tool.DELETE && deleteStartMeasure !== null && `First measure selected (${deleteStartMeasure + 1}). Click another measure to end deletion.`}
          {copyStep === null && selectedTool !== Tool.TEXT && selectedTool !== Tool.DELETE && loopRegion && "Playing looped section."}
          {copyStep === null && selectedTool !== Tool.TEXT && selectedTool !== Tool.DELETE && !loopRegion && selectedTool !== Tool.LOOP && "Set the time signature, add notes, and press play to listen."}
          {selectedTool === Tool.LOOP && !loopStartMeasure && " Click a measure to start a loop."}
          {selectedTool === Tool.LOOP && loopStartMeasure !== null && ` First measure selected (${loopStartMeasure + 1}). Click another measure to end the loop.`}
        </p>
        <Staff
          notes={currentPartition.notes}
          numMeasures={currentPartition.numMeasures}
          textAnnotations={currentPartition.textAnnotations}
          onStaffClick={handleStaffClick}
          onNoteClick={handleNoteClick}
          onAnnotationClick={handleAnnotationClick}
          onMeasureClick={handleMeasureClick}
          onUpdateTextAnnotation={handleUpdateTextAnnotation}
          onInsertLine={handleInsertLine}
          onDeleteLine={handleDeleteLine}
          selectedTool={selectedTool}
          selectedDrumPart={selectedDrumPart}
          selectedDuration={selectedDuration}
          isPlaying={isPlaying}
          playbackProgress={playbackProgress}
          onPlayFromPosition={handlePlay}
          tempo={currentPartition.tempo}
          timeSignature={currentPartition.timeSignature}
          loopRegion={loopRegion}
          loopStartMeasure={loopStartMeasure}
          deleteStartMeasure={deleteStartMeasure}
        />
      </main>
    </div>
  );
};

export default App;
