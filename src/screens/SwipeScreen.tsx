import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useStore } from '../store/useStore';
import { playAudio } from '../utils/audio';
import { COLORS, LANG_META, SWIPE_THRESHOLD, SWIPE_OUT_DURATION } from '../config';
import { EntryRecord, Language, RootStackParamList } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Swipeable card ───────────────────────────────────────────────────────────

interface CardProps {
  entry: EntryRecord;
  validateLang: Language;
  referenceLang: Language;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

const SwipeCard: React.FC<CardProps> = ({ entry, validateLang, referenceLang, onSwipeLeft, onSwipeRight }) => {
  const refMeta = LANG_META[referenceLang];
  const valMeta = LANG_META[validateLang];

  // If both languages share the same word field value (translations dataset),
  // show it once at the top as a key label instead of repeating it.
  const sharedKey = entry[refMeta.wordKey] === entry[valMeta.wordKey]
    ? (entry[refMeta.wordKey] as string)
    : null;

  const pan = useRef(new Animated.ValueXY()).current;

  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-12deg', '0deg', '12deg'],
  });

  const approveOpacity = pan.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const rejectOpacity = pan.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gs) => {
        pan.flattenOffset();
        if (gs.dx > SWIPE_THRESHOLD) {
          flyOff('right');
        } else if (gs.dx < -SWIPE_THRESHOLD) {
          flyOff('left');
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const flyOff = useCallback(
    (dir: 'left' | 'right') => {
      const toX = dir === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
      Animated.timing(pan, {
        toValue: { x: toX, y: 0 },
        duration: SWIPE_OUT_DURATION,
        useNativeDriver: true,
      }).start(() => {
        pan.setValue({ x: 0, y: 0 });
        dir === 'right' ? onSwipeRight() : onSwipeLeft();
      });
    },
    [pan, onSwipeLeft, onSwipeRight]
  );

  return (
    <Animated.View
      style={[
        styles.card,
        { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Approve overlay */}
      <Animated.View style={[styles.overlay, styles.approveOverlay, { opacity: approveOpacity }]}>
        <Text style={[styles.overlayText, { color: COLORS.approve }]}>APPROVE</Text>
      </Animated.View>

      {/* Reject overlay */}
      <Animated.View style={[styles.overlay, styles.rejectOverlay, { opacity: rejectOpacity }]}>
        <Text style={[styles.overlayText, { color: COLORS.reject }]}>REJECT</Text>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Shared key label (translations dataset only) */}
        {sharedKey && (
          <View style={styles.keyBadge}>
            <Text style={styles.keyBadgeText}>{sharedKey}</Text>
          </View>
        )}

        {/* Reference language */}
        <View style={[styles.langBlock, styles.langBlockRef]}>
          <Text style={[styles.langLabel, { color: refMeta.color }]}>
            {refMeta.flag} {refMeta.name}
          </Text>
          {!sharedKey && (
            <Text style={styles.word}>{entry[refMeta.wordKey]}</Text>
          )}
          <Text style={styles.refSentence}>{entry[refMeta.sentenceKey]}</Text>
        </View>

        <View style={styles.divider} />

        {/* Validate language — more prominent */}
        <View style={styles.langBlock}>
          <Text style={[styles.langLabel, { color: valMeta.color }]}>
            {valMeta.flag} {valMeta.name}
          </Text>
          {!sharedKey && (
            <Text style={styles.word}>{entry[valMeta.wordKey]}</Text>
          )}
          <Text style={styles.valSentence}>{entry[valMeta.sentenceKey]}</Text>
        </View>
      </ScrollView>

      {/* Swipe hint */}
      <View style={styles.hint}>
        <Text style={styles.hintText}>← Reject · Approve →</Text>
      </View>
    </Animated.View>
  );
};

// ─── SwipeScreen ──────────────────────────────────────────────────────────────

export const SwipeScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const entries       = useStore((s) => s.entries);
  const currentIndex  = useStore((s) => s.currentIndex);
  const approveEntry  = useStore((s) => s.approveEntry);
  const rejectEntry   = useStore((s) => s.rejectEntry);
  const setCurrentIndex = useStore((s) => s.setCurrentIndex);
  const validateLang  = useStore((s) => s.validateLang);
  const referenceLang = useStore((s) => s.referenceLang);

  const currentEntry = entries[currentIndex];
  const isDone = currentIndex >= entries.length;

  const reviewed = entries.filter((e) => e.status !== 'pending').length;
  const progress = entries.length > 0 ? reviewed / entries.length : 0;

  useEffect(() => {
    if (!currentEntry?.audioFile) return;
    return playAudio(currentEntry.audioFile);
  }, [currentEntry?.id]);

  const handleApprove = useCallback(() => {
    if (!currentEntry) return;
    approveEntry(currentEntry.id);
    setCurrentIndex(currentIndex + 1);
  }, [currentEntry, currentIndex, approveEntry, setCurrentIndex]);

  const handleReject = useCallback(() => {
    if (!currentEntry) return;
    rejectEntry(currentEntry.id);
    setCurrentIndex(currentIndex + 1);
  }, [currentEntry, currentIndex, rejectEntry, setCurrentIndex]);

  if (isDone) {
    const approved = entries.filter((e) => e.status === 'approved').length;
    const rejected = entries.filter((e) => e.status === 'rejected').length;
    return (
      <View style={styles.doneContainer}>
        <Text style={styles.doneEmoji}>🎉</Text>
        <Text style={styles.doneTitle}>All done!</Text>
        <Text style={styles.doneSubtitle}>
          {approved} approved · {rejected} rejected
        </Text>
        <TouchableOpacity
          style={[styles.doneBtn, { backgroundColor: COLORS.primary }]}
          onPress={() => navigation.navigate('Corrector')}
        >
          <Text style={styles.doneBtnText}>Review Corrections</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.doneBtn, { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border }]}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.doneBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Progress row */}
      <View style={styles.progressRow}>
        <Text style={styles.progressIndex}>
          <Text style={styles.progressIndexCurrent}>{currentIndex + 1}</Text>
          <Text style={styles.progressIndexSep}> / {entries.length}</Text>
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
        </View>
        <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
      </View>

      {/* Card */}
      <View style={styles.cardStack}>
        {currentEntry && (
          <SwipeCard
            key={currentEntry.id}
            entry={currentEntry}
            validateLang={validateLang}
            referenceLang={referenceLang}
            onSwipeLeft={handleReject}
            onSwipeRight={handleApprove}
          />
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity style={[styles.circleBtn, styles.rejectBtn]} onPress={handleReject}>
          <Text style={styles.circleBtnText}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.circleBtn, styles.approveBtn]} onPress={handleApprove}>
          <Text style={styles.circleBtnText}>✓</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  // Progress
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  progressIndex: {
    minWidth: 58,
  },
  progressIndexCurrent: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  progressIndexSep: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressPct: {
    color: COLORS.textMuted,
    fontSize: 13,
    minWidth: 36,
    textAlign: 'right',
  },

  // Card stack
  cardStack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 32,
    maxHeight: 500,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },

  // Overlays
  overlay: {
    position: 'absolute',
    top: 22,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 2.5,
    zIndex: 10,
  },
  approveOverlay: {
    right: 22,
    borderColor: COLORS.approve,
  },
  rejectOverlay: {
    left: 22,
    borderColor: COLORS.reject,
  },
  overlayText: {
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 2,
  },

  // Key badge (translations)
  keyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  keyBadgeText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace' as any,
  },

  // Language blocks
  langBlock: {
    marginBottom: 4,
    gap: 4,
  },
  langBlockRef: {
    opacity: 0.75,
  },
  langLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  word: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  refSentence: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  valSentence: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },

  // Hint
  hint: {
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  hintText: {
    color: COLORS.border,
    fontSize: 11,
    letterSpacing: 0.5,
  },

  // Buttons
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 44,
    marginTop: 20,
  },
  circleBtn: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  rejectBtn: {
    backgroundColor: COLORS.reject,
  },
  approveBtn: {
    backgroundColor: COLORS.approve,
  },
  circleBtnText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 30,
  },

  // Done screen
  doneContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 14,
  },
  doneEmoji: {
    fontSize: 60,
    marginBottom: 8,
  },
  doneTitle: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  doneSubtitle: {
    color: COLORS.textMuted,
    fontSize: 15,
    marginBottom: 16,
  },
  doneBtn: {
    width: '100%',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  doneBtnText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
});
