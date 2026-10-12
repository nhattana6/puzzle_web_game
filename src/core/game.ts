import { Music } from './music';
import { loadSave, writeSave } from './save';
import { Sound } from './sound';

export const save = loadSave();
export const sound = new Sound();
sound.muted = save.muted;
export const music = new Music(sound);
music.enabled = save.music;

/** Applies the saved sound settings: call after changing `save.muted` or `save.music`. */
export function applyAudio(): void {
  sound.muted = save.muted;
  music.enabled = save.music;
  music.update();
  persist();
}

export function persist(): void {
  writeSave(save);
}
