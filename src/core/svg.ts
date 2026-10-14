export const SVG_NS = 'http://www.w3.org/2000/svg';

type Attrs = Record<string, string | number | undefined>;

export function el<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  parent?: Element | null,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  setAttrs(node, attrs);
  parent?.appendChild(node);
  return node;
}

export function setAttrs(node: Element, attrs: Attrs): void {
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== undefined) node.setAttribute(key, String(value));
  }
}

let counter = 0;
/** Document-unique id for clip paths, gradients and filters created at runtime. */
export function uid(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

/** Path for a ring (annulus) centred on (cx, cy); a disc when inner is 0. Fill with evenodd. */
export function annulusPath(cx: number, cy: number, inner: number, outer: number): string {
  const circle = (r: number) =>
    `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
  return inner > 0 ? `${circle(outer)} ${circle(inner)}` : circle(outer);
}

/** Five-pointed star path centred on (cx, cy), first point straight up. */
export function starPath(cx: number, cy: number, outer: number, inner: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    points.push(`${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${points.join(' L')} Z`;
}

/** Makes an SVG element behave like a button for mouse, touch and keyboard. */
export function asButton(node: SVGElement, label: string, onActivate: () => void): void {
  setAttrs(node, { tabindex: 0, role: 'button', 'aria-label': label });
  node.addEventListener('click', onActivate);
  node.addEventListener('keydown', (event) => {
    const key = (event as KeyboardEvent).key;
    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      onActivate();
    }
  });
}

/**
 * A moon in phase 1–4 (thin crescent, half, gibbous, full), centred on (x, y).
 * Moon phases are the game's wordless numbering: they mark the reading order.
 */
export function moonPhase(parent: Element, phase: number, x: number, y: number, r = 14, attrs: Attrs = {}): SVGGElement {
  const g = el('g', { class: 'moon-phase', transform: `translate(${x} ${y})`, ...attrs }, parent);
  el('circle', { r, class: 'moon-dark' }, g);
  const lit = {
    1: `M0 ${-r} A${r} ${r} 0 0 1 0 ${r} A${r * 0.55} ${r} 0 0 0 0 ${-r} Z`,
    2: `M0 ${-r} A${r} ${r} 0 0 1 0 ${r} Z`,
    3: `M0 ${-r} A${r} ${r} 0 0 1 0 ${r} A${r * 0.55} ${r} 0 0 1 0 ${-r} Z`,
  }[phase];
  if (lit) el('path', { d: lit, class: 'moon-lit' }, g);
  else el('circle', { r, class: 'moon-lit' }, g);
  return g;
}

/** Every tool icon is drawn in a 24-unit box (Lucide shapes) at this scale, so they all come out the same size. */
const ICON_SCALE = 2.1;

/**
 * The "undo" icon: an arrow turning back, centred on (0, 0). Its shapes fill only 16 of the 24 units,
 * so it is scaled up a little (by 18/16) to look the same size as the others.
 */
export function undoIcon(parent: Element): SVGGElement {
  const g = el('g', { transform: `scale(${ICON_SCALE * 1.125}) translate(-12 -12)`, fill: 'none', 'stroke-width': 2 / 1.125 }, parent);
  el('path', { d: 'M9 14 4 9l5-5' }, g);
  el('path', { d: 'M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11' }, g);
  return g;
}

/** The "start again" icon: a circular arrow, centred on (0, 0). */
export function resetIcon(parent: Element): SVGGElement {
  const g = el('g', { transform: `scale(${ICON_SCALE}) translate(-12 -12)`, fill: 'none', 'stroke-width': 2 }, parent);
  el('path', { d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' }, g);
  el('path', { d: 'M3 3v5h5' }, g);
  return g;
}

/** A plain arrow pointing along (dx, dy) (one of the four directions), centred on (0, 0). */
export function arrowIcon(parent: Element, dx: number, dy: number): SVGGElement {
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  const g = el('g', { transform: `rotate(${deg}) scale(${ICON_SCALE}) translate(-12 -12)`, fill: 'none', 'stroke-width': 2 }, parent);
  el('path', { d: 'M12 19V5 M5 12l7-7 7 7' }, g);
  return g;
}

/** Radius of the round tool buttons: undo, reset and the arrows are all drawn by `toolButton`, so they match. */
export const TOOL_R = 60;

/** A round tool button with an icon, the same size and look wherever it is used. */
export function toolButton(
  parent: Element,
  x: number,
  y: number,
  label: string,
  drawIcon: (g: SVGGElement) => void,
  onTap: () => void,
): SVGGElement {
  const g = el('g', { class: 'interactive', transform: `translate(${x} ${y})` }, parent);
  el('circle', { r: TOOL_R * 1.35, fill: 'transparent' }, g);
  el('circle', { r: TOOL_R, fill: '#241f33', stroke: '#6b4f24', 'stroke-width': 5, 'pointer-events': 'none' }, g);
  const art = el('g', { stroke: '#f6efd8', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none', 'pointer-events': 'none' }, g);
  drawIcon(art);
  asButton(g, label, onTap);
  return g;
}
