import { candleCourtyard } from './candleCourtyard';
import { mirrorHall } from './mirrorHall';
import { printShop } from './printShop';
import { puppetPond } from './puppetPond';
import { riceTerraces } from './riceTerraces';
import { starLantern } from './starLantern';
import { teaTray } from './teaTray';
import { tileFloor } from './tileFloor';
import { toyAttic } from './toyAttic';
import type { PuzzleDef } from './types';

/** A group of levels built on one kind of mechanic, easiest first. */
export interface Chapter {
  id: string;
  name: string;
  blurb: string;
  puzzles: PuzzleDef[];
}

/** New chapters and levels are added here. */
export const CHAPTERS: readonly Chapter[] = [
  {
    id: 'light',
    name: 'Ánh sáng & Bóng',
    blurb: 'Đèn, gương, nến và bóng nước.',
    puzzles: [starLantern, mirrorHall, candleCourtyard, puppetPond],
  },
  {
    id: 'assembly',
    name: 'Ghép đồ vật',
    blurb: 'Đồ dùng quen thuộc ghép lại thành con vật.',
    puzzles: [teaTray, toyAttic],
  },
  {
    id: 'turn',
    name: 'Xoay, chồng & nối',
    blurb: 'Ống tre, phim in và gạch bông.',
    puzzles: [riceTerraces, printShop, tileFloor],
  },
];

/** Play order: chapter by chapter. */
export const PUZZLES: readonly PuzzleDef[] = CHAPTERS.flatMap((c) => c.puzzles);

export const puzzleById = (id: string): PuzzleDef | undefined => PUZZLES.find((p) => p.id === id);

export const chapterOf = (def: PuzzleDef): Chapter | undefined => CHAPTERS.find((c) => c.puzzles.includes(def));
