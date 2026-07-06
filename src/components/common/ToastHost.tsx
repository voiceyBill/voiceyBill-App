import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { colors, spacing, borderRadius, fontFamily, shadows, cardRadius } from '../../theme/colors';
import { useNotification, type Toast } from '../../context/NotificationContext';

const ICONS: Record<Toast['type'], keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'close-circle',
  warning: 'warning',
  info: 'information-circle',
};

export default function ToastHost() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const insets = useSafeAreaInsets();
  const { toasts, dismissToast } = useNotification();
  const slideAnim = useRef(new Animated.Value(-120)).current;

  const currentToast = toasts[0];

  useEffect(() => {
    if (currentToast) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 68,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [currentToast, slideAnim]);

  const accent = !currentToast
    ? themeColors.foreground
    : currentToast.type === 'success'
      ? themeColors.primary
      : currentToast.type === 'error'
        ? themeColors.destructive
        : currentToast.type === 'warning'
          ? '#d97706'
          : themeColors.foreground;

  // Rendered inside a transparent Modal so the toast always sits ABOVE other
  // native modals (transaction form, budget editor, pickers) instead of behind
  // them. box-none lets taps pass through everywhere except the toast itself.
  return (
    <Modal
      transparent
      visible={!!currentToast}
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => currentToast && dismissToast(currentToast.id)}
    >
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.container,
          {
            paddingTop: insets.top + spacing.xs,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {currentToast ? (
          <View
            style={[
              styles.toast,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
              },
            ]}
          >
            <View style={[styles.accentBar, { backgroundColor: accent }]} />
            <View style={[styles.iconWrap, { backgroundColor: accent + '18' }]}>
              <Ionicons name={ICONS[currentToast.type]} size={20} color={accent} />
            </View>
            <View style={styles.textWrap}>
              {currentToast.title ? (
                <Text style={[styles.title, { color: themeColors.foreground }]} numberOfLines={1}>
                  {currentToast.title}
                </Text>
              ) : null}
              <Text
                style={[styles.message, { color: themeColors.mutedForeground }]}
                numberOfLines={3}
              >
                {currentToast.message}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => dismissToast(currentToast.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={18} color={themeColors.mutedForeground} />
            </TouchableOpacity>
          </View>
        ) : null}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: spacing.md,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: cardRadius,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm + 4,
    paddingRight: spacing.sm,
    paddingLeft: spacing.md + 4,
    gap: spacing.sm,
    overflow: 'hidden',
    ...shadows.card,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    marginBottom: 1,
  },
  message: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  closeBtn: {
    padding: spacing.xs,
  },
});
