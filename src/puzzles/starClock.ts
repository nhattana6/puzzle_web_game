import { drawOwl } from '../core/owl';
import type { GlyphId } from '../core/glyphs';
import { GLYPHS, glyph, placeStars } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el } from '../core/svg';
import { tween } from '../core/tween';
import { seeded } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 3, level 7 — the star clock ("đồng hồ sao"). Turn the hour hand of the big clock
 * and the sky behind the wall turns with it around the pole star; only a small window shows
 * what is passing: at most hours a constellation, upright, at a few hours nothing. Nine small
 * clocks hang in a 3×3 grid laid out exactly like the keypad, each showing an hour. Set the big
 * hand to a small clock's hour and see what the window shows: if it is the constellation that
 * sits in the same place on the keypad as that small clock sits in the grid, the clock matches.
 * Only four of the nine match; the answer is those four constellations, in the grid's reading
 * order (left to right, top to bottom).
 */

/** Hour (0–11) → constellation seen in the window at that hour. Hours 0, 6 and 10 are empty. */
export const SKY: Readonly<Record<number, GlyphId>> = {
  1: 'cross', 2: 'hook', 3: 'triangle', 4: 'arrow', 5: 'belt', 7: 'dipper', 8: 'square', 9: 'diamond', 11: 'crown',
};
/** The hour each small clock shows, in the grid's reading order (the keypad's order). */
export const CLOCK_HOURS: readonly number[] = [3, 11, 6, 8, 5, 7, 1, 10, 2];

/** Glyph of the keypad key at grid position `p` (0..8). */
export const keyAt = (p: number): GlyphId => GLYPHS[p].id;
/** What the window shows for the small clock at grid position `p`, or undefined for an empty hour. */
export const shownFor = (p: number): GlyphId | undefined => SKY[CLOCK_HOURS[p]];
/** Does the small clock at `p` show the constellation that sits at `p` on the keypad? */
export const matches = (p: number): boolean => shownFor(p) === keyAt(p);

/** Grid positions of the matching clocks, in reading order. */
export const READING_ORDER: readonly number[] = CLOCK_HOURS.flatMap((_, p) => (matches(p) ? [p] : []));

export const DEG_PER_HOUR = 30;
export const DIAL = { x: 270, y: 690, r: 170 };
/** The hand and its grip are drawn for a dial of radius 205 and scaled to fit. */
export const HAND_K = DIAL.r / 205;
export const POLE = { x: 1050, y: 780 };
/** Distance from the pole to the constellations on the sky disc, and the disc's own radius. */
export const SKY_R = 330;
export const DISC_R = 440;
export const GLYPH_SIZE = 130;
export const WINDOW = { x: 950, y: 350, w: 200, h: 200 };
export const WINDOW_C = { x: WINDOW.x + WINDOW.w / 2, y: WINDOW.y + WINDOW.h / 2 };
export const GRID = { x: 80, y: 60, cell: 128 };
export const cellCentre = (p: number): { x: number; y: number } => ({
  x: GRID.x + (p % 3) * GRID.cell + GRID.cell / 2,
  y: GRID.y + Math.floor(p / 3) * GRID.cell + GRID.cell / 2,
});
export const CLOCK_R = 48;

/** Angle of the hand, clockwise from straight up, at `hour`. */
export const handAngle = (hour: number): number => hour * DEG_PER_HOUR;
/** Where the constellation of `hour` sits on the sky disc, as the disc's own clockwise angle from the top. */
export const skyAngle = (hour: number): number => (360 - handAngle(hour)) % 360;

/**
 * Screen centre of the constellation of `hour` when the hand is at `theta` degrees (the disc is
 * turned by the same angle as the hand).
 */
export function skySpot(hour: number, theta: number): { x: number; y: number } {
  const a = ((skyAngle(hour) + theta) * Math.PI) / 180;
  return { x: POLE.x + Math.sin(a) * SKY_R, y: POLE.y - Math.cos(a) * SKY_R };
}

/** How much of the constellation of `hour` is inside the window at `theta` (0 none … 1 all). */
export function windowShare(hour: number, theta: number): number {
  const { x, y } = skySpot(hour, theta);
  const half = GLYPH_SIZE / 2;
  const w = Math.max(0, Math.min(x + half, WINDOW.x + WINDOW.w) - Math.max(x - half, WINDOW.x));
  const h = Math.max(0, Math.min(y + half, WINDOW.y + WINDOW.h) - Math.max(y - half, WINDOW.y));
  return (w * h) / (GLYPH_SIZE * GLYPH_SIZE);
}

/** The constellations seen whole in the window at `theta`. */
export function seenAt(theta: number): GlyphId[] {
  return Object.keys(SKY).map(Number).filter((h) => windowShare(h, theta) > 0.98).map((h) => SKY[h]);
}

const norm = (deg: number): number => ((deg % 360) + 360) % 360;
/** The hand's angle for a pointer at (x, y) around the dial centre. */
export const angleFromPointer = (x: number, y: number): number => norm((Math.atan2(x - DIAL.x, -(y - DIAL.y)) * 180) / Math.PI);
/** The nearest hour mark to an angle. */
export const nearestHour = (theta: number): number => Math.round(norm(theta) / DEG_PER_HOUR) % 12;

function drawFace(parent: Element, cx: number, cy: number, r: number): void {
  el('circle', { cx, cy, r, fill: '#f1e8d0', stroke: '#8a6a3c', 'stroke-width': Math.max(3, r / 22) }, parent);
  for (let h = 0; h < 12; h += 1) {
    const a = (h * Math.PI) / 6;
    const long = h % 3 === 0;
    const r1 = r * (long ? 0.72 : 0.84);
    el('line', {
      x1: (cx + Math.sin(a) * r1).toFixed(1), y1: (cy - Math.cos(a) * r1).toFixed(1),
      x2: (cx + Math.sin(a) * r * 0.92).toFixed(1), y2: (cy - Math.cos(a) * r * 0.92).toFixed(1),
      stroke: '#3a2a18', 'stroke-width': long ? r / 16 : r / 28, 'stroke-linecap': 'round',
    }, parent);
  }
}

export const starClock: PuzzleDef = {
  id: 'star-clock',
  name: 'Đồng hồ sao',
  answer: READING_ORDER.map((p) => keyAt(p)),
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    let theta = 0;
    let cancel: null | (() => void) = null;

    // Back: the sky disc (in the dark behind the wall), turned by the hand.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#1c1826' }, back);
    scene.grain('back', 0.4);
    const disc = el('g', { 'data-hint': 'disc', transform: `translate(${POLE.x} ${POLE.y})` }, back);
    const sky = el('g', {}, disc);
    el('circle', { r: DISC_R, fill: '#0d1430' }, sky);
    const rand = seeded(7301);
    for (let n = 0; n < 160; n += 1) {
      const a = rand() * Math.PI * 2;
      const rr = 150 + Math.sqrt(rand()) * (DISC_R - 160);
      el('circle', { cx: (Math.sin(a) * rr).toFixed(1), cy: (-Math.cos(a) * rr).toFixed(1), r: (1 + rand() * 1.8).toFixed(1), fill: '#f6efd8', opacity: (0.3 + rand() * 0.5).toFixed(2) }, sky);
    }
    // Constellations at each occupied hour: placed so they stand upright when they reach the window.
    for (const [hourText, id] of Object.entries(SKY)) {
      const hour = Number(hourText);
      const g = el('g', { transform: `rotate(${skyAngle(hour)}) translate(0 ${-SKY_R})` }, sky);
      for (const [x, y] of placeStars(id, 0, 0, GLYPH_SIZE)) el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 6, fill: '#fff3c8' }, g);
    }
    // A few loose stars at the empty hours: stars, but no constellation.
    for (const hour of [0, 6, 10]) {
      const g = el('g', { transform: `rotate(${skyAngle(hour)}) translate(0 ${-SKY_R})` }, sky);
      for (let k = 0; k < 3; k += 1) el('circle', { cx: ((rand() - 0.5) * 120).toFixed(1), cy: ((rand() - 0.5) * 120).toFixed(1), r: 5, fill: '#fff3c8', opacity: 0.55 }, g);
    }

    // Mid: the wall with its window, the pole star pin, the 3×3 grid of small clocks and the big dial.
    const hole = `M${WINDOW.x} ${WINDOW.y} V${WINDOW.y + WINDOW.h} H${WINDOW.x + WINDOW.w} V${WINDOW.y} Z`;
    el('path', { d: `M600 40 H1500 V960 H600 Z ${hole}`, 'fill-rule': 'evenodd', fill: '#4a3a30', stroke: '#2a1c14', 'stroke-width': 6 }, mid);
    el('rect', { x: WINDOW.x - 8, y: WINDOW.y - 8, width: WINDOW.w + 16, height: WINDOW.h + 16, rx: 6, fill: 'none', stroke: '#8a6a48', 'stroke-width': 12, 'pointer-events': 'none' }, mid);
    el('circle', { cx: POLE.x, cy: POLE.y - 28, r: 14, fill: '#e8c46a', stroke: '#8a6a1c', 'stroke-width': 4, 'pointer-events': 'none' }, mid);

    el('rect', { x: GRID.x - 10, y: GRID.y - 10, width: GRID.cell * 3 + 20, height: GRID.cell * 3 + 20, rx: 18, fill: '#2b2230', stroke: '#6b4f24', 'stroke-width': 5 }, mid);
    CLOCK_HOURS.forEach((h, p) => {
      const c = cellCentre(p);
      el('rect', { x: c.x - GRID.cell / 2 + 4, y: c.y - GRID.cell / 2 + 4, width: GRID.cell - 8, height: GRID.cell - 8, rx: 14, fill: '#3a2f44' }, mid);
      drawFace(mid, c.x, c.y, CLOCK_R);
      const a = (handAngle(h) * Math.PI) / 180;
      el('line', {
        x1: c.x, y1: c.y, x2: (c.x + Math.sin(a) * CLOCK_R * 0.62).toFixed(1), y2: (c.y - Math.cos(a) * CLOCK_R * 0.62).toFixed(1),
        stroke: '#b8382b', 'stroke-width': 6, 'stroke-linecap': 'round',
      }, mid);
      el('circle', { cx: c.x, cy: c.y, r: 5, fill: '#3a2a18' }, mid);
    });

    drawFace(mid, DIAL.x, DIAL.y, DIAL.r);
    // Front: the hour hand (a long pointer with a round grip) and the owl.
    const hand = el('g', { class: 'clock-hand interactive', tabindex: 0, role: 'slider', 'aria-label': 'Kim giờ', 'aria-valuemin': 0, 'aria-valuemax': 359, 'data-hint': 'hand' }, front);
    const art = el('g', { transform: `scale(${HAND_K.toFixed(3)})` }, hand);
    el('path', { d: 'M-9 18 L-5 -150 L0 -172 L5 -150 L9 18 Z', fill: '#2b2118', stroke: '#16100a', 'stroke-width': 3 }, art);
    el('circle', { cy: -150, r: 26, fill: '#b8382b', stroke: '#6a1c14', 'stroke-width': 5 }, art);
    el('circle', { r: 14, fill: '#d3a64f', stroke: '#7e5b1c', 'stroke-width': 4 }, art);
    el('rect', { x: -40, y: -190, width: 80, height: 210, fill: 'transparent' }, art);
    drawOwl(front, 540, 840, 0.55);

    const render = () => {
      hand.setAttribute('transform', `translate(${DIAL.x} ${DIAL.y}) rotate(${theta.toFixed(1)})`);
      hand.setAttribute('aria-valuenow', theta.toFixed(0));
      sky.setAttribute('transform', `rotate(${theta.toFixed(1)})`);
    };
    const settleTo = (target: number, instant = false) => {
      cancel?.();
      cancel = null;
      const from = theta;
      let to = target;
      while (to - from > 180) to -= 360;
      while (to - from < -180) to += 360;
      if (instant) {
        theta = norm(to);
        render();
        return;
      }
      cancel = tween(180, (t) => {
        theta = norm(from + (to - from) * t);
        render();
        if (t >= 1) {
          const id = SKY[nearestHour(theta)];
          if (id) sound.note(id);
        }
      });
    };

    scene.draggable(hand, {
      start: () => {
        cancel?.();
        cancel = null;
      },
      move: (p) => {
        theta = angleFromPointer(p.x, p.y);
        render();
      },
      end: () => settleTo(nearestHour(theta) * DEG_PER_HOUR),
    });
    hand.addEventListener('keydown', (event) => {
      const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[event.key];
      if (!d) return;
      event.preventDefault();
      settleTo((nearestHour(theta) + d) * DEG_PER_HOUR);
    });
    render();

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const first = READING_ORDER[0];
        const hour = CLOCK_HOURS[first];
        const turn = handAngle(hour);
        return [
          {
            note: 'Chọn một đồng hồ nhỏ, đọc giờ của nó rồi kéo kim giờ lớn tới đúng giờ đó: bầu trời quay theo và khung cửa hiện một chòm (hoặc không có gì). Làm lần lượt với cả 9 đồng hồ.',
            targets: [{
              x: DIAL.x, y: DIAL.y - 150 * HAND_K, r: 60, verb: 'rotate', turn, object: '[data-hint="hand"]',
              act: (picture) => {
                const node = picture.querySelector('[data-hint="disc"] > g');
                return (p) => node?.setAttribute('transform', `rotate(${(turn * p).toFixed(1)})`);
              },
            }],
            apply: () => settleTo(turn, true),
          },
          {
            note: 'Lưới 9 đồng hồ nằm đúng như bàn phím. Đồng hồ khớp khi chòm trong khung là chòm ở cùng ô trên bàn phím. Chỉ 4 đồng hồ khớp; đọc chúng theo thứ tự lưới.',
            targets: [{ x: WINDOW_C.x, y: WINDOW_C.y, r: 120, verb: 'look' }],
            prepare: (picture) => {
              const overlay = picture.querySelector('.layer-overlay') ?? picture;
              const id = SKY[hour];
              const stars = placeStars(id, WINDOW_C.x, WINDOW_C.y, GLYPH_SIZE);
              for (const [a, b] of glyph(id).lines) {
                el('line', { x1: stars[a][0], y1: stars[a][1], x2: stars[b][0], y2: stars[b][1], class: 'hint-line', 'pointer-events': 'none' }, overlay);
              }
              READING_ORDER.forEach((p, n) => {
                const c = cellCentre(p);
                const b = el('g', { transform: `translate(${c.x + GRID.cell / 2 - 22} ${c.y - GRID.cell / 2 + 22})`, 'pointer-events': 'none' }, overlay);
                el('circle', { r: 15, class: 'number-badge' }, b);
                el('text', { y: 1, class: 'number-text' }, b).textContent = String(n + 1);
              });
            },
          },
        ];
      },
      destroy: () => cancel?.(),
    };
  },
};
