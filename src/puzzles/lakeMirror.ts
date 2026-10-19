import { url } from '../core/defs';
import { drawGlyph } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, uid } from '../core/svg';
import { clamp } from '../core/tween';
import { dist, glyphAt, seeded, skyGradient, starfield } from './sky';
import type { HintStep, PuzzleDef } from './types';
import { tr } from '../core/i18n';

/**
 * Level 2 — the lake ("mặt hồ"). Branches hide the sky, but the still lake
 * reflects it whole. A boat and lily pads float over the reflection: push them
 * aside and read the constellations upside down in the water.
 */

export const WATER_Y = 460;
export const GLYPH_SPOTS = [
  { id: 'dipper', x: 420, y: 205 },
  { id: 'crown', x: 800, y: 175 },
  { id: 'arrow', x: 1180, y: 225 },
] as const;
export const GLYPH_SIZE = 170;
/** Where a sky point shows in the water. */
export const reflectY = (y: number): number => 2 * WATER_Y - y;

export interface Floater {
  kind: 'boat' | 'pad';
  r: number;
  start: readonly [number, number];
}
export const FLOATERS: readonly Floater[] = [
  { kind: 'pad', r: 110, start: [425, 715] },
  { kind: 'boat', r: 150, start: [800, 760] },
  { kind: 'pad', r: 110, start: [1180, 695] },
  { kind: 'pad', r: 80, start: [610, 845] },
];

/** Reflected constellations still hidden under something floating. */
export function hiddenReflections(positions: readonly (readonly [number, number])[]): number[] {
  return GLYPH_SPOTS.map((g, i) => ({ g, i }))
    .filter(({ g }) => positions.some(([x, y], f) => dist(x, y, g.x, reflectY(g.y)) < FLOATERS[f].r + 35))
    .map(({ i }) => i);
}

export const lakeMirror: PuzzleDef = {
  id: 'lake-mirror',
  get name() {
    return tr('Mặt hồ', 'Still Lake');
  },
  answer: GLYPH_SPOTS.map((g) => g.id),
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const pos = FLOATERS.map((f) => [f.start[0], f.start[1]] as [number, number]);
    const hinted: number[] = [];

    // Back: the sky with its constellations, and the lake below.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: WATER_Y + 60, fill: skyGradient(scene.defs, '#0b1230', '#26244c') }, back);
    starfield(back, { x: 0, y: 0, w: SCENE_W, h: WATER_Y }, 120, 21);
    const skyGlyphs = el('g', {}, back);
    skyGlyphs.style.color = '#fff3c8';
    for (const g of GLYPH_SPOTS) glyphAt(skyGlyphs, g.id, g.x, g.y, GLYPH_SIZE, { star: 6, line: 2.5, lineOpacity: 0.45 });

    const waterId = uid('lake');
    const water = el('linearGradient', { id: waterId, x1: 0, y1: 0, x2: 0, y2: 1 }, scene.defs);
    el('stop', { offset: 0, 'stop-color': '#1a2244' }, water);
    el('stop', { offset: 1, 'stop-color': '#070b1a' }, water);
    el('rect', { x: -60, y: WATER_Y, width: SCENE_W + 120, height: SCENE_H - WATER_Y + 60, fill: url(waterId) }, back);

    // Mid: the reflection — the whole sky, upside down, with ripples.
    const rippleId = uid('ripple');
    const ripple = el('filter', { id: rippleId, x: '-10%', y: '-10%', width: '120%', height: '120%' }, scene.defs);
    el('feTurbulence', { type: 'turbulence', baseFrequency: '0.004 0.06', numOctaves: 2, seed: 4, result: 'w' }, ripple);
    const displace = el('feDisplacementMap', { in: 'SourceGraphic', in2: 'w', scale: 0, xChannelSelector: 'R', yChannelSelector: 'G' }, ripple);
    const reflection = el('g', { filter: url(rippleId), opacity: 0.8 }, mid);
    reflection.style.color = '#e9e3c8';
    starfield(reflection, { x: 0, y: WATER_Y + 10, w: SCENE_W, h: SCENE_H - WATER_Y }, 90, 21);
    const s = GLYPH_SIZE / 100;
    for (const g of GLYPH_SPOTS) {
      drawGlyph(el('g', { transform: `translate(${g.x - 50 * s} ${reflectY(g.y) + 50 * s}) scale(${s} ${-s})` }, reflection), g.id, { star: 6, line: 2.5, lineOpacity: 0.45 });
    }
    el('line', { x1: -60, y1: WATER_Y, x2: SCENE_W + 60, y2: WATER_Y, stroke: '#8b93b8', 'stroke-width': 2, opacity: 0.5 }, mid);

    // Floating things, draggable on the water.
    const floatLayer = el('g', {}, mid);
    const nodes = FLOATERS.map((f, i) => {
      const g = el('g', { class: 'floater interactive', tabindex: 0, role: 'button', 'aria-label': f.kind === 'boat' ? tr('Chiếc thuyền', 'The boat') : tr('Lá sen', 'The lotus leaf'), 'data-hint': `floater-${i}` }, floatLayer);
      if (f.kind === 'boat') {
        // A sampan with a woven canopy, wide enough to hide a reflection.
        el('path', { d: 'M-115 0 Q-115 -125 0 -130 Q115 -125 115 0 Z', fill: '#4a3426', stroke: '#2a1c12', 'stroke-width': 4 }, g);
        for (let k = -3; k <= 3; k += 1) el('path', { d: `M${k * 30} -${118 - Math.abs(k) * 8} V0`, stroke: '#5e4432', 'stroke-width': 4 }, g);
        el('path', { d: 'M-165 -4 Q0 36 165 -4 L132 52 Q0 78 -132 52 Z', fill: '#3a2a22', stroke: '#21160f', 'stroke-width': 4 }, g);
        el('path', { d: 'M-145 4 Q0 32 145 4', fill: 'none', stroke: '#6b4f36', 'stroke-width': 5 }, g);
      } else {
        el('ellipse', { cx: 0, cy: 0, rx: f.r, ry: f.r * 0.8, fill: '#1f4a33', stroke: '#123020', 'stroke-width': 3 }, g);
        el('path', { d: `M0 0 L${f.r} -14 L${f.r} 14 Z`, fill: '#0d1428' }, g);
        for (const a of [200, 250, 300, 110, 160]) {
          const r = (a * Math.PI) / 180;
          el('line', { x1: 0, y1: 0, x2: (Math.cos(r) * f.r * 0.85).toFixed(1), y2: (Math.sin(r) * f.r * 0.68).toFixed(1), stroke: '#2f6a49', 'stroke-width': 3 }, g);
        }
        if (i === 0) el('circle', { cx: -30, cy: -22, r: 18, fill: '#e8a3b8' }, g);
      }
      return g;
    });

    // Front: branches hanging over the sky, reeds at the shore.
    const leaves = el('g', { 'pointer-events': 'none' }, front);
    const rand = seeded(9);
    const blobs: [number, number, number][] = [];
    for (const g of GLYPH_SPOTS) blobs.push([g.x - 40, g.y + 10, 95], [g.x + 50, g.y - 30, 85], [g.x, g.y + 70, 80]);
    for (let i = 0; i < 38; i += 1) blobs.push([rand() * SCENE_W, -30 + rand() * 420, 50 + rand() * 70]);
    for (const [x, y, r] of blobs) el('circle', { cx: x, cy: y, r, fill: '#0a120f' }, leaves);
    for (let i = 0; i < 26; i += 1) {
      const x = rand() * SCENE_W;
      el('path', { d: `M${x} ${-10} Q${x + 20} 120 ${x - 10 + rand() * 40} ${180 + rand() * 180}`, stroke: '#0a120f', 'stroke-width': 10, fill: 'none' }, leaves);
    }
    for (let i = 0; i < 30; i += 1) {
      const x = i < 15 ? rand() * 220 : SCENE_W - rand() * 220;
      el('path', { d: `M${x} ${SCENE_H + 20} Q${x + 10} ${700} ${x + rand() * 30 - 15} ${560 + rand() * 120}`, stroke: '#0d1a14', 'stroke-width': 6, fill: 'none' }, leaves);
    }

    let amp = 0;
    let frame = 0;
    const settle = () => {
      amp *= 0.94;
      if (amp < 0.3) amp = 0;
      displace.setAttribute('scale', amp.toFixed(2));
      frame = amp > 0 ? requestAnimationFrame(settle) : 0;
    };
    const stir = (a: number) => {
      amp = Math.min(30, Math.max(amp, a));
      if (!frame) frame = requestAnimationFrame(settle);
    };

    const render = (i: number) => nodes[i].setAttribute('transform', `translate(${pos[i][0].toFixed(1)} ${pos[i][1].toFixed(1)})`);
    let wasClear = false;
    const check = () => {
      const clear = hiddenReflections(pos).length === 0;
      if (clear && !wasClear) setTimeout(() => sound.chime(), 600);
      wasClear = clear;
    };

    nodes.forEach((g, i) => {
      let grab = [0, 0];
      scene.draggable(g, {
        start: (p) => {
          grab = [p.x - pos[i][0], p.y - pos[i][1]];
          floatLayer.appendChild(g);
        },
        move: (p) => {
          pos[i] = [clamp(p.x - grab[0], -80, SCENE_W + 80), clamp(p.y - grab[1], WATER_Y + 60, SCENE_H + 40)];
          render(i);
          stir(18);
        },
        end: () => {
          stir(24);
          check();
        },
      });
      g.addEventListener('keydown', (event) => {
        const moves: Record<string, [number, number]> = { ArrowLeft: [-40, 0], ArrowRight: [40, 0], ArrowUp: [0, -30], ArrowDown: [0, 30] };
        const m = moves[event.key];
        if (!m) return;
        event.preventDefault();
        pos[i] = [clamp(pos[i][0] + m[0], -80, SCENE_W + 80), clamp(pos[i][1] + m[1], WATER_Y + 60, SCENE_H + 40)];
        render(i);
        stir(18);
        check();
      });
      render(i);
    });


    return {
      revealHints: (count) => {
        while (hinted.length < count) {
          const next = hiddenReflections(pos).find((g) => !hinted.includes(g));
          if (next === undefined) break;
          hinted.push(next);
        }
        return hinted.length;
      },
      hintSteps: (): HintStep[] => {
        const steps: HintStep[] = [];
        const sim = pos.map(([x, y]) => [x, y] as [number, number]);
        GLYPH_SPOTS.forEach((spot) => {
          const f = sim.findIndex(([x, y], k) => dist(x, y, spot.x, reflectY(spot.y)) < FLOATERS[k].r + 35);
          if (f === -1) return;
          const from = { x: sim[f][0], y: sim[f][1] };
          const to = { x: from.x > 800 ? 1500 : 100, y: from.y };
          sim[f] = [to.x, to.y];
          steps.push({
            note: tr('Kéo vật trên mặt hồ sang một bên để lộ bóng sao bên dưới.', 'Drag the things on the lake aside to uncover the starry reflections underneath.'),
            targets: [{ ...from, r: FLOATERS[f].r, verb: 'drag', to, object: `[data-hint="floater-${f}"]` }],
            apply: () => {
              pos[f] = [to.x, to.y];
              render(f);
            },
          });
        });
        steps.push({ note: tr('Bóng các chòm sao hiện dưới mặt nước, bị lộn ngược. Lật ngược lại trong đầu rồi đọc từ trái sang phải.', 'The constellations show in the water upside down. Flip them back in your head, then read from left to right.'), targets: GLYPH_SPOTS.map((s) => ({ x: s.x, y: reflectY(s.y), r: 120, verb: 'look' as const })) });
        return steps;
      },
      destroy: () => cancelAnimationFrame(frame),
    };
  },
};

