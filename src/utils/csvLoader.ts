/**
 * Runtime CSV parser with automatic schema detection.
 *
 * Supports two schemas out of the box and degrades gracefully for anything else:
 *
 *  • vocabulary   columns: id, de_word, de_sentence, en_word, en_sentence, …
 *  • i18n         columns: key, en, de, fr
 *
 * Add a new CSV in assets/data/, run `npm run sync-datasets`, and the app
 * will automatically pick up the right schema — no code changes needed.
 */

import Papa from 'papaparse';
import { Entry } from '../types';

// ── Schema detection ──────────────────────────────────────────────────────────

type Schema = 'vocabulary' | 'i18n';

function detectSchema(headers: string[]): Schema {
  // Vocabulary: has at least one <lang>_word column
  if (headers.some(h => /^(de|en|fr)_word$/.test(h))) return 'vocabulary';
  // i18n: has a key/id anchor + bare language-code columns
  const hasAnchor = headers.includes('key') || headers.includes('id');
  const hasLangCols = ['en', 'de', 'fr'].some(l => headers.includes(l));
  if (hasAnchor && hasLangCols) return 'i18n';
  // Default — try vocabulary mapping (graceful degradation)
  return 'vocabulary';
}

// ── Deck / category inference ─────────────────────────────────────────────────

const I18N_CATEGORIES: Record<string, string> = {
  langNames:  'Language Names',
  home:       'Home Screen',
  app:        'App Settings',
  splash:     'Splash',
  level:      'Levels',
  deckNames:  'Deck Names',
  study:      'Study Screen',
};

function inferDeck(row: Record<string, string>, schema: Schema): string {
  if (schema === 'vocabulary') return row.deck || 'General';
  const key    = row.key || row.id || '';
  const prefix = key.split('.')[0].replace(/([A-Z])/g, ' $1').trim().split(' ')[0];
  return I18N_CATEGORIES[prefix] ?? 'General';
}

// ── Row mapper ────────────────────────────────────────────────────────────────

function mapRow(row: Record<string, string>, schema: Schema, index: number): Entry {
  if (schema === 'vocabulary') {
    return {
      id:          row.id          || String(index),
      de_word:     row.de_word     || '',
      de_sentence: row.de_sentence || '',
      en_word:     row.en_word     || '',
      en_sentence: row.en_sentence || '',
      fr_word:     row.fr_word     || '',
      fr_sentence: row.fr_sentence || '',
      audioFile:   row.audioFile   || '',
      deck:        inferDeck(row, schema),
    };
  }

  // i18n schema
  const key = row.key || row.id || String(index);
  return {
    id:          key,
    de_word:     key,
    de_sentence: row.de || '',
    en_word:     key,
    en_sentence: row.en || '',
    fr_word:     key,
    fr_sentence: row.fr || '',
    audioFile:   '',
    deck:        inferDeck(row, schema),
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export function parseDataset(content: string): Entry[] {
  const { data, errors } = Papa.parse<Record<string, string>>(content, {
    header:           true,
    skipEmptyLines:   true,
    transformHeader:  h => h.trim(),
  });

  if (errors.length) {
    console.warn('[csvLoader] Parse warnings:', errors.length);
  }
  if (!data.length) return [];

  const schema = detectSchema(Object.keys(data[0]));
  return data.map((row, i) => mapRow(row, schema, i));
}
