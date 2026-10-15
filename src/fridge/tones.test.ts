import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type FakeOscillator = {
  type: string;
  frequency: { value: number };
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  connect: (node: unknown) => unknown;
  disconnect: ReturnType<typeof vi.fn>;
  onended: (() => void) | null;
};

type FakeGain = { gain: { setValueAtTime: ReturnType<typeof vi.fn>; exponentialRampToValueAtTime: ReturnType<typeof vi.fn> }; connect: (node: unknown) => unknown; disconnect: ReturnType<typeof vi.fn> };

/** A stand-in for the Web Audio API, which jsdom has not got: it records what each tone made. */
class FakeContext {
  static made: FakeContext[] = [];
  state: 'suspended' | 'running' = 'suspended';
  currentTime = 2;
  destination = {};
  oscillators: FakeOscillator[] = [];
  gains: FakeGain[] = [];
  resume = vi.fn(() => {
    this.state = 'running';
    return Promise.resolve();
  });
  // Like a browser, it reports suspended only once the suspend has gone through.
  suspend = vi.fn(() => Promise.resolve());

  constructor() {
    FakeContext.made.push(this);
  }

  createOscillator() {
    const oscillator: FakeOscillator = { type: '', frequency: { value: 0 }, start: vi.fn(), stop: vi.fn(), connect: (node: unknown) => node, disconnect: vi.fn(), onended: null };
    this.oscillators.push(oscillator);
    return oscillator;
  }

  createGain() {
    const gain: FakeGain = { gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: (node: unknown) => node, disconnect: vi.fn() };
    this.gains.push(gain);
    return gain;
  }
}

/** The module afresh, so each test starts with no AudioContext. */
const tones = async () => {
  vi.resetModules();
  return import('./tones.ts');
};

describe('the last five seconds’ tones', () => {
  beforeEach(() => {
    FakeContext.made = [];
  });
  afterEach(() => vi.unstubAllGlobals());

  it('does nothing, and throws nothing, where Web Audio is missing', async () => {
    const { playTone, sleepTones, wakeTones } = await tones();
    expect(typeof globalThis.AudioContext).toBe('undefined');
    expect(() => {
      wakeTones();
      playTone('beep');
      playTone('end');
      sleepTones();
    }).not.toThrow();
  });

  it('makes no sound before a gesture wakes it', async () => {
    vi.stubGlobal('AudioContext', FakeContext);
    const { playTone } = await tones();
    playTone('beep');
    expect(FakeContext.made).toHaveLength(0);
  });

  it('makes one AudioContext on waking, resumes it when suspended, and keeps it', async () => {
    vi.stubGlobal('AudioContext', FakeContext);
    const { wakeTones } = await tones();
    wakeTones();
    expect(FakeContext.made).toHaveLength(1);
    expect(FakeContext.made[0].resume).toHaveBeenCalledTimes(1);
    wakeTones();
    expect(FakeContext.made).toHaveLength(1);
    expect(FakeContext.made[0].resume).toHaveBeenCalledTimes(1);
  });

  it('plays a short high beep and a long low tone, one oscillator each', async () => {
    vi.stubGlobal('AudioContext', FakeContext);
    const { playTone, wakeTones } = await tones();
    wakeTones();
    playTone('beep');
    playTone('end');
    const [beep, end] = FakeContext.made[0].oscillators;
    expect(beep.frequency.value).toBeGreaterThan(end.frequency.value);
    expect(beep.start).toHaveBeenCalledWith(2);
    expect(end.start).toHaveBeenCalledWith(2);
    const length = (oscillator: typeof beep) => (oscillator.stop.mock.calls[0][0] as number) - 2;
    expect(length(end)).toBeGreaterThan(length(beep));
  });

  it('lets go of each tone’s nodes when it ends', async () => {
    vi.stubGlobal('AudioContext', FakeContext);
    const { playTone, wakeTones } = await tones();
    wakeTones();
    playTone('beep');
    const context = FakeContext.made[0];
    expect(context.oscillators[0].disconnect).not.toHaveBeenCalled();
    expect(context.gains[0].disconnect).not.toHaveBeenCalled();
    context.oscillators[0].onended?.();
    expect(context.oscillators[0].disconnect).toHaveBeenCalledTimes(1);
    expect(context.gains[0].disconnect).toHaveBeenCalledTimes(1);
  });

  it('sleeps once the tones sounding have ended, and wakes again on the next play’s first gesture', async () => {
    vi.stubGlobal('AudioContext', FakeContext);
    const { playTone, sleepTones, wakeTones } = await tones();
    wakeTones();
    const context = FakeContext.made[0];
    playTone('beep');
    playTone('end');
    sleepTones();
    expect(context.suspend).not.toHaveBeenCalled();
    context.oscillators[0].onended?.();
    expect(context.suspend).not.toHaveBeenCalled();
    context.oscillators[1].onended?.();
    expect(context.suspend).toHaveBeenCalledTimes(1);
    // Still reporting running while the suspend goes through, but asleep: the next wake resumes it.
    wakeTones();
    expect(context.resume).toHaveBeenCalledTimes(2);
    playTone('beep');
    context.oscillators[2].onended?.();
    expect(context.suspend).toHaveBeenCalledTimes(1);
  });

  it('sleeps at once when no tone is sounding, and not at all when woken before the last tone ends', async () => {
    vi.stubGlobal('AudioContext', FakeContext);
    const { playTone, sleepTones, wakeTones } = await tones();
    wakeTones();
    const context = FakeContext.made[0];
    sleepTones();
    expect(context.suspend).toHaveBeenCalledTimes(1);
    wakeTones();
    playTone('end');
    sleepTones();
    wakeTones();
    context.oscillators[0].onended?.();
    expect(context.suspend).toHaveBeenCalledTimes(1);
  });

  it('sounds nothing while the context is suspended, and only the tones after a later wake resumes it', async () => {
    vi.stubGlobal('AudioContext', FakeContext);
    const { playTone, wakeTones } = await tones();
    wakeTones();
    const context = FakeContext.made[0];
    // A wake outside a gesture (a touch drag's pointermove): the browser keeps it suspended.
    context.state = 'suspended';
    playTone('beep');
    playTone('beep');
    expect(context.oscillators).toHaveLength(0);
    // The next gesture's wake resumes it; the tones due before it never sound.
    wakeTones();
    expect(context.resume).toHaveBeenCalledTimes(2);
    playTone('beep');
    expect(context.oscillators).toHaveLength(1);
  });

  it('sounds nothing once put to sleep, while the context still reports running, until woken', async () => {
    vi.stubGlobal('AudioContext', FakeContext);
    const { playTone, sleepTones, wakeTones } = await tones();
    wakeTones();
    const context = FakeContext.made[0];
    sleepTones();
    expect(context.state).toBe('running');
    playTone('beep');
    expect(context.oscillators).toHaveLength(0);
    wakeTones();
    playTone('beep');
    expect(context.oscillators).toHaveLength(1);
  });

  it('does nothing on sleeping before it was ever woken', async () => {
    vi.stubGlobal('AudioContext', FakeContext);
    const { sleepTones } = await tones();
    expect(() => sleepTones()).not.toThrow();
    expect(FakeContext.made).toHaveLength(0);
  });

  it('stays silent when the AudioContext refuses', async () => {
    vi.stubGlobal(
      'AudioContext',
      class {
        constructor() {
          throw new Error('not allowed');
        }
      },
    );
    const { playTone, sleepTones, wakeTones } = await tones();
    expect(() => {
      wakeTones();
      playTone('end');
      sleepTones();
    }).not.toThrow();
  });
});
