// Web implementation — uses the HTML5 Audio API.
import { AUDIO_BASE_URL } from '../config';

export function playAudio(filename: string): () => void {
  if (!AUDIO_BASE_URL || !filename) return () => {};

  const audio = new window.Audio(AUDIO_BASE_URL + filename);
  audio.play().catch(() => {}); // silent fail if autoplay blocked

  return () => {
    audio.pause();
    audio.src = '';
  };
}
