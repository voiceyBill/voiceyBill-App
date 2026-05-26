import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";

import { useTheme } from "../context/ThemeContext";
import { colors } from "../theme/colors";

const { width, height } = Dimensions.get("window");

const LOGO_SIZE = 60;
const HOLD_MS = 1900;
const FADE_OUT_MS = 450;

const logoImage = require("../assets/logo.png");

function PulsingDot({ delay, dotStyle }: { delay: number; dotStyle: any }) {
  const opacity = useSharedValue(0.2);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: 360,
            easing: Easing.out(Easing.ease),
          }),
          withTiming(0.2, {
            duration: 360,
            easing: Easing.in(Easing.ease),
          }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const animatedDotStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[dotStyle, animatedDotStyle]} />;
}

interface Props {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: Props) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  const styles = createStyles(themeColors);

  const containerOpacity = useSharedValue(1);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const titleOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const dotsOpacity = useSharedValue(0);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const dotsStyle = useAnimatedStyle(() => ({
    opacity: dotsOpacity.value,
  }));

  useEffect(() => {
    // Staggered entrance — same feel as login screen appearing
    logoOpacity.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });

    logoScale.value = withTiming(1, {
      duration: 480,
      easing: Easing.out(Easing.back(1.15)),
    });

    titleOpacity.value = withDelay(240, withTiming(1, { duration: 340 }));

    taglineOpacity.value = withDelay(400, withTiming(1, { duration: 340 }));

    dotsOpacity.value = withDelay(580, withTiming(1, { duration: 260 }));

    // Fade out
    containerOpacity.value = withDelay(
      HOLD_MS,
      withTiming(
        0,
        {
          duration: FADE_OUT_MS,
          easing: Easing.in(Easing.ease),
        },
        () => {
          runOnJS(onComplete)();
        },
      ),
    );
  }, []);

  return (
    <Animated.View
      style={[styles.container, containerStyle]}
      pointerEvents="none"
    >
      {/* Logo row */}
      <Animated.View style={[styles.logoRow, logoStyle]}>
        <Image source={logoImage} style={styles.logoImage} resizeMode="cover" />

        <Animated.Text style={[styles.brandName, titleStyle]}>
          VoiceyBill
        </Animated.Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, taglineStyle]}>
        Voice-powered finance
      </Animated.Text>

      {/* Pulsing dots */}
      <Animated.View style={[styles.dotsRow, dotsStyle]}>
        <PulsingDot delay={0} dotStyle={styles.dot} />
        <PulsingDot delay={150} dotStyle={styles.dot} />
        <PulsingDot delay={300} dotStyle={styles.dot} />
      </Animated.View>
    </Animated.View>
  );
}

const createStyles = (theme: typeof colors.light) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      top: 0,
      left: 0,
      width,
      height,
      backgroundColor: theme.background,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    },

    logoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 10,
    },

    logoImage: {
      width: LOGO_SIZE,
      height: LOGO_SIZE,
      borderRadius: LOGO_SIZE * 0.22,
    },

    brandName: {
      fontSize: 32,
      fontWeight: "700",
      color: theme.foreground,
      letterSpacing: -0.3,
    },

    tagline: {
      fontSize: 14,
      color: theme.mutedForeground,
      letterSpacing: 0.2,
    },

    dotsRow: {
      flexDirection: "row",
      gap: 8,
      position: "absolute",
      bottom: height * 0.12,
    },

    dot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: theme.brandGreen,
    },
  });
