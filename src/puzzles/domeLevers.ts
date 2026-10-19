import { drawOwl } from '../core/owl';
import { DEF, url } from '../core/defs';
import type { GlyphId } from '../core/glyphs';
import { placeStars } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el } from '../core/svg';
import { starfield } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 4, level 4 — the dome lever board ("bảng cần gạt vòm"). Seven lamps under the dome (a
 * ring of six around a centre one) and seven levers. Every lever has a small picture above it
 * of the seven lamps with the ones it changes filled in: moving it flips exactly those lamps
 * (lit ↔ dark), and moving it back flips them again. The old keeper left two levers down; the
 * lamps show whatever that makes. The dome lights fully in one position of the levers only, and the
 * answer is the constellations engraved under the levers that are down then, left to right.
 */

export const LAMPS = 7;
export const LEVERS = 7;

/** For each lever, the lamps it flips. Lamp 0 is the centre one, 1–6 go round clockwise from the top. */
export const AFFECTS: readonly (readonly number[])[] = [
  [1, 2, 3],
  [2, 3, 4],
  [0, 1, 5],
  [4, 5],
  [2, 4],
  [0, 1, 6],
  [3, 6],
];

/** The engraving under each lever. */
export const ENGRAVINGS: readonly GlyphId[] = ['dipper', 'crown', 'hook', 'belt', 'triangle', 'cross', 'square'];

/** The one set of levers that lights every lamp. */
export const SOLUTION: readonly number[] = [1, 2, 4, 6];
/** Levers left down by the old keeper. */
export const START: readonly number[] = [0, 5];

/** Whether a lamp is lit with all levers up, worked out so that `SOLUTION` lights everything. */
export const BASE: readonly boolean[] = Array.from({ length: LAMPS }, (_, j) => {
  const flips = SOLUTION.filter((i) => AFFECTS[i].includes(j)).length;
  return flips % 2 === 0;
});

/** Which lamps are lit when exactly the levers in `down` are down. */
export function lampsLit(down: readonly number[]): boolean[] {
  return BASE.map((on, j) => (down.filter((i) => AFFECTS[i].includes(j)).length % 2 === 1 ? !on : on));
}

export const allLit = (down: readonly number[]): boolean => lampsLit(down).every(Boolean);

/** The answer: the engravings under the levers that are down in the solution, left to right. */
export const READING_ORDER: readonly GlyphId[] = [...SOLUTION].sort((a, b) => a - b).map((i) => ENGRAVINGS[i]);

// ── Layout (scene units) ────────────────────────────────────────────────────────────────────
const DOME = { x: 340, y: 470, ring: 180 };
export function lampSpot(j: number): { x: number; y: number } {
  if (j === 0) return { x: DOME.x, y: DOME.y };
  const a = ((j - 1) * 60 - 90) * (Math.PI / 180);
  return { x: DOME.x + DOME.ring * Math.cos(a), y: DOME.y + DOME.ring * Math.sin(a) };
}
export const leverX = (i: number): number => 710 + i * 127;
export const SLOT = { top: 400, bottom: 560 };
const MINI = { y: 230, scale: 0.2 };
const ENGRAVING_Y = 700;

export const leverBoard: PuzzleDef = {
  id: 'dome-levers',
  name: 'Bảng cần gạt vòm',
  answer: [...READING_ORDER],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const down = new Set<number>(START);
    const lampNodes: SVGCircleElement[] = [];
    const knobs: SVGGElement[] = [];
    let wasLit = false;

    // Back: the observatory wall, the dome and a few stars.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#14172b' }, back);
    starfield(back, { x: 0, y: 0, w: SCENE_W, h: SCENE_H }, 60, 5404);
    el('rect', { x: -60, y: 846, width: SCENE_W + 120, height: 120, fill: '#2a1f1a' }, back);
    scene.grain('back', 0.45);
    el('circle', { cx: DOME.x, cy: DOME.y, r: 285, fill: '#1b2040', stroke: '#2c335f', 'stroke-width': 18, 'pointer-events': 'none' }, back);

    // Mid: the lamp panel and the lever board.
    el('rect', { x: 645, y: 90, width: 905, height: 760, rx: 24, fill: '#241f33', stroke: '#6b4f24', 'stroke-width': 6, 'pointer-events': 'none' }, mid);
    for (let j = 0; j < LAMPS; j += 1) {
      const p = lampSpot(j);
      el('circle', { cx: p.x, cy: p.y, r: 52, fill: '#0b0e1d', stroke: '#6b4f24', 'stroke-width': 5, 'pointer-events': 'none' }, mid);
    }

    // Front: lamps, and each lever with its picture and engraving.
    for (let j = 0; j < LAMPS; j += 1) {
      const p = lampSpot(j);
      lampNodes.push(el('circle', { cx: p.x, cy: p.y, r: 42, fill: '#3a3550', 'data-lamp': j }, front));
    }
    for (let i = 0; i < LEVERS; i += 1) {
      const x = leverX(i);
      const g = el('g', { class: 'interactive', 'data-hint': `lever-${i}` }, front);
      el('rect', { x: x - 62, y: 110, width: 124, height: 720, rx: 16, fill: 'transparent' }, g);
      // The picture of the lamps this lever changes.
      for (let j = 0; j < LAMPS; j += 1) {
        const q = lampSpot(j);
        const mx = x + (q.x - DOME.x) * MINI.scale;
        const my = MINI.y + (q.y - DOME.y) * MINI.scale;
        const on = AFFECTS[i].includes(j);
        el('circle', { cx: mx.toFixed(1), cy: my.toFixed(1), r: on ? 8 : 6, fill: on ? '#f4c66a' : 'none', stroke: on ? '#fff1c4' : '#5a6099', 'stroke-width': 2, 'pointer-events': 'none' }, g);
      }
      el('rect', { x: x - 14, y: SLOT.top - 24, width: 28, height: SLOT.bottom - SLOT.top + 48, rx: 14, fill: '#120d18', stroke: '#6b4f24', 'stroke-width': 3, 'pointer-events': 'none' }, g);
      const knob = el('g', { 'pointer-events': 'none', 'data-knob': i }, g);
      el('circle', { r: 24, fill: '#d3a64f', stroke: '#8a6a2c', 'stroke-width': 4 }, knob);
      el('circle', { r: 8, fill: '#f6efd8' }, knob);
      knobs.push(knob);
      for (const [sx, sy] of placeStars(ENGRAVINGS[i], x, ENGRAVING_Y, 76)) el('circle', { cx: sx.toFixed(1), cy: sy.toFixed(1), r: 6, fill: '#fff1c4', 'pointer-events': 'none' }, g);
      asButton(g, `Cần gạt ${i + 1}`, () => toggle(i));
    }
    drawOwl(front, 90, 830, 0.8);

    const render = (set: ReadonlySet<number> = down) => {
      const arr = [...set];
      lampsLit(arr).forEach((on, j) => {
        lampNodes[j].setAttribute('fill', on ? '#f4c66a' : '#3a3550');
        if (on) lampNodes[j].setAttribute('filter', url(DEF.glow));
        else lampNodes[j].removeAttribute('filter');
      });
      knobs.forEach((k, i) => k.setAttribute('transform', `translate(${leverX(i)} ${set.has(i) ? SLOT.bottom : SLOT.top})`));
    };
    function toggle(i: number): void {
      if (down.has(i)) down.delete(i);
      else down.add(i);
      sound.knock();
      render();
      const lit = allLit([...down]);
      if (lit && !wasLit) sound.ding();
      wasLit = lit;
    }
    render();

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const flips = Array.from({ length: LEVERS }, (_, i) => i).filter((i) => START.includes(i) !== SOLUTION.includes(i));
        return [
          {
            note: 'Gạt một cần thì đổi trạng thái các đèn được tô trong hình nhỏ phía trên nó (sáng ↔ tối). Tìm cách đặt các cần để cả 7 đèn cùng sáng: thử gạt, nhìn đèn nào đổi, rồi lần ngược từ đèn ít cần ảnh hưởng nhất.',
            targets: [
              {
                x: leverX(flips[0]), y: SLOT.top, r: 50, verb: 'tap',
                act: (picture) => (p) => {
                  const set = new Set<number>(START);
                  flips.forEach((i, k) => {
                    if (p > (k + 0.5) / flips.length) {
                      if (set.has(i)) set.delete(i);
                      else set.add(i);
                    }
                  });
                  lampsLit([...set]).forEach((on, j) => {
                    const lamp = picture.querySelector(`[data-lamp="${j}"]`);
                    lamp?.setAttribute('fill', on ? '#f4c66a' : '#3a3550');
                  });
                  for (let i = 0; i < LEVERS; i += 1) {
                    picture.querySelector(`[data-knob="${i}"]`)?.setAttribute('transform', `translate(${leverX(i)} ${set.has(i) ? SLOT.bottom : SLOT.top})`);
                  }
                },
              },
            ],
            apply: () => {
              down.clear();
              SOLUTION.forEach((i) => down.add(i));
              wasLit = true;
              render();
            },
          },
          {
            note: 'Cả vòm đã sáng. Đọc các chòm khắc dưới những cần đang gạt xuống, từ trái sang phải.',
            targets: [...SOLUTION].sort((a, b) => a - b).map((i) => ({ x: leverX(i), y: ENGRAVING_Y, r: 60, verb: 'look' as const })),
            prepare: (picture) => {
              const overlay = picture.querySelector('.layer-overlay') ?? picture;
              [...SOLUTION].sort((a, b) => a - b).forEach((i, n) => {
                const badge = el('g', { transform: `translate(${leverX(i) + 34} ${ENGRAVING_Y + 50})`, 'pointer-events': 'none' }, overlay);
                el('circle', { r: 17, class: 'number-badge' }, badge);
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
