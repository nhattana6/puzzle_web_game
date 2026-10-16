import { bellBox } from './bellBox';
import { brokenSky } from './brokenSky';
import { circuitPanel } from './circuitPanel';
import { windUpOwl } from './windUpOwl';
import { telescopeYard } from './telescopeYard';
import { starScales } from './starScales';
import { copperWires } from './copperWires';
import { cradleMobile } from './cradleMobile';
import { drawerCabinet } from './drawerCabinet';
import { leverBoard } from './domeLevers';
import { lensDepot } from './lensDepot';
import { duskSky } from './duskSky';
import { featherWing } from './featherWing';
import { frostWindow } from './frostWindow';
import { foldedMap } from './foldedMap';
import { gearBox } from './gearBox';
import { glassChimes } from './glassChimes';
import { glowStars } from './glowStars';
import { glassPlates } from './glassPlates';
import { lakeMirror } from './lakeMirror';
import { lampCourt } from './lampCourt';
import { lanternStalls } from './lanternStalls';
import { lighthouses } from './lighthouses';
import { longExposure } from './longExposure';
import { marbleTray } from './marbleTray';
import { nightClouds } from './nightClouds';
import { nightProcession } from './nightProcession';
import { oilJars } from './oilJars';
import { oldKeeperLock } from './oldKeeperLock';
import { owletNest } from './owletNest';
import { owlDesk } from './owlDesk';
import { pinholeLantern } from './pinholeLantern';
import { procession } from './procession';
import { punchCards } from './punchCards';
import { redFilter } from './redFilter';
import { riverLanterns } from './riverLanterns';
import { sandFootprints } from './sandFootprints';
import { sandPlate } from './sandPlate';
import { spinLantern } from './spinLantern';
import { starBoard } from './starBoard';
import { starClock } from './starClock';
import { starFocus } from './starFocus';
import { stoneRubbing } from './stoneRubbing';
import { threePaintings } from './threePaintings';
import { toheCipher } from './toheCipher';
import { vantagePoint } from './vantagePoint';
import { waterGlass } from './waterGlass';
import type { PuzzleDef } from './types';

/** Chapter 1, in play order, easiest first. */
export const CHAPTER_1: readonly PuzzleDef[] = [
  nightClouds, lakeMirror, redFilter, pinholeLantern, foldedMap, glassPlates, brokenSky,
  duskSky, starFocus, glowStars, waterGlass, vantagePoint,
];

/** Chapter 2, in play order. New levels are added here. */
export const CHAPTER_2: readonly PuzzleDef[] = [
  featherWing, frostWindow, marbleTray, bellBox, owletNest, spinLantern, lighthouses, gearBox, cradleMobile, owlDesk,
  lampCourt, circuitPanel,
];

/** Chapter 3, in play order. New levels are added here (twelve are planned, see docs/CHAPTER3_DESIGN.md). */
export const CHAPTER_3: readonly PuzzleDef[] = [stoneRubbing, sandFootprints, glassChimes, lanternStalls, riverLanterns, sandPlate, starClock, threePaintings, toheCipher, longExposure, procession, nightProcession];

/** Chapter 4, in play order. New levels are added here (twelve are planned, see docs/CHAPTER4_DESIGN.md). */
export const CHAPTER_4: readonly PuzzleDef[] = [punchCards, drawerCabinet, oilJars, leverBoard, lensDepot, starBoard, oldKeeperLock, copperWires, windUpOwl, telescopeYard, starScales];

/** Every level in play order. */
export const PUZZLES: readonly PuzzleDef[] = [...CHAPTER_1, ...CHAPTER_2, ...CHAPTER_3, ...CHAPTER_4];

export const puzzleById = (id: string): PuzzleDef | undefined => PUZZLES.find((p) => p.id === id);
