import { drawOwl } from '../core/owl';
import { DEF, url } from '../core/defs';
import { GLYPHS, type GlyphId } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el } from '../core/svg';
import { clamp } from '../core/tween';
import { glyphAt, seeded } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 2, level 11 — the lamp court ("sân đèn sao"). A courtyard of paved tiles with dark
 * pillars, each tile engraved with a constellation of plain dots. There are four star lamps
 * to stand on tiles. A lamp lights its own tile and every tile in its row and column up to
 * the next pillar, and every tile has to be lit. Some pillars carry dots: that is how many of
 * the lamps stand right beside them. Four lamps, all tiles lit and the pillars satisfied is
 * possible in one way only. The answer is the constellations under the four lamps, in the order
 * of the rows (left to right along a row). Nothing is lit but by the lamps.
 */

export const SIZE = 6;
export const LAMPS = 4;
/** '.' is a tile, '#' a bare pillar, a digit a pillar with that many dots. */
export const BOARD: readonly string[] = [
  '1.....',
  '......',
  '#..2.1',
  '#.....',
  '#....#',
  '###..#',
];
/** The one way the four lamps stand (row, column), in reading order. */
export const SOLUTION: readonly (readonly [number, number])[] = [[0, 1], [1, 2], [2, 4], [3, 3]];
/** What is engraved on the four solution tiles, in the same order; the rest are filled in from these and chance. */
const SOLUTION_GLYPHS: readonly GlyphId[] = ['dipper', 'crown', 'belt', 'hook'];

export const isTile = (r: number, c: number): boolean => r >= 0 && r < SIZE && c >= 0 && c < SIZE && !/[#0-9]/.test(BOARD[r][c]);
export const pillarNumber = (r: number, c: number): number | null => (/[0-9]/.test(BOARD[r][c]) ? Number(BOARD[r][c]) : null);
export const TILES: readonly (readonly [number, number])[] = BOARD.flatMap((row, r) => [...row].flatMap((_, c) => (isTile(r, c) ? [[r, c] as const] : [])));

/** The tiles the lamps light: their own, and along row and column to the next pillar. */
export function litTiles(lamps: readonly (readonly [number, number])[]): Set<number> {
  const lit = new Set<number>();
  for (const [r, c] of lamps) {
    lit.add(r * SIZE + c);
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      let rr = r + dr;
      let cc = c + dc;
      while (isTile(rr, cc)) {
        lit.add(rr * SIZE + cc);
        rr += dr;
        cc += dc;
      }
    }
  }
  return lit;
}

/** How many of the lamps stand next to the pillar at (r, c). */
export const lampsBeside = (r: number, c: number, lamps: readonly (readonly [number, number])[]): number =>
  [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]].filter(([rr, cc]) => lamps.some(([lr, lc]) => lr === rr && lc === cc)).length;

export const pillarsSatisfied = (lamps: readonly (readonly [number, number])[]): boolean =>
  BOARD.every((row, r) => [...row].every((_, c) => pillarNumber(r, c) === null || lampsBeside(r, c, lamps) === pillarNumber(r, c)));

/** Every tile lit, the right number of lamps, each pillar satisfied. */
export const isSolved = (lamps: readonly (readonly [number, number])[]): boolean =>
  lamps.length === LAMPS && litTiles(lamps).size === TILES.length && pillarsSatisfied(lamps);

/** What is engraved on each tile. */
export const EMBLEMS: Map<number, GlyphId> = (() => {
  const rand = seeded(2718);
  const all = GLYPHS.map((g) => g.id);
  const out = new Map<number, GlyphId>();
  SOLUTION.forEach(([r, c], i) => out.set(r * SIZE + c, SOLUTION_GLYPHS[i]));
  let bag: GlyphId[] = [];
  for (const [r, c] of TILES) {
    if (out.has(r * SIZE + c)) continue;
    if (!bag.length) bag = [...all].sort(() => rand() - 0.5);
    out.set(r * SIZE + c, bag.pop() as GlyphId);
  }
  return out;
})();
export const emblemAt = (r: number, c: number): GlyphId => EMBLEMS.get(r * SIZE + c) as GlyphId;

/** Lamps in reading order, then the emblem under each: the answer. */
export const readLamps = (lamps: readonly (readonly [number, number])[]): GlyphId[] =>
  [...lamps].sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(([r, c]) => emblemAt(r, c));

const CELL = 100;
const ORIGIN = { x: 330, y: 110 };
export const cellCentre = (r: number, c: number): [number, number] => [ORIGIN.x + c * CELL + CELL / 2, ORIGIN.y + r * CELL + CELL / 2];
const traySpot = (i: number): [number, number] => [1180, 190 + i * 130];

export const lampCourt: PuzzleDef = {
  id: 'lamp-court',
  name: 'Sân đèn sao',
  answer: readLamps(SOLUTION),
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    /** Where each lamp stands, or null while it is still in the tray. */
    const lamps: ([number, number] | null)[] = Array.from({ length: LAMPS }, () => null);
    const free: [number, number][] = Array.from({ length: LAMPS }, (_, i) => traySpot(i));
    let wasSolved = false;

    // Back: the wall and the ground of the court.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#1c1626' }, back);
    for (let x = 80; x < SCENE_W; x += 160) el('line', { x1: x, y1: -20, x2: x, y2: SCENE_H + 20, stroke: '#14101c', 'stroke-width': 4 }, back);
    scene.grain('back', 0.4);

    // Mid: the tiles, the pillars, and the lamps.
    el('rect', { x: ORIGIN.x - 16, y: ORIGIN.y - 16, width: SIZE * CELL + 32, height: SIZE * CELL + 32, rx: 14, fill: '#120e1a', stroke: '#4a4170', 'stroke-width': 5 }, mid);
    const tileNodes = new Map<number, SVGRectElement>();
    const emblemNodes = new Map<number, SVGGElement>();
    const dotNodes = new Map<number, SVGCircleElement[]>();
    for (let r = 0; r < SIZE; r += 1) {
      for (let c = 0; c < SIZE; c += 1) {
        const x = ORIGIN.x + c * CELL;
        const y = ORIGIN.y + r * CELL;
        if (isTile(r, c)) {
          tileNodes.set(r * SIZE + c, el('rect', { x: x + 3, y: y + 3, width: CELL - 6, height: CELL - 6, rx: 8, fill: '#2a2540' }, mid));
          const e = glyphAt(mid, emblemAt(r, c), x + CELL / 2, y + CELL / 2, 46, { star: 3.6, line: 0, colour: '#fff1c4' });
          e.setAttribute('pointer-events', 'none');
          emblemNodes.set(r * SIZE + c, e);
        } else {
          el('rect', { x: x + 3, y: y + 3, width: CELL - 6, height: CELL - 6, rx: 8, fill: '#0e0a14', stroke: '#3a3358', 'stroke-width': 3 }, mid);
          const n = pillarNumber(r, c);
          if (n !== null) {
            const dots: SVGCircleElement[] = [];
            for (let d = 0; d < n; d += 1) {
              dots.push(el('circle', { cx: x + CELL / 2 + (d - (n - 1) / 2) * 22, cy: y + CELL / 2, r: 8, fill: '#8a8fbf' }, mid));
            }
            dotNodes.set(r * SIZE + c, dots);
          }
        }
      }
    }

    // A tray for the lamps that are not out.
    el('rect', { x: 1100, y: 110, width: 160, height: 560, rx: 18, fill: '#120e1a', stroke: '#4a4170', 'stroke-width': 5 }, mid);

    const lampNodes = Array.from({ length: LAMPS }, (_, i) => {
      const g = el('g', { class: 'court-lamp interactive', tabindex: 0, role: 'button', 'aria-label': `Đèn sao ${i + 1}`, 'data-hint': `lamp-${i}` }, mid);
      el('circle', { r: 46, fill: 'transparent' }, g);
      el('ellipse', { cx: 0, cy: 20, rx: 20, ry: 8, fill: '#6b4f24' }, g);
      el('rect', { x: -4, y: -4, width: 8, height: 26, fill: '#a87a3c' }, g);
      el('path', { d: 'M0 -34 L7 -18 L24 -18 L10 -7 L15 10 L0 0 L-15 10 L-10 -7 L-24 -18 L-7 -18 Z', fill: '#ffe08a', stroke: '#8a6a2c', 'stroke-width': 3, filter: url(DEF.glow) }, g);
      return g;
    });
    drawOwl(front, 150, 790, 0.9);

    const render = () => {
      const standing = lamps.filter((l): l is [number, number] => l !== null);
      const lit = litTiles(standing);
      tileNodes.forEach((rect, key) => {
        rect.setAttribute('fill', lit.has(key) ? '#7a5f2c' : '#2a2540');
      });
      emblemNodes.forEach((e, key) => { e.style.opacity = lit.has(key) ? '1' : '0.55'; });
      dotNodes.forEach((dots, key) => {
        const r = Math.floor(key / SIZE);
        const c = key % SIZE;
        const ok = lampsBeside(r, c, standing) === pillarNumber(r, c);
        for (const d of dots) d.setAttribute('fill', ok ? '#f4c66a' : '#8a8fbf');
      });
      lampNodes.forEach((node, i) => {
        const at = lamps[i];
        const [x, y] = at ? cellCentre(at[0], at[1]) : free[i];
        node.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
      });
      const done = isSolved(standing);
      if (done && !wasSolved) sound.ding();
      wasSolved = done;
    };
    render();

    const cellAt = (x: number, y: number): [number, number] | null => {
      const c = Math.floor((x - ORIGIN.x) / CELL);
      const r = Math.floor((y - ORIGIN.y) / CELL);
      return isTile(r, c) ? [r, c] : null;
    };

    lampNodes.forEach((node, i) => {
      let grab = [0, 0];
      scene.draggable(node, {
        start: (p) => {
          const at = lamps[i] ? cellCentre(lamps[i]![0], lamps[i]![1]) : free[i];
          free[i] = [at[0], at[1]];
          lamps[i] = null;
          grab = [p.x - at[0], p.y - at[1]];
          node.parentNode?.appendChild(node);
          render();
        },
        move: (p) => {
          free[i] = [clamp(p.x - grab[0], 40, SCENE_W - 40), clamp(p.y - grab[1], 60, SCENE_H - 40)];
          render();
        },
        end: () => {
          const cell = cellAt(free[i][0], free[i][1]);
          const taken = cell && lamps.some((l, k) => k !== i && l && l[0] === cell[0] && l[1] === cell[1]);
          if (cell && !taken) {
            lamps[i] = cell;
            sound.knock();
          } else {
            free[i] = traySpot(i);
            sound.paper();
          }
          render();
        },
      });
      // Keys: the first arrow stands the lamp on the first free tile; then arrows walk it over the tiles.
      node.addEventListener('keydown', (event) => {
        const dirs: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
        if (event.key === 'Escape' || event.key === 'Backspace') {
          event.preventDefault();
          lamps[i] = null;
          free[i] = traySpot(i);
          render();
          return;
        }
        const d = dirs[event.key];
        if (!d) return;
        event.preventDefault();
        const occupied = (r: number, c: number) => lamps.some((l, k) => k !== i && l && l[0] === r && l[1] === c);
        if (!lamps[i]) {
          const first = TILES.find(([r, c]) => !occupied(r, c));
          if (first) lamps[i] = [first[0], first[1]];
        } else {
          let [r, c] = lamps[i] as [number, number];
          for (let step = 0; step < SIZE; step += 1) {
            r += d[0];
            c += d[1];
            if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) break;
            if (isTile(r, c) && !occupied(r, c)) {
              lamps[i] = [r, c];
              break;
            }
          }
        }
        render();
      });
    });

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const [fr, fc] = SOLUTION[0];
        const from = traySpot(0);
        const to = cellCentre(fr, fc);
        return [
          {
            note: 'Đặt đủ bốn ngọn đèn sao cho mọi ô lát đều sáng (đèn sáng cả hàng và cột của nó cho tới khi gặp trụ), và mỗi trụ có chấm có đúng bấy nhiêu ngọn đèn đứng sát cạnh. Chỉ có một cách đặt, như hình sau bước này.',
            targets: [{ x: from[0], y: from[1], r: 50, verb: 'drag', to: { x: to[0], y: to[1] }, object: '[data-hint="lamp-0"]' }],
            apply: () => {
              SOLUTION.forEach(([r, c], i) => { lamps[i] = [r, c]; });
              render();
            },
          },
          {
            note: 'Đọc các chòm khắc dưới chân bốn ngọn đèn, theo thứ tự hàng từ trên xuống, trong cùng hàng thì từ trái sang phải.',
            targets: SOLUTION.map(([r, c]) => ({ x: cellCentre(r, c)[0], y: cellCentre(r, c)[1], r: 60, verb: 'look' as const })),
          },
        ];
      },
      destroy: () => undefined,
    };
  },
};

