import { describe, expect, it } from 'vitest';
import { findJoin, Groups, isComplete, nextPairHint, partsFit, sameRotation, type Composition, type Pose } from '../src/core/assembly';
import { OBJECTS } from '../src/core/objects';
import { PUZZLES } from '../src/puzzles';
import type { BoardConfig } from '../src/puzzles/assemblyBoard';
import { TEA_TRAY } from '../src/puzzles/teaTray';
import { TOY_ATTIC } from '../src/puzzles/toyAttic';

const comp: Composition = {
  animal: 'rooster',
  order: 1,
  parts: [
    { id: 'a', dx: 0, dy: 0, rot: 0 },
    { id: 'b', dx: 100, dy: 0, rot: 90 },
    { id: 'c', dx: 0, dy: 100, rot: 0 },
  ],
};

describe('assembly rules', () => {
  it('compares rotations with symmetry', () => {
    expect(sameRotation(0, 360)).toBe(true);
    expect(sameRotation(-45, 315)).toBe(true);
    expect(sameRotation(90, 0)).toBe(false);
    expect(sameRotation(90, 0, 90)).toBe(true);
    expect(sameRotation(45, 0, 90)).toBe(false);
  });

  it('fits pieces by relative offset, anywhere on the table', () => {
    const poses: Record<string, Pose> = { a: { x: 500, y: 500, rot: 0 }, b: { x: 610, y: 505, rot: 90 }, c: { x: 0, y: 0, rot: 0 } };
    expect(partsFit(poses, comp.parts[0], comp.parts[1])).toBe(true);
    poses.b = { x: 610, y: 505, rot: 0 };
    expect(partsFit(poses, comp.parts[0], comp.parts[1])).toBe(false);
    poses.b = { x: 700, y: 505, rot: 90 };
    expect(partsFit(poses, comp.parts[0], comp.parts[1])).toBe(false);
  });

  it('snaps the moved group onto the one that stays, and completes', () => {
    const poses: Record<string, Pose> = { a: { x: 500, y: 500, rot: 0 }, b: { x: 610, y: 505, rot: 90 }, c: { x: 505, y: 590, rot: 0 } };
    const groups = new Groups(['a', 'b', 'c']);
    const join = findJoin(poses, [comp], groups, undefined, 'b');
    expect(join?.anchor.id).toBe('b');
    expect(join?.mover.id).toBe('a');
    expect(join).toMatchObject({ dx: 10, dy: 5 });
    groups.union('b', 'a');
    poses.a = { x: 510, y: 505, rot: 0 };
    expect(isComplete(comp, groups)).toBe(false);
    const next = findJoin(poses, [comp], groups);
    expect(next?.mover.id).toBe('c');
    groups.union(next!.anchor.id, next!.mover.id);
    expect(isComplete(comp, groups)).toBe(true);
    expect(groups.members('c').sort()).toEqual(['a', 'b', 'c']);
  });
});

describe('pair hints', () => {
  it('points out one pair per hint, finishing one animal before the next', () => {
    const other: Composition = { animal: 'pig', order: 2, parts: [{ id: 'x', dx: 0, dy: 0, rot: 0 }, { id: 'y', dx: 50, dy: 0, rot: 0 }] };
    const groups = new Groups(['a', 'b', 'c', 'x', 'y']);
    const hinted: [string, string][] = [];
    const first = nextPairHint([comp, other], groups, hinted)!;
    expect(first).toEqual(['a', 'b']);
    hinted.push(first);
    const second = nextPairHint([comp, other], groups, hinted)!;
    expect(second).toEqual(['a', 'c']);
    hinted.push(second);
    expect(nextPairHint([comp, other], groups, hinted)).toEqual(['x', 'y']);
    groups.union('a', 'b');
    groups.union('a', 'c');
    groups.union('x', 'y');
    expect(nextPairHint([comp, other], groups, [])).toBeNull();
  });
});

describe.each([
  ['tea tray', TEA_TRAY, 'c1-tea-tray'],
  ['toy attic', TOY_ATTIC, 'c2-toy-attic'],
] as [string, BoardConfig, string][])('%s layout', (_, cfg, id) => {
  const poses = Object.fromEntries(cfg.objects.map((o) => [o.id, { x: o.x, y: o.y, rot: o.rot }]));
  const symmetry = (objectId: string) => OBJECTS[cfg.objects.find((o) => o.id === objectId)!.kind].symmetry;

  it('uses each object at most once, with decoys left over', () => {
    const used = cfg.compositions.flatMap((c) => c.parts.map((p) => p.id));
    expect(new Set(used).size).toBe(used.length);
    for (const objectId of used) expect(poses[objectId]).toBeDefined();
    expect(cfg.objects.length).toBeGreaterThan(used.length);
  });

  it('starts with nothing locked together, inside the table', () => {
    expect(findJoin(poses, cfg.compositions, new Groups(Object.keys(poses)), symmetry)).toBeNull();
    for (const o of cfg.objects) {
      expect(o.x).toBeGreaterThanOrEqual(cfg.bounds.x0);
      expect(o.x).toBeLessThanOrEqual(cfg.bounds.x1);
      expect(o.y).toBeGreaterThanOrEqual(cfg.bounds.y0);
      expect(o.y).toBeLessThanOrEqual(cfg.bounds.y1);
    }
  });

  it('can be solved: each animal fits together inside the table', () => {
    for (const c of cfg.compositions) {
      const xs = c.parts.map((p) => p.dx);
      const ys = c.parts.map((p) => p.dy);
      expect(Math.max(...xs) - Math.min(...xs)).toBeLessThanOrEqual(cfg.bounds.x1 - cfg.bounds.x0);
      expect(Math.max(...ys) - Math.min(...ys)).toBeLessThanOrEqual(cfg.bounds.y1 - cfg.bounds.y0);
      if (cfg.rotateStep) for (const p of c.parts) expect(p.rot % cfg.rotateStep).toBe(0);
      else for (const p of c.parts) expect(p.rot).toBe(0);
    }
  });

  it('orders the answer by marks', () => {
    const answer = [...cfg.compositions].sort((a, b) => a.order - b.order).map((c) => c.animal);
    expect(PUZZLES.find((p) => p.id === id)?.answer).toEqual(answer);
    expect(answer).not.toEqual(cfg.compositions.map((c) => c.animal));
  });
});

describe('difficulty curve', () => {
  it('runs from the star lantern to the attic, never asking for fewer signs', () => {
    expect(PUZZLES.map((p) => p.id)).toEqual([
      'c1-star-lantern', 'c1-tea-tray', 'c1-candle-courtyard', 'c2-puppet-pond', 'c2-toy-attic',
    ]);
    const lengths = PUZZLES.map((p) => p.answer.length);
    lengths.forEach((n, i) => i > 0 && expect(n).toBeGreaterThanOrEqual(lengths[i - 1]));
  });

  it('gives the attic more pieces, decoys and turning than the tea tray', () => {
    expect(TOY_ATTIC.objects.length).toBeGreaterThan(TEA_TRAY.objects.length);
    expect(TEA_TRAY.rotateStep).toBe(0);
    expect(TOY_ATTIC.rotateStep).toBeGreaterThan(0);
    const misturned = TOY_ATTIC.compositions.flatMap((c) => c.parts)
      .filter((p) => !sameRotation(TOY_ATTIC.objects.find((o) => o.id === p.id)!.rot, p.rot,
        OBJECTS[TOY_ATTIC.objects.find((o) => o.id === p.id)!.kind].symmetry));
    expect(misturned.length).toBeGreaterThanOrEqual(6);
  });
});
