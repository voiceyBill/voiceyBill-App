import { _TransactionType, TransactionFrequencyType, TransactionStatusType } from '../constants';

export interface Transaction {
  _id: string;
  title: string;
  amount: number;
  originalAmount?: number | null;
  originalCurrency?: string | null;
  baseCurrencyAtTime?: string | null;
  exchangeRate?: number | null;
  rateSource?: 'live' | 'cached' | null;
  exchangeRateFetchedAt?: string | null;
  category: string;
  description?: string;
  type: _TransactionType;
  paymentMethod: string;
  date: string;
  status: TransactionStatusType;
  isRecurring: boolean;
  recurringFrequency?: TransactionFrequencyType;
  receiptUrl?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionBody {
  title: string;
  amount: number;
  category: string;
  description?: string;
  type: _TransactionType;
  paymentMethod: string;
  date: string;
  status?: TransactionStatusType;
  isRecurring?: boolean;
  recurringFrequency?: TransactionFrequencyType;
  currency?: string;
}

export interface GetAllTransactionParams {
  keyword?: string;
  type?: _TransactionType;
  recurringStatus?: 'RECURRING' | 'NON_RECURRING';
  /** `pageNumber` is canonical; `page` is accepted as an alias from some callers */
  pageNumber?: number;
  page?: number;
  pageSize?: number;
}

export interface GetAllTransactionResponse {
  /** Server historically returns `transations` (typo). Accept both shapes here. */
  transcations?: Transaction[];
  transactions?: Transaction[];
  data?: {
    transations?: Transaction[];
    transactions?: Transaction[];
  } | null;
  pagination: {
    totalCount: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
    skip: number;
  };
}
