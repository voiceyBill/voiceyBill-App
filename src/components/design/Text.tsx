import React from "react";
import { Text as RNText, TextProps, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { colors, textStyles, TextVariant } from "../../theme/colors";

type Tone = "default" | "muted" | "primary" | "income" | "expense" | "inverse";

export interface AppTextProps extends TextProps {
  /** Semantic typography role from the design system. Defaults to `body`. */
  variant?: TextVariant;
  /** Semantic color token. Ignored if `color` is set. */
  tone?: Tone;
  /** Explicit color override (wins over `tone`). */
  color?: string;
}

/**
 * The single text primitive. Guarantees the app renders in Inter at a
 * consistent scale — no more accidental system-font fallbacks or ad-hoc sizes.
 */
export default function Text({
  variant = "body",
  tone = "default",
  color,
  style,
  ...rest
}: AppTextProps) {
  const { activeTheme } = useTheme();
  const theme = colors[activeTheme];

  const toneColor: Record<Tone, string> = {
    default: theme.foreground,
    muted: theme.mutedForeground,
    primary: theme.primary,
    income: theme.incomeText,
    expense: theme.expenseText,
    inverse: theme.primaryForeground,
  };

  return (
    <RNText
      style={[textStyles[variant], { color: color ?? toneColor[tone] }, style]}
      {...rest}
    />
  );
}

export const textPreset = (variant: TextVariant) =>
  StyleSheet.flatten(textStyles[variant]);
