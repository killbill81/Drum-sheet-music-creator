import { DrumPart, NoteDuration, Articulation } from './types';
import { NOTE_TYPE_TO_FRACTIONAL_VALUE } from './constants';

let audioContext: AudioContext | null = null;

export const initializeAudio = (): AudioContext => {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

const createNoiseBuffer = (context: AudioContext): AudioBuffer => {
    const bufferSize = context.sampleRate;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    return buffer;
};

const playKick = (context: AudioContext, time: number): AudioScheduledSourceNode => {
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.connect(gain);
  gain.connect(context.destination);

  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
  gain.gain.setValueAtTime(1, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

  osc.start(time);
  osc.stop(time + 0.2);
  return osc;
};

const playSnare = (context: AudioContext, time: number): AudioScheduledSourceNode[] => {
    const noise = context.createBufferSource();
    noise.buffer = createNoiseBuffer(context);
    const noiseFilter = context.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    noise.connect(noiseFilter);

    const noiseEnvelope = context.createGain();
    noiseFilter.connect(noiseEnvelope);
    noiseEnvelope.connect(context.destination);

    const osc = context.createOscillator();
    osc.type = 'triangle';
    const oscEnvelope = context.createGain();
    osc.connect(oscEnvelope);
    oscEnvelope.connect(context.destination);
    
    noiseEnvelope.gain.setValueAtTime(1, time);
    noiseEnvelope.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    noise.start(time)
    noise.stop(time + 0.2)

    osc.frequency.setValueAtTime(100, time);
    oscEnvelope.gain.setValueAtTime(0.7, time);
    oscEnvelope.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    osc.start(time)
    osc.stop(time + 0.1)
    return [noise, osc];
};

const playHiHat = (context: AudioContext, time: number): AudioScheduledSourceNode => {
    const noise = context.createBufferSource();
    noise.buffer = createNoiseBuffer(context);
    const bandpass = context.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 10000;
    bandpass.Q.value = 1.5;
    noise.connect(bandpass);

    const highpass = context.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.setValueAtTime(7000, time);
    bandpass.connect(highpass);

    const envelope = context.createGain();
    highpass.connect(envelope);
    envelope.connect(context.destination);

    envelope.gain.setValueAtTime(1, time);
    envelope.gain.exponentialRampToValueAtTime(0.00001, time + 0.05);
    noise.start(time);
    noise.stop(time + 0.05);
    return noise;
};

const playTom = (context: AudioContext, time: number, frequency: number): AudioScheduledSourceNode => {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.connect(gain);
    gain.connect(context.destination);

    osc.frequency.setValueAtTime(frequency, time);
    osc.frequency.exponentialRampToValueAtTime(frequency * 0.8, time + 0.15);
    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.start(time);
    osc.stop(time + 0.2);
    return osc;
}

const playCymbal = (context: AudioContext, time: number): AudioScheduledSourceNode => {
    const noise = context.createBufferSource();
    noise.buffer = createNoiseBuffer(context);
    const bandpass = context.createBiquadFilter();
    bandpass.type = 'highpass';
    bandpass.frequency.value = 500;
    noise.connect(bandpass);

    const envelope = context.createGain();
    bandpass.connect(envelope);
    envelope.connect(context.destination);

    envelope.gain.setValueAtTime(0.5, time);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + 1.5);
    noise.start(time);
    noise.stop(time + 1.5);
    return noise;
}

export const playSoundForPart = (
    context: AudioContext, 
    part: DrumPart, 
    time: number, 
    duration: NoteDuration, 
    tempo: number,
    articulation?: Articulation
): AudioScheduledSourceNode | AudioScheduledSourceNode[] | null => {
  if (articulation === Articulation.FLAM) {
    const graceNoteTime = time - 0.03;
    const mainNote = playSnare(context, time);
    const graceNote = playSnare(context, graceNoteTime);
    return [...mainNote, ...graceNote];
  }

  if (articulation === Articulation.BUZZ_ROLL) {
    const secondsPerBeat = 60 / tempo;
    const noteDurationInSeconds = NOTE_TYPE_TO_FRACTIONAL_VALUE[duration] * 4 * secondsPerBeat;
    const rollSpeed = 0.05; // Time between each hit in the roll
    const sources: AudioScheduledSourceNode[] = [];
    for (let i = 0; i < noteDurationInSeconds; i += rollSpeed) {
        const rollTime = time + i;
        const rollSources = playSnare(context, rollTime);
        sources.push(...rollSources);
    }
    return sources;
  }

  switch (part) {
    case DrumPart.BASS_DRUM:
      return playKick(context, time);
    case DrumPart.SNARE:
      return playSnare(context, time);
    case DrumPart.HI_HAT_CLOSED:
    case DrumPart.HI_HAT_OPEN:
    case DrumPart.HI_HAT_PEDAL:
      return playHiHat(context, time);
    case DrumPart.HIGH_TOM:
      return playTom(context, time, 300);
    case DrumPart.MID_TOM:
      return playTom(context, time, 240);
    case DrumPart.FLOOR_TOM:
      return playTom(context, time, 180);
    case DrumPart.CRASH_CYMBAL:
    case DrumPart.RIDE_CYMBAL:
      return playCymbal(context, time);
    case DrumPart.SIDESTICK:
        return playTom(context, time, 1000); // High-pitched click
    default:
      return null;
  }
};