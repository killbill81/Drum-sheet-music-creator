import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Note, Tool, NoteDuration, DrumPart, TimeSignature, PlaybackCursor } from './types';
import { Staff } from './components/Staff';
import { Toolbar } from './components/Toolbar';
import { DRUM_PART_VOICE, MEASURE_PADDING_HORIZONTAL, NOTE_TYPE_TO_FRACTIONAL_VALUE, STAFF_HEIGHT, STAFF_VERTICAL_GAP, STAFF_LINE_GAP } from './constants';
import { initializeAudio, playSoundForPart } from './audio';
import { STAFF_X_OFFSET, CLEF_WIDTH, NUM_MEASURES, MEASURE_WIDTH, TIME_SIGNATURE_WIDTH, MEASURES_PER_LINE, STAFF_Y_OFFSET } from './constants';

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool>(Tool.PEN);
  const [selectedDuration, setSelectedDuration] = useState<NoteDuration>(NoteDuration.QUARTER);
  const [selectedDrumPart, setSelectedDrumPart] = useState<DrumPart>(DrumPart.SNARE);
  const [timeSignature, setTimeSignature] = useState<TimeSignature>({ top: 4, bottom: 4 });

  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [playbackCursor, setPlaybackCursor] = useState<PlaybackCursor>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number>();
  const playbackStartTimeRef = useRef<{ audioTime: number, performanceTime: number } | null>(null);

  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleAddNote = useCallback((measure: number, beat: number, part: DrumPart) => {
    if (selectedTool !== Tool.PEN) return;
    
    const voice = DRUM_PART_VOICE[part];
    const measureCapacity = timeSignature.top / timeSignature.bottom;
    
    // Validate against other notes in the same voice within the same measure
    const notesInMeasureAndVoice = notes.filter(n => n.measure === measure && n.voice === voice);
    const currentMeasureValueInVoice = notesInMeasureAndVoice.reduce((sum, note) => {
        return sum + NOTE_TYPE_TO_FRACTIONAL_VALUE[note.duration];
    }, 0);
    
    const newNoteValue = NOTE_TYPE_TO_FRACTIONAL_VALUE[selectedDuration];

    if (currentMeasureValueInVoice + newNoteValue > measureCapacity + 1e-6) {
      console.warn(`Cannot add note: exceeds measure capacity for voice ${voice}.`);
      return; 
    }

    // Prevent adding the exact same note part at the same time
    const existingNoteAtPosition = notes.find(n => n.measure === measure && n.beat === beat && n.part === part);
    if (existingNoteAtPosition) {
        console.warn("A note for this drum part already exists at this exact time.");
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

    setNotes(prevNotes => [...prevNotes, newNote]);

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
      } else {
        return;
      }
    }
    setTimeSignature(newTimeSignature);
  };

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    setPlaybackCursor(null);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    playbackStartTimeRef.current = null;
    if (audioContextRef.current?.state === 'running') {
      audioContextRef.current.close().then(() => audioContextRef.current = null);
    }
  }, []);

  const animatePlayback = useCallback(() => {
    if (!playbackStartTimeRef.current) return;

    const secondsPerBeat = 60 / tempo * (4 / timeSignature.bottom);
    const elapsedPerformanceTime = (performance.now() - playbackStartTimeRef.current.performanceTime) / 1000;
    const currentBeatAbsolute = elapsedPerformanceTime / secondsPerBeat;
    
    const measureIndex = Math.floor(currentBeatAbsolute / timeSignature.top);
    if (measureIndex >= NUM_MEASURES) {
      stopPlayback();
      return;
    }

    const lineIndex = Math.floor(measureIndex / MEASURES_PER_LINE);
    const measureInLine = measureIndex % MEASURES_PER_LINE;
    const beatInMeasure = currentBeatAbsolute % timeSignature.top;
    
    const beatWidth = (MEASURE_WIDTH - MEASURE_PADDING_HORIZONTAL * 2) / timeSignature.top;
    const measuresStartX = STAFF_X_OFFSET + CLEF_WIDTH + TIME_SIGNATURE_WIDTH;
    const lineYOffset = lineIndex * (STAFF_HEIGHT + STAFF_VERTICAL_GAP);
    
    const newX = measuresStartX + (measureInLine * MEASURE_WIDTH) + MEASURE_PADDING_HORIZONTAL + (beatInMeasure * beatWidth);
    const newY1 = lineYOffset + STAFF_Y_OFFSET - STAFF_LINE_GAP;
    const newY2 = lineYOffset + STAFF_Y_OFFSET + 5 * STAFF_LINE_GAP;

    setPlaybackCursor({ x: newX, y1: newY1, y2: newY2 });
    
    animationFrameRef.current = requestAnimationFrame(animatePlayback);
  }, [tempo, stopPlayback, timeSignature]);

  const handlePlay = useCallback(() => {
    if (notes.length === 0) return;
    audioContextRef.current = initializeAudio();
    const context = audioContextRef.current;
    if (!context) return;

    setIsPlaying(true);
    const audioStartTime = context.currentTime + 0.1;
    playbackStartTimeRef.current = { audioTime: audioStartTime, performanceTime: performance.now() };

    const secondsPerBeat = 60 / tempo * (4 / timeSignature.bottom);
    
    notes.forEach(note => {
      const noteTimeInBeats = note.measure * timeSignature.top + note.beat;
      const noteTimeInSeconds = noteTimeInBeats * secondsPerBeat;
      playSoundForPart(context, note.part, audioStartTime + noteTimeInSeconds);
    });

    animationFrameRef.current = requestAnimationFrame(animatePlayback);
  }, [notes, tempo, animatePlayback, timeSignature]);

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
      />
      <main className="w-full max-w-7xl flex-grow flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-100">Drum Sheet Creator</h1>
        <p className="mb-8 text-gray-600 dark:text-gray-400">
          Set the time signature, add notes, and press play to listen.
        </p>
        <Staff
          notes={notes}
          onAddNote={handleAddNote}
          onRemoveNote={handleNoteClick}
          selectedDrumPart={selectedDrumPart}
          selectedDuration={selectedDuration}
          isPlaying={isPlaying}
          playbackCursor={playbackCursor}
          timeSignature={timeSignature}
        />
      </main>
    </div>
  );
}

export default App;