import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** A stand-in for the Web Audio API, which jsdom has not got: it records what each tone made. */
class FakeContext {
  static made: FakeContext[] = [];
  state: 'suspended' | 'running' = 'suspended';
  currentTime = 2;
  destination = {};
  oscillators: { type: string; frequency: { value: number }; start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; connect: (node: unknown) => unknown }[] = [];
  resume = vi.fn(() => {
    this.state = 'running';
    return Promise.resolve();
  });

  constructor() {
    FakeContext.made.push(this);
  }

  createOscillator() {
    const oscillator = { type: '', frequency: { value: 0 }, start: vi.fn(), stop: vi.fn(), connect: (node: unknown) => node };
    this.oscillators.push(oscillator);
    return oscillator;
  }

  createGain() {
    return { gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: (node: unknown) => node };
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
    const { playTone, wakeTones } = await tones();
    expect(typeof globalThis.AudioContext).toBe('undefined');
    expect(() => {
      wakeTones();
      playTone('beep');
      playTone('end');
    }).not.toThrow();
  });

  it('makes no sound before the first pick up wakes it', async () => {
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

  it('stays silent when the AudioContext refuses', async () => {
    vi.stubGlobal(
      'AudioContext',
      class {
        constructor() {
          throw new Error('not allowed');
        }
      },
    );
    const { playTone, wakeTones } = await tones();
    expect(() => {
      wakeTones();
      playTone('end');
    }).not.toThrow();
  });
});
