import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { Plus } from "lucide-react-native";
import {
  useGetSummaryAnalyticsQuery,
  useGetChartAnalyticsQuery,
  useGetExpensePieChartBreakdownQuery,
} from "../../features/analytics/analyticsAPI";
import { useTheme } from "../../context/ThemeContext";
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from "../../theme/colors";
import StatsCard from "../../components/overview/StatsCard";
import DateRangePicker, {
  DateRangePreset,
} from "../../components/overview/DateRangePicker";
import TransactionOverviewChart from "../../components/overview/TransactionOverviewChart";
import ExpenseBreakdownPie from "../../components/overview/ExpenseBreakdownPie";
import RecentTransactions from "../../components/overview/RecentTransactions";
import TransactionFormSheet from "../../components/transaction/TransactionFormSheet";
import { formatCurrency } from "../../lib/formatCurrency";
import { useTypedSelector } from "../../store/hooks";

export default function DashboardScreen() {
  const { activeTheme } = useTheme();
  const theme = colors[activeTheme];
  const [preset, setPreset] = useState<DateRangePreset>("30days");
  const [showForm, setShowForm] = useState(false);
  const user = useTypedSelector((s) => s.auth.user);
  const baseCurrency = user?.baseCurrency || "USD";

  const summaryQuery = useGetSummaryAnalyticsQuery({ preset });
  const chartQuery = useGetChartAnalyticsQuery({ preset });
  const pieQuery = useGetExpensePieChartBreakdownQuery({ preset });

  const summary = summaryQuery.data?.data;

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={summaryQuery.isFetching}
            onRefresh={summaryQuery.refetch}
          />
        }
      >
        {/* Header section - always dark like web */}
        <View style={styles.darkHeaderSection}>
          {/* Header text + controls */}
          <View style={styles.navbar}>
            <Text style={styles.greeting}>
              Welcome back{user?.name ? `, ${user.name}` : ""}
            </Text>
            <Text style={styles.subtitle}>
              This is your overview report for the selected period
            </Text>
            <View style={styles.headerActions}>
              <DateRangePicker
                value={preset}
                onChange={setPreset}
                isDarkHeader={activeTheme === "dark"}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowForm(true)}
                activeOpacity={0.8}
              >
                <Plus size={16} color="#0a100c" strokeWidth={2.8} />
                <Text style={styles.addButtonText}>Add Transaction</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats cards - inside dark section */}
          <View style={styles.statsSection}>
            <StatsCard
              title="Available Balance"
              value={summary?.availableBalance || 0}
              cardType="balance"
              percentageChange={summary?.percentageChange?.balance}
              dateRangeLabel={summary?.preset?.label || "for Last 30 Days"}
              isLoading={summaryQuery.isFetching}
              currency={baseCurrency}
            />
            <StatsCard
              title="Total Income"
              value={summary?.totalIncome || 0}
              cardType="income"
              percentageChange={summary?.percentageChange?.income}
              dateRangeLabel={summary?.preset?.label || "for Last 30 Days"}
              isLoading={summaryQuery.isFetching}
              currency={baseCurrency}
            />
            <StatsCard
              title="Total Expenses"
              value={summary?.totalExpenses || 0}
              cardType="expenses"
              percentageChange={summary?.percentageChange?.expenses}
              dateRangeLabel={summary?.preset?.label || "for Last 30 Days"}
              isLoading={summaryQuery.isFetching}
              currency={baseCurrency}
            />
            <StatsCard
              title="Savings Rate"
              value={summary?.savingRate?.percentage || 0}
              cardType="savings"
              expenseRatio={summary?.savingRate?.expenseRatio}
              dateRangeLabel={summary?.preset?.label || "for Last 30 Days"}
              isLoading={summaryQuery.isFetching}
              currency={baseCurrency}
            />
          </View>
        </View>

        {/* Main content area - light/dark based on theme */}
        <View style={styles.contentSection}>
          {/* Transaction Overview */}
          <View style={{ marginTop: spacing.lg }}>
            <TransactionOverviewChart
              data={chartQuery.data?.data?.chartData || []}
              totalIncomeCount={chartQuery.data?.data?.totalIncomeCount || 0}
              totalExpenseCount={chartQuery.data?.data?.totalExpenseCount || 0}
              periodLabel={summary?.preset?.label || "Past 30 Days"}
              baseCurrency={baseCurrency}
            />
          </View>

          {/* Expenses Breakdown */}
          <View style={{ marginTop: spacing.lg }}>
            <ExpenseBreakdownPie
              breakdown={pieQuery.data?.data?.breakdown || []}
              total={pieQuery.data?.data?.totalSpent || 0}
              periodLabel={summary?.preset?.label}
              baseCurrency={baseCurrency}
            />
          </View>

          {/* Recent Transactions */}
          <View style={{ marginTop: spacing.lg }}>
            <RecentTransactions />
          </View>
        </View>
      </ScrollView>

      {/* Add Transaction Sheet */}
      <TransactionFormSheet
        isVisible={showForm}
        onClose={() => setShowForm(false)}
      />
    </View>
  );
}

const createStyles = (theme: typeof colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContainer: {
      flexGrow: 1,
    },
    // Dark header section - always dark like web navbar
    darkHeaderSection: {
      backgroundColor: theme.navbar,
      paddingBottom: spacing.xl,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "rgba(255, 255, 255, 0.08)",
    },
    navbar: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
    },
    greeting: {
      fontSize: 22,
      fontWeight: fontWeight.extrabold,
      color: theme.navbarForeground,
      letterSpacing: -0.4,
    },
    subtitle: {
      fontSize: 12,
      color: theme.navbarForeground,
      opacity: 0.7,
      marginTop: spacing.xs,
      fontWeight: fontWeight.medium,
    },
    headerActions: {
      marginTop: spacing.lg,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 3,
    },
    addButtonText: {
      fontSize: 13,
      fontWeight: fontWeight.bold,
      color: theme.primaryForeground,
    },
    // Stats section - inside dark header
    statsSection: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      gap: spacing.md,
    },
    // Content section - uses theme background
    contentSection: {
      backgroundColor: theme.background,
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    row: {
      marginTop: spacing.lg,
      gap: spacing.md,
    },
    colLeft: {
      width: "100%",
    },
    colRight: {
      width: "100%",
    },
    countRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: spacing.xs,
      marginBottom: spacing.sm,
    },
    countItem: {
      fontSize: fontSize.sm,
      color: theme.foreground,
    },
  });
