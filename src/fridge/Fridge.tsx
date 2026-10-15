import { useEffect, useId, useRef, type KeyboardEvent } from 'react';
import type { Fridge as FridgeFile } from '../content/index.ts';
import { Copy } from '../screens/scene/Copy.tsx';
import type { SavedAnswer, ScreenEvent } from '../screens/types.ts';
import { ToneIcon } from './icons.tsx';
import { isFinished, rightFirstTime, savedPlay, scoreOf, trayItems, type FridgeAction } from './play.ts';
import { useFridgePlay } from './useFridgePlay.ts';
import { usePointerDrag } from './usePointerDrag.ts';
import { fillTemplate, fridgeWords } from './words.ts';
import './Fridge.css';

export interface FridgeProps {
  /** The fridge file: shelves, items, feedback, score and the rest (content/README.md). */
  fridge: FridgeFile;
  /** The file's name ("accepted"): the fridge-ended event's slug. */
  name: string;
  /** A finished play to show, with its score card; Try again starts a new one. */
  saved?: SavedAnswer;
  /** Gets `fridge-ended` once per play, when its last item is placed. */
  onEvent?: (event: ScreenEvent) => void;
}

const HINT = 'Drag an item onto a shelf, or click it and then a shelf. With the keyboard: Enter picks it up, the arrow keys choose a shelf, Enter places it, Escape puts it back.';

/**
 * One fridge, driven entirely by its file (D17): its shelves in file order, the tray, a right
 * drop that stays and a wrong drop that returns (with its reason on a reason fridge), and the
 * score card when every item is placed. Pointer drag with mouse and touch, a click on an item
 * then a shelf, and the keyboard route all go through the same play (./play.ts). The status
 * line and the live region say the same words (./words.ts). Everything it renders is scoped to
 * itself (ids, the live region, its keys), so two fridges can share a page.
 */
export function Fridge({ fridge, name, saved, onEvent }: FridgeProps) {
  const root = useRef<HTMLElement>(null);
  const id = useId();
  // What to focus once the action has rendered: an item's selector, or the score card's.
  const focusNext = useRef<string | null>(null);
  const [play, dispatch] = useFridgePlay(fridge, saved, (ended) =>
    onEvent?.({ type: 'fridge-ended', slug: name, score: scoreOf(fridge, ended), answer: savedPlay(ended) }),
  );

  const finished = isFinished(fridge, play);
  const tray = trayItems(fridge, play);
  const words = fridgeWords(fridge, play);
  const held = play.held;
  const placed = fridge.items.length - tray.length;

  /**
   * Dispatches an action and keeps focus sensible: after a drop, on the next item in the tray
   * (or the score card when the play ends), or on the item that came back; after a put back,
   * on the item. The shelves are off while nothing is held, so focus never stays on one.
   */
  const act = (action: FridgeAction) => {
    const { before, after } = dispatch(action);
    const last = after.last;
    if (after === before || last === null) return;
    if (last.kind === 'placed') {
      const rest = trayItems(fridge, after);
      const at = Math.min(trayItems(fridge, before).findIndex((item) => item.id === last.item), rest.length - 1);
      focusNext.current = rest.length === 0 ? '.fridge-score' : `[data-item="${rest[at].id}"]`;
    } else if (last.kind === 'returned' || last.kind === 'put-back') {
      focusNext.current = `[data-item="${last.item}"]`;
    }
  };

  useEffect(() => {
    const target = focusNext.current;
    focusNext.current = null;
    if (target !== null) root.current?.querySelector<HTMLElement>(target)?.focus();
  });

  const { drag, handlers, swallowClick } = usePointerDrag(root, (item, shelf) => act({ type: 'drop', item, shelf }), !finished);

  // Arrows and Escape while holding, from anywhere inside this fridge and nowhere else.
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (held === null) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      act({ type: 'move', by: event.key === 'ArrowDown' ? 1 : -1 });
    } else if (event.key === 'Escape') {
      event.preventDefault();
      act({ type: 'put-back' });
    }
  };

  // Enter or Space on an item picks it up, or places it when it is the one held.
  const onItemKey = (item: string) => (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    act(held?.item === item ? { type: 'place' } : { type: 'pick', item });
  };

  const tone = play.last?.kind === 'placed' ? 'right' : play.last?.kind === 'returned' ? 'wrong' : undefined;
  const score = scoreOf(fridge, play);
  const wrong = fridge.items.filter((item) => play.wrongFirst.includes(item.id));
  const dragged = drag === null ? undefined : fridge.items.find((item) => item.id === drag.item);

  return (
    <section ref={root} className="fridge" aria-labelledby={`${id}-title`} data-feedback={fridge.feedback} onKeyDown={onKeyDown}>
      <div className="fridge-head">
        <h2 id={`${id}-title`} className="fridge-title">
          <Copy text={fridge.title} />
        </h2>
        <button type="button" className="btn btn-ghost" onClick={() => act({ type: 'reset' })}>
          {fridge.resetLabel}
        </button>
      </div>

      <p className="fridge-hud">
        <span className="fridge-pill">
          {placed} of {fridge.items.length} placed
        </span>
      </p>

      <ul className="fridge-cabinet" aria-label="Shelves">
        {fridge.shelves.map((shelf, index) => {
          const onShelf = fridge.items.filter((item) => play.placements[item.id] === shelf.id);
          return (
            <li key={shelf.id}>
              <button
                type="button"
                className="fridge-shelf"
                data-shelf={shelf.id}
                data-target={held !== null || drag !== null || undefined}
                data-cursor={held?.cursor === index || undefined}
                data-over={drag?.over === shelf.id || undefined}
                disabled={held === null}
                onClick={() => held !== null && act({ type: 'drop', item: held.item, shelf: shelf.id })}
              >
                <span className="fridge-shelf-name">
                  {shelf.name}
                  {shelf.subtitle !== undefined && <span className="fridge-shelf-sub"> · {shelf.subtitle}</span>}
                </span>
                <span className="fridge-on-shelf">
                  {onShelf.map((item) => (
                    <span key={item.id} className="fridge-placed">
                      <ToneIcon tone="right" size={12} />
                      {item.name}
                    </span>
                  ))}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p id={`${id}-hint`} className="small muted">
        {HINT}
      </p>
      <div className="fridge-tray" role="group" aria-label="The tray">
        {tray.map((item) => (
          <button
            key={item.id}
            type="button"
            className="fridge-item"
            data-item={item.id}
            data-dragging={drag?.item === item.id || undefined}
            data-returned={(play.last?.kind === 'returned' && play.last.item === item.id) || undefined}
            aria-pressed={held?.item === item.id}
            aria-describedby={`${id}-hint`}
            {...handlers(item.id)}
            onClick={() => {
              if (!swallowClick()) act({ type: 'pick', item: item.id });
            }}
            onKeyDown={onItemKey(item.id)}
            onKeyUp={(event) => event.key === ' ' && event.preventDefault()}
          >
            {item.name}
          </button>
        ))}
      </div>

      <p className="fridge-status" data-tone={tone}>
        {tone !== undefined && <ToneIcon tone={tone} size={16} />}
        <span>{words}</span>
      </p>
      <div className="fridge-live" aria-live="polite">
        {/* A space that comes and goes makes a repeated sentence a change a reader announces. */}
        {words}
        {words !== '' && play.turn % 2 === 1 ? ' ' : ''}
      </div>

      {finished && (
        <div className="fridge-score" tabIndex={-1} aria-labelledby={`${id}-score`}>
          <p id={`${id}-score`} className="fridge-score-line">
            <Copy text={fillTemplate(fridge.finish, { right: rightFirstTime(fridge, play), total: fridge.items.length, score: score.raw })} />
          </p>
          {fridge.feedback === 'reason' &&
            (wrong.length > 0 ? (
              <ul className="fridge-wrong">
                {wrong.map((item) => (
                  <li key={item.id}>
                    <ToneIcon tone="wrong" />
                    <span>
                      <strong>{item.name}:</strong> {item.reason}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              fridge.allRight !== undefined && (
                <p className="fridge-all-right">
                  <ToneIcon tone="right" />
                  <Copy text={fridge.allRight} />
                </p>
              )
            ))}
        </div>
      )}

      <p className="small muted">
        <Copy text={fridge.caption} />
      </p>

      {drag !== null && dragged !== undefined && (
        <span className="fridge-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          {dragged.name}
        </span>
      )}
    </section>
  );
}
