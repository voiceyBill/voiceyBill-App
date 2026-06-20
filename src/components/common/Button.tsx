import React from "react";
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
  StyleProp,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import {
  colors,
  spacing,
  borderRadius,
  fontFamily,
  shadows,
} from "../../theme/colors";
import Spinner from "./Spinner";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "destructive"
  | "ghost";

export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Text shown while `loading` is true. Defaults to `label`. */
  loadingLabel?: string;
  disabled?: boolean;
  /** Stretch to fill the parent width. Default true. */
  fullWidth?: boolean;
  /** Optional leading icon element (rendered before the label). */
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const SIZE_TOKENS: Record<
  ButtonSize,
  { paddingVertical: number; fontSize: number; minHeight: number; gap: number }
> = {
  sm: { paddingVertical: spacing.sm, fontSize: 13, minHeight: 38, gap: spacing.xs },
  md: { paddingVertical: spacing.md, fontSize: 15, minHeight: 50, gap: spacing.sm },
  lg: { paddingVertical: spacing.md + 2, fontSize: 16, minHeight: 56, gap: spacing.sm },
};

/**
 * The single button used across the app. Guarantees consistent color, font,
 * radius, sizing and disabled/loading behaviour so buttons can never be
 * mismatched (e.g. invisible text on the primary background).
 */
export default function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  loadingLabel,
  disabled = false,
  fullWidth = true,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const { activeTheme } = useTheme();
  const theme = colors[activeTheme];

  const sizeToken = SIZE_TOKENS[size];

  // Resolve background, text and border per variant from the theme so contrast
  // is always correct in both light and dark mode.
  const palette: Record<
    ButtonVariant,
    { bg: string; fg: string; border?: string; elevated: boolean }
  > = {
    primary: { bg: theme.primary, fg: theme.primaryForeground, elevated: true },
    secondary: {
      bg: theme.secondary,
      fg: theme.secondaryForeground,
      elevated: false,
    },
    outline: {
      bg: theme.card,
      fg: theme.foreground,
      border: theme.border,
      elevated: false,
    },
    destructive: {
      bg: theme.destructive,
      fg: theme.destructiveForeground,
      elevated: true,
    },
    ghost: { bg: "transparent", fg: theme.foreground, elevated: false },
  };

  const { bg, fg, border, elevated } = palette[variant];
  const isInteractive = !disabled && !loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!isInteractive}
      activeOpacity={0.85}
      style={[
        styles.base,
        {
          backgroundColor: bg,
          paddingVertical: sizeToken.paddingVertical,
          minHeight: sizeToken.minHeight,
          gap: sizeToken.gap,
        },
        border ? { borderWidth: StyleSheet.hairlineWidth, borderColor: border } : null,
        elevated ? shadows.md : null,
        fullWidth ? styles.fullWidth : styles.auto,
        !isInteractive && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <Spinner size={sizeToken.fontSize + 3} color={fg} />
      ) : (
        icon
      )}
      <Text
        style={[
          styles.text,
          { color: fg, fontSize: sizeToken.fontSize },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {loading ? loadingLabel ?? label : label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
  },
  fullWidth: {
    alignSelf: "stretch",
    width: "100%",
  },
  auto: {
    alignSelf: "flex-start",
  },
  disabled: {
    opacity: 0.45,
  },
  text: {
    fontFamily: fontFamily.semibold,
    textAlign: "center",
  },
});
