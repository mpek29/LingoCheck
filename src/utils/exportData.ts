// Web implementation — Metro picks this for the browser build.
// Native override: exportData.native.ts
import Papa from 'papaparse';
import { EntryRecord } from '../types';

function downloadBlob(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportAsJSON(entries: EntryRecord[]): Promise<void> {
  const reviewed = entries.filter((e) => e.status !== 'pending');
  downloadBlob(
    'lingomatch_export.json',
    JSON.stringify(reviewed, null, 2),
    'application/json'
  );
}

export async function exportAsCSV(entries: EntryRecord[]): Promise<void> {
  const reviewed = entries.filter((e) => e.status !== 'pending');
  downloadBlob('lingomatch_export.csv', Papa.unparse(reviewed), 'text/csv');
}
