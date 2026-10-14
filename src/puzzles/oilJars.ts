import { drawOwl } from '../core/owl';
import type { GlyphId } from '../core/glyphs';
import { placeStars } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el, resetIcon, undoIcon } from '../core/svg';
import { tween } from '../core/tween';
import { starfield } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 4, level 3 — the oil jars ("bình dầu đèn"). Three jars: the big lamp jar (with a
 * flame on top) starts full, the middle and small jars start empty, and there is no tap and no
 * drain. Tap one jar and then another to pour from the first into the second until the first
 * runs dry or the second is full. Each jar has a tick for every unit it holds. A recipe sheet
 * shows four levels of the lamp jar drawn as a filled jar; whenever the lamp jar holds exactly
 * such a level, the constellation of that recipe window shows and stays. Some levels need many
 * pours back and forth. The answer is the four constellations of the sheet, left to right, top
 * to bottom.
 */

export const CAPS: readonly number[] = [8, 5, 3];
export const START: readonly number[] = [8, 0, 0];
/** The recipe levels of the lamp jar, in the order of the sheet. */
export const TARGETS: readonly number[] = [4, 1, 7, 2];
/** The constellation in each recipe window: the answer, in sheet order. */
export const GLYPHS_BY_SLOT: readonly GlyphId[] = ['hook', 'triangle', 'belt', 'crown'];
export const READING_ORDER: readonly GlyphId[] = GLYPHS_BY_SLOT;

/** Two pouring orders that, together, pass through every recipe level (jar numbers: 0 lamp, 1 middle, 2 small). */
export const SEQUENCE_A: readonly (readonly [number, number])[] = [[0, 1], [1, 2], [2, 0], [1, 2], [0, 1], [1, 2], [2, 0]];
export const SEQUENCE_B: readonly (readonly [number, number])[] = [[0, 2], [2, 1], [0, 2], [2, 1], [1, 0]];

/** Pours jar `from` into jar `to` until `from` is empty or `to` is full; null when nothing moves. */
export function pour(state: readonly number[], from: number, to: number): number[] | null {
  if (from === to || state[from] === 0 || state[to] >= CAPS[to]) return null;
  const moved = Math.min(state[from], CAPS[to] - state[to]);
  const next = [...state];
  next[from] -= moved;
  next[to] += moved;
  return next;
}

/** The pourings of a sequence, as the list of states from the start through each pour. */
export function run(seq: readonly (readonly [number, number])[], from: readonly number[] = START): number[][] {
  const states = [[...from]];
  for (const [a, b] of seq) {
    const next = pour(states[states.length - 1], a, b);
    if (!next) throw new Error('impossible pour');
    states.push(next);
  }
  return states;
}

/** Recipe windows whose level the lamp jar holds exactly. */
export const levelsAt = (state: readonly number[]): number[] => TARGETS.flatMap((t, i) => (t === state[0] ? [i] : []));

// ── Layout (scene units) ────────────────────────────────────────────────────────────────────
const UNIT = 56;
const FLOOR = 790;
export const JARS = [
  { x: 190, w: 170 },
  { x: 440, w: 140 },
  { x: 650, w: 120 },
];
const SHEET = { x: 850, y: 130, w: 715, h: 520 };
const SLOT = { w: 320, h: 220, gx: 25, gy: 20 };
const slotOrigin = (i: number): { x: number; y: number } => ({
  x: SHEET.x + 25 + (i % 2) * (SLOT.w + SLOT.gx),
  y: SHEET.y + 25 + Math.floor(i / 2) * (SLOT.h + SLOT.gy),
});
const MINI_UNIT = 20;

export const oilJars: PuzzleDef = {
  id: 'oil-jars',
  name: 'Bình dầu đèn',
  answer: [...READING_ORDER],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    let state: number[] = [...START];
    let shown: number[] = [...START];
    let selected = -1;
    const seen = new Set<number>();
    const history: { state: number[] }[] = [];
    let cancel: () => void = () => undefined;
    const oils: SVGRectElement[] = [];
    const jarNodes: SVGGElement[] = [];
    const slotGlyphs: SVGGElement[] = [];

    // Back: the workshop wall and its table.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#14172b' }, back);
    starfield(back, { x: 0, y: 0, w: SCENE_W, h: SCENE_H }, 50, 5303);
    el('rect', { x: -60, y: FLOOR, width: SCENE_W + 120, height: 160, fill: '#2a1f1a' }, back);
    scene.grain('back', 0.45);

    // Mid: the recipe sheet and its windows.
    el('rect', { x: SHEET.x, y: SHEET.y, width: SHEET.w, height: SHEET.h, rx: 20, fill: '#241f33', stroke: '#6b4f24', 'stroke-width': 6, 'pointer-events': 'none' }, mid);
    TARGETS.forEach((t, i) => {
      const o = slotOrigin(i);
      const g = el('g', { transform: `translate(${o.x} ${o.y})`, 'pointer-events': 'none' }, mid);
      el('rect', { width: SLOT.w, height: SLOT.h, rx: 14, fill: '#2f2942', stroke: '#4a3a60', 'stroke-width': 3 }, g);
      // The lamp jar, drawn small, filled to this level.
      const jx = 36;
      const jb = SLOT.h - 30;
      const jh = CAPS[0] * MINI_UNIT;
      el('rect', { x: jx, y: jb - jh, width: 62, height: jh, rx: 6, fill: '#1c1626', stroke: '#d3a64f', 'stroke-width': 3 }, g);
      el('rect', { x: jx + 2, y: jb - t * MINI_UNIT, width: 58, height: t * MINI_UNIT, fill: '#e0a948' }, g);
      for (let k = 1; k < CAPS[0]; k += 1) el('line', { x1: jx, y1: jb - k * MINI_UNIT, x2: jx + 12, y2: jb - k * MINI_UNIT, stroke: '#f6efd8', 'stroke-width': 2 }, g);
      el('path', { d: `M${jx + 31} ${jb - jh - 6} q-9 -12 0 -24 q9 12 0 24 Z`, fill: '#f4c66a' }, g);
      // The window that shows the constellation once the level has been reached.
      el('rect', { x: 130, y: 30, width: 164, height: 164, rx: 14, fill: '#0b0e1d', stroke: '#6b4f24', 'stroke-width': 4 }, g);
      const glyph = el('g', { 'pointer-events': 'none' }, g);
      for (const [x, y] of placeStars(GLYPHS_BY_SLOT[i], 212, 112, 100)) el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 8, fill: '#fff1c4' }, glyph);
      glyph.style.display = 'none';
      slotGlyphs.push(glyph);
    });

    // Front: the three jars and the buttons.
    CAPS.forEach((cap, j) => {
      const { x, w } = JARS[j];
      const h = cap * UNIT;
      const g = el('g', { class: 'interactive', 'data-hint': `jar-${j}` }, front);
      el('rect', { x: x - w / 2 - 20, y: FLOOR - h - 90, width: w + 40, height: h + 100, fill: 'transparent' }, g);
      const body = el('g', { 'pointer-events': 'none' }, g);
      el('rect', { x: x - w / 2, y: FLOOR - h, width: w, height: h, rx: 10, fill: '#1c1626', stroke: '#d3a64f', 'stroke-width': 5 }, body);
      const oil = el('rect', { x: x - w / 2 + 3, width: w - 6, fill: '#e0a948', 'data-oil': j }, body);
      oils.push(oil);
      for (let k = 1; k < cap; k += 1) {
        el('line', { x1: x - w / 2, y1: FLOOR - k * UNIT, x2: x - w / 2 + 22, y2: FLOOR - k * UNIT, stroke: '#f6efd8', 'stroke-width': 3 }, body);
      }
      if (j === 0) {
        el('rect', { x: x - 10, y: FLOOR - h - 34, width: 20, height: 34, rx: 4, fill: '#8a6a48' }, body);
        el('path', { d: `M${x} ${FLOOR - h - 40} q-18 -26 0 -54 q18 28 0 54 Z`, fill: '#f4c66a', stroke: '#fff1c4', 'stroke-width': 3 }, body);
      }
      jarNodes.push(g);
      asButton(g, j === 0 ? 'Bình đèn (lớn)' : j === 1 ? 'Bình vừa' : 'Bình nhỏ', () => tap(j));
    });
    const button = (x: number, y: number, label: string, draw: (g: SVGGElement) => void, onTap: () => void) => {
      const g = el('g', { class: 'interactive', transform: `translate(${x} ${y})` }, front);
      el('circle', { r: 84, fill: 'transparent' }, g);
      el('circle', { r: 62, fill: '#241f33', stroke: '#6b4f24', 'stroke-width': 5, 'pointer-events': 'none' }, g);
      const art = el('g', { transform: 'scale(1.25)', fill: 'none', stroke: '#f6efd8', 'stroke-width': 5.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'pointer-events': 'none' }, g);
      draw(art);
      asButton(g, label, onTap);
    };
    button(980, 770, 'Hoàn tác', (g) => { undoIcon(g); }, () => undo());
    button(1180, 770, 'Đặt lại từ đầu', (g) => { resetIcon(g); }, () => reset());
    drawOwl(front, 1470, 846, 0.8);

    const paint = () => {
      oils.forEach((oil, j) => {
        const h = Math.max(0, shown[j] * UNIT - 3);
        oil.setAttribute('y', (FLOOR - 3 - h).toFixed(1));
        oil.setAttribute('height', h.toFixed(1));
        oil.style.display = shown[j] > 0.01 ? '' : 'none';
      });
      jarNodes.forEach((g, j) => g.setAttribute('transform', `translate(0 ${j === selected ? -16 : 0})`));
      slotGlyphs.forEach((g, i) => { g.style.display = seen.has(i) ? '' : 'none'; });
    };
    const settle = (animate: boolean) => {
      cancel();
      const from = [...shown];
      const to = [...state];
      if (!animate) {
        shown = to;
        paint();
        return;
      }
      cancel = tween(420, (k) => { shown = from.map((v, i) => v + (to[i] - v) * k); paint(); });
    };
    function tap(j: number): void {
      if (selected < 0) {
        if (state[j] === 0) return;
        selected = j;
        sound.tick();
        paint();
        return;
      }
      const from = selected;
      selected = -1;
      if (from === j) {
        paint();
        return;
      }
      const next = pour(state, from, j);
      if (!next) {
        paint();
        return;
      }
      history.push({ state });
      state = next;
      sound.paper();
      const before = seen.size;
      levelsAt(state).forEach((i) => seen.add(i));
      settle(true);
      if (seen.size > before) sound.ding();
    }
    function undo(): void {
      selected = -1;
      const prev = history.pop();
      if (!prev) {
        paint();
        return;
      }
      // The windows already read stay lit: only the jars go back.
      state = prev.state;
      sound.paper();
      settle(true);
    }
    function reset(): void {
      selected = -1;
      history.length = 0;
      state = [...START];
      // The windows already lit stay lit: what has been read is read.
      sound.paper();
      settle(true);
    }
    paint();

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const a = run(SEQUENCE_A);
        const b = run(SEQUENCE_B);
        const jarSpot = (j: number) => ({ x: JARS[j].x, y: FLOOR - CAPS[j] * UNIT * 0.5 });
        /** Shows the jars of a sequence of states as the progress goes 0..1 (picture copy of the scene). */
        const playStates = (states: readonly (readonly number[])[]) => (picture: SVGSVGElement) => (p: number) => {
          const at = p * (states.length - 1);
          const i = Math.min(states.length - 2, Math.floor(at));
          const k = at - i;
          CAPS.forEach((_, j) => {
            const level = states[i][j] + (states[i + 1][j] - states[i][j]) * k;
            const oil = picture.querySelector(`[data-oil="${j}"]`);
            const h = Math.max(0, level * UNIT - 3);
            oil?.setAttribute('y', (FLOOR - 3 - h).toFixed(1));
            oil?.setAttribute('height', h.toFixed(1));
            (oil as SVGElement | null)?.style.setProperty('display', level > 0.01 ? '' : 'none');
          });
        };
        return [
          {
            note: 'Chạm một bình rồi chạm bình kia để rót cho tới khi bình nguồn cạn hoặc bình đích đầy. Rót qua lại thế này 7 lần (lớn → vừa → nhỏ → lớn → …) thì bình đèn có lần lượt 3, 6, 1 rồi 4 phần dầu; mỗi mức trùng ô công thức thì chòm hiện ra.',
            targets: [{ x: jarSpot(0).x, y: jarSpot(0).y, r: 70, verb: 'tap', act: playStates(a) }],
            apply: () => {
              state = [...a[a.length - 1]];
              a.forEach((s) => levelsAt(s).forEach((i) => seen.add(i)));
              settle(false);
            },
          },
          {
            note: 'Bắt đầu lại từ bình đầy, rót lớn → nhỏ, nhỏ → vừa, lớn → nhỏ, nhỏ → vừa, vừa → lớn thì bình đèn có 5, 2 rồi 7 phần dầu. Đủ bốn ô thì xong.',
            targets: [{ x: jarSpot(0).x, y: jarSpot(0).y, r: 70, verb: 'tap', act: playStates(b) }],
            apply: () => {
              state = [...b[b.length - 1]];
              b.forEach((s) => levelsAt(s).forEach((i) => seen.add(i)));
              settle(false);
            },
          },
          {
            note: 'Đọc bốn chòm trong các ô công thức, từ trái sang phải rồi từ trên xuống.',
            targets: TARGETS.map((_, i) => ({ x: slotOrigin(i).x + 212, y: slotOrigin(i).y + 112, r: 100, verb: 'look' as const })),
            prepare: (picture) => {
              const overlay = picture.querySelector('.layer-overlay') ?? picture;
              TARGETS.forEach((_, i) => {
                const o = slotOrigin(i);
                const badge = el('g', { transform: `translate(${o.x + 286} ${o.y + 24})`, 'pointer-events': 'none' }, overlay);
                el('circle', { r: 17, class: 'number-badge' }, badge);
                el('text', { y: 1, class: 'number-text' }, badge).textContent = String(i + 1);
              });
            },
          },
        ];
      },
      destroy: () => cancel(),
    };
  },
};
