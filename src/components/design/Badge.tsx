import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { colors, borderRadius, fontFamily } from "../../theme/colors";

type Tone = "neutral" | "income" | "expense" | "success" | "warning" | "danger";

export interface BadgeProps {
  label: string;
  tone?: Tone;
}

/**
 * Small status pill. Tone maps to a foreground + tinted background from the
 * theme so badges read consistently in light and dark.
 */
export default function Badge({ label, tone = "neutral" }: BadgeProps) {
  const { activeTheme } = useTheme();
  const theme = colors[activeTheme];

  const map: Record<Tone, { fg: string; bg: string }> = {
    neutral: { fg: theme.mutedForeground, bg: theme.muted },
    income: { fg: theme.incomeText, bg: theme.incomeBg },
    expense: { fg: theme.expenseText, bg: theme.expenseBg },
    success: { fg: theme.success, bg: theme.successBg },
    warning: { fg: theme.warning, bg: theme.warningBg },
    danger: { fg: theme.destructive, bg: theme.expenseBg },
  };
  const { fg, bg } = map[tone];

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.chip,
    alignSelf: "flex-start",
  },
  text: {
    fontFamily: fontFamily.semibold,
    fontSize: 11,
    lineHeight: 14,
  },
});
