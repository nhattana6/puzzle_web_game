/**
 * GameDistribution's HTML5 SDK behind the same `Platform` face as the CrazyGames one. Only the GameDistribution build
 * (`GD_GAME_ID=… npm run build:gamedistribution`) puts the SDK on the page; the game plays the same if it is missing or an
 * ad blocker stops it.
 *
 * How GD works (from its GD-HTML5 wiki): the page sets `window.GD_OPTIONS = { gameId, onEvent }` and loads `main.min.js`;
 * the game calls `gdsdk.showAd()` from a user action that is not in the middle of play (the SDK keeps the ad interval
 * itself); while an ad runs the SDK sends `SDK_GAME_PAUSE` (pause AND mute the game, no background sound during a video ad)
 * and afterwards `SDK_GAME_START` (resume). GD has no "gameplay start/stop" calls.
 */
import type { KeyValueStore, Platform } from './platform';

export interface GdEvent {
  name: string;
}

/** The part of `gdsdk` the game uses. */
export interface GdSdk {
  showAd?(type?: string): Promise<unknown>;
}

/** What the page's inline script leaves for the game: the events that came before the game listened, then a live hook. */
export interface GdBridge {
  q: GdEvent[];
  on?: (event: GdEvent) => void;
}

declare global {
  interface Window {
    GD_OPTIONS?: { gameId?: string };
    gdsdk?: GdSdk;
    __gd?: GdBridge;
  }
}

export const GD_INIT_TIMEOUT_MS = 4000;

export function createGdPlatform(
  win: () => Window | undefined = () => globalThis.window,
  initTimeoutMs = GD_INIT_TIMEOUT_MS,
): Platform {
  let started = false;
  let ready = false;
  let paused = false;
  let playing = false;
  const listeners: ((muted: boolean) => void)[] = [];

  // While an ad runs the game gets no key presses (the ad takes the pointer by itself).
  const blockKeys = (event: Event) => {
    event.stopImmediatePropagation();
    event.preventDefault();
  };
  const setPaused = (value: boolean) => {
    if (value === paused) return;
    paused = value;
    const w = win();
    if (w) {
      if (value) w.addEventListener('keydown', blockKeys, { capture: true });
      else w.removeEventListener('keydown', blockKeys, { capture: true });
    }
    listeners.forEach((listener) => listener(value));
  };
  const handle = (event: GdEvent) => {
    switch (event?.name) {
      case 'SDK_READY':
        ready = true;
        break;
      case 'SDK_GAME_PAUSE':
        setPaused(true);
        break;
      case 'SDK_GAME_START':
      case 'SDK_ERROR':
        // After an ad (or when the SDK fails) the game goes on, sound back.
        setPaused(false);
        break;
      default:
    }
  };
  /** Starts listening to the SDK's events, first catching up on those that came before. */
  const attach = () => {
    const bridge = win()?.__gd;
    if (!bridge || started) return;
    started = true;
    bridge.on = handle;
    bridge.q.splice(0).forEach(handle);
  };
  /** Asks for an ad; nothing happens when the SDK is not there or the game is not in a play state. */
  const showAd = () => {
    const sdk = win()?.gdsdk;
    if (!sdk || typeof sdk.showAd !== 'function') return;
    try {
      void Promise.resolve(sdk.showAd()).catch(() => undefined);
    } catch {
      // No ad, no harm.
    }
  };

  return {
    async init(timeoutMs = initTimeoutMs) {
      attach();
      if (!win()?.GD_OPTIONS) return false;
      // Wait a moment for SDK_READY, but start the game either way: GD's guide says to load the SDK once and not hold the game up.
      const t0 = Date.now();
      while (!ready && Date.now() - t0 < timeoutMs) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        attach();
      }
      return ready;
    },
    get active() {
      return started;
    },
    loadingStart: () => undefined,
    loadingStop: () => undefined,
    /** A level opens: this is the natural break for an ad, asked for from the player's own tap that opened it. */
    gameplayStart() {
      if (playing) return;
      playing = true;
      showAd();
    },
    gameplayStop() {
      playing = false;
    },
    happytime: () => undefined,
    locale: () => globalThis.navigator?.language || 'en',
    storage: (): KeyValueStore | null => null,
    get muted() {
      return paused;
    },
    onMuteChange(listener) {
      listeners.push(listener);
    },
  };
}
