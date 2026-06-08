import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { TrendingUp, TrendingDown } from "lucide-react-native";
import { colors, spacing, fontWeight } from "../../theme/colors";
import { formatCurrency } from "../../lib/formatCurrency";
import { useTheme } from "../../context/ThemeContext";

type CardType = "balance" | "income" | "expenses" | "savings";

type CardStatus = {
  label: string;
  color: string;
  icon: "up" | "down";
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
  currency?: string;
};

const getCardStatus = (
  value: number,
  cardType: CardType,
  expenseRatio?: number,
): CardStatus => {
  if (cardType === "savings") {
    if (value === 0) {
      return {
        label: "No Savings Record",
        color: colors.light.mutedForeground,
        icon: "down",
      };
    }

    if (value < 10) {
      return {
        label: "Low Savings",
        color: colors.light.destructive,
        icon: "down",
        description: `Only ${value.toFixed(1)}% saved`,
      };
    }

    if (value < 20) {
      return {
        label: "Moderate",
        color: colors.light.mutedForeground,
        icon: "down",
        description: `${expenseRatio?.toFixed(0)}% spent`,
      };
    }

    if (expenseRatio && expenseRatio > 75) {
      return {
        label: "High Spend",
        color: colors.light.destructive,
        icon: "down",
        description: `${expenseRatio.toFixed(0)}% spent`,
      };
    }

    return {
      label: "Good Savings",
      color: colors.light.brandGreen,
      icon: "up",
    };
  }

  if (value === 0) {
    const typeLabel =
      cardType === "income"
        ? "Income"
        : cardType === "expenses"
          ? "Expenses"
          : "Balance";

    return {
      label: `No ${typeLabel}`,
      color: colors.light.mutedForeground,
      icon: "down",
    };
  }

  if (cardType === "balance" && value < 0) {
    return {
      label: "Overdrawn",
      color: colors.light.destructive,
      icon: "down",
      description: "Balance is negative",
    };
  }

  return {
    label: "",
    color: colors.light.mutedForeground,
    icon: "down",
  };
};

export default function StatsCard({
  title,
  value,
  cardType,
  expenseRatio,
  dateRangeLabel = "for Last 30 Days",
  currency = "USD",
}: Props) {
  const { activeTheme } = useTheme();
  const theme = colors[activeTheme];

  const status = getCardStatus(value, cardType, expenseRatio);

  const valueColor =
    cardType === "balance" && value < 0 ? theme.destructive : theme.foreground;

  const displayValue =
    cardType === "savings"
      ? `${value.toFixed(1)}%`
      : formatCurrency(value, {
          showSign: cardType === "balance" && value < 0,
          isExpense: cardType === "expenses",
          currency,
        });

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
    >
      <Text style={[styles.title, { color: theme.mutedForeground }]}>
        {title}
      </Text>

      <Text style={[styles.value, { color: valueColor }]}>{displayValue}</Text>

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          {status.icon === "up" ? (
            <TrendingUp size={13} color={status.color} strokeWidth={2.5} />
          ) : (
            <TrendingDown size={13} color={status.color} strokeWidth={2.5} />
          )}

          <Text style={[styles.statusText, { color: status.color }]}>
            {status.label}
          </Text>

          {status.description ? (
            <Text style={[styles.descText, { color: theme.mutedForeground }]}>
              • {status.description}
            </Text>
          ) : (
            <Text style={[styles.descText, { color: theme.mutedForeground }]}>
              • {dateRangeLabel}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },

  title: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm - 2,
  },

  value: {
    fontSize: 28,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },

  footer: {
    marginTop: spacing.xs,
  },

  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },

  descText: {
    fontSize: 11.5,
    fontWeight: "500",
  },
});
