import { findJoin, Groups, isComplete, nextAnimalHint, sameRotation, type Composition, type Pose } from '../core/assembly';
import { drawObjectInfo, OBJECTS, type ObjectInfo, type ObjectKind } from '../core/objects';
import type { Scene } from '../core/scene';
import type { Sound } from '../core/sound';
import { el, pips } from '../core/svg';
import { mod, tween } from '../core/tween';
import type { HintTarget, MountedPuzzle } from './types';

export type PlacedObject = Pose & { id: string } & (
  | { kind: ObjectKind; info?: undefined }
  /** A one-off piece drawn inline (e.g. a printing film), not from the object catalogue. */
  | { kind?: undefined; info: ObjectInfo }
);

export const objectInfo = (o: PlacedObject): ObjectInfo => o.info ?? OBJECTS[o.kind];

export interface BoardComposition extends Composition {
  /** Where the order marks appear, relative to the first part. */
  marks: { dx: number; dy: number };
}

export interface BoardConfig {
  objects: PlacedObject[];
  compositions: BoardComposition[];
  /** Degrees per tap; 0 means objects cannot be turned. */
  rotateStep: number;
  /** Area the objects' centres must stay in. */
  bounds: { x0: number; y0: number; x1: number; y1: number };
}

/** A tap moves less than this; anything more is a drag. */
const TAP_SLOP = 6;
const KEY_STEP = 20;
/** Thread colours for the first, second and third hinted animal. */
const THREAD_COLOURS = ['#e0533c', '#2f7fbf', '#3f9a5a'];
/** Every object casts a soft shadow; a finished group's shadows merge into the animal's outline. */
const SHADOW = { dx: 12, dy: 14 };

/**
 * Free-form assembly table: drag objects anywhere, tap to turn them. Pieces that
 * belong together lock on contact and settle in front of or behind each other by
 * body part (legs and tails behind the body, heads in front); a finished animal
 * glows and shows its order marks.
 */
export function mountAssemblyBoard(scene: Scene, sound: Sound, layer: SVGGElement, cfg: BoardConfig): MountedPuzzle {
  const infoOf = new Map(cfg.objects.map((o) => [o.id, objectInfo(o)]));
  const info = (id: string): ObjectInfo => infoOf.get(id) ?? OBJECTS.teapot;
  const symmetry = (id: string) => info(id).symmetry;
  const poses: Record<string, Pose> = {};
  const shown: Record<string, Pose> = {};
  for (const o of cfg.objects) {
    poses[o.id] = { x: o.x, y: o.y, rot: o.rot };
    shown[o.id] = { x: o.x, y: o.y, rot: o.rot };
  }
  const groups = new Groups(cfg.objects.map((o) => o.id));
  const done = new Set<BoardComposition>();
  const cancels = new Map<string, () => void>();
  /** Animals (composition indexes) pointed out by hints, one per hint bought. */
  const hinted: number[] = [];

  const shadowLayer = el('g', { class: 'object-shadows' }, layer);
  const threads = el('g', { class: 'threads' }, layer);
  const objectLayer = el('g', {}, layer);
  const markLayer = el('g', {}, layer);

  const revealOf = new Map(cfg.compositions.map((c) => {
    const g = el('g', { opacity: 0, class: 'reveal' }, markLayer);
    pips(g, c.order, c.marks.dx, c.marks.dy, 11, 34, { fill: '#c2402f', stroke: '#fff3d6', 'stroke-width': 3 });
    return [c, g];
  }));

  const shadows = new Map(cfg.objects
    .filter((o) => !objectInfo(o).flat)
    .map((o) => [o.id, drawObjectInfo(shadowLayer, objectInfo(o), o.kind)]));
  const nodes = new Map(cfg.objects.map((o) => {
    const pieceInfo = objectInfo(o);
    const g = el('g', { class: `object interactive${pieceInfo.flat ? ' flat' : ''}`, tabindex: 0, role: 'button', 'aria-label': pieceInfo.name }, objectLayer);
    el('circle', { r: pieceInfo.radius * 0.55, fill: 'transparent' }, g);
    drawObjectInfo(g, pieceInfo, o.kind);
    return [o.id, g];
  }));

  /** Put pieces back into body-part order (behind / body / in front), keeping the last-moved on top within a band. */
  const restack = () => {
    const order = [...objectLayer.children].map((node) => {
      const id = [...nodes].find(([, g]) => g === node)?.[0] ?? '';
      return { node, depth: info(id).depth };
    });
    order.sort((a, b) => a.depth - b.depth);
    for (const { node } of order) objectLayer.appendChild(node);
  };

  const render = () => {
    for (const [id, g] of nodes) {
      const p = shown[id];
      g.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.rot.toFixed(1)})`);
      shadows.get(id)?.setAttribute('transform', `translate(${(p.x + SHADOW.dx).toFixed(1)} ${(p.y + SHADOW.dy).toFixed(1)}) rotate(${p.rot.toFixed(1)})`);
    }
    for (const [c, g] of revealOf) {
      const p = shown[c.parts[0].id];
      g.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
    }
    drawThreads();
  };

  /**
   * For each hinted animal not yet whole: a thread from its first piece to every
   * other piece, in a colour of its own so several hints don't get mixed up.
   */
  const drawThreads = () => {
    threads.replaceChildren();
    for (const index of hinted) {
      const c = cfg.compositions[index];
      if (done.has(c)) continue;
      const root = shown[c.parts[0].id];
      const colour = THREAD_COLOURS[hinted.indexOf(index) % THREAD_COLOURS.length];
      for (const part of c.parts.slice(1)) {
        const p = shown[part.id];
        el('line', { x1: root.x, y1: root.y, x2: p.x, y2: p.y, class: 'thread', style: `stroke: ${colour}` }, threads);
      }
      for (const part of c.parts) {
        const p = shown[part.id];
        el('circle', { cx: p.x, cy: p.y, r: 9, fill: colour, class: 'thread-knot' }, threads);
      }
    }
  };

  const animateTo = (id: string, target: Pose, ms: number) => {
    cancels.get(id)?.();
    const from = { ...shown[id] };
    cancels.set(id, tween(ms, (t) => {
      shown[id] = {
        x: from.x + (target.x - from.x) * t,
        y: from.y + (target.y - from.y) * t,
        rot: from.rot + (target.rot - from.rot) * t,
      };
      render();
    }));
  };

  const clampDelta = (members: string[], start: Record<string, Pose>, dx: number, dy: number) => {
    const { x0, y0, x1, y1 } = cfg.bounds;
    let lo = -Infinity, hi = Infinity, top = -Infinity, bottom = Infinity;
    for (const id of members) {
      lo = Math.max(lo, x0 - start[id].x);
      hi = Math.min(hi, x1 - start[id].x);
      top = Math.max(top, y0 - start[id].y);
      bottom = Math.min(bottom, y1 - start[id].y);
    }
    return { dx: Math.min(hi, Math.max(lo, dx)), dy: Math.min(bottom, Math.max(top, dy)) };
  };

  const settle = (keep: string) => {
    let join = findJoin(poses, cfg.compositions, groups, symmetry, keep);
    let joined = false;
    while (join) {
      for (const id of groups.members(join.mover.id)) {
        poses[id] = { ...poses[id], x: poses[id].x + join.dx, y: poses[id].y + join.dy };
        animateTo(id, { ...poses[id], rot: shown[id].rot }, 160);
      }
      groups.union(join.anchor.id, join.mover.id);
      joined = true;
      join = findJoin(poses, cfg.compositions, groups, symmetry, keep);
    }
    if (joined) sound.knock();
    for (const c of cfg.compositions) {
      if (done.has(c) || !isComplete(c, groups)) continue;
      done.add(c);
      for (const part of c.parts) nodes.get(part.id)?.classList.add('assembled');
      const g = revealOf.get(c);
      if (g) tween(700, (t) => g.setAttribute('opacity', t.toFixed(2)));
      setTimeout(() => sound.chime(), 200);
    }
    drawThreads();
  };

  const turn = (id: string) => {
    if (!cfg.rotateStep || groups.members(id).length > 1) return;
    poses[id] = { ...poses[id], rot: mod(poses[id].rot + cfg.rotateStep, 360) };
    const unwound = shown[id].rot % 360;
    shown[id] = { ...shown[id], rot: unwound };
    animateTo(id, { ...poses[id], rot: unwound + cfg.rotateStep }, 200);
    sound.paper();
  };

  const raise = (members: string[]) => {
    for (const id of members) {
      const g = nodes.get(id);
      if (g) objectLayer.appendChild(g);
    }
  };

  for (const [id, g] of nodes) {
    let members: string[] = [];
    let start: Record<string, Pose> = {};
    let origin = { x: 0, y: 0 };
    let moved = false;
    scene.draggable(g, {
      start: (p) => {
        members = groups.members(id);
        start = Object.fromEntries(members.map((m) => [m, { ...poses[m] }]));
        origin = p;
        moved = false;
        for (const m of members) cancels.get(m)?.();
        raise(members);
      },
      move: (p) => {
        if (!moved && Math.hypot(p.x - origin.x, p.y - origin.y) < TAP_SLOP) return;
        moved = true;
        const d = clampDelta(members, start, p.x - origin.x, p.y - origin.y);
        for (const m of members) {
          poses[m] = { ...poses[m], x: start[m].x + d.dx, y: start[m].y + d.dy };
          shown[m] = { ...shown[m], x: poses[m].x, y: poses[m].y };
        }
        render();
      },
      end: () => {
        if (!moved) turn(id);
        settle(id);
        restack();
      },
    });
    g.addEventListener('keydown', (event) => {
      const step = event.shiftKey ? KEY_STEP * 3 : KEY_STEP;
      const moves: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
      };
      if (event.key in moves) {
        const group = groups.members(id);
        const begin = Object.fromEntries(group.map((m) => [m, { ...poses[m] }]));
        const d = clampDelta(group, begin, ...moves[event.key]);
        for (const m of group) {
          poses[m] = { ...poses[m], x: begin[m].x + d.dx, y: begin[m].y + d.dy };
          shown[m] = { ...shown[m], x: poses[m].x, y: poses[m].y };
        }
        render();
      } else if (event.key === 'Enter' || event.key === ' ' || event.key === 'r') {
        turn(id);
      } else {
        return;
      }
      event.preventDefault();
      settle(id);
    });
  }

  restack();
  render();

  return {
    revealHints: (count) => {
      while (hinted.length < count) {
        const index = nextAnimalHint(cfg.compositions, groups, hinted);
        if (index === null) break;
        hinted.push(index);
      }
      drawThreads();
      return hinted.length;
    },
    hintTargets: (): HintTarget[] =>
      hinted
        .map((index) => cfg.compositions[index])
        .filter((c) => !done.has(c))
        .flatMap((c) => c.parts.map((part) => ({
          x: shown[part.id].x,
          y: shown[part.id].y,
          r: info(part.id).radius * 0.75,
          verb: cfg.rotateStep > 0 && !sameRotation(poses[part.id].rot, part.rot, symmetry(part.id)) ? 'tap' as const : 'drag' as const,
        }))),
    destroy: () => {
      for (const cancel of cancels.values()) cancel();
    },
  };
}
