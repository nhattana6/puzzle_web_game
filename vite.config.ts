import { defineConfig, type Plugin } from 'vite';

/** CrazyGames HTML5 SDK v3; only the CrazyGames build loads it (`npm run build:crazygames`). */
const CRAZYGAMES_SDK = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';

/** Adds the SDK as a classic script in <head>; it runs before the game's (deferred) module script. */
const crazyGamesSdk = (): Plugin => ({
  name: 'crazygames-sdk',
  transformIndexHtml: () => [{ tag: 'script', attrs: { src: CRAZYGAMES_SDK }, injectTo: 'head' }],
});

export default defineConfig(({ mode }) => ({
  // Relative asset paths: portals serve the game from their own folder, where `/assets/…` would 404.
  base: './',
  build: mode === 'crazygames' ? { outDir: 'dist-crazygames' } : {},
  plugins: mode === 'crazygames' ? [crazyGamesSdk()] : [],
}));
