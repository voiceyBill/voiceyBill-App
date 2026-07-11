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

/**
 * Optimistically insert a just-created transaction at the top of the cached
 * lists it would appear in (first page, matching filters), so the row is
 * already visible the moment the form closes instead of appearing only after
 * the invalidation refetch lands. The refetch then replaces the placeholder
 * with the server's canonical row (real id, converted currency amounts).
 */
const insertIntoTransactionCaches = (
  dispatch: (action: any) => UndoPatch,
  getState: () => any,
  entity: Transaction,
): UndoPatch[] => {
  const patches: UndoPatch[] = [];
  const entries = transactionApi.util.selectInvalidatedBy(getState(), [
    'transactions',
  ]);
  for (const { endpointName, originalArgs } of entries) {
    if (endpointName !== 'getAllTransactions') continue;
    const args = (originalArgs ?? {}) as GetAllTransactionParams;
    const page = args.pageNumber ?? args.page ?? 1;
    // Only lists whose filters would actually include the new row.
    if (page !== 1) continue;
    if (args.keyword) continue;
    if (args.type && args.type !== entity.type) continue;
    if (args.recurringStatus === 'RECURRING' && !entity.isRecurring) continue;
    if (args.recurringStatus === 'NON_RECURRING' && entity.isRecurring) continue;

    patches.push(
      dispatch(
        transactionApi.util.updateQueryData(
          'getAllTransactions',
          originalArgs as GetAllTransactionParams,
          (draft: GetAllTransactionResponse) => {
            const list =
              draft.transactions ??
              draft.transcations ??
              draft.data?.transactions ??
              draft.data?.transations;
            if (!list) return;
            list.unshift(entity);
            if (draft.pagination) {
              draft.pagination.totalCount =
                (draft.pagination.totalCount || 0) + 1;
            }
          },
        ),
      ),
    );
  }
  return patches;
};

/** Optimistically apply field updates to a transaction in every cached list. */
const patchTransactionInCaches = (
  dispatch: (action: any) => UndoPatch,
  getState: () => any,
  id: string,
  patch: Partial<Transaction>,
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
            const lists = [
              draft.transactions,
              draft.transcations,
              draft.data?.transactions,
              draft.data?.transations,
            ];
            for (const list of lists) {
              const row = list?.find((t) => t._id === id);
              if (row) Object.assign(row, patch);
            }
          },
        ),
      ),
    );
  }
  return patches;
};

export const transactionApi = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    createTransaction: builder.mutation<void, CreateTransactionBody>({
      query: (body) => ({
        url: '/transaction/create',
        method: 'POST',
        body: body,
      }),
      async onQueryStarted(body, { dispatch, getState, queryFulfilled }) {
        // Placeholder row. Note: `amount` is the entered amount — for
        // foreign-currency entries the server-converted amount replaces it
        // when the invalidation refetch lands moments later.
        const now = new Date().toISOString();
        const optimistic: Transaction = {
          _id: `optimistic-${Date.now()}`,
          title: body.title,
          amount: Number(body.amount),
          originalCurrency: body.currency ?? null,
          category: body.category,
          description: body.description,
          type: body.type,
          paymentMethod: body.paymentMethod,
          date: body.date,
          status: body.status ?? 'COMPLETED',
          isRecurring: body.isRecurring ?? false,
          recurringFrequency: body.recurringFrequency,
          userId: '',
          createdAt: now,
          updatedAt: now,
        };
        const patches = insertIntoTransactionCaches(
          dispatch,
          getState,
          optimistic,
        );
        try {
          await queryFulfilled;
        } catch {
          // Rejected (e.g. exceeds budget): remove the placeholder again.
          patches.forEach((p) => p.undo());
        }
      },
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
      async onQueryStarted(
        { id, transaction },
        { dispatch, getState, queryFulfilled },
      ) {
        // Apply the edited fields to cached rows immediately; the refetch
        // reconciles server-computed values (currency conversion) after.
        const { currency: _currency, ...fields } = transaction;
        const patches = patchTransactionInCaches(dispatch, getState, id, {
          ...fields,
          ...(fields.amount !== undefined && { amount: Number(fields.amount) }),
          updatedAt: new Date().toISOString(),
        });
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
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
