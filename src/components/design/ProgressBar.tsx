import React from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { colors, borderRadius } from "../../theme/colors";

type Tone = "primary" | "success" | "warning" | "danger";

export interface ProgressBarProps {
  /** 0–100. Clamped and capped at 100 for the fill width. */
  progress: number;
  tone?: Tone;
  height?: number;
  /** Explicit fill color (wins over `tone`). */
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Track + fill progress indicator with a consistent height and pill radius.
 */
export default function ProgressBar({
  progress,
  tone = "primary",
  height = 8,
  color,
  style,
}: ProgressBarProps) {
  const { activeTheme } = useTheme();
  const theme = colors[activeTheme];

  const toneColor: Record<Tone, string> = {
    primary: theme.primary,
    success: theme.success,
    warning: theme.warning,
    danger: theme.destructive,
  };

  const pct = Math.max(0, Math.min(progress, 100));

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: theme.muted },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
    >
      <View
        style={{
          width: `${pct}%`,
          height: "100%",
          borderRadius: borderRadius.pill,
          backgroundColor: color ?? toneColor[tone],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    overflow: "hidden",
  },
});
