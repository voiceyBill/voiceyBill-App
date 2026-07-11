  import { apiClient } from '../../store/api-client';

// Matching web client analytics types
export interface SummaryAnalytics {
  availableBalance: number;
  totalIncome: number;
  totalExpenses: number;
  transactionCount: number;
  savingRate: {
    percentage: number;
    expenseRatio: number;
  };
  percentageChange: {
    income: number;
    expenses: number;
    balance: number;
    prevPeriodFrom: string | null;
    prevPeriodTo: string | null;
    previousValues: {
      incomeAmount: number;
      expenseAmount: number;
      balanceAmount: number;
    };
  };
  preset: {
    from: string;
    to: string;
    value: string;
    label: string;
  };
}

export interface ChartDataPoint {
  date: string;
  income: number;
  expenses: number;
  incomeCount?: number;
  expenseCount?: number;
}

export interface ChartAnalytics {
  chartData: ChartDataPoint[];
  totalIncomeCount: number;
  totalExpenseCount: number;
  preset: {
    from: string;
    to: string;
    value: string;
    label: string;
  };
}

export interface ExpenseBreakdown {
  name: string;
  value: number;
  percentage: number;
}

export interface ExpensePieChartBreakdown {
  breakdown: ExpenseBreakdown[];
  totalSpent: number;
  preset: {
    from: string;
    to: string;
    value: string;
    label: string;
  };
}

export interface FilterParams {
  preset?: string;
  from?: string;
  to?: string;
}

// Analytics API endpoints matching backend
export const analyticsApi = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    getSummaryAnalytics: builder.query<{ message: string; data: SummaryAnalytics }, FilterParams>({
      query: ({ preset, from, to }) => ({
        url: '/analytics/summary',
        method: 'GET',
        params: { preset, from, to },
      }),
      providesTags: ['analytics'],
    }),
    
    getChartAnalytics: builder.query<{ message: string; data: ChartAnalytics }, FilterParams>({
      query: ({ preset, from, to }) => ({
        url: '/analytics/chart',
        method: 'GET',
        params: { preset, from, to },
      }),
      providesTags: ['analytics'],
    }),
    
    getExpensePieChartBreakdown: builder.query<{ message: string; data: ExpensePieChartBreakdown }, FilterParams>({
      query: ({ preset, from, to }) => ({
        url: '/analytics/expense-breakdown',
        method: 'GET',
        params: { preset, from, to },
      }),
      providesTags: ['analytics'],
    }),

    // PERF: the dashboard needs all three analytics blocks; fetching them in
    // one request means one serverless invocation (one cold-start exposure)
    // instead of three. The individual endpoints above remain for other uses.
    getDashboardAnalytics: builder.query<
      {
        message: string;
        data: {
          summary: SummaryAnalytics;
          chart: ChartAnalytics;
          expenseBreakdown: ExpensePieChartBreakdown;
        };
      },
      FilterParams
    >({
      query: ({ preset, from, to }) => ({
        url: '/analytics/dashboard',
        method: 'GET',
        params: { preset, from, to },
      }),
      providesTags: ['analytics'],
    }),
  }),
});

export const {
  useGetSummaryAnalyticsQuery,
  useGetChartAnalyticsQuery,
  useGetExpensePieChartBreakdownQuery,
  useGetDashboardAnalyticsQuery,
} = analyticsApi;
