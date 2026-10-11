import { el, SVG_NS } from './svg';

/** Ids of the shared SVG definitions, installed once in a hidden <svg> on the page. */
export const DEF = {
  grain: 'def-grain',
  rough: 'def-rough',
  glow: 'def-glow',
  softShadow: 'def-soft-shadow',
} as const;

/** Paper grain and fibres painted once to a canvas, reused everywhere as a pattern. */
function paperTexture(size = 256): string {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  if (!g) return '';
  for (let i = 0; i < 2600; i += 1) {
    const shade = Math.random() < 0.5 ? '60,40,20' : '255,250,235';
    g.fillStyle = `rgba(${shade},${(Math.random() * 0.12).toFixed(3)})`;
    g.fillRect(Math.random() * size, Math.random() * size, 1.4, 1.4);
  }
  g.lineCap = 'round';
  for (let i = 0; i < 70; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const a = Math.random() * Math.PI;
    const len = 6 + Math.random() * 22;
    g.strokeStyle = `rgba(90,65,35,${(0.05 + Math.random() * 0.08).toFixed(3)})`;
    g.lineWidth = 0.6;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a + 0.5) * len * 0.5, y + Math.sin(a + 0.5) * len * 0.5, x + Math.cos(a) * len, y + Math.sin(a) * len);
    g.stroke();
  }
  return canvas.toDataURL('image/png');
}

export function installGlobalDefs(): void {
  if (document.getElementById('global-defs')) return;
  const root = document.createElementNS(SVG_NS, 'svg');
  root.id = 'global-defs';
  root.setAttribute('aria-hidden', 'true');
  root.setAttribute('width', '0');
  root.setAttribute('height', '0');
  root.style.position = 'absolute';
  const defs = el('defs', {}, root);

  const pattern = el('pattern', { id: DEF.grain, width: 256, height: 256, patternUnits: 'userSpaceOnUse' }, defs);
  el('image', { href: paperTexture(), width: 256, height: 256 }, pattern);

  // Slightly torn edges for cut paper.
  const rough = el('filter', { id: DEF.rough, x: '-5%', y: '-5%', width: '110%', height: '110%' }, defs);
  el('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.06, numOctaves: 2, seed: 7, result: 'n' }, rough);
  el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 3, xChannelSelector: 'R', yChannelSelector: 'G' }, rough);

  const glow = el('filter', { id: DEF.glow, x: '-30%', y: '-30%', width: '160%', height: '160%' }, defs);
  el('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: 6, result: 'blur' }, glow);
  const merge = el('feMerge', {}, glow);
  el('feMergeNode', { in: 'blur' }, merge);
  el('feMergeNode', { in: 'SourceGraphic' }, merge);

  const soft = el('filter', { id: DEF.softShadow, x: '-10%', y: '-10%', width: '120%', height: '120%' }, defs);
  el('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: 2.5 }, soft);

  document.body.prepend(root);
}

export const url = (id: string): string => `url(#${id})`;
