/**
 * Small things, bigger, on a phone. The whole scene is shown at 0.22–0.37 of its drawn size there, so a lamp
 * drawn 50 units wide is 11 px: too small to see what it is, let alone to hit. Every tap/drag target whose painted
 * shape would show under GROW_MIN_PX is drawn larger (up to GROW_MAX times), about its own centre, as far as the
 * space between it and its neighbours allows. Long thin things (levers, sliders) are left alone, because making
 * them bigger makes them longer rather than easier. Where a thing sits and what it does do not change: only what
 * its drawing looks like, and so what a finger can hit.
 */

export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Smallest size (screen px, shorter side) a thing is drawn at; anything smaller is enlarged to it. */
export const GROW_MIN_PX = 28;
/** Largest enlargement. */
export const GROW_MAX = 2.4;
/** Things longer than this many times their short side are not enlarged. */
export const GROW_ELONGATED = 2.6;
/** The enlargement only applies to a scene frame narrower than this (px): phones, not desktop. */
export const GROW_FRAME_MAX = 700;

/** Empty space between two boxes along each axis (0 where they overlap on that axis). */
export interface Gap {
  gx: number;
  gy: number;
}

export const boxGaps = (a: Box, b: Box): Gap => ({
  gx: Math.max(a.left - b.right, b.left - a.right, 0),
  gy: Math.max(a.top - b.bottom, b.top - a.bottom, 0),
});

/** Share of the space between two things that they may grow into (the rest stays as breathing room). */
export const GROW_SPACE = 0.8;

/**
 * How much to enlarge a thing of w×h px so its short side reaches `min`, never past `max`, and never so much
 * that it would run into a neighbour. Two things stay apart if they stay apart along either axis, and each may
 * use half the empty space on that axis. 1 means leave it.
 */
export function growFactor(w: number, h: number, near: readonly Gap[], min = GROW_MIN_PX, max = GROW_MAX): number {
  const side = Math.min(w, h);
  const long = Math.max(w, h);
  if (side < 1 || side >= min || long / side > GROW_ELONGATED) return 1;
  let k = Math.min(max, min / side);
  for (const { gx, gy } of near) k = Math.min(k, 1 + GROW_SPACE * Math.max(gx / w, gy / h));
  return k < 1.08 ? 1 : k;
}

const SHAPES = 'circle, ellipse, rect, path, polygon, polyline, line, text, image, use';

const alpha = (colour: string): number => {
  const m = colour.match(/rgba?\(([^)]+)\)/);
  if (!m) return colour === 'none' ? 0 : 1;
  const parts = m[1].split(',').map(Number);
  return parts.length > 3 ? parts[3] : 1;
};

/** The screen box of what is actually drawn in `node`: invisible hit areas (transparent fill, no stroke) don't count. */
export function paintedBox(node: Element): Box | null {
  let box: Box | null = null;
  const shapes = node.matches(SHAPES) ? [node] : [...node.querySelectorAll(SHAPES)];
  for (const shape of shapes) {
    const cs = getComputedStyle(shape);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05 || shape.closest('defs')) continue;
    const filled = cs.fill !== 'none' && alpha(cs.fill) > 0.05;
    const stroked = cs.stroke !== 'none' && alpha(cs.stroke) > 0.05 && parseFloat(cs.strokeWidth) > 0;
    if (shape.tagName !== 'use' && !filled && !stroked) continue;
    const r = shape.getBoundingClientRect();
    if (r.width < 0.5 && r.height < 0.5) continue;
    box = box
      ? { left: Math.min(box.left, r.left), top: Math.min(box.top, r.top), right: Math.max(box.right, r.right), bottom: Math.max(box.bottom, r.bottom) }
      : { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
  }
  return box;
}

interface Tracked {
  node: SVGGElement;
  /** Its wrapper: only made once the thing is actually enlarged. */
  wrap: SVGGElement | null;
  /** Painted size and the empty space to each other thing, in scene units, at factor 1. */
  w: number;
  h: number;
  near: Gap[];
  /** Centre of the painted shape in the wrapper's own coordinates (where it is enlarged from). */
  cx: number;
  cy: number;
  /** The most this thing may be enlarged: `data-grow` on it, for a thing with signs or labels beside it. */
  max: number;
}

const WRAP = 'grow-wrap';

/** Draws the small tap/drag things of one scene larger; see the file comment. */
export class Grower {
  private tracked: Tracked[] = [];
  private observer: MutationObserver | null = null;
  private frame = 0;
  private selector: string;
  /** Whether the scene has been looked over (it is not while the frame is wide: nothing is drawn differently then). */
  private scanned = false;

  constructor(
    private readonly root: SVGSVGElement,
    private readonly stage: SVGGElement,
    interactive: string,
  ) {
    this.selector = interactive;
  }

  /** Looks the scene over for small things (after the level is drawn, and when things are added). */
  scan(): void {
    this.stopWatching();
    const root = this.root.getBoundingClientRect();
    const vb = this.root.viewBox.baseVal;
    if (!root.width || !vb.width || root.width >= GROW_FRAME_MAX) {
      // Wide frame (desktop): leave the scene exactly as drawn. A later narrower frame scans from update().
      this.scanned = false;
      return;
    }
    this.scanned = true;
    // Measure everything at factor 1.
    for (const t of this.tracked) if (t.wrap) t.wrap.style.transform = '';
    const s = root.width / vb.width;

    const nodes = this.leaves();
    const measured = nodes.flatMap((node) => {
      const box = paintedBox(node);
      return box ? [{ node, box }] : [];
    });
    const next: Tracked[] = [];
    for (const { node, box } of measured) {
      const near: Gap[] = [];
      for (const other of measured) {
        if (other.node === node) continue;
        const g = boxGaps(box, other.box);
        // Only neighbours that could be reached matter: far-off things never limit a thing that is a few px big.
        if (Math.max(g.gx, g.gy) < 400 * s) near.push({ gx: g.gx / s, gy: g.gy / s });
      }
      // The wrapper has no transform of its own, so the thing's own coordinates are the wrapper's.
      const m = node.getScreenCTM();
      if (!m) continue;
      const c = new DOMPoint((box.left + box.right) / 2, (box.top + box.bottom) / 2).matrixTransform(m.inverse());
      next.push({ node, wrap: this.tracked.find((t) => t.node === node)?.wrap ?? null, w: (box.right - box.left) / s, h: (box.bottom - box.top) / s, near, cx: c.x, cy: c.y, max: Number(node.getAttribute('data-grow')) || GROW_MAX });
    }
    // Nodes that are no longer small things go back to normal.
    for (const t of this.tracked) if (t.wrap && !next.some((n) => n.node === t.node)) t.wrap.style.transform = '';
    this.tracked = next;
    this.update();
    this.startWatching();
  }

  /** Sets every factor for the current zoom and frame size: cheap enough to run on every pinch step. */
  update(): void {
    const root = this.root.getBoundingClientRect();
    const vb = this.root.viewBox.baseVal;
    const on = root.width > 0 && root.width < GROW_FRAME_MAX && vb.width > 0;
    if (on && !this.scanned) return this.scan();
    const s = on ? root.width / vb.width : 0;
    // Things of one kind (the same painted size) are enlarged alike, by what the most crowded of them allows,
    // so a row of lamps or a grid of stars does not end up in mixed sizes.
    const kind = (t: Tracked) => `${Math.round(t.w / 6)}x${Math.round(t.h / 6)}`;
    const factor = new Map<string, number>();
    const alone = this.tracked.map((t) => (on ? growFactor(t.w * s, t.h * s, t.near.map((g) => ({ gx: g.gx * s, gy: g.gy * s })), GROW_MIN_PX, t.max) : 1));
    this.tracked.forEach((t, i) => factor.set(kind(t), Math.min(factor.get(kind(t)) ?? Infinity, alone[i])));
    for (const t of this.tracked) {
      const k = factor.get(kind(t)) ?? 1;
      if (k > 1) {
        t.wrap = this.wrapOf(t.node);
        t.wrap.style.transformOrigin = `${t.cx.toFixed(1)}px ${t.cy.toFixed(1)}px`;
        t.wrap.style.transform = `scale(${k.toFixed(3)})`;
      } else if (t.wrap) {
        t.wrap.style.transform = '';
      }
    }
  }

  destroy(): void {
    this.stopWatching();
    cancelAnimationFrame(this.frame);
    this.tracked = [];
  }

  /** Interactive things with nothing interactive inside or around them, that can hold a wrapper (groups). */
  private leaves(): SVGGElement[] {
    const out: SVGGElement[] = [];
    this.stage.querySelectorAll(this.selector).forEach((n) => {
      if (!(n instanceof SVGGElement) || n.classList.contains(WRAP) || n.closest('[data-nogrow]')) return;
      if (n.querySelector(this.selector) || n.parentElement?.closest(this.selector)) return;
      const r = n.getBoundingClientRect();
      if (r.width < 1 && r.height < 1) return;
      if (getComputedStyle(n).pointerEvents === 'none') return;
      out.push(n);
    });
    return out;
  }

  /** The group that holds everything drawn in `node`, made if it is not there yet (or lost to a redraw). */
  private wrapOf(node: SVGGElement): SVGGElement {
    let wrap = [...node.children].find((c): c is SVGGElement => c instanceof SVGGElement && c.classList.contains(WRAP));
    if (!wrap) {
      wrap = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      wrap.setAttribute('class', WRAP);
      node.appendChild(wrap);
    }
    for (const child of [...node.children]) if (child !== wrap) wrap.appendChild(child);
    this.observer?.takeRecords(); // our own edits are not a redraw
    return wrap;
  }

  private startWatching(): void {
    this.observer ??= new MutationObserver((records) => {
      // A redraw that replaced what a tracked thing holds, or something interactive that is new.
      const redrawn = records.some((r) => this.tracked.some((t) => t.wrap && t.node === r.target) && [...(r.target as Element).children].some((c) => !(c as Element).classList.contains(WRAP)));
      const added = records.some((r) => [...r.addedNodes].some((n) => n instanceof Element && (n.matches(this.selector) || !!n.querySelector(this.selector))));
      if (!redrawn && !added) return;
      cancelAnimationFrame(this.frame);
      this.frame = requestAnimationFrame(() => this.scan());
    });
    this.observer.observe(this.stage, { childList: true, subtree: true });
  }

  private stopWatching(): void {
    this.observer?.disconnect();
  }
}
