import { el } from '../core/svg';
import type { HintTarget } from '../puzzles/types';
import { VERB_PATHS } from './icons';

/**
 * A still picture of the scene for the hint card: a copy of the scene as it is now,
 * with the level's hint marks (ghost frames, ticks, joining lines…) made visible and
 * each target circled, badged with its action, and arrowed to where it should go.
 * The copy is inert: no fireflies, no focusable parts, no parallax.
 */
export function hintPicture(scene: SVGSVGElement, targets: readonly HintTarget[]): SVGSVGElement {
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
  for (const t of targets) {
    if (t.to) arrow(overlay, t);
    // r = 0 is an arrow alone, with no circled object.
    if (t.r <= 0) continue;
    el('circle', { cx: t.x, cy: t.y, r: t.r, class: 'hint-ring' }, overlay);
    const badge = el('g', { class: 'hint-verb', transform: `translate(${t.x - t.r * 0.75} ${t.y - t.r * 0.85})` }, overlay);
    el('circle', { r: 26 }, badge);
    el('path', { d: VERB_PATHS[t.verb] }, badge);
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
