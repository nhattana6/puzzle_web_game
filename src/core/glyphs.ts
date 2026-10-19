import { el } from './svg';
import { tr } from './i18n';

/**
 * The nine constellations on the keypad. Each is a few stars in a 100×100 box
 * joined by lines. Puzzles hide them in their scenes; the answer to a level is
 * the constellations it reveals, in order.
 */
export type GlyphId =
  | 'triangle' | 'square' | 'crown' | 'cross' | 'belt'
  | 'dipper' | 'diamond' | 'arrow' | 'hook';

export interface Glyph {
  id: GlyphId;
  /** Vietnamese name, for labels and screen readers. */
  name: string;
  stars: readonly (readonly [number, number])[];
  lines: readonly (readonly [number, number])[];
  /** Keypad note, rising across the grid on a pentatonic scale. */
  frequency: number;
}

const chain = (n: number): [number, number][] => Array.from({ length: n - 1 }, (_, i) => [i, i + 1]);
const loop = (n: number): [number, number][] => [...chain(n), [n - 1, 0]];

/** Keypad order: three rows of three. */
export const GLYPHS: readonly Glyph[] = [
  { id: 'triangle', get name() { return tr('Tam giác', 'Triangle'); }, stars: [[50, 10], [12, 86], [88, 86]], lines: loop(3), frequency: 261.63 },
  { id: 'square', get name() { return tr('Hình vuông', 'Square'); }, stars: [[18, 18], [82, 18], [82, 82], [18, 82]], lines: loop(4), frequency: 293.66 },
  { id: 'crown', get name() { return tr('Vương miện', 'Crown'); }, stars: [[6, 28], [28, 80], [50, 42], [72, 80], [94, 28]], lines: chain(5), frequency: 329.63 },
  { id: 'cross', get name() { return tr('Thập tự', 'Cross'); }, stars: [[50, 6], [50, 48], [50, 94], [12, 42], [88, 42]], lines: [[0, 1], [1, 2], [3, 1], [1, 4]], frequency: 392.0 },
  { id: 'belt', get name() { return tr('Thắt lưng', 'Belt'); }, stars: [[10, 74], [50, 50], [90, 26]], lines: chain(3), frequency: 440.0 },
  { id: 'dipper', get name() { return tr('Cái gáo', 'Dipper'); }, stars: [[6, 26], [28, 20], [48, 32], [60, 54], [92, 54], [94, 86], [62, 86]], lines: [...chain(7), [6, 3]], frequency: 523.25 },
  { id: 'diamond', get name() { return tr('Kim cương', 'Diamond'); }, stars: [[50, 6], [90, 50], [50, 94], [10, 50]], lines: loop(4), frequency: 587.33 },
  { id: 'arrow', get name() { return tr('Mũi tên', 'Arrow'); }, stars: [[8, 50], [92, 50], [66, 24], [66, 76]], lines: [[0, 1], [1, 2], [1, 3]], frequency: 659.25 },
  { id: 'hook', get name() { return tr('Lưỡi câu', 'Hook'); }, stars: [[12, 8], [30, 30], [44, 54], [52, 78], [72, 92], [90, 76]], lines: chain(6), frequency: 783.99 },
];

const BY_ID = new Map(GLYPHS.map((g) => [g.id, g]));

export function glyph(id: GlyphId): Glyph {
  const found = BY_ID.get(id);
  if (!found) throw new Error(`Unknown glyph id: ${id}`);
  return found;
}

export const isGlyphId = (value: unknown): value is GlyphId =>
  typeof value === 'string' && BY_ID.has(value as GlyphId);

export interface GlyphStyle {
  /** Star radius in box units. */
  star?: number;
  /** Line width in box units; 0 draws stars only. */
  line?: number;
  colour?: string;
  lineColour?: string;
  lineOpacity?: number;
}

/** Draws a constellation in its 100×100 box; the caller positions and scales the group. */
export function drawGlyph(parent: Element, id: GlyphId, style: GlyphStyle = {}): SVGGElement {
  const { star = 6, line = 3, colour = 'currentColor', lineColour = colour, lineOpacity = 0.7 } = style;
  const g = glyph(id);
  const group = el('g', { 'data-glyph': id }, parent);
  if (line > 0) {
    for (const [a, b] of g.lines) {
      el('line', {
        x1: g.stars[a][0], y1: g.stars[a][1], x2: g.stars[b][0], y2: g.stars[b][1],
        stroke: lineColour, 'stroke-width': line, 'stroke-linecap': 'round', opacity: lineOpacity,
      }, group);
    }
  }
  for (const [x, y] of g.stars) el('circle', { cx: x, cy: y, r: star, fill: colour }, group);
  return group;
}

/** Star positions of a constellation placed at (x, y) (box centre) with the given size. */
export function placeStars(id: GlyphId, x: number, y: number, size: number): [number, number][] {
  const s = size / 100;
  return glyph(id).stars.map(([sx, sy]) => [x + (sx - 50) * s, y + (sy - 50) * s]);
}
