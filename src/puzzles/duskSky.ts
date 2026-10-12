import { url } from '../core/defs';
import { glyph, placeStars, type GlyphId } from '../core/glyphs';
import { drawOwl } from '../core/owl';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, uid } from '../core/svg';
import { clamp } from '../core/tween';
import { dist, seeded, skyGradient } from './sky';
import type { HintTarget, PuzzleDef } from './types';

/**
 * Level 8 — dusk ("hoàng hôn"). In daylight there are no stars. Lower the sun and
 * they come out a group at a time, brightest first: each group is a constellation,
 * dots only. The order they come out in is the answer. Go on into full night and
 * every faint star floods in, burying the shapes again.
 */

export const GLYPH_SIZE = 170;
/** In the order they come out (the answer order), which is not left to right. */
export const BATCHES: readonly { id: GlyphId; x: number; y: number }[] = [
  { id: 'cross', x: 770, y: 400 },
  { id: 'dipper', x: 960, y: 190 },
  { id: 'triangle', x: 470, y: 200 },
  { id: 'hook', x: 220, y: 390 },
];
export const SUN_TOP = 150;
export const SUN_BOTTOM = 700;
export const HORIZON = 640;
/** Darkness at which each batch comes out; past FLOOD_AT the faint stars flood in. */
export const BATCH_AT: readonly number[] = [0.25, 0.4, 0.55, 0.7];
export const FLOOD_AT = 0.86;

export const darkness = (sunY: number): number => clamp((sunY - SUN_TOP) / (SUN_BOTTOM - SUN_TOP), 0, 1);
export const sunYFor = (d: number): number => SUN_TOP + d * (SUN_BOTTOM - SUN_TOP);
export const sunX = (sunY: number): number => 1200 + (sunY - SUN_TOP) * 0.3;
/** How many constellations are out at this darkness. */
export const batchesOut = (d: number): number => BATCH_AT.filter((t) => d >= t).length;

/** The faint stars of full night, kept clear of the constellation stars so they hide rather than overlap them. */
export function faintStars(): [number, number][] {
  const rand = seeded(88);
  const bright = BATCHES.flatMap((b) => placeStars(b.id, b.x, b.y, GLYPH_SIZE));
  const out: [number, number][] = [];
  let tries = 0;
  while (out.length < 95 && tries < 6000) {
    tries += 1;
    const p: [number, number] = [40 + rand() * (SCENE_W - 80), 40 + rand() * (HORIZON - 90)];
    if (bright.some((s) => dist(p[0], p[1], s[0], s[1]) < 34)) continue;
    if (out.some((s) => dist(p[0], p[1], s[0], s[1]) < 30)) continue;
    out.push(p);
  }
  return out;
}

export const duskSky: PuzzleDef = {
  id: 'dusk-sky',
  name: 'Hoàng hôn',
  answer: BATCHES.map((b) => b.id),
  fireflies: [
    { id: 'dusk-sky/meadow', layer: 'front', x: 640, y: 820 },
    { id: 'dusk-sky/tree', layer: 'front', x: 1520, y: 700 },
  ],
  mount({ scene, sound }) {
    const { back, front } = scene.layers;
    let sunY = SUN_TOP;
    let shown = 0;
    const hinted: number[] = [];
    const full = { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120 };

    // Back: night under a twilight wash under the day sky; the stars sit on top of all three.
    el('rect', { ...full, fill: skyGradient(scene.defs, '#0b1030', '#2a2350') }, back);
    const twilight = el('rect', { ...full, fill: skyGradient(scene.defs, '#2b2560', '#d9785a') }, back);
    const day = el('rect', { ...full, fill: skyGradient(scene.defs, '#7fb6e6', '#f6dcaa') }, back);
    const starsG = el('g', {}, back);
    const batchNodes = BATCHES.map((b) => {
      const g = el('g', { class: 'dusk-batch' }, starsG);
      for (const [x, y] of placeStars(b.id, b.x, b.y, GLYPH_SIZE)) el('circle', { cx: x, cy: y, r: 6.5, class: 'dusk-star' }, g);
      return g;
    });
    const faint = el('g', { class: 'dusk-batch' }, starsG);
    const rand = seeded(89);
    for (const [x, y] of faintStars()) el('circle', { cx: x, cy: y, r: (4.5 + rand() * 2).toFixed(1), class: 'dusk-star' }, faint);
    const hintLines = el('g', {}, back);

    // Front: the sun sinks behind the hills. The hills let the pointer through, so
    // the sun can still be grabbed by its glow once it has set.
    const glowId = uid('afterglow');
    const glow = el('radialGradient', { id: glowId }, scene.defs);
    el('stop', { offset: 0, 'stop-color': '#ffb36b', 'stop-opacity': 0.75 }, glow);
    el('stop', { offset: 1, 'stop-color': '#ffb36b', 'stop-opacity': 0 }, glow);
    const afterglow = el('ellipse', { cy: HORIZON, rx: 280, ry: 110, fill: url(glowId), 'pointer-events': 'none' }, front);
    const ghost = el('circle', { r: 58, class: 'ghost-mark', opacity: 0 }, front);
    const sun = el('g', { class: 'dusk-sun interactive', tabindex: 0, role: 'slider', 'aria-label': 'Mặt trời', 'aria-valuemin': 0, 'aria-valuemax': 100 }, front);
    el('circle', { r: 95, fill: 'transparent' }, sun);
    el('circle', { r: 75, class: 'sun-halo' }, sun);
    const disc = el('circle', { r: 55, class: 'sun-disc' }, sun);
    const hills = el('g', { 'pointer-events': 'none' }, front);
    el('path', { d: `M-60 ${HORIZON + 20} Q200 ${HORIZON - 70} 470 ${HORIZON - 10} T980 ${HORIZON - 20} T1660 ${HORIZON - 30} L1660 960 L-60 960 Z`, fill: '#2f2a4a' }, hills);
    el('path', { d: `M-60 ${HORIZON + 90} Q300 ${HORIZON + 10} 700 ${HORIZON + 70} T1660 ${HORIZON + 40} L1660 960 L-60 960 Z`, fill: '#221d38' }, hills);
    el('rect', { x: 1490, y: 470, width: 18, height: 200, fill: '#1a1530' }, hills);
    el('circle', { cx: 1499, cy: 450, r: 70, fill: '#1a1530' }, hills);
    drawOwl(hills, 1499, 528, 0.55);

    const drawHintLines = (out: number) => {
      hintLines.replaceChildren();
      for (const i of hinted) {
        if (i >= out) continue;
        const pts = placeStars(BATCHES[i].id, BATCHES[i].x, BATCHES[i].y, GLYPH_SIZE);
        for (const [a, b] of glyph(BATCHES[i].id).lines) {
          el('line', { x1: pts[a][0], y1: pts[a][1], x2: pts[b][0], y2: pts[b][1], class: 'hint-line' }, hintLines);
        }
      }
    };
    const render = () => {
      const d = darkness(sunY);
      const x = sunX(sunY);
      sun.setAttribute('transform', `translate(${x.toFixed(1)} ${sunY.toFixed(1)})`);
      sun.setAttribute('aria-valuenow', String(Math.round(d * 100)));
      disc.classList.toggle('low', d > 0.3);
      afterglow.setAttribute('cx', x.toFixed(1));
      afterglow.setAttribute('opacity', clamp(1 - Math.abs(d - 0.45) / 0.45, 0, 1).toFixed(2));
      day.setAttribute('opacity', clamp(1 - d / 0.22, 0, 1).toFixed(3));
      twilight.setAttribute('opacity', clamp(1 - (d - 0.2) / 0.5, 0, 1).toFixed(3));
      const out = batchesOut(d);
      batchNodes.forEach((g, i) => g.classList.toggle('on', i < out));
      faint.classList.toggle('on', d >= FLOOD_AT);
      if (out > shown) sound.chime();
      shown = out;
      drawHintLines(out);
      const waiting = hinted.find((i) => i >= out);
      if (waiting === undefined) ghost.setAttribute('opacity', '0');
      else {
        const gy = sunYFor(BATCH_AT[waiting] + 0.04);
        ghost.setAttribute('cx', sunX(gy).toFixed(1));
        ghost.setAttribute('cy', gy.toFixed(1));
        ghost.setAttribute('opacity', '1');
      }
    };

    let grab = 0;
    scene.draggable(sun, {
      start: (p) => (grab = p.y - sunY),
      move: (p) => {
        sunY = clamp(p.y - grab, SUN_TOP, SUN_BOTTOM);
        render();
      },
    });
    sun.addEventListener('keydown', (event) => {
      const step = { ArrowDown: 20, ArrowRight: 20, ArrowUp: -20, ArrowLeft: -20 }[event.key];
      if (!step) return;
      event.preventDefault();
      sunY = clamp(sunY + step, SUN_TOP, SUN_BOTTOM);
      render();
    });
    render();

    return {
      revealHints: (count) => {
        while (hinted.length < count && hinted.length < BATCHES.length) hinted.push(hinted.length);
        render();
        return hinted.length;
      },
      hintTargets: () => {
        const out = batchesOut(darkness(sunY));
        const targets: HintTarget[] = hinted.filter((i) => i < out).map((i) => ({ x: BATCHES[i].x, y: BATCHES[i].y, r: 125, verb: 'look', note: `Nét vàng nối các sao của chòm hiện ra thứ ${i + 1}.` }));
        const waiting = hinted.find((i) => i >= out);
        if (waiting !== undefined) {
          const gy = sunYFor(BATCH_AT[waiting] + 0.04);
          targets.push({ x: sunX(sunY), y: Math.min(sunY, HORIZON - 40), r: 90, verb: 'drag', to: { x: sunX(gy), y: gy }, note: 'Kéo mặt trời xuống tới vòng vàng để nhóm sao tiếp theo hiện ra.' });
        }
        return targets;
      },
      destroy: () => undefined,
    };
  },
};
