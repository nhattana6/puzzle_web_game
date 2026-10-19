import { url } from '../core/defs';
import { type GlyphId } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el, moonPhase, uid } from '../core/svg';
import { tween } from '../core/tween';
import { glyphAt, seeded, skyGradient, starfield } from './sky';
import type { HintStep, PuzzleDef } from './types';
import { tr } from '../core/i18n';

/**
 * Level 7 — the broken sky ("bầu trời vỡ"). A painted sky is cut into a 3×3
 * sliding puzzle with one piece missing. Slide the pieces back; once whole, the
 * painting shows three constellations, ordered by the moons painted beside them.
 */

export const N = 3;
export const TILE = 280;
/** The painting is composed on a 570-unit square (the spots below) and scaled up to the board. */
const PICTURE = 570;
export const BOARD = { x: (SCENE_W - N * TILE) / 2, y: (SCENE_H - N * TILE) / 2 };
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

/** Whether every tile of this row (the gap aside) is on its own cell. */
export const rowDone = (b: readonly number[], row: number): boolean =>
  [0, 1, 2].every((c) => {
    const t = row * N + c;
    return t === EMPTY_TILE || b[t] === t;
  });

/**
 * The shortest run of taps (tile numbers) that puts a row's tiles home, found by
 * searching every board reachable by slides. At most `limit` taps are returned; the
 * plan itself is shorter when the row needs fewer.
 */
export function planRow(board: readonly number[], row: number, limit = 4): number[] {
  return search(board, (b) => rowDone(b, row)).slice(0, limit);
}

/** The shortest run of taps that solves the whole board. */
export const planSolve = (board: readonly number[]): number[] => search(board, isSolved);

/** Breadth-first search over the boards reachable by slides, for the taps leading to the first one that satisfies `goal`. */
function search(board: readonly number[], goal: (b: readonly number[]) => boolean): number[] {
  if (goal(board)) return [];
  const key = (b: readonly number[]) => b.join('');
  const from = new Map<string, { prev: string; tap: number } | null>([[key(board), null]]);
  let frontier: Board[] = [[...board]];
  while (frontier.length) {
    const next: Board[] = [];
    for (const b of frontier) {
      for (const cell of neighbours(b[EMPTY_TILE])) {
        const t = b.indexOf(cell);
        const moved = slide(b, t)!;
        const k = key(moved);
        if (from.has(k)) continue;
        from.set(k, { prev: key(b), tap: t });
        if (goal(moved)) {
          const taps: number[] = [];
          for (let at: string | undefined = k; at && from.get(at); at = from.get(at)?.prev) taps.unshift(from.get(at)!.tap);
          return taps;
        }
        next.push(moved);
      }
    }
    frontier = next;
  }
  return [];
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
  get name() {
    return tr('Bầu trời vỡ', 'Broken Sky');
  },
  answer: [...GLYPH_SPOTS].sort((a, b) => a.phase - b.phase).map((g) => g.id),
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    let board = shuffledBoard();
    const shown = board.map((c) => ({ x: (c % N) * TILE, y: Math.floor(c / N) * TILE }));
    const hintedRows: number[] = [];

    // Back: the observatory wall, plain so the board has the room.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#14121e' }, back);
    scene.grain('back', 0.4);

    // The painting, drawn once per tile and clipped.
    const picId = uid('sky-picture');
    const picture = el('g', { id: picId }, scene.defs);
    // No filters here: the picture is drawn through nine <use> tiles, and a blur would be redone for each of
    // them on every frame of a zoom. Stars are static for the same reason.
    const canvas = el('g', { transform: `scale(${(N * TILE) / PICTURE})` }, picture);
    el('rect', { width: PICTURE, height: PICTURE, fill: skyGradient(scene.defs, '#101a3c', '#2c2456') }, canvas);
    starfield(canvas, { x: 0, y: 0, w: PICTURE, h: PICTURE }, 90, 63).querySelectorAll('.twinkle').forEach((c) => c.classList.remove('twinkle'));
    const art = el('g', {}, canvas);
    art.style.color = '#fff3c8';
    for (const g of GLYPH_SPOTS) {
      // A soft halo from plain translucent discs behind each star stands in for the blur.
      const glyph = glyphAt(art, g.id, g.x, g.y, 200, { star: 6, line: 3, lineOpacity: 0.6 });
      glyph.querySelectorAll('circle').forEach((c) => {
        const r = Number(c.getAttribute('r')) || 0;
        const halo = el('circle', { cx: c.getAttribute('cx') ?? 0, cy: c.getAttribute('cy') ?? 0, r: r * 2, fill: '#fff3c8', opacity: 0.14, 'pointer-events': 'none' });
        c.parentNode?.insertBefore(halo, c);
      });
    }
    for (const g of GLYPH_SPOTS) moonPhase(canvas, g.phase, g.x + 110, g.y - 80, 14, { class: 'moon-phase painted' });

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
      const g = el('g', { class: t === EMPTY_TILE ? 'sky-tile missing' : 'sky-tile interactive', 'data-hint': `tile-${t}` }, tilesLayer);
      el('rect', { x: 2, y: 2, width: TILE - 4, height: TILE - 4, fill: 'transparent' }, g);
      const inner = el('g', { transform: `translate(${-(t % N) * TILE} ${-Math.floor(t / N) * TILE})`, 'pointer-events': 'none' }, g);
      el('use', { href: `#${picId}`, 'clip-path': url(clipId) }, inner);
      el('rect', { x: (t % N) * TILE + 2, y: Math.floor(t / N) * TILE + 2, width: TILE - 4, height: TILE - 4, rx: 6, class: 'tile-edge' }, inner);
      const badge = el('g', { opacity: 0, transform: `translate(${TILE - 26} 26)` }, g);
      el('circle', { r: 17, class: 'number-badge' }, badge);
      el('text', { y: 1, class: 'number-text' }, badge).textContent = String(t + 1);
      if (t !== EMPTY_TILE) asButton(g, tr(`Mảnh ${t + 1}`, `Tile ${t + 1}`), () => tap(t));
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
      hintSteps: (): HintStep[] => {
        // Short: show how one slide works, then the finished sky to aim for.
        const centre = (cell: number) => ({ x: BOARD.x + (cell % N) * TILE + TILE / 2, y: BOARD.y + Math.floor(cell / N) * TILE + TILE / 2 });
        const plan = planSolve(board);
        const steps: HintStep[] = [];
        if (plan.length) {
          const t = plan[0];
          steps.push({
            note: tr('Bấm một mảnh nằm sát ô trống: mảnh đó trượt vào ô trống.', 'Tap a tile next to the empty gap: it slides into the gap.'),
            targets: [{ ...centre(board[t]), r: 70, verb: 'tap', to: centre(board[EMPTY_TILE]), object: `[data-hint="tile-${t}"]` }],
            apply: () => {
              for (const k of plan) board = slide(board, k)!;
              board.forEach((cell, k) => { shown[k] = { x: (cell % N) * TILE, y: Math.floor(cell / N) * TILE }; });
              render();
            },
          });
        }
        steps.push({
          note: tr('Trượt dần các mảnh cho tới khi bầu trời liền lại như hình này (khoảng 20 nước). Rồi đọc các chòm sao theo pha trăng cạnh chúng.', 'Keep sliding tiles until the sky is whole again, as in this picture (about 20 moves). Then read the constellations by the moon phase beside them.'),
          targets: [{ x: BOARD.x + (N * TILE) / 2, y: BOARD.y + (N * TILE) / 2, r: 300, verb: 'look' }],
        });
        return steps;
      },
      destroy: () => undefined,
    };
  },
};
