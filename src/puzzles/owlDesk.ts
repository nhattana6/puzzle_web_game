import { glyph, placeStars, type GlyphId } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, uid } from '../core/svg';
import { url } from '../core/defs';
import { clamp } from '../core/tween';
import { seeded } from './sky';
import { DICE } from './gearBox';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 2, level 10 — the owl's desk ("bàn của cú"), the chapter's finale. A page of the
 * owl's star book has been torn into four tall strips; on it, each constellation of plain dots
 * is printed with a number of ink dots beside it, and every entry straddles a tear. The four
 * strips lie about the desk, some turned round or face down. Fit them back in order on the
 * blotter, matching the torn edges and the way the writing runs, and the entries come
 * together. On the wall four framed pictures show an owlet hugging acorns; count the acorns,
 * take the pictures from the smallest frame to the biggest, and look each count up in the
 * book to find its constellation. Nothing is lit or marked.
 */

export const PAGE = { w: 560, h: 720 };
export const STRIPS = 4;
export const STRIP_W = PAGE.w / STRIPS;
/** Strips are drawn in a box this much wider than their slot, to hold the torn edge. */
const MARGIN = 14;
const BOX_W = STRIP_W + MARGIN * 2;
export const BLOTTER = { x: 580, y: 90 };
const INK = '#1d2142';

/** The x of tear k (between strip k and k+1) without its jag. */
export const seamX = (k: number): number => STRIP_W * (k + 1);

const JAG_STEP = 36;
const JAG_AMP = 11;
/** The torn edge of seam k: offsets in x every JAG_STEP down the page. */
export const JAG: readonly (readonly number[])[] = Array.from({ length: STRIPS - 1 }, (_, k) => {
  const rand = seeded(4000 + k * 71);
  return Array.from({ length: Math.ceil(PAGE.h / JAG_STEP) + 1 }, () => (rand() * 2 - 1) * JAG_AMP);
});
/** Where tear k runs at height y. */
export function seamAt(k: number, y: number): number {
  const f = clamp(y, 0, PAGE.h) / JAG_STEP;
  const i = Math.min(JAG[k].length - 2, Math.floor(f));
  const o = JAG[k][i] + (JAG[k][i + 1] - JAG[k][i]) * (f - i);
  return seamX(k) + o;
}
/** Which strip a point of the page ends up on. */
export function stripOf(x: number, y: number): number {
  let s = 0;
  for (let k = 0; k < STRIPS - 1; k += 1) if (x >= seamAt(k, y)) s = k + 1;
  return s;
}

export interface Entry {
  seam: number;
  y: number;
  number: number;
  glyph: GlyphId;
}
/** The book's entries, each centred on a tear: a constellation with a number of ink dots under it. */
export const ENTRIES: readonly Entry[] = [
  { seam: 0, y: 130, number: 6, glyph: 'square' },
  { seam: 0, y: 360, number: 9, glyph: 'diamond' },
  { seam: 0, y: 590, number: 1, glyph: 'dipper' },
  { seam: 1, y: 130, number: 3, glyph: 'crown' },
  { seam: 1, y: 360, number: 7, glyph: 'hook' },
  { seam: 1, y: 590, number: 8, glyph: 'triangle' },
  { seam: 2, y: 130, number: 2, glyph: 'cross' },
  { seam: 2, y: 360, number: 4, glyph: 'belt' },
];
export const GLYPH_SIZE = 84;
export const DICE_GAP = 16;

export const entryStars = (e: Entry): [number, number][] => placeStars(e.glyph, seamX(e.seam), e.y, GLYPH_SIZE);
export const entryDice = (e: Entry): [number, number][] =>
  DICE[e.number].map((c) => [seamX(e.seam) + ((c % 3) - 1) * DICE_GAP, e.y + 74 + (Math.floor(c / 3) - 1) * DICE_GAP]);

/** The framed pictures, top to bottom on the wall: size of the frame and acorns inside. */
export const FRAMES: readonly { size: number; acorns: number }[] = [
  { size: 160, acorns: 2 },
  { size: 220, acorns: 4 },
  { size: 130, acorns: 7 },
  { size: 190, acorns: 9 },
];
/** Half the width of an acorn, and its half-height, as drawn. */
export const ACORN = { rx: 10, ry: 13 };
/**
 * Where the acorns of frame i sit, as offsets from the frame's centre: an even ring around the owlet,
 * so there are always exactly as many as the frame says (a random scatter once left fewer in the
 * small frame).
 */
export function acornSpots(i: number): [number, number][] {
  const { size, acorns } = FRAMES[i];
  const r = size * 0.29;
  const turn = -Math.PI / 2 + (i % 2 ? Math.PI / acorns : 0);
  return Array.from({ length: acorns }, (_, k) => [Math.cos(turn + (k * 2 * Math.PI) / acorns) * r, Math.sin(turn + (k * 2 * Math.PI) / acorns) * r]);
}

/** Picture order from the smallest frame to the biggest. */
export const FRAME_ORDER: readonly number[] = FRAMES.map((_, i) => i).sort((a, b) => FRAMES[a].size - FRAMES[b].size);
export const COUNTS: readonly number[] = FRAME_ORDER.map((i) => FRAMES[i].acorns);
export const entryFor = (n: number): Entry => ENTRIES.find((e) => e.number === n) as Entry;

/** What the player can set on a strip: where it lies, which way up, which face. */
export interface StripState {
  slot: number | null;
  /** 0 or 180 degrees. */
  turn: 0 | 180;
  faceUp: boolean;
}
/** The strip is right when it is in its own slot, the right way up and face up. */
export const isFitted = (i: number, s: StripState): boolean => s.slot === i && s.turn === 0 && s.faceUp;
export const isAssembled = (states: readonly StripState[]): boolean => states.every((s, i) => isFitted(i, s));
/** Tapping a strip turns a face-down one over (keeping the way it lies), and turns a face-up one round. */
export function tapped(s: StripState): StripState {
  if (!s.faceUp) return { ...s, faceUp: true };
  return { ...s, turn: s.turn === 0 ? 180 : 0 };
}

const LOOSE_HOME = [
  [30, 90], [210, 90], [390, 90], [1160, 90],
] as const;
/** Which loose spot each strip starts in, and how it lies. */
const START: readonly { home: number; turn: 0 | 180; faceUp: boolean }[] = [
  { home: 1, turn: 0, faceUp: false },
  { home: 3, turn: 180, faceUp: true },
  { home: 0, turn: 180, faceUp: true },
  { home: 2, turn: 0, faceUp: true },
];
export const startStates = (): StripState[] => START.map((s) => ({ slot: null, turn: s.turn, faceUp: s.faceUp }));

function stripPolygon(i: number): string {
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  for (let y = 0; y <= PAGE.h; y += JAG_STEP) {
    left.push([i === 0 ? 0 : seamAt(i - 1, y), y]);
    right.push([i === STRIPS - 1 ? PAGE.w : seamAt(i, y), y]);
  }
  return [...left, ...right.reverse()].map(([x, y]) => `${x.toFixed(1)},${y}`).join(' ');
}

export const owlDesk: PuzzleDef = {
  id: 'owl-desk',
  name: 'Bàn của cú',
  answer: COUNTS.map((n) => entryFor(n).glyph),
  mount({ scene, sound }) {
    const { back, mid } = scene.layers;
    const states = startStates();
    const free: [number, number][] = START.map((s) => [LOOSE_HOME[s.home][0], LOOSE_HOME[s.home][1]]);
    const nodes: SVGGElement[] = [];
    const faces: SVGGElement[] = [];
    const backs: SVGGElement[] = [];

    // Back: the wall and the desk.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#241a17' }, back);
    for (let x = 80; x < SCENE_W; x += 160) el('line', { x1: x, y1: -20, x2: x, y2: SCENE_H + 20, stroke: '#1a1210', 'stroke-width': 4 }, back);
    scene.grain('back', 0.4);
    el('rect', { x: 20, y: 70, width: 1320, height: 760, rx: 18, fill: '#3a2a22' }, back);

    // Mid: the blotter, the four framed pictures, and the strips.
    el('rect', { x: BLOTTER.x - 14, y: BLOTTER.y - 14, width: PAGE.w + 28, height: PAGE.h + 28, rx: 10, fill: '#2a4a3a', stroke: '#1c3a2a', 'stroke-width': 4 }, mid);

    const frameX = 1345;
    let fy = 40;
    FRAMES.forEach((f, i) => {
      const x = frameX + (220 - f.size) / 2;
      el('rect', { x, y: fy, width: f.size, height: f.size, rx: 8, fill: '#6a4a2a', stroke: '#3a2818', 'stroke-width': 6 }, mid);
      el('rect', { x: x + 12, y: fy + 12, width: f.size - 24, height: f.size - 24, fill: '#d9c9a2' }, mid);
      // An owlet hugging its acorns.
      const cx = x + f.size / 2;
      const cy = fy + f.size * 0.56;
      el('ellipse', { cx, cy: cy + 8, rx: f.size * 0.2, ry: f.size * 0.24, fill: '#7a6a52' }, mid);
      el('circle', { cx, cy: cy - f.size * 0.12, r: f.size * 0.17, fill: '#9a8666' }, mid);
      for (const sx of [-1, 1]) {
        el('circle', { cx: cx + sx * f.size * 0.07, cy: cy - f.size * 0.14, r: f.size * 0.06, fill: '#f6efd8' }, mid);
        el('circle', { cx: cx + sx * f.size * 0.07, cy: cy - f.size * 0.14, r: f.size * 0.03, fill: '#1a1424' }, mid);
      }
      // Acorns in a ring around it, all the same size.
      for (const [dx, dy] of acornSpots(i)) {
        const ax = x + f.size / 2 + dx;
        const ay = fy + f.size / 2 + dy;
        el('ellipse', { cx: ax, cy: ay + 2, rx: ACORN.rx - 1, ry: ACORN.ry - 2, fill: '#a0703c', stroke: '#6b4a2a', 'stroke-width': 2 }, mid);
        el('path', { d: `M${ax - 10} ${ay - 2} Q${ax} ${ay - 18} ${ax + 10} ${ay - 2} Z`, fill: '#6b4a2a' }, mid);
      }
      fy += f.size + 20;
    });

    /** Draws the whole page's content into `parent`, in page coordinates. */
    const drawPage = (parent: Element) => {
      el('rect', { x: -MARGIN, y: 0, width: PAGE.w + MARGIN * 2, height: PAGE.h, fill: '#efe3c4' }, parent);
      // Ruled lines and a few ink smudges running across the tears, as on a real page.
      for (let y = 40; y < PAGE.h; y += 40) el('line', { x1: 0, y1: y, x2: PAGE.w, y2: y, stroke: '#cdbf98', 'stroke-width': 1.5 }, parent);
      const rand = seeded(31);
      for (let i = 0; i < 9; i += 1) {
        el('path', { d: `M${rand() * PAGE.w} ${rand() * PAGE.h} q${rand() * 60 - 30} ${rand() * 40 - 20} ${rand() * 90 - 45} ${rand() * 20}`, fill: 'none', stroke: '#b3a47c', 'stroke-width': 3, 'stroke-linecap': 'round' }, parent);
      }
      for (const e of ENTRIES) {
        for (const [x, y] of entryStars(e)) el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 5.5, fill: INK }, parent);
        for (const [x, y] of entryDice(e)) el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 4.2, fill: INK }, parent);
      }
    };

    for (let i = 0; i < STRIPS; i += 1) {
      const clipId = uid('strip-clip');
      el('polygon', { points: stripPolygon(i) }, el('clipPath', { id: clipId }, scene.defs));
      const g = el('g', { class: 'strip interactive', tabindex: 0, role: 'button', 'aria-label': `Dải giấy ${i + 1}: kéo vào tấm lót, bấm để lật`, 'data-hint': `strip-${i}` }, mid);
      const left = i * STRIP_W - MARGIN;
      const content = el('g', { transform: `translate(${-left} 0)` }, g);
      const face = el('g', { 'clip-path': url(clipId) }, content);
      drawPage(face);
      el('polygon', { points: stripPolygon(i), fill: 'none', stroke: '#8a7a52', 'stroke-width': 2.5 }, face);
      const bk = el('g', {}, content);
      bk.style.display = 'none';
      const clipBack = uid('strip-clip');
      el('polygon', { points: stripPolygon(i) }, el('clipPath', { id: clipBack }, scene.defs));
      const bkInner = el('g', { 'clip-path': url(clipBack) }, bk);
      el('rect', { x: -MARGIN, y: 0, width: PAGE.w + MARGIN * 2, height: PAGE.h, fill: '#d4c7a2' }, bkInner);
      el('polygon', { points: stripPolygon(i), fill: 'none', stroke: '#8a7a52', 'stroke-width': 2.5 }, bk);
      nodes.push(g);
      faces.push(face);
      backs.push(bk);
    }

    const slotSpot = (slot: number): [number, number] => [BLOTTER.x + slot * STRIP_W - MARGIN, BLOTTER.y];
    const render = () => {
      nodes.forEach((g, i) => {
        const s = states[i];
        const [x, y] = s.slot !== null ? slotSpot(s.slot) : free[i];
        g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${s.turn} ${BOX_W / 2} ${PAGE.h / 2})`);
        faces[i].style.display = s.faceUp ? '' : 'none';
        backs[i].style.display = s.faceUp ? 'none' : '';
      });
    };
    render();

    /** The slot whose area the strip's centre is over, or null. */
    const slotUnder = (x: number, y: number): number | null => {
      const cx = x + BOX_W / 2 - BLOTTER.x;
      const cy = y + PAGE.h / 2 - BLOTTER.y;
      if (cx < 0 || cx >= PAGE.w || cy < 0 || cy > PAGE.h) return null;
      return clamp(Math.floor(cx / STRIP_W), 0, STRIPS - 1);
    };

    nodes.forEach((g, i) => {
      let grab = [0, 0];
      let moved = 0;
      let startAt = [0, 0];
      let prevSlot: number | null = null;
      scene.draggable(g, {
        start: (p) => {
          const at = states[i].slot !== null ? slotSpot(states[i].slot as number) : free[i];
          free[i] = [at[0], at[1]];
          prevSlot = states[i].slot;
          states[i] = { ...states[i], slot: null };
          grab = [p.x - at[0], p.y - at[1]];
          startAt = [p.x, p.y];
          moved = 0;
          g.parentNode?.appendChild(g);
          render();
        },
        move: (p) => {
          moved = Math.max(moved, Math.hypot(p.x - startAt[0], p.y - startAt[1]));
          free[i] = [clamp(p.x - grab[0], -40, SCENE_W - BOX_W + 40), clamp(p.y - grab[1], -80, SCENE_H - PAGE.h + 80)];
          render();
        },
        end: () => {
          if (moved < 6) {
            // A tap, not a drag: turn the strip over, and it stays where it was.
            states[i] = { ...tapped(states[i]), slot: prevSlot };
            sound.paper();
            render();
            return;
          }
          const slot = slotUnder(free[i][0], free[i][1]);
          if (slot !== null) {
            // The strip already in that slot goes back to its own loose spot.
            states.forEach((o, k) => {
              if (k !== i && o.slot === slot) {
                states[k] = { ...o, slot: null };
                free[k] = [LOOSE_HOME[START[k].home][0], LOOSE_HOME[START[k].home][1]];
              }
            });
            states[i] = { ...states[i], slot };
            sound.knock();
          } else {
            sound.paper();
          }
          render();
        },
      });
      g.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          states[i] = tapped(states[i]);
          render();
          return;
        }
        // Arrow keys step the strip through the four slots and back to its place on the desk.
        const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
        if (!step) return;
        event.preventDefault();
        const cur = states[i].slot;
        const next = cur === null ? (step > 0 ? 0 : STRIPS - 1) : cur + step;
        if (next < 0 || next >= STRIPS) {
          states[i] = { ...states[i], slot: null };
          free[i] = [LOOSE_HOME[START[i].home][0], LOOSE_HOME[START[i].home][1]];
        } else {
          states.forEach((o, k) => {
            if (k !== i && o.slot === next) {
              states[k] = { ...o, slot: null };
              free[k] = [LOOSE_HOME[START[k].home][0], LOOSE_HOME[START[k].home][1]];
            }
          });
          states[i] = { ...states[i], slot: next };
        }
        render();
      });
    });

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const first = START.findIndex((s) => s.faceUp && s.turn === 0) >= 0 ? START.findIndex((s) => s.faceUp && s.turn === 0) : 0;
        const home = LOOSE_HOME[START[first].home];
        const from = { x: home[0] + BOX_W / 2, y: home[1] + PAGE.h / 2 };
        const to = { x: BLOTTER.x + first * STRIP_W + STRIP_W / 2, y: BLOTTER.y + PAGE.h / 2 };
        return [
          {
            note: 'Xếp bốn dải giấy lên tấm lót xanh cho mép rách khớp nhau và nét chấm liền qua chỗ rách (bấm vào dải để lật hoặc xoay cho đúng chiều và mặt). Các chòm sao cùng số chấm mực in cạnh chúng sẽ liền lại.',
            targets: [{ ...from, r: 60, verb: 'drag', to, object: `[data-hint="strip-${first}"]` }],
            apply: () => {
              states.forEach((_, i) => { states[i] = { slot: i, turn: 0, faceUp: true }; });
              render();
            },
          },
          {
            note: `Đếm hạt dẻ trong bốn khung tranh, đọc từ khung nhỏ nhất đến lớn nhất: ${COUNTS.join(', ')}. Tìm trong sổ mục có đúng số chấm mực đó: chòm sao ngay trên các chấm là đáp án, theo thứ tự đó.`,
            targets: [
              ...COUNTS.map((n) => {
                const e = entryFor(n);
                return { x: BLOTTER.x + seamX(e.seam), y: BLOTTER.y + e.y + 30, r: 70, verb: 'look' as const };
              }),
            ],
            prepare: (picture) => {
              const overlay = picture.querySelector('.layer-overlay') ?? picture;
              for (const n of COUNTS) {
                const e = entryFor(n);
                const stars = entryStars(e);
                for (const [a, b] of glyph(e.glyph).lines) {
                  el('line', {
                    x1: BLOTTER.x + stars[a][0], y1: BLOTTER.y + stars[a][1], x2: BLOTTER.x + stars[b][0], y2: BLOTTER.y + stars[b][1],
                    class: 'hint-line', 'pointer-events': 'none',
                  }, overlay);
                }
              }
            },
          },
        ];
      },
      destroy: () => undefined,
    };
  },
};
