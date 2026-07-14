import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { spacing, press } from "../../theme/colors";
import Text from "./Text";

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional trailing action (e.g. "View all"). */
  action?: { label: string; onPress: () => void };
  /** Arbitrary trailing node (wins over `action`). */
  right?: React.ReactNode;
}

/**
 * Consistent section title block: a heading, optional caption, and an optional
 * right-aligned action — so every list/section on every screen reads the same.
 */
export default function SectionHeader({
  title,
  subtitle,
  action,
  right,
}: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.textCol}>
        <Text variant="heading">{title}</Text>
        {subtitle ? (
          <Text variant="label" tone="muted" style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ??
        (action ? (
          <TouchableOpacity
            onPress={action.onPress}
            activeOpacity={press.row}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <Text variant="label" tone="primary">
              {action.label}
            </Text>
          </TouchableOpacity>
        ) : null)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  textCol: { flex: 1, gap: 2 },
  subtitle: { marginTop: 2 },
});
