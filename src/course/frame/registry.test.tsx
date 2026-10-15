import { describe, expect, it } from 'vitest';
import { screenComponents } from '../../screens/index.ts';

describe('the screen registry', () => {
  it('has a component for every screen type', () => {
    expect(Object.keys(screenComponents).sort()).toEqual(['brief', 'chat', 'choose', 'compare', 'fridge', 'match', 'order', 'scene', 'takeaway']);
  });
});
