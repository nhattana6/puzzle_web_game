import { describe, expect, it } from 'vitest';
import { glyph, isGlyphId } from '../src/core/glyphs';
import { PUZZLES } from '../src/puzzles';
import { EMPTY_TILE, isSolved, planRow, planSolve, rowDone, shuffledBoard, slide, solvedBoard } from '../src/puzzles/brokenSky';
import { CX, CY, foldPoint, GLYPH_SPOTS as MAP_GLYPHS, mapStars } from '../src/puzzles/foldedMap';
import { FAKE_SPOTS, LINE_PLATE, litLines, plateArt, starsOnLinePlate } from '../src/puzzles/glassPlates';
import { FLOATERS, hiddenReflections, reflectY, WATER_Y } from '../src/puzzles/lakeMirror';
import { CLOUDS_START, coveredGlyphs } from '../src/puzzles/nightClouds';
import { CANDLE_START, FACES, lightsLantern, projectedDots, WALL } from '../src/puzzles/pinholeLantern';
import { decodedUnder, FILTER_START, GLYPH_SPOTS as FILTER_GLYPHS } from '../src/puzzles/redFilter';
import { BATCHES, DECOY_WINDOWS, darkness, decoyGroups, faintStars, FLOOD_FROM, floodAmount, GLYPH_SIZE as DUSK_SIZE, groupBrightness, readable, shine, SLIDER, SUN_BOTTOM, SUN_TOP, sunYFor, windowMid } from '../src/puzzles/duskSky';
import { blurFor, FOCUS_START, LAYERS, MAX_BLUR, sharpLayer, snapFocus } from '../src/puzzles/starFocus';
import { CLUSTERS, coveredClusters, SPOT_START, stepCharge, stickers } from '../src/puzzles/glowStars';
import { centredSpot, GLASS, GLYPH_H, MAG, snapStrip, SPOTS as STRIP_SPOTS, STRIP_START, stripNoise, stripStars, throughWater } from '../src/puzzles/waterGlass';
import { alignedSpot, beadAt, beads, EYE_START, moonSpot, SPOTS as VANTAGE_SPOTS, GLYPH_SIZE as VANTAGE_SIZE, snapEye } from '../src/puzzles/vantagePoint';
import { placeStars } from '../src/core/glyphs';
import {
  carriedStars, completeConstellations, constellationStars, DOT_R, FEATHER_DECOYS, FEATHERS, featherFrame, footprint,
  isPlaced, nearSlot, PANEL_DECOYS, READING_ORDER, shownStars,
} from '../src/puzzles/featherWing';
import { GLYPHS } from '../src/core/glyphs';
import {
  KETTLE_START, PANE_COUNT, paneCentre, PRINTS, printsShown, READING_PANES, SMEAR_PANE, STEAM, steamOn, stepFog,
} from '../src/puzzles/frostWindow';

describe('level registry', () => {
  it('has fourteen levels with unique ids and valid answers of 3–4 constellations', () => {
    expect(PUZZLES).toHaveLength(14);
    expect(new Set(PUZZLES.map((p) => p.id)).size).toBe(PUZZLES.length);
    for (const p of PUZZLES) {
      expect(p.answer.length).toBeGreaterThanOrEqual(3);
      expect(p.answer.length).toBeLessThanOrEqual(4);
      expect(p.answer.every(isGlyphId)).toBe(true);
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
    expect(decoys.length).toBeGreaterThanOrEqual(6);
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
  it('plans the taps that finish a row, and returns at most the limit', () => {
    for (let seed = 1; seed <= 6; seed += 1) {
      const start = shuffledBoard(seed);
      for (const row of [0, 1, 2]) {
        const full = planRow(start, row, 99);
        let b = start;
        for (const t of full) b = slide(b, t)!;
        expect(rowDone(b, row)).toBe(true);
        expect(planRow(start, row, 2).length).toBeLessThanOrEqual(2);
        expect(planRow(start, row, 2)).toEqual(full.slice(0, 2));
      }
    }
    expect(planRow(solvedBoard(), 0)).toEqual([]);
  });

  it('plans taps that solve the whole board', () => {
    for (let seed = 1; seed <= 6; seed += 1) {
      let b = shuffledBoard(seed);
      const taps = planSolve(b);
      expect(taps.length).toBeGreaterThan(0);
      for (const t of taps) b = slide(b, t)!;
      expect(isSolved(b)).toBe(true);
    }
  });

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

describe('dusk sky', () => {
  it('shows no constellation by day, and only the right one in the middle of each window', () => {
    expect(darkness(SUN_TOP)).toBe(0);
    expect(darkness(SUN_BOTTOM)).toBe(1);
    expect(readable(0)).toEqual([]);
    BATCHES.forEach((_, i) => {
      expect(readable(windowMid(i))).toEqual([i]);
      expect(darkness(sunYFor(windowMid(i)))).toBeCloseTo(windowMid(i));
    });
  });

  it('lets each constellation fade out again, so they do not all show at once', () => {
    expect(readable(1)).toEqual([]);
    for (let d = 0; d <= 1; d += 0.01) expect(readable(d).length).toBeLessThanOrEqual(1);
    expect(shine(0.5, BATCHES[0].from, BATCHES[0].to)).toBe(0);
  });

  it('comes out in an order other than left to right', () => {
    const leftToRight = [...BATCHES].sort((a, b) => a.x - b.x).map((b) => b.id);
    expect(BATCHES.map((b) => b.id)).not.toEqual(leftToRight);
    expect(PUZZLES.find((p) => p.id === 'dusk-sky')?.answer).toEqual(BATCHES.map((b) => b.id));
  });

  it('puts decoy groups in the sky while each real one shines, clear of every real star', () => {
    const decoys = decoyGroups();
    expect(decoys).toHaveLength(DECOY_WINDOWS.length);
    BATCHES.forEach((_, i) => {
      const d = windowMid(i);
      expect(DECOY_WINDOWS.filter(([from, to]) => shine(d, from, to) > 0.6).length).toBeGreaterThanOrEqual(1);
    });
    const real = BATCHES.flatMap((b) => placeStars(b.id, b.x, b.y, DUSK_SIZE));
    for (const p of decoys.flat()) for (const r of real) expect(Math.hypot(p[0] - r[0], p[1] - r[1])).toBeGreaterThanOrEqual(60);
  });

  it('floods faint stars in gradually, and keeps them off the other stars', () => {
    expect(floodAmount(FLOOD_FROM)).toBe(0);
    expect(floodAmount(1)).toBe(1);
    expect(floodAmount(0.9)).toBeGreaterThan(0.3);
    // At full night every group that shone earlier is back at full brightness, among all the faint stars.
    for (const b of BATCHES) expect(groupBrightness(1, b.from, b.to)).toBe(1);
    for (const [from, to] of DECOY_WINDOWS) expect(groupBrightness(1, from, to)).toBe(1);
    expect(groupBrightness(0.5, BATCHES[0].from, BATCHES[0].to)).toBe(0);
    const faint = faintStars();
    expect(faint.length).toBeGreaterThanOrEqual(120);
    const bright = [...BATCHES.flatMap((b) => placeStars(b.id, b.x, b.y, DUSK_SIZE)), ...decoyGroups().flat()];
    for (const f of faint) for (const b of bright) expect(Math.hypot(f[0] - b[0], f[1] - b[1])).toBeGreaterThanOrEqual(34);
  });

  it('keeps the time slider on screen for every sun height', () => {
    expect(SLIDER.top).toBe(SUN_TOP);
    expect(SLIDER.bottom).toBe(SUN_BOTTOM);
    expect(SLIDER.x).toBeGreaterThan(0);
  });
});

describe('star focus', () => {
  it('starts with nothing sharp', () => {
    expect(sharpLayer(FOCUS_START)).toBe(-1);
    for (const l of LAYERS) expect(blurFor(FOCUS_START, l.depth)).toBeGreaterThanOrEqual(MAX_BLUR);
  });

  it('brings exactly one layer sharp at each depth and leaves the rest blurred', () => {
    LAYERS.forEach((l, i) => {
      expect(sharpLayer(l.depth)).toBe(i);
      expect(snapFocus(l.depth + 0.03)).toBe(l.depth);
      LAYERS.forEach((o, j) => {
        if (j !== i) expect(blurFor(l.depth, o.depth)).toBe(MAX_BLUR);
      });
    });
    expect(new Set(LAYERS.map((l) => l.phase)).size).toBe(LAYERS.length);
  });
});

describe('glow stars', () => {
  it('charges only in the lamp light and fades in the dark', () => {
    expect(stepCharge(0, true, false, 1)).toBe(0);
    expect(stepCharge(0, true, true, 2)).toBe(1);
    expect(stepCharge(1, false, true, 1)).toBeLessThan(1);
    expect(stepCharge(0.05, false, false, 5)).toBe(0);
  });

  it('lets the spot cover each constellation, one at a time, but none at the start', () => {
    expect(coveredClusters(...SPOT_START)).toEqual([]);
    CLUSTERS.forEach((c, i) => expect(coveredClusters(c.x + 10, c.y)).toEqual([i]));
  });

  it('scatters loose stickers away from the constellations', () => {
    const all = stickers();
    expect(all.filter((s) => s.cluster === null && s.kind === 'star').length).toBeGreaterThanOrEqual(25);
  });
});

describe('water glass', () => {
  it('undoes the squeeze and the mirror through the water', () => {
    for (const s of STRIP_SPOTS) {
      const stripX = GLASS.cx - s.x;
      const seen = stripStars(s.id, s.x).map(([x]) => throughWater(stripX + x));
      const normal = placeStars(s.id, GLASS.cx, 0, GLYPH_H).map(([x]) => x);
      seen.forEach((x, i) => expect(x).toBeCloseTo(normal[i]));
    }
  });

  it('fits each squeezed picture inside the glass, and starts on a blank stretch', () => {
    for (const s of STRIP_SPOTS) {
      for (const [x] of stripStars(s.id, s.x)) expect(Math.abs(x - s.x) * 3).toBeLessThan(GLASS.half);
    }
    expect(centredSpot(STRIP_START)).toBe(-1);
    expect(snapStrip(STRIP_START)).toBe(STRIP_START);
    STRIP_SPOTS.forEach((s, i) => expect(centredSpot(snapStrip(GLASS.cx - s.x + 30))).toBe(i));
  });

  it('keeps the view behind the glass clear of scribbles and spare moons', () => {
    const noise = stripNoise();
    for (const s of STRIP_SPOTS) {
      const near = (x: number) => Math.abs(x - s.x) * MAG < GLASS.half;
      expect(noise.lines.some(([a, b]) => near(a[0]) || near(b[0]))).toBe(false);
      expect(noise.moons.some(([x]) => Math.abs(x - s.x) * MAG < GLASS.half + 60)).toBe(false);
      const stars = stripStars(s.id, s.x);
      for (const [x, y] of noise.dots.filter(([x]) => near(x))) {
        for (const [sx, sy] of stars) expect(Math.hypot((x - sx) * MAG, y - sy)).toBeGreaterThan(40);
      }
    }
  });

  it('only counts pictures with a moon, in moon order', () => {
    const answer = PUZZLES.find((p) => p.id === 'water-glass')?.answer;
    expect(answer).toHaveLength(4);
    expect(answer).toEqual(STRIP_SPOTS.filter((s) => s.phase).sort((a, b) => a.phase! - b.phase!).map((s) => s.id));
  });
});

describe('vantage point', () => {
  const all = beads();

  it('lines each constellation up from its own viewpoint only', () => {
    VANTAGE_SPOTS.forEach((s, i) => {
      expect(alignedSpot(s.eye)).toBe(i);
      expect(snapEye(s.eye + 0.04)).toBe(s.eye);
      const home = placeStars(s.id, s.x, s.y, VANTAGE_SIZE);
      const mine = all.filter((b) => b.glyph === i);
      expect(new Set(mine.map((b) => b.row)).size).toBeGreaterThanOrEqual(2);
      mine.forEach((b, j) => {
        const [x, y] = beadAt(b, s.eye);
        expect(x).toBeCloseTo(home[j][0]);
        expect(y).toBeCloseTo(home[j][1]);
      });
      // From any other viewpoint (and the start) its rows are pulled well apart.
      for (const eye of [EYE_START, ...VANTAGE_SPOTS.filter((o) => o !== s).map((o) => o.eye)]) {
        const dx = mine.map((b, j) => beadAt(b, eye)[0] - home[j][0]);
        expect(Math.max(...dx) - Math.min(...dx)).toBeGreaterThan(50);
      }
    });
    expect(alignedSpot(EYE_START)).toBe(-1);
  });

  it('orders the answer by moon phase, unlike the rail or the sky order', () => {
    const byPhase = [...VANTAGE_SPOTS].sort((a, b) => a.phase - b.phase).map((s) => s.id);
    expect(PUZZLES.find((p) => p.id === 'vantage-point')?.answer).toEqual(byPhase);
    expect(new Set(VANTAGE_SPOTS.map((s) => s.phase)).size).toBe(4);
    expect(byPhase).not.toEqual([...VANTAGE_SPOTS].sort((a, b) => a.x - b.x).map((s) => s.id));
    expect(byPhase).not.toEqual([...VANTAGE_SPOTS].sort((a, b) => a.eye - b.eye).map((s) => s.id));
  });

  it('keeps every other bead off a constellation when it is lined up', () => {
    VANTAGE_SPOTS.forEach((s, i) => {
      const home = [...placeStars(s.id, s.x, s.y, VANTAGE_SIZE), moonSpot(s)];
      for (const b of all.filter((o) => o.glyph !== i)) {
        const [x, y] = beadAt(b, s.eye);
        for (const h of home) expect(Math.hypot(x - h[0], y - h[1])).toBeGreaterThan(40);
      }
    });
  });
});

describe('feather wing (chapter 2, level 1)', () => {
  const start = FEATHERS.map((f) => [f.start.x, f.start.y] as const);
  const placed = FEATHERS.map((f) => [f.slot.x, f.slot.y] as const);

  it('starts with no constellation complete, and no feather near any hollow', () => {
    expect(completeConstellations(start)).toEqual([]);
    FEATHERS.forEach((_, i) => FEATHERS.forEach((g) => expect(nearSlot(g, start[i][0], start[i][1])).toBe(false)));
    FEATHERS.forEach((f, i) => expect(shownStars(i, start).length).toBeLessThan(constellationStars(f).length));
  });

  it('completes each constellation once its feather is in the hollow', () => {
    expect(completeConstellations(placed)).toEqual([0, 1, 2]);
    FEATHERS.forEach((f, i) => expect(isPlaced(f, placed[i][0], placed[i][1])).toBe(true));
  });

  it('puts each star clearly on the feather or clearly on the wing, with some of each', () => {
    for (const f of FEATHERS) {
      const stars = constellationStars(f);
      for (const [x, y] of stars) expect(footprint(f, x, y)).not.toBe('edge');
      const carried = carriedStars(f);
      expect(carried.length).toBeGreaterThanOrEqual(1);
      expect(carried.length).toBeLessThanOrEqual(stars.length - 1);
    }
  });

  it('keeps other feathers from covering a constellation that is not theirs', () => {
    for (const f of FEATHERS) {
      for (const g of FEATHERS.filter((o) => o !== f)) {
        for (const [x, y] of constellationStars(f)) expect(footprint(g, x, y, 0)).toBe('out');
      }
    }
  });

  it('reads the feathers by their bars, which is not the order they hang in', () => {
    expect(FEATHERS.map((f) => f.bars.length).sort()).toEqual([1, 2, 3]);
    expect(READING_ORDER.map((i) => FEATHERS[i].bars.length)).toEqual([1, 2, 3]);
    expect(PUZZLES.find((p) => p.id === 'feather-wing')?.answer).toEqual(READING_ORDER.map((i) => FEATHERS[i].glyph));
    expect(READING_ORDER).not.toEqual([0, 1, 2]);
  });

  it('leaves the bars and the speckles clear of the constellation dots', () => {
    FEATHERS.forEach((f, i) => {
      const carried = carriedStars(f).map((s) => featherFrame(f, ...constellationStars(f)[s]));
      for (const c of carried) for (const b of f.bars) expect(Math.abs(c.v - b)).toBeGreaterThan(20);
      for (const [u, v] of FEATHER_DECOYS[i]) for (const c of carried) expect(Math.hypot(u - c.u, v - c.v)).toBeGreaterThan(DOT_R * 4);
    });
    const all = FEATHERS.flatMap(constellationStars);
    expect(PANEL_DECOYS.length).toBeGreaterThanOrEqual(6);
    for (const [x, y] of PANEL_DECOYS) {
      for (const [sx, sy] of all) expect(Math.hypot(x - sx, y - sy)).toBeGreaterThan(DOT_R * 5);
    }
  });
});

describe('frost window (chapter 2, level 2)', () => {
  const clear = new Array(PANE_COUNT).fill(0);
  /** Runs the fog for `seconds` with the kettle's steam point held on pane `pane`. */
  const fogFor = (fog: number[], pane: number, seconds: number): number[] => {
    const [cx, cy] = paneCentre(pane);
    const kettle: [number, number] = [cx - STEAM.dx, cy - STEAM.dy];
    let out = fog;
    for (let t = 0; t < seconds; t += 0.05) out = stepFog(out, kettle, 0.05);
    return out;
  };

  it('starts clear, with no print showing and the kettle away from the glass', () => {
    expect(clear.map(printsShown)).toEqual(clear);
    for (let i = 0; i < PANE_COUNT; i += 1) expect(steamOn(KETTLE_START, i)).toBe(0);
  });

  it('fogs the pane the steam is on and shows its prints, leaving far panes alone', () => {
    const fog = fogFor(clear, 5, 2.5);
    expect(printsShown(fog[5])).toBeGreaterThan(0.9);
    expect(printsShown(fog[0])).toBe(0);
    expect(fog[3]).toBeLessThan(fog[5]);
  });

  it('thins out again within a few seconds, and prints never show through a light mist', () => {
    let fog = fogFor(clear, 5, 2.5);
    for (let t = 0; t < 5; t += 0.05) fog = stepFog(fog, KETTLE_START, 0.05);
    expect(printsShown(fog[5])).toBe(0);
    expect(printsShown(0.3)).toBe(0);
  });

  it('puts one, two and three prints in three panes, and a smear that is no print', () => {
    expect(PRINTS.map((p) => p.at.length).sort()).toEqual([1, 2, 3]);
    expect(new Set(PRINTS.map((p) => p.pane)).size).toBe(3);
    expect(PRINTS.some((p) => p.pane === SMEAR_PANE)).toBe(false);
  });

  it('reads panes by print count and presses the key in the same place, not in window order', () => {
    expect(READING_PANES.map((p) => PRINTS.find((q) => q.pane === p)?.at.length)).toEqual([1, 2, 3]);
    const answer = PUZZLES.find((p) => p.id === 'frost-window')?.answer;
    expect(answer).toEqual(READING_PANES.map((p) => GLYPHS[p].id));
    expect(answer).toEqual(['dipper', 'triangle', 'arrow']);
    expect([...READING_PANES]).not.toEqual([...READING_PANES].sort((a, b) => a - b));
  });
});
