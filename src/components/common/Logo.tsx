import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { spacing, fontSize, fontWeight } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../theme/colors';

const logoImage = require('../../assets/logo.png');

type LogoProps = { centered?: boolean; size?: 'md' | 'lg' };

export default function Logo({ centered = true, size = 'md' }: LogoProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const isLg = size === 'lg';
  const iconDim = isLg ? 44 : 28;
  const brandFs = isLg ? fontSize['2xl'] : fontSize.lg;

  return (
    <View style={[styles.row, centered && { justifyContent: 'center' }]}>
      <Image source={logoImage} style={{ width: iconDim, height: iconDim, borderRadius: iconDim * 0.22 }} resizeMode="contain" />
      <Text style={[styles.brand, { color: themeColors.foreground, fontSize: brandFs }]}>VoiceyBill</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brand: {
    fontWeight: fontWeight.semibold,
  },
});
