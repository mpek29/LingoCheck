import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { useStore } from '../store/useStore';
import { COLORS } from '../config';
import { RootStackParamList, Entry } from '../types';

type EditorRouteProp = RouteProp<RootStackParamList, 'Editor'>;

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  accentColor: string;
  multiline?: boolean;
}

const EditField: React.FC<FieldProps> = ({
  label,
  value,
  onChange,
  accentColor,
  multiline = false,
}) => (
  <View style={styles.fieldContainer}>
    <Text style={[styles.fieldLabel, { color: accentColor }]}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.inputMulti, { borderColor: accentColor + '55' }]}
      value={value}
      onChangeText={onChange}
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
      placeholderTextColor={COLORS.border}
      selectionColor={accentColor}
    />
  </View>
);

export const EditorScreen: React.FC = () => {
  const route = useRoute<EditorRouteProp>();
  const navigation = useNavigation();
  const { entryId } = route.params;

  const entry = useStore((s) => s.entries.find((e) => e.id === entryId));
  const saveCorrection = useStore((s) => s.saveCorrection);

  const [de_word, setDeWord] = useState(entry?.de_word ?? '');
  const [de_sentence, setDeSentence] = useState(entry?.de_sentence ?? '');
  const [en_word, setEnWord] = useState(entry?.en_word ?? '');
  const [en_sentence, setEnSentence] = useState(entry?.en_sentence ?? '');
  const [fr_word, setFrWord] = useState(entry?.fr_word ?? '');
  const [fr_sentence, setFrSentence] = useState(entry?.fr_sentence ?? '');

  if (!entry) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Entry not found.</Text>
      </View>
    );
  }

  const hasChanges =
    de_word !== entry.de_word ||
    de_sentence !== entry.de_sentence ||
    en_word !== entry.en_word ||
    en_sentence !== entry.en_sentence ||
    fr_word !== entry.fr_word ||
    fr_sentence !== entry.fr_sentence;

  const handleSave = () => {
    const corrections: Partial<Entry> = {};
    if (de_word !== entry.de_word) corrections.de_word = de_word;
    if (de_sentence !== entry.de_sentence) corrections.de_sentence = de_sentence;
    if (en_word !== entry.en_word) corrections.en_word = en_word;
    if (en_sentence !== entry.en_sentence) corrections.en_sentence = en_sentence;
    if (fr_word !== entry.fr_word) corrections.fr_word = fr_word;
    if (fr_sentence !== entry.fr_sentence) corrections.fr_sentence = fr_sentence;

    saveCorrection(entry.id, corrections);
    Alert.alert('Saved', 'Correction saved. Entry marked as approved.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const handleDiscard = () => {
    if (hasChanges) {
      Alert.alert('Discard changes?', 'Your edits will be lost.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
      ]);
    } else {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Deck + ID */}
        <View style={styles.meta}>
          <Text style={styles.metaText}>{entry.deck}</Text>
          <Text style={styles.metaId}>#{entry.id}</Text>
        </View>

        {/* German */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: COLORS.de }]}>🇩🇪 German</Text>
          <EditField
            label="Word"
            value={de_word}
            onChange={setDeWord}
            accentColor={COLORS.de}
          />
          <EditField
            label="Sentence"
            value={de_sentence}
            onChange={setDeSentence}
            accentColor={COLORS.de}
            multiline
          />
        </View>

        {/* English */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: COLORS.en }]}>🇬🇧 English</Text>
          <EditField
            label="Word"
            value={en_word}
            onChange={setEnWord}
            accentColor={COLORS.en}
          />
          <EditField
            label="Sentence"
            value={en_sentence}
            onChange={setEnSentence}
            accentColor={COLORS.en}
            multiline
          />
        </View>

        {/* French */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: COLORS.fr }]}>🇫🇷 French</Text>
          <EditField
            label="Word"
            value={fr_word}
            onChange={setFrWord}
            accentColor={COLORS.fr}
          />
          <EditField
            label="Sentence"
            value={fr_sentence}
            onChange={setFrSentence}
            accentColor={COLORS.fr}
            multiline
          />
        </View>

        {/* Actions */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.btn, styles.discardBtn]}
            onPress={handleDiscard}
          >
            <Text style={styles.discardText}>Discard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.saveBtn, !hasChanges && styles.btnDisabled]}
            onPress={handleSave}
            disabled={!hasChanges}
          >
            <Text style={styles.saveText}>Save Correction</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  centered: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: COLORS.reject,
    fontSize: 16,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metaText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  metaId: {
    color: COLORS.border,
    fontSize: 12,
  },
  section: {
    marginBottom: 24,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  fieldContainer: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    color: COLORS.text,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputMulti: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  btn: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  discardBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  discardText: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: COLORS.approve,
  },
  saveText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.4,
  },
});
