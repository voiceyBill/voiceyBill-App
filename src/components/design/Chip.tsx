import React from "react";
import { TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { colors, spacing, borderRadius, fontFamily, press } from "../../theme/colors";
import { Text } from "react-native";

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Optional leading icon element. */
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Selectable filter chip. Selection uses a tinted fill + primary text, not a
 * heavy border — matching the filter patterns in modern finance apps.
 */
export default function Chip({ label, selected, onPress, icon, style }: ChipProps) {
  const { activeTheme } = useTheme();
  const theme = colors[activeTheme];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={press.button}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.secondary : theme.muted,
          borderColor: selected ? theme.primary : "transparent",
        },
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.label,
          { color: selected ? theme.primary : theme.mutedForeground },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    height: 36,
    borderRadius: borderRadius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
  },
});
