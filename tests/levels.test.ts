import { CHAPTERS, chapterUnlocked, levelUnlocked } from '../src/ui/chapters';
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
  CORNERS, cornerFor, constellationCentre, cornerPoint, DIMPLES, EXTRA_CLEARANCE, extraSpots, holeSpots, MARBLE_R, MARBLES, marbleSpots,
  marblesAt, READING_CORNERS, START_SPOTS, starSpots, TRAY,
} from '../src/puzzles/marbleTray';
import { bellSpot, LID, MAX_TURNS, melodyFor, SEQUENCE, swing } from '../src/puzzles/bellBox';
import {
  BAT_HOLLOW, HEAD_R, HOLLOW, hollowCentre, MOTH_START, OWLETS, READING_HOLLOWS, stepPeek, WAKE_R, wokenHollow,
} from '../src/puzzles/owletNest';
import {
  BLUR_FROM, blur, clarity, dotOpacity, frameRate, HALF, OMEGA_MAX, spinStep, tierStars, TIERS,
} from '../src/puzzles/spinLantern';
import {
  BOAT_PULSES, boatOn, CHART, chartConstellation, CHART_SIZE, CURTAIN, cycleFor, FLASH_STEP, hiddenLighthouses, lampOn, LIGHTHOUSES,
  READING as LIGHT_READING, viewSpot, WINDOW as VIEW,
} from '../src/puzzles/lighthouses';
import {
  angleOf, COUNTS, DICE, dotsIn, GEARS, KEY_POSITIONS, passes, radiusOf, turnsOf,
} from '../src/puzzles/gearBox';
import {
  CLUMP_GAP, CLUMP_TILT, clumpOrder, finalStars, fitting, HALF_BAR, isLevel, MAX_TILT, NOTCHES, offsetWith, ropeX, shapeCount, slideFor,
  SOLUTION_WEIGHTS, solutionNotch, starWorld, stringX, TIERS as MOBILE_TIERS, tiltFor, WEIGHTS,
} from '../src/puzzles/cradleMobile';
import {
  ACORN, acornSpots, COUNTS as DESK_COUNTS, ENTRIES, entryFor, entryStars, FRAME_ORDER, FRAMES, isAssembled, isFitted, startStates, stripOf,
  tapped,
} from '../src/puzzles/owlDesk';
import {
  BOARD, EMBLEMS, emblemAt, isSolved as courtSolved, isTile, LAMPS, litTiles, pillarNumber, pillarsSatisfied, readLamps, SIZE as COURT_SIZE,
  SOLUTION as COURT_SOLUTION, TILES,
} from '../src/puzzles/lampCourt';
import {
  allLit, columnOf, GATES, LAMP_GATES, LEVERS, READING as CIRCUIT_READING, lampsFor, signalsFor, solutions as circuitSolutions,
  SOLUTION as CIRCUIT_SOLUTION, wireCrossings, LEGEND_TYPES, legendCases,
} from '../src/puzzles/circuitPanel';
import {
  KETTLE_START, PANE_COUNT, paneCentre, PRINTS, printsShown, READING_PANES, SMEAR_PANE, STEAM, steamOn, stepFog,
} from '../src/puzzles/frostWindow';
import {
  carvingStars, CARVINGS, GLYPH_SIZE, interpolate, markSpot, PAPER, READING_ORDER as RUB_READING, revealedCarvings, SPECKS, sweepPlan,
} from '../src/puzzles/stoneRubbing';
import {
  insidePrint, KIDS, overlapFraction, PILE, READING_ORDER as SAND_READING, slotPos, visibleFraction,
} from '../src/puzzles/sandFootprints';

describe('level registry', () => {
  it('has twenty-six levels with unique ids and valid answers of 3–4 constellations', () => {
    expect(PUZZLES).toHaveLength(26);
    expect(new Set(PUZZLES.map((p) => p.id)).size).toBe(PUZZLES.length);
    for (const p of PUZZLES) {
      expect(p.answer.length).toBeGreaterThanOrEqual(3);
      expect(p.answer.length).toBeLessThanOrEqual(4);
      expect(p.answer.every(isGlyphId)).toBe(true);
    }
  });

});

describe('level unlocking', () => {
  const ids1 = CHAPTERS[0].levels.map((p) => p.id);
  const ids2 = CHAPTERS[1].levels.map((p) => p.id);

  it('opens only the first level of chapter 1 on a fresh save', () => {
    expect(levelUnlocked(ids1[0], [])).toBe(true);
    expect(ids1.slice(1).some((id) => levelUnlocked(id, []))).toBe(false);
    expect(ids2.some((id) => levelUnlocked(id, []))).toBe(false);
  });

  it('opens each level once the one before it is solved', () => {
    expect(levelUnlocked(ids1[1], [ids1[0]])).toBe(true);
    expect(levelUnlocked(ids1[2], [ids1[0]])).toBe(false);
    expect(levelUnlocked(ids1[5], ids1.slice(0, 5))).toBe(true);
  });

  it('keeps chapter 2 shut until chapter 1 is complete', () => {
    const almost = ids1.slice(0, -1);
    expect(chapterUnlocked(1, almost)).toBe(false);
    expect(levelUnlocked(ids2[0], almost)).toBe(false);
    expect(chapterUnlocked(1, ids1)).toBe(true);
    expect(levelUnlocked(ids2[0], ids1)).toBe(true);
    expect(levelUnlocked(ids2[1], ids1)).toBe(false);
    expect(levelUnlocked(ids2[1], [...ids1, ids2[0]])).toBe(true);
  });

  it('never closes a level that is already solved, and rejects unknown ids', () => {
    expect(levelUnlocked(ids2[3], [ids2[3]])).toBe(true);
    expect(levelUnlocked('nope', ids1)).toBe(false);
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

describe('marble tray (chapter 2, level 3)', () => {
  const corners = CORNERS.map((_, c) => c);
  const hollows = corners.flatMap((c) => starSpots(c));

  it('always shows all eight marbles: a constellation and the rest spread elsewhere', () => {
    expect(START_SPOTS).toHaveLength(MARBLES);
    for (const c of corners) {
      expect(marbleSpots(c)).toHaveLength(MARBLES);
      expect(starSpots(c).length).toBeLessThanOrEqual(MARBLES - 2);
      expect(extraSpots(c)).toHaveLength(MARBLES - starSpots(c).length);
    }
  });

  it('starts with the marbles away from every constellation and from each other', () => {
    for (const [x, y] of START_SPOTS) for (const [hx, hy] of hollows) expect(Math.hypot(x - hx, y - hy)).toBeGreaterThan(60);
    const at = marblesAt(null);
    at.forEach(([x, y], i) => at.slice(i + 1).forEach(([ox, oy]) => expect(Math.hypot(x - ox, y - oy)).toBeGreaterThan(MARBLE_R * 2)));
  });

  it('never overlaps two marbles in any resting state, nor leaves the playing surface', () => {
    for (const c of corners) {
      const at = marbleSpots(c);
      at.forEach(([x, y], i) => {
        expect(Math.abs(x - TRAY.x)).toBeLessThan(TRAY.half - TRAY.rim - MARBLE_R);
        expect(Math.abs(y - TRAY.y)).toBeLessThan(TRAY.half - TRAY.rim - MARBLE_R);
        at.slice(i + 1).forEach(([ox, oy]) => expect(Math.hypot(x - ox, y - oy)).toBeGreaterThan(MARBLE_R * 2 + 4));
      });
    }
  });

  it('spreads the other marbles over plain dimples: far from the shape, from each other, from every corner, and never piled', () => {
    for (const c of corners) {
      const stars = starSpots(c);
      const extras = extraSpots(c);
      for (const [x, y] of extras) {
        for (const [sx, sy] of stars) expect(Math.hypot(x - sx, y - sy)).toBeGreaterThanOrEqual(EXTRA_CLEARANCE);
        for (const [hx, hy] of hollows) expect(Math.hypot(x - hx, y - hy)).toBeGreaterThan(40);
        expect(DIMPLES.some(([dx, dy]) => Math.hypot(x - dx, y - dy) < 1)).toBe(true);
        const [px, py] = cornerPoint(c);
        expect(Math.hypot(x - px, y - py)).toBeGreaterThan(110);
      }
      extras.forEach(([x, y], i) => extras.slice(i + 1).forEach(([ox, oy]) => expect(Math.hypot(x - ox, y - oy)).toBeGreaterThan(90)));
    }
  });

  it('hides every resting place among the dimples', () => {
    for (const [x, y] of hollows) expect(DIMPLES.some(([dx, dy]) => Math.hypot(x - dx, y - dy) < 1)).toBe(true);
    expect(DIMPLES.length).toBeGreaterThan(hollows.length + 30);
  });

  it('tips toward the corner you touch, and nothing in the middle', () => {
    expect(cornerFor(TRAY.x, TRAY.y)).toBe(-1);
    for (const c of corners) {
      const [x, y] = constellationCentre(c);
      expect(cornerFor(x, y)).toBe(c);
      const [px, py] = cornerPoint(c);
      expect(cornerFor(px, py)).toBe(c);
    }
  });

  it('reads the corners by their drilled holes, which is not the order around the tray', () => {
    expect(CORNERS.map((k) => holeSpots(CORNERS.indexOf(k)).length)).toEqual(CORNERS.map((k) => k.holes));
    expect(READING_CORNERS.map((c) => CORNERS[c].holes)).toEqual([1, 2, 3, 4]);
    expect(PUZZLES.find((p) => p.id === 'marble-tray')?.answer).toEqual(READING_CORNERS.map((c) => CORNERS[c].glyph));
    expect(new Set(CORNERS.map((k) => k.glyph)).size).toBe(4);
    expect([...READING_CORNERS]).not.toEqual([0, 1, 2, 3]);
    expect([...READING_CORNERS]).not.toEqual([0, 1, 2, 3].reverse());
  });
});

describe('bell box (chapter 2, level 4)', () => {
  it('plays nothing without a turn, stops partway on fewer than four, and ends on the lid bell', () => {
    expect(melodyFor(0)).toEqual([]);
    expect(melodyFor(2)).toEqual(SEQUENCE.slice(0, 2));
    expect(melodyFor(3)).toHaveLength(3);
    expect(melodyFor(4)).toEqual([...SEQUENCE]);
    expect(melodyFor(MAX_TURNS)).toEqual([...SEQUENCE, LID]);
    expect(melodyFor(99)).toEqual(melodyFor(MAX_TURNS));
  });

  it('strikes four different bells of the nine, in an order that is not the grid order', () => {
    expect(new Set(SEQUENCE).size).toBe(SEQUENCE.length);
    expect(SEQUENCE.every((b) => b >= 0 && b < 9)).toBe(true);
    expect(SEQUENCE).not.toEqual([...SEQUENCE].sort((a, b) => a - b));
    expect(SEQUENCE.includes(LID)).toBe(false);
  });

  it('answers with the keys in the same places as the bells struck', () => {
    expect(PUZZLES.find((p) => p.id === 'bell-box')?.answer).toEqual(SEQUENCE.map((b) => GLYPHS[b].id));
    expect(PUZZLES.find((p) => p.id === 'bell-box')?.answer).toEqual(['belt', 'hook', 'square', 'diamond']);
    // The bells hang in the keypad's own 3×3 order: left to right, then down.
    for (let i = 0; i < 9; i += 1) {
      expect(bellSpot(i)[0]).toBe(bellSpot(i % 3)[0]);
      expect(bellSpot(i)[1]).toBe(bellSpot(Math.floor(i / 3) * 3)[1]);
    }
    expect(bellSpot(1)[0]).toBeGreaterThan(bellSpot(0)[0]);
    expect(bellSpot(3)[1]).toBeGreaterThan(bellSpot(0)[1]);
  });

  it('swings a struck bell and lets it settle', () => {
    expect(swing(-1)).toBe(0);
    expect(swing(0)).toBe(0);
    expect(Math.max(...Array.from({ length: 30 }, (_, i) => Math.abs(swing(i / 60))))).toBeGreaterThan(5);
    expect(Math.abs(swing(1.8))).toBeLessThan(0.1);
  });
});

describe('owlet nest (chapter 2, level 5)', () => {
  it('has four owlets of clearly different sizes and a bat, each in its own hollow, and leaves the rest empty', () => {
    const sizes = OWLETS.map((o) => o.size).sort((a, b) => a - b);
    sizes.slice(1).forEach((s, i) => expect(s / sizes[i]).toBeGreaterThanOrEqual(1.2));
    const places = [...OWLETS.map((o) => o.hollow), BAT_HOLLOW];
    expect(new Set(places).size).toBe(5);
    expect(places.every((h) => h >= 0 && h < 9)).toBe(true);
    // The biggest head still fits in its hollow when peeking.
    expect(16 + HEAD_R * Math.max(...sizes)).toBeLessThanOrEqual(HOLLOW.ry);
  });

  it('wakes nothing at the start, and the nearest hollow when the moth comes close', () => {
    expect(wokenHollow(...MOTH_START)).toBe(-1);
    for (let i = 0; i < 9; i += 1) expect(wokenHollow(...hollowCentre(i))).toBe(i);
    const [ax, ay] = hollowCentre(0);
    const [bx] = hollowCentre(1);
    expect(wokenHollow((ax + bx) / 2 - 20, ay)).toBe(0);
    expect(wokenHollow(30, 30)).toBe(-1);
    expect(WAKE_R).toBeLessThan((bx - ax) / 2 + 40);
  });

  it('pops out quickly and ducks back slowly, so a sweep leaves several out at once', () => {
    let peek: number[] = new Array(9).fill(0);
    for (let t = 0; t < 0.3; t += 0.05) peek = stepPeek(peek, 4, 0.05);
    expect(peek[4]).toBe(1);
    expect(peek[3]).toBe(0);
    for (let t = 0; t < 0.5; t += 0.05) peek = stepPeek(peek, 2, 0.05);
    expect(peek[4]).toBeGreaterThan(0.3);
    expect(peek[2]).toBe(1);
    for (let t = 0; t < 2; t += 0.05) peek = stepPeek(peek, -1, 0.05);
    expect(peek.every((p) => p === 0)).toBe(true);
  });

  it('reads the owlets smallest first and presses the key in the same place', () => {
    expect([...OWLETS].sort((a, b) => a.size - b.size).map((o) => o.hollow)).toEqual([...READING_HOLLOWS]);
    const answer = PUZZLES.find((p) => p.id === 'owlet-nest')?.answer;
    expect(answer).toEqual(READING_HOLLOWS.map((h) => GLYPHS[h].id));
    expect(answer).toEqual(['arrow', 'crown', 'dipper', 'cross']);
    expect([...READING_HOLLOWS]).not.toEqual([...READING_HOLLOWS].sort((a, b) => a - b));
  });
});

describe('spin lantern (chapter 2, level 6)', () => {
  const tiers = TIERS.map((_, t) => t);
  const lit = (t: number, s: number, frame: number) => tierStars(t).map((_, k) => dotOpacity(t, k, s, frame));

  it('shows one dot at a time per tier when still or slow, so no constellation at the start', () => {
    for (const t of tiers) {
      for (let frame = 0; frame < tierStars(t).length; frame += 1) {
        const o = lit(t, 0, frame);
        expect(o.filter((v) => v > 0.5)).toHaveLength(1);
        expect(o.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
      }
    }
  });

  it('holds all of a tier\'s dots at its own speed, and only that tier\'s', () => {
    for (const t of tiers) {
      const c = TIERS[t].centre;
      expect(lit(t, c, 0).every((v) => v === 1)).toBe(true);
      for (const other of tiers.filter((o) => o !== t)) {
        // At this tier's speed no other tier shows all its dots.
        expect(clarity(other, c)).toBe(0);
      }
    }
  });

  it('keeps the speed windows apart, comfortably inside the range, before the blur', () => {
    const centres = TIERS.map((x) => x.centre).sort((a, b) => a - b);
    centres.slice(1).forEach((c, i) => expect(c - centres[i]).toBeGreaterThanOrEqual(2 * HALF - 1e-9));
    expect(centres[0] - HALF).toBeGreaterThan(0.05);
    expect(centres[centres.length - 1] + HALF).toBeLessThanOrEqual(BLUR_FROM + 1e-9);
  });

  it('blurs every dot away when spun too fast', () => {
    expect(blur(BLUR_FROM)).toBe(0);
    expect(blur(1)).toBe(1);
    for (const t of tiers) expect(lit(t, 1, 0).every((v) => v === 0)).toBe(true);
    expect(frameRate(1)).toBeGreaterThan(frameRate(0));
  });

  it('follows the hand while it turns the fan, then slows down by itself', () => {
    let s = 0;
    for (let t = 0; t < 1; t += 0.05) s = spinStep(s, 0.8, 0.05);
    expect(s).toBeGreaterThan(0.75);
    let previous = s;
    for (let t = 0; t < 12; t += 0.05) {
      s = spinStep(s, null, 0.05);
      expect(s).toBeLessThanOrEqual(previous);
      previous = s;
    }
    expect(s).toBe(0);
    // Full speed is only reached by turning at OMEGA_MAX.
    expect(OMEGA_MAX).toBeGreaterThan(5);
  });

  it('reads the tiers top to bottom, which is not the order they come clear', () => {
    expect(PUZZLES.find((p) => p.id === 'spin-lantern')?.answer).toEqual(['belt', 'hook', 'diamond', 'crown']);
    const byClear = [...tiers].sort((a, b) => TIERS[a].centre - TIERS[b].centre);
    expect(byClear).not.toEqual(tiers);
    expect(new Set(TIERS.map((x) => x.glyph)).size).toBe(4);
  });
});

describe('lighthouses (chapter 2, level 7)', () => {
  /** Flash groups seen in `seconds` of lighthouse i, as the number of flashes in each group. */
  const groups = (i: number, seconds: number): number[] => {
    const out: number[] = [];
    let was = false;
    let count = 0;
    let darkFor = 0;
    for (let t = 0; t < seconds; t += 0.02) {
      const on = lampOn(i, t);
      if (on && !was) {
        if (darkFor > FLASH_STEP + 0.3 && count > 0) {
          out.push(count);
          count = 0;
        }
        count += 1;
      }
      darkFor = on ? 0 : darkFor + 0.02;
      was = on;
    }
    return out;
  };

  it('has six lighthouses: four with one to four flashes and two dark', () => {
    expect(LIGHTHOUSES.map((l) => l.flashes).sort()).toEqual([0, 0, 1, 2, 3, 4]);
    for (const [i, l] of LIGHTHOUSES.entries()) {
      if (l.flashes === 0) {
        expect(Array.from({ length: 400 }, (_, k) => lampOn(i, k * 0.05)).some(Boolean)).toBe(false);
      } else {
        const g = groups(i, 40).slice(1);
        expect(g.length).toBeGreaterThan(3);
        expect(g.every((n) => n === l.flashes)).toBe(true);
        expect(cycleFor(l.flashes) - l.flashes * FLASH_STEP).toBeGreaterThanOrEqual(2 * FLASH_STEP);
      }
    }
  });

  it('keeps the same left-to-right order on the chart and in the window, with room between', () => {
    const xs = LIGHTHOUSES.map((_, i) => viewSpot(i).x);
    xs.slice(1).forEach((x, i) => expect(x - xs[i]).toBeGreaterThan(150));
    expect(Math.min(...xs)).toBeGreaterThan(VIEW.x + 20);
    expect(Math.max(...xs)).toBeLessThan(VIEW.x + VIEW.w - 20);
    const cx = LIGHTHOUSES.map((l) => l.chart.x);
    cx.slice(1).forEach((x, i) => expect(x).toBeGreaterThan(cx[i]));
  });

  it('prints each constellation beside its lighthouse on the chart, clear of the others', () => {
    const spots = LIGHTHOUSES.map((_, i) => chartConstellation(i));
    spots.forEach(([x, y], i) => {
      expect(x - CHART_SIZE / 2).toBeGreaterThan(CHART.x);
      expect(x + CHART_SIZE / 2).toBeLessThan(CHART.x + CHART.w);
      expect(y - CHART_SIZE / 2).toBeGreaterThan(CHART.y);
      spots.slice(i + 1).forEach(([ox, oy]) => expect(Math.hypot(x - ox, y - oy)).toBeGreaterThan(CHART_SIZE * 1.5));
      for (const l of LIGHTHOUSES) expect(Math.hypot(x - l.chart.x, y - l.chart.y)).toBeGreaterThan(CHART_SIZE / 2);
    });
    expect(new Set(LIGHTHOUSES.map((l) => l.glyph)).size).toBe(6);
  });

  it('hides the right half behind the curtain, including two lit lighthouses, until it is drawn aside', () => {
    const hidden = hiddenLighthouses(0);
    expect(hidden.length).toBe(3);
    expect(hidden.filter((i) => LIGHTHOUSES[i].flashes > 0).length).toBe(2);
    expect(hiddenLighthouses(CURTAIN.reach)).toEqual([]);
    expect(hiddenLighthouses(0).every((i) => !hiddenLighthouses(CURTAIN.reach).includes(i))).toBe(true);
  });

  it('reads the lit lighthouses by number of flashes, which is not left to right', () => {
    expect(PUZZLES.find((p) => p.id === 'lighthouses')?.answer).toEqual(['hook', 'square', 'triangle', 'cross']);
    expect(LIGHT_READING.map((i) => LIGHTHOUSES[i].flashes)).toEqual([1, 2, 3, 4]);
    const leftToRight = LIGHTHOUSES.map((_, i) => i).filter((i) => LIGHTHOUSES[i].flashes > 0);
    expect([...LIGHT_READING]).not.toEqual(leftToRight);
  });

  it('flickers the boat light without a regular rhythm', () => {
    const starts = BOAT_PULSES.map(([s]) => s);
    const gaps = starts.slice(1).map((s, i) => Math.round((s - starts[i]) * 100));
    expect(new Set(gaps).size).toBeGreaterThanOrEqual(5);
    expect(boatOn(BOAT_PULSES[0][0] + 0.05)).toBe(true);
    expect(boatOn(0)).toBe(false);
  });
});

describe('gear box (chapter 2, level 8)', () => {
  it('meshes each gear with the next and keeps the others apart', () => {
    GEARS.forEach((g, i) => {
      GEARS.slice(i + 1).forEach((h, k) => {
        const d = Math.hypot(g.x - h.x, g.y - h.y);
        const touching = radiusOf(g) + radiusOf(h);
        if (k === 0) expect(Math.abs(d - touching)).toBeLessThan(1.5);
        else expect(d).toBeGreaterThan(touching + 6);
      });
    });
  });

  it('turns small gears more: counts are whole numbers from one crank turn', () => {
    for (const g of GEARS.filter((x) => x.paint)) expect(Number.isInteger(turnsOf(g))).toBe(true);
    expect(COUNTS).toEqual([3, 4, 1, 2]);
    // Nothing to count above four: it has to be countable by eye.
    expect(Math.max(...COUNTS)).toBeLessThanOrEqual(4);
    GEARS.forEach((g, i) => {
      expect(passes(i, 0)).toBe(0);
      if (g.paint) expect(passes(i, 360)).toBe(turnsOf(g));
      else expect(passes(i, 360)).toBe(0);
    });
    // Neighbours turn opposite ways.
    expect(Math.sign(angleOf(0, 90))).toBe(-Math.sign(angleOf(1, 90)));
  });

  it('counts a pass only once the painted tooth has really gone by its pointer', () => {
    // Gear 1 turns three times: its tooth starts half a turn from the pointer.
    expect(passes(1, 55)).toBe(0);
    expect(passes(1, 65)).toBe(1);
    expect(passes(1, 170)).toBe(1);
    expect(passes(1, 185)).toBe(2);
  });

  it('has one gear without paint in the chain, skipped in the count', () => {
    const unpainted = GEARS.filter((g, i) => i > 0 && !g.paint);
    expect(unpainted).toHaveLength(1);
    expect(GEARS.filter((g) => g.paint)).toHaveLength(COUNTS.length);
  });

  it('turns each count into the key in the hole with that many dots, in chain order', () => {
    for (let p = 0; p < 9; p += 1) expect(DICE[dotsIn(p)]).toHaveLength(dotsIn(p));
    expect(KEY_POSITIONS).toEqual([2, 3, 0, 1]);
    expect(PUZZLES.find((p) => p.id === 'gear-box')?.answer).toEqual(['crown', 'cross', 'triangle', 'square']);
    expect([...KEY_POSITIONS]).not.toEqual([...KEY_POSITIONS].sort((a, b) => a - b));
  });
});

describe('cradle mobile (chapter 2, level 9)', () => {
  const tiers = MOBILE_TIERS.map((_, t) => t);
  const perms = <T,>(a: T[]): T[][] => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));

  it('tilts the heavy side down, and starts every bar off level', () => {
    expect(Math.abs(tiltFor(0))).toBe(0);
    expect(tiltFor(30)).toBeGreaterThan(0);
    expect(tiltFor(-30)).toBeLessThan(0);
    expect(Math.abs(tiltFor(900))).toBe(MAX_TILT);
    for (const t of tiers) {
      const off = offsetWith(t, []);
      expect(isLevel(off)).toBe(false);
      expect(Math.abs(tiltFor(off))).toBeGreaterThanOrEqual(8);
    }
  });

  it('has exactly one way to give the four acorns one to a bar, and it is not in weight order', () => {
    const feasible = (t: number, w: number) => fitting(t, w).length > 0;
    const good = perms([...WEIGHTS]).filter((p) => p.every((w, t) => feasible(t, w)));
    expect(good).toEqual([[...SOLUTION_WEIGHTS]]);
    expect([...SOLUTION_WEIGHTS]).not.toEqual([...SOLUTION_WEIGHTS].sort((a, b) => a - b));
    expect([...SOLUTION_WEIGHTS]).not.toEqual([...SOLUTION_WEIGHTS].sort((a, b) => b - a));
    // Some bars take more than one acorn on its own, so it has to be worked out.
    expect(tiers.filter((t) => WEIGHTS.filter((w) => feasible(t, w)).length >= 2).length).toBeGreaterThanOrEqual(2);
  });

  it('levels every bar with its solution acorn, and no bar level before', () => {
    for (const t of tiers) {
      const w = SOLUTION_WEIGHTS[t];
      expect(isLevel(offsetWith(t, [{ w, n: solutionNotch(t) }]))).toBe(true);
      expect(NOTCHES).toContain(solutionNotch(t));
      // A notch at the far end of its reach is allowed, but it must be on the bar.
      expect(Math.abs(solutionNotch(t))).toBeLessThan(HALF_BAR);
    }
  });

  it('puts every star in its place when level, and out of shape when tilted', () => {
    for (const t of tiers) {
      const tilted = tiltFor(offsetWith(t, []));
      const moved = finalStars(t).map(([fx, fy], j) => {
        const [x, y] = starWorld(t, j, 0);
        expect(Math.hypot(x - fx, y - fy)).toBeLessThan(0.01);
        const [sx, sy] = starWorld(t, j, tilted);
        return Math.hypot(sx - fx, sy - fy);
      });
      // Every star is well out of place: bunched at the low end of the bar.
      expect(Math.min(...moved)).toBeGreaterThan(15);
      expect(ropeX(t)).not.toBeCloseTo(stringX(t), 0);
    }
  });

  it('keeps the noise stars well away from the shape, on the bar, and the ropes apart', () => {
    for (const t of tiers) {
      const stars = finalStars(t);
      const n = shapeCount(t);
      expect(stars).toHaveLength(n + 2);
      for (const [nx, ny] of stars.slice(n)) {
        for (const [sx, sy] of stars.slice(0, n)) expect(Math.hypot(nx - sx, ny - sy)).toBeGreaterThan(65);
      }
      for (const [x] of stars) expect(Math.abs(x - stringX(t))).toBeLessThan(HALF_BAR - 20);
    }
    const xs = tiers.map(ropeX);
    xs.slice(1).forEach((x, i) => expect(x - xs[i]).toBeGreaterThan(220));
  });

  it('bunches the stars at the low end when the bar tilts, so nothing can be read off a tilted bar', () => {
    expect(slideFor(0)).toBe(0);
    expect(slideFor(CLUMP_TILT)).toBe(1);
    expect(slideFor(-CLUMP_TILT - 5)).toBe(1);
    for (const t of tiers) {
      const theta = tiltFor(offsetWith(t, []));
      const n = finalStars(t).length;
      expect(clumpOrder(t).slice().sort((a, b) => a - b)).toEqual(Array.from({ length: n }, (_, j) => j));
      const xs = finalStars(t).map((_, j) => starWorld(t, j, theta)[0]);
      const r = (theta * Math.PI) / 180;
      // They sit in a tight row along the bar, within the clump, and never off the bar's end.
      const along = xs.map((x) => (x - ropeX(t)) / Math.cos(r));
      const span = Math.max(...along) - Math.min(...along);
      expect(span).toBeLessThanOrEqual((n - 1) * CLUMP_GAP + 1);
      // And it is narrower than the spread of the stars when level.
      const level = finalStars(t).map(([x]) => x);
      expect(span).toBeLessThan(Math.max(...level) - Math.min(...level));
    }
  });

  it('reads the tiers top to bottom', () => {
    expect(PUZZLES.find((p) => p.id === 'cradle-mobile')?.answer).toEqual(['dipper', 'square', 'crown', 'belt']);
    const ys = MOBILE_TIERS.map((x) => x.barY);
    ys.slice(1).forEach((y, i) => expect(y).toBeGreaterThan(ys[i]));
    expect(new Set(MOBILE_TIERS.map((x) => x.glyph)).size).toBe(4);
  });
});

describe('owl desk (chapter 2, level 10)', () => {
  it('prints eight entries with different numbers (no five) and different constellations', () => {
    expect(ENTRIES).toHaveLength(8);
    expect(new Set(ENTRIES.map((e) => e.number)).size).toBe(8);
    expect(ENTRIES.map((e) => e.number).sort()).toEqual([1, 2, 3, 4, 6, 7, 8, 9]);
    expect(new Set(ENTRIES.map((e) => e.glyph)).size).toBe(8);
    // Arrow and diamond look alike as dots; only one of them is in the book.
    expect(ENTRIES.some((e) => e.glyph === 'arrow')).toBe(false);
  });

  it('cuts every constellation by a tear, so no entry can be read from one strip', () => {
    for (const e of ENTRIES) {
      const strips = new Set(entryStars(e).map(([x, y]) => stripOf(x, y)));
      expect(strips.size).toBeGreaterThanOrEqual(2);
    }
  });

  it('shows the pictures from the smallest frame to the biggest, which is not the order on the wall', () => {
    expect(new Set(FRAMES.map((f) => f.size)).size).toBe(4);
    expect([...FRAME_ORDER]).not.toEqual([0, 1, 2, 3]);
    expect(DESK_COUNTS).toEqual([7, 2, 9, 4]);
    for (const n of DESK_COUNTS) expect(ENTRIES.some((e) => e.number === n)).toBe(true);
    expect(PUZZLES.find((p) => p.id === 'owl-desk')?.answer).toEqual(DESK_COUNTS.map((n) => entryFor(n).glyph));
    expect(PUZZLES.find((p) => p.id === 'owl-desk')?.answer).toEqual(['hook', 'cross', 'diamond', 'belt']);
  });

  it('draws exactly as many acorns in each frame as it says, apart from each other and inside the frame', () => {
    FRAMES.forEach((f, i) => {
      const spots = acornSpots(i);
      expect(spots).toHaveLength(f.acorns);
      const half = f.size / 2 - 12;
      spots.forEach(([x, y], k) => {
        expect(Math.abs(x) + ACORN.rx).toBeLessThanOrEqual(half);
        expect(Math.abs(y) + ACORN.ry).toBeLessThanOrEqual(half);
        spots.slice(k + 1).forEach(([ox, oy]) => expect(Math.hypot(x - ox, y - oy)).toBeGreaterThanOrEqual(ACORN.rx * 2 + 4));
      });
    });
  });

  it('starts with the strips scattered, one turned round and one face down, and is whole only when all four fit', () => {
    const s = startStates();
    expect(isAssembled(s)).toBe(false);
    expect(s.some((x) => !x.faceUp)).toBe(true);
    expect(s.some((x) => x.turn === 180)).toBe(true);
    expect(s.every((x) => x.slot === null)).toBe(true);
    const whole = s.map((_, i) => ({ slot: i, turn: 0 as const, faceUp: true }));
    expect(isAssembled(whole)).toBe(true);
    // One strip in the wrong place, or the wrong way up, or face down, is not whole.
    expect(isAssembled(whole.map((x, i) => (i === 0 ? { ...x, slot: 1 } : x)))).toBe(false);
    expect(isAssembled(whole.map((x, i) => (i === 2 ? { ...x, turn: 180 as const } : x)))).toBe(false);
    expect(isAssembled(whole.map((x, i) => (i === 3 ? { ...x, faceUp: false } : x)))).toBe(false);
    expect(isFitted(1, whole[1])).toBe(true);
  });

  it('turns a face-down strip over with one tap, and a face-up strip round with each tap after', () => {
    let s = { slot: 0 as number | null, turn: 180 as 0 | 180, faceUp: false };
    s = tapped(s);
    expect(s).toEqual({ slot: 0, turn: 180, faceUp: true });
    s = tapped(s);
    expect(s).toEqual({ slot: 0, turn: 0, faceUp: true });
    s = tapped(s);
    expect(s.turn).toBe(180);
    // Whatever the start, at most two taps put a strip right.
    for (const st of startStates()) {
      let x = st;
      for (let k = 0; k < 2 && !(x.faceUp && x.turn === 0); k += 1) x = tapped(x);
      expect(x.faceUp && x.turn === 0).toBe(true);
    }
  });
});

describe('lamp court (chapter 2, level 11)', () => {
  const tiles = TILES.map(([r, c]) => [r, c] as [number, number]);
  const combos = (arr: [number, number][], k: number, start = 0, cur: [number, number][] = [], out: [number, number][][] = []) => {
    if (cur.length === k) { out.push([...cur]); return out; }
    for (let i = start; i < arr.length; i += 1) { cur.push(arr[i]); combos(arr, k, i + 1, cur, out); cur.pop(); }
    return out;
  };

  it('is a six-by-six court with pillars, some carrying dots, and four lamps', () => {
    expect(BOARD).toHaveLength(COURT_SIZE);
    expect(BOARD.every((row) => row.length === COURT_SIZE)).toBe(true);
    expect(LAMPS).toBe(4);
    const numbered = [...BOARD.join('')].filter((ch) => /[0-9]/.test(ch));
    expect(numbered.length).toBeGreaterThanOrEqual(3);
    expect(numbered.some((n) => Number(n) >= 2)).toBe(true);
    expect(tiles.length).toBeGreaterThan(20);
  });

  it('has exactly one way to stand four lamps that lights every tile and satisfies every pillar', () => {
    const solved = combos(tiles, LAMPS).filter((l) => courtSolved(l));
    expect(solved).toHaveLength(1);
    expect(solved[0]).toEqual(COURT_SOLUTION.map(([r, c]) => [r, c]));
    // Without the numbers there are many ways, so the pillars have to be read.
    const lightOnly = combos(tiles, LAMPS).filter((l) => litTiles(l).size === tiles.length);
    expect(lightOnly.length).toBeGreaterThan(8);
    // And three lamps are never enough, so the fourth is not a spare.
    expect(combos(tiles, LAMPS - 1).some((l) => litTiles(l).size === tiles.length)).toBe(false);
  });

  it('lights nothing at the start and stops light at pillars', () => {
    expect(litTiles([]).size).toBe(0);
    const lit = litTiles([[0, 1]]);
    expect(lit.has(0 * COURT_SIZE + 1)).toBe(true);
    expect(isTile(0, 0)).toBe(false);
    expect(lit.has(0)).toBe(false);
    expect(pillarNumber(2, 3)).toBe(2);
    expect(pillarsSatisfied([])).toBe(false);
  });

  it('engraves a constellation on every tile, shows the answer under the lamps in reading order, and repeats every glyph', () => {
    expect(EMBLEMS.size).toBe(tiles.length);
    const answer = PUZZLES.find((p) => p.id === 'lamp-court')?.answer;
    expect(answer).toEqual(readLamps(COURT_SOLUTION));
    expect(new Set(answer).size).toBe(4);
    const counts = new Map<string, number>();
    for (const [r, c] of tiles) counts.set(emblemAt(r, c), (counts.get(emblemAt(r, c)) ?? 0) + 1);
    expect(counts.size).toBe(9);
    expect(Math.min(...counts.values())).toBeGreaterThanOrEqual(2);
    // Reading order is by row, then left to right.
    const rows = COURT_SOLUTION.map(([r]) => r);
    expect(rows).toEqual([...rows].sort((a, b) => a - b));
  });
});

describe('circuit panel (chapter 2, level 12)', () => {
  it('has seven levers and four lamps, a pyramid of three columns of gates, and a mix of gate kinds', () => {
    expect(LEVERS).toHaveLength(7);
    expect(new Set(LEVERS).size).toBe(7);
    expect(GATES).toHaveLength(15);
    expect(LAMP_GATES).toHaveLength(4);
    expect(GATES.map((g) => g.type).filter((t) => t === 'XOR').length).toBeGreaterThanOrEqual(3);
    expect(GATES.some((g) => g.type === 'OR')).toBe(true);
    GATES.forEach((g, i) => {
      expect(g.a).toBeLessThan(LEVERS.length + i);
      if (g.type !== 'NOT') expect(g.b).toBeLessThan(LEVERS.length + i);
    });
  });

  it('is drawn tidily: each gate reads the two signals beside it in the column to its left, and no wires cross', () => {
    GATES.forEach((g, gi) => {
      const col = columnOf(LEVERS.length + gi);
      expect(columnOf(g.a)).toBe(col - 1);
      if (g.type !== 'NOT') expect(columnOf(g.b)).toBe(col - 1);
    });
    expect(wireCrossings()).toBe(0);
    GATES.forEach((g, gi) => {
      // Neighbours: the two sources are adjacent in their column.
      expect(Math.abs(g.a - g.b)).toBe(1);
      expect(gi).toBeGreaterThanOrEqual(0);
    });
    // Every gate output is used (by a gate or a lamp), and none feeds more than two gates.
    GATES.forEach((_, gi) => {
      const id = LEVERS.length + gi;
      const uses = GATES.filter((g) => g.a === id || g.b === id).length;
      if (!LAMP_GATES.includes(id)) {
        expect(uses).toBeGreaterThanOrEqual(1);
        expect(uses).toBeLessThanOrEqual(2);
      }
    });
  });

  it('has a legend under the board that shows each gate kind used, with its four cases', () => {
    const used = new Set(GATES.map((g) => g.type));
    for (const t of used) expect(LEGEND_TYPES).toContain(t);
    expect(legendCases('AND').map((c) => c.out)).toEqual([false, false, false, true]);
    expect(legendCases('OR').map((c) => c.out)).toEqual([false, true, true, true]);
    expect(legendCases('XOR').map((c) => c.out)).toEqual([false, true, true, false]);
    for (const t of LEGEND_TYPES) expect(legendCases(t)).toHaveLength(4);
  });

  it('has exactly one lever setting that lights all four lamps, with four levers down', () => {
    const sols = circuitSolutions();
    expect(sols).toHaveLength(1);
    expect(sols[0].filter(Boolean)).toHaveLength(4);
    expect(allLit(CIRCUIT_SOLUTION)).toBe(true);
  });

  it('starts dark, and no single lever is the whole answer', () => {
    const none = LEVERS.map(() => false);
    expect(lampsFor(none).every(Boolean)).toBe(false);
    for (let i = 0; i < LEVERS.length; i += 1) {
      const one = LEVERS.map((_, k) => k === i);
      expect(allLit(one)).toBe(false);
    }
    // Every lever matters: flipping it from the solution puts some lamp out.
    for (let i = 0; i < LEVERS.length; i += 1) {
      const flipped = CIRCUIT_SOLUTION.map((v, k) => (k === i ? !v : v));
      expect(allLit(flipped)).toBe(false);
    }
    expect(signalsFor(CIRCUIT_SOLUTION)).toHaveLength(LEVERS.length + GATES.length);
  });

  it('reads the constellations beside the levers that are down, from the top lever to the bottom', () => {
    const answer = PUZZLES.find((p) => p.id === 'circuit-panel')?.answer;
    expect(answer).toEqual([...CIRCUIT_READING]);
    expect(answer).toEqual(LEVERS.filter((_, i) => CIRCUIT_SOLUTION[i]));
    expect(answer).toHaveLength(4);
  });
});

describe('chapter 3 unlocking', () => {
  const ids2 = CHAPTERS[1].levels.map((p) => p.id);
  const ids3 = CHAPTERS[2].levels.map((p) => p.id);

  it('keeps chapter 3 shut until chapter 2 is complete', () => {
    expect(chapterUnlocked(2, ids2.slice(0, -1))).toBe(false);
    expect(levelUnlocked(ids3[0], ids2.slice(0, -1))).toBe(false);
    expect(levelUnlocked(ids3[0], [...CHAPTERS[0].levels.map((p) => p.id), ...ids2])).toBe(true);
  });
});

describe('stone rubbing', () => {
  const strike = (y: number): [number, number][] => {
    const row: [number, number][] = [[PAPER.x + 20, y]];
    row.push(...interpolate(row[0], [PAPER.x + PAPER.w - 20, y]));
    return row;
  };

  it('shows nothing before the stick touches the paper', () => {
    expect(revealedCarvings([])).toEqual([]);
  });

  it('is not given away by one pass through the middle, nor by one pass along a single row', () => {
    expect(revealedCarvings([strike(460)])).toEqual([]);
    expect(revealedCarvings([strike(CARVINGS[0].y)])).toEqual([]);
  });

  it('comes up whole when the paper is rubbed all over', () => {
    expect(revealedCarvings([sweepPlan()])).toEqual(CARVINGS.map((_, i) => i));
  });

  it('keeps every carving and mark on the paper, clear of each other and of the stray dots', () => {
    const inside = (x: number, y: number) => x > PAPER.x + 20 && x < PAPER.x + PAPER.w - 20 && y > PAPER.y + 20 && y < PAPER.y + PAPER.h - 20;
    CARVINGS.forEach((c, i) => {
      for (const [x, y] of carvingStars(i)) expect(inside(x, y)).toBe(true);
      if (c.struck) {
        const m = markSpot(i);
        expect(inside(m.x, m.y - m.r)).toBe(true);
        for (const [x, y] of carvingStars(i)) expect(Math.hypot(x - m.x, y - m.y)).toBeGreaterThan(m.r + 25);
      }
      CARVINGS.forEach((o, j) => {
        if (j > i) expect(Math.hypot(c.x - o.x, c.y - o.y)).toBeGreaterThan(GLYPH_SIZE + 40);
      });
    });
    expect(SPECKS.length).toBeGreaterThanOrEqual(8);
    for (const [x, y] of SPECKS) {
      expect(inside(x, y)).toBe(true);
      for (const c of CARVINGS) expect(Math.hypot(x - c.x, y - c.y)).toBeGreaterThan(GLYPH_SIZE);
    }
  });

  it('reads the three carvings that are not struck out, left to right, with different glyphs', () => {
    const answer = PUZZLES.find((p) => p.id === 'stone-rubbing')?.answer;
    expect(answer).toEqual(RUB_READING.map((i) => CARVINGS[i].glyph));
    expect(answer).toHaveLength(3);
    expect(new Set(CARVINGS.map((c) => c.glyph)).size).toBe(CARVINGS.length);
    expect(CARVINGS.filter((c) => c.struck)).toHaveLength(2);
    expect(RUB_READING.every((v, k, a) => k === 0 || CARVINGS[a[k - 1]].x < CARVINGS[v].x)).toBe(true);
  });
});

describe('sand footprints', () => {
  const kidPrints = PILE.flatMap((p, i) => (typeof p.who === 'number' ? [i] : []));

  it('reads the children in the order they crossed, which is not their order on the rack', () => {
    const answer = PUZZLES.find((p) => p.id === 'sand-footprints')?.answer;
    expect(answer).toEqual(SAND_READING.map((k) => KIDS[k].glyph));
    expect(answer).toHaveLength(4);
    expect(SAND_READING).not.toEqual([0, 1, 2, 3]);
    expect([...SAND_READING].sort()).toEqual([0, 1, 2, 3]);
  });

  it('gives every child a different tread and a different constellation, and adds two prints that are nobody on the rack', () => {
    expect(new Set(KIDS.map((k) => k.tread)).size).toBe(4);
    expect(new Set(KIDS.map((k) => k.glyph)).size).toBe(4);
    expect(PILE.filter((p) => typeof p.who !== 'number')).toHaveLength(2);
    expect(PILE).toHaveLength(6);
  });

  it('presses every pair of children\'s prints over each other, so their order can always be seen', () => {
    for (const i of kidPrints) {
      for (const j of kidPrints) {
        if (i < j) expect(Math.min(overlapFraction(i, j), overlapFraction(j, i))).toBeGreaterThan(0.15);
      }
    }
  });

  it('leaves every print partly showing at the start, the top one whole, and everything showing once lifted off', () => {
    PILE.forEach((_, i) => expect(visibleFraction(i, [])).toBeGreaterThan(0.1));
    expect(visibleFraction(PILE.length - 1, [])).toBe(1);
    PILE.forEach((_, i) => {
      const above = PILE.map((__, k) => k).filter((k) => k > i);
      expect(visibleFraction(i, above)).toBe(1);
    });
    // Peeling matters: no child's print is whole until the ones above it are lifted.
    for (const i of kidPrints.slice(0, -1)) expect(visibleFraction(i, [])).toBeLessThan(0.7);
  });

  it('keeps the pile inside the yard and clear of the plank, and the plank slots inside the plank', () => {
    PILE.forEach((_, i) => {
      expect(insidePrint(i, 700, 700)).toBe(false);
      expect(insidePrint(i, 1100, 700)).toBe(false);
    });
    for (let k = 0; k < PILE.length; k += 1) {
      const c = slotPos(k);
      expect(c.x).toBeGreaterThan(760);
      expect(c.x).toBeLessThan(1450);
      expect(c.y).toBeGreaterThan(655);
    }
  });
});
