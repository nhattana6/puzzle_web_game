import { CHAPTER_1, CHAPTER_2, CHAPTER_3, CHAPTER_4, CHAPTER_5 } from '../puzzles';
import type { PuzzleDef } from '../puzzles/types';
import { tr } from '../core/i18n';

export interface Chapter {
  title: string;
  /** Short line under the title. */
  blurb: string;
  /** The levels in play order; empty while the chapter is still to come. */
  levels: readonly PuzzleDef[];
  comingSoon: boolean;
  /** Levels of this chapter do not drift with the pointer (the picture holds still). */
  steady?: boolean;
}

/** Chapters in order. A chapter with `comingSoon` shows a placeholder instead of its map. */
export const CHAPTERS: readonly Chapter[] = [
  { get title() { return tr('Chương 1', 'Chapter 1'); }, get blurb() { return tr('Những chòm sao lạc', 'The Lost Constellations'); }, levels: CHAPTER_1, comingSoon: false },
  { get title() { return tr('Chương 2', 'Chapter 2'); }, get blurb() { return tr('Căn gác của cú', "The Owl's Attic"); }, levels: CHAPTER_2, comingSoon: false },
  { get title() { return tr('Chương 3', 'Chapter 3'); }, get blurb() { return tr('Phố đêm rằm', 'Full Moon Street'); }, levels: CHAPTER_3, comingSoon: false },
  { get title() { return tr('Chương 4', 'Chapter 4'); }, get blurb() { return tr('Đài thiên văn bỏ hoang', 'The Abandoned Observatory'); }, levels: CHAPTER_4, comingSoon: false, steady: true },
  { get title() { return tr('Chương 5', 'Chapter 5'); }, get blurb() { return tr('Chuyến tàu đêm', 'The Night Train'); }, levels: CHAPTER_5, comingSoon: false, steady: true },
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

/** Index of the chapter a level belongs to, or 0 when the id is unknown. */
export const chapterOfLevel = (id: string): number => Math.max(0, CHAPTERS.findIndex((c) => c.levels.some((p) => p.id === id)));
