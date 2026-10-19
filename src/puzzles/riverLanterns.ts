import { drawOwl } from '../core/owl';
import type { GlyphId } from '../core/glyphs';
import { glyph, placeStars } from '../core/glyphs';
import { url } from '../core/defs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el, uid } from '../core/svg';
import { clamp } from '../core/tween';
import { dist, seeded } from './sky';
import type { HintStep, PuzzleDef } from './types';
import { tr } from '../core/i18n';

/**
 * Chapter 3, level 5 — floating lanterns ("hoa đăng"). A river runs across the scene, from
 * a spring on the right to the sea on the left. Six piers each hold a floating lantern with
 * a constellation. Tap a lantern to let it go and watch where the current takes it: to the
 * temple steps, to the mill, or into the reeds. Only the lanterns that reach the temple
 * count, read from the pier nearest the spring to the one furthest from it.
 *
 * Everything is authored in "flow coordinates" where the river runs towards larger x, then
 * mirrored onto the scene (screen x = 1600 − flow x), so upstream is on the right.
 */

export type Outcome = 'temple' | 'mill' | 'reeds';

export interface DockDef {
  glyph: GlyphId;
  /** Where the lantern floats, then the way the current takes it, in flow coordinates. */
  route: readonly (readonly [number, number])[];
}

/** From the pier nearest the spring (smallest flow x) to the furthest. */
export const DOCKS: readonly DockDef[] = [
  { glyph: 'dipper', route: [[260, 345], [320, 410], [500, 440], [760, 385], [1000, 365], [1250, 325], [1370, 312]] },
  { glyph: 'belt', route: [[380, 555], [450, 510], [640, 475], [820, 530], [1000, 560], [1250, 610], [1440, 625]] },
  { glyph: 'square', route: [[520, 345], [590, 420], [800, 465], [980, 455], [1092, 450]] },
  { glyph: 'hook', route: [[640, 555], [720, 510], [870, 430], [1010, 385], [1240, 335], [1440, 345]] },
  { glyph: 'triangle', route: [[780, 345], [850, 385], [1010, 392], [1240, 345], [1440, 282]] },
  { glyph: 'cross', route: [[900, 555], [970, 515], [1060, 430], [1160, 360], [1300, 322], [1495, 305]] },
];

export const SX = (flowX: number): number => SCENE_W - flowX;
export const SPEED = 200;

/** Points of a smooth curve through the route (uniform Catmull–Rom), about `step` apart. */
export function sampleRoute(route: readonly (readonly [number, number])[], step = 6): [number, number][] {
  const p = (i: number) => route[clamp(i, 0, route.length - 1)];
  const out: [number, number][] = [[route[0][0], route[0][1]]];
  for (let i = 0; i < route.length - 1; i += 1) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    const n = Math.max(2, Math.ceil(dist(p1[0], p1[1], p2[0], p2[1]) / step));
    for (let k = 1; k <= n; k += 1) {
      const t = k / n;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  return out;
}

/** Each route as a polyline and its length. */
const TRACKS = DOCKS.map((d) => {
  const pts = sampleRoute(d.route);
  let len = 0;
  for (let k = 1; k < pts.length; k += 1) len += dist(pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1]);
  return { pts, len };
});

/** Position (flow coordinates) of lantern `i` after it has floated `s` along its route. */
export function positionAt(i: number, s: number): [number, number] {
  const { pts, len } = TRACKS[i];
  let left = clamp(s, 0, len);
  for (let k = 1; k < pts.length; k += 1) {
    const d = dist(pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1]);
    if (left <= d || k === pts.length - 1) {
      const r = d ? Math.min(1, left / d) : 0;
      return [pts[k - 1][0] + (pts[k][0] - pts[k - 1][0]) * r, pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * r];
    }
    left -= d;
  }
  return pts[pts.length - 1];
}

/** Where lantern `i` ends up. */
export function outcomeOf(i: number): Outcome {
  const [x, y] = DOCKS[i].route[DOCKS[i].route.length - 1];
  if (x > 1350 && y < 400) return 'temple';
  if (x > 1350 && y > 550) return 'mill';
  return 'reeds';
}

/** The answer: lanterns that reach the temple, nearest the spring first. */
export const READING_ORDER: readonly number[] = DOCKS.flatMap((_, i) => (outcomeOf(i) === 'temple' ? [i] : []));

/** Is the flow-coordinate point on the river (and not on the reed island)? */
export function onWater(x: number, y: number): boolean {
  if (x < 1000) return y >= 303 && y <= 597;
  const top = x < 1260 ? 300 - ((x - 1000) / 260) * 62 : 238;
  const bottom = x < 1260 ? 600 + ((x - 1000) / 260) * 98 : 698;
  if (y < top || y > bottom || x > 1500) return false;
  return !(x >= 1100 && Math.abs(y - 450) < Math.min(50, (x - 1100) / 3));
}

const RIVER_D = 'M-20 300 L1000 300 C1090 300 1160 238 1260 238 L1500 238 L1500 698 L1260 698 C1160 698 1090 600 1000 600 L-20 600 Z';

export const riverLanterns: PuzzleDef = {
  id: 'river-lanterns',
  get name() {
    return tr('Hoa đăng', 'River Lanterns');
  },
  answer: READING_ORDER.map((i) => DOCKS[i].glyph),
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    /** Distance floated so far, and whether the lantern is still moving. */
    const lamps = DOCKS.map(() => ({ s: 0, moving: false }));
    const nodes: SVGGElement[] = [];
    let frame = 0;
    let last = 0;
    let flow = 0;

    // Back: the night bank.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#18241f' }, back);
    scene.grain('back', 0.4);

    // Mid: the river, drawn in flow coordinates and mirrored.
    const world = el('g', { transform: `translate(${SCENE_W} 0) scale(-1 1)`, 'pointer-events': 'none' }, mid);
    el('path', { d: RIVER_D, fill: '#2a5a82' }, world);
    const clip = uid('river-clip');
    el('path', { d: RIVER_D }, el('clipPath', { id: clip }, scene.defs));
    const streaks = el('g', { 'clip-path': url(clip) }, world);
    const drift = el('g', {}, streaks);
    const rand = seeded(6107);
    for (let row = 0; row < 14; row += 1) {
      const jx = rand() * 60;
      const y = 250 + row * 34 + rand() * 12;
      for (let k = -1; k < 14; k += 1) {
        const x = k * 130 + jx;
        el('path', { d: `M${x.toFixed(0)} ${y.toFixed(0)} q14 -5 30 0`, fill: 'none', stroke: '#8cbbdc', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.5 }, drift);
      }
    }
    // Reed island, with the point of it upstream (smaller flow x).
    el('path', { d: 'M1100 450 L1250 400 L1510 400 L1510 500 L1250 500 Z', fill: '#26402f', stroke: '#3a5c44', 'stroke-width': 4, 'stroke-linejoin': 'round' }, world);
    for (let k = 0; k < 16; k += 1) {
      const x = 1110 + rand() * 380;
      const y = 410 + rand() * 80;
      el('path', { d: `M${x.toFixed(0)} ${y.toFixed(0)} q4 -22 ${(rand() * 14 - 7).toFixed(0)} -40`, fill: 'none', stroke: '#6a9a58', 'stroke-width': 3, 'stroke-linecap': 'round' }, world);
    }
    // Reeds at the island's tip, where a lantern can catch.
    for (const dy of [-14, -4, 6, 16]) {
      el('path', { d: `M1100 ${450 + dy} q-8 -22 -3 -42`, fill: 'none', stroke: '#6a9a58', 'stroke-width': 3, 'stroke-linecap': 'round' }, world);
    }
    // Piers, one per lantern.
    DOCKS.forEach((d) => {
      const [x, y] = d.route[0];
      const top = y < 450;
      el('rect', { x: x - 18, y: top ? 296 : y, width: 36, height: top ? y - 296 + 6 : 604 - y, rx: 4, fill: '#6a4a2e', stroke: '#3a2818', 'stroke-width': 3 }, world);
    });
    // The temple steps at the downstream end of the upper branch, and the mill below.
    el('rect', { x: 1500, y: 238, width: 100, height: 140, fill: '#5a5560' }, world);
    for (let k = 0; k < 4; k += 1) el('rect', { x: 1500, y: 252 + k * 30, width: 100 - k * 8, height: 6, fill: '#7a7480' }, world);
    el('rect', { x: 1512, y: 150, width: 76, height: 90, fill: '#6a3a2a', stroke: '#3a1c14', 'stroke-width': 4 }, world);
    el('path', { d: 'M1496 156 L1550 108 L1604 156 Z', fill: '#8a3a2a', stroke: '#4a1c14', 'stroke-width': 4, 'stroke-linejoin': 'round' }, world);
    el('rect', { x: 1538, y: 178, width: 24, height: 62, fill: '#2a1810' }, world);
    el('rect', { x: 1500, y: 560, width: 100, height: 150, fill: '#5a4a34' }, world);
    el('circle', { cx: 1548, cy: 625, r: 46, fill: 'none', stroke: '#8a6a48', 'stroke-width': 8 }, world);
    for (let a = 0; a < 6; a += 1) {
      const r = (a * Math.PI) / 3;
      el('line', { x1: 1548, y1: 625, x2: 1548 + Math.cos(r) * 46, y2: 625 + Math.sin(r) * 46, stroke: '#8a6a48', 'stroke-width': 6 }, world);
    }

    // Front: the lanterns, and the owl at the temple.
    DOCKS.forEach((d, i) => {
      const g = el('g', { class: 'river-lantern interactive', 'data-hint': `lantern-${i}` }, front);
      el('circle', { r: 46, fill: 'transparent' }, g);
      el('ellipse', { rx: 30, ry: 38, fill: '#e8c46a', stroke: '#8a6a1c', 'stroke-width': 4 }, g);
      el('ellipse', { cx: 0, cy: 40, rx: 24, ry: 7, fill: '#3a2818' }, g);
      for (const [sx, sy] of placeStars(d.glyph, 0, 0, 46)) el('circle', { cx: sx.toFixed(1), cy: sy.toFixed(1), r: 3.6, fill: '#5a2a14' }, g);
      asButton(g, tr(`Hoa đăng ${i + 1}`, `River lantern ${i + 1}`), () => toggle(i));
      nodes.push(g);
    });
    drawOwl(front, SCENE_W - 1550, 232, 0.6);

    const render = (now: number) => {
      DOCKS.forEach((_, i) => {
        const [x, y] = positionAt(i, lamps[i].s);
        const bob = Math.sin(now / 420 + i * 1.7) * 2.5;
        nodes[i].setAttribute('transform', `translate(${SX(x).toFixed(1)} ${(y + bob).toFixed(1)}) rotate(${(Math.sin(now / 650 + i) * 4).toFixed(1)})`);
      });
    };
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      flow = (flow + dt * 36) % 130;
      drift.setAttribute('transform', `translate(${flow.toFixed(1)} 0)`);
      DOCKS.forEach((_, i) => {
        const l = lamps[i];
        if (!l.moving) return;
        l.s += SPEED * dt;
        if (l.s >= TRACKS[i].len) {
          l.s = TRACKS[i].len;
          l.moving = false;
        }
      });
      render(now);
      frame = requestAnimationFrame(loop);
    };
    last = performance.now();
    frame = requestAnimationFrame(loop);

    function toggle(i: number): void {
      const l = lamps[i];
      if (l.s > 0) {
        l.s = 0;
        l.moving = false;
      } else {
        l.moving = true;
      }
      sound.paper();
    }

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const first = READING_ORDER[0];
        const start = DOCKS[first].route[0];
        return [
          {
            note: tr('Chạm vào một hoa đăng để thả nó: dòng nước chảy từ nguồn bên phải sang trái và đưa đèn tới bến đình, cối xay hoặc mắc vào bụi lau. Thả lần lượt cả 6 đèn.', 'Tap a lantern to set it afloat: the river flows from the spring on the right to the left and carries it to a temple pier, a water mill, or into the reeds. Float all 6 lanterns.'),
            targets: [{
              x: SX(start[0]), y: start[1], r: 60, verb: 'tap',
              act: (picture) => {
                const node = picture.querySelector(`[data-hint="lantern-${first}"]`);
                return (p) => {
                  const [x, y] = positionAt(first, p * TRACKS[first].len);
                  node?.setAttribute('transform', `translate(${SX(x).toFixed(1)} ${y.toFixed(1)})`);
                };
              },
            }],
            apply: () => {
              lamps.forEach((l, i) => {
                l.s = TRACKS[i].len;
                l.moving = false;
              });
              render(performance.now());
            },
          },
          {
            note: tr('Chỉ những đèn trôi tới bến đình (có mái chùa) mới tính; đèn tới cối xay hoặc mắc ở bụi lau thì bỏ. Đọc theo thứ tự các bến từ gần nguồn nhất (bên phải) tới xa nguồn.', 'Only the lanterns that reach a temple pier (with a temple roof) count; skip those at the mill or caught in the reeds. Read in the order of the piers, from the one nearest the spring (right) to the farthest.'),
            targets: READING_ORDER.map((i) => {
              const end = DOCKS[i].route[DOCKS[i].route.length - 1];
              return { x: SX(end[0]), y: end[1], r: 55, verb: 'look' as const };
            }),
            prepare: (picture) => {
              const overlay = picture.querySelector('.layer-overlay') ?? picture;
              READING_ORDER.forEach((i, n) => {
                const end = DOCKS[i].route[DOCKS[i].route.length - 1];
                const cx = SX(end[0]);
                const stars = placeStars(DOCKS[i].glyph, cx, end[1], 46);
                for (const [a, b] of glyph(DOCKS[i].glyph).lines) {
                  el('line', { x1: stars[a][0], y1: stars[a][1], x2: stars[b][0], y2: stars[b][1], class: 'hint-line', 'pointer-events': 'none' }, overlay);
                }
                const badge = el('g', { transform: `translate(${cx} ${end[1] - 62})`, 'pointer-events': 'none' }, overlay);
                el('circle', { r: 17, class: 'number-badge' }, badge);
                el('text', { y: 1, class: 'number-text' }, badge).textContent = String(n + 1);
              });
            },
          },
        ];
      },
      destroy: () => cancelAnimationFrame(frame),
    };
  },
};
