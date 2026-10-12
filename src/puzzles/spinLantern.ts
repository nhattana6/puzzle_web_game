import { drawOwl } from '../core/owl';
import { glyph, placeStars, type GlyphId } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el } from '../core/svg';
import { clamp } from '../core/tween';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 2, level 6 — the spinning lantern ("đèn kéo quân"). A paper lantern of four
 * tiers, each a dark window where one dot at a time jumps from place to place. Spin the
 * fan on top (drag it round and let go; it keeps turning and slows down by itself) and at
 * the right speed the eye holds all of a tier's dots at once, which is a constellation of
 * plain dots; each tier has its own speed, and too fast blurs everything. The tiers are
 * read from top to bottom, not in the order they come clear. Nothing is lit or marked.
 */

export interface Tier {
  glyph: GlyphId;
  /** The speed (0..1) at which this tier's dots are held all at once. */
  centre: number;
}

/** Top to bottom. The order they come clear when spinning up is diamond, belt, crown, hook. */
export const TIERS: readonly Tier[] = [
  { glyph: 'belt', centre: 0.4 },
  { glyph: 'hook', centre: 0.8 },
  { glyph: 'diamond', centre: 0.2 },
  { glyph: 'crown', centre: 0.6 },
];
/** Half-width of the range of speeds around a tier's centre in which it comes clear. */
export const HALF = 0.1;
/** Past this speed every dot smears into a streak. */
export const BLUR_FROM = 0.93;

/** How clearly a tier shows all its dots at once at speed s, 0..1. */
export const clarity = (tier: number, s: number): number => clamp(1 - Math.abs(s - TIERS[tier].centre) / HALF, 0, 1);
export const blur = (s: number): number => clamp((s - BLUR_FROM) / (1 - BLUR_FROM), 0, 1);
/** How fast the single dots jump, frames per second. */
export const frameRate = (s: number): number => 1.5 + 8 * s;

/** The opacity of star `star` of a tier showing frame `frame`, at speed s. */
export function dotOpacity(tier: number, star: number, s: number, frame: number): number {
  const lit = Math.max(star === frame ? 1 : 0, clarity(tier, s));
  return lit * (1 - blur(s));
}

export const OMEGA_MAX = 14; // rad/s of dragging round the fan that counts as full speed
const FRICTION = 0.12;
const FRICTION_PROP = 0.05;

/**
 * One step of the lantern's speed: while the fan is being turned by hand it follows the hand
 * (`driven` is the hand's speed 0..1), otherwise it slows down on its own.
 */
export function spinStep(s: number, driven: number | null, dt: number): number {
  if (driven !== null) return clamp(s + (driven - s) * Math.min(1, dt * 8), 0, 1);
  return clamp(s - (FRICTION + FRICTION_PROP * s) * dt, 0, 1);
}

/** The reading: tiers from top to bottom. */
export const READING_TIERS: readonly number[] = TIERS.map((_, i) => i);

const FAN = { x: 800, y: 96 };
const TIER_H = 150;
const TOP = 176;
const WINDOW = { w: 340, h: 112 };
const GLYPH_SIZE = 100;
export const tierCentre = (t: number): [number, number] => [800, TOP + t * TIER_H + TIER_H / 2];
export const tierStars = (t: number): [number, number][] => placeStars(TIERS[t].glyph, ...tierCentre(t), GLYPH_SIZE);

export const spinLantern: PuzzleDef = {
  id: 'spin-lantern',
  name: 'Đèn kéo quân',
  answer: READING_TIERS.map((t) => TIERS[t].glyph),
  fireflies: [
    { id: 'spin-lantern/beam', layer: 'back', x: 210, y: 170 },
    { id: 'spin-lantern/floor', layer: 'front', x: 1330, y: 835 },
  ],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    let speed = 0;
    let phase = 0;
    let fanAngle = 0;
    let handOmega = 0;
    let handAt = -1e9;
    let dragging = false;

    // Back: the attic wall.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#241a17' }, back);
    for (let x = 80; x < SCENE_W; x += 160) el('line', { x1: x, y1: -20, x2: x, y2: SCENE_H + 20, stroke: '#1a1210', 'stroke-width': 4 }, back);
    el('rect', { x: -60, y: 828, width: SCENE_W + 120, height: 120, fill: '#3a2a22' }, back);
    scene.grain('back', 0.4);

    // Mid: the lantern, tier by tier, and the fan on top.
    el('line', { x1: FAN.x, y1: 0, x2: FAN.x, y2: FAN.y - 50, stroke: '#8a6a48', 'stroke-width': 4 }, mid);
    el('path', { d: `M${590} ${TOP - 4} L${1010} ${TOP - 4} L${970} ${TOP - 40} L${630} ${TOP - 40} Z`, fill: '#5a3f2a', stroke: '#3a2818', 'stroke-width': 4 }, mid);
    const dots: SVGCircleElement[][] = [];
    TIERS.forEach((_, t) => {
      const y = TOP + t * TIER_H;
      el('rect', { x: 560, y, width: 480, height: TIER_H, fill: '#c9a56a', stroke: '#8a6a2c', 'stroke-width': 5 }, mid);
      el('rect', { x: 560, y, width: 480, height: 14, fill: '#8a5a2a' }, mid);
      el('rect', { x: 560, y: y + TIER_H - 14, width: 480, height: 14, fill: '#8a5a2a' }, mid);
      const wy = y + (TIER_H - WINDOW.h) / 2;
      el('rect', { x: 800 - WINDOW.w / 2, y: wy, width: WINDOW.w, height: WINDOW.h, rx: 6, fill: '#150f0d', stroke: '#5a3f2a', 'stroke-width': 4 }, mid);
      el('rect', { x: 800 - WINDOW.w / 2 + 8, y: wy + WINDOW.h / 2 - 10, width: WINDOW.w - 16, height: 20, rx: 10, fill: '#f6efd8', style: 'opacity: 0', 'pointer-events': 'none', 'data-streak': t }, mid);
      dots[t] = tierStars(t).map(([x, yy], k) => el('circle', {
        cx: x.toFixed(1), cy: yy.toFixed(1), r: 7, fill: '#fff3d0', style: 'opacity: 0', 'data-dot': `${t}-${k}`, 'pointer-events': 'none',
      }, mid));
    });
    el('path', { d: `M560 ${TOP + 4 * TIER_H} L1040 ${TOP + 4 * TIER_H} L1000 ${TOP + 4 * TIER_H + 34} L600 ${TOP + 4 * TIER_H + 34} Z`, fill: '#5a3f2a', stroke: '#3a2818', 'stroke-width': 4 }, mid);

    // The fan: four paper blades on a hub. Drag it round; tap to give it a push.
    const fan = el('g', { class: 'fan interactive', tabindex: 0, role: 'button', 'aria-label': 'Cánh quạt: kéo vòng tròn hoặc bấm để quay', 'data-hint': 'fan', transform: `translate(${FAN.x} ${FAN.y})` }, mid);
    el('circle', { r: 86, fill: 'transparent' }, fan);
    const blades = el('g', {}, fan);
    for (let b = 0; b < 4; b += 1) {
      el('path', { d: 'M0 0 Q34 -16 72 -4 Q40 28 0 0 Z', fill: b % 2 ? '#e8dcc0' : '#d6c4a0', stroke: '#8a6a48', 'stroke-width': 3, transform: `rotate(${b * 90})` }, blades);
    }
    el('circle', { r: 11, fill: '#8a6a48', 'pointer-events': 'none' }, fan);
    drawOwl(front, 330, 790, 0.9);

    const streaks = [...mid.querySelectorAll<SVGRectElement>('[data-streak]')];
    const render = () => {
      TIERS.forEach((_, t) => {
        const f = Math.floor(phase + t * 1.3) % dots[t].length;
        dots[t].forEach((d, k) => {
          d.style.opacity = dotOpacity(t, k, speed, f).toFixed(3);
        });
      });
      streaks.forEach((r) => { r.style.opacity = (blur(speed) * 0.35).toFixed(3); });
      blades.setAttribute('transform', `rotate(${(fanAngle % 360).toFixed(1)})`);
    };

    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const driven = dragging ? clamp((now - handAt < 140 ? handOmega : 0) / OMEGA_MAX, 0, 1) : null;
      speed = spinStep(speed, driven, dt);
      phase += frameRate(speed) * dt;
      fanAngle += speed * 900 * dt;
      render();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Turning the fan by hand: its speed follows how fast the pointer goes round it.
    let lastAngle = 0;
    let lastAt = 0;
    let travelled = 0;
    scene.draggable(fan, {
      start: (p) => {
        dragging = true;
        lastAngle = Math.atan2(p.y - FAN.y, p.x - FAN.x);
        lastAt = performance.now();
        travelled = 0;
        handOmega = 0;
        handAt = lastAt;
      },
      move: (p) => {
        const now = performance.now();
        const a = Math.atan2(p.y - FAN.y, p.x - FAN.x);
        let d = a - lastAngle;
        if (d > Math.PI) d -= 2 * Math.PI;
        if (d < -Math.PI) d += 2 * Math.PI;
        const dt = Math.max(0.008, (now - lastAt) / 1000);
        handOmega = handOmega * 0.6 + (Math.abs(d) / dt) * 0.4;
        handAt = now;
        travelled += Math.abs(d);
        lastAngle = a;
        lastAt = now;
      },
      end: () => {
        dragging = false;
        // A tap rather than a turn: give it a push.
        if (travelled < 0.35) speed = Math.min(1, speed + 0.18);
        sound.paper();
      },
    });
    fan.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowUp' || event.key === 'ArrowRight' || event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        speed = Math.min(1, speed + 0.08);
      }
    });
    render();

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => [
        {
          note: 'Kéo cánh quạt trên đỉnh quay vòng rồi thả: đèn quay nhanh dần rồi chậm lại. Mỗi tầng chỉ hiện đủ chấm ở một tốc độ riêng; quay quá nhanh thì nhoè hết.',
          targets: [{
            x: FAN.x, y: FAN.y, r: 80, verb: 'rotate', turn: 720, object: '[data-hint="fan"]',
            act: (picture) => {
              const nodes = TIERS.map((_, t) => [...picture.querySelectorAll<SVGCircleElement>(`[data-dot^="${t}-"]`)]);
              return (p) => {
                const s = p * 0.97;
                nodes.forEach((list, t) => list.forEach((d, k) => {
                  d.style.opacity = dotOpacity(t, k, s, Math.floor(p * 40 + t) % list.length).toFixed(3);
                }));
              };
            },
          }],
        },
        {
          note: 'Đọc các tầng từ trên xuống dưới (không phải thứ tự chúng hiện rõ). Nối các chấm của mỗi tầng trong đầu thành chòm.',
          targets: TIERS.map((_, t) => ({ x: tierCentre(t)[0], y: tierCentre(t)[1], r: 90, verb: 'look' as const })),
          prepare: (picture) => {
            picture.querySelectorAll<SVGCircleElement>('[data-dot]').forEach((d) => { d.style.opacity = '1'; });
            const overlay = picture.querySelector('.layer-overlay') ?? picture;
            TIERS.forEach((tier, t) => {
              const stars = tierStars(t);
              for (const [a, b] of glyph(tier.glyph).lines) {
                el('line', { x1: stars[a][0], y1: stars[a][1], x2: stars[b][0], y2: stars[b][1], class: 'hint-line', 'pointer-events': 'none' }, overlay);
              }
            });
          },
        },
      ],
      destroy: () => cancelAnimationFrame(raf),
    };
  },
};
