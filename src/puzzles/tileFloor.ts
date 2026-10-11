import { url } from '../core/defs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, uid } from '../core/svg';
import { mod, tween } from '../core/tween';
import { drawZodiac, type ZodiacId } from '../core/zodiac';
import type { HintTarget, PuzzleDef } from './types';

/**
 * The encaustic tile floor ("nền gạch bông").
 * Fourteen cement tiles, each carrying one quarter of an animal painted across
 * four tiles. Tap a tile to turn it, drag it onto another to swap the two. An
 * animal shows when its four quarters sit in a 2×2 square, all the right way up;
 * two tiles are quarters of animals that are not here.
 */

export const COLS = 7;
export const ROWS = 2;
export const TILE = 160;
const X0 = (SCENE_W - COLS * TILE) / 2;
const Y0 = 360;
const SCALE = TILE / 50; // a quarter of the 100×100 silhouette fills one tile

export interface FloorAnimal {
  animal: ZodiacId;
}

export interface FloorTile {
  animal: ZodiacId;
  /** 0 top-left, 1 top-right, 2 bottom-left, 3 bottom-right. */
  quarter: 0 | 1 | 2 | 3;
}

export const ANIMALS: readonly FloorAnimal[] = [
  { animal: 'monkey' },
  { animal: 'horse' },
  { animal: 'snake' },
];
/** Tiles 4a..4a+3 are the quarters of ANIMALS[a]; the last two belong to nothing here. */
export const TILES: readonly FloorTile[] = [
  ...ANIMALS.flatMap((a) => ([0, 1, 2, 3] as const).map((quarter) => ({ animal: a.animal, quarter }))),
  { animal: 'rooster', quarter: 0 },
  { animal: 'pig', quarter: 3 },
];
/** Cell of each tile at the start (cell = row * COLS + col). */
export const INITIAL_CELLS: readonly number[] = [5, 12, 0, 9, 2, 13, 7, 3, 10, 1, 11, 6, 4, 8];
/** Quarter turns of each tile at the start. */
export const INITIAL_TURNS: readonly number[] = [1, 0, 2, 3, 0, 1, 1, 2, 3, 0, 2, 1, 1, 3];

export const cellOf = (col: number, row: number): number => row * COLS + col;

/** The column of the 2×2 square holding the animal, or null if it isn't whole. */
export function wholeAt(cells: readonly number[], turns: readonly number[], animal: number): number | null {
  for (let col = 0; col < COLS - 1; col += 1) {
    const fits = [0, 1, 2, 3].every((q) => {
      const tile = animal * 4 + q;
      return cells[tile] === cellOf(col + (q % 2), Math.floor(q / 2)) && mod(turns[tile], 4) === 0;
    });
    if (fits) return col;
  }
  return null;
}

/** Moves a tile to a cell; the tile already there takes the mover's old cell. */
export function moveTile(cells: readonly number[], tile: number, target: number): number[] {
  const next = [...cells];
  const occupant = next.indexOf(target);
  if (occupant !== -1 && occupant !== tile) next[occupant] = next[tile];
  next[tile] = target;
  return next;
}

/** Each hint points out all four tiles of one animal that is not whole yet. */
export function nextFloorHint(cells: readonly number[], turns: readonly number[], revealed: readonly number[]): number | null {
  const next = ANIMALS.findIndex((_, a) => !revealed.includes(a) && wholeAt(cells, turns, a) === null);
  return next === -1 ? null : next;
}

const centre = (cell: number) => ({
  x: X0 + (cell % COLS) * TILE + TILE / 2,
  y: Y0 + Math.floor(cell / COLS) * TILE + TILE / 2,
});
const nearestCell = (x: number, y: number) => {
  const col = Math.min(COLS - 1, Math.max(0, Math.floor((x - X0) / TILE)));
  const row = Math.min(ROWS - 1, Math.max(0, Math.floor((y - Y0) / TILE)));
  return cellOf(col, row);
};
const HINT_COLOURS = ['#e0533c', '#2f7fbf', '#3f9a5a'];
const TAP_SLOP = 6;

export const tileFloor: PuzzleDef = {
  id: 'c3-tile-floor',
  name: 'Nền gạch bông',
  guide: {
    goal: 'Lát lại nền gạch bông để hiện ra 3 con giáp.',
    steps: [
      { icon: 'rotate', text: 'Bấm (không kéo) vào một viên gạch để xoay 90°.' },
      { icon: 'drag', text: 'Kéo viên gạch thả lên chỗ khác để đổi chỗ hai viên.' },
      { icon: 'done', text: 'Mỗi con giáp gồm 4 viên xếp thành ô vuông 2×2, đúng chiều. Ghép đủ thì 4 viên sáng lên. Lát xong cả 3 con là qua màn.' },
    ],
    tip: 'Nhìn nét vẽ ở mép viên gạch: nét phải nối liền sang viên bên cạnh. Có 2 viên thừa.',
  },
  fireflies: [
    { id: 'c3-tile-floor/lintel', layer: 'back', x: 1490, y: 150 },
    { id: 'c3-tile-floor/corner', layer: 'mid', x: 110, y: 820 },
  ],
  mount({ scene, sound, solved }) {
    const { back, mid, front } = scene.layers;
    let cells = [...INITIAL_CELLS];
    const turns = [...INITIAL_TURNS];
    const shownTurn = turns.map((t) => t * 90);
    const pos = cells.map((c) => centre(c));
    const cancels: (() => void)[] = [];

    // Back: an old house — dark wood doors and a bright doorway.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: 380, fill: '#4a3a2c' }, back);
    for (let x = -40; x < SCENE_W + 60; x += 200) {
      el('rect', { x, y: -60, width: 180, height: 360, fill: '#5e4836', stroke: '#3a2c21', 'stroke-width': 6 }, back);
      el('rect', { x: x + 24, y: 40, width: 132, height: 110, fill: 'none', stroke: '#3a2c21', 'stroke-width': 4 }, back);
    }
    const doorId = uid('door-light');
    const door = el('linearGradient', { id: doorId, x1: 0, y1: 0, x2: 0, y2: 1 }, scene.defs);
    el('stop', { offset: 0, 'stop-color': '#f8e9c4' }, door);
    el('stop', { offset: 1, 'stop-color': '#e3c48e' }, door);
    el('rect', { x: 690, y: 20, width: 220, height: 300, fill: url(doorId) }, back);
    el('rect', { x: -60, y: 300, width: SCENE_W + 120, height: 20, fill: '#2b2622' }, back);
    scene.grain('back', 0.6);

    // Mid: terracotta floor around the patterned tiles.
    el('rect', { x: -60, y: 320, width: SCENE_W + 120, height: SCENE_H, fill: '#a8583a' }, mid);
    for (let x = -60; x < SCENE_W + 60; x += 80) el('line', { x1: x, y1: 320, x2: x, y2: SCENE_H + 60, stroke: '#8e4a30', 'stroke-width': 2 }, mid);
    for (let y = 320; y < SCENE_H + 60; y += 80) el('line', { x1: -60, y1: y, x2: SCENE_W + 60, y2: y, stroke: '#8e4a30', 'stroke-width': 2 }, mid);
    el('rect', { x: X0 - 14, y: Y0 - 14, width: COLS * TILE + 28, height: ROWS * TILE + 28, fill: '#3a2c21', rx: 6 }, mid);
    for (let c = 0; c < COLS * ROWS; c += 1) {
      const { x, y } = centre(c);
      el('rect', { x: x - TILE / 2 + 3, y: y - TILE / 2 + 3, width: TILE - 6, height: TILE - 6, fill: '#2b2017' }, mid);
    }
    scene.grain('mid', 0.4);

    // Front: the tiles.
    const quarterClips = [0, 1, 2, 3].map((q) => {
      const id = uid('quarter');
      el('rect', { x: (q % 2) * 50, y: Math.floor(q / 2) * 50, width: 50, height: 50 }, el('clipPath', { id }, scene.defs));
      return id;
    });
    const board = el('g', {}, front);
    const tiles = TILES.map((t, i) => {
      const g = el('g', { class: 'floor-tile interactive', tabindex: 0, role: 'button', 'aria-label': `Viên gạch ${i + 1}` }, board);
      const turn = el('g', {}, g);
      const h = TILE / 2 - 4;
      el('rect', { x: -h, y: -h, width: 2 * h, height: 2 * h, rx: 3, fill: '#eee4cc', stroke: '#9c7a52', 'stroke-width': 2 }, turn);
      // Rotation-symmetric cement-tile pattern: quarter circles in each corner and a centre rosette.
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        el('path', { d: `M${sx * h} ${sy * (h - 34)} A34 34 0 0 ${sx * sy > 0 ? 1 : 0} ${sx * (h - 34)} ${sy * h}`, fill: 'none', stroke: '#6f93b8', 'stroke-width': 5, opacity: 0.55 }, turn);
        el('circle', { cx: sx * (h - 10), cy: sy * (h - 10), r: 5, fill: '#c99a2e', opacity: 0.7 }, turn);
      }
      el('circle', { r: 16, fill: 'none', stroke: '#6f93b8', 'stroke-width': 3, opacity: 0.35 }, turn);
      const qx = t.quarter % 2;
      const qy = Math.floor(t.quarter / 2);
      const art = el('g', { transform: `translate(${-TILE / 2 - qx * TILE} ${-TILE / 2 - qy * TILE}) scale(${SCALE})` }, turn);
      art.style.color = '#2b2622';
      drawZodiac(el('g', { 'clip-path': url(quarterClips[t.quarter]) }, art), t.animal);
      return { g, turn };
    });

    const hintLayer = el('g', { 'pointer-events': 'none' }, front);
    const hinted: number[] = [];

    const render = (i: number) => {
      tiles[i].g.setAttribute('transform', `translate(${pos[i].x.toFixed(1)} ${pos[i].y.toFixed(1)})`);
      tiles[i].turn.setAttribute('transform', `rotate(${shownTurn[i].toFixed(1)})`);
    };

    /** Coloured frame on each hinted tile, and a small 2×2 map showing which quarter it is. */
    const drawHints = () => {
      hintLayer.replaceChildren();
      hinted.forEach((a, k) => {
        if (wholeAt(cells, turns, a) !== null) return;
        const colour = HINT_COLOURS[k % HINT_COLOURS.length];
        for (let q = 0; q < 4; q += 1) {
          const { x, y } = pos[a * 4 + q];
          el('rect', { x: x - TILE / 2 + 5, y: y - TILE / 2 + 5, width: TILE - 10, height: TILE - 10, rx: 4, fill: 'none', stroke: colour, 'stroke-width': 6 }, hintLayer);
          const map = el('g', { transform: `translate(${x - TILE / 2 + 12} ${y - TILE / 2 + 12})` }, hintLayer);
          for (let cell = 0; cell < 4; cell += 1) {
            el('rect', {
              x: (cell % 2) * 13, y: Math.floor(cell / 2) * 13, width: 12, height: 12,
              fill: cell === q ? colour : '#fff3d6', stroke: colour, 'stroke-width': 1.5,
            }, map);
          }
        }
      });
    };

    const whole = ANIMALS.map(() => false);
    const checkWhole = () => {
      ANIMALS.forEach((_, a) => {
        const now = wholeAt(cells, turns, a) !== null;
        for (let q = 0; q < 4; q += 1) tiles[a * 4 + q].g.classList.toggle('assembled', now);
        if (now && !whole[a]) setTimeout(() => sound.chime(), 250);
        whole[a] = now;
      });
      drawHints();
      if (whole.every(Boolean)) solved();
    };

    const slide = (i: number, ms: number) => {
      const from = { ...pos[i] };
      const to = centre(cells[i]);
      cancels[i]?.();
      cancels[i] = tween(ms, (t) => {
        pos[i] = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
        render(i);
        if (hinted.length) drawHints();
      });
    };

    const turnTile = (i: number) => {
      turns[i] = mod(turns[i] + 1, 4);
      const from = shownTurn[i];
      const to = from + 90;
      tween(220, (t) => {
        shownTurn[i] = from + (to - from) * t;
        render(i);
      });
      sound.paper();
      checkWhole();
    };

    const place = (i: number, target: number) => {
      const before = cells;
      cells = moveTile(cells, i, target);
      cells.forEach((c, j) => c !== before[j] && slide(j, j === i ? 160 : 300));
      sound.knock();
      checkWhole();
    };

    tiles.forEach(({ g }, i) => {
      let grab = { x: 0, y: 0 };
      let start = { x: 0, y: 0 };
      let moved = false;
      scene.draggable(g, {
        start: (p) => {
          cancels[i]?.();
          grab = { x: p.x - pos[i].x, y: p.y - pos[i].y };
          start = p;
          moved = false;
          board.appendChild(g);
        },
        move: (p) => {
          if (!moved && Math.hypot(p.x - start.x, p.y - start.y) < TAP_SLOP) return;
          moved = true;
          pos[i] = { x: p.x - grab.x, y: p.y - grab.y };
          render(i);
        },
        end: (p) => {
          if (!moved) {
            turnTile(i);
            return;
          }
          place(i, nearestCell(p.x - grab.x, p.y - grab.y));
        },
      });
      g.addEventListener('keydown', (event) => {
        const col = cells[i] % COLS;
        const row = Math.floor(cells[i] / COLS);
        const moves: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'r') {
          turnTile(i);
        } else if (event.key in moves) {
          const [dc, dr] = moves[event.key];
          const c = col + dc;
          const r = row + dr;
          if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return;
          place(i, cellOf(c, r));
        } else {
          return;
        }
        event.preventDefault();
      });
      render(i);
    });
    checkWhole();

    return {
      revealHints: (count) => {
        while (hinted.length < count) {
          const a = nextFloorHint(cells, turns, hinted);
          if (a === null) break;
          hinted.push(a);
        }
        drawHints();
        return hinted.length;
      },
      hintTargets: () => hinted
        .filter((a) => wholeAt(cells, turns, a) === null)
        .flatMap((a) => [0, 1, 2, 3].map((q) => a * 4 + q))
        .map((i): HintTarget => ({ x: pos[i].x, y: pos[i].y, r: TILE * 0.42, verb: mod(turns[i], 4) ? 'rotate' : 'drag' })),
      destroy: () => cancels.forEach((cancel) => cancel?.()),
    };
  },
};
