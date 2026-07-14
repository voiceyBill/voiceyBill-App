import React from "react";
import { View, StyleSheet } from "react-native";
import { spacing } from "../../theme/colors";
import Card from "./Card";
import Text from "./Text";
import Amount from "./Amount";
import ProgressBar from "./ProgressBar";

export interface StatCardProps {
  label: string;
  value: number;
  currency?: string;
  tone?: "neutral" | "income" | "expense";
  /** Optional secondary caption under the value. */
  caption?: string;
  /** Optional 0–100 progress track (e.g. budget usage). */
  progress?: number;
  progressTone?: "primary" | "success" | "warning" | "danger";
}

/**
 * Compact metric tile: uppercase label, tabular amount, optional caption/track.
 * Built entirely from design primitives so every stat reads the same.
 */
export default function StatCard({
  label,
  value,
  currency,
  tone = "neutral",
  caption,
  progress,
  progressTone = "primary",
}: StatCardProps) {
  return (
    <Card padding="md" style={styles.card}>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <View style={styles.valueRow}>
        <Amount value={value} currency={currency} size="lg" tone={tone} />
      </View>
      {caption ? (
        <Text variant="label" tone="muted">
          {caption}
        </Text>
      ) : null}
      {progress !== undefined ? (
        <ProgressBar progress={progress} tone={progressTone} style={styles.bar} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs },
  valueRow: { marginTop: 2 },
  bar: { marginTop: spacing.sm },
});
