import React from "react";
import {
  View,
  ViewStyle,
  StyleProp,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { colors, spacing, borderRadius, elevation, press } from "../../theme/colors";

type Padding = "none" | "sm" | "md" | "lg";
type Elevation = "none" | "rest" | "raised";

export interface CardProps {
  children: React.ReactNode;
  padding?: Padding;
  elevation?: Elevation;
  /** Show the hairline border. Default true. */
  bordered?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const PADDING: Record<Padding, number> = {
  none: 0,
  sm: spacing.md,
  md: spacing.lg,
  lg: spacing.xl,
};

/**
 * The single card surface. Replaces the two dead Card components and the
 * hand-rolled cards on every screen, so radius/border/elevation are uniform.
 */
export default function Card({
  children,
  padding = "md",
  elevation: elev = "rest",
  bordered = true,
  onPress,
  onLongPress,
  style,
  accessibilityLabel,
}: CardProps) {
  const { activeTheme } = useTheme();
  const theme = colors[activeTheme];

  const surface: StyleProp<ViewStyle> = [
    {
      backgroundColor: theme.card,
      borderRadius: borderRadius.card,
      padding: PADDING[padding],
    },
    bordered && {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
    },
    elev !== "none" && elevation[elev],
    style,
  ];

  if (onPress || onLongPress) {
    return (
      <TouchableOpacity
        activeOpacity={press.card}
        onPress={onPress}
        onLongPress={onLongPress}
        style={surface}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={surface}>{children}</View>;
}
