import { describe, expect, it } from 'vitest';
import { checkAnswer, cooldownMs } from '../src/core/answer';
import { glyph, GLYPHS, isGlyphId } from '../src/core/glyphs';

describe('checkAnswer', () => {
  it('waits until every slot is filled', () => {
    expect(checkAnswer(['crown', 'belt'], [])).toBe('incomplete');
    expect(checkAnswer(['crown', 'belt'], ['crown'])).toBe('incomplete');
  });

  it('accepts the exact sequence only', () => {
    expect(checkAnswer(['crown', 'belt'], ['crown', 'belt'])).toBe('correct');
    expect(checkAnswer(['crown', 'belt'], ['belt', 'crown'])).toBe('wrong');
    expect(checkAnswer(['hook'], ['cross'])).toBe('wrong');
    expect(checkAnswer(['hook'], ['hook', 'hook'])).toBe('wrong');
  });
});

describe('constellation keypad', () => {
  it('has nine distinct constellations, each with valid lines', () => {
    expect(GLYPHS).toHaveLength(9);
    expect(new Set(GLYPHS.map((g) => g.id)).size).toBe(9);
    for (const g of GLYPHS) {
      for (const [a, b] of g.lines) {
        expect(g.stars[a]).toBeDefined();
        expect(g.stars[b]).toBeDefined();
      }
      for (const [x, y] of g.stars) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(100);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(100);
      }
    }
  });

  it('rises in pitch across the keypad', () => {
    const notes = GLYPHS.map((g) => g.frequency);
    expect([...notes].sort((a, b) => a - b)).toEqual(notes);
  });

  it('validates ids', () => {
    expect(isGlyphId('crown')).toBe(true);
    expect(isGlyphId('rat')).toBe(false);
    expect(() => glyph('rat' as never)).toThrow();
  });
});

describe('cooldownMs', () => {
  it('doubles after each wrong answer, capped at 15 seconds', () => {
    expect(cooldownMs(0)).toBe(0);
    expect([1, 2, 3, 4, 5, 9].map(cooldownMs)).toEqual([1500, 3000, 6000, 12000, 15000, 15000]);
  });
});
