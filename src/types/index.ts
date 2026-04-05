export type Language = 'de' | 'en' | 'fr';

export interface DatasetMeta {
  id:          string;
  filename:    string;
  label:       string;
  icon:        string;
  description: string;
  count:       number;
  custom?:     boolean;   // true for user-uploaded datasets
}

export interface CustomDataset {
  meta:    DatasetMeta;
  content: string;        // raw CSV text, stored in AsyncStorage
}

export interface Entry {
  id: string;
  de_word: string;
  de_sentence: string;
  en_word: string;
  en_sentence: string;
  fr_word: string;
  fr_sentence: string;
  audioFile: string;
  deck: string;
}

export interface EntryRecord extends Entry {
  status: 'pending' | 'approved' | 'rejected';
  is_corrected: boolean;
  last_edited_values: Partial<Entry> | null;
}

export type RootStackParamList = {
  Home: undefined;
  Swipe: undefined;
  Corrector: undefined;
  Editor: { entryId: string };
};
