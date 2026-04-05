import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { CSV_REGISTRY } from '../data/registry';
import { parseDataset } from '../utils/csvLoader';
import { buildDatasetMeta } from '../utils/datasetMeta';
import { Entry, EntryRecord, Language, DatasetMeta, CustomDataset } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchContent(
  meta: DatasetMeta,
  customDatasets: CustomDataset[],
): Promise<string> {
  if (meta.custom) {
    return customDatasets.find(d => d.meta.id === meta.id)?.content ?? '';
  }
  if (Platform.OS === 'web') {
    const res = await fetch(`/datasets/${meta.filename}`);
    if (!res.ok) throw new Error(`Failed to load "${meta.filename}" (HTTP ${res.status})`);
    return res.text();
  }
  return CSV_REGISTRY.find(d => d.id === meta.id)?.content ?? '';
}

async function loadEntries(
  meta: DatasetMeta,
  customDatasets: CustomDataset[],
): Promise<EntryRecord[]> {
  const content = await fetchContent(meta, customDatasets);
  return parseDataset(content).map(entry => ({
    ...entry,
    status:             'pending' as const,
    is_corrected:       false,
    last_edited_values: null,
  }));
}

function nativeDatasets(): DatasetMeta[] {
  return CSV_REGISTRY.map(({ id, label, icon, description, count }) => ({
    id, filename: `${id}.csv`, label, icon, description, count,
  }));
}

// ── State interface ───────────────────────────────────────────────────────────

interface StoreState {
  entries:          EntryRecord[];
  currentIndex:     number;
  isInitialized:    boolean;
  activeDataset:    string;
  validateLang:     Language;
  referenceLang:    Language;
  // Custom (user-uploaded) datasets — persisted
  customDatasets:   CustomDataset[];
  // Derived dataset list (built-in + custom) — not persisted, rebuilt on load
  datasets:         DatasetMeta[];
  datasetsLoading:  boolean;
  datasetLoading:   boolean;

  loadDatasets:        () => Promise<void>;
  switchDataset:       (id: string) => Promise<void>;
  addCustomDataset:    (filename: string, content: string) => Promise<void>;
  removeCustomDataset: (id: string) => void;
  approveEntry:        (id: string) => void;
  rejectEntry:         (id: string) => void;
  saveCorrection:      (id: string, values: Partial<Entry>) => void;
  setCurrentIndex:     (index: number) => void;
  resetAll:            () => Promise<void>;
  setValidateLang:     (lang: Language) => void;
  setReferenceLang:    (lang: Language) => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      entries:          [],
      currentIndex:     0,
      isInitialized:    false,
      activeDataset:    CSV_REGISTRY[0]?.id ?? '',
      validateLang:     'en',
      referenceLang:    'de',
      customDatasets:   [],
      datasets:         [],
      datasetsLoading:  false,
      datasetLoading:   false,

      loadDatasets: async () => {
        if (get().datasetsLoading) return;
        set({ datasetsLoading: true });
        try {
          let builtIn: DatasetMeta[];
          if (Platform.OS === 'web') {
            const res = await fetch('/datasets/manifest.json');
            if (!res.ok) throw new Error(`manifest.json not found (HTTP ${res.status})`);
            builtIn = await res.json();
          } else {
            builtIn = nativeDatasets();
          }

          // Merge built-in datasets with persisted custom ones.
          const customMetas = get().customDatasets.map(d => d.meta);
          const datasets    = [...builtIn, ...customMetas];

          // Validate persisted activeDataset; fall back to first.
          const persisted = get().activeDataset;
          const activeId  = datasets.some(d => d.id === persisted)
            ? persisted
            : (datasets[0]?.id ?? '');

          set({ datasets, datasetsLoading: false, activeDataset: activeId });

          // Load entries only if the session has no saved progress.
          if (!get().isInitialized || get().entries.length === 0) {
            const meta = datasets.find(d => d.id === activeId);
            if (meta) {
              set({ datasetLoading: true });
              const entries = await loadEntries(meta, get().customDatasets);
              set({ entries, isInitialized: true, currentIndex: 0, datasetLoading: false });
            }
          }
        } catch (err: any) {
          console.error('[LingoCheck] loadDatasets failed:', err.message);
          set({ datasetsLoading: false, datasetLoading: false });
        }
      },

      switchDataset: async (id) => {
        const state = get();
        if (state.activeDataset === id && state.isInitialized && state.entries.length > 0) return;
        const meta = state.datasets.find(d => d.id === id);
        if (!meta) return;
        set({ activeDataset: id, datasetLoading: true });
        try {
          const entries = await loadEntries(meta, get().customDatasets);
          set({ entries, isInitialized: true, currentIndex: 0, datasetLoading: false });
        } catch (err: any) {
          console.error('[LingoCheck] switchDataset failed:', err.message);
          set({ datasetLoading: false });
        }
      },

      addCustomDataset: async (filename, content) => {
        const meta = buildDatasetMeta(filename, content);

        // If a custom dataset with the same id already exists, replace it.
        const existing      = get().customDatasets.find(d => d.meta.id === meta.id);
        const customDatasets = existing
          ? get().customDatasets.map(d => d.meta.id === meta.id ? { meta, content } : d)
          : [...get().customDatasets, { meta, content }];

        // Rebuild the full datasets list.
        const builtIn  = get().datasets.filter(d => !d.custom);
        const datasets = [...builtIn, ...customDatasets.map(d => d.meta)];

        set({ customDatasets, datasets, activeDataset: meta.id, datasetLoading: true });

        try {
          const entries = await loadEntries(meta, customDatasets);
          set({ entries, isInitialized: true, currentIndex: 0, datasetLoading: false });
        } catch (err: any) {
          console.error('[LingoCheck] addCustomDataset failed:', err.message);
          set({ datasetLoading: false });
        }
      },

      removeCustomDataset: (id) => {
        const customDatasets = get().customDatasets.filter(d => d.meta.id !== id);
        const datasets       = get().datasets.filter(d => d.id !== id);
        const wasActive      = get().activeDataset === id;

        set({ customDatasets, datasets });

        if (wasActive && datasets.length > 0) {
          get().switchDataset(datasets[0].id);
        }
      },

      approveEntry: (id) =>
        set(s => ({ entries: s.entries.map(e => e.id === id ? { ...e, status: 'approved' } : e) })),

      rejectEntry: (id) =>
        set(s => ({ entries: s.entries.map(e => e.id === id ? { ...e, status: 'rejected' } : e) })),

      saveCorrection: (id, values) =>
        set(s => ({
          entries: s.entries.map(e =>
            e.id === id
              ? { ...e, ...values, is_corrected: true, last_edited_values: values, status: 'approved' }
              : e
          ),
        })),

      setCurrentIndex: (index) => set({ currentIndex: index }),

      resetAll: async () => {
        const state = get();
        const meta  = state.datasets.find(d => d.id === state.activeDataset);
        if (!meta) return;
        set({ datasetLoading: true });
        try {
          const entries = await loadEntries(meta, get().customDatasets);
          set({ entries, currentIndex: 0, isInitialized: true, datasetLoading: false });
        } catch (err: any) {
          console.error('[LingoCheck] resetAll failed:', err.message);
          set({ datasetLoading: false });
        }
      },

      setValidateLang: (lang) => {
        const { referenceLang } = get();
        if (lang === referenceLang) {
          const fallback = (['de', 'en', 'fr'] as Language[]).find(l => l !== lang)!;
          set({ validateLang: lang, referenceLang: fallback });
        } else {
          set({ validateLang: lang });
        }
      },

      setReferenceLang: (lang) => {
        const { validateLang } = get();
        if (lang === validateLang) {
          const fallback = (['de', 'en', 'fr'] as Language[]).find(l => l !== lang)!;
          set({ referenceLang: lang, validateLang: fallback });
        } else {
          set({ referenceLang: lang });
        }
      },
    }),
    {
      name:    'lingocheck-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        entries:        state.entries,
        currentIndex:   state.currentIndex,
        isInitialized:  state.isInitialized,
        activeDataset:  state.activeDataset,
        validateLang:   state.validateLang,
        referenceLang:  state.referenceLang,
        customDatasets: state.customDatasets,   // persisted so uploads survive reloads
      }),
    }
  )
);
