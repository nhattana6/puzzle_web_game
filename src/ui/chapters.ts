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

/** Whether the player has solved every level of chapter `ci`. */
export const chapterComplete = (ci: number, solved: readonly string[]): boolean =>
  CHAPTERS[ci].levels.length > 0 && CHAPTERS[ci].levels.every((p) => solved.includes(p.id));

/** A chapter opens once the one before it is complete; the first is always open. */
export const chapterUnlocked = (ci: number, solved: readonly string[]): boolean =>
  ci <= 0 || (chapterComplete(ci - 1, solved) && chapterUnlocked(ci - 1, solved));

/**
 * A level is playable when the level before it in its chapter is solved (the first level
 * of a chapter needs the chapter itself open). A level already solved always stays open.
 */
export function levelUnlocked(id: string, solved: readonly string[]): boolean {
  if (solved.includes(id)) return true;
  const ci = CHAPTERS.findIndex((c) => c.levels.some((p) => p.id === id));
  if (ci < 0) return false;
  const i = CHAPTERS[ci].levels.findIndex((p) => p.id === id);
  if (!chapterUnlocked(ci, solved)) return false;
  return i === 0 || solved.includes(CHAPTERS[ci].levels[i - 1].id);
}
