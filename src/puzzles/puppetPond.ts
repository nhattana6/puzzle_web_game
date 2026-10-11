import { url } from '../core/defs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, uid } from '../core/svg';
import { tween } from '../core/tween';
import { drawZodiac } from '../core/zodiac';
import type { PuzzleDef } from './types';

/**
 * Chapter 2 preview — the water-puppet pond ("ao rối nước").
 * Each red puppet is an upside-down slice of a silhouette: meaningless in the air,
 * but its reflection in the still water is upright. Line the puppets up in the
 * right order and the reflections join into one animal.
 */

export const SLOTS: readonly number[] = [500, 650, 800, 950, 1100];
export const INITIAL_SLOTS: readonly number[] = [3, 0, 2];

/** Solved when the puppets stand in adjacent slots, in order, anywhere along the pond. */
export const isPondSolved = (slots: readonly number[]): boolean =>
  slots.every((slot, i) => i === 0 || slot === slots[i - 1] + 1);

/** Moves a puppet to a slot; a puppet already there swaps into the mover's old slot. */
export function dropPuppet(slots: readonly number[], puppet: number, target: number): number[] {
  const next = [...slots];
  const occupant = next.indexOf(target);
  if (occupant !== -1 && occupant !== puppet) next[occupant] = next[puppet];
  next[puppet] = target;
  return next;
}

export const nearestSlot = (x: number): number =>
  SLOTS.reduce((best, slotX, i) => (Math.abs(slotX - x) < Math.abs(SLOTS[best] - x) ? i : best), 0);

const WATER_Y = 540;
const SCALE = 4.5;
const PIECES = INITIAL_SLOTS.length;
const BAND = 100 / PIECES;
const BAND_PX = BAND * SCALE;
const TOP = 18; // highest point of the silhouette, kept next to the waterline

export const puppetPond: PuzzleDef = {
  id: 'c2-puppet-pond',
  chapter: 2,
  name: 'Ao rối nước',
  answer: ['dragon'],
  fireflies: [
    { id: 'c2-puppet-pond/hills', layer: 'back', x: 1420, y: 250 },
    { id: 'c2-puppet-pond/water', layer: 'mid', x: 190, y: 700 },
  ],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const animal = this.answer[0];
    let slots = [...INITIAL_SLOTS];
    const positions = slots.map((s) => SLOTS[s]);
    const cancels: (() => void)[] = [];

    // Back: dusk sky, hills and the water pavilion.
    const skyId = uid('sky');
    const sky = el('linearGradient', { id: skyId, x1: 0, y1: 0, x2: 0, y2: 1 }, scene.defs);
    el('stop', { offset: 0, 'stop-color': '#f1e4c8' }, sky);
    el('stop', { offset: 1, 'stop-color': '#d8b48a' }, sky);
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: WATER_Y + 80, fill: url(skyId) }, back);
    el('path', { d: 'M-60 470 Q200 330 420 420 Q640 300 900 410 Q1180 290 1660 430 L1660 560 L-60 560 Z', fill: '#a89274', opacity: 0.55 }, back);
    el('rect', { x: 600, y: 452, width: 400, height: 22, fill: '#2b2622' }, back);
    for (const x of [632, 732, 856, 956]) el('rect', { x, y: 372, width: 12, height: 84, fill: '#2b2622' }, back);
    el('rect', { x: 645, y: 382, width: 310, height: 66, fill: '#c9a66b' }, back);
    for (let x = 650; x < 955; x += 9) el('line', { x1: x, y1: 382, x2: x, y2: 448, stroke: '#a3824a', 'stroke-width': 2 }, back);
    el('path', { d: 'M555 384 Q620 372 650 340 L950 340 Q980 372 1045 384 L1012 392 L588 392 Z', fill: '#8e2d22' }, back);
    el('rect', { x: 690, y: 318, width: 220, height: 24, fill: '#2b2622' }, back);
    el('path', { d: 'M640 318 Q690 308 712 276 L888 276 Q910 308 960 318 L940 326 L660 326 Z', fill: '#8e2d22' }, back);
    scene.grain('back', 0.8);

    // Mid: water with rippling reflections.
    const waterId = uid('water');
    const water = el('linearGradient', { id: waterId, x1: 0, y1: 0, x2: 0, y2: 1 }, scene.defs);
    el('stop', { offset: 0, 'stop-color': '#6d7a6f' }, water);
    el('stop', { offset: 1, 'stop-color': '#2c3532' }, water);
    el('rect', { x: -60, y: WATER_Y, width: SCENE_W + 120, height: SCENE_H - WATER_Y + 80, fill: url(waterId) }, mid);

    const waterClipId = uid('water-clip');
    el('rect', { x: -60, y: WATER_Y, width: SCENE_W + 120, height: SCENE_H }, el('clipPath', { id: waterClipId }, scene.defs));
    const rippleId = uid('ripple');
    const ripple = el('filter', { id: rippleId, x: '-10%', y: '-10%', width: '120%', height: '120%' }, scene.defs);
    el('feTurbulence', { type: 'turbulence', baseFrequency: '0.004 0.05', numOctaves: 2, seed: 3, result: 'waves' }, ripple);
    const displace = el('feDisplacementMap', { in: 'SourceGraphic', in2: 'waves', scale: 0, xChannelSelector: 'R', yChannelSelector: 'G' }, ripple);

    const reflections = el('g', { 'clip-path': url(waterClipId) }, mid);
    const rippled = el('g', { filter: url(rippleId), opacity: 0.85 }, reflections);
    rippled.style.color = '#8a3326';
    for (let i = 0; i < 6; i += 1) {
      el('line', { x1: 120 + i * 260, y1: WATER_Y + 40 + (i % 3) * 90, x2: 260 + i * 260, y2: WATER_Y + 40 + (i % 3) * 90, stroke: '#dfe8dc', 'stroke-width': 2, opacity: 0.18 }, mid);
    }
    el('line', { x1: -60, y1: WATER_Y, x2: SCENE_W + 60, y2: WATER_Y, stroke: '#e8dcc0', 'stroke-width': 2, opacity: 0.5 }, mid);
    scene.grain('mid', 0.5);

    const bandClips = Array.from({ length: PIECES }, (_, i) => {
      const id = uid('slice');
      el('rect', { x: i * BAND - 0.05, y: -20, width: BAND + 0.1, height: 140 }, el('clipPath', { id }, scene.defs));
      return id;
    });
    const sliceX = (i: number) => -(i + 0.5) * BAND_PX;

    const reflectionSlices = bandClips.map((clipId, i) => {
      const outer = el('g', {}, rippled);
      const inner = el('g', { transform: `translate(${sliceX(i)} ${WATER_Y + 6 - TOP * SCALE}) scale(${SCALE})` }, outer);
      drawZodiac(el('g', { 'clip-path': url(clipId) }, inner), animal);
      return outer;
    });
    const ghost = el('g', {
      opacity: 0,
      transform: `translate(${SLOTS[1] + sliceX(0)} ${WATER_Y + 6 - TOP * SCALE}) scale(${SCALE})`,
    }, reflections);
    ghost.style.color = '#f1e4c8';
    drawZodiac(ghost, animal);

    // Front: the puppets, mirror images of the reflections.
    const puppets = bandClips.map((clipId, i) => {
      const outer = el('g', { class: 'puppet interactive', tabindex: 0, role: 'button', 'aria-label': `Con rối ${i + 1}` }, front);
      el('rect', { x: -BAND_PX / 2 - 10, y: 240, width: BAND_PX + 20, height: WATER_Y - 230, fill: 'transparent' }, outer);
      el('ellipse', { cx: 0, cy: WATER_Y, rx: BAND_PX / 2 - 8, ry: 9, fill: '#5a4636' }, outer);
      const inner = el('g', {
        transform: `translate(${sliceX(i)} ${WATER_Y - 6 + TOP * SCALE}) scale(${SCALE} ${-SCALE})`,
        stroke: '#e0a948', 'stroke-width': 0.7,
      }, outer);
      inner.style.color = '#c23f2d';
      drawZodiac(el('g', { 'clip-path': url(clipId) }, inner), animal);
      return outer;
    });

    let rippleAmp = 0;
    let frame = 0;
    const animateRipple = () => {
      rippleAmp *= 0.95;
      if (rippleAmp < 0.3) rippleAmp = 0;
      displace.setAttribute('scale', rippleAmp.toFixed(2));
      frame = rippleAmp > 0 ? requestAnimationFrame(animateRipple) : 0;
    };
    const stir = (amount: number) => {
      rippleAmp = Math.min(40, Math.max(rippleAmp, amount));
      if (!frame) frame = requestAnimationFrame(animateRipple);
    };

    const render = (i: number) => {
      const t = `translate(${positions[i].toFixed(1)} 0)`;
      puppets[i].setAttribute('transform', t);
      reflectionSlices[i].setAttribute('transform', t);
    };

    let solved = isPondSolved(slots);
    const settle = (moved: number) => {
      slots.forEach((slot, i) => {
        const from = positions[i];
        const to = SLOTS[slot];
        if (from === to) return;
        cancels[i]?.();
        cancels[i] = tween(i === moved ? 180 : 320, (t) => {
          positions[i] = from + (to - from) * t;
          render(i);
        });
      });
      sound.knock();
      const now = isPondSolved(slots);
      if (now && !solved) setTimeout(() => sound.chime(), 900);
      solved = now;
    };

    puppets.forEach((puppet, i) => {
      let grab = 0;
      scene.draggable(puppet, {
        start: (p) => {
          cancels[i]?.();
          grab = p.x - positions[i];
          front.appendChild(puppet);
        },
        move: (p) => {
          positions[i] = Math.min(SLOTS[SLOTS.length - 1] + 60, Math.max(SLOTS[0] - 60, p.x - grab));
          render(i);
          stir(26);
        },
        end: () => {
          slots = dropPuppet(slots, i, nearestSlot(positions[i]));
          settle(i);
          stir(30);
        },
      });
      puppet.addEventListener('keydown', (event) => {
        const delta = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
        if (!delta) return;
        event.preventDefault();
        const target = slots[i] + delta;
        if (target < 0 || target >= SLOTS.length) return;
        slots = dropPuppet(slots, i, target);
        settle(i);
        stir(30);
      });
      render(i);
    });

    return {
      hintTargets: () => positions.map((x) => ({ x, y: 400, r: 95, verb: 'drag' as const })),
      showGhost: () => ghost.setAttribute('opacity', '0.25'),
      destroy: () => {
        cancels.forEach((cancel) => cancel?.());
        cancelAnimationFrame(frame);
      },
    };
  },
};
