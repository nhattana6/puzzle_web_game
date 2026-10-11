import { DEF, url } from '../core/defs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, uid } from '../core/svg';
import { clamp, tween } from '../core/tween';
import { drawZodiac, type ZodiacId } from '../core/zodiac';
import type { PuzzleDef } from './types';

/**
 * Chapter 1 — the courtyard at dusk ("bóng sân chiều").
 * Three paper cut-outs hang at different depths. Sliding the candle moves each
 * shadow by a different amount (parallax). At two candle positions the shadows
 * fall into place and form an animal: read them left to right.
 */

export const CANDLE_MIN = 180;
export const CANDLE_MAX = 1420;
export const CANDLE_START = 220;
/** How strongly each cut-out's shadow moves with the candle. */
export const DEPTHS: readonly number[] = [0.35, 0.8, 1.4];
export const SNAP = 18;
export const TARGETS: readonly { animal: ZodiacId; candleX: number; wallX: number }[] = [
  { animal: 'ox', candleX: 560, wallX: 470 },
  { animal: 'tiger', candleX: 1060, wallX: 1130 },
];

export const shadowOffset = (candleX: number, focusX: number, depth: number): number =>
  (focusX - candleX) * depth;

/** The animal whose shadow is complete at this candle position, if any. */
export function alignedTarget(candleX: number): ZodiacId | null {
  return TARGETS.find((t) => Math.abs(candleX - t.candleX) <= SNAP)?.animal ?? null;
}

const WALL_Y = 320;
const SHADOW_SCALE = 2.9;
const BAND = 100 / DEPTHS.length;
const FLOOR_Y = 790;
const TAGS = [
  { x: 560, y: 452 },
  { x: 800, y: 478 },
  { x: 1040, y: 458 },
];

export const candleCourtyard: PuzzleDef = {
  id: 'c1-candle-courtyard',
  chapter: 1,
  name: 'Bóng sân chiều',
  answer: TARGETS.map((t) => t.animal),
  fireflies: [
    { id: 'c1-candle-courtyard/roof', layer: 'back', x: 1450, y: 60 },
    { id: 'c1-candle-courtyard/rail', layer: 'front', x: 120, y: 860 },
  ],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    let candleX = CANDLE_START;
    let aligned: ZodiacId | null = null;
    let cancelSnap: (() => void) | null = null;

    // Back: plaster wall lit by the candle, tiled roof edge.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#4a3d33' }, back);
    const lightId = uid('candle-light');
    const gradient = el('radialGradient', { id: lightId }, scene.defs);
    el('stop', { offset: 0, 'stop-color': '#f8e6bb', 'stop-opacity': 0.95 }, gradient);
    el('stop', { offset: 0.45, 'stop-color': '#dcbc8c', 'stop-opacity': 0.6 }, gradient);
    el('stop', { offset: 1, 'stop-color': '#4a3d33', 'stop-opacity': 0 }, gradient);
    const light = el('ellipse', { cx: candleX, cy: 620, rx: 780, ry: 600, fill: url(lightId) }, back);

    const shadows = el('g', { filter: url(DEF.softShadow), opacity: 0.82 }, back);
    shadows.style.color = '#221a15';
    const bandClips = DEPTHS.map((_, i) => {
      const id = uid('band');
      const clip = el('clipPath', { id }, scene.defs);
      el('rect', { x: i * BAND - 0.05, y: -20, width: BAND + 0.1, height: 140 }, clip);
      return id;
    });
    const slices = TARGETS.map((target) =>
      DEPTHS.map((_, i) => {
        const slice = el('g', {}, shadows);
        drawZodiac(el('g', { 'clip-path': url(bandClips[i]) }, slice), target.animal);
        return slice;
      }),
    );
    const ghost = el('g', { opacity: 0 }, back);
    ghost.style.color = '#fff6dd';
    for (const target of TARGETS) {
      drawZodiac(el('g', {
        transform: `translate(${target.wallX - 50 * SHADOW_SCALE} ${WALL_Y - 55 * SHADOW_SCALE}) scale(${SHADOW_SCALE})`,
      }, ghost), target.animal);
    }

    let roof = 'M-60 -60 L1660 -60 L1660 96';
    for (let x = 1660; x > -60; x -= 64) roof += ` Q${x - 32} 136 ${x - 64} 96`;
    el('path', { d: `${roof} Z`, fill: '#2b2622' }, back);
    el('rect', { x: -60, y: 96, width: SCENE_W + 120, height: 10, fill: '#5a4636' }, back);
    scene.grain('back', 0.8);

    // Mid: the string with three paper cut-outs, swaying a little.
    el('path', { d: 'M40 400 Q800 540 1560 400', fill: 'none', stroke: '#2b2622', 'stroke-width': 3 }, mid);
    const tags = TAGS.map((tag, i) => {
      const size = 44 + DEPTHS[i] * 18;
      const g = el('g', {}, mid);
      el('line', { x1: tag.x, y1: tag.y - 26, x2: tag.x, y2: tag.y, stroke: '#2b2622', 'stroke-width': 2 }, g);
      el('rect', {
        x: tag.x - size / 2, y: tag.y, width: size, height: size * 1.25, rx: 3,
        fill: '#eadcbc', stroke: '#8a6a45', 'stroke-width': 2, filter: url(DEF.rough),
      }, g);
      for (let h = 0; h < 5; h += 1) {
        el('circle', {
          cx: tag.x - size / 3 + ((h * 37 + i * 13) % size) * 0.66,
          cy: tag.y + 12 + ((h * 53 + i * 29) % (size * 1.0)),
          r: 3 + ((h + i) % 3) * 2,
          fill: '#4a3d33',
        }, g);
      }
      return { g, tag };
    });

    // Front: floor, rail and the candle.
    el('rect', { x: -60, y: FLOOR_Y, width: SCENE_W + 120, height: 200, fill: '#2b2622' }, front);
    el('rect', { x: CANDLE_MIN - 50, y: FLOOR_Y + 14, width: CANDLE_MAX - CANDLE_MIN + 100, height: 14, rx: 7, fill: '#6b4f36' }, front);
    const railMarks = el('g', { opacity: 0 }, front);
    for (const target of TARGETS) {
      el('circle', { cx: target.candleX, cy: FLOOR_Y + 21, r: 9, fill: '#f4c66a', filter: url(DEF.glow) }, railMarks);
    }
    const candle = el('g', { class: 'candle interactive', tabindex: 0, role: 'slider', 'aria-label': 'Nến' }, front);
    el('rect', { x: -60, y: 600, width: 120, height: 215, fill: 'transparent' }, candle);
    el('ellipse', { cx: 0, cy: FLOOR_Y + 8, rx: 38, ry: 9, fill: '#8a6a45' }, candle);
    el('rect', { x: -15, y: 712, width: 30, height: 84, rx: 4, fill: '#efe6d2', stroke: '#b9a27f', 'stroke-width': 2 }, candle);
    el('line', { x1: 0, y1: 712, x2: 0, y2: 700, stroke: '#2b2622', 'stroke-width': 2 }, candle);
    el('path', { d: 'M0 650 Q17 682 0 706 Q-17 682 0 650 Z', fill: '#f4c66a', filter: url(DEF.glow), class: 'flame' }, candle);
    candle.setAttribute('aria-valuemin', String(CANDLE_MIN));
    candle.setAttribute('aria-valuemax', String(CANDLE_MAX));

    const render = () => {
      candle.setAttribute('transform', `translate(${candleX.toFixed(1)} 0)`);
      candle.setAttribute('aria-valuenow', String(Math.round(candleX)));
      light.setAttribute('cx', candleX.toFixed(1));
      TARGETS.forEach((target, t) => {
        DEPTHS.forEach((depth, i) => {
          const dx = target.wallX - 50 * SHADOW_SCALE + shadowOffset(candleX, target.candleX, depth);
          slices[t][i].setAttribute('transform', `translate(${dx.toFixed(1)} ${WALL_Y - 55 * SHADOW_SCALE}) scale(${SHADOW_SCALE})`);
        });
      });
      const now = alignedTarget(candleX);
      if (now && now !== aligned) sound.chime();
      aligned = now;
    };

    const moveTo = (x: number) => {
      candleX = clamp(x, CANDLE_MIN, CANDLE_MAX);
      render();
    };

    const snap = () => {
      const target = TARGETS.find((t) => Math.abs(candleX - t.candleX) <= SNAP * 1.6);
      if (!target) return;
      const from = candleX;
      cancelSnap?.();
      cancelSnap = tween(220, (t) => moveTo(from + (target.candleX - from) * t));
    };

    let grab = 0;
    scene.draggable(candle, {
      start: (p) => {
        cancelSnap?.();
        grab = p.x - candleX;
      },
      move: (p) => moveTo(p.x - grab),
      end: snap,
    });
    candle.addEventListener('keydown', (event) => {
      const step = event.shiftKey ? 40 : 10;
      if (event.key === 'ArrowLeft') moveTo(candleX - step);
      else if (event.key === 'ArrowRight') moveTo(candleX + step);
      else return;
      event.preventDefault();
    });

    let frame = 0;
    const sway = (now: number) => {
      tags.forEach(({ g, tag }, i) => {
        const angle = Math.sin(now / 900 + i * 1.7) * 2.2;
        g.setAttribute('transform', `rotate(${angle.toFixed(2)} ${tag.x} ${tag.y - 26})`);
      });
      frame = requestAnimationFrame(sway);
    };
    frame = requestAnimationFrame(sway);
    render();

    return {
      hintTargets: () => [{ x: candleX, y: 720, r: 80, verb: 'drag' }],
      showGhost: () => {
        ghost.setAttribute('opacity', '0.16');
        railMarks.setAttribute('opacity', '1');
      },
      destroy: () => {
        cancelSnap?.();
        cancelAnimationFrame(frame);
      },
    };
  },
};
