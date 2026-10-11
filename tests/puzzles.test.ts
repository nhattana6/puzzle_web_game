import { describe, expect, it } from 'vitest';
import { isZodiacId } from '../src/core/zodiac';
import { PUZZLES } from '../src/puzzles';
import {
  alignedTarget, CANDLE_MAX, CANDLE_MIN, CANDLE_START, DEPTHS, INITIAL_ORDER, isOrderRestored,
  nextCourtyardHint, nextTagToReveal, sliceShift, swapTags, TARGETS,
} from '../src/puzzles/candleCourtyard';
import {
  ANIMALS, dropPuppet, INITIAL_SLOTS, INITIAL_TURNED, isAnimalWhole, isPondSolved, nearestSlot, nextPondHint, PUPPET_LIST, PUPPETS, SLOTS,
} from '../src/puzzles/puppetPond';
import {
  FACES, INITIAL_STEPS, isFaceAligned, nextRingHint, RING_STEPS, turnRing, type RingHint,
} from '../src/puzzles/starLantern';



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

  it('gives every level a how-to card covering its actions and the order marks', () => {
    for (const p of PUZZLES) {
      expect(p.guide.goal.length).toBeGreaterThan(10);
      expect(p.guide.steps.length).toBeGreaterThanOrEqual(2);
      expect(p.guide.steps.some((step) => step.icon === 'marks')).toBe(true);
      for (const step of p.guide.steps) expect(step.text.length).toBeGreaterThan(10);
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

  it('hints one ring at a time: wrong rings of the face on show first, outer first', () => {
    const steps = [0, 3, 0]; // front face: only the middle ring is wrong
    const shown: RingHint[] = [];
    const first = nextRingHint(steps, 0, shown)!;
    expect(first).toEqual({ face: 0, ring: 1 });
    shown.push(first);
    const second = nextRingHint(steps, 0, shown)!;
    expect(second.face).toBe(1);
    shown.push(second);
    for (let i = 0; i < 10; i += 1) {
      const next = nextRingHint(steps, 0, shown);
      if (!next) break;
      expect(shown).not.toContainEqual(next);
      expect(next.face).toBe(1);
      shown.push(next);
    }
    const wrongOnBack = FACES[1].solution.filter((goal, ring) => (steps[ring] - goal + RING_STEPS) % RING_STEPS !== 0).length;
    expect(shown).toHaveLength(1 + wrongOnBack);
    expect(nextRingHint(FACES[0].solution, 0, [])?.face).toBe(1);
  });

  it('numbers the faces 1..n', () => {
    expect(FACES.map((f) => f.order).sort()).toEqual(FACES.map((_, i) => i + 1));
  });
});

const identity = DEPTHS.map((_, i) => i);

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

  it('reveals one cut-out per hint, misplaced ones first', () => {
    const shown = new Set<number>();
    const order = [1, 0, 2, 3];
    expect(nextTagToReveal(order, shown)).toBe(0);
    shown.add(0);
    expect(nextTagToReveal(order, shown)).toBe(1);
    shown.add(1);
    expect(nextTagToReveal(order, shown)).toBe(2);
    shown.add(2).add(3);
    expect(nextTagToReveal(order, shown)).toBeNull();
  });

  it('hints cut-outs first, then candle spots not yet found', () => {
    const shown: ReturnType<typeof nextCourtyardHint>[] = [];
    const first = nextCourtyardHint(INITIAL_ORDER, [], new Set());
    expect(first?.kind).toBe('tag');
    shown.push(first);
    expect(nextCourtyardHint(identity, [], new Set())).toEqual({ kind: 'spot', target: 0 });
    expect(nextCourtyardHint(identity, [], new Set([0]))).toEqual({ kind: 'spot', target: 1 });
    expect(nextCourtyardHint(identity, [{ kind: 'spot', target: 1 }], new Set([0]))).toEqual({ kind: 'spot', target: 2 });
    expect(nextCourtyardHint(identity, [], new Set([0, 1, 2]))).toBeNull();
  });

  it('has four cut-outs, all out of place at the start', () => {
    expect(DEPTHS).toHaveLength(4);
    INITIAL_ORDER.forEach((tag, place) => expect(tag).not.toBe(place));
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
  const straight = Array(PUPPETS).fill(false);

  it('starts with no animal whole, some puppets turned and two odd halves', () => {
    expect(INITIAL_SLOTS).toHaveLength(PUPPETS);
    expect(new Set(INITIAL_SLOTS).size).toBe(PUPPETS);
    expect(PUPPETS).toBe(ANIMALS.length * 2 + 2);
    expect(INITIAL_TURNED.filter(Boolean).length).toBeGreaterThan(0);
    ANIMALS.forEach((_, a) => {
      expect(isAnimalWhole(INITIAL_SLOTS, a, INITIAL_TURNED)).toBe(false);
      expect(isAnimalWhole(INITIAL_SLOTS, a, straight)).toBe(false);
    });
    const odd = PUPPET_LIST.slice(ANIMALS.length * 2).map((p) => p.animal);
    for (const animal of odd) expect(ANIMALS.some((a) => a.animal === animal)).toBe(false);
  });

  it('needs every left half directly before its right half, both facing forward', () => {
    expect(isPondSolved([0, 1, 2, 3, 4, 5, 6, 7], straight)).toBe(true);
    expect(isPondSolved([4, 5, 0, 1, 2, 3, 6, 7], straight)).toBe(true);
    expect(isPondSolved([1, 0, 2, 3, 4, 5, 6, 7], straight)).toBe(false);
    const oneTurned = [...straight];
    oneTurned[3] = true;
    expect(isPondSolved([0, 1, 2, 3, 4, 5, 6, 7], oneTurned)).toBe(false);
    expect(isAnimalWhole([0, 1, 2, 3, 4, 5, 6, 7], 0, oneTurned)).toBe(true);
  });

  it('swaps puppets when dropping onto an occupied slot', () => {
    expect(dropPuppet([5, 0, 7, 2, 1, 4, 3, 6], 0, 0)).toEqual([0, 5, 7, 2, 1, 4, 3, 6]);
    expect(dropPuppet([5, 0, 7, 2, 1, 4, 3, 6], 2, 7)).toEqual([5, 0, 7, 2, 1, 4, 3, 6]);
  });

  it('snaps to the nearest slot', () => {
    expect(nearestSlot(-1000)).toBe(0);
    expect(nearestSlot(SLOTS[2] + 40)).toBe(2);
    expect(nearestSlot(10_000)).toBe(SLOTS.length - 1);
  });

  it('hints one unfinished animal at a time', () => {
    expect(nextPondHint(INITIAL_SLOTS, INITIAL_TURNED, [])).toBe(0);
    expect(nextPondHint(INITIAL_SLOTS, INITIAL_TURNED, [0])).toBe(1);
    const straight = Array(PUPPETS).fill(false);
    expect(nextPondHint([0, 1, 4, 5, 2, 3, 6, 7], straight, [])).toBeNull();
    expect(nextPondHint([0, 1, 2, 4, 3, 5, 6, 7], straight, [])).toBe(1);
  });

  it('orders the answer by bubbles', () => {
    const byBubbles = [...ANIMALS].sort((a, b) => a.order - b.order).map((a) => a.animal);
    expect(PUZZLES.find((p) => p.id === 'c2-puppet-pond')?.answer).toEqual(byBubbles);
    expect(byBubbles).not.toEqual(ANIMALS.map((a) => a.animal));
  });
});
