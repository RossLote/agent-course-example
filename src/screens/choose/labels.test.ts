import { describe, expect, it } from 'vitest';
import { summaryLabel, verdictOf, type Verdict } from './labels.ts';

describe('verdictOf', () => {
  it('judges what was done with the option, not whether it is a right one', () => {
    expect(verdictOf(true, true)).toBe('right-tick');
    expect(verdictOf(false, false)).toBe('right-leave');
    expect(verdictOf(false, true)).toBe('wrong-tick');
    expect(verdictOf(true, false)).toBe('missed');
  });
});

describe('summaryLabel', () => {
  const of = (...verdicts: Verdict[]) => summaryLabel(verdicts);

  it('says only the count when every choice is right', () => {
    expect(of('right-tick', 'right-tick', 'right-tick', 'right-leave', 'right-leave')).toBe('5 of 5 right.');
  });

  it('names one kind of mistake alone', () => {
    expect(of('right-tick', 'right-tick', 'missed', 'right-leave', 'right-leave')).toBe('4 of 5 right: one missed.');
    expect(of('right-tick', 'missed', 'missed', 'missed', 'right-leave')).toBe('2 of 5 right: 3 missed.');
    expect(of('right-tick', 'wrong-tick', 'right-leave')).toBe("2 of 3 right: one tick shouldn't be there.");
    expect(of('wrong-tick', 'wrong-tick', 'right-tick')).toBe("1 of 3 right: 2 ticks shouldn't be there.");
  });

  it('joins both kinds with ", and", wrong ticks first', () => {
    expect(of('right-tick', 'right-tick', 'missed', 'wrong-tick', 'right-leave')).toBe("3 of 5 right: one tick shouldn't be there, and one missed.");
    expect(of('missed', 'missed', 'wrong-tick', 'wrong-tick')).toBe("0 of 4 right: 2 ticks shouldn't be there, and 2 missed.");
  });
});
