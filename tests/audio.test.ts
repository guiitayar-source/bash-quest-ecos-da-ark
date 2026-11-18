import assert from 'node:assert/strict';
import { test } from 'node:test';
import { playCue } from '../src/audio.ts';

test('prioridade, antirrepetição, timbres e mute respeitam o relógio e a retomada', async () => {
  const oscillators: Array<{
    type: string;
    frequencies: Array<[string, number, number]>;
    gains: Array<[string, number, number]>;
    started: number[];
    stopped: number[];
  }> = [];
  let clock = 10;
  let contexts = 0;
  let audio: FakeAudioContext;
  const resumptions: Array<() => void> = [];

  class FakeAudioContext {
    state: AudioContextState = 'running';
    currentTime = 0;
    destination = {};
    constructor() { contexts++; audio = this; }
    createOscillator() {
      const record = { type: '', frequencies: [] as Array<[string, number, number]>, gains: [] as Array<[string, number, number]>, started: [] as number[], stopped: [] as number[] };
      oscillators.push(record);
      return {
        set type(value: string) { record.type = value; },
        frequency: {
          setValueAtTime: (value: number, at: number) => record.frequencies.push(['set', value, at]),
          exponentialRampToValueAtTime: (value: number, at: number) => record.frequencies.push(['ramp', value, at]),
        },
        connect: () => undefined,
        start: (at: number) => record.started.push(at),
        stop: (at: number) => record.stopped.push(at),
        disconnect: () => undefined,
        onended: null as (() => void) | null,
      };
    }
    createGain() {
      const record = oscillators.at(-1)!;
      return {
        gain: {
          setValueAtTime: (value: number, at: number) => record.gains.push(['set', value, at]),
          exponentialRampToValueAtTime: (value: number, at: number) => record.gains.push(['ramp', value, at]),
        },
        connect: () => undefined,
        disconnect: () => undefined,
      };
    }
    resume() { return new Promise<void>((resolve) => resumptions.push(resolve)); }
  }

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { AudioContext: FakeAudioContext },
  });
  Object.defineProperty(globalThis, 'performance', {
    configurable: true,
    value: { now: () => clock },
  });

  try {
    playCue('accepted', () => false);
    assert.equal(contexts, 0, 'mute não deve sequer criar contexto');
    playCue('accepted', () => true);
    assert.equal(oscillators.length, 4, 'primeiro cue antes de 65 ms inclui ataque, corpo e resolução');
    assert.ok(oscillators.every((oscillator) => oscillator.started.length === 1));
    assert.ok(oscillators.some((oscillator) => oscillator.type === 'sine'));

    clock += 100;
    playCue('rejected', () => true);
    const rejected = oscillators.slice(-4);
    assert.deepEqual(rejected.map((voice) => voice.type), ['triangle', 'sine', 'triangle', 'sine']);
    assert.ok(rejected.every((voice) => voice.frequencies[1][1] < voice.frequencies[0][1]));
    assert.ok(rejected.every((voice) => voice.gains.some(([kind, gain, at]) => kind === 'set' && gain > 0.008 && at > voice.started[0] + 0.1)));
    assert.ok(rejected[2].started[0] - rejected[0].started[0] >= 0.21);
    clock += 100;
    playCue('interface', () => true);
    clock++;
    const beforeRejected = oscillators.length;
    playCue('rejected', () => true);
    assert.equal(oscillators.length, beforeRejected + 4, 'interface próxima não suprime negativa');
    clock++;
    playCue('interface', () => true);
    assert.equal(oscillators.length, beforeRejected + 4, 'interface posterior não encobre negativa');
    assert.ok(oscillators.flatMap((oscillator) => oscillator.frequencies).length > 0);
    assert.equal(contexts, 1);

    // interface → unlock → accepted: the achievement interrupts the preceding
    // common cue and protects its entire audible duration, not just 65 ms.
    clock = 1000;
    playCue('interface', () => true);
    const preceding = oscillators.at(-1)!;
    clock += 1;
    const beforeUnlock = oscillators.length;
    playCue('unlock', () => true);
    assert.equal(oscillators.length, beforeUnlock + 4, 'unlock não é suprimido pelo efeito anterior');
    assert.equal(preceding.stopped.at(-1), 0, 'efeito comum anterior é interrompido');
    clock += 1;
    playCue('accepted', () => true);
    assert.equal(oscillators.length, beforeUnlock + 4, 'efeito posterior não encobre a conquista');
    clock += 100;
    playCue('interface', () => true);
    playCue('unlock', () => true);
    assert.equal(oscillators.length, beforeUnlock + 4, 'proteção e antirrepetição duram toda a conquista');
    clock = 1800;
    playCue('accepted', () => true);
    assert.equal(oscillators.length, beforeUnlock + 8, 'efeitos comuns retornam após a conquista');
    clock += 1;
    playCue('accepted', () => true);
    assert.equal(oscillators.length, beforeUnlock + 8, 'repetição comum em menos de 65 ms é suprimida');

    // Also exercise accepted → unlock directly, independent of interface.
    clock = 2700;
    playCue('accepted', () => true);
    const acceptedVoices = oscillators.slice(-4);
    clock++;
    const beforeSecondUnlock = oscillators.length;
    playCue('unlock', () => true);
    assert.equal(oscillators.length, beforeSecondUnlock + 4);
    assert.ok(acceptedVoices.every((voice) => voice.stopped.at(-1) === 0));

    clock = 4000;
    audio!.state = 'suspended';
    const beforeResume = oscillators.length;
    playCue('interface', () => true);
    clock++;
    playCue('unlock', () => true);
    audio!.state = 'running';
    resumptions.splice(0).forEach((resolve) => resolve());
    await Promise.resolve();
    assert.equal(oscillators.length, beforeResume + 4, 'retomada tardia não reproduz efeito comum anterior');

    clock = 5000;
    audio!.state = 'suspended';
    let enabled = true;
    playCue('accepted', () => enabled);
    enabled = false;
    audio!.state = 'running';
    resumptions.splice(0).forEach((resolve) => resolve());
    await Promise.resolve();
    assert.equal(oscillators.length, beforeResume + 4, 'mute antes da retomada impede reprodução');
  } finally {
    delete (globalThis as { window?: unknown }).window;
    delete (globalThis as { performance?: unknown }).performance;
  }
});
