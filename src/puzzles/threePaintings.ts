import { drawOwl } from '../core/owl';
import type { GlyphId } from '../core/glyphs';
import { glyph, placeStars } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el } from '../core/svg';
import { dist, seeded } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 3, level 8 — the three paintings ("hai bức tranh"). Three paintings of the same
 * street corner hang side by side; two are identical and one has been touched up. Drag one
 * painting over another: it turns see-through and tinted warm over the other's cool, so that
 * anything that does not line up shows in its own colour. Compare the pairs to find the odd
 * painting; its extra stars (those in no other painting) are the constellations, read left to
 * right. The odd painting also lost two stars and has a few windows flipped, which are noise.
 */

export const PAINT = { w: 460, h: 560 };
export const SLOTS: readonly { x: number; y: number }[] = [
  { x: 70, y: 150 }, { x: 570, y: 150 }, { x: 1070, y: 150 },
];
/** The painting that was touched up. */
export const ODD = 1;
export const CHOM_SIZE = 90;
/** Constellations added to the odd painting, in local painting coordinates (left to right). */
export const CHOMS: readonly { glyph: GlyphId; x: number; y: number }[] = [
  { glyph: 'cross', x: 72, y: 215 },
  { glyph: 'square', x: 188, y: 95 },
  { glyph: 'hook', x: 300, y: 225 },
  { glyph: 'crown', x: 398, y: 105 },
];
export const READING_ORDER: readonly number[] = CHOMS.map((_, i) => i);
const SKY_BOX = { x0: 20, y0: 20, x1: 440, y1: 335 };
export const STAR_R = 3.6;

type P = readonly [number, number];

const chomStars = (c: (typeof CHOMS)[number]): [number, number][] => placeStars(c.glyph, c.x, c.y, CHOM_SIZE);

/** Stars every painting has (generated once, away from the added constellations). */
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

/** Two of the base stars that the odd painting lacks. */
export const MISSING: readonly number[] = [9, 41];
/** Stray extra stars in the odd painting that belong to no constellation. */
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
  if (i !== ODD) return [...BASE_STARS];
  return [...BASE_STARS.filter((_, k) => !MISSING.includes(k)), ...CHOMS.flatMap(chomStars), ...STRAYS];
}

/** Stars in painting `i` that painting `j` does not have. */
export function onlyIn(i: number, j: number): P[] {
  const other = starsOf(j);
  return starsOf(i).filter(([x, y]) => !other.some(([ox, oy]) => Math.abs(ox - x) < 0.5 && Math.abs(oy - y) < 0.5));
}

/** Houses of the street corner: left edge, width and height, then the three windows of each. */
const HOUSES: readonly { x: number; w: number; h: number }[] = [
  { x: 6, w: 92, h: 150 }, { x: 98, w: 86, h: 120 }, { x: 184, w: 100, h: 170 }, { x: 284, w: 88, h: 130 }, { x: 372, w: 86, h: 155 },
];
export const WINDOW_COUNT = HOUSES.length * 3;
const FLIPPED = [2, 7, 12];
const LIT_BASE = Array.from({ length: WINDOW_COUNT }, (_, k) => k % 3 !== 1 || k % 2 === 0);

/** Which windows are lit in painting `i`. */
export const litWindows = (i: number): boolean[] => LIT_BASE.map((lit, k) => (i === ODD && FLIPPED.includes(k) ? !lit : lit));

/** Where window `k` is, in local painting coordinates. */
export function windowSpot(k: number): { x: number; y: number; w: number; h: number } {
  const h = HOUSES[Math.floor(k / 3)];
  const top = PAINT.h - h.h;
  const slot = k % 3;
  return { x: h.x + (slot === 1 ? h.w - 38 : 16), y: top + (slot === 2 ? 74 : 26), w: 20, h: 26 };
}

/** The painting that differs from both of the others, by comparing stars and windows pair by pair. */
export function oddPainting(): number {
  const same = (i: number, j: number) =>
    onlyIn(i, j).length === 0 && onlyIn(j, i).length === 0
    && litWindows(i).every((v, k) => v === litWindows(j)[k]);
  for (let i = 0; i < SLOTS.length; i += 1) {
    const others = SLOTS.map((_, k) => k).filter((k) => k !== i);
    if (!same(i, others[0]) && !same(i, others[1]) && same(others[0], others[1])) return i;
  }
  return -1;
}

const COLOURS = { star: '#f6efd8', warm: '#ff9a2e', cool: '#45b6ff' };

export const threePaintings: PuzzleDef = {
  id: 'three-paintings',
  name: 'Hai bức tranh',
  answer: READING_ORDER.map((c) => CHOMS[c].glyph),
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    /** Which painting each one lies on (null: at home). */
    const onto: (number | null)[] = SLOTS.map(() => null);
    const free: ({ x: number; y: number } | null)[] = SLOTS.map(() => null);
    const groups: SVGGElement[] = [];
    const arts: SVGGElement[] = [];
    const frames: SVGRectElement[] = [];
    const skies: SVGRectElement[] = [];

    // Back: the gallery wall.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#241c26' }, back);
    el('rect', { x: -60, y: 800, width: SCENE_W + 120, height: 160, fill: '#32262a' }, back);
    scene.grain('back', 0.45);

    SLOTS.forEach((slot, i) => {
      el('rect', { x: slot.x - 8, y: slot.y - 8, width: PAINT.w + 16, height: PAINT.h + 16, rx: 10, fill: '#17111a', opacity: 0.55, 'pointer-events': 'none' }, mid);
      const g = el('g', { class: 'painting interactive', tabindex: 0, role: 'button', 'aria-label': `Bức tranh ${i + 1}`, 'data-hint': `paint-${i}` }, front);
      frames.push(el('rect', { x: -14, y: -14, width: PAINT.w + 28, height: PAINT.h + 28, rx: 10, fill: '#6a4a2e', stroke: '#3a2818', 'stroke-width': 4 }, g));
      const art = el('g', { 'pointer-events': 'none' }, g);
      art.style.color = COLOURS.star;
      skies.push(el('rect', { width: PAINT.w, height: PAINT.h, rx: 4, fill: '#10173a' }, art));
      const rand = seeded(8200);
      for (let k = 0; k < 40; k += 1) {
        // Dim haze, the same in every painting: not stars.
        el('circle', { cx: (rand() * PAINT.w).toFixed(0), cy: (rand() * 340).toFixed(0), r: (10 + rand() * 18).toFixed(0), fill: '#1a2350', opacity: 0.35 }, art);
      }
      for (const [x, y] of starsOf(i)) el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: STAR_R, fill: 'currentColor' }, art);
      HOUSES.forEach((h) => {
        el('path', { d: `M${h.x} ${PAINT.h} V${PAINT.h - h.h} L${h.x + h.w / 2} ${PAINT.h - h.h - 26} L${h.x + h.w} ${PAINT.h - h.h} V${PAINT.h} Z`, fill: '#1b2142', stroke: '#2b3366', 'stroke-width': 3 }, art);
      });
      litWindows(i).forEach((lit, k) => {
        const w = windowSpot(k);
        el('rect', { x: w.x, y: w.y, width: w.w, height: w.h, rx: 3, style: lit ? 'fill: var(--win, #f4c66a)' : 'fill: #0c1030' }, art);
      });
      el('rect', { x: 0, y: 0, width: PAINT.w, height: PAINT.h, fill: 'transparent' }, g);
      groups.push(g);
      arts.push(art);
      g.setAttribute('transform', `translate(${slot.x} ${slot.y})`);
    });
    drawOwl(front, 800, 790, 0.55);

    const place = (i: number, target: number | null) => {
      // Whatever lay on i goes home; whatever i lay on is no longer covered by it.
      SLOTS.forEach((_, k) => {
        if (onto[k] === i) onto[k] = null;
        if (target !== null && onto[k] === target && k !== i) onto[k] = null;
      });
      onto[i] = target === i ? null : target;
      free[i] = null;
      render();
    };
    const render = () => {
      SLOTS.forEach((slot, i) => {
        const spot = free[i] ?? (onto[i] !== null ? SLOTS[onto[i] as number] : slot);
        groups[i].setAttribute('transform', `translate(${spot.x.toFixed(1)} ${spot.y.toFixed(1)})`);
        const lying = onto[i] !== null;
        const carrying = SLOTS.some((_, k) => onto[k] === i);
        // Lying on another painting: no frame or sky of its own and blended by lightening, so that what lines
        // up turns pale, what only this one has stays warm and what only the other has stays cool.
        groups[i].setAttribute('opacity', free[i] ? '0.85' : '1');
        groups[i].style.mixBlendMode = lying ? 'screen' : '';
        frames[i].style.display = lying ? 'none' : '';
        skies[i].style.display = lying ? 'none' : '';
        arts[i].style.color = lying ? COLOURS.warm : carrying ? COLOURS.cool : COLOURS.star;
        arts[i].style.setProperty('--win', lying ? COLOURS.warm : carrying ? COLOURS.cool : '#f4c66a');
      });
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
          if (near && near.d < 170) {
            place(i, near.k);
            sound.paper();
          } else {
            place(i, null);
            sound.paper();
          }
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

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const base = 0;
        return [
          {
            note: 'Kéo một bức tranh chồng lên bức khác: chỗ nào lệch nhau hiện riêng một màu. Làm với các cặp để tìm bức khác hai bức còn lại (bức ở giữa); chồng nó lên một bức kia.',
            targets: [{
              x: SLOTS[ODD].x + PAINT.w / 2, y: SLOTS[ODD].y + PAINT.h / 2, r: 90, verb: 'drag',
              to: { x: SLOTS[base].x + PAINT.w / 2, y: SLOTS[base].y + PAINT.h / 2 }, object: `[data-hint="paint-${ODD}"]`,
            }],
            apply: () => place(ODD, base),
          },
          {
            note: 'Các chấm màu cam (chỉ có ở bức khác) tạo thành bốn chòm sao; vài chấm lẻ và mấy ô cửa sổ khác là nhiễu. Đọc bốn chòm từ trái sang phải.',
            targets: CHOMS.map((c) => ({ x: SLOTS[base].x + c.x, y: SLOTS[base].y + c.y, r: CHOM_SIZE * 0.7, verb: 'look' as const })),
            prepare: (picture) => {
              const overlay = picture.querySelector('.layer-overlay') ?? picture;
              CHOMS.forEach((c, n) => {
                const stars = placeStars(c.glyph, SLOTS[base].x + c.x, SLOTS[base].y + c.y, CHOM_SIZE);
                for (const [a, b] of glyph(c.glyph).lines) {
                  el('line', { x1: stars[a][0], y1: stars[a][1], x2: stars[b][0], y2: stars[b][1], class: 'hint-line', 'pointer-events': 'none' }, overlay);
                }
                const badge = el('g', { transform: `translate(${SLOTS[base].x + c.x} ${SLOTS[base].y + c.y - 62})`, 'pointer-events': 'none' }, overlay);
                el('circle', { r: 16, class: 'number-badge' }, badge);
                el('text', { y: 1, class: 'number-text' }, badge).textContent = String(n + 1);
              });
            },
          },
        ];
      },
      destroy: () => undefined,
    };
  },
};
