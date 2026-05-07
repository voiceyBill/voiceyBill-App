import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Light theme — matches SignInScreen / colors.light
const BG             = '#ffffff';
const TEXT_PRIMARY   = '#171717';
const TEXT_MUTED     = '#717171';
const DOT_COLOR      = '#166114'; // brandGreen light theme

const LOGO_SIZE  = 60;
const HOLD_MS    = 1900;
const FADE_OUT_MS = 450;

const logoImage = require('../assets/logo.png');

function PulsingDot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.2);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1,   { duration: 360, easing: Easing.out(Easing.ease) }),
          withTiming(0.2, { duration: 360, easing: Easing.in(Easing.ease)  })
        ),
        -1,
        false
      )
    );
  }, []);

  return (
    <Animated.View style={[styles.dot, useAnimatedStyle(() => ({ opacity: opacity.value }))]} />
  );
}

interface Props {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: Props) {
  const containerOpacity = useSharedValue(1);
  const logoOpacity      = useSharedValue(0);
  const logoScale        = useSharedValue(0.8);
  const titleOpacity     = useSharedValue(0);
  const taglineOpacity   = useSharedValue(0);
  const dotsOpacity      = useSharedValue(0);

  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const titleStyle   = useAnimatedStyle(() => ({ opacity: titleOpacity.value }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));
  const dotsStyle    = useAnimatedStyle(() => ({ opacity: dotsOpacity.value }));

  useEffect(() => {
    // Staggered entrance — same feel as login screen appearing
    logoOpacity.value  = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    logoScale.value    = withTiming(1, { duration: 480, easing: Easing.out(Easing.back(1.15)) });
    titleOpacity.value = withDelay(240, withTiming(1, { duration: 340 }));
    taglineOpacity.value = withDelay(400, withTiming(1, { duration: 340 }));
    dotsOpacity.value  = withDelay(580, withTiming(1, { duration: 260 }));

    // Fade out
    containerOpacity.value = withDelay(
      HOLD_MS,
      withTiming(0, { duration: FADE_OUT_MS, easing: Easing.in(Easing.ease) }, () => {
        runOnJS(onComplete)();
      })
    );
  }, []);

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
      {/* Logo row — identical to <Logo size="lg" /> */}
      <Animated.View style={[styles.logoRow, logoStyle]}>
        <Image
          source={logoImage}
          style={styles.logoImage}
          resizeMode="cover"
        />
        <Text style={styles.brandName}>VoiceyBill</Text>
      </Animated.View>

      {/* Tagline — same style as login subtitle */}
      <Animated.Text style={[styles.tagline, taglineStyle]}>
        Voice-powered finance
      </Animated.Text>

      {/* Pulsing dots at bottom */}
      <Animated.View style={[styles.dotsRow, dotsStyle]}>
        <PulsingDot delay={0} />
        <PulsingDot delay={150} />
        <PulsingDot delay={300} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  // Logo component size="lg": 44px image + fontSize['2xl'] text
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  logoImage: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE * 0.22, // matches Logo.tsx formula exactly
  },
  brandName: {
    fontSize: 32,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: -0.3,
  },
  tagline: {
    fontSize: 14,
    color: TEXT_MUTED,
    letterSpacing: 0.2,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    position: 'absolute',
    bottom: height * 0.12,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: DOT_COLOR,
  },
});
