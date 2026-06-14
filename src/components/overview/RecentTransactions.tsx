import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { colors, spacing, borderRadius, fontSize, fontWeight, fontFamily } from '../../theme/colors';
import { useGetAllTransactionsQuery } from '../../features/transaction/transactionAPI';
import { useTypedSelector } from '../../store/hooks';
import { formatCurrency } from '../../lib/formatCurrency';
import { getCategoryVisual } from '../../lib/categoryVisuals';
import { format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';

export default function RecentTransactions() {
  const { activeTheme } = useTheme();
  const theme = colors[activeTheme];
  const navigation = useNavigation();

  const user = useTypedSelector((state) => state.auth.user);
  const baseCurrency = user?.baseCurrency || "USD";

  const { data, isLoading } = useGetAllTransactionsQuery({
    pageNumber: 1,
    pageSize: 10,
  });
  const transactions = data?.transactions || [];

  const formatPaymentMethod = (method: string) =>
    method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const renderTransactionCard = ({ item }: { item: any }) => {
    const isIncome = item.type === 'INCOME';
    const visual = getCategoryVisual(item.category);

    const metaParts = [item.category, format(new Date(item.createdAt), 'MMM d')].filter(Boolean);
    if (item.paymentMethod) metaParts.push(formatPaymentMethod(item.paymentMethod));

    return (
      <TouchableOpacity
        style={[
          styles.transactionCard,
          {
            backgroundColor: theme.card,
          },
        ]}
        activeOpacity={0.7}
        onPress={() => (navigation as any).navigate('Transactions', { transactionId: item._id })}
      >
        {/* Card body */}
        <View style={styles.cardBody}>
          {/* Category Icon Badge */}
          <View style={[styles.iconCircle, { backgroundColor: visual.bgColor }]}>
            <Ionicons name={visual.icon} size={18} color={visual.color} />
          </View>

          {/* Transaction title and metadata */}
          <View style={styles.cardInfo}>
            <Text style={[styles.transactionTitle, { color: theme.foreground }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.metaText, { color: theme.mutedForeground }]} numberOfLines={1}>
              {metaParts.join(' · ')}
            </Text>
          </View>

          {/* Amount & Status Badge */}
          <View style={styles.cardRight}>
            <Text
              style={[
                styles.amount,
                { color: isIncome ? theme.incomeText : theme.foreground },
              ]}
              numberOfLines={1}
            >
              {isIncome ? '+' : '-'}{formatCurrency(item.amount, { currency: item.baseCurrencyAtTime || baseCurrency, showSign: false })}
            </Text>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: isIncome ? theme.incomeBg : theme.secondary },
              ]}
            >
              <Text
                style={[
                  styles.typeBadgeText,
                  { color: isIncome ? theme.incomeText : theme.mutedForeground },
                ]}
              >
                {isIncome ? 'Income' : 'Expense'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
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
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 4,
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
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    marginTop: 2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAll: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
  },
  listContent: {
    // flush layout
  },
  separator: {
    height: 1,
    marginLeft: spacing.md + 40 + spacing.md, // flush align with the title text
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  cardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
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
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  metaText: {
    fontFamily: fontFamily.regular,
    fontSize: 10.5,
    lineHeight: 16,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
    marginLeft: spacing.xs,
  },
  amount: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  typeBadgeText: {
    fontFamily: fontFamily.medium,
    fontSize: 9,
  },
  emptyState: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
  },
});


