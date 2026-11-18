export type SoundCue = 'interface' | 'accepted' | 'rejected' | 'mission' | 'unlock' | 'door';

type Note = {
  frequency: number;
  endFrequency?: number;
  offset: number;
  duration: number;
  gain: number;
  type?: OscillatorType;
};

const cues: Record<SoundCue, readonly Note[]> = {
  interface: [{ frequency: 660, offset: 0, duration: 0.055, gain: 0.045 }],
  accepted: [
    { frequency: 1174.66, offset: 0, duration: 0.035, gain: 0.025, type: 'sine' },
    { frequency: 261.63, offset: 0.012, duration: 0.19, gain: 0.035 },
    { frequency: 523.25, offset: 0.025, duration: 0.15, gain: 0.052 },
    { frequency: 659.25, offset: 0.095, duration: 0.23, gain: 0.052 },
  ],
  rejected: [
    { frequency: 440, endFrequency: 330, offset: 0, duration: 0.19, gain: 0.033, type: 'triangle' },
    { frequency: 880, endFrequency: 660, offset: 0, duration: 0.19, gain: 0.009, type: 'sine' },
    { frequency: 349.23, endFrequency: 261.63, offset: 0.22, duration: 0.22, gain: 0.033, type: 'triangle' },
    { frequency: 698.46, endFrequency: 523.26, offset: 0.22, duration: 0.22, gain: 0.009, type: 'sine' },
  ],
  mission: [
    { frequency: 440, offset: 0, duration: 0.16, gain: 0.05 },
    { frequency: 587.33, offset: 0.12, duration: 0.22, gain: 0.055 },
  ],
  unlock: [
    { frequency: 392, offset: 0, duration: 0.2, gain: 0.06 },
    { frequency: 523.25, offset: 0.1, duration: 0.22, gain: 0.06 },
    { frequency: 659.25, offset: 0.2, duration: 0.27, gain: 0.06 },
    { frequency: 783.99, offset: 0.31, duration: 0.42, gain: 0.055 },
  ],
  door: [
    { frequency: 220, endFrequency: 293.66, offset: 0, duration: 0.12, gain: 0.038, type: 'sine' },
    { frequency: 440, offset: 0.06, duration: 0.08, gain: 0.025, type: 'triangle' },
  ],
};

let context: AudioContext | undefined;
let lastCueAt: number | undefined;
let lastCue: SoundCue | undefined;
let lastUnlockAt: number | undefined;
let unlockUntil = -Infinity;
let generation = 0;
const commonVoices = new Set<OscillatorNode>();
const MIN_CUE_GAP_MS = 65;
const unlockDurationMs = (0.012 + Math.max(...cues.unlock.map((note) => note.offset + note.duration + 0.015))) * 1000;
const clock = () => typeof performance !== 'undefined' ? performance.now() : Date.now();
const common = (cue: SoundCue) => cue === 'interface' || cue === 'accepted' || cue === 'rejected';

/** Plays a short synthesized cue; audio is created lazily and never required for gameplay. */
export function playCue(cue: SoundCue, isEnabled: () => boolean): void {
  try {
    if (!isEnabled() || typeof window === 'undefined') return;
    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) return;

    context ??= new AudioContextConstructor();
    const audio = context;
    if (audio.state === 'closed') {
      context = undefined;
      return;
    }

    const nowMs = clock();
    if (cue === 'unlock') {
      if (nowMs < unlockUntil || (lastUnlockAt !== undefined && nowMs - lastUnlockAt < MIN_CUE_GAP_MS)) return;
      lastUnlockAt = nowMs;
      unlockUntil = nowMs + unlockDurationMs;
      // Invalidate pending common cues and stop voices already scheduled.
      generation++;
      for (const voice of commonVoices) {
        try { voice.stop(audio.currentTime); } catch { /* Already ended. */ }
      }
      commonVoices.clear();
    } else {
      if (nowMs < unlockUntil) return;
      if (lastCueAt !== undefined && nowMs - lastCueAt < MIN_CUE_GAP_MS &&
          !(cue === 'rejected' && lastCue === 'interface')) return;
    }
    lastCueAt = nowMs;
    lastCue = cue;
    const requestGeneration = generation;

    const schedule = (): void => {
      // Mute can change while the browser is resuming its suspended context.
      if (!isEnabled() || audio.state !== 'running') return;
      if (cue !== 'unlock' && requestGeneration !== generation) return;
      if (cue === 'unlock') unlockUntil = clock() + unlockDurationMs;
      const start = audio.currentTime + 0.012;
      for (const note of cues[cue]) {
        const oscillator = audio.createOscillator();
        const envelope = audio.createGain();
        const at = start + note.offset;
        oscillator.type = note.type ?? 'triangle';
        oscillator.frequency.setValueAtTime(note.frequency, at);
        if (note.endFrequency) {
          oscillator.frequency.exponentialRampToValueAtTime(note.endFrequency, at + note.duration);
        }
        envelope.gain.setValueAtTime(0.0001, at);
        envelope.gain.exponentialRampToValueAtTime(note.gain, at + 0.012);
        if (cue === 'rejected') {
          envelope.gain.setValueAtTime(note.gain, at + note.duration - 0.06);
        }
        envelope.gain.exponentialRampToValueAtTime(0.0001, at + note.duration);
        oscillator.connect(envelope);
        envelope.connect(audio.destination);
        if (common(cue)) commonVoices.add(oscillator);
        oscillator.start(at);
        oscillator.stop(at + note.duration + 0.015);
        oscillator.onended = () => {
          commonVoices.delete(oscillator);
          oscillator.disconnect();
          envelope.disconnect();
        };
      }
    };

    if (audio.state === 'running') schedule();
    else void audio.resume().then(schedule).catch(() => {
      // Audio is an enhancement; blocked or unavailable contexts are silently ignored.
    });
  } catch {
    // Ignore browser policy and platform audio failures.
  }
}
