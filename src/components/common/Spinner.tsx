import React, { useEffect } from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { colors, fontFamily } from "../../theme/colors";

interface SpinnerProps {
  /** Diameter in px. Default 24. */
  size?: number;
  /** Ring thickness. Defaults to a proportion of `size`. */
  thickness?: number;
  /** Arc colour. Defaults to the theme primary. */
  color?: string;
  /** Background track colour. Defaults to a subtle theme-aware tint. */
  trackColor?: string;
  style?: ViewStyle;
}

/**
 * Branded, theme-aware loading spinner: a subtle full track ring with a single
 * coloured arc that rotates smoothly on the UI thread (reanimated). Drop-in
 * replacement for the bare platform `ActivityIndicator` for a consistent,
 * professional look across the app.
 */
export default function Spinner({
  size = 24,
  thickness,
  color,
  trackColor,
  style,
}: SpinnerProps) {
  const { activeTheme } = useTheme();
  const theme = colors[activeTheme];

  const ringWidth = thickness ?? Math.max(2, Math.round(size / 9));
  const arcColor = color ?? theme.primary;
  const track =
    trackColor ??
    (activeTheme === "dark" ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.08)");

  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 800, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(rotation);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: ringWidth,
            borderColor: track,
            borderTopColor: arcColor,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

/**
 * Centered, full-area loading state with an optional label — for screen or
 * content-level loading.
 */
export function ScreenLoader({
  label,
  size = 40,
}: {
  label?: string;
  size?: number;
}) {
  const { activeTheme } = useTheme();
  const theme = colors[activeTheme];
  return (
    <View style={styles.screen}>
      <Spinner size={size} />
      {label ? (
        <Text style={[styles.label, { color: theme.mutedForeground }]}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 24,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
  },
});
