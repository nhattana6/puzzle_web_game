import { DEF, url } from './defs';
import { el } from './svg';

export const SCENE_W = 1600;
export const SCENE_H = 900;

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

  private target = { x: 0, y: 0 };
  private current = { x: 0, y: 0 };
  private frame = 0;
  private drags = 0;

  constructor(container: HTMLElement, label: string) {
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
  }

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
    node.addEventListener('pointerdown', (event) => {
      if (active !== null) return;
      active = event.pointerId;
      // start() may re-order the node in the DOM, which would drop an existing capture.
      handlers.start?.(this.toScene(event));
      node.setPointerCapture(event.pointerId);
      this.drags += 1;
      node.classList.add('dragging');
    });
    node.addEventListener('pointermove', (event) => {
      if (event.pointerId === active) handlers.move(this.toScene(event));
    });
    const finish = (event: PointerEvent) => {
      if (event.pointerId !== active) return;
      active = null;
      this.drags -= 1;
      node.classList.remove('dragging');
      handlers.end?.(this.toScene(event));
    };
    node.addEventListener('pointerup', finish);
    node.addEventListener('pointercancel', finish);
  }

  destroy(): void {
    cancelAnimationFrame(this.frame);
    this.root.removeEventListener('pointermove', this.onPointerMove);
    this.root.removeEventListener('pointerleave', this.onPointerLeave);
    this.root.remove();
  }

  private onPointerMove = (event: PointerEvent): void => {
    if (this.drags > 0 || event.pointerType === 'touch') return;
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
