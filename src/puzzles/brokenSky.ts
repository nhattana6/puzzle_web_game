import { DEF, url } from '../core/defs';
import { type GlyphId } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el, moonPhase, uid } from '../core/svg';
import { tween } from '../core/tween';
import { glyphAt, seeded, skyGradient, starfield } from './sky';
import type { HintTarget, PuzzleDef } from './types';

/**
 * Level 7 — the broken sky ("bầu trời vỡ"). A painted sky is cut into a 3×3
 * sliding puzzle with one piece missing. Slide the pieces back; once whole, the
 * painting shows three constellations, ordered by the moons painted beside them.
 */

export const N = 3;
export const TILE = 190;
export const BOARD = { x: (SCENE_W - N * TILE) / 2 - 160, y: (SCENE_H - N * TILE) / 2 };
export const EMPTY_TILE = N * N - 1;
export const GLYPH_SPOTS: readonly { id: GlyphId; x: number; y: number; phase: number }[] = [
  { id: 'belt', x: 190, y: 130, phase: 2 },
  { id: 'dipper', x: 400, y: 255, phase: 3 },
  { id: 'hook', x: 190, y: 455, phase: 1 },
];

/** cells[t] = cell (0..8) where tile t sits; tile 8 is the gap. */
export type Board = number[];
export const solvedBoard = (): Board => Array.from({ length: N * N }, (_, i) => i);
export const isSolved = (b: readonly number[]): boolean => b.every((c, t) => c === t);

const neighbours = (cell: number) => {
  const r = Math.floor(cell / N);
  const c = cell % N;
  return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]
    .filter(([y, x]) => y >= 0 && y < N && x >= 0 && x < N)
    .map(([y, x]) => y * N + x);
};

/** Slides tile t into the gap if they touch; returns the new board or null. */
export function slide(b: readonly number[], t: number): Board | null {
  if (t === EMPTY_TILE || !neighbours(b[EMPTY_TILE]).includes(b[t])) return null;
  const next = [...b];
  [next[t], next[EMPTY_TILE]] = [b[EMPTY_TILE], b[t]];
  return next;
}

/** A shuffled but always solvable board: random slides from the solved one. */
export function shuffledBoard(seed = 91, moves = 60): Board {
  const rand = seeded(seed);
  let b = solvedBoard();
  let last = -1;
  for (let i = 0; i < moves; i += 1) {
    const options = neighbours(b[EMPTY_TILE]).map((cell) => b.indexOf(cell)).filter((t) => t !== last);
    const t = options[Math.floor(rand() * options.length)];
    b = slide(b, t)!;
    last = t;
  }
  if (isSolved(b)) return shuffledBoard(seed + 1, moves);
  return b;
}

export const brokenSky: PuzzleDef = {
  id: 'broken-sky',
  name: 'Bầu trời vỡ',
  answer: [...GLYPH_SPOTS].sort((a, b) => a.phase - b.phase).map((g) => g.id),
  guide: {
    goal: 'Ghép lại bức tranh bầu trời bị vỡ để đọc 3 chòm sao.',
    steps: [
      { icon: 'tap', text: 'Bấm vào một mảnh nằm cạnh ô trống để trượt nó vào ô trống.' },
      { icon: 'look', text: 'Ghép đúng thì các nét chòm sao nối liền nhau qua các mảnh.' },
      { icon: 'moon', text: 'Đọc theo pha trăng vẽ cạnh mỗi chòm: khuyết → nửa → gần tròn.' },
    ],
    tip: 'Mỗi gợi ý cho biết vị trí đúng của các mảnh thuộc một hàng.',
  },
  fireflies: [
    { id: 'broken-sky/frame', layer: 'back', x: 1400, y: 150 },
    { id: 'broken-sky/floor', layer: 'back', x: 1300, y: 820 },
  ],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    let board = shuffledBoard();
    const shown = board.map((c) => ({ x: (c % N) * TILE, y: Math.floor(c / N) * TILE }));
    const hintedRows: number[] = [];

    // Back: the observatory wall with an owl's sketch of the full sky.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#14121e' }, back);
    el('circle', { cx: 1250, cy: 450, r: 300, fill: 'none', stroke: '#2a2638', 'stroke-width': 20 }, back);
    starfield(back, { x: 980, y: 180, w: 540, h: 540 }, 70, 17);
    scene.grain('back', 0.4);

    // The painting, drawn once per tile and clipped.
    const picId = uid('sky-picture');
    const picture = el('g', { id: picId }, scene.defs);
    el('rect', { width: N * TILE, height: N * TILE, fill: skyGradient(scene.defs, '#101a3c', '#2c2456') }, picture);
    starfield(picture, { x: 0, y: 0, w: N * TILE, h: N * TILE }, 110, 63);
    const art = el('g', { filter: url(DEF.glow) }, picture);
    art.style.color = '#fff3c8';
    for (const g of GLYPH_SPOTS) glyphAt(art, g.id, g.x, g.y, 200, { star: 6, line: 3, lineOpacity: 0.6 });
    for (const g of GLYPH_SPOTS) moonPhase(picture, g.phase, g.x + 110, g.y - 80, 14, { class: 'moon-phase painted' });

    const frame = el('g', { transform: `translate(${BOARD.x} ${BOARD.y})` }, mid);
    el('rect', { x: -22, y: -22, width: N * TILE + 44, height: N * TILE + 44, rx: 16, fill: '#3a2c3a' }, frame);
    el('rect', { width: N * TILE, height: N * TILE, fill: '#0a0814' }, frame);
    const cellLabels = el('g', { opacity: 0, 'pointer-events': 'none' }, frame);
    for (let c = 0; c < N * N; c += 1) {
      const t = el('text', { x: (c % N) * TILE + 18, y: Math.floor(c / N) * TILE + 32, class: 'cell-label' }, cellLabels);
      t.textContent = String(c + 1);
    }

    const tilesLayer = el('g', { transform: `translate(${BOARD.x} ${BOARD.y})` }, front);
    const tiles = board.map((_, t) => {
      const clipId = uid('tile');
      el('rect', { x: (t % N) * TILE + 2, y: Math.floor(t / N) * TILE + 2, width: TILE - 4, height: TILE - 4, rx: 6 }, el('clipPath', { id: clipId }, scene.defs));
      const g = el('g', { class: t === EMPTY_TILE ? 'sky-tile missing' : 'sky-tile interactive' }, tilesLayer);
      el('rect', { x: 2, y: 2, width: TILE - 4, height: TILE - 4, fill: 'transparent' }, g);
      const inner = el('g', { transform: `translate(${-(t % N) * TILE} ${-Math.floor(t / N) * TILE})`, 'pointer-events': 'none' }, g);
      el('use', { href: `#${picId}`, 'clip-path': url(clipId) }, inner);
      el('rect', { x: (t % N) * TILE + 2, y: Math.floor(t / N) * TILE + 2, width: TILE - 4, height: TILE - 4, rx: 6, class: 'tile-edge' }, inner);
      const badge = el('g', { opacity: 0, transform: `translate(${TILE - 26} 26)` }, g);
      el('circle', { r: 17, class: 'number-badge' }, badge);
      el('text', { y: 1, class: 'number-text' }, badge).textContent = String(t + 1);
      if (t !== EMPTY_TILE) asButton(g, `Mảnh ${t + 1}`, () => tap(t));
      return { g, badge };
    });

    const render = () => {
      tiles.forEach(({ g, badge }, t) => {
        g.setAttribute('transform', `translate(${shown[t].x.toFixed(1)} ${shown[t].y.toFixed(1)})`);
        badge.setAttribute('opacity', hintedRows.includes(Math.floor(t / N)) && board[t] !== t ? '1' : '0');
      });
      tiles[EMPTY_TILE].g.setAttribute('opacity', isSolved(board) ? '1' : '0');
      cellLabels.setAttribute('opacity', hintedRows.length ? '0.8' : '0');
    };

    function tap(t: number) {
      const next = slide(board, t);
      if (!next) return;
      board = next;
      const from = { ...shown[t] };
      const to = { x: (board[t] % N) * TILE, y: Math.floor(board[t] / N) * TILE };
      tween(140, (k) => {
        shown[t] = { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k };
        render();
      });
      shown[EMPTY_TILE] = { x: (board[EMPTY_TILE] % N) * TILE, y: Math.floor(board[EMPTY_TILE] / N) * TILE };
      sound.knock();
      if (isSolved(board)) setTimeout(() => sound.chime(), 200);
    }

    render();

    return {
      revealHints: (count) => {
        while (hintedRows.length < count) {
          const row = [0, 1, 2].find((r) => !hintedRows.includes(r) && [0, 1, 2].some((c) => r * N + c !== EMPTY_TILE && board[r * N + c] !== r * N + c));
          if (row === undefined) break;
          hintedRows.push(row);
        }
        render();
        return hintedRows.length;
      },
      hintTargets: () => board
        .map((cell, t) => ({ cell, t }))
        .filter(({ cell, t }) => t !== EMPTY_TILE && hintedRows.includes(Math.floor(t / N)) && cell !== t)
        .slice(0, 3)
        .map(({ cell }): HintTarget => ({ x: BOARD.x + (cell % N) * TILE + TILE / 2, y: BOARD.y + Math.floor(cell / N) * TILE + TILE / 2, r: 80, verb: 'tap' })),
      destroy: () => undefined,
    };
  },
};
