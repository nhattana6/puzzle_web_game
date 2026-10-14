import { drawOwl } from '../core/owl';
import type { GlyphId } from '../core/glyphs';
import { GLYPHS, glyph, placeStars } from '../core/glyphs';
import { url } from '../core/defs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el, uid } from '../core/svg';
import { tween } from '../core/tween';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 3, level 9 — the dough-figure cipher ("mật thư tò he"). A board shows three
 * example lines: each is three dough animals and, under a face-down card, the three
 * constellations they stand for. A fourth line of four animals is the message. Every animal
 * has a body pattern (striped, dotted, plain) and a number of legs (2, 4, 6), and stands for
 * the key of the 3×3 keypad whose row follows from the pattern and whose column follows from
 * the legs; the examples give the rule away only for some of the combinations, so it has to be
 * worked out, not looked up. The answer is the message line's constellations, left to right.
 */

export type Paint = 'stripes' | 'dots' | 'plain';
export const PAINTS: readonly Paint[] = ['stripes', 'dots', 'plain'];
export const LEGS: readonly number[] = [2, 4, 6];

export interface Figure {
  paint: Paint;
  legs: number;
}

/** Keypad row of each paint, and keypad column of each leg count (the hidden rule). */
export const ROW_OF_PAINT: Readonly<Record<Paint, number>> = { dots: 0, plain: 1, stripes: 2 };
export const COL_OF_LEGS: Readonly<Record<number, number>> = { 4: 0, 6: 1, 2: 2 };

/** The keypad key (0..8) a figure stands for. */
export const keyOf = (f: Figure): number => ROW_OF_PAINT[f.paint] * 3 + COL_OF_LEGS[f.legs];
export const glyphOf = (f: Figure): GlyphId => GLYPHS[keyOf(f)].id;

const F = (paint: Paint, legs: number): Figure => ({ paint, legs });

/** The example lines, translated under their cards. */
export const SAMPLES: readonly (readonly Figure[])[] = [
  [F('dots', 4), F('dots', 6), F('plain', 4)],
  [F('stripes', 2), F('plain', 2), F('dots', 2)],
  [F('stripes', 4), F('dots', 6), F('stripes', 2)],
];
/** The message to translate, left to right. */
export const MESSAGE: readonly Figure[] = [F('stripes', 6), F('dots', 4), F('plain', 6), F('stripes', 2)];

export const READING_ORDER: readonly number[] = MESSAGE.map((_, i) => i);

export const same = (a: Figure, b: Figure): boolean => a.paint === b.paint && a.legs === b.legs;

const BOARD = { x: 50, y: 70, w: 900, h: 760 };
const ROW_Y = (r: number): number => 190 + r * 230;
const SAMPLE_X = (k: number): number => 140 + k * 125;
const CELL_X = (k: number): number => 600 + k * 120;
const CARD = { x: 535, w: 370, h: 170 };
const MSG_X = (i: number): number => 1060 + i * 128;
const MSG_Y = 420;
const CHOM_SIZE = 78;

const INK = '#4a3320';
const BASE: Record<Paint, string> = { stripes: '#c0392b', dots: '#2f6fa8', plain: '#4a9a5a' };

/** A dough animal centred on (0, 0) in a 100 × 130 box, with its skewer below. */
function drawFigure(defs: Element, parent: Element, f: Figure): SVGGElement {
  const g = el('g', {}, parent);
  el('line', { x1: 0, y1: 20, x2: 0, y2: 78, stroke: '#a88a5a', 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
  const clipId = uid('tohe');
  const clip = el('clipPath', { id: clipId }, defs);
  const legs = el('g', { stroke: INK, 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
  if (f.legs === 2) {
    for (const x of [-10, 12]) el('line', { x1: x, y1: 14, x2: x, y2: 44 }, legs);
    el('ellipse', { cx: 0, cy: -2, rx: 34, ry: 26 }, clip);
    el('circle', { cx: 24, cy: -34, r: 16 }, clip);
    el('path', { d: 'M38 -36 L56 -30 L38 -26 Z', fill: '#e0a948', stroke: INK, 'stroke-width': 3 }, g);
  } else if (f.legs === 4) {
    for (const x of [-26, -10, 10, 26]) el('line', { x1: x, y1: 12, x2: x, y2: 42 }, legs);
    el('path', { d: 'M-34 -6 q-16 -8 -12 -26', fill: 'none', stroke: INK, 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
    el('ellipse', { cx: 0, cy: -4, rx: 38, ry: 22 }, clip);
    el('circle', { cx: 38, cy: -22, r: 15 }, clip);
  } else {
    for (const [x, y] of [[-24, 8], [0, 14], [24, 8]] as const) {
      el('line', { x1: x, y1: 4, x2: x - 14, y2: y + 26 }, legs);
      el('line', { x1: x, y1: 4, x2: x + 14, y2: y + 26 }, legs);
    }
    el('path', { d: 'M10 -32 q10 -18 22 -20 M-2 -32 q-6 -20 -18 -24', fill: 'none', stroke: INK, 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
    el('ellipse', { cx: 0, cy: -2, rx: 36, ry: 26 }, clip);
    el('circle', { cx: 0, cy: -34, r: 12 }, clip);
  }
  const art = el('g', { 'clip-path': url(clipId) }, g);
  el('rect', { x: -60, y: -70, width: 140, height: 120, fill: BASE[f.paint] }, art);
  if (f.paint === 'stripes') {
    for (let k = -80; k < 90; k += 14) el('line', { x1: k, y1: 40, x2: k + 40, y2: -70, stroke: '#f3d5c4', 'stroke-width': 5 }, art);
  } else if (f.paint === 'dots') {
    for (let y = -62; y < 36; y += 18) for (let x = -50 + ((y / 18) % 2 === 0 ? 0 : 9); x < 64; x += 18) el('circle', { cx: x, cy: y, r: 4.2, fill: '#f1f6ff' }, art);
  }
  // Outline and eye on top of the pattern.
  if (f.legs === 2) {
    el('ellipse', { cx: 0, cy: -2, rx: 34, ry: 26, fill: 'none', stroke: INK, 'stroke-width': 4 }, g);
    el('circle', { cx: 24, cy: -34, r: 16, fill: 'none', stroke: INK, 'stroke-width': 4 }, g);
    el('circle', { cx: 28, cy: -38, r: 3, fill: INK }, g);
  } else if (f.legs === 4) {
    el('ellipse', { cx: 0, cy: -4, rx: 38, ry: 22, fill: 'none', stroke: INK, 'stroke-width': 4 }, g);
    el('circle', { cx: 38, cy: -22, r: 15, fill: 'none', stroke: INK, 'stroke-width': 4 }, g);
    el('circle', { cx: 42, cy: -25, r: 3, fill: INK }, g);
  } else {
    el('ellipse', { cx: 0, cy: -2, rx: 36, ry: 26, fill: 'none', stroke: INK, 'stroke-width': 4 }, g);
    el('circle', { cx: 0, cy: -34, r: 12, fill: 'none', stroke: INK, 'stroke-width': 4 }, g);
    el('line', { x1: 0, y1: -24, x2: 0, y2: 22, stroke: INK, 'stroke-width': 3 }, g);
  }
  return g;
}

export const toheCipher: PuzzleDef = {
  id: 'tohe-cipher',
  name: 'Mật thư tò he',
  answer: MESSAGE.map((f) => glyphOf(f)),
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const open = SAMPLES.map(() => 0);
    const target = SAMPLES.map(() => 0);
    const cancels: (null | (() => void))[] = SAMPLES.map(() => null);
    const cards: SVGGElement[] = [];

    // Back: the fair at night.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#201a2c' }, back);
    el('rect', { x: -60, y: 830, width: SCENE_W + 120, height: 140, fill: '#33261f' }, back);
    scene.grain('back', 0.45);

    // Mid: the example board, and the stall counter with the message.
    el('rect', { x: BOARD.x, y: BOARD.y, width: BOARD.w, height: BOARD.h, rx: 18, fill: '#5a3f2a', stroke: '#3a2818', 'stroke-width': 6 }, mid);
    SAMPLES.forEach((line, r) => {
      const y = ROW_Y(r);
      el('rect', { x: BOARD.x + 20, y: y - 100, width: BOARD.w - 40, height: 200, rx: 12, fill: '#6f5035' }, mid);
      line.forEach((f, k) => {
        const g = drawFigure(scene.defs, mid, f);
        g.setAttribute('transform', `translate(${SAMPLE_X(k)} ${y})`);
      });
      el('path', { d: `M440 ${y} H490 M476 ${y - 14} L492 ${y} L476 ${y + 14}`, fill: 'none', stroke: '#f1e4be', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, mid);
      // The constellations the line stands for, under the card.
      el('rect', { x: CARD.x, y: y - CARD.h / 2, width: CARD.w, height: CARD.h, rx: 10, fill: '#241c34' }, mid);
      line.forEach((f, k) => {
        for (const [sx, sy] of placeStars(glyphOf(f), CELL_X(k), y, CHOM_SIZE)) el('circle', { cx: sx.toFixed(1), cy: sy.toFixed(1), r: 5.2, fill: '#fff3c8' }, mid);
      });
    });

    el('rect', { x: 980, y: 300, width: 520, height: 330, rx: 14, fill: '#3a2c3a', stroke: '#6b4f24', 'stroke-width': 5 }, mid);
    el('rect', { x: 980, y: 560, width: 520, height: 70, rx: 10, fill: '#5a3f2a' }, mid);
    MESSAGE.forEach((f, i) => {
      const g = drawFigure(scene.defs, mid, f);
      g.setAttribute('transform', `translate(${MSG_X(i)} ${MSG_Y}) scale(1.05)`);
      g.setAttribute('data-hint', `msg-${i}`);
    });

    // Front: the face-down cards over the translations, and the owl.
    SAMPLES.forEach((_, r) => {
      const y = ROW_Y(r);
      const card = el('g', { class: 'tohe-card interactive', 'data-hint': `card-${r}` }, front);
      el('rect', { x: CARD.x, y: y - CARD.h / 2, width: CARD.w, height: CARD.h, rx: 10, fill: '#e8d9b0', stroke: '#a89468', 'stroke-width': 4 }, card);
      for (let k = 0; k < 9; k += 1) {
        el('line', { x1: CARD.x + 20 + k * 40, y1: y - CARD.h / 2 + 12, x2: CARD.x + 60 + k * 40, y2: y + CARD.h / 2 - 12, stroke: '#c9b98a', 'stroke-width': 3 }, card);
      }
      el('circle', { cx: CARD.x + CARD.w / 2, cy: y, r: 20, fill: '#b8382b', stroke: '#6a1c14', 'stroke-width': 4 }, card);
      asButton(card, `Lật thẻ câu mẫu ${r + 1}`, () => toggle(r));
      cards.push(card);
    });
    drawOwl(front, 1130, 760, 0.7);

    const render = (r: number) => {
      cards[r].setAttribute('opacity', (1 - open[r]).toFixed(2));
      cards[r].setAttribute('pointer-events', open[r] > 0.5 ? 'none' : 'auto');
    };
    const toggle = (r: number) => {
      if (target[r] > 0.5) return;
      target[r] = 1;
      cancels[r]?.();
      const from = open[r];
      cancels[r] = tween(260, (t) => {
        open[r] = from + (1 - from) * t;
        render(r);
      });
      sound.paper();
    };
    SAMPLES.forEach((_, r) => render(r));

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => [
        {
          note: 'Chạm vào từng thẻ úp để lật xem chòm sao mà mỗi con tò he của câu mẫu đại diện.',
          targets: [{
            x: CARD.x + CARD.w / 2, y: ROW_Y(0), r: 80, verb: 'tap',
            act: (picture) => {
              const node = picture.querySelector('[data-hint="card-0"]');
              return (p) => node?.setAttribute('opacity', (1 - p).toFixed(2));
            },
          }],
          apply: () => {
            SAMPLES.forEach((_, r) => {
              cancels[r]?.();
              open[r] = 1;
              target[r] = 1;
              render(r);
            });
          },
        },
        {
          note: 'Hoa văn của con tò he cho biết hàng trên bàn phím (chấm: hàng trên, trơn: hàng giữa, vằn: hàng dưới), số chân cho biết cột (4 chân: trái, 6 chân: giữa, 2 chân: phải). Áp vào bốn con ở dòng thông điệp.',
          targets: MESSAGE.map((_, i) => ({ x: MSG_X(i), y: MSG_Y, r: 70, verb: 'look' as const })),
          prepare: (picture) => {
            const overlay = picture.querySelector('.layer-overlay') ?? picture;
            MESSAGE.forEach((f, i) => {
              const id = glyphOf(f);
              const cx = MSG_X(i);
              const cy = MSG_Y + 190;
              const stars = placeStars(id, cx, cy, 86);
              for (const [a, b] of glyph(id).lines) {
                el('line', { x1: stars[a][0], y1: stars[a][1], x2: stars[b][0], y2: stars[b][1], class: 'hint-line', 'pointer-events': 'none' }, overlay);
              }
              for (const [sx, sy] of stars) el('circle', { cx: sx.toFixed(1), cy: sy.toFixed(1), r: 6, fill: '#fff3c8', 'pointer-events': 'none' }, overlay);
              const badge = el('g', { transform: `translate(${cx} ${cy - 66})`, 'pointer-events': 'none' }, overlay);
              el('circle', { r: 16, class: 'number-badge' }, badge);
              el('text', { y: 1, class: 'number-text' }, badge).textContent = String(i + 1);
            });
          },
        },
      ],
      destroy: () => cancels.forEach((c) => c?.()),
    };
  },
};
