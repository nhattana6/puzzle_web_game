import { bellBox } from './bellBox';
import { brokenSky } from './brokenSky';
import { circuitPanel } from './circuitPanel';
import { cradleMobile } from './cradleMobile';
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
import { marbleTray } from './marbleTray';
import { nightClouds } from './nightClouds';
import { owletNest } from './owletNest';
import { owlDesk } from './owlDesk';
import { pinholeLantern } from './pinholeLantern';
import { redFilter } from './redFilter';
import { riverLanterns } from './riverLanterns';
import { sandFootprints } from './sandFootprints';
import { sandPlate } from './sandPlate';
import { spinLantern } from './spinLantern';
import { starFocus } from './starFocus';
import { stoneRubbing } from './stoneRubbing';
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
export const CHAPTER_3: readonly PuzzleDef[] = [stoneRubbing, sandFootprints, glassChimes, lanternStalls, riverLanterns, sandPlate];

/** Every level in play order. */
export const PUZZLES: readonly PuzzleDef[] = [...CHAPTER_1, ...CHAPTER_2, ...CHAPTER_3];

export const puzzleById = (id: string): PuzzleDef | undefined => PUZZLES.find((p) => p.id === id);
