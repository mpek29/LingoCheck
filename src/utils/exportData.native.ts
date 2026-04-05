// Native implementation (iOS / Android / Windows).
// Metro picks this file over exportData.ts on all non-web platforms.
import { Platform, Alert } from 'react-native';
import Papa from 'papaparse';
import RNFS from 'react-native-fs';
import { EntryRecord } from '../types';

async function writeAndShare(filename: string, content: string): Promise<void> {
  const path = `${RNFS.DocumentDirectoryPath}/${filename}`;
  await RNFS.writeFile(path, content, 'utf8');

  if (Platform.OS === 'windows') {
    Alert.alert('Exported', `File saved to:\n${path}`);
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { shareAsync } = require('expo-sharing') as typeof import('expo-sharing');
  await shareAsync(path, { dialogTitle: 'Export LingoMatch Data' });
}

export async function exportAsJSON(entries: EntryRecord[]): Promise<void> {
  const reviewed = entries.filter((e) => e.status !== 'pending');
  await writeAndShare('lingomatch_export.json', JSON.stringify(reviewed, null, 2));
}

export async function exportAsCSV(entries: EntryRecord[]): Promise<void> {
  const reviewed = entries.filter((e) => e.status !== 'pending');
  await writeAndShare('lingomatch_export.csv', Papa.unparse(reviewed));
}
