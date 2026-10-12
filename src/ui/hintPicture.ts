import { el } from '../core/svg';
import type { HintStep } from '../puzzles/types';

/** Length of one loop of a demonstration, in milliseconds. */
export const HINT_LOOP_MS = 2600;

type Track = (phase: number) => void;
/** The per-frame updaters of each picture, run by `animateHintPicture`. */
const tracks = new WeakMap<SVGSVGElement, Track[]>();

/** Linear interpolation through (times[i], values[i]) at phase p in 0..1. */
function piece(p: number, times: readonly number[], values: readonly number[]): number {
  if (p <= times[0]) return values[0];
  for (let i = 1; i < times.length; i += 1) {
    if (p <= times[i]) {
      const k = (p - times[i - 1]) / (times[i] - times[i - 1] || 1);
      return values[i - 1] + (values[i] - values[i - 1]) * k;
    }
  }
  return values[values.length - 1];
}
const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
/** How far along a drag is: rest, then slide (eased), then hold at the end. */
const slide = (p: number) => (p < 0.2 ? 0 : p > 0.75 ? 1 : ease((p - 0.2) / 0.55));

/**
 * Moves one loop of the picture's demonstration to `phase` (0..1). Driven by script on
 * every frame, so it plays the same in every browser.
 */
export function animateHintPicture(svg: SVGSVGElement, phase: number): void {
  for (const track of tracks.get(svg) ?? []) track(phase);
}

/** The finger: a soft white touch dot with a ring, drawn at (0, 0). */
function finger(parent: Element, x: number, y: number): SVGGElement {
  const g = el('g', { class: 'hint-finger', transform: `translate(${x} ${y})` }, parent);
  el('circle', { r: 30, class: 'finger-halo' }, g);
  el('circle', { r: 17, class: 'finger-dot' }, g);
  return g;
}

/**
 * A frozen picture of the scene for the hint card, with the action acted out by the
 * object itself in a short loop (see animateHintPicture): a dragged thing slides to where it goes under a finger,
 * a tap presses with a ripple and turns or flips the object, a thing to read glows.
 * No arrows or rings are drawn. The copy of the scene is inert and its
 * own animations (twinkling, flames…) are stopped by CSS, so only the demonstration moves.
 */
export function hintPicture(scene: SVGSVGElement, step: HintStep): SVGSVGElement {
  const svg = scene.cloneNode(true) as SVGSVGElement;
  svg.classList.add('hint-picture');
  svg.setAttribute('aria-hidden', 'true');
  svg.removeAttribute('role');
  svg.removeAttribute('aria-label');
  svg.querySelectorAll('.firefly').forEach((node) => node.remove());
  svg.querySelectorAll('[tabindex]').forEach((node) => {
    node.removeAttribute('tabindex');
    node.removeAttribute('role');
  });
  svg.querySelectorAll('.layer').forEach((node) => node.removeAttribute('transform'));
  uniqueIds(svg);
  const overlay = svg.querySelector('.layer-overlay') ?? svg;
  overlay.replaceChildren();
  step.prepare?.(svg);
  const list: Track[] = [];
  tracks.set(svg, list);
  /** Adds an extra transform after the object's own one, recomputed every frame. */
  const moveObject = (node: Element, extra: (p: number) => string) => {
    const base = node.getAttribute('transform') ?? '';
    list.push((p) => node.setAttribute('transform', `${base} ${extra(p)}`));
  };
  // No arrows or rings: the object itself acts the step out, with a finger on it.
  for (const t of step.targets) {
    const object = t.object ? svg.querySelector(t.object) : null;
    if (t.verb === 'look') {
      // Something to read: a soft golden glow breathes over it.
      const glow = el('circle', { cx: t.x, cy: t.y, r: t.r, class: 'hint-glow' }, overlay);
      list.push((p) => glow.setAttribute('opacity', (0.15 + 0.4 * Math.sin(p * Math.PI)).toFixed(3)));
      // A level may also replay what there is to read (lights flashing), over the whole loop.
      const replay = t.act?.(svg);
      if (replay) list.push((p) => replay(p));
      continue;
    }
    if (t.to) {
      const { x, y } = t;
      const dx = t.to.x - x;
      const dy = t.to.y - y;
      if (object) moveObject(object, (p) => `translate(${(dx * slide(p)).toFixed(1)} ${(dy * slide(p)).toFixed(1)})`);
      if (t.r <= 0 && object) continue; // a pointer sliding on a scale needs no finger
      const f = finger(overlay, x, y);
      list.push((p) => {
        f.setAttribute('transform', `translate(${(x + dx * slide(p)).toFixed(1)} ${(y + dy * slide(p)).toFixed(1)})`);
        f.setAttribute('opacity', piece(p, [0, 0.08, 0.75, 0.92, 1], [0, 1, 1, 0, 0]).toFixed(2));
      });
      continue;
    }
    // A tap: the finger presses with a ripple, and the object turns or flips if it does.
    const f = finger(overlay, t.x, t.y);
    const dot = f.querySelector('.finger-dot') as SVGCircleElement;
    const ripple = el('circle', { cx: t.x, cy: t.y, r: 10, class: 'finger-ripple' }, overlay);
    list.push((p) => {
      dot.setAttribute('r', piece(p, [0, 0.2, 0.3, 0.45, 1], [17, 17, 11, 17, 17]).toFixed(1));
      ripple.setAttribute('r', piece(p, [0, 0.25, 0.6, 1], [10, 10, 70, 70]).toFixed(1));
      ripple.setAttribute('opacity', piece(p, [0, 0.25, 0.6, 1], [0, 0.9, 0, 0]).toFixed(2));
    });
    const turnBy = t.turn;
    if (object && turnBy) moveObject(object, (p) => `rotate(${(turnBy * (p < 0.3 ? 0 : p > 0.75 ? 1 : ease((p - 0.3) / 0.45))).toFixed(1)})`);
    const act = t.act?.(svg);
    if (act) list.push((p) => act(p < 0.3 ? 0 : p > 0.75 ? 1 : ease((p - 0.3) / 0.45)));
    if (object && t.flip) moveObject(object, (p) => `scale(${piece(p, [0, 0.3, 0.5, 0.7, 1], [1, 1, 0.05, 1, 1]).toFixed(3)} 1)`);
  }
  animateHintPicture(svg, 0);
  return svg;
}

let renamed = 0;
/**
 * Gives every id in the copy a fresh name and points its references (clip paths, filters,
 * gradients, <use>) at the new names, so each picture keeps its own clip and gradient state
 * instead of reading another picture's or the live scene's.
 */
function uniqueIds(svg: SVGSVGElement): void {
  renamed += 1;
  const names = new Map<string, string>();
  svg.querySelectorAll('[id]').forEach((node) => {
    const name = `${node.id}-h${renamed}`;
    names.set(node.id, name);
    node.id = name;
  });
  if (!names.size) return;
  const fix = (value: string) => value.replace(/#([\w-]+)/g, (match, id: string) => (names.has(id) ? `#${names.get(id)}` : match));
  svg.querySelectorAll('*').forEach((node) => {
    for (const attr of ['clip-path', 'filter', 'fill', 'stroke', 'mask', 'href', 'xlink:href', 'style']) {
      const value = node.getAttribute(attr);
      if (value && value.includes('#')) node.setAttribute(attr, fix(value));
    }
  });
}
