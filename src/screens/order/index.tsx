import type { ScreenProps } from '../types.ts';

/**
 * A placeholder until its screen bead builds the order screen, so every module plays to its
 * takeaway. A scored one has a button that answers it right, so Next can be enabled by hand.
 */
export function OrderScreen({ screen, onEvent }: ScreenProps<'order'>) {
  const max = screen.cards.length;
  const answer = () => onEvent({ type: 'answered', slug: screen.slug, right: true, score: { raw: max, max }, response: 'placeholder', answer: 'placeholder' });
  return (
    <div>
      <p className="muted">{screen.type}: not built yet</p>
      <button type="button" className="btn btn-ghost" onClick={answer}>
        Answer (placeholder)
      </button>
    </div>
  );
}
