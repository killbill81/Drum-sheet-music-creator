import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Note, Tool, NoteDuration, DrumPart, TimeSignature, PlaybackCursor, LoopRegion } from './types';
import { Staff } from './components/Staff';
import { Toolbar } from './components/Toolbar';
import { DRUM_PART_VOICE, MEASURE_PADDING_HORIZONTAL, NOTE_TYPE_TO_FRACTIONAL_VALUE, STAFF_HEIGHT, STAFF_VERTICAL_GAP, STAFF_LINE_GAP, DRUM_PART_Y_POSITIONS } from './constants';
import { initializeAudio, playSoundForPart } from './audio';
import { STAFF_X_OFFSET, CLEF_WIDTH, NUM_MEASURES, MEASURE_WIDTH, TIME_SIGNATURE_WIDTH, MEASURES_PER_LINE, STAFF_Y_OFFSET } from './constants';

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool>(Tool.PEN);
  const [selectedDuration, setSelectedDuration] = useState<NoteDuration>(NoteDuration.QUARTER);
  const [selectedDrumPart, setSelectedDrumPart] = useState<DrumPart>(DrumPart.SNARE);
  const [timeSignature, setTimeSignature] = useState<TimeSignature>({ top: 4, bottom: 4 });
  const [loopRegion, setLoopRegion] = useState<LoopRegion>(null);
  const [loopStartMeasure, setLoopStartMeasure] = useState<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [playbackCursor, setPlaybackCursor] = useState<PlaybackCursor>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const scheduledSourcesRef = useRef<AudioScheduledSourceNode[]>([]);
  const nextLoopTimeoutRef = useRef<number | undefined>();
  const playbackTimeoutsRef = useRef<number[]>([]);

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
    if (selectedTool !== Tool.PEN) return;

    const noteToReplace = notes.find(n => n.measure === measure && n.beat === beat && n.part === part);

    if (noteToReplace && noteToReplace.duration === selectedDuration) {
        return;
    }
    
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
    
    setNotes(prevNotes => {
        const notesWithoutReplaced = noteToReplace 
            ? prevNotes.filter(n => n.id !== noteToReplace.id) 
            : prevNotes;
        return [...notesWithoutReplaced, newNote].sort((a,b) => a.measure - b.measure || a.beat - b.beat);
    });

  }, [selectedTool, selectedDuration, notes, timeSignature]);

  const handleNoteClick = useCallback((noteId: string) => {
    if (selectedTool === Tool.ERASER) {
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
    }
  }, [selectedTool]);
  
  const handleTimeSignatureChange = (newTimeSignature: TimeSignature) => {
    if (notes.length > 0) {
      if (window.confirm("Changing the time signature will clear all notes. Are you sure?")) {
        setNotes([]);
        setLoopRegion(null);
      } else {
        return;
      }
    }
    setTimeSignature(newTimeSignature);
  };
  
  const handleLoopButtonClick = () => {
    if (loopRegion) {
      setLoopRegion(null);
      setLoopStartMeasure(null);
      setSelectedTool(Tool.PEN);
    } else {
      setSelectedTool(Tool.LOOP);
    }
  };

  const handleMeasureClick = (measureIndex: number) => {
    if (loopStartMeasure === null) {
      setLoopStartMeasure(measureIndex);
    } else {
      const start = Math.min(loopStartMeasure, measureIndex);
      const end = Math.max(loopStartMeasure, measureIndex);
      setLoopRegion({ startMeasure: start, endMeasure: end });
      setLoopStartMeasure(null);
      setSelectedTool(Tool.PEN);
    }
  };

  const handlePlay = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

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
        const secondsPerBeat = 60 / tempo * (4 / timeSignature.bottom);
        const beatsPerMeasure = timeSignature.top;
        const startMeasure = loopRegion ? loopRegion.startMeasure : 0;
        const currentLoopTimeouts: number[] = [];

        const notesByTime: { [key: string]: Note[] } = {};
        notesToPlay.forEach(note => {
            const timeKey = `${note.measure}-${note.beat}`;
            if(!notesByTime[timeKey]) notesByTime[timeKey] = [];
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

  }, [notes, tempo, timeSignature, loopRegion, isPlaying, stopPlayback]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col items-center p-4 pt-32 font-sans">
      <Toolbar
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
        selectedDuration={selectedDuration}
        setSelectedDuration={setSelectedDuration}
        selectedDrumPart={selectedDrumPart}
        setSelectedDrumPart={setSelectedDrumPart}
        isPlaying={isPlaying}
        onPlay={handlePlay}
        onStop={stopPlayback}
        tempo={tempo}
        onTempoChange={setTempo}
        timeSignature={timeSignature}
        onTimeSignatureChange={handleTimeSignatureChange}
        loopRegion={loopRegion}
        onLoopButtonClick={handleLoopButtonClick}
      />
      <main className="w-full max-w-7xl flex-grow flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-100">Drum Sheet Creator</h1>
        <p className="mb-8 text-gray-600 dark:text-gray-400">
          {loopRegion ? "Playing looped section." : "Set the time signature, add notes, and press play to listen."}
          {selectedTool === Tool.LOOP && !loopStartMeasure && " Click a measure to start a loop."}
          {selectedTool === Tool.LOOP && loopStartMeasure !== null && ` First measure selected (${loopStartMeasure + 1}). Click another measure to end the loop.`}
        </p>
        <Staff
          notes={notes}
          onAddNote={handleAddNote}
          onRemoveNote={handleNoteClick}
          onMeasureClick={handleMeasureClick}
          selectedTool={selectedTool}
          selectedDrumPart={selectedDrumPart}
          selectedDuration={selectedDuration}
          isPlaying={isPlaying}
          playbackCursor={playbackCursor}
          timeSignature={timeSignature}
          loopRegion={loopRegion}
          loopStartMeasure={loopStartMeasure}
        />
      </main>
    </div>
  );
}

export default App;