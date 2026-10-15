import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import type { ScreenOf } from '../../content/index.ts';
import { usePointerDrag } from '../../fridge/usePointerDrag.ts';
import { Mark } from '../choose/Mark.tsx';
import { CheckButton } from '../match/CheckButton.tsx';
import { Blocks } from '../scene/Blocks.tsx';
import { Copy } from '../scene/Copy.tsx';
import type { SavedAnswer, ScreenProps } from '../types.ts';
import '../choose/Choose.css';
import './Order.css';

type Order = ScreenOf<'order'>;
type Card = Order['cards'][number];

/** What an order saves: the card ids in the order the learner left them. */
type OrderAnswer = { order: string[] };

/** A card held with the keyboard (or picked with a click), and the order to put back on Escape. */
interface Held {
  id: string;
  from: readonly string[];
}

const HINT = 'Drag a card into place, or click it and then the card whose place it takes. With the keyboard: Enter picks a card up, the arrow keys move it, Enter drops it, Escape puts it back.';

/**
 * The order a saved answer holds, or undefined when there is none. Any saved answer renders the
 * screen checked; one that is not every card id once renders the starting order.
 */
function savedOrder(saved: SavedAnswer | undefined, screen: Order): string[] | undefined {
  if (saved === undefined) return undefined;
  const order = saved !== null && typeof saved === 'object' && 'order' in saved ? saved.order : undefined;
  const ids = Array.isArray(order) ? order.filter((id): id is string => typeof id === 'string') : [];
  const whole = ids.length === screen.cards.length && screen.cards.every((card) => ids.includes(card.id));
  return whole ? ids : [...screen.start];
}

/** A card's name in the status line: its label up to the first colon or comma ("Retro"). */
function shortName(card: Card): string {
  return card.label.split(/[:,]/)[0].replaceAll('*', '').trim();
}

/** The order with `id` taken out and put back at `index`. */
function moveTo(order: readonly string[], id: string, index: number): string[] {
  const rest = order.filter((other) => other !== id);
  return [...rest.slice(0, index), id, ...rest.slice(index)];
}

/**
 * Put the cards in order (PLAN.md §6a, "Screen types"): the cards start in the content's `start`
 * order and move by pointer drag (mouse, pen or touch, the fridge's hand-rolled drag), by a
 * click on a card and then on the card whose place it takes, or by the keyboard (Enter or Space
 * picks a card up, the arrows move it a place, Enter drops it, Escape puts it back). A status
 * line and a polite live region say each move. Check marks each card in place right and each
 * card out of place wrong with its feedback; Try again lets the cards move again from where the
 * learner left them.
 *
 * An order is always scored: `answered` on every Check press, a point per card in its place.
 * The saved answer is `{order}`, and the screen renders from it checked.
 */
export function OrderScreen({ screen, progress, saved, onEvent }: ScreenProps<'order'>) {
  const { cards } = screen;
  const [initial] = useState(() => savedOrder(saved, screen));
  const [order, setOrder] = useState<readonly string[]>(initial ?? screen.start);
  const [held, setHeld] = useState<Held | null>(null);
  const [checked, setChecked] = useState(initial !== undefined);
  const [said, setSaid] = useState({ words: '', turn: 0 });
  const root = useRef<HTMLOListElement>(null);
  const focusCard = useRef<string | null>(null);
  const feedbackIds = useId();
  const promptId = useId();
  const hintId = useId();

  const card = (id: string) => cards.find((c) => c.id === id)!;
  const inPlace = order.filter((id, i) => cards[i].id === id).length;
  const say = (words: string) => setSaid(({ turn }) => ({ words, turn: turn + 1 }));
  const at = (id: string, list: readonly string[]) => `position ${list.indexOf(id) + 1} of ${cards.length}`;

  // A card moved in the list loses focus in some browsers; the one that moved takes it back.
  useEffect(() => {
    const id = focusCard.current;
    focusCard.current = null;
    if (id !== null) root.current?.querySelector<HTMLElement>(`[data-card="${id}"]`)?.focus();
  });

  /** Puts a card at `index` and lets go of it, whichever way it got there. */
  const place = (id: string, index: number) => {
    const next = moveTo(order, id, index);
    setOrder(next);
    setHeld(null);
    focusCard.current = id;
    say(`${shortName(card(id))} dropped at ${at(id, next)}`);
  };

  /** Enter, Space or a click on a card: pick it up, drop it, or drop the held card in its place. */
  const activate = (id: string) => {
    if (held === null) {
      setHeld({ id, from: order });
      say(`${shortName(card(id))} picked up, ${at(id, order)}`);
    } else {
      place(held.id, order.indexOf(id));
    }
  };

  const move = (by: number) => {
    if (held === null) return;
    const name = shortName(card(held.id));
    const index = order.indexOf(held.id) + by;
    if (index < 0 || index >= order.length) {
      say(`${name} is already ${by < 0 ? 'first' : 'last'}, ${at(held.id, order)}`);
      return;
    }
    const next = moveTo(order, held.id, index);
    setOrder(next);
    focusCard.current = held.id;
    say(`${name} moved to ${at(held.id, next)}`);
  };

  const putBack = () => {
    if (held === null) return;
    setOrder(held.from);
    setHeld(null);
    focusCard.current = held.id;
    say(`${shortName(card(held.id))} put back at ${at(held.id, held.from)}`);
  };

  const onCardKey = (id: string) => (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate(id);
    } else if (held?.id === id && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      move(event.key === 'ArrowDown' ? 1 : -1);
    } else if (held !== null && event.key === 'Escape') {
      event.preventDefault();
      putBack();
    }
  };

  const { drag, handlers, swallowClick } = usePointerDrag(root, (id, over) => place(id, order.indexOf(over)), () => undefined, !checked);

  const check = () => {
    const answer: OrderAnswer = { order: [...order] };
    const response = order.map((id) => card(id).label).join('; ');
    onEvent({ type: 'answered', slug: screen.slug, right: inPlace === cards.length, score: { raw: inPlace, max: cards.length }, response, answer });
    setHeld(null);
    setSaid(({ turn }) => ({ words: '', turn }));
    setChecked(true);
  };

  return (
    <div className="choose">
      {screen.body && <Blocks blocks={screen.body} progress={progress} />}
      <div className="scene-card choose-card">
        {screen.prompt !== undefined && (
          <p id={promptId} className="choice-prompt">
            <Copy text={screen.prompt} />
          </p>
        )}
        {!checked && (
          <p id={hintId} className="small muted">
            {HINT}
          </p>
        )}
        {/* Each card's slot is a drop target: the fridge's drag finds targets by data-shelf. */}
        <ol
          ref={root}
          className="order-list"
          aria-labelledby={screen.prompt !== undefined ? promptId : undefined}
          aria-label={screen.prompt === undefined ? screen.heading : undefined}
        >
          {order.map((id, i) => {
            const right = cards[i].id === id;
            const feedbackId = `${feedbackIds}-${id}`;
            const state = checked ? (right ? 'right' : 'wrong') : held?.id === id ? 'on' : undefined;
            return (
              <li key={id} className="order-slot" data-shelf={id} data-over={(drag !== null && drag.item !== id && drag.over === id) || undefined}>
                <div className="choice order-card" data-state={state}>
                  <button
                    type="button"
                    className="order-card-button"
                    data-card={id}
                    data-dragging={drag?.item === id || undefined}
                    aria-pressed={held?.id === id}
                    aria-describedby={checked ? (right ? undefined : feedbackId) : hintId}
                    disabled={checked}
                    {...handlers(id)}
                    onClick={() => {
                      if (!swallowClick()) activate(id);
                    }}
                    onKeyDown={onCardKey(id)}
                    onKeyUp={(event) => event.key === ' ' && event.preventDefault()}
                  >
                    {/* The list says the position and the words say the mark, so the number and the mark are drawn only. */}
                    <span className="order-number" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className="choice-label">
                      <Copy text={card(id).label} />
                      {checked && <span className="sr-only">{right ? ', in the right place' : ', out of place'}</span>}
                    </span>
                    {checked && (
                      <span className="order-mark" aria-hidden="true">
                        <Mark right={right} />
                      </span>
                    )}
                  </button>
                  {checked && !right && (
                    <p id={feedbackId} className="choice-feedback order-feedback">
                      <Copy text={card(id).feedback} />
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
        <p className="order-status">{said.words}</p>
        <div className="sr-only" aria-live="polite">
          {/* A space that comes and goes makes a repeated sentence a change a reader announces. */}
          {said.words}
          {said.words !== '' && said.turn % 2 === 1 ? ' ' : ''}
        </div>
        <div className="choice-actions">
          <CheckButton checked={checked} label={screen.checkLabel} onCheck={check} onTryAgain={() => setChecked(false)} />
          <p className="check-result" role="status">
            {checked && `${inPlace} of ${cards.length} in the right place`}
          </p>
        </div>
      </div>
      {drag !== null && (
        <span className="order-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          {shortName(card(drag.item))}
        </span>
      )}
    </div>
  );
}
