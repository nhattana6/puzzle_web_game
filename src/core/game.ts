import { Music } from './music';
import { platform } from './platform';
import { loadSave, writeSave } from './save';
import { Sound } from './sound';

export const save = loadSave();
export const sound = new Sound();
sound.muted = save.muted;
export const music = new Music(sound);
music.enabled = save.music;

/** Sound follows the player's buttons, but stays off while the portal asks for silence. */
function refreshAudio(): void {
  sound.muted = save.muted || platform.muted;
  music.enabled = save.music;
  music.update();
}
platform.onMuteChange(refreshAudio);

/** Applies the saved sound settings: call after changing `save.muted` or `save.music`. */
export function applyAudio(): void {
  refreshAudio();
  persist();
}

export function persist(): void {
  writeSave(save);
}
