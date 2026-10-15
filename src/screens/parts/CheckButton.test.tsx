import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { plainText } from '../../content/copy.ts';
import { course } from '../../content/index.ts';
import { NO_PROGRESS, realScreen } from '../../course/frame/fixture.ts';
import { MatchScreen } from '../match/index.tsx';
import { OrderScreen } from '../order/index.tsx';
import { CheckButton } from './CheckButton.tsx';

function renderButton(props: { checked: boolean; label?: string; tryAgainLabel?: string }) {
  const onCheck = vi.fn();
  const onTryAgain = vi.fn();
  render(<CheckButton {...props} onCheck={onCheck} onTryAgain={onTryAgain} />);
  return { onCheck, onTryAgain };
}

describe('CheckButton', () => {
  it('says "Check my answer" when the content gives no label', () => {
    const { onCheck } = renderButton({ checked: false });
    fireEvent.click(screen.getByRole('button', { name: 'Check my answer' }));
    expect(onCheck).toHaveBeenCalledOnce();
  });

  it('says "Try again" once checked when the content gives no label for it', () => {
    const { onTryAgain } = renderButton({ checked: true, label: 'Check my verdict' });
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onTryAgain).toHaveBeenCalledOnce();
  });

  it("says the content's try-again label once checked", () => {
    renderButton({ checked: true, tryAgainLabel: 'Try another verdict' });
    expect(screen.getByRole('button').textContent).toBe('Try another verdict');
  });

  it('renders both labels as copy, with their bold and italic', () => {
    renderButton({ checked: false, label: 'Check *my* verdict' });
    expect(screen.getByRole('button', { name: 'Check my verdict' }).innerHTML).toBe('Check <em>my</em> verdict');
  });

  it('renders the try-again label as copy too', () => {
    renderButton({ checked: true, tryAgainLabel: 'Try **another** verdict' });
    expect(screen.getByRole('button', { name: 'Try another verdict' }).innerHTML).toBe('Try <strong>another</strong> verdict');
  });
});

// Whether a stylesheet hides the region is for a browser to say (Vitest applies no CSS, and
// CheckButton.css keeps no rule that hides it); these hold the region's place in the page.
describe('the Check result beside the button (match and order)', () => {
  it('is one live region from the start, empty until Check fills it, kept through Try again', () => {
    const { module, screen: match } = realScreen('04', 'match', 'who-catches-it');
    render(<MatchScreen screen={match} module={module} course={course} progress={NO_PROGRESS} onEvent={() => {}} />);
    const status = screen.getByRole('status');
    expect(status.textContent).toBe('');
    for (const row of match.rows) {
      const right = match.targets.find((t) => t.id === row.key)!.label;
      fireEvent.click(within(screen.getByRole('group', { name: plainText(row.text) })).getByRole('radio', { name: right }));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Check my matches' }));
    expect(screen.getByRole('status')).toBe(status);
    expect(status.textContent).toBe('4 out of 4 right');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByRole('status')).toBe(status);
  });

  it('is in the tree before the first Check on the order screen too', () => {
    const { module, screen: order } = realScreen('07', 'order', 'order-the-loop');
    render(<OrderScreen screen={order} module={module} course={course} progress={NO_PROGRESS} onEvent={() => {}} />);
    const status = screen.getByRole('status');
    expect(status.textContent).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Check the order' }));
    expect(screen.getByRole('status')).toBe(status);
    expect(status.textContent).toBe('4 of 8 in the right place');
  });
});
