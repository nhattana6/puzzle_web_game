import { defineConfig, type Plugin } from 'vite';

/** CrazyGames HTML5 SDK v3; only the CrazyGames build loads it (`npm run build:crazygames`). */
const CRAZYGAMES_SDK = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';

/** Adds the SDK as a classic script in <head>; it runs before the game's (deferred) module script. */
const crazyGamesSdk = (): Plugin => ({
  name: 'crazygames-sdk',
  transformIndexHtml: () => [{ tag: 'script', attrs: { src: CRAZYGAMES_SDK }, injectTo: 'head' }],
});

/**
 * GameDistribution: its HTML5 SDK is set up by a page script, `GD_OPTIONS` with the game's id and an event hook, then the loader
 * (the form of the GD-HTML5 wiki). The id comes from the game's page in the GameDistribution developer panel, so it is given at build time:
 * `GD_GAME_ID=<32 hex characters> npm run build:gamedistribution`. The hook keeps the events until the game listens (`window.__gd`).
 */
const gameDistributionSdk = (): Plugin => ({
  name: 'gamedistribution-sdk',
  transformIndexHtml: () => {
    const gameId = process.env.GD_GAME_ID ?? 'REPLACE_WITH_GD_GAME_ID';
    if (!process.env.GD_GAME_ID) console.warn('GD_GAME_ID is not set: the build has a placeholder id and will show no ads. Set it to the id from the GameDistribution panel.');
    const options = JSON.stringify({ gameId, advertisementSettings: { debug: false, autoplay: false, locale: 'en' } });
    const code = `window.__gd = { q: [] };
window.GD_OPTIONS = Object.assign(${options}, { onEvent: function (e) { if (window.__gd.on) window.__gd.on(e); else window.__gd.q.push(e); } });
(function (d, s, id) { if (d.getElementById(id)) return; var js = d.createElement(s); js.id = id; js.src = 'https://html5.api.gamedistribution.com/main.min.js'; d.head.appendChild(js); })(document, 'script', 'gamedistribution-jssdk');`;
    return [{ tag: 'script', children: code, injectTo: 'head' }];
  },
});

export default defineConfig(({ mode }) => ({
  // Relative asset paths: portals serve the game from their own folder, where `/assets/…` would 404.
  base: './',
  build: mode === 'crazygames' ? { outDir: 'dist-crazygames' } : mode === 'gamedistribution' ? { outDir: 'dist-gamedistribution' } : {},
  plugins: mode === 'crazygames' ? [crazyGamesSdk()] : mode === 'gamedistribution' ? [gameDistributionSdk()] : [],
}));
