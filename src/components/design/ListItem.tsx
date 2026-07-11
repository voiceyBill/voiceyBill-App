import React from "react";
import { View, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { spacing, press } from "../../theme/colors";
import Text from "./Text";

export interface ListItemProps {
  title: string;
  subtitle?: string;
  /** Leading node — typically an IconTile. */
  leading?: React.ReactNode;
  /** Trailing node — typically an Amount, Badge, or chevron. */
  trailing?: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  selected?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Borderless list row: leading tile · title/subtitle · trailing. One row
 * language for transactions, categories, settings — hierarchy from type and
 * spacing, not borders.
 */
export default function ListItem({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  onLongPress,
  selected,
  accessibilityLabel,
  accessibilityHint,
  style,
}: ListItemProps) {
  const content = (
    <View style={styles.row}>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.textCol}>
        <Text variant="bodyMedium" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="label" tone="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );

  if (onPress || onLongPress) {
    return (
      <TouchableOpacity
        activeOpacity={press.row}
        onPress={onPress}
        onLongPress={onLongPress}
        style={style}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ selected }}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={style}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  leading: { flexShrink: 0 },
  textCol: { flex: 1, gap: 2, minWidth: 0 },
  trailing: { flexShrink: 0, alignItems: "flex-end" },
});
