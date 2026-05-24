import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import {
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ShoppingBag,
  Utensils,
  Car,
  Zap,
  Film,
  Tag,
  Activity,
  Plane,
  Home,
  TrendingUp,
  Coins,
  HelpCircle,
  LucideIcon
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme/colors';
import { useGetAllTransactionsQuery } from '../../features/transaction/transactionAPI';
import { formatCurrency } from '../../lib/formatCurrency';
import { format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';

// Color mappings and icons for categories matching the Revolut / Stripe premium design
const categoryConfig: Record<string, { icon: LucideIcon; color: string; bgColor: string }> = {
  groceries: { icon: ShoppingBag, color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.08)' }, // Amber
  dining: { icon: Utensils, color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.08)' }, // Violet
  transportation: { icon: Car, color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.08)' }, // Blue
  utilities: { icon: Zap, color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.08)' }, // Emerald
  entertainment: { icon: Film, color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.08)' }, // Purple
  shopping: { icon: Tag, color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.08)' }, // Amber
  healthcare: { icon: Activity, color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.08)' }, // Rose
  travel: { icon: Plane, color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.08)' }, // Cyan
  housing: { icon: Home, color: '#64748b', bgColor: 'rgba(100, 116, 139, 0.08)' }, // Slate
  income: { icon: TrendingUp, color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.08)' }, // Emerald
  investments: { icon: Coins, color: '#14b8a6', bgColor: 'rgba(20, 184, 166, 0.08)' }, // Teal
};

const getCategoryConfig = (cat: string) => {
  const lower = cat?.toLowerCase() || 'other';
  if (lower.includes('food') || lower.includes('dining')) return categoryConfig.dining;
  if (lower.includes('groceries') || lower.includes('shopping') || lower.includes('retail')) return categoryConfig.shopping;
  if (lower.includes('transport') || lower.includes('car') || lower.includes('travel')) return categoryConfig.transportation;
  if (lower.includes('bill') || lower.includes('utilities') || lower.includes('rent')) return categoryConfig.utilities;
  if (lower.includes('health') || lower.includes('medical')) return categoryConfig.healthcare;
  if (lower.includes('income')) return categoryConfig.income;
  if (lower.includes('investment')) return categoryConfig.investments;
  
  return categoryConfig[lower] || { icon: HelpCircle, color: '#8e8e93', bgColor: 'rgba(142, 142, 147, 0.08)' };
};

export default function RecentTransactions() {
  const { activeTheme } = useTheme();
  const theme = colors[activeTheme];
  const navigation = useNavigation();

  const { data, isLoading } = useGetAllTransactionsQuery({
    pageNumber: 1,
    pageSize: 10,
  });
  const transactions = data?.transactions || [];

  const formatPaymentMethod = (method: string) =>
    method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const renderTransactionCard = ({ item }: { item: any }) => {
    const isIncome = item.type === 'INCOME';
    const config = getCategoryConfig(item.category);
    const CategoryIcon = config.icon;

    const metaParts = [item.category, format(new Date(item.createdAt), 'MMM d, yyyy')].filter(Boolean);
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
          {/* Category Icon Badge with glassmorphic pastel backing */}
          <View style={[styles.iconCircle, { backgroundColor: config.bgColor }]}>
            <CategoryIcon size={18} color={config.color} strokeWidth={2.2} />
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
            >
              {isIncome ? '+' : '-'}{formatCurrency(item.amount, { showSign: false })}
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
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 15,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAll: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  listContent: {
    // flush layout
  },
  separator: {
    height: StyleSheet.hairlineWidth,
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
    paddingVertical: spacing.sm + 2,
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
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
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


