import { brokenSky } from './brokenSky';
import { duskSky } from './duskSky';
import { foldedMap } from './foldedMap';
import { glowStars } from './glowStars';
import { glassPlates } from './glassPlates';
import { lakeMirror } from './lakeMirror';
import { nightClouds } from './nightClouds';
import { pinholeLantern } from './pinholeLantern';
import { redFilter } from './redFilter';
import { starFocus } from './starFocus';
import { vantagePoint } from './vantagePoint';
import { waterGlass } from './waterGlass';
import type { PuzzleDef } from './types';

/** Play order, easiest first. New levels are added here. */
export const PUZZLES: readonly PuzzleDef[] = [
  nightClouds, lakeMirror, redFilter, pinholeLantern, foldedMap, glassPlates, brokenSky,
  duskSky, starFocus, glowStars, waterGlass, vantagePoint,
];

export const puzzleById = (id: string): PuzzleDef | undefined => PUZZLES.find((p) => p.id === id);
