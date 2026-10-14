import { drawOwl } from '../core/owl';
import type { GlyphId } from '../core/glyphs';
import { glyph, placeStars } from '../core/glyphs';
import { url } from '../core/defs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el, uid } from '../core/svg';
import { tween } from '../core/tween';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 3, level 4 — the lantern stalls ("sạp đèn"). Four stalls stand in a row, each with
 * a patterned awning and one empty hook (its lantern was sold). Six customers queue below,
 * each holding a lantern in patterned wrapping paper. A customer's paper has the pattern of
 * the awning of the stall they bought from; two customers bought elsewhere (their patterns
 * are near misses of the awnings'). Tap a lantern to unwrap it and read the constellation
 * inside. The answer is the constellations of the lanterns each stall sold, stalls left to right.
 */

export type Pattern = 'slash' | 'backslash' | 'dots' | 'bigDots' | 'checks' | 'waves';

export interface CustomerDef {
  pattern: Pattern;
  glyph: GlyphId;
  /** Ink and clothes colours: deliberately unrelated to the stall's, only the pattern matches. */
  ink: string;
  coat: string;
}

/** Left to right on the stalls' row. */
export const STALLS: readonly { pattern: Pattern; ink: string }[] = [
  { pattern: 'slash', ink: '#b8382b' },
  { pattern: 'dots', ink: '#2f7a5a' },
  { pattern: 'checks', ink: '#7a4a9a' },
  { pattern: 'waves', ink: '#c07a1c' },
];

/** Left to right in the queue. */
export const CUSTOMERS: readonly CustomerDef[] = [
  { pattern: 'checks', glyph: 'triangle', ink: '#2d6a8f', coat: '#4d6a9a' },
  { pattern: 'backslash', glyph: 'crown', ink: '#b8382b', coat: '#9a5a4d' },
  { pattern: 'slash', glyph: 'dipper', ink: '#2d6a8f', coat: '#5a8a6a' },
  { pattern: 'waves', glyph: 'hook', ink: '#7a4a9a', coat: '#8a7a4d' },
  { pattern: 'bigDots', glyph: 'arrow', ink: '#2f7a5a', coat: '#6a4d8a' },
  { pattern: 'dots', glyph: 'cross', ink: '#c07a1c', coat: '#4d8a8a' },
];

/** Which stall's lantern this customer holds, or -1 when they bought elsewhere. */
export const stallOf = (customer: number): number => STALLS.findIndex((s) => s.pattern === CUSTOMERS[customer].pattern);

/** The answer: the customer of each stall, stalls left to right. */
export const READING_ORDER: readonly number[] = STALLS.map((s) => CUSTOMERS.findIndex((c) => c.pattern === s.pattern));

export const STALL_X = (i: number): number => 250 + i * 370;
export const CUSTOMER_X = (i: number): number => 160 + i * 256;
export const AWNING = { w: 330, y: 110, h: 120 };
export const LANTERN = { y: 500, rx: 46, ry: 58 };
const WRAP = { w: 104, h: 128 };
/** How far the paper falls when a lantern is unwrapped. */
const FALL = 235;
const PAPER = '#f4ead2';

/** Draws one tile of pattern `kind` filling a w×h box centred on (0, 0). */
export function drawPattern(defs: Element, parent: Element, kind: Pattern, w: number, h: number, ink: string, rx = 8): SVGGElement {
  const g = el('g', {}, parent);
  const clip = uid('pat');
  el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx }, el('clipPath', { id: clip }, defs));
  el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx, fill: PAPER, stroke: ink, 'stroke-width': 3 }, g);
  const art = el('g', { 'clip-path': url(clip), stroke: ink, fill: ink }, g);
  const sw = { 'stroke-width': 6, 'stroke-linecap': 'round' } as const;
  if (kind === 'slash' || kind === 'backslash') {
    const dir = kind === 'slash' ? 1 : -1;
    for (let k = -h; k < w + h; k += 22) {
      el('line', { x1: -w / 2 + k, y1: dir * (h / 2), x2: -w / 2 + k + h, y2: -dir * (h / 2), ...sw }, art);
    }
  } else if (kind === 'dots') {
    for (let y = -h / 2 + 10; y < h / 2; y += 20) for (let x = -w / 2 + 10 + (Math.round((y + h / 2) / 20) % 2) * 10; x < w / 2; x += 20) el('circle', { cx: x, cy: y, r: 4.5, stroke: 'none' }, art);
  } else if (kind === 'bigDots') {
    for (let y = -h / 2 + 18; y < h / 2; y += 38) for (let x = -w / 2 + 18 + (Math.round((y + h / 2) / 38) % 2) * 19; x < w / 2; x += 38) el('circle', { cx: x, cy: y, r: 10, stroke: 'none' }, art);
  } else if (kind === 'checks') {
    const s = 20;
    for (let y = -h / 2, r = 0; y < h / 2; y += s, r += 1) for (let x = -w / 2, c = 0; x < w / 2; x += s, c += 1) if ((r + c) % 2 === 0) el('rect', { x, y, width: s, height: s, stroke: 'none' }, art);
  } else {
    for (let y = -h / 2 + 12; y < h / 2 + 12; y += 22) {
      let d = `M${-w / 2 - 10} ${y}`;
      for (let x = -w / 2 - 10; x < w / 2 + 10; x += 20) d += ` q5 -10 10 0 q5 10 10 0`;
      el('path', { d, fill: 'none', 'stroke-width': 4, 'stroke-linecap': 'round' }, art);
    }
  }
  return g;
}

/** Transform of a wrapper that has fallen `p` of the way to the ground (0 = on the lantern). */
const wrapperAt = (x: number, p: number): string =>
  `translate(${x} ${(LANTERN.y + FALL * p).toFixed(1)}) scale(${(1 + 0.15 * p).toFixed(3)} ${(1 - 0.5 * p).toFixed(3)})`;

export const lanternStalls: PuzzleDef = {
  id: 'lantern-stalls',
  name: 'Sạp đèn',
  answer: READING_ORDER.map((i) => CUSTOMERS[i].glyph),
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const open = CUSTOMERS.map(() => 0);
    const target = CUSTOMERS.map(() => 0);
    const cancels: (null | (() => void))[] = CUSTOMERS.map(() => null);
    const wrappers: SVGGElement[] = [];

    // Back: the night market street.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#1e1b2c' }, back);
    el('rect', { x: -60, y: 780, width: SCENE_W + 120, height: 200, fill: '#34283a' }, back);
    for (let x = 60; x < SCENE_W; x += 110) el('line', { x1: x, y1: 800, x2: x - 20, y2: 900, stroke: '#2a2030', 'stroke-width': 4 }, back);
    scene.grain('back', 0.45);

    // Mid: the stalls, each with its awning and the hook where its lantern used to hang.
    STALLS.forEach((s, i) => {
      const x = STALL_X(i);
      for (const dx of [-AWNING.w / 2 + 10, AWNING.w / 2 - 10]) el('rect', { x: x + dx - 7, y: AWNING.y, width: 14, height: 330, fill: '#4a3424' }, mid);
      const awn = el('g', { transform: `translate(${x} ${AWNING.y + AWNING.h / 2})` }, mid);
      drawPattern(scene.defs, awn, s.pattern, AWNING.w, AWNING.h, s.ink, 10);
      el('rect', { x: x - AWNING.w / 2, y: AWNING.y + AWNING.h - 4, width: AWNING.w, height: 14, rx: 6, fill: '#5a3f2a' }, mid);
      el('line', { x1: x, y1: AWNING.y + AWNING.h + 10, x2: x, y2: 300, stroke: '#8a6a48', 'stroke-width': 4 }, mid);
      el('path', { d: `M${x} 300 q0 18 -12 14`, fill: 'none', stroke: '#8a6a48', 'stroke-width': 5, 'stroke-linecap': 'round' }, mid);
      el('ellipse', { cx: x, cy: 352, rx: 40, ry: 52, fill: 'none', stroke: '#3a3048', 'stroke-width': 3, 'stroke-dasharray': '7 7', opacity: 0.7 }, mid);
      el('rect', { x: x - AWNING.w / 2 + 6, y: 430, width: AWNING.w - 12, height: 30, rx: 6, fill: '#5a3f2a', stroke: '#3a2818', 'stroke-width': 3 }, mid);
    });

    // Front: the queue, each customer with a wrapped lantern.
    CUSTOMERS.forEach((c, i) => {
      const x = CUSTOMER_X(i);
      const person = el('g', { 'pointer-events': 'none' }, front);
      el('rect', { x: x - 38, y: 620, width: 76, height: 170, rx: 30, fill: c.coat }, person);
      el('circle', { cx: x, cy: 590, r: 32, fill: '#e8c9a0' }, person);
      el('circle', { cx: x - 11, cy: 586, r: 4, fill: '#2a1d14' }, person);
      el('circle', { cx: x + 11, cy: 586, r: 4, fill: '#2a1d14' }, person);
      el('line', { x1: x + 36, y1: 650, x2: x + 4, y2: LANTERN.y + 54, stroke: c.coat, 'stroke-width': 14, 'stroke-linecap': 'round' }, person);

      const lamp = el('g', { class: 'stall-lantern interactive', 'data-hint': `lantern-${i}` }, front);
      el('rect', { x: x - 70, y: LANTERN.y - 78, width: 140, height: 170, fill: 'transparent' }, lamp);
      el('rect', { x: x - 20, y: LANTERN.y - LANTERN.ry - 12, width: 40, height: 12, rx: 3, fill: '#4a2c1a' }, lamp);
      el('ellipse', { cx: x, cy: LANTERN.y, rx: LANTERN.rx, ry: LANTERN.ry, fill: '#b8452f', stroke: '#7a2a1c', 'stroke-width': 4 }, lamp);
      el('rect', { x: x - 20, y: LANTERN.y + LANTERN.ry, width: 40, height: 12, rx: 3, fill: '#4a2c1a' }, lamp);
      for (const [sx, sy] of placeStars(c.glyph, x, LANTERN.y, 66)) el('circle', { cx: sx.toFixed(1), cy: sy.toFixed(1), r: 6, fill: '#fff3c8' }, lamp);
      const wrap = el('g', { transform: wrapperAt(x, 0), 'data-hint': `wrap-${i}`, 'pointer-events': 'none' }, front);
      drawPattern(scene.defs, wrap, c.pattern, WRAP.w, WRAP.h, c.ink, 12);
      wrappers.push(wrap);
      asButton(lamp, `Đèn của khách ${i + 1}`, () => toggle(i));
    });

    drawOwl(front, 70, 850, 0.6);

    const render = (i: number) => wrappers[i].setAttribute('transform', wrapperAt(CUSTOMER_X(i), open[i]));
    const toggle = (i: number) => {
      target[i] = target[i] > 0.5 ? 0 : 1;
      cancels[i]?.();
      const from = open[i];
      cancels[i] = tween(320, (t) => {
        open[i] = from + (target[i] - from) * t;
        render(i);
      });
      sound.paper();
    };

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const first = READING_ORDER[0];
        return [
          {
            note: 'Chạm vào đèn để mở giấy gói và thấy chòm sao bên trong; tờ giấy rơi xuống chân khách. Làm tương tự với các đèn còn lại.',
            targets: [{
              x: CUSTOMER_X(first), y: LANTERN.y, r: 70, verb: 'tap',
              act: (picture) => {
                const node = picture.querySelector(`[data-hint="wrap-${first}"]`);
                return (p) => node?.setAttribute('transform', wrapperAt(CUSTOMER_X(first), p));
              },
            }],
            apply: () => {
              CUSTOMERS.forEach((_, i) => {
                cancels[i]?.();
                open[i] = 1;
                target[i] = 1;
                render(i);
              });
            },
          },
          {
            note: 'Khớp hoa văn tờ giấy với mái che của từng sạp (hai khách mua chỗ khác, hoa văn chỉ giống na ná). Đọc chòm trong đèn theo thứ tự các sạp từ trái sang phải.',
            targets: READING_ORDER.map((c) => ({ x: CUSTOMER_X(c), y: LANTERN.y, r: 80, verb: 'look' as const })),
            prepare: (picture) => {
              const overlay = picture.querySelector('.layer-overlay') ?? picture;
              READING_ORDER.forEach((c, n) => {
                const x = CUSTOMER_X(c);
                const stars = placeStars(CUSTOMERS[c].glyph, x, LANTERN.y, 66);
                for (const [a, b] of glyph(CUSTOMERS[c].glyph).lines) {
                  el('line', { x1: stars[a][0], y1: stars[a][1], x2: stars[b][0], y2: stars[b][1], class: 'hint-line', 'pointer-events': 'none' }, overlay);
                }
                const badge = el('g', { transform: `translate(${x} ${LANTERN.y - 96})`, 'pointer-events': 'none' }, overlay);
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
