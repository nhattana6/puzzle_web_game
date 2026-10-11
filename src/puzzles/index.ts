import { candleCourtyard } from './candleCourtyard';
import { puppetPond } from './puppetPond';
import { starLantern } from './starLantern';
import type { PuzzleDef } from './types';

/** Play order. New puzzles are added here. */
export const PUZZLES: readonly PuzzleDef[] = [starLantern, candleCourtyard, puppetPond];

export const puzzleById = (id: string): PuzzleDef | undefined => PUZZLES.find((p) => p.id === id);
