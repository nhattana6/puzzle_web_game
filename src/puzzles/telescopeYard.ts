import { drawOwl } from '../core/owl';
import type { GlyphId } from '../core/glyphs';
import { placeStars } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el, resetIcon, toolButton } from '../core/svg';
import { starfield } from './sky';
import type { HintStep, PuzzleDef } from './types';
import { tr } from '../core/i18n';

/**
 * Chapter 4, level 10 — the telescope yard ("sân kính thiên văn"), a 6×6 Star Battle. The yard is cut
 * into six regions (patches with a cream border). Six telescopes go on it, one in every row, every
 * column and every region, and no two may touch, not even corner to corner. Four regions are studded
 * with copper rivets: a telescope standing in one of their tiles shows a constellation in its lens. The
 * tile decides which, so a telescope on a wrong tile of such a region shows a wrong constellation. Only
 * one placement obeys all the rules; the answer is the lenses of the four rivet regions read from the
 * left column to the right.
 */

export const N = 6;

/** Region number of every tile. */
export const REGIONS: readonly (readonly number[])[] = [
  [5, 5, 0, 4, 4, 4],
  [5, 1, 0, 4, 4, 4],
  [1, 1, 0, 0, 4, 4],
  [1, 1, 0, 0, 2, 2],
  [1, 3, 3, 2, 2, 2],
  [1, 3, 2, 2, 2, 2],
];
/** The one valid placement: the column of the telescope in each row. */
export const SOLUTION: readonly number[] = [1, 5, 3, 0, 2, 4];
/** The regions studded with copper rivets (their lenses show constellations). */
export const COPPER: readonly number[] = [1, 0, 2, 4];

/** The constellation a lens shows on each tile (null where the region has no rivets). */
export const LENS: readonly (readonly (GlyphId | null)[])[] = [
  [null, null, 'triangle', 'dipper', 'diamond', 'dipper'],
  [null, 'belt', 'crown', 'cross', 'square', 'belt'],
  ['square', 'crown', 'hook', 'diamond', 'triangle', 'diamond'],
  ['cross', 'dipper', 'triangle', 'belt', 'cross', 'cross'],
  ['diamond', null, null, 'arrow', 'arrow', 'belt'],
  ['dipper', null, 'crown', 'hook', 'square', 'hook'],
];

/** Tile states: nothing, a dot ("no telescope here"), or a telescope. */
export type Mark = 0 | 1 | 2;
export type Cell = readonly [number, number];

export const regionOf = (r: number, c: number): number => REGIONS[r][c];
export const isCopper = (r: number, c: number): boolean => COPPER.includes(REGIONS[r][c]);

/** The next state of a tile when tapped: empty → dot → telescope → empty. */
export const nextMark = (m: Mark): Mark => ((m + 1) % 3) as Mark;

/** Whether two telescopes break a rule together: same row, column or region, or touching. */
export const clash = (a: Cell, b: Cell): boolean =>
  a[0] === b[0] || a[1] === b[1] || REGIONS[a[0]][a[1]] === REGIONS[b[0]][b[1]] || (Math.abs(a[0] - b[0]) <= 1 && Math.abs(a[1] - b[1]) <= 1);

/** For each telescope, whether it breaks a rule with another one. */
export const conflicting = (telescopes: readonly Cell[]): boolean[] =>
  telescopes.map((a, i) => telescopes.some((b, j) => i !== j && clash(a, b)));

/** Six telescopes, none breaking a rule. */
export const isSolved = (telescopes: readonly Cell[]): boolean => telescopes.length === N && !conflicting(telescopes).some(Boolean);

/** The constellations in the lenses of telescopes on rivet regions, from the left column to the right. */
export function lensesLeftToRight(telescopes: readonly Cell[]): GlyphId[] {
  return telescopes
    .filter(([r, c]) => LENS[r][c] !== null)
    .sort((a, b) => a[1] - b[1] || a[0] - b[0])
    .map(([r, c]) => LENS[r][c] as GlyphId);
}

export const SOLUTION_CELLS: readonly Cell[] = SOLUTION.map((c, r) => [r, c] as const);
export const READING_ORDER: readonly GlyphId[] = lensesLeftToRight(SOLUTION_CELLS);

// ── Layout (scene units) ────────────────────────────────────────────────────────────────────
export const YARD = { x: 90, y: 75, cell: 125 };
export const tileCentre = (r: number, c: number): { x: number; y: number } => ({
  x: YARD.x + (c + 0.5) * YARD.cell,
  y: YARD.y + (r + 0.5) * YARD.cell,
});
const TINTS = ['#3b3355', '#2f4458', '#4a3a3a', '#2f4a44', '#4a4630', '#44304a'];
const COUNTER_X = 1010;
const COUNTER_Y = 250;
const RESET = { x: 1230, y: 470 };

export const telescopeYard: PuzzleDef = {
  id: 'telescope-yard',
  get name() {
    return tr('Sân kính thiên văn', 'Telescope Yard');
  },
  answer: [...READING_ORDER],
  get help() {
    return [
      tr('Đặt sáu kính thiên văn lên sân: mỗi hàng, mỗi cột và mỗi vùng (mảng màu có viền kem) đúng một kính, và hai kính không được đứng cạnh nhau, kể cả chéo.', 'Place six telescopes in the yard: exactly one in each row, each column and each region (a coloured patch with a cream border), and no two telescopes may touch, not even diagonally.'),
      tr('Chạm một ô: lần một đánh dấu chấm (ghi nhớ ô không đặt kính), lần hai đặt kính, lần ba xoá. Kính phạm luật có viền đỏ.', 'Tap a square: once to mark a dot (to remember there is no telescope there), twice to place a telescope, three times to clear. A telescope that breaks a rule has a red rim.'),
      tr('Vùng có đinh tán đồng thì kính đặt trong đó hiện một chòm sao trong thấu kính. Khi sáu kính đúng chỗ, đọc các chòm theo cột từ trái sang phải.', 'In a region with brass rivets, the telescope placed there shows a constellation in its lens. When all six telescopes are right, read the constellations by column from left to right.'),
    ];
  },
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const marks: Mark[][] = Array.from({ length: N }, () => Array<Mark>(N).fill(0));
    let wasSolved = false;
    const dotNodes: SVGGElement[][] = [];
    const scopeNodes: SVGGElement[][] = [];
    const ringNodes: SVGCircleElement[][] = [];
    const counters: SVGCircleElement[] = [];

    // Back: the observatory yard at night.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#14172b' }, back);
    starfield(back, { x: 0, y: 0, w: SCENE_W, h: SCENE_H }, 50, 6010);
    scene.grain('back', 0.45);

    // Mid: the tiles with their region tints, rivets and the region borders.
    const half = YARD.cell / 2;
    for (let r = 0; r < N; r += 1) {
      for (let c = 0; c < N; c += 1) {
        const p = tileCentre(r, c);
        el('rect', { x: p.x - half, y: p.y - half, width: YARD.cell, height: YARD.cell, fill: TINTS[REGIONS[r][c]], stroke: '#1a1730', 'stroke-width': 2, 'pointer-events': 'none' }, mid);
        if (isCopper(r, c)) el('circle', { cx: p.x - half + 16, cy: p.y - half + 16, r: 7, fill: '#d8935a', stroke: '#8a5a30', 'stroke-width': 2, 'pointer-events': 'none' }, mid);
      }
    }
    const border = (x1: number, y1: number, x2: number, y2: number) =>
      el('line', { x1, y1, x2, y2, stroke: '#e8dcc0', 'stroke-width': 6, 'stroke-linecap': 'round', 'pointer-events': 'none' }, mid);
    for (let r = 0; r < N; r += 1) {
      for (let c = 0; c < N; c += 1) {
        const x = YARD.x + c * YARD.cell;
        const y = YARD.y + r * YARD.cell;
        if (c + 1 < N && REGIONS[r][c] !== REGIONS[r][c + 1]) border(x + YARD.cell, y, x + YARD.cell, y + YARD.cell);
        if (r + 1 < N && REGIONS[r][c] !== REGIONS[r + 1][c]) border(x, y + YARD.cell, x + YARD.cell, y + YARD.cell);
      }
    }
    el('rect', { x: YARD.x, y: YARD.y, width: N * YARD.cell, height: N * YARD.cell, rx: 4, fill: 'none', stroke: '#6b4f24', 'stroke-width': 8, 'pointer-events': 'none' }, mid);

    // Front: dots, telescopes (hidden until placed), the six-lens counter, buttons.
    for (let r = 0; r < N; r += 1) {
      dotNodes.push([]);
      scopeNodes.push([]);
      ringNodes.push([]);
      for (let c = 0; c < N; c += 1) {
        const p = tileCentre(r, c);
        const dot = el('g', { transform: `translate(${p.x} ${p.y})`, 'pointer-events': 'none' }, front);
        el('circle', { r: 8, fill: '#8d8fc4' }, dot);
        dot.style.display = 'none';
        dotNodes[r].push(dot);
        const scope = el('g', { transform: `translate(${p.x} ${p.y})`, 'pointer-events': 'none', 'data-tele': `${r}-${c}` }, front);
        el('path', { d: 'M0 36 L-22 56 M0 36 L22 56 M0 36 V56', fill: 'none', stroke: '#8a6038', 'stroke-width': 6, 'stroke-linecap': 'round' }, scope);
        ringNodes[r].push(el('circle', { r: 46, fill: '#0b0e1d', stroke: '#d3a64f', 'stroke-width': 7 }, scope));
        const glyph = LENS[r][c];
        if (glyph) for (const [x, y] of placeStars(glyph, 0, 0, 62)) el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 5.4, fill: '#fff1c4' }, scope);
        scope.style.display = 'none';
        scopeNodes[r].push(scope);
      }
    }
    for (let i = 0; i < N; i += 1) {
      el('circle', { cx: COUNTER_X + i * 78, cy: COUNTER_Y, r: 26, fill: 'none', stroke: '#6b4f24', 'stroke-width': 5, 'pointer-events': 'none' }, front);
      counters.push(el('circle', { cx: COUNTER_X + i * 78, cy: COUNTER_Y, r: 17, fill: '#d3a64f', 'pointer-events': 'none' }, front));
    }
    for (let r = 0; r < N; r += 1) {
      for (let c = 0; c < N; c += 1) {
        const p = tileCentre(r, c);
        const hit = el('rect', { x: p.x - half, y: p.y - half, width: YARD.cell, height: YARD.cell, fill: 'transparent', class: 'interactive' }, front);
        asButton(hit, tr(`Ô hàng ${r + 1}, cột ${c + 1}`, `Square in row ${r + 1}, column ${c + 1}`), () => tap(r, c));
      }
    }
    toolButton(front, RESET.x, RESET.y, tr('Dọn sân', 'Clear the yard'), resetIcon, () => clear());
    drawOwl(front, 1450, 800, 0.9);

    const placed = (): Cell[] => {
      const out: Cell[] = [];
      for (let r = 0; r < N; r += 1) for (let c = 0; c < N; c += 1) if (marks[r][c] === 2) out.push([r, c]);
      return out;
    };
    const render = (): void => {
      const list = placed();
      const bad = conflicting(list);
      const done = isSolved(list);
      for (let r = 0; r < N; r += 1) {
        for (let c = 0; c < N; c += 1) {
          dotNodes[r][c].style.display = marks[r][c] === 1 ? '' : 'none';
          scopeNodes[r][c].style.display = marks[r][c] === 2 ? '' : 'none';
          const i = list.findIndex((q) => q[0] === r && q[1] === c);
          const lit = done && LENS[r][c] !== null;
          ringNodes[r][c].setAttribute('stroke', i >= 0 && bad[i] ? '#e0584f' : lit ? '#fff1c4' : '#d3a64f');
        }
      }
      counters.forEach((node, i) => { node.style.display = i < list.length ? '' : 'none'; });
    };
    function check(): void {
      const done = isSolved(placed());
      if (done && !wasSolved) sound.ding();
      wasSolved = done;
    }
    function tap(r: number, c: number): void {
      marks[r][c] = nextMark(marks[r][c]);
      if (marks[r][c] === 2) sound.knock();
      else if (marks[r][c] === 1) sound.tick();
      else sound.paper();
      render();
      check();
    }
    function clear(): void {
      for (const row of marks) row.fill(0);
      sound.paper();
      wasSolved = false;
      render();
    }
    render();

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => [
        {
          note: tr('Đặt sáu kính: mỗi hàng, mỗi cột và mỗi vùng đúng một kính, không hai kính nào chạm nhau, kể cả chéo. Chạm một ô hai lần để đặt kính.', 'Place six telescopes: exactly one in each row, each column and each region, and no two touching, not even diagonally. Tap a square twice to place a telescope.'),
          targets: [
            {
              x: tileCentre(0, SOLUTION[0]).x, y: tileCentre(0, SOLUTION[0]).y, r: 60, verb: 'tap',
              act: (picture) => (p) => {
                SOLUTION_CELLS.forEach(([r, c], k) => {
                  const node = picture.querySelector(`[data-tele="${r}-${c}"]`) as SVGElement | null;
                  if (node) node.style.display = p > (k + 0.5) / SOLUTION_CELLS.length ? '' : 'none';
                });
              },
            },
          ],
          apply: () => {
            for (const row of marks) row.fill(0);
            SOLUTION_CELLS.forEach(([r, c]) => { marks[r][c] = 2; });
            wasSolved = true;
            render();
          },
        },
        {
          note: tr('Đọc thấu kính ở các vùng có đinh tán đồng, theo cột từ trái sang phải.', 'Read the lenses in the regions with brass rivets, by column from left to right.'),
          targets: [...SOLUTION_CELLS]
            .filter(([r, c]) => LENS[r][c] !== null)
            .sort((a, b) => a[1] - b[1])
            .map(([r, c]) => ({ x: tileCentre(r, c).x, y: tileCentre(r, c).y, r: 60, verb: 'look' as const })),
        },
      ],
      destroy: () => undefined,
    };
  },
};
