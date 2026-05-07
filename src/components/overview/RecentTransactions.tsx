import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme/colors';
import { useGetAllTransactionsQuery } from '../../features/transaction/transactionAPI';
import { formatCurrency } from '../../lib/formatCurrency';
import { format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';

export default function RecentTransactions() {
  const { activeTheme } = useTheme();
  const theme = colors[activeTheme];
  const navigation = useNavigation();

  const { data, isLoading } = useGetAllTransactionsQuery({
    pageNumber: 1,
    pageSize: 10,
  });
  const transactions = data?.transations || [];

  const formatPaymentMethod = (method: string) =>
    method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const renderTransactionCard = ({ item }: { item: any }) => {
    const isIncome = item.type === 'INCOME';
    const IconComponent = isIncome ? ArrowUpRight : ArrowDownRight;
    const accentColor = isIncome ? theme.incomeText : theme.expenseText;
    const iconBg = isIncome ? theme.incomeBg : theme.expenseBg;

    const metaParts = [item.category, format(new Date(item.createdAt), 'MMM d, yyyy')].filter(Boolean);
    if (item.paymentMethod) metaParts.push(formatPaymentMethod(item.paymentMethod));

    return (
      <View
        style={[
          styles.transactionCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        {/* Left accent bar */}
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

        {/* Card body */}
        <View style={styles.cardBody}>
          {/* Icon */}
          <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
            <IconComponent size={18} color={accentColor} strokeWidth={2.5} />
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            <Text style={[styles.transactionTitle, { color: theme.foreground }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.metaText, { color: theme.mutedForeground }]} numberOfLines={1}>
              {metaParts.join(' · ')}
            </Text>
          </View>

          {/* Amount + badge */}
          <View style={styles.cardRight}>
            <Text style={[styles.amount, { color: accentColor }]}>
              {formatCurrency(item.amount, { showSign: true, isExpense: !isIncome })}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: iconBg }]}>
              <Text style={[styles.typeBadgeText, { color: accentColor }]}>
                {isIncome ? 'Income' : 'Expense'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.title, { color: theme.foreground }]}>Recent Transactions</Text>
          <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
            Your latest financial activity
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => (navigation as any).navigate('Transactions')}
          style={styles.viewAllBtn}
          activeOpacity={0.6}
        >
          <Text style={[styles.viewAll, { color: theme.mutedForeground }]}>View all</Text>
          <ChevronRight size={14} color={theme.mutedForeground} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item._id}
        renderItem={renderTransactionCard}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: theme.border }]} />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.mutedForeground }]}>
                No recent transactions
              </Text>
            </View>
          ) : null
        }
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: fontSize.xs,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAll: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  listContent: {
    // no extra padding — cards are flush, separated by hairline
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.lg + 4 + 40 + spacing.md, // align with text column
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  accentBar: {
    width: 3,
    borderRadius: 0,
  },
  cardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardInfo: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  transactionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    lineHeight: 18,
  },
  metaText: {
    fontSize: 11,
    lineHeight: 16,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
    marginLeft: spacing.xs,
  },
  amount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
  },
  emptyState: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.sm,
  },
});
