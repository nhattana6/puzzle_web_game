import { placeStars, type GlyphId } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el } from '../core/svg';
import { seeded } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 5, level 11 — who tells the truth ("ai nói thật"). Six animals sit in a row on a train bench, each
 * with a ticket face down. Each says one thing, drawn in a speech bubble over its head: that one animal is
 * truthful (a sun) or a liar (a moon), or that two animals are of the same kind (=) or of different kinds (≠).
 * Truthful animals always say what is so, liars always what is not. Tap an animal to give it a sun card, a moon
 * card, or none. When all six cards agree with what is said, the truthful animals turn their tickets over: read
 * the constellations from left to right.
 */

export type Mark = 'sun' | 'moon' | null;
export type Kind = 'rabbit' | 'squirrel' | 'hedgehog' | 'frog' | 'turtle' | 'mouse';
/** What a passenger says: that `x` is truthful (`truthful`) or a liar, or that `x` and `y` are alike (`same`) or not. */
export type Statement =
  | { kind: 'about'; x: number; truthful: boolean }
  | { kind: 'pair'; x: number; y: number; same: boolean };

export const SEATS = 6;
export const KINDS: readonly Kind[] = ['rabbit', 'squirrel', 'hedgehog', 'frog', 'turtle', 'mouse'];
export const NAMES: readonly string[] = ['Thỏ', 'Sóc', 'Nhím', 'Ếch', 'Rùa', 'Chuột'];

/** What each passenger says (index = seat, left to right). */
export const STATEMENTS: readonly Statement[] = [
  { kind: 'about', x: 3, truthful: false }, // Thỏ: "Ếch nói dối."
  { kind: 'pair', x: 0, y: 3, same: true }, //  Sóc: "Thỏ và Ếch cùng loại."
  { kind: 'pair', x: 3, y: 5, same: false }, // Nhím: "Ếch và Chuột khác loại."
  { kind: 'pair', x: 0, y: 5, same: false }, // Ếch: "Thỏ và Chuột khác loại."
  { kind: 'pair', x: 1, y: 2, same: false }, // Rùa: "Sóc và Nhím khác loại."
  { kind: 'about', x: 0, truthful: true }, //  Chuột: "Thỏ nói thật."
];

/** The ticket each passenger holds. */
export const TICKETS: readonly GlyphId[] = ['dipper', 'triangle', 'hook', 'diamond', 'cross', 'crown'];

/** Is what a statement says so, when `truthful[i]` says whether passenger i tells the truth? */
export function holds(st: Statement, truthful: readonly boolean[]): boolean {
  return st.kind === 'about' ? truthful[st.x] === st.truthful : (truthful[st.x] === truthful[st.y]) === st.same;
}

/** Every way to say who is truthful (a bit per seat) in which each passenger says what fits their kind. */
export function consistentAssignments(statements: readonly Statement[] = STATEMENTS, skip = -1): boolean[][] {
  const out: boolean[][] = [];
  for (let m = 0; m < 1 << SEATS; m += 1) {
    const truthful = Array.from({ length: SEATS }, (_, i) => ((m >> i) & 1) === 1);
    if (statements.every((st, i) => i === skip || truthful[i] === holds(st, truthful))) out.push(truthful);
  }
  return out;
}
export const SOLUTION: readonly boolean[] = consistentAssignments()[0];
/** The seats of the truthful passengers, left to right. */
export const TRUTHFUL_SEATS: readonly number[] = SOLUTION.flatMap((t, i) => (t ? [i] : []));
export const READING: readonly GlyphId[] = TRUTHFUL_SEATS.map((i) => TICKETS[i]);

/** The cards as a truth assignment, if every passenger has one. */
export const assignmentOf = (marks: readonly Mark[]): boolean[] | null => (marks.every((m) => m !== null) ? marks.map((m) => m === 'sun') : null);
/** True when all six have a card and each says what fits the card. */
export function isSolved(marks: readonly Mark[]): boolean {
  const truthful = assignmentOf(marks);
  return truthful !== null && STATEMENTS.every((st, i) => truthful[i] === holds(st, truthful));
}
/** none → sun → moon → none. */
export const nextMark = (m: Mark): Mark => (m === null ? 'sun' : m === 'sun' ? 'moon' : null);
export const emptyMarks = (): Mark[] => Array.from({ length: SEATS }, () => null);
export const solutionMarks = (): Mark[] => SOLUTION.map((t) => (t ? 'sun' : 'moon'));

// ---------------------------------------------------------------- drawing

export const SEAT_X = (i: number): number => 150 + i * 260;
const HEAD_Y = 450;
const BUBBLE_Y = 235;
const TICKET_Y = 800;

/** A friendly little animal face, centred on the origin, about 90 units across. */
export function drawAnimal(parent: Element, kind: Kind): SVGGElement {
  const g = el('g', {}, parent);
  const eye = (x: number, y: number, r = 4.5) => {
    el('circle', { cx: x, cy: y, r, fill: '#2a2432' }, g);
    el('circle', { cx: x + r * 0.3, cy: y - r * 0.3, r: r * 0.3, fill: '#fff' }, g);
  };
  if (kind === 'rabbit') {
    for (const sx of [-1, 1]) {
      el('ellipse', { cx: sx * 17, cy: -36, rx: 10, ry: 30, fill: '#efe8e0', stroke: '#6a5a6a', 'stroke-width': 3 }, g);
      el('ellipse', { cx: sx * 17, cy: -36, rx: 4.5, ry: 21, fill: '#f0a8b8' }, g);
    }
    el('ellipse', { cx: 0, cy: 6, rx: 36, ry: 31, fill: '#efe8e0', stroke: '#6a5a6a', 'stroke-width': 3 }, g);
    eye(-13, 2); eye(13, 2);
    el('path', { d: 'M-5 12 L5 12 L0 18 Z', fill: '#e08aa0' }, g);
    el('path', { d: 'M0 18 L0 24 M0 24 Q-6 30 -10 26 M0 24 Q6 30 10 26', fill: 'none', stroke: '#6a5a6a', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, g);
  } else if (kind === 'squirrel') {
    el('path', { d: 'M30 20 Q64 20 56 -22 Q52 -48 30 -52 Q50 -28 36 -4 Z', fill: '#b5622d', stroke: '#5a3018', 'stroke-width': 3 }, g);
    for (const sx of [-1, 1]) el('path', { d: `M${sx * 14} -20 L${sx * 28} -48 L${sx * 30} -16 Z`, fill: '#c4743a', stroke: '#5a3018', 'stroke-width': 3 }, g);
    el('circle', { cx: 0, cy: 4, r: 33, fill: '#c4743a', stroke: '#5a3018', 'stroke-width': 3 }, g);
    el('ellipse', { cx: 0, cy: 16, rx: 19, ry: 14, fill: '#f0d8b8' }, g);
    eye(-13, -2); eye(13, -2);
    el('ellipse', { cx: 0, cy: 10, rx: 5, ry: 3.5, fill: '#5a3018' }, g);
    el('rect', { x: -4, y: 16, width: 8, height: 9, rx: 2, fill: '#fff', stroke: '#5a3018', 'stroke-width': 2 }, g);
  } else if (kind === 'hedgehog') {
    const spikes = el('g', { fill: '#5a4030', stroke: '#2e1f14', 'stroke-width': 2, 'stroke-linejoin': 'round' }, g);
    for (let k = 0; k < 9; k += 1) {
      const a = Math.PI + (k / 8) * Math.PI;
      const cx = Math.cos(a) * 30;
      const cy = Math.sin(a) * 30 + 8;
      el('path', { d: `M${(cx - Math.sin(a) * 9).toFixed(1)} ${(cy + Math.cos(a) * 9).toFixed(1)} L${(Math.cos(a) * 54).toFixed(1)} ${(Math.sin(a) * 54 + 8).toFixed(1)} L${(cx + Math.sin(a) * 9).toFixed(1)} ${(cy - Math.cos(a) * 9).toFixed(1)} Z` }, spikes);
    }
    el('ellipse', { cx: 0, cy: 10, rx: 33, ry: 28, fill: '#8a6a48', stroke: '#2e1f14', 'stroke-width': 3 }, g);
    el('ellipse', { cx: 0, cy: 18, rx: 22, ry: 16, fill: '#e8cfa8' }, g);
    eye(-12, 6, 4); eye(12, 6, 4);
    el('circle', { cx: 0, cy: 18, r: 5, fill: '#2a2432' }, g);
  } else if (kind === 'frog') {
    el('ellipse', { cx: 0, cy: 10, rx: 42, ry: 29, fill: '#6aa84f', stroke: '#2e5a24', 'stroke-width': 3 }, g);
    for (const sx of [-1, 1]) {
      el('circle', { cx: sx * 22, cy: -14, r: 15, fill: '#6aa84f', stroke: '#2e5a24', 'stroke-width': 3 }, g);
      el('circle', { cx: sx * 22, cy: -14, r: 9, fill: '#fff' }, g);
      el('circle', { cx: sx * 22 + 1, cy: -13, r: 5, fill: '#2a2432' }, g);
    }
    el('path', { d: 'M-26 16 Q0 38 26 16', fill: 'none', stroke: '#2e5a24', 'stroke-width': 3.5, 'stroke-linecap': 'round' }, g);
    el('circle', { cx: -6, cy: 6, r: 2, fill: '#2e5a24' }, g);
    el('circle', { cx: 6, cy: 6, r: 2, fill: '#2e5a24' }, g);
  } else if (kind === 'turtle') {
    el('path', { d: 'M-46 8 Q-46 -50 0 -50 Q46 -50 46 8 Z', fill: '#4a7a3a', stroke: '#24421c', 'stroke-width': 3 }, g);
    el('path', { d: 'M-22 8 L-14 -22 L14 -22 L22 8 M-14 -22 L0 -50 M14 -22 L0 -50', fill: 'none', stroke: '#24421c', 'stroke-width': 2.5 }, g);
    el('ellipse', { cx: 0, cy: 14, rx: 27, ry: 24, fill: '#a8c070', stroke: '#24421c', 'stroke-width': 3 }, g);
    eye(-10, 8, 4); eye(10, 8, 4);
    el('path', { d: 'M-8 22 Q0 28 8 22', fill: 'none', stroke: '#24421c', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
  } else {
    for (const sx of [-1, 1]) {
      el('circle', { cx: sx * 28, cy: -18, r: 19, fill: '#9a9aa6', stroke: '#4a4a58', 'stroke-width': 3 }, g);
      el('circle', { cx: sx * 28, cy: -18, r: 11, fill: '#e8a8b8' }, g);
    }
    el('ellipse', { cx: 0, cy: 8, rx: 30, ry: 28, fill: '#9a9aa6', stroke: '#4a4a58', 'stroke-width': 3 }, g);
    eye(-11, 2, 4); eye(11, 2, 4);
    el('circle', { cx: 0, cy: 14, r: 5, fill: '#e08aa0' }, g);
    el('path', { d: 'M-8 18 L-34 14 M-8 22 L-34 26 M8 18 L34 14 M8 22 L34 26', stroke: '#4a4a58', 'stroke-width': 2, 'stroke-linecap': 'round' }, g);
  }
  return g;
}

/** A sun (it tells the truth), centred on the origin, radius about 22. */
export function drawSun(parent: Element): SVGGElement {
  const g = el('g', {}, parent);
  for (let k = 0; k < 8; k += 1) {
    const a = (k * Math.PI) / 4;
    el('line', { x1: Math.cos(a) * 15, y1: Math.sin(a) * 15, x2: Math.cos(a) * 23, y2: Math.sin(a) * 23, stroke: '#f4c66a', 'stroke-width': 4.5, 'stroke-linecap': 'round' }, g);
  }
  el('circle', { r: 12, fill: '#ffd45a', stroke: '#8a5a10', 'stroke-width': 3 }, g);
  return g;
}
/** A crescent moon (it lies), centred on the origin. */
export function drawMoon(parent: Element): SVGGElement {
  const g = el('g', {}, parent);
  el('path', { d: 'M8 -22 A22 22 0 1 0 8 22 A17 17 0 1 1 8 -22 Z', fill: '#a9b8f0', stroke: '#2e3a7a', 'stroke-width': 3, 'stroke-linejoin': 'round' }, g);
  return g;
}

/** Draws one statement in a bubble centred on the origin. */
function drawStatement(parent: Element, st: Statement): void {
  const g = el('g', {}, parent);
  const face = (kind: Kind, x: number) => {
    const f = drawAnimal(g, kind);
    f.setAttribute('transform', `translate(${x} 4) scale(0.8)`);
  };
  if (st.kind === 'about') {
    face(KINDS[st.x], -34);
    const sym = el('g', { transform: 'translate(52 0) scale(1.6)' }, g);
    if (st.truthful) drawSun(sym); else drawMoon(sym);
  } else {
    face(KINDS[st.x], -76);
    face(KINDS[st.y], 76);
    const sym = el('g', { stroke: '#2a2432', 'stroke-width': 7, 'stroke-linecap': 'round', fill: 'none' }, g);
    el('line', { x1: -17, y1: -9, x2: 17, y2: -9 }, sym);
    el('line', { x1: -17, y1: 9, x2: 17, y2: 9 }, sym);
    if (!st.same) el('line', { x1: -13, y1: 26, x2: 13, y2: -26 }, sym);
  }
}

/** Shows each passenger's card (sun, moon or empty) in the scene or in a copy. */
export function paintMarks(root: ParentNode, marks: readonly Mark[]): void {
  marks.forEach((m, i) => {
    root.querySelectorAll<SVGElement>(`[data-card="${i}"] [data-role]`).forEach((n) => {
      const role = n.getAttribute('data-role');
      n.style.display = (role === 'empty' && m === null) || role === m ? '' : 'none';
    });
  });
}

/** Turns the truthful passengers' tickets over and dims the liars (or puts everything back). */
export function paintFinish(root: ParentNode, solved: boolean): void {
  for (let i = 0; i < SEATS; i += 1) {
    const truthful = SOLUTION[i];
    const set = (role: string, show: boolean) => root.querySelectorAll<SVGElement>(`[data-ticket="${i}"] [data-role="${role}"]`).forEach((n) => { n.style.display = show ? '' : 'none'; });
    set('face', solved && truthful);
    set('back', !(solved && truthful));
    root.querySelectorAll<SVGElement>(`[data-seat="${i}"] [data-role="halo"]`).forEach((n) => { n.style.display = solved && truthful ? '' : 'none'; });
    root.querySelectorAll<SVGElement>(`[data-seat="${i}"] [data-role="body"]`).forEach((n) => { n.setAttribute('opacity', solved && !truthful ? '0.5' : '1'); });
  }
}

export const honestPassengers: PuzzleDef = {
  id: 'honest-passengers',
  name: 'Ai nói thật',
  answer: [...READING],
  help: [
    'Mỗi hành khách nói một câu, vẽ trong bong bóng trên đầu. Người nói thật luôn nói đúng; người nói dối luôn nói sai.',
    'Mặt một con vật cùng mặt trời nghĩa là "con này nói thật", cùng mặt trăng là "con này nói dối". Hai mặt có dấu = là "hai con cùng loại" (cùng nói thật hoặc cùng nói dối), có dấu ≠ là "khác loại".',
    'Chạm một hành khách để đặt thẻ mặt trời (nói thật), chạm nữa thì thành mặt trăng (nói dối), nữa thì bỏ thẻ. Khi cả sáu thẻ khớp mọi lời nói, những người nói thật lật vé: đọc chòm trên vé từ trái sang phải.',
  ],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    let marks = emptyMarks();
    let locked = false;

    // Back: the carriage wall with its window onto the night.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#2a1c24' }, back);
    el('rect', { x: 0, y: 0, width: SCENE_W, height: 700, fill: '#3a2830' }, back);
    for (let x = 40; x < SCENE_W; x += 80) el('line', { x1: x, y1: 0, x2: x, y2: 700, stroke: '#33232b', 'stroke-width': 6 }, back);
    el('rect', { x: 0, y: 690, width: SCENE_W, height: 220, fill: '#4a3226' }, back);
    el('rect', { x: 0, y: 686, width: SCENE_W, height: 10, fill: '#6a4a34' }, back);
    const rnd = seeded(31);
    for (let i = 0; i < 22; i += 1) el('circle', { cx: 60 + rnd() * 1480, cy: 30 + rnd() * 70, r: 1.5 + rnd() * 1.5, fill: '#fff6d8', opacity: 0.5 }, back);
    scene.grain('back', 0.3);

    const seatGroups: SVGGElement[] = [];
    const cardGroups: SVGGElement[] = [];
    for (let i = 0; i < SEATS; i += 1) {
      const x = SEAT_X(i);

      // Mid: the bubble over the head.
      const bubble = el('g', { transform: `translate(${x} ${BUBBLE_Y})`, 'pointer-events': 'none' }, mid);
      el('path', { d: 'M-112 -84 H112 Q124 -84 124 -72 V72 Q124 84 112 84 H22 L0 120 L-22 84 H-112 Q-124 84 -124 72 V-72 Q-124 -84 -112 -84 Z', fill: '#fbf4e2', stroke: '#6a4a34', 'stroke-width': 5, 'stroke-linejoin': 'round' }, bubble);
      drawStatement(bubble, STATEMENTS[i]);

      // The animal, its coat, its card on the coat.
      const seat = el('g', { class: 'interactive', 'data-seat': i, 'data-hint': `seat-${i}`, transform: `translate(${x} 0)` }, mid);
      el('rect', { x: -125, y: 350, width: 250, height: 360, fill: 'transparent' }, seat);
      const body = el('g', { 'data-role': 'body', 'pointer-events': 'none' }, seat);
      el('path', { d: `M-78 700 Q-84 560 -52 520 Q0 500 52 520 Q84 560 78 700 Z`, fill: ['#6a4a8a', '#8a5a3a', '#3a6a7a', '#7a3a4a', '#4a6a3a', '#5a5a7a'][i], stroke: '#2a1c24', 'stroke-width': 5 }, body);
      el('rect', { x: -24, y: 508, width: 48, height: 14, rx: 5, fill: '#efe8d0', stroke: '#2a1c24', 'stroke-width': 3 }, body);
      const face = drawAnimal(body, KINDS[i]);
      face.setAttribute('transform', `translate(0 ${HEAD_Y}) scale(1.55)`);
      el('circle', { r: 112, cy: HEAD_Y, fill: 'none', stroke: '#ffd45a', 'stroke-width': 7, 'data-role': 'halo', style: 'display:none', 'pointer-events': 'none' }, seat);

      const card = el('g', { 'data-card': i, transform: 'translate(0 616)', 'pointer-events': 'none' }, seat);
      el('circle', { r: 40, fill: '#241f33', stroke: '#f6efd8', 'stroke-width': 4 }, card);
      el('circle', { 'data-role': 'empty', r: 26, fill: 'none', stroke: '#f6efd8', 'stroke-width': 3, 'stroke-dasharray': '6 6', opacity: 0.6 }, card);
      drawSun(el('g', { 'data-role': 'sun', style: 'display:none', transform: 'scale(1.25)' }, card));
      drawMoon(el('g', { 'data-role': 'moon', style: 'display:none', transform: 'scale(1.1)' }, card));
      seatGroups.push(seat);
      cardGroups.push(card);

      // Front: the ticket in front of the animal, face down until the cards agree.
      const ticket = el('g', { 'data-ticket': i, transform: `translate(${x} ${TICKET_Y})`, 'pointer-events': 'none' }, front);
      const back2 = el('g', { 'data-role': 'back' }, ticket);
      el('rect', { x: -64, y: -42, width: 128, height: 84, rx: 10, fill: '#c89a4a', stroke: '#6a4a14', 'stroke-width': 4 }, back2);
      for (let s = -3; s <= 3; s += 1) el('line', { x1: -52, y1: s * 11, x2: 52, y2: s * 11, stroke: '#a87a2a', 'stroke-width': 3 }, back2);
      el('circle', { r: 11, fill: '#6a4a14' }, back2);
      const faceUp = el('g', { 'data-role': 'face', style: 'display:none' }, ticket);
      el('rect', { x: -64, y: -42, width: 128, height: 84, rx: 10, fill: '#13182e', stroke: '#ffd45a', 'stroke-width': 5 }, faceUp);
      for (const [sx, sy] of placeStars(TICKETS[i], 0, 0, 58)) el('circle', { cx: sx.toFixed(1), cy: sy.toFixed(1), r: 4.6, fill: '#fff8dc' }, faceUp);
    }

    const label = (i: number) => `${NAMES[i]}, ghế ${i + 1}: ${marks[i] === 'sun' ? 'thẻ mặt trời (nói thật)' : marks[i] === 'moon' ? 'thẻ mặt trăng (nói dối)' : 'chưa có thẻ'}; chạm để đổi thẻ`;
    const refresh = () => {
      paintMarks(scene.root, marks);
      seatGroups.forEach((g, i) => g.setAttribute('aria-label', label(i)));
    };
    const lock = () => {
      locked = true;
      seatGroups.forEach((g) => {
        g.style.pointerEvents = 'none';
        g.classList.remove('interactive');
        g.removeAttribute('tabindex');
        g.setAttribute('aria-disabled', 'true');
      });
    };
    const cycle = (i: number) => {
      if (locked) return;
      marks = marks.map((m, k) => (k === i ? nextMark(m) : m));
      sound.paper();
      refresh();
      if (isSolved(marks)) {
        paintFinish(scene.root, true);
        sound.melody(READING);
        lock();
      }
    };
    seatGroups.forEach((g, i) => asButton(g, label(i), () => cycle(i)));
    refresh();
    paintFinish(scene.root, false);

    return {
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const finish = () => {
          marks = solutionMarks();
          refresh();
          paintFinish(scene.root, true);
          lock();
        };
        const at = (i: number) => ({ x: SEAT_X(i), y: BUBBLE_Y, r: 120 });
        return [
          {
            note: 'Thử giả sử Thỏ nói dối: thì Ếch nói thật; Chuột nói "Thỏ nói thật" là sai nên Chuột nói dối; nhưng Ếch bảo Thỏ và Chuột khác loại, mà cả hai cùng nói dối, là sai: mâu thuẫn. Vậy Thỏ nói thật.',
            targets: [0, 3, 5].map((i) => ({ ...at(i), verb: 'look' as const })),
            apply: () => { marks = emptyMarks(); marks[0] = 'sun'; refresh(); },
          },
          {
            note: 'Thỏ nói thật nên Ếch nói dối, Chuột nói thật. Nhím nói đúng (Ếch ≠ Chuột) nên nói thật, Sóc nói sai nên nói dối, Rùa nói đúng nên nói thật. Đặt đủ sáu thẻ: bốn người nói thật lật vé.',
            targets: [1, 2, 3, 4, 5].map((i) => ({ x: SEAT_X(i), y: 616, r: 50, verb: 'tap' as const })),
            apply: finish,
          },
        ];
      },
      destroy: () => {},
    };
  },
};

