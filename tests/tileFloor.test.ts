import { describe, expect, it } from 'vitest';
import { PUZZLES } from '../src/puzzles';
import {
  ANIMALS, cellOf, COLS, INITIAL_CELLS, INITIAL_TURNS, moveTile, nextFloorHint, ROWS, TILES, wholeAt,
} from '../src/puzzles/tileFloor';

const solvedAt = (col: number, animal: number, cells: number[]) => {
  for (let q = 0; q < 4; q += 1) cells[animal * 4 + q] = cellOf(col + (q % 2), Math.floor(q / 2));
  return cells;
};

describe('tile floor', () => {
  it('fills the floor exactly, with two odd tiles', () => {
    expect(TILES).toHaveLength(COLS * ROWS);
    expect(new Set(INITIAL_CELLS).size).toBe(COLS * ROWS);
    expect(TILES.length - ANIMALS.length * 4).toBe(2);
    const odd = TILES.slice(ANIMALS.length * 4).map((t) => t.animal);
    for (const animal of odd) expect(ANIMALS.some((a) => a.animal === animal)).toBe(false);
  });

  it('starts with no animal whole and most tiles turned', () => {
    ANIMALS.forEach((_, a) => expect(wholeAt(INITIAL_CELLS, INITIAL_TURNS, a)).toBeNull());
    expect(INITIAL_TURNS.filter((t) => t % 4 !== 0).length).toBeGreaterThanOrEqual(8);
  });

  it('finds a whole animal in any 2x2 square, only when all four face up', () => {
    const turns = Array(TILES.length).fill(0);
    const cells = solvedAt(3, 1, [...INITIAL_CELLS].map(() => -1));
    expect(wholeAt(cells, turns, 1)).toBe(3);
    turns[5] = 2;
    expect(wholeAt(cells, turns, 1)).toBeNull();
    turns[5] = 4;
    expect(wholeAt(cells, turns, 1)).toBe(3);
  });

  it('swaps tiles when one is dropped on another', () => {
    const cells = moveTile(INITIAL_CELLS, 0, INITIAL_CELLS[1]);
    expect(cells[0]).toBe(INITIAL_CELLS[1]);
    expect(cells[1]).toBe(INITIAL_CELLS[0]);
  });

  it('hints one unfinished animal at a time', () => {
    expect(nextFloorHint(INITIAL_CELLS, INITIAL_TURNS, [])).toBe(0);
    expect(nextFloorHint(INITIAL_CELLS, INITIAL_TURNS, [0, 1])).toBe(2);
    expect(nextFloorHint(INITIAL_CELLS, INITIAL_TURNS, [0, 1, 2])).toBeNull();
  });

  it('finishes by itself instead of asking for an answer', () => {
    expect(PUZZLES.find((p) => p.id === 'c3-tile-floor')?.answer).toBeUndefined();
  });
});
