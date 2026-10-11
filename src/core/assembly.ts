import { mod } from './tween';
import type { ZodiacId } from './zodiac';

/**
 * Pure rules for the object-assembly puzzles: objects move freely; when two objects
 * that belong to the same animal sit in the right place relative to each other
 * (and both face the right way), they lock together and move as one from then on.
 */

export interface Pose {
  x: number;
  y: number;
  /** Degrees, clockwise. */
  rot: number;
}

export interface Part {
  id: string;
  /** Position relative to the composition's origin (any point; only differences matter). */
  dx: number;
  dy: number;
  rot: number;
}

export interface Composition {
  animal: ZodiacId;
  /** Place in the answer, shown as diamond marks once the animal is complete. */
  order: number;
  parts: Part[];
}

/** How far off (scene units) two pieces may be and still click together. */
export const JOIN_TOLERANCE = 26;

export const sameRotation = (a: number, b: number, symmetry = 360): boolean =>
  mod(Math.round(a - b), symmetry) === 0;

/** Two parts fit when both face the right way and their offset matches the plan. */
export function partsFit(
  poses: Readonly<Record<string, Pose>>,
  a: Part,
  b: Part,
  symmetry: (id: string) => number = () => 360,
): boolean {
  const pa = poses[a.id];
  const pb = poses[b.id];
  if (!pa || !pb) return false;
  if (!sameRotation(pa.rot, a.rot, symmetry(a.id)) || !sameRotation(pb.rot, b.rot, symmetry(b.id))) return false;
  const ex = pb.x - pa.x - (b.dx - a.dx);
  const ey = pb.y - pa.y - (b.dy - a.dy);
  return Math.hypot(ex, ey) <= JOIN_TOLERANCE;
}

/** Union–find over object ids: which objects have locked together. */
export class Groups {
  private parent = new Map<string, string>();

  constructor(ids: Iterable<string>) {
    for (const id of ids) this.parent.set(id, id);
  }

  find(id: string): string {
    let root = id;
    while (this.parent.get(root) !== root) root = this.parent.get(root) ?? root;
    let node = id;
    while (node !== root) {
      const next = this.parent.get(node) ?? root;
      this.parent.set(node, root);
      node = next;
    }
    return root;
  }

  union(a: string, b: string): void {
    this.parent.set(this.find(b), this.find(a));
  }

  same(a: string, b: string): boolean {
    return this.find(a) === this.find(b);
  }

  members(id: string): string[] {
    const root = this.find(id);
    return [...this.parent.keys()].filter((other) => this.find(other) === root);
  }
}

export interface Join {
  composition: Composition;
  /** Stays put. */
  anchor: Part;
  /** Its whole group moves by (dx, dy) to sit exactly in place. */
  mover: Part;
  dx: number;
  dy: number;
}

/** The next pair that fits but is not yet locked together, if any. */
export function findJoin(
  poses: Readonly<Record<string, Pose>>,
  compositions: readonly Composition[],
  groups: Groups,
  symmetry?: (id: string) => number,
  /** Prefer to keep this object (the one just dropped) where the player put it. */
  keep?: string,
): Join | null {
  for (const composition of compositions) {
    const { parts } = composition;
    for (let i = 0; i < parts.length; i += 1) {
      for (let j = i + 1; j < parts.length; j += 1) {
        let a = parts[i];
        let b = parts[j];
        if (groups.same(a.id, b.id) || !partsFit(poses, a, b, symmetry)) continue;
        if (keep && groups.same(b.id, keep)) [a, b] = [b, a];
        const pa = poses[a.id];
        const pb = poses[b.id];
        return {
          composition,
          anchor: a,
          mover: b,
          dx: pa.x + (b.dx - a.dx) - pb.x,
          dy: pa.y + (b.dy - a.dy) - pb.y,
        };
      }
    }
  }
  return null;
}

export const isComplete = (composition: Composition, groups: Groups): boolean =>
  composition.parts.every((part) => groups.same(part.id, composition.parts[0].id));

/** Answer in the order given by each composition's marks. */
export const answerOf = (compositions: readonly Composition[]): ZodiacId[] =>
  [...compositions].sort((a, b) => a.order - b.order).map((c) => c.animal);

/**
 * Hint helper: the next pair of pieces to point out. Keeps helping with the animal
 * already being hinted until it is whole, then moves to the next unfinished one.
 * Links a piece not yet attached to the nearest (in the plan) piece of the group
 * that holds the animal's first part. Pairs already shown are skipped.
 */
export function nextPairHint(
  compositions: readonly Composition[],
  groups: Groups,
  revealed: readonly (readonly [string, string])[],
): [string, string] | null {
  const shown = (a: string, b: string) => revealed.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const lastHinted = [...revealed].reverse()
    .map(([a]) => compositions.find((c) => c.parts.some((p) => p.id === a)))
    .find((c) => c && !isComplete(c, groups));
  const queue = [...(lastHinted ? [lastHinted] : []), ...compositions.filter((c) => c !== lastHinted)];
  for (const c of queue) {
    if (isComplete(c, groups)) continue;
    const root = c.parts[0];
    const inGroup = c.parts.filter((p) => groups.same(p.id, root.id));
    // A piece that already has a thread it hasn't followed yet doesn't need another.
    const waiting = (id: string) => revealed.some(([x, y]) => (x === id || y === id) && !groups.same(x, y));
    for (const loose of c.parts.filter((p) => !groups.same(p.id, root.id) && !waiting(p.id))) {
      const partner = [...inGroup]
        .sort((a, b) => Math.hypot(a.dx - loose.dx, a.dy - loose.dy) - Math.hypot(b.dx - loose.dx, b.dy - loose.dy))
        .find((p) => !shown(p.id, loose.id));
      if (partner) return [partner.id, loose.id];
    }
  }
  return null;
}
