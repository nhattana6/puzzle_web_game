import { drawOwl } from '../core/owl';
import type { GlyphId } from '../core/glyphs';
import { glyph, placeStars } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el } from '../core/svg';
import { tween } from '../core/tween';
import { seeded } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 3, level 2 — footprints in the sand ("dấu chân"). Four children, a grown-up and a
 * dog all crossed the temple yard through one doorway, and their prints lie in a pile, each
 * newer one pressed over the older. Each child hung a lantern on the rack and left a sandal
 * under it, so the tread of a print says whose it is. Tap a print to lift it onto the plank
 * and see the one it covered. The answer is the children's lanterns in the order they
 * crossed: the print at the bottom of the pile is the first to have passed.
 */

export type Tread = 'stripes' | 'dots' | 'zigzag' | 'rings' | 'grid';

export interface KidDef {
  glyph: GlyphId;
  tread: Tread;
}

/** Left to right on the lantern rack. */
export const KIDS: readonly KidDef[] = [
  { glyph: 'diamond', tread: 'stripes' },
  { glyph: 'hook', tread: 'dots' },
  { glyph: 'cross', tread: 'zigzag' },
  { glyph: 'crown', tread: 'rings' },
];

export interface PrintDef {
  /** A child (index into KIDS), the grown-up's boot, or the dog's paw. */
  who: number | 'adult' | 'dog';
  /** Offset from the pile's centre, tilt in degrees, and size factor. */
  x: number;
  y: number;
  rot: number;
  scale: number;
}

export const PILE_CENTRE = { x: 1100, y: 380 };
/** Half-axes of a sole (and, for the dog, of its paw) before scaling. */
const SOLE = { a: 46, b: 100 };
const PAW = { a: 44, b: 52 };

/** Bottom of the pile first: the order in which they walked through. */
export const PILE: readonly PrintDef[] = [
  { who: 2, x: -78, y: -32, rot: -22, scale: 1.25 },
  { who: 'adult', x: 70, y: 10, rot: 16, scale: 1.44 },
  { who: 0, x: -18, y: 48, rot: 6, scale: 1.25 },
  { who: 'dog', x: 42, y: -60, rot: 0, scale: 1 },
  { who: 3, x: -50, y: -50, rot: -8, scale: 1.25 },
  { who: 1, x: 10, y: -5, rot: 12, scale: 1.25 },
];

/** The children in the order they crossed (bottom of the pile first). */
export const READING_ORDER: readonly number[] = PILE.flatMap((p) => (typeof p.who === 'number' ? [p.who] : []));

const halfAxes = (p: PrintDef) => (p.who === 'dog' ? PAW : SOLE);

/** Is the scene point inside print `i` (an ellipse standing in for its outline)? */
export function insidePrint(i: number, x: number, y: number): boolean {
  const p = PILE[i];
  const r = (p.rot * Math.PI) / 180;
  const dx = x - PILE_CENTRE.x - p.x;
  const dy = y - PILE_CENTRE.y - p.y;
  const u = dx * Math.cos(r) + dy * Math.sin(r);
  const v = -dx * Math.sin(r) + dy * Math.cos(r);
  const { a, b } = halfAxes(p);
  return (u / (a * p.scale)) ** 2 + (v / (b * p.scale)) ** 2 <= 1;
}

/** A grid of points over print `i`, in scene coordinates. */
function samples(i: number): [number, number][] {
  const p = PILE[i];
  const { a, b } = halfAxes(p);
  const r = (p.rot * Math.PI) / 180;
  const out: [number, number][] = [];
  for (let u = -a * p.scale; u <= a * p.scale; u += 6) {
    for (let v = -b * p.scale; v <= b * p.scale; v += 6) {
      if ((u / (a * p.scale)) ** 2 + (v / (b * p.scale)) ** 2 > 1) continue;
      out.push([PILE_CENTRE.x + p.x + u * Math.cos(r) - v * Math.sin(r), PILE_CENTRE.y + p.y + u * Math.sin(r) + v * Math.cos(r)]);
    }
  }
  return out;
}

/** How much of print `i` shows, given which prints have been lifted off the pile (0..1). */
export function visibleFraction(i: number, lifted: readonly number[]): number {
  const above = PILE.map((_, k) => k).filter((k) => k > i && !lifted.includes(k));
  const s = samples(i);
  return s.filter(([x, y]) => !above.some((k) => insidePrint(k, x, y))).length / s.length;
}

/** The share of print `i` that print `j` lies over (symmetric use: call both ways). */
export function overlapFraction(i: number, j: number): number {
  const s = samples(i);
  return s.filter(([x, y]) => insidePrint(j, x, y)).length / s.length;
}

export const PLANK = { x: 760, y: 655, w: 690, h: 140 };
/** Where the k-th lifted print rests on the plank. */
export const slotPos = (k: number): { x: number; y: number } => ({ x: PLANK.x + 70 + k * 110, y: PLANK.y + PLANK.h / 2 });
const TRAY_SCALE = 0.55;

const RACK_X = [170, 310, 450, 590];
const LANTERN_Y = 250;
const CARD_Y = 480;

const TREAD_INK = '#6d5428';

/** A sole with its tread, centred on (0, 0), about 92 × 200. */
function drawSole(parent: Element, tread: Tread): SVGGElement {
  const g = el('g', {}, parent);
  el('path', {
    d: 'M0 -100 C40 -100 52 -60 48 -10 C46 30 30 60 34 85 C36 105 -34 105 -34 85 C-30 60 -46 30 -48 -10 C-52 -60 -40 -100 0 -100 Z',
    fill: '#bda068', stroke: '#8a7040', 'stroke-width': 4,
  }, g);
  const ink = { stroke: TREAD_INK, 'stroke-width': 6, 'stroke-linecap': 'round', fill: 'none' } as const;
  if (tread === 'stripes') {
    for (const y of [-66, -36, -6, 24, 54]) el('line', { x1: -30, y1: y, x2: 30, y2: y, ...ink }, g);
  } else if (tread === 'dots') {
    for (const y of [-66, -36, -6, 24, 54]) for (const x of [-20, 0, 20]) el('circle', { cx: x, cy: y, r: 6, fill: TREAD_INK }, g);
  } else if (tread === 'zigzag') {
    el('polyline', { points: '-26,-72 26,-46 -26,-20 26,6 -26,32 26,58', ...ink }, g);
  } else if (tread === 'rings') {
    for (const [ry, rx] of [[78, 34], [50, 22], [24, 10]]) el('ellipse', { cx: 0, cy: -4, rx, ry, ...ink }, g);
  } else {
    for (const x of [-18, 18]) el('line', { x1: x, y1: -74, x2: x, y2: 70, ...ink }, g);
    for (const y of [-48, -8, 32]) el('line', { x1: -30, y1: y, x2: 30, y2: y, ...ink }, g);
  }
  return g;
}

/** A dog's paw, centred on (0, 0), about 88 × 104. */
function drawPaw(parent: Element): SVGGElement {
  const g = el('g', {}, parent);
  const style = { fill: '#bda068', stroke: '#8a7040', 'stroke-width': 4 } as const;
  el('ellipse', { cx: 0, cy: 14, rx: 24, ry: 20, ...style }, g);
  for (const [x, y] of [[-30, -10], [-11, -32], [11, -32], [30, -10]]) el('ellipse', { cx: x, cy: y, rx: 9, ry: 12, ...style }, g);
  return g;
}

/** Print `i` as it lies on the pile, or at slot `k` on the plank when lifted. */
function pose(i: number, slot: number | null): { x: number; y: number; rot: number; s: number } {
  const p = PILE[i];
  if (slot === null) return { x: PILE_CENTRE.x + p.x, y: PILE_CENTRE.y + p.y, rot: p.rot, s: p.scale };
  const c = slotPos(slot);
  return { x: c.x, y: c.y, rot: 0, s: TRAY_SCALE * (p.who === 'adult' ? 0.9 : 1) };
}

const poseAttr = (q: { x: number; y: number; rot: number; s: number }) =>
  `translate(${q.x.toFixed(1)} ${q.y.toFixed(1)}) rotate(${q.rot.toFixed(1)}) scale(${q.s.toFixed(3)})`;

export const sandFootprints: PuzzleDef = {
  id: 'sand-footprints',
  name: 'Dấu chân trên cát',
  answer: READING_ORDER.map((k) => KIDS[k].glyph),
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    /** Prints off the pile, in the order they were lifted; the index is the plank slot. */
    let lifted: number[] = [];
    const now = PILE.map((_, i) => pose(i, null));
    const cancels: (null | (() => void))[] = PILE.map(() => null);

    // Back: the temple wall and the ground.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#1e1a2a' }, back);
    el('rect', { x: -60, y: 830, width: SCENE_W + 120, height: 120, fill: '#2d2433' }, back);
    scene.grain('back', 0.45);

    // Mid, left: the lantern rack. Under each lantern, its child's sandal.
    el('rect', { x: 90, y: 100, width: 600, height: 16, rx: 6, fill: '#5a3f2a', stroke: '#3a2818', 'stroke-width': 3 }, mid);
    KIDS.forEach((k, i) => {
      const x = RACK_X[i];
      el('line', { x1: x, y1: 116, x2: x, y2: LANTERN_Y - 78, stroke: '#8a6a48', 'stroke-width': 3 }, mid);
      const lamp = el('g', { transform: `translate(${x} ${LANTERN_Y})` }, mid);
      el('rect', { x: -26, y: -88, width: 52, height: 14, rx: 4, fill: '#4a2c1a' }, lamp);
      el('ellipse', { rx: 62, ry: 78, fill: '#b8452f', stroke: '#7a2a1c', 'stroke-width': 4 }, lamp);
      el('rect', { x: -26, y: 74, width: 52, height: 14, rx: 4, fill: '#4a2c1a' }, lamp);
      for (const [sx, sy] of placeStars(k.glyph, 0, 0, 84)) el('circle', { cx: sx.toFixed(1), cy: sy.toFixed(1), r: 7, fill: '#fff3c8' }, lamp);
      const card = el('g', { transform: `translate(${x} ${CARD_Y})` }, mid);
      el('rect', { x: -52, y: -86, width: 104, height: 172, rx: 10, fill: '#e4d6b6', stroke: '#a89468', 'stroke-width': 3 }, card);
      const sole = drawSole(card, k.tread);
      sole.setAttribute('transform', 'scale(0.7)');
    });

    // Mid, right: the yard's sand, the plank, and the prints.
    el('rect', { x: 700, y: 80, width: 810, height: 740, rx: 24, fill: '#d9c28c', stroke: '#8a7648', 'stroke-width': 6 }, mid);
    const rand = seeded(5303);
    const grains = el('g', { 'pointer-events': 'none' }, mid);
    for (let n = 0; n < 160; n += 1) {
      el('circle', { cx: (720 + rand() * 770).toFixed(0), cy: (96 + rand() * 710).toFixed(0), r: (1 + rand() * 2).toFixed(1), fill: '#bba56f', opacity: 0.7 }, grains);
    }
    el('rect', { x: PLANK.x, y: PLANK.y, width: PLANK.w, height: PLANK.h, rx: 12, fill: '#6a4a2e', stroke: '#3a2818', 'stroke-width': 4 }, mid);
    for (let k = 0; k < PILE.length; k += 1) {
      const c = slotPos(k);
      el('rect', { x: c.x - 48, y: c.y - 54, width: 96, height: 108, rx: 8, fill: 'none', stroke: '#8a6a48', 'stroke-width': 2, 'stroke-dasharray': '6 6', 'pointer-events': 'none' }, mid);
    }

    const prints = PILE.map((p, i) => {
      const g = el('g', {
        class: 'sand-print interactive', tabindex: 0, role: 'button', 'aria-label': `Dấu chân ${i + 1}`, 'data-hint': `print-${i}`,
      }, mid);
      el('ellipse', { rx: halfAxes(p).a + 6, ry: halfAxes(p).b + 6, fill: 'transparent' }, g);
      const art = el('g', { 'pointer-events': 'none' }, g);
      if (p.who === 'dog') drawPaw(art);
      else drawSole(art, p.who === 'adult' ? 'grid' : KIDS[p.who].tread);
      g.setAttribute('transform', poseAttr(now[i]));
      return g;
    });

    drawOwl(front, 110, 846, 0.7);

    const render = (i: number) => prints[i].setAttribute('transform', poseAttr(now[i]));
    /** Moves print i to where `lifted` says it belongs, sliding there unless `instant`. */
    const settle = (i: number, instant: boolean) => {
      cancels[i]?.();
      cancels[i] = null;
      const slot = lifted.indexOf(i);
      const to = pose(i, slot < 0 ? null : slot);
      if (instant) {
        now[i] = to;
        render(i);
        return;
      }
      const from = { ...now[i] };
      cancels[i] = tween(240, (t) => {
        now[i] = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, rot: from.rot + (to.rot - from.rot) * t, s: from.s + (to.s - from.s) * t };
        render(i);
      });
    };
    const settleAll = (instant: boolean) => PILE.forEach((_, i) => settle(i, instant));
    const toggle = (i: number) => {
      lifted = lifted.includes(i) ? lifted.filter((k) => k !== i) : [...lifted, i];
      sound.paper();
      settleAll(false);
    };
    prints.forEach((g, i) => {
      g.addEventListener('click', () => toggle(i));
      g.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle(i);
        }
      });
    });

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const top = PILE.length - 1;
        const from = pose(top, null);
        const to = pose(top, 0);
        return [
          {
            note: 'Chạm vào dấu chân trên cùng để nhấc nó ra ván gỗ, dấu bên dưới sẽ lộ ra. Làm tiếp cho đến hết.',
            targets: [{
              x: from.x, y: from.y, r: 60, verb: 'tap',
              act: (picture) => {
                const node = picture.querySelector(`[data-hint="print-${top}"]`);
                return (p) => {
                  const k = p;
                  node?.setAttribute('transform', poseAttr({
                    x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, rot: from.rot + (to.rot - from.rot) * k, s: from.s + (to.s - from.s) * k,
                  }));
                };
              },
            }],
            apply: () => {
              lifted = PILE.map((_, i) => PILE.length - 1 - i);
              settleAll(true);
            },
          },
          {
            note: 'Đế của mỗi dấu khớp với một thẻ dưới đèn lồng. Bỏ giày người lớn và dấu chó. Dấu nằm dưới cùng là người qua trước: đọc từ phải sang trái trên ván.',
            targets: READING_ORDER.map((k) => ({ x: RACK_X[k], y: LANTERN_Y, r: 90, verb: 'look' as const })),
            prepare: (picture) => {
              const overlay = picture.querySelector('.layer-overlay') ?? picture;
              READING_ORDER.forEach((k, n) => {
                const stars = placeStars(KIDS[k].glyph, RACK_X[k], LANTERN_Y, 84);
                for (const [a, b] of glyph(KIDS[k].glyph).lines) {
                  el('line', { x1: stars[a][0], y1: stars[a][1], x2: stars[b][0], y2: stars[b][1], class: 'hint-line', 'pointer-events': 'none' }, overlay);
                }
                const badge = el('g', { transform: `translate(${RACK_X[k]} ${LANTERN_Y - 112})`, 'pointer-events': 'none' }, overlay);
                el('circle', { r: 17, class: 'number-badge' }, badge);
                el('text', { y: 1, class: 'number-text' }, badge).textContent = String(n + 1);
              });
            },
          },
        ];
      },
      destroy: () => cancels.forEach((c) => c?.()),
    };
  },
};
