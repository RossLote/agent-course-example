// The last five seconds' tones (PLAN.md §6, "The last five seconds"): made in the page with the
// Web Audio API, so there is no audio file and nothing is fetched. Every tone goes through
// `playTone`, and each is one oscillator on the page's one AudioContext, so a test can stub this
// module and a walkthrough can count the oscillators. Each tone lets go of its nodes when it ends,
// and the context sleeps (is suspended) when a timed play ends or its fridge goes, so the audio
// does not run on for the rest of the session; the next play's first pick up wakes it. Where Web
// Audio is missing (jsdom, an old browser) or refuses, nothing sounds and nothing else changes.

/** A short high beep for each of the last five seconds, a long low tone at zero. */
export type Tone = 'beep' | 'end';

const TONES: Record<Tone, { frequency: number; seconds: number }> = {
  beep: { frequency: 990, seconds: 0.09 },
  end: { frequency: 330, seconds: 0.6 },
};

/** The tones' loudness at their peak, from 0 to 1. */
const PEAK = 0.18;

let context: AudioContext | null = null;
/** How many tones are sounding now. */
let sounding = 0;
/** Whether the context is to sleep once the tones sounding now have ended. */
let drowsy = false;
/** Whether the context was put to sleep, which it may not report as suspended yet. */
let asleep = false;

/** Suspends the context when it is to sleep and no tone is sounding. */
function settle(): void {
  if (context === null || !drowsy || sounding > 0) return;
  drowsy = false;
  asleep = true;
  context.suspend().catch(() => undefined);
}

/**
 * Makes the page's AudioContext, or resumes it, on a learner's gesture (a fridge's first pick
 * up), which is when a browser lets a page make sound. A sleep still waiting on a tone is off.
 */
export function wakeTones(): void {
  try {
    if (typeof AudioContext === 'undefined') return;
    drowsy = false;
    context ??= new AudioContext();
    if (context.state === 'suspended' || asleep) {
      asleep = false;
      context.resume().catch(() => undefined);
    }
  } catch {
    // No sound where audio is unavailable.
  }
}

/** Puts the context to sleep once every tone sounding now has ended; before it exists, nothing. */
export function sleepTones(): void {
  drowsy = true;
  try {
    settle();
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
    // Done, the tone lets go of its nodes, and the context sleeps if it is to.
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      sounding -= 1;
      try {
        settle();
      } catch {
        // No sound where audio is unavailable.
      }
    };
    oscillator.start(now);
    oscillator.stop(now + seconds + 0.02);
    sounding += 1;
  } catch {
    // No sound where audio is unavailable.
  }
}
