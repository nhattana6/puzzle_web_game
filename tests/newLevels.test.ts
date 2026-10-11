import { describe, expect, it } from 'vitest';
import {
  isHallSolved, LANTERNS, litLanterns, MIRRORS, nextMirrorHint, PILLARS, traceBeam, type Tilt,
} from '../src/puzzles/mirrorHall';
import {
  COLS, isFieldWatered, masksFor, nextPipeHint, ROWS, rotateMask, SOLUTION, START_TURNS, watered,
} from '../src/puzzles/riceTerraces';

describe('mirror hall', () => {
  const solution = MIRRORS.map((m) => m.solution);
  const start = MIRRORS.map((m) => m.start);

  it('lights every lantern with the solution, and not at the start', () => {
    expect(isHallSolved(solution)).toBe(true);
    expect(isHallSolved(start)).toBe(false);
    expect(litLanterns(start).size).toBeLessThan(LANTERNS.length);
  });

  it('keeps decoy mirrors, lanterns and pillars off each other', () => {
    const key = ([c, r]: readonly number[]) => `${c},${r}`;
    const cells = [...MIRRORS.map((m) => key(m.at)), ...LANTERNS.map(key), ...PILLARS.map(key)];
    expect(new Set(cells).size).toBe(cells.length);
    const path = new Set(traceBeam(solution).map(key));
    expect(MIRRORS.filter((m) => !path.has(key(m.at))).length).toBeGreaterThanOrEqual(3);
  });

  it('bends the beam: / turns right-going light upward', () => {
    const tilts = [...start] as Tilt[];
    tilts[0] = 0;
    const path = traceBeam(tilts);
    expect(path.slice(0, 3)).toEqual([[0, 1], [1, 1], [2, 1]]);
    expect(path[3]).toEqual([2, 0]);
  });

  it('hints one wrong mirror on the solved path at a time', () => {
    const first = nextMirrorHint(start, [])!;
    expect(first).toBe(0);
    expect(nextMirrorHint(start, [first])).toBe(1);
    expect(nextMirrorHint(solution, [])).toBeNull();
  });
});

describe('rice terraces', () => {
  it('turns pipe openings clockwise', () => {
    expect(rotateMask(1)).toBe(2);
    expect(rotateMask(8)).toBe(1);
    expect(rotateMask(5, 1)).toBe(10);
    expect(rotateMask(3, 4)).toBe(3);
  });

  it('waters every piece when solved, and not at the start', () => {
    expect(SOLUTION).toHaveLength(COLS * ROWS);
    expect(isFieldWatered(SOLUTION.map(() => 0))).toBe(true);
    expect(isFieldWatered(START_TURNS)).toBe(false);
    expect(START_TURNS.every((t, i) => rotateMask(SOLUTION[i], t) !== SOLUTION[i])).toBe(true);
  });

  it('only lets water through openings that face each other', () => {
    const masks = masksFor(START_TURNS);
    const wet = watered(masks);
    expect(wet.size).toBeLessThan(COLS * ROWS);
  });

  it('hints a wrong piece next to the water first', () => {
    const first = nextPipeHint(START_TURNS, [])!;
    expect(first).not.toBeNull();
    expect(nextPipeHint(START_TURNS, [first])).not.toBe(first);
    expect(nextPipeHint(SOLUTION.map(() => 0), [])).toBeNull();
  });
});
