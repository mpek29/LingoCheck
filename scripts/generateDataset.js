/**
 * Converts CSV data files → TypeScript dataset files
 *   assets/data/a1.csv           → src/data/dataset.ts
 *   assets/data/translations.csv → src/data/translationsDataset.ts
 *
 * Run: node scripts/generateDataset.js
 */
const Papa = require('papaparse');
const fs = require('fs');
const path = require('path');

// ── helpers ──────────────────────────────────────────────────────────────────

function write(outPath, content) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, content, 'utf8');
}

function parseCsv(csvPath) {
  const csv = fs.readFileSync(csvPath, 'utf8');
  const { data, errors } = Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  if (errors.length) console.warn('CSV warnings:', errors);
  return data;
}

// ── a1.csv → dataset.ts ───────────────────────────────────────────────────────

{
  const entries = parseCsv(path.join(__dirname, '../assets/data/a1.csv')).filter((r) => r.id);
  write(
    path.join(__dirname, '../src/data/dataset.ts'),
    `// Auto-generated from assets/data/a1.csv — do not edit manually.\n` +
    `// Regenerate: node scripts/generateDataset.js\n\n` +
    `import { Entry } from '../types';\n\n` +
    `export const DATASET: Entry[] = ${JSON.stringify(entries, null, 2)};\n`
  );
  console.log(`✓  A1 vocabulary : ${entries.length} entries → src/data/dataset.ts`);
}

// ── translations.csv → translationsDataset.ts ─────────────────────────────────

{
  const CATEGORY = (key) => {
    if (key.startsWith('langNames'))  return 'Language Names';
    if (key.startsWith('home'))       return 'Home Screen';
    if (key.startsWith('app'))        return 'App Settings';
    if (key.startsWith('splash'))     return 'Splash';
    if (key.startsWith('level'))      return 'Levels';
    if (key.startsWith('deckNames'))  return 'Deck Names';
    if (key.startsWith('study'))      return 'Study Screen';
    return 'General';
  };

  const rows = parseCsv(path.join(__dirname, '../assets/data/translations.csv')).filter((r) => r.key);
  const entries = rows.map((r) => ({
    id:          r.key,
    de_word:     r.key,
    de_sentence: r.de ?? '',
    en_word:     r.key,
    en_sentence: r.en ?? '',
    fr_word:     r.key,
    fr_sentence: r.fr ?? '',
    audioFile:   '',
    deck:        CATEGORY(r.key),
  }));

  write(
    path.join(__dirname, '../src/data/translationsDataset.ts'),
    `// Auto-generated from assets/data/translations.csv — do not edit manually.\n` +
    `// Regenerate: node scripts/generateDataset.js\n\n` +
    `import { Entry } from '../types';\n\n` +
    `export const TRANSLATIONS_DATASET: Entry[] = ${JSON.stringify(entries, null, 2)};\n`
  );
  console.log(`✓  UI translations: ${entries.length} entries → src/data/translationsDataset.ts`);
}
