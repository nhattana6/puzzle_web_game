import { brokenSky } from './brokenSky';
import { foldedMap } from './foldedMap';
import { glassPlates } from './glassPlates';
import { lakeMirror } from './lakeMirror';
import { nightClouds } from './nightClouds';
import { pinholeLantern } from './pinholeLantern';
import { redFilter } from './redFilter';
import type { PuzzleDef } from './types';

/** Play order, easiest first. New levels are added here. */
export const PUZZLES: readonly PuzzleDef[] = [
  nightClouds, lakeMirror, redFilter, pinholeLantern, foldedMap, glassPlates, brokenSky,
];

export const puzzleById = (id: string): PuzzleDef | undefined => PUZZLES.find((p) => p.id === id);
