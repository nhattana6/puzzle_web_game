import { url } from '../core/defs';
import { drawGlyph, type GlyphId, type GlyphStyle } from '../core/glyphs';
import { el, uid } from '../core/svg';

/** Small deterministic random generator, so scenes look the same on every visit. */
export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A night-sky gradient filling the rectangle. */
export function skyGradient(defs: SVGDefsElement, top = '#0d1430', bottom = '#2a2350'): string {
  const id = uid('sky');
  const g = el('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el('stop', { offset: 0, 'stop-color': top }, g);
  el('stop', { offset: 1, 'stop-color': bottom }, g);
  return url(id);
}

/** Faint background stars that twinkle; purely decorative. */
export function starfield(
  parent: Element,
  area: { x: number; y: number; w: number; h: number },
  count: number,
  seed: number,
  colour = '#f6efd8',
): SVGGElement {
  const rand = seeded(seed);
  const g = el('g', { class: 'starfield', 'pointer-events': 'none' }, parent);
  for (let i = 0; i < count; i += 1) {
    el('circle', {
      cx: (area.x + rand() * area.w).toFixed(1),
      cy: (area.y + rand() * area.h).toFixed(1),
      r: (0.8 + rand() * 1.8).toFixed(2),
      fill: colour,
      opacity: (0.25 + rand() * 0.5).toFixed(2),
      class: i % 5 === 0 ? 'twinkle' : undefined,
      style: i % 5 === 0 ? `animation-delay: ${(-rand() * 4).toFixed(2)}s` : undefined,
    }, g);
  }
  return g;
}

/** A constellation centred on (x, y), `size` scene units across. */
export function glyphAt(parent: Element, id: GlyphId, x: number, y: number, size: number, style: GlyphStyle = {}): SVGGElement {
  const s = size / 100;
  const g = el('g', { transform: `translate(${x - 50 * s} ${y - 50 * s}) scale(${s})` }, parent);
  drawGlyph(g, id, style);
  return g;
}

export const dist = (ax: number, ay: number, bx: number, by: number): number => Math.hypot(ax - bx, ay - by);
