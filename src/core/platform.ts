/**
 * CrazyGames SDK v3 behind a wrapper that does nothing when the SDK isn't there: the artifact
 * build and local dev never load it, and on other hosts it reports itself "disabled".
 * Only the CrazyGames build (`npm run build:crazygames`) adds the SDK script to the page.
 */

import { createGdPlatform } from './gamedistribution';

export interface CrazySettings {
  muteAudio?: boolean;
  disableChat?: boolean;
}

/** The part of the SDK the game uses. */
export interface CrazySdk {
  environment: 'local' | 'crazygames' | 'disabled';
  init(): Promise<void>;
  game: {
    loadingStart(): unknown;
    loadingStop(): unknown;
    gameplayStart(): unknown;
    gameplayStop(): unknown;
    happytime(): unknown;
    settings?: CrazySettings;
    addSettingsChangeListener?(listener: (settings: CrazySettings) => void): void;
  };
  user?: { systemInfo?: { locale?: string } };
  /** Data module: the same calls as localStorage; kept per CrazyGames account (a guest's lives in the browser). */
  data?: { getItem(key: string): string | null; setItem(key: string, value: string): void };
}

/** The two calls the game needs from a key-value store: `Storage` has them, and so does the SDK's data module. */
export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem'>;

declare global {
  interface Window {
    CrazyGames?: { SDK?: CrazySdk };
  }
}

/** Which portal this build is for: set by the build mode (`npm run build:crazygames`, `npm run build:gamedistribution`). */
export type Portal = 'crazygames' | 'gamedistribution' | 'web';
export const PORTAL: Portal = import.meta.env.MODE === 'gamedistribution' ? 'gamedistribution' : import.meta.env.MODE === 'crazygames' ? 'crazygames' : 'web';

/** Longest the game waits for the SDK before starting without it; a late SDK still catches up. */
export const INIT_TIMEOUT_MS = 4000;

export interface Platform {
  /** Starts the SDK; resolves true once it is usable, false if absent, disabled or slower than the timeout. */
  init(timeoutMs?: number): Promise<boolean>;
  readonly active: boolean;
  loadingStart(): void;
  loadingStop(): void;
  /** The player is in a level. Repeated calls are merged, and a late SDK is told the current state. */
  gameplayStart(): void;
  /** The player left the level (solved card, map). */
  gameplayStop(): void;
  /** A moment of joy, such as solving a level for the first time. */
  happytime(): void;
  /** The player's locale: from the SDK when there is one, otherwise from the browser. */
  locale(): string;
  /** The SDK's data module as a store (calls never throw), or null without the SDK or when it has no data module. */
  storage(): KeyValueStore | null;
  /** True while CrazyGames asks for silence; this outranks the game's own sound buttons. */
  readonly muted: boolean;
  onMuteChange(listener: (muted: boolean) => void): void;
}

export function createPlatform(findSdk: () => CrazySdk | undefined): Platform {
  let sdk: CrazySdk | null = null;
  let playing = false;
  let reported = false;
  let muted = false;
  const muteListeners: ((muted: boolean) => void)[] = [];

  /** SDK calls never break the game: errors, sync or async, are swallowed. */
  const call = (fn: (s: CrazySdk) => unknown) => {
    if (!sdk) return;
    try {
      const result = fn(sdk);
      if (result instanceof Promise) result.catch(() => undefined);
    } catch {
      // Ignored: the game runs the same without the SDK.
    }
  };
  const syncGameplay = () => {
    if (reported === playing) return;
    reported = playing;
    call((s) => (playing ? s.game.gameplayStart() : s.game.gameplayStop()));
  };
  const setMuted = (value: boolean) => {
    if (value === muted) return;
    muted = value;
    muteListeners.forEach((listener) => listener(value));
  };
  const attach = (found: CrazySdk) => {
    if (sdk) return;
    sdk = found;
    setMuted(found.game.settings?.muteAudio === true);
    call((s) => s.game.addSettingsChangeListener?.((settings) => setMuted(settings.muteAudio === true)));
    syncGameplay();
  };

  return {
    async init(timeoutMs = INIT_TIMEOUT_MS) {
      const found = findSdk();
      if (!found) return false;
      let ready: Promise<boolean>;
      try {
        ready = found.init().then(() => found.environment !== 'disabled', () => false);
      } catch {
        return false;
      }
      // Registered before the race, so the SDK is attached by the time init reports success.
      void ready.then((ok) => ok && attach(found));
      const late = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), timeoutMs));
      return Promise.race([ready, late]);
    },
    get active() {
      return sdk !== null;
    },
    loadingStart: () => call((s) => s.game.loadingStart()),
    loadingStop: () => call((s) => s.game.loadingStop()),
    gameplayStart() {
      playing = true;
      if (sdk) syncGameplay();
    },
    gameplayStop() {
      playing = false;
      if (sdk) syncGameplay();
    },
    happytime: () => call((s) => s.game.happytime()),
    storage() {
      if (!sdk?.data) return null;
      return {
        getItem: (key) => {
          try {
            return sdk?.data?.getItem(key) ?? null;
          } catch {
            return null;
          }
        },
        setItem: (key, value) => {
          try {
            sdk?.data?.setItem(key, value);
          } catch {
            // Ignored: progress also stays in the browser.
          }
        },
      };
    },
    locale: () => sdk?.user?.systemInfo?.locale || globalThis.navigator?.language || 'en',
    get muted() {
      return muted;
    },
    onMuteChange(listener) {
      muteListeners.push(listener);
    },
  };
}

export const platform: Platform = PORTAL === 'gamedistribution' ? createGdPlatform() : createPlatform(() => globalThis.window?.CrazyGames?.SDK);
