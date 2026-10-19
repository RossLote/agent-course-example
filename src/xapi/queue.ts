// The send queue (D20): requests to the record store go out one at a time, in the order they
// were added, and never hold up the learner. A failed request is tried once more; a second
// failure is logged and dropped, and nothing reaches the caller. What is still waiting (its
// turn, or its retry) can be taken out, so the page's last sends carry it instead (tracker.ts).

export interface Queue<T> {
  /** Adds an item to send. Returns at once. */
  add(item: T): void;
  /** Takes out every item still waiting, oldest first: the queue will not send them. One in flight stays. */
  take(): T[];
  /** Settles when every item added so far has been sent, dropped or taken out. */
  idle(): Promise<void>;
}

/**
 * A queue that sends each item with `send`, names it with `label` in the warning if it fails
 * twice, and waits `retryDelayMs` before its one retry.
 */
export function createQueue<T>(send: (item: T) => Promise<unknown>, label: (item: T) => string, retryDelayMs = 1000): Queue<T> {
  let tail: Promise<void> = Promise.resolve();
  // The items not yet sent and not in flight, oldest first.
  let waiting: T[] = [];

  /** Sends the item unless it was taken out: true once sent, the error when it failed, null when taken. */
  async function attempt(item: T): Promise<true | { error: unknown } | null> {
    if (!waiting.includes(item)) return null;
    waiting = waiting.filter((w) => w !== item);
    try {
      await send(item);
      return true;
    } catch (error) {
      return { error };
    }
  }

  async function sendWithRetry(item: T): Promise<void> {
    const first = await attempt(item);
    if (first === true || first === null) return;
    // It waits for its retry first in line again, where `take` can still find it.
    waiting = [item, ...waiting];
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    const second = await attempt(item);
    if (second !== true && second !== null) console.warn(`xAPI: ${label(item)} failed twice and was dropped.`, second.error);
  }

  return {
    add(item) {
      waiting = [...waiting, item];
      tail = tail.then(() => sendWithRetry(item));
    },
    take() {
      const taken = waiting;
      waiting = [];
      return taken;
    },
    idle: () => tail,
  };
}
