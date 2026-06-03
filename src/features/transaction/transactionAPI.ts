import { apiClient } from '../../store/api-client';
import {
  CreateTransactionBody,
  GetAllTransactionParams,
  GetAllTransactionResponse,
  Transaction,
} from '../../types/transaction';

// AI Scan Receipt Response Type
export interface AIScanReceiptResponse {
  message: string;
  data: {
    amount: number;
    category: string;
    description: string;
    date: string;
  };
}

// Bulk Import Payload
export interface BulkImportTransactionPayload {
  transactions: CreateTransactionBody[];
}

export const transactionApi = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    createTransaction: builder.mutation<void, CreateTransactionBody>({
      query: (body) => ({
        url: '/transaction/create',
        method: 'POST',
        body: body,
      }),
      invalidatesTags: ['transactions', 'analytics', 'budget'],
    }),

    aiScanReceipt: builder.mutation<AIScanReceiptResponse, FormData>({
      query: (formData) => ({
        url: '/transaction/scan-receipt',
        method: 'POST',
        body: formData,
      }),
    }),

    getAllTransactions: builder.query<
      GetAllTransactionResponse,
      GetAllTransactionParams
    >({
      query: (params) => {
        const {
          keyword = undefined,
          type = undefined,
          recurringStatus = undefined,
          pageNumber: pageNumberParam,
          page: pageAlias,
          pageSize = 10,
        } = params || {};

        // Accept either `pageNumber` or `page` from callers; default to 1
        const pageNumber = pageNumberParam ?? pageAlias ?? 1;

        return {
          url: '/transaction/all',
          method: 'GET',
          params: {
            keyword,
            type,
            recurringStatus,
            pageNumber,
            pageSize,
          },
        };
      },
      providesTags: ['transactions'],
    }),

    getSingleTransaction: builder.query<{ transaction: Transaction }, string>({
      query: (id) => ({
        url: `/transaction/${id}`,
        method: 'GET',
      }),
    }),

    duplicateTransaction: builder.mutation<void, string>({
      query: (id) => ({
        url: `/transaction/duplicate/${id}`,
        method: 'PUT',
      }),
      invalidatesTags: ['transactions'],
    }),

    updateTransaction: builder.mutation<
      void,
      { id: string; transaction: Partial<CreateTransactionBody> }
    >({
      query: ({ id, transaction }) => ({
        url: `/transaction/update/${id}`,
        method: 'PUT',
        body: transaction,
      }),
      invalidatesTags: ['transactions', 'analytics', 'budget'],
    }),

    bulkImportTransaction: builder.mutation<void, BulkImportTransactionPayload>({
      query: (body) => ({
        url: '/transaction/bulk-transaction',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['transactions', 'budget'],
    }),

    deleteTransaction: builder.mutation<void, string>({
      query: (id) => ({
        url: `/transaction/delete/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['transactions', 'analytics', 'budget'],
    }),

    bulkDeleteTransaction: builder.mutation<void, string[]>({
      query: (transactionIds) => ({
        url: '/transaction/bulk-delete',
        method: 'DELETE',
        body: {
          transactionIds,
        },
      }),
      invalidatesTags: ['transactions', 'analytics', 'budget'],
    }),
  }),
});

export const {
  useCreateTransactionMutation,
  useAiScanReceiptMutation,
  useGetAllTransactionsQuery,
  useGetSingleTransactionQuery,
  useDuplicateTransactionMutation,
  useUpdateTransactionMutation,
  useBulkImportTransactionMutation,
  useDeleteTransactionMutation,
  useBulkDeleteTransactionMutation,
} = transactionApi;
