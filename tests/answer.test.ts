import { describe, expect, it } from 'vitest';
import { checkAnswer, cooldownMs } from '../src/core/answer';
import { isZodiacId, ZODIAC, zodiac } from '../src/core/zodiac';

describe('checkAnswer', () => {
  it('waits until every slot is filled', () => {
    expect(checkAnswer(['ox', 'tiger'], [])).toBe('incomplete');
    expect(checkAnswer(['ox', 'tiger'], ['ox'])).toBe('incomplete');
  });

  it('accepts the exact sequence only', () => {
    expect(checkAnswer(['ox', 'tiger'], ['ox', 'tiger'])).toBe('correct');
    expect(checkAnswer(['ox', 'tiger'], ['tiger', 'ox'])).toBe('wrong');
    expect(checkAnswer(['rat'], ['cat'])).toBe('wrong');
    expect(checkAnswer(['rat'], ['rat', 'rat'])).toBe('wrong');
  });
});

describe('zodiac ring', () => {
  it('has twelve distinct signs starting at Tý, with the Vietnamese cat', () => {
    expect(ZODIAC).toHaveLength(12);
    expect(new Set(ZODIAC.map((z) => z.id)).size).toBe(12);
    expect(ZODIAC[0].branch).toBe('Tý');
    expect(zodiac('cat').branch).toBe('Mão');
  });

  it('rises in pitch clockwise', () => {
    const notes = ZODIAC.map((z) => z.frequency);
    expect([...notes].sort((a, b) => a - b)).toEqual(notes);
  });

  it('validates ids', () => {
    expect(isZodiacId('dragon')).toBe(true);
    expect(isZodiacId('rabbit')).toBe(false);
    expect(() => zodiac('rabbit' as never)).toThrow();
  });
});

describe('cooldownMs', () => {
  it('doubles after each wrong answer, capped at 15 seconds', () => {
    expect(cooldownMs(0)).toBe(0);
    expect([1, 2, 3, 4, 5, 9].map(cooldownMs)).toEqual([1500, 3000, 6000, 12000, 15000, 15000]);
  });
});
