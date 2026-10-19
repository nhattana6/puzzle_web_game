import { drawOwl } from '../core/owl';
import type { GlyphId } from '../core/glyphs';
import { placeStars } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el } from '../core/svg';
import { AFFECTS } from './domeLevers';
import { cluesOf, runsOf, type Grid } from './punchCards';
import { starfield } from './sky';
import type { HintStep, PuzzleDef } from './types';
import { tr } from '../core/i18n';

/**
 * Chapter 4, level 12 — opening the dome ("mở vòm"), the finale: three boards in a chain, each with the
 * rules of an earlier level of the chapter. (1) A punch card (as in level 1): the holes are found from
 * the groups of dots in the margins. Light shines through the holes onto the lamps of (2) the lever
 * board (as in level 4): lamps over a hole start lit, the others dark, and the levers must be set so
 * that all seven are lit. The levers left down then name the tiles of (3) the telescope yard (as in
 * level 10) where a telescope already stands, and the player places the rest. Each board only has its
 * puzzle once the one before it is done; none is solvable alone (without the lamps the levers are
 * unknown, without the levers the yard has several solutions). The answer is the four constellations in
 * the lenses of the rivet regions of the finished yard, left to right.
 */

// ── Board 1: the punch card ─────────────────────────────────────────────────────────────────
export const CARD: readonly string[] = ['01110', '11100', '00011', '10011', '00110'];
export const cardGrid = (): Grid => CARD.map((row) => [...row].map((ch) => ch === '1'));
export const CARD_CLUES = cluesOf(cardGrid());

/** The six cells where the ring of lamps sits on the card (lamp 0 is the centre, 1–6 go clockwise from the top). */
export const RING: readonly (readonly [number, number])[] = [[2, 2], [0, 2], [1, 4], [3, 4], [4, 2], [3, 0], [1, 0]];

/** The number of ways to fill a 5×5 card so that every row and column shows the given groups. */
export function countCards(rows: readonly (readonly number[])[], cols: readonly (readonly number[])[], limit = 2): number {
  const same = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((v, i) => v === b[i]);
  const masks = Array.from({ length: 32 }, (_, m) => Array.from({ length: 5 }, (_, c) => ((m >> c) & 1) === 1));
  const options = rows.map((clue) => masks.filter((m) => same(runsOf(m), clue)));
  let count = 0;
  const grid: boolean[][] = [];
  const prefixOk = (final: boolean) => cols.every((clue, c) => {
    const col = grid.map((row) => row[c]);
    const runs = runsOf(col);
    if (final) return same(runs, clue);
    const growing = col[col.length - 1];
    const closed = growing ? runs.slice(0, -1) : runs;
    if (closed.length > clue.length || closed.some((v, i) => v !== clue[i])) return false;
    return !growing || (closed.length < clue.length && runs[runs.length - 1] <= clue[closed.length]);
  });
  const rec = (r: number): void => {
    if (count >= limit) return;
    if (r === 5) {
      if (prefixOk(true)) count += 1;
      return;
    }
    for (const m of options[r]) {
      grid.push(m);
      if (prefixOk(false)) rec(r + 1);
      grid.pop();
    }
  };
  rec(0);
  return count;
}

/** Whether every row and column of the punched card shows its groups. */
export function cardMatches(g: Grid): boolean {
  const same = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((v, i) => v === b[i]);
  const rows = g.every((row, r) => same(runsOf(row), CARD_CLUES.rows[r]));
  const cols = g[0].every((_, c) => same(runsOf(g.map((row) => row[c])), CARD_CLUES.cols[c]));
  return rows && cols;
}

// ── Board 2: the lever board ────────────────────────────────────────────────────────────────
export const LAMPS = 7;
export const LEVERS = 7;
/** Which lamps start lit: those whose ring cell on the card is a hole. */
export const startLamps = (g: Grid): boolean[] => RING.map(([r, c]) => g[r][c]);
/** Which lamps are lit with the given levers down: the card's light, flipped by every lever that is down. */
export function lampsLit(g: Grid, down: readonly number[]): boolean[] {
  return startLamps(g).map((on, j) => (down.filter((i) => AFFECTS[i].includes(j)).length % 2 === 1 ? !on : on));
}
export const allLit = (g: Grid, down: readonly number[]): boolean => lampsLit(g, down).every(Boolean);
/** The levers that are down in the one setting that lights every lamp. */
export const LEVERS_DOWN: readonly number[] = [0, 5, 6];
/** The tile of the yard each lever points to (shown as a small grid below it). */
export const LEVER_CELLS: readonly (readonly [number, number])[] = [[3, 3], [1, 4], [4, 4], [2, 0], [5, 1], [0, 0], [5, 4]];

// ── Board 3: the telescope yard ─────────────────────────────────────────────────────────────
export const N = 6;
export const REGIONS: readonly (readonly number[])[] = [
  [2, 2, 3, 3, 1, 1],
  [2, 3, 3, 1, 1, 1],
  [5, 5, 4, 4, 1, 1],
  [5, 4, 4, 4, 1, 1],
  [5, 5, 4, 4, 4, 0],
  [0, 0, 0, 0, 0, 0],
];
/** The one placement of the six telescopes: the column of each row's telescope. */
export const YARD_SOLUTION: readonly number[] = [0, 2, 5, 3, 1, 4];
export const RIVET: readonly number[] = [0, 1, 3, 5];
export const LENS: readonly (readonly (GlyphId | null)[])[] = [
  [null, null, 'diamond', 'square', 'diamond', 'cross'],
  [null, 'belt', 'hook', 'hook', 'diamond', 'dipper'],
  ['triangle', 'cross', null, null, 'crown', 'arrow'],
  ['arrow', null, null, null, 'hook', 'diamond'],
  ['square', 'crown', null, null, null, 'arrow'],
  ['arrow', 'dipper', 'crown', 'hook', 'cross', 'crown'],
];
export type Cell = readonly [number, number];
export const YARD_CELLS: readonly Cell[] = YARD_SOLUTION.map((c, r) => [r, c] as const);
/** The telescopes the levers that are down put in place. */
export const givensOf = (down: readonly number[]): Cell[] => [...down].sort((a, b) => a - b).map((i) => LEVER_CELLS[i]);
export const GIVENS: readonly Cell[] = givensOf(LEVERS_DOWN);

export const clash = (a: Cell, b: Cell): boolean =>
  a[0] === b[0] || a[1] === b[1] || REGIONS[a[0]][a[1]] === REGIONS[b[0]][b[1]] || (Math.abs(a[0] - b[0]) <= 1 && Math.abs(a[1] - b[1]) <= 1);
export const conflicting = (cells: readonly Cell[]): boolean[] => cells.map((a, i) => cells.some((b, j) => i !== j && clash(a, b)));
export const yardSolved = (cells: readonly Cell[]): boolean => cells.length === N && !conflicting(cells).some(Boolean);
/** The constellations in the lenses of telescopes on rivet regions, from the left column to the right. */
export function lensesLeftToRight(cells: readonly Cell[]): GlyphId[] {
  return cells
    .filter(([r, c]) => LENS[r][c] !== null)
    .sort((a, b) => a[1] - b[1] || a[0] - b[0])
    .map(([r, c]) => LENS[r][c] as GlyphId);
}
export const READING_ORDER: readonly GlyphId[] = lensesLeftToRight(YARD_CELLS);
export const isRivet = (r: number, c: number): boolean => LENS[r][c] !== null;
/** The yard's solutions (as telescope columns per row) that contain all the given telescopes. */
export function yardSolutions(givens: readonly Cell[] = []): number[][] {
  const out: number[][] = [];
  const rec = (cur: number[]) => {
    if (cur.length === N) {
      const cells = cur.map((c, r) => [r, c] as const);
      if (yardSolved(cells) && givens.every(([r, c]) => cur[r] === c)) out.push(cur.slice());
      return;
    }
    for (let c = 0; c < N; c += 1) if (!cur.includes(c)) rec([...cur, c]);
  };
  rec([]);
  return out;
}

// ── Layout (scene units) ────────────────────────────────────────────────────────────────────
const CARD1 = { x: 530, y: 310, cell: 108 };
const CARD2 = { cx: 310, cy: 520, cell: 100 };
const leverX = (i: number): number => 690 + i * 130;
const SLOT = { top: 390, bottom: 530 };
const YARD = { x: 90, y: 195, cell: 110 };
const tileCentre = (r: number, c: number): { x: number; y: number } => ({ x: YARD.x + (c + 0.5) * YARD.cell, y: YARD.y + (r + 0.5) * YARD.cell });
const TINTS = ['#3b3355', '#2f4458', '#4a3a3a', '#2f4a44', '#4a4630', '#44304a'];
const TAB_X = [1210, 1330, 1450];
const TAB_Y = 84;
const DOME = { x: 70, y: 150, w: 400, h: 140 };
const domeSlot = (k: number): { x: number; y: number } => ({ x: 150 + k * 80, y: 120 });

const lampCell = (j: number): { x: number; y: number } => ({
  x: CARD2.cx + (RING[j][1] - 2) * CARD2.cell,
  y: CARD2.cy + (RING[j][0] - 2) * CARD2.cell,
});

export const openDome: PuzzleDef = {
  id: 'open-dome',
  get name() {
    return tr('Mở vòm', 'Open the Dome');
  },
  answer: [...READING_ORDER],
  get help() {
    return [
      tr('Ba bảng nối với nhau: bảng sau chỉ có đề khi bảng trước đã xong. Ba biểu tượng ở góc trên để chuyển giữa các bảng đã mở.', 'Three boards are linked: a board only gets its puzzle once the one before it is done. The three icons at the top corner switch between the boards that are open.'),
      tr('Ánh sáng lọt qua các lỗ của thẻ đục lỗ thắp những đèn ở bảng cần gạt: đèn nằm dưới lỗ thì sáng. Những cần đang gạt xuống ở bảng cần gạt chỉ ra các ô đã có sẵn kính ở sân kính thiên văn.', 'Light through the holes of the punch card lights the lamps on the lever board: a lamp under a hole is on. The levers that are down on the lever board show which squares of the telescope yard already have a telescope.'),
      tr('Luật mỗi bảng như các màn trước. Khi sân kính xong, đọc các chòm trong thấu kính ở những vùng có đinh tán đồng, từ trái sang phải: chúng hiện lên mái vòm.', 'Each board has the same rules as the earlier levels. When the telescope yard is done, read the constellations in the lenses of the regions with brass rivets, from left to right: they show up on the dome.'),
    ];
  },
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const holes: Grid = Array.from({ length: 5 }, () => Array<boolean>(5).fill(false));
    const down = new Set<number>();
    const yard: (0 | 1 | 2)[][] = Array.from({ length: N }, () => Array<0 | 1 | 2>(N).fill(0));
    const done = [false, false, false];
    let stage = 0;
    let timer = 0;

    // Back: the observatory wall.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#14172b' }, back);
    starfield(back, { x: 0, y: 0, w: SCENE_W, h: SCENE_H }, 50, 6212);
    scene.grain('back', 0.45);

    // Mid: the dome outline (answer appears in it), and the three boards' backgrounds.
    el('path', { d: `M${DOME.x} ${DOME.y + 30} A${DOME.w / 2} ${DOME.h + 30} 0 0 1 ${DOME.x + DOME.w} ${DOME.y + 30} Z`, fill: '#1b2040', stroke: '#6b4f24', 'stroke-width': 8, 'stroke-linejoin': 'round', 'pointer-events': 'none' }, mid);
    const domeSlots: SVGGElement[] = [];
    for (let k = 0; k < 4; k += 1) {
      const p = domeSlot(k);
      const g = el('g', { 'pointer-events': 'none' }, mid);
      el('circle', { cx: p.x, cy: p.y, r: 33, fill: 'none', stroke: '#3b3866', 'stroke-width': 3, 'stroke-dasharray': '6 8' }, g);
      const art = el('g', {}, g);
      art.style.display = 'none';
      domeSlots.push(art);
    }
    const READING = [...READING_ORDER];
    READING.forEach((id, k) => {
      const p = domeSlot(k);
      for (const [x, y] of placeStars(id, p.x, p.y, 52)) el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 3.8, fill: '#fff1c4' }, domeSlots[k]);
    });

    const views = [0, 1, 2].map(() => el('g', {}, mid));
    const frontViews = [0, 1, 2].map(() => el('g', {}, front));

    // ── Stage 1 view: the punch card with its margins ──────────────────────────────────────
    const cellRects: SVGRectElement[][] = [];
    const cellHoles: SVGRectElement[][] = [];
    const clueNodes: { rows: SVGCircleElement[][]; cols: SVGCircleElement[][] } = { rows: [], cols: [] };
    {
      const v = views[0];
      el('rect', { x: CARD1.x - 14, y: CARD1.y - 14, width: 5 * CARD1.cell + 28, height: 5 * CARD1.cell + 28, rx: 14, fill: '#2a2236', stroke: '#6b4f24', 'stroke-width': 6, 'pointer-events': 'none' }, v);
      const fv = frontViews[0];
      for (let r = 0; r < 5; r += 1) {
        cellRects.push([]);
        cellHoles.push([]);
        for (let c = 0; c < 5; c += 1) {
          const x = CARD1.x + c * CARD1.cell;
          const y = CARD1.y + r * CARD1.cell;
          el('rect', { x: x + 4, y: y + 4, width: CARD1.cell - 8, height: CARD1.cell - 8, rx: 6, fill: '#d9c9a0', stroke: '#a89870', 'stroke-width': 2, 'pointer-events': 'none' }, v);
          const hole = el('rect', { x: x + 20, y: y + 20, width: CARD1.cell - 40, height: CARD1.cell - 40, rx: 5, fill: '#0b0e1d', stroke: '#7a6a3a', 'stroke-width': 3, 'pointer-events': 'none', 'data-c1': `${r}-${c}` }, fv);
          hole.style.display = 'none';
          cellHoles[r].push(hole);
          const hit = el('rect', { x, y, width: CARD1.cell, height: CARD1.cell, fill: 'transparent', class: 'interactive' }, fv);
          asButton(hit, tr(`Thẻ, hàng ${r + 1}, cột ${c + 1}`, `Card, row ${r + 1}, column ${c + 1}`), () => tapCard(r, c));
          cellRects[r].push(hit);
        }
      }
      // Margin groups of dots.
      CARD_CLUES.rows.forEach((groups, r) => {
        const dots: SVGCircleElement[] = [];
        let x = CARD1.x - 30;
        for (let k = groups.length - 1; k >= 0; k -= 1) {
          for (let d = 0; d < groups[k]; d += 1) {
            dots.push(el('circle', { cx: x, cy: CARD1.y + (r + 0.5) * CARD1.cell, r: 9, fill: '#8d8fc4', 'pointer-events': 'none' }, v));
            x -= 25;
          }
          x -= 18;
        }
        clueNodes.rows.push(dots);
      });
      CARD_CLUES.cols.forEach((groups, c) => {
        const dots: SVGCircleElement[] = [];
        let y = CARD1.y - 30;
        for (let k = groups.length - 1; k >= 0; k -= 1) {
          for (let d = 0; d < groups[k]; d += 1) {
            dots.push(el('circle', { cx: CARD1.x + (c + 0.5) * CARD1.cell, cy: y, r: 9, fill: '#8d8fc4', 'pointer-events': 'none' }, v));
            y -= 25;
          }
          y -= 18;
        }
        clueNodes.cols.push(dots);
      });
    }

    // ── Stage 2 view: the card behind the lamps, the lamps, and the seven levers ───────────
    const lampNodes: SVGCircleElement[] = [];
    const knobs: SVGGElement[] = [];
    const card2Holes: SVGRectElement[][] = [];
    {
      const v = views[1];
      el('rect', { x: CARD2.cx - 2.5 * CARD2.cell - 12, y: CARD2.cy - 2.5 * CARD2.cell - 12, width: 5 * CARD2.cell + 24, height: 5 * CARD2.cell + 24, rx: 14, fill: '#2a2236', stroke: '#6b4f24', 'stroke-width': 6, 'pointer-events': 'none' }, v);
      for (let r = 0; r < 5; r += 1) {
        card2Holes.push([]);
        for (let c = 0; c < 5; c += 1) {
          const x = CARD2.cx + (c - 2.5) * CARD2.cell;
          const y = CARD2.cy + (r - 2.5) * CARD2.cell;
          el('rect', { x: x + 4, y: y + 4, width: CARD2.cell - 8, height: CARD2.cell - 8, rx: 6, fill: '#d9c9a0', stroke: '#a89870', 'stroke-width': 2, 'pointer-events': 'none' }, v);
          card2Holes[r].push(el('rect', { x: x + 22, y: y + 22, width: CARD2.cell - 44, height: CARD2.cell - 44, rx: 5, fill: '#0b0e1d', stroke: '#7a6a3a', 'stroke-width': 3, 'pointer-events': 'none' }, v));
        }
      }
      el('rect', { x: 600, y: 130, width: 960, height: 740, rx: 24, fill: '#241f33', stroke: '#6b4f24', 'stroke-width': 6, 'pointer-events': 'none' }, v);
      const fv = frontViews[1];
      for (let j = 0; j < LAMPS; j += 1) {
        const p = lampCell(j);
        el('circle', { cx: p.x, cy: p.y, r: 40, fill: '#0b0e1d', stroke: '#6b4f24', 'stroke-width': 5, 'pointer-events': 'none' }, fv);
        lampNodes.push(el('circle', { cx: p.x, cy: p.y, r: 31, fill: '#3a3550', 'pointer-events': 'none', 'data-lamp2': j }, fv));
      }
      for (let i = 0; i < LEVERS; i += 1) {
        const x = leverX(i);
        const g = el('g', { class: 'interactive', 'data-hint': `lever-${i}` }, fv);
        el('rect', { x: x - 62, y: 150, width: 124, height: 700, rx: 14, fill: 'transparent' }, g);
        // The lamps this lever flips, drawn small like the ring on the card.
        el('rect', { x: x - 54, y: 212, width: 108, height: 108, rx: 10, fill: 'none', stroke: '#4a456e', 'stroke-width': 2, 'pointer-events': 'none' }, g);
        for (let j = 0; j < LAMPS; j += 1) {
          const mx = x + (RING[j][1] - 2) * 21;
          const my = 266 + (RING[j][0] - 2) * 21;
          const on = AFFECTS[i].includes(j);
          el('circle', { cx: mx, cy: my, r: on ? 8.5 : 5.5, fill: on ? '#f4c66a' : 'none', stroke: on ? '#fff1c4' : '#5a6099', 'stroke-width': 2, 'pointer-events': 'none' }, g);
        }
        el('rect', { x: x - 16, y: SLOT.top - 28, width: 32, height: SLOT.bottom - SLOT.top + 56, rx: 16, fill: '#120d18', stroke: '#6b4f24', 'stroke-width': 3, 'pointer-events': 'none' }, g);
        const knob = el('g', { 'pointer-events': 'none', 'data-knob': i }, g);
        el('circle', { r: 27, fill: '#d3a64f', stroke: '#8a6a2c', 'stroke-width': 4 }, knob);
        el('circle', { r: 9, fill: '#f6efd8' }, knob);
        knobs.push(knob);
        // The yard tile this lever points to: a small grid with one tile marked.
        const [lr, lc] = LEVER_CELLS[i];
        const mini = 18;
        for (let r = 0; r < N; r += 1) {
          for (let c = 0; c < N; c += 1) {
            const mark = r === lr && c === lc;
            el('rect', { x: x - 3 * mini + c * mini, y: 640 + r * mini, width: mini - 1, height: mini - 1, fill: mark ? '#f4c66a' : '#2f2b4a', 'pointer-events': 'none' }, g);
          }
        }
        asButton(g, tr(`Cần gạt ${i + 1}`, `Lever ${i + 1}`), () => toggleLever(i));
      }
    }

    // ── Stage 3 view: the yard, with the levers' tiles on the right ────────────────────────
    const dotNodes: SVGGElement[][] = [];
    const scopeNodes: SVGGElement[][] = [];
    const ringNodes: SVGCircleElement[][] = [];
    const givenBadges: SVGGElement[][] = [];
    {
      const v = views[2];
      const half = YARD.cell / 2;
      for (let r = 0; r < N; r += 1) {
        for (let c = 0; c < N; c += 1) {
          const p = tileCentre(r, c);
          el('rect', { x: p.x - half, y: p.y - half, width: YARD.cell, height: YARD.cell, fill: TINTS[REGIONS[r][c]], stroke: '#1a1730', 'stroke-width': 2, 'pointer-events': 'none' }, v);
          if (isRivet(r, c)) el('circle', { cx: p.x - half + 14, cy: p.y - half + 14, r: 6, fill: '#d8935a', stroke: '#8a5a30', 'stroke-width': 2, 'pointer-events': 'none' }, v);
        }
      }
      const border = (x1: number, y1: number, x2: number, y2: number) =>
        el('line', { x1, y1, x2, y2, stroke: '#e8dcc0', 'stroke-width': 6, 'stroke-linecap': 'round', 'pointer-events': 'none' }, v);
      for (let r = 0; r < N; r += 1) {
        for (let c = 0; c < N; c += 1) {
          const x = YARD.x + c * YARD.cell;
          const y = YARD.y + r * YARD.cell;
          if (c + 1 < N && REGIONS[r][c] !== REGIONS[r][c + 1]) border(x + YARD.cell, y, x + YARD.cell, y + YARD.cell);
          if (r + 1 < N && REGIONS[r][c] !== REGIONS[r + 1][c]) border(x, y + YARD.cell, x + YARD.cell, y + YARD.cell);
        }
      }
      el('rect', { x: YARD.x, y: YARD.y, width: N * YARD.cell, height: N * YARD.cell, rx: 4, fill: 'none', stroke: '#6b4f24', 'stroke-width': 8, 'pointer-events': 'none' }, v);
      const fv = frontViews[2];
      for (let r = 0; r < N; r += 1) {
        dotNodes.push([]);
        scopeNodes.push([]);
        ringNodes.push([]);
        givenBadges.push([]);
        for (let c = 0; c < N; c += 1) {
          const p = tileCentre(r, c);
          const dot = el('g', { transform: `translate(${p.x} ${p.y})`, 'pointer-events': 'none' }, fv);
          el('circle', { r: 8, fill: '#8d8fc4' }, dot);
          dot.style.display = 'none';
          dotNodes[r].push(dot);
          const scope = el('g', { transform: `translate(${p.x} ${p.y})`, 'pointer-events': 'none', 'data-tele': `${r}-${c}` }, fv);
          el('path', { d: 'M0 38 L-22 58 M0 38 L22 58 M0 38 V58', fill: 'none', stroke: '#8a6038', 'stroke-width': 6, 'stroke-linecap': 'round' }, scope);
          ringNodes[r].push(el('circle', { r: 45, fill: '#0b0e1d', stroke: '#d3a64f', 'stroke-width': 7 }, scope));
          const glyph = LENS[r][c];
          if (glyph) for (const [x, y] of placeStars(glyph, 0, 0, 64)) el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 5.4, fill: '#fff1c4' }, scope);
          scope.style.display = 'none';
          scopeNodes[r].push(scope);
          // A tile that a lever points to and that holds a given telescope carries a small gold bolt.
          const badge = el('g', { transform: `translate(${p.x + 36} ${p.y - 36})`, 'pointer-events': 'none' }, fv);
          el('circle', { r: 11, fill: '#f4c66a', stroke: '#fff1c4', 'stroke-width': 2 }, badge);
          el('circle', { r: 4, fill: '#3a2a18' }, badge);
          badge.style.display = 'none';
          givenBadges[r].push(badge);
          const hit = el('rect', { x: p.x - half, y: p.y - half, width: YARD.cell, height: YARD.cell, fill: 'transparent', class: 'interactive' }, fv);
          asButton(hit, tr(`Ô hàng ${r + 1}, cột ${c + 1}`, `Square in row ${r + 1}, column ${c + 1}`), () => tapYard(r, c));
        }
      }
      // The seven levers' tiles, as small grids; the ones whose lever is down are marked.
      for (let i = 0; i < LEVERS; i += 1) {
        const gx = 850 + (i % 4) * 175;
        const gy = 250 + Math.floor(i / 4) * 280;
        const g = el('g', { 'pointer-events': 'none', 'data-ref': i }, v);
        const mini = 20;
        const [lr, lc] = LEVER_CELLS[i];
        for (let r = 0; r < N; r += 1) {
          for (let c = 0; c < N; c += 1) {
            const mark = r === lr && c === lc;
            el('rect', { x: gx + c * mini, y: gy + r * mini, width: mini - 1, height: mini - 1, fill: mark ? (LEVERS_DOWN.includes(i) ? '#f4c66a' : '#5a6099') : '#2f2b4a' }, g);
          }
        }
        el('circle', { cx: gx + 3 * mini, cy: gy + N * mini + 36, r: 15, fill: LEVERS_DOWN.includes(i) ? '#d3a64f' : 'none', stroke: '#6b4f24', 'stroke-width': 4 }, g);
      }
    }

    // Front: tabs, the owl.
    const tabs: SVGGElement[] = [];
    const tabFills: SVGCircleElement[] = [];
    for (let k = 0; k < 3; k += 1) {
      const g = el('g', { class: 'interactive', transform: `translate(${TAB_X[k]} ${TAB_Y})` }, front);
      el('circle', { r: 58, fill: 'transparent' }, g);
      tabFills.push(el('circle', { r: 44, fill: '#241f33', stroke: '#6b4f24', 'stroke-width': 5, 'pointer-events': 'none' }, g));
      const art = el('g', { stroke: '#f6efd8', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none', 'pointer-events': 'none', transform: 'scale(1.25)' }, g);
      if (k === 0) {
        el('rect', { x: -16, y: -16, width: 32, height: 32, rx: 4 }, art);
        el('path', { d: 'M-5 -16 V16 M5 -16 V16 M-16 -5 H16 M-16 5 H16' }, art);
      } else if (k === 1) {
        el('path', { d: 'M-10 -18 V18 M10 -18 V18' }, art);
        el('circle', { cx: -10, cy: -4, r: 6, fill: '#f6efd8' }, art);
        el('circle', { cx: 10, cy: 8, r: 6, fill: '#f6efd8' }, art);
      } else {
        el('circle', { cx: 0, cy: -6, r: 12 }, art);
        el('path', { d: 'M0 6 L-12 20 M0 6 L12 20 M0 6 V20' }, art);
      }
      asButton(g, [tr('Bảng 1: thẻ đục lỗ', 'Board 1: punch card'), tr('Bảng 2: cần gạt', 'Board 2: levers'), tr('Bảng 3: sân kính', 'Board 3: telescope yard')][k], () => goStage(k));
      tabs.push(g);
    }
    drawOwl(front, 1550, 840, 0.7);

    // ── Rendering ─────────────────────────────────────────────────────────────────────────
    const placedYard = (): Cell[] => {
      const out: Cell[] = [];
      for (let r = 0; r < N; r += 1) for (let c = 0; c < N; c += 1) if (yard[r][c] === 2) out.push([r, c]);
      return out;
    };
    const givenAt = (r: number, c: number): boolean => done[1] && GIVENS.some(([gr, gc]) => gr === r && gc === c);
    const render = (): void => {
      views.forEach((v, k) => { v.style.display = k === stage ? '' : 'none'; });
      frontViews.forEach((v, k) => { v.style.display = k === stage ? '' : 'none'; });
      tabFills.forEach((t, k) => {
        const unlocked = k === 0 || done[k - 1];
        t.setAttribute('fill', done[k] ? '#d3a64f' : k === stage ? '#3a3350' : '#241f33');
        t.setAttribute('stroke', k === stage ? '#fff1c4' : '#6b4f24');
        tabs[k].setAttribute('opacity', unlocked ? '1' : '0.35');
      });
      // Stage 1.
      const rowsDone = holes.map((row, r) => runsOf(row).join() === CARD_CLUES.rows[r].join());
      const colsDone = holes[0].map((_, c) => runsOf(holes.map((row) => row[c])).join() === CARD_CLUES.cols[c].join());
      for (let r = 0; r < 5; r += 1) for (let c = 0; c < 5; c += 1) cellHoles[r][c].style.display = holes[r][c] ? '' : 'none';
      clueNodes.rows.forEach((dots, r) => dots.forEach((d) => d.setAttribute('fill', rowsDone[r] ? '#f4c66a' : '#8d8fc4')));
      clueNodes.cols.forEach((dots, c) => dots.forEach((d) => d.setAttribute('fill', colsDone[c] ? '#f4c66a' : '#8d8fc4')));
      // Stage 2.
      const card = done[0] ? cardGrid() : holes;
      for (let r = 0; r < 5; r += 1) for (let c = 0; c < 5; c += 1) card2Holes[r][c].style.display = card[r][c] ? '' : 'none';
      lampsLit(card, [...down]).forEach((on, j) => lampNodes[j].setAttribute('fill', on ? '#f4c66a' : '#3a3550'));
      knobs.forEach((k, i) => k.setAttribute('transform', `translate(${leverX(i)} ${down.has(i) ? SLOT.bottom : SLOT.top})`));
      // Stage 3.
      const list = placedYard();
      const bad = conflicting(list);
      for (let r = 0; r < N; r += 1) {
        for (let c = 0; c < N; c += 1) {
          const given = givenAt(r, c);
          dotNodes[r][c].style.display = yard[r][c] === 1 ? '' : 'none';
          scopeNodes[r][c].style.display = yard[r][c] === 2 || given ? '' : 'none';
          givenBadges[r][c].style.display = given ? '' : 'none';
          const i = list.findIndex((q) => q[0] === r && q[1] === c);
          const lit = done[2] && LENS[r][c] !== null && (yard[r][c] === 2 || given);
          ringNodes[r][c].setAttribute('stroke', i >= 0 && bad[i] ? '#e0584f' : lit ? '#fff1c4' : '#d3a64f');
        }
      }
      domeSlots.forEach((slot) => { slot.style.display = done[2] ? '' : 'none'; });
    };
    function goStage(k: number): void {
      if (k !== 0 && !done[k - 1]) return;
      window.clearTimeout(timer);
      stage = k;
      sound.tick();
      render();
    }
    /** Latches a finished board and, after a moment, moves on to the next one. */
    function finish(k: number): void {
      done[k] = true;
      sound.ding();
      render();
      if (k < 2) {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => { stage = k + 1; render(); }, 1100);
      }
    }
    function tapCard(r: number, c: number): void {
      if (done[0]) return;
      holes[r][c] = !holes[r][c];
      sound.knock();
      render();
      if (cardMatches(holes)) finish(0);
    }
    function toggleLever(i: number): void {
      if (done[1]) return;
      if (down.has(i)) down.delete(i);
      else down.add(i);
      sound.knock();
      render();
      if (allLit(cardGrid(), [...down])) finish(1);
    }
    function tapYard(r: number, c: number): void {
      if (done[2] || givenAt(r, c)) return;
      yard[r][c] = ((yard[r][c] + 1) % 3) as 0 | 1 | 2;
      if (yard[r][c] === 2) sound.knock();
      else sound.tick();
      render();
      if (yardSolved([...placedYard(), ...GIVENS.filter(([gr, gc]) => yard[gr][gc] !== 2)])) finish(2);
    }
    render();

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const holeCells: Cell[] = [];
        for (let r = 0; r < 5; r += 1) for (let c = 0; c < 5; c += 1) if (cardGrid()[r][c]) holeCells.push([r, c]);
        const free = YARD_CELLS.filter(([r, c]) => !GIVENS.some(([gr, gc]) => gr === r && gc === c));
        const leverOrder = [...LEVERS_DOWN];
        return [
          {
            note: tr('Bảng 1, thẻ đục lỗ: đục đúng các lỗ để mỗi hàng và cột khớp các nhóm chấm ở lề. Ánh sáng lọt qua các lỗ sẽ thắp đèn ở bảng sau.', 'Board 1, punch card: punch the right holes so each row and column fits the dot groups at the edge. Light through the holes will light the lamps on the next board.'),
            targets: [
              {
                x: CARD1.x + (holeCells[0][1] + 0.5) * CARD1.cell, y: CARD1.y + (holeCells[0][0] + 0.5) * CARD1.cell, r: 50, verb: 'tap',
                act: (picture) => (p) => {
                  holeCells.forEach(([r, c], k) => {
                    const node = picture.querySelector(`[data-c1="${r}-${c}"]`) as SVGElement | null;
                    if (node) node.style.display = p > (k + 0.5) / holeCells.length ? '' : 'none';
                  });
                },
              },
            ],
            apply: () => {
              holeCells.forEach(([r, c]) => { holes[r][c] = true; });
              done[0] = true;
              stage = 1;
              render();
            },
          },
          {
            note: tr('Bảng 2, cần gạt: đèn nằm dưới lỗ thì sáng. Gạt các cần để cả bảy đèn cùng sáng. Những cần đang gạt xuống sẽ chỉ ra các ô đã có kính ở sân kính.', 'Board 2, levers: a lamp under a hole is on. Pull levers until all seven lamps are lit. The levers that are down show which squares of the telescope yard have a telescope.'),
            targets: [
              {
                x: leverX(leverOrder[0]), y: SLOT.top, r: 50, verb: 'tap',
                act: (picture) => (p) => {
                  const set = new Set<number>();
                  leverOrder.forEach((i, k) => { if (p > (k + 0.5) / leverOrder.length) set.add(i); });
                  lampsLit(cardGrid(), [...set]).forEach((on, j) => picture.querySelector(`[data-lamp2="${j}"]`)?.setAttribute('fill', on ? '#f4c66a' : '#3a3550'));
                  for (let i = 0; i < LEVERS; i += 1) picture.querySelector(`[data-knob="${i}"]`)?.setAttribute('transform', `translate(${leverX(i)} ${set.has(i) ? SLOT.bottom : SLOT.top})`);
                },
              },
            ],
            apply: () => {
              down.clear();
              LEVERS_DOWN.forEach((i) => down.add(i));
              done[1] = true;
              stage = 2;
              render();
            },
          },
          {
            note: tr('Bảng 3, sân kính: các kính đã có sẵn đứng cố định; đặt nốt các kính còn lại sao cho mỗi hàng, cột, vùng đúng một kính và không hai kính nào chạm nhau. Rồi đọc các thấu kính ở vùng có đinh tán đồng từ trái sang phải.', 'Board 3, telescope yard: the telescopes already there stay put; place the rest so that each row, column and region has exactly one and no two touch. Then read the lenses in the regions with brass rivets from left to right.'),
            targets: [
              {
                x: tileCentre(free[0][0], free[0][1]).x, y: tileCentre(free[0][0], free[0][1]).y, r: 56, verb: 'tap',
                act: (picture) => (p) => {
                  free.forEach(([r, c], k) => {
                    const node = picture.querySelector(`[data-tele="${r}-${c}"]`) as SVGElement | null;
                    if (node) node.style.display = p > (k + 0.5) / free.length ? '' : 'none';
                  });
                },
              },
            ],
            apply: () => {
              free.forEach(([r, c]) => { yard[r][c] = 2; });
              done[2] = true;
              render();
            },
          },
        ];
      },
      destroy: () => window.clearTimeout(timer),
    };
  },
};
