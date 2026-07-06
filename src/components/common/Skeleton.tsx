import React, { useEffect } from "react";
import { DimensionValue, StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { colors } from "../../theme/colors";

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: ViewStyle;
}

/**
 * A single shimmering placeholder block. Prefer this over a spinner for
 * content that is loading for the first time — it hints at the shape of the
 * incoming content, which reads as far faster than a spinning ring.
 */
export default function Skeleton({
  width = "100%",
  height = 16,
  radius = 8,
  style,
}: SkeletonProps) {
  const { activeTheme } = useTheme();
  const theme = colors[activeTheme];
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 850, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(opacity);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: theme.muted },
        animatedStyle,
        style,
      ]}
    />
  );
}

/** Convenience wrapper for a row of stacked skeleton lines. */
export function SkeletonGroup({ style, children }: { style?: ViewStyle; children: React.ReactNode }) {
  return <View style={[styles.group, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  group: { gap: 8 },
});
