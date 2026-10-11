import { answerOf } from '../core/assembly';
import { DEF, url } from '../core/defs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, uid } from '../core/svg';
import { mountAssemblyBoard, type BoardConfig } from './assemblyBoard';
import type { PuzzleDef } from './types';

/**
 * Level 2 — the New Year tea tray ("mâm trà ngày Tết").
 * Ten things lie on the low table. Three groups of three make up animals when put
 * together the right way; one object belongs to nothing. Objects only need moving
 * here — turning comes later, in the attic.
 */
export const TEA_TRAY: BoardConfig = {
  rotateStep: 0,
  bounds: { x0: 110, y0: 330, x1: 1490, y1: 820 },
  objects: [
    { id: 'teapot', kind: 'teapot', x: 1180, y: 640, rot: 0 },
    { id: 'fan', kind: 'fan', x: 420, y: 430, rot: 0 },
    { id: 'chopsticks', kind: 'chopsticks', x: 900, y: 740, rot: 0 },
    { id: 'pomelo', kind: 'pomelo', x: 300, y: 690, rot: 0 },
    { id: 'cup', kind: 'cup', x: 700, y: 430, rot: 0 },
    { id: 'betel', kind: 'betel', x: 1420, y: 440, rot: 0 },
    { id: 'leaf', kind: 'leaf', x: 760, y: 590, rot: 0 },
    { id: 'coin', kind: 'coin', x: 1050, y: 410, rot: 0 },
    { id: 'brush', kind: 'brush', x: 540, y: 800, rot: 0 },
    { id: 'drum', kind: 'drum', x: 1380, y: 770, rot: 0 },
  ],
  compositions: [
    {
      animal: 'rooster', order: 2,
      parts: [
        { id: 'teapot', dx: 0, dy: 0, rot: 0 },
        { id: 'fan', dx: -100, dy: -74, rot: 0 },
        { id: 'chopsticks', dx: 6, dy: 102, rot: 0 },
      ],
      reveal: { dx: -10, dy: 10, scale: 3 },
      marks: { dx: 0, dy: -170 },
    },
    {
      animal: 'pig', order: 3,
      parts: [
        { id: 'pomelo', dx: 0, dy: 0, rot: 0 },
        { id: 'cup', dx: 92, dy: 8, rot: 0 },
        { id: 'betel', dx: 40, dy: -68, rot: 0 },
      ],
      reveal: { dx: 20, dy: 0, scale: 2.5 },
      marks: { dx: 0, dy: -130 },
    },
    {
      animal: 'rat', order: 1,
      parts: [
        { id: 'leaf', dx: 0, dy: 0, rot: 0 },
        { id: 'coin', dx: 54, dy: -36, rot: 0 },
        { id: 'brush', dx: -180, dy: 24, rot: 0 },
      ],
      reveal: { dx: -40, dy: 0, scale: 3 },
      marks: { dx: 0, dy: -90 },
    },
  ],
};

export const teaTray: PuzzleDef = {
  id: 'c1-tea-tray',
  chapter: 1,
  name: 'Mâm trà ngày Tết',
  answer: answerOf(TEA_TRAY.compositions),
  guide: {
    goal: 'Ghép các đồ vật trên mâm thành 3 con giáp.',
    steps: [
      { icon: 'drag', text: 'Kéo đồ vật đi bất cứ đâu trên mặt bàn.' },
      { icon: 'tap', text: 'Hai món thuộc cùng một con giáp, đặt đúng chỗ cạnh nhau, sẽ kêu “cạch” và dính lại. Từ đó chúng di chuyển cùng nhau.' },
      { icon: 'marks', text: 'Ghép đủ một con thì bóng con giáp sáng lên phía sau, kèm dấu ◆ cho biết thứ tự.' },
    ],
    tip: 'Mỗi con giáp gồm 3 món. Có 1 món thừa không thuộc con nào. Thử nghĩ món nào giống thân, đuôi, chân hay tai.',
  },
  fireflies: [
    { id: 'c1-tea-tray/scroll', layer: 'back', x: 1225, y: 120 },
    { id: 'c1-tea-tray/under', layer: 'mid', x: 140, y: 880 },
  ],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;

    // Back: warm plaster wall, a Đông Hồ style scroll and red couplets.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#e3cfa6' }, back);
    const glowId = uid('tray-light');
    const glow = el('radialGradient', { id: glowId }, scene.defs);
    el('stop', { offset: 0, 'stop-color': '#fff1cc', 'stop-opacity': 0.9 }, glow);
    el('stop', { offset: 1, 'stop-color': '#e3cfa6', 'stop-opacity': 0 }, glow);
    el('ellipse', { cx: 800, cy: 200, rx: 700, ry: 320, fill: url(glowId) }, back);
    el('rect', { x: 1150, y: 40, width: 150, height: 220, fill: '#f3e7cb', stroke: '#8a6a45', 'stroke-width': 6 }, back);
    el('circle', { cx: 1225, cy: 120, r: 36, fill: '#b7372a', opacity: 0.85 }, back);
    el('path', { d: 'M1190 200 Q1225 170 1260 200', fill: 'none', stroke: '#4e6b38', 'stroke-width': 6 }, back);
    for (const x of [150, 330]) {
      el('rect', { x, y: 30, width: 70, height: 240, fill: '#b7372a', filter: url(DEF.rough) }, back);
      for (let i = 0; i < 4; i += 1) el('circle', { cx: x + 35, cy: 70 + i * 52, r: 12, fill: '#e0a948', opacity: 0.85 }, back);
    }
    scene.grain('back', 0.9);

    // Mid: the low wooden table that fills the lower part of the room.
    el('path', { d: 'M40 300 L1560 300 L1600 900 L0 900 Z', fill: '#7a5638' }, mid);
    el('path', { d: 'M40 300 L1560 300 L1566 318 L34 318 Z', fill: '#5e3f28' }, mid);
    for (let i = 0; i < 7; i += 1) {
      el('path', { d: `M${60 - i * 3} ${360 + i * 80} L${1540 + i * 3} ${360 + i * 80}`, stroke: '#6b4a30', 'stroke-width': 2, opacity: 0.6 }, mid);
    }
    scene.grain('mid', 0.4);

    return mountAssemblyBoard(scene, sound, front, TEA_TRAY);
  },
};
