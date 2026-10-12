import { el } from '../core/svg';
import type { HintStep, HintTarget } from '../puzzles/types';
import { VERB_PATHS } from './icons';

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
 * A frozen picture of the scene for the hint card, with the action demonstrated by a
 * short looping animation: a dragged thing slides along its arrow under a finger, a tap
 * presses with a ripple, a thing to read pulses. The copy of the scene is inert and its
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
  const overlay = svg.querySelector('.layer-overlay') ?? svg;
  overlay.replaceChildren();
  step.prepare?.(svg);
  const still = reduceMotion();
  for (const t of step.targets) {
    if (t.to) arrow(overlay, t);
    // r = 0 is an arrow alone, with no circled object: a dot slides along it.
    if (t.r <= 0) {
      if (t.to && !still) {
        const dot = el('circle', { cx: t.x, cy: t.y, r: 14, class: 'finger-dot' }, overlay);
        smil(dot, 'animate', { attributeName: 'cx', values: `${t.x};${t.x};${t.to.x};${t.to.x}`, keyTimes: '0;0.15;0.75;1' });
        smil(dot, 'animate', { attributeName: 'cy', values: `${t.y};${t.y};${t.to.y};${t.to.y}`, keyTimes: '0;0.15;0.75;1' });
      }
      continue;
    }
    // The ring and its badge are one group so they travel together.
    const mover = el('g', {}, overlay);
    el('circle', { cx: t.x, cy: t.y, r: t.r, class: 'hint-ring' }, mover);
    const badge = el('g', { class: 'hint-verb', transform: `translate(${t.x - t.r * 0.75} ${t.y - t.r * 0.85})` }, mover);
    el('circle', { r: 26 }, badge);
    el('path', { d: VERB_PATHS[t.verb] }, badge);
    if (still) continue;
    if (t.to) {
      const dx = t.to.x - t.x;
      const dy = t.to.y - t.y;
      // Press, then drag to the destination, hold, and start over.
      smil(mover, 'animateTransform', { attributeName: 'transform', type: 'translate', values: `0 0;0 0;${dx} ${dy};${dx} ${dy}`, keyTimes: '0;0.2;0.75;1', calcMode: 'spline', keySplines: '0 0 1 1;0.4 0 0.2 1;0 0 1 1' });
      const f = finger(overlay, t.x, t.y);
      smil(f, 'animate', { attributeName: 'opacity', values: '0;1;1;1;0', keyTimes: '0;0.08;0.75;0.92;1' });
      smil(f, 'animateTransform', { attributeName: 'transform', type: 'translate', values: `${t.x} ${t.y};${t.x} ${t.y};${t.to.x} ${t.to.y};${t.to.x} ${t.to.y}`, keyTimes: '0;0.2;0.75;1', calcMode: 'spline', keySplines: '0 0 1 1;0.4 0 0.2 1;0 0 1 1' });
    } else if (t.verb === 'tap' || t.verb === 'rotate') {
      const f = finger(overlay, t.x, t.y);
      smil(f.querySelector('.finger-dot') as Element, 'animate', { attributeName: 'r', values: '17;17;11;17;17', keyTimes: '0;0.3;0.42;0.6;1' });
      const ripple = el('circle', { cx: t.x, cy: t.y, r: 10, class: 'finger-ripple' }, overlay);
      smil(ripple, 'animate', { attributeName: 'r', values: '10;10;70;70', keyTimes: '0;0.4;0.85;1' });
      smil(ripple, 'animate', { attributeName: 'opacity', values: '0;0.9;0;0', keyTimes: '0;0.4;0.85;1' });
    } else {
      // Something to look at: the ring breathes.
      const ring = mover.querySelector('.hint-ring') as Element;
      smil(ring, 'animate', { attributeName: 'r', values: `${t.r};${t.r * 1.1};${t.r}`, dur: '1.8s' });
    }
  }
  return svg;
}

/** An arrow from the edge of the target's ring to its destination. */
function arrow(parent: Element, t: HintTarget): void {
  if (!t.to) return;
  const dx = t.to.x - t.x;
  const dy = t.to.y - t.y;
  const len = Math.hypot(dx, dy);
  // Short moves start the arrow at the object's centre rather than its ring.
  const gap = len > t.r + 50 ? t.r + 6 : 0;
  if (len - gap < 16) return;
  const ux = dx / len;
  const uy = dy / len;
  const sx = t.x + ux * gap;
  const sy = t.y + uy * gap;
  const head = Math.min(34, (len - gap) * 0.6);
  const bx = t.to.x - ux * head;
  const by = t.to.y - uy * head;
  el('line', { x1: sx.toFixed(1), y1: sy.toFixed(1), x2: bx.toFixed(1), y2: by.toFixed(1), class: 'hint-arrow' }, parent);
  const px = -uy * head * 0.6;
  const py = ux * head * 0.6;
  el('path', {
    d: `M${t.to.x.toFixed(1)} ${t.to.y.toFixed(1)} L${(bx + px).toFixed(1)} ${(by + py).toFixed(1)} L${(bx - px).toFixed(1)} ${(by - py).toFixed(1)} Z`,
    class: 'hint-arrow-head',
  }, parent);
}
