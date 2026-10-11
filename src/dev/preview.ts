/**
 * Dev-only page (not part of the build): draws every assembly composition fully
 * put together, with shadows, so object art and offsets can be tuned by eye.
 * Run `npm run dev` and open /preview.html.
 */
import { drawObject, OBJECTS } from '../core/objects';
import { el } from '../core/svg';
import { TEA_TRAY } from '../puzzles/teaTray';
import { TOY_ATTIC } from '../puzzles/toyAttic';

const comps = [...TEA_TRAY.compositions, ...TOY_ATTIC.compositions];
const kinds = new Map([...TEA_TRAY.objects, ...TOY_ATTIC.objects].map((o) => [o.id, o.kind]));
const svg = el('svg', { viewBox: '0 0 1500 1000' }, document.body);
comps.forEach((c, i) => {
  const cx = 250 + (i % 3) * 500;
  const cy = 260 + Math.floor(i / 3) * 480;
  const cell = el('g', {}, svg);
  el('text', { x: cx - 220, y: cy - 200, fill: '#fff', 'font-size': 28 }, cell).textContent = c.animal;
  const sorted = [...c.parts].sort((a, b) => OBJECTS[kinds.get(a.id)!].depth - OBJECTS[kinds.get(b.id)!].depth);
  for (const pass of ['shadow', 'object'] as const) {
    for (const part of sorted) {
      const off = pass === 'shadow' ? 12 : 0;
      const g = el('g', { transform: `translate(${cx + part.dx + off} ${cy + part.dy + off}) rotate(${part.rot})` }, cell);
      if (pass === 'shadow') g.setAttribute('style', 'filter: brightness(0); opacity: 0.3');
      drawObject(g, kinds.get(part.id)!);
    }
  }
});
