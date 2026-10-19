import { glyph, type GlyphId } from '../core/glyphs';
import { drawOwl } from '../core/owl';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el, uid } from '../core/svg';
import { url } from '../core/defs';
import { starfield } from './sky';
import type { HintStep, PuzzleDef } from './types';
import { tr } from '../core/i18n';

/**
 * Chapter 5, level 3 — the crab field ("hang cua ruộng lúa"), a mine-sweeper. A paddy beside the
 * halt. Some squares are already ploughed and show dots of mud: how many crab holes are in the eight
 * squares around. The rest are still rice. Tap a rice square to plant a flag on a hole, again for a
 * "no hole here" ring, again to clear it. When a ploughed square has exactly as many flags around
 * as its dots, the dots turn gold. When every ploughed square is gold the holes fill with moon
 * water: those are the dots of the constellations (nothing is lit before that). Every rice square
 * touches a ploughed one and there is only one way to place the holes, reachable by reasoning.
 */

export const ROWS = 6;
export const COLS = 9;
export type Cell = readonly [number, number];
/** 0 = rice, 1 = flag (a hole), 2 = ring (no hole). */
export type Mark = 0 | 1 | 2;

/** The three constellations (as holes on the grid), left to right, and the three loose holes. */
export const HOLE_GROUPS: readonly { glyph: GlyphId; cells: readonly Cell[] }[] = [
  { glyph: 'square', cells: [[3, 0], [3, 2], [5, 2], [5, 0]] },
  { glyph: 'triangle', cells: [[0, 4], [1, 3], [1, 5]] },
  { glyph: 'cross', cells: [[3, 7], [4, 7], [5, 7], [4, 6], [4, 8]] },
];
export const LOOSE_HOLES: readonly Cell[] = [[0, 1], [5, 4], [0, 8]];
export const MINES: readonly Cell[] = [...HOLE_GROUPS.flatMap((g) => g.cells), ...LOOSE_HOLES];

/** The ploughed squares: they show a number and cannot be marked. Every other square is rice. */
export const REVEALED: readonly Cell[] = [
  [0, 0], [0, 3], [0, 5], [0, 6], [0, 7], [1, 0], [1, 1], [1, 2], [1, 6], [1, 8], [2, 0], [2, 1], [2, 2], [2, 3],
  [2, 4], [2, 6], [2, 7], [2, 8], [3, 3], [3, 4], [3, 5], [3, 6], [3, 8], [4, 0], [4, 2], [4, 5], [5, 1], [5, 5],
  [5, 6], [5, 8],
];

export const idx = (r: number, c: number): number => r * COLS + c;
const inside = (r: number, c: number) => r >= 0 && r < ROWS && c >= 0 && c < COLS;
export const neighbours = (r: number, c: number): Cell[] => {
  const out: Cell[] = [];
  for (let dr = -1; dr <= 1; dr += 1) for (let dc = -1; dc <= 1; dc += 1) if ((dr || dc) && inside(r + dr, c + dc)) out.push([r + dr, c + dc]);
  return out;
};
const MINE_SET = new Set(MINES.map(([r, c]) => idx(r, c)));
const REVEALED_SET = new Set(REVEALED.map(([r, c]) => idx(r, c)));
export const isMine = (r: number, c: number): boolean => MINE_SET.has(idx(r, c));
const ANSWER_SET = new Set(HOLE_GROUPS.flatMap((g) => g.cells).map(([r, c]) => idx(r, c)));
/** A hole that is a star of one of the three constellations (the loose holes are not). */
export const isAnswerHole = (r: number, c: number): boolean => ANSWER_SET.has(idx(r, c));
export const isRevealed = (r: number, c: number): boolean => REVEALED_SET.has(idx(r, c));
/** The number a ploughed square shows: crab holes among its eight neighbours. */
export const clueOf = (r: number, c: number): number => neighbours(r, c).filter(([rr, cc]) => isMine(rr, cc)).length;
/** Every square that is still rice (holes and safe ones). */
export const RICE: readonly Cell[] = Array.from({ length: ROWS * COLS }, (_, k) => [Math.floor(k / COLS), k % COLS] as Cell).filter(([r, c]) => !isRevealed(r, c));

export const emptyMarks = (): Mark[] => Array.from({ length: ROWS * COLS }, () => 0 as Mark);
/** The marks of a player who flagged exactly the holes. */
export const solutionMarks = (): Mark[] => emptyMarks().map((_, k) => (MINE_SET.has(k) ? 1 : 0) as Mark);
export const nextMark = (m: Mark): Mark => ((m + 1) % 3) as Mark;

export const flagsAround = (r: number, c: number, marks: readonly Mark[]): number => neighbours(r, c).filter(([rr, cc]) => marks[idx(rr, cc)] === 1).length;
/** A ploughed square is satisfied when its flags match its dots. */
export const clueDone = (r: number, c: number, marks: readonly Mark[]): boolean => flagsAround(r, c, marks) === clueOf(r, c);
export const isSolved = (marks: readonly Mark[]): boolean => REVEALED.every(([r, c]) => clueDone(r, c, marks)) && marks.every((m, k) => m !== 1 || !REVEALED_SET.has(k));

/** How many ways to place holes on the rice squares fit every number (stops at `limit`). */
export function countSolutions(limit = 2): number {
  const cells = RICE.map(([r, c]) => idx(r, c));
  const where = new Map(cells.map((k, i) => [k, i]));
  const clues = REVEALED.map(([r, c]) => ({ n: clueOf(r, c), cells: neighbours(r, c).map(([rr, cc]) => where.get(idx(rr, cc))).filter((x): x is number => x !== undefined) }));
  const touching = cells.map(() => [] as number[]);
  clues.forEach((cl, i) => cl.cells.forEach((x) => touching[x].push(i)));
  const value = new Array<number>(cells.length).fill(-1);
  let found = 0;
  const fits = (i: number) => {
    let flags = 0;
    let open = 0;
    for (const x of clues[i].cells) {
      if (value[x] === 1) flags += 1;
      else if (value[x] < 0) open += 1;
    }
    return flags <= clues[i].n && flags + open >= clues[i].n;
  };
  const walk = (i: number) => {
    if (found >= limit) return;
    if (i === cells.length) {
      found += 1;
      return;
    }
    for (const v of [0, 1]) {
      value[i] = v;
      if (touching[i].every(fits)) walk(i + 1);
    }
    value[i] = -1;
  };
  walk(0);
  return found;
}

export interface Deduction {
  cell: Cell;
  mine: boolean;
  /** 'count' = one number decides it; 'pair' = two numbers together (the smaller one's squares are inside the bigger one's). */
  by: 'count' | 'pair';
}

/** Solves by reasoning alone: single numbers, then one number inside another. Returns the steps in order. */
export function deduce(): { steps: Deduction[]; solved: boolean } {
  const known = new Map<number, boolean>();
  const steps: Deduction[] = [];
  const clues = REVEALED.map(([r, c]) => ({ n: clueOf(r, c), cells: neighbours(r, c).filter(([rr, cc]) => !isRevealed(rr, cc)).map(([rr, cc]) => idx(rr, cc)) }));
  const open = (cl: { cells: number[] }) => cl.cells.filter((x) => !known.has(x));
  const left = (cl: { n: number; cells: number[] }) => cl.n - cl.cells.filter((x) => known.get(x) === true).length;
  const set = (k: number, mine: boolean, by: Deduction['by']) => {
    known.set(k, mine);
    steps.push({ cell: [Math.floor(k / COLS), k % COLS], mine, by });
  };
  let changed = true;
  while (changed) {
    changed = false;
    for (const cl of clues) {
      const u = open(cl);
      if (!u.length) continue;
      const l = left(cl);
      if (l === 0) u.forEach((x) => set(x, false, 'count'));
      else if (l === u.length) u.forEach((x) => set(x, true, 'count'));
      else continue;
      changed = true;
    }
    if (changed) continue;
    outer: for (const a of clues) {
      for (const b of clues) {
        const ua = open(a);
        const ub = open(b);
        if (a === b || !ua.length || ua.length >= ub.length || !ua.every((x) => ub.includes(x))) continue;
        const diff = ub.filter((x) => !ua.includes(x));
        const d = left(b) - left(a);
        if (d !== 0 && d !== diff.length) continue;
        diff.forEach((x) => set(x, d !== 0, 'pair'));
        changed = true;
        break outer;
      }
    }
  }
  return { steps, solved: RICE.every(([r, c]) => known.get(idx(r, c)) === isMine(r, c)) };
}

// ---------------------------------------------------------------- drawing

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

export const CELL = 124;
export const BOARD = { x: 70, y: 78 };
export const cellCentre = (r: number, c: number): { x: number; y: number } => ({ x: BOARD.x + c * CELL + CELL / 2, y: BOARD.y + r * CELL + CELL / 2 });
const CLAY = '#d9c49a';
const GOLD = '#ffd45a';

/** Offsets (in cell units of 30) of the mud dots for a number, laid out like dice. */
export function dotOffsets(n: number): [number, number][] {
  const s = 30;
  const ring: [number, number][] = [[-s, -s], [0, -s], [s, -s], [-s, 0], [s, 0], [-s, s], [0, s], [s, s]];
  const table: Record<number, [number, number][]> = {
    0: [],
    1: [[0, 0]],
    2: [[-s, -s], [s, s]],
    3: [[-s, -s], [0, 0], [s, s]],
    4: [[-s, -s], [s, -s], [-s, s], [s, s]],
    5: [[-s, -s], [s, -s], [0, 0], [-s, s], [s, s]],
    6: [[-s, -s], [s, -s], [-s, 0], [s, 0], [-s, s], [s, s]],
    7: [[-s, -s], [s, -s], [-s, 0], [0, 0], [s, 0], [-s, s], [s, s]],
    8: ring,
  };
  return table[n] ?? [];
}

/** Draws one square of the paddy (rice or ploughed) with its marks, at centre (x, y). */
function drawSquare(parent: Element, x: number, y: number, size: number, number: number | null, scale = 1): SVGGElement {
  const g = el('g', { transform: `translate(${x} ${y}) scale(${scale})` }, parent);
  const h = size / 2 - 3;
  if (number === null) {
    el('rect', { x: -h, y: -h, width: h * 2, height: h * 2, rx: 12, fill: '#4f7a45', stroke: '#2f4a2b', 'stroke-width': 3 }, g);
    for (let i = -2; i <= 2; i += 1) {
      el('path', { d: `M${i * 20} 36 q-4 -26 -12 -50 M${i * 20} 36 q2 -28 8 -56`, fill: 'none', stroke: '#8fb86a', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.8 }, g);
    }
    const flag = el('g', { 'data-mark': 'flag', style: 'display:none' }, g);
    el('ellipse', { cx: 0, cy: 30, rx: 30, ry: 12, fill: '#1a1008' }, flag);
    el('line', { x1: 0, y1: 30, x2: 0, y2: -36, stroke: '#e9d9b0', 'stroke-width': 5, 'stroke-linecap': 'round' }, flag);
    el('path', { d: 'M0 -36 L34 -24 L0 -10 Z', fill: '#e0533c' }, flag);
    const ring = el('g', { 'data-mark': 'none', style: 'display:none' }, g);
    el('circle', { cx: 0, cy: 0, r: 20, fill: 'none', stroke: '#e9d9b0', 'stroke-width': 5, opacity: 0.85 }, ring);
    const moon = el('g', { 'data-mark': 'moon', style: 'display:none' }, g);
    el('ellipse', { cx: 0, cy: 6, rx: 34, ry: 18, fill: '#1a1008' }, moon);
    el('circle', { 'data-role': 'halo', cx: 0, cy: 0, r: 54, fill: '#fff3c8', opacity: 0.4 }, moon);
    el('circle', { cx: 0, cy: 0, r: 22, fill: '#cfe7ff', opacity: 0.25 }, moon);
    el('circle', { cx: 0, cy: 0, r: 11, fill: '#eaf4ff' }, moon);
  } else {
    el('rect', { x: -h, y: -h, width: h * 2, height: h * 2, rx: 12, fill: '#6b4a32', stroke: '#3a281a', 'stroke-width': 3 }, g);
    for (const dy of [-34, -12, 10, 32]) el('line', { x1: -h + 10, y1: dy, x2: h - 10, y2: dy, stroke: '#5a3d28', 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
    for (const [dx, dy] of dotOffsets(number)) el('circle', { cx: dx, cy: dy, r: 9.5, class: 'mud', fill: CLAY, stroke: '#2a1a10', 'stroke-width': 2 }, g);
  }
  return g;
}

/** Shows each square the way these marks say, in the scene or in a copy of it. */
export function paintField(root: ParentNode, marks: readonly Mark[]): void {
  const solved = isSolved(marks);
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      const g = root.querySelector(`[data-cell="${idx(r, c)}"]`);
      if (!g) continue;
      // Once solved, everything but the constellations' holes steps back so the answer stands out.
      g.setAttribute('opacity', solved && !isAnswerHole(r, c) ? '0.4' : '1');
      if (isRevealed(r, c)) {
        const colour = clueDone(r, c, marks) ? GOLD : CLAY;
        g.querySelectorAll('.mud').forEach((d) => d.setAttribute('fill', colour));
        continue;
      }
      const m = marks[idx(r, c)];
      const show = (name: string, on: boolean) => {
        const node = g.querySelector<SVGElement>(`[data-mark="${name}"]`);
        if (node) node.style.display = on ? '' : 'none';
      };
      show('flag', m === 1 && !solved);
      show('none', m === 2);
      show('moon', m === 1 && solved);
      const halo = g.querySelector<SVGElement>('[data-role="halo"]');
      if (halo) halo.style.display = isAnswerHole(r, c) ? '' : 'none';
    }
  }
}

/** A little finished example: the middle square is ploughed with `n` dots and holes sit at the listed offsets. */
function drawSample(parent: Element, x: number, y: number, n: number, holes: readonly Cell[]): void {
  const size = 96;
  const g = el('g', { class: 'sample', 'pointer-events': 'none' }, parent);
  el('rect', { x: x - 3 * size / 2 - 14, y: y - 3 * size / 2 - 14, width: 3 * size + 28, height: 3 * size + 28, rx: 20, fill: '#1c2a24', stroke: '#e9d9b0', 'stroke-width': 3, 'stroke-dasharray': '10 8', opacity: 0.9 }, g);
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      const cx = x + (c - 1) * size;
      const cy = y + (r - 1) * size;
      if (r === 1 && c === 1) {
        const sq = drawSquare(g, cx, cy, CELL, n, size / CELL);
        sq.querySelectorAll('.mud').forEach((d) => d.setAttribute('fill', GOLD));
      } else {
        const sq = drawSquare(g, cx, cy, CELL, null, size / CELL);
        if (holes.some(([hr, hc]) => hr === r && hc === c)) sq.querySelector<SVGElement>('[data-mark="flag"]')!.style.display = '';
      }
    }
  }
}

export const crabField: PuzzleDef = {
  id: 'crab-field',
  get name() {
    return tr('Hang cua ruộng lúa', 'Crab Holes');
  },
  answer: HOLE_GROUPS.map((g) => g.glyph),
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const marks = emptyMarks();
    let wasSolved = false;

    // Back: night sky over a paddy.
    const skyId = uid('paddy-sky');
    const grad = el('linearGradient', { id: skyId, x1: 0, y1: 0, x2: 0, y2: 1 }, scene.defs);
    el('stop', { offset: 0, 'stop-color': '#0b1030' }, grad);
    el('stop', { offset: 1, 'stop-color': '#1f3a3a' }, grad);
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: url(skyId) }, back);
    starfield(back, { x: 0, y: 0, w: SCENE_W, h: 300 }, 50, 303);
    el('path', { d: `M-60 760 Q300 700 640 750 T1300 730 T1700 760 V960 H-60 Z`, fill: '#12261f' }, back);
    scene.grain('back', 0.35);

    // Mid: the paddy board and two finished examples.
    el('rect', { x: BOARD.x - 18, y: BOARD.y - 18, width: COLS * CELL + 36, height: ROWS * CELL + 36, rx: 26, fill: '#2c3b2a', stroke: '#101a12', 'stroke-width': 6 }, mid);
    const cells = new Map<number, SVGGElement>();
    for (let r = 0; r < ROWS; r += 1) {
      for (let c = 0; c < COLS; c += 1) {
        const { x, y } = cellCentre(r, c);
        const g = drawSquare(mid, x, y, CELL, isRevealed(r, c) ? clueOf(r, c) : null);
        g.setAttribute('data-cell', String(idx(r, c)));
        cells.set(idx(r, c), g);
      }
    }
    drawSample(mid, 1390, 255, 2, [[0, 0], [2, 2]]);
    drawSample(mid, 1390, 625, 1, [[1, 2]]);
    drawOwl(front, 1500, 836, 0.7);

    const label = (r: number, c: number) => {
      const m = marks[idx(r, c)];
      return tr(`Hàng ${r + 1}, cột ${c + 1}: ${m === 1 ? 'đã cắm cờ hang' : m === 2 ? 'đã đánh dấu không có hang' : 'ruộng lúa'}`, `Row ${r + 1}, column ${c + 1}: ${m === 1 ? 'flagged as a hole' : m === 2 ? 'marked as no hole' : 'rice field'}`);
    };
    const render = () => {
      paintField(scene.root, marks);
      const locked = isSolved(marks);
      cells.forEach((g, k) => {
        const r = Math.floor(k / COLS);
        const c = k % COLS;
        if (isRevealed(r, c)) return;
        g.setAttribute('aria-label', label(r, c) + (locked ? tr(' (đã khoá)', ' (locked)') : ''));
        // Solved: the field is locked, no more flags.
        if (locked) {
          g.style.pointerEvents = 'none';
          g.classList.remove('interactive');
          g.removeAttribute('tabindex');
          g.setAttribute('aria-disabled', 'true');
        }
      });
    };
    RICE.forEach(([r, c]) => {
      const g = cells.get(idx(r, c))!;
      g.classList.add('interactive');
      asButton(g, label(r, c), () => {
        if (isSolved(marks)) return;
        marks[idx(r, c)] = nextMark(marks[idx(r, c)]);
        sound.tick();
        render();
        const done = isSolved(marks);
        if (done && !wasSolved) sound.ding();
        wasSolved = done;
      });
    });
    render();

    return {
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const { steps } = deduce();
        const first = steps.find((s) => s.mine) ?? steps[0];
        const at = cellCentre(first.cell[0], first.cell[1]);
        const only = (cells: readonly Cell[]): Mark[] => emptyMarks().map((_, k) => (cells.some(([r, c]) => idx(r, c) === k) ? 1 : 0) as Mark);
        const rest = MINES.filter(([r, c]) => !(r === first.cell[0] && c === first.cell[1]));
        return [
          {
            note: tr('Số chấm bùn trên ô đã cày là số hang cua trong 8 ô xung quanh. Suy ra ô nào chắc chắn có hang rồi chạm để cắm cờ; chấm chuyển vàng khi đủ cờ.', 'The number of mud dots on a ploughed square is the number of crab holes in the 8 squares around it. Work out which squares surely have a hole, then tap to plant a flag; the dots turn gold when there are enough flags.'),
            targets: [{
              x: at.x, y: at.y, r: 56, verb: 'tap',
              act: (picture) => (p) => paintField(picture, p > 0.5 ? only([first.cell]) : emptyMarks()),
            }],
            apply: () => {
              marks.fill(0);
              marks[idx(first.cell[0], first.cell[1])] = 1;
              render();
            },
          },
          {
            note: tr('Làm tương tự với các ô còn lại, mỗi số chỉ còn đúng một cách. Khi mọi số đều vàng, các hang đọng nước trăng.', 'Do the same with the other squares; each number leaves only one way. When every number is gold, the holes fill with moonlit water.'),
            targets: [{
              x: cellCentre(4, 7).x, y: cellCentre(4, 7).y, r: 0, verb: 'look',
              act: (picture) => (p) => {
                const shown = Math.floor(clamp01(p / 0.85) * rest.length);
                paintField(picture, only([first.cell, ...rest.slice(0, shown)]));
              },
            }],
            apply: () => {
              MINES.forEach(([r, c]) => { marks[idx(r, c)] = 1; });
              render();
              wasSolved = true;
            },
          },
          {
            note: tr('Đọc ba chòm sao đọng nước trăng từ trái sang phải; ba hang lẻ không thuộc chòm nào.', 'Read the three constellations of moonlit water from left to right; the three stray holes belong to none.'),
            targets: HOLE_GROUPS.map((g) => {
              const mid2 = g.cells.reduce((s, [r, c]) => ({ x: s.x + cellCentre(r, c).x / g.cells.length, y: s.y + cellCentre(r, c).y / g.cells.length }), { x: 0, y: 0 });
              return { ...mid2, r: 120, verb: 'look' as const };
            }),
            prepare: (picture) => {
              const overlay = picture.querySelector('.layer-overlay') ?? picture;
              HOLE_GROUPS.forEach((g, i) => {
                const pts = g.cells.map(([r, c]) => cellCentre(r, c));
                for (const [a, b] of glyph(g.glyph).lines) {
                  // The lines are drawn between the holes that stand for the constellation's stars, in order of the stars.
                  if (pts[a] && pts[b]) el('line', { x1: pts[a].x, y1: pts[a].y, x2: pts[b].x, y2: pts[b].y, class: 'hint-line', 'pointer-events': 'none' }, overlay);
                }
                const top = pts.reduce((m, p) => (p.y < m.y ? p : m), pts[0]);
                const badge = el('g', { transform: `translate(${top.x} ${top.y - 52})`, 'pointer-events': 'none' }, overlay);
                el('circle', { r: 17, class: 'number-badge' }, badge);
                el('text', { y: 1, class: 'number-text' }, badge).textContent = String(i + 1);
              });
            },
          },
        ];
      },
      destroy: () => undefined,
    };
  },
};
