import { drawOwl } from '../core/owl';
import type { GlyphId } from '../core/glyphs';
import { glyph } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el } from '../core/svg';
import { starfield } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 4, level 1 — the punch cards ("thẻ đục lỗ"). The old keeper's slide projector takes
 * three cards, each a 5×5 grid of paper to punch. Beside every row and column the margin shows
 * groups of dots: each group is one run of holes side by side in that line (a group of two dots is
 * two holes next to each other), and two runs of one line are kept apart by at least one blank
 * cell. Punch the cards so every line matches its groups (a line that matches lights its groups
 * gold; a group of nothing is a bare ring). Light shines through the holes and shows as dots on
 * the little screens above; the three cards are the three constellations, left to right. Each
 * card has more holes than its constellation (a few stray ones), and only one set of holes fits
 * all its lines. A finished sample card on a shelf shows how groups and holes go together.
 */

export const SIZE = 5;
export type Cell = readonly [row: number, col: number];
export type Grid = boolean[][];

/** The cell a constellation's star falls in once its 100×100 box is laid over the 5×5 card. */
export function snappedCells(id: GlyphId): Cell[] {
  const seen = new Set<string>();
  const out: Cell[] = [];
  for (const [x, y] of glyph(id).stars) {
    const cell: Cell = [Math.round((y * (SIZE - 1)) / 100), Math.round((x * (SIZE - 1)) / 100)];
    const key = `${cell[0]},${cell[1]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cell);
  }
  return out;
}

export interface CardDef {
  glyph: GlyphId;
  /** Holes that belong to no constellation. */
  noise: readonly Cell[];
}

/** The three cards, in the order of the answer (the screens left to right). */
export const CARDS: readonly CardDef[] = [
  { glyph: 'triangle', noise: [[0, 1], [1, 2]] },
  { glyph: 'hook', noise: [[0, 1], [4, 1]] },
  { glyph: 'crown', noise: [[1, 3], [3, 2]] },
];

/** A finished card on the shelf: a little chair. */
export const SAMPLE: readonly string[] = ['#....', '#....', '####.', '#..#.', '#..#.'];

export const emptyGrid = (): Grid => Array.from({ length: SIZE }, () => Array<boolean>(SIZE).fill(false));

/** Where card `i`'s holes are when it is done. */
export function solutionGrid(i: number): Grid {
  const g = emptyGrid();
  for (const [r, c] of [...snappedCells(CARDS[i].glyph), ...CARDS[i].noise]) g[r][c] = true;
  return g;
}

export const sampleGrid = (): Grid => SAMPLE.map((row) => [...row].map((ch) => ch === '#'));

/** Lengths of the runs of holes in a line, in order. */
export function runsOf(line: readonly boolean[]): number[] {
  const out: number[] = [];
  let run = 0;
  for (const on of line) {
    if (on) run += 1;
    else {
      if (run) out.push(run);
      run = 0;
    }
  }
  if (run) out.push(run);
  return out;
}

export const rowOf = (g: Grid, r: number): boolean[] => g[r];
export const colOf = (g: Grid, c: number): boolean[] => g.map((row) => row[c]);

export interface Clues {
  rows: number[][];
  cols: number[][];
}

/** The groups shown in the margins, worked out from the holes. */
export function cluesOf(g: Grid): Clues {
  return {
    rows: g.map((_, r) => runsOf(rowOf(g, r))),
    cols: g[0].map((_, c) => runsOf(colOf(g, c))),
  };
}

const same = (a: readonly number[], b: readonly number[]): boolean => a.length === b.length && a.every((v, i) => v === b[i]);

/** Which lines of `g` already match `clues` (a line with the wrong groups, or no holes where there should be some, is false). */
export function linesDone(g: Grid, clues: Clues): { rows: boolean[]; cols: boolean[] } {
  return {
    rows: clues.rows.map((clue, r) => same(runsOf(rowOf(g, r)), clue)),
    cols: clues.cols.map((clue, c) => same(runsOf(colOf(g, c)), clue)),
  };
}

/** Every line matches: the card is finished (and, because only one set of holes fits, it is the right one). */
export function cardDone(i: number, g: Grid): boolean {
  const { rows, cols } = linesDone(g, cluesOf(solutionGrid(i)));
  return rows.every(Boolean) && cols.every(Boolean);
}

/** The answer: the constellations of the cards, left to right. */
export const READING_ORDER: readonly GlyphId[] = CARDS.map((c) => c.glyph);

// ── Layout (scene units) ────────────────────────────────────────────────────────────────────
/** The big card being punched: its top-left corner and the cell size. */
export const EDITOR = { x: 1000, y: 240, cell: 110 };
/** The three little screens. */
export const SCREEN = { x: 60, y: 70, size: 220, gap: 30, pad: 20 };
/** The finished sample card. */
export const SAMPLE_BOX = { x: 230, y: 520, cell: 46 };

export const screenOrigin = (i: number): { x: number; y: number } => ({ x: SCREEN.x + i * (SCREEN.size + SCREEN.gap), y: SCREEN.y });
const screenCell = (SCREEN.size - 2 * SCREEN.pad) / SIZE;
/** Centre of cell (r, c) on screen `i`. */
export function screenStar(i: number, r: number, c: number): { x: number; y: number } {
  const o = screenOrigin(i);
  return { x: o.x + SCREEN.pad + (c + 0.5) * screenCell, y: o.y + SCREEN.pad + (r + 0.5) * screenCell };
}
/** The cell of the big card under a scene point, or null outside it. */
export function editorCellAt(x: number, y: number): Cell | null {
  const c = Math.floor((x - EDITOR.x) / EDITOR.cell);
  const r = Math.floor((y - EDITOR.y) / EDITOR.cell);
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE ? [r, c] : null;
}
const editorCentre = (r: number, c: number): { x: number; y: number } => ({
  x: EDITOR.x + (c + 0.5) * EDITOR.cell,
  y: EDITOR.y + (r + 0.5) * EDITOR.cell,
});

// ── Drawing the groups of dots in the margins ───────────────────────────────────────────────
const DOT_STEP = 22;
const PILL_THICK = 34;
const PILL_GAP = 9;
const MARGIN = 18;
const pillLength = (k: number, s: number): number => (k * DOT_STEP + 8) * s;

/** One group: a pill holding `k` dots, its top-left at (x, y), lying along x (or along y when vertical). */
function drawPill(parent: Element, k: number, x: number, y: number, vertical: boolean, s: number, done: boolean): void {
  const len = pillLength(k, s);
  const w = vertical ? PILL_THICK * s : len;
  const h = vertical ? len : PILL_THICK * s;
  el('rect', { x: x.toFixed(1), y: y.toFixed(1), width: w.toFixed(1), height: h.toFixed(1), rx: (PILL_THICK * s) / 2, fill: done ? '#f4c66a' : '#efe6cf', stroke: done ? '#fff1c4' : '#8a6a3c', 'stroke-width': (3 * s).toFixed(1) }, parent);
  for (let j = 0; j < k; j += 1) {
    const along = (4 + DOT_STEP / 2 + j * DOT_STEP) * s;
    el('circle', { cx: (vertical ? x + w / 2 : x + along).toFixed(1), cy: (vertical ? y + along : y + h / 2).toFixed(1), r: (7 * s).toFixed(1), fill: '#3a2a18' }, parent);
  }
}

/** A line's groups next to the grid; `to` is the grid edge it hangs off, `across` the line's centre on the other axis. */
function drawClue(parent: Element, runs: readonly number[], vertical: boolean, to: number, across: number, s: number, done: boolean): void {
  let at = to - MARGIN * s;
  if (!runs.length) {
    const ring = vertical ? { cx: across, cy: at - 12 * s } : { cx: at - 12 * s, cy: across };
    el('circle', { cx: ring.cx.toFixed(1), cy: ring.cy.toFixed(1), r: (8 * s).toFixed(1), fill: 'none', stroke: done ? '#f4c66a' : '#8a6a3c', 'stroke-width': (4 * s).toFixed(1) }, parent);
    return;
  }
  for (let i = runs.length - 1; i >= 0; i -= 1) {
    const len = pillLength(runs[i], s);
    at -= len;
    if (vertical) drawPill(parent, runs[i], across - (PILL_THICK * s) / 2, at, true, s, done);
    else drawPill(parent, runs[i], at, across - (PILL_THICK * s) / 2, false, s, done);
    at -= PILL_GAP * s;
  }
}

/** Both margins of a card whose top-left is (x0, y0). */
function drawClues(parent: Element, clues: Clues, done: { rows: boolean[]; cols: boolean[] }, x0: number, y0: number, cell: number): void {
  const s = Math.min(1, cell / 100);
  clues.rows.forEach((runs, r) => drawClue(parent, runs, false, x0, y0 + (r + 0.5) * cell, s, done.rows[r]));
  clues.cols.forEach((runs, c) => drawClue(parent, runs, true, y0, x0 + (c + 0.5) * cell, s, done.cols[c]));
}

const HOLE = { fill: '#fff6d6', stroke: '#241f33' };

export const punchCards: PuzzleDef = {
  id: 'punch-cards',
  name: 'Thẻ đục lỗ',
  answer: [...READING_ORDER],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const cardClues = CARDS.map((_, i) => cluesOf(solutionGrid(i)));
    const punched: Grid[] = CARDS.map(() => emptyGrid());
    let active = 0;

    // Back: the observatory wall, the shape of the dome, a few stars.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#14172b' }, back);
    el('circle', { cx: 1270, cy: 500, r: 520, fill: 'none', stroke: '#1d2342', 'stroke-width': 26, 'pointer-events': 'none' }, back);
    starfield(back, { x: 0, y: 0, w: SCENE_W, h: SCENE_H }, 70, 4101);
    el('rect', { x: -60, y: 846, width: SCENE_W + 120, height: 120, fill: '#2a1f1a' }, back);
    scene.grain('back', 0.45);

    // Mid: the finished sample card on its shelf.
    const sample = sampleGrid();
    const sampleClues = cluesOf(sample);
    const all = { rows: sampleClues.rows.map(() => true), cols: sampleClues.cols.map(() => true) };
    const sb = SAMPLE_BOX;
    const sampleG = el('g', { 'pointer-events': 'none' }, mid);
    el('rect', { x: sb.x - 130, y: sb.y - 120, width: 130 + SIZE * sb.cell + 26, height: 120 + SIZE * sb.cell + 26, rx: 18, fill: '#241f33', stroke: '#6b4f24', 'stroke-width': 5 }, sampleG);
    el('rect', { x: sb.x, y: sb.y, width: SIZE * sb.cell, height: SIZE * sb.cell, rx: 6, fill: '#efe6cf', stroke: '#cbbb94', 'stroke-width': 3 }, sampleG);
    for (let r = 0; r < SIZE; r += 1) {
      for (let c = 0; c < SIZE; c += 1) {
        const cx = sb.x + (c + 0.5) * sb.cell;
        const cy = sb.y + (r + 0.5) * sb.cell;
        if (sample[r][c]) el('circle', { cx, cy, r: sb.cell * 0.3, fill: HOLE.fill, stroke: HOLE.stroke, 'stroke-width': 4 }, sampleG);
        else el('circle', { cx, cy, r: 2.5, fill: '#d9ccab' }, sampleG);
      }
    }
    drawClues(sampleG, sampleClues, all, sb.x, sb.y, sb.cell);
    el('rect', { x: sb.x - 160, y: sb.y + SIZE * sb.cell + 36, width: 470, height: 26, rx: 5, fill: '#4a3426' }, mid);

    // Front: the three screens (each a button that picks its card) and the big card being punched.
    const frames: SVGRectElement[] = [];
    const lamps: SVGCircleElement[] = [];
    const dots: SVGCircleElement[][][] = [];
    CARDS.forEach((_, i) => {
      const o = screenOrigin(i);
      const g = el('g', { class: 'interactive', 'data-hint': `screen-${i}` }, front);
      frames.push(el('rect', { x: o.x, y: o.y, width: SCREEN.size, height: SCREEN.size, rx: 16, fill: '#0b0e1d', stroke: '#6b4f24', 'stroke-width': 6 }, g));
      dots.push(Array.from({ length: SIZE }, (_, r) => Array.from({ length: SIZE }, (_, c) => {
        const p = screenStar(i, r, c);
        const dot = el('circle', { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: 7, fill: '#f6efd8', 'data-dot': `${i}-${r}-${c}`, 'pointer-events': 'none' }, g);
        dot.style.display = 'none';
        return dot;
      })));
      lamps.push(el('circle', { cx: o.x + SCREEN.size / 2, cy: o.y + SCREEN.size + 30, r: 12, fill: '#3a3550', stroke: '#6b4f24', 'stroke-width': 3, 'pointer-events': 'none' }, g));
      asButton(g, `Màn chiếu ${i + 1}`, () => select(i));
    });

    const board = el('g', {}, front);
    el('rect', { x: EDITOR.x - EDITOR.cell * 1.56, y: EDITOR.y - EDITOR.cell * 1.4, width: EDITOR.cell * 1.56 + SIZE * EDITOR.cell + 26, height: EDITOR.cell * 1.4 + SIZE * EDITOR.cell + 26, rx: 22, fill: '#241f33', stroke: '#6b4f24', 'stroke-width': 6, 'pointer-events': 'none' }, board);
    el('rect', { x: EDITOR.x, y: EDITOR.y, width: SIZE * EDITOR.cell, height: SIZE * EDITOR.cell, rx: 10, fill: '#efe6cf', stroke: '#cbbb94', 'stroke-width': 4, 'pointer-events': 'none' }, board);
    for (let k = 1; k < SIZE; k += 1) {
      el('path', { d: `M${EDITOR.x + k * EDITOR.cell} ${EDITOR.y + 8} V${EDITOR.y + SIZE * EDITOR.cell - 8} M${EDITOR.x + 8} ${EDITOR.y + k * EDITOR.cell} H${EDITOR.x + SIZE * EDITOR.cell - 8}`, stroke: '#cbbb94', 'stroke-width': 2, 'pointer-events': 'none' }, board);
    }
    const clueG = el('g', { 'pointer-events': 'none' }, board);
    const cellNodes: SVGGElement[][] = [];
    const holes: SVGCircleElement[][] = [];
    for (let r = 0; r < SIZE; r += 1) {
      cellNodes.push([]);
      holes.push([]);
      for (let c = 0; c < SIZE; c += 1) {
        const p = editorCentre(r, c);
        const g = el('g', { class: 'interactive punch-cell', 'pointer-events': 'none' }, board);
        el('circle', { cx: p.x, cy: p.y, r: 5, fill: '#d9ccab' }, g);
        const hole = el('circle', { cx: p.x, cy: p.y, r: EDITOR.cell * 0.31, fill: HOLE.fill, stroke: HOLE.stroke, 'stroke-width': 9, 'data-hole': `${r}-${c}` }, g);
        hole.style.display = 'none';
        cellNodes[r].push(g);
        holes[r].push(hole);
        g.setAttribute('tabindex', '0');
        g.setAttribute('role', 'checkbox');
        g.addEventListener('keydown', (event) => {
          const key = event.key;
          if (key === 'Enter' || key === ' ') {
            event.preventDefault();
            setCell(r, c, !punched[active][r][c]);
            return;
          }
          const move: Record<string, Cell> = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
          const d = move[key];
          if (!d) return;
          event.preventDefault();
          cellNodes[Math.min(SIZE - 1, Math.max(0, r + d[0]))][Math.min(SIZE - 1, Math.max(0, c + d[1]))].focus();
        });
      }
    }
    // One transparent plate over the grid takes touches and drags, so a finger can paint a whole line.
    const plate = el('rect', { x: EDITOR.x, y: EDITOR.y, width: SIZE * EDITOR.cell, height: SIZE * EDITOR.cell, fill: 'transparent', class: 'interactive' }, board);
    drawOwl(front, 700, 846, 0.75);

    const wasDone = CARDS.map(() => false);
    const render = () => {
      const g = punched[active];
      for (let r = 0; r < SIZE; r += 1) {
        for (let c = 0; c < SIZE; c += 1) {
          holes[r][c].style.display = g[r][c] ? '' : 'none';
          cellNodes[r][c].setAttribute('aria-checked', String(g[r][c]));
          cellNodes[r][c].setAttribute('aria-label', `Hàng ${r + 1}, cột ${c + 1}: ${g[r][c] ? 'đã đục' : 'chưa đục'}`);
        }
      }
      CARDS.forEach((_, i) => {
        for (let r = 0; r < SIZE; r += 1) for (let c = 0; c < SIZE; c += 1) dots[i][r][c].style.display = punched[i][r][c] ? '' : 'none';
        frames[i].setAttribute('stroke', i === active ? '#f4c66a' : '#6b4f24');
        frames[i].setAttribute('stroke-width', i === active ? '9' : '6');
        lamps[i].setAttribute('fill', cardDone(i, punched[i]) ? '#f4c66a' : '#3a3550');
      });
      clueG.replaceChildren();
      drawClues(clueG, cardClues[active], linesDone(g, cardClues[active]), EDITOR.x, EDITOR.y, EDITOR.cell);
    };
    function select(i: number): void {
      if (i === active) return;
      active = i;
      sound.paper();
      render();
    }
    function setCell(r: number, c: number, on: boolean): void {
      if (punched[active][r][c] === on) return;
      punched[active][r][c] = on;
      sound.tick();
      render();
      const done = cardDone(active, punched[active]);
      if (done && !wasDone[active]) sound.ding();
      wasDone[active] = done;
    }

    let paint: boolean | null = null;
    scene.draggable(plate, {
      start: (p) => {
        const cell = editorCellAt(p.x, p.y);
        if (!cell) {
          paint = null;
          return;
        }
        paint = !punched[active][cell[0]][cell[1]];
        setCell(cell[0], cell[1], paint);
      },
      move: (p) => {
        const cell = editorCellAt(p.x, p.y);
        if (cell && paint !== null) setCell(cell[0], cell[1], paint);
      },
      end: () => {
        paint = null;
      },
    });
    render();

    /** Puts card `i` into its finished state without sound or tweening (used by the hint card). */
    const finish = (i: number) => {
      punched[i] = solutionGrid(i);
      wasDone[i] = true;
    };

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const first = [...snappedCells(CARDS[0].glyph), ...CARDS[0].noise].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        const at = editorCentre(first[0][0], first[0][1]);
        const scr = (i: number) => ({ x: screenOrigin(i).x + SCREEN.size / 2, y: screenOrigin(i).y + SCREEN.size / 2 });
        /** Shows the dots of card `i` one after another, as progress goes 0..1, on its screen (and in the big card when `big`). */
        const punchIn = (i: number, big: boolean, picture: SVGSVGElement) => {
          const cells = [...snappedCells(CARDS[i].glyph), ...CARDS[i].noise].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
          const nodes = cells.map(([r, c]) => ({
            dot: picture.querySelector<SVGElement>(`[data-dot="${i}-${r}-${c}"]`),
            hole: big ? picture.querySelector<SVGElement>(`[data-hole="${r}-${c}"]`) : null,
          }));
          return (p: number) => nodes.forEach((n, k) => {
            const shown = p > (k + 0.5) / nodes.length ? '' : 'none';
            if (n.dot) n.dot.style.display = shown;
            if (n.hole) n.hole.style.display = shown;
          });
        };
        return [
          {
            note: 'Cụm chấm ở mép thẻ là các dải lỗ liền nhau trong hàng (cột) đó, hai dải cách nhau ít nhất một ô trống. Chạm hoặc kéo để đục lỗ cho khớp mọi hàng và cột.',
            targets: [
              { x: at.x, y: at.y, r: 55, verb: 'tap', act: (picture) => punchIn(0, true, picture) },
            ],
            apply: () => {
              active = 0;
              finish(0);
              render();
            },
          },
          {
            note: 'Làm tương tự với hai thẻ còn lại: chạm màn nhỏ để chọn thẻ rồi đục.',
            targets: [
              { x: scr(1).x, y: scr(1).y, r: 60, verb: 'tap', act: (picture) => {
                const a = punchIn(1, false, picture);
                const b = punchIn(2, false, picture);
                return (p) => { a(p); b(p); };
              } },
              { x: scr(2).x, y: scr(2).y, r: 60, verb: 'tap' },
            ],
            apply: () => {
              finish(1);
              finish(2);
              active = 2;
              render();
            },
          },
          {
            note: 'Đọc chòm sao trên ba màn từ trái sang phải; bỏ qua các chấm lẻ.',
            targets: CARDS.map((_, i) => ({ x: scr(i).x, y: scr(i).y, r: SCREEN.size * 0.58, verb: 'look' as const })),
            prepare: (picture) => {
              const overlay = picture.querySelector('.layer-overlay') ?? picture;
              CARDS.forEach((card, i) => {
                const cells = snappedCells(card.glyph);
                const at = (idx: number) => screenStar(i, cells[idx][0], cells[idx][1]);
                for (const [a, b] of glyph(card.glyph).lines) {
                  const pa = at(a);
                  const pb = at(b);
                  el('line', { x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y, class: 'hint-line', 'pointer-events': 'none' }, overlay);
                }
                const badge = el('g', { transform: `translate(${screenOrigin(i).x + SCREEN.size / 2} ${screenOrigin(i).y - 26})`, 'pointer-events': 'none' }, overlay);
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

