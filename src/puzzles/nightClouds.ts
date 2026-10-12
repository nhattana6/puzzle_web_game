import { DEF, url } from '../core/defs';
import { drawOwl } from '../core/owl';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, uid } from '../core/svg';
import { clamp } from '../core/tween';
import { dist, glyphAt, seeded, skyGradient, starfield } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Level 1 — clouds in the window ("mây đêm"). The tutorial: three constellations
 * hide behind clouds. Drag the clouds away and read the sky left to right.
 */

export const GLYPH_SPOTS = [
  { id: 'crown', x: 500, y: 330 },
  { id: 'cross', x: 800, y: 470 },
  { id: 'belt', x: 1100, y: 320 },
] as const;
export const CLOUD_R = 125;
export const CLOUDS_START: readonly (readonly [number, number])[] = [
  [520, 320], [790, 470], [1080, 330], [640, 640], [1180, 620],
];

/** Which constellations (indexes into GLYPH_SPOTS) still have a cloud over them. */
export function coveredGlyphs(clouds: readonly (readonly [number, number])[]): number[] {
  return GLYPH_SPOTS.map((g, i) => ({ g, i }))
    .filter(({ g }) => clouds.some(([x, y]) => dist(x, y, g.x, g.y) < CLOUD_R + 50))
    .map(({ i }) => i);
}

const WINDOW = { x: 270, y: 70, w: 1060, h: 720 };

export const nightClouds: PuzzleDef = {
  id: 'night-clouds',
  name: 'Mây đêm',
  answer: GLYPH_SPOTS.map((g) => g.id),
  fireflies: [
    { id: 'night-clouds/sill', layer: 'front', x: 1250, y: 830 },
    { id: 'night-clouds/corner', layer: 'back', x: 120, y: 160 },
  ],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const clouds = CLOUDS_START.map(([x, y]) => [x, y] as [number, number]);
    const hinted: number[] = [];

    // Back: the attic wall.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#1c1626' }, back);
    scene.grain('back', 0.4);

    // Mid: the window with the night sky and its constellations.
    const clipId = uid('window');
    const arch = `M${WINDOW.x} ${WINDOW.y + WINDOW.h} V${WINDOW.y + 240} A${WINDOW.w / 2} 240 0 0 1 ${WINDOW.x + WINDOW.w} ${WINDOW.y + 240} V${WINDOW.y + WINDOW.h} Z`;
    el('path', { d: arch }, el('clipPath', { id: clipId }, scene.defs));
    const sky = el('g', { 'clip-path': url(clipId) }, mid);
    el('rect', { x: WINDOW.x, y: WINDOW.y, width: WINDOW.w, height: WINDOW.h, fill: skyGradient(scene.defs) }, sky);
    starfield(sky, { x: WINDOW.x, y: WINDOW.y, w: WINDOW.w, h: WINDOW.h }, 140, 11);
    const rand = seeded(5);
    for (let i = 0; i < 14; i += 1) {
      el('circle', { cx: WINDOW.x + 60 + rand() * (WINDOW.w - 120), cy: WINDOW.y + 160 + rand() * 480, r: 4, fill: '#f6efd8', opacity: 0.8 }, sky);
    }
    const glyphs = el('g', { filter: url(DEF.glow) }, sky);
    glyphs.style.color = '#fff3c8';
    for (const g of GLYPH_SPOTS) glyphAt(glyphs, g.id, g.x, g.y, 190, { star: 6, line: 2.5, lineOpacity: 0.45 });
    el('circle', { cx: 1180, cy: 170, r: 46, fill: '#f6efd8', filter: url(DEF.glow), opacity: 0.9 }, sky);

    // Clouds live inside the window; drag one past the frame and it is gone.
    const cloudLayer = el('g', {}, sky);
    const nodes = clouds.map((_, i) => {
      const g = el('g', { class: 'cloud interactive', tabindex: 0, role: 'button', 'aria-label': `Đám mây ${i + 1}`, 'data-hint': `cloud-${i}` }, cloudLayer);
      for (const [dx, dy, r] of [[-70, 20, 60], [-20, -20, 75], [50, 0, 70], [100, 30, 50], [0, 40, 70]]) {
        el('circle', { cx: dx, cy: dy, r, class: 'cloud-puff' }, g);
      }
      return g;
    });

    // Frame and sill in front.
    el('path', { d: arch, fill: 'none', stroke: '#3a2c3a', 'stroke-width': 26 }, front);
    el('line', { x1: WINDOW.x + WINDOW.w / 2, y1: WINDOW.y, x2: WINDOW.x + WINDOW.w / 2, y2: WINDOW.y + WINDOW.h, stroke: '#3a2c3a', 'stroke-width': 10, 'pointer-events': 'none' }, front);
    el('rect', { x: WINDOW.x - 60, y: WINDOW.y + WINDOW.h - 6, width: WINDOW.w + 120, height: 40, rx: 6, fill: '#4a3648' }, front);
    drawOwl(front, 380, 742, 0.9);

    const render = (i: number) => nodes[i].setAttribute('transform', `translate(${clouds[i][0].toFixed(1)} ${clouds[i][1].toFixed(1)})`);
    let wasClear = false;
    const check = () => {
      const clear = coveredGlyphs(clouds).length === 0;
      if (clear && !wasClear) sound.chime();
      wasClear = clear;
    };

    nodes.forEach((g, i) => {
      let grab = [0, 0];
      scene.draggable(g, {
        start: (p) => {
          grab = [p.x - clouds[i][0], p.y - clouds[i][1]];
          cloudLayer.appendChild(g);
        },
        move: (p) => {
          clouds[i] = [clamp(p.x - grab[0], -100, SCENE_W + 100), clamp(p.y - grab[1], -100, SCENE_H + 100)];
          render(i);
        },
        end: () => {
          sound.paper();
          check();
        },
      });
      g.addEventListener('keydown', (event) => {
        const moves: Record<string, [number, number]> = { ArrowLeft: [-40, 0], ArrowRight: [40, 0], ArrowUp: [0, -40], ArrowDown: [0, 40] };
        const m = moves[event.key];
        if (!m) return;
        event.preventDefault();
        clouds[i] = [clouds[i][0] + m[0], clouds[i][1] + m[1]];
        render(i);
        check();
      });
      render(i);
    });


    return {
      revealHints: (count) => {
        while (hinted.length < count) {
          const next = coveredGlyphs(clouds).find((g) => !hinted.includes(g));
          if (next === undefined) break;
          hinted.push(next);
        }
        return hinted.length;
      },
      hintSteps: (): HintStep[] => {
        const steps: HintStep[] = [];
        const sim = clouds.map(([x, y]) => [x, y] as [number, number]);
        GLYPH_SPOTS.forEach((spot) => {
          const c = sim.findIndex(([x, y]) => dist(x, y, spot.x, spot.y) < CLOUD_R + 50);
          if (c === -1) return;
          const from = { x: sim[c][0], y: sim[c][1] };
          const to = { x: from.x, y: SCENE_H - 40 };
          sim[c] = [to.x, to.y];
          steps.push({
            note: 'Kéo đám mây xuống, ra khỏi ô cửa sổ để lộ chòm sao phía sau.',
            targets: [{ ...from, r: 110, verb: 'drag', to, object: `[data-hint="cloud-${c}"]` }],
            apply: () => {
              clouds[c] = [to.x, to.y];
              render(c);
            },
          });
        });
        steps.push({ note: 'Đọc các chòm sao từ trái sang phải.', targets: GLYPH_SPOTS.map((s) => ({ x: s.x, y: s.y, r: 110, verb: 'look' as const })) });
        return steps;
      },
      destroy: () => undefined,
    };
  },
};
