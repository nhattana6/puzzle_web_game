import { el } from '../core/svg';
import type { HintStep } from '../puzzles/types';

const DUR = 2.6;
const reduceMotion = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** A SMIL animation element inside `parent`. */
const smil = (parent: Element, tag: 'animate' | 'animateTransform', attrs: Record<string, string | number>): void => {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries({ dur: `${DUR}s`, repeatCount: 'indefinite', ...attrs })) node.setAttribute(k, String(v));
  parent.appendChild(node);
};

/** The finger: a soft white touch dot with a ring, drawn at (0, 0). */
function finger(parent: Element, x: number, y: number): SVGGElement {
  const g = el('g', { class: 'hint-finger', transform: `translate(${x} ${y})` }, parent);
  el('circle', { r: 30, class: 'finger-halo' }, g);
  el('circle', { r: 17, class: 'finger-dot' }, g);
  return g;
}

/**
 * A frozen picture of the scene for the hint card, with the action acted out by the
 * object itself in a short loop: a dragged thing slides to where it goes under a finger,
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
  const still = reduceMotion();
  // No arrows or rings: the object itself acts the step out, with a finger on it.
  for (const t of step.targets) {
    const object = t.object ? svg.querySelector(t.object) : null;
    if (t.verb === 'look') {
      // Something to read: a soft golden glow breathes over it.
      const glow = el('circle', { cx: t.x, cy: t.y, r: t.r, class: 'hint-glow' }, overlay);
      if (!still) smil(glow, 'animate', { attributeName: 'opacity', values: '0.15;0.55;0.15', dur: '2s' });
      continue;
    }
    if (t.to) {
      const dx = t.to.x - t.x;
      const dy = t.to.y - t.y;
      if (still) {
        // Without motion, show the object where it ends up.
        if (object) object.setAttribute('transform', `${object.getAttribute('transform') ?? ''} translate(${dx} ${dy})`);
        continue;
      }
      // Press, slide the object to where it goes, hold, and start over.
      const timing = { keyTimes: '0;0.2;0.75;1', calcMode: 'spline', keySplines: '0 0 1 1;0.4 0 0.2 1;0 0 1 1' };
      if (object) smil(object, 'animateTransform', { attributeName: 'transform', type: 'translate', additive: 'sum', values: `0 0;0 0;${dx} ${dy};${dx} ${dy}`, ...timing });
      if (t.r <= 0 && object) continue; // a pointer sliding on a scale needs no finger
      const f = finger(overlay, t.x, t.y);
      smil(f, 'animate', { attributeName: 'opacity', values: '0;1;1;1;0', keyTimes: '0;0.08;0.75;0.92;1' });
      smil(f, 'animateTransform', { attributeName: 'transform', type: 'translate', values: `${t.x} ${t.y};${t.x} ${t.y};${t.to.x} ${t.to.y};${t.to.x} ${t.to.y}`, ...timing });
      continue;
    }
    if (still) continue;
    // A tap: the finger presses with a ripple, and the object turns or flips if it does.
    const f = finger(overlay, t.x, t.y);
    smil(f.querySelector('.finger-dot') as Element, 'animate', { attributeName: 'r', values: '17;17;11;17;17', keyTimes: '0;0.2;0.3;0.45;1' });
    const ripple = el('circle', { cx: t.x, cy: t.y, r: 10, class: 'finger-ripple' }, overlay);
    smil(ripple, 'animate', { attributeName: 'r', values: '10;10;70;70', keyTimes: '0;0.25;0.6;1' });
    smil(ripple, 'animate', { attributeName: 'opacity', values: '0;0.9;0;0', keyTimes: '0;0.25;0.6;1' });
    if (object && t.turn) smil(object, 'animateTransform', { attributeName: 'transform', type: 'rotate', additive: 'sum', values: `0;0;${t.turn};${t.turn}`, keyTimes: '0;0.3;0.75;1', calcMode: 'spline', keySplines: '0 0 1 1;0.4 0 0.2 1;0 0 1 1' });
    if (object && t.flip) smil(object, 'animateTransform', { attributeName: 'transform', type: 'scale', additive: 'sum', values: '1 1;1 1;0.05 1;1 1;1 1', keyTimes: '0;0.3;0.5;0.7;1' });
  }
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
