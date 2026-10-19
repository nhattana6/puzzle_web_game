import { describe, expect, it } from 'vitest';
import { GROW_ELONGATED, GROW_MAX, GROW_MIN_PX, GROW_SPACE, boxGaps, growFactor } from '../src/core/grow';

describe('growing small things on a phone', () => {
  const box = (l: number, t: number, w: number, h: number) => ({ left: l, top: t, right: l + w, bottom: t + h });
  const none: never[] = [];

  it('measures the empty space between two boxes on each axis: 0 where they overlap on it', () => {
    expect(boxGaps(box(0, 0, 10, 10), box(5, 5, 10, 10))).toEqual({ gx: 0, gy: 0 });
    expect(boxGaps(box(0, 0, 10, 10), box(30, 0, 10, 10))).toEqual({ gx: 20, gy: 0 });
    expect(boxGaps(box(0, 0, 10, 10), box(20, 30, 10, 10))).toEqual({ gx: 10, gy: 20 });
    expect(boxGaps(box(30, 30, 10, 10), box(0, 0, 10, 10))).toEqual({ gx: 20, gy: 20 });
  });

  it('leaves things alone that are already big enough', () => {
    expect(growFactor(GROW_MIN_PX, 40, none)).toBe(1);
    expect(growFactor(60, 50, none)).toBe(1);
  });

  it('enlarges a small thing to the minimum size, and no further than the maximum', () => {
    expect(growFactor(14, 14, none)).toBeCloseTo(2);
    expect(growFactor(20, 20, none)).toBeCloseTo(GROW_MIN_PX / 20);
    expect(growFactor(8, 10, none)).toBe(GROW_MAX); // 28 / 8 = 3.5, held at the maximum
  });

  it('never grows into a neighbour: it may use a share of the space on whichever axis keeps them apart', () => {
    // 11×14 with a neighbour 19 px away to the side.
    expect(growFactor(11, 14, [{ gx: 19, gy: 0 }])).toBeCloseTo(1 + (GROW_SPACE * 19) / 11);
    // The same space above instead: measured against the height.
    expect(growFactor(11, 14, [{ gx: 0, gy: 19 }])).toBeCloseTo(1 + (GROW_SPACE * 19) / 14);
    // A diagonal neighbour is kept apart by either axis: the roomier one counts.
    expect(growFactor(14, 14, [{ gx: 6, gy: 6 }])).toBeCloseTo(1 + (GROW_SPACE * 6) / 14);
    // Overlapping or touching on both axes: nothing to gain.
    expect(growFactor(13, 13, [{ gx: 0, gy: 0 }])).toBe(1);
    // The tightest neighbour decides.
    expect(growFactor(14, 14, [{ gx: 100, gy: 0 }, { gx: 3, gy: 0 }])).toBeCloseTo(1 + (GROW_SPACE * 3) / 14);
  });

  it('skips long thin things and things too small to measure', () => {
    expect(growFactor(18, 127, none)).toBe(1);
    expect(growFactor(10, 10 * GROW_ELONGATED + 1, none)).toBe(1);
    expect(growFactor(0, 40, none)).toBe(1);
  });

  it('ignores gains too small to be worth redrawing', () => {
    expect(growFactor(26, 26, none)).toBe(1); // 28 / 26 = 1.08 → floor
    expect(growFactor(25, 25, none)).toBeGreaterThan(1.1);
    expect(growFactor(8, 17, [{ gx: 0.5, gy: 0 }])).toBe(1); // 1 + 0.8 × 0.5 / 8 is under the floor
  });
});
