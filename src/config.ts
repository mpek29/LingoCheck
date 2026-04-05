import { Language, Entry } from './types';

// Base URL for audio files, e.g. 'https://your-audio-server.com/audio/'
// Leave empty to disable audio playback
export const AUDIO_BASE_URL = '';

export const SWIPE_THRESHOLD = 80;
export const SWIPE_OUT_DURATION = 250;

export const COLORS = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceLight: '#2D3748',
  primary: '#6366F1',
  primaryLight: '#818CF8',
  approve: '#10B981',
  reject: '#EF4444',
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  border: '#334155',
  de: '#FBBF24',
  en: '#60A5FA',
  fr: '#F472B6',
};

export interface LangMeta {
  code: Language;
  name: string;
  flag: string;
  color: string;
  wordKey: keyof Entry;
  sentenceKey: keyof Entry;
}

export const LANG_META: Record<Language, LangMeta> = {
  de: { code: 'de', name: 'German',  flag: '🇩🇪', color: COLORS.de, wordKey: 'de_word', sentenceKey: 'de_sentence' },
  en: { code: 'en', name: 'English', flag: '🇬🇧', color: COLORS.en, wordKey: 'en_word', sentenceKey: 'en_sentence' },
  fr: { code: 'fr', name: 'French',  flag: '🇫🇷', color: COLORS.fr, wordKey: 'fr_word', sentenceKey: 'fr_sentence' },
};

export const LANG_OPTIONS: LangMeta[] = [LANG_META.de, LANG_META.en, LANG_META.fr];
