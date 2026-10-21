/**
 * PokiSDK behind the same `Platform` face as the CrazyGames one. Only the Poki build (`npm run build:poki`) loads the
 * SDK script; the game starts and plays the same if the SDK is missing or blocked (an ad blocker is common).
 *
 * Poki's flow: `gameLoadingFinished` once the game has loaded, `gameplayStart` / `gameplayStop` around play, and a
 * `commercialBreak` (video ad, which Poki may decide to skip) at a natural break just before each `gameplayStart`,
 * with sound off and input blocked while it runs. The names follow Poki's HTML5 guide as found by search (the guide itself
 * could not be opened from the work machine), so they are all called defensively.
 */
import type { KeyValueStore, Platform } from './platform';

/** The part of PokiSDK the game uses. */
export interface PokiSdk {
  init(): Promise<unknown>;
  gameLoadingFinished(): unknown;
  gameplayStart(): unknown;
  gameplayStop(): unknown;
  /** Resolves when the break is over (at once if there is no ad); `beforeAd` runs when an ad is about to play. */
  commercialBreak(beforeAd?: () => void): Promise<unknown>;
  happyTime?(intensity: number): unknown;
}

declare global {
  interface Window {
    PokiSDK?: PokiSdk;
  }
}

/** Longest the game waits for a commercial break before playing on without it (a stuck SDK must not freeze the level). */
export const AD_TIMEOUT_MS = 90_000;
export const POKI_INIT_TIMEOUT_MS = 4000;

export function createPokiPlatform(findSdk: () => PokiSdk | undefined, adTimeoutMs = AD_TIMEOUT_MS): Platform {
  let sdk: PokiSdk | null = null;
  let playing = false;
  let reported = false;
  let breaking = false;
  let loaded = false;
  let muted = false;
  const muteListeners: ((muted: boolean) => void)[] = [];

  /** SDK calls never break the game: errors, sync or async, are swallowed. */
  const call = (fn: (s: PokiSdk) => unknown) => {
    if (!sdk) return;
    try {
      const result = fn(sdk);
      if (result instanceof Promise) result.catch(() => undefined);
    } catch {
      // Ignored: the game runs the same without the SDK.
    }
  };
  const setMuted = (value: boolean) => {
    if (value === muted) return;
    muted = value;
    muteListeners.forEach((listener) => listener(value));
  };
  // While an ad plays the game gets no key presses (the ad overlay takes the pointer by itself).
  const blockKeys = (event: Event) => {
    event.stopImmediatePropagation();
    event.preventDefault();
  };
  const setBlocked = (on: boolean) => {
    const w = globalThis.window;
    if (!w) return;
    if (on) w.addEventListener('keydown', blockKeys, { capture: true });
    else w.removeEventListener('keydown', blockKeys, { capture: true });
  };

  /** The ad break, then `gameplayStart`; nothing is started if the player has left the level in the meantime. */
  const begin = async () => {
    if (!sdk || breaking || reported) return;
    breaking = true;
    const s = sdk;
    try {
      const done = Promise.resolve(
        s.commercialBreak(() => {
          setMuted(true);
          setBlocked(true);
        }),
      ).catch(() => undefined);
      await Promise.race([done, new Promise((resolve) => setTimeout(resolve, adTimeoutMs))]);
    } catch {
      // A failing SDK (or one that throws at once) just means no ad.
    }
    breaking = false;
    setMuted(false);
    setBlocked(false);
    if (playing && sdk && !reported) {
      reported = true;
      call((x) => x.gameplayStart());
    }
  };

  return {
    portal: 'poki',
    async init(timeoutMs = POKI_INIT_TIMEOUT_MS) {
      const found = findSdk();
      if (!found) return false;
      // Poki's guide: carry on loading whether init worked or not (an ad blocker makes it fail).
      sdk = found;
      let ok = false;
      try {
        const ready = Promise.resolve(found.init()).then(() => true, () => false);
        ok = await Promise.race([ready, new Promise<boolean>((resolve) => setTimeout(() => resolve(false), timeoutMs))]);
      } catch {
        ok = false;
      }
      return ok;
    },
    get active() {
      return sdk !== null;
    },
    loadingStart: () => undefined,
    loadingStop() {
      if (loaded) return;
      loaded = true;
      call((s) => s.gameLoadingFinished());
    },
    gameplayStart() {
      playing = true;
      void begin();
    },
    gameplayStop() {
      playing = false;
      if (reported) {
        reported = false;
        call((s) => s.gameplayStop());
      }
    },
    happytime: () => call((s) => s.happyTime?.(0.6)),
    locale: () => globalThis.navigator?.language || 'en',
    storage: (): KeyValueStore | null => null,
    get muted() {
      return muted;
    },
    onMuteChange(listener) {
      muteListeners.push(listener);
    },
  };
}
