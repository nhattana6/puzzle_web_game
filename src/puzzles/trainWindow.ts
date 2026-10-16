import { url } from '../core/defs';
import { glyph, placeStars, type GlyphId } from '../core/glyphs';
import { drawOwl } from '../core/owl';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, uid } from '../core/svg';
import { clamp } from '../core/tween';
import { dist, seeded, starfield } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 5, level 1 — the night-train window ("cửa kính toa đêm"). With the compartment lit,
 * each window is a mirror of the room and the stars outside cannot be seen. Slide the dimmer
 * between the windows down: the reflection fades and the stars come out. A false constellation
 * (the reflected brass studs of the luggage rack) shows only while the lights are bright.
 * Read the three constellations, window by window, left to right.
 */

export const WINDOWS: readonly { x: number; y: number; w: number; h: number }[] = [
  { x: 160, y: 130, w: 320, h: 470 },
  { x: 640, y: 130, w: 320, h: 470 },
  { x: 1120, y: 130, w: 320, h: 470 },
];
export const GLYPH_SIZE = 160;
export const STAR_R = 5.5;
/** The real constellations outside, one per window, left to right. */
export const SKY: readonly { glyph: GlyphId; x: number; y: number }[] = [
  { glyph: 'cross', x: 320, y: 300 },
  { glyph: 'triangle', x: 800, y: 285 },
  { glyph: 'hook', x: 1280, y: 315 },
];
/** The false one: studs of the luggage rack, reflected in the middle window. */
export const FAKE = { glyph: 'dipper' as GlyphId, x: 800, y: 500, size: 124 };
export const NOISE_PER_WINDOW = 7;
/** The dimmer: a vertical slot in the wall between the first two windows. */
export const DIMMER = { x: 560, top: 210, bottom: 540 };
export const LIGHT_START = 1;
/** Where the hint takes the dimmer. */
export const LIGHT_HINT = 0.1;

/** How much of each layer shows in the glass at a light level (1 = every lamp bright, 0 = dark). */
export function glassMix(light: number): { reflect: number; stars: number; room: number } {
  const l = clamp(light, 0, 1);
  return {
    reflect: clamp((l - 0.2) / 0.4, 0, 1),
    stars: clamp((0.55 - l) / 0.35, 0, 1),
    room: (1 - l) * 0.78,
  };
}

/** The outside constellations can be read: stars fully out and the reflection gone. */
export const skyReadable = (light: number): boolean => glassMix(light).stars >= 0.85 && glassMix(light).reflect <= 0.2;
/** The reflected studs read as a constellation: the reflection is strong and the stars have not come out. */
export const fakeReadable = (light: number): boolean => glassMix(light).reflect >= 0.85 && glassMix(light).stars <= 0.2;

export const lightFromY = (y: number): number => clamp((DIMMER.bottom - y) / (DIMMER.bottom - DIMMER.top), 0, 1);
export const yFromLight = (light: number): number => DIMMER.bottom - clamp(light, 0, 1) * (DIMMER.bottom - DIMMER.top);

export const skyStars = (i: number): [number, number][] => placeStars(SKY[i].glyph, SKY[i].x, SKY[i].y, GLYPH_SIZE);
export const fakeStars = (): [number, number][] => placeStars(FAKE.glyph, FAKE.x, FAKE.y, FAKE.size);

/** Loose stars in window `i`, as bright as the constellation's own and kept clear of it. */
export function noiseDots(i: number): [number, number][] {
  const w = WINDOWS[i];
  const rand = seeded(510 + i * 7);
  const out: [number, number][] = [];
  const keepOff = skyStars(i);
  let tries = 0;
  while (out.length < NOISE_PER_WINDOW && tries < 4000) {
    tries += 1;
    const p: [number, number] = [w.x + 34 + rand() * (w.w - 68), w.y + 34 + rand() * 300];
    if (keepOff.some((s) => dist(p[0], p[1], s[0], s[1]) < 52)) continue;
    if (out.some((s) => dist(p[0], p[1], s[0], s[1]) < 46)) continue;
    out.push(p);
  }
  return out;
}

/** Sets how every lamp, reflection and star looks at this light level, in the scene or in a copy of it. */
export function paintLight(root: ParentNode, light: number): void {
  const mix = glassMix(light);
  const set = (role: string, value: number) =>
    root.querySelectorAll(`[data-role="${role}"]`).forEach((node) => node.setAttribute('opacity', value.toFixed(3)));
  set('reflect', mix.reflect * 0.9);
  set('veil', mix.reflect * 0.24);
  set('stars', mix.stars);
  set('dark', mix.room);
  set('lamp', clamp(light, 0, 1));
}

const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
/** Same timing as a drag in the hint picture: rest, slide, hold. */
const slide = (p: number) => (p < 0.2 ? 0 : p > 0.75 ? 1 : ease((p - 0.2) / 0.55));

export const trainWindow: PuzzleDef = {
  id: 'train-window',
  name: 'Cửa kính toa đêm',
  answer: SKY.map((s) => s.glyph),
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    let light = LIGHT_START;
    let lastNotch = Math.round(light * 10);

    // Back: the compartment wall, panelled below.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#2a1c26' }, back);
    el('rect', { x: -60, y: 640, width: SCENE_W + 120, height: 300, fill: '#3a2430' }, back);
    el('rect', { x: -60, y: 636, width: SCENE_W + 120, height: 10, fill: '#b98a4a', opacity: 0.55 }, back);
    scene.grain('back', 0.4);

    // Mid: window frames, bench, sconces; then the room's darkness; then the glass on top of it.
    const lampGlow = uid('lamp-glow');
    const radial = el('radialGradient', { id: lampGlow }, scene.defs);
    el('stop', { offset: 0, 'stop-color': '#ffe2a0', 'stop-opacity': 0.75 }, radial);
    el('stop', { offset: 1, 'stop-color': '#ffe2a0', 'stop-opacity': 0 }, radial);
    const roomGlow = uid('room-glow');
    const roomRadial = el('radialGradient', { id: roomGlow }, scene.defs);
    el('stop', { offset: 0, 'stop-color': '#ffdc96', 'stop-opacity': 0.9 }, roomRadial);
    el('stop', { offset: 1, 'stop-color': '#ffdc96', 'stop-opacity': 0 }, roomRadial);

    el('rect', { x: 90, y: 660, width: 1420, height: 230, rx: 34, fill: '#5e2636' }, mid);
    el('rect', { x: 90, y: 660, width: 1420, height: 26, rx: 13, fill: '#7a3347' }, mid);
    for (let i = 0; i < 9; i += 1) el('circle', { cx: 190 + i * 152, cy: 770, r: 9, fill: '#b98a4a' }, mid);
    for (const w of WINDOWS) {
      el('rect', { x: w.x - 24, y: w.y - 24, width: w.w + 48, height: w.h + 48, rx: 44, fill: '#4a3040', stroke: '#2a1a26', 'stroke-width': 6 }, mid);
      const cx = w.x + w.w / 2;
      el('path', { d: `M${cx - 30} 100 L${cx + 30} 100 L${cx + 20} 64 L${cx - 20} 64 Z`, fill: '#c99a2e' }, mid);
      el('line', { x1: cx, y1: 64, x2: cx, y2: 40, stroke: '#c99a2e', 'stroke-width': 6 }, mid);
      const lamp = el('g', { 'data-role': 'lamp', 'pointer-events': 'none' }, mid);
      el('circle', { cx, cy: 100, r: 110, fill: url(lampGlow) }, lamp);
      el('ellipse', { cx, cy: 104, rx: 22, ry: 10, fill: '#fff3c8' }, lamp);
    }
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#07050c', 'data-role': 'dark', 'pointer-events': 'none' }, mid);

    // The glass: sky and stars below, reflection of the lit room on top.
    WINDOWS.forEach((w, i) => {
      const clipId = uid('glass');
      el('rect', { x: w.x, y: w.y, width: w.w, height: w.h, rx: 28 }, el('clipPath', { id: clipId }, scene.defs));
      const glass = el('g', { 'clip-path': url(clipId) }, mid);
      const skyGrad = uid('night');
      const grad = el('linearGradient', { id: skyGrad, x1: 0, y1: 0, x2: 0, y2: 1 }, scene.defs);
      el('stop', { offset: 0, 'stop-color': '#0b1230' }, grad);
      el('stop', { offset: 1, 'stop-color': '#1d2350' }, grad);
      el('rect', { x: w.x, y: w.y, width: w.w, height: w.h, fill: url(skyGrad) }, glass);

      const stars = el('g', { 'data-role': 'stars', opacity: 0, 'pointer-events': 'none' }, glass);
      starfield(stars, { x: w.x, y: w.y, w: w.w, h: 380 }, 20, 520 + i);
      const dot = (x: number, y: number, r = STAR_R) => el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r, fill: '#fff1c4' }, stars);
      for (const [x, y] of skyStars(i)) dot(x, y);
      noiseDots(i).forEach(([x, y], k) => dot(x, y, STAR_R + (k % 3) * 0.5 - 0.5));

      el('path', {
        d: `M${w.x} ${w.y + w.h - 70} Q${w.x + 80} ${w.y + w.h - 130} ${w.x + 170} ${w.y + w.h - 80} T${w.x + w.w} ${w.y + w.h - 100} V${w.y + w.h} H${w.x} Z`,
        fill: '#060914',
      }, glass);

      // Reflection of the room: lamp glow, seat back, and in the middle window the false constellation.
      const reflect = el('g', { 'data-role': 'reflect', 'pointer-events': 'none' }, glass);
      const cx = w.x + w.w / 2;
      el('rect', { x: w.x, y: w.y, width: w.w, height: w.h, fill: '#3a2230', opacity: 0.55 }, reflect);
      el('circle', { cx, cy: w.y + 60, r: 120, fill: url(roomGlow) }, reflect);
      el('rect', { x: w.x - 20, y: w.y + w.h - 66, width: w.w + 40, height: 90, rx: 30, fill: '#6a2c3e' }, reflect);
      if (i === 0) drawOwl(reflect, cx + 20, w.y + w.h - 78, 0.8);
      if (i === 1) for (const [x, y] of fakeStars()) el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: STAR_R, fill: '#ffe9b0' }, reflect);
      el('rect', { x: w.x, y: w.y, width: w.w, height: w.h, fill: '#e9b86a', 'data-role': 'veil', opacity: 0, 'pointer-events': 'none' }, glass);
    });

    // Front: the glass edges, the owl on the bench, and the dimmer.
    for (const w of WINDOWS) {
      el('rect', { x: w.x, y: w.y, width: w.w, height: w.h, rx: 28, fill: 'none', stroke: '#1a1018', 'stroke-width': 10, 'pointer-events': 'none' }, front);
    }
    drawOwl(front, 1330, 650, 0.95);

    el('rect', { x: DIMMER.x - 62, y: DIMMER.top - 62, width: 124, height: DIMMER.bottom - DIMMER.top + 124, rx: 34, fill: '#7a5a30', stroke: '#d8b36a', 'stroke-width': 4 }, front);
    el('rect', { x: DIMMER.x - 12, y: DIMMER.top - 20, width: 24, height: DIMMER.bottom - DIMMER.top + 40, rx: 12, fill: '#24160e' }, front);
    // Big bright bulb on top, small dim one below.
    const bulb = el('g', { 'pointer-events': 'none' }, front);
    for (let k = 0; k < 8; k += 1) {
      const a = (k / 8) * Math.PI * 2;
      el('line', {
        x1: DIMMER.x + Math.cos(a) * 24, y1: 164 + Math.sin(a) * 24, x2: DIMMER.x + Math.cos(a) * 34, y2: 164 + Math.sin(a) * 34,
        stroke: '#fff0b8', 'stroke-width': 4, 'stroke-linecap': 'round',
      }, bulb);
    }
    el('circle', { cx: DIMMER.x, cy: 164, r: 15, fill: '#fff0b8' }, bulb);
    el('circle', { cx: DIMMER.x, cy: DIMMER.bottom + 46, r: 9, fill: 'none', stroke: '#d8b36a', 'stroke-width': 4 }, bulb);

    const dimmer = el('g', { class: 'dimmer interactive', tabindex: 0, role: 'slider', 'aria-label': 'Núm gạt đèn trong toa', 'aria-valuemin': 0, 'aria-valuemax': 100 }, front);
    // A wide, transparent catch area so a thumb on a phone hits the slot easily.
    el('rect', { x: DIMMER.x - 110, y: DIMMER.top - 70, width: 220, height: DIMMER.bottom - DIMMER.top + 140, fill: 'transparent' }, dimmer);
    const knob = el('g', { 'data-hint': 'dimmer-knob', 'pointer-events': 'none' }, dimmer);
    el('rect', { x: -48, y: -32, width: 96, height: 64, rx: 16, fill: '#ead3a0', stroke: '#8a6a3a', 'stroke-width': 4 }, knob);
    for (const dy of [-12, 0, 12]) el('line', { x1: -30, y1: dy, x2: 30, y2: dy, stroke: '#8a6a3a', 'stroke-width': 3, 'stroke-linecap': 'round' }, knob);

    const hintTick = el('path', { d: `M${DIMMER.x + 78} ${yFromLight(LIGHT_HINT)} l22 -14 l0 28 Z`, class: 'hint-tick', 'pointer-events': 'none' }, front);
    hintTick.style.display = 'none';

    const render = () => {
      knob.setAttribute('transform', `translate(${DIMMER.x} ${yFromLight(light).toFixed(1)})`);
      dimmer.setAttribute('aria-valuenow', String(Math.round(light * 100)));
      paintLight(scene.root, light);
      const notch = Math.round(light * 10);
      if (notch !== lastNotch) sound.tick();
      lastNotch = notch;
    };
    const setLight = (value: number) => {
      light = clamp(value, 0, 1);
      render();
    };

    scene.draggable(dimmer, {
      start: (p) => setLight(lightFromY(p.y)),
      move: (p) => setLight(lightFromY(p.y)),
    });
    dimmer.addEventListener('keydown', (event) => {
      const step = { ArrowUp: 0.05, ArrowRight: 0.05, ArrowDown: -0.05, ArrowLeft: -0.05 }[event.key];
      if (!step) return;
      event.preventDefault();
      setLight(Math.round((light + step) * 20) / 20);
    });
    render();

    return {
      revealHints: (count) => {
        hintTick.style.display = count > 0 ? '' : 'none';
        return count > 0 ? 1 : 0;
      },
      hintSteps: (): HintStep[] => {
        const startLight = light;
        const from = { x: DIMMER.x, y: yFromLight(startLight) };
        const to = { x: DIMMER.x, y: yFromLight(LIGHT_HINT) };
        return [
          {
            note: 'Kéo núm gạt giữa hai ô cửa xuống: đèn trong toa mờ dần, ảnh phản chiếu trên kính nhạt đi và các vì sao ngoài trời hiện ra.',
            targets: [
              { ...from, r: 56, verb: 'drag', to, object: '[data-hint="dimmer-knob"]' },
              { x: from.x, y: from.y, r: 0, verb: 'look', act: (picture) => (p) => paintLight(picture, startLight + (LIGHT_HINT - startLight) * slide(p)) },
            ],
            apply: () => setLight(LIGHT_HINT),
          },
          {
            note: 'Đọc ba chòm sao ở ba ô cửa từ trái sang phải; bỏ qua các chấm lẻ.',
            targets: SKY.map((s) => ({ x: s.x, y: s.y, r: 110, verb: 'look' as const })),
            prepare: (picture) => {
              const overlay = picture.querySelector('.layer-overlay') ?? picture;
              SKY.forEach((s, i) => {
                const stars = skyStars(i);
                for (const [a, b] of glyph(s.glyph).lines) {
                  el('line', { x1: stars[a][0], y1: stars[a][1], x2: stars[b][0], y2: stars[b][1], class: 'hint-line', 'pointer-events': 'none' }, overlay);
                }
                const badge = el('g', { transform: `translate(${WINDOWS[i].x + WINDOWS[i].w / 2} ${WINDOWS[i].y + 36})`, 'pointer-events': 'none' }, overlay);
                el('circle', { r: 17, class: 'number-badge' }, badge);
                el('text', { y: 1, class: 'number-text' }, badge).textContent = String(i + 1);
              });
            },
          },
        ];
      },
      destroy: () => undefined,
    };
  },
};
