import React from "react";
import { Text as RNText, TextStyle, StyleProp } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { colors, fontFamily } from "../../theme/colors";
import { formatCurrency } from "../../lib/formatCurrency";

type Size = "sm" | "md" | "lg" | "display";
type Tone = "neutral" | "income" | "expense";

export interface AmountProps {
  value: number;
  currency?: string;
  size?: Size;
  tone?: Tone;
  showSign?: boolean;
  style?: StyleProp<TextStyle>;
}

// All variants use tabular figures so amounts never shift horizontally.
const SIZE: Record<Size, TextStyle> = {
  sm: { fontFamily: fontFamily.semibold, fontSize: 13, lineHeight: 18 },
  md: { fontFamily: fontFamily.semibold, fontSize: 15, lineHeight: 22 },
  lg: { fontFamily: fontFamily.bold, fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  display: {
    fontFamily: fontFamily.extrabold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
};

/**
 * Money display with tabular figures and consistent income/expense coloring.
 */
export default function Amount({
  value,
  currency = "USD",
  size = "md",
  tone = "neutral",
  showSign = false,
  style,
}: AmountProps) {
  const { activeTheme } = useTheme();
  const theme = colors[activeTheme];

  const color =
    tone === "income"
      ? theme.incomeText
      : tone === "expense"
        ? theme.expenseText
        : theme.foreground;

  return (
    <RNText
      style={[SIZE[size], { color, fontVariant: ["tabular-nums"] }, style]}
      numberOfLines={1}
    >
      {formatCurrency(value, {
        currency,
        showSign,
        isExpense: tone === "expense" && showSign,
      })}
    </RNText>
  );
}
