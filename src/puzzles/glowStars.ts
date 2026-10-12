import { DEF, url } from '../core/defs';
import { glyph, placeStars, type GlyphId } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el, moonPhase, uid } from '../core/svg';
import { clamp } from '../core/tween';
import { dist, seeded } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Level 10 — glow-in-the-dark stars ("sao dạ quang"). Cream stickers on a cream
 * ceiling: with the light on they are all but invisible. Shine the desk lamp on
 * them to charge them, then switch the light off: whatever was charged glows, and
 * fades over a few seconds.
 */

export const CEILING_H = 560;
export const SPOT_R = 150;
export const GLYPH_SIZE = 150;
export const CLUSTERS: readonly { id: GlyphId; x: number; y: number; phase: number }[] = [
  { id: 'hook', x: 270, y: 260, phase: 2 },
  { id: 'belt', x: 640, y: 170, phase: 1 },
  { id: 'triangle', x: 1000, y: 330, phase: 4 },
  { id: 'diamond', x: 1340, y: 200, phase: 3 },
];
export const SPOT_START: readonly [number, number] = [800, 470];
export const LAMP: readonly [number, number] = [800, 800];
export const SWITCH: readonly [number, number] = [1500, 690];
/** Charge gained per second in the lamp's light, and seconds a full charge glows for. */
export const CHARGE_RATE = 0.9;
export const FADE_S = 7;

export function stepCharge(charge: number, lightsOn: boolean, inSpot: boolean, dt: number): number {
  if (lightsOn) return inSpot ? Math.min(1, charge + dt * CHARGE_RATE) : charge;
  return Math.max(0, charge - dt / FADE_S);
}

export const moonSpot = (c: { x: number; y: number }): [number, number] => [c.x + GLYPH_SIZE / 2 + 20, c.y - GLYPH_SIZE / 2 + 8];

export interface Sticker {
  kind: 'star' | 'line' | 'moon';
  /** The point the lamp has to reach to charge it. */
  x: number;
  y: number;
  /** Constellation it belongs to, or null for a loose decoy. */
  cluster: number | null;
  /** Line end points, for 'line'. */
  to?: [number, number];
  from?: [number, number];
  phase?: number;
}

export function stickers(): Sticker[] {
  const out: Sticker[] = [];
  CLUSTERS.forEach((c, ci) => {
    const pts = placeStars(c.id, c.x, c.y, GLYPH_SIZE);
    for (const [a, b] of glyph(c.id).lines) {
      out.push({ kind: 'line', x: (pts[a][0] + pts[b][0]) / 2, y: (pts[a][1] + pts[b][1]) / 2, cluster: ci, from: pts[a], to: pts[b] });
    }
    for (const [x, y] of pts) out.push({ kind: 'star', x, y, cluster: ci });
    const [mx, my] = moonSpot(c);
    out.push({ kind: 'moon', x: mx, y: my, cluster: ci, phase: c.phase });
  });
  // A loose moon with no constellation, to catch anyone counting moons alone.
  out.push({ kind: 'moon', x: 1460, y: 470, cluster: null, phase: 2 });
  const rand = seeded(57);
  const keepOff = out.map((s) => [s.x, s.y]);
  const clusterStars = CLUSTERS.flatMap((c) => placeStars(c.id, c.x, c.y, GLYPH_SIZE));
  let tries = 0;
  let decoys = 0;
  while (decoys < 30 && tries < 5000) {
    tries += 1;
    const p: [number, number] = [50 + rand() * (SCENE_W - 100), 50 + rand() * (CEILING_H - 100)];
    if (clusterStars.some((s) => dist(p[0], p[1], s[0], s[1]) < 46)) continue;
    if (keepOff.some((s) => dist(p[0], p[1], s[0], s[1]) < 30)) continue;
    keepOff.push(p);
    out.push({ kind: 'star', x: p[0], y: p[1], cluster: null });
    decoys += 1;
  }
  return out;
}

/** Constellations whose every sticker sits inside the lamp's spot centred at (x, y). */
export function coveredClusters(x: number, y: number): number[] {
  const all = stickers();
  return CLUSTERS.map((_, i) => i).filter((i) => all.filter((s) => s.cluster === i).every((s) => dist(x, y, s.x, s.y) <= SPOT_R - 8));
}

export const glowStars: PuzzleDef = {
  id: 'glow-stars',
  name: 'Sao dạ quang',
  answer: [...CLUSTERS].sort((a, b) => a.phase - b.phase).map((c) => c.id),
  fireflies: [
    { id: 'glow-stars/bed', layer: 'mid', x: 170, y: 760 },
    { id: 'glow-stars/shelf', layer: 'mid', x: 1180, y: 640 },
  ],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const all = stickers();
    const charge = all.map(() => 0);
    const shownGlow = all.map(() => -1);
    let lightsOn = true;
    let spot: [number, number] = [SPOT_START[0], SPOT_START[1]];
    const seen = new Set<number>();
    const hinted: number[] = [];

    // Back: the ceiling with its painted doodles and the near-invisible stickers, the wall below.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: CEILING_H + 60, fill: '#ece3cc' }, back);
    const paint = el('g', { fill: 'none', stroke: '#d6cbb0', 'stroke-width': 4, 'stroke-linecap': 'round' }, back);
    el('circle', { cx: 470, cy: 430, r: 46 }, paint);
    el('ellipse', { cx: 470, cy: 430, rx: 86, ry: 20, transform: 'rotate(-18 470 430)' }, paint);
    el('path', { d: 'M820 70 q30 -30 60 0 q30 -20 50 10 q30 5 10 30 l-120 0 q-25 -15 0 -40 Z' }, paint);
    el('path', { d: 'M1180 420 l40 -70 l40 70 Z M1200 420 l0 30 M1240 420 l0 30' }, paint);
    el('path', { d: 'M90 90 q40 -30 80 0 q40 30 80 0' }, paint);
    const dayStickers = el('g', { class: 'sticker-day' }, back);
    el('rect', { x: -60, y: CEILING_H, width: SCENE_W + 120, height: SCENE_H - CEILING_H + 60, fill: '#4b3f5e' }, back);
    el('rect', { x: -60, y: CEILING_H - 8, width: SCENE_W + 120, height: 16, fill: '#d8ccaf' }, back);
    el('rect', { x: 60, y: 720, width: 420, height: 200, rx: 20, fill: '#6a5a82' }, back);
    el('rect', { x: 80, y: 690, width: 140, height: 60, rx: 20, fill: '#efe6d2' }, back);
    el('rect', { x: 1080, y: 650, width: 240, height: 14, fill: '#3a2c3a' }, back);
    scene.grain('back', 0.35);

    // Mid: the dark of the room with the light off, and the stickers glowing through it.
    const dark = el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, class: 'room-dark' }, mid);
    const glowG = el('g', { filter: url(DEF.glow), class: 'sticker-glow' }, mid);

    const nodes = all.map((s) => {
      const draw = (parent: Element) => {
        if (s.kind === 'line' && s.from && s.to) {
          return el('line', { x1: s.from[0], y1: s.from[1], x2: s.to[0], y2: s.to[1], 'stroke-width': 4, 'stroke-linecap': 'round', stroke: 'currentColor' }, parent);
        }
        if (s.kind === 'moon') return moonPhase(parent, s.phase ?? 4, s.x, s.y, 16, { class: 'moon-phase sticker-moon' });
        return el('circle', { cx: s.x, cy: s.y, r: 8, fill: 'currentColor' }, parent);
      };
      draw(dayStickers);
      const glowNode = draw(glowG);
      glowNode.setAttribute('opacity', '0');
      return glowNode;
    });

    // Front: the desk lamp, its beam and spot, and the light switch.
    const lampG = el('g', { class: 'desk-lamp' }, front);
    const beam = el('path', { class: 'lamp-beam', 'pointer-events': 'none' }, lampG);
    el('rect', { x: LAMP[0] - 220, y: LAMP[1] + 40, width: 440, height: 80, fill: '#5e3f2c' }, lampG);
    el('ellipse', { cx: LAMP[0], cy: LAMP[1] + 40, rx: 60, ry: 12, fill: '#2b2433' }, lampG);
    el('rect', { x: LAMP[0] - 6, y: LAMP[1] - 30, width: 12, height: 70, fill: '#2b2433' }, lampG);
    const head = el('path', { d: 'M-34 -10 L34 -10 L22 34 L-22 34 Z', fill: '#c2402f', stroke: '#2b2433', 'stroke-width': 4 }, lampG);
    const ghost = el('circle', { r: SPOT_R, class: 'ghost-mark', opacity: 0 }, front);
    const spotG = el('g', { class: 'lamp-spot interactive', tabindex: 0, role: 'button', 'aria-label': 'Vòng sáng đèn bàn' }, front);
    el('circle', { r: SPOT_R, class: 'spot-light' }, spotG);
    el('circle', { r: SPOT_R, fill: 'none', stroke: '#fff3c4', 'stroke-width': 3, opacity: 0.6 }, spotG);

    const switchG = el('g', { class: 'wall-switch interactive', transform: `translate(${SWITCH[0]} ${SWITCH[1]})` }, front);
    el('rect', { x: -36, y: -56, width: 72, height: 112, rx: 10, fill: '#efe6d2', stroke: '#8a7a6a', 'stroke-width': 3 }, switchG);
    const toggle = el('rect', { x: -14, y: -36, width: 28, height: 36, rx: 6, fill: '#c9bfa8', stroke: '#8a7a6a', 'stroke-width': 2 }, switchG);
    el('circle', { cy: 34, r: 6, class: 'switch-led' }, switchG);

    const glowId = uid('spot');
    const g = el('radialGradient', { id: glowId }, scene.defs);
    el('stop', { offset: 0, 'stop-color': '#fff7d6', 'stop-opacity': 0.55 }, g);
    el('stop', { offset: 1, 'stop-color': '#fff7d6', 'stop-opacity': 0.15 }, g);
    spotG.querySelector('.spot-light')?.setAttribute('fill', url(glowId));

    const firstHinted = () => hinted.find((i) => !seen.has(i));
    const render = () => {
      scene.root.classList.toggle('lights-off', !lightsOn);
      dark.setAttribute('opacity', lightsOn ? '0' : '0.93');
      spotG.style.display = lightsOn ? '' : 'none';
      spotG.setAttribute('transform', `translate(${spot[0].toFixed(1)} ${spot[1].toFixed(1)})`);
      const hx = LAMP[0];
      const hy = LAMP[1] - 40;
      // The shade opens towards -y; turn it to face the spot.
      const angle = (Math.atan2(spot[1] - hy, spot[0] - hx) * 180) / Math.PI + 90;
      head.setAttribute('transform', `translate(${hx} ${hy}) rotate(${angle.toFixed(1)})`);
      const nx = -(spot[1] - hy);
      const ny = spot[0] - hx;
      const len = Math.hypot(nx, ny) || 1;
      const w = SPOT_R * 0.9;
      beam.setAttribute('d', `M${hx - 10} ${hy} L${(spot[0] + (nx / len) * w).toFixed(1)} ${(spot[1] + (ny / len) * w).toFixed(1)} L${(spot[0] - (nx / len) * w).toFixed(1)} ${(spot[1] - (ny / len) * w).toFixed(1)} L${hx + 10} ${hy} Z`);
      beam.style.display = lightsOn ? '' : 'none';
      toggle.setAttribute('y', lightsOn ? '-36' : '0');
      const h = firstHinted();
      if (h === undefined || !lightsOn) ghost.setAttribute('opacity', '0');
      else {
        ghost.setAttribute('cx', String(CLUSTERS[h].x + 10));
        ghost.setAttribute('cy', String(CLUSTERS[h].y));
        ghost.setAttribute('opacity', '1');
      }
    };

    // Charging and fading run every frame.
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      all.forEach((s, i) => {
        charge[i] = stepCharge(charge[i], lightsOn, dist(spot[0], spot[1], s.x, s.y) <= SPOT_R, dt);
        const shown = lightsOn ? 0 : Math.round(charge[i] * 50) / 50;
        if (shown !== shownGlow[i]) {
          shownGlow[i] = shown;
          nodes[i].setAttribute('opacity', String(shown));
        }
      });
      if (!lightsOn) {
        CLUSTERS.forEach((_, ci) => {
          if (seen.has(ci)) return;
          if (all.every((s, i) => s.cluster !== ci || charge[i] > 0.5)) seen.add(ci);
        });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    asButton(switchG, 'Công tắc đèn', () => {
      lightsOn = !lightsOn;
      sound.knock();
      render();
    });

    let grab = [0, 0];
    const clampSpot = (x: number, y: number): [number, number] => [clamp(x, 60, SCENE_W - 60), clamp(y, 60, CEILING_H - 40)];
    scene.draggable(spotG, {
      start: (p) => (grab = [p.x - spot[0], p.y - spot[1]]),
      move: (p) => {
        spot = clampSpot(p.x - grab[0], p.y - grab[1]);
        render();
      },
    });
    spotG.addEventListener('keydown', (event) => {
      const m = ({ ArrowLeft: [-30, 0], ArrowRight: [30, 0], ArrowUp: [0, -30], ArrowDown: [0, 30] } as Record<string, [number, number]>)[event.key];
      if (!m) return;
      event.preventDefault();
      spot = clampSpot(spot[0] + m[0], spot[1] + m[1]);
      render();
    });
    render();

    const byPhase = CLUSTERS.map((c, i) => ({ c, i })).sort((a, b) => a.c.phase - b.c.phase).map(({ i }) => i);
    const charged = (ci: number) => all.every((s, i) => s.cluster !== ci || charge[i] > 0.9);
    return {
      revealHints: (count) => {
        while (hinted.length < count) {
          const next = byPhase.find((i) => !seen.has(i) && !hinted.includes(i));
          if (next === undefined) break;
          hinted.push(next);
        }
        render();
        return hinted.length;
      },
      hintSteps: (): HintStep[] => {
        const h = firstHinted();
        if (h === undefined) return [];
        const c = CLUSTERS[h];
        const sw = { x: SWITCH[0], y: SWITCH[1], r: 80, verb: 'tap' } as const;
        const steps: HintStep[] = [];
        let on = lightsOn;
        if (!charged(h)) {
          if (!on) {
            steps.push({ note: 'Bấm công tắc để bật đèn lại, đèn bàn mới nạp sáng được cho sao.', targets: [sw] });
            on = true;
          }
          steps.push({ note: 'Kéo vòng sáng đèn bàn vào vòng vàng và giữ ở đó vài giây để sao nạp đủ sáng.', targets: [{ x: spot[0], y: spot[1], r: 90, verb: 'drag', to: { x: c.x + 10, y: c.y } }] });
        }
        if (on) steps.push({ note: 'Bấm công tắc để tắt đèn.', targets: [sw] });
        steps.push({ note: 'Chòm sao và trăng dạ quang phát sáng ở chỗ khoanh đỏ rồi mờ dần: đọc trước khi chúng tắt.', targets: [{ x: c.x, y: c.y, r: 130, verb: 'look' }] });
        return steps;
      },
      destroy: () => {
        cancelAnimationFrame(frame);
        scene.root.classList.remove('lights-off');
      },
    };
  },
};
