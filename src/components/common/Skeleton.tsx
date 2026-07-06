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

/**
 * A single list-row placeholder: circular avatar + two text lines + a trailing
 * amount block. Matches the shape of a transaction / list card.
 */
export function RowSkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton width={40} height={40} radius={20} />
      <View style={styles.rowInfo}>
        <Skeleton width="55%" height={12} radius={6} />
        <Skeleton width="35%" height={10} radius={5} />
      </View>
      <Skeleton width={56} height={14} radius={6} />
    </View>
  );
}

/**
 * A list of row placeholders with hairline separators between them — a drop-in
 * loading state for any list of cards/rows.
 */
export function ListSkeleton({
  count = 6,
  separatorColor,
}: {
  count?: number;
  separatorColor?: string;
}) {
  const { activeTheme } = useTheme();
  const theme = colors[activeTheme];
  const sep = separatorColor ?? theme.border;
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i}>
          {i > 0 && <View style={[styles.separator, { backgroundColor: sep }]} />}
          <RowSkeleton />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  rowInfo: {
    flex: 1,
    gap: 6,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16 + 40 + 14,
  },
});
