import { afterEach, describe, expect, it } from 'vitest';
import { createPokiPlatform, type PokiSdk } from '../src/core/poki';

/** A stand-in PokiSDK that records every call; the commercial break ends when the test says so. */
function fakePoki(opts: { initFails?: boolean; breakFails?: boolean; breakNever?: boolean } = {}) {
  const calls: string[] = [];
  let endBreak = () => {};
  const sdk: PokiSdk = {
    init: () => (opts.initFails ? Promise.reject(new Error('blocked')) : Promise.resolve()),
    gameLoadingFinished: () => calls.push('gameLoadingFinished'),
    gameplayStart: () => calls.push('gameplayStart'),
    gameplayStop: () => calls.push('gameplayStop'),
    happyTime: (n) => calls.push(`happyTime ${n}`),
    commercialBreak: (beforeAd) => {
      calls.push('commercialBreak');
      if (opts.breakFails) return Promise.reject(new Error('no ad'));
      if (opts.breakNever) return new Promise(() => undefined);
      beforeAd?.();
      return new Promise<void>((resolve) => (endBreak = resolve));
    },
  };
  return { sdk, calls, endBreak: () => endBreak() };
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('Poki platform wrapper', () => {
  const realWindow = (globalThis as { window?: unknown }).window;
  afterEach(() => {
    (globalThis as { window?: unknown }).window = realWindow;
  });

  it('does nothing without an SDK', async () => {
    const platform = createPokiPlatform(() => undefined);
    expect(await platform.init()).toBe(false);
    expect(platform.active).toBe(false);
    platform.loadingStop();
    platform.gameplayStart();
    platform.gameplayStop();
    expect(platform.portal).toBe('poki');
    expect(platform.storage()).toBeNull();
  });

  it('reports loading finished once', async () => {
    const { sdk, calls } = fakePoki();
    const platform = createPokiPlatform(() => sdk);
    expect(await platform.init()).toBe(true);
    platform.loadingStart();
    platform.loadingStop();
    platform.loadingStop();
    expect(calls).toEqual(['gameLoadingFinished']);
  });

  it('puts the commercial break before gameplayStart, with sound off while it runs', async () => {
    const { sdk, calls, endBreak } = fakePoki();
    const platform = createPokiPlatform(() => sdk);
    await platform.init();
    const muteChanges: boolean[] = [];
    platform.onMuteChange((m) => muteChanges.push(m));
    platform.gameplayStart();
    await tick();
    expect(calls).toEqual(['commercialBreak']); // not started yet: the ad is playing
    expect(platform.muted).toBe(true);
    endBreak();
    await tick();
    expect(calls).toEqual(['commercialBreak', 'gameplayStart']);
    expect(platform.muted).toBe(false);
    expect(muteChanges).toEqual([true, false]);
    platform.gameplayStart(); // already playing: no second break
    await tick();
    expect(calls).toHaveLength(2);
  });

  it('every new start gets its own break, and a stop reports once', async () => {
    const { sdk, calls, endBreak } = fakePoki();
    const platform = createPokiPlatform(() => sdk);
    await platform.init();
    platform.gameplayStart();
    await tick();
    endBreak();
    await tick();
    platform.gameplayStop();
    platform.gameplayStop();
    platform.gameplayStart();
    await tick();
    endBreak();
    await tick();
    expect(calls).toEqual(['commercialBreak', 'gameplayStart', 'gameplayStop', 'commercialBreak', 'gameplayStart']);
  });

  it('starts nothing when the player leaves during the ad', async () => {
    const { sdk, calls, endBreak } = fakePoki();
    const platform = createPokiPlatform(() => sdk);
    await platform.init();
    platform.gameplayStart();
    await tick();
    platform.gameplayStop();
    endBreak();
    await tick();
    expect(calls).toEqual(['commercialBreak']);
    expect(platform.muted).toBe(false);
  });

  it('plays on when the SDK is blocked or its ad fails', async () => {
    const blocked = fakePoki({ initFails: true, breakFails: true });
    const platform = createPokiPlatform(() => blocked.sdk);
    expect(await platform.init()).toBe(false);
    expect(platform.active).toBe(true); // an ad blocker must not switch the game off
    platform.gameplayStart();
    await tick();
    expect(blocked.calls).toEqual(['commercialBreak', 'gameplayStart']);
    expect(platform.muted).toBe(false);
  });

  it('does not wait for ever on a break that never ends', async () => {
    const stuck = fakePoki({ breakNever: true });
    const platform = createPokiPlatform(() => stuck.sdk, 20);
    await platform.init();
    platform.gameplayStart();
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(stuck.calls).toEqual(['commercialBreak', 'gameplayStart']);
  });

  it('keeps key presses from the game while an ad plays', async () => {
    const target = new EventTarget();
    (globalThis as { window?: unknown }).window = target;
    const { sdk, endBreak } = fakePoki();
    const platform = createPokiPlatform(() => sdk);
    await platform.init();
    let reached = 0;
    platform.gameplayStart();
    await tick();
    // (Registered after the guard: the plain EventTarget runs listeners in order, while a real page runs the window's capture first.)
    target.addEventListener('keydown', () => (reached += 1));
    target.dispatchEvent(new Event('keydown', { cancelable: true }));
    expect(reached).toBe(0);
    endBreak();
    await tick();
    target.dispatchEvent(new Event('keydown', { cancelable: true }));
    expect(reached).toBe(1);
  });

  it('passes happy moments on, and an SDK that throws costs the game nothing', async () => {
    const { sdk, calls } = fakePoki();
    const platform = createPokiPlatform(() => sdk);
    await platform.init();
    platform.happytime();
    expect(calls).toEqual(['happyTime 0.6']);
    sdk.gameLoadingFinished = () => {
      throw new Error('boom');
    };
    expect(() => platform.loadingStop()).not.toThrow();
  });
});
