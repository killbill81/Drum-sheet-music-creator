import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Note, Tool, NoteDuration, DrumPart, TimeSignature, PlaybackCursor, LoopRegion, Partition, Articulation, TextAnnotation } from './types';
import Staff, { StaffClickInfo } from './components/Staff';
import { Toolbar } from './components/Toolbar';
import { DRUM_PART_VOICE, MEASURE_PADDING_HORIZONTAL, DURATION_TO_INTEGER_VALUE, STAFF_HEIGHT, STAFF_VERTICAL_GAP, STAFF_LINE_GAP, DRUM_PART_Y_POSITIONS, MEASURES_PER_LINE, STAFF_Y_OFFSET } from './constants';
import { initializeAudio, playSoundForPart } from './audio';
import { jsPDF } from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';
import MidiWriter from 'midi-writer-js';

const App: React.FC = () => {
  const [partitions, setPartitions] = useState<Partition[]>([]);
  const [currentPartitionId, setCurrentPartitionId] = useState<string | null>(null);

  const [selectedTool, setSelectedTool] = useState<Tool>(Tool.PEN);
  const [selectedDuration, setSelectedDuration] = useState<NoteDuration>(NoteDuration.QUARTER);
  const [selectedDrumPart, setSelectedDrumPart] = useState<DrumPart>(DrumPart.SNARE);
  const [selectedArticulation, setSelectedArticulation] = useState<Articulation>(Articulation.NONE);
  const [selectedFontSize, setSelectedFontSize] = useState<number>(16);
  const [selectedFontWeight, setSelectedFontWeight] = useState<'normal' | 'bold'>('normal');
  const [selectedFontStyle, setSelectedFontStyle] = useState<'normal' | 'italic'>('normal');
  const [loopRegion, setLoopRegion] = useState<LoopRegion>(null);
  const [loopStartMeasure, setLoopStartMeasure] = useState<number | null>(null);
  const [deleteStartMeasure, setDeleteStartMeasure] = useState<number | null>(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);

  const [copiedMeasureNotes, setCopiedMeasureNotes] = useState<Note[] | null>(null);
  const [copyStep, setCopyStep] = useState<'copy' | 'paste' | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState<number | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const scheduledSourcesRef = useRef<AudioScheduledSourceNode[]>([]);
  const animationFrameRef = useRef<number>();
  const playbackStartTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);

  const createNewPartition = useCallback(() => {
    setPartitions(prev => {
      const newPartition: Partition = {
        id: crypto.randomUUID(),
        name: `New Score ${prev.length + 1}`,
        notes: [],
        timeSignature: { top: 4, bottom: 4 },
        tempo: 120,
        numMeasures: 8,
        textAnnotations: [],
      };
      setCurrentPartitionId(newPartition.id);
      return [...prev, newPartition];
    });
  }, []);

  useEffect(() => {
    const init = () => {
      try {
        const savedPartitions = localStorage.getItem('drum-partitions');
        if (savedPartitions) {
          const parsedPartitions = JSON.parse(savedPartitions).map((p: Partition) => ({
            ...p,
            textAnnotations: p.textAnnotations.map(ann => ({
              ...ann,
              fontSize: ann.fontSize || 16,
              fontWeight: ann.fontWeight || 'normal',
              fontStyle: ann.fontStyle || 'normal',
            })),
          }));

          if (Array.isArray(parsedPartitions) && parsedPartitions.length > 0) {
            setPartitions(parsedPartitions);
            setCurrentPartitionId(parsedPartitions[0].id);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to load partitions from localStorage:", error);
      }
      createNewPartition();
    };
    init();
  }, []); // Only run once on mount

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

  useEffect(() => {
    if (partitions.length > 0) {
      localStorage.setItem('drum-partitions', JSON.stringify(partitions));
    }
  }, [partitions]);

  const handleUpdateAnnotationStyle = (style: Partial<TextAnnotation>) => {
    if (style.fontSize) {
      setSelectedFontSize(style.fontSize);
    }
    if (style.fontWeight) {
      setSelectedFontWeight(style.fontWeight);
    }
    if (style.fontStyle) {
      setSelectedFontStyle(style.fontStyle);
    }

    if (selectedAnnotationId && currentPartition) {
      const updatedAnnotations = currentPartition.textAnnotations.map(ann => {
        if (ann.id === selectedAnnotationId) {
          return { ...ann, ...style };
        }
        return ann;
      });
      updateCurrentPartition({ textAnnotations: updatedAnnotations });
    }
  };

  useEffect(() => {
    if (selectedAnnotationId && currentPartition) {
      const annotation = currentPartition.textAnnotations.find(ann => ann.id === selectedAnnotationId);
      if (annotation) {
        setSelectedFontSize(annotation.fontSize || 16);
        setSelectedFontWeight(annotation.fontWeight || 'normal');
        setSelectedFontStyle(annotation.fontStyle || 'normal');
      }
    }
  }, [selectedAnnotationId, currentPartition]);



  const handleAddLine = () => {
    if (!currentPartition) return;
    updateCurrentPartition({ numMeasures: currentPartition.numMeasures + MEASURES_PER_LINE });
  };

  const handleDeletePartition = (idToDelete: string) => {
    if (partitions.length <= 1) {
      alert("Vous ne pouvez pas supprimer la dernière partition.");
      return;
    }
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette partition ?")) {
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
      alert("Vous ne pouvez pas supprimer la dernière ligne.");
      return;
    }

    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette ligne entière ?")) {
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
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer les mesures ${start + 1} à ${end + 1} ?`)) {
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

  const handleUpdateAnnotationText = (annotationId: string, text: string) => {
    if (!currentPartition) return;
    const newAnnotations = currentPartition.textAnnotations.map(ann =>
      ann.id === annotationId ? { ...ann, text } : ann
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

  const handleInsertMeasure = (measureIndex: number) => {
    if (!currentPartition) return;

    const updatedNotes = currentPartition.notes.map(note => {
      if (note.measure >= measureIndex) {
        return { ...note, measure: note.measure + 1 };
      }
      return note;
    });

    const newNumMeasures = currentPartition.numMeasures + 1;
    updateCurrentPartition({
      notes: updatedNotes,
      numMeasures: newNumMeasures
    });
  };

  const handleAddMeasureAtEnd = () => {
    if (!currentPartition) return;
    handleInsertMeasure(currentPartition.numMeasures);
  };

  const handleInsertMeasureInLine = (measureIndex: number) => {
    if (!currentPartition) return;
    handleInsertMeasure(measureIndex);
  };

  const handleDeleteMeasure = (measureIndex: number) => {
    if (!currentPartition) return;
    handleDeleteMeasureRange(measureIndex, measureIndex);
  };

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    setCurrentBeat(null);
    pauseTimeRef.current = 0;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    scheduledSourcesRef.current.forEach(source => {
      try {
        source.stop(0);
      } catch (e) { }
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
    } else {
      setSelectedAnnotationId(annotationId);
      setSelectedTool(Tool.TEXT);
    }
  };

  const handleStaffClick = (info: StaffClickInfo) => {
    if (!currentPartition) return;

    if (selectedTool === Tool.PEN) {
      const { notes, timeSignature } = currentPartition;
      const noteToReplace = notes.find(n => n.measure === info.measureIndex && n.beat === info.beat && n.part === selectedDrumPart);
      if (noteToReplace && noteToReplace.duration === selectedDuration) return;

      const voice = DRUM_PART_VOICE[selectedDrumPart];
      const newNoteDurationInBeats = DURATION_TO_INTEGER_VALUE[selectedDuration] / 24;
      const newNoteStart = info.beat;
      const newNoteEnd = newNoteStart + newNoteDurationInBeats;

      // Limit based on time signature
      const measureCapacityInBeats = 4 * (timeSignature.top / timeSignature.bottom);
      if (newNoteEnd > measureCapacityInBeats + 0.001) { // Add small epsilon for float precision
        console.warn(`Cannot add note: exceeds measure capacity.`);
        return;
      }

      const hasOverlap = notes
        .filter(n => n.measure === info.measureIndex && n.voice === voice && n.id !== noteToReplace?.id)
        .some(n => {
          const existingNoteDurationInBeats = DURATION_TO_INTEGER_VALUE[n.duration] / 24;
          const existingNoteStart = n.beat;
          const existingNoteEnd = existingNoteStart + existingNoteDurationInBeats;
          return newNoteStart < existingNoteEnd && newNoteEnd > existingNoteStart;
        });

      if (hasOverlap) {
        console.warn(`Cannot add note: overlaps with an existing note in the same voice.`);
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
      const text = window.prompt("Entrez le texte :");
      if (text) {
        const newAnnotation: TextAnnotation = {
          id: crypto.randomUUID(),
          text,
          x: info.x,
          y: info.y,
          fontSize: selectedFontSize,
          fontWeight: selectedFontWeight,
          fontStyle: selectedFontStyle,
        };
        updateCurrentPartition({ textAnnotations: [...currentPartition.textAnnotations, newAnnotation] });
        setSelectedTool(Tool.PEN);
      }
    } else if (selectedTool === Tool.ADD_MEASURE) {
      handleInsertMeasure(info.measureIndex);
    }
  };

  const handleTimeSignatureChange = (newTimeSignature: TimeSignature) => {
    if (currentPartition?.notes.length > 0) {
      if (window.confirm("Changer la signature rythmique effacera toutes les notes de cette partition. Êtes-vous sûr ?")) {
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
    } else if (selectedTool === Tool.DELETE_MEASURE) {
      handleDeleteMeasure(measureIndex);
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

    scheduledSourcesRef.current.forEach(source => { try { source.stop(0); } catch (e) { } });
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
      const secondsPerBeat = 60 / tempo;
      const currentBeatValue = elapsedTime / secondsPerBeat;

      const totalBeats = numMeasures * beatsPerMeasure;

      if (loopRegion) {
        const loopStartBeat = loopRegion.startMeasure * beatsPerMeasure;
        const loopEndBeat = (loopRegion.endMeasure + 1) * beatsPerMeasure;
        const loopDurationBeats = loopEndBeat - loopStartBeat;

        if (currentBeatValue >= loopStartBeat) {
          const beatInLoop = (currentBeatValue - loopStartBeat) % loopDurationBeats;
          setCurrentBeat(loopStartBeat + beatInLoop);
        } else {
          setCurrentBeat(currentBeatValue);
        }
      } else {
        setCurrentBeat(currentBeatValue);
      }

      if (elapsedTime >= totalBeats * secondsPerBeat && !loopRegion) {
        stopPlayback();
      } else {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

  }, [currentPartition, isPlaying, stopPlayback, loopRegion]);

  const handleExport = () => {
    if (!currentPartition) return;

    const jsonString = JSON.stringify(currentPartition, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentPartition.name}.json`;
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
        if (typeof result !== 'string') throw new Error("Le fichier n'est pas lisible");
        const loadedData = JSON.parse(result);

        if (Array.isArray(loadedData)) { // Handle array of partitions (old format)
          if (loadedData.every(p => p.id && p.name && p.notes && p.timeSignature && p.tempo && p.numMeasures)) {
            setPartitions(loadedData);
            setCurrentPartitionId(loadedData[0]?.id || null);
          } else {
            throw new Error("Format de fichier invalide");
          }
        } else if (loadedData.id && loadedData.name) { // Handle single partition
          const newPartition = loadedData as Partition;
          // Check for ID conflict
          if (partitions.some(p => p.id === newPartition.id)) {
            if (window.confirm("Une partition avec le même ID existe déjà. Voulez-vous l'écraser ?")) {
              setPartitions(partitions.map(p => p.id === newPartition.id ? newPartition : p));
            } else {
              // If user cancels, generate a new ID
              newPartition.id = crypto.randomUUID();
              setPartitions([...partitions, newPartition]);
            }
          } else {
            setPartitions([...partitions, newPartition]);
          }
          setCurrentPartitionId(newPartition.id);
        } else {
          throw new Error("Format de fichier invalide");
        }
      } catch (error) {
        console.error("Failed to load or parse file:", error);
        alert("Erreur : Impossible de charger les partitions. Le fichier est peut-être corrompu ou au mauvais format.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleExportPdf = async () => {
    if (!currentPartition) return;

    const svgElement = document.querySelector('svg');
    if (!svgElement) {
      alert("SVG non trouvé");
      return;
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [svgElement.width.baseVal.value + 40, svgElement.height.baseVal.value + 40]
    });

    try {
      await svg2pdf(svgElement, doc, {
        x: 20,
        y: 20,
        width: svgElement.width.baseVal.value,
        height: svgElement.height.baseVal.value
      });
      doc.save(`${currentPartition.name}.pdf`);
    } catch (e) {
      console.error("PDF Export failed:", e);
      alert("L'export PDF a échoué. Essai avec l'impression système...");
      window.print();
    }
  };

  const handleExportMidi = () => {
    if (!currentPartition) return;

    const track = new MidiWriter.Track();
    track.setTempo(currentPartition.tempo);
    track.addTrackName(currentPartition.name);

    // Map DrumPart to MIDI pitches
    const MIDI_MAPPING: Record<DrumPart, number> = {
      [DrumPart.BASS_DRUM]: 36,
      [DrumPart.SNARE]: 38,
      [DrumPart.SIDESTICK]: 37,
      [DrumPart.HIGH_TOM]: 48,
      [DrumPart.MID_TOM]: 45,
      [DrumPart.FLOOR_TOM]: 43,
      [DrumPart.HI_HAT_CLOSED]: 42,
      [DrumPart.HI_HAT_OPEN]: 46,
      [DrumPart.HI_HAT_PEDAL]: 44,
      [DrumPart.CRASH_CYMBAL]: 49,
      [DrumPart.RIDE_CYMBAL]: 51,
      [DrumPart.REST]: 0,
    };

    // Group notes by measure and beat to create NoteEvents (for chords)
    const beatsMap = new Map<string, Note[]>();
    currentPartition.notes.forEach(note => {
      if (note.part === DrumPart.REST) return;
      const key = `${note.measure}-${note.beat}`;
      if (!beatsMap.has(key)) beatsMap.set(key, []);
      beatsMap.get(key)!.push(note);
    });

    const sortedBeats = Array.from(beatsMap.keys()).sort((a, b) => {
      const [am, ab] = a.split('-').map(Number);
      const [bm, bb] = b.split('-').map(Number);
      return am - bm || ab - bb;
    });

    let lastTick = 0;
    const ticksPerBeat = 128; // MIDI-Writer default

    sortedBeats.forEach(key => {
      const notesAtBeat = beatsMap.get(key)!;
      const [measure, beat] = key.split('-').map(Number);
      const absoluteBeat = measure * currentPartition.timeSignature.top + beat;
      const currentTick = absoluteBeat * ticksPerBeat;
      const waitTicks = Math.max(0, currentTick - lastTick);

      const event = new MidiWriter.NoteEvent({
        pitch: notesAtBeat.map(n => MIDI_MAPPING[n.part]),
        duration: DURATION_MAP_MIDI[notesAtBeat[0].duration] || '4',
        velocity: notesAtBeat[0].articulation === Articulation.ACCENT ? 120 : 80,
        wait: `T${waitTicks}`
      });

      track.addEvent(event);
      lastTick = currentTick + (DURATION_TO_INTEGER_VALUE[notesAtBeat[0].duration] / 24) * ticksPerBeat;
    });

    const writer = new MidiWriter.Writer(track);
    const data = writer.buildFile();
    const blob = new Blob([data as any], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentPartition.name}.mid`;
    document.body.appendChild(a);
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const DURATION_MAP_MIDI: Record<NoteDuration, string> = {
    [NoteDuration.WHOLE]: '1',
    [NoteDuration.HALF]: '2',
    [NoteDuration.QUARTER]: '4',
    [NoteDuration.EIGHTH]: '8',
    [NoteDuration.SIXTEENTH]: '16',
    [NoteDuration.THIRTY_SECOND]: '32',
    [NoteDuration.SIXTY_FOURTH]: '64',
    [NoteDuration.EIGHTH_TRIPLET]: '8t',
  };

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
        onInsertLine={handleInsertLine}
        onDeleteLine={handleDeleteLine}
        onAddMeasureAtEnd={handleAddMeasureAtEnd}
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
        selectedFontSize={selectedFontSize}
        selectedFontWeight={selectedFontWeight}
        selectedFontStyle={selectedFontStyle}
        onUpdateAnnotationStyle={handleUpdateAnnotationStyle}
      />
      <main className="w-full px-8 flex-grow flex flex-col items-center print-container">
        <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-100 no-print">{currentPartition.name}</h1>
        <p className="mb-8 text-gray-600 dark:text-gray-400 no-print">
          {copyStep === 'copy' && "Select a measure to copy."}
          {copyStep === 'paste' && "Select a measure to paste to."}
          {selectedTool === Tool.TEXT && "Click on the score to add text."}
          {selectedTool === Tool.DELETE && deleteStartMeasure === null && "Click a measure to start deleting."}
          {selectedTool === Tool.DELETE && deleteStartMeasure !== null && `First measure selected (${deleteStartMeasure + 1}). Click another measure to end deletion.`}
          {selectedTool === Tool.ADD_MEASURE && "Click on the score to add a measure."}
          {selectedTool === Tool.DELETE_MEASURE && "Click on a measure to delete it."}
          {copyStep === null && selectedTool !== Tool.TEXT && selectedTool !== Tool.DELETE && selectedTool !== Tool.ADD_MEASURE && selectedTool !== Tool.DELETE_MEASURE && loopRegion && "Playing looped section."}
          {copyStep === null && selectedTool !== Tool.TEXT && selectedTool !== Tool.DELETE && selectedTool !== Tool.ADD_MEASURE && selectedTool !== Tool.DELETE_MEASURE && !loopRegion && selectedTool !== Tool.LOOP && "Set the time signature, add notes, and press play to listen."}          {selectedTool === Tool.LOOP && !loopStartMeasure && " Click a measure to start a loop."}
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
          onUpdateAnnotationText={handleUpdateAnnotationText}
          onInsertLine={handleInsertLine}
          onDeleteLine={handleDeleteLine}
          onInsertMeasure={handleInsertMeasureInLine}
          onDeleteMeasure={handleDeleteMeasure}
          selectedTool={selectedTool}
          selectedDrumPart={selectedDrumPart}
          selectedDuration={selectedDuration}
          isPlaying={isPlaying}
          currentBeat={currentBeat}
          onPlayFromPosition={handlePlay}
          tempo={currentPartition.tempo}
          timeSignature={currentPartition.timeSignature}
          loopRegion={loopRegion}
          loopStartMeasure={loopStartMeasure}
          deleteStartMeasure={deleteStartMeasure}
          selectedAnnotationId={selectedAnnotationId}
        />
      </main>
    </div>
  );
};

export default App;
