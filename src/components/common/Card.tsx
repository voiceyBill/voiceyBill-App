import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors, spacing, borderRadius, shadows } from '../../theme/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'stats' | 'glass';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'default' }) => {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const styles = createStyles(themeColors, variant);

  return <View style={[styles.card, style]}>{children}</View>;
};

interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, style }) => {
  return <View style={[styles.cardHeader, style]}>{children}</View>;
};

interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const CardContent: React.FC<CardContentProps> = ({ children, style }) => {
  return <View style={[styles.cardContent, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  cardHeader: {
    paddingBottom: spacing.md,
  },
  cardContent: {
    paddingTop: spacing.sm,
  },
});

const createStyles = (theme: typeof colors.light, variant: 'default' | 'stats' | 'glass') =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: variant === 'glass' || variant === 'stats' ? 0 : 1,
      borderColor: theme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.05,
      shadowRadius: 24,
      elevation: 4,
    },
  });
