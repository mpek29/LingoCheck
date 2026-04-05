import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useStore } from '../store/useStore';
import { COLORS, LANG_META } from '../config';
import { RootStackParamList, EntryRecord } from '../types';

const RejectedItem: React.FC<{
  entry: EntryRecord;
  validateLang: ReturnType<typeof useStore.getState>['validateLang'];
  referenceLang: ReturnType<typeof useStore.getState>['referenceLang'];
  onPress: () => void;
}> = ({ entry, validateLang, referenceLang, onPress }) => {
  const valMeta = LANG_META[validateLang];
  const refMeta = LANG_META[referenceLang];
  return (
  <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.75}>
    <View style={styles.itemLeft}>
      <Text style={[styles.primaryWord, { color: valMeta.color }]}>{entry[valMeta.wordKey]}</Text>
      <Text style={styles.secondaryWord}>{entry[refMeta.wordKey]}</Text>
    </View>
    <View style={styles.itemRight}>
      {entry.is_corrected && (
        <View style={styles.correctedBadge}>
          <Text style={styles.correctedText}>Fixed</Text>
        </View>
      )}
      <Text style={styles.chevron}>›</Text>
    </View>
  </TouchableOpacity>
  );
};

export const CorrectorScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const rejected = useStore((s) => s.entries.filter((e) => e.status === 'rejected'));
  const validateLang = useStore((s) => s.validateLang);
  const referenceLang = useStore((s) => s.referenceLang);
  const corrected = rejected.filter((e) => e.is_corrected).length;

  if (rejected.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>👍</Text>
        <Text style={styles.emptyTitle}>No rejected entries</Text>
        <Text style={styles.emptySubtitle}>
          Entries you swipe left on will appear here for correction.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          {rejected.length} rejected · {corrected} fixed
        </Text>
      </View>

      <FlatList
        data={rejected}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RejectedItem
            entry={item}
            validateLang={validateLang}
            referenceLang={referenceLang}
            onPress={() => navigation.navigate('Editor', { entryId: item.id })}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  statsRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statsText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  list: {
    padding: 16,
  },
  item: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemLeft: {
    flex: 1,
    gap: 2,
  },
  primaryWord: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryWord: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  correctedBadge: {
    backgroundColor: COLORS.approve + '33',
    borderWidth: 1,
    borderColor: COLORS.approve,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  correctedText: {
    color: COLORS.approve,
    fontSize: 11,
    fontWeight: '700',
  },
  chevron: {
    color: COLORS.textMuted,
    fontSize: 22,
    fontWeight: '300',
  },
  separator: {
    height: 8,
  },
  empty: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 52,
    marginBottom: 8,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
