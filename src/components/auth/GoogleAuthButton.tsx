import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { borderRadius, fontFamily, fontSize, spacing } from '../../theme/colors';

type GoogleAuthButtonProps = {
  disabled?: boolean;
  isLoading?: boolean;
  onPress: () => void;
  themeColors: {
    foreground: string;
    card: string;
    border: string;
    mutedForeground: string;
  };
};

function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.203 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C33.64 6.053 29.082 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <Path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 13 24 13c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C33.64 6.053 29.082 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.108 0 9.795-1.956 13.303-5.147l-6.149-5.193C29.203 36 24.723 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.149 5.193C36.678 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </Svg>
  );
}

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
      activeOpacity={0.85}
    >
      {isLoading ? (
        <ActivityIndicator color={themeColors.foreground} />
      ) : (
        <>
          <View style={styles.iconWrap}>
            <GoogleMark size={18} />
          </View>
          <Text style={styles.text}>Continue with Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (theme: GoogleAuthButtonProps['themeColors']) =>
  StyleSheet.create({
    button: {
      minHeight: 48,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      borderRadius: borderRadius.full,
      backgroundColor: theme.card,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    disabled: { opacity: 0.55 },
    iconWrap: {
      width: 22,
      height: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      color: theme.foreground,
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.sm,
    },
  });
