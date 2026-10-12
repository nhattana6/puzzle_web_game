import { CHAPTER_1, CHAPTER_2 } from '../puzzles';
import type { PuzzleDef } from '../puzzles/types';

export interface Chapter {
  title: string;
  /** Short line under the title. */
  blurb: string;
  /** The levels in play order; empty while the chapter is still to come. */
  levels: readonly PuzzleDef[];
  comingSoon: boolean;
}

/** Chapters in order. A chapter with `comingSoon` shows a placeholder instead of its map. */
export const CHAPTERS: readonly Chapter[] = [
  { title: 'Chương 1', blurb: 'Những chòm sao lạc', levels: CHAPTER_1, comingSoon: false },
  { title: 'Chương 2', blurb: 'Căn gác của cú', levels: CHAPTER_2, comingSoon: false },
];
