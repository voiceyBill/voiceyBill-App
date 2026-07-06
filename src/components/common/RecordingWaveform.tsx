import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

type Props = {
  color: string;
  barCount?: number;
  height?: number;
};

// Live animated waveform (WhatsApp-style) shown while recording.
const RecordingWaveform: React.FC<Props> = ({
  color,
  barCount = 34,
  height = 44,
}) => {
  const bars = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0.22)),
  ).current;

  useEffect(() => {
    const anims = bars.map((bar, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(bar, {
            toValue: 0.3 + Math.random() * 0.7,
            duration: 260 + Math.random() * 240,
            delay: i * 16,
            useNativeDriver: true,
          }),
          Animated.timing(bar, {
            toValue: 0.2 + Math.random() * 0.25,
            duration: 260 + Math.random() * 240,
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [bars]);

  return (
    <View style={styles.row}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            { backgroundColor: color, height, transform: [{ scaleY: bar }] },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
});

export default RecordingWaveform;
