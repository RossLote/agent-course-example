// The send queue (D20): requests to the record store go out one at a time, in the order they
// were added, and never hold up the learner. A failed request is tried once more; a second
// failure is logged and dropped, and nothing reaches the caller.

export interface Queue {
  /** Adds a request; `label` names it in the warning if it fails twice. Returns at once. */
  add(label: string, request: () => Promise<unknown>): void;
  /** Settles when every request added so far has been sent or dropped. */
  idle(): Promise<void>;
}

/** A queue that waits `retryDelayMs` before its one retry. */
export function createQueue(retryDelayMs = 1000): Queue {
  let tail: Promise<void> = Promise.resolve();
  return {
    add(label, request) {
      tail = tail.then(() => sendWithRetry(label, request, retryDelayMs));
    },
    idle: () => tail,
  };
}

async function sendWithRetry(label: string, request: () => Promise<unknown>, retryDelayMs: number): Promise<void> {
  try {
    await request();
    return;
  } catch {
    // Tried once more below.
  }
  await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
  try {
    await request();
  } catch (error) {
    console.warn(`xAPI: ${label} failed twice and was dropped.`, error);
  }
}
