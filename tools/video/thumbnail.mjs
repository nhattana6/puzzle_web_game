// Animated thumbnail for Poki: 1:1, 1080×1080, 60 fps, about 5 seconds, no sound (Poki asks for ≥ 1080×1080, ≥ 50 fps, 4–6 s, ≤ 100 MB).
// Plays the first level (drag the clouds off the window) in real time, captures it with the DevTools screencast at 2× scale,
// crops the square around the scene and encodes it. Needs `npm run dev -- --port 5180` and Playwright installed outside the project:
//   node tools/video/thumbnail.mjs <workDir> marketing/poki/animated-thumbnail-1080x1080.mp4
import { chromium } from 'playwright';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const [outDir, out] = process.argv.slice(2);
const BASE = 'http://localhost:5180/';
const DSF = 2;
const FPS = 60;
// The window's scale factor comes from the browser flag, so the screencast frames are really 2× as well.
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-proxy-server', `--force-device-scale-factor=${DSF}`] });
const ctx = await browser.newContext({ viewport: { width: 1100, height: 640 }, locale: 'en-US' });
{
  const p = await ctx.newPage();
  await p.goto(BASE);
  await p.evaluate(async () => {
    const { PUZZLES } = await import('/src/puzzles/index.ts');
    const ids = PUZZLES.map((q) => q.id);
    localStorage.setItem('star-keeper/save/v1', JSON.stringify({ version: 1, solved: [], fireflies: 2, hintLevels: {}, wrongAnswers: {}, seenGuides: ids, seenTips: ['zoom'], muted: true, music: false, lang: 'en' }));
  });
  await p.close();
}
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
const page = await ctx.newPage();
await page.goto(`${BASE}#night-clouds`);
await page.waitForSelector('.puzzle-screen .scene');
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(800);
const sp = (x, y) => page.evaluate(([x, y]) => {
  const pt = new DOMPoint(x, y).matrixTransform(document.querySelector('.puzzle-screen .scene').getScreenCTM());
  return { x: pt.x, y: pt.y };
}, [x, y]);
const box = await page.evaluate(() => { const r = document.querySelector('.puzzle-screen .scene').getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; });
// A square, as tall as the scene, around its middle (the window with the clouds).
const side = Math.round(box[3] * DSF);
fs.writeFileSync(`${outDir}/crop.txt`, `${side}:${side}:${Math.round((box[0] + box[2] / 2) * DSF - side / 2)}:${Math.round(box[1] * DSF)}`);
const cdp = await ctx.newCDPSession(page);
const frames = [];
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  frames.push({ t: metadata.timestamp, data });
  await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
const glide = async (from, to, s) => {
  const t0 = Date.now();
  for (;;) {
    const k = Math.min(1, (Date.now() - t0) / (s * 1000));
    await page.mouse.move(from.x + (to.x - from.x) * ease(k), from.y + (to.y - from.y) * ease(k));
    if (k >= 1) break;
    await page.waitForTimeout(8);
  }
};
await page.mouse.move(box[0] + box[2] / 2, box[1] + box[3] * 0.9);
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 94, everyNthFrame: 1, maxWidth: 1100 * DSF, maxHeight: 640 * DSF });
const tStart = Date.now() / 1000;
await page.waitForTimeout(700);
for (const [x, y] of [[520, 320], [790, 470], [1080, 330]]) {
  const from = await sp(x, y);
  const to = await sp(x, 880);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.waitForTimeout(60);
  await glide(from, to, 0.7);
  await page.mouse.up();
  await page.waitForTimeout(120);
}
await page.waitForTimeout(1700);
const tEnd = Date.now() / 1000;
await cdp.send('Page.stopScreencast');
const toWall = tStart - frames[0].t;
let list = 'ffconcat version 1.0\n';
frames.forEach((f, i) => {
  const file = `f${String(i).padStart(5, '0')}.jpg`;
  fs.writeFileSync(`${outDir}/${file}`, Buffer.from(f.data, 'base64'));
  const from = i === 0 ? tStart : f.t + toWall;
  const to = i + 1 < frames.length ? frames[i + 1].t + toWall : tEnd;
  list += `file '${file}'\nduration ${Math.max(0.001, to - from).toFixed(4)}\n`;
});
list += `file 'f${String(frames.length - 1).padStart(5, '0')}.jpg'\n`;
fs.writeFileSync(`${outDir}/frames.txt`, list);
await browser.close();
const crop = fs.readFileSync(`${outDir}/crop.txt`, 'utf8').trim();
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', `${outDir}/frames.txt`,
  '-vf', `fps=${FPS},crop=${crop},scale=1080:1080:flags=lanczos`, '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
console.log(frames.length, 'frames,', (tEnd - tStart).toFixed(1), 's →', out);
