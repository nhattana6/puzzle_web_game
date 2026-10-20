import { describe, expect, it } from 'vitest';
import { createPlatform, type CrazySdk, type CrazySettings } from '../src/core/platform';

/** A stand-in SDK that records every call; `init` resolves when the test says so. */
function fakeSdk(opts: { environment?: CrazySdk['environment']; muteAudio?: boolean; locale?: string } = {}) {
  const calls: string[] = [];
  let finishInit = () => {};
  let settingsListener: (settings: CrazySettings) => void = () => {};
  const sdk: CrazySdk = {
    environment: opts.environment ?? 'crazygames',
    init: () => new Promise<void>((resolve) => (finishInit = resolve)),
    game: {
      loadingStart: () => calls.push('loadingStart'),
      loadingStop: () => calls.push('loadingStop'),
      gameplayStart: () => calls.push('gameplayStart'),
      gameplayStop: () => calls.push('gameplayStop'),
      happytime: () => calls.push('happytime'),
      settings: { muteAudio: opts.muteAudio ?? false },
      addSettingsChangeListener: (listener) => (settingsListener = listener),
    },
    user: { systemInfo: { locale: opts.locale ?? 'vi-VN' } },
  };
  return { sdk, calls, finishInit: () => finishInit(), changeSettings: (s: CrazySettings) => settingsListener(s) };
}

describe('CrazyGames platform wrapper', () => {
  it('does nothing without an SDK', async () => {
    const platform = createPlatform(() => undefined);
    expect(await platform.init()).toBe(false);
    expect(platform.active).toBe(false);
    platform.loadingStart();
    platform.gameplayStart();
    platform.happytime();
    expect(platform.muted).toBe(false);
  });

  it('reports loading and gameplay once ready, merging repeated calls', async () => {
    const fake = fakeSdk();
    const platform = createPlatform(() => fake.sdk);
    const ready = platform.init();
    fake.finishInit();
    expect(await ready).toBe(true);
    platform.loadingStart();
    platform.loadingStop();
    platform.gameplayStart();
    platform.gameplayStart();
    platform.gameplayStop();
    platform.gameplayStop();
    platform.happytime();
    expect(fake.calls).toEqual(['loadingStart', 'loadingStop', 'gameplayStart', 'gameplayStop', 'happytime']);
    expect(platform.locale()).toBe('vi-VN');
  });

  it('stays silent on hosts where the SDK is disabled', async () => {
    const fake = fakeSdk({ environment: 'disabled' });
    const platform = createPlatform(() => fake.sdk);
    const ready = platform.init();
    fake.finishInit();
    expect(await ready).toBe(false);
    platform.gameplayStart();
    expect(fake.calls).toEqual([]);
  });

  it('gives up waiting after the timeout, then tells a late SDK the current gameplay state', async () => {
    const fake = fakeSdk();
    const platform = createPlatform(() => fake.sdk);
    expect(await platform.init(5)).toBe(false);
    platform.gameplayStart();
    expect(fake.calls).toEqual([]);
    fake.finishInit();
    await Promise.resolve();
    await Promise.resolve();
    expect(platform.active).toBe(true);
    expect(fake.calls).toEqual(['gameplayStart']);
  });

  it('follows the portal mute setting, at start and when it changes', async () => {
    const fake = fakeSdk({ muteAudio: true });
    const platform = createPlatform(() => fake.sdk);
    const seen: boolean[] = [];
    platform.onMuteChange((muted) => seen.push(muted));
    const ready = platform.init();
    fake.finishInit();
    await ready;
    expect(platform.muted).toBe(true);
    fake.changeSettings({ muteAudio: false });
    expect(platform.muted).toBe(false);
    expect(seen).toEqual([true, false]);
  });

  it('keeps the game running when an SDK call throws', async () => {
    const fake = fakeSdk();
    fake.sdk.game.gameplayStart = () => {
      throw new Error('sdk broke');
    };
    const platform = createPlatform(() => fake.sdk);
    const ready = platform.init();
    fake.finishInit();
    await ready;
    expect(() => platform.gameplayStart()).not.toThrow();
  });

  it('offers the SDK data module as a store that never throws', async () => {
    const { sdk, finishInit } = fakeSdk();
    const kept = new Map<string, string>();
    sdk.data = { getItem: (k) => kept.get(k) ?? null, setItem: (k, v) => void kept.set(k, v) };
    const platform = createPlatform(() => sdk);
    expect(platform.storage()).toBeNull(); // not before the SDK is up
    const ready = platform.init();
    finishInit();
    await ready;
    const store = platform.storage()!;
    expect(store.getItem('k')).toBeNull();
    store.setItem('k', 'v');
    expect(kept.get('k')).toBe('v');
    expect(store.getItem('k')).toBe('v');
    // An SDK that throws costs the game nothing: reads give null, writes are dropped.
    sdk.data = { getItem: () => { throw new Error('no'); }, setItem: () => { throw new Error('no'); } };
    expect(store.getItem('k')).toBeNull();
    expect(() => store.setItem('k', 'w')).not.toThrow();
  });

  it('has no store when the SDK has no data module, or is not there', async () => {
    const { sdk, finishInit } = fakeSdk();
    const platform = createPlatform(() => sdk);
    const ready = platform.init();
    finishInit();
    await ready;
    expect(platform.storage()).toBeNull();
    expect(createPlatform(() => undefined).storage()).toBeNull();
  });
});
