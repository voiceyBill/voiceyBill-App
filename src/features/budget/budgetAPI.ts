import { apiClient } from '../../store/api-client';
import {
  BudgetResponse,
  BudgetSummaryParams,
  BudgetSummaryResponse,
  UpsertBudgetPayload,
} from './budgetType';

export const budgetApi = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    getBudgetSummary: builder.query<BudgetSummaryResponse, BudgetSummaryParams>({
      query: ({ month, year }) => ({
        url: '/budget/summary',
        method: 'GET',
        params: { month, year },
      }),
      providesTags: ['budget'],
    }),

    upsertBudget: builder.mutation<BudgetResponse, UpsertBudgetPayload>({
      query: (payload) => ({
        url: '/budget',
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['budget'],
    }),

    deleteBudget: builder.mutation<
      { message: string; data: { success: boolean } },
      BudgetSummaryParams
    >({
      query: ({ month, year }) => ({
        url: '/budget',
        method: 'DELETE',
        params: { month, year },
      }),
      invalidatesTags: ['budget'],
    }),
  }),
});

export const {
  useGetBudgetSummaryQuery,
  useUpsertBudgetMutation,
  useDeleteBudgetMutation,
} = budgetApi;
