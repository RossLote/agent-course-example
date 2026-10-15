import { describe, expect, it } from 'vitest';
import { fillTemplate, plainText } from './copy.ts';

describe('plainText', () => {
  it('drops the emphasis markers and keeps the words; a lone asterisk stays', () => {
    expect(plainText('**Two-way door.** Reverting is *safe*.')).toBe('Two-way door. Reverting is safe.');
    expect(plainText('**bold with *italic* inside**')).toBe('bold with italic inside');
    expect(plainText('5 * 3 is 15')).toBe('5 * 3 is 15');
    expect(plainText('No markup.')).toBe('No markup.');
  });
});

describe('fillTemplate', () => {
  it('fills the slots it has values for and leaves the rest', () => {
    expect(fillTemplate('{right} out of {total} right first time', { right: 7, total: 8 })).toBe('7 out of 8 right first time');
    expect(fillTemplate('Final score {score}. {other}', { score: 0 })).toBe('Final score 0. {other}');
  });
});
