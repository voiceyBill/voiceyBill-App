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

    if (value < 10) {
      return {
        label: 'Low Savings',
        color: '#ff4d4d',
        icon: 'down',
        description: `Only ${value.toFixed(1)}% saved`,
      };
    }

    if (value < 20) {
      return {
        label: 'Moderate',
        color: 'rgba(255,255,255,0.7)',
        icon: 'down',
        description: `${expenseRatio?.toFixed(0)}% spent`,
      };
    }

    if (expenseRatio && expenseRatio > 75) {
      return {
        label: 'High Spend',
        color: '#ff4d4d',
        icon: 'down',
        description: `${expenseRatio.toFixed(0)}% spent`,
      };
    }

    if (expenseRatio && expenseRatio > 60) {
      return {
        label: 'High Spend',
        color: 'rgba(255,255,255,0.6)',
        icon: 'down',
        description: `${expenseRatio.toFixed(0)}% spent`,
      };
    }

    return {
      label: 'Good Savings',
      color: '#9fff59',
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

  if (cardType === 'balance' && value < 0) {
    return {
      label: 'Overdrawn',
      color: '#ff4d4d',
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
    return value <= 0 ? 'positive' : 'negative';
  }
  return value >= 0 ? 'positive' : 'negative';
};

const formatPercentage = (value: number, options?: { showSign?: boolean; isExpense?: boolean; decimalPlaces?: number }) => {
  const { showSign = false, isExpense = false, decimalPlaces = 1 } = options || {};
  const absValue = Math.abs(value);
  const formatted = absValue.toFixed(decimalPlaces);
  
  if (showSign) {
    if (isExpense) {
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
  
  const status = getCardStatus(value, cardType, expenseRatio);
  const showTrend =
    percentageChange !== undefined &&
    percentageChange !== null &&
    cardType !== 'savings';

  const trendDirection =
    showTrend && percentageChange !== 0
      ? getTrendDirection(percentageChange, cardType)
      : null;

  const valueColor = cardType === 'balance' && value < 0 ? '#ff4d4d' : '#FFFFFF';
  
  const isPercentageValue = cardType === 'savings';
  const displayValue = isPercentageValue
    ? `${value.toFixed(1)}%`
    : formatCurrency(value, {
        showSign: cardType === 'balance' && value < 0,
        isExpense: cardType === 'expenses',
      });

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      
      <Text style={[styles.value, { color: valueColor }]}>{displayValue}</Text>

      <View style={styles.footer}>
        {cardType === 'savings' ? (
          <View style={styles.footerContent}>
            {status.icon === 'up' ? (
              <TrendingUp size={13} color={status.color} strokeWidth={2.5} />
            ) : (
              <TrendingDown size={13} color={status.color} strokeWidth={2.5} />
            )}
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
            {status.description && (
              <Text style={styles.descriptionText}>
                • {status.description}
              </Text>
            )}
          </View>
        ) : value === 0 || status.label ? (
          <View style={styles.footerContent}>
            {status.icon === 'up' ? (
              <TrendingUp size={13} color={status.color} strokeWidth={2.5} />
            ) : (
              <TrendingDown size={13} color={status.color} strokeWidth={2.5} />
            )}
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
            {!status.description && (
              <Text style={styles.descriptionText}>
                • {dateRangeLabel}
              </Text>
            )}
            {status.description && (
              <Text style={styles.descriptionText}>
                • {status.description}
              </Text>
            )}
          </View>
        ) : showTrend ? (
          <View style={styles.footerContent}>
            {percentageChange !== 0 && (
              <View style={[
                styles.trendBadge,
                {
                  backgroundColor: trendDirection === 'positive' ? 'rgba(159, 255, 89, 0.08)' : 'rgba(255, 77, 77, 0.08)',
                  borderColor: trendDirection === 'positive' ? 'rgba(159, 255, 89, 0.16)' : 'rgba(255, 77, 77, 0.16)'
                }
              ]}>
                {trendDirection === 'positive' ? (
                  <TrendingUp size={11} color="#9fff59" strokeWidth={2.5} />
                ) : (
                  <TrendingDown size={11} color="#ff4d4d" strokeWidth={2.5} />
                )}
                <Text style={[styles.trendText, { color: trendDirection === 'positive' ? '#9fff59' : '#ff4d4d' }]}>
                  {formatPercentage(percentageChange, {
                    showSign: true,
                    isExpense: cardType === 'expenses',
                    decimalPlaces: 1,
                  })}
                </Text>
              </View>
            )}
            {percentageChange === 0 && (
              <View style={[styles.trendBadge, { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }]}>
                <TrendingDown size={11} color="rgba(255,255,255,0.4)" strokeWidth={2.5} />
                <Text style={[styles.trendText, { color: 'rgba(255,255,255,0.4)' }]}>
                  0.0%
                </Text>
              </View>
            )}
            <Text style={styles.descriptionText}>
              {dateRangeLabel}
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
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  title: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm - 2,
    color: 'rgba(255, 255, 255, 0.45)',
  },
  value: {
    fontSize: 28,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
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
    fontSize: 12,
    fontWeight: fontWeight.semibold,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  trendText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
  descriptionText: {
    fontSize: 11.5,
    fontWeight: fontWeight.medium,
    color: 'rgba(255, 255, 255, 0.4)',
  },
});

