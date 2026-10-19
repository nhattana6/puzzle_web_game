import { drawOwl } from '../core/owl';
import type { GlyphId } from '../core/glyphs';
import { placeStars } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el } from '../core/svg';
import { starfield } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 4, level 2 — the drawer cabinet ("tủ ngăn kéo"). A cabinet of 4×4 drawers; every drawer
 * takes one of four star stones, and each row, each column and each of the four 2×2 blocks (the
 * thick frame lines mark them) has to hold all four kinds once. A few drawers are already open
 * with their stone pinned in. Tap a drawer to change its stone (none → 1st → 2nd → 3rd → 4th →
 * none). A lamp by every row, column and block turns gold when that group has all four kinds.
 * Only one way to fill the cabinet fits the pinned stones. Four drawers have a brass bar handle
 * (the others a round knob): the answer is their stones, from the top row to the bottom row.
 */

export const SIZE = 4;
/** The four stones, by value 0–3: a constellation of plain dots each. */
export const STONES: readonly GlyphId[] = ['triangle', 'hook', 'crown', 'square'];

export type Board = readonly (readonly number[])[];

/** The one way to fill the cabinet (value of the stone in each drawer, row by row). */
export const SOLUTION: Board = [
  [0, 1, 2, 3],
  [2, 3, 0, 1],
  [1, 0, 3, 2],
  [3, 2, 1, 0],
];

/** Drawers that start open with their stone pinned in. */
export const GIVENS: readonly (readonly [number, number])[] = [[0, 0], [1, 3], [2, 2], [3, 1]];

/** The column of the brass-handled drawer in each row. */
export const HANDLES: readonly number[] = [3, 0, 1, 2];

/** The answer: the stones of the handled drawers, top row to bottom row. */
export const READING_ORDER: readonly GlyphId[] = HANDLES.map((c, r) => STONES[SOLUTION[r][c]]);

export const isGiven = (r: number, c: number): boolean => GIVENS.some(([gr, gc]) => gr === r && gc === c);

export const startBoard = (): number[][] => SOLUTION.map((row, r) => row.map((v, c) => (isGiven(r, c) ? v : -1)));

export type UnitKind = 'row' | 'col' | 'block';
export const UNITS: readonly { kind: UnitKind; index: number }[] = [
  ...Array.from({ length: SIZE }, (_, index) => ({ kind: 'row' as const, index })),
  ...Array.from({ length: SIZE }, (_, index) => ({ kind: 'col' as const, index })),
  ...Array.from({ length: SIZE }, (_, index) => ({ kind: 'block' as const, index })),
];

/** The four drawers of a row, a column or a 2×2 block (block 0..3 reads left to right, top to bottom). */
export function cellsOf(kind: UnitKind, index: number): [number, number][] {
  return Array.from({ length: SIZE }, (_, k): [number, number] => {
    if (kind === 'row') return [index, k];
    if (kind === 'col') return [k, index];
    return [Math.floor(index / 2) * 2 + Math.floor(k / 2), (index % 2) * 2 + (k % 2)];
  });
}

/** A group is done when all four drawers hold different stones. */
export function unitDone(board: Board, kind: UnitKind, index: number): boolean {
  const seen = cellsOf(kind, index).map(([r, c]) => board[r][c]);
  return seen.every((v) => v >= 0) && new Set(seen).size === SIZE;
}

export const isSolved = (board: Board): boolean => UNITS.every((u) => unitDone(board, u.kind, u.index));

/** The next stone for a drawer when tapped: 0, 1, 2, 3, then empty again. */
export const nextStone = (v: number): number => (v + 1 >= STONES.length ? -1 : v + 1);

// ── Layout (scene units) ────────────────────────────────────────────────────────────────────
export const CABINET = { x: 300, y: 120, cell: 160 };
export const cellCentre = (r: number, c: number): { x: number; y: number } => ({
  x: CABINET.x + (c + 0.5) * CABINET.cell,
  y: CABINET.y + (r + 0.5) * CABINET.cell,
});
/** Where the lamp of a group sits, outside the cabinet. */
export function lampSpot(kind: UnitKind, index: number): { x: number; y: number } {
  const size = SIZE * CABINET.cell;
  if (kind === 'row') return { x: CABINET.x + size + 56, y: cellCentre(index, 0).y };
  if (kind === 'col') return { x: cellCentre(0, index).x, y: CABINET.y + size + 56 };
  return { x: CABINET.x + (index % 2 ? size + 56 : -56), y: CABINET.y + (index < 2 ? -48 : size + 56) };
}

const WOOD = { front: '#7a5638', edge: '#4a3220', given: '#5e4430', recess: '#1c1511', brass: '#d3a64f' };

export const drawerCabinet: PuzzleDef = {
  id: 'drawer-cabinet',
  name: 'Tủ ngăn kéo',
  answer: [...READING_ORDER],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const board = startBoard();
    const recesses: SVGElement[][] = [];
    const stones: SVGElement[][][] = [];
    const lamps = new Map<string, SVGCircleElement>();
    let wasSolved = false;

    // Back: the observatory wall and its floor.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#14172b' }, back);
    starfield(back, { x: 0, y: 0, w: SCENE_W, h: SCENE_H }, 60, 5202);
    el('rect', { x: -60, y: 846, width: SCENE_W + 120, height: 120, fill: '#2a1f1a' }, back);
    scene.grain('back', 0.45);

    // Mid: the cabinet body and the thick lines between its four blocks.
    const size = SIZE * CABINET.cell;
    el('rect', { x: CABINET.x - 24, y: CABINET.y - 24, width: size + 48, height: size + 48, rx: 18, fill: '#33241a', stroke: '#6b4f24', 'stroke-width': 6, 'pointer-events': 'none' }, mid);
    el('path', {
      d: `M${CABINET.x + size / 2} ${CABINET.y - 24} V${CABINET.y + size + 24} M${CABINET.x - 24} ${CABINET.y + size / 2} H${CABINET.x + size + 24}`,
      stroke: '#6b4f24', 'stroke-width': 14, 'pointer-events': 'none',
    }, mid);

    // Front: sixteen drawers.
    const cells: SVGGElement[][] = [];
    for (let r = 0; r < SIZE; r += 1) {
      cells.push([]);
      recesses.push([]);
      stones.push([]);
      for (let c = 0; c < SIZE; c += 1) {
        const p = cellCentre(r, c);
        const given = isGiven(r, c);
        const g = el('g', { class: given ? 'drawer' : 'drawer interactive', transform: `translate(${p.x} ${p.y})`, 'data-hint': `drawer-${r}-${c}` }, front);
        el('rect', { x: -70, y: -70, width: 140, height: 140, rx: 12, fill: given ? WOOD.given : WOOD.front, stroke: WOOD.edge, 'stroke-width': 5 }, g);
        const recess = el('rect', { x: -56, y: -56, width: 112, height: 112, rx: 10, fill: WOOD.recess, 'pointer-events': 'none', 'data-open': `${r}-${c}` }, g);
        const own: SVGElement[] = [];
        STONES.forEach((id, v) => {
          const grp = el('g', { 'pointer-events': 'none', 'data-stone': `${r}-${c}-${v}` }, g);
          for (const [x, y] of placeStars(id, 0, 0, 74)) el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 7, fill: '#fff1c4' }, grp);
          own.push(grp);
        });
        if (HANDLES[r] === c) {
          el('rect', { x: -26, y: 50, width: 52, height: 12, rx: 6, fill: WOOD.brass, stroke: '#8a6a2c', 'stroke-width': 3, 'pointer-events': 'none' }, g);
        } else {
          el('circle', { cx: 0, cy: 56, r: 8, fill: '#a98355', stroke: WOOD.edge, 'stroke-width': 3, 'pointer-events': 'none' }, g);
        }
        if (given) el('circle', { cx: -54, cy: -54, r: 6, fill: '#9aa0c8', stroke: '#3a3550', 'stroke-width': 2, 'pointer-events': 'none' }, g);
        cells[r].push(g);
        recesses[r].push(recess);
        stones[r].push(own);
        if (!given) asButton(g, `Ngăn kéo hàng ${r + 1}, cột ${c + 1}`, () => cycle(r, c));
      }
    }
    for (const u of UNITS) {
      const s = lampSpot(u.kind, u.index);
      lamps.set(`${u.kind}-${u.index}`, el('circle', { cx: s.x, cy: s.y, r: 13, fill: '#3a3550', stroke: '#6b4f24', 'stroke-width': 3, 'pointer-events': 'none' }, front));
    }
    drawOwl(front, 1250, 846, 0.8);

    const render = () => {
      for (let r = 0; r < SIZE; r += 1) {
        for (let c = 0; c < SIZE; c += 1) {
          const v = board[r][c];
          (recesses[r][c] as SVGElement).style.display = v >= 0 ? '' : 'none';
          stones[r][c].forEach((s, k) => { (s as SVGElement).style.display = k === v ? '' : 'none'; });
          cells[r][c].setAttribute('aria-label', `Ngăn kéo hàng ${r + 1}, cột ${c + 1}: ${v >= 0 ? `đá ${v + 1}` : 'trống'}`);
        }
      }
      for (const u of UNITS) {
        const on = unitDone(board, u.kind, u.index);
        lamps.get(`${u.kind}-${u.index}`)?.setAttribute('fill', on ? '#f4c66a' : '#3a3550');
        lamps.get(`${u.kind}-${u.index}`)?.setAttribute('stroke', on ? '#fff1c4' : '#6b4f24');
      }
    };
    function cycle(r: number, c: number): void {
      board[r][c] = nextStone(board[r][c]);
      sound.knock();
      render();
      const done = isSolved(board);
      if (done && !wasSolved) sound.ding();
      wasSolved = done;
    }
    render();

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const empty = SOLUTION.flatMap((row, r) => row.flatMap((_, c) => (isGiven(r, c) ? [] : [[r, c] as const])));
        const first = cellCentre(empty[0][0], empty[0][1]);
        return [
          {
            note: 'Chạm ngăn kéo để đổi đá sao. Mỗi hàng, mỗi cột và mỗi khối 2×2 (ngăn cách bằng đường dày) phải đủ 4 loại đá; đèn cạnh nhóm sáng khi đủ. Bắt đầu từ chỗ ít lựa chọn nhất, làm tương tự với các ngăn còn lại.',
            targets: [
              {
                x: first.x, y: first.y, r: 60, verb: 'tap',
                act: (picture) => {
                  const nodes = empty.map(([r, c]) => ({
                    open: picture.querySelector<SVGElement>(`[data-open="${r}-${c}"]`),
                    stone: picture.querySelector<SVGElement>(`[data-stone="${r}-${c}-${SOLUTION[r][c]}"]`),
                  }));
                  return (p) => nodes.forEach((n, k) => {
                    const shown = p > (k + 0.5) / nodes.length ? '' : 'none';
                    if (n.open) n.open.style.display = shown;
                    if (n.stone) n.stone.style.display = shown;
                  });
                },
              },
            ],
            apply: () => {
              SOLUTION.forEach((row, r) => row.forEach((v, c) => { board[r][c] = v; }));
              wasSolved = true;
              render();
            },
          },
          {
            note: 'Đọc đá trong bốn ngăn có tay nắm đồng (thanh ngang, không phải núm tròn) từ hàng trên xuống hàng dưới.',
            targets: HANDLES.map((c, r) => ({ x: cellCentre(r, c).x, y: cellCentre(r, c).y, r: 80, verb: 'look' as const })),
            prepare: (picture) => {
              const overlay = picture.querySelector('.layer-overlay') ?? picture;
              HANDLES.forEach((c, r) => {
                const p = cellCentre(r, c);
                const badge = el('g', { transform: `translate(${p.x + 52} ${p.y - 52})`, 'pointer-events': 'none' }, overlay);
                el('circle', { r: 17, class: 'number-badge' }, badge);
                el('text', { y: 1, class: 'number-text' }, badge).textContent = String(r + 1);
              });
            },
          },
        ];
      },
      destroy: () => undefined,
    };
  },
};
