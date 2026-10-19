import { el } from '../core/svg';

/** Hat colours of the four children that appear in the procession levels. */
export const KID_HATS = ['#c0392b', '#2d6a8f', '#d3a64f', '#4a9a5a'] as const;

/**
 * A child's head with one of four hats, centred on (0, 0), about `r * 2` wide. The hat's colour and
 * shape together say who it is: a pointed cap, a round cap, a flat brim, a feathered cap.
 */
export function drawKidIcon(parent: Element, index: number, r = 24): SVGGElement {
  const g = el('g', {}, parent);
  const hat = KID_HATS[index % KID_HATS.length];
  el('circle', { cx: 0, cy: r * 0.15, r, fill: '#e8c9a0', stroke: '#8a6a3c', 'stroke-width': Math.max(2, r / 10) }, g);
  el('circle', { cx: -r * 0.36, cy: r * 0.2, r: r * 0.1, fill: '#2a1d14' }, g);
  el('circle', { cx: r * 0.36, cy: r * 0.2, r: r * 0.1, fill: '#2a1d14' }, g);
  el('path', { d: `M${-r * 0.3} ${r * 0.6} Q0 ${r * 0.85} ${r * 0.3} ${r * 0.6}`, fill: 'none', stroke: '#8a4a3a', 'stroke-width': Math.max(2, r / 10), 'stroke-linecap': 'round' }, g);
  const stroke = { stroke: '#2a1d14', 'stroke-width': Math.max(2, r / 10), 'stroke-linejoin': 'round' } as const;
  if (index % 4 === 0) {
    el('path', { d: `M${-r * 0.95} ${-r * 0.35} L0 ${-r * 1.9} L${r * 0.95} ${-r * 0.35} Z`, fill: hat, ...stroke }, g);
  } else if (index % 4 === 1) {
    el('path', { d: `M${-r * 0.95} ${-r * 0.3} Q0 ${-r * 1.8} ${r * 0.95} ${-r * 0.3} Z`, fill: hat, ...stroke }, g);
  } else if (index % 4 === 2) {
    el('rect', { x: -r * 1.2, y: -r * 0.65, width: r * 2.4, height: r * 0.3, rx: r * 0.1, fill: hat, ...stroke }, g);
    el('rect', { x: -r * 0.7, y: -r * 1.3, width: r * 1.4, height: r * 0.7, rx: r * 0.1, fill: hat, ...stroke }, g);
  } else {
    el('path', { d: `M${-r * 0.95} ${-r * 0.3} Q0 ${-r * 1.5} ${r * 0.95} ${-r * 0.3} Z`, fill: hat, ...stroke }, g);
    el('path', { d: `M${r * 0.3} ${-r * 1.0} q${r * 0.5} ${-r * 0.9} ${r * 0.9} ${-r * 0.4}`, fill: 'none', stroke: '#f6efd8', 'stroke-width': Math.max(3, r / 7), 'stroke-linecap': 'round' }, g);
  }
  return g;
}
