import { drawOwl } from '../core/owl';
import type { GlyphId } from '../core/glyphs';
import { GLYPHS } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el } from '../core/svg';
import { drawKidIcon } from './kidIcons';
import { drawPattern } from './lanternStalls';
import type { Pattern } from './lanternStalls';
import { drawSole } from './sandFootprints';
import type { Tread } from './sandFootprints';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 3, level 12 — the night procession ("đêm rước đèn"), the finale. Four children walked
 * through a street of nine awnings laid out like the keypad; each stopped at one of them. Three
 * kinds of evidence say where, and the answer is the keypad positions (not constellations read
 * off the scene) of their stops in the order they passed:
 *  - footprints: four soles pressed one over the next show the order they passed in;
 *  - wrapping paper: each child's paper has the pattern of the awning they stopped at, which narrows
 *    them to three of the nine awnings (two children have the same pattern, so cannot share one);
 *  - witnesses: five picture statements about where they went; one witness lied, and the lie is the
 *    one that cannot be true given that child's paper.
 */

export const PATTERNS: readonly Pattern[] = ['slash', 'dots', 'checks'];
/** The pattern of each of the nine awnings (row by row, as on the keypad). */
export const CELL_PATTERN: readonly number[] = [2, 1, 1, 0, 2, 1, 2, 0, 0];
/** The pattern of each child's paper, and the tread of each child's sole. */
export const KID_PATTERN: readonly number[] = [2, 1, 0, 0];
export const KID_TREAD: readonly Tread[] = ['stripes', 'dots', 'zigzag', 'rings'];
/** The children in the order they passed: the footprints, bottom of the pile first. */
export const PASSING: readonly number[] = [3, 1, 2, 0];
/** The awning (keypad position, 0–8) each child stopped at. */
export const SECRET: readonly number[] = [4, 2, 3, 8];

export type Claim =
  | { t: 'row'; k: number; v: number }
  | { t: 'col'; k: number; v: number }
  | { t: 'sameCol'; a: number; b: number }
  | { t: 'leftOf'; a: number; b: number };

/** The five witnesses, in the order shown (the second one is the liar). */
export const CLAIMS: readonly Claim[] = [
  { t: 'col', k: 1, v: 2 },
  { t: 'col', k: 0, v: 2 },
  { t: 'leftOf', a: 2, b: 0 },
  { t: 'row', k: 1, v: 0 },
  { t: 'sameCol', a: 1, b: 3 },
];

const rowOf = (c: number): number => Math.floor(c / 3);
const colOf = (c: number): number => c % 3;

/** Does the claim hold for these stops (one awning per child)? */
export function claimHolds(c: Claim, cells: readonly number[]): boolean {
  switch (c.t) {
    case 'row': return rowOf(cells[c.k]) === c.v;
    case 'col': return colOf(cells[c.k]) === c.v;
    case 'sameCol': return colOf(cells[c.a]) === colOf(cells[c.b]);
    case 'leftOf': return cells[c.a] + 1 === cells[c.b] && rowOf(cells[c.a]) === rowOf(cells[c.b]);
  }
}

/**
 * Does the witness's card light for the markers the player has put down (one child per awning, a child
 * may be put on several)? It lights as soon as what it says can be read off the markers, right or not.
 */
export function claimLights(c: Claim, marks: readonly number[]): boolean {
  const cellsOf = (k: number) => marks.flatMap((m, cell) => (m === k ? [cell] : []));
  switch (c.t) {
    case 'row': return cellsOf(c.k).some((cell) => rowOf(cell) === c.v);
    case 'col': return cellsOf(c.k).some((cell) => colOf(cell) === c.v);
    case 'sameCol': return cellsOf(c.a).some((x) => cellsOf(c.b).some((y) => x !== y && colOf(x) === colOf(y)));
    case 'leftOf': return cellsOf(c.a).some((x) => cellsOf(c.b).some((y) => x + 1 === y && rowOf(x) === rowOf(y)));
  }
}

/** The awnings child `k` could have stopped at, from the pattern of its paper. */
export const candidates = (k: number): number[] => CELL_PATTERN.flatMap((p, c) => (p === KID_PATTERN[k] ? [c] : []));

/** Can the claim be true for some awnings with the right patterns? Claims that cannot are the lie. */
export function possible(c: Claim): boolean {
  if (c.t === 'row' || c.t === 'col') {
    return candidates(c.k).some((cell) => (c.t === 'row' ? rowOf(cell) : colOf(cell)) === c.v);
  }
  return candidates(c.a).some((x) => candidates(c.b).some((y) => {
    const cells: number[] = [];
    cells[c.a] = x;
    cells[c.b] = y;
    return x !== y && claimHolds(c, cells);
  }));
}

/** Every way of giving the four children distinct awnings that fit their papers and all the possible claims. */
export function solutions(): number[][] {
  const trusted = CLAIMS.filter(possible);
  const out: number[][] = [];
  for (const a of candidates(0)) for (const b of candidates(1)) for (const c of candidates(2)) for (const d of candidates(3)) {
    const cells = [a, b, c, d];
    if (new Set(cells).size < 4) continue;
    if (trusted.every((claim) => claimHolds(claim, cells))) out.push(cells);
  }
  return out;
}

/** The answer: the keypad positions of the stops, in the order the children passed. */
export const READING_ORDER: readonly number[] = PASSING.map((k) => SECRET[k]);

const INK_AWNING = ['#b8382b', '#2f7a5a', '#7a4a9a'];
const INK_PAPER = ['#2d6a8f', '#c07a1c', '#4a9a5a'];

const GRID = { x: 575, y: 70, cell: 185 };
const gridCentre = (c: number): { x: number; y: number } => ({
  x: GRID.x + colOf(c) * GRID.cell + GRID.cell / 2,
  y: GRID.y + rowOf(c) * GRID.cell + GRID.cell / 2,
});
const KID_ROW_Y = (k: number): number => 340 + k * 140;
const WIT = { x: 1190, y0: 30, w: 370, h: 160, gap: 172 };

export const nightProcession: PuzzleDef = {
  id: 'night-procession',
  name: 'Đêm rước đèn',
  answer: READING_ORDER.map((c) => GLYPHS[c].id as GlyphId),
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    /** Which child's marker (−1 none) the player has put on each awning. */
    const marks = Array.from({ length: 9 }, () => -1);
    const markNodes: SVGGElement[] = [];
    const lamps: SVGCircleElement[] = [];

    // Back: the street at night.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#1b1828' }, back);
    el('rect', { x: -60, y: 850, width: SCENE_W + 120, height: 120, fill: '#2d2433' }, back);
    scene.grain('back', 0.45);

    // Mid, left: the footprints, in the order they were left, and a card for each child.
    el('rect', { x: 30, y: 30, width: 500, height: 215, rx: 18, fill: '#d9c28c', stroke: '#8a7648', 'stroke-width': 5 }, mid);
    PASSING.forEach((k, n) => {
      const g = el('g', { transform: `translate(${110 + n * 105} ${138}) rotate(${n % 2 ? 12 : -12}) scale(0.55)` }, mid);
      drawSole(g, KID_TREAD[k]);
    });
    for (let k = 0; k < 4; k += 1) {
      const y = KID_ROW_Y(k);
      el('rect', { x: 30, y: y - 62, width: 500, height: 124, rx: 16, fill: '#2d2538', stroke: '#6b4f24', 'stroke-width': 4 }, mid);
      const hat = el('g', { transform: `translate(110 ${y + 6})` }, mid);
      drawKidIcon(hat, k, 34);
      const sole = el('g', { transform: `translate(260 ${y}) scale(0.5)` }, mid);
      el('rect', { x: -66, y: -106, width: 132, height: 212, rx: 18, fill: '#d9c28c' }, sole);
      drawSole(sole, KID_TREAD[k]);
      const paper = el('g', { transform: `translate(420 ${y})` }, mid);
      drawPattern(scene.defs, paper, PATTERNS[KID_PATTERN[k]], 96, 96, INK_PAPER[KID_PATTERN[k]], 10);
    }

    // Mid, centre: the nine awnings, laid out like the keypad.
    for (let c = 0; c < 9; c += 1) {
      const { x, y } = gridCentre(c);
      const g = el('g', { transform: `translate(${x} ${y})` }, mid);
      drawPattern(scene.defs, g, PATTERNS[CELL_PATTERN[c]], GRID.cell - 12, GRID.cell - 12, INK_AWNING[CELL_PATTERN[c]], 14);
    }

    // Mid, right: the five witnesses, as pictures.
    const miniGrid = (parent: Element, ox: number, oy: number, hi: (r: number, c: number) => boolean) => {
      for (let r = 0; r < 3; r += 1) for (let c = 0; c < 3; c += 1) {
        el('rect', { x: ox + c * 34, y: oy + r * 34, width: 30, height: 30, rx: 5, fill: hi(r, c) ? '#d3a64f' : '#cdbf9c', stroke: '#8a6a3c', 'stroke-width': 2.5 }, parent);
      }
    };
    CLAIMS.forEach((cl, i) => {
      const g = el('g', { transform: `translate(${WIT.x} ${WIT.y0 + i * WIT.gap})`, 'pointer-events': 'none' }, mid);
      el('rect', { width: WIT.w, height: WIT.h, rx: 16, fill: '#efe6cf', stroke: '#b9a27f', 'stroke-width': 4 }, g);
      lamps.push(el('circle', { cx: WIT.w - 24, cy: 24, r: 11, fill: '#d8ccb0', stroke: '#8a6a3c', 'stroke-width': 3 }, g));
      const kid = (k: number, x: number, y: number, r = 30) => {
        const holder = el('g', { transform: `translate(${x} ${y})` }, g);
        drawKidIcon(holder, k, r);
      };
      if (cl.t === 'row' || cl.t === 'col') {
        kid(cl.k, 80, 84, 36);
        miniGrid(g, 200, 28, (r, c) => (cl.t === 'row' ? r === cl.v : c === cl.v));
      } else if (cl.t === 'sameCol') {
        kid(cl.a, 130, 52);
        kid(cl.b, 130, 120);
        el('path', { d: 'M215 28 V132 M203 44 L215 28 L227 44 M203 116 L215 132 L227 116', fill: 'none', stroke: '#3a2a18', 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      } else {
        el('rect', { x: 95, y: 55, width: 80, height: 80, rx: 10, fill: '#cdbf9c', stroke: '#8a6a3c', 'stroke-width': 3 }, g);
        el('rect', { x: 195, y: 55, width: 80, height: 80, rx: 10, fill: '#cdbf9c', stroke: '#8a6a3c', 'stroke-width': 3 }, g);
        kid(cl.a, 135, 95, 26);
        kid(cl.b, 235, 95, 26);
      }
    });

    // Front: the markers the player puts on the awnings, and the owl.
    for (let c = 0; c < 9; c += 1) {
      const { x, y } = gridCentre(c);
      const mark = el('g', { class: 'proc-cell interactive', transform: `translate(${x} ${y})`, 'data-hint': `cell-${c}` }, front);
      el('rect', { x: -GRID.cell / 2, y: -GRID.cell / 2, width: GRID.cell, height: GRID.cell, fill: 'transparent' }, mark);
      markNodes.push(mark);
      asButton(mark, `Ô mái che ${c + 1}`, () => cycle(c));
    }
    drawOwl(front, 1120, 835, 0.55);

    const render = () => {
      CLAIMS.forEach((claim, i) => {
        const on = claimLights(claim, marks);
        lamps[i].setAttribute('fill', on ? '#f4c66a' : '#d8ccb0');
        lamps[i].setAttribute('stroke', on ? '#fff1c4' : '#8a6a3c');
      });
      markNodes.forEach((node, c) => {
        node.replaceChildren();
        el('rect', { x: -GRID.cell / 2, y: -GRID.cell / 2, width: GRID.cell, height: GRID.cell, fill: 'transparent' }, node);
        if (marks[c] < 0) return;
        const holder = el('g', { 'pointer-events': 'none' }, node);
        el('circle', { r: 50, fill: '#fff3d0', opacity: 0.88 }, holder);
        const icon = el('g', { transform: 'translate(0 4)' }, holder);
        drawKidIcon(icon, marks[c], 34);
      });
    };
    function cycle(c: number): void {
      marks[c] = marks[c] + 1 >= 4 ? -1 : marks[c] + 1;
      sound.knock();
      render();
    }
    render();

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => [
        {
          note: 'Giấy gói của mỗi bạn có hoa văn của mái che bạn ghé (mỗi hoa văn ở 3 ô). Lời khai nào không thể đúng với giấy gói của bạn đó là lời khai sai: bỏ nó. Các lời khai còn lại chốt ô của từng bạn. Chạm một ô để đặt dấu của một bạn lên đó; thẻ lời khai sáng khi dấu đặt thoả điều kiện của thẻ.',
          targets: [{ x: gridCentre(SECRET[0]).x, y: gridCentre(SECRET[0]).y, r: 80, verb: 'tap' }],
          apply: () => {
            marks.fill(-1);
            SECRET.forEach((cell, k) => { marks[cell] = k; });
            render();
          },
        },
        {
          note: 'Dấu chân cho thứ tự các bạn đi qua phố (từ trái sang phải). Đọc ô của từng bạn theo thứ tự đó, rồi bấm đúng các vị trí ấy trên bàn phím chòm sao.',
          targets: READING_ORDER.map((cell) => ({ x: gridCentre(cell).x, y: gridCentre(cell).y, r: 90, verb: 'look' as const })),
          prepare: (picture) => {
            const overlay = picture.querySelector('.layer-overlay') ?? picture;
            READING_ORDER.forEach((cell, n) => {
              const { x, y } = gridCentre(cell);
              const badge = el('g', { transform: `translate(${x + 62} ${y - 62})`, 'pointer-events': 'none' }, overlay);
              el('circle', { r: 20, class: 'number-badge' }, badge);
              el('text', { y: 1, class: 'number-text' }, badge).textContent = String(n + 1);
            });
          },
        },
      ],
      destroy: () => undefined,
    };
  },
};
