import { describe, expect, it } from 'vitest';
import { CLOUDS_START, GLYPH_SPOTS, INTRO, INTRO_GLYPH, introPose, nightClouds } from '../src/puzzles/nightClouds';
import { SCENE_H } from '../src/core/scene';
import { INTRO_TIP, introTip, opensFirstLevel } from '../src/ui/chapters';
import { FILTER_START, GLYPH_SPOTS as RED_SPOTS, INTRO as RED_INTRO, INTRO_GLYPH as RED_GLYPH, LIGHT_AT, introPose as redPose, redFilter } from '../src/puzzles/redFilter';
import { PUZZLES } from '../src/puzzles';
import { runIntro, type IntroEnv, type IntroFrame, type IntroSpec } from '../src/puzzles/intro';
import type { IntroHost } from '../src/puzzles/types';

describe('first-run demonstration on level 1', () => {
  const [x, y] = CLOUDS_START[0];

  it('starts and ends with the cloud where the level put it, no finger showing and the slot empty', () => {
    for (const t of [0, INTRO.back[1], INTRO.rest - 0.01]) {
      const pose = introPose(t);
      expect(pose.cloud).toEqual([x, y]);
      expect(pose.slot).toBe(false);
    }
    expect(introPose(0).finger.opacity).toBe(0);
    expect(introPose(INTRO.fadeOut[1]).finger.opacity).toBe(0);
  });

  it('drags the cloud down off the window under a pressed finger that stays on the cloud', () => {
    const mid = introPose((INTRO.slide[0] + INTRO.slide[1]) / 2);
    expect(mid.cloud[1]).toBeGreaterThan(y);
    expect(mid.cloud[1]).toBeLessThan(SCENE_H - 40);
    expect(mid.finger.pressed).toBe(true);
    expect(mid.finger.along).toBe(0);
    expect(introPose((INTRO.release[1] + INTRO.glide[0]) / 2)).toMatchObject({ cloud: [x, SCENE_H - 40], finger: { pressed: false, along: 0 } });
  });

  it('then carries the finger to the keypad key, presses it, and shows the constellation in the first slot', () => {
    const gliding = introPose((INTRO.glide[0] + INTRO.glide[1]) / 2);
    expect(gliding.finger.along).toBeGreaterThan(0);
    expect(gliding.finger.along).toBeLessThan(1);
    expect(gliding.cloud[1]).toBe(SCENE_H - 40); // the cloud stays away while the finger goes
    const pressing = introPose((INTRO.keyPress[0] + INTRO.keyPress[1]) / 2);
    expect(pressing.finger).toMatchObject({ along: 1, pressed: true });
    expect(introPose(INTRO.slot[0] + 0.1).slot).toBe(true);
    expect(introPose(INTRO.slot[0] - 0.1).slot).toBe(false); // the slot fills only once the key is pressed
    expect(introPose(INTRO.slot[1] + 0.05).slot).toBe(false);
  });

  it('shows the constellation behind the first cloud, the first one to read', () => {
    expect(INTRO_GLYPH).toBe(GLYPH_SPOTS[0].id);
    expect(INTRO_GLYPH).toBe(nightClouds.answer[0]);
    expect(GLYPH_SPOTS[0].x).toBeLessThan(GLYPH_SPOTS[1].x); // reading order is left to right
  });

  it('lets the cloud float back after the finger has gone', () => {
    const returning = introPose((INTRO.back[0] + INTRO.back[1]) / 2);
    expect(returning.cloud[1]).toBeLessThan(SCENE_H - 40);
    expect(returning.cloud[1]).toBeGreaterThan(y);
  });

  it('moves the cloud and fades the finger smoothly: no jumps between neighbouring instants', () => {
    let last = introPose(0);
    for (let t = 0.05; t < INTRO.rest; t += 0.05) {
      const pose = introPose(t);
      expect(Math.abs(pose.cloud[1] - last.cloud[1])).toBeLessThan(120);
      expect(Math.abs(pose.finger.opacity - last.finger.opacity)).toBeLessThan(0.15);
      expect(Math.abs(pose.finger.along - last.finger.along)).toBeLessThan(0.3);
      last = pose;
    }
  });
});

describe('where a first visit starts', () => {
  const fresh = { solved: [] as string[], seenTips: [] as string[], wrongAnswers: {} as Record<string, number> };

  it('goes straight into the first level for a player who has done nothing yet', () => {
    expect(opensFirstLevel(fresh)).toBe(true);
  });

  it('shows the map once the player has made the first move, solved a level or tried an answer', () => {
    expect(opensFirstLevel({ ...fresh, seenTips: [INTRO_TIP] })).toBe(false);
    expect(opensFirstLevel({ ...fresh, solved: ['night-clouds'] })).toBe(false);
    expect(opensFirstLevel({ ...fresh, wrongAnswers: { 'night-clouds': 1 } })).toBe(false);
    expect(opensFirstLevel({ ...fresh, seenTips: ['zoom'] })).toBe(true); // other tips do not count
  });
});

describe('first-run demonstration on level 3 (the red glass)', () => {
  const first = [...RED_SPOTS].sort((a, b) => a.phase - b.phase)[0];

  it('uncovers the constellation with the thinnest moon, the first to read', () => {
    expect(RED_GLYPH).toBe(first.id);
    expect(RED_GLYPH).toBe(redFilter.answer[0]);
  });

  it('starts and ends with the glass in its corner, no finger and an empty slot', () => {
    for (const t of [0, RED_INTRO.back[1], RED_INTRO.rest - 0.01]) {
      const pose = redPose(t);
      expect(pose.glass).toEqual([FILTER_START[0], FILTER_START[1]]);
      expect(pose.slot).toBe(false);
    }
    expect(redPose(0).finger.opacity).toBe(0);
  });

  it('drags the glass onto the chart until it sits right over the constellation, then goes to the keypad', () => {
    const mid = redPose((RED_INTRO.slide[0] + RED_INTRO.slide[1]) / 2);
    expect(mid.finger).toMatchObject({ pressed: true, along: 0 });
    expect(mid.glass[0]).toBeLessThan(FILTER_START[0]);
    const over = redPose((RED_INTRO.release[1] + RED_INTRO.glide[0]) / 2);
    expect(over.glass).toEqual([first.x, first.y]); // centred on it: the whole constellation is under the glass
    const gliding = redPose((RED_INTRO.glide[0] + RED_INTRO.glide[1]) / 2);
    expect(gliding.finger.along).toBeGreaterThan(0);
    expect(gliding.finger.along).toBeLessThan(1);
    expect(gliding.glass).toEqual([first.x, first.y]); // the glass stays while the finger goes
    expect(redPose((RED_INTRO.keyPress[0] + RED_INTRO.keyPress[1]) / 2).finger).toMatchObject({ along: 1, pressed: true });
    expect(redPose(RED_INTRO.slot[0] + 0.1).slot).toBe(true);
    expect(redPose(RED_INTRO.slot[0] - 0.1).slot).toBe(false);
  });
});

describe('the moon strip in the red glass demonstration', () => {
  it('shows with the thinnest moon lit (the first constellation\'s place), then moves the light to the rounder ones, up to the full moon', () => {
    const mid = (a: number, b: number) => redPose((a + b) / 2);
    expect(redPose(0).legend.opacity).toBe(0);
    expect(redPose(RED_INTRO.legendIn[1] + 0.1).legend).toEqual({ opacity: 1, lit: 0 });
    expect(mid(LIGHT_AT[1], LIGHT_AT[2]).legend.lit).toBe(1);
    expect(mid(LIGHT_AT[2], LIGHT_AT[3]).legend.lit).toBe(2);
    expect(redPose(LIGHT_AT[3] + 0.2).legend.lit).toBe(3);
    expect(redPose(RED_INTRO.legendOut[1] + 0.05).legend.opacity).toBe(0);
    expect(redPose(RED_INTRO.rest - 0.01).legend.opacity).toBe(0);
  });

  it('lights the moons in order, one at a time, while the first constellation sits in the slot', () => {
    expect([...LIGHT_AT]).toEqual([...LIGHT_AT].sort((a, b) => a - b));
    expect(LIGHT_AT[1]).toBeGreaterThan(RED_INTRO.slot[0]);
    expect(LIGHT_AT[3]).toBeLessThan(RED_INTRO.slot[1]);
  });
});

describe('help for levels that read the order from the moons', () => {
  const withMoons = ['red-filter', 'pinhole-lantern', 'glass-plates', 'broken-sky', 'star-focus', 'glow-stars', 'water-glass', 'vantage-point'];

  it('marks exactly the levels that use moon phases for their order', () => {
    expect(PUZZLES.filter((p) => p.moonOrder).map((p) => p.id).sort()).toEqual([...withMoons].sort());
  });
});

describe('a tip for each demonstration', () => {
  it('keeps the plain name for level 1 and gives every other level its own', () => {
    expect(introTip('night-clouds')).toBe(INTRO_TIP);
    expect(introTip('red-filter')).toBe('intro:red-filter');
    expect(introTip('red-filter')).not.toBe(introTip('lake-mirror'));
  });
});

describe('the loop that runs a demonstration', () => {
  /** A page of its own: events by hand, frames by hand, a clock by hand. */
  function manualPage() {
    const doc = new EventTarget();
    const frames: ((now: number) => void)[] = [];
    const timers: { cb: () => void; at: number; id: number }[] = [];
    let clock = 0;
    let ids = 0;
    const env: IntroEnv = {
      doc: doc as unknown as IntroEnv['doc'],
      raf: (cb) => (frames.push(cb), frames.length),
      caf: () => undefined,
      now: () => clock,
      setTimeout: (cb, ms) => (timers.push({ cb, at: clock + ms, id: ++ids }), ids),
      clearTimeout: (id) => void timers.splice(0, timers.length, ...timers.filter((t) => t.id !== id)),
    };
    return {
      doc,
      env,
      /** Moves the clock on and runs what is due: timers, then one frame. */
      advance(ms: number) {
        clock += ms;
        for (const t of timers.filter((x) => x.at <= clock)) {
          timers.splice(timers.indexOf(t), 1);
          t.cb();
        }
        const due = frames.splice(0);
        due.forEach((cb) => cb(clock));
      },
    };
  }
  function recordingHost() {
    const log: string[] = [];
    const host: IntroHost = {
      finger: { place: (x, y, o, p) => log.push(`finger ${x.toFixed(0)},${y.toFixed(0)} ${o.toFixed(1)}${p ? ' pressed' : ''}`), remove: () => log.push('finger removed') },
      scenePoint: (x, y) => ({ x: x / 10, y: y / 10 }),
      keyPoint: () => ({ x: 100, y: 100 }),
      showInSlot: (id) => log.push(`slot ${id}`),
      onFinish: () => log.push('finished'),
    };
    return { host, log };
  }
  const spec = (over: Partial<IntroSpec> = {}) => {
    let reset = 0;
    const s: IntroSpec = {
      rest: 2,
      rounds: 2,
      startDelayMs: 500,
      key: 'crown',
      frame: (t): IntroFrame => ({ at: { x: 200, y: 400 }, along: t < 1 ? 0 : 1, opacity: 1, pressed: false, slot: t >= 1 ? 'crown' : null, moved: true }),
      reset: () => void (reset += 1),
      isMoved: () => false,
      ...over,
    };
    return { spec: s, resets: () => reset };
  }

  it('waits a moment, then puts the finger on the thing and glides it to the key', () => {
    const page = manualPage();
    const { host, log } = recordingHost();
    runIntro(host, spec().spec, page.env);
    page.advance(400);
    expect(log).toEqual([]); // still taking in the scene
    page.advance(200); // the delay is over; the loop starts
    page.advance(16);
    expect(log).toContain('finger 20,40 1.0'); // on the thing (scene point 200,400 → screen 20,40)
    page.advance(1000);
    expect(log.at(-2)).toBe('finger 100,100 1.0'); // on the key
    expect(log.at(-1)).toBe('slot crown');
  });

  it('steps aside when the player touches or presses anything: finger gone, level put back, told once', () => {
    for (const kind of ['pointerdown', 'keydown']) {
      const page = manualPage();
      const { host, log } = recordingHost();
      const s = spec();
      runIntro(host, s.spec, page.env);
      page.advance(600);
      page.advance(16);
      page.doc.dispatchEvent(new Event(kind));
      page.doc.dispatchEvent(new Event(kind)); // a second touch changes nothing
      expect(log.filter((l) => l === 'finished')).toHaveLength(1);
      expect(log).toContain('finger removed');
      expect(log).toContain('slot null');
      expect(s.resets()).toBe(1);
      const before = log.length;
      page.advance(2000);
      expect(log).toHaveLength(before); // nothing runs any more
    }
  });

  it('leaves the thing where it is when the player takes hold of what the demonstration moved', () => {
    const OriginalElement = (globalThis as { Element?: unknown }).Element;
    class FakeElement extends EventTarget {
      closest() {
        return this;
      }
    }
    (globalThis as { Element?: unknown }).Element = FakeElement;
    try {
      const page = manualPage();
      const { host, log } = recordingHost();
      const s = spec({ isMoved: () => true });
      runIntro(host, s.spec, page.env);
      page.advance(600);
      page.advance(16);
      const press = new Event('pointerdown');
      Object.defineProperty(press, 'target', { value: new FakeElement() });
      page.doc.dispatchEvent(press);
      expect(s.resets()).toBe(0);
      expect(log).toContain('finished');
    } finally {
      (globalThis as { Element?: unknown }).Element = OriginalElement;
    }
  });

  it('ends by itself after its rounds without telling anyone, and can be torn down quietly', () => {
    const page = manualPage();
    const { host, log } = recordingHost();
    const s = spec();
    runIntro(host, s.spec, page.env);
    page.advance(600);
    for (let i = 0; i < 400 && !log.includes('finger removed'); i += 1) page.advance(16);
    expect(log).toContain('finger removed');
    expect(log).not.toContain('finished');
    expect(s.resets()).toBe(1);

    const quiet = manualPage();
    const again = recordingHost();
    const stop = runIntro(again.host, spec().spec, quiet.env);
    quiet.advance(600);
    quiet.advance(16);
    stop();
    expect(again.log).toContain('finger removed');
    expect(again.log).not.toContain('finished');
  });
});
