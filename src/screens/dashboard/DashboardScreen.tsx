import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFloatingTabBarSpace } from "../../navigation/tabBarLayout";
import Skeleton from "../../components/common/Skeleton";
import { Card, Amount, IconTile } from "../../components/design";
import { useGetDashboardAnalyticsQuery } from "../../features/analytics/analyticsAPI";
import { useTheme } from "../../context/ThemeContext";
import { colors, spacing, fontFamily, press } from "../../theme/colors";
import { useNotification } from "../../context/NotificationContext";
import DateRangePicker, {
  DateRangePreset,
} from "../../components/overview/DateRangePicker";
import TransactionOverviewChart from "../../components/overview/TransactionOverviewChart";
import ExpenseBreakdownPie from "../../components/overview/ExpenseBreakdownPie";
import RecentTransactions from "../../components/overview/RecentTransactions";
import TransactionFormSheet from "../../components/transaction/TransactionFormSheet";
import { formatCurrency } from "../../lib/formatCurrency";
import { useTypedSelector } from "../../store/hooks";

export default function DashboardScreen({ navigation }: any) {
  const { activeTheme } = useTheme();
  const theme = colors[activeTheme];
  const insets = useSafeAreaInsets();
  const tabBarSpace = useFloatingTabBarSpace();
  const { notifications } = useNotification();
  const unreadCount = notifications.length;
  const [preset, setPreset] = useState<DateRangePreset>("30days");

  // Transaction form states
  const [showForm, setShowForm] = useState(false);
  const [initialType, setInitialType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [initialMode, setInitialMode] = useState<"VOICE" | "SCAN" | "MANUAL">("VOICE");

  const user = useTypedSelector((s) => s.auth.user);
  const baseCurrency = user?.baseCurrency || "USD";

  // PERF: one combined request for summary + chart + pie instead of three
  // separate serverless invocations.
  const dashboardQuery = useGetDashboardAnalyticsQuery({ preset });

  // Only the very first load shows skeletons; after that we keep the previous
  // numbers on screen while new ones fetch, so the dashboard never goes blank.
  const summaryLoading = dashboardQuery.isLoading;

  // Pull-to-refresh should spin only on an actual user pull — never on the
  // initial load (which is what made the balance appear to have a spinner).
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await dashboardQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const summary = dashboardQuery.data?.data?.summary;
  const chart = dashboardQuery.data?.data?.chart;
  const pie = dashboardQuery.data?.data?.expenseBreakdown;
  // Never render fake financial values: when loading fails and there's no
  // cached data, show the error/retry state instead of a misleading $0.00.
  const summaryError = dashboardQuery.isError && !summary;

  // Calculate left for saving (available balance or income - expenses depending on context)
  const income = summary?.totalIncome || 0;
  const expenses = summary?.totalExpenses || 0;
  const leftForSaving = summary?.availableBalance || (income - expenses);

  // PERF: rebuild the stylesheet only when the theme or insets change, not on
  // every query/state update re-render.
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  const handleAddTransaction = (type: "INCOME" | "EXPENSE", mode: "VOICE" | "SCAN" | "MANUAL" = "VOICE") => {
    setInitialType(type);
    setInitialMode(mode);
    setShowForm(true);
  };

  // Summary list row — preserves the loading / error / value branches.
  const renderSummaryRow = (
    label: string,
    value: number,
    dotColor: string,
    onPress?: () => void,
    isLast?: boolean,
  ) => {
    const body = (
      <>
        <View style={styles.summaryRowLeft}>
          <View style={[styles.summaryDot, { backgroundColor: dotColor }]} />
          <Text style={styles.summaryLabel}>{label}</Text>
        </View>
        <View style={styles.summaryRowRight}>
          {summaryLoading ? (
            <Skeleton width={70} height={14} radius={6} />
          ) : summaryError ? (
            <Text style={styles.summaryAmount}>—</Text>
          ) : (
            <Amount value={value} currency={baseCurrency} size="md" />
          )}
          <Ionicons name="chevron-forward" size={16} color={theme.mutedForeground} />
        </View>
      </>
    );
    const rowStyle = [styles.summaryRow, isLast && styles.summaryRowLast];
    return onPress ? (
      <TouchableOpacity style={rowStyle} activeOpacity={press.row} onPress={onPress}>
        {body}
      </TouchableOpacity>
    ) : (
      <View style={rowStyle}>{body}</View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: tabBarSpace }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* Hero Balance */}
        <View style={styles.heroSection}>
          <Text style={styles.heroLabel}>Available Balance</Text>
          {summaryLoading ? (
            <View style={styles.heroSkeletonRow}>
              <Skeleton width={180} height={44} radius={12} />
            </View>
          ) : summaryError ? (
            <View style={styles.heroSkeletonRow}>
              <Text style={styles.stateText}>Couldn't load your balance.</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => dashboardQuery.refetch()}
                activeOpacity={0.8}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.heroAmountRow}>
              <Text style={styles.heroCurrency}>{baseCurrency}</Text>
              <Text style={styles.heroAmount} numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(summary?.availableBalance || 0, {
                  currency: baseCurrency,
                  showSign: false,
                }).replace(/[^0-9.,]/g, "").trim()}
              </Text>
            </View>
          )}
          <View style={styles.heroPickerRow}>
            <DateRangePicker
              value={preset}
              onChange={setPreset}
              isDarkHeader={false}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            activeOpacity={press.button}
            onPress={() => handleAddTransaction("INCOME")}
          >
            <Ionicons name="arrow-down" size={18} color={theme.primaryForeground} />
            <Text style={[styles.actionText, { color: theme.primaryForeground }]}>Income</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.secondary }]}
            activeOpacity={press.button}
            onPress={() => handleAddTransaction("EXPENSE")}
          >
            <Ionicons name="arrow-up" size={18} color={theme.secondaryForeground} />
            <Text style={[styles.actionText, { color: theme.secondaryForeground }]}>Expense</Text>
          </TouchableOpacity>
        </View>

        {/* Chart Card */}
        <View style={styles.section}>
          <Card padding="none" style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.cardTitle}>Cash Flow</Text>
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
                  <Text style={styles.legendText}>Income</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.destructive }]} />
                  <Text style={styles.legendText}>Expense</Text>
                </View>
              </View>
            </View>
            {/* Distinguish "still loading" (slow network) from "genuinely no
                data" — otherwise the chart's empty state shows during loading. */}
            {dashboardQuery.isLoading ? (
              <View style={styles.chartSkeleton}>
                {[64, 100, 48, 82, 56, 92, 40].map((h, i) => (
                  <Skeleton key={i} width={14} height={`${h}%`} radius={6} />
                ))}
              </View>
            ) : dashboardQuery.isError && !chart ? (
              <View style={styles.chartStateBox}>
                <Text style={styles.stateText}>Couldn't load the chart.</Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => dashboardQuery.refetch()}
                  activeOpacity={0.8}
                >
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TransactionOverviewChart
                data={chart?.chartData || []}
                totalIncomeCount={chart?.totalIncomeCount || 0}
                totalExpenseCount={chart?.totalExpenseCount || 0}
                periodLabel={summary?.preset?.label || "Past 30 Days"}
                baseCurrency={baseCurrency}
                hideHeader={true}
                transparentBackground={true}
                height={180}
              />
            )}
          </Card>
        </View>

        {/* Expenses Breakdown (donut) */}
        <View style={styles.section}>
          <ExpenseBreakdownPie
            breakdown={pie?.breakdown || []}
            total={pie?.totalSpent || 0}
            periodLabel={summary?.preset?.label || "Past 30 Days"}
            baseCurrency={baseCurrency}
            isLoading={dashboardQuery.isLoading}
          />
        </View>

        {/* Summary List Card */}
        <View style={styles.section}>
          <Card padding="sm">
            {renderSummaryRow("Income", income, theme.primary, () =>
              handleAddTransaction("INCOME"),
            )}
            {renderSummaryRow("Expense", expenses, theme.destructive, () =>
              handleAddTransaction("EXPENSE"),
            )}
            {renderSummaryRow(
              "Left for Saving",
              leftForSaving > 0 ? leftForSaving : 0,
              theme.foreground,
              undefined,
              true,
            )}
          </Card>
        </View>

        {/* Insights Card — hidden on error: it would be computed from fake zeros */}
        {!summaryError && (
          <View style={styles.section}>
            <Card padding="sm" style={styles.insightCard}>
              <IconTile size="md" color={theme.primary}>
                <Ionicons name="bulb-outline" size={20} color={theme.primary} />
              </IconTile>
              <View style={styles.insightTextWrapper}>
                <Text style={styles.insightTitle}>Insight</Text>
                <Text style={styles.insightDesc}>
                  {leftForSaving > 0
                    ? `You saved ${formatCurrency(leftForSaving, { currency: baseCurrency, showSign: false })} this period`
                    : `You spent more than you earned this period`}
                </Text>
              </View>
            </Card>
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <RecentTransactions />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Add Transaction Sheet */}
      <TransactionFormSheet
        isVisible={showForm}
        onClose={() => setShowForm(false)}
        initialType={initialType}
      />
    </View>
  );
}

const createStyles = (theme: typeof colors.light, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingTop: spacing.md,
    },
    // Hero balance
    heroSection: {
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
    },
    heroLabel: {
      fontFamily: fontFamily.medium,
      fontSize: 14,
      color: theme.mutedForeground,
      marginBottom: spacing.sm,
    },
    heroAmountRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "center",
      marginBottom: spacing.md,
    },
    heroCurrency: {
      fontFamily: fontFamily.bold,
      fontSize: 20,
      color: theme.foreground,
      marginTop: 8,
      marginRight: 4,
    },
    heroAmount: {
      fontFamily: fontFamily.extrabold,
      fontSize: 52,
      color: theme.foreground,
      letterSpacing: -1.5,
      fontVariant: ["tabular-nums"],
    },
    heroSkeletonRow: {
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.md,
    },
    heroPickerRow: {
      alignItems: "center",
    },
    // Quick actions
    actionsRow: {
      flexDirection: "row",
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
      marginBottom: spacing.xl,
    },
    actionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.sm + 4,
      borderRadius: 100,
      gap: spacing.xs,
    },
    actionText: {
      fontFamily: fontFamily.semibold,
      fontSize: 14,
    },
    // Chart card — surface handled by <Card>; this adds vertical padding + clip
    chartCard: {
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      overflow: "hidden",
    },
    chartHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.sm,
    },
    chartStateBox: {
      height: 180,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
    },
    chartSkeleton: {
      height: 180,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    stateText: {
      fontFamily: fontFamily.medium,
      fontSize: 13,
      color: theme.mutedForeground,
    },
    retryBtn: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xs + 2,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      backgroundColor: theme.muted,
    },
    retryText: {
      fontFamily: fontFamily.semibold,
      fontSize: 13,
      color: theme.foreground,
    },
    cardTitle: {
      fontFamily: fontFamily.semibold,
      fontSize: 15,
      color: theme.foreground,
    },
    legend: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    legendDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    legendText: {
      fontFamily: fontFamily.medium,
      fontSize: 11,
      color: theme.mutedForeground,
    },
    // Summary list rows (surface is <Card>)
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    summaryRowLast: {
      borderBottomWidth: 0,
    },
    summaryRowLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    summaryDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    summaryLabel: {
      fontFamily: fontFamily.medium,
      fontSize: 14,
      color: theme.foreground,
    },
    summaryRowRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    summaryAmount: {
      fontFamily: fontFamily.bold,
      fontSize: 15,
      color: theme.foreground,
    },
    // Insight (surface is <Card>)
    insightCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    insightTextWrapper: {
      flex: 1,
    },
    insightTitle: {
      fontFamily: fontFamily.semibold,
      fontSize: 14,
      color: theme.foreground,
      marginBottom: 2,
    },
    insightDesc: {
      fontFamily: fontFamily.regular,
      fontSize: 12,
      color: theme.mutedForeground,
    },
    section: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
    },
  });
