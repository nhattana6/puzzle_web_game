import { drawOwl } from '../core/owl';
import { GLYPHS } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el } from '../core/svg';
import { clamp } from '../core/tween';
import { dist, skyGradient, starfield } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 2, level 2 — the frosted window ("cửa sổ sương"). Nine panes in a 3×3 window,
 * laid out exactly like the keypad. Steam from the kettle fogs the panes it passes, and on
 * the fog old fingerprints show up (finger oil makes the water settle differently). Three
 * panes carry one, two and three prints; the answer is the keys in those panes' places,
 * the one-print pane first. Nothing here is a constellation: the answer is a position.
 */

export const PANE = { w: 270, h: 190, gap: 16 };
export const WINDOW = { x: 380, y: 110 };
/** The keypad is 3×3 in the same order as the panes: pane i is key GLYPHS[i]. */
export const PANE_COUNT = 9;

export const paneOrigin = (i: number): { x: number; y: number } => ({
  x: WINDOW.x + (i % 3) * (PANE.w + PANE.gap),
  y: WINDOW.y + Math.floor(i / 3) * (PANE.h + PANE.gap),
});
export const paneCentre = (i: number): [number, number] => {
  const o = paneOrigin(i);
  return [o.x + PANE.w / 2, o.y + PANE.h / 2];
};

/** Fingerprints, in the pane's own frame (offsets from its centre). Panes not listed are plain. */
export const PRINTS: readonly { pane: number; at: readonly (readonly [number, number])[] }[] = [
  { pane: 5, at: [[-30, 10]] },
  { pane: 0, at: [[-45, -25], [35, 25]] },
  { pane: 7, at: [[-60, 20], [5, -35], [55, 25]] },
];
/** A wiped smear that is no fingerprint, to be told apart from the real ones. */
export const SMEAR_PANE = 3;

/** The answer: panes by how many prints they hold, as the keys in those places. */
export const READING_PANES: readonly number[] = [...PRINTS].sort((a, b) => a.at.length - b.at.length).map((p) => p.pane);

/** Where the kettle's steam comes out, relative to the kettle. */
export const STEAM = { dx: 62, dy: -21 };
/** The kettle is drawn in a frame 1.25 times larger and scaled down by this. */
const KETTLE_SCALE = 0.8;
export const KETTLE_START: readonly [number, number] = [150, 790];
const REACH = 170; // within this the pane fogs at full speed
const FADE_OUT = 290; // beyond this the kettle does nothing

/** How hard the kettle's steam is hitting pane i, 0..1. */
export function steamOn(kettle: readonly [number, number], pane: number): number {
  const [cx, cy] = paneCentre(pane);
  const d = dist(kettle[0] + STEAM.dx, kettle[1] + STEAM.dy, cx, cy);
  if (d <= REACH) return 1;
  if (d >= FADE_OUT) return 0;
  return 1 - (d - REACH) / (FADE_OUT - REACH);
}

export const FOG_RATE = 0.7; // per second at full steam
export const FOG_FADE = 0.15; // per second when left alone

/** Advances all nine panes' fog by `dt` seconds. */
export function stepFog(fog: readonly number[], kettle: readonly [number, number], dt: number): number[] {
  return fog.map((f, i) => clamp(f + (steamOn(kettle, i) * FOG_RATE - FOG_FADE) * dt, 0, 1));
}

/** How clearly the prints show in a pane with this much fog, 0..1. Nothing below a light mist. */
export const printsShown = (fog: number): number => clamp((fog - 0.35) / 0.4, 0, 1);

export const frostWindow: PuzzleDef = {
  id: 'frost-window',
  name: 'Cửa sổ sương',
  answer: READING_PANES.map((p) => GLYPHS[p].id),
  fireflies: [
    { id: 'frost-window/curtain', layer: 'back', x: 110, y: 150 },
    { id: 'frost-window/sill', layer: 'front', x: 1260, y: 810 },
  ],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const kettle: [number, number] = [KETTLE_START[0], KETTLE_START[1]];
    let fog: number[] = new Array(PANE_COUNT).fill(0);
    let frozen = false;
    const W = 3 * PANE.w + 2 * PANE.gap;
    const H = 3 * PANE.h + 2 * PANE.gap;

    // Back: the attic wall.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#241a17' }, back);
    for (let x = 80; x < SCENE_W; x += 160) el('line', { x1: x, y1: -20, x2: x, y2: SCENE_H + 20, stroke: '#1a1210', 'stroke-width': 4 }, back);
    el('rect', { x: -60, y: 828, width: SCENE_W + 120, height: 120, fill: '#3a2a22' }, back);
    scene.grain('back', 0.4);

    // Mid: the night outside, nine panes of fog, the window bars, and the kettle.
    el('rect', { x: WINDOW.x - 26, y: WINDOW.y - 26, width: W + 52, height: H + 52, rx: 8, fill: '#3a2a22' }, mid);
    el('rect', { x: WINDOW.x, y: WINDOW.y, width: W, height: H, fill: skyGradient(scene.defs, '#0b1228', '#232a52') }, mid);
    starfield(mid, { x: WINDOW.x, y: WINDOW.y, w: W, h: H }, 70, 21);
    el('circle', { cx: WINDOW.x + W - 150, cy: WINDOW.y + 90, r: 30, fill: '#f6efd8', opacity: 0.85 }, mid);

    const mists: SVGRectElement[] = [];
    const prints: Map<number, SVGGElement> = new Map();
    for (let i = 0; i < PANE_COUNT; i += 1) {
      const o = paneOrigin(i);
      const [cx, cy] = paneCentre(i);
      mists.push(el('rect', { x: o.x, y: o.y, width: PANE.w, height: PANE.h, fill: '#dfe8f6', style: 'opacity: 0', 'pointer-events': 'none' }, mid));
      const marks = el('g', { style: 'opacity: 0', 'pointer-events': 'none', fill: '#0f1838' }, mid);
      const print = PRINTS.find((p) => p.pane === i);
      if (print) {
        for (const [dx, dy] of print.at) {
          const t = el('g', { transform: `translate(${cx + dx} ${cy + dy}) rotate(${(dx * 3) % 25})` }, marks);
          el('ellipse', { rx: 21, ry: 29 }, t);
          el('path', { d: 'M-12 -8 Q0 -17 12 -8 M-14 3 Q0 -9 14 3 M-12 14 Q0 4 12 14', fill: 'none', stroke: '#8fa3c9', 'stroke-width': 3, 'stroke-linecap': 'round' }, t);
        }
      }
      if (i === SMEAR_PANE) {
        el('path', {
          d: `M${cx - 70} ${cy + 20} Q${cx - 20} ${cy - 50} ${cx + 40} ${cy - 10} M${cx - 60} ${cy + 45} Q${cx - 5} ${cy - 20} ${cx + 55} ${cy + 20} M${cx - 30} ${cy + 55} Q${cx + 10} ${cy + 5} ${cx + 70} ${cy + 40}`,
          fill: 'none', stroke: '#0f1838', 'stroke-width': 13, 'stroke-linecap': 'round', opacity: 0.5,
        }, marks);
      }
      prints.set(i, marks);
    }
    // The window bars, over the fog.
    for (let k = 1; k <= 2; k += 1) {
      el('rect', { x: WINDOW.x + k * PANE.w + (k - 1) * PANE.gap, y: WINDOW.y, width: PANE.gap, height: H, fill: '#3a2a22' }, mid);
      el('rect', { x: WINDOW.x, y: WINDOW.y + k * PANE.h + (k - 1) * PANE.gap, width: W, height: PANE.gap, fill: '#3a2a22' }, mid);
    }
    el('rect', { x: WINDOW.x - 60, y: WINDOW.y + H + 26, width: W + 120, height: 36, rx: 6, fill: '#4a3648' }, mid);

    // The kettle: a copper body with a spout on the right; its steam point is where the fog comes from.
    const kettleNode = el('g', {
      class: 'kettle interactive', tabindex: 0, role: 'button', 'aria-label': 'Ấm trà', 'data-hint': 'kettle',
    }, mid);
    const body = el('g', { transform: `scale(${KETTLE_SCALE})` }, kettleNode);
    el('path', { d: 'M-60 -30 Q-62 30 -40 36 H40 Q62 30 60 -30 Q40 -50 0 -50 Q-40 -50 -60 -30 Z', fill: '#b98a4a', stroke: '#7a5a2c', 'stroke-width': 4 }, body);
    el('path', { d: 'M52 -6 Q82 -14 78 -26 L88 -30 Q96 -8 58 14 Z', fill: '#b98a4a', stroke: '#7a5a2c', 'stroke-width': 4 }, body);
    el('path', { d: 'M-52 -38 Q-92 -40 -88 -2 Q-86 22 -54 20', fill: 'none', stroke: '#7a5a2c', 'stroke-width': 10, 'stroke-linecap': 'round' }, body);
    el('ellipse', { cx: 0, cy: -52, rx: 22, ry: 8, fill: '#8e6a34' }, body);
    el('rect', { x: -4, y: -66, width: 8, height: 14, rx: 3, fill: '#7a5a2c' }, body);
    for (const [ox, oy, r, o] of [[0, 0, 14, 0.35], [10, -26, 18, 0.3], [-6, -56, 22, 0.22]]) {
      el('circle', { cx: 82 + ox, cy: -40 + oy, r, fill: '#f2f4fb', opacity: o, 'pointer-events': 'none' }, body);
    }

    // Front: the owl, watching.
    drawOwl(front, 1400, 800, 0.9);

    const render = () => {
      kettleNode.setAttribute('transform', `translate(${kettle[0].toFixed(1)} ${kettle[1].toFixed(1)})`);
      for (let i = 0; i < PANE_COUNT; i += 1) {
        mists[i].style.opacity = (fog[i] * 0.72).toFixed(3);
        (prints.get(i) as SVGGElement).style.opacity = printsShown(fog[i]).toFixed(3);
      }
    };

    // Fog builds while the steam is on a pane and thins out again by itself.
    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!frozen) {
        const next = stepFog(fog, kettle, dt);
        if (next.some((f, i) => Math.abs(f - fog[i]) > 0.001)) {
          fog = next;
          render();
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    let grab = [0, 0];
    scene.draggable(kettleNode, {
      start: (p) => {
        grab = [p.x - kettle[0], p.y - kettle[1]];
        frozen = false;
      },
      move: (p) => {
        kettle[0] = clamp(p.x - grab[0], 100, SCENE_W - 100);
        kettle[1] = clamp(p.y - grab[1], 100, SCENE_H - 40);
        render();
      },
      end: () => sound.paper(),
    });
    kettleNode.addEventListener('keydown', (event) => {
      const moves: Record<string, [number, number]> = { ArrowLeft: [-40, 0], ArrowRight: [40, 0], ArrowUp: [0, -40], ArrowDown: [0, 40] };
      const m = moves[event.key];
      if (!m) return;
      event.preventDefault();
      kettle[0] = clamp(kettle[0] + m[0], 100, SCENE_W - 100);
      kettle[1] = clamp(kettle[1] + m[1], 100, SCENE_H - 40);
      render();
    });
    render();

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const target = paneCentre(PRINTS[0].pane);
        const to: [number, number] = [target[0] - STEAM.dx, target[1] - STEAM.dy + 60];
        return [
          {
            note: 'Kéo ấm trà lại gần kính cho hơi nước phủ lên. Làm tương tự với các ô còn lại, sương sẽ hiện dấu ngón tay cũ.',
            targets: [{ x: KETTLE_START[0], y: KETTLE_START[1] - 10, r: 80, verb: 'drag', to: { x: to[0], y: to[1] - 10 }, object: '[data-hint="kettle"]' }],
            apply: () => {
              // Every pane fogged at once, with the kettle put back so it does not hide a print.
              kettle[0] = KETTLE_START[0];
              kettle[1] = KETTLE_START[1];
              fog = new Array(PANE_COUNT).fill(1);
              frozen = true;
              render();
            },
          },
          {
            note: 'Đếm dấu ngón tay trong mỗi ô: 1 dấu đọc trước, rồi 2, rồi 3. Ô nằm ở vị trí nào trên cửa sổ thì bấm phím ở vị trí đó trên bàn phím (vết lau không tính).',
            targets: READING_PANES.map((p) => ({ x: paneCentre(p)[0], y: paneCentre(p)[1], r: 130, verb: 'look' as const })),
          },
        ];
      },
      destroy: () => cancelAnimationFrame(frame),
    };
  },
};
