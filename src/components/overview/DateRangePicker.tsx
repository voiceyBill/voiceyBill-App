import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

export type DateRangePreset =
  | '30days'
  | 'lastMonth'
  | 'last3Months'
  | 'lastYear'
  | 'thisMonth'
  | 'thisYear'
  | 'allTime';

const PRESETS: { label: string; value: DateRangePreset }[] = [
  { label: 'Last 30 Days', value: '30days' },
  { label: 'Last Month', value: 'lastMonth' },
  { label: 'Last 3 Months', value: 'last3Months' },
  { label: 'Last Year', value: 'lastYear' },
  { label: 'This Month', value: 'thisMonth' },
  { label: 'This Year', value: 'thisYear' },
  { label: 'All Time', value: 'allTime' },
];

export default function DateRangePicker({
  value,
  onChange,
  isDarkHeader = false,
}: {
  value: DateRangePreset;
  onChange: (v: DateRangePreset) => void;
  isDarkHeader?: boolean;
}) {
  const { activeTheme } = useTheme();
  const theme = colors[activeTheme];
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => PRESETS.find((p) => p.value === value)?.label || 'Select', [value]);

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.button,
          isDarkHeader
            ? { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.08)' }
            : { backgroundColor: theme.card, borderColor: theme.border }
        ]}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.buttonText, isDarkHeader ? { color: '#FFFFFF' } : { color: theme.foreground }]}>{selected}</Text>
        <Text style={{ color: isDarkHeader ? 'rgba(255,255,255,0.4)' : theme.mutedForeground, fontSize: 13 }}>▾</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <FlatList
              data={PRESETS}
              keyExtractor={(i) => i.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text style={{ color: theme.foreground }}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  option: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#00000010',
  },
});
