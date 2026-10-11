import type { GlyphId } from '../core/glyphs';
import type { LayerName, Scene } from '../core/scene';
import type { Sound } from '../core/sound';

/** The interaction a hint or a how-to line points at. */
export type Verb = 'rotate' | 'drag' | 'tap' | 'look';

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

export interface GuideStep {
  /** 'moon' = reading order by moon phase, 'keypad' = entering the answer. */
  icon: Verb | 'moon' | 'keypad';
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
}

export interface MountedPuzzle {
  /**
   * Hints are bought one at a time; each helps with a single part (one cloud, one
   * fold, one face of the lantern...), never the whole solution. Called with how
   * many hints should be showing; safe to call again with the same number. Returns
   * how many are showing, less than asked when nothing is left to point out.
   */
  revealHints(count: number): number;
  /** Where the parts the bought hints point at are, for highlight rings and action badges. */
  hintTargets(): HintTarget[];
  destroy(): void;
}

export interface PuzzleDef {
  id: string;
  /** Short Vietnamese name, shown on the level map and the how-to card. */
  name: string;
  /** The constellations the scene reveals, in reading order, to enter on the keypad. */
  answer: GlyphId[];
  guide: Guide;
  fireflies: FireflySpot[];
  mount(ctx: PuzzleContext): MountedPuzzle;
}
