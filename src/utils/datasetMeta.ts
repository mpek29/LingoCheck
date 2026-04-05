/**
 * Shared helpers for deriving dataset metadata from a filename + CSV content.
 * Used both by the Node build scripts and the runtime upload flow.
 */
import Papa from 'papaparse';
import { DatasetMeta } from '../types';

export function toLabel(filename: string): string {
  return filename
    .replace(/\.csv$/i, '')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\b([AaBbCc][12])\b/g, s => s.toUpperCase());
}

export function toIcon(filename: string): string {
  const n = filename.toLowerCase();
  if (/[ab][12]|vocab|word|dict|glossar/.test(n)) return '📚';
  if (/transl|i18n|locale|string|ui/.test(n))     return '🖥️';
  if (/phrase|convers/.test(n))                    return '💬';
  return '📝';
}

export function toDescription(headers: string[], count: number): string {
  if (headers.some(h => /^(de|en|fr)_word$/.test(h)))
    return `${count} vocab entries with example sentences`;
  if (headers.includes('key') && ['en', 'de', 'fr'].some(l => headers.includes(l)))
    return `${count} UI translation strings`;
  return `${count} entries`;
}

/** Build a DatasetMeta object from a raw CSV string and its filename. */
export function buildDatasetMeta(filename: string, content: string): DatasetMeta {
  const { data } = Papa.parse<Record<string, string>>(content, {
    header: true, skipEmptyLines: true, transformHeader: h => h.trim(),
  });
  const headers = data.length ? Object.keys(data[0]) : [];
  const id      = filename.replace(/\.csv$/i, '').replace(/[^a-zA-Z0-9]/g, '_');
  return {
    id,
    filename,
    label:       toLabel(filename),
    icon:        toIcon(filename),
    description: toDescription(headers, data.length),
    count:       data.length,
    custom:      true,
  };
}
