import { apiClient } from '../../store/api-client';
import {
  CreateTransactionBody,
  GetAllTransactionParams,
  GetAllTransactionResponse,
  Transaction,
} from '../../types/transaction';

type UndoPatch = { undo: () => void };

/**
 * Optimistically remove the given transaction ids from every cached
 * `getAllTransactions` list (dashboard recent list, transactions screen, each
 * page/filter) so a deleted row disappears instantly — in sync with the success
 * feedback — instead of lingering until a refetch completes. Returns the patch
 * handles so the caller can roll the rows back if the server rejects the delete.
 */
const pruneTransactionCaches = (
  dispatch: (action: any) => UndoPatch,
  getState: () => any,
  ids: Set<string>,
): UndoPatch[] => {
  const patches: UndoPatch[] = [];
  const entries = transactionApi.util.selectInvalidatedBy(getState(), [
    'transactions',
  ]);
  for (const { endpointName, originalArgs } of entries) {
    if (endpointName !== 'getAllTransactions') continue;
    patches.push(
      dispatch(
        transactionApi.util.updateQueryData(
          'getAllTransactions',
          originalArgs as GetAllTransactionParams,
          (draft: GetAllTransactionResponse) => {
            const removed = new Set<string>();
            const prune = (arr?: Transaction[]) =>
              arr?.filter((t) => {
                if (ids.has(t._id)) {
                  removed.add(t._id);
                  return false;
                }
                return true;
              });
            if (draft.transactions) draft.transactions = prune(draft.transactions);
            if (draft.transcations) draft.transcations = prune(draft.transcations);
            if (draft.data?.transactions)
              draft.data.transactions = prune(draft.data.transactions);
            if (draft.data?.transations)
              draft.data.transations = prune(draft.data.transations);
            if (draft.pagination && removed.size) {
              draft.pagination.totalCount = Math.max(
                0,
                (draft.pagination.totalCount || 0) - removed.size,
              );
            }
          },
        ),
      ),
    );
  }
  return patches;
};

// AI Scan Receipt Response Type
export interface AIScanReceiptResponse {
  message: string;
  data: {
    title?: string;
    amount: number;
    category: string;
    description: string;
    date: string;
    currency?: string;
    paymentMethod?: string;
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
      async onQueryStarted(id, { dispatch, getState, queryFulfilled }) {
        const patches = pruneTransactionCaches(dispatch, getState, new Set([id]));
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
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
      async onQueryStarted(transactionIds, { dispatch, getState, queryFulfilled }) {
        const patches = pruneTransactionCaches(
          dispatch,
          getState,
          new Set(transactionIds),
        );
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
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
