import { describe, expect, it } from 'vitest';
import { CHAPTERS, playTarget } from '../src/ui/chapters';

const ids = (ci: number) => CHAPTERS[ci].levels.map((p) => p.id);
const upTo = (ci: number, n: number) => [...Array(ci).keys()].flatMap(ids).concat(ids(ci).slice(0, n));

describe('the chapter play button', () => {
  it('starts a chapter nothing has been solved in', () => {
    expect(playTarget(0, [])).toEqual({ id: ids(0)[0], label: 'start' });
  });

  it('continues with the next unsolved level', () => {
    expect(playTarget(0, upTo(0, 3))).toEqual({ id: ids(0)[3], label: 'continue' });
    expect(playTarget(1, upTo(1, 5))).toEqual({ id: ids(1)[5], label: 'continue' });
  });

  it('starts the next chapter from its first level once this one is finished', () => {
    expect(playTarget(0, upTo(1, 0))).toEqual({ id: ids(1)[0], label: 'continue' });
    expect(playTarget(2, upTo(3, 0))).toEqual({ id: ids(3)[0], label: 'continue' });
  });

  it('carries on where the next chapter was left, wherever the player looks from', () => {
    expect(playTarget(0, upTo(1, 4))).toEqual({ id: ids(1)[4], label: 'continue' });
  });

  it('offers to play again, from the very first level, when nothing is left after the chapter', () => {
    const last = CHAPTERS.length - 1;
    const all = upTo(last, ids(last).length);
    expect(playTarget(last, all)).toEqual({ id: ids(0)[0], label: 'replay' });
    expect(playTarget(0, all)).toEqual({ id: ids(0)[0], label: 'replay' }); // every later chapter is done too
  });

  it('has no target for a chapter that is still locked', () => {
    expect(playTarget(1, [])).toBeNull();
    expect(playTarget(3, upTo(2, 5))).toBeNull();
    expect(playTarget(99, [])).toBeNull();
  });
});
