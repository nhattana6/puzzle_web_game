import '@fontsource/fraunces/latin-600.css';
import { DEF, installGlobalDefs, url } from '../../src/core/defs';
import type { GlyphId } from '../../src/core/glyphs';
import { drawOwl } from '../../src/core/owl';
import { el } from '../../src/core/svg';
import { glyphAt, seeded, starfield } from '../../src/puzzles/sky';

/**
 * Portal cover art (CrazyGames asks for 1920×1080, 800×1200 and 800×800): the night sky with a few
 * glowing constellations, a crescent moon, the owl on its hill with fireflies, and the title. No other
 * text, no borders, no buttons. Layout is picked from the aspect ratio of `?w=&h=`.
 */
const params = new URLSearchParams(location.search);
const W = Number(params.get('w') ?? 1920);
const H = Number(params.get('h') ?? 1080);
const landscape = W / H > 1.3;
const portrait = W / H < 0.8;
const u = Math.min(W, H) / 100;

installGlobalDefs();
const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H }, document.body);
const defs = el('defs', {}, svg);

// Sky: deep blue fading to night, a soft glow where the title sits.
const sky = el('linearGradient', { id: 'cover-sky', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
el('stop', { offset: 0, 'stop-color': '#232a66' }, sky);
el('stop', { offset: 0.65, 'stop-color': '#141838' }, sky);
el('stop', { offset: 1, 'stop-color': '#0b0d20' }, sky);
const haze = el('radialGradient', { id: 'cover-haze' }, defs);
el('stop', { offset: 0, 'stop-color': '#4b4f9c', 'stop-opacity': 0.55 }, haze);
el('stop', { offset: 1, 'stop-color': '#4b4f9c', 'stop-opacity': 0 }, haze);
el('rect', { width: W, height: H, fill: 'url(#cover-sky)' }, svg);

const titleAt = landscape ? { x: W * 0.62, y: H * 0.78 } : portrait ? { x: W * 0.5, y: H * 0.16 } : { x: W * 0.5, y: H * 0.17 };
el('ellipse', { cx: titleAt.x, cy: titleAt.y, rx: W * 0.45, ry: H * 0.28, fill: 'url(#cover-haze)' }, svg);
starfield(svg, { x: 0, y: 0, w: W, h: H }, Math.round((W * H) / 5200), 17).querySelectorAll('.twinkle').forEach((s) => s.classList.remove('twinkle'));

// Crescent moon with a halo.
const moon = landscape ? { x: W * 0.86, y: H * 0.17, r: 9 * u } : portrait ? { x: W * 0.8, y: H * 0.33, r: 9 * u } : { x: W * 0.86, y: H * 0.38, r: 7 * u };
const moonHalo = el('radialGradient', { id: 'cover-moon-halo' }, defs);
el('stop', { offset: 0.35, 'stop-color': '#fff1c4', 'stop-opacity': 0.35 }, moonHalo);
el('stop', { offset: 1, 'stop-color': '#fff1c4', 'stop-opacity': 0 }, moonHalo);
el('circle', { cx: moon.x, cy: moon.y, r: moon.r * 2.6, fill: 'url(#cover-moon-halo)' }, svg);
const bite = el('mask', { id: 'cover-moon-mask' }, defs);
el('rect', { x: moon.x - moon.r * 2, y: moon.y - moon.r * 2, width: moon.r * 4, height: moon.r * 4, fill: '#fff' }, bite);
el('circle', { cx: moon.x + moon.r * 0.45, cy: moon.y - moon.r * 0.2, r: moon.r * 0.88, fill: '#000' }, bite);
el('circle', { cx: moon.x, cy: moon.y, r: moon.r, fill: '#fff1c4', mask: 'url(#cover-moon-mask)' }, svg);

// Constellations, glowing gold: the thing the game is about.
const star = { star: 5, line: 2.6, colour: '#fff1c4', lineColour: '#f4c66a', lineOpacity: 0.85 };
const shapes: [GlyphId, number, number, number][] = landscape
  ? [['crown', 0.42, 0.24, 26], ['dipper', 0.66, 0.34, 30], ['cross', 0.2, 0.22, 22], ['hook', 0.9, 0.5, 20]]
  : portrait
    ? [['crown', 0.27, 0.31, 28], ['dipper', 0.62, 0.45, 34], ['cross', 0.2, 0.58, 22]]
    : [['crown', 0.53, 0.42, 22], ['dipper', 0.76, 0.66, 24]];
const constellations = el('g', { filter: url(DEF.glow) }, svg);
for (const [id, fx, fy, size] of shapes) glyphAt(constellations, id, W * fx, H * fy, size * u, star);

// The owl on its hill with a small telescope, fireflies around it.
const hill = landscape ? { x: W * 0.17, y: H, r: 30 * u } : portrait ? { x: W * 0.5, y: H, r: 36 * u } : { x: W * 0.24, y: H, r: 30 * u };
el('ellipse', { cx: hill.x, cy: hill.y + hill.r * 0.25, rx: hill.r * 1.6, ry: hill.r, fill: '#221d3a' }, svg);
const owlScale = (landscape ? 3.1 : portrait ? 3.4 : 2.7) * (u / 10.8);
const owlY = hill.y - hill.r * 0.75 - 58 * owlScale;
el('rect', {
  x: hill.x + 46 * owlScale, y: owlY - 40 * owlScale, width: 26 * owlScale, height: 120 * owlScale, rx: 8 * owlScale,
  fill: '#3a3354', transform: `rotate(-32 ${hill.x + 59 * owlScale} ${owlY + 60 * owlScale})`,
}, svg);
drawOwl(svg, hill.x, owlY, owlScale, false);
// Fireflies drift in a loose arc above the owl, clear of its face.
const rand = seeded(5);
const flies = el('g', { filter: url(DEF.glow) }, svg);
for (let i = 0; i < 9; i += 1) {
  const a = Math.PI * (1.05 + (i / 8) * 0.9) + (rand() - 0.5) * 0.2;
  const d = (1.6 + rand() * 1.1) * 60 * owlScale;
  el('circle', { cx: hill.x + Math.cos(a) * d * 1.2, cy: owlY + Math.sin(a) * d * 0.8, r: (0.3 + rand() * 0.3) * u, fill: '#ffe9a0' }, flies);
}

// The title: the only words allowed on a cover.
const title = el('text', {
  x: titleAt.x, y: titleAt.y, 'text-anchor': 'middle', 'dominant-baseline': 'middle',
  'font-family': 'Fraunces, Georgia, serif', 'font-weight': 600, 'letter-spacing': `${0.04}em`,
  'font-size': (landscape ? 13 : portrait ? 12.5 : 12) * u * (portrait ? 0.86 : 1), fill: '#fff1c4', filter: url(DEF.glow),
}, svg);
title.textContent = 'The Star Keeper';
const fit = () => {
  const max = W * 0.9;
  const width = title.getComputedTextLength();
  if (width > max) title.setAttribute('font-size', String(Number(title.getAttribute('font-size')) * (max / width)));
  document.body.dataset.ready = '1';
};
void document.fonts.load('600 40px Fraunces').then(fit, fit);
