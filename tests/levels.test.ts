import { CHAPTERS, chapterOfLevel, chapterUnlocked, levelUnlocked } from '../src/ui/chapters';
import {
  CARDS as PUNCH_CARDS, cardDone, cluesOf, colOf, EDITOR, editorCellAt, emptyGrid, linesDone, READING_ORDER as PUNCH_READING, rowOf, runsOf,
  sampleGrid, SIZE as PUNCH_SIZE, snappedCells, solutionGrid, type Grid,
} from '../src/puzzles/punchCards';
import {
  cellsOf, GIVENS as GIVENS_CAB, HANDLES as HANDLES_CAB, isGiven as cabGiven, isSolved as cabSolved, nextStone, READING_ORDER as CAB_READING,
  SOLUTION as CAB_SOLUTION, startBoard as cabStart, STONES as CAB_STONES, UNITS as CAB_UNITS, unitDone as cabUnitDone,
} from '../src/puzzles/drawerCabinet';
import {
  AFFECTS as AFFECTS_DOME, allLit as lampsAllLit, ENGRAVINGS as ENGRAVINGS_DOME, LAMPS as LAMP_COUNT, lampsLit, LEVERS as LEVER_COUNT, SOLUTION as LEVER_SOLUTION,
  START as LEVER_START,
} from '../src/puzzles/domeLevers';
import {
  DECOY as DEPOT_DECOY, filledSockets as depotFilled, isSolved as depotSolved, LENS_GLYPHS as DEPOT_LENSES, MAP as DEPOT_MAP, PUSHES as DEPOT_PUSHES,
  START as DEPOT_START, step as depotStep, walkTo as depotWalkTo, rollBack as depotRollBack, type DepotState,
} from '../src/puzzles/lensDepot';
import {
  levelsAt as jarLevelsAt, pour as jarPour, READING_ORDER as JAR_READING, run as jarRun, SEQUENCE_A, SEQUENCE_B, START as JAR_START, TARGETS as JAR_TARGETS,
} from '../src/puzzles/oilJars';
import {
  applyJump as beadApply, BASES as BEAD_BASES, BLANK as BEAD_BLANK, CELLS as BEAD_CELLS, isSolved as beadSolved, JUMPS as BEAD_JUMPS, legalJumps as beadLegal,
  READING_ORDER as BEAD_READING, SOLUTION as BEAD_SOLUTION, solvedBoard as beadSolvedBoard, START as BEAD_START,
} from '../src/puzzles/starBoard';
import {
  feedback as lockFeedback, fitsPage as lockFits, fittingPages as lockPages, nextSymbol as lockNext, NOTEBOOK as LOCK_NOTEBOOK,
  READING_ORDER as LOCK_READING, SECRET as LOCK_SECRET, SYMBOLS as LOCK_SYMBOLS,
} from '../src/puzzles/oldKeeperLock';
import {
  crosses as wireCrosses, degrees as wireDegrees, EDGES as WIRE_EDGES, groups as wireGroups, isSolved as wireSolved, nextCount as wireNext,
  NUMBERS as WIRE_NUMBERS, READING_ORDER as WIRE_READING, SOLUTION_COUNTS as WIRE_SOLUTION_COUNTS, STARS as WIRE_STARS,
} from '../src/puzzles/copperWires';
import {
  HOLES as OWL_HOLES, PERCH as OWL_PERCH, READING_ORDER as OWL_READING, ROWS as OWL_ROWS, COLS as OWL_COLS, runProgram as owlRun, SOLUTION as OWL_SOLUTION,
  START as OWL_START, STAR_GLYPHS as OWL_GLYPHS, STAR_TILES as OWL_STARS, TRAY as OWL_TRAY, visitOrder as owlOrder,
} from '../src/puzzles/windUpOwl';
import {
  clash as yardClash, conflicting as yardConflicting, COPPER as YARD_COPPER, isSolved as yardSolved, LENS as YARD_LENS, lensesLeftToRight as yardLenses,
  N as YARD_N, nextMark as yardNext, READING_ORDER as YARD_READING, REGIONS as YARD_REGIONS, SOLUTION as YARD_SOLUTION, SOLUTION_CELLS as YARD_CELLS,
} from '../src/puzzles/telescopeYard';
import {
  agrees as scaleAgrees, beamDrop as scaleDrop, CARVING as SCALE_CARVING, COUNT as SCALE_COUNT, isSolved as scalesSolved, READING_ORDER as SCALE_READING, SCALES as SCALE_SET,
  SOLUTION_SHELF as SCALE_SHELF, tilt as scaleTilt, TILTS as SCALE_TILTS, WEIGHTS as SCALE_WEIGHTS, weightsFromShelf as scaleWeights,
} from '../src/puzzles/starScales';
import {
  allLit as domeAllLit, cardGrid as domeCard, cardMatches as domeCardMatches, CARD_CLUES as DOME_CLUES, clash as domeClash, countCards as domeCountCards,
  GIVENS as DOME_GIVENS, givensOf as domeGivensOf, isRivet as domeRivet, LENS as DOME_LENS, LEVER_CELLS as DOME_LEVER_CELLS, LEVERS_DOWN as DOME_DOWN,
  lampsLit as domeLamps, lensesLeftToRight as domeLenses, READING_ORDER as DOME_READING, REGIONS as DOME_REGIONS, RING as DOME_RING, startLamps as domeStart,
  YARD_CELLS as DOME_YARD, yardSolutions as domeYardSolutions, YARD_SOLUTION as DOME_YARD_SOLUTION,
} from '../src/puzzles/openDome';
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
import {
  BELLS, glassFor, GLASSES, READING_ORDER as CHIME_READING,
} from '../src/puzzles/glassChimes';
import {
  CUSTOMERS, READING_ORDER as STALL_READING, STALLS, stallOf,
} from '../src/puzzles/lanternStalls';
import {
  DOCKS, onWater, outcomeOf, positionAt, READING_ORDER as RIVER_READING, sampleRoute, SX,
} from '../src/puzzles/riverLanterns';
import {
  grainAt, GRAINS, GLYPH_SIZE as PLATE_GLYPH, MELODY as PLATE_MELODY, notchAt, NOTCHES as PLATE_NOTCHES, notchY as plateNotchY, PLATE, PLATE_C, TARGETS, uOf,
} from '../src/puzzles/sandPlate';
import {
  angleFromPointer, CLOCK_HOURS, DEG_PER_HOUR, DIAL, handAngle, keyAt, matches, nearestHour, READING_ORDER as CLOCK_READING, seenAt, shownFor,
  SKY as CLOCK_SKY, windowShare,
} from '../src/puzzles/starClock';
import {
  BASE, BASE_STARS, CHOM_SIZE, CHOMS, litWindows, NUMBER_OF_HOUSE, NUMBERS, onlyIn, PAINT, READING_ORDER as PAINT_READING, showsWindowDiff, STARS, starsOf, STRAYS, tally,
} from '../src/puzzles/threePaintings';
import {
  COL_OF_LEGS, glyphOf, keyOf, LEGS, MESSAGE, PAINTS, ROW_OF_PAINT, SAMPLES, same as sameFigure,
} from '../src/puzzles/toheCipher';
import {
  PAN_MAX, READING_ORDER as EXPOSURE_READING, RUNNERS, SHARP_BELOW, sharpAt, smearOf, streetSmear,
} from '../src/puzzles/longExposure';
import {
  CLUES as PROC_CLUES, holds as procHolds, LANTERN_GLYPHS, READING_ORDER as PROC_READING, solutions as procSolutions, SOLUTION as PROC_SOLUTION,
} from '../src/puzzles/procession';
import {
  CELL_PATTERN, CLAIMS, claimHolds, claimLights, KID_PATTERN, KID_TREAD, PASSING, possible, READING_ORDER as NIGHT_READING, SECRET, solutions as nightSolutions,
} from '../src/puzzles/nightProcession';

import {
  fakeReadable as trainFake, FAKE as TRAIN_FAKE, fakeStars as trainFakeStars, glassMix, GLYPH_SIZE as TRAIN_SIZE, LIGHT_HINT, LIGHT_START, lightFromY, noiseDots as trainNoise,
  NOISE_PER_WINDOW, skyReadable, skyStars as trainSkyStars, SKY as TRAIN_SKY, WINDOWS as TRAIN_WINDOWS, yFromLight,
} from '../src/puzzles/trainWindow';

import {
  bestBurst as tunnelBurst, brightness as tunnelBright, CENTER as TUNNEL_CENTER, clampOwl as tunnelClamp, DECOY as TUNNEL_DECOY, DECOY_CENTER as TUNNEL_DECOY_CENTER,
  DECOY_GROUP, DECOY_TIME, FLASH_TIMES, flashTime as tunnelFlash, glowAt, hootLength, LARVAE, NOISE_COUNT as TUNNEL_NOISE, OWL_START as TUNNEL_START, SKY as TUNNEL_SKY, WALL as TUNNEL_WALL,
} from '../src/puzzles/glowTunnel';

import {
  clueDone as crabDone, clueOf as crabClue, COLS as CRAB_COLS, countSolutions as crabCount, deduce as crabDeduce, dotOffsets, emptyMarks as crabEmpty, flagsAround as crabFlags,
  HOLE_GROUPS, idx as crabIdx, isMine as crabMine, isAnswerHole as crabAnswerHole, isRevealed as crabRevealed, REVEALED as CRAB_REVEALED, isSolved as crabSolved, LOOSE_HOLES, MINES as CRAB_MINES, neighbours as crabNeighbours,
  nextMark as crabNext, RICE as CRAB_RICE, ROWS as CRAB_ROWS, solutionMarks as crabSolution, type Mark as CrabMark,
} from '../src/puzzles/crabField';

import {
  CAPACITY as YARD_CAP, canMove as yardCan, CAR_GLYPHS, copyYard, isSolved as shuntSolved, legalMoves as yardMoves, MAX_BLOCK as YARD_BLOCK, move as yardMove, sameYard, shownGlyphs,
  solve as yardSolve, START as YARD_START, WANTED as YARD_WANTED, type Yard,
} from '../src/puzzles/shuntingYard';

import {
  CHOMS as BINO_CHOMS, chomStars as binoStars, clampCenter as binoClamp, LENS as BINO_LENS, LOOSE_COUNT as BINO_LOOSE, nearestOnRail, railOrder, SCALE_FWD, SCALE_MIN, START_CENTER as BINO_START,
  viewBetween, VILLAGES, villagesInLens, WORLD_R, barrelFlip, scaleAt, yOfZoom, zoomAtY, zoomOf, CHOM_SIGNATURE, SIGNATURES,
} from '../src/puzzles/reverseBinoculars';

import {
  ALL_SETTINGS, delivered, DEPOT_GLYPHS, DEPOT_WANTS, DEPOT_FRONT, isSolved as flipSolved, leversAt, NET as FLIP_NET, pointAt, queueSlot, READING as FLIP_READING, runTrains,
  SOLUTION as FLIP_SOLUTION, START_SETTING, TARGET as FLIP_TARGET, TOTAL_SECONDS, TRAIN_CARGO, trainPath,
} from '../src/puzzles/flipSwitches';

describe('level registry', () => {
  it('has fifty-four levels with unique ids and valid answers of 3–4 constellations', () => {
    expect(PUZZLES).toHaveLength(54);
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

describe('glass chimes', () => {
  it('reads the lotus glasses from the lowest water to the highest, as the bells that ring them', () => {
    const answer = PUZZLES.find((p) => p.id === 'glass-chimes')?.answer;
    expect(answer).toEqual(CHIME_READING.map((k) => BELLS[GLASSES[k].bell]));
    expect(answer).toHaveLength(4);
    expect(CHIME_READING.every((k) => GLASSES[k].lotus)).toBe(true);
    const levels = CHIME_READING.map((k) => GLASSES[k].level);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
  });

  it('tunes each glass to a different bell and leaves two bells that ring no glass', () => {
    expect(new Set(GLASSES.map((g) => g.bell)).size).toBe(GLASSES.length);
    const silent = BELLS.map((_, b) => b).filter((b) => glassFor(b) < 0);
    expect(silent).toHaveLength(2);
    expect(GLASSES.filter((g) => g.lotus)).toHaveLength(4);
  });

  it('keeps water levels apart, and the answer is in neither shelf order nor bell order', () => {
    const sorted = GLASSES.map((g) => g.level).sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i += 1) expect(sorted[i] - sorted[i - 1]).toBeGreaterThanOrEqual(0.07);
    expect([...CHIME_READING]).not.toEqual([...CHIME_READING].sort((a, b) => a - b));
    const bells = CHIME_READING.map((k) => GLASSES[k].bell);
    expect(bells).not.toEqual([...bells].sort((a, b) => a - b));
  });

  it('never makes both of the easily confused arrow and diamond part of the answer', () => {
    const ids = CHIME_READING.map((k) => BELLS[GLASSES[k].bell]);
    expect(ids.includes('arrow') && ids.includes('diamond')).toBe(false);
  });

  it('puts a lotus-less glass on the shelf that rings from a bell whose constellation is not in the answer', () => {
    const decoyRings = GLASSES.filter((g) => !g.lotus);
    expect(decoyRings).toHaveLength(3);
    for (const g of decoyRings) expect(CHIME_READING.map((k) => GLASSES[k].bell)).not.toContain(g.bell);
  });
});

describe('lantern stalls', () => {
  it('reads the lantern each stall sold, stalls left to right, and not in queue order', () => {
    const answer = PUZZLES.find((p) => p.id === 'lantern-stalls')?.answer;
    expect(answer).toEqual(STALL_READING.map((c) => CUSTOMERS[c].glyph));
    expect(answer).toHaveLength(4);
    expect(new Set(answer).size).toBe(4);
    expect([...STALL_READING]).not.toEqual([...STALL_READING].sort((a, b) => a - b));
  });

  it('matches each stall to exactly one customer by pattern, and leaves two customers who bought elsewhere', () => {
    expect(new Set(STALLS.map((s) => s.pattern)).size).toBe(STALLS.length);
    STALLS.forEach((s) => expect(CUSTOMERS.filter((c) => c.pattern === s.pattern)).toHaveLength(1));
    const elsewhere = CUSTOMERS.map((_, i) => i).filter((i) => stallOf(i) < 0);
    expect(elsewhere).toHaveLength(2);
    for (const i of elsewhere) expect(STALL_READING).not.toContain(i);
    expect(new Set(CUSTOMERS.map((c) => c.pattern)).size).toBe(CUSTOMERS.length);
  });

  it('gives each customer a different constellation and keeps arrow and diamond out of the answer together', () => {
    expect(new Set(CUSTOMERS.map((c) => c.glyph)).size).toBe(CUSTOMERS.length);
    const ids = STALL_READING.map((c) => CUSTOMERS[c].glyph);
    expect(ids.includes('arrow') && ids.includes('diamond')).toBe(false);
  });

  it('never matches by colour: no customer shares ink colour with the stall of the same pattern', () => {
    STALL_READING.forEach((c, i) => expect(CUSTOMERS[c].ink).not.toBe(STALLS[i].ink));
  });
});

describe('river lanterns', () => {
  it('reads the lanterns that reach the temple, from the pier nearest the spring to the furthest', () => {
    const answer = PUZZLES.find((p) => p.id === 'river-lanterns')?.answer;
    expect(answer).toEqual(RIVER_READING.map((i) => DOCKS[i].glyph));
    expect(answer).toHaveLength(4);
    expect(RIVER_READING.every((i) => outcomeOf(i) === 'temple')).toBe(true);
    const startX = DOCKS.map((d) => d.route[0][0]);
    expect(startX).toEqual([...startX].sort((a, b) => a - b));
    expect(new Set(startX).size).toBe(DOCKS.length);
  });

  it('sends the other two lanterns to the mill and into the reeds, and uses six different constellations', () => {
    const outcomes = DOCKS.map((_, i) => outcomeOf(i));
    expect(outcomes.filter((o) => o === 'mill')).toHaveLength(1);
    expect(outcomes.filter((o) => o === 'reeds')).toHaveLength(1);
    expect(new Set(DOCKS.map((d) => d.glyph)).size).toBe(DOCKS.length);
    const ids = RIVER_READING.map((i) => DOCKS[i].glyph);
    expect(ids.includes('arrow') && ids.includes('diamond')).toBe(false);
  });

  it('keeps every lantern on the water along its whole route, clear of the reed island', () => {
    DOCKS.forEach((d, i) => {
      for (const [x, y] of sampleRoute(d.route, 8)) expect(onWater(x, y)).toBe(true);
      const [sx, sy] = positionAt(i, 0);
      expect([sx, sy]).toEqual([d.route[0][0], d.route[0][1]]);
    });
  });

  it('mixes the banks: the lanterns for the temple start on both banks, and some from the lower bank cross the river', () => {
    const fromTop = RIVER_READING.filter((i) => DOCKS[i].route[0][1] < 450);
    const fromBottom = RIVER_READING.filter((i) => DOCKS[i].route[0][1] > 450);
    expect(fromTop.length).toBeGreaterThanOrEqual(1);
    expect(fromBottom.length).toBeGreaterThanOrEqual(1);
    expect(SX(0)).toBe(1600);
  });
});

describe('sand plate', () => {
  it('reads the constellation at each note of the tune, in the order of the tune, which is not ascending', () => {
    const answer = PUZZLES.find((p) => p.id === 'sand-plate')?.answer;
    expect(answer).toEqual(PLATE_MELODY.map((k) => PLATE_NOTCHES[k]));
    expect(answer).toHaveLength(4);
    expect(new Set(PLATE_MELODY).size).toBe(4);
    expect(PLATE_MELODY.every((k, i) => i === 0 || k > PLATE_MELODY[i - 1])).toBe(false);
    expect(PLATE_MELODY.every((k, i) => i === 0 || k < PLATE_MELODY[i - 1])).toBe(false);
  });

  it('forms a different constellation at each of six notches, with two unused, and never both arrow and diamond in the tune', () => {
    expect(PLATE_NOTCHES).toHaveLength(6);
    expect(new Set(PLATE_NOTCHES).size).toBe(6);
    const ids = PLATE_MELODY.map((k) => PLATE_NOTCHES[k]);
    expect(ids.includes('arrow') && ids.includes('diamond')).toBe(false);
    expect(new Set(PLATE_MELODY.map((k) => plateNotchY(k))).size).toBe(4);
  });

  it('keeps every grain on the plate in every position', () => {
    expect(TARGETS).toHaveLength(PLATE_NOTCHES.length + 1);
    for (const t of TARGETS) {
      expect(t).toHaveLength(GRAINS);
      for (const [x, y] of t) {
        expect(x).toBeGreaterThan(PLATE.x);
        expect(x).toBeLessThan(PLATE.x + PLATE.w);
        expect(y).toBeGreaterThan(PLATE.y);
        expect(y).toBeLessThan(PLATE.y + PLATE.h);
      }
    }
  });

  it('gathers the sand into dots at a notch and leaves no constellation at rest or in between', () => {
    const near = (u: number, k: number): number[] => {
      const stars = placeStars(PLATE_NOTCHES[k], PLATE_C.x, PLATE_C.y, PLATE_GLYPH);
      return stars.map(([sx, sy]) => Array.from({ length: GRAINS }, (_, g) => grainAt(g, u)).filter(([x, y]) => Math.hypot(x - sx, y - sy) < 16).length);
    };
    for (let k = 0; k < PLATE_NOTCHES.length; k += 1) {
      for (const c of near(uOf(k), k)) expect(c).toBeGreaterThanOrEqual(10);
      expect(Math.max(...near(0, k))).toBeLessThan(7);
      // In between, at most a stray dot or two of the constellation holds together, never the whole of it.
      if (k < PLATE_NOTCHES.length - 1) expect(near(uOf(k) + 0.5, k).filter((c) => c >= 10).length).toBeLessThanOrEqual(1);
    }
  });

  it('knows when the slider sits on a notch', () => {
    expect(notchAt(0)).toBe(-1);
    expect(notchAt(1)).toBe(0);
    expect(notchAt(4.1)).toBe(3);
    expect(notchAt(2.5)).toBe(-1);
  });
});

describe('star clock', () => {
  it('has nine small clocks in a 3×3 grid and only four of them match the key at the same place', () => {
    expect(CLOCK_HOURS).toHaveLength(9);
    expect(CLOCK_READING).toHaveLength(4);
    expect(CLOCK_HOURS.map((_, p) => p).filter((p) => matches(p))).toEqual([...CLOCK_READING]);
    expect(new Set(CLOCK_HOURS).size).toBe(9);
    // The clocks that do not match include empty hours and other constellations, so none is a free guess.
    const misses = CLOCK_HOURS.map((_, p) => p).filter((p) => !matches(p));
    expect(misses.filter((p) => shownFor(p) === undefined).length).toBeGreaterThanOrEqual(2);
    expect(misses.filter((p) => shownFor(p) !== undefined).length).toBeGreaterThanOrEqual(2);
  });

  it('answers with the constellations of the matching clocks in grid order (keypad order)', () => {
    const answer = PUZZLES.find((p) => p.id === 'star-clock')?.answer;
    expect(answer).toEqual(CLOCK_READING.map((p) => keyAt(p)));
    expect(answer).toHaveLength(4);
    expect(answer?.includes('arrow') && answer?.includes('diamond')).toBe(false);
    expect(CLOCK_READING.every((p, i, a) => i === 0 || p > a[i - 1])).toBe(true);
  });

  it('shows exactly the constellation of the hour, whole, and nothing at the empty hours', () => {
    for (let h = 0; h < 12; h += 1) {
      const seen = seenAt(handAngle(h));
      if (CLOCK_SKY[h]) expect(seen).toEqual([CLOCK_SKY[h]]);
      else expect(seen).toEqual([]);
    }
    expect(Object.keys(CLOCK_SKY)).toHaveLength(9);
    expect(new Set(Object.values(CLOCK_SKY)).size).toBe(9);
  });

  it('keeps neighbouring constellations out of the window, and never shows a whole one between hours', () => {
    for (let h = 0; h < 12; h += 1) {
      for (let other = 0; other < 12; other += 1) {
        if (other !== h && CLOCK_SKY[other]) expect(windowShare(other, handAngle(h))).toBeLessThan(0.01);
      }
      for (const off of [10, 15, 20]) expect(seenAt(handAngle(h) + off)).toEqual([]);
    }
  });

  it('reads the pointer as an angle and snaps to the nearest hour', () => {
    expect(angleFromPointer(DIAL.x, DIAL.y - 100)).toBeCloseTo(0);
    expect(angleFromPointer(DIAL.x + 100, DIAL.y)).toBeCloseTo(90);
    expect(angleFromPointer(DIAL.x, DIAL.y + 100)).toBeCloseTo(180);
    expect(nearestHour(DEG_PER_HOUR * 7 + 9)).toBe(7);
    expect(nearestHour(359)).toBe(0);
  });
});

describe('three paintings', () => {
  it('has a painting with the added stars, a painting with flipped windows, and the untouched original (clean pairs)', () => {
    expect(new Set([STARS, NUMBERS, BASE]).size).toBe(3);
    // Stars: added stars only, none missing.
    const extra = onlyIn(STARS, BASE);
    const chomCount = CHOMS.reduce((n, c) => n + placeStars(c.glyph, c.x, c.y, CHOM_SIZE).length, 0);
    expect(extra).toHaveLength(chomCount + STRAYS.length);
    expect(onlyIn(BASE, STARS)).toHaveLength(0);
    expect(starsOf(BASE)).toHaveLength(BASE_STARS.length);
    // The numbers painting has the original's sky.
    expect(onlyIn(NUMBERS, BASE)).toHaveLength(0);
    expect(onlyIn(BASE, NUMBERS)).toHaveLength(0);
  });

  it('counts flipped windows per house in the pair (numbers, original) as 1, 2, 3 and 4', () => {
    const counts = tally(NUMBERS, BASE);
    expect(counts).toEqual([...NUMBER_OF_HOUSE]);
    expect([...counts].sort()).toEqual([1, 2, 3, 4]);
    // The star painting has the original's windows, so its pair shows only stars; with the numbers painting it shows both.
    expect(tally(STARS, BASE)).toEqual([0, 0, 0, 0]);
    expect(tally(STARS, NUMBERS)).toEqual(counts);
    // Windows are highlighted for the (numbers, original) pair only, never with the star painting.
    expect(showsWindowDiff(NUMBERS, BASE)).toBe(true);
    expect(showsWindowDiff(BASE, NUMBERS)).toBe(true);
    expect(showsWindowDiff(STARS, NUMBERS)).toBe(false);
    expect(showsWindowDiff(NUMBERS, STARS)).toBe(false);
    expect(showsWindowDiff(STARS, BASE)).toBe(false);
    expect(litWindows(BASE).filter((v) => v)).not.toHaveLength(0);
  });

  it('reads the constellations over the houses in the order of their numbers, which is not left to right', () => {
    const answer = PUZZLES.find((p) => p.id === 'three-paintings')?.answer;
    const byNumber = NUMBER_OF_HOUSE.map((n, h) => ({ n, h })).sort((a, b) => a.n - b.n).map(({ h }) => CHOMS[h].glyph);
    expect(answer).toEqual(byNumber);
    expect(PAINT_READING).toHaveLength(4);
    expect([...PAINT_READING]).not.toEqual([0, 1, 2, 3]);
    expect(answer).toHaveLength(4);
    expect(new Set(answer).size).toBe(4);
    expect(answer?.includes('arrow') && answer?.includes('diamond')).toBe(false);
  });

  it('keeps every added star clear of the ordinary stars and inside the sky, and the four chòm apart, one over each house', () => {
    for (const c of CHOMS) {
      for (const [x, y] of placeStars(c.glyph, c.x, c.y, CHOM_SIZE)) {
        expect(x).toBeGreaterThan(8);
        expect(x).toBeLessThan(PAINT.w - 8);
        expect(y).toBeGreaterThan(8);
        expect(y).toBeLessThan(340);
        for (const [bx, by] of BASE_STARS) expect(Math.hypot(x - bx, y - by)).toBeGreaterThan(20);
      }
    }
    CHOMS.forEach((a, i) => CHOMS.forEach((b, j) => { if (j > i) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(CHOM_SIZE + 10); }));
    CHOMS.forEach((c, h) => expect(Math.abs(c.x - (5 + h * 113 + 56))).toBeLessThan(8));
  });
});

describe('tohe cipher', () => {
  const all = PAINTS.flatMap((paint) => LEGS.map((legs) => ({ paint, legs })));

  it('stands every combination of pattern and legs for a different key of the keypad, by row and column', () => {
    expect(new Set(all.map(keyOf)).size).toBe(9);
    expect(new Set(Object.values(ROW_OF_PAINT)).size).toBe(3);
    expect(new Set(Object.values(COL_OF_LEGS)).size).toBe(3);
    expect(all.map((f) => keyOf(f)).sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('gives examples that pin the rule down: every pattern and every leg count appears with a known key', () => {
    const seen = SAMPLES.flat();
    for (const paint of PAINTS) expect(seen.some((f) => f.paint === paint)).toBe(true);
    for (const legs of LEGS) expect(seen.some((f) => f.legs === legs)).toBe(true);
    // Each row of the keypad and each column is read off at least once, so the rule is determined.
    expect(new Set(seen.map((f) => Math.floor(keyOf(f) / 3))).size).toBe(3);
    expect(new Set(seen.map((f) => keyOf(f) % 3)).size).toBe(3);
  });

  it('leaves at least two figures of the message that are not in the examples, so the rule must be used', () => {
    const seen = SAMPLES.flat();
    const unseen = MESSAGE.filter((m) => !seen.some((s) => sameFigure(s, m)));
    expect(unseen.length).toBeGreaterThanOrEqual(2);
    expect(new Set(MESSAGE.map(keyOf)).size).toBe(MESSAGE.length);
  });

  it('answers with the four constellations of the message, and not both arrow and diamond', () => {
    const answer = PUZZLES.find((p) => p.id === 'tohe-cipher')?.answer;
    expect(answer).toEqual(MESSAGE.map(glyphOf));
    expect(answer).toHaveLength(4);
    expect(answer?.includes('arrow') && answer?.includes('diamond')).toBe(false);
    expect(SAMPLES).toHaveLength(3);
    expect(SAMPLES.every((line) => line.length === 3)).toBe(true);
  });

  it('does not read in keypad order, so the message cannot be got by sorting', () => {
    const keys = MESSAGE.map(keyOf);
    expect(keys.every((k, i) => i === 0 || k > keys[i - 1])).toBe(false);
  });
});

describe('long exposure (panning shot)', () => {
  it('has six runners at different speeds: four with a tassel of 1–4 knots, one standing still and one more without a tassel', () => {
    expect(RUNNERS).toHaveLength(6);
    expect(RUNNERS.filter((r) => r.knots > 0).map((r) => r.knots).sort()).toEqual([1, 2, 3, 4]);
    expect(RUNNERS.filter((r) => r.knots === 0)).toHaveLength(2);
    expect(RUNNERS.some((r) => r.speed === 0 && r.knots === 0)).toBe(true);
    expect(new Set(RUNNERS.map((r) => r.glyph)).size).toBe(6);
    // Both directions are used, so the pan has to go both ways.
    expect(RUNNERS.some((r) => r.speed < 0 && r.knots > 0)).toBe(true);
    expect(RUNNERS.some((r) => r.speed > 0 && r.knots > 0)).toBe(true);
    for (const r of RUNNERS) expect(Math.abs(r.speed)).toBeLessThanOrEqual(PAN_MAX);
  });

  it('brings out exactly one runner sharp at each runner speed, and nobody in between', () => {
    RUNNERS.forEach((r, i) => expect(sharpAt(r.speed)).toEqual([i]));
    const speeds = [...RUNNERS.map((r) => r.speed)].sort((x, y) => x - y);
    for (let k = 1; k < speeds.length; k += 1) {
      expect(sharpAt((speeds[k - 1] + speeds[k]) / 2)).toEqual([]);
      // Neighbouring speeds are far enough apart that a near miss still smears badly.
      expect((speeds[k] - speeds[k - 1]) * 120).toBeGreaterThan(SHARP_BELOW * 6);
    }
  });

  it('starts with no pan: only the runner standing still is sharp, and it is a trap with no tassel', () => {
    const still = sharpAt(0);
    expect(still).toHaveLength(1);
    expect(RUNNERS[still[0]].knots).toBe(0);
    expect(streetSmear(0)).toBe(0);
    expect(streetSmear(1)).toBeGreaterThan(SHARP_BELOW);
    // Every runner with a tassel is badly smeared at the start.
    RUNNERS.forEach((r, i) => { if (r.knots > 0) expect(smearOf(i, 0)).toBeGreaterThan(SHARP_BELOW * 6); });
  });

  it('reads the four runners with a tassel by their knots, which is neither left to right nor by speed', () => {
    const answer = PUZZLES.find((p) => p.id === 'long-exposure')?.answer;
    expect(answer).toEqual(EXPOSURE_READING.map((i) => RUNNERS[i].glyph));
    expect(answer).toHaveLength(4);
    expect(EXPOSURE_READING.map((i) => RUNNERS[i].knots)).toEqual([1, 2, 3, 4]);
    expect(EXPOSURE_READING.every((v, k, arr) => k === 0 || v > arr[k - 1])).toBe(false);
    const bySpeed = [...EXPOSURE_READING].sort((x, y) => RUNNERS[x].speed - RUNNERS[y].speed);
    expect(bySpeed).not.toEqual([...EXPOSURE_READING]);
    expect(answer?.includes('arrow') && answer?.includes('diamond')).toBe(false);
  });
});

describe('procession (who carries which lantern)', () => {
  it('has exactly one arrangement that satisfies all six cards, and it is the intended one', () => {
    expect(PROC_CLUES).toHaveLength(6);
    const sols = procSolutions();
    expect(sols).toHaveLength(1);
    expect(sols[0]).toEqual({ kidAt: [...PROC_SOLUTION.kidAt], lanternAt: [...PROC_SOLUTION.lanternAt] });
  });

  it('needs every card: dropping any one leaves more than one arrangement', () => {
    PROC_CLUES.forEach((_, i) => {
      expect(procSolutions(PROC_CLUES.filter((__, j) => j !== i)).length).toBeGreaterThan(1);
    });
  });

  it('keeps the lamps off before anything is placed, except cards that are about nobody being somewhere', () => {
    const empty = { kidAt: [-1, -1, -1, -1], lanternAt: [-1, -1, -1, -1] };
    expect(PROC_CLUES.filter((c) => procHolds(c, empty))).toHaveLength(0);
  });

  it('lets the same child or lantern be put in more than one place, and a card lights if it can be read off any of them', () => {
    const twice = { kidAt: [2, 2, 3, 1], lanternAt: [1, 3, 3, 2] };
    // Child 2 is in two places: "child 2 holds lantern 1" holds in the first of them.
    expect(procHolds({ t: 'holds', k: 2, l: 1 }, twice)).toBe(true);
    // Lantern 3 is in two places (1 and 2); lantern 1 is at 0: they are next to each other at 0 and 1.
    expect(procHolds({ t: 'lanAdj', a: 1, b: 3 }, twice)).toBe(true);
    // Child 0 is not placed at all, so cards about it do not hold.
    expect(procHolds({ t: 'kidBefore', a: 2, b: 0 }, twice)).toBe(false);
    expect(procHolds({ t: 'kidBefore', a: 0, b: 3 }, twice)).toBe(false);
    // A child placed in several places can satisfy "is last" from any of them.
    expect(procHolds({ t: 'last', k: 1 }, twice)).toBe(true);
    expect(procHolds({ t: 'last', k: 2 }, twice)).toBe(false);
    // "does not hold" fails as soon as the two share some place.
    expect(procHolds({ t: 'notHolds', k: 3, l: 3 }, twice)).toBe(false);
  });

  it('reads the lanterns from the front of the line, and answers with four different constellations', () => {
    const answer = PUZZLES.find((p) => p.id === 'procession')?.answer;
    expect(answer).toEqual(PROC_READING.map((l) => LANTERN_GLYPHS[l]));
    expect(new Set(answer).size).toBe(4);
    expect(answer?.includes('arrow') && answer?.includes('diamond')).toBe(false);
    expect(PROC_CLUES.map((c) => c.t)).toContain('notHolds');
    expect(PROC_CLUES.filter((c) => c.t === 'holds')).toHaveLength(1);
  });
});

describe('night procession (finale)', () => {
  it('has exactly one stop for each child that fits the papers and every possible claim', () => {
    const sols = nightSolutions();
    expect(sols).toHaveLength(1);
    expect(sols[0]).toEqual([...SECRET]);
  });

  it('has five witnesses, all right about the real stops and all possible given the papers', () => {
    expect(CLAIMS).toHaveLength(5);
    expect(CLAIMS.every((c) => possible(c))).toBe(true);
    CLAIMS.forEach((c) => expect(claimHolds(c, SECRET)).toBe(true));
    // The second witness says the child with the checked paper went through the middle column.
    expect(CLAIMS[1]).toEqual({ t: 'col', k: 0, v: 1 });
  });

  it('puts every stop on an awning with the pattern of the child paper, with two children sharing a pattern', () => {
    SECRET.forEach((cell, k) => expect(CELL_PATTERN[cell]).toBe(KID_PATTERN[k]));
    expect(new Set(SECRET).size).toBe(4);
    expect(new Set(KID_PATTERN).size).toBe(3);
    expect(new Set(KID_TREAD).size).toBe(4);
    expect(CELL_PATTERN.filter((p) => p === 0)).toHaveLength(3);
  });

  it('lights a witness card as soon as the markers put down satisfy it, right or not, and allows repeated markers', () => {
    const none = Array.from({ length: 9 }, () => -1);
    expect(CLAIMS.filter((c) => claimLights(c, none))).toHaveLength(0);
    // The real stops light every witness.
    const real = Array.from({ length: 9 }, () => -1);
    SECRET.forEach((cell, k) => { real[cell] = k; });
    CLAIMS.forEach((c) => expect(claimLights(c, real)).toBe(true));
    // Child 0 moved to the right-hand column: its middle-column card goes dark, another placing could light it.
    const wrong = [...real];
    wrong[4] = -1;
    wrong[5] = 0;
    expect(claimLights(CLAIMS[1], wrong)).toBe(false);
    // The same child on several awnings: the row witness for child 1 lights from either of them.
    const twice = [...none];
    twice[2] = 1;
    twice[7] = 1;
    expect(claimLights({ t: 'row', k: 1, v: 0 }, twice)).toBe(true);
    expect(claimLights({ t: 'row', k: 1, v: 1 }, twice)).toBe(false);
    expect(claimLights({ t: 'row', k: 1, v: 2 }, twice)).toBe(true);
  });

  it('answers with the keypad positions of the stops in the order of the footprints, not in keypad order', () => {
    const answer = PUZZLES.find((p) => p.id === 'night-procession')?.answer;
    expect(NIGHT_READING).toEqual(PASSING.map((k) => SECRET[k]));
    expect(answer).toHaveLength(4);
    expect(new Set(answer).size).toBe(4);
    expect(NIGHT_READING.every((v, i, a) => i === 0 || v > a[i - 1])).toBe(false);
    expect(answer?.includes('arrow') && answer?.includes('diamond')).toBe(false);
  });
});

describe('chapter 4 unlocking', () => {
  const ids3 = CHAPTERS[2].levels.map((p) => p.id);
  const ids4 = CHAPTERS[3].levels.map((p) => p.id);

  it('keeps chapter 4 shut until chapter 3 is complete', () => {
    expect(ids4).toEqual(['punch-cards', 'drawer-cabinet', 'oil-jars', 'dome-levers', 'lens-depot', 'star-board', 'old-keeper-lock', 'copper-wires', 'wind-up-owl', 'telescope-yard', 'star-scales', 'open-dome']);
    expect(CHAPTERS[3].comingSoon).toBe(false);
    expect(chapterUnlocked(3, ids3.slice(0, -1))).toBe(false);
    expect(levelUnlocked(ids4[0], ids3.slice(0, -1))).toBe(false);
    const before = [...CHAPTERS[0].levels.map((p) => p.id), ...CHAPTERS[1].levels.map((p) => p.id), ...ids3];
    expect(levelUnlocked(ids4[0], before)).toBe(true);
  });
});

describe('punch cards (chapter 4, level 1)', () => {
  const cells = (g: Grid): [number, number][] => g.flatMap((row, r) => row.flatMap((on, c) => (on ? [[r, c] as [number, number]] : [])));
  const everyLine = (): boolean[][] => {
    const all: boolean[][] = [];
    for (let m = 0; m < 1 << PUNCH_SIZE; m += 1) all.push(Array.from({ length: PUNCH_SIZE }, (_, i) => ((m >> i) & 1) === 1));
    return all;
  };

  /** All grids whose rows and columns have exactly these groups (brute force over each row's possibilities). */
  const solutions = (rows: number[][], cols: number[][], limit = 5): Grid[] => {
    const lines = everyLine();
    const byClue = (clue: number[]) => lines.filter((l) => runsOf(l).join(',') === clue.join(','));
    const found: Grid[] = [];
    const walk = (r: number, acc: boolean[][]) => {
      if (found.length >= limit) return;
      if (r === PUNCH_SIZE) {
        if (cols.every((clue, c) => runsOf(acc.map((row) => row[c])).join(',') === clue.join(','))) found.push(acc.map((row) => [...row]));
        return;
      }
      for (const line of byClue(rows[r])) walk(r + 1, [...acc, line]);
    };
    walk(0, []);
    return found;
  };

  /** Line logic only: is the card settled by repeatedly narrowing each line to what every fitting arrangement agrees on? */
  const lineSolvable = (rows: number[][], cols: number[][]): boolean => {
    const all = everyLine();
    const state: (boolean | null)[][] = Array.from({ length: PUNCH_SIZE }, () => Array<boolean | null>(PUNCH_SIZE).fill(null));
    const narrow = (clue: number[], get: (i: number) => boolean | null, set: (i: number, v: boolean) => void): boolean => {
      const fits = all.filter((l) => runsOf(l).join(',') === clue.join(',') && l.every((v, i) => get(i) === null || get(i) === v));
      let changed = false;
      for (let i = 0; i < PUNCH_SIZE; i += 1) {
        if (get(i) !== null) continue;
        if (fits.every((l) => l[i] === fits[0][i])) {
          set(i, fits[0][i]);
          changed = true;
        }
      }
      return changed;
    };
    for (let changed = true; changed;) {
      changed = false;
      for (let r = 0; r < PUNCH_SIZE; r += 1) changed = narrow(rows[r], (i) => state[r][i], (i, v) => { state[r][i] = v; }) || changed;
      for (let c = 0; c < PUNCH_SIZE; c += 1) changed = narrow(cols[c], (i) => state[i][c], (i, v) => { state[i][c] = v; }) || changed;
    }
    return state.every((row) => row.every((v) => v !== null));
  };

  it('has three cards: the constellation snapped on the grid plus two stray holes, in their own cells', () => {
    expect(PUNCH_CARDS).toHaveLength(3);
    PUNCH_CARDS.forEach((card, i) => {
      const stars = snappedCells(card.glyph);
      expect(stars.length).toBe(glyph(card.glyph).stars.length);
      for (const n of card.noise) expect(stars.some(([r, c]) => r === n[0] && c === n[1])).toBe(false);
      expect(cells(solutionGrid(i))).toHaveLength(stars.length + card.noise.length);
      expect(card.noise).toHaveLength(2);
    });
  });

  it('has exactly one set of holes for each card, found by line logic alone', () => {
    PUNCH_CARDS.forEach((_, i) => {
      const { rows, cols } = cluesOf(solutionGrid(i));
      const found = solutions(rows, cols);
      expect(found).toHaveLength(1);
      expect(found[0]).toEqual(solutionGrid(i));
      expect(lineSolvable(rows, cols)).toBe(true);
    });
  });

  it('shows no other constellation among the holes of a card', () => {
    PUNCH_CARDS.forEach((card, i) => {
      const held = new Set(cells(solutionGrid(i)).map(([r, c]) => r * PUNCH_SIZE + c));
      for (const g of GLYPHS) {
        if (g.id === card.glyph) continue;
        expect(snappedCells(g.id).every(([r, c]) => held.has(r * PUNCH_SIZE + c))).toBe(false);
      }
    });
  });

  it('has no card finished at the start, and finishes only on matching groups', () => {
    PUNCH_CARDS.forEach((_, i) => {
      expect(cardDone(i, emptyGrid())).toBe(false);
      expect(cardDone(i, solutionGrid(i))).toBe(true);
      // One hole too many, or one missing, breaks it.
      const extra = solutionGrid(i);
      const blank = extra.flatMap((row, r) => row.flatMap((on, c) => (on ? [] : [[r, c] as [number, number]])))[0];
      extra[blank[0]][blank[1]] = true;
      expect(cardDone(i, extra)).toBe(false);
      const missing = solutionGrid(i);
      const used = cells(missing)[0];
      missing[used[0]][used[1]] = false;
      expect(cardDone(i, missing)).toBe(false);
    });
  });

  it('lights a line on its own as soon as its groups match', () => {
    const clues = cluesOf(solutionGrid(2));
    const g = emptyGrid();
    // The crown has a row of "1 2" holes; the right groups in that row make only that row done.
    const row = clues.rows.findIndex((runs) => runs.join(',') === '1,2');
    expect(row).toBeGreaterThanOrEqual(0);
    expect(linesDone(g, clues).rows[row]).toBe(false);
    solutionGrid(2)[row].forEach((on, c) => { g[row][c] = on; });
    const done = linesDone(g, clues);
    expect(done.rows[row]).toBe(true);
    expect(done.rows.filter(Boolean).length).toBe(clues.rows.filter((runs) => runs.length === 0).length + 1);
  });

  it('keeps the sample card clear of every constellation, with groups of different lengths', () => {
    const sample = sampleGrid();
    const held = new Set(cells(sample).map(([r, c]) => r * PUNCH_SIZE + c));
    for (const g of GLYPHS) expect(snappedCells(g.id).every(([r, c]) => held.has(r * PUNCH_SIZE + c))).toBe(false);
    const clues = cluesOf(sample);
    const lengths = new Set([...clues.rows, ...clues.cols].flat());
    expect([1, 3, 4, 5].every((n) => lengths.has(n))).toBe(true);
    expect(rowOf(sample, 2)).toEqual([true, true, true, true, false]);
    expect(colOf(sample, 0)).toEqual([true, true, true, true, true]);
  });

  it('answers with the three constellations left to right, not in keypad order', () => {
    const answer = PUZZLES.find((p) => p.id === 'punch-cards')?.answer;
    expect(answer).toEqual(['triangle', 'hook', 'crown']);
    expect(answer).toEqual([...PUNCH_READING]);
    const keypad = (answer ?? []).map((id) => GLYPHS.findIndex((g) => g.id === id));
    expect(keypad.every((v, i, a) => i === 0 || v > a[i - 1])).toBe(false);
  });

  it('finds the cell under a scene point, and none outside the card', () => {
    expect(editorCellAt(EDITOR.x + EDITOR.cell / 2, EDITOR.y + EDITOR.cell / 2)).toEqual([0, 0]);
    expect(editorCellAt(EDITOR.x + 5 * EDITOR.cell - 1, EDITOR.y + 5 * EDITOR.cell - 1)).toEqual([4, 4]);
    expect(editorCellAt(EDITOR.x - 1, EDITOR.y + 50)).toBeNull();
    expect(editorCellAt(EDITOR.x + 50, EDITOR.y + 5 * EDITOR.cell)).toBeNull();
  });
});

describe('drawer cabinet (chapter 4, level 2)', () => {
  const fill = (b: number[][]): number[][] => b.map((row) => [...row]);
  const empties = (): [number, number][] => cabStart().flatMap((row, r) => row.flatMap((v, c) => (v < 0 ? [[r, c] as [number, number]] : [])));

  /** Every full cabinet that agrees with the pinned stones and has all four kinds in each row, column and block. */
  const solutions = (): number[][][] => {
    const found: number[][][] = [];
    const todo = empties();
    const b = cabStart();
    const walk = (i: number) => {
      if (found.length > 1) return;
      if (i === todo.length) {
        if (cabSolved(b)) found.push(fill(b));
        return;
      }
      const [r, c] = todo[i];
      for (let v = 0; v < CAB_STONES.length; v += 1) {
        b[r][c] = v;
        // Cheap prune: no repeat in its row or column so far.
        if (b[r].some((x, k) => k !== c && x === v) || b.some((row, k) => k !== r && row[c] === v)) continue;
        walk(i + 1);
      }
      b[r][c] = -1;
    };
    walk(0);
    return found;
  };

  it('has exactly one way to fill the cabinet around the pinned stones, and it is the stored solution', () => {
    const found = solutions();
    expect(found).toHaveLength(1);
    expect(found[0]).toEqual(CAB_SOLUTION.map((row) => [...row]));
    expect(GIVENS_CAB).toHaveLength(4);
  });

  it('needs every pinned stone: leaving one out gives more than one filling', () => {
    GIVENS_CAB.forEach(([gr, gc]) => {
      const b = cabStart();
      b[gr][gc] = -1;
      const todo = b.flatMap((row, r) => row.flatMap((v, c) => (v < 0 ? [[r, c] as [number, number]] : [])));
      let count = 0;
      const walk = (i: number) => {
        if (count > 1) return;
        if (i === todo.length) {
          if (cabSolved(b)) count += 1;
          return;
        }
        const [r, c] = todo[i];
        for (let v = 0; v < CAB_STONES.length; v += 1) {
          b[r][c] = v;
          if (b[r].some((x, k) => k !== c && x === v) || b.some((row, k) => k !== r && row[c] === v)) continue;
          walk(i + 1);
        }
        b[r][c] = -1;
      };
      walk(0);
      expect(count).toBeGreaterThan(1);
    });
  });

  it('lights a group only when it holds all four kinds, and the whole cabinet only when every group does', () => {
    const b = cabStart();
    expect(CAB_UNITS.filter((u) => cabUnitDone(b, u.kind, u.index))).toHaveLength(0);
    expect(cabSolved(b)).toBe(false);
    const full = fill(CAB_SOLUTION as number[][]);
    expect(CAB_UNITS.every((u) => cabUnitDone(full, u.kind, u.index))).toBe(true);
    full[0][1] = full[0][0];
    expect(cabUnitDone(full, 'row', 0)).toBe(false);
    expect(cabUnitDone(full, 'block', 0)).toBe(false);
    expect(cabSolved(full)).toBe(false);
    expect(cellsOf('block', 3)).toEqual([[2, 2], [2, 3], [3, 2], [3, 3]]);
  });

  it('cycles a stone through the four kinds and back to empty', () => {
    const seq: number[] = [];
    for (let v = -1, i = 0; i < 6; i += 1) {
      v = nextStone(v);
      seq.push(v);
    }
    expect(seq).toEqual([0, 1, 2, 3, -1, 0]);
  });

  it('puts the handles on empty drawers, one per row and column, with four different stones, answered top to bottom', () => {
    expect(HANDLES_CAB).toHaveLength(4);
    expect(new Set(HANDLES_CAB).size).toBe(4);
    HANDLES_CAB.forEach((c, r) => expect(cabGiven(r, c)).toBe(false));
    const answer = PUZZLES.find((p) => p.id === 'drawer-cabinet')?.answer;
    expect(answer).toEqual(HANDLES_CAB.map((c, r) => CAB_STONES[CAB_SOLUTION[r][c]]));
    expect(new Set(answer).size).toBe(4);
    expect(answer).toEqual([...CAB_READING]);
    const keypad = (answer ?? []).map((id) => GLYPHS.findIndex((g) => g.id === id));
    expect(keypad.every((v, i, a) => i === 0 || v > a[i - 1])).toBe(false);
  });

  it('uses four stones that read apart as plain dots (no arrow and diamond together)', () => {
    expect(new Set(CAB_STONES).size).toBe(4);
    expect(CAB_STONES.includes('arrow') && CAB_STONES.includes('diamond')).toBe(false);
  });
});

describe('dome levers (chapter 4, level 4)', () => {
  const subsets = (): number[][] => Array.from({ length: 1 << LEVER_COUNT }, (_, m) => Array.from({ length: LEVER_COUNT }, (_, i) => i).filter((i) => (m >> i) & 1));

  it('lights every lamp in exactly one position of the levers, the stored solution', () => {
    const lit = subsets().filter((s) => lampsAllLit(s));
    expect(lit).toEqual([[...LEVER_SOLUTION].sort((a, b) => a - b)]);
  });

  it('starts with two levers down and no lamp pattern that already lights the dome', () => {
    expect(LEVER_START).toHaveLength(2);
    expect(lampsAllLit(LEVER_START)).toBe(false);
    // Not one lever away from the solution.
    const away = (a: readonly number[], b: readonly number[]) => a.filter((i) => !b.includes(i)).length + b.filter((i) => !a.includes(i)).length;
    expect(away(LEVER_START, LEVER_SOLUTION)).toBeGreaterThanOrEqual(4);
  });

  it('gives each lever its own picture of two to three lamps, and each lamp two to four levers', () => {
    expect(new Set(AFFECTS_DOME.map((a) => a.join(','))).size).toBe(LEVER_COUNT);
    AFFECTS_DOME.forEach((a) => {
      expect(a.length).toBeGreaterThanOrEqual(2);
      expect(a.length).toBeLessThanOrEqual(3);
    });
    for (let j = 0; j < LAMP_COUNT; j += 1) {
      const n = AFFECTS_DOME.filter((a) => a.includes(j)).length;
      expect(n).toBeGreaterThanOrEqual(2);
      expect(n).toBeLessThanOrEqual(4);
    }
  });

  it('flips exactly the lamps of a lever when it moves', () => {
    const before = lampsLit(LEVER_START);
    const after = lampsLit([...LEVER_START, 3]);
    after.forEach((on, j) => expect(on !== before[j]).toBe(AFFECTS_DOME[3].includes(j)));
  });

  it('answers with the engravings of the solution levers left to right, not in keypad order', () => {
    const answer = PUZZLES.find((p) => p.id === 'dome-levers')?.answer;
    expect(answer).toEqual([...LEVER_SOLUTION].sort((a, b) => a - b).map((i) => ENGRAVINGS_DOME[i]));
    expect(new Set(answer).size).toBe(answer?.length);
    expect(new Set(ENGRAVINGS_DOME).size).toBe(LEVER_COUNT);
    expect(ENGRAVINGS_DOME.includes('arrow') || ENGRAVINGS_DOME.includes('diamond')).toBe(false);
    const keypad = (answer ?? []).map((id) => GLYPHS.findIndex((g) => g.id === id));
    expect(keypad.every((v, i, a) => i === 0 || v > a[i - 1])).toBe(false);
  });
});

describe('lens depot (chapter 4, level 5)', () => {
  const play = (state: DepotState, dr: number, dc: number): DepotState => {
    const next = depotStep(state, dr, dc);
    expect(next).not.toBeNull();
    return next as DepotState;
  };

  it('has four lenses that fit the four sockets, two cracked crates, and nothing solved at the start', () => {
    expect(DEPOT_START.crates).toHaveLength(6);
    expect(DEPOT_START.crates.filter((x) => x.kind < DEPOT_DECOY).map((x) => x.kind).sort()).toEqual([0, 1, 2, 3]);
    expect(DEPOT_START.crates.filter((x) => x.kind === DEPOT_DECOY)).toHaveLength(2);
    expect(depotSolved(DEPOT_START)).toBe(false);
    expect(DEPOT_START.crates.every((x) => x.r > 0)).toBe(true);
    expect(DEPOT_MAP[0].split('').filter((ch) => ch === 'S')).toHaveLength(4);
  });

  it('can be solved: the stored pushes, each walked to and made, put every lens in its socket', () => {
    let state = DEPOT_START;
    for (const [r, c, dr, dc] of DEPOT_PUSHES) {
      const path = depotWalkTo(state, [r - dr, c - dc]);
      expect(path).not.toBeNull();
      for (const [sr, sc] of path ?? []) state = play(state, sr, sc);
      const before = state.crates.findIndex((x) => x.r === r && x.c === c);
      expect(before).toBeGreaterThanOrEqual(0);
      state = play(state, dr, dc);
      expect(state.crates[before].r).toBe(r + dr);
      expect(state.crates[before].c).toBe(c + dc);
    }
    expect(depotSolved(state)).toBe(true);
    expect(depotFilled(state)).toEqual([0, 1, 2, 3]);
    expect(DEPOT_PUSHES.length).toBeGreaterThanOrEqual(15);
  });

  it('lets a lens enter only its own socket, and never lets the owl or a cracked crate in', () => {
    const base = { player: [2, 1] as [number, number], crates: [{ kind: 0, r: 1, c: 1 }, { kind: 1, r: 1, c: 5 }, { kind: DEPOT_DECOY, r: 1, c: 3 }] };
    expect(depotStep(base, -1, 0)).not.toBeNull();
    // Socket 0 is above column 1, so a lens of kind 1 there is refused, and so is a cracked crate under socket 1.
    expect(depotStep({ ...base, crates: [{ kind: 1, r: 1, c: 1 }] }, -1, 0)).toBeNull();
    expect(depotStep({ player: [2, 3], crates: [{ kind: DEPOT_DECOY, r: 1, c: 3 }] }, -1, 0)).toBeNull();
    expect(depotStep({ player: [1, 1], crates: [] }, -1, 0)).toBeNull();
  });

  it('does not let two crates or a crate and a wall be pushed together', () => {
    const jam = { player: [3, 1] as [number, number], crates: [{ kind: 2, r: 3, c: 2 }, { kind: 3, r: 3, c: 3 }] };
    expect(depotStep(jam, 0, 1)).toBeNull();
    expect(depotStep({ player: [3, 6], crates: [{ kind: 2, r: 3, c: 7 }] }, 0, 1)).toBeNull();
  });

  it('rolls back to just after the last push when the owl has walked, then to just after the push before', () => {
    const history: DepotState[] = [];
    let state = DEPOT_START;
    const checkpoints: DepotState[] = [DEPOT_START];
    const step = (dr: number, dc: number) => {
      history.push(state);
      state = play(state, dr, dc);
    };
    // Make the first four pushes of the solution, walking to each one.
    for (const [r, c, dr, dc] of DEPOT_PUSHES.slice(0, 4)) {
      for (const [sr, sc] of depotWalkTo(state, [r - dr, c - dc]) ?? []) step(sr, sc);
      step(dr, dc);
      checkpoints.push(state);
    }
    // Walk a step away after the fourth push (to a free neighbour), then roll back: just after the fourth push.
    const free = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const).find(([dr, dc]) => {
      const next = depotStep(state, dr, dc);
      return next !== null && next.crates === state.crates;
    });
    expect(free).toBeDefined();
    step(free![0], free![1]);
    expect(depotRollBack(history, state)).toBe(checkpoints[4]);
    // Just pushed: back to just after the third push (the walking before the fourth is undone too).
    expect(depotRollBack(history, checkpoints[4])).toBe(checkpoints[3]);
    expect(depotRollBack(history, checkpoints[3])).toBe(checkpoints[2]);
    expect(depotRollBack(history, checkpoints[2])).toBe(checkpoints[1]);
    expect(depotRollBack(history, checkpoints[1])).toBe(checkpoints[0]);
    // Nothing left to undo: it stays at the start.
    expect(depotRollBack(history, checkpoints[0])).toBe(checkpoints[0]);
  });

  it('answers with the lens constellations of the sockets left to right, not in keypad order', () => {
    const answer = PUZZLES.find((p) => p.id === 'lens-depot')?.answer;
    expect(answer).toEqual([...DEPOT_LENSES]);
    expect(answer).toHaveLength(4);
    expect(new Set(answer).size).toBe(4);
    expect(answer?.includes('arrow') && answer?.includes('diamond')).toBe(false);
    const keypad = (answer ?? []).map((id) => GLYPHS.findIndex((g) => g.id === id));
    expect(keypad.every((v, i, a) => i === 0 || v > a[i - 1])).toBe(false);
  });
});

describe('oil jars (chapter 4, level 3)', () => {
  /** Every state reachable by pouring, with the fewest pours that get there. */
  const explore = (): Map<string, number> => {
    const dist = new Map<string, number>([[JAR_START.join(','), 0]]);
    const queue: number[][] = [[...JAR_START]];
    for (let head = 0; head < queue.length; head += 1) {
      const s = queue[head];
      for (let a = 0; a < 3; a += 1) {
        for (let b = 0; b < 3; b += 1) {
          const next = jarPour(s, a, b);
          if (!next || dist.has(next.join(','))) continue;
          dist.set(next.join(','), (dist.get(s.join(',')) ?? 0) + 1);
          queue.push(next);
        }
      }
    }
    return dist;
  };

  it('pours until the source is empty or the target is full, never creating or losing oil', () => {
    expect(jarPour([8, 0, 0], 0, 1)).toEqual([3, 5, 0]);
    expect(jarPour([3, 5, 0], 1, 2)).toEqual([3, 2, 3]);
    expect(jarPour([3, 2, 3], 2, 0)).toEqual([6, 2, 0]);
    expect(jarPour([1, 5, 2], 1, 2)).toEqual([1, 4, 3]);
    expect(jarPour([0, 5, 3], 0, 1)).toBeNull();
    expect(jarPour([8, 0, 0], 1, 0)).toBeNull();
    expect(jarPour([5, 5, 3], 2, 1)).toBeNull();
    for (const s of explore().keys()) expect(s.split(',').map(Number).reduce((a, b) => a + b, 0)).toBe(8);
  });

  it('has four recipe levels, none of them the starting amount, each reachable and not by a single pour', () => {
    const dist = explore();
    expect(JAR_TARGETS).toHaveLength(4);
    expect(new Set(JAR_TARGETS).size).toBe(4);
    expect(JAR_TARGETS.includes(JAR_START[0])).toBe(false);
    for (const t of JAR_TARGETS) {
      const best = Math.min(...[...dist.entries()].filter(([k]) => Number(k.split(',')[0]) === t).map(([, d]) => d));
      expect(Number.isFinite(best)).toBe(true);
      expect(best).toBeGreaterThanOrEqual(3);
    }
    // The hardest level needs many pours back and forth.
    const hardest = Math.max(...JAR_TARGETS.map((t) => Math.min(...[...dist.entries()].filter(([k]) => Number(k.split(',')[0]) === t).map(([, d]) => d))));
    expect(hardest).toBeGreaterThanOrEqual(7);
  });

  it('shows no recipe window at the start and every window along the two hint sequences', () => {
    expect(jarLevelsAt(JAR_START)).toEqual([]);
    const seen = new Set<number>();
    for (const seq of [SEQUENCE_A, SEQUENCE_B]) jarRun(seq).forEach((s) => jarLevelsAt(s).forEach((i) => seen.add(i)));
    expect([...seen].sort()).toEqual([0, 1, 2, 3]);
    expect(jarRun(SEQUENCE_A)).toHaveLength(8);
  });

  it('never leaves the player stuck: every reachable state can pour back to the full lamp jar', () => {
    const dist = explore();
    const back = new Set<string>([JAR_START.join(',')]);
    for (let changed = true; changed;) {
      changed = false;
      for (const k of dist.keys()) {
        if (back.has(k)) continue;
        const s = k.split(',').map(Number);
        for (let a = 0; a < 3 && !back.has(k); a += 1) {
          for (let b = 0; b < 3; b += 1) {
            const next = jarPour(s, a, b);
            if (next && back.has(next.join(','))) {
              back.add(k);
              changed = true;
              break;
            }
          }
        }
      }
    }
    expect(back.size).toBe(dist.size);
  });

  it('answers with the sheet constellations in sheet order, not in keypad order', () => {
    const answer = PUZZLES.find((p) => p.id === 'oil-jars')?.answer;
    expect(answer).toEqual([...JAR_READING]);
    expect(new Set(answer).size).toBe(4);
    expect(answer?.includes('arrow') && answer?.includes('diamond')).toBe(false);
    const keypad = (answer ?? []).map((id) => GLYPHS.findIndex((g) => g.id === id));
    expect(keypad.every((v, i, a) => i === 0 || v > a[i - 1])).toBe(false);
  });
});

describe('star-bead board (chapter 4, level 6)', () => {
  /** Every board reachable by jumping, and the ones where no jump is left. */
  const explore = (): { terminals: number[][]; states: number } => {
    const seen = new Set<string>([BEAD_START.join(',')]);
    const stack: number[][] = [[...BEAD_START]];
    const terminals: number[][] = [];
    while (stack.length) {
      const b = stack.pop() as number[];
      const moves = beadLegal(b);
      if (!moves.length) terminals.push(b);
      for (const m of moves) {
        const next = beadApply(b, m);
        const k = next.join(',');
        if (seen.has(k)) continue;
        seen.add(k);
        stack.push(next);
      }
    }
    return { terminals, states: seen.size };
  };

  it('is a plus-shaped board of 21 holes with four bases around the centre, all empty at the start', () => {
    expect(BEAD_CELLS).toHaveLength(21);
    expect(BEAD_START).toHaveLength(21);
    expect(new Set(BEAD_BASES).size).toBe(4);
    for (const b of BEAD_BASES) expect(BEAD_START[b]).toBe(-1);
    // Every jump goes over an adjacent cell and lands two cells away in a line.
    for (const [f, o, t] of BEAD_JUMPS) {
      const [fr, fc] = BEAD_CELLS[f];
      const [or, oc] = BEAD_CELLS[o];
      const [tr, tc] = BEAD_CELLS[t];
      expect(Math.abs(or - fr) + Math.abs(oc - fc)).toBe(1);
      expect([tr - or, tc - oc]).toEqual([or - fr, oc - fc]);
    }
  });

  it('starts with the four constellation beads once each and six blank ones', () => {
    const present = BEAD_START.filter((v) => v >= 0);
    expect(present).toHaveLength(10);
    expect(present.filter((v) => v === BEAD_BLANK)).toHaveLength(6);
    expect(present.filter((v) => v < BEAD_BLANK).sort()).toEqual([0, 1, 2, 3]);
    expect(beadSolved(BEAD_START)).toBe(false);
  });

  it('has a stored solution of legal jumps that ends with four beads on the four bases', () => {
    let b: number[] = [...BEAD_START];
    for (const j of BEAD_SOLUTION) {
      expect(beadLegal(b).some(([f, o, t]) => f === j[0] && o === j[1] && t === j[2])).toBe(true);
      b = beadApply(b, j);
    }
    expect(beadSolved(b)).toBe(true);
    expect(BEAD_SOLUTION).toHaveLength(6);
  });

  it('always ends with the same constellation on each base, and most ways of playing run into a dead end', () => {
    const { terminals } = explore();
    const finished = terminals.filter((b) => beadSolved(b));
    expect(finished.length).toBeGreaterThanOrEqual(1);
    const arrangements = new Set(finished.map((b) => BEAD_BASES.map((c) => b[c]).join('')));
    expect(arrangements.size).toBe(1);
    expect([...arrangements][0]).toBe(BEAD_BASES.map((c) => beadSolvedBoard()[c]).join(''));
    expect(terminals.length - finished.length).toBeGreaterThan(20);
    // A finish never keeps a blank bead on a base.
    for (const b of finished) for (const c of BEAD_BASES) expect(b[c]).not.toBe(BEAD_BLANK);
  });

  it('answers with the base constellations clockwise from the top, four different ones, not in keypad order', () => {
    const answer = PUZZLES.find((p) => p.id === 'star-board')?.answer;
    expect(answer).toEqual([...BEAD_READING]);
    expect(new Set(answer).size).toBe(4);
    expect(answer?.includes('arrow') && answer?.includes('diamond')).toBe(false);
    const keypad = (answer ?? []).map((id) => GLYPHS.findIndex((g) => g.id === id));
    expect(keypad.every((v, i, a) => i === 0 || v > a[i - 1])).toBe(false);
  });
});

describe('old keeper lock (chapter 4, level 7)', () => {
  const SYMS = LOCK_SYMBOLS.length;
  const allCodes = (): number[][] => {
    const out: number[][] = [];
    for (let a = 0; a < SYMS; a += 1) for (let b = 0; b < SYMS; b += 1) for (let c = 0; c < SYMS; c += 1) for (let d = 0; d < SYMS; d += 1) out.push([a, b, c, d]);
    return out;
  };
  const fitting = (pages: typeof LOCK_NOTEBOOK) => allCodes().filter((code) => pages.every((p) => lockFits(code, p)));

  it('scores a guess with gold for the right place and silver for the right constellation in another place', () => {
    expect(lockFeedback([2, 4, 5, 0], [2, 4, 5, 0])).toEqual({ gold: 4, silver: 0 });
    expect(lockFeedback([2, 4, 5, 0], [4, 2, 5, 0])).toEqual({ gold: 2, silver: 2 });
    expect(lockFeedback([2, 4, 5, 0], [1, 1, 1, 1])).toEqual({ gold: 0, silver: 0 });
    // A repeated symbol in the guess is only worth as many pegs as the code has of it.
    expect(lockFeedback([2, 4, 5, 0], [2, 2, 2, 2])).toEqual({ gold: 1, silver: 0 });
    expect(lockFeedback([2, 2, 5, 0], [2, 3, 2, 3])).toEqual({ gold: 1, silver: 1 });
    // Empty slots earn nothing.
    expect(lockFeedback([2, 4], [-1, 4])).toEqual({ gold: 1, silver: 0 });
  });

  it('has the secret as the only code that fits all five pages (repeats allowed), and every page is needed', () => {
    const found = fitting(LOCK_NOTEBOOK);
    expect(found).toEqual([[...LOCK_SECRET]]);
    LOCK_NOTEBOOK.forEach((_, i) => {
      const without = LOCK_NOTEBOOK.filter((__, j) => j !== i);
      expect(fitting(without).length).toBeGreaterThan(1);
    });
  });

  it('writes on every page the pegs the secret really earns, with no page that is the secret itself', () => {
    expect(LOCK_NOTEBOOK).toHaveLength(5);
    for (const page of LOCK_NOTEBOOK) {
      expect(lockFeedback(LOCK_SECRET, page.guess)).toEqual({ gold: page.gold, silver: page.silver });
      expect(page.guess.join()).not.toBe(LOCK_SECRET.join());
      expect(page.gold + page.silver).toBeGreaterThan(0);
    }
    expect(new Set(LOCK_NOTEBOOK.map((p) => p.guess.join())).size).toBe(5);
  });

  it('lights no lamp for an empty or partly filled try, and all five for the secret only', () => {
    expect(lockPages([-1, -1, -1, -1])).toEqual([]);
    expect(lockPages([2, 4, 5, -1])).toEqual([]);
    expect(lockPages([...LOCK_SECRET])).toEqual([0, 1, 2, 3, 4]);
    expect(lockPages([2, 4, 0, 5]).length).toBeLessThan(5);
  });

  it('cycles a slot through every constellation and back to empty', () => {
    const seq: number[] = [];
    for (let v = -1, i = 0; i < SYMS + 2; i += 1) {
      v = lockNext(v);
      seq.push(v);
    }
    expect(seq).toEqual([0, 1, 2, 3, 4, 5, 6, -1, 0]);
  });

  it('answers with the secret constellations left to right, not in keypad order', () => {
    const answer = PUZZLES.find((p) => p.id === 'old-keeper-lock')?.answer;
    expect(answer).toEqual([...LOCK_READING]);
    expect(new Set(answer).size).toBe(4);
    expect(LOCK_SYMBOLS.includes('arrow') || LOCK_SYMBOLS.includes('diamond')).toBe(false);
    const keypad = (answer ?? []).map((id) => GLYPHS.findIndex((g) => g.id === id));
    expect(keypad.every((v, i, a) => i === 0 || v > a[i - 1])).toBe(false);
  });
});

describe('copper wires (chapter 4, level 8)', () => {
  const norm = (cells: (readonly [number, number])[]): string => {
    const r0 = Math.min(...cells.map(([r]) => r));
    const c0 = Math.min(...cells.map(([, c]) => c));
    return cells.map(([r, c]) => `${r - r0},${c - c0}`).sort().join(' ');
  };

  /** Every way of laying 0, 1 or 2 wires on each candidate pair so that each star gets its number and no wires cross. */
  const solutions = (limit = 3): number[][] => {
    const m = WIRE_EDGES.length;
    const rem = [...WIRE_NUMBERS];
    const left = WIRE_STARS.map((_, i) => WIRE_EDGES.filter(([a, b]) => a === i || b === i).length);
    const val = new Array<number>(m).fill(0);
    const found: number[][] = [];
    const rec = (e: number) => {
      if (found.length >= limit) return;
      if (e === m) {
        if (rem.every((x) => x === 0)) found.push([...val]);
        return;
      }
      const [a, b] = WIRE_EDGES[e];
      left[a] -= 1;
      left[b] -= 1;
      for (let v = 0; v <= 2; v += 1) {
        if (v > rem[a] || v > rem[b]) break;
        if (v > 0 && val.some((n, f) => f < e && n > 0 && wireCrosses(e, f))) continue;
        rem[a] -= v;
        rem[b] -= v;
        val[e] = v;
        if (rem[a] <= 2 * left[a] && rem[b] <= 2 * left[b]) rec(e + 1);
        rem[a] += v;
        rem[b] += v;
        val[e] = 0;
      }
      left[a] += 1;
      left[b] += 1;
    };
    rec(0);
    return found;
  };

  it('has nineteen distinct stars whose numbers are the wires of the stored solution', () => {
    expect(WIRE_STARS).toHaveLength(19);
    expect(new Set(WIRE_STARS.map(([r, c]) => `${r},${c}`)).size).toBe(19);
    expect(wireDegrees(WIRE_SOLUTION_COUNTS)).toEqual([...WIRE_NUMBERS]);
    expect(wireSolved(WIRE_SOLUTION_COUNTS)).toBe(true);
    expect(wireSolved(WIRE_EDGES.map(() => 0))).toBe(false);
    // Every candidate wire runs across, down or at 45 degrees.
    for (const [a, b] of WIRE_EDGES) {
      const dr = Math.abs(WIRE_STARS[a][0] - WIRE_STARS[b][0]);
      const dc = Math.abs(WIRE_STARS[a][1] - WIRE_STARS[b][1]);
      expect(dr === 0 || dc === 0 || dr === dc).toBe(true);
    }
  });

  it('has exactly one way to lay the wires, and decoy pairs the numbers rule out', () => {
    const found = solutions();
    expect(found).toHaveLength(1);
    expect(found[0]).toEqual([...WIRE_SOLUTION_COUNTS]);
    expect(WIRE_EDGES.filter((_, e) => WIRE_SOLUTION_COUNTS[e] === 0).length).toBeGreaterThanOrEqual(6);
    expect(WIRE_SOLUTION_COUNTS.some((n) => n === 2)).toBe(true);
  });

  it('draws a triangle, an arrow, a crown and a ladle, with 3, 4, 5 and 7 stars', () => {
    const g = wireGroups(WIRE_SOLUTION_COUNTS);
    expect(g.map((x) => x.length)).toEqual([3, 4, 5, 7]);
    const shapes = g.map((x) => norm(x.map((i) => WIRE_STARS[i])));
    expect(shapes[0]).toBe(norm([[0, 3], [3, 0], [3, 6]]));
    expect(shapes[1]).toBe(norm([[3, 0], [3, 6], [1, 4], [5, 4]]));
    expect(shapes[2]).toBe(norm([[0, 0], [3, 3], [1, 5], [3, 7], [0, 10]]));
    expect(shapes[3]).toBe(norm([[1, 0], [0, 1], [0, 3], [2, 5], [2, 8], [5, 8], [5, 5]]));
    expect(wireGroups(WIRE_EDGES.map(() => 0))).toEqual([]);
  });

  it('mixes the four constellations: for at least 40% of the stars the nearest star belongs to another one', () => {
    const owner = new Map<number, number>();
    wireGroups(WIRE_SOLUTION_COUNTS).forEach((g, k) => g.forEach((i) => owner.set(i, k)));
    let other = 0;
    WIRE_STARS.forEach((p, i) => {
      let best = Infinity;
      let nearest = -1;
      WIRE_STARS.forEach((q, j) => {
        const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
        if (j !== i && d < best) {
          best = d;
          nearest = j;
        }
      });
      if (owner.get(nearest) !== owner.get(i)) other += 1;
    });
    expect(other / WIRE_STARS.length).toBeGreaterThanOrEqual(0.4);
  });

  it('refuses a first wire that would cross another and cycles none, one, two, none', () => {
    const pair = WIRE_EDGES.flatMap((_, e) => WIRE_EDGES.flatMap((__, f) => (e < f && wireCrosses(e, f) ? [[e, f] as const] : [])))[0];
    expect(pair).toBeDefined();
    const counts = WIRE_EDGES.map(() => 0);
    counts[pair[0]] = 1;
    expect(wireNext(counts, pair[1])).toBeNull();
    expect(wireNext(counts, pair[0])).toBe(2);
    counts[pair[0]] = 2;
    expect(wireNext(counts, pair[0])).toBe(0);
    expect(wireNext(WIRE_EDGES.map(() => 0), pair[0])).toBe(1);
  });

  it('answers with the constellations from the smallest group to the largest, not in keypad order', () => {
    const answer = PUZZLES.find((p) => p.id === 'copper-wires')?.answer;
    expect(answer).toEqual(['triangle', 'arrow', 'crown', 'dipper']);
    expect(answer).toEqual([...WIRE_READING]);
    const keypad = (answer ?? []).map((id) => GLYPHS.findIndex((g) => g.id === id));
    expect(keypad.every((v, i, a) => i === 0 || v > a[i - 1])).toBe(false);
  });
});

describe('Chapter 4 level 9: wind-up owl', () => {
  /** Every distinct order of the tray cards. */
  const arrangements = (): string[][] => {
    const out = new Set<string>();
    const rec = (rest: string[], cur: string[]) => {
      if (!rest.length) {
        out.add(cur.join(''));
        return;
      }
      rest.forEach((x, i) => rec([...rest.slice(0, i), ...rest.slice(i + 1)], [...cur, x]));
    };
    rec([...OWL_TRAY], []);
    return [...out].map((a) => a.split(''));
  };

  it('has exactly one arrangement of the eight tray cards that visits all four constellation tiles and ends on the perch', () => {
    const all = arrangements();
    expect(all.length).toBe(420);
    const winners = all.filter((a) => owlRun(a as never).solved);
    expect(winners).toHaveLength(1);
    expect(winners[0]).toEqual([...OWL_SOLUTION]);
  });

  it('uses the tray cards exactly (the solution is a rearrangement of the tray)', () => {
    expect([...OWL_SOLUTION].sort()).toEqual([...OWL_TRAY].sort());
  });

  it('keeps the start, perch, constellation tiles and cracks on distinct tiles of the floor', () => {
    const cells = [[OWL_START.r, OWL_START.c], [OWL_PERCH[0], OWL_PERCH[1]], ...OWL_STARS.map((t) => [t[0], t[1]]), ...OWL_HOLES.map((t) => [t[0], t[1]])];
    expect(new Set(cells.map((c) => c.join(','))).size).toBe(cells.length);
    cells.forEach(([r, c]) => {
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(OWL_ROWS);
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThan(OWL_COLS);
    });
  });

  it('walks the tiles in the listed order, so the tags 1–4 are the answer order', () => {
    const run = owlRun(OWL_SOLUTION as never);
    expect(run.visited).toEqual([0, 1, 2, 3]);
    expect(owlOrder(run)).toEqual([...OWL_GLYPHS]);
  });

  it('falls off the floor or onto a crack', () => {
    expect(owlRun(['F', 'F', 'F', 'F', 'F', 'F', 'F', 'F']).fell).toBe('edge');
    expect(owlRun(['R', 'R', 'F', 'F', 'L', 'F', 'F', 'F']).fell).toBe('hole');
    expect(owlRun(['L', 'L', 'L', 'L', 'L', 'L', 'L', 'L']).fell).toBeNull();
  });

  it('answers with the four constellations in the walked order, not in keypad order', () => {
    const answer = PUZZLES.find((p) => p.id === 'wind-up-owl')?.answer;
    expect(answer).toEqual([...OWL_READING]);
    expect(new Set(answer).size).toBe(4);
    const keypad = (answer ?? []).map((id) => GLYPHS.findIndex((g) => g.id === id));
    expect(keypad.every((v, i, a) => i === 0 || v > a[i - 1])).toBe(false);
  });
});

describe('Chapter 4 level 10: telescope yard', () => {
  const permutations = (): number[][] => {
    const out: number[][] = [];
    const rec = (cur: number[]) => {
      if (cur.length === YARD_N) {
        out.push(cur.slice());
        return;
      }
      for (let c = 0; c < YARD_N; c += 1) {
        if (!cur.includes(c)) rec([...cur, c]);
      }
    };
    rec([]);
    return out;
  };

  it('has exactly one placement with a telescope in every row, column and region, none touching', () => {
    const all = permutations();
    expect(all).toHaveLength(720);
    const winners = all.filter((p) => yardSolved(p.map((c, r) => [r, c] as const)));
    expect(winners).toEqual([[...YARD_SOLUTION]]);
  });

  it('cuts the yard into six connected regions of 3 to 9 tiles, each holding exactly one solution tile', () => {
    for (let g = 0; g < YARD_N; g += 1) {
      const tiles: [number, number][] = [];
      YARD_REGIONS.forEach((row, r) => row.forEach((k, c) => { if (k === g) tiles.push([r, c]); }));
      expect(tiles.length).toBeGreaterThanOrEqual(3);
      expect(tiles.length).toBeLessThanOrEqual(9);
      const seen = new Set<string>([tiles[0].join(',')]);
      const stack = [tiles[0]];
      while (stack.length) {
        const [r, c] = stack.pop() as [number, number];
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const q: [number, number] = [r + dr, c + dc];
          if (tiles.some((t) => t[0] === q[0] && t[1] === q[1]) && !seen.has(q.join(','))) {
            seen.add(q.join(','));
            stack.push(q);
          }
        }
      }
      expect(seen.size).toBe(tiles.length);
      expect(tiles.filter(([r, c]) => YARD_SOLUTION[r] === c)).toHaveLength(1);
    }
  });

  it('shows a constellation only in the four copper regions, and a wrong tile of such a region shows a different one', () => {
    expect(YARD_COPPER).toHaveLength(4);
    YARD_REGIONS.forEach((row, r) => row.forEach((g, c) => {
      expect(YARD_LENS[r][c] === null).toBe(!YARD_COPPER.includes(g));
    }));
    const right = new Map<number, string>();
    YARD_CELLS.forEach(([r, c]) => { if (YARD_LENS[r][c]) right.set(YARD_REGIONS[r][c], YARD_LENS[r][c] as string); });
    expect(right.size).toBe(4);
    expect(new Set(right.values()).size).toBe(4);
    YARD_REGIONS.forEach((row, r) => row.forEach((g, c) => {
      if (YARD_LENS[r][c] && YARD_SOLUTION[r] !== c) expect(YARD_LENS[r][c]).not.toBe(right.get(g));
    }));
  });

  it('reads the lenses from the left column to the right, not in keypad order, and shows nothing at the start', () => {
    expect(yardLenses(YARD_CELLS)).toEqual([...YARD_READING]);
    expect(yardLenses([])).toEqual([]);
    expect(new Set(YARD_READING).size).toBe(4);
    const keypad = YARD_READING.map((id) => GLYPHS.findIndex((g) => g.id === id));
    expect(keypad.every((v, i, a) => i === 0 || v > a[i - 1])).toBe(false);
    const answer = PUZZLES.find((p) => p.id === 'telescope-yard')?.answer;
    expect(answer).toEqual([...YARD_READING]);
  });

  it('shows a wrong constellation when a telescope stands on a wrong tile of its region', () => {
    const wrong = YARD_CELLS.map(([r, c]) => [r, c] as const);
    const target = wrong.findIndex(([r, c]) => YARD_LENS[r][c] !== null);
    const [r, c] = wrong[target];
    const other = YARD_REGIONS[r].findIndex((g, cc) => cc !== c && g === YARD_REGIONS[r][c]);
    const moved: (readonly [number, number])[] = other >= 0 ? wrong.map((x, i) => (i === target ? [r, other] as const : x)) : wrong;
    if (other >= 0) expect(yardLenses(moved)).not.toEqual([...YARD_READING]);
  });

  it('flags telescopes that touch, even corner to corner, or share a row, column or region', () => {
    expect(yardClash([0, 0], [1, 1])).toBe(true);
    expect(yardClash([0, 0], [2, 2])).toBe(YARD_REGIONS[0][0] === YARD_REGIONS[2][2]);
    expect(yardConflicting([[0, 0], [0, 4]])).toEqual([true, true]);
    expect(yardConflicting(YARD_CELLS)).toEqual(YARD_CELLS.map(() => false));
  });

  it('cycles a tile: empty, dot, telescope, empty', () => {
    expect(yardNext(0)).toBe(1);
    expect(yardNext(1)).toBe(2);
    expect(yardNext(2)).toBe(0);
  });
});

describe('hub chapter', () => {
  it('finds the chapter of every level, so the hub reopens on the chapter just left', () => {
    CHAPTERS.forEach((chapter, ci) => chapter.levels.forEach((p) => expect(chapterOfLevel(p.id)).toBe(ci)));
    expect(chapterOfLevel('telescope-yard')).toBe(3);
    expect(chapterOfLevel('no-such-level')).toBe(0);
  });
});

describe('Chapter 4 level 11: star scales', () => {
  const shelves = (): number[][] => {
    const out: number[][] = [];
    const rec = (cur: number[]) => {
      if (cur.length === SCALE_COUNT) {
        out.push(cur.slice());
        return;
      }
      for (let i = 0; i < SCALE_COUNT; i += 1) {
        if (!cur.includes(i)) rec([...cur, i]);
      }
    };
    rec([]);
    return out;
  };

  it('has exactly one shelf order (of 720) on which every scale agrees', () => {
    const all = shelves();
    expect(all).toHaveLength(720);
    const winners = all.filter((shelf) => scalesSolved(shelf));
    expect(winners).toEqual([[...SCALE_SHELF]]);
  });

  it('needs every scale: dropping any one leaves more than one consistent order', () => {
    SCALE_SET.forEach((_, drop) => {
      const left = shelves().filter((shelf) => {
        const w = scaleWeights(shelf);
        return SCALE_SET.every((__, k) => k === drop || scaleAgrees(w, k));
      });
      expect(left.length).toBeGreaterThan(1);
    });
  });

  it('weighs the stones 1 to 6 once each, with the scales tipped by their sums', () => {
    expect([...SCALE_WEIGHTS].sort()).toEqual([1, 2, 3, 4, 5, 6]);
    SCALE_SET.forEach((s, k) => expect(scaleTilt(SCALE_WEIGHTS, s)).toBe(SCALE_TILTS[k]));
    SCALE_SET.forEach((s) => {
      const used = [...s.left, ...s.right];
      expect(new Set(used).size).toBe(used.length);
      expect(s.left.length).toBeLessThanOrEqual(3);
      expect(s.right.length).toBeLessThanOrEqual(3);
    });
    expect(SCALE_TILTS.some((t) => t === 0)).toBe(true);
  });

  it('carves four of the six stones, and the answer reads them from lightest to heaviest, not in keypad order', () => {
    expect(SCALE_CARVING.filter(Boolean)).toHaveLength(4);
    expect(new Set(SCALE_READING).size).toBe(4);
    const keypad = SCALE_READING.map((id) => GLYPHS.findIndex((g) => g.id === id));
    expect(keypad.every((v, i, a) => i === 0 || v > a[i - 1])).toBe(false);
    const answer = PUZZLES.find((p) => p.id === 'star-scales')?.answer;
    expect(answer).toEqual([...SCALE_READING]);
  });

  it('draws the heavier pan lower (larger y) and a level scale flat', () => {
    SCALE_SET.forEach((s, k) => {
      const left = scaleDrop(SCALE_TILTS[k], -1, 24);
      const right = scaleDrop(SCALE_TILTS[k], 1, 24);
      if (SCALE_TILTS[k] > 0) expect(left).toBeGreaterThan(right);
      else if (SCALE_TILTS[k] < 0) expect(right).toBeGreaterThan(left);
      else expect(left).toBe(right);
      const sum = (ids: readonly number[]) => ids.reduce((t, i) => t + SCALE_WEIGHTS[i], 0);
      if (sum(s.left) > sum(s.right)) expect(left).toBeGreaterThan(right);
    });
  });

  it('is not solved while any place is empty, and the dots mean the weights', () => {
    expect(scalesSolved([-1, -1, -1, -1, -1, -1])).toBe(false);
    expect(scalesSolved([...SCALE_SHELF].map((v, i) => (i === 2 ? -1 : v)))).toBe(false);
    expect(scaleWeights(SCALE_SHELF)).toEqual([...SCALE_WEIGHTS]);
  });
});

describe('Chapter 4 level 12: open dome', () => {
  it('board 1: exactly one card fits the margin groups, and it is the stored card', () => {
    expect(domeCountCards(DOME_CLUES.rows, DOME_CLUES.cols)).toBe(1);
    expect(domeCardMatches(domeCard())).toBe(true);
    expect(domeCardMatches(domeCard().map((row, r) => row.map((v, c) => (r === 0 && c === 0 ? !v : v))))).toBe(false);
  });

  it('board 2: the lamps start lit under the holes, and exactly one lever setting lights all seven', () => {
    expect(domeStart(domeCard())).toEqual(DOME_RING.map(([r, c]) => domeCard()[r][c]));
    const winners: number[][] = [];
    for (let m = 0; m < 128; m += 1) {
      const down = [0, 1, 2, 3, 4, 5, 6].filter((i) => ((m >> i) & 1) === 1);
      if (domeAllLit(domeCard(), down)) winners.push(down);
    }
    expect(winners).toEqual([[...DOME_DOWN]]);
    expect(domeLamps(domeCard(), []).every(Boolean)).toBe(false);
  });

  it('board 3: the levers that are down place the givens; with them one placement fits, without them several do', () => {
    expect(DOME_GIVENS).toHaveLength(DOME_DOWN.length);
    expect(new Set(DOME_LEVER_CELLS.map((c) => c.join(','))).size).toBe(7);
    DOME_GIVENS.forEach(([r, c]) => expect(DOME_YARD_SOLUTION[r]).toBe(c));
    DOME_LEVER_CELLS.forEach((c, i) => { if (!DOME_DOWN.includes(i)) expect(DOME_YARD_SOLUTION[c[0]]).not.toBe(c[1]); });
    expect(domeYardSolutions(DOME_GIVENS)).toEqual([[...DOME_YARD_SOLUTION]]);
    expect(domeYardSolutions().length).toBeGreaterThan(1);
    // Other lever settings would give other givens, so the chain needs the exact lever setting.
    expect(domeGivensOf([0, 1, 2])).not.toEqual([...DOME_GIVENS]);
  });

  it('cuts the yard into six regions of 3 to 9 tiles, one solution tile each, four with rivets', () => {
    for (let g = 0; g < 6; g += 1) {
      const tiles = DOME_REGIONS.flatMap((row, r) => row.flatMap((k, c) => (k === g ? [[r, c] as const] : [])));
      expect(tiles.length).toBeGreaterThanOrEqual(3);
      expect(tiles.length).toBeLessThanOrEqual(9);
      expect(tiles.filter(([r, c]) => DOME_YARD_SOLUTION[r] === c)).toHaveLength(1);
    }
    expect(new Set(DOME_REGIONS.flatMap((row, r) => row.filter((_, c) => domeRivet(r, c)))).size).toBe(4);
    expect(domeClash([0, 0], [1, 1])).toBe(true);
  });

  it('reads the four lenses from left to right, not in keypad order, and the givens reveal at most one of them', () => {
    expect(domeLenses(DOME_YARD)).toEqual([...DOME_READING]);
    expect(new Set(DOME_READING).size).toBe(4);
    const keypad = DOME_READING.map((id) => GLYPHS.findIndex((g) => g.id === id));
    expect(keypad.every((v, i, a) => i === 0 || v > a[i - 1])).toBe(false);
    expect(domeLenses(DOME_GIVENS).length).toBeLessThanOrEqual(1);
    const answer = PUZZLES.find((p) => p.id === 'open-dome')?.answer;
    expect(answer).toEqual([...DOME_READING]);
    DOME_YARD.forEach(([r, c]) => {
      if (DOME_LENS[r][c]) {
        DOME_REGIONS[r].forEach((g, cc) => { if (g === DOME_REGIONS[r][c] && cc !== c && DOME_LENS[r][cc]) expect(DOME_LENS[r][cc]).not.toBe(DOME_LENS[r][c]); });
      }
    });
  });
});

describe('chapter 5 unlocking', () => {
  const ids4 = CHAPTERS[3].levels.map((p) => p.id);
  const ids5 = CHAPTERS[4].levels.map((p) => p.id);

  it('keeps chapter 5 shut until chapter 4 is complete', () => {
    expect(ids5[0]).toBe('train-window');
    expect(CHAPTERS[4].comingSoon).toBe(false);
    expect(CHAPTERS[4].steady).toBe(true);
    expect(chapterUnlocked(4, ids4.slice(0, -1))).toBe(false);
    expect(levelUnlocked(ids5[0], ids4.slice(0, -1))).toBe(false);
    const before = CHAPTERS.slice(0, 4).flatMap((c) => c.levels.map((p) => p.id));
    expect(levelUnlocked(ids5[0], before)).toBe(true);
  });
});

describe('train window (chapter 5, level 1)', () => {
  const lights = Array.from({ length: 101 }, (_, i) => i / 100);

  it('starts with every lamp bright: the glass is all reflection and no star shows', () => {
    const mix = glassMix(LIGHT_START);
    expect(mix.stars).toBe(0);
    expect(mix.reflect).toBe(1);
    expect(skyReadable(LIGHT_START)).toBe(false);
    expect(trainFake(LIGHT_START)).toBe(true);
  });

  it('shows the stars only once the lamps are low, and never both readings at once', () => {
    expect(skyReadable(LIGHT_HINT)).toBe(true);
    expect(trainFake(LIGHT_HINT)).toBe(false);
    expect(lights.filter((l) => skyReadable(l) && trainFake(l))).toHaveLength(0);
    // Somewhere in the middle neither reading is clean, so the player has to keep sliding.
    expect(lights.some((l) => !skyReadable(l) && !trainFake(l))).toBe(true);
    // The sky is readable on a stretch of the dimmer wide enough to hit (at least 20% of it).
    expect(lights.filter(skyReadable).length).toBeGreaterThanOrEqual(20);
    let reflect = -1;
    let stars = 2;
    for (const l of lights) {
      const m = glassMix(l);
      expect(m.reflect).toBeGreaterThanOrEqual(reflect);
      expect(m.stars).toBeLessThanOrEqual(stars);
      reflect = m.reflect;
      stars = m.stars;
    }
  });

  it('maps the dimmer both ways, with the bright end at the top', () => {
    expect(yFromLight(1)).toBeLessThan(yFromLight(0));
    for (const l of [0, 0.25, 0.5, 1]) expect(lightFromY(yFromLight(l))).toBeCloseTo(l, 6);
    expect(lightFromY(-500)).toBe(1);
    expect(lightFromY(5000)).toBe(0);
  });

  it('reads three constellations left to right, not in keypad order, one per window', () => {
    expect(TRAIN_SKY).toHaveLength(3);
    const answer = PUZZLES.find((p) => p.id === 'train-window')?.answer;
    expect(answer).toEqual(TRAIN_SKY.map((s) => s.glyph));
    expect(new Set(answer).size).toBe(3);
    const keypad = TRAIN_SKY.map((s) => GLYPHS.findIndex((g) => g.id === s.glyph));
    expect(keypad.every((v, i, a) => i === 0 || v > a[i - 1])).toBe(false);
    TRAIN_SKY.forEach((s, i) => {
      const w = TRAIN_WINDOWS[i];
      for (const [x, y] of trainSkyStars(i)) {
        expect(x).toBeGreaterThan(w.x + 20);
        expect(x).toBeLessThan(w.x + w.w - 20);
        expect(y).toBeGreaterThan(w.y + 20);
        expect(y).toBeLessThan(w.y + w.h - 150);
      }
      expect(TRAIN_WINDOWS.findIndex((o) => s.x > o.x && s.x < o.x + o.w)).toBe(i);
    });
    expect(TRAIN_SIZE).toBeGreaterThan(100);
  });

  it('keeps loose stars clear of the constellations so none is drawn by accident', () => {
    TRAIN_WINDOWS.forEach((w, i) => {
      const noise = trainNoise(i);
      expect(noise).toHaveLength(NOISE_PER_WINDOW);
      const own = trainSkyStars(i);
      noise.forEach(([x, y], a) => {
        expect(x).toBeGreaterThan(w.x);
        expect(x).toBeLessThan(w.x + w.w);
        expect(y).toBeLessThan(w.y + w.h - 100);
        for (const [sx, sy] of own) expect(Math.hypot(x - sx, y - sy)).toBeGreaterThanOrEqual(52);
        noise.forEach(([bx, by], b) => { if (a !== b) expect(Math.hypot(x - bx, y - by)).toBeGreaterThanOrEqual(46); });
      });
    });
  });

  it('puts a false constellation in the reflection that is not part of the answer and does not sit on a real one', () => {
    const answer = TRAIN_SKY.map((s) => s.glyph);
    expect(answer).not.toContain(TRAIN_FAKE.glyph);
    const w = TRAIN_WINDOWS[1];
    const fake = trainFakeStars();
    expect(fake.length).toBeGreaterThanOrEqual(5);
    for (const [x, y] of fake) {
      expect(x).toBeGreaterThan(w.x);
      expect(x).toBeLessThan(w.x + w.w);
      expect(y).toBeLessThan(w.y + w.h);
      for (const [sx, sy] of trainSkyStars(1)) expect(Math.hypot(x - sx, y - sy)).toBeGreaterThan(60);
    }
  });
});

describe('glow-worm tunnel (chapter 5, level 2)', () => {
  const around = (e: number) => Array.from({ length: 12 }, (_, i) => ({
    x: TUNNEL_CENTER.x + e * Math.cos((i * Math.PI) / 6),
    y: TUNNEL_CENTER.y + e * Math.sin((i * Math.PI) / 6),
  }));
  const groupSize = (k: number) => LARVAE.filter((w) => w.group === k).length;

  it('has delays that are never negative, so every worm can react after the sound reaches it', () => {
    expect(LARVAE.every((w) => w.delay >= 0)).toBe(true);
    expect(LARVAE.filter((w) => w.group === -1)).toHaveLength(TUNNEL_NOISE);
    expect(hootLength(TUNNEL_START)).toBeLessThan(10);
    expect(hootLength(TUNNEL_CENTER)).toBeLessThan(10);
  });

  it('lights nothing before the sound has reached anything, and a worm only while its own time is near', () => {
    expect(tunnelBright(TUNNEL_CENTER, -1).every((b) => b === 0)).toBe(true);
    expect(glowAt(1, 1)).toBe(1);
    expect(glowAt(1.5, 1)).toBe(0);
    expect(glowAt(1.07, 1)).toBeCloseTo(0.5, 6);
  });

  it('flashes each constellation whole, one after another, from the centre', () => {
    TUNNEL_SKY.forEach((_, k) => {
      for (const w of LARVAE.filter((x) => x.group === k)) expect(tunnelFlash(TUNNEL_CENTER, w)).toBeCloseTo(FLASH_TIMES[k], 6);
      const burst = tunnelBurst(TUNNEL_CENTER, k);
      expect(burst.lit).toBeGreaterThan(0.99);
      expect(burst.time).toBeCloseTo(FLASH_TIMES[k], 1);
      expect(burst.others).toBeLessThanOrEqual(1);
    });
    expect([...FLASH_TIMES].sort((a, b) => a - b)).toEqual([...FLASH_TIMES]);
    expect(FLASH_TIMES[1] - FLASH_TIMES[0]).toBeGreaterThan(2 * 0.14);
  });

  it('breaks the flash up when the owl stands away, the further the worse', () => {
    const mean = (e: number, pick: (xs: number[]) => number) =>
      pick(around(e).map((p) => TUNNEL_SKY.reduce((s, _, k) => s + tunnelBurst(p, k).lit, 0) / TUNNEL_SKY.length));
    const worstNear = mean(40, (xs) => Math.min(...xs));
    const bestFar = mean(250, (xs) => Math.max(...xs));
    const bestVeryFar = mean(400, (xs) => Math.max(...xs));
    expect(worstNear).toBeGreaterThan(0.85);
    expect(bestFar).toBeLessThan(0.75);
    expect(bestVeryFar).toBeLessThan(0.65);
  });

  it('puts a decoy constellation that flashes whole only from its own spot, and is not in the answer', () => {
    const k = DECOY_GROUP;
    expect(groupSize(k)).toBeGreaterThanOrEqual(4);
    for (const w of LARVAE.filter((x) => x.group === k)) expect(tunnelFlash(TUNNEL_DECOY_CENTER, w)).toBeCloseTo(DECOY_TIME, 6);
    expect(tunnelBurst(TUNNEL_DECOY_CENTER, k).lit).toBeGreaterThan(0.99);
    expect(tunnelBurst(TUNNEL_CENTER, k).lit).toBeLessThan(0.6);
    const answer = PUZZLES.find((p) => p.id === 'glow-tunnel')?.answer ?? [];
    expect(answer).not.toContain(TUNNEL_DECOY.glyph);
    // From the decoy's spot the real ones are not whole.
    TUNNEL_SKY.forEach((_, j) => expect(tunnelBurst(TUNNEL_DECOY_CENTER, j).lit).toBeLessThan(0.97));
  });

  it('keeps loose worms off the constellations and out of their flash at the true spots', () => {
    const loose = LARVAE.filter((w) => w.group === -1);
    for (const w of loose) {
      for (const o of LARVAE.filter((x) => x.group >= 0)) expect(Math.hypot(w.x - o.x, w.y - o.y)).toBeGreaterThanOrEqual(40);
      for (const t of FLASH_TIMES) expect(Math.abs(tunnelFlash(TUNNEL_CENTER, w) - t)).toBeGreaterThanOrEqual(0.34);
      expect(Math.abs(tunnelFlash(TUNNEL_DECOY_CENTER, w) - DECOY_TIME)).toBeGreaterThanOrEqual(0.34);
      expect(w.x).toBeGreaterThanOrEqual(TUNNEL_WALL.x1);
      expect(w.x).toBeLessThanOrEqual(TUNNEL_WALL.x2);
    }
  });

  it('reads four distinct constellations, not in keypad order, all on the wall', () => {
    const answer = PUZZLES.find((p) => p.id === 'glow-tunnel')?.answer ?? [];
    expect(answer).toEqual(TUNNEL_SKY.map((s) => s.glyph));
    expect(new Set(answer).size).toBe(4);
    const keypad = answer.map((id) => GLYPHS.findIndex((g) => g.id === id));
    expect(keypad.every((v, i, a) => i === 0 || v > a[i - 1])).toBe(false);
    expect(LARVAE.filter((w) => w.group >= 0).every((w) => w.x > 40 && w.x < 1560 && w.y > 40 && w.y < 860)).toBe(true);
  });

  it('keeps the owl on the wall', () => {
    expect(tunnelClamp({ x: -500, y: 5000 })).toEqual({ x: TUNNEL_WALL.x1 - 10, y: TUNNEL_WALL.y2 });
    expect(tunnelClamp(TUNNEL_CENTER)).toEqual(TUNNEL_CENTER);
  });
});

describe('crab field (chapter 5, level 3)', () => {
  it('has exactly one way to place the holes, and it can be reached by reasoning alone, once needing two numbers together', () => {
    expect(crabCount(2)).toBe(1);
    const { steps, solved } = crabDeduce();
    expect(solved).toBe(true);
    expect(steps.some((s) => s.by === 'pair')).toBe(true);
    expect(steps.filter((s) => s.by === 'pair').length).toBeLessThanOrEqual(4);
    // Every rice square gets decided, once.
    expect(new Set(steps.map((s) => crabIdx(s.cell[0], s.cell[1]))).size).toBe(CRAB_RICE.length);
  });

  it('makes every rice square touch a ploughed one, and leaves some safe rice so that flagging everything is wrong', () => {
    for (const [r, c] of CRAB_RICE) expect(crabNeighbours(r, c).some(([rr, cc]) => crabRevealed(rr, cc))).toBe(true);
    expect(CRAB_RICE.filter(([r, c]) => !crabMine(r, c)).length).toBeGreaterThanOrEqual(6);
    expect(CRAB_RICE.length + CRAB_REVEALED.length).toBe(CRAB_ROWS * CRAB_COLS);
  });

  it('shows the dots as the count of holes around, as dice-like patterns', () => {
    for (let n = 0; n <= 8; n += 1) {
      const dots = dotOffsets(n);
      expect(dots).toHaveLength(n);
      expect(new Set(dots.map((d) => d.join(','))).size).toBe(n);
    }
    expect(crabClue(1, 1)).toBe(crabNeighbours(1, 1).filter(([r, c]) => crabMine(r, c)).length);
  });

  it('starts untouched and not solved; flagging exactly the holes solves it; any other single change does not', () => {
    expect(crabSolved(crabEmpty())).toBe(false);
    const solution = crabSolution();
    expect(crabSolved(solution)).toBe(true);
    for (const [r, c] of CRAB_RICE) {
      const wrong = [...solution];
      wrong[crabIdx(r, c)] = solution[crabIdx(r, c)] === 1 ? 0 : 1;
      expect(crabSolved(wrong)).toBe(false);
    }
    // "No hole" rings do not count as flags.
    const rings = solution.map((m, k) => (m === 0 && !crabRevealed(Math.floor(k / CRAB_COLS), k % CRAB_COLS) ? 2 : m) as CrabMark);
    expect(crabSolved(rings)).toBe(true);
    expect(crabSolved(crabEmpty().map((_, k) => (crabRevealed(Math.floor(k / CRAB_COLS), k % CRAB_COLS) ? 0 : 1) as CrabMark))).toBe(false);
  });

  it('turns a number gold when the flags around it match its dots', () => {
    const [r, c] = [1, 1];
    const marks = crabEmpty();
    expect(crabDone(r, c, marks)).toBe(crabClue(r, c) === 0);
    const holes = crabNeighbours(r, c).filter(([rr, cc]) => crabMine(rr, cc));
    holes.forEach(([rr, cc]) => { marks[crabIdx(rr, cc)] = 1; });
    expect(crabFlags(r, c, marks)).toBe(crabClue(r, c));
    expect(crabDone(r, c, marks)).toBe(true);
    expect(crabNext(0)).toBe(1);
    expect(crabNext(1)).toBe(2);
    expect(crabNext(2)).toBe(0);
  });

  it('marks only the holes of the three constellations as the answer to highlight, not the loose ones', () => {
    const answerHoles = CRAB_MINES.filter(([r, c]) => crabAnswerHole(r, c));
    expect(answerHoles).toHaveLength(HOLE_GROUPS.reduce((n, g) => n + g.cells.length, 0));
    for (const [r, c] of LOOSE_HOLES) expect(crabAnswerHole(r, c)).toBe(false);
    for (const [r, c] of CRAB_RICE.filter(([r2, c2]) => !crabMine(r2, c2))) expect(crabAnswerHole(r, c)).toBe(false);
  });

  it('hides three constellations side by side, left to right, among three loose holes', () => {
    expect(HOLE_GROUPS).toHaveLength(3);
    expect(LOOSE_HOLES).toHaveLength(3);
    const all = [...HOLE_GROUPS.flatMap((g) => g.cells), ...LOOSE_HOLES].map(([r, c]) => crabIdx(r, c));
    expect(new Set(all).size).toBe(all.length);
    expect(all.sort((a, b) => a - b)).toEqual(CRAB_MINES.map(([r, c]) => crabIdx(r, c)).sort((a, b) => a - b));
    HOLE_GROUPS.forEach((g, i) => {
      expect(g.cells).toHaveLength(GLYPHS.find((x) => x.id === g.glyph)!.stars.length);
      for (const [, c] of g.cells) {
        expect(c).toBeGreaterThanOrEqual(i * 3);
        expect(c).toBeLessThanOrEqual(i * 3 + 2);
      }
    });
    // No two constellations' holes touch.
    HOLE_GROUPS.forEach((a, i) => HOLE_GROUPS.slice(i + 1).forEach((b) => {
      for (const [r, c] of a.cells) for (const [rr, cc] of b.cells) expect(Math.max(Math.abs(r - rr), Math.abs(c - cc))).toBeGreaterThan(1);
    }));
    const answer = PUZZLES.find((p) => p.id === 'crab-field')?.answer;
    expect(answer).toEqual(HOLE_GROUPS.map((g) => g.glyph));
    const keypad = (answer ?? []).map((id) => GLYPHS.findIndex((g) => g.id === id));
    expect(keypad.every((v, i, a) => i === 0 || v > a[i - 1])).toBe(false);
  });
});

describe('shunting yard (chapter 5, level 4)', () => {
  const replay = (from: Yard, moves: ReturnType<typeof yardSolve>): Yard => (moves ?? []).reduce((y, m) => {
    expect(yardCan(y, m[0], m[1], m[2])).toBe(true);
    return yardMove(y, m[0], m[1], m[2]);
  }, from);

  it('starts with the six wagons spread over the tracks, within the room of each, and not finished', () => {
    expect(YARD_START.flat().sort()).toEqual([0, 1, 2, 3, 4, 5]);
    YARD_START.forEach((t, i) => expect(t.length).toBeLessThanOrEqual(YARD_CAP[i]));
    expect(shuntSolved(YARD_START)).toBe(false);
    // No wanted wagon starts in its final place, and nothing shows a constellation yet.
    YARD_START[0].forEach((c, i) => expect(c).not.toBe(YARD_WANTED[i]));
    expect(shownGlyphs(YARD_START)).toEqual([]);
  });

  it('needs nine moves at the very least, found by exhaustive search, and the path really works', () => {
    const path = yardSolve(YARD_START);
    expect(path).not.toBeNull();
    expect(path!.length).toBe(9);
    expect(shuntSolved(replay(YARD_START, path))).toBe(true);
  });

  it('moves the wagons nearest the lead as a block that keeps its order, never more than the engine pulls or the room allows', () => {
    expect(YARD_BLOCK).toBe(2);
    const y: Yard = [[1], [0, 4], [2]];
    expect(yardMove(y, 1, 2, 2)).toEqual([[1], [], [0, 4, 2]]);
    expect(yardCan([[0, 1, 2], [], []], 0, 3, 1)).toBe(false);
    expect(yardCan([[], [0, 1, 2], [3]], 1, 1, 2)).toBe(true);
    expect(yardCan([[], [], [0, 1, 2]], 2, 2, 1)).toBe(true);
    expect(yardCan([[0, 1, 2, 3], [4, 5], []], 1, 2, 0)).toBe(false);
    expect(yardCan([[], [], []], 0, 1, 1)).toBe(false);
    expect(yardCan(YARD_START, 0, 1, 0)).toBe(false);
  });

  it('can always be undone: every move has a move back', () => {
    for (const m of yardMoves(YARD_START)) {
      const after = yardMove(YARD_START, m[0], m[1], m[2]);
      expect(yardMoves(after).some((b) => b[0] === m[2] && b[1] === m[1] && b[2] === m[0] && sameYard(yardMove(after, b[0], b[1], b[2]), YARD_START))).toBe(true);
    }
  });

  it('is finished only with exactly the four wanted wagons on the platform in order', () => {
    expect(shuntSolved([[0, 1, 2, 3], [4], [5]])).toBe(true);
    expect(shuntSolved([[0, 1, 2, 3], [], [4, 5]])).toBe(true);
    expect(shuntSolved([[1, 0, 2, 3], [4], [5]])).toBe(false);
    expect(shuntSolved([[0, 1, 2], [3, 4], [5]])).toBe(false);
    expect(shuntSolved([[4, 0, 1, 2], [3], [5]])).toBe(false);
    expect(shuntSolved(copyYard(YARD_START))).toBe(false);
  });

  it('shows the four constellations in platform order only when finished, none on the two wagons in the way', () => {
    expect(shownGlyphs([[0, 1, 2, 3], [4], [5]])).toEqual(YARD_WANTED.map((c) => CAR_GLYPHS[c]));
    expect(CAR_GLYPHS[4]).toBeNull();
    expect(CAR_GLYPHS[5]).toBeNull();
    const answer = PUZZLES.find((p) => p.id === 'shunting-yard')?.answer ?? [];
    expect(answer).toEqual(YARD_WANTED.map((c) => CAR_GLYPHS[c]));
    expect(new Set(answer).size).toBe(4);
    const keypad = answer.map((id) => GLYPHS.findIndex((g) => g.id === id));
    expect(keypad.every((v, i, a) => i === 0 || v > a[i - 1])).toBe(false);
  });
});

describe('reversed binoculars (chapter 5, level 5)', () => {
  const stars = VILLAGES.filter((v) => v.chom >= 0);
  const loose = VILLAGES.filter((v) => v.chom < 0);

  it('makes the villages of the four constellations, plus loose ones, with no two too close', () => {
    expect(stars).toHaveLength(BINO_CHOMS.reduce((n, _, k) => n + binoStars(k).length, 0));
    expect(loose).toHaveLength(BINO_LOOSE);
    for (const l of loose) {
      for (const v of VILLAGES) if (v !== l) expect(Math.hypot(l.x - v.x, l.y - v.y)).toBeGreaterThanOrEqual(v.chom >= 0 ? 520 : 440);
      expect(nearestOnRail(l.x, l.y).distance).toBeGreaterThanOrEqual(130);
      expect(Math.hypot(l.x, l.y)).toBeLessThan(WORLD_R);
    }
    for (const s of stars) expect(nearestOnRail(s.x, s.y).distance).toBeGreaterThanOrEqual(120);
  });

  it('gives the villages of one constellation one look (houses, dot size) that no other constellation has, all in the same lamp colour', () => {
    BINO_CHOMS.forEach((_, k) => {
      const own = stars.filter((v) => v.chom === k);
      expect(new Set(own.map((v) => v.sig)).size).toBe(1);
      expect(own[0].sig).toBe(CHOM_SIGNATURE[k]);
    });
    expect(new Set(CHOM_SIGNATURE).size).toBe(BINO_CHOMS.length);
    // One colour for every lamp: the looks differ in the number of houses and in the dot, which differs by at least a pixel and a bit even zoomed right out.
    const sigs = SIGNATURES.slice();
    expect(new Set(sigs.map((g) => g.houses)).size).toBe(4);
    expect(new Set(sigs.map((g) => g.colour)).size).toBe(1);
    const dots = sigs.map((g) => g.dot).sort((a, b) => a - b);
    dots.forEach((d, i) => { if (i) expect((d - dots[i - 1]) * SCALE_MIN).toBeGreaterThan(1.2); });
    // Loose villages borrow the same four looks, so a look alone does not give a constellation away.
    SIGNATURES.forEach((_, i) => expect(loose.filter((v) => v.sig === i).length).toBeGreaterThanOrEqual(2));
    // The looks do not just count up along the rail, which would give the order away.
    const housesAlongRail = railOrder().map((k) => SIGNATURES[CHOM_SIGNATURE[k]].houses);
    expect(housesAlongRail.every((h, i, a) => i === 0 || h > a[i - 1])).toBe(false);
    expect(housesAlongRail.every((h, i, a) => i === 0 || h < a[i - 1])).toBe(false);
  });

  it('shows only a little of one constellation the right way round, wherever the binoculars look', () => {
    expect(SCALE_FWD).toBeGreaterThan(1);
    let worst = 0;
    for (let x = -WORLD_R; x <= WORLD_R; x += 60) {
      for (let y = -WORLD_R; y <= WORLD_R; y += 60) {
        const inside = villagesInLens({ x, y }, SCALE_FWD);
        BINO_CHOMS.forEach((_, k) => { worst = Math.max(worst, inside.filter((i) => VILLAGES[i].chom === k).length / binoStars(k).length); });
      }
    }
    expect(worst).toBeLessThanOrEqual(0.4);
    // Every constellation is wider than the lens at that scale.
    BINO_CHOMS.forEach((_, k) => {
      const xs = binoStars(k).map((s) => s[0]);
      expect((Math.max(...xs) - Math.min(...xs)) * SCALE_FWD).toBeGreaterThan(BINO_LENS.r * 2);
    });
    // And what the player first sees holds no more than one star of any constellation.
    const first = villagesInLens(BINO_START, SCALE_FWD);
    BINO_CHOMS.forEach((_, k) => expect(first.filter((i) => VILLAGES[i].chom === k).length).toBeLessThanOrEqual(1));
  });

  it('shows the whole valley, so every constellation whole, when turned round', () => {
    expect(SCALE_MIN).toBeLessThan(0.2);
    expect(villagesInLens({ x: 0, y: 0 }, SCALE_MIN)).toHaveLength(VILLAGES.length);
    // Two villages are still apart enough to be two dots.
    let nearest = Infinity;
    for (const a of VILLAGES) for (const b of VILLAGES) if (a !== b) nearest = Math.min(nearest, Math.hypot(a.x - b.x, a.y - b.y));
    expect(nearest * SCALE_MIN).toBeGreaterThan(30);
  });

  it('reads the constellations in the order the rail reaches them from the engine, not by their places on the page', () => {
    expect(railOrder()).toEqual([0, 1, 2, 3]);
    const answer = PUZZLES.find((p) => p.id === 'reverse-binoculars')?.answer ?? [];
    expect(answer).toEqual(BINO_CHOMS.map((c) => c.glyph));
    expect(new Set(answer).size).toBe(4);
    const keypad = answer.map((id) => GLYPHS.findIndex((g) => g.id === id));
    expect(keypad.every((v, i, a) => i === 0 || v > a[i - 1])).toBe(false);
    // Reading the page top to bottom, left to right would give a different order.
    const byPlace = BINO_CHOMS.map((c, k) => ({ k, c })).sort((a, b) => (Math.sign(a.c.y) - Math.sign(b.c.y)) || a.c.x - b.c.x).map(({ k }) => k);
    expect(byPlace).not.toEqual(railOrder());
    // Each one has the rail close by and its own part of the rail.
    const at = BINO_CHOMS.map((c) => nearestOnRail(c.x, c.y));
    at.forEach((a, i) => { expect(a.distance).toBeLessThan(300); if (i) expect(a.index).toBeGreaterThan(at[i - 1].index); });
  });

  it('zooms continuously from magnified to the whole valley, and a constellation appears bit by bit as the lens steps back', () => {
    expect(scaleAt(1)).toBeCloseTo(SCALE_FWD, 9);
    expect(scaleAt(0)).toBeCloseTo(SCALE_MIN, 9);
    for (const u of [0, 0.3, 0.5, 1]) expect(zoomOf(scaleAt(u))).toBeCloseTo(u, 9);
    expect(barrelFlip(1)).toBe(1);
    expect(barrelFlip(0)).toBe(-1);
    expect(barrelFlip(0.5)).toBe(0);
    for (const u of [0, 0.25, 0.5, 1]) expect(zoomAtY(yOfZoom(u))).toBeCloseTo(u, 9);
    expect(yOfZoom(1)).toBeLessThan(yOfZoom(0));
    // With the whole valley showing there is nowhere to move; magnified there is.
    const still = binoClamp({ x: 700, y: -300 }, SCALE_MIN);
    expect(Math.abs(still.x) + Math.abs(still.y)).toBe(0);
    expect(Math.hypot(...Object.values(binoClamp({ x: 700, y: -300 }, SCALE_FWD)))).toBeCloseTo(Math.hypot(700, 300), 6);
    // The most of any one constellation a lens can show, wherever it looks, only grows as it zooms out.
    const bestFraction = (u: number): number => {
      let best = 0;
      for (let x = -WORLD_R; x <= WORLD_R; x += 100) {
        for (let y = -WORLD_R; y <= WORLD_R; y += 100) {
          const inside = villagesInLens(binoClamp({ x, y }, scaleAt(u)), scaleAt(u));
          BINO_CHOMS.forEach((_, k) => { best = Math.max(best, inside.filter((i) => VILLAGES[i].chom === k).length / binoStars(k).length); });
        }
      }
      return best;
    };
    const steps = [1, 0.75, 0.5, 0.25, 0].map(bestFraction);
    steps.forEach((f, i) => { if (i) expect(f).toBeGreaterThanOrEqual(steps[i - 1]); });
    expect(steps[0]).toBeLessThanOrEqual(0.4);
    expect(steps[1]).toBeLessThan(1);
    expect(steps[4]).toBe(1);
    // And how many constellations a lens can hold whole at once: none magnified, one at half zoom, all four with the whole valley showing.
    const wholeAtOnce = (u: number): number => {
      let best = 0;
      for (let x = -WORLD_R; x <= WORLD_R; x += 100) {
        for (let y = -WORLD_R; y <= WORLD_R; y += 100) {
          const inside = villagesInLens(binoClamp({ x, y }, scaleAt(u)), scaleAt(u));
          best = Math.max(best, BINO_CHOMS.filter((_, k) => inside.filter((i) => VILLAGES[i].chom === k).length === binoStars(k).length).length);
        }
      }
      return best;
    };
    expect(wholeAtOnce(1)).toBe(0);
    expect(wholeAtOnce(0.5)).toBeLessThanOrEqual(1);
    expect(wholeAtOnce(0.25)).toBeLessThan(4);
    expect(wholeAtOnce(0)).toBe(4);
  });

  it('keeps the view in the valley and zooms smoothly between the two views', () => {
    const far = binoClamp({ x: 99999, y: 0 });
    expect(Math.hypot(far.x, far.y)).toBeLessThan(WORLD_R);
    expect(binoClamp({ x: 10, y: 20 })).toEqual({ x: 10, y: 20 });
    const a = { ...BINO_START, scale: SCALE_FWD };
    const b = { x: 0, y: 0, scale: SCALE_MIN };
    expect(viewBetween(a, b, 0)).toEqual(a);
    expect(viewBetween(a, b, 1).scale).toBeCloseTo(SCALE_MIN, 6);
    const mid = viewBetween(a, b, 0.5).scale;
    expect(mid).toBeLessThan(SCALE_FWD);
    expect(mid).toBeGreaterThan(SCALE_MIN);
  });
});

describe('self-turning points (chapter 5, level 6)', () => {
  it('sends each train to the depot that wants its goods: every depot gets exactly one train', () => {
    expect([...DEPOT_WANTS].sort()).toEqual([...TRAIN_CARGO].sort());
    expect(new Set(FLIP_TARGET).size).toBe(4);
    FLIP_TARGET.forEach((d, i) => expect(DEPOT_WANTS[d]).toBe(TRAIN_CARGO[i]));
  });

  it('has exactly one setting of the six levers that delivers all four trains, and none if the points did not turn', () => {
    const good = ALL_SETTINGS.filter((s) => flipSolved(s));
    expect(good).toEqual([[...FLIP_SOLUTION]]);
    const withoutTurning = ALL_SETTINGS.filter((s) => delivered(s, false).every(Boolean));
    expect(withoutTurning).toHaveLength(0);
    expect(flipSolved(START_SETTING)).toBe(false);
  });

  it('needs every lever: moving any one of them from the answer loses a train', () => {
    FLIP_SOLUTION.forEach((_, k) => {
      const wrong = [...FLIP_SOLUTION];
      wrong[k] ^= 1;
      expect(flipSolved(wrong)).toBe(false);
    });
  });

  it('has near misses: many settings deliver two or three trains', () => {
    const near = ALL_SETTINGS.filter((s) => { const n = delivered(s).filter(Boolean).length; return n >= 2 && n < 4; });
    expect(near.length).toBeGreaterThanOrEqual(10);
  });

  it('turns every point after each train, so a point used by two trains sends them opposite ways', () => {
    const { routes, final } = runTrains(FLIP_SOLUTION);
    // The first point is passed by all four trains: they take its two ways in turn.
    expect(routes.map((r) => r.outs[0])).toEqual([0, 1, 0, 1]);
    // A point passed an even number of times ends where it began.
    const passes = FLIP_SOLUTION.map((_, k) => routes.reduce((n, r) => n + r.switches.filter((x) => x === k).length, 0));
    final.forEach((f, k) => expect(f).toBe(FLIP_SOLUTION[k] ^ (passes[k] % 2)));
    routes.forEach((r) => r.switches.forEach((k, j) => expect(FLIP_NET[k][r.outs[j]]).toBeDefined()));
  });

  it('draws each train from its place in the queue to the front of its depot, and the levers turn as the trains pass', () => {
    const { routes, final } = runTrains(FLIP_SOLUTION);
    routes.forEach((route, i) => {
      const path = trainPath(i, route);
      expect(pointAt(path, 0)).toEqual(queueSlot(i));
      expect(pointAt(path, 1)).toEqual(DEPOT_FRONT[route.depot]);
      path.at.forEach((f, j) => { expect(f).toBeGreaterThan(0); expect(f).toBeLessThan(1); if (j) expect(f).toBeGreaterThan(path.at[j - 1]); });
    });
    expect(leversAt(FLIP_SOLUTION, -1)).toEqual([...FLIP_SOLUTION]);
    expect(leversAt(FLIP_SOLUTION, TOTAL_SECONDS)).toEqual(final);
  });

  it('reads the constellations in the order the trains ran, not in keypad order', () => {
    const answer = PUZZLES.find((p) => p.id === 'flip-switches')?.answer ?? [];
    expect(answer).toEqual([...FLIP_READING]);
    expect(FLIP_READING).toEqual(FLIP_TARGET.map((d) => DEPOT_GLYPHS[d]));
    expect(new Set(answer).size).toBe(4);
    const keypad = answer.map((id) => GLYPHS.findIndex((g) => g.id === id));
    expect(keypad.every((v, i, a) => i === 0 || v > a[i - 1])).toBe(false);
    expect(FLIP_READING).not.toEqual([...DEPOT_GLYPHS]);
  });
});
