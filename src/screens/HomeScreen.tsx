import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useStore } from '../store/useStore';
import { exportAsJSON, exportAsCSV } from '../utils/exportData';
import { COLORS, LANG_OPTIONS, LangMeta } from '../config';
import { Language, RootStackParamList } from '../types';

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionTitle: React.FC<{ children: string }> = ({ children }) => (
  <Text style={styles.sectionTitle}>{children}</Text>
);

const DatasetCard: React.FC<{
  id: string;
  label: string;
  description: string;
  count: number;
  icon: string;
  active: boolean;
  custom?: boolean;
  onPress: () => void;
  onRemove?: () => void;
}> = ({ label, description, count, icon, active, custom, onPress, onRemove }) => (
  <TouchableOpacity
    style={[styles.datasetCard, active && styles.datasetCardActive]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <View style={styles.datasetCardLeft}>
      <Text style={styles.datasetIcon}>{icon}</Text>
      <View style={styles.datasetCardText}>
        <Text style={[styles.datasetLabel, active && styles.datasetLabelActive]}>{label}</Text>
        <Text style={styles.datasetDesc}>{description}</Text>
      </View>
    </View>
    <View style={styles.datasetCardRight}>
      <View style={[styles.datasetPill, active && styles.datasetPillActive]}>
        <Text style={[styles.datasetPillText, active && styles.datasetPillTextActive]}>
          {count}
        </Text>
      </View>
      {custom && onRemove && (
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={(e) => { e.stopPropagation?.(); onRemove(); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.removeBtnText}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  </TouchableOpacity>
);

const LangPicker: React.FC<{
  label: string;
  selected: Language;
  disabled?: Language;
  onSelect: (lang: Language) => void;
}> = ({ label, selected, disabled, onSelect }) => (
  <View style={styles.pickerBlock}>
    <Text style={styles.pickerLabel}>{label}</Text>
    <View style={styles.pickerRow}>
      {LANG_OPTIONS.map((meta: LangMeta) => {
        const isActive = meta.code === selected;
        const isDisabled = meta.code === disabled;
        return (
          <TouchableOpacity
            key={meta.code}
            style={[
              styles.langBtn,
              isActive && { backgroundColor: meta.color + '1A', borderColor: meta.color },
              isDisabled && styles.langBtnDisabled,
            ]}
            onPress={() => onSelect(meta.code)}
            disabled={isDisabled}
            activeOpacity={0.7}
          >
            <Text style={styles.langBtnFlag}>{meta.flag}</Text>
            <Text style={[styles.langBtnName, isActive && { color: meta.color }]}>
              {meta.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

// ─── HomeScreen ───────────────────────────────────────────────────────────────

export const HomeScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<any>(null);

  const entries              = useStore((s) => s.entries);
  const currentIndex         = useStore((s) => s.currentIndex);
  const isInitialized        = useStore((s) => s.isInitialized);
  const activeDataset        = useStore((s) => s.activeDataset);
  const datasets             = useStore((s) => s.datasets);
  const datasetsLoading      = useStore((s) => s.datasetsLoading);
  const datasetLoading       = useStore((s) => s.datasetLoading);
  const loadDatasets         = useStore((s) => s.loadDatasets);
  const switchDataset        = useStore((s) => s.switchDataset);
  const addCustomDataset     = useStore((s) => s.addCustomDataset);
  const removeCustomDataset  = useStore((s) => s.removeCustomDataset);
  const validateLang         = useStore((s) => s.validateLang);
  const referenceLang        = useStore((s) => s.referenceLang);
  const setValidateLang      = useStore((s) => s.setValidateLang);
  const setReferenceLang     = useStore((s) => s.setReferenceLang);

  useEffect(() => { loadDatasets(); }, [loadDatasets]);

  const handleFileChange = (e: any) => {
    const file: File | undefined = e.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      addCustomDataset(file.name, content);
    };
    reader.readAsText(file);
    // Reset so the same file can be re-uploaded if needed
    e.target.value = '';
  };

  const approved  = entries.filter((e) => e.status === 'approved').length;
  const rejected  = entries.filter((e) => e.status === 'rejected').length;
  const total     = entries.length;
  const reviewed  = approved + rejected;
  const pct       = total > 0 ? Math.round((reviewed / total) * 100) : 0;
  const hasStarted = isInitialized && currentIndex > 0;
  const isComplete = isInitialized && currentIndex >= total && total > 0;

  const handleExport = async (format: 'json' | 'csv') => {
    if (!entries.length) return;
    setExporting(true);
    try {
      if (format === 'json') await exportAsJSON(entries);
      else await exportAsCSV(entries);
    } catch (err: any) {
      Alert.alert('Export failed', err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero ── */}
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>AUDIT TOOL</Text>
        </View>
        <Text style={styles.heroTitle}>LingoCheck</Text>
        <Text style={styles.heroMotto}>✨ Swipe, verify &amp; fix language</Text>
      </View>

      {/* ── Dataset ── */}
      <View style={styles.section}>
        <SectionTitle>Dataset</SectionTitle>
        {datasetsLoading ? (
          <View style={styles.loadingRow}>
            <Text style={styles.loadingText}>Loading datasets…</Text>
          </View>
        ) : (
          <View style={styles.datasetList}>
            {datasets.map((d) => (
              <DatasetCard
                key={d.id}
                {...d}
                active={activeDataset === d.id && !datasetLoading}
                onPress={() => switchDataset(d.id)}
                onRemove={d.custom ? () => removeCustomDataset(d.id) : undefined}
              />
            ))}
            {/* Hidden file input — web only */}
            {Platform.OS === 'web' && (
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            )}
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={() => {
                if (Platform.OS === 'web') {
                  fileInputRef.current?.click();
                }
              }}
              activeOpacity={0.75}
            >
              <Text style={styles.uploadBtnText}>+ Add CSV</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Languages ── */}
      <View style={styles.section}>
        <SectionTitle>Languages</SectionTitle>
        <View style={styles.card}>
          <LangPicker
            label="Validate"
            selected={validateLang}
            disabled={referenceLang}
            onSelect={setValidateLang}
          />
          <View style={styles.divider} />
          <LangPicker
            label="Reference"
            selected={referenceLang}
            disabled={validateLang}
            onSelect={setReferenceLang}
          />
        </View>
      </View>

      {/* ── Progress ── */}
      {isInitialized && total > 0 && (
        <View style={styles.section}>
          <SectionTitle>Progress</SectionTitle>
          <View style={styles.card}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressPct}>{pct}%</Text>
              <Text style={styles.progressSub}>
                {reviewed} / {total} reviewed
              </Text>
            </View>
            {/* Segmented bar */}
            <View style={styles.progressTrack}>
              {approved > 0 && (
                <View style={[styles.progressSegment, styles.approvedSeg, { flex: approved }]} />
              )}
              {rejected > 0 && (
                <View style={[styles.progressSegment, styles.rejectedSeg, { flex: rejected }]} />
              )}
              {total - reviewed > 0 && (
                <View style={[styles.progressSegment, styles.pendingSeg, { flex: total - reviewed }]} />
              )}
            </View>
            {/* Legend */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.approve }]} />
                <Text style={styles.legendText}>{approved} approved</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.reject }]} />
                <Text style={styles.legendText}>{rejected} rejected</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.border }]} />
                <Text style={styles.legendText}>{total - reviewed} pending</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ── Actions ── */}
      <View style={styles.section}>
        {isComplete ? (
          <View style={styles.completeBadge}>
            <Text style={styles.completeEmoji}>🎉</Text>
            <Text style={styles.completeText}>All {total} entries reviewed</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => navigation.navigate('Swipe')}
            disabled={!isInitialized}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaBtnText}>
              {hasStarted ? `Continue  ·  ${currentIndex} / ${total}` : 'Start Reviewing'}
            </Text>
            <Text style={styles.ctaArrow}>→</Text>
          </TouchableOpacity>
        )}

        {rejected > 0 && (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Corrector')}
            activeOpacity={0.75}
          >
            <Text style={styles.secondaryBtnText}>
              View Corrections
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{rejected}</Text>
            </View>
          </TouchableOpacity>
        )}

        {reviewed > 0 && (
          <View style={styles.exportRow}>
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={() => handleExport('json')}
              disabled={exporting}
              activeOpacity={0.75}
            >
              <Text style={styles.exportBtnText}>↓ JSON</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={() => handleExport('csv')}
              disabled={exporting}
              activeOpacity={0.75}
            >
              <Text style={styles.exportBtnText}>↓ CSV</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 48,
    gap: 28,
  },

  // Hero
  hero: {
    paddingTop: 8,
    gap: 6,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary + '22',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.primary + '55',
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
  },
  heroBadgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1.5,
    lineHeight: 46,
  },
  heroMotto: {
    color: COLORS.textMuted,
    fontSize: 15,
    marginTop: 2,
  },

  // Section
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginLeft: 2,
  },

  // Card shell
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Dataset
  datasetList: {
    gap: 10,
  },
  datasetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  datasetCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '0D',
  },
  datasetCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  datasetIcon: {
    fontSize: 28,
  },
  datasetCardText: {
    flex: 1,
    gap: 2,
  },
  datasetLabel: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: '700',
  },
  datasetLabelActive: {
    color: COLORS.text,
  },
  datasetDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    opacity: 0.8,
  },
  datasetPill: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 10,
  },
  datasetPillActive: {
    backgroundColor: COLORS.primary + '33',
  },
  datasetPillText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  datasetPillTextActive: {
    color: COLORS.primary,
  },

  // Language pickers
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  pickerBlock: {
    gap: 10,
  },
  pickerLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  langBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceLight,
    gap: 4,
  },
  langBtnDisabled: {
    opacity: 0.25,
  },
  langBtnFlag: {
    fontSize: 22,
  },
  langBtnName: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },

  // Progress
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressPct: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  progressSub: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  progressTrack: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: COLORS.border,
    marginBottom: 12,
  },
  progressSegment: {
    height: 10,
  },
  approvedSeg: { backgroundColor: COLORS.approve },
  rejectedSeg: { backgroundColor: COLORS.reject },
  pendingSeg:  { backgroundColor: COLORS.border },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },

  // CTA
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 22,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  ctaArrow: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '300',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 10,
  },
  secondaryBtnText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: COLORS.reject + '22',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.reject + '66',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: COLORS.reject,
    fontSize: 12,
    fontWeight: '700',
  },
  exportRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  exportBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exportBtnText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Dataset card right side
  datasetCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.reject + '22',
    borderWidth: 1,
    borderColor: COLORS.reject + '66',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: COLORS.reject,
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '700',
  },

  // Upload button
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.primary + '88',
    paddingVertical: 13,
    backgroundColor: COLORS.primary + '08',
  },
  uploadBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Loading
  loadingRow: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },

  // Complete
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.approve + '18',
    borderWidth: 1.5,
    borderColor: COLORS.approve + '55',
    borderRadius: 16,
    padding: 20,
  },
  completeEmoji: {
    fontSize: 22,
  },
  completeText: {
    color: COLORS.approve,
    fontSize: 16,
    fontWeight: '700',
  },
});
