import { drawOwl } from '../core/owl';
import type { GlyphId } from '../core/glyphs';
import { placeStars } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el } from '../core/svg';
import { starfield } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 4, level 11 — the star scales ("cân đá chòm sao"). Six stones weigh exactly 1, 2, 3, 4, 5 and
 * 6 units, one each; which weighs what is hidden. Five scales stand in the room, each already loaded
 * and tipped (or level) by the stones in its pans (a pan may hold several; add them up). The shelf has
 * six places, from the lightest to the heaviest, marked by 1–6 dots. Laying the stones on the shelf in
 * their true order is the whole puzzle: once the six sit where every scale agrees, the four stones with
 * a carving light up and the answer is their constellations from the lightest to the heaviest. Exactly
 * one order satisfies all five scales (checked over all 720).
 */

export const COUNT = 6;
export type Scale = { left: readonly number[]; right: readonly number[] };

/** Each scale: stones in the left and right pan. */
export const SCALES: readonly Scale[] = [
  { left: [0, 2], right: [5] },
  { left: [3, 5], right: [4] },
  { left: [0, 3, 4], right: [1, 2, 5] },
  { left: [0, 5], right: [2, 4] },
  { left: [5], right: [1, 3] },
];
/** The true weight (1–6) of each stone. */
export const WEIGHTS: readonly number[] = [6, 1, 5, 2, 4, 3];
/** The constellation carved on each stone (null for the two plain ones). */
export const CARVING: readonly (GlyphId | null)[] = ['dipper', 'arrow', null, null, 'triangle', 'belt'];

/** Which way a scale tips for the given weights: 1 left pan heavier, -1 right pan heavier, 0 level. */
export function tilt(weights: readonly number[], scale: Scale): number {
  const sum = (ids: readonly number[]) => ids.reduce((total, i) => total + weights[i], 0);
  return Math.sign(sum(scale.left) - sum(scale.right));
}
/** The tilt each scale shows (its true state in the room). */
export const TILTS: readonly number[] = SCALES.map((s) => tilt(WEIGHTS, s));

/** Whether a scale agrees with the weights implied by an arrangement. */
export const agrees = (weights: readonly number[], scaleIndex: number): boolean => tilt(weights, SCALES[scaleIndex]) === TILTS[scaleIndex];

/** Weights of all stones when the shelf holds `slots` (slot s holds stone slots[s], -1 for empty): slot s means weight s + 1. */
export function weightsFromShelf(slots: readonly number[]): number[] {
  const out = Array(COUNT).fill(0);
  slots.forEach((stone, s) => { if (stone >= 0) out[stone] = s + 1; });
  return out;
}
export const shelfFull = (slots: readonly number[]): boolean => slots.length === COUNT && slots.every((s) => s >= 0);
/** Every scale agrees with a full shelf. */
export const isSolved = (slots: readonly number[]): boolean => shelfFull(slots) && SCALES.every((_, k) => agrees(weightsFromShelf(slots), k));

/** The shelf of the true weights: stone at slot s is the one weighing s + 1. */
export const SOLUTION_SHELF: readonly number[] = Array.from({ length: COUNT }, (_, s) => WEIGHTS.indexOf(s + 1));
/** The carved constellations from the lightest to the heaviest stone: the answer. */
export const READING_ORDER: readonly GlyphId[] = SOLUTION_SHELF.flatMap((stone) => (CARVING[stone] ? [CARVING[stone] as GlyphId] : []));

// ── Layout (scene units) ────────────────────────────────────────────────────────────────────
const SCALE_X = [190, 530, 870];
const SCALE_Y = [200, 590];
/** Scales sit in this order: row by row. */
const scaleCentre = (k: number): { x: number; y: number } => ({ x: SCALE_X[k % 3], y: SCALE_Y[Math.floor(k / 3)] });
const ARM = 105;
const TILT_DY = 24;
const STRING = 170;
const MINI = 60;

const SHELF_X = [1130, 1270, 1410];
const slotCentre = (s: number): { x: number; y: number } => ({ x: SHELF_X[s % 3], y: 160 + Math.floor(s / 3) * 190 });
const trayCentre = (i: number): { x: number; y: number } => ({ x: SHELF_X[i % 3], y: 610 + Math.floor(i / 3) * 150 });
const BIG = 100;

const FILLS = ['#7a6a9a', '#4f8aa0', '#a07a50', '#5f9a64', '#a05a6a', '#8f8f58'];

/** Outline of stone `id`: a circle, square, triangle, hexagon, diamond and pentagon, `s` across, centred on (0, 0). */
function stonePath(id: number, s: number): string {
  const h = s / 2;
  const poly = (n: number, rot: number, r: number) =>
    Array.from({ length: n }, (_, k) => {
      const a = rot + (k * 2 * Math.PI) / n;
      return `${k ? 'L' : 'M'}${(r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)}`;
    }).join(' ') + ' Z';
  switch (id) {
    case 0: return `M${-h * 0.92} 0 a${h * 0.92} ${h * 0.92} 0 1 0 ${h * 1.84} 0 a${h * 0.92} ${h * 0.92} 0 1 0 ${-h * 1.84} 0 Z`;
    case 1: return `M${-h * 0.8} ${-h * 0.8} H${h * 0.8} V${h * 0.8} H${-h * 0.8} Z`;
    case 2: return `M0 ${-h} L${h * 1.02} ${h * 0.82} H${-h * 1.02} Z`;
    case 3: return poly(6, 0, h);
    case 4: return `M0 ${-h * 1.05} L${h * 0.85} 0 L0 ${h * 1.05} L${-h * 0.85} 0 Z`;
    default: return poly(5, -Math.PI / 2, h);
  }
}

function drawStone(parent: Element, id: number, size: number): SVGGElement {
  const g = el('g', {}, parent);
  el('path', { d: stonePath(id, size), fill: FILLS[id], stroke: '#e8dcc0', 'stroke-width': Math.max(2.5, size / 20), 'stroke-linejoin': 'round' }, g);
  return g;
}

export const starScales: PuzzleDef = {
  id: 'star-scales',
  name: 'Cân đá chòm sao',
  answer: [...READING_ORDER],
  help: [
    'Sáu viên đá nặng đúng 1, 2, 3, 4, 5 và 6 lạng, mỗi viên một mức khác nhau; số chấm ở mỗi ô kệ là số lạng, ô nhẹ nhất ở đầu.',
    'Cân nghiêng về bên nặng hơn, đứng thăng bằng khi hai bên nặng bằng nhau. Một đĩa có thể chứa nhiều viên: hãy cộng chúng lại.',
    'Chạm một viên rồi chạm ô kệ để đặt nó; chạm viên trên kệ để nhấc lại. Khi đủ sáu viên, đèn trên mỗi cân cho biết cân ấy đã khớp chưa. Khi mọi cân khớp, các viên có khắc chòm sao sáng lên: đọc từ ô nhẹ đến ô nặng.',
  ],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    /** The stone on each shelf place (-1 empty), light to heavy. */
    const shelf: number[] = Array(COUNT).fill(-1);
    let held = -1;
    let wasSolved = false;
    const stoneNodes: SVGGElement[] = [];
    const rings: SVGCircleElement[] = [];
    const glyphs: SVGGElement[] = [];
    const lamps: SVGCircleElement[] = [];

    // Back: the weighing room.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#14172b' }, back);
    starfield(back, { x: 0, y: 0, w: SCENE_W, h: SCENE_H }, 50, 6111);
    scene.grain('back', 0.45);

    // Mid: the five scales, already loaded.
    const stack = (n: number): [number, number][] => (n === 1 ? [[0, 0]] : n === 2 ? [[-31, 0], [31, 0]] : [[-31, 0], [31, 0], [0, -54]]);
    SCALES.forEach((scale, k) => {
      const c = scaleCentre(k);
      const dy = TILT_DY * TILTS[k];
      const g = el('g', { transform: `translate(${c.x} ${c.y})`, 'pointer-events': 'none' }, mid);
      el('path', { d: 'M0 0 V250 M-62 252 H62', fill: 'none', stroke: '#6b4f24', 'stroke-width': 9, 'stroke-linecap': 'round' }, g);
      el('line', { x1: -ARM, y1: -dy, x2: ARM, y2: dy, stroke: '#d3a64f', 'stroke-width': 10, 'stroke-linecap': 'round' }, g);
      el('circle', { r: 11, fill: '#d3a64f', stroke: '#6b4f24', 'stroke-width': 3 }, g);
      ([[-1, scale.left], [1, scale.right]] as const).forEach(([side, stones]) => {
        const ex = side * ARM;
        const ey = side * dy;
        const py = ey + STRING;
        el('path', { d: `M${ex} ${ey} L${ex - 46} ${py} M${ex} ${ey} L${ex + 46} ${py}`, fill: 'none', stroke: '#8d8fc4', 'stroke-width': 3 }, g);
        el('path', { d: `M${ex - 60} ${py} H${ex + 60} Q${ex + 56} ${py + 16} ${ex} ${py + 18} Q${ex - 56} ${py + 16} ${ex - 60} ${py}`, fill: '#8a6a3a', stroke: '#d3a64f', 'stroke-width': 4, 'stroke-linejoin': 'round' }, g);
        stack(stones.length).forEach(([sx, sy], n) => {
          const id = stones[n];
          const s = el('g', { transform: `translate(${ex + sx} ${py - MINI / 2 - 2 + sy})` }, g);
          drawStone(s, id, MINI);
        });
      });
      const lamp = el('circle', { cx: c.x, cy: c.y - 70, r: 14, fill: '#3b3866', stroke: '#e8dcc0', 'stroke-width': 3, 'pointer-events': 'none' }, mid);
      lamp.style.display = 'none';
      lamps.push(lamp);
    });
    drawOwl(mid, 870, 740, 0.9);

    // The shelf: six places from light to heavy, marked by 1–6 dots.
    for (let s = 0; s < COUNT; s += 1) {
      const p = slotCentre(s);
      const g = el('g', { transform: `translate(${p.x} ${p.y})`, 'pointer-events': 'none' }, mid);
      el('rect', { x: -62, y: -62, width: 124, height: 124, rx: 14, fill: '#1a1424', stroke: '#6b4f24', 'stroke-width': 4, 'stroke-dasharray': '10 8' }, g);
      for (let d = 0; d <= s; d += 1) el('circle', { cx: -((s) * 9) + d * 18, cy: 84, r: 5.5, fill: '#f4c66a' }, g);
    }

    // Front: the stones, and hit areas for the shelf places.
    for (let s = 0; s < COUNT; s += 1) {
      const p = slotCentre(s);
      const hit = el('rect', { x: p.x - 62, y: p.y - 62, width: 124, height: 124, fill: 'transparent', class: 'interactive' }, front);
      asButton(hit, `Ô kệ ${s + 1}`, () => tapSlot(s));
    }
    for (let i = 0; i < COUNT; i += 1) {
      const g = el('g', { class: 'interactive', 'data-hint': `stone-${i}` }, front);
      el('circle', { r: 62, fill: 'transparent' }, g);
      rings.push(el('circle', { r: 62, fill: 'none', stroke: '#f4c66a', 'stroke-width': 5, 'stroke-dasharray': '8 8', 'pointer-events': 'none' }, g));
      const body = drawStone(g, i, BIG);
      body.setAttribute('pointer-events', 'none');
      const art = el('g', { 'pointer-events': 'none' }, g);
      const glyph = CARVING[i];
      if (glyph) for (const [x, y] of placeStars(glyph, 0, 0, 64)) el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 5.2, fill: '#fff1c4', stroke: '#1a1424', 'stroke-width': 1.5 }, art);
      art.style.display = 'none';
      glyphs.push(art);
      asButton(g, `Viên đá ${i + 1}`, () => tapStone(i));
      stoneNodes.push(g);
    }

    const slotOf = (i: number): number => shelf.indexOf(i);
    const render = (): void => {
      const solved = isSolved(shelf);
      stoneNodes.forEach((node, i) => {
        const s = slotOf(i);
        const p = s >= 0 ? slotCentre(s) : trayCentre(i);
        node.setAttribute('transform', `translate(${p.x} ${p.y})`);
        rings[i].style.display = held === i ? '' : 'none';
        glyphs[i].style.display = solved && CARVING[i] ? '' : 'none';
      });
      const weights = weightsFromShelf(shelf);
      const full = shelfFull(shelf);
      lamps.forEach((lamp, k) => {
        lamp.style.display = full ? '' : 'none';
        lamp.setAttribute('fill', full && agrees(weights, k) ? '#f4c66a' : '#c0463f');
      });
    };
    function check(): void {
      const done = isSolved(shelf);
      if (done && !wasSolved) sound.ding();
      wasSolved = done;
    }
    function tapStone(i: number): void {
      if (held === i) {
        held = -1;
      } else if (slotOf(i) < 0) {
        held = i;
      } else if (held >= 0) {
        // A held stone swaps with the one on the shelf, which goes into the hand.
        const s = slotOf(i);
        shelf[s] = held;
        held = i;
      } else {
        shelf[slotOf(i)] = -1;
        held = i;
      }
      sound.tick();
      render();
      check();
    }
    function tapSlot(s: number): void {
      if (held < 0) {
        if (shelf[s] >= 0) {
          held = shelf[s];
          shelf[s] = -1;
          sound.tick();
        }
      } else {
        const displaced = shelf[s];
        shelf[s] = held;
        held = displaced;
        sound.knock();
      }
      render();
      check();
    }
    render();

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const first = SOLUTION_SHELF[0];
        const from = trayCentre(first);
        const to = slotCentre(0);
        return [
          {
            note: 'Đặt các viên đá lên kệ theo đúng cân nặng, nhẹ nhất ở đầu (cân nào nghiêng hay thăng bằng cũng phải khớp khi cộng các viên trong đĩa). Làm tương tự cho cả sáu viên.',
            targets: [{ x: from.x, y: from.y, r: 60, verb: 'drag', to, object: `[data-hint="stone-${first}"]` }],
            apply: () => {
              SOLUTION_SHELF.forEach((stone, s) => { shelf[s] = stone; });
              held = -1;
              wasSolved = true;
              render();
            },
          },
          {
            note: 'Sáu viên đã đúng chỗ, các viên có khắc chòm sao sáng lên. Đọc chúng từ ô nhẹ nhất đến ô nặng nhất.',
            targets: SOLUTION_SHELF.flatMap((stone, s) => (CARVING[stone] ? [{ x: slotCentre(s).x, y: slotCentre(s).y, r: 66, verb: 'look' as const }] : [])),
          },
        ];
      },
      destroy: () => undefined,
    };
  },
};
