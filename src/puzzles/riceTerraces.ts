import { url } from '../core/defs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el, uid } from '../core/svg';
import { tween } from '../core/tween';
import type { HintTarget, PuzzleDef } from './types';

/**
 * The rice-terrace channels ("mương nước ruộng bậc thang").
 * Bamboo pipe pieces sit on a grid; tap one to turn it a quarter. Water enters
 * from the jar on the left. The level finishes when water reaches every piece:
 * every pipe full and every small paddy flooded green.
 */

export const COLS = 7;
export const ROWS = 4;
export const N = 1;
export const E = 2;
export const S = 4;
export const W = 8;
/** Water enters this cell from its west side. */
export const SOURCE = { col: 0, row: 1 };

/** Openings of every piece once solved, row by row (N=1, E=2, S=4, W=8). */
export const SOLUTION: readonly number[] = [
  6, 14, 10, 10, 14, 10, 8,
  13, 3, 14, 8, 3, 8, 4,
  7, 8, 3, 14, 10, 12, 5,
  3, 10, 8, 3, 8, 3, 9,
];
/** Quarter turns each piece starts away from its solution. */
export const START_TURNS: readonly number[] = [
  2, 2, 1, 3, 1, 1, 1,
  1, 1, 2, 3, 2, 3, 3,
  3, 3, 1, 3, 3, 1, 3,
  3, 3, 3, 1, 2, 2, 3,
];

/** Turns a set of openings a quarter clockwise, `times` times. */
export function rotateMask(mask: number, times = 1): number {
  let m = mask;
  for (let i = 0; i < ((times % 4) + 4) % 4; i += 1) m = ((m << 1) | (m >> 3)) & 15;
  return m;
}

export const masksFor = (turns: readonly number[]): number[] => SOLUTION.map((m, i) => rotateMask(m, turns[i]));

/** Cells water reaches from the jar, for the given openings. */
export function watered(masks: readonly number[]): Set<number> {
  const start = SOURCE.row * COLS + SOURCE.col;
  const reached = new Set<number>();
  if (!(masks[start] & W)) return reached;
  const queue = [start];
  reached.add(start);
  const steps: [number, number, number, number][] = [[0, -1, N, S], [1, 0, E, W], [0, 1, S, N], [-1, 0, W, E]];
  while (queue.length) {
    const cell = queue.shift()!;
    const c = cell % COLS;
    const r = Math.floor(cell / COLS);
    for (const [dx, dy, out, inn] of steps) {
      const nc = c + dx;
      const nr = r + dy;
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
      const next = nr * COLS + nc;
      if (reached.has(next) || !(masks[cell] & out) || !(masks[next] & inn)) continue;
      reached.add(next);
      queue.push(next);
    }
  }
  return reached;
}

export const isFieldWatered = (turns: readonly number[]): boolean => watered(masksFor(turns)).size === COLS * ROWS;

/**
 * Each hint fixes one piece: a wrongly turned piece next to the water already
 * flowing (so it is the next one that matters), else any wrongly turned piece.
 */
export function nextPipeHint(turns: readonly number[], revealed: readonly number[]): number | null {
  const masks = masksFor(turns);
  const wet = watered(masks);
  const wrong = SOLUTION.map((_, i) => i).filter((i) => masks[i] !== SOLUTION[i] && !revealed.includes(i));
  const touching = (i: number) => {
    const c = i % COLS;
    const r = Math.floor(i / COLS);
    return [[c - 1, r], [c + 1, r], [c, r - 1], [c, r + 1]].some(([x, y]) => x >= 0 && x < COLS && y >= 0 && y < ROWS && wet.has(y * COLS + x));
  };
  return wrong.find((i) => wet.has(i) || touching(i)) ?? wrong[0] ?? null;
}

const CELL = 150;
const X0 = (SCENE_W - COLS * CELL) / 2 + 40;
const Y0 = 210;
const centre = (i: number) => ({ x: X0 + (i % COLS) * CELL + CELL / 2, y: Y0 + Math.floor(i / COLS) * CELL + CELL / 2 });
const isPaddy = (i: number) => [1, 2, 4, 8].includes(SOLUTION[i]);

export const riceTerraces: PuzzleDef = {
  id: 'rice-terraces',
  name: 'Mương nước ruộng bậc thang',
  guide: {
    goal: 'Xoay các ống tre để nước từ chum chảy tới mọi đoạn ống và mọi thửa ruộng.',
    steps: [
      { icon: 'rotate', text: 'Bấm vào một ô để xoay ống tre 90°.' },
      { icon: 'drag', text: 'Nước chảy từ chum bên trái qua những đầu ống nối khớp nhau.' },
      { icon: 'done', text: 'Ống có nước chuyển xanh, ruộng có nước hoá xanh lá. Nước tới được tất cả các ô là qua màn.' },
    ],
    tip: 'Bắt đầu từ các thửa ruộng ở góc: mỗi thửa chỉ có một đầu ống, nên chỉ có một hướng đúng.',
  },
  fireflies: [
    { id: 'rice-terraces/hill', layer: 'back', x: 1460, y: 80 },
    { id: 'rice-terraces/jar', layer: 'mid', x: 90, y: 840 },
  ],
  mount({ scene, sound, solved }) {
    const { back, mid, front } = scene.layers;
    const turns = [...START_TURNS];
    const shownAngle = turns.map((t) => t * 90);
    const hinted: number[] = [];
    const cancels: (() => void)[] = [];

    // Back: misty hills and terraces.
    const skyId = uid('terrace-sky');
    const sky = el('linearGradient', { id: skyId, x1: 0, y1: 0, x2: 0, y2: 1 }, scene.defs);
    el('stop', { offset: 0, 'stop-color': '#dfe6d6' }, sky);
    el('stop', { offset: 1, 'stop-color': '#b9c9a4' }, sky);
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: url(skyId) }, back);
    el('path', { d: 'M-60 200 Q300 60 640 170 Q980 40 1660 160 L1660 960 L-60 960 Z', fill: '#8fa77a', opacity: 0.6 }, back);
    for (let i = 0; i < 6; i += 1) {
      el('path', { d: `M-60 ${150 + i * 34} Q800 ${90 + i * 40} 1660 ${140 + i * 34}`, fill: 'none', stroke: '#6f8f55', 'stroke-width': 3, opacity: 0.35 }, back);
    }
    scene.grain('back', 0.5);

    // Mid: the earthen bank holding the grid, and the water jar.
    el('rect', { x: X0 - 22, y: Y0 - 22, width: COLS * CELL + 44, height: ROWS * CELL + 44, rx: 14, fill: '#7a5a3a' }, mid);
    for (let i = 0; i < COLS * ROWS; i += 1) {
      const { x, y } = centre(i);
      el('rect', { x: x - CELL / 2 + 4, y: y - CELL / 2 + 4, width: CELL - 8, height: CELL - 8, rx: 6, fill: '#9c7a52' }, mid);
    }
    const jar = centre(SOURCE.row * COLS + SOURCE.col);
    el('path', { d: `M${jar.x - CELL / 2 - 30} ${jar.y} H${jar.x - CELL / 2 + 6}`, stroke: '#4f8fbf', 'stroke-width': 18, 'stroke-linecap': 'round' }, mid);
    el('ellipse', { cx: jar.x - CELL / 2 - 70, cy: jar.y + 6, rx: 52, ry: 62, fill: '#8a4a2a', stroke: '#5e2f18', 'stroke-width': 4 }, mid);
    el('ellipse', { cx: jar.x - CELL / 2 - 70, cy: jar.y - 50, rx: 34, ry: 10, fill: '#4f8fbf' }, mid);
    scene.grain('mid', 0.4);

    // Front: the pieces.
    const pieces = SOLUTION.map((mask, i) => {
      const { x, y } = centre(i);
      const g = el('g', { class: 'pipe interactive', transform: `translate(${x} ${y})` }, front);
      el('rect', { x: -CELL / 2 + 6, y: -CELL / 2 + 6, width: CELL - 12, height: CELL - 12, rx: 6, fill: 'transparent' }, g);
      const turn = el('g', {}, g);
      const arms = [N, E, S, W].filter((d) => mask & d);
      const armPath = (d: number) => ({ [N]: 'M0 0 V-75', [E]: 'M0 0 H75', [S]: 'M0 0 V75', [W]: 'M0 0 H-75' }[d] ?? '');
      if (isPaddy(i)) {
        el('path', { d: armPath(arms[0]), class: 'pipe-wall' }, turn);
        el('path', { d: armPath(arms[0]), class: 'pipe-water' }, turn);
        el('rect', { x: -44, y: -44, width: 88, height: 88, rx: 10, class: 'paddy' }, turn);
        for (let k = -2; k <= 2; k += 1) el('path', { d: `M${k * 16} 30 L${k * 16 - 4} 6 M${k * 16} 30 L${k * 16 + 5} 8`, class: 'rice' }, turn);
      } else {
        for (const d of arms) el('path', { d: armPath(d), class: 'pipe-wall' }, turn);
        for (const d of arms) el('path', { d: armPath(d), class: 'pipe-water' }, turn);
        el('circle', { r: 18, class: 'pipe-joint' }, turn);
      }
      // Hint ghost: the piece's right way round, drawn unturned (turns are relative to the solution).
      const ghost = el('g', { opacity: 0, class: 'pipe-ghost' }, g);
      for (const d of arms) el('path', { d: armPath(d) }, ghost);
      asButton(g, `Ống tre ${i + 1}`, () => spin(i));
      turn.setAttribute('transform', `rotate(${shownAngle[i]})`);
      return { g, turn, ghost };
    });

    let wasSolved = false;
    const render = () => {
      const masks = masksFor(turns);
      const wet = watered(masks);
      pieces.forEach(({ g, ghost }, i) => {
        g.classList.toggle('wet', wet.has(i));
        ghost.setAttribute('opacity', hinted.includes(i) && masks[i] !== SOLUTION[i] ? '1' : '0');
      });
      const now = wet.size === COLS * ROWS;
      if (now && !wasSolved) {
        sound.chime();
        solved();
      }
      wasSolved = now;
    };

    function spin(i: number) {
      turns[i] = (turns[i] + 1) % 4;
      const from = shownAngle[i];
      const to = from + 90;
      cancels[i]?.();
      cancels[i] = tween(180, (t) => {
        shownAngle[i] = from + (to - from) * t;
        pieces[i].turn.setAttribute('transform', `rotate(${shownAngle[i].toFixed(1)})`);
      });
      sound.paper();
      render();
    }

    render();

    return {
      revealHints: (count) => {
        while (hinted.length < count) {
          const next = nextPipeHint(turns, hinted);
          if (next === null) break;
          hinted.push(next);
        }
        render();
        return hinted.length;
      },
      hintTargets: () => {
        const masks = masksFor(turns);
        return hinted.filter((i) => masks[i] !== SOLUTION[i]).map((i): HintTarget => ({ ...centre(i), r: 66, verb: 'rotate' }));
      },
      destroy: () => cancels.forEach((cancel) => cancel?.()),
    };
  },
};
