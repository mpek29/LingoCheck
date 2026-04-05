import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../config';

interface ProgressBarProps {
  progress: number; // 0–1
  approved: number;
  rejected: number;
  total: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  approved,
  rejected,
  total,
}) => {
  const pct = Math.round(progress * 100);
  const pending = total - approved - rejected;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{pct}% Reviewed</Text>
        <Text style={styles.counts}>
          {approved} approved · {rejected} rejected · {pending} pending
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.approvedFill, { flex: approved }]} />
        <View style={[styles.rejectedFill, { flex: rejected }]} />
        <View style={[styles.pendingFill, { flex: pending }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  label: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  counts: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  track: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: COLORS.border,
  },
  approvedFill: {
    backgroundColor: COLORS.approve,
  },
  rejectedFill: {
    backgroundColor: COLORS.reject,
  },
  pendingFill: {
    backgroundColor: COLORS.border,
  },
});
