import { defineConfig, type Plugin } from 'vite';

/** CrazyGames HTML5 SDK v3; only the CrazyGames build loads it (`npm run build:crazygames`). */
const CRAZYGAMES_SDK = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';

/**
 * PokiSDK v2; only the Poki build (`npm run build:poki`) loads it. The address is the one Poki's HTML5 guide gives as far as
 * could be told without opening the guide (the work machine cannot reach it): check it against the guide before uploading.
 */
const POKI_SDK = 'https://game-cdn.poki.com/scripts/v2/poki-sdk.js';

/** Adds an SDK as a classic script in <head>; it runs before the game's (deferred) module script. */
const sdkScript = (name: string, src: string): Plugin => ({
  name,
  transformIndexHtml: () => [{ tag: 'script', attrs: { src }, injectTo: 'head' }],
});

export default defineConfig(({ mode }) => ({
  // Relative asset paths: portals serve the game from their own folder, where `/assets/…` would 404.
  base: './',
  build: mode === 'crazygames' ? { outDir: 'dist-crazygames' } : mode === 'poki' ? { outDir: 'dist-poki' } : {},
  plugins: mode === 'crazygames' ? [sdkScript('crazygames-sdk', CRAZYGAMES_SDK)] : mode === 'poki' ? [sdkScript('poki-sdk', POKI_SDK)] : [],
}));
