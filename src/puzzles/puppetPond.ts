import { url } from '../core/defs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, pips, uid } from '../core/svg';
import { tween } from '../core/tween';
import { drawZodiac, type ZodiacId } from '../core/zodiac';
import type { PuzzleDef } from './types';

/**
 * Chapter 2 preview — the water-puppet pond ("ao rối nước").
 * Six red puppets, each an upside-down half of an animal: meaningless in the air,
 * but their reflections in the still water are upright. When an animal's left
 * and right halves stand side by side in the right order, its reflection joins
 * up and bubbles rise beside it, giving its place in the answer.
 */

export interface PondAnimal {
  animal: ZodiacId;
  /** Highest point of the silhouette (box units), kept next to the waterline. */
  top: number;
  /** Place in the answer, shown as bubbles once the animal is whole. */
  order: number;
}

export const ANIMALS: readonly PondAnimal[] = [
  { animal: 'dragon', top: 18, order: 2 },
  { animal: 'snake', top: 24, order: 3 },
  { animal: 'monkey', top: 24, order: 1 },
];
/** Puppet p is half (p % 2) of animal floor(p / 2): 0 = left half, 1 = right half. */
export const PUPPETS = ANIMALS.length * 2;
export const SLOTS: readonly number[] = Array.from({ length: PUPPETS }, (_, i) => 300 + i * 200);
/** Slot of each puppet at the start: no animal is whole. */
export const INITIAL_SLOTS: readonly number[] = [3, 0, 5, 2, 1, 4];

export const isAnimalWhole = (slots: readonly number[], animal: number): boolean =>
  slots[animal * 2 + 1] === slots[animal * 2] + 1;

export const isPondSolved = (slots: readonly number[]): boolean =>
  ANIMALS.every((_, a) => isAnimalWhole(slots, a));

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
const SPACING = SLOTS[1] - SLOTS[0];
const SCALE = SPACING / 50; // half a silhouette (50 units) spans one slot

export const puppetPond: PuzzleDef = {
  id: 'c2-puppet-pond',
  chapter: 2,
  name: 'Ao rối nước',
  answer: [...ANIMALS].sort((a, b) => a.order - b.order).map((a) => a.animal),
  fireflies: [
    { id: 'c2-puppet-pond/hills', layer: 'back', x: 1460, y: 200 },
    { id: 'c2-puppet-pond/water', layer: 'mid', x: 1500, y: 620 },
  ],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
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

    const halfClips = [0, 1].map((half) => {
      const id = uid('half');
      el('rect', { x: half * 50 - 0.05, y: -20, width: 50.1, height: 140 }, el('clipPath', { id }, scene.defs));
      return id;
    });
    // Each half is drawn so its own slot centre is the puppet's origin.
    const sliceX = (half: number) => -(half + 0.5) * 50 * SCALE;

    const reflectionSlices = Array.from({ length: PUPPETS }, (_, p) => {
      const { animal, top } = ANIMALS[Math.floor(p / 2)];
      const outer = el('g', {}, rippled);
      const inner = el('g', { transform: `translate(${sliceX(p % 2)} ${WATER_Y + 6 - top * SCALE}) scale(${SCALE})` }, outer);
      drawZodiac(el('g', { 'clip-path': url(halfClips[p % 2]) }, inner), animal);
      return outer;
    });
    // Bubbles ride with each animal's right half, at the seam between the halves.
    const bubbles = ANIMALS.map((a, i) =>
      pips(reflectionSlices[i * 2 + 1], a.order, -SPACING / 2, WATER_Y + 320, 9, 28, { opacity: 0, fill: '#e9f1e6', class: 'pips bubbles' }));
    const ghost = el('g', { opacity: 0 }, reflections);
    ghost.style.color = '#f1e4c8';
    ANIMALS.forEach((a, i) => {
      drawZodiac(el('g', {
        transform: `translate(${SLOTS[i * 2] - 25 * SCALE} ${WATER_Y + 6 - a.top * SCALE}) scale(${SCALE})`,
      }, ghost), a.animal);
    });

    // Front: the puppets, mirror images of the reflections.
    const puppets = Array.from({ length: PUPPETS }, (_, p) => {
      const { animal, top } = ANIMALS[Math.floor(p / 2)];
      const outer = el('g', { class: 'puppet interactive', tabindex: 0, role: 'button', 'aria-label': `Con rối ${p + 1}` }, front);
      el('rect', { x: -SPACING / 2 + 6, y: 240, width: SPACING - 12, height: WATER_Y - 230, fill: 'transparent' }, outer);
      el('ellipse', { cx: 0, cy: WATER_Y, rx: SPACING / 2 - 16, ry: 9, fill: '#5a4636' }, outer);
      const inner = el('g', {
        transform: `translate(${sliceX(p % 2)} ${WATER_Y - 6 + top * SCALE}) scale(${SCALE} ${-SCALE})`,
        stroke: '#e0a948', 'stroke-width': 0.7,
      }, outer);
      inner.style.color = '#c23f2d';
      drawZodiac(el('g', { 'clip-path': url(halfClips[p % 2]) }, inner), animal);
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

    const render = (p: number) => {
      const t = `translate(${positions[p].toFixed(1)} 0)`;
      puppets[p].setAttribute('transform', t);
      reflectionSlices[p].setAttribute('transform', t);
    };

    const whole = ANIMALS.map((_, a) => isAnimalWhole(slots, a));
    const showBubbles = () => {
      ANIMALS.forEach((_, a) => {
        const now = isAnimalWhole(slots, a);
        bubbles[a].setAttribute('opacity', now ? '1' : '0');
        if (now && !whole[a]) setTimeout(() => sound.chime(), 700);
        whole[a] = now;
      });
    };

    const settle = (moved: number) => {
      slots.forEach((slot, p) => {
        const from = positions[p];
        const to = SLOTS[slot];
        if (from === to) return;
        cancels[p]?.();
        cancels[p] = tween(p === moved ? 180 : 320, (t) => {
          positions[p] = from + (to - from) * t;
          render(p);
        });
      });
      sound.knock();
      showBubbles();
    };

    puppets.forEach((puppet, p) => {
      let grab = 0;
      scene.draggable(puppet, {
        start: (pt) => {
          cancels[p]?.();
          grab = pt.x - positions[p];
          front.appendChild(puppet);
        },
        move: (pt) => {
          positions[p] = Math.min(SLOTS[SLOTS.length - 1] + 60, Math.max(SLOTS[0] - 60, pt.x - grab));
          render(p);
          stir(26);
          bubbles.forEach((b) => b.setAttribute('opacity', '0'));
        },
        end: () => {
          slots = dropPuppet(slots, p, nearestSlot(positions[p]));
          settle(p);
          stir(30);
        },
      });
      puppet.addEventListener('keydown', (event) => {
        const delta = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
        if (!delta) return;
        event.preventDefault();
        const target = slots[p] + delta;
        if (target < 0 || target >= SLOTS.length) return;
        slots = dropPuppet(slots, p, target);
        settle(p);
        stir(30);
      });
      render(p);
    });
    showBubbles();

    return {
      hintTargets: () => positions.map((x) => ({ x, y: 400, r: 90, verb: 'drag' as const })),
      showGhost: () => ghost.setAttribute('opacity', '0.22'),
      destroy: () => {
        cancels.forEach((cancel) => cancel?.());
        cancelAnimationFrame(frame);
      },
    };
  },
};
