import { el } from './svg';

/** The star keeper: a small round owl, drawn around (0, 0), about 100 units tall at scale 1. */
export function drawOwl(parent: Element, x: number, y: number, scale = 1, blink = true): SVGGElement {
  const g = el('g', { class: 'owl', transform: `translate(${x} ${y}) scale(${scale})`, 'pointer-events': 'none' }, parent);
  el('path', { d: 'M-34 -30 L-26 -54 L-14 -38 Z M34 -30 L26 -54 L14 -38 Z', fill: '#5a4a6e' }, g);
  el('ellipse', { cx: 0, cy: 6, rx: 40, ry: 48, fill: '#6b5a82' }, g);
  el('ellipse', { cx: 0, cy: 18, rx: 26, ry: 32, fill: '#e8dcc0' }, g);
  for (let i = 0; i < 3; i += 1) {
    el('path', { d: `M${-12 + i * 12} ${10 + (i % 2) * 8} q4 5 8 0`, fill: 'none', stroke: '#b8a98a', 'stroke-width': 2 }, g);
  }
  el('path', { d: 'M-40 0 Q-52 30 -30 48 Q-36 24 -36 4 Z M40 0 Q52 30 30 48 Q36 24 36 4 Z', fill: '#4e3f60' }, g);
  for (const sx of [-1, 1]) {
    el('circle', { cx: sx * 15, cy: -16, r: 15, fill: '#f6efd8' }, g);
    el('circle', { cx: sx * 15, cy: -16, r: 9, fill: '#f4c66a' }, g);
    el('circle', { cx: sx * 15, cy: -16, r: 5, fill: '#1a1424', class: blink ? 'owl-eye' : undefined }, g);
  }
  el('path', { d: 'M-5 -6 L5 -6 L0 4 Z', fill: '#e0a948' }, g);
  el('path', { d: 'M-16 52 l-4 6 M-10 53 l0 7 M10 53 l0 7 M16 52 l4 6', stroke: '#e0a948', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
  return g;
}
