import { answerOf } from '../core/assembly';
import { DEF, url } from '../core/defs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, uid } from '../core/svg';
import { mountAssemblyBoard, type BoardConfig } from './assemblyBoard';
import type { PuzzleDef } from './types';

/**
 * Level 5 — the attic before the Mid-Autumn festival ("gác xép Trung Thu").
 * Fifteen toys and odds and ends on the attic floor. Three animals of four pieces
 * each, three pieces that belong to nothing, and almost everything lies turned the
 * wrong way: tap a piece to turn it 45°. Pieces only lock together when both face
 * the right way.
 */
export const TOY_ATTIC: BoardConfig = {
  rotateStep: 45,
  bounds: { x0: 110, y0: 340, x1: 1490, y1: 830 },
  objects: [
    { id: 'banhchung', kind: 'banhchung', x: 300, y: 450, rot: 45 },
    { id: 'cup', kind: 'cup', x: 1250, y: 790, rot: 0 },
    { id: 'sickle', kind: 'sickle', x: 700, y: 800, rot: 180 },
    { id: 'chopsticks', kind: 'chopsticks', x: 1440, y: 430, rot: 90 },
    { id: 'kite', kind: 'kite', x: 920, y: 420, rot: 0 },
    { id: 'firecrackers', kind: 'firecrackers', x: 540, y: 620, rot: 90 },
    { id: 'leaf', kind: 'leaf', x: 1150, y: 570, rot: 0 },
    { id: 'fan', kind: 'fan', x: 210, y: 760, rot: 0 },
    { id: 'pomelo', kind: 'pomelo', x: 660, y: 430, rot: 0 },
    { id: 'lantern', kind: 'lantern', x: 1150, y: 380, rot: 135 },
    { id: 'betel', kind: 'betel', x: 420, y: 820, rot: 180 },
    { id: 'brush', kind: 'brush', x: 960, y: 650, rot: 0 },
    { id: 'teapot', kind: 'teapot', x: 1400, y: 640, rot: 0 },
    { id: 'coin', kind: 'coin', x: 170, y: 560, rot: 0 },
    { id: 'drum', kind: 'drum', x: 780, y: 690, rot: 0 },
  ],
  compositions: [
    {
      animal: 'ox', order: 3,
      parts: [
        { id: 'banhchung', dx: 0, dy: 0, rot: 0 },
        { id: 'cup', dx: 98, dy: -30, rot: 90 },
        { id: 'sickle', dx: 96, dy: -92, rot: 0 },
        { id: 'chopsticks', dx: -8, dy: 104, rot: 0 },
      ],
      reveal: { dx: 20, dy: -10, scale: 3.2 },
      marks: { dx: 0, dy: -180 },
    },
    {
      animal: 'dragon', order: 1,
      parts: [
        { id: 'kite', dx: 0, dy: 0, rot: 90 },
        { id: 'firecrackers', dx: -176, dy: 12, rot: 0 },
        { id: 'leaf', dx: -350, dy: -34, rot: 315 },
        { id: 'fan', dx: -470, dy: -100, rot: 270 },
      ],
      reveal: { dx: -230, dy: -30, scale: 5.6 },
      marks: { dx: -230, dy: -200 },
    },
    {
      animal: 'cat', order: 2,
      parts: [
        { id: 'pomelo', dx: 0, dy: 0, rot: 0 },
        { id: 'lantern', dx: 0, dy: -108, rot: 0 },
        { id: 'betel', dx: 0, dy: -168, rot: 0 },
        { id: 'brush', dx: 96, dy: 30, rot: 315 },
      ],
      reveal: { dx: 10, dy: -60, scale: 3.4 },
      marks: { dx: -110, dy: -150 },
    },
  ],
};

export const toyAttic: PuzzleDef = {
  id: 'c2-toy-attic',
  chapter: 2,
  name: 'Gác xép Trung Thu',
  answer: answerOf(TOY_ATTIC.compositions),
  fireflies: [
    { id: 'c2-toy-attic/rafter', layer: 'back', x: 1480, y: 70 },
    { id: 'c2-toy-attic/moon', layer: 'back', x: 300, y: 150 },
  ],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;

    // Back: attic at night, moonlight through a round window, sloping rafters.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#2a2430' }, back);
    el('circle', { cx: 300, cy: 150, r: 95, fill: '#1b2230', stroke: '#1a1512', 'stroke-width': 14 }, back);
    el('circle', { cx: 300, cy: 150, r: 48, fill: '#f3e9cf', filter: url(DEF.glow) }, back);
    el('path', { d: 'M205 150 H395 M300 55 V245', stroke: '#1a1512', 'stroke-width': 8 }, back);
    for (const x of [-100, 300, 700, 1100, 1500]) {
      el('path', { d: `M${x} -60 L${x + 260} 300`, stroke: '#1a1512', 'stroke-width': 26 }, back);
    }
    const beamId = uid('moonbeam');
    const beam = el('linearGradient', { id: beamId, x1: 0, y1: 0, x2: 1, y2: 1 }, scene.defs);
    el('stop', { offset: 0, 'stop-color': '#f3e9cf', 'stop-opacity': 0.28 }, beam);
    el('stop', { offset: 1, 'stop-color': '#f3e9cf', 'stop-opacity': 0 }, beam);
    el('path', { d: 'M230 200 L380 120 L1300 900 L500 900 Z', fill: url(beamId) }, back);
    // A star lantern hanging from the rafters, a nod to level 1.
    el('line', { x1: 1300, y1: -60, x2: 1300, y2: 120, stroke: '#1a1512', 'stroke-width': 3 }, back);
    el('path', { d: 'M1300 110 L1314 146 L1352 148 L1322 170 L1334 206 L1300 186 L1266 206 L1278 170 L1248 148 L1286 146 Z', fill: '#b7372a', filter: url(DEF.rough) }, back);
    scene.grain('back', 0.6);

    // Mid: wide floorboards.
    el('rect', { x: -60, y: 300, width: SCENE_W + 120, height: 660, fill: '#4d3a2c' }, mid);
    for (let i = 0; i < 6; i += 1) el('line', { x1: -60, y1: 330 + i * 100, x2: SCENE_W + 60, y2: 330 + i * 100, stroke: '#3a2b20', 'stroke-width': 3 }, mid);
    el('path', { d: 'M230 300 L380 300 L1300 900 L500 900 Z', fill: '#f3e9cf', opacity: 0.08 }, mid);
    scene.grain('mid', 0.4);

    return mountAssemblyBoard(scene, sound, front, TOY_ATTIC);
  },
};
