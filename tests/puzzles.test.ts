import { describe, expect, it } from 'vitest';
import { isZodiacId } from '../src/core/zodiac';
import { PUZZLES } from '../src/puzzles';
import {
  alignedTarget, CANDLE_MAX, CANDLE_MIN, CANDLE_START, DEPTHS, INITIAL_ORDER, isOrderRestored,
  sliceShift, swapTags, TARGETS,
} from '../src/puzzles/candleCourtyard';
import {
  ANIMALS, dropPuppet, INITIAL_SLOTS, isAnimalWhole, isPondSolved, nearestSlot, PUPPETS, SLOTS,
} from '../src/puzzles/puppetPond';
import {
  FACES, INITIAL_STEPS, isFaceAligned, RING_STEPS, turnRing,
} from '../src/puzzles/starLantern';

const identity = [0, 1, 2];

describe('puzzle registry', () => {
  it('has unique ids', () => {
    expect(new Set(PUZZLES.map((p) => p.id)).size).toBe(PUZZLES.length);
  });

  it('asks for at least two signs per puzzle, so single guesses never work', () => {
    for (const p of PUZZLES) {
      expect(p.answer.length).toBeGreaterThanOrEqual(2);
      expect(p.answer.every(isZodiacId)).toBe(true);
      expect(new Set(p.answer).size).toBe(p.answer.length);
    }
  });

  it('has globally unique firefly ids', () => {
    const ids = PUZZLES.flatMap((p) => p.fireflies.map((f) => f.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('star lantern', () => {
  /** Geared rings are solved outside-in: each ring only drags the ones inside it. */
  function solve(start: readonly number[], goal: readonly number[]): number {
    let steps = [...start];
    let presses = 0;
    for (let ring = 2; ring >= 0; ring -= 1) {
      while ((steps[ring] - goal[ring] + RING_STEPS) % RING_STEPS !== 0) {
        steps = turnRing(steps, ring);
        presses += 1;
      }
    }
    expect(steps).toEqual(goal.map((g) => g % RING_STEPS));
    return presses;
  }

  it('gears each ring to the ring inside it', () => {
    expect(turnRing([0, 0, 0], 0)).toEqual([1, 0, 0]);
    expect(turnRing([0, 0, 0], 1)).toEqual([1, 1, 0]);
    expect(turnRing([0, 0, 0], 2)).toEqual([0, 1, 1]);
    expect(turnRing([7, 7, 7], 2)).toEqual([7, 0, 0]);
  });

  it('starts with neither face lined up, and both faces are reachable', () => {
    for (const face of FACES) {
      expect(isFaceAligned(INITIAL_STEPS, face)).toBe(false);
      expect(solve(INITIAL_STEPS, face.solution)).toBeGreaterThan(5);
      expect(isFaceAligned(face.solution, face)).toBe(true);
    }
    expect(isFaceAligned(FACES[0].solution, FACES[1])).toBe(false);
  });

  it('numbers the faces 1..n', () => {
    expect(FACES.map((f) => f.order).sort()).toEqual(FACES.map((_, i) => i + 1));
  });
});

describe('candle courtyard', () => {
  it('only lines up once the cut-outs are back in order', () => {
    expect(isOrderRestored(INITIAL_ORDER)).toBe(false);
    for (const target of TARGETS) {
      expect(alignedTarget(target.candleX, INITIAL_ORDER)).toBeNull();
      expect(alignedTarget(target.candleX, identity)).toBe(target);
      for (let tag = 0; tag < DEPTHS.length; tag += 1) {
        expect(sliceShift(target.candleX, target, tag, identity)).toBe(0);
      }
    }
  });

  it('throws misplaced slices off to the side even at the right candle spot', () => {
    const t = TARGETS[0];
    const swapped = swapTags(identity, 0, 1);
    expect(sliceShift(t.candleX, t, 0, swapped)).not.toBe(0);
    expect(sliceShift(t.candleX, t, 2, swapped)).toBe(0);
  });

  it('scatters shadows elsewhere', () => {
    expect(alignedTarget(CANDLE_START, identity)).toBeNull();
    for (const t of TARGETS) {
      expect(t.candleX).toBeGreaterThan(CANDLE_MIN);
      expect(t.candleX).toBeLessThan(CANDLE_MAX);
    }
  });

  it('orders the answer by dots, not by wall position or candle sweep', () => {
    const byDots = [...TARGETS].sort((a, b) => a.order - b.order).map((t) => t.animal);
    const byWall = [...TARGETS].sort((a, b) => a.wallX - b.wallX).map((t) => t.animal);
    const bySweep = [...TARGETS].sort((a, b) => a.candleX - b.candleX).map((t) => t.animal);
    expect(PUZZLES.find((p) => p.id === 'c1-candle-courtyard')?.answer).toEqual(byDots);
    expect(byDots).not.toEqual(byWall);
    expect(byDots).not.toEqual(bySweep);
  });
});

describe('puppet pond', () => {
  it('starts with no animal whole', () => {
    expect(INITIAL_SLOTS).toHaveLength(PUPPETS);
    expect(new Set(INITIAL_SLOTS).size).toBe(PUPPETS);
    ANIMALS.forEach((_, a) => expect(isAnimalWhole(INITIAL_SLOTS, a)).toBe(false));
  });

  it('needs every left half directly before its right half', () => {
    expect(isPondSolved([0, 1, 2, 3, 4, 5])).toBe(true);
    expect(isPondSolved([4, 5, 0, 1, 2, 3])).toBe(true);
    expect(isPondSolved([1, 0, 2, 3, 4, 5])).toBe(false);
    expect(isAnimalWhole([1, 0, 2, 3, 4, 5], 1)).toBe(true);
  });

  it('swaps puppets when dropping onto an occupied slot', () => {
    expect(dropPuppet([3, 0, 5, 2, 1, 4], 0, 0)).toEqual([0, 3, 5, 2, 1, 4]);
    expect(dropPuppet([3, 0, 5, 2, 1, 4], 2, 5)).toEqual([3, 0, 5, 2, 1, 4]);
  });

  it('snaps to the nearest slot', () => {
    expect(nearestSlot(-1000)).toBe(0);
    expect(nearestSlot(SLOTS[2] + 40)).toBe(2);
    expect(nearestSlot(10_000)).toBe(SLOTS.length - 1);
  });

  it('orders the answer by bubbles', () => {
    const byBubbles = [...ANIMALS].sort((a, b) => a.order - b.order).map((a) => a.animal);
    expect(PUZZLES.find((p) => p.id === 'c2-puppet-pond')?.answer).toEqual(byBubbles);
    expect(byBubbles).not.toEqual(ANIMALS.map((a) => a.animal));
  });
});
