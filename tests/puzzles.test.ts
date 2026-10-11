import { describe, expect, it } from 'vitest';
import { isZodiacId } from '../src/core/zodiac';
import { PUZZLES } from '../src/puzzles';
import {
  alignedTarget, CANDLE_MAX, CANDLE_MIN, CANDLE_START, DEPTHS, shadowOffset, TARGETS,
} from '../src/puzzles/candleCourtyard';
import { dropPuppet, INITIAL_SLOTS, isPondSolved, nearestSlot, SLOTS } from '../src/puzzles/puppetPond';
import { INITIAL_STEPS, isLanternAligned, RING_STEPS } from '../src/puzzles/starLantern';

describe('puzzle registry', () => {
  it('has unique ids and valid answers', () => {
    expect(new Set(PUZZLES.map((p) => p.id)).size).toBe(PUZZLES.length);
    for (const p of PUZZLES) {
      expect(p.answer.length).toBeGreaterThan(0);
      expect(p.answer.every(isZodiacId)).toBe(true);
    }
  });

  it('has globally unique firefly ids', () => {
    const ids = PUZZLES.flatMap((p) => p.fireflies.map((f) => f.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('star lantern', () => {
  it('starts scrambled and aligns when every ring is upright', () => {
    expect(isLanternAligned(INITIAL_STEPS)).toBe(false);
    expect(isLanternAligned([0, 0, 0])).toBe(true);
    expect(isLanternAligned([RING_STEPS, 2 * RING_STEPS, 0])).toBe(true);
    expect(isLanternAligned([0, 1, 0])).toBe(false);
  });
});

describe('candle courtyard', () => {
  it('lines every cut-out up at the target candle position', () => {
    for (const target of TARGETS) {
      for (const depth of DEPTHS) expect(shadowOffset(target.candleX, target.candleX, depth)).toBe(0);
      expect(alignedTarget(target.candleX)).toBe(target.animal);
    }
  });

  it('scatters shadows elsewhere, and starts unsolved', () => {
    expect(alignedTarget(CANDLE_START)).toBeNull();
    expect(alignedTarget((TARGETS[0].candleX + TARGETS[1].candleX) / 2)).toBeNull();
    expect(new Set(DEPTHS.map((d) => shadowOffset(300, TARGETS[0].candleX, d))).size).toBe(DEPTHS.length);
  });

  it('keeps the targets on the rail, ordered left to right like the answer', () => {
    for (const t of TARGETS) {
      expect(t.candleX).toBeGreaterThan(CANDLE_MIN);
      expect(t.candleX).toBeLessThan(CANDLE_MAX);
    }
    expect(TARGETS[0].wallX).toBeLessThan(TARGETS[1].wallX);
  });
});

describe('puppet pond', () => {
  it('is solved by any run of adjacent slots in order', () => {
    expect(isPondSolved(INITIAL_SLOTS)).toBe(false);
    expect(isPondSolved([0, 1, 2])).toBe(true);
    expect(isPondSolved([2, 3, 4])).toBe(true);
    expect(isPondSolved([2, 1, 0])).toBe(false);
    expect(isPondSolved([0, 1, 3])).toBe(false);
  });

  it('swaps puppets when dropping onto an occupied slot', () => {
    expect(dropPuppet([3, 0, 2], 0, 2)).toEqual([2, 0, 3]);
    expect(dropPuppet([3, 0, 2], 1, 4)).toEqual([3, 4, 2]);
    expect(dropPuppet([3, 0, 2], 2, 2)).toEqual([3, 0, 2]);
  });

  it('snaps to the nearest slot', () => {
    expect(nearestSlot(-1000)).toBe(0);
    expect(nearestSlot(SLOTS[2] + 40)).toBe(2);
    expect(nearestSlot(10_000)).toBe(SLOTS.length - 1);
  });
});
