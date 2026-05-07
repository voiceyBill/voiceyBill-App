import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme/colors';
import { formatCurrency } from '../../lib/formatCurrency';
import { useTheme } from '../../context/ThemeContext';

type CardType = 'balance' | 'income' | 'expenses' | 'savings';
type CardStatus = {
  label: string;
  color: string;
  icon: 'up' | 'down';
  description?: string;
};

type Props = {
  title: string;
  value: number;
  cardType: CardType;
  percentageChange?: number;
  expenseRatio?: number;
  dateRangeLabel?: string;
  isLoading?: boolean;
};

const getCardStatus = (
  value: number,
  cardType: CardType,
  expenseRatio?: number
): CardStatus => {
  if (cardType === 'savings') {
    if (value === 0) {
      return {
        label: 'No Savings Record',
        color: 'rgba(255,255,255,0.4)',
        icon: 'down',
      };
    }

    // Check savings percentage first
    if (value < 10) {
      return {
        label: 'Low Savings',
        color: 'rgba(255,255,255,0.5)',
        icon: 'down',
        description: `Only ${value.toFixed(1)}% saved`,
      };
    }

    if (value < 20) {
      return {
        label: 'Moderate',
        color: 'rgba(255,255,255,0.6)',
        icon: 'down',
        description: `${expenseRatio?.toFixed(0)}% spent`,
      };
    }

    // High savings → check if expense ratio is unusually high for warning
    if (expenseRatio && expenseRatio > 75) {
      return {
        label: 'High Spend',
        color: 'rgba(255,255,255,0.5)',
        icon: 'down',
        description: `${expenseRatio.toFixed(0)}% spent`,
      };
    }

    if (expenseRatio && expenseRatio > 60) {
      return {
        label: 'Warning: High Spend',
        color: 'rgba(255,255,255,0.6)',
        icon: 'down',
        description: `${expenseRatio.toFixed(0)}% spent`,
      };
    }

    return {
      label: 'Good Savings',
      color: 'rgba(255,255,255,0.85)',
      icon: 'up',
    };
  }

  if (value === 0) {
    const typeLabel =
      cardType === 'income'
        ? 'Income'
        : cardType === 'expenses'
        ? 'Expenses'
        : 'Balance';

    return {
      label: `No ${typeLabel}`,
      color: 'rgba(255,255,255,0.4)',
      icon: 'down',
      description: '',
    };
  }

  // For balance card when negative
  if (cardType === 'balance' && value < 0) {
    return {
      label: 'Overdrawn',
      color: 'rgba(255,255,255,0.5)',
      icon: 'down',
      description: 'Balance is negative',
    };
  }

  return {
    label: '',
    color: '',
    icon: 'down',
  };
};

const getTrendDirection = (value: number, cardType: CardType): 'positive' | 'negative' => {
  if (cardType === 'expenses') {
    // For expenses, lower is better
    return value <= 0 ? 'positive' : 'negative';
  }
  // For income and balance, higher is better
  return value >= 0 ? 'positive' : 'negative';
};

const formatPercentage = (value: number, options?: { showSign?: boolean; isExpense?: boolean; decimalPlaces?: number }) => {
  const { showSign = false, isExpense = false, decimalPlaces = 1 } = options || {};
  const absValue = Math.abs(value);
  const formatted = absValue.toFixed(decimalPlaces);
  
  if (showSign) {
    if (isExpense) {
      // For expenses, negative change is good (green), positive is bad (red)
      return value <= 0 ? `${formatted}%` : `+${formatted}%`;
    }
    return value >= 0 ? `+${formatted}%` : `-${formatted}%`;
  }
  
  return `${formatted}%`;
};

export default function StatsCard({ 
  title, 
  value, 
  cardType,
  percentageChange,
  expenseRatio,
  dateRangeLabel = 'for Last 30 Days',
  isLoading = false,
}: Props) {
  const { activeTheme } = useTheme();
  const theme = colors[activeTheme];
  
  const status = getCardStatus(value, cardType, expenseRatio);
  const showTrend =
    percentageChange !== undefined &&
    percentageChange !== null &&
    cardType !== 'savings';

  const trendDirection =
    showTrend && percentageChange !== 0
      ? getTrendDirection(percentageChange, cardType)
      : null;

  // Determine value color
  const valueColor = cardType === 'balance' && value < 0 ? 'rgba(255,255,255,0.5)' : '#FFFFFF';
  
  // Format display value
  const isPercentageValue = cardType === 'savings';
  const displayValue = isPercentageValue
    ? `${value.toFixed(1)}%`
    : formatCurrency(value, {
        showSign: cardType === 'balance' && value < 0,
        isExpense: cardType === 'expenses',
      });

  return (
    <View style={[styles.card, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'transparent' }]}>
      <Text style={[styles.title, { color: 'rgba(255,255,255,0.6)' }]}>{title}</Text>
      
      <Text style={[styles.value, { color: valueColor }]}>{displayValue}</Text>

      <View style={styles.footer}>
        {cardType === 'savings' ? (
          <View style={styles.footerContent}>
            {status.icon === 'up' ? (
              <TrendingUp size={14} color={status.color} strokeWidth={2} />
            ) : (
              <TrendingDown size={14} color={status.color} strokeWidth={2} />
            )}
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
            {status.description && (
              <Text style={[styles.descriptionText, { color: 'rgba(255,255,255,0.4)' }]}>
                • {status.description}
              </Text>
            )}
          </View>
        ) : value === 0 || status.label ? (
          <View style={styles.footerContent}>
            {status.icon === 'up' ? (
              <TrendingUp size={14} color={status.color} strokeWidth={2} />
            ) : (
              <TrendingDown size={14} color={status.color} strokeWidth={2} />
            )}
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
            {!status.description && (
              <Text style={[styles.descriptionText, { color: 'rgba(255,255,255,0.4)' }]}>
                • {dateRangeLabel}
              </Text>
            )}
            {status.description && (
              <Text style={[styles.descriptionText, { color: 'rgba(255,255,255,0.4)' }]}>
                • {status.description}
              </Text>
            )}
          </View>
        ) : showTrend ? (
          <View style={styles.footerContent}>
            {percentageChange !== 0 && (
              <>
                {trendDirection === 'positive' ? (
                  <TrendingUp size={12} color="rgba(255,255,255,0.85)" strokeWidth={2} />
                ) : (
                  <TrendingDown size={12} color="rgba(255,255,255,0.5)" strokeWidth={2} />
                )}
                <Text style={[styles.trendText, { color: trendDirection === 'positive' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.5)' }]}>
                  {formatPercentage(percentageChange, {
                    showSign: true,
                    isExpense: cardType === 'expenses',
                    decimalPlaces: 1,
                  })}
                </Text>
              </>
            )}
            {percentageChange === 0 && (
              <>
                <TrendingDown size={12} color="rgba(255,255,255,0.4)" strokeWidth={2} />
                <Text style={[styles.trendText, { color: 'rgba(255,255,255,0.4)' }]}>
                  0.0%
                </Text>
              </>
            )}
            <Text style={[styles.descriptionText, { color: 'rgba(255,255,255,0.4)' }]}>
              • {dateRangeLabel}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.md + 4,
  },
  value: {
    fontSize: 24,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
  },
  footer: {
    marginTop: spacing.xs,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
  },
  trendText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
  },
  descriptionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
  },
});
