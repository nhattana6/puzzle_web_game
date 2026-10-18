import { glyph, placeStars, type GlyphId } from '../core/glyphs';
import { drawOwl } from '../core/owl';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el, uid } from '../core/svg';
import { clamp, easeOutCubic, tween } from '../core/tween';
import { starfield } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 5, level 8 — the lotus-seed game ("ván hạt sen"), a game of Nim against a badger. In the
 * dining car there are four jars of lotus seeds, each with a constellation on its tag, and across the
 * table sits a ticket-inspector badger. On your turn you tap a seed: it and every seed above it are
 * taken, from one jar only. Whoever takes the very last seed wins; the owl goes first. The badger plays
 * a perfect game: if there is a winning move he makes it, and if not he takes the whole of the fullest
 * jar. Lose and the jars fill up again and the ledger is wiped; win, and the ledger holds, for each of your
 * moves, the constellation on the jar you took from. Read them in order.
 */

export const BOWLS = 4;
/** Seeds in each jar at the start, left to right. Their Nim sum is not 0, so the first player can win. */
export const START_PILES: readonly number[] = [2, 5, 8, 1];
export const BOWL_GLYPHS: readonly GlyphId[] = ['square', 'hook', 'crown', 'cross'];
/** A jar holds at most this many seeds (the fullest one). */
export const JAR_SEEDS = Math.max(...START_PILES);
/** The ledger has room for this many of the owl's moves (a game can never last more, the longest takes eight). */
export const LEDGER_SLOTS = 8;

export type Move = readonly [bowl: number, take: number];
export const nimSum = (piles: readonly number[]): number => piles.reduce((s, v) => s ^ v, 0);
export const isEmpty = (piles: readonly number[]): boolean => piles.every((p) => p === 0);
export const legalMoves = (piles: readonly number[]): Move[] => piles.flatMap((p, bowl) => Array.from({ length: p }, (_, k) => [bowl, k + 1] as Move));
export const applyMove = (piles: readonly number[], [bowl, take]: Move): number[] => piles.map((p, i) => (i === bowl ? p - take : p));
/** Tapping the seed at height `height` (0 = the bottom one) takes it and all above: this many seeds go. */
export const takeFor = (piles: readonly number[], bowl: number, height: number): number => Math.max(0, piles[bowl] - height);
export const winningMoves = (piles: readonly number[]): Move[] => legalMoves(piles).filter((m) => nimSum(applyMove(piles, m)) === 0);

/** The badger: a winning move if there is one (the first), else the whole of the fullest jar (the first of equals). */
export function badgerMove(piles: readonly number[]): Move {
  const win = winningMoves(piles);
  if (win.length) return win[0];
  let best = 0;
  piles.forEach((p, i) => { if (p > piles[best]) best = i; });
  return [best, piles[best]];
}

export interface Round {
  /** The owl's moves, then the badger's reply to each (none after the owl's last). */
  owl: Move[];
  badger: Move[];
  /** The jars after each of the owl's moves and each reply, in order, starting with the full jars. */
  states: number[][];
}

/** The one game the owl wins: it always makes the only winning move. */
export function winningRound(): Round {
  let piles = [...START_PILES];
  const round: Round = { owl: [], badger: [], states: [piles] };
  while (!isEmpty(piles)) {
    const [move] = winningMoves(piles);
    round.owl.push(move);
    piles = applyMove(piles, move);
    round.states.push(piles);
    if (isEmpty(piles)) break;
    const reply = badgerMove(piles);
    round.badger.push(reply);
    piles = applyMove(piles, reply);
    round.states.push(piles);
  }
  return round;
}
export const WINNING_ROUND: Round = winningRound();
/** The ledger of the won game: the constellation of the jar taken from at each move. */
export const READING: readonly GlyphId[] = WINNING_ROUND.owl.map(([bowl]) => BOWL_GLYPHS[bowl]);

/** In how many games (every choice of the owl against this badger) does the owl take the last seed? */
export function countWinningGames(piles: readonly number[] = START_PILES): number {
  if (isEmpty(piles)) return 0;
  let n = 0;
  for (const move of legalMoves(piles)) {
    const next = applyMove(piles, move);
    if (isEmpty(next)) n += 1;
    else n += countWinningGames(applyMove(next, badgerMove(next)));
  }
  return n;
}

// ---------------------------------------------------------------- drawing

export const JAR_X: readonly number[] = [340, 570, 800, 1030];
export const JAR = { top: 320, bottom: 760, half: 68 };
export const SEED = 50;
export const seedXY = (bowl: number, height: number): { x: number; y: number } => ({ x: JAR_X[bowl], y: JAR.bottom - 18 - SEED / 2 - height * SEED });
export const TAG_Y = 268;
export const LEDGER = { x: 1230, y: 190, w: 300, h: 580 };
export const slotXY = (n: number): { x: number; y: number } => ({ x: LEDGER.x + LEDGER.w / 2, y: LEDGER.y + 50 + n * 68 });

/** Shows the seeds in each jar (the rest hidden, put back in place), in the scene or in a copy of it. */
export function paintSeeds(root: ParentNode, piles: readonly number[]): void {
  root.querySelectorAll<SVGElement>('[data-seed]').forEach((n) => {
    const [bowl, height] = (n.getAttribute('data-seed') ?? '0-0').split('-').map(Number);
    n.style.display = height < piles[bowl] ? '' : 'none';
    const at = seedXY(bowl, height);
    n.setAttribute('transform', `translate(${at.x} ${at.y})`);
    n.setAttribute('opacity', '1');
  });
}

/** Shows the owl's moves written in the ledger, one line each. */
export function paintLedger(root: ParentNode, log: readonly number[]): void {
  root.querySelectorAll<SVGElement>('[data-slot-glyph]').forEach((n) => {
    const [slot, bowl] = (n.getAttribute('data-slot-glyph') ?? '0-0').split('-').map(Number);
    n.style.display = log[slot] === bowl ? '' : 'none';
  });
}

export const lotusNim: PuzzleDef = {
  id: 'lotus-nim',
  name: 'Ván hạt sen',
  answer: [...READING],
  help: [
    'Cú và bác lửng lần lượt lấy hạt sen ra khỏi các bát; cú đi trước, đèn sáng ở bên nào là đến lượt bên đó. Ai lấy hạt cuối cùng trên bàn thì thắng.',
    'Chạm một hạt: hạt đó và các hạt nằm trên nó cùng bị lấy đi, chỉ từ một bát. Mỗi lượt phải lấy ít nhất một hạt, nên chạm hạt dưới cùng là lấy cả bát.',
    'Bác lửng chơi rất giỏi. Thua thì các bát đầy lại và sổ ván xoá, cứ thử lại. Thắng thì sổ ván giữ lại chòm sao trên thẻ của bát cú đã lấy ở mỗi lượt: đọc từ dòng trên xuống dòng dưới.',
  ],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    let piles = [...START_PILES];
    let log: number[] = [];
    let phase: 'you' | 'badger' | 'won' | 'lost' = 'you';
    let cancel = () => {};
    let timer = 0;

    // Back: the dining car, a window onto the night and a lamp.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#2a1a20' }, back);
    el('rect', { x: 300, y: 36, width: 760, height: 250, rx: 20, fill: '#0b1030', stroke: '#4a3040', 'stroke-width': 16 }, back);
    starfield(back, { x: 310, y: 46, w: 740, h: 230 }, 24, 808);
    scene.grain('back', 0.35);

    // Mid: the badger, the table with its jars, and the ledger.
    const badger = el('g', { transform: 'translate(685 128)', 'pointer-events': 'none' }, mid);
    el('ellipse', { cx: 0, cy: 118, rx: 130, ry: 70, fill: '#3a4a5e' }, badger);
    el('path', { d: 'M-34 70 L0 140 L34 70 Z', fill: '#e8dcc0' }, badger);
    el('circle', { r: 78, fill: '#7a7f8c' }, badger);
    el('path', { d: 'M-18 -78 Q0 -40 -10 0 Q-20 40 -26 76 L26 76 Q20 40 10 0 Q0 -40 18 -78 Z', fill: '#f1ece0' }, badger);
    el('circle', { cx: -62, cy: -52, r: 20, fill: '#5a5e6a' }, badger);
    el('circle', { cx: 62, cy: -52, r: 20, fill: '#5a5e6a' }, badger);
    const cap = el('g', { 'data-role': 'cap' }, badger);
    el('path', { d: 'M-70 -44 Q0 -118 70 -44 Z', fill: '#2a3a8a', stroke: '#141c4a', 'stroke-width': 4 }, cap);
    el('rect', { x: -78, y: -48, width: 156, height: 14, rx: 6, fill: '#141c4a' }, cap);
    el('circle', { cx: 0, cy: -66, r: 9, fill: '#f4c66a' }, cap);
    const eyesOpen = el('g', { 'data-role': 'eyes-open' }, badger);
    for (const dx of [-26, 26]) {
      el('circle', { cx: dx, cy: -4, r: 11, fill: '#f6efd8' }, eyesOpen);
      el('circle', { cx: dx + 2, cy: -3, r: 6, fill: '#14121c' }, eyesOpen);
    }
    const eyesGlad = el('g', { 'data-role': 'eyes-glad', style: 'display:none' }, badger);
    for (const dx of [-26, 26]) el('path', { d: `M${dx - 11} 0 Q${dx} -14 ${dx + 11} 0`, fill: 'none', stroke: '#14121c', 'stroke-width': 5, 'stroke-linecap': 'round' }, eyesGlad);
    el('ellipse', { cx: 0, cy: 28, rx: 14, ry: 10, fill: '#2a2430' }, badger);
    el('path', { d: 'M-20 46 Q0 56 20 46', fill: 'none', stroke: '#2a2430', 'stroke-width': 4, 'stroke-linecap': 'round' }, badger);
    // The ticket punch in his paw.
    el('rect', { x: 70, y: 96, width: 46, height: 18, rx: 6, fill: '#b0b4c0', stroke: '#505462', 'stroke-width': 3, transform: 'rotate(-20 93 105)' }, badger);

    el('rect', { x: 170, y: 310, width: 1030, height: 500, rx: 20, fill: '#ece1c4', stroke: '#8a7a50', 'stroke-width': 8 }, mid);
    for (let i = 0; i < 12; i += 1) el('line', { x1: 170 + i * 86 + 40, y1: 318, x2: 170 + i * 86 + 40, y2: 802, stroke: '#d4876a', 'stroke-width': 10, opacity: 0.35 }, mid);
    for (let i = 0; i < 6; i += 1) el('line', { x1: 178, y1: 360 + i * 90, x2: 1192, y2: 360 + i * 90, stroke: '#d4876a', 'stroke-width': 10, opacity: 0.35 }, mid);

    const glass = uid('glass');
    const grad = el('linearGradient', { id: glass, x1: 0, y1: 0, x2: 1, y2: 0 }, scene.defs);
    el('stop', { offset: 0, 'stop-color': '#bfe0ee', 'stop-opacity': 0.35 }, grad);
    el('stop', { offset: 0.5, 'stop-color': '#bfe0ee', 'stop-opacity': 0.12 }, grad);
    el('stop', { offset: 1, 'stop-color': '#bfe0ee', 'stop-opacity': 0.3 }, grad);
    JAR_X.forEach((x, b) => {
      el('rect', { x: x - JAR.half, y: JAR.top, width: JAR.half * 2, height: JAR.bottom - JAR.top, rx: 26, fill: `url(#${glass})`, stroke: '#8fb4c4', 'stroke-width': 5, 'pointer-events': 'none' }, mid);
      // The tag with the jar's constellation.
      const tag = el('g', { transform: `translate(${x} ${TAG_Y})`, 'pointer-events': 'none' }, mid);
      el('rect', { x: -58, y: -34, width: 116, height: 68, rx: 10, fill: '#13182e', stroke: '#e6dcc0', 'stroke-width': 4 }, tag);
      for (const [sx, sy] of placeStars(BOWL_GLYPHS[b], 0, 0, 50)) el('circle', { cx: sx.toFixed(1), cy: sy.toFixed(1), r: 4, fill: '#fff8dc' }, tag);
      el('line', { x1: 0, y1: 34, x2: 0, y2: JAR.top - TAG_Y, stroke: '#e6dcc0', 'stroke-width': 4 }, tag);
    });

    // The ledger: eight lines, each able to show any jar's constellation.
    const book = el('g', { 'pointer-events': 'none' }, mid);
    el('rect', { x: LEDGER.x, y: LEDGER.y, width: LEDGER.w, height: LEDGER.h, rx: 18, fill: '#e9dfc4', stroke: '#6a4a30', 'stroke-width': 10 }, book);
    el('line', { x1: LEDGER.x + 40, y1: LEDGER.y + 20, x2: LEDGER.x + 40, y2: LEDGER.y + LEDGER.h - 20, stroke: '#c46a5a', 'stroke-width': 4 }, book);
    for (let n = 0; n < LEDGER_SLOTS; n += 1) {
      const { x, y } = slotXY(n);
      el('rect', { 'data-role': 'line', x: LEDGER.x + 56, y: y - 30, width: LEDGER.w - 80, height: 60, rx: 10, fill: '#13182e', stroke: '#8a7a50', 'stroke-width': 3 }, book);
      for (let b = 0; b < BOWLS; b += 1) {
        const g = el('g', { 'data-slot-glyph': `${n}-${b}`, style: 'display:none' }, book);
        for (const [sx, sy] of placeStars(BOWL_GLYPHS[b], x + 14, y, 44)) el('circle', { cx: sx.toFixed(1), cy: sy.toFixed(1), r: 3.8, fill: '#fff8dc' }, g);
      }
    }

    // The seeds: every jar has room for the fullest, shown or hidden by how many are in it.
    const seeds: SVGGElement[][] = START_PILES.map(() => []);
    JAR_X.forEach((_, b) => {
      for (let h = 0; h < JAR_SEEDS; h += 1) {
        const g = el('g', { class: 'interactive', 'data-seed': `${b}-${h}` }, front);
        // The whole width of the jar and one seed's height: a thumb on a phone cannot miss sideways.
        el('rect', { x: -JAR.half, y: -SEED / 2, width: JAR.half * 2, height: SEED, fill: 'transparent' }, g);
        const inner = el('g', { transform: 'scale(0.86)', 'pointer-events': 'none' }, g);
        el('path', { d: 'M0 -26 C20 -22 24 4 16 18 C8 30 -8 30 -16 18 C-24 4 -20 -22 0 -26 Z', fill: '#d8c48a', stroke: '#8a7a3a', 'stroke-width': 3, 'data-role': 'shape' }, inner);
        el('path', { d: 'M0 -22 C-6 -10 -6 6 0 14', fill: 'none', stroke: '#b8a45a', 'stroke-width': 3 }, inner);
        el('circle', { cx: 0, cy: -20, r: 4, fill: '#7a8a3a' }, inner);
        seeds[b].push(g);
      }
    });
    drawOwl(front, 110, 810, 0.85);
    // Whose turn it is: a lamp over the owl, and one over the badger.
    const lamp = (x: number, y: number, role: string) => {
      const g = el('g', { 'data-role': role, 'pointer-events': 'none' }, front);
      el('circle', { cx: x, cy: y, r: 34, fill: '#ffe2a0', opacity: 0.35, 'data-role': 'glow' }, g);
      el('circle', { cx: x, cy: y, r: 15, fill: '#fff3c8', stroke: '#8a6a3a', 'stroke-width': 5 }, g);
      return g;
    };
    const owlLamp = lamp(110, 720, 'turn-owl');
    const badgerLamp = lamp(850, 70, 'turn-badger');
    const setPhase = (next: 'you' | 'badger' | 'won' | 'lost') => {
      phase = next;
      owlLamp.style.opacity = next === 'you' ? '1' : '0.18';
      badgerLamp.style.opacity = next === 'badger' ? '1' : '0.18';
    };

    const label = (b: number, h: number) => `Bát ${b + 1}, hạt ${h + 1}: bốc hạt này và các hạt nằm trên nó`;
    const mark = (b: number, from: number, on: boolean) => {
      seeds[b].forEach((g, h) => {
        const shape = g.querySelector<SVGElement>('[data-role="shape"]');
        shape?.setAttribute('stroke', on && h >= from && h < piles[b] ? '#ffd45a' : '#8a7a3a');
        shape?.setAttribute('stroke-width', on && h >= from && h < piles[b] ? '7' : '3');
      });
    };
    const setBadgerFace = (glad: boolean) => {
      const open = scene.root.querySelector<SVGElement>('[data-role="eyes-open"]');
      const happy = scene.root.querySelector<SVGElement>('[data-role="eyes-glad"]');
      if (open) open.style.display = glad ? 'none' : '';
      if (happy) happy.style.display = glad ? '' : 'none';
    };
    const setCap = (raised: boolean) => scene.root.querySelector('[data-role="cap"]')?.setAttribute('transform', raised ? 'translate(0 -26) rotate(-12)' : '');
    const lockSeeds = () => seeds.flat().forEach((g) => {
      g.style.pointerEvents = 'none';
      g.classList.remove('interactive');
      g.removeAttribute('tabindex');
      g.setAttribute('aria-disabled', 'true');
    });
    const show = () => {
      paintSeeds(scene.root, piles);
      paintLedger(scene.root, log);
    };
    setPhase('you');

    /** Takes seeds out of a jar with a short lift-and-fade, then shows the new jars. */
    const take = (bowl: number, count: number, done: () => void) => {
      const from = piles[bowl] - count;
      const going = seeds[bowl].slice(from, piles[bowl]);
      cancel();
      cancel = tween(320, (k) => {
        going.forEach((g, i) => {
          const at = seedXY(bowl, from + i);
          g.setAttribute('transform', `translate(${at.x} ${(at.y - k * 70).toFixed(1)})`);
          g.setAttribute('opacity', (1 - k).toFixed(2));
        });
      }, easeOutCubic);
      timer = window.setTimeout(done, 340);
    };

    const reset = () => {
      piles = [...START_PILES];
      log = [];
      setPhase('you');
      setBadgerFace(false);
      show();
    };

    const badgerTurn = () => {
      setPhase('badger');
      timer = window.setTimeout(() => {
        const [bowl, count] = badgerMove(piles);
        // He points at what he will take.
        mark(bowl, piles[bowl] - count, true);
        timer = window.setTimeout(() => {
          mark(bowl, 0, false);
          sound.knock();
          take(bowl, count, () => {
            piles = applyMove(piles, [bowl, count]);
            show();
            if (isEmpty(piles)) {
              setPhase('lost');
              setBadgerFace(true);
              sound.wrong();
              timer = window.setTimeout(reset, 1700);
            } else setPhase('you');
          });
        }, 520);
      }, 900);
    };

    const owlTakes = (bowl: number, height: number) => {
      if (phase !== 'you') return;
      const count = takeFor(piles, bowl, height);
      if (count < 1) return;
      setPhase('badger');
      mark(bowl, 0, false);
      sound.knock();
      log.push(bowl);
      paintLedger(scene.root, log);
      take(bowl, count, () => {
        piles = applyMove(piles, [bowl, count]);
        show();
        if (isEmpty(piles)) {
          setPhase('won');
          setCap(true);
          sound.ding();
          lockSeeds();
          scene.root.querySelectorAll('[data-role="line"]').forEach((n, i) => {
            if (i < log.length) {
              n.setAttribute('stroke', '#ffd45a');
              n.setAttribute('stroke-width', '6');
            }
          });
          return;
        }
        badgerTurn();
      });
    };

    seeds.forEach((column, b) => column.forEach((g, h) => {
      asButton(g, label(b, h), () => owlTakes(b, h));
      g.addEventListener('pointerenter', () => { if (phase === 'you' && h < piles[b]) mark(b, h, true); });
      g.addEventListener('pointerleave', () => mark(b, 0, false));
    }));
    show();

    return {
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const round = WINNING_ROUND;
        const firstMove = round.owl[0];
        const first = seedXY(firstMove[0], START_PILES[firstMove[0]] - firstMove[1]);
        const logAfter = (n: number): number[] => round.owl.slice(0, n).map(([b]) => b);
        // States at the owl's turns: jars after each badger reply, with the moves made so far.
        const turns = round.owl.map((_, i) => ({ piles: round.states[i * 2], log: logAfter(i) }));
        turns.push({ piles: round.states[round.states.length - 1], log: logAfter(round.owl.length) });
        const finish = () => {
          piles = [0, 0, 0, 0];
          log = logAfter(round.owl.length);
          setPhase('won');
          show();
          setCap(true);
          lockSeeds();
        };
        return [
          {
            note: 'Ai bốc hạt cuối cùng thì thắng, cú đi trước. Chạm một hạt: nó và các hạt nằm trên nó cùng được bốc, chỉ từ một bát. Bác lửng luôn đi nước tốt nhất có thể (không có nước thắng thì bốc cả bát nhiều hạt nhất), nên phải tìm đúng nước đi: thử bốc hai hạt trên cùng của bát nhiều hạt nhất.',
            targets: [{
              x: first.x, y: first.y, r: 40, verb: 'tap',
              act: (picture) => (p) => paintSeeds(picture, p > 0.5 ? round.states[1] : round.states[0]),
            }],
            apply: () => {
              piles = [...round.states[2]];
              log = logAfter(1);
              show();
            },
          },
          {
            note: 'Làm tiếp như vậy: sau mỗi nước của bác lửng, tìm nước để lại thế cân (tổng nhị phân của các bát bằng 0). Chỉ có một cách thắng; sai một nước là thua và phải chơi lại.',
            targets: [{
              x: JAR_X[1], y: 520, r: 0, verb: 'look',
              act: (picture) => (p) => {
                const n = turns.length;
                const i = Math.min(n - 1, Math.floor(clamp(p / 0.95, 0, 1) * n));
                paintSeeds(picture, turns[i].piles);
                paintLedger(picture, turns[i].log);
              },
            }],
            apply: finish,
          },
          {
            note: 'Thắng rồi: sổ ván ghi chòm của bát cú đã bốc ở mỗi nước. Đọc theo thứ tự các dòng: bốn dòng, bốn chòm khác nhau.',
            targets: round.owl.map((_, n) => ({ x: slotXY(n).x, y: slotXY(n).y, r: 70, verb: 'look' as const })),
            prepare: (picture) => {
              const overlay = picture.querySelector('.layer-overlay') ?? picture;
              round.owl.forEach(([bowl], n) => {
                const { x, y } = slotXY(n);
                const id = BOWL_GLYPHS[bowl];
                const stars = placeStars(id, x + 14, y, 44);
                for (const [a, b] of glyph(id).lines) el('line', { x1: stars[a][0], y1: stars[a][1], x2: stars[b][0], y2: stars[b][1], class: 'hint-line', 'pointer-events': 'none' }, overlay);
                const badge = el('g', { transform: `translate(${LEDGER.x + 24} ${y})`, 'pointer-events': 'none' }, overlay);
                el('circle', { r: 16, class: 'number-badge' }, badge);
                el('text', { y: 1, class: 'number-text' }, badge).textContent = String(n + 1);
              });
            },
          },
        ];
      },
      destroy: () => {
        cancel();
        window.clearTimeout(timer);
      },
    };
  },
};
