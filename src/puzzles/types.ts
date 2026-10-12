import type { GlyphId } from '../core/glyphs';
import type { LayerName, Scene } from '../core/scene';
import type { Sound } from '../core/sound';

/** The interaction a hint or a how-to line points at. */
export type Verb = 'rotate' | 'drag' | 'tap' | 'look';

/** One thing a bought hint points at, drawn on the hint card's picture of the scene. */
export interface HintTarget {
  x: number;
  y: number;
  r: number;
  verb: Verb;
  /** For a drag or slide: where it goes, drawn as an arrow. */
  to?: { x: number; y: number };
}

/**
 * One step of a hint: a picture of the scene with these targets marked, and a sentence
 * saying what to do. A part that takes several actions to finish gives several steps,
 * shown side by side in order.
 */
export interface HintStep {
  note: string;
  targets: HintTarget[];
  /** Changes the picture's copy of the scene first, e.g. to show the board as it will be at this step. */
  prepare?: (picture: SVGSVGElement) => void;
}

export interface FireflySpot {
  id: string;
  layer: LayerName;
  x: number;
  y: number;
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
  /**
   * The steps that finish the part the latest bought hint points at (the newest one
   * still unfinished), worked out from the scene as it is now; empty when there is nothing left to show.
   */
  hintSteps(): HintStep[];
  destroy(): void;
}

export interface PuzzleDef {
  id: string;
  /** Short Vietnamese name, shown on the level map and the how-to card. */
  name: string;
  /** The constellations the scene reveals, in reading order, to enter on the keypad. */
  answer: GlyphId[];
  fireflies: FireflySpot[];
  mount(ctx: PuzzleContext): MountedPuzzle;
}
