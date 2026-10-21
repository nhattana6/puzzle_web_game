import { describe, expect, it } from 'vitest';
import { createGdPlatform, type GdBridge, type GdEvent } from '../src/core/gamedistribution';

/** A stand-in page: the inline script's event bridge, the SDK object, and a window to hang key listeners on. */
function fakePage(opts: { options?: boolean; sdk?: boolean } = {}) {
  const win = new EventTarget() as EventTarget & Window;
  const bridge: GdBridge = { q: [] };
  const ads: string[] = [];
  Object.assign(win, {
    __gd: bridge,
    ...(opts.options === false ? {} : { GD_OPTIONS: { gameId: 'x' } }),
    ...(opts.sdk === false ? {} : { gdsdk: { showAd: () => (ads.push('showAd'), Promise.resolve()) } }),
  });
  // What the page's `onEvent` does: hand an event to the game if it listens, keep it otherwise.
  const emit = (name: string) => (bridge.on ? bridge.on({ name } as GdEvent) : bridge.q.push({ name }));
  return { win, bridge, ads, emit };
}

describe('GameDistribution platform wrapper', () => {
  it('does nothing without the GD page script', async () => {
    const platform = createGdPlatform(() => undefined);
    expect(await platform.init(10)).toBe(false);
    expect(platform.active).toBe(false);
    platform.gameplayStart();
    platform.gameplayStop();
    expect(platform.storage()).toBeNull();
  });

  it('catches up on events that came before the game listened, then follows live ones', async () => {
    const { win, emit } = fakePage();
    emit('SDK_READY'); // before init
    const platform = createGdPlatform(() => win, 200);
    expect(await platform.init()).toBe(true);
    expect(platform.active).toBe(true);
    const changes: boolean[] = [];
    platform.onMuteChange((m) => changes.push(m));
    emit('SDK_GAME_PAUSE');
    expect(platform.muted).toBe(true);
    emit('SDK_GAME_START');
    expect(platform.muted).toBe(false);
    expect(changes).toEqual([true, false]);
  });

  it('waits a little for SDK_READY and then plays on without it', async () => {
    const { win } = fakePage();
    const platform = createGdPlatform(() => win, 60);
    const t0 = Date.now();
    expect(await platform.init()).toBe(false);
    expect(Date.now() - t0).toBeGreaterThanOrEqual(50);
  });

  it('asks for an ad when a level opens, once per opening', async () => {
    const { win, ads, emit } = fakePage();
    const platform = createGdPlatform(() => win, 50);
    emit('SDK_READY');
    await platform.init();
    platform.gameplayStart();
    platform.gameplayStart(); // already in the level
    expect(ads).toEqual(['showAd']);
    platform.gameplayStop();
    platform.gameplayStart();
    expect(ads).toEqual(['showAd', 'showAd']);
  });

  it('does not break when the SDK is blocked or its ad call fails', async () => {
    const blocked = fakePage({ sdk: false });
    const a = createGdPlatform(() => blocked.win, 20);
    await a.init();
    expect(() => a.gameplayStart()).not.toThrow();
    const failing = fakePage();
    (failing.win as unknown as { gdsdk: { showAd: () => Promise<never> } }).gdsdk.showAd = () => Promise.reject(new Error('no ad'));
    const b = createGdPlatform(() => failing.win, 20);
    await b.init();
    expect(() => b.gameplayStart()).not.toThrow();
    (failing.win as unknown as { gdsdk: { showAd: () => never } }).gdsdk.showAd = () => {
      throw new Error('boom');
    };
    b.gameplayStop();
    expect(() => b.gameplayStart()).not.toThrow();
  });

  it('keeps key presses from the game while an ad runs, and sound back when the SDK errors', async () => {
    const { win, emit } = fakePage();
    const platform = createGdPlatform(() => win, 20);
    emit('SDK_READY');
    await platform.init();
    emit('SDK_GAME_PAUSE');
    let reached = 0;
    win.addEventListener('keydown', () => (reached += 1));
    win.dispatchEvent(new Event('keydown', { cancelable: true }));
    expect(reached).toBe(0);
    emit('SDK_ERROR');
    expect(platform.muted).toBe(false);
    win.dispatchEvent(new Event('keydown', { cancelable: true }));
    expect(reached).toBe(1);
  });
});
