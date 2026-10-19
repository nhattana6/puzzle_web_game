/**
 * The level map for a phone held upright: the levels run down the screen in a gentle zigzag instead of
 * across a wide sky that has to be scrolled sideways. The map is MAP_W units wide and as tall as its levels need.
 */
export const MAP_W = 600;
/** How far the zigzag swings to either side of the middle, and the distance between two levels. */
const SWING = 95;
const STEP = 165;
/** Room above the first star, and below the last for its name, the hill and the owl. */
const TOP = 120;
const BOTTOM = 330;

export function verticalStars(count: number): [number, number][] {
  return Array.from({ length: count }, (_, i) => [MAP_W / 2 + (i % 2 ? SWING : -SWING), TOP + i * STEP] as [number, number]);
}

export const verticalHeight = (count: number): number => TOP + Math.max(0, count - 1) * STEP + BOTTOM;

/** Whether the map should run down the screen: a narrow screen held upright. */
export const verticalMapWanted = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(max-width: 700px) and (orientation: portrait)').matches;
