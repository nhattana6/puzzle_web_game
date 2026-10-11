import type { Scene, LayerName } from '../core/scene';
import type { Sound } from '../core/sound';
import type { ZodiacId } from '../core/zodiac';

/** The interaction a hint points at. */
export type Verb = 'rotate' | 'drag' | 'tap';

export interface HintTarget {
  x: number;
  y: number;
  r: number;
  verb: Verb;
}

export interface FireflySpot {
  id: string;
  layer: LayerName;
  x: number;
  y: number;
}

/** One line of a level's how-to card, with the icon of the action it describes. */
export interface GuideStep {
  /** 'marks' = the diamond order marks of code levels, 'done' = what finishing looks like. */
  icon: Verb | 'marks' | 'done';
  text: string;
}

/** Shown when a level is first opened, and again from the "?" button. */
export interface Guide {
  /** What the player is trying to do, in one sentence. */
  goal: string;
  steps: GuideStep[];
  tip?: string;
}

export interface PuzzleContext {
  scene: Scene;
  sound: Sound;
  /** Levels without an answer call this once the arrangement is complete. */
  solved(): void;
}

export interface MountedPuzzle {
  /**
   * Hints are bought one at a time, and each one helps with a single unfinished
   * part (one ring, one pair of pieces, one cut-out...), never the whole solution.
   * Called with how many hints should be showing; must be safe to call again with
   * the same number. Returns how many are showing, which is less than asked when
   * nothing is left to point out.
   */
  revealHints(count: number): number;
  /** Where the parts that bought hints point at are, for highlight rings and action badges. */
  hintTargets(): HintTarget[];
  destroy(): void;
}

export interface PuzzleDef {
  id: string;
  /** Short Vietnamese name, shown on the level card and in the how-to card. */
  name: string;
  /**
   * Code levels: the ordered signs to pick on the answer ring, read from the
   * diamond marks. Levels without an answer finish by themselves when solved.
   */
  answer?: ZodiacId[];
  guide: Guide;
  fireflies: FireflySpot[];
  mount(ctx: PuzzleContext): MountedPuzzle;
}
