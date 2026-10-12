import { bellBox } from './bellBox';
import { brokenSky } from './brokenSky';
import { duskSky } from './duskSky';
import { featherWing } from './featherWing';
import { frostWindow } from './frostWindow';
import { foldedMap } from './foldedMap';
import { glowStars } from './glowStars';
import { glassPlates } from './glassPlates';
import { lakeMirror } from './lakeMirror';
import { marbleTray } from './marbleTray';
import { nightClouds } from './nightClouds';
import { owletNest } from './owletNest';
import { pinholeLantern } from './pinholeLantern';
import { redFilter } from './redFilter';
import { spinLantern } from './spinLantern';
import { starFocus } from './starFocus';
import { vantagePoint } from './vantagePoint';
import { waterGlass } from './waterGlass';
import type { PuzzleDef } from './types';

/** Chapter 1, in play order, easiest first. */
export const CHAPTER_1: readonly PuzzleDef[] = [
  nightClouds, lakeMirror, redFilter, pinholeLantern, foldedMap, glassPlates, brokenSky,
  duskSky, starFocus, glowStars, waterGlass, vantagePoint,
];

/** Chapter 2, in play order. New levels are added here. */
export const CHAPTER_2: readonly PuzzleDef[] = [featherWing, frostWindow, marbleTray, bellBox, owletNest, spinLantern];

/** Every level in play order. */
export const PUZZLES: readonly PuzzleDef[] = [...CHAPTER_1, ...CHAPTER_2];

export const puzzleById = (id: string): PuzzleDef | undefined => PUZZLES.find((p) => p.id === id);
