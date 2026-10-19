import { DEF, url } from './defs';
import { el } from './svg';

export const SCENE_W = 1600;
export const SCENE_H = 900;

/** Closest a player can zoom in: four times the whole-scene view. */
export const MAX_ZOOM = 4;

export interface View {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * The part of the scene to show in a frame of the given aspect (width / height), at a zoom around
 * (cx, cy). Zoom 1 is the smallest view with the frame's aspect that holds the whole scene (a tall
 * phone frame shows it with bands above and below); zooming in shrinks the view, which is kept
 * inside the scene so panning never drifts off into the bands.
 */
export function sceneView(zoom: number, cx: number, cy: number, aspect: number): View {
  const z = Math.min(MAX_ZOOM, Math.max(1, zoom));
  const baseW = aspect >= SCENE_W / SCENE_H ? SCENE_H * aspect : SCENE_W;
  const w = baseW / z;
  const h = w / aspect;
  const fit = (c: number, size: number, total: number) =>
    size >= total ? total / 2 : Math.min(total - size / 2, Math.max(size / 2, c));
  const x = fit(cx, w, SCENE_W) - w / 2;
  const y = fit(cy, h, SCENE_H) - h / 2;
  return { x, y, w, h };
}

/** Elements a press should reach instead of panning the view: buttons, sliders, draggable things. */
const INTERACTIVE = '.interactive, [role="button"], [role="slider"], [tabindex]';

export type LayerName = 'back' | 'mid' | 'front';

/** How far each layer drifts with the pointer: the deeper the layer, the less it moves. */
const PARALLAX: Record<LayerName | 'overlay', number> = { back: 0.25, mid: 0.55, front: 1, overlay: 1 };
const DRIFT_X = 16;
const DRIFT_Y = 9;

/** A paper diorama: stacked layers in a 1600×900 SVG with pointer parallax. */
export class Scene {
  readonly root: SVGSVGElement;
  readonly defs: SVGDefsElement;
  readonly layers: Record<LayerName, SVGGElement>;
  /** Hint highlights; moves with the front layer. */
  readonly overlay: SVGGElement;

  /** Whether the layers drift with the pointer; off for levels that need everything to hold still. */
  parallax = true;

  /** Zoom (1 = whole scene) and the scene point at the centre of the view. */
  zoom = 1;
  private centre = { x: SCENE_W / 2, y: SCENE_H / 2 };
  /** Called whenever the zoom changes (the zoom buttons follow it). */
  onZoom: (zoom: number) => void = () => undefined;
  private map: HTMLDivElement | null = null;
  private resize: ResizeObserver | null = null;
  /** Pointers down on the scene (for pinch), the gesture in progress, and pointers whose moves it owns. */
  private pointers = new Map<number, { x: number; y: number }>();
  private gesture:
    | { kind: 'pinch'; a: number; b: number; d0: number; z0: number; anchor: { x: number; y: number } }
    | { kind: 'pan'; id: number; anchor: { x: number; y: number } }
    | null = null;
  private owned = new Set<number>();
  private quietUntil = 0;

  private target = { x: 0, y: 0 };
  private current = { x: 0, y: 0 };
  private frame = 0;
  private drags = 0;

  constructor(container: HTMLElement, label: string, { zoomable = true }: { zoomable?: boolean } = {}) {
    this.root = el('svg', {
      viewBox: `0 0 ${SCENE_W} ${SCENE_H}`,
      class: 'scene',
      role: 'group',
      'aria-label': label,
    }, container);
    this.defs = el('defs', {}, this.root);
    this.layers = {
      back: el('g', { class: 'layer layer-back' }, this.root),
      mid: el('g', { class: 'layer layer-mid' }, this.root),
      front: el('g', { class: 'layer layer-front' }, this.root),
    };
    this.overlay = el('g', { class: 'layer layer-overlay' }, this.root);

    this.root.addEventListener('pointermove', this.onPointerMove);
    this.root.addEventListener('pointerleave', this.onPointerLeave);
    this.frame = requestAnimationFrame(this.tick);

    // Zoom and pan, so small details can be seen on a phone: pinch with two fingers (or the
    // wheel, or the zoom buttons); once zoomed in, dragging empty sky or two fingers moves the view.
    if (!zoomable) return;
    this.map = document.createElement('div');
    this.map.className = 'zoom-map';
    this.map.setAttribute('aria-hidden', 'true');
    this.map.hidden = true;
    this.map.appendChild(document.createElement('span'));
    container.appendChild(this.map);
    this.root.addEventListener('pointerdown', this.onGestureDown, true);
    this.root.addEventListener('pointermove', this.onGestureMove, true);
    this.root.addEventListener('pointerup', this.onGestureUp, true);
    this.root.addEventListener('pointercancel', this.onGestureUp, true);
    this.root.addEventListener('click', this.onClickCapture, true);
    this.root.addEventListener('wheel', this.onWheel, { passive: false });
    this.resize = new ResizeObserver(() => this.applyView());
    this.resize.observe(this.root);
  }

  /** Zooms by a factor around a scene point (the view's centre by default). */
  zoomBy(factor: number, around: { x: number; y: number } = this.centre): void {
    this.zoomAt(this.zoom * factor, around, this.screenOf(around));
  }

  /** Back to the whole scene. */
  resetZoom(): void {
    this.zoom = 1;
    this.centre = { x: SCENE_W / 2, y: SCENE_H / 2 };
    this.applyView();
  }

  /** Sets the zoom so that scene point `anchor` stays under screen point `screen`. */
  private zoomAt(zoom: number, anchor: { x: number; y: number }, screen: { x: number; y: number }): void {
    const rect = this.root.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const aspect = rect.width / rect.height;
    const z = Math.min(MAX_ZOOM, Math.max(1, zoom));
    const { w, h } = sceneView(z, 0, 0, aspect);
    this.zoom = z;
    this.centre = {
      x: anchor.x - ((screen.x - rect.left) / rect.width) * w + w / 2,
      y: anchor.y - ((screen.y - rect.top) / rect.height) * h + h / 2,
    };
    this.applyView();
  }

  private screenOf(p: { x: number; y: number }): { x: number; y: number } {
    const m = this.root.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const q = new DOMPoint(p.x, p.y).matrixTransform(m);
    return { x: q.x, y: q.y };
  }

  private applyView(): void {
    const rect = this.root.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const v = sceneView(this.zoom, this.centre.x, this.centre.y, rect.width / rect.height);
    // Keep the centre where the view really is, so a later pan starts from what is on screen.
    this.centre = { x: v.x + v.w / 2, y: v.y + v.h / 2 };
    this.root.setAttribute('viewBox', `${v.x.toFixed(1)} ${v.y.toFixed(1)} ${v.w.toFixed(1)} ${v.h.toFixed(1)}`);
    if (this.map) {
      this.map.hidden = this.zoom <= 1.01;
      const box = this.map.firstElementChild as HTMLElement;
      const pct = (n: number, total: number) => `${Math.max(0, Math.min(100, (n / total) * 100)).toFixed(1)}%`;
      box.style.left = pct(v.x, SCENE_W);
      box.style.top = pct(v.y, SCENE_H);
      box.style.width = pct(Math.min(v.w, SCENE_W - Math.max(0, v.x)), SCENE_W);
      box.style.height = pct(Math.min(v.h, SCENE_H - Math.max(0, v.y)), SCENE_H);
      // The little map sits in the scene's top-left corner, wherever the scene is in its box.
      const host = this.map.parentElement?.getBoundingClientRect();
      if (host) {
        this.map.style.left = `${rect.left - host.left + 8}px`;
        this.map.style.top = `${rect.top - host.top + 8}px`;
      }
    }
    this.onZoom(this.zoom);
  }

  private onGestureDown = (event: PointerEvent): void => {
    // A first finger (or the mouse) starts afresh, even if an earlier lift was never seen.
    if (event.isPrimary) {
      this.pointers.clear();
      this.owned.clear();
      this.gesture = null;
    }
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.pointers.size === 2) {
      // A second finger: pinch. Nothing under it is pressed, and the first finger stops dragging.
      const [a, b] = [...this.pointers.keys()];
      const pa = this.pointers.get(a)!;
      const pb = this.pointers.get(b)!;
      const mid = { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 };
      this.gesture = { kind: 'pinch', a, b, d0: Math.max(1, Math.hypot(pa.x - pb.x, pa.y - pb.y)), z0: this.zoom, anchor: this.toScene({ clientX: mid.x, clientY: mid.y }) };
      this.owned.add(a);
      this.owned.add(b);
      event.stopPropagation();
      event.preventDefault();
      return;
    }
    const target = event.target instanceof Element ? event.target : null;
    if (this.pointers.size === 1 && this.zoom > 1.01 && !target?.closest(INTERACTIVE)) {
      // Zoomed in and pressing empty sky: move the view.
      this.gesture = { kind: 'pan', id: event.pointerId, anchor: this.toScene(event) };
      this.owned.add(event.pointerId);
      this.root.setPointerCapture(event.pointerId);
      event.stopPropagation();
    }
  };

  private onGestureMove = (event: PointerEvent): void => {
    if (!this.pointers.has(event.pointerId)) return;
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const g = this.gesture;
    if (g?.kind === 'pinch') {
      const pa = this.pointers.get(g.a);
      const pb = this.pointers.get(g.b);
      if (pa && pb) {
        const d = Math.hypot(pa.x - pb.x, pa.y - pb.y);
        this.zoomAt(g.z0 * (d / g.d0), g.anchor, { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 });
      }
    } else if (g?.kind === 'pan' && g.id === event.pointerId) {
      this.zoomAt(this.zoom, g.anchor, { x: event.clientX, y: event.clientY });
    }
    // Moves of a finger that pinched or panned never reach the things in the scene.
    if (this.owned.has(event.pointerId)) event.stopPropagation();
  };

  private onGestureUp = (event: PointerEvent): void => {
    this.pointers.delete(event.pointerId);
    const g = this.gesture;
    if (g && (g.kind === 'pinch' ? event.pointerId === g.a || event.pointerId === g.b : event.pointerId === g.id)) {
      if (g.kind === 'pinch') this.quietUntil = performance.now() + 400;
      this.gesture = null;
    }
    // Lifting still reaches a drag the finger started, so it ends cleanly where it is.
    this.owned.delete(event.pointerId);
  };

  /** A tap that was really the end of a pinch presses nothing. */
  private onClickCapture = (event: MouseEvent): void => {
    if (performance.now() < this.quietUntil) {
      event.stopPropagation();
      event.preventDefault();
    }
  };

  private onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    const factor = Math.exp(-event.deltaY * (event.ctrlKey ? 0.01 : 0.0015));
    this.zoomAt(this.zoom * factor, this.toScene(event), { x: event.clientX, y: event.clientY });
  };

  /** Paper grain over a layer; call after drawing that layer's background. */
  grain(layer: LayerName, opacity = 0.7): void {
    el('rect', {
      x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120,
      fill: url(DEF.grain), opacity, 'pointer-events': 'none',
    }, this.layers[layer]);
  }

  /** Pointer position in scene coordinates (ignores parallax, which is frozen while dragging). */
  toScene(event: { clientX: number; clientY: number }): { x: number; y: number } {
    const matrix = this.root.getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return { x: point.x, y: point.y };
  }

  /** Pointer-captured horizontal/vertical dragging with parallax frozen. */
  draggable(
    node: SVGElement,
    handlers: {
      start?: (p: { x: number; y: number }) => void;
      move: (p: { x: number; y: number }) => void;
      end?: (p: { x: number; y: number }) => void;
    },
  ): void {
    node.style.touchAction = 'none';
    let active: number | null = null;
    let last = { clientX: 0, clientY: 0 };
    let edgeFrame = 0;
    // Zoomed in, a thing held near the frame's edge pulls the view along, and stays under the finger.
    const followEdge = () => {
      edgeFrame = 0;
      if (active === null || this.zoom <= 1.01) return;
      const rect = this.root.getBoundingClientRect();
      const margin = Math.min(36, rect.width / 8);
      const push = (p: number, lo: number, hi: number) => (p < lo + margin ? -1 : p > hi - margin ? 1 : 0);
      const dx = push(last.clientX, rect.left, rect.right);
      const dy = push(last.clientY, rect.top, rect.bottom);
      if (!dx && !dy) return;
      const before = this.root.getAttribute('viewBox');
      const step = 6 * (SCENE_W / this.zoom / Math.max(1, rect.width));
      this.centre = { x: this.centre.x + dx * step, y: this.centre.y + dy * step };
      this.applyView();
      if (this.root.getAttribute('viewBox') === before) return; // already at the scene's edge
      handlers.move(this.toScene(last));
      edgeFrame = requestAnimationFrame(followEdge);
    };
    node.addEventListener('pointerdown', (event) => {
      if (active !== null) return;
      active = event.pointerId;
      last = event;
      // start() may re-order the node in the DOM, which would drop an existing capture.
      handlers.start?.(this.toScene(event));
      node.setPointerCapture(event.pointerId);
      this.drags += 1;
      node.classList.add('dragging');
    });
    node.addEventListener('pointermove', (event) => {
      if (event.pointerId !== active) return;
      last = event;
      handlers.move(this.toScene(event));
      if (!edgeFrame) edgeFrame = requestAnimationFrame(followEdge);
    });
    const finish = (event: PointerEvent) => {
      if (event.pointerId !== active) return;
      active = null;
      cancelAnimationFrame(edgeFrame);
      edgeFrame = 0;
      this.drags -= 1;
      node.classList.remove('dragging');
      handlers.end?.(this.toScene(event));
    };
    node.addEventListener('pointerup', finish);
    node.addEventListener('pointercancel', finish);
  }

  destroy(): void {
    this.resize?.disconnect();
    this.map?.remove();
    cancelAnimationFrame(this.frame);
    this.root.removeEventListener('pointermove', this.onPointerMove);
    this.root.removeEventListener('pointerleave', this.onPointerLeave);
    this.root.remove();
  }

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.parallax || this.drags > 0 || event.pointerType === 'touch') return;
    const rect = this.root.getBoundingClientRect();
    this.target.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.target.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
  };

  private onPointerLeave = (): void => {
    if (this.drags === 0) this.target = { x: 0, y: 0 };
  };

  private tick = (): void => {
    const dx = this.target.x - this.current.x;
    const dy = this.target.y - this.current.y;
    if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
      this.current.x += dx * 0.08;
      this.current.y += dy * 0.08;
      // CSS transform (with will-change on .layer) so each layer moves on the compositor
      // instead of being repainted, filters and all, on every pointer move.
      const apply = (node: SVGGElement, depth: number) => {
        node.style.transform = `translate3d(${(-this.current.x * depth * DRIFT_X).toFixed(2)}px, ${(-this.current.y * depth * DRIFT_Y).toFixed(2)}px, 0)`;
      };
      for (const name of Object.keys(this.layers) as LayerName[]) apply(this.layers[name], PARALLAX[name]);
      apply(this.overlay, PARALLAX.overlay);
    }
    this.frame = requestAnimationFrame(this.tick);
  };
}
