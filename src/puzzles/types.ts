import type { GlyphId } from '../core/glyphs';
import type { Scene } from '../core/scene';
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
  /** CSS selector of the scene object this step acts on; the hint picture animates that object itself. */
  object?: string;
  /** For 'rotate': how far the object turns, in degrees, about its own origin. */
  turn?: number;
  /** For 'tap': the object flips edge-on and back, like a lantern turning to its next face. */
  flip?: boolean;
  /**
   * A level's own demonstration for things a move or turn can't show (a map folding): given
   * the picture's copy of the scene, returns an updater taking the action's progress 0..1. On a
   * 'look' target it replays what is to be read (lights flashing) over the whole loop instead.
   */
  act?: (picture: SVGSVGElement) => (progress: number) => void;
}

/**
 * One step of a hint: a picture of the scene with these targets marked, and a sentence
 * saying what to do. A part that takes several actions to finish gives several steps,
 * shown side by side in order.
 */
export interface HintStep {
  note: string;
  targets: HintTarget[];
  /** Changes the picture's copy of the scene first. */
  prepare?: (picture: SVGSVGElement) => void;
  /**
   * Carries the step out on the puzzle (instantly, without sound or tweening), so the
   * next step's picture shows the scene as it is after this one.
   */
  apply?: () => void;
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
   * The full solution as steps, worked out from the puzzle as it is now. The hint card
   * calls this on a fresh, hidden copy of the level, so it always walks through the whole
   * level from the start, applying each step before picturing the next.
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
  mount(ctx: PuzzleContext): MountedPuzzle;
}
