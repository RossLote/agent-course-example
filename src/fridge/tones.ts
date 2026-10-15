// The last five seconds' tones (PLAN.md §6, "The last five seconds"): made in the page with the
// Web Audio API, so there is no audio file and nothing is fetched. Every tone goes through
// `playTone`, and each is one oscillator on the page's one AudioContext, so a test can stub this
// module and a walkthrough can count the oscillators. Where Web Audio is missing (jsdom, an old
// browser) or refuses, nothing sounds and nothing else changes.

/** A short high beep for each of the last five seconds, a long low tone at zero. */
export type Tone = 'beep' | 'end';

const TONES: Record<Tone, { frequency: number; seconds: number }> = {
  beep: { frequency: 990, seconds: 0.09 },
  end: { frequency: 330, seconds: 0.6 },
};

/** The tones' loudness at their peak, from 0 to 1. */
const PEAK = 0.18;

let context: AudioContext | null = null;

/**
 * Makes the page's AudioContext, or resumes it, on a learner's gesture (a fridge's first pick
 * up), which is when a browser lets a page make sound.
 */
export function wakeTones(): void {
  try {
    if (typeof AudioContext === 'undefined') return;
    context ??= new AudioContext();
    if (context.state === 'suspended') context.resume().catch(() => undefined);
  } catch {
    // No sound where audio is unavailable.
  }
}

/** Sounds one tone, once the AudioContext is awake; before that, nothing. */
export function playTone(tone: Tone): void {
  if (context === null) return;
  try {
    const { frequency, seconds } = TONES[tone];
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = frequency;
    // A ramp up and down, so the tone starts and stops without a click.
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(PEAK, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + seconds + 0.02);
  } catch {
    // No sound where audio is unavailable.
  }
}
