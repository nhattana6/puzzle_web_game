import { PUZZLES } from '../puzzles';
import type { PuzzleDef } from '../puzzles/types';

export interface Chapter {
  title: string;
  /** Short line under the title. */
  blurb: string;
  /** The levels in play order; empty while the chapter is still to come. */
  levels: readonly PuzzleDef[];
  comingSoon: boolean;
}

/** Chapters in order. Chapter 2 has no levels yet and shows "coming soon". */
export const CHAPTERS: readonly Chapter[] = [
  { title: 'Chương 1', blurb: 'Những chòm sao lạc', levels: PUZZLES, comingSoon: false },
  { title: 'Chương 2', blurb: 'Sắp ra mắt', levels: [], comingSoon: true },
];
