import { apiClient } from '../../store/api-client';

export interface SupportedCurrency {
  code: string;
  name: string;
  symbol: string;
}

export interface GetSupportedCurrenciesResponse {
  message: string;
  currencies: SupportedCurrency[];
}

export const currencyApi = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    getSupportedCurrencies: builder.query<GetSupportedCurrenciesResponse, void>({
      query: () => ({
        url: '/currency/supported',
        method: 'GET',
      }),
    }),
  }),
});

export const { useGetSupportedCurrenciesQuery } = currencyApi;
