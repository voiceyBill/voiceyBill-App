import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { colors, spacing, borderRadius, fontFamily, cardRadius } from '../../theme/colors';

export type ActionSheetOption = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

type ActionSheetProps = {
  visible: boolean;
  title?: string;
  options: ActionSheetOption[];
  onClose: () => void;
};

export default function ActionSheet({ visible, title, options, onClose }: ActionSheetProps) {
  const { activeTheme } = useTheme();
  const theme = colors[activeTheme];
  const insets = useSafeAreaInsets();

  const handleOption = (option: ActionSheetOption) => {
    onClose();
    option.onPress();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              paddingBottom: Math.max(insets.bottom, spacing.md),
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {title ? (
            <Text style={[styles.title, { color: theme.mutedForeground }]} numberOfLines={2}>
              {title}
            </Text>
          ) : null}
          {options.map((option, index) => (
            <TouchableOpacity
              key={`${option.label}-${index}`}
              style={[
                styles.option,
                index < options.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: theme.border,
                },
              ]}
              onPress={() => handleOption(option)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: option.destructive ? theme.destructive : theme.foreground },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: theme.border }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelText, { color: theme.foreground }]}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  sheet: {
    borderRadius: cardRadius,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingTop: spacing.sm,
  },
  title: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  option: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  optionText: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
  },
  cancelBtn: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.sm,
    marginBottom: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
  },
});
