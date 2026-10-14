import { drawOwl } from '../core/owl';
import type { GlyphId } from '../core/glyphs';
import { glyph, placeStars } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el } from '../core/svg';
import { drawKidIcon } from './kidIcons';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 3, level 11 — who carries which lantern ("ai cầm đèn nào"). Four children walk in a
 * lantern procession, each carrying one of four lanterns. Six picture cards say things about them
 * (who holds what, who does not, who is ahead of whom, who is next to whom, who is last). Tap the
 * child cells and the lantern cells of the four places in the line to try an arrangement; a card's
 * lamp turns gold when it holds for what is placed. Only one arrangement satisfies all six. The
 * answer is the constellations on the lanterns, from the front of the procession to the back.
 */

/** The constellation on each lantern. */
export const LANTERN_GLYPHS: readonly GlyphId[] = ['belt', 'square', 'crown', 'dipper'];
export const PLACES = 4;

export type Clue =
  | { t: 'holds'; k: number; l: number }
  | { t: 'notHolds'; k: number; l: number }
  | { t: 'first'; k: number }
  | { t: 'last'; k: number }
  | { t: 'kidBefore'; a: number; b: number }
  | { t: 'kidAdj'; a: number; b: number }
  | { t: 'lanBefore'; a: number; b: number }
  | { t: 'lanAdj'; a: number; b: number }
  | { t: 'lanFirst'; l: number }
  | { t: 'lanLast'; l: number };

/** What is placed: for each place in the line (front first), the child and lantern there (−1 for none). */
export interface Arrangement {
  kidAt: readonly number[];
  lanternAt: readonly number[];
}

/** The six cards. */
export const CLUES: readonly Clue[] = [
  { t: 'lanAdj', a: 1, b: 3 },
  { t: 'notHolds', k: 3, l: 2 },
  { t: 'kidBefore', a: 0, b: 3 },
  { t: 'kidBefore', a: 2, b: 0 },
  { t: 'last', k: 1 },
  { t: 'holds', k: 2, l: 1 },
];

/** The one arrangement that fits (the answer): child 2 at the front with lantern 1, then 0 with 3, 3 with 0, 1 with 2. */
export const SOLUTION: Arrangement = { kidAt: [2, 0, 3, 1], lanternAt: [1, 3, 0, 2] };
export const READING_ORDER: readonly number[] = SOLUTION.lanternAt;

/** Every place a child or lantern has been put in (empty when it is not placed; several when it is repeated). */
const placesOf = (list: readonly number[], v: number): number[] => list.flatMap((x, p) => (x === v ? [p] : []));

/**
 * Does the clue hold for the arrangement? A card lights as soon as what it says can be read off what
 * is placed, whether or not the placing is right or complete: cards about something not placed do not
 * hold, and a child or lantern put in several places counts in each of them.
 */
export function holds(c: Clue, a: Arrangement): boolean {
  const kid = (k: number) => placesOf(a.kidAt, k);
  const lan = (l: number) => placesOf(a.lanternAt, l);
  const some = (xs: number[], ys: number[], ok: (x: number, y: number) => boolean) => xs.some((x) => ys.some((y) => ok(x, y)));
  switch (c.t) {
    case 'holds': return some(kid(c.k), lan(c.l), (x, y) => x === y);
    case 'notHolds': return kid(c.k).length > 0 && lan(c.l).length > 0 && !some(kid(c.k), lan(c.l), (x, y) => x === y);
    case 'first': return kid(c.k).includes(0);
    case 'last': return kid(c.k).includes(PLACES - 1);
    case 'kidBefore': return some(kid(c.a), kid(c.b), (x, y) => x < y);
    case 'kidAdj': return some(kid(c.a), kid(c.b), (x, y) => Math.abs(x - y) === 1);
    case 'lanBefore': return some(lan(c.a), lan(c.b), (x, y) => x < y);
    case 'lanAdj': return some(lan(c.a), lan(c.b), (x, y) => Math.abs(x - y) === 1);
    case 'lanFirst': return lan(c.l).includes(0);
    case 'lanLast': return lan(c.l).includes(PLACES - 1);
  }
}

const permutations = (xs: number[]): number[][] => (xs.length <= 1 ? [xs] : xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p])));

/** Every full arrangement that satisfies all of `clues` (used by the tests to show that the answer is unique). */
export function solutions(clues: readonly Clue[] = CLUES): Arrangement[] {
  const perms = permutations([0, 1, 2, 3]);
  return perms.flatMap((kidAt) => perms.map((lanternAt) => ({ kidAt, lanternAt })))
    .filter((arr) => clues.every((c) => holds(c, arr)));
}

const PLACE_X = (p: number): number => 170 + p * 215;
const KID_Y = 360;
const LANTERN_Y = 600;
const CARD = { w: 230, h: 190, x0: 1040, y0: 90, gx: 250, gy: 235 };
const cardCentre = (i: number): { x: number; y: number } => ({
  x: CARD.x0 + (i % 2) * CARD.gx + CARD.w / 2,
  y: CARD.y0 + Math.floor(i / 2) * CARD.gy + CARD.h / 2,
});

function drawLantern(parent: Element, l: number, s = 1): SVGGElement {
  const g = el('g', { transform: `scale(${s})` }, parent);
  el('rect', { x: -10, y: -42, width: 20, height: 9, rx: 3, fill: '#4a2c1a' }, g);
  el('ellipse', { rx: 30, ry: 38, fill: '#b8452f', stroke: '#7a2a1c', 'stroke-width': 3 }, g);
  el('rect', { x: -10, y: 33, width: 20, height: 9, rx: 3, fill: '#4a2c1a' }, g);
  for (const [x, y] of placeStars(LANTERN_GLYPHS[l], 0, 0, 44)) el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 3, fill: '#fff3c8' }, g);
  return g;
}

export const procession: PuzzleDef = {
  id: 'procession',
  name: 'Ai cầm đèn nào',
  answer: READING_ORDER.map((l) => LANTERN_GLYPHS[l]),
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const kidAt = [-1, -1, -1, -1];
    const lanternAt = [-1, -1, -1, -1];
    const kidCells: SVGGElement[] = [];
    const lanternCells: SVGGElement[] = [];
    const lamps: SVGCircleElement[] = [];

    // Back: the street at night.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#1d1a2c' }, back);
    el('rect', { x: -60, y: 800, width: SCENE_W + 120, height: 160, fill: '#33271f' }, back);
    scene.grain('back', 0.45);

    // Mid: the line of four places, and the six cards.
    el('rect', { x: 60, y: 110, width: 900, height: 640, rx: 22, fill: '#2b2230', stroke: '#6b4f24', 'stroke-width': 6 }, mid);
    el('path', { d: 'M110 160 H880 M846 140 L882 160 L846 180', fill: 'none', stroke: '#8a6a48', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, mid);
    for (let p = 0; p < PLACES; p += 1) {
      el('rect', { x: PLACE_X(p) - 90, y: 220, width: 180, height: 480, rx: 16, fill: '#382d40' }, mid);
      for (let k = 0; k < 2; k += 1) el('ellipse', { cx: PLACE_X(p) - 24 + k * 48, cy: 724, rx: 11, ry: 17, fill: '#241c2c', transform: `rotate(${k ? 8 : -8} ${PLACE_X(p)} 724)` }, mid);
    }

    const drawIcon = (parent: Element, who: 'kid' | 'lantern', n: number, s = 1): SVGGElement => {
      if (who === 'kid') {
        const g = el('g', { transform: `scale(${s})` }, parent);
        drawKidIcon(g, n, 24);
        return g;
      }
      return drawLantern(parent, n, s * 0.8);
    };

    CLUES.forEach((c, i) => {
      const { x, y } = cardCentre(i);
      const g = el('g', { transform: `translate(${x} ${y})`, 'pointer-events': 'none' }, mid);
      el('rect', { x: -CARD.w / 2, y: -CARD.h / 2, width: CARD.w, height: CARD.h, rx: 16, fill: '#efe6cf', stroke: '#b9a27f', 'stroke-width': 4 }, g);
      const lamp = el('circle', { cx: CARD.w / 2 - 22, cy: -CARD.h / 2 + 22, r: 11, fill: '#d8ccb0', stroke: '#8a6a3c', 'stroke-width': 3 }, g);
      lamps.push(lamp);
      const icon = (who: 'kid' | 'lantern', n: number, dx: number, dy = 0, s = 1.2) => {
        const holder = el('g', { transform: `translate(${dx} ${dy})` }, g);
        drawIcon(holder, who, n, s);
      };
      const arrow = (x1: number, x2: number, y0 = 0) => el('path', { d: `M${x1} ${y0} H${x2} M${x2 - 14} ${y0 - 12} L${x2} ${y0} L${x2 - 14} ${y0 + 12}`, fill: 'none', stroke: '#3a2a18', 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      const cross = (cx: number) => el('path', { d: `M${cx - 16} -16 L${cx + 16} 16 M${cx + 16} -16 L${cx - 16} 16`, stroke: '#b8382b', 'stroke-width': 9, 'stroke-linecap': 'round' }, g);
      const slots = (hi: number, who: 'kid' | 'lantern', n: number) => {
        for (let p = 0; p < PLACES; p += 1) {
          el('rect', { x: -78 + p * 40, y: 38, width: 34, height: 34, rx: 8, fill: p === hi ? '#d3a64f' : '#cdbf9c', stroke: '#8a6a3c', 'stroke-width': 3 }, g);
        }
        icon(who, n, -61 + hi * 40, -18, 1.0);
      };
      switch (c.t) {
        case 'holds':
          icon('kid', c.k, -58);
          icon('lantern', c.l, 58);
          el('path', { d: 'M-24 0 H24', stroke: '#3a2a18', 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
          break;
        case 'notHolds':
          icon('kid', c.k, -58);
          icon('lantern', c.l, 58);
          el('path', { d: 'M-24 0 H24', stroke: '#3a2a18', 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
          cross(0);
          break;
        case 'kidBefore':
          icon('kid', c.a, -74);
          arrow(-34, 34);
          icon('kid', c.b, 74);
          break;
        case 'lanBefore':
          icon('lantern', c.a, -74);
          arrow(-34, 34);
          icon('lantern', c.b, 74);
          break;
        case 'kidAdj':
          icon('kid', c.a, -66);
          icon('kid', c.b, 66);
          el('path', { d: 'M-30 0 H30 M-16 -10 L-30 0 L-16 10 M16 -10 L30 0 L16 10', fill: 'none', stroke: '#3a2a18', 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
          break;
        case 'lanAdj':
          icon('lantern', c.a, -66);
          icon('lantern', c.b, 66);
          el('path', { d: 'M-30 0 H30 M-16 -10 L-30 0 L-16 10 M16 -10 L30 0 L16 10', fill: 'none', stroke: '#3a2a18', 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
          break;
        case 'first': slots(0, 'kid', c.k); break;
        case 'last': slots(PLACES - 1, 'kid', c.k); break;
        case 'lanFirst': slots(0, 'lantern', c.l); break;
        case 'lanLast': slots(PLACES - 1, 'lantern', c.l); break;
      }
    });

    // Front: the tappable cells of the four places, and the owl.
    for (let p = 0; p < PLACES; p += 1) {
      const kc = el('g', { class: 'proc-cell interactive', transform: `translate(${PLACE_X(p)} ${KID_Y})`, 'data-hint': `kid-${p}` }, front);
      el('circle', { r: 62, fill: 'transparent' }, kc);
      kidCells.push(kc);
      asButton(kc, `Bạn nhỏ ở chỗ ${p + 1}`, () => cycle(kidAt, p, 4));
      const lc = el('g', { class: 'proc-cell interactive', transform: `translate(${PLACE_X(p)} ${LANTERN_Y})`, 'data-hint': `lantern-${p}` }, front);
      el('circle', { r: 70, fill: 'transparent' }, lc);
      lanternCells.push(lc);
      asButton(lc, `Đèn ở chỗ ${p + 1}`, () => cycle(lanternAt, p, 4));
    }
    drawOwl(front, 1040, 800, 0.6);

    const arrangement = (): Arrangement => ({ kidAt: [...kidAt], lanternAt: [...lanternAt] });
    const render = () => {
      for (let p = 0; p < PLACES; p += 1) {
        kidCells[p].replaceChildren();
        el('circle', { r: 62, fill: 'transparent' }, kidCells[p]);
        if (kidAt[p] >= 0) {
          const holder = el('g', { 'pointer-events': 'none' }, kidCells[p]);
          drawIcon(holder, 'kid', kidAt[p], 2.0);
        } else {
          el('circle', { r: 50, fill: 'none', stroke: '#6a5a78', 'stroke-width': 4, 'stroke-dasharray': '10 8', 'pointer-events': 'none' }, kidCells[p]);
        }
        lanternCells[p].replaceChildren();
        el('circle', { r: 70, fill: 'transparent' }, lanternCells[p]);
        if (lanternAt[p] >= 0) {
          const holder = el('g', { 'pointer-events': 'none' }, lanternCells[p]);
          drawLantern(holder, lanternAt[p], 1.7);
        } else {
          el('ellipse', { rx: 44, ry: 56, fill: 'none', stroke: '#6a5a78', 'stroke-width': 4, 'stroke-dasharray': '10 8', 'pointer-events': 'none' }, lanternCells[p]);
        }
      }
      const arr = arrangement();
      CLUES.forEach((c, i) => {
        const on = holds(c, arr);
        lamps[i].setAttribute('fill', on ? '#f4c66a' : '#d8ccb0');
        lamps[i].setAttribute('stroke', on ? '#fff1c4' : '#8a6a3c');
      });
    };
    /** Next child (or lantern) for place p: the same one may be put in several places (a card lights if it can be read off any of them). */
    function cycle(list: number[], p: number, n: number): void {
      list[p] = list[p] + 1 >= n ? -1 : list[p] + 1;
      sound.knock();
      render();
    }
    render();

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => [
        {
          note: 'Chạm ô bạn nhỏ hoặc ô đèn của mỗi chỗ trong đoàn để đổi người hoặc đèn. Đèn vàng góc thẻ sáng khi thẻ đó thoả cách xếp; chỉ có một cách xếp đủ 4 bạn và 4 đèn khác nhau làm sáng cả 6 thẻ.',
          targets: [{ x: PLACE_X(0), y: KID_Y, r: 60, verb: 'tap' }],
          apply: () => {
            SOLUTION.kidAt.forEach((k, p) => { kidAt[p] = k; });
            SOLUTION.lanternAt.forEach((l, p) => { lanternAt[p] = l; });
            render();
          },
        },
        {
          note: 'Đọc chòm trên các đèn từ đầu đoàn (trái) đến cuối đoàn (phải).',
          targets: SOLUTION.lanternAt.map((_, p) => ({ x: PLACE_X(p), y: LANTERN_Y, r: 80, verb: 'look' as const })),
          prepare: (picture) => {
            const overlay = picture.querySelector('.layer-overlay') ?? picture;
            SOLUTION.lanternAt.forEach((l, p) => {
              const stars = placeStars(LANTERN_GLYPHS[l], PLACE_X(p), LANTERN_Y, 44 * 1.7);
              for (const [a, b] of glyph(LANTERN_GLYPHS[l]).lines) {
                el('line', { x1: stars[a][0], y1: stars[a][1], x2: stars[b][0], y2: stars[b][1], class: 'hint-line', 'pointer-events': 'none' }, overlay);
              }
              const badge = el('g', { transform: `translate(${PLACE_X(p)} ${LANTERN_Y - 92})`, 'pointer-events': 'none' }, overlay);
              el('circle', { r: 17, class: 'number-badge' }, badge);
              el('text', { y: 1, class: 'number-text' }, badge).textContent = String(p + 1);
            });
          },
        },
      ],
      destroy: () => undefined,
    };
  },
};
