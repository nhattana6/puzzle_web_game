import { applyAudio, save } from '../core/game';
import { ICONS } from './icons';

/**
 * The two sound buttons, shared by the map and the puzzle screen: background music
 * on/off, and a mute for everything. Both choices are saved.
 */
export function mountAudioControls(container: HTMLElement): void {
  container.innerHTML = `
    <button class="icon-btn music-btn" type="button"></button>
    <button class="icon-btn mute" type="button"></button>`;
  const musicBtn = container.querySelector('.music-btn') as HTMLButtonElement;
  const muteBtn = container.querySelector('.mute') as HTMLButtonElement;
  const label = (btn: HTMLButtonElement, text: string) => {
    btn.setAttribute('aria-label', text);
    btn.title = text;
  };
  const draw = () => {
    musicBtn.innerHTML = save.music ? ICONS.musicOn : ICONS.musicOff;
    musicBtn.setAttribute('aria-pressed', String(save.music));
    // Music can't play while everything is muted; show that without changing the choice.
    musicBtn.classList.toggle('silenced', save.muted);
    label(musicBtn, save.music ? 'Tắt nhạc nền' : 'Bật nhạc nền');
    muteBtn.innerHTML = save.muted ? ICONS.soundOff : ICONS.soundOn;
    muteBtn.setAttribute('aria-pressed', String(save.muted));
    label(muteBtn, save.muted ? 'Bật âm thanh' : 'Tắt toàn bộ âm thanh');
  };
  musicBtn.addEventListener('click', () => {
    save.music = !save.music;
    applyAudio();
    draw();
  });
  muteBtn.addEventListener('click', () => {
    save.muted = !save.muted;
    applyAudio();
    draw();
  });
  draw();
}
