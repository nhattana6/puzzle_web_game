// Encodes each clip folder recorded by showreel.mjs and joins them with 0.4 s crossfades (needs ffmpeg with libx264).
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const [reelDir, out] = process.argv.slice(2);
const FPS = 30, FADE = 0.4;
const clips = fs.readdirSync(reelDir).filter((d) => /^\d\d-/.test(d)).sort();
const durs = [];
for (const c of clips) {
  // Steady 30 fps from the held frames; the clip length is whatever the list adds up to.
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', `${reelDir}/${c}/frames.txt`,
    '-vf', `fps=${FPS},${fs.existsSync(`${reelDir}/${c}/crop.txt`) ? `crop=${fs.readFileSync(`${reelDir}/${c}/crop.txt`, 'utf8').trim()},` : ''}scale=1920:1080:flags=lanczos`, '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', `${reelDir}/${c}.mp4`]);
  const d = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', `${reelDir}/${c}.mp4`]).toString();
  durs.push(Number(d));
}
const inputs = clips.flatMap((c) => ['-i', `${reelDir}/${c}.mp4`]);
let filter = '', last = '[0:v]', t = durs[0];
for (let i = 1; i < clips.length; i++) {
  const offset = (t - FADE).toFixed(3);
  const label = i === clips.length - 1 ? '[vout]' : `[v${i}]`;
  filter += `${last}[${i}:v]xfade=transition=fade:duration=${FADE}:offset=${offset}${label};`;
  last = label;
  t = t - FADE + durs[i];
}
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...inputs, '-filter_complex', filter.slice(0, -1), '-map', '[vout]',
  '-r', String(FPS), '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
console.log(clips.map((c, i) => `${c} ${durs[i].toFixed(1)}s`).join('\n'));
console.log('total', t.toFixed(1), 's');
