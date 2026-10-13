import { drawOwl } from '../core/owl';
import { GLYPHS } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, uid } from '../core/svg';
import { url } from '../core/defs';
import { clamp } from '../core/tween';
import { dist } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 2, level 5 — the owlet nest ("tổ cú con"). A wooden wall with nine dark hollows
 * in a 3×3 grid, laid out like the keypad, and a paper moth on a string. Bring the moth to
 * a hollow and whatever lives there peeks out and watches it, then ducks back a moment
 * after it leaves. Four hollows hold owlets of clearly different sizes and one holds a bat
 * hanging upside down; the rest are empty. The answer is the keys in the owlets' places,
 * smallest owlet first. Nothing is lit or marked.
 */

export const HOLLOW = { rx: 95, ry: 80 };
export const COLS = [560, 800, 1040] as const;
export const ROWS = [270, 470, 670] as const;
export const hollowCentre = (i: number): [number, number] => [COLS[i % 3], ROWS[Math.floor(i / 3)]];

/** Owlets by the grid place of their hollow, with the size of the head (1 is the middle size). */
export const OWLETS: readonly { hollow: number; size: number }[] = [
  { hollow: 3, size: 1.28 },
  { hollow: 5, size: 1.0 },
  { hollow: 2, size: 0.8 },
  { hollow: 7, size: 0.62 },
];
export const BAT_HOLLOW = 0;
export const HEAD_R = 46;

/**
 * The moth wakes the nearest hollow if it is within this distance of a point 60 below it,
 * so it hovers in the top of the hollow and does not cover the face of what peeks out.
 */
export const WAKE_R = 150;
export const WAKE_DY = 60;
export const MOTH_START: readonly [number, number] = [1360, 250];

/** The hollow the moth is drawing out right now, or -1. */
export function wokenHollow(mx: number, my: number): number {
  let best = -1;
  let bestD = WAKE_R;
  for (let i = 0; i < 9; i += 1) {
    const [cx, cy] = hollowCentre(i);
    const d = dist(mx, my + WAKE_DY, cx, cy);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/** The answer: the owlets' hollows from the smallest to the biggest. */
export const READING_HOLLOWS: readonly number[] = [...OWLETS].sort((a, b) => a.size - b.size).map((o) => o.hollow);

const PEEK_UP = 5; // per second while the moth is near
const PEEK_DOWN = 0.7; // per second after it leaves, so a quick sweep leaves several out at once

/** Moves each hollow's peek (0 hidden, 1 out) a step toward where it should be. */
export function stepPeek(peek: readonly number[], woken: number, dt: number): number[] {
  return peek.map((p, i) => clamp(p + (i === woken ? PEEK_UP : -PEEK_DOWN) * dt, 0, 1));
}

export const owletNest: PuzzleDef = {
  id: 'owlet-nest',
  name: 'Tổ cú con',
  answer: READING_HOLLOWS.map((h) => GLYPHS[h].id),
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const moth: [number, number] = [MOTH_START[0], MOTH_START[1]];
    let peek: number[] = new Array(9).fill(0);
    let held = false;
    let frame = 0;

    // Back: the attic wall.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#241a17' }, back);
    for (let x = 80; x < SCENE_W; x += 160) el('line', { x1: x, y1: -20, x2: x, y2: SCENE_H + 20, stroke: '#1a1210', 'stroke-width': 4 }, back);
    el('rect', { x: -60, y: 828, width: SCENE_W + 120, height: 120, fill: '#3a2a22' }, back);
    scene.grain('back', 0.4);

    // Mid: the nest board, nine hollows, the creatures inside them, and the moth.
    el('rect', { x: 400, y: 110, width: 800, height: 700, rx: 18, fill: '#5a3f2a', stroke: '#3a2818', 'stroke-width': 8 }, mid);
    for (const y of [330, 530]) el('line', { x1: 410, y1: y, x2: 1190, y2: y, stroke: '#4a3220', 'stroke-width': 3 }, mid);

    /** Creatures: group whose local origin is the hollow centre, shifted by `peek` and clipped to the hollow. */
    const mover: SVGGElement[] = [];
    const pupils: SVGGElement[][] = Array.from({ length: 9 }, () => []);
    const kinds: ('owlet' | 'bat' | 'empty')[] = Array.from({ length: 9 }, () => 'empty');
    OWLETS.forEach((o) => { kinds[o.hollow] = 'owlet'; });
    kinds[BAT_HOLLOW] = 'bat';
    const sizeOf = (i: number) => OWLETS.find((o) => o.hollow === i)?.size ?? 1;

    for (let i = 0; i < 9; i += 1) {
      const [cx, cy] = hollowCentre(i);
      const clipId = uid('hollow-clip');
      el('ellipse', { cx, cy, rx: HOLLOW.rx - 4, ry: HOLLOW.ry - 4 }, el('clipPath', { id: clipId }, scene.defs));
      el('ellipse', { cx, cy, rx: HOLLOW.rx, ry: HOLLOW.ry, fill: '#0d0908', stroke: '#7a5a3a', 'stroke-width': 8 }, mid);
      const inside = el('g', { 'clip-path': url(clipId), 'pointer-events': 'none' }, mid);
      const g = el('g', { transform: `translate(${cx} ${cy})`, 'data-hollow': i }, inside);
      mover[i] = g;
      const kind = kinds[i];
      if (kind === 'owlet') {
        const r = HEAD_R * sizeOf(i);
        el('ellipse', { cx: 0, cy: r * 0.9, rx: r * 1.1, ry: r * 0.9, fill: '#8a6a52' }, g);
        el('path', { d: `M${-r * 0.8} ${-r * 0.5} L${-r * 0.55} ${-r * 1.25} L${-r * 0.1} ${-r * 0.85} Z M${r * 0.8} ${-r * 0.5} L${r * 0.55} ${-r * 1.25} L${r * 0.1} ${-r * 0.85} Z`, fill: '#6b5240' }, g);
        el('circle', { r, fill: '#a98a66' }, g);
        el('ellipse', { cx: 0, cy: r * 0.3, rx: r * 0.6, ry: r * 0.5, fill: '#e8dcc0' }, g);
        for (const sx of [-1, 1]) {
          el('circle', { cx: sx * r * 0.42, cy: -r * 0.12, r: r * 0.36, fill: '#f6efd8' }, g);
          el('circle', { cx: sx * r * 0.42, cy: -r * 0.12, r: r * 0.24, fill: '#f4c66a' }, g);
          const pupil = el('g', {}, g);
          el('circle', { cx: sx * r * 0.42, cy: -r * 0.12, r: r * 0.13, fill: '#1a1424' }, pupil);
          pupils[i].push(pupil);
        }
        el('path', { d: `M${-r * 0.1} ${r * 0.12} L${r * 0.1} ${r * 0.12} L0 ${r * 0.3} Z`, fill: '#e0a948' }, g);
      } else if (kind === 'bat') {
        // Hangs upside down from the top of its hollow: pointed ears, tiny eyes, folded wings.
        el('ellipse', { cx: 0, cy: -50, rx: 30, ry: 38, fill: '#3b2b4a' }, g);
        el('path', { d: 'M-34 -66 Q-70 -20 -26 10 Q-18 -30 -18 -66 Z M34 -66 Q70 -20 26 10 Q18 -30 18 -66 Z', fill: '#2c2038' }, g);
        el('circle', { cx: 0, cy: -18, r: 24, fill: '#47345a' }, g);
        el('path', { d: 'M-22 -34 L-30 -64 L-8 -42 Z M22 -34 L30 -64 L8 -42 Z', fill: '#47345a' }, g);
        for (const sx of [-1, 1]) el('circle', { cx: sx * 9, cy: -18, r: 3.5, fill: '#f3e6c8' }, g);
        el('path', { d: 'M-5 -8 L5 -8 L0 -2 Z', fill: '#c98aa0' }, g);
      }
    }

    // The moth hangs on a string from the top of the scene.
    const string = el('line', { stroke: '#8a6a48', 'stroke-width': 3, 'pointer-events': 'none' }, mid);
    const mothNode = el('g', { class: 'moth interactive', tabindex: 0, role: 'button', 'aria-label': 'Con bướm đêm', 'data-hint': 'moth' }, mid);
    el('circle', { r: 56, fill: 'transparent' }, mothNode);
    el('ellipse', { cx: -26, cy: -6, rx: 28, ry: 18, fill: '#e8dcc0', stroke: '#b8a98a', 'stroke-width': 3, transform: 'rotate(-18 -26 -6)' }, mothNode);
    el('ellipse', { cx: 26, cy: -6, rx: 28, ry: 18, fill: '#e8dcc0', stroke: '#b8a98a', 'stroke-width': 3, transform: 'rotate(18 26 -6)' }, mothNode);
    el('ellipse', { cx: -18, cy: 12, rx: 16, ry: 11, fill: '#d6c7a3', transform: 'rotate(18 -18 12)' }, mothNode);
    el('ellipse', { cx: 18, cy: 12, rx: 16, ry: 11, fill: '#d6c7a3', transform: 'rotate(-18 18 12)' }, mothNode);
    el('ellipse', { cx: 0, cy: 2, rx: 6, ry: 18, fill: '#8a7658' }, mothNode);

    drawOwl(front, 220, 790, 0.9);

    const render = () => {
      mothNode.setAttribute('transform', `translate(${moth[0].toFixed(1)} ${moth[1].toFixed(1)})`);
      string.setAttribute('x1', moth[0].toFixed(1));
      string.setAttribute('y1', '0');
      string.setAttribute('x2', moth[0].toFixed(1));
      string.setAttribute('y2', (moth[1] - 22).toFixed(1));
      for (let i = 0; i < 9; i += 1) {
        const [cx, cy] = hollowCentre(i);
        const kind = kinds[i];
        if (kind === 'empty') continue;
        const r = kind === 'owlet' ? HEAD_R * sizeOf(i) : 40;
        const hidden = HOLLOW.ry + r * 1.5 + 30;
        const y = kind === 'owlet' ? 16 + (1 - peek[i]) * hidden : -(1 - peek[i]) * hidden;
        mover[i].setAttribute('transform', `translate(${cx} ${(cy + y).toFixed(1)})`);
        // Eyes follow the moth.
        const dx = clamp(moth[0] - cx, -160, 160) / 160;
        const dy = clamp(moth[1] - (cy + y), -160, 160) / 160;
        const reach = (HEAD_R * sizeOf(i)) * 0.1;
        for (const p of pupils[i]) p.setAttribute('transform', `translate(${(dx * reach).toFixed(1)} ${(dy * reach).toFixed(1)})`);
      }
    };

    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!held) {
        const next = stepPeek(peek, wokenHollow(moth[0], moth[1]), dt);
        if (next.some((p, i) => Math.abs(p - peek[i]) > 0.001)) {
          peek = next;
          render();
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    let grab = [0, 0];
    scene.draggable(mothNode, {
      start: (p) => {
        grab = [p.x - moth[0], p.y - moth[1]];
        held = false;
      },
      move: (p) => {
        moth[0] = clamp(p.x - grab[0], 40, SCENE_W - 40);
        moth[1] = clamp(p.y - grab[1], 80, SCENE_H - 60);
        render();
      },
      end: () => sound.paper(),
    });
    mothNode.addEventListener('keydown', (event) => {
      const moves: Record<string, [number, number]> = { ArrowLeft: [-40, 0], ArrowRight: [40, 0], ArrowUp: [0, -40], ArrowDown: [0, 40] };
      const m = moves[event.key];
      if (!m) return;
      event.preventDefault();
      moth[0] = clamp(moth[0] + m[0], 40, SCENE_W - 40);
      moth[1] = clamp(moth[1] + m[1], 80, SCENE_H - 60);
      render();
    });
    render();

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const first = hollowCentre(READING_HOLLOWS[0]);
        return [
          {
            note: 'Kéo con bướm tới từng hốc: hốc nào có cú con thì nó thò đầu ra nhìn theo. Làm tương tự với các hốc còn lại.',
            targets: [{
              x: MOTH_START[0], y: MOTH_START[1], r: 60, verb: 'drag', to: { x: first[0], y: first[1] - WAKE_DY }, object: '[data-hint="moth"]',
            }],
            apply: () => {
              moth[0] = MOTH_START[0];
              moth[1] = MOTH_START[1];
              peek = peek.map((_, i) => (kinds[i] === 'owlet' || kinds[i] === 'bat' ? 1 : 0));
              held = true;
              render();
            },
          },
          {
            note: 'Cú con nhỏ nhất đọc trước, rồi lớn dần (con dơi treo ngược không tính). Hốc ở vị trí nào thì bấm phím ở vị trí đó.',
            targets: READING_HOLLOWS.map((h) => ({ x: hollowCentre(h)[0], y: hollowCentre(h)[1], r: 110, verb: 'look' as const })),
          },
        ];
      },
      destroy: () => cancelAnimationFrame(frame),
    };
  },
};
