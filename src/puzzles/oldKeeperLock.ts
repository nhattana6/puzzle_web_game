import { drawOwl } from '../core/owl';
import type { GlyphId } from '../core/glyphs';
import { placeStars } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el } from '../core/svg';
import { starfield } from './sky';
import type { HintStep, PuzzleDef } from './types';
import { tr } from '../core/i18n';

/**
 * Chapter 4, level 7 — the old keeper's lock ("khoá của người gác cũ"), a code-breaking puzzle. The
 * old keeper's notebook has five failed tries at a four-constellation lock; beside each, two kinds
 * of marks: a gold peg for a constellation that is in the code and in the right place, a silver
 * peg for one that is in the code but in another place; a short legend on the left says so in words
 * (asked for by the user, the only level with its own explanation). At the foot of the notebook is a
 * row of four slots to try a code in: a lamp beside each page lights when the pegs that
 * try would get on that page are the ones written there. Only one code lights all five lamps, and
 * it is the answer, left to right.
 */

/** The seven constellations used for the lock (the arrow and the diamond are left out). */
export const SYMBOLS: readonly GlyphId[] = ['triangle', 'square', 'crown', 'cross', 'belt', 'dipper', 'hook'];
export const CODE_LENGTH = 4;
/** The secret code, as indices into `SYMBOLS`. */
export const SECRET: readonly number[] = [2, 4, 5, 0];

export interface Page {
  guess: readonly number[];
  /** Gold pegs (right constellation, right place) and silver pegs (right constellation, wrong place). */
  gold: number;
  silver: number;
}

/** The old keeper's five tries. */
export const NOTEBOOK: readonly Page[] = [
  { guess: [3, 2, 6, 0], gold: 1, silver: 1 },
  { guess: [0, 3, 5, 1], gold: 1, silver: 1 },
  { guess: [4, 1, 3, 6], gold: 0, silver: 1 },
  { guess: [3, 1, 0, 4], gold: 0, silver: 2 },
  { guess: [3, 1, 4, 5], gold: 0, silver: 2 },
];

/** Slots hold a symbol index, or -1 when empty. */
export const EMPTY = -1;

/** The pegs a guess earns against a code (empty slots earn nothing). */
export function feedback(code: readonly number[], guess: readonly number[]): { gold: number; silver: number } {
  let gold = 0;
  const inCode = new Array<number>(SYMBOLS.length).fill(0);
  const inGuess = new Array<number>(SYMBOLS.length).fill(0);
  code.forEach((c, i) => {
    if (c >= 0 && c === guess[i]) gold += 1;
    if (c >= 0) inCode[c] += 1;
    if (guess[i] >= 0) inGuess[guess[i]] += 1;
  });
  const common = inCode.reduce((sum, n, s) => sum + Math.min(n, inGuess[s]), 0);
  return { gold, silver: common - gold };
}

/** Whether a tried code would earn exactly the pegs written on the page. */
export function fitsPage(code: readonly number[], page: Page): boolean {
  if (code.length !== CODE_LENGTH || code.some((c) => c === EMPTY)) return false;
  const f = feedback(page.guess, code);
  return f.gold === page.gold && f.silver === page.silver;
}

/** The pages a tried code fits. */
export const fittingPages = (code: readonly number[], notebook: readonly Page[] = NOTEBOOK): number[] =>
  notebook.flatMap((p, i) => (fitsPage(code, p) ? [i] : []));

/** The next symbol for a slot when tapped: empty, then each constellation, then empty again. */
export const nextSymbol = (v: number): number => (v + 1 >= SYMBOLS.length ? EMPTY : v + 1);

export const READING_ORDER: readonly GlyphId[] = SECRET.map((s) => SYMBOLS[s]);

// ── Layout (scene units) ────────────────────────────────────────────────────────────────────
const CELL = 92;
const NOTE = { x: 640, y0: 150, row: 120, gx: 108 };
export const pageY = (i: number): number => NOTE.y0 + i * NOTE.row;
export const TRY_Y = NOTE.y0 + NOTEBOOK.length * NOTE.row + 20;
export const cellX = (k: number): number => NOTE.x + k * NOTE.gx;
const PEG_X = NOTE.x + 4 * NOTE.gx + 20;
const LAMP_X = PEG_X + 4 * 40 + 60;
export const oldKeeperLock: PuzzleDef = {
  id: 'old-keeper-lock',
  get name() {
    return tr('Khoá của người gác cũ', "Old Keeper's Lock");
  },
  answer: [...READING_ORDER],
  get help() {
    return [
      tr('Mỗi trang trong sổ là một lần người gác cũ thử mở khoá bốn chòm. Chốt vàng: có đúng chòm ở đúng chỗ. Chốt bạc: có đúng chòm nhưng sai chỗ. Vòng rỗng: chòm đó không có trong khoá.', "Each page of the notebook is one try the old keeper made at the four-constellation lock. Gold peg: one constellation is right and in the right place. Silver peg: one is right but in the wrong place. Empty ring: that constellation is not in the lock."),
      tr('Chạm các ô ở hàng dưới cùng để thử mã. Đèn bên phải mỗi trang sáng khi các chốt của mã đang thử khớp với trang đó; làm sáng cả 5 đèn.', 'Tap the squares in the bottom row to try a code. The lamp to the right of each page lights when the pegs for your code match that page; light all 5 lamps.'),
    ];
  },
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const attempt: number[] = new Array<number>(CODE_LENGTH).fill(EMPTY);
    const attemptGlyphs: SVGGElement[][] = [];
    const lamps: SVGCircleElement[] = [];
    let wasAll = false;

    // Back: the observatory wall and its floor.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#14172b' }, back);
    starfield(back, { x: 0, y: 0, w: SCENE_W, h: SCENE_H }, 60, 5707);
    el('rect', { x: -60, y: 846, width: SCENE_W + 120, height: 120, fill: '#2a1f1a' }, back);
    scene.grain('back', 0.45);

    const glyphDots = (parent: Element, id: GlyphId, cx: number, cy: number, size = 62, r = 5.5, fill = '#fff1c4') => {
      const g = el('g', { 'pointer-events': 'none' }, parent);
      for (const [x, y] of placeStars(id, cx, cy, size)) el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r, fill }, g);
      return g;
    };
    const cell = (parent: Element, cx: number, cy: number, stroke = '#6b4f24') =>
      el('rect', { x: cx - CELL / 2, y: cy - CELL / 2, width: CELL, height: CELL, rx: 12, fill: '#0b0e1d', stroke, 'stroke-width': 4, 'pointer-events': 'none' }, parent);
    const pegs = (parent: Element, x: number, y: number, gold: number, silver: number, count: number, gap = 40, r = 13): SVGCircleElement[] => {
      const out: SVGCircleElement[] = [];
      for (let k = 0; k < count; k += 1) {
        const kind = k < gold ? 'gold' : k < gold + silver ? 'silver' : 'none';
        out.push(el('circle', {
          cx: x + k * gap, cy: y, r,
          fill: kind === 'gold' ? '#f4c66a' : kind === 'silver' ? '#c9ccd6' : 'none',
          stroke: kind === 'gold' ? '#fff1c4' : kind === 'silver' ? '#f4f6fa' : '#5a6099',
          'stroke-width': kind === 'none' ? 3 : 2,
          'pointer-events': 'none',
        }, parent));
      }
      return out;
    };
    // Mid: a short legend of the pegs on the left, and the notebook pages on the right.
    el('rect', { x: 60, y: 170, width: 470, height: 520, rx: 22, fill: '#241f33', stroke: '#6b4f24', 'stroke-width': 6, 'pointer-events': 'none' }, mid);
    const say = (x: number, y: number, text: string, anchor: 'start' | 'middle' = 'start') => {
      el('text', { x, y, class: 'legend-text', 'text-anchor': anchor }, mid).textContent = text;
    };
    say(295, 222, tr('Mỗi trang là một lần thử', 'Each page is one try at'), 'middle');
    say(295, 256, tr('mở khoá bốn chòm của người gác cũ:', "the old keeper's lock:"), 'middle');
    pegs(mid, 100, 330, 1, 0, 1, 40, 17);
    say(140, 324, tr('Chốt vàng: đúng chòm,', 'Gold peg: in the lock,'));
    say(140, 358, tr('đúng chỗ.', 'in the right place.'));
    pegs(mid, 100, 430, 0, 1, 1, 40, 17);
    say(140, 424, tr('Chốt bạc: đúng chòm,', 'Silver peg: in the lock,'));
    say(140, 458, tr('nhưng sai chỗ.', 'but in the wrong place.'));
    pegs(mid, 100, 530, 0, 0, 1, 40, 17);
    say(140, 524, tr('Vòng rỗng: chòm đó', 'Empty ring: not'));
    say(140, 558, tr('không có trong khoá.', 'in the lock at all.'));
    say(295, 632, tr('Thử mã ở hàng dưới cùng: đèn mỗi', 'Try codes on the bottom row:'), 'middle');
    say(295, 666, tr('trang sáng khi chốt của nó khớp.', "a page's lamp lights if it fits."), 'middle');

    el('rect', { x: 590, y: 70, width: 940, height: 780, rx: 22, fill: '#241f33', stroke: '#6b4f24', 'stroke-width': 6, 'pointer-events': 'none' }, mid);
    NOTEBOOK.forEach((page, i) => {
      const y = pageY(i);
      page.guess.forEach((s, k) => {
        cell(mid, cellX(k), y);
        glyphDots(mid, SYMBOLS[s], cellX(k), y);
      });
      pegs(mid, PEG_X, y, page.gold, page.silver, 4);
    });
    el('rect', { x: 620, y: TRY_Y - 62, width: 880, height: 4, rx: 2, fill: '#6b4f24', 'pointer-events': 'none' }, mid);

    // Front: the slots to try a code in, and one lamp per page.
    const slot = (cx: number, cy: number, list: number[], k: number, glyphs: SVGGElement[][], label: string, onChange: () => void) => {
      const g = el('g', { class: 'interactive' }, front);
      el('rect', { x: cx - CELL / 2 - 4, y: cy - CELL / 2 - 4, width: CELL + 8, height: CELL + 8, rx: 14, fill: '#0b0e1d', stroke: '#f4c66a', 'stroke-width': 5 }, g);
      glyphs.push(SYMBOLS.map((id, s) => {
        const grp = glyphDots(g, id, cx, cy);
        grp.setAttribute('data-slot', `${label}-${k}-${s}`);
        return grp;
      }));
      asButton(g, tr(`Ô ${k + 1} của hàng thử mã`, `Square ${k + 1} of the code row`), () => {
        list[k] = nextSymbol(list[k]);
        sound.tick();
        onChange();
      });
    };
    for (let k = 0; k < CODE_LENGTH; k += 1) slot(cellX(k), TRY_Y, attempt, k, attemptGlyphs, 'try', () => update());
    for (let i = 0; i < NOTEBOOK.length; i += 1) {
      lamps.push(el('circle', { cx: LAMP_X, cy: pageY(i), r: 20, fill: '#3a3550', stroke: '#6b4f24', 'stroke-width': 4, 'pointer-events': 'none' }, front));
    }
    drawOwl(front, 470, 800, 0.8);

    const update = () => {
      attemptGlyphs.forEach((groups, k) => groups.forEach((g, s) => { g.style.display = attempt[k] === s ? '' : 'none'; }));
      const fit = fittingPages(attempt);
      lamps.forEach((lamp, i) => {
        const on = fit.includes(i);
        lamp.setAttribute('fill', on ? '#f4c66a' : '#3a3550');
        lamp.setAttribute('stroke', on ? '#fff1c4' : '#6b4f24');
      });
      const all = fit.length === NOTEBOOK.length;
      if (all && !wasAll) sound.ding();
      wasAll = all;
    };
    update();

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const at = (k: number) => ({ x: cellX(k), y: TRY_Y });
        return [
          {
            note: tr('Chạm một ô ở hàng dưới cùng để đổi chòm. Đèn bên phải mỗi trang sáng khi mã đang thử cho đúng số chốt ghi ở trang đó (chốt vàng: đúng chòm, đúng chỗ; chốt bạc: đúng chòm, sai chỗ). Chỉ một mã làm sáng cả 5 đèn.', 'Tap a square in the bottom row to change its constellation. The lamp to the right of each page lights when your code gives exactly the pegs shown on that page (gold peg: right constellation, right place; silver peg: right constellation, wrong place). Only one code lights all 5 lamps.'),
            targets: [
              {
                x: at(0).x, y: at(0).y, r: 60, verb: 'tap',
                act: (picture) => {
                  const nodes = SECRET.map((s, k) => picture.querySelector<SVGElement>(`[data-slot="try-${k}-${s}"]`));
                  return (p) => nodes.forEach((n, k) => { if (n) n.style.display = p > (k + 0.5) / nodes.length ? '' : 'none'; });
                },
              },
            ],
            apply: () => {
              SECRET.forEach((s, k) => { attempt[k] = s; });
              update();
            },
          },
          {
            note: tr('Cả 5 đèn đã sáng. Đọc bốn chòm ở hàng dưới cùng từ trái sang phải.', 'All 5 lamps are lit. Read the four constellations in the bottom row from left to right.'),
            targets: SECRET.map((_, k) => ({ x: at(k).x, y: at(k).y, r: 62, verb: 'look' as const })),
            prepare: (picture) => {
              const overlay = picture.querySelector('.layer-overlay') ?? picture;
              SECRET.forEach((_, k) => {
                const p = at(k);
                const badge = el('g', { transform: `translate(${p.x + 40} ${p.y - 40})`, 'pointer-events': 'none' }, overlay);
                el('circle', { r: 17, class: 'number-badge' }, badge);
                el('text', { y: 1, class: 'number-text' }, badge).textContent = String(k + 1);
              });
            },
          },
        ];
      },
      destroy: () => undefined,
    };
  },
};
