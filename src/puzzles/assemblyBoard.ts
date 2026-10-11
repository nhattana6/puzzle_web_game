import { findJoin, Groups, isComplete, nextPairHint, sameRotation, type Composition, type Pose } from '../core/assembly';
import { drawObject, OBJECTS, type ObjectKind } from '../core/objects';
import type { Scene } from '../core/scene';
import type { Sound } from '../core/sound';
import { el, pips } from '../core/svg';
import { mod, tween } from '../core/tween';
import type { HintTarget, MountedPuzzle } from './types';

export interface PlacedObject extends Pose {
  id: string;
  kind: ObjectKind;
}

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
/** Every object casts a soft shadow; a finished group's shadows merge into the animal's outline. */
const SHADOW = { dx: 12, dy: 14 };

/**
 * Free-form assembly table: drag objects anywhere, tap to turn them. Pieces that
 * belong together lock on contact and settle in front of or behind each other by
 * body part (legs and tails behind the body, heads in front); a finished animal
 * glows and shows its order marks.
 */
export function mountAssemblyBoard(scene: Scene, sound: Sound, layer: SVGGElement, cfg: BoardConfig): MountedPuzzle {
  const kindOf = new Map(cfg.objects.map((o) => [o.id, o.kind]));
  const symmetry = (id: string) => OBJECTS[kindOf.get(id) ?? 'teapot'].symmetry;
  const poses: Record<string, Pose> = {};
  const shown: Record<string, Pose> = {};
  for (const o of cfg.objects) {
    poses[o.id] = { x: o.x, y: o.y, rot: o.rot };
    shown[o.id] = { x: o.x, y: o.y, rot: o.rot };
  }
  const groups = new Groups(cfg.objects.map((o) => o.id));
  const done = new Set<BoardComposition>();
  const cancels = new Map<string, () => void>();
  /** Pairs of pieces pointed out by hints, one per hint bought. */
  const hinted: [string, string][] = [];

  const shadowLayer = el('g', { class: 'object-shadows' }, layer);
  const threads = el('g', { class: 'threads' }, layer);
  const objectLayer = el('g', {}, layer);
  const markLayer = el('g', {}, layer);

  const revealOf = new Map(cfg.compositions.map((c) => {
    const g = el('g', { opacity: 0, class: 'reveal' }, markLayer);
    pips(g, c.order, c.marks.dx, c.marks.dy, 11, 34, { fill: '#c2402f', stroke: '#fff3d6', 'stroke-width': 3 });
    return [c, g];
  }));

  const shadows = new Map(cfg.objects.map((o) => [o.id, drawObject(shadowLayer, o.kind)]));
  const nodes = new Map(cfg.objects.map((o) => {
    const info = OBJECTS[o.kind];
    const g = el('g', { class: 'object interactive', tabindex: 0, role: 'button', 'aria-label': info.name }, objectLayer);
    el('circle', { r: info.radius * 0.55, fill: 'transparent' }, g);
    drawObject(g, o.kind);
    return [o.id, g];
  }));

  /** Put pieces back into body-part order (behind / body / in front), keeping the last-moved on top within a band. */
  const restack = () => {
    const order = [...objectLayer.children].map((node) => {
      const id = [...nodes].find(([, g]) => g === node)?.[0] ?? '';
      return { node, depth: OBJECTS[kindOf.get(id) ?? 'teapot'].depth };
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

  /** A red thread between each hinted pair that is not locked together yet. */
  const drawThreads = () => {
    threads.replaceChildren();
    for (const [a, b] of hinted) {
      if (groups.same(a, b)) continue;
      el('line', { x1: shown[a].x, y1: shown[a].y, x2: shown[b].x, y2: shown[b].y, class: 'thread' }, threads);
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

  const partFor = (id: string) => {
    for (const c of cfg.compositions) {
      const part = c.parts.find((p) => p.id === id);
      if (part) return { c, part };
    }
    return null;
  };

  return {
    revealHints: (count) => {
      while (hinted.length < count) {
        const pair = nextPairHint(cfg.compositions, groups, hinted);
        if (!pair) break;
        hinted.push(pair);
      }
      drawThreads();
    },
    hintTargets: (): HintTarget[] => {
      const ids = [...new Set(hinted.filter(([a, b]) => !groups.same(a, b)).flat())];
      return ids.map((id) => {
        const owner = partFor(id);
        const misturned = cfg.rotateStep > 0 && owner && !sameRotation(poses[id].rot, owner.part.rot, symmetry(id));
        return {
          x: shown[id].x,
          y: shown[id].y,
          r: OBJECTS[kindOf.get(id) ?? 'teapot'].radius * 0.75,
          verb: misturned ? 'tap' : 'drag',
        };
      });
    },
    destroy: () => {
      for (const cancel of cancels.values()) cancel();
    },
  };
}
