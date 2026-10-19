// Gameplay showreel for CrazyGames: many levels, many kinds of moves, a visible finger. Played in real time and
// captured with the DevTools screencast (a frame whenever the page changes); each frame is held until the next, and
// assemble.mjs turns that into steady 30 fps clips joined with crossfades. (Chrome's virtual time was tried and
// dropped: screenshots and input could wait forever on a frame that a paused clock never produced.)
// Each clip lands in its own folder: outDir/NN-name/f00000.jpg… plus frames.txt (an ffconcat list with durations).
// Needs `npm run dev -- --port 5180` running and Playwright installed outside the project:
//   node tools/video/showreel.mjs <outDir> && node tools/video/assemble.mjs <outDir> marketing/crazygames/preview-1920x1080.mp4
// A run that stops part way can be started again: finished clips (with a `done` file) are skipped.
import { chromium } from 'playwright';
import fs from 'node:fs';
const [outDir] = process.argv.slice(2);
const FPS = 30;
const BASE = 'http://localhost:5180/';

// A soft white fingertip that follows the pointer and ripples on press (like the hint card's finger).
const FINGER = `
addEventListener('DOMContentLoaded', () => {
  const css = document.createElement('style');
  css.textContent = \`
    .reel-finger { position: fixed; left: 0; top: 0; width: 38px; height: 38px; margin: -19px 0 0 -19px; border-radius: 50%;
      background: radial-gradient(circle, rgba(255,255,255,0.95) 0 45%, rgba(255,255,255,0.35) 60%, rgba(255,255,255,0) 72%);
      box-shadow: 0 0 18px 4px rgba(255, 241, 196, 0.45); pointer-events: none; z-index: 2147483647; opacity: 0;
      transition: transform 0.12s ease-out, opacity 0.2s; }
    .reel-finger.on { opacity: 1; }
    .reel-finger.down { transform: scale(0.78); }
    .reel-ripple { position: fixed; width: 20px; height: 20px; margin: -10px 0 0 -10px; border-radius: 50%; border: 3px solid rgba(255, 241, 196, 0.9);
      pointer-events: none; z-index: 2147483646; animation: reel-ripple 0.6s ease-out forwards; }
    @keyframes reel-ripple { to { transform: scale(4.2); opacity: 0; } }\`;
  document.head.appendChild(css);
  const f = document.createElement('div');
  f.className = 'reel-finger';
  document.body.appendChild(f);
  const at = (e) => { f.style.left = e.clientX + 'px'; f.style.top = e.clientY + 'px'; f.classList.add('on'); };
  addEventListener('pointermove', at, true);
  addEventListener('pointerdown', (e) => {
    at(e); f.classList.add('down');
    const r = document.createElement('div'); r.className = 'reel-ripple';
    r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px';
    document.body.appendChild(r); setTimeout(() => r.remove(), 700);
  }, true);
  addEventListener('pointerup', () => f.classList.remove('down'), true);
});`;

const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-proxy-server'] });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: 'en-US' });
await ctx.addInitScript(FINGER);
{
  const p = await ctx.newPage();
  await p.goto(BASE);
  // Every level open, every help card already seen, English, sound off.
  await p.evaluate(async () => {
    const { PUZZLES } = await import('/src/puzzles/index.ts');
    const ids = PUZZLES.map((q) => q.id);
    localStorage.setItem('star-keeper/save/v1', JSON.stringify({ version: 1, solved: ids, fireflies: 2, hintLevels: {}, wrongAnswers: {}, seenGuides: ids, muted: true, music: false, lang: 'en' }));
  });
  await p.close();
}

let clip = 0;
async function record(name, url, script, { zoom = false } = {}) {
  const dir = `${outDir}/${String(clip++).padStart(2, '0')}-${name}`;
  if (fs.existsSync(`${dir}/done`)) return; // recorded by an earlier run
  if (process.env.ONLY && !process.env.ONLY.split(',').includes(name)) return;
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const page = await ctx.newPage();
  await page.goto(url);
  await page.waitForSelector(url.includes('#') ? '.puzzle-screen' : url.includes('covers') ? 'body[data-ready="1"]' : '.hub');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  let mx = 960, my = 700;
  if (!url.includes('covers')) await page.mouse.move(mx, my);
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    frames.push({ t: metadata.timestamp, data });
    await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
  const api = {
    hold: (s) => page.waitForTimeout(s * 1000),
    // Glide the finger along a path f(k), k 0..1, over s seconds (pressed or not), in real time.
    path: async (f, s) => {
      const t0 = Date.now();
      for (;;) {
        const k = Math.min(1, (Date.now() - t0) / (s * 1000));
        const p = f(ease(k));
        mx = p.x; my = p.y;
        await page.mouse.move(mx, my);
        if (k >= 1) break;
        await page.waitForTimeout(12);
      }
    },
    moveTo: async (x, y, s = 0.35) => { const x0 = mx, y0 = my; await api.path((k) => ({ x: x0 + (x - x0) * k, y: y0 + (y - y0) * k }), s); },
    press: () => page.mouse.down(),
    release: () => page.mouse.up(),
    tap: async (x, y, after = 0.25) => { await api.moveTo(x, y); await page.mouse.down(); await api.hold(0.08); await page.mouse.up(); await api.hold(after); },
    drag: async (from, to, s, linger = 0.15) => { await api.moveTo(from.x, from.y); await page.mouse.down(); await api.hold(0.08); await api.moveTo(to.x, to.y, s); await api.hold(linger); await page.mouse.up(); },
    // Scene (1600×900) point → screen point, through the live scene's own transform.
    sp: (x, y) => page.evaluate(([x, y]) => {
      const svg = document.querySelector('.puzzle-screen .scene');
      const pt = new DOMPoint(x, y).matrixTransform(svg.getScreenCTM());
      return { x: pt.x, y: pt.y };
    }, [x, y]),
    centre: (sel) => page.evaluate((sel) => { const b = document.querySelector(sel).getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }, sel),
    all: (sel) => page.evaluate((sel) => [...document.querySelectorAll(sel)].map((e) => { const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2, label: e.getAttribute('aria-label') ?? '' }; }), sel),
    page,
  };
  if (zoom) {
    // Frame the clip on the scene alone (16:9, a little margin), so the play itself fills the video.
    const b = await page.evaluate(() => { const r = document.querySelector('.puzzle-screen .scene').getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; });
    const w = Math.round(b[2] / 2) * 2, h = Math.round((w * 9) / 16 / 2) * 2;
    fs.writeFileSync(`${dir}/crop.txt`, `${w}:${h}:${Math.round(b[0])}:${Math.round(b[1] + (b[3] - h) / 2)}`);
  }
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, everyNthFrame: 1 });
  const tStart = Date.now() / 1000;
  await script(api);
  const tEnd = Date.now() / 1000;
  await cdp.send('Page.stopScreencast');
  // Each frame is shown until the next one; the first starts the clip and the last runs to its end.
  const toWall = frames.length ? tStart - frames[0].t : 0;
  let list = 'ffconcat version 1.0\n';
  frames.forEach((f, i) => {
    const file = `f${String(i).padStart(5, '0')}.jpg`;
    fs.writeFileSync(`${dir}/${file}`, Buffer.from(f.data, 'base64'));
    const from = i === 0 ? tStart : f.t + toWall;
    const to = i + 1 < frames.length ? frames[i + 1].t + toWall : tEnd;
    list += `file '${file}'\nduration ${Math.max(0.001, to - from).toFixed(4)}\n`;
  });
  list += `file 'f${String(frames.length - 1).padStart(5, '0')}.jpg'\n`;
  fs.writeFileSync(`${dir}/frames.txt`, list);
  fs.writeFileSync(`${dir}/done`, (tEnd - tStart).toFixed(2));
  console.log(dir, frames.length, 'frames', (tEnd - tStart).toFixed(1), 's');
  await cdp.detach();
  await page.close();
}
const level = (id) => `${BASE}#${id}`;

await record('cover', `${BASE}tools/covers/?w=1920&h=1080`, async (a) => { await a.hold(2.5); });

await record('map', BASE, async (a) => {
  await a.hold(0.6);
  for (const ci of [2, 4, 0]) {
    const t = await a.centre(`.chapter-tab[data-chapter="${ci}"]`);
    await a.tap(t.x, t.y, 0.5);
  }
});

await record('clouds', level('night-clouds'), async (a) => {
  await a.hold(0.4);
  for (const [x, y] of [[520, 320], [790, 470], [1080, 330]]) {
    const from = await a.sp(x, y);
    const to = await a.sp(x, 860);
    await a.drag(from, to, 0.55);
  }
  await a.hold(0.4);
  for (const name of ['Crown', 'Cross', 'Belt']) {
    const k = await a.centre(`.keypad .key[aria-label="${name}"]`);
    await a.tap(k.x, k.y, 0.15);
  }
  await a.hold(2.4);
});

await record('red-glass', level('red-filter'), async (a) => {
  await a.hold(0.3);
  await a.drag(await a.sp(1430, 650), await a.sp(1130, 350), 0.9, 0.5);
  await a.hold(0.9);
}, { zoom: true });

await record('fold', level('folded-map'), async (a) => {
  await a.hold(0.3);
  const v = await a.sp(800, 290);
  await a.tap(v.x, v.y, 1.0);
  const h = await a.sp(550, 450);
  await a.tap(h.x, h.y, 1.4);
}, { zoom: true });

await record('dusk', level('dusk-sky'), async (a) => {
  await a.hold(0.3);
  await a.drag(await a.sp(70, 150), await a.sp(70, 330), 2.2, 0.3);
  await a.hold(0.8);
}, { zoom: true });

await record('spin', level('spin-lantern'), async (a) => {
  await a.hold(0.3);
  const c = await a.sp(800, 96);
  const r = (await a.sp(860, 96)).x - c.x;
  await a.moveTo(c.x + r, c.y);
  await a.press();
  await a.path((k) => ({ x: c.x + r * Math.cos(k * Math.PI * 4), y: c.y + r * Math.sin(k * Math.PI * 4) }), 1.1);
  await a.release();
  await a.moveTo(c.x + 260, c.y + 260, 0.5);
  await a.hold(2.0);
}, { zoom: true });

await record('river', level('river-lanterns'), async (a) => {
  await a.hold(0.3);
  const lamps = await a.all('[data-hint^="lantern-"]');
  for (const l of lamps.slice(0, 4)) await a.tap(l.x, l.y, 0.12);
  await a.hold(2.0);
}, { zoom: true });

await record('wires', level('copper-wires'), async (a) => {
  await a.hold(0.3);
  const stars = (await a.all('[aria-label^="Star in row"]')).map((s) => {
    const m = s.label.match(/row (\d+), column (\d+)/);
    return { ...s, r: Number(m[1]), c: Number(m[2]) };
  });
  // Join a few neighbours on the same row, left to right.
  const pairs = [];
  for (const s of stars) {
    const right = stars.filter((t) => t.r === s.r && t.c > s.c).sort((p, q) => p.c - q.c)[0];
    if (right) pairs.push([s, right]);
  }
  for (const [p, q] of pairs.slice(0, 3)) { await a.tap(p.x, p.y, 0.05); await a.tap(q.x, q.y, 0.2); }
  await a.hold(0.6);
}, { zoom: true });

await record('train', level('train-window'), async (a) => {
  await a.hold(0.3);
  await a.drag(await a.sp(560, 210), await a.sp(560, 507), 1.6, 0.3);
  await a.hold(1.0);
}, { zoom: true });

await record('tunnel', level('glow-tunnel'), async (a) => {
  await a.hold(0.3);
  await a.drag(await a.sp(170, 760), await a.sp(800, 450), 1.1, 0.2);
  await a.moveTo(...Object.values(await a.sp(1250, 820)), 0.5);
  await a.hold(3.0);
}, { zoom: true });

await record('switches', level('flip-switches'), async (a) => {
  await a.hold(0.3);
  for (const [x, y] of [[780, 300], [780, 600], [1000, 450], [1000, 660]]) { const p = await a.sp(x, y); await a.tap(p.x, p.y, 0.15); }
  const run = await a.sp(250, 790);
  await a.tap(run.x, run.y, 0.2);
  await a.hold(3.6);
}, { zoom: true });

await record('end', `${BASE}tools/covers/?w=1920&h=1080`, async (a) => { await a.hold(2.8); });
await browser.close();
