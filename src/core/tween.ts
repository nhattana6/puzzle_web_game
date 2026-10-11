export const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;
export const easeInOutSine = (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2;

/** Runs onUpdate with eased progress 0..1 over duration ms. Returns a cancel function. */
export function tween(
  duration: number,
  onUpdate: (t: number) => void,
  ease: (t: number) => number = easeOutCubic,
): () => void {
  const start = performance.now();
  let frame = 0;
  let finished = false;
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    onUpdate(ease(t));
    if (t < 1) frame = requestAnimationFrame(step);
    else finished = true;
  };
  frame = requestAnimationFrame(step);
  return () => {
    if (!finished) cancelAnimationFrame(frame);
  };
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const mod = (value: number, n: number): number => ((value % n) + n) % n;
