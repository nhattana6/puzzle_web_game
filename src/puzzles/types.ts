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
  icon: Verb | 'marks';
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
  /** Where the interactive parts are, for the level 1–2 hints. */
  hintTargets(): HintTarget[];
  /** Level 3 hint: faintly shows the solved arrangement. */
  showGhost(): void;
  destroy(): void;
}

export interface PuzzleDef {
  id: string;
  chapter: number;
  /** Short Vietnamese name, used for accessibility labels only (the game itself is wordless). */
  name: string;
  /** Ordered zodiac signs to pick on the lantern ring. */
  answer: ZodiacId[];
  guide: Guide;
  fireflies: FireflySpot[];
  mount(ctx: PuzzleContext): MountedPuzzle;
}
