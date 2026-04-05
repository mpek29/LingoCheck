// Native implementation — uses react-native-sound.
// Audio is skipped on Windows (no local audio files configured).
import { Platform } from 'react-native';
import Sound from 'react-native-sound';
import { AUDIO_BASE_URL } from '../config';

export function playAudio(filename: string): () => void {
  if (Platform.OS === 'windows' || !AUDIO_BASE_URL || !filename) return () => {};

  Sound.setCategory('Playback');
  const sound = new Sound(AUDIO_BASE_URL + filename, '', (err) => {
    if (!err) sound.play();
  });

  return () => {
    sound.stop();
    sound.release();
  };
}
