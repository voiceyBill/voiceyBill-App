import React from "react";
import { View, StyleSheet } from "react-native";
import { spacing } from "../../theme/colors";
import Text from "./Text";
import IconTile from "./IconTile";
import Button from "../common/Button";

export interface EmptyStateProps {
  /** Icon element rendered inside a muted tile. */
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
}

/**
 * Calm, centered empty state: muted icon tile, title, optional description, and
 * an optional call to action. One arrangement for every "nothing here yet".
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <IconTile size="lg" background="transparent">
        {icon}
      </IconTile>
      <Text variant="heading" style={styles.title}>
        {title}
      </Text>
      {description ? (
        <Text variant="body" tone="muted" style={styles.description}>
          {description}
        </Text>
      ) : null}
      {action ? (
        <Button
          label={action.label}
          onPress={action.onPress}
          fullWidth={false}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  title: { marginTop: spacing.sm, textAlign: "center" },
  description: { textAlign: "center", marginTop: 2 },
  action: { marginTop: spacing.lg },
});
