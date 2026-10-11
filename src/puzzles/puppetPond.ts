import { url } from '../core/defs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, pips, uid } from '../core/svg';
import { easeInOutSine, tween } from '../core/tween';
import { drawZodiac, type ZodiacId } from '../core/zodiac';
import type { PuzzleDef } from './types';

/**
 * Level 4 — the water-puppet pond ("ao rối nước").
 * Eight red puppets, each an upside-down half of an animal: meaningless in the air,
 * but their reflections in the still water are upright. Six of them pair up into
 * three animals; two are halves of animals whose other half is missing. Some
 * puppets start turned around (tap to turn them back). When an animal's left and
 * right halves stand side by side, the right way round, its reflection joins up
 * and bubbles rise beside it. All three whole finishes the level.
 */

export interface PondAnimal {
  animal: ZodiacId;
  /** Highest point of the silhouette (box units), kept next to the waterline. */
  top: number;
}

export interface PondPuppet {
  animal: ZodiacId;
  top: number;
  /** 0 = left half, 1 = right half. */
  half: 0 | 1;
}

export const ANIMALS: readonly PondAnimal[] = [
  { animal: 'dragon', top: 18 },
  { animal: 'snake', top: 24 },
  { animal: 'monkey', top: 24 },
];
/** Puppets 0–5 are the halves of ANIMALS (2a = left, 2a + 1 = right); the rest are odd halves. */
export const PUPPET_LIST: readonly PondPuppet[] = [
  ...ANIMALS.flatMap((a) => [0, 1].map((half) => ({ animal: a.animal, top: a.top, half: half as 0 | 1 }))),
  { animal: 'horse', top: 11, half: 0 },
  { animal: 'rooster', top: 16, half: 1 },
];
export const PUPPETS = PUPPET_LIST.length;
export const SLOTS: readonly number[] = Array.from({ length: PUPPETS }, (_, i) => 240 + i * 160);
/** Slot of each puppet at the start: no animal is whole. */
export const INITIAL_SLOTS: readonly number[] = [5, 0, 7, 2, 1, 4, 3, 6];
/** Puppets that start turned around. */
export const INITIAL_TURNED: readonly boolean[] = [false, true, false, false, true, false, true, false];

export const isAnimalWhole = (slots: readonly number[], animal: number, turned: readonly boolean[] = []): boolean =>
  slots[animal * 2 + 1] === slots[animal * 2] + 1 && !turned[animal * 2] && !turned[animal * 2 + 1];

export const isPondSolved = (slots: readonly number[], turned: readonly boolean[] = []): boolean =>
  ANIMALS.every((_, a) => isAnimalWhole(slots, a, turned));

/** Moves a puppet to a slot; a puppet already there swaps into the mover's old slot. */
export function dropPuppet(slots: readonly number[], puppet: number, target: number): number[] {
  const next = [...slots];
  const occupant = next.indexOf(target);
  if (occupant !== -1 && occupant !== puppet) next[occupant] = next[puppet];
  next[puppet] = target;
  return next;
}

/**
 * Each hint points out one animal that is not whole yet: which two puppets belong
 * together, and which of them stands on the left.
 */
export function nextPondHint(slots: readonly number[], turned: readonly boolean[], revealed: readonly number[]): number | null {
  const next = ANIMALS.findIndex((_, a) => !revealed.includes(a) && !isAnimalWhole(slots, a, turned));
  return next === -1 ? null : next;
}

export const nearestSlot = (x: number): number =>
  SLOTS.reduce((best, slotX, i) => (Math.abs(slotX - x) < Math.abs(SLOTS[best] - x) ? i : best), 0);

const WATER_Y = 540;
const SPACING = SLOTS[1] - SLOTS[0];
const SCALE = SPACING / 50; // half a silhouette (50 units) spans one slot
const TAP_SLOP = 6;

export const puppetPond: PuzzleDef = {
  id: 'c2-puppet-pond',
  name: 'Ao rối nước',
  guide: {
    goal: 'Xếp các con rối để bóng dưới nước ghép thành 3 con giáp.',
    steps: [
      { icon: 'drag', text: 'Kéo con rối sang trái hoặc phải. Thả vào chỗ đã có con khác thì hai con đổi chỗ.' },
      { icon: 'tap', text: 'Bấm (không kéo) vào một con rối để quay ngược nó lại. Có vài con đang bị quay sai.' },
      { icon: 'tap', text: 'Mỗi con rối là nửa trái hoặc nửa phải của một con giáp, bị lộn ngược: hãy nhìn bóng dưới nước. Hai nửa đứng cạnh nhau, đúng chiều, thì bóng liền lại.' },
      { icon: 'done', text: 'Ghép liền bóng của cả 3 con giáp là qua màn.' },
    ],
    tip: 'Có 2 con rối là nửa của con giáp không có mặt ở đây, chúng không ghép được với con nào.',
  },
  fireflies: [
    { id: 'c2-puppet-pond/hills', layer: 'back', x: 1480, y: 200 },
    { id: 'c2-puppet-pond/water', layer: 'mid', x: 1540, y: 640 },
  ],
  mount({ scene, sound, solved }) {
    const { back, mid, front } = scene.layers;
    let slots = [...INITIAL_SLOTS];
    const turned = [...INITIAL_TURNED];
    const facing: number[] = turned.map((t) => (t ? -1 : 1));
    const positions = slots.map((s) => SLOTS[s]);
    const cancels: (() => void)[] = [];
    const turnCancels: (() => void)[] = [];

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

    const reflectionSlices = PUPPET_LIST.map(({ animal, top, half }) => {
      const outer = el('g', {}, rippled);
      const turn = el('g', {}, outer);
      const inner = el('g', { transform: `translate(${sliceX(half)} ${WATER_Y + 6 - top * SCALE}) scale(${SCALE})` }, turn);
      drawZodiac(el('g', { 'clip-path': url(halfClips[half]) }, inner), animal);
      return { outer, turn };
    });
    // Bubbles ride with each animal's right half, at the seam between the halves.
    const bubbles = ANIMALS.map((_, i) =>
      pips(reflectionSlices[i * 2 + 1].outer, 3, -SPACING / 2, WATER_Y + 280, 9, 28, { opacity: 0, fill: '#e9f1e6', class: 'pips bubbles' }));

    // Front: the puppets, mirror images of the reflections.
    const puppets = PUPPET_LIST.map(({ animal, top, half }, p) => {
      const outer = el('g', { class: 'puppet interactive', tabindex: 0, role: 'button', 'aria-label': `Con rối ${p + 1}` }, front);
      el('rect', { x: -SPACING / 2 + 6, y: 260, width: SPACING - 12, height: WATER_Y - 250, fill: 'transparent' }, outer);
      el('ellipse', { cx: 0, cy: WATER_Y, rx: SPACING / 2 - 14, ry: 8, fill: '#5a4636' }, outer);
      const turn = el('g', {}, outer);
      const inner = el('g', {
        transform: `translate(${sliceX(half)} ${WATER_Y - 6 + top * SCALE}) scale(${SCALE} ${-SCALE})`,
        stroke: '#e0a948', 'stroke-width': 0.7,
      }, turn);
      inner.style.color = '#c23f2d';
      drawZodiac(el('g', { 'clip-path': url(halfClips[half]) }, inner), animal);
      return { outer, turn };
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

    // Hints: a thread between the two halves of one animal, with a ◀ on the half
    // that stands on the left and a ▶ on the one that stands on the right.
    const hinted: number[] = [];
    const hintLayer = el('g', { class: 'pond-hints', 'pointer-events': 'none' }, front);
    const drawPondHints = () => {
      hintLayer.replaceChildren();
      for (const a of hinted) {
        if (isAnimalWhole(slots, a, turned)) continue;
        const [left, right] = [positions[a * 2], positions[a * 2 + 1]];
        el('path', { d: `M${left} 230 Q${(left + right) / 2} ${170 - Math.abs(right - left) * 0.12} ${right} 230`, class: 'thread' }, hintLayer);
        for (const [x, d] of [[left, 'M6 -9 L-8 0 L6 9 Z'], [right, 'M-6 -9 L8 0 L-6 9 Z']] as const) {
          const badge = el('g', { transform: `translate(${x} 230)` }, hintLayer);
          el('circle', { r: 17, class: 'number-badge' }, badge);
          el('path', { d, fill: '#fff3d6' }, badge);
        }
      }
    };

    const render = (p: number) => {
      const t = `translate(${positions[p].toFixed(1)} 0)`;
      puppets[p].outer.setAttribute('transform', t);
      reflectionSlices[p].outer.setAttribute('transform', t);
      const f = `scale(${facing[p].toFixed(3)} 1)`;
      puppets[p].turn.setAttribute('transform', f);
      reflectionSlices[p].turn.setAttribute('transform', f);
      if (hinted.length) drawPondHints();
    };

    const whole = ANIMALS.map((_, a) => isAnimalWhole(slots, a, turned));
    const showBubbles = () => {
      ANIMALS.forEach((_, a) => {
        const now = isAnimalWhole(slots, a, turned);
        bubbles[a].setAttribute('opacity', now ? '1' : '0');
        if (now && !whole[a]) setTimeout(() => sound.chime(), 700);
        whole[a] = now;
      });
      if (isPondSolved(slots, turned)) solved();
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
      drawPondHints();
    };

    const turnAround = (p: number) => {
      turned[p] = !turned[p];
      const from = facing[p];
      const to = turned[p] ? -1 : 1;
      turnCancels[p]?.();
      turnCancels[p] = tween(360, (t) => {
        facing[p] = from + (to - from) * t;
        render(p);
      }, easeInOutSine);
      sound.paper();
      stir(18);
      showBubbles();
      drawPondHints();
    };

    puppets.forEach(({ outer }, p) => {
      let grab = 0;
      let startX = 0;
      let moved = false;
      scene.draggable(outer, {
        start: (pt) => {
          cancels[p]?.();
          grab = pt.x - positions[p];
          startX = pt.x;
          moved = false;
          front.appendChild(outer);
        },
        move: (pt) => {
          if (!moved && Math.abs(pt.x - startX) < TAP_SLOP) return;
          moved = true;
          positions[p] = Math.min(SLOTS[SLOTS.length - 1] + 60, Math.max(SLOTS[0] - 60, pt.x - grab));
          render(p);
          stir(26);
          bubbles.forEach((b) => b.setAttribute('opacity', '0'));
        },
        end: () => {
          if (!moved) {
            turnAround(p);
            return;
          }
          slots = dropPuppet(slots, p, nearestSlot(positions[p]));
          settle(p);
          stir(30);
        },
      });
      outer.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          turnAround(p);
          return;
        }
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
      revealHints: (count) => {
        while (hinted.length < count) {
          const animal = nextPondHint(slots, turned, hinted);
          if (animal === null) break;
          hinted.push(animal);
        }
        drawPondHints();
        return hinted.length;
      },
      hintTargets: () => hinted
        .filter((a) => !isAnimalWhole(slots, a, turned))
        .flatMap((a) => [a * 2, a * 2 + 1])
        .map((p) => ({ x: positions[p], y: 420, r: 76, verb: turned[p] ? 'tap' as const : 'drag' as const })),
      destroy: () => {
        cancels.forEach((cancel) => cancel?.());
        turnCancels.forEach((cancel) => cancel?.());
        cancelAnimationFrame(frame);
      },
    };
  },
};
