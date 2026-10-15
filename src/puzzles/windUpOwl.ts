import { drawOwl } from '../core/owl';
import type { GlyphId } from '../core/glyphs';
import { placeStars } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el, resetIcon, toolButton } from '../core/svg';
import { starfield } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 4, level 9 — the wind-up owl ("cú lên dây"). A toy owl stands on a 6×6 floor of tiles. The
 * player lays eight command cards (step ahead ×4, turn left ×2, turn right ×2) in
 * eight slots; pressing run winds the toy up and it performs the row of cards TWICE in a row (the second
 * round carries on with the heading the first left it with). The owl falls if a step takes it off the
 * floor or onto a cracked tile. It is done when
 * the owl has stood on all four constellation tiles and stops on the perch tile. Exactly one order of the
 * eight cards does that; the answer is the four constellations in the order the owl walked over them.
 */

export type Card = 'F' | 'L' | 'R';
export const ROWS = 6;
export const COLS = 6;
export const ROUNDS = 2;
/** Headings: 0 up, 1 right, 2 down, 3 left. */
const DR = [-1, 0, 1, 0];
const DC = [0, 1, 0, -1];

export interface Pose {
  r: number;
  c: number;
  d: number;
}
export const START: Pose = { r: 4, c: 4, d: 2 };
export const PERCH: readonly [number, number] = [0, 0];
/** Cracked tiles: stepping on one drops the owl. */
export const HOLES: readonly (readonly [number, number])[] = [[2, 1], [0, 3], [0, 4]];
/** The constellation tiles and the glyph each shows. Listed in the order the winning program walks them. */
export const STAR_TILES: readonly (readonly [number, number])[] = [[3, 4], [2, 3], [0, 2], [0, 1]];
export const STAR_GLYPHS: readonly GlyphId[] = ['dipper', 'triangle', 'hook', 'crown'];

/** The cards in the tray (all of them must be used, one per slot). Displayed in this order. */
export const TRAY: readonly Card[] = ['F', 'R', 'L', 'F', 'L', 'R', 'F', 'F'];
export const SLOTS = TRAY.length;
/** The one arrangement that works. */
export const SOLUTION: readonly Card[] = ['R', 'R', 'F', 'F', 'L', 'F', 'F', 'L'];
export const READING_ORDER: readonly GlyphId[] = STAR_GLYPHS;

/** For each slot of the solution, the tray card (by index) that goes there. */
export const SOLUTION_CARDS: readonly number[] = (() => {
  const used = new Set<number>();
  return SOLUTION.map((card) => {
    const t = TRAY.findIndex((x, i) => x === card && !used.has(i));
    used.add(t);
    return t;
  });
})();

const isHole = (r: number, c: number): boolean => HOLES.some(([hr, hc]) => hr === r && hc === c);
const starAt = (r: number, c: number): number => STAR_TILES.findIndex(([sr, sc]) => sr === r && sc === c);

export interface Frame {
  card: Card;
  /** Where the owl is after this card (for a fall: the tile it stepped to, which may be off the floor). */
  pose: Pose;
  /** Index into STAR_TILES of the constellation tile it landed on with this card, or -1. */
  star: number;
  /** Set on the last frame of a run that fell. */
  fell?: 'hole' | 'edge';
}
export interface RunResult {
  frames: Frame[];
  fell: 'hole' | 'edge' | null;
  /** Constellation tiles (indices into STAR_TILES) in the order the owl first landed on them. */
  visited: number[];
  atPerch: boolean;
  solved: boolean;
}

/** Performs the cards ROUNDS times in a row, from the start tile. */
export function runProgram(program: readonly Card[]): RunResult {
  let { r, c, d } = START;
  const frames: Frame[] = [];
  const visited: number[] = [];
  for (let round = 0; round < ROUNDS; round += 1) {
    for (const card of program) {
      if (card === 'L') d = (d + 3) % 4;
      else if (card === 'R') d = (d + 1) % 4;
      else {
        r += DR[d];
        c += DC[d];
        if (r < 0 || c < 0 || r >= ROWS || c >= COLS) {
          frames.push({ card, pose: { r, c, d }, star: -1, fell: 'edge' });
          return { frames, fell: 'edge', visited, atPerch: false, solved: false };
        }
        if (isHole(r, c)) {
          frames.push({ card, pose: { r, c, d }, star: -1, fell: 'hole' });
          return { frames, fell: 'hole', visited, atPerch: false, solved: false };
        }
      }
      const star = card === 'F' ? starAt(r, c) : -1;
      if (star >= 0 && !visited.includes(star)) visited.push(star);
      frames.push({ card, pose: { r, c, d }, star });
    }
  }
  const atPerch = r === PERCH[0] && c === PERCH[1];
  return { frames, fell: null, visited, atPerch, solved: atPerch && visited.length === STAR_TILES.length };
}

/** The glyphs of the constellation tiles in the order a run walked them. */
export const visitOrder = (run: RunResult): GlyphId[] => run.visited.map((i) => STAR_GLYPHS[i]);

// ── Layout (scene units) ────────────────────────────────────────────────────────────────────
export const FLOOR = { x: 70, y: 150, cell: 100 };
export const tileCentre = (r: number, c: number): { x: number; y: number } => ({
  x: FLOOR.x + (c + 0.5) * FLOOR.cell,
  y: FLOOR.y + (r + 0.5) * FLOOR.cell,
});
/** Slots and tray cards sit in two rows (4 + 3): a slot's centre, and a tray card's resting place. */
const COL_X = 800;
const PITCH = 150;
const CARD = 130;
const slotPos = (i: number): { x: number; y: number } => ({ x: COL_X + (i % 4) * PITCH, y: i < 4 ? 235 : 390 });
const trayPos = (t: number): { x: number; y: number } => ({ x: COL_X + (t % 4) * PITCH, y: t < 4 ? 595 : 750 });
const RUN_BUTTON = { x: 1470, y: 270 };
const CLEAR_BUTTON = { x: 1470, y: 450 };

function drawCardArt(g: Element, card: Card): void {
  const art = el('g', { transform: 'scale(1.25)', fill: 'none', stroke: '#2a2012', 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'pointer-events': 'none' }, g);
  if (card === 'F') {
    el('path', { d: 'M0 30 V-28 M-20 -8 L0 -28 L20 -8' }, art);
  } else if (card === 'L') {
    el('path', { d: 'M22 30 V6 a14 14 0 0 0 -14 -14 H-18 M-2 -26 L-20 -8 L-2 10' }, art);
  } else {
    el('path', { d: 'M-22 30 V6 a14 14 0 0 1 14 -14 H18 M2 -26 L20 -8 L2 10' }, art);
  }
}

export const windUpOwl: PuzzleDef = {
  id: 'wind-up-owl',
  name: 'Cú lên dây',
  answer: [...READING_ORDER],
  help: [
    'Xếp đủ 8 thẻ vào 8 ô rồi bấm nút chạy: cú đồ chơi làm cả dãy thẻ hai vòng liền nhau, vòng sau tiếp nối vòng trước (giữ hướng đang nhìn).',
    'Thẻ mũi tên thẳng: bước một ô theo hướng cú đang nhìn. Thẻ gập: quay trái hoặc quay phải tại chỗ.',
    'Cú rơi nếu bước ra ngoài sàn hay xuống ô nứt. Xong khi cú đã dẫm lên cả bốn ô chòm sao và dừng ở cành đậu.',
  ],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    /** slotOf[t]: slot index card t sits in, or -1 when it is in the tray. */
    const slotOf: number[] = TRAY.map(() => -1);
    let running = false;
    let solved = false;
    let timer = 0;
    let frameHandle = 0;
    let lit: Set<number> = new Set();
    let pose: Pose = START;

    const cardNodes: SVGGElement[] = [];
    const tiles: SVGRectElement[] = [];
    const starDots: SVGGElement[] = [];
    const tags: SVGGElement[] = [];

    // Back: the workshop wall.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#14172b' }, back);
    starfield(back, { x: 0, y: 0, w: SCENE_W, h: 130 }, 24, 5909);
    scene.grain('back', 0.45);

    // Mid: the floor, its cracks, constellation tiles and the perch; the slot row.
    el('rect', { x: FLOOR.x - 24, y: FLOOR.y - 24, width: COLS * FLOOR.cell + 48, height: ROWS * FLOOR.cell + 48, rx: 20, fill: '#1c1830', stroke: '#6b4f24', 'stroke-width': 6, 'pointer-events': 'none' }, mid);
    for (let r = 0; r < ROWS; r += 1) {
      for (let c = 0; c < COLS; c += 1) {
        const p = tileCentre(r, c);
        tiles.push(el('rect', { x: p.x - FLOOR.cell / 2 + 2, y: p.y - FLOOR.cell / 2 + 2, width: FLOOR.cell - 4, height: FLOOR.cell - 4, rx: 8, fill: (r + c) % 2 ? '#3a2f3f' : '#352a3a', 'pointer-events': 'none' }, mid));
      }
    }
    HOLES.forEach(([r, c]) => {
      const p = tileCentre(r, c);
      const g = el('g', { transform: `translate(${p.x} ${p.y})`, 'pointer-events': 'none' }, mid);
      el('rect', { x: -FLOOR.cell / 2 + 2, y: -FLOOR.cell / 2 + 2, width: FLOOR.cell - 4, height: FLOOR.cell - 4, rx: 8, fill: '#0a0812' }, g);
      el('path', { d: 'M-34 -30 L-6 -8 L-22 10 L8 34 M10 -34 L2 -10 L30 8 M-30 26 L-10 16', fill: 'none', stroke: '#4a3a52', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    });
    // The perch: a branch with two leaves.
    {
      const p = tileCentre(PERCH[0], PERCH[1]);
      const g = el('g', { transform: `translate(${p.x} ${p.y})`, 'pointer-events': 'none' }, mid);
      el('rect', { x: -FLOOR.cell / 2 + 2, y: -FLOOR.cell / 2 + 2, width: FLOOR.cell - 4, height: FLOOR.cell - 4, rx: 8, fill: '#2f3a2a', stroke: '#7bbf6a', 'stroke-width': 4 }, g);
      el('path', { d: 'M-36 14 Q0 2 36 10', fill: 'none', stroke: '#8a6038', 'stroke-width': 11, 'stroke-linecap': 'round' }, g);
      el('path', { d: 'M-12 8 q-4 -22 -22 -24 q0 20 22 24 M14 8 q4 -22 22 -24 q0 20 -22 24', fill: '#7bbf6a', stroke: '#3f7a3a', 'stroke-width': 2 }, g);
    }
    // Constellation tiles: the glyph as plain dots, and a tag (1–4 dots) shown at the end.
    STAR_TILES.forEach(([r, c], i) => {
      const p = tileCentre(r, c);
      const g = el('g', { 'pointer-events': 'none', 'data-star': i }, mid);
      el('rect', { x: p.x - FLOOR.cell / 2 + 2, y: p.y - FLOOR.cell / 2 + 2, width: FLOOR.cell - 4, height: FLOOR.cell - 4, rx: 8, fill: '#26305c', stroke: '#8a8fbf', 'stroke-width': 4 }, g);
      const dots = el('g', {}, g);
      for (const [x, y] of placeStars(STAR_GLYPHS[i], p.x, p.y, 64)) el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 5.5, fill: '#fff1c4' }, dots);
      starDots.push(dots);
    });
    // The start tile: a dashed ring, where the toy begins every run.
    {
      const p = tileCentre(START.r, START.c);
      el('circle', { cx: p.x, cy: p.y, r: 40, fill: 'none', stroke: '#f4c66a', 'stroke-width': 3, 'stroke-dasharray': '6 8', 'pointer-events': 'none' }, mid);
    }
    // Slots.
    for (let i = 0; i < SLOTS; i += 1) {
      const sp = slotPos(i);
      el('rect', { x: sp.x - CARD / 2, y: sp.y - CARD / 2, width: CARD, height: CARD, rx: 14, fill: '#1a1424', stroke: '#6b4f24', 'stroke-width': 4, 'stroke-dasharray': '10 8', 'pointer-events': 'none' }, mid);
    }
    // "Runs twice": a loop arrow and two dots above the slots.
    {
      const g = el('g', { transform: `translate(${COL_X - CARD / 2} 110)`, 'pointer-events': 'none' }, mid);
      const art = el('g', { stroke: '#f6efd8', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }, g);
      const icon = resetIcon(art);
      icon.setAttribute('transform', 'scale(1.2) translate(-12 -12)');
      el('circle', { cx: 56, cy: 0, r: 10, fill: '#f4c66a' }, g);
      el('circle', { cx: 92, cy: 0, r: 10, fill: '#f4c66a' }, g);
    }

    // Front: cards, the owl, the buttons.
    TRAY.forEach((card, t) => {
      const g = el('g', { class: 'interactive', 'data-hint': `card-${t}` }, front);
      el('rect', { x: -CARD / 2, y: -CARD / 2, width: CARD, height: CARD, rx: 14, fill: '#e8d9a8', stroke: '#6b4f24', 'stroke-width': 5 }, g);
      drawCardArt(g, card);
      asButton(g, `Thẻ lệnh ${t + 1}`, () => tapCard(t));
      cardNodes.push(g);
    });
    STAR_TILES.forEach(([r, c], i) => {
      const p = tileCentre(r, c);
      const tag = el('g', { transform: `translate(${p.x + 24} ${p.y - 34})`, 'pointer-events': 'none' }, front);
      const width = (i + 1) * 16 + 12;
      el('rect', { x: -width / 2, y: -13, width, height: 26, rx: 13, fill: '#f4c66a', stroke: '#fff1c4', 'stroke-width': 3 }, tag);
      for (let k = 0; k <= i; k += 1) el('circle', { cx: -width / 2 + 14 + k * 16, cy: 0, r: 5, fill: '#3a2a18' }, tag);
      tag.style.display = 'none';
      tags.push(tag);
    });
    const owl = el('g', { 'pointer-events': 'none', 'data-owl': '1' }, front);
    const heading = el('g', { 'pointer-events': 'none', 'data-owl-head': '1' }, owl);
    el('path', { d: 'M0 -48 L10 -34 L-10 -34 Z', fill: '#f4c66a', stroke: '#fff1c4', 'stroke-width': 2, 'stroke-linejoin': 'round' }, heading);
    drawOwl(owl, 0, 4, 0.5);

    const playIcon = (g: SVGGElement) => {
      el('path', { d: 'M-12 -22 L22 0 L-12 22 Z', fill: '#f6efd8' }, g);
    };
    const runButton = toolButton(front, RUN_BUTTON.x, RUN_BUTTON.y, 'Lên dây và chạy', playIcon, () => run());
    toolButton(front, CLEAR_BUTTON.x, CLEAR_BUTTON.y, 'Gỡ hết thẻ', resetIcon, () => clearAll());
    drawOwl(front, 1500, 840, 0.7);

    // ── State and drawing ────────────────────────────────────────────────────────────────
    const program = (): (Card | null)[] => {
      const out: (Card | null)[] = TRAY.map(() => null);
      slotOf.forEach((s, t) => { if (s >= 0) out[s] = TRAY[t]; });
      return out;
    };
    const full = () => slotOf.every((s) => s >= 0);

    const place = (): void => {
      cardNodes.forEach((node, t) => {
        const q = slotOf[t] >= 0 ? slotPos(slotOf[t]) : trayPos(t);
        node.setAttribute('transform', `translate(${q.x} ${q.y})`);
      });
      runButton.setAttribute('opacity', full() ? '1' : '0.45');
    };
    const drawOwlAt = (p: { x: number; y: number }, deg: number, scale = 1, opacity = 1): void => {
      owl.setAttribute('transform', `translate(${p.x} ${p.y}) scale(${scale})`);
      owl.setAttribute('opacity', String(opacity));
      heading.setAttribute('transform', `rotate(${deg})`);
    };
    const poseXY = (q: Pose): { x: number; y: number } => tileCentre(q.r, q.c);
    const paintLit = (): void => {
      starDots.forEach((dots, i) => {
        const on = lit.has(i) || solved;
        dots.querySelectorAll('circle').forEach((dot) => dot.setAttribute('fill', on ? '#f4c66a' : '#fff1c4'));
        const rect = dots.parentElement?.querySelector('rect');
        rect?.setAttribute('fill', on ? '#3a4a8a' : '#26305c');
        rect?.setAttribute('stroke', on ? '#f4c66a' : '#8a8fbf');
      });
      tags.forEach((tag) => { tag.style.display = solved ? '' : 'none'; });
    };
    /** The tag on each tile counts its place in the walk, so rank = position in the winning run's visit order. */
    const owlHome = (): void => {
      pose = START;
      lit = new Set();
      drawOwlAt(poseXY(START), START.d * 90);
      paintLit();
    };

    const stopRun = (): void => {
      running = false;
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frameHandle);
    };
    function clearAll(): void {
      if (solved) return;
      stopRun();
      slotOf.fill(-1);
      owlHome();
      place();
      sound.paper();
    }
    function tapCard(t: number): void {
      if (running || solved) return;
      if (slotOf[t] >= 0) {
        slotOf[t] = -1;
      } else {
        const used = new Set(slotOf.filter((s) => s >= 0));
        let free = 0;
        while (used.has(free)) free += 1;
        if (free >= SLOTS) return;
        slotOf[t] = free;
      }
      sound.tick();
      place();
    }

    /** Tweens the owl over one frame, then calls `done`. */
    const tween = (from: Pose, to: Pose, ms: number, done: () => void): void => {
      const a = poseXY(from);
      const b = poseXY(to);
      const t0 = performance.now();
      const turn = to.d - from.d;
      const delta = turn === 3 ? -1 : turn === -3 ? 1 : turn;
      const tick = (now: number) => {
        const k = Math.min(1, (now - t0) / ms);
        drawOwlAt({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }, (from.d + delta * k) * 90);
        if (k < 1) frameHandle = window.requestAnimationFrame(tick);
        else done();
      };
      frameHandle = window.requestAnimationFrame(tick);
    };

    function run(): void {
      if (running || solved) return;
      if (!full()) {
        sound.paper();
        return;
      }
      owlHome();
      const result = runProgram(program() as Card[]);
      running = true;
      const play = (i: number): void => {
        if (i >= result.frames.length) {
          running = false;
          if (result.solved) {
            solved = true;
            paintLit();
            sound.ding();
          } else {
            timer = window.setTimeout(owlHome, 900);
            sound.paper();
          }
          return;
        }
        const f = result.frames[i];
        const from = pose;
        tween(from, f.pose, f.card === 'L' || f.card === 'R' ? 260 : 380, () => {
          pose = f.pose;
          if (f.fell) {
            const shrink = (now0: number) => {
              const k = Math.min(1, (now0 - fellAt) / 420);
              drawOwlAt(poseXY(f.pose), f.pose.d * 90, 1 - 0.7 * k, 1 - k);
              if (k < 1) frameHandle = window.requestAnimationFrame(shrink);
              else play(result.frames.length);
            };
            const fellAt = performance.now();
            sound.knock();
            frameHandle = window.requestAnimationFrame(shrink);
            return;
          }
          if (f.star >= 0) {
            lit.add(f.star);
            paintLit();
            sound.knock();
          } else {
            sound.tick();
          }
          play(i + 1);
        });
      };
      play(0);
    }

    owlHome();
    place();

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const finalRun = runProgram(SOLUTION);
        return [
          {
            note: 'Xếp tám thẻ vào tám ô theo thứ tự sao cho, khi cả dãy chạy hai vòng liền nhau, cú dẫm lên cả bốn ô chòm sao rồi dừng ở cành đậu. Cú bắt đầu quay mặt xuống dưới.',
            targets: [
              {
                x: slotPos(0).x, y: slotPos(0).y, r: 70, verb: 'tap',
                act: (picture) => (p) => {
                  SOLUTION_CARDS.forEach((t, slot) => {
                    const node = picture.querySelector(`[data-hint="card-${t}"]`);
                    if (!node) return;
                    const placed = p > (slot + 0.5) / SOLUTION_CARDS.length;
                    const q = placed ? slotPos(slot) : trayPos(t);
                    node.setAttribute('transform', `translate(${q.x} ${q.y})`);
                  });
                },
              },
            ],
            apply: () => {
              SOLUTION_CARDS.forEach((t, slot) => { slotOf[t] = slot; });
              place();
            },
          },
          {
            note: 'Bấm nút chạy: cú đi hết dãy thẻ rồi lặp lại một vòng nữa; ô chòm sao nào cú dẫm lên thì sáng lên.',
            targets: [
              {
                x: RUN_BUTTON.x, y: RUN_BUTTON.y, r: 72, verb: 'tap',
                act: (picture) => (p) => {
                  const n = finalRun.frames.length;
                  const idx = Math.min(n - 1, Math.floor(p * n));
                  const q = idx < 0 ? START : finalRun.frames[idx].pose;
                  const xy = tileCentre(q.r, q.c);
                  const node = picture.querySelector('[data-owl]');
                  node?.setAttribute('transform', `translate(${xy.x} ${xy.y})`);
                  picture.querySelector('[data-owl-head]')?.setAttribute('transform', `rotate(${q.d * 90})`);
                  const seen = new Set<number>();
                  finalRun.frames.slice(0, idx + 1).forEach((f) => { if (f.star >= 0) seen.add(f.star); });
                  STAR_TILES.forEach((_, i) => {
                    const on = seen.has(i);
                    const g = picture.querySelector(`[data-star="${i}"]`);
                    g?.querySelector('rect')?.setAttribute('fill', on ? '#3a4a8a' : '#26305c');
                    g?.querySelectorAll('circle').forEach((dot) => dot.setAttribute('fill', on ? '#f4c66a' : '#fff1c4'));
                  });
                },
              },
            ],
            apply: () => {
              solved = true;
              lit = new Set(finalRun.visited);
              const end = finalRun.frames[finalRun.frames.length - 1].pose;
              pose = end;
              drawOwlAt(poseXY(end), end.d * 90);
              paintLit();
            },
          },
          {
            note: 'Đọc các chòm theo thứ tự cú đã dẫm lên, ứng với thẻ 1 đến 4 chấm.',
            targets: STAR_TILES.map(([r, c]) => ({ x: tileCentre(r, c).x, y: tileCentre(r, c).y, r: 52, verb: 'look' as const })),
          },
        ];
      },
      destroy: () => {
        stopRun();
      },
    };
  },
};
