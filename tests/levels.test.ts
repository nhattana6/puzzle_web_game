import { describe, expect, it } from 'vitest';
import { glyph, isGlyphId } from '../src/core/glyphs';
import { PUZZLES } from '../src/puzzles';
import { EMPTY_TILE, isSolved, shuffledBoard, slide, solvedBoard } from '../src/puzzles/brokenSky';
import { CX, CY, foldPoint, GLYPH_SPOTS as MAP_GLYPHS, mapStars } from '../src/puzzles/foldedMap';
import { FAKE_SPOTS, LINE_PLATE, litLines, plateArt, starsOnLinePlate } from '../src/puzzles/glassPlates';
import { FLOATERS, hiddenReflections, reflectY, WATER_Y } from '../src/puzzles/lakeMirror';
import { CLOUDS_START, coveredGlyphs } from '../src/puzzles/nightClouds';
import { CANDLE_START, FACES, lightsLantern, projectedDots, WALL } from '../src/puzzles/pinholeLantern';
import { decodedUnder, FILTER_START, GLYPH_SPOTS as FILTER_GLYPHS } from '../src/puzzles/redFilter';

describe('level registry', () => {
  it('has seven levels with unique ids and valid answers of 3–4 constellations', () => {
    expect(PUZZLES).toHaveLength(7);
    expect(new Set(PUZZLES.map((p) => p.id)).size).toBe(PUZZLES.length);
    for (const p of PUZZLES) {
      expect(p.answer.length).toBeGreaterThanOrEqual(3);
      expect(p.answer.length).toBeLessThanOrEqual(4);
      expect(p.answer.every(isGlyphId)).toBe(true);
      expect(p.guide.steps.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('has globally unique firefly ids', () => {
    const ids = PUZZLES.flatMap((p) => p.fireflies.map((f) => f.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('night clouds', () => {
  it('starts with every constellation covered and clears when clouds leave', () => {
    expect(coveredGlyphs(CLOUDS_START)).toEqual([0, 1, 2]);
    expect(coveredGlyphs(CLOUDS_START.map(() => [-500, -500] as const))).toEqual([]);
  });
});

describe('lake mirror', () => {
  it('mirrors the sky about the waterline', () => {
    expect(reflectY(WATER_Y - 100)).toBe(WATER_Y + 100);
  });

  it('starts with every reflection hidden, and clears when floaters move away', () => {
    expect(hiddenReflections(FLOATERS.map((f) => f.start))).toEqual([0, 1, 2]);
    expect(hiddenReflections(FLOATERS.map(() => [-400, 900] as const))).toEqual([]);
  });
});

describe('red filter', () => {
  it('starts away from the chart and reads one constellation at a time', () => {
    expect(decodedUnder(...FILTER_START)).toEqual([]);
    FILTER_GLYPHS.forEach((g, i) => expect(decodedUnder(g.x, g.y)).toEqual([i]));
  });

  it('orders the answer by moon phase', () => {
    const answer = [...FILTER_GLYPHS].sort((a, b) => a.phase - b.phase).map((g) => g.id);
    expect(PUZZLES.find((p) => p.id === 'red-filter')?.answer).toEqual(answer);
  });
});

describe('pinhole lantern', () => {
  it('lights only when the candle is inside', () => {
    expect(lightsLantern(...CANDLE_START)).toBe(false);
    expect(lightsLantern(800, 650)).toBe(true);
  });

  it('projects mirrored dots, and uses constellations that look different mirrored', () => {
    for (const f of FACES) {
      const dots = projectedDots(f.glyph);
      const stars = glyph(f.glyph).stars;
      expect(dots[0][0] - WALL.x).toBeCloseTo(-(stars[0][0] - 50) * (WALL.size / 100));
      const mirrored = stars.map(([x, y]) => `${100 - x},${y}`).sort().join();
      expect(mirrored).not.toBe(stars.map(([x, y]) => `${x},${y}`).sort().join());
    }
    expect(new Set(FACES.map((f) => f.phase)).size).toBe(4);
  });
});

describe('folded map', () => {
  const stars = mapStars();

  it('brings every constellation star home after both folds', () => {
    for (const s of stars.filter((x) => x.glyph !== null)) {
      const [x, y] = foldPoint(s.open[0], s.open[1], 1, 1);
      expect(x).toBeCloseTo(s.final[0]);
      expect(y).toBeCloseTo(s.final[1]);
    }
  });

  it('spreads each constellation over at least two quarters of the open sheet', () => {
    MAP_GLYPHS.forEach((_, gi) => {
      const quarters = new Set(stars.filter((s) => s.glyph === gi).map((s) => `${s.open[0] > CX}${s.open[1] > CY}`));
      expect(quarters.size).toBeGreaterThanOrEqual(2);
    });
  });

  it('keeps decoys clear of the constellations once folded', () => {
    const decoys = stars.filter((s) => s.glyph === null);
    expect(decoys.length).toBeGreaterThanOrEqual(10);
    for (const d of decoys) {
      for (const s of stars.filter((x) => x.glyph !== null)) {
        expect(Math.hypot(d.final[0] - s.final[0], d.final[1] - s.final[1])).toBeGreaterThan(35);
      }
    }
  });
});

describe('glass plates', () => {
  const art = plateArt();

  it('lights exactly the constellation lines when laid on straight', () => {
    const lit = litLines(art, starsOnLinePlate(art, LINE_PLATE[0], LINE_PLATE[1], false));
    expect(lit).toEqual(Array.from({ length: art.glyphLines }, (_, i) => i));
    expect(art.lines.length - art.glyphLines).toBeGreaterThanOrEqual(15);
  });

  it('scratches fake constellations onto the line plate', () => {
    const fakeLines = FAKE_SPOTS.reduce((n, f) => n + glyph(f.id).lines.length, 0);
    expect(art.lines.length).toBeGreaterThanOrEqual(art.glyphLines + fakeLines + 15);
  });

  it('lights nothing useful when turned the wrong way', () => {
    const lit = litLines(art, starsOnLinePlate(art, LINE_PLATE[0], LINE_PLATE[1], true));
    expect(lit.length).toBeLessThan(art.glyphLines);
  });
});

describe('broken sky', () => {
  it('shuffles into a solvable, unsolved board', () => {
    const b = shuffledBoard();
    expect(isSolved(b)).toBe(false);
    expect(new Set(b).size).toBe(9);
  });

  it('only slides tiles next to the gap', () => {
    const b = solvedBoard();
    expect(slide(b, 7)).not.toBeNull();
    expect(slide(b, 0)).toBeNull();
    expect(slide(b, EMPTY_TILE)).toBeNull();
    expect(isSolved(slide(slide(b, 7)!, 7)!)).toBe(true);
  });
});
