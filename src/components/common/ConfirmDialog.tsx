import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors, spacing, borderRadius, fontFamily, shadows, cardRadius } from '../../theme/colors';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { activeTheme } = useTheme();
  const theme = colors[activeTheme];

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable
          style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.title, { color: theme.foreground }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.mutedForeground }]}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: theme.border }]}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelText, { color: theme.foreground }]}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                { backgroundColor: destructive ? theme.destructive : theme.primary },
              ]}
              onPress={onConfirm}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.confirmText,
                  { color: destructive ? theme.destructiveForeground : theme.primaryForeground },
                ]}
              >
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: cardRadius,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    ...shadows.card,
  },
  title: {
    fontFamily: fontFamily.semibold,
    fontSize: 17,
    marginBottom: spacing.sm,
  },
  message: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  confirmText: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
  },
});
