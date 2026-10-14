import { drawOwl } from '../core/owl';
import type { GlyphId } from '../core/glyphs';
import { glyph, placeStars } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el } from '../core/svg';
import { dist, seeded } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 3, level 8 — the three paintings ("ba bức tranh"). Three paintings of the same
 * street corner hang side by side. One has been touched up in the sky, one in the windows of
 * the houses, and the third is the untouched original. Drag one painting over another: it
 * hides, and the painting it lies on dims and shows, in one blue only, whatever does not line
 * up. The pair (stars, original) gives the stars that were added: four constellations (plus two
 * stray stars). The pair (windows, original) gives the order: each house has some number of
 * windows flipped, and that number says when to read the constellation above it. The pair
 * (stars, windows) shows both at once, which is the harder way round.
 */

export const PAINT = { w: 460, h: 560 };
export const SLOTS: readonly { x: number; y: number }[] = [
  { x: 70, y: 150 }, { x: 570, y: 150 }, { x: 1070, y: 150 },
];
/** Which painting is which, by slot. */
export const STARS = 0;
export const NUMBERS = 1;
export const BASE = 2;
export const CHOM_SIZE = 90;
export const HOUSE_W = 113;
export const HOUSE_COUNT = 4;
export const WINDOWS_PER_HOUSE = 6;
export const WINDOW_COUNT = HOUSE_COUNT * WINDOWS_PER_HOUSE;
/** Constellations added to the star painting, one over each house, left to right. */
export const CHOMS: readonly { glyph: GlyphId; x: number; y: number }[] = [
  { glyph: 'cross', x: 61, y: 215 },
  { glyph: 'square', x: 174, y: 95 },
  { glyph: 'hook', x: 287, y: 225 },
  { glyph: 'crown', x: 400, y: 105 },
];
/** The number of flipped windows in each house of the "numbers" painting: the reading order. */
export const NUMBER_OF_HOUSE: readonly number[] = [3, 1, 4, 2];
/** The houses (and so the constellations over them) in order of their numbers. */
export const READING_ORDER: readonly number[] = NUMBER_OF_HOUSE
  .map((n, house) => ({ n, house }))
  .sort((a, b) => a.n - b.n)
  .map(({ house }) => house);
const SKY_BOX = { x0: 20, y0: 20, x1: 440, y1: 335 };
export const STAR_R = 3.6;

type P = readonly [number, number];

const chomStars = (c: (typeof CHOMS)[number]): [number, number][] => placeStars(c.glyph, c.x, c.y, CHOM_SIZE);

/** Stars every painting has (generated once, clear of the added constellations). */
export const BASE_STARS: readonly P[] = (() => {
  const rand = seeded(8101);
  const added = CHOMS.flatMap(chomStars);
  const out: P[] = [];
  for (let tries = 0; tries < 6000 && out.length < 80; tries += 1) {
    const x = SKY_BOX.x0 + rand() * (SKY_BOX.x1 - SKY_BOX.x0);
    const y = SKY_BOX.y0 + rand() * (SKY_BOX.y1 - SKY_BOX.y0);
    if (added.some(([ax, ay]) => dist(x, y, ax, ay) < 24)) continue;
    if (out.some(([ox, oy]) => dist(x, y, ox, oy) < 26)) continue;
    out.push([x, y]);
  }
  return out;
})();

/** Stray extra stars in the star painting that belong to no constellation. */
export const STRAYS: readonly P[] = (() => {
  const rand = seeded(8102);
  const added = CHOMS.flatMap(chomStars);
  const out: P[] = [];
  for (let tries = 0; tries < 4000 && out.length < 2; tries += 1) {
    const x = SKY_BOX.x0 + rand() * (SKY_BOX.x1 - SKY_BOX.x0);
    const y = SKY_BOX.y0 + rand() * (SKY_BOX.y1 - SKY_BOX.y0);
    if (added.some(([ax, ay]) => dist(x, y, ax, ay) < 30)) continue;
    if ([...BASE_STARS, ...out].some(([ox, oy]) => dist(x, y, ox, oy) < 30)) continue;
    out.push([x, y]);
  }
  return out;
})();

/** The stars of painting `i`. */
export function starsOf(i: number): P[] {
  return i === STARS ? [...BASE_STARS, ...CHOMS.flatMap(chomStars), ...STRAYS] : [...BASE_STARS];
}

/** Stars in painting `i` that painting `j` does not have. */
export function onlyIn(i: number, j: number): P[] {
  const other = starsOf(j);
  return starsOf(i).filter(([x, y]) => !other.some(([ox, oy]) => Math.abs(ox - x) < 0.5 && Math.abs(oy - y) < 0.5));
}

const HOUSE_H = [190, 170, 200, 180];
const LIT_BASE = Array.from({ length: WINDOW_COUNT }, (_, k) => (k * 5 + Math.floor(k / 6)) % 3 !== 0);

/** Which windows (slots 0–5 of a house) are flipped first: spread out, so a count is easy to take in. */
const FLIP_ORDER = [0, 3, 4, 1, 5, 2];
export const NUMBER_FLIPS: readonly number[] = NUMBER_OF_HOUSE.flatMap((n, h) => FLIP_ORDER.slice(0, n).map((s) => h * WINDOWS_PER_HOUSE + s));

/** Which windows are lit in painting `i`. */
export function litWindows(i: number): boolean[] {
  const flips = i === NUMBERS ? NUMBER_FLIPS : [];
  return LIT_BASE.map((lit, k) => (flips.includes(k) ? !lit : lit));
}

/** Where window `k` is, in local painting coordinates. */
export function windowSpot(k: number): { x: number; y: number; w: number; h: number } {
  const house = Math.floor(k / WINDOWS_PER_HOUSE);
  const slot = k % WINDOWS_PER_HOUSE;
  const top = PAINT.h - HOUSE_H[house];
  return { x: 5 + house * HOUSE_W + 20 + (slot % 2) * 46, y: top + 32 + Math.floor(slot / 2) * 42, w: 22, h: 28 };
}

/** How many windows of each house are lit differently in paintings `i` and `j`. */
export function tally(i: number, j: number): number[] {
  const a = litWindows(i);
  const b = litWindows(j);
  return Array.from({ length: HOUSE_COUNT }, (_, h) =>
    Array.from({ length: WINDOWS_PER_HOUSE }, (__, s) => h * WINDOWS_PER_HOUSE + s).filter((k) => a[k] !== b[k]).length);
}

const DIFF = { fill: '#3fb4ff', rim: '#e3f4ff' };

export const threePaintings: PuzzleDef = {
  id: 'three-paintings',
  name: 'Ba bức tranh',
  answer: READING_ORDER.map((h) => CHOMS[h].glyph),
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    /** Which painting each one lies on (null: at home). */
    const onto: (number | null)[] = SLOTS.map(() => null);
    const free: ({ x: number; y: number } | null)[] = SLOTS.map(() => null);
    const groups: SVGGElement[] = [];
    const arts: SVGGElement[] = [];
    const diffs: SVGGElement[] = [];

    // Back: the gallery wall.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#241c26' }, back);
    el('rect', { x: -60, y: 800, width: SCENE_W + 120, height: 160, fill: '#32262a' }, back);
    scene.grain('back', 0.45);

    SLOTS.forEach((slot, i) => {
      el('rect', { x: slot.x - 8, y: slot.y - 8, width: PAINT.w + 16, height: PAINT.h + 16, rx: 10, fill: '#17111a', opacity: 0.55, 'pointer-events': 'none' }, mid);
      const g = el('g', { class: 'painting interactive', tabindex: 0, role: 'button', 'aria-label': `Bức tranh ${i + 1}`, 'data-hint': `paint-${i}` }, front);
      el('rect', { x: -14, y: -14, width: PAINT.w + 28, height: PAINT.h + 28, rx: 10, fill: '#6a4a2e', stroke: '#3a2818', 'stroke-width': 4 }, g);
      const art = el('g', { 'pointer-events': 'none' }, g);
      el('rect', { width: PAINT.w, height: PAINT.h, rx: 4, fill: '#10173a' }, art);
      const rand = seeded(8200);
      for (let k = 0; k < 40; k += 1) {
        // Dim haze, the same in every painting: not stars.
        el('circle', { cx: (rand() * PAINT.w).toFixed(0), cy: (rand() * 340).toFixed(0), r: (10 + rand() * 18).toFixed(0), fill: '#1a2350', opacity: 0.35 }, art);
      }
      for (const [x, y] of starsOf(i)) el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: STAR_R, fill: '#f6efd8' }, art);
      for (let h = 0; h < HOUSE_COUNT; h += 1) {
        const x = 5 + h * HOUSE_W;
        const top = PAINT.h - HOUSE_H[h];
        el('path', { d: `M${x} ${PAINT.h} V${top} L${x + HOUSE_W / 2} ${top - 26} L${x + HOUSE_W} ${top} V${PAINT.h} Z`, fill: '#1b2142', stroke: '#2b3366', 'stroke-width': 3 }, art);
      }
      litWindows(i).forEach((lit, k) => {
        const w = windowSpot(k);
        el('rect', { x: w.x, y: w.y, width: w.w, height: w.h, rx: 3, fill: lit ? '#f4c66a' : '#0c1030' }, art);
      });
      diffs.push(el('g', { 'pointer-events': 'none' }, g));
      el('rect', { x: 0, y: 0, width: PAINT.w, height: PAINT.h, fill: 'transparent' }, g);
      groups.push(g);
      arts.push(art);
      g.setAttribute('transform', `translate(${slot.x} ${slot.y})`);
    });
    drawOwl(front, 800, 790, 0.55);

    /** The marks of what differs between painting `i` (lying) and painting `j` (below), all in one blue. */
    const drawDiff = (layer: SVGGElement, i: number, j: number) => {
      layer.replaceChildren();
      for (const [x, y] of [...onlyIn(i, j), ...onlyIn(j, i)]) {
        el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 5.6, fill: DIFF.fill, stroke: DIFF.rim, 'stroke-width': 1.5 }, layer);
      }
      const a = litWindows(i);
      const b = litWindows(j);
      a.forEach((lit, k) => {
        if (lit === b[k]) return;
        const w = windowSpot(k);
        el('rect', { x: w.x, y: w.y, width: w.w, height: w.h, rx: 3, fill: DIFF.fill, stroke: DIFF.rim, 'stroke-width': 1.5 }, layer);
      });
    };
    const render = () => {
      SLOTS.forEach((slot, i) => {
        const spot = free[i] ?? (onto[i] !== null ? SLOTS[onto[i] as number] : slot);
        groups[i].setAttribute('transform', `translate(${spot.x.toFixed(1)} ${spot.y.toFixed(1)})`);
        const lying = onto[i] !== null;
        const under = SLOTS.findIndex((_, k) => onto[k] === i);
        // A painting lying on another one hides (it is still there to be dragged off); the painting below it
        // dims and shows, in one blue, everything that differs between the two.
        groups[i].setAttribute('opacity', lying ? '0' : free[i] ? '0.85' : '1');
        arts[i].setAttribute('opacity', under >= 0 ? '0.4' : '1');
        if (under >= 0) drawDiff(diffs[i], under, i);
        else diffs[i].replaceChildren();
      });
    };
    const place = (i: number, target: number | null) => {
      // Whatever lay on i goes home; whatever already lies on the target goes home too.
      SLOTS.forEach((_, k) => {
        if (onto[k] === i) onto[k] = null;
        if (target !== null && onto[k] === target && k !== i) onto[k] = null;
      });
      onto[i] = target === i ? null : target;
      free[i] = null;
      render();
    };

    groups.forEach((g, i) => {
      let grab = { x: 0, y: 0 };
      scene.draggable(g, {
        start: (p) => {
          const at = free[i] ?? (onto[i] !== null ? SLOTS[onto[i] as number] : SLOTS[i]);
          grab = { x: p.x - at.x, y: p.y - at.y };
          // Lift it off whatever it lies on, and put it on top.
          onto[i] = null;
          SLOTS.forEach((_, k) => { if (onto[k] === i) onto[k] = null; });
          free[i] = { x: at.x, y: at.y };
          g.parentNode?.appendChild(g);
          render();
        },
        move: (p) => {
          free[i] = { x: p.x - grab.x, y: p.y - grab.y };
          render();
        },
        end: () => {
          const at = free[i] ?? SLOTS[i];
          const near = SLOTS.map((s, k) => ({ k, d: Math.hypot(s.x - at.x, s.y - at.y) }))
            .filter((c) => c.k !== i && onto[c.k] === null)
            .sort((a, b) => a.d - b.d)[0];
          free[i] = null;
          place(i, near && near.d < 170 ? near.k : null);
          sound.paper();
        },
      });
      g.addEventListener('keydown', (event) => {
        const d = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
        if (d) {
          event.preventDefault();
          const to = i + d;
          if (to >= 0 && to < SLOTS.length) place(i, to);
        } else if (event.key === 'Escape' || event.key === 'ArrowDown') {
          event.preventDefault();
          place(i, null);
        }
      });
    });
    render();

    const centre = (slot: number) => ({ x: SLOTS[slot].x + PAINT.w / 2, y: SLOTS[slot].y + PAINT.h / 2 });
    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => [
        {
          note: 'Chồng bức bên trái lên bức bên phải: các chấm xanh là sao thêm vào, tạo thành bốn chòm (có hai chấm lẻ là nhiễu).',
          targets: [{ x: centre(STARS).x, y: centre(STARS).y, r: 90, verb: 'drag', to: centre(BASE), object: `[data-hint="paint-${STARS}"]` }],
          apply: () => place(STARS, BASE),
          prepare: (picture) => {
            const overlay = picture.querySelector('.layer-overlay') ?? picture;
            CHOMS.forEach((c) => {
              const stars = placeStars(c.glyph, SLOTS[BASE].x + c.x, SLOTS[BASE].y + c.y, CHOM_SIZE);
              for (const [a, b] of glyph(c.glyph).lines) {
                el('line', { x1: stars[a][0], y1: stars[a][1], x2: stars[b][0], y2: stars[b][1], class: 'hint-line', 'pointer-events': 'none' }, overlay);
              }
            });
          },
        },
        {
          note: 'Chồng bức ở giữa lên bức bên phải: đếm số ô cửa sổ lệch của từng ngôi nhà, đó là số thứ tự của chòm nằm phía trên ngôi nhà ấy.',
          targets: [{ x: centre(NUMBERS).x, y: centre(NUMBERS).y, r: 90, verb: 'drag', to: centre(BASE), object: `[data-hint="paint-${NUMBERS}"]` }],
          apply: () => place(NUMBERS, BASE),
          prepare: (picture) => {
            const overlay = picture.querySelector('.layer-overlay') ?? picture;
            CHOMS.forEach((c) => {
              const stars = placeStars(c.glyph, SLOTS[BASE].x + c.x, SLOTS[BASE].y + c.y, CHOM_SIZE);
              for (const [a, b] of glyph(c.glyph).lines) {
                el('line', { x1: stars[a][0], y1: stars[a][1], x2: stars[b][0], y2: stars[b][1], class: 'hint-line', 'pointer-events': 'none' }, overlay);
              }
            });
          },
        },
        {
          note: 'Số cửa sổ lệch của mỗi nhà là thứ tự đọc chòm ở phía trên nó (không phải trái sang phải).',
          targets: CHOMS.map((c) => ({ x: SLOTS[BASE].x + c.x, y: SLOTS[BASE].y + c.y, r: CHOM_SIZE * 0.7, verb: 'look' as const })),
          prepare: (picture) => {
            const overlay = picture.querySelector('.layer-overlay') ?? picture;
            CHOMS.forEach((c, h) => {
              const badge = el('g', { transform: `translate(${SLOTS[BASE].x + c.x} ${SLOTS[BASE].y + c.y})`, 'pointer-events': 'none' }, overlay);
              el('circle', { r: 20, class: 'number-badge' }, badge);
              el('text', { y: 1, class: 'number-text' }, badge).textContent = String(NUMBER_OF_HOUSE[h]);
            });
          },
        },
      ],
      destroy: () => undefined,
    };
  },
};
