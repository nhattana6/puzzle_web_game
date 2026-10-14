import { drawOwl } from '../core/owl';
import type { GlyphId } from '../core/glyphs';
import { placeStars } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el, toolButton, undoIcon } from '../core/svg';
import { starfield } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 4, level 6 — the star-bead board ("bàn hạt sao"), a peg-solitaire puzzle. Beads sit on a
 * plus-shaped board of 21 holes. A bead jumps in a straight line over the bead next to it into
 * the empty hole beyond, and the bead jumped over falls off the board. Four beads carry a
 * constellation (plain dots); the rest are blank. Four of the holes are gold bases around the
 * centre. The puzzle is done when exactly four beads are left, one on each base; of all the ways
 * of ending like that only one is possible, so the answer is the constellations on the four
 * bases, clockwise from the top base. Dead ends are common, so there is a single roll-back button.
 */

/** Cells of the board (row, column) in a 5×5 square without its corners, row by row. */
export const CELLS: readonly (readonly [number, number])[] = Array.from({ length: 25 }, (_, i): [number, number] => [Math.floor(i / 5), i % 5])
  .filter(([r, c]) => !((r === 0 || r === 4) && (c === 0 || c === 4)));
const cellIndex = (r: number, c: number): number => CELLS.findIndex(([cr, cc]) => cr === r && cc === c);
export const CELL_COUNT = CELLS.length;

/** The four gold bases, clockwise from the top one. */
export const BASES: readonly number[] = [cellIndex(1, 2), cellIndex(2, 3), cellIndex(3, 2), cellIndex(2, 1)];

/** Bead kinds: 0–3 carry the constellation of the same index in `GLYPHS_OF`, 4 is a blank bead; -1 is a hole with nothing in it. */
export const BLANK = 4;
export const GLYPHS_OF: readonly GlyphId[] = ['triangle', 'hook', 'crown', 'square'];

export type Board = readonly number[];
export type Jump = readonly [from: number, over: number, to: number];

/** Every straight jump on the board: from, the cell jumped over, and the landing cell. */
export const JUMPS: readonly Jump[] = CELLS.flatMap(([r, c], from) =>
  ([[-1, 0], [1, 0], [0, -1], [0, 1]] as const).flatMap(([dr, dc]): Jump[] => {
    const over = cellIndex(r + dr, c + dc);
    const to = cellIndex(r + 2 * dr, c + 2 * dc);
    return over >= 0 && to >= 0 ? [[from, over, to]] : [];
  }));

export const START: Board = [-1, 4, 0, -1, 4, -1, 4, 1, -1, -1, -1, -1, -1, 3, 4, -1, 4, -1, 2, 4, -1];

/** One way to finish (every other finish puts the same constellations on the same bases). */
export const SOLUTION: readonly Jump[] = [[2, 1, 0], [0, 4, 9], [7, 6, 5], [13, 14, 15], [18, 19, 20], [20, 16, 11]];

/** The jumps open to the beads on `board`. */
export const legalJumps = (board: Board): Jump[] => JUMPS.filter(([f, o, t]) => board[f] >= 0 && board[o] >= 0 && board[t] < 0);

export function applyJump(board: Board, [from, over, to]: Jump): number[] {
  const next = [...board];
  next[to] = board[from];
  next[from] = -1;
  next[over] = -1;
  return next;
}

export const beadCount = (board: Board): number => board.filter((v) => v >= 0).length;

/** Exactly four beads are left and they stand on the four bases. */
export const isSolved = (board: Board): boolean => beadCount(board) === 4 && BASES.every((b) => board[b] >= 0);

/** The board after the whole stored solution. */
export const solvedBoard = (): number[] => SOLUTION.reduce<number[]>((b, j) => applyJump(b, j), [...START]);

/** The answer: the constellations on the bases, clockwise from the top one. */
export const READING_ORDER: readonly GlyphId[] = BASES.map((b) => GLYPHS_OF[solvedBoard()[b]]);

// ── Layout (scene units) ────────────────────────────────────────────────────────────────────
export const BOARD = { x: 150, y: 80, cell: 150 };
/** Sizes below were drawn for a 130-unit cell. */
const K = BOARD.cell / 130;
export const cellCentre = (i: number): { x: number; y: number } => ({
  x: BOARD.x + (CELLS[i][1] + 0.5) * BOARD.cell,
  y: BOARD.y + (CELLS[i][0] + 0.5) * BOARD.cell,
});

export const starBoard: PuzzleDef = {
  id: 'star-board',
  name: 'Bàn hạt sao',
  answer: [...READING_ORDER],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    /** Where each bead is: the cell index, or -1 once it has fallen. Bead `i` keeps its kind for good. */
    const kinds: number[] = [];
    const startCell: number[] = [];
    START.forEach((v, cell) => {
      if (v >= 0) {
        kinds.push(v);
        startCell.push(cell);
      }
    });
    let cellOf: number[] = [...startCell];
    const history: number[][] = [];
    let selected = -1;
    let wasSolved = false;
    const beadNodes: SVGGElement[] = [];
    const landingRings: SVGCircleElement[] = [];

    const boardOf = (): number[] => {
      const b = Array<number>(CELL_COUNT).fill(-1);
      cellOf.forEach((c, i) => { if (c >= 0) b[c] = kinds[i]; });
      return b;
    };
    const beadAt = (cell: number): number => cellOf.indexOf(cell);

    // Back: the observatory wall and its floor.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#14172b' }, back);
    starfield(back, { x: 0, y: 0, w: SCENE_W, h: SCENE_H }, 60, 5606);
    el('rect', { x: -60, y: 846, width: SCENE_W + 120, height: 120, fill: '#2a1f1a' }, back);
    scene.grain('back', 0.45);

    // Mid: the board with its holes and the four gold bases.
    for (let i = 0; i < CELL_COUNT; i += 1) {
      const p = cellCentre(i);
      el('rect', { x: p.x - 63 * K, y: p.y - 63 * K, width: 126 * K, height: 126 * K, rx: 14, fill: '#3a2a22', stroke: '#241a14', 'stroke-width': 4, 'pointer-events': 'none' }, mid);
    }
    for (let i = 0; i < CELL_COUNT; i += 1) {
      const p = cellCentre(i);
      const base = BASES.includes(i);
      el('circle', { cx: p.x, cy: p.y, r: (base ? 50 : 36) * K, fill: '#1a120d', stroke: base ? '#d3a64f' : '#5a4636', 'stroke-width': base ? 7 : 3, 'pointer-events': 'none' }, mid);
    }

    // Front: landing marks, beads, the roll-back button.
    const holeHits: SVGGElement[] = [];
    for (let i = 0; i < CELL_COUNT; i += 1) {
      const p = cellCentre(i);
      const g = el('g', { class: 'interactive', transform: `translate(${p.x} ${p.y})` }, front);
      el('circle', { r: 62 * K, fill: 'transparent' }, g);
      landingRings.push(el('circle', { r: 44 * K, fill: 'none', stroke: '#f4c66a', 'stroke-width': 5, 'stroke-dasharray': '8 8', 'pointer-events': 'none' }, g));
      landingRings[i].style.display = 'none';
      holeHits.push(g);
      asButton(g, `Lỗ hàng ${CELLS[i][0] + 1}, cột ${CELLS[i][1] + 1}`, () => tapCell(i));
    }
    kinds.forEach((kind, id) => {
      const g = el('g', { 'pointer-events': 'none', 'data-hint': `bead-${id}` }, front);
      const blank = kind === BLANK;
      el('circle', { r: 46 * K, fill: blank ? '#6b6676' : '#2c3566', stroke: blank ? '#3d3a46' : '#f4c66a', 'stroke-width': 5 }, g);
      if (!blank) for (const [x, y] of placeStars(GLYPHS_OF[kind], 0, 0, 56 * K)) el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 4.5 * K, fill: '#fff1c4' }, g);
      beadNodes.push(g);
    });
    toolButton(front, 1180, 330, 'Hoàn tác', undoIcon, () => undo());
    drawOwl(front, 1380, 800, 0.8);

    const render = () => {
      cellOf.forEach((c, i) => {
        const node = beadNodes[i];
        node.style.display = c < 0 ? 'none' : '';
        if (c >= 0) {
          const p = cellCentre(c);
          node.setAttribute('transform', `translate(${p.x} ${p.y - (c === selected ? 12 * K : 0)})`);
        }
      });
      const moves = selected >= 0 ? legalJumps(boardOf()).filter(([f]) => f === selected) : [];
      landingRings.forEach((ring, i) => { ring.style.display = moves.some(([, , t]) => t === i) ? '' : 'none'; });
    };
    function tapCell(cell: number): void {
      const board = boardOf();
      if (selected >= 0) {
        const jump = legalJumps(board).find(([f, , t]) => f === selected && t === cell);
        if (jump) {
          history.push([...cellOf]);
          const fallen = beadAt(jump[1]);
          const mover = beadAt(jump[0]);
          cellOf[mover] = jump[2];
          cellOf[fallen] = -1;
          selected = -1;
          sound.knock();
          render();
          const done = isSolved(boardOf());
          if (done && !wasSolved) sound.ding();
          wasSolved = done;
          return;
        }
      }
      // Select a bead that can jump; tapping the selected one again lets go of it.
      if (board[cell] >= 0 && cell !== selected && legalJumps(board).some(([f]) => f === cell)) {
        selected = cell;
        sound.tick();
      } else {
        selected = -1;
      }
      render();
    }
    function undo(): void {
      const prev = history.pop();
      selected = -1;
      if (prev) {
        cellOf = prev;
        sound.paper();
      }
      wasSolved = isSolved(boardOf());
      render();
    }
    render();

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const [from, over, to] = SOLUTION[0];
        const mover = startCell.indexOf(from);
        const fallen = startCell.indexOf(over);
        const a = cellCentre(from);
        const b = cellCentre(to);
        return [
          {
            note: 'Chạm một hạt rồi chạm lỗ trống ngay sau hạt bên cạnh để nhảy qua nó; hạt bị nhảy qua rơi xuống. Làm tiếp 6 lần nhảy như vậy sao cho chỉ còn 4 hạt, mỗi hạt nằm trên một đế vàng (nhiều cách nhảy sẽ bế tắc: dùng nút Hoàn tác).',
            targets: [
              { x: a.x, y: a.y, r: 60, verb: 'drag', to: b, object: `[data-hint="bead-${mover}"]` },
              {
                x: b.x, y: b.y, r: 0, verb: 'look',
                act: (picture) => {
                  const node = picture.querySelector<SVGElement>(`[data-hint="bead-${fallen}"]`);
                  return (p) => { if (node) node.style.display = p > 0.7 ? 'none' : ''; };
                },
              },
            ],
            apply: () => {
              cellOf = startCell.map((c) => c);
              for (const jump of SOLUTION) {
                const m = cellOf.indexOf(jump[0]);
                const f = cellOf.indexOf(jump[1]);
                cellOf[m] = jump[2];
                cellOf[f] = -1;
              }
              history.length = 0;
              selected = -1;
              wasSolved = true;
              render();
            },
          },
          {
            note: 'Đọc chòm sao trên bốn hạt ở bốn đế vàng, theo chiều kim đồng hồ bắt đầu từ đế ở trên cùng.',
            targets: BASES.map((cell) => ({ x: cellCentre(cell).x, y: cellCentre(cell).y, r: 70, verb: 'look' as const })),
            prepare: (picture) => {
              const overlay = picture.querySelector('.layer-overlay') ?? picture;
              BASES.forEach((cell, n) => {
                const p = cellCentre(cell);
                const badge = el('g', { transform: `translate(${p.x + 52 * K} ${p.y - 52 * K})`, 'pointer-events': 'none' }, overlay);
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
