import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme/colors';

type GoogleAuthButtonProps = {
  disabled?: boolean;
  isLoading?: boolean;
  onPress: () => void;
  themeColors: typeof colors.light;
};

export default function GoogleAuthButton({
  disabled,
  isLoading,
  onPress,
  themeColors,
}: GoogleAuthButtonProps) {
  const styles = createStyles(themeColors);

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
    >
      {isLoading ? (
        <ActivityIndicator color={themeColors.foreground} />
      ) : (
        <>
          <View style={styles.icon}>
            <Text style={styles.iconText}>G</Text>
          </View>
          <Text style={styles.text}>Continue with Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (theme: typeof colors.light) =>
  StyleSheet.create({
    button: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: borderRadius.md,
      backgroundColor: theme.card,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    disabled: { opacity: 0.6 },
    icon: {
      width: 22,
      height: 22,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.08)',
    },
    iconText: {
      color: '#4285F4',
      fontSize: fontSize.sm,
      fontWeight: fontWeight.bold,
    },
    text: {
      color: theme.foreground,
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
    },
  });
