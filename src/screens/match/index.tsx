import type { ScreenProps } from '../types.ts';

/**
 * A placeholder until its screen bead builds the match screen, so every module plays to its
 * takeaway. A scored one has a button that answers it right, so Next can be enabled by hand.
 */
export function MatchScreen({ screen, onEvent }: ScreenProps<'match'>) {
  const max = screen.rows.length;
  const answer = () => onEvent({ type: 'answered', slug: screen.slug, right: true, score: { raw: max, max }, response: 'placeholder', answer: 'placeholder' });
  return (
    <div>
      <p className="muted">{screen.type}: not built yet</p>
      {screen.scored && (
        <button type="button" className="btn btn-ghost" onClick={answer}>
          Answer (placeholder)
        </button>
      )}
    </div>
  );
}
