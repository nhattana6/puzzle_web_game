import { url } from '../core/defs';
import { glyph, placeStars, type GlyphId } from '../core/glyphs';
import { drawOwl } from '../core/owl';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, uid } from '../core/svg';
import { clamp } from '../core/tween';
import { dist, seeded, skyGradient } from './sky';
import type { HintStep, PuzzleDef } from './types';
import { tr } from '../core/i18n';

/**
 * Level 8 — dusk ("hoàng hôn"). In daylight there are no stars. Lower the sun with the
 * time slider and the sky fills up, but each star group is only bright for a stretch
 * of the evening, and look-alike groups that are no constellation at all come and go
 * between them. The four real constellations, in the order they shine, are the answer.
 * Late in the night faint stars flood in and bury whatever is left.
 */

export const GLYPH_SIZE = 170;
/** In the order they shine (the answer order), which is not left to right. `from`..`to` is the darkness window. */
export const BATCHES: readonly { id: GlyphId; x: number; y: number; from: number; to: number }[] = [
  { id: 'cross', x: 770, y: 400, from: 0.18, to: 0.38 },
  { id: 'dipper', x: 960, y: 190, from: 0.36, to: 0.56 },
  { id: 'triangle', x: 470, y: 200, from: 0.54, to: 0.74 },
  { id: 'hook', x: 260, y: 400, from: 0.72, to: 0.92 },
];
/** Groups of stars that are not constellations, shining over other windows. */
export const DECOY_WINDOWS: readonly (readonly [number, number])[] = [
  [0.12, 0.32], [0.30, 0.5], [0.42, 0.62], [0.58, 0.8], [0.66, 0.86],
];
export const SUN_TOP = 150;
export const SUN_BOTTOM = 700;
export const HORIZON = 640;
/** The time slider on the left of the scene: the sun's height, always in view. */
export const SLIDER = { x: 70, top: SUN_TOP, bottom: SUN_BOTTOM };
/** Faint stars start to flood in at FLOOD_FROM and are all there at full night. */
export const FLOOD_FROM = 0.78;
const RAMP = 0.03;

export const darkness = (sunY: number): number => clamp((sunY - SUN_TOP) / (SUN_BOTTOM - SUN_TOP), 0, 1);
export const sunYFor = (d: number): number => SUN_TOP + d * (SUN_BOTTOM - SUN_TOP);
export const sunX = (sunY: number): number => 1200 + (sunY - SUN_TOP) * 0.3;

/** Brightness 0–1 of a group shining over [from, to] at this darkness: eases in and out. */
export function shine(d: number, from: number, to: number): number {
  return clamp(Math.min(d - from, to - d) / RAMP, 0, 1);
}
/** Indices of the real constellations bright enough to read at this darkness. */
export const readable = (d: number): number[] =>
  BATCHES.map((b, i) => ({ b, i })).filter(({ b }) => shine(d, b.from, b.to) > 0.6).map(({ i }) => i);
export const windowMid = (i: number): number => (BATCHES[i].from + BATCHES[i].to) / 2;
export const floodAmount = (d: number): number => clamp((d - FLOOD_FROM) / (1 - FLOOD_FROM), 0, 1);
/**
 * Brightness of a group over [from, to]: its own window, but in the flood of full night
 * every star that has shone comes back, the same as all the rest, so nothing stands out.
 */
export const groupBrightness = (d: number, from: number, to: number): number => Math.max(shine(d, from, to), floodAmount(d));

/** Star positions of the look-alike groups: irregular scatters, never on a constellation. */
export function decoyGroups(): [number, number][][] {
  const rand = seeded(205);
  const real = BATCHES.flatMap((b) => placeStars(b.id, b.x, b.y, GLYPH_SIZE));
  const centres: [number, number][] = BATCHES.map((b) => [b.x, b.y]);
  const groups: [number, number][][] = [];
  let tries = 0;
  while (groups.length < DECOY_WINDOWS.length && tries < 4000) {
    tries += 1;
    const c: [number, number] = [220 + rand() * 1160, 130 + rand() * 400];
    if (centres.some((o) => dist(c[0], c[1], o[0], o[1]) < 250)) continue;
    const pts: [number, number][] = [];
    let inner = 0;
    while (pts.length < 5 && inner < 200) {
      inner += 1;
      const p: [number, number] = [c[0] + (rand() - 0.5) * 190, c[1] + (rand() - 0.5) * 170];
      if (pts.some((q) => dist(p[0], p[1], q[0], q[1]) < 48)) continue;
      pts.push(p);
    }
    if (pts.length < 5 || pts.some((p) => real.some((r) => dist(p[0], p[1], r[0], r[1]) < 60))) continue;
    centres.push(c);
    groups.push(pts);
  }
  return groups;
}

/** The faint stars of full night, kept clear of the stars above so they bury rather than overlap them. */
export function faintStars(): [number, number][] {
  const rand = seeded(88);
  const bright = [...BATCHES.flatMap((b) => placeStars(b.id, b.x, b.y, GLYPH_SIZE)), ...decoyGroups().flat()];
  const out: [number, number][] = [];
  let tries = 0;
  while (out.length < 150 && tries < 9000) {
    tries += 1;
    const p: [number, number] = [150 + rand() * (SCENE_W - 190), 40 + rand() * (HORIZON - 100)];
    if (bright.some((s) => dist(p[0], p[1], s[0], s[1]) < 34)) continue;
    if (out.some((s) => dist(p[0], p[1], s[0], s[1]) < 28)) continue;
    out.push(p);
  }
  return out;
}

export const duskSky: PuzzleDef = {
  id: 'dusk-sky',
  get name() {
    return tr('Hoàng hôn', 'Dusk');
  },
  answer: BATCHES.map((b) => b.id),
  mount({ scene, sound }) {
    const { back, front } = scene.layers;
    let sunY = SUN_TOP;
    let wasReadable: number[] = [];
    const hinted: number[] = [];
    const full = { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120 };

    // Back: night under a twilight wash under the day sky; the stars sit on top of all three.
    el('rect', { ...full, fill: skyGradient(scene.defs, '#0b1030', '#2a2350') }, back);
    const twilight = el('rect', { ...full, fill: skyGradient(scene.defs, '#2b2560', '#d9785a') }, back);
    const day = el('rect', { ...full, fill: skyGradient(scene.defs, '#7fb6e6', '#f6dcaa') }, back);
    const starsG = el('g', {}, back);
    const dotsGroup = (pts: readonly (readonly [number, number])[]) => {
      const g = el('g', { opacity: 0 }, starsG);
      for (const [x, y] of pts) el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 6.5, class: 'dusk-star' }, g);
      return g;
    };
    const batchNodes = BATCHES.map((b) => dotsGroup(placeStars(b.id, b.x, b.y, GLYPH_SIZE)));
    const decoyNodes = decoyGroups().map(dotsGroup);
    const faint = el('g', { opacity: 0 }, starsG);
    const rand = seeded(89);
    for (const [x, y] of faintStars()) el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: (5.5 + rand()).toFixed(1), class: 'dusk-star' }, faint);
    const hintLines = el('g', {}, back);

    // Front: the sun sinks behind the hills.
    const glowId = uid('afterglow');
    const glow = el('radialGradient', { id: glowId }, scene.defs);
    el('stop', { offset: 0, 'stop-color': '#ffb36b', 'stop-opacity': 0.75 }, glow);
    el('stop', { offset: 1, 'stop-color': '#ffb36b', 'stop-opacity': 0 }, glow);
    const afterglow = el('ellipse', { cy: HORIZON, rx: 280, ry: 110, fill: url(glowId), 'pointer-events': 'none' }, front);
    const sun = el('g', { class: 'dusk-sun interactive', 'pointer-events': 'none' }, front);
    el('circle', { r: 75, class: 'sun-halo' }, sun);
    const disc = el('circle', { r: 55, class: 'sun-disc' }, sun);
    const hills = el('g', { 'pointer-events': 'none' }, front);
    el('path', { d: `M-60 ${HORIZON + 20} Q200 ${HORIZON - 70} 470 ${HORIZON - 10} T980 ${HORIZON - 20} T1660 ${HORIZON - 30} L1660 960 L-60 960 Z`, fill: '#2f2a4a' }, hills);
    el('path', { d: `M-60 ${HORIZON + 90} Q300 ${HORIZON + 10} 700 ${HORIZON + 70} T1660 ${HORIZON + 40} L1660 960 L-60 960 Z`, fill: '#221d38' }, hills);
    el('rect', { x: 1490, y: 470, width: 18, height: 200, fill: '#1a1530' }, hills);
    el('circle', { cx: 1499, cy: 450, r: 70, fill: '#1a1530' }, hills);
    drawOwl(hills, 1499, 528, 0.55);

    // The time slider, drawn over the hills so it can always be found: sun above, moon below.
    const track = el('g', { class: 'time-slider interactive', tabindex: 0, role: 'slider', 'aria-label': tr('Thời gian trong ngày', 'Time of day'), 'aria-valuemin': 0, 'aria-valuemax': 100 }, front);
    el('rect', { x: SLIDER.x - 44, y: SLIDER.top - 54, width: 88, height: SLIDER.bottom - SLIDER.top + 108, rx: 44, class: 'slider-bed' }, track);
    el('line', { x1: SLIDER.x, y1: SLIDER.top, x2: SLIDER.x, y2: SLIDER.bottom, class: 'slider-line' }, track);
    const topIcon = el('g', { transform: `translate(${SLIDER.x} ${SLIDER.top - 28})`, class: 'slider-sun' }, track);
    el('circle', { r: 8 }, topIcon);
    for (let k = 0; k < 8; k += 1) el('line', { x1: Math.cos((k * Math.PI) / 4) * 13, y1: Math.sin((k * Math.PI) / 4) * 13, x2: Math.cos((k * Math.PI) / 4) * 18, y2: Math.sin((k * Math.PI) / 4) * 18 }, topIcon);
    el('path', { d: `M${SLIDER.x + 8} ${SLIDER.bottom + 18} a14 14 0 1 1 -14 -22 a11 11 0 0 0 14 22 Z`, class: 'slider-moon' }, track);
    const ghost = el('circle', { cx: SLIDER.x, r: 40, class: 'ghost-mark', opacity: 0 }, track);
    const handle = el('g', { class: 'slider-handle', 'data-hint': 'slider-handle' }, track);
    el('circle', { r: 28, class: 'handle-glow' }, handle);
    el('circle', { r: 17, class: 'sun-disc' }, handle);

    const drawHintLines = (out: readonly number[]) => {
      hintLines.replaceChildren();
      for (const i of hinted) {
        if (!out.includes(i)) continue;
        const pts = placeStars(BATCHES[i].id, BATCHES[i].x, BATCHES[i].y, GLYPH_SIZE);
        for (const [a, b] of glyph(BATCHES[i].id).lines) {
          el('line', { x1: pts[a][0], y1: pts[a][1], x2: pts[b][0], y2: pts[b][1], class: 'hint-line' }, hintLines);
        }
      }
    };
    const waitingHint = (out: readonly number[]) => hinted.find((i) => !out.includes(i));
    const render = () => {
      const d = darkness(sunY);
      const x = sunX(sunY);
      sun.setAttribute('transform', `translate(${x.toFixed(1)} ${sunY.toFixed(1)})`);
      handle.setAttribute('transform', `translate(${SLIDER.x} ${sunY.toFixed(1)})`);
      track.setAttribute('aria-valuenow', String(Math.round(d * 100)));
      disc.classList.toggle('low', d > 0.3);
      afterglow.setAttribute('cx', x.toFixed(1));
      afterglow.setAttribute('opacity', clamp(1 - Math.abs(d - 0.45) / 0.45, 0, 1).toFixed(2));
      day.setAttribute('opacity', clamp(1 - d / 0.22, 0, 1).toFixed(3));
      twilight.setAttribute('opacity', clamp(1 - (d - 0.2) / 0.5, 0, 1).toFixed(3));
      BATCHES.forEach((b, i) => batchNodes[i].setAttribute('opacity', groupBrightness(d, b.from, b.to).toFixed(2)));
      decoyNodes.forEach((g, i) => g.setAttribute('opacity', groupBrightness(d, DECOY_WINDOWS[i][0], DECOY_WINDOWS[i][1]).toFixed(2)));
      faint.setAttribute('opacity', floodAmount(d).toFixed(2));
      const out = readable(d);
      if (out.some((i) => !wasReadable.includes(i))) sound.chime();
      wasReadable = out;
      drawHintLines(out);
      const waiting = waitingHint(out);
      if (waiting === undefined) ghost.setAttribute('opacity', '0');
      else {
        ghost.setAttribute('cy', sunYFor(windowMid(waiting)).toFixed(1));
        ghost.setAttribute('opacity', '1');
      }
    };

    let grab = 0;
    scene.draggable(track, {
      // Grabbing the handle keeps its offset; grabbing the track elsewhere jumps the sun there.
      start: (p) => {
        grab = Math.abs(p.y - sunY) < 40 ? p.y - sunY : 0;
        sunY = clamp(p.y - grab, SUN_TOP, SUN_BOTTOM);
        render();
      },
      move: (p) => {
        sunY = clamp(p.y - grab, SUN_TOP, SUN_BOTTOM);
        render();
      },
    });
    track.addEventListener('keydown', (event) => {
      const step = { ArrowDown: 10, ArrowRight: 10, ArrowUp: -10, ArrowLeft: -10 }[event.key];
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
      hintSteps: (): HintStep[] => {
        // Short: show the slider move once, then the first real constellation; the rest repeat.
        const to = sunYFor(windowMid(0));
        return [
          {
            note: tr('Kéo núm thời gian xuống thật chậm. Trời tối dần và từng nhóm sao sáng lên rồi mờ đi.', 'Drag the time knob down very slowly. The sky darkens, and groups of stars light up one by one, then fade.'),
            targets: [{ x: SLIDER.x, y: sunY, r: 50, verb: 'drag', to: { x: SLIDER.x, y: to }, object: '[data-hint="slider-handle"]' }],
            apply: () => {
              sunY = to;
              render();
            },
          },
          {
            note: tr('Mỗi lúc chỉ có một chòm sao thật đang sáng (chỗ phát sáng); các cụm khác là sao giả. Kéo tiếp để thấy 3 chòm còn lại. Thứ tự sáng lên chính là đáp án.', 'At any moment only one real constellation is lit (the glowing spot); the other clusters are fake. Keep dragging to see the other 3. The order they light up in is the answer.'),
            targets: [{ x: BATCHES[0].x, y: BATCHES[0].y, r: 125, verb: 'look' }],
          },
        ];
      },
      destroy: () => undefined,
    };
  },
};
