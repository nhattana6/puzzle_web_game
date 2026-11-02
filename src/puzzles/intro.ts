/**
 * The first-run demonstrations (levels 1 and 3): a finger works the level's one new move in a loop, goes to the keypad key of
 * the constellation it uncovered and taps it (the constellation shows in the first answer slot: reading order starts there),
 * then everything goes back. A level only says where things are at each moment (`frame`); this runs the loop, keeps the finger
 * over the page, and steps aside, putting the level back, as soon as the player touches anything or presses a key.
 */
import type { GlyphId } from '../core/glyphs';
import type { IntroHost } from './types';

export const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
/** How far along [a, b] the time t is: 0 before it, 1 after it. */
export const within = (t: number, [a, b]: readonly [number, number]) => Math.min(1, Math.max(0, (t - a) / (b - a)));
export const inside = (t: number, [a, b]: readonly [number, number]) => t >= a && t < b;

/** One moment of a demonstration. */
export interface IntroFrame {
  /** Where the finger is on the scene (scene units) while it works there. */
  at: { x: number; y: number };
  /** 0: on the scene thing; 1: on the keypad key (the finger glides between them). */
  along: number;
  opacity: number;
  pressed: boolean;
  /** The constellation shown in the first answer slot, if any. */
  slot: GlyphId | null;
  /** The demonstration has moved something from where the level put it. */
  moved: boolean;
}

export interface IntroSpec {
  /** Seconds of one round, how many rounds, and the pause (ms) before the first. */
  rest: number;
  rounds: number;
  startDelayMs: number;
  /** The keypad key the finger goes to. */
  key: GlyphId;
  /** Puts the level in its state `t` seconds into a round and says where the finger is. */
  frame(t: number): IntroFrame;
  /** Puts everything back as the level started. */
  reset(): void;
  /** Whether `target` is what the demonstration moved: a player who grabs it keeps it where the demonstration left it. */
  isMoved(target: Element): boolean;
}

/** What the loop needs from the page; replaced by a manual one in tests. */
export interface IntroEnv {
  doc: Pick<Document, 'addEventListener' | 'removeEventListener'>;
  raf(cb: (now: number) => void): number;
  caf(id: number): void;
  now(): number;
  setTimeout(cb: () => void, ms: number): number;
  clearTimeout(id: number): void;
}
const pageEnv = (): IntroEnv => ({
  doc: document,
  raf: (cb) => requestAnimationFrame(cb),
  caf: (id) => cancelAnimationFrame(id),
  now: () => performance.now(),
  setTimeout: (cb, ms) => window.setTimeout(cb, ms),
  clearTimeout: (id) => window.clearTimeout(id),
});

/**
 * Starts a demonstration; returns a function that tears it down without telling anyone (the player left). When the player takes
 * over (any pointerdown or keydown), the level is put back, the finger goes, and `host.onFinish` is called once.
 */
export function runIntro(host: IntroHost, spec: IntroSpec, env: IntroEnv = pageEnv()): () => void {
  let frame = 0;
  let begin = 0;
  let moved = false;
  let done = false;
  let starter = 0;
  /** `taken`: the player touched something (the only reason to call `onFinish`); otherwise the demonstration just ends or is torn down. */
  const stop = (event?: Event, taken = event !== undefined) => {
    if (done) return;
    done = true;
    env.caf(frame);
    env.clearTimeout(starter);
    env.doc.removeEventListener('pointerdown', stop, true);
    env.doc.removeEventListener('keydown', stop, true);
    host.finger.remove();
    host.showInSlot(null);
    const grabbed = typeof Element !== 'undefined' && event?.target instanceof Element && spec.isMoved(event.target);
    if (moved && !grabbed) spec.reset();
    if (taken) host.onFinish();
  };
  const tick = (now: number) => {
    if (done) return;
    const elapsed = (now - begin) / 1000;
    if (elapsed >= spec.rest * spec.rounds) return stop(undefined, false);
    const f = spec.frame(elapsed % spec.rest);
    moved = f.moved;
    // One finger over the whole page: from the thing it works on (where the scene is on screen now) to the keypad key.
    const from = host.scenePoint(f.at.x, f.at.y);
    const to = host.keyPoint(spec.key) ?? from;
    host.finger.place(from.x + (to.x - from.x) * f.along, from.y + (to.y - from.y) * f.along, f.opacity, f.pressed);
    host.showInSlot(f.slot);
    frame = env.raf(tick);
  };
  // Anything the player touches (the scene, the keypad, a button) or presses is theirs: the demonstration steps aside.
  env.doc.addEventListener('pointerdown', stop, true);
  env.doc.addEventListener('keydown', stop, true);
  // A moment to take in the scene first.
  starter = env.setTimeout(() => {
    begin = env.now();
    frame = env.raf(tick);
  }, spec.startDelayMs);
  return () => stop(undefined, false);
}
