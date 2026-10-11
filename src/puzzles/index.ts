import { candleCourtyard } from './candleCourtyard';
import { printShop } from './printShop';
import { puppetPond } from './puppetPond';
import { starLantern } from './starLantern';
import { teaTray } from './teaTray';
import { tileFloor } from './tileFloor';
import { toyAttic } from './toyAttic';
import type { PuzzleDef } from './types';

/** Play order, easiest first. New puzzles are added here. */
export const PUZZLES: readonly PuzzleDef[] = [starLantern, teaTray, candleCourtyard, puppetPond, toyAttic, printShop, tileFloor];

export const puzzleById = (id: string): PuzzleDef | undefined => PUZZLES.find((p) => p.id === id);
