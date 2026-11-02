import { DEF, url } from '../core/defs';
import { drawOwl } from '../core/owl';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, uid } from '../core/svg';
import { clamp } from '../core/tween';
import { ease, inside, runIntro, within } from './intro';
import { dist, glyphAt, seeded, skyGradient, starfield } from './sky';
import type { HintStep, PuzzleDef } from './types';
import { tr } from '../core/i18n';

/**
 * Level 1 — clouds in the window ("mây đêm"). The tutorial: three constellations
 * hide behind clouds. Drag the clouds away and read the sky left to right.
 */

export const GLYPH_SPOTS = [
  { id: 'crown', x: 500, y: 330 },
  { id: 'cross', x: 800, y: 470 },
  { id: 'belt', x: 1100, y: 320 },
] as const;
export const CLOUD_R = 125;
export const CLOUDS_START: readonly (readonly [number, number])[] = [
  [520, 320], [790, 470], [1080, 330], [640, 640], [1180, 620],
];

/** Which constellations (indexes into GLYPH_SPOTS) still have a cloud over them. */
export function coveredGlyphs(clouds: readonly (readonly [number, number])[]): number[] {
  return GLYPH_SPOTS.map((g, i) => ({ g, i }))
    .filter(({ g }) => clouds.some(([x, y]) => dist(x, y, g.x, g.y) < CLOUD_R + 50))
    .map(({ i }) => i);
}

const WINDOW = { x: 270, y: 70, w: 1060, h: 720 };

// --- The first-run demonstration: a finger drags the first cloud down off the window (the constellation behind it shows),
// carries on to the keypad and taps that constellation (it appears in the first slot: reading order starts there), then the
// slot clears and the cloud floats back. Seconds of one round, as [start, end] of each part.
export const INTRO = {
  fadeIn: [0, 0.5], press: [0.5, 0.7], slide: [0.7, 1.8], release: [1.8, 2.0], glide: [2.4, 3.3], keyPress: [3.3, 3.55],
  slot: [3.45, 4.9], fadeOut: [4.7, 5.1], back: [4.9, 5.9], rest: 8.2, rounds: 3,
} as const;

/**
 * Where the cloud is (scene units), and the finger: `along` 0 on the cloud and 1 on the keypad key (it glides from one to the
 * other), how visible it is, whether it presses, and whether the first answer slot shows the constellation, `t` seconds into a round.
 */
export function introPose(t: number): { cloud: [number, number]; finger: { along: number; opacity: number; pressed: boolean }; slot: boolean } {
  const [x, y] = CLOUDS_START[0];
  const away = SCENE_H - 40;
  const cloudY = y + (away - y) * (ease(within(t, INTRO.slide)) - ease(within(t, INTRO.back)));
  return {
    cloud: [x, cloudY],
    finger: {
      along: ease(within(t, INTRO.glide)),
      opacity: within(t, INTRO.fadeIn) * (1 - within(t, INTRO.fadeOut)),
      pressed: (t >= INTRO.press[0] && t < INTRO.release[0]) || inside(t, INTRO.keyPress),
    },
    slot: inside(t, INTRO.slot),
  };
}

/** The constellation whose key the demonstration taps: the one behind the cloud it moves (the first to read). */
export const INTRO_GLYPH = GLYPH_SPOTS[0].id;

export const nightClouds: PuzzleDef = {
  id: 'night-clouds',
  get name() {
    return tr('Mây đêm', 'Night Clouds');
  },
  answer: GLYPH_SPOTS.map((g) => g.id),
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const clouds = CLOUDS_START.map(([x, y]) => [x, y] as [number, number]);
    const hinted: number[] = [];
    let stopIntro: () => void = () => undefined;

    // Back: the attic wall.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#1c1626' }, back);
    scene.grain('back', 0.4);

    // Mid: the window with the night sky and its constellations.
    const clipId = uid('window');
    const arch = `M${WINDOW.x} ${WINDOW.y + WINDOW.h} V${WINDOW.y + 240} A${WINDOW.w / 2} 240 0 0 1 ${WINDOW.x + WINDOW.w} ${WINDOW.y + 240} V${WINDOW.y + WINDOW.h} Z`;
    el('path', { d: arch }, el('clipPath', { id: clipId }, scene.defs));
    const sky = el('g', { 'clip-path': url(clipId) }, mid);
    el('rect', { x: WINDOW.x, y: WINDOW.y, width: WINDOW.w, height: WINDOW.h, fill: skyGradient(scene.defs) }, sky);
    starfield(sky, { x: WINDOW.x, y: WINDOW.y, w: WINDOW.w, h: WINDOW.h }, 140, 11);
    const rand = seeded(5);
    for (let i = 0; i < 14; i += 1) {
      el('circle', { cx: WINDOW.x + 60 + rand() * (WINDOW.w - 120), cy: WINDOW.y + 160 + rand() * 480, r: 4, fill: '#f6efd8', opacity: 0.8 }, sky);
    }
    const glyphs = el('g', { filter: url(DEF.glow) }, sky);
    glyphs.style.color = '#fff3c8';
    for (const g of GLYPH_SPOTS) glyphAt(glyphs, g.id, g.x, g.y, 190, { star: 6, line: 2.5, lineOpacity: 0.45 });
    el('circle', { cx: 1180, cy: 170, r: 46, fill: '#f6efd8', filter: url(DEF.glow), opacity: 0.9 }, sky);

    // Clouds live inside the window; drag one past the frame and it is gone.
    const cloudLayer = el('g', {}, sky);
    const nodes = clouds.map((_, i) => {
      const g = el('g', { class: 'cloud interactive', tabindex: 0, role: 'button', 'aria-label': tr(`Đám mây ${i + 1}`, `Cloud ${i + 1}`), 'data-hint': `cloud-${i}` }, cloudLayer);
      for (const [dx, dy, r] of [[-70, 20, 60], [-20, -20, 75], [50, 0, 70], [100, 30, 50], [0, 40, 70]]) {
        el('circle', { cx: dx, cy: dy, r, class: 'cloud-puff' }, g);
      }
      return g;
    });

    // Frame and sill in front.
    el('path', { d: arch, fill: 'none', stroke: '#3a2c3a', 'stroke-width': 26 }, front);
    el('line', { x1: WINDOW.x + WINDOW.w / 2, y1: WINDOW.y, x2: WINDOW.x + WINDOW.w / 2, y2: WINDOW.y + WINDOW.h, stroke: '#3a2c3a', 'stroke-width': 10, 'pointer-events': 'none' }, front);
    el('rect', { x: WINDOW.x - 60, y: WINDOW.y + WINDOW.h - 6, width: WINDOW.w + 120, height: 40, rx: 6, fill: '#4a3648' }, front);
    drawOwl(front, 380, 742, 0.9);

    const render = (i: number) => nodes[i].setAttribute('transform', `translate(${clouds[i][0].toFixed(1)} ${clouds[i][1].toFixed(1)})`);
    let wasClear = false;
    const check = () => {
      const clear = coveredGlyphs(clouds).length === 0;
      if (clear && !wasClear) sound.chime();
      wasClear = clear;
    };

    // After a wrong answer on this first level, the constellations that are showing glow one after the other, left to right:
    // the order to enter them in, shown without a word (and only those already uncovered, so nothing hidden is given away).
    let cueFrame = 0;
    const cueOrder = () => {
      cancelAnimationFrame(cueFrame);
      const covered = coveredGlyphs(clouds);
      const shown = GLYPH_SPOTS.filter((_, i) => !covered.includes(i));
      if (!shown.length) return;
      const glows = shown.map((g) => el('circle', { cx: g.x, cy: g.y, r: 110, class: 'hint-glow', opacity: 0 }, scene.overlay));
      const begin = performance.now();
      const step = (now: number) => {
        const t = (now - begin) / 1000;
        glows.forEach((glow, k) => glow.setAttribute('opacity', (0.75 * Math.sin(Math.PI * Math.min(1, Math.max(0, (t - k * 0.7) / 0.9)))).toFixed(3)));
        if (t < glows.length * 0.7 + 0.5) cueFrame = requestAnimationFrame(step);
        else glows.forEach((glow) => glow.remove());
      };
      cueFrame = requestAnimationFrame(step);
    };

    nodes.forEach((g, i) => {
      let grab = [0, 0];
      scene.draggable(g, {
        start: (p) => {
          grab = [p.x - clouds[i][0], p.y - clouds[i][1]];
          cloudLayer.appendChild(g);
        },
        move: (p) => {
          clouds[i] = [clamp(p.x - grab[0], -100, SCENE_W + 100), clamp(p.y - grab[1], -100, SCENE_H + 100)];
          render(i);
        },
        end: () => {
          sound.paper();
          check();
        },
      });
      g.addEventListener('keydown', (event) => {
        const moves: Record<string, [number, number]> = { ArrowLeft: [-40, 0], ArrowRight: [40, 0], ArrowUp: [0, -40], ArrowDown: [0, 40] };
        const m = moves[event.key];
        if (!m) return;
        event.preventDefault();
        clouds[i] = [clouds[i][0] + m[0], clouds[i][1] + m[1]];
        render(i);
        check();
      });
      render(i);
    });


    return {
      revealHints: (count) => {
        while (hinted.length < count) {
          const next = coveredGlyphs(clouds).find((g) => !hinted.includes(g));
          if (next === undefined) break;
          hinted.push(next);
        }
        return hinted.length;
      },
      hintSteps: (): HintStep[] => {
        const steps: HintStep[] = [];
        const sim = clouds.map(([x, y]) => [x, y] as [number, number]);
        GLYPH_SPOTS.forEach((spot) => {
          const c = sim.findIndex(([x, y]) => dist(x, y, spot.x, spot.y) < CLOUD_R + 50);
          if (c === -1) return;
          const from = { x: sim[c][0], y: sim[c][1] };
          const to = { x: from.x, y: SCENE_H - 40 };
          sim[c] = [to.x, to.y];
          steps.push({
            note: tr('Kéo đám mây xuống, ra khỏi ô cửa sổ để lộ chòm sao phía sau.', 'Drag the clouds down, out of the window, to uncover the constellations behind them.'),
            targets: [{ ...from, r: 110, verb: 'drag', to, object: `[data-hint="cloud-${c}"]` }],
            apply: () => {
              clouds[c] = [to.x, to.y];
              render(c);
            },
          });
        });
        steps.push({ note: tr('Đọc các chòm sao từ trái sang phải.', 'Read the constellations from left to right.'), targets: GLYPH_SPOTS.map((s) => ({ x: s.x, y: s.y, r: 110, verb: 'look' as const })) });
        return steps;
      },
      intro: (host) => {
        stopIntro = runIntro(host, {
          rest: INTRO.rest,
          rounds: INTRO.rounds,
          startDelayMs: 1200,
          key: INTRO_GLYPH,
          frame: (t) => {
            const pose = introPose(t);
            clouds[0] = [pose.cloud[0], pose.cloud[1]];
            render(0);
            return { at: { x: pose.cloud[0], y: pose.cloud[1] }, along: pose.finger.along, opacity: pose.finger.opacity, pressed: pose.finger.pressed, slot: pose.slot ? INTRO_GLYPH : null, moved: pose.cloud[1] !== CLOUDS_START[0][1] };
          },
          reset: () => {
            clouds[0] = [CLOUDS_START[0][0], CLOUDS_START[0][1]];
            render(0);
          },
          isMoved: (target) => !!target.closest('[data-hint="cloud-0"]'),
        });
      },
      wrong: () => {
        stopIntro();
        cueOrder();
      },
      destroy: () => {
        stopIntro();
        cancelAnimationFrame(cueFrame);
      },
    };
  },
};
