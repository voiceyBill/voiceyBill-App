import React from "react";
import { View, StyleSheet } from "react-native";
import { spacing } from "../../theme/colors";
import Text from "./Text";
import Button from "../common/Button";

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * Centered error + retry. Direct and calm — states what happened and offers the
 * one useful action, never a fake value.
 */
export default function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
}: ErrorStateProps) {
  return (
    <View style={styles.wrap}>
      <Text variant="heading" style={styles.title}>
        {title}
      </Text>
      <Text variant="body" tone="muted" style={styles.message}>
        {message}
      </Text>
      {onRetry ? (
        <Button
          label={retryLabel}
          onPress={onRetry}
          variant="outline"
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
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  title: { textAlign: "center" },
  message: { textAlign: "center", marginTop: 2 },
  action: { marginTop: spacing.md },
});
