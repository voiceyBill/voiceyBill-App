import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { RootState } from './store';
import { setCredentials, logout } from '../features/auth/authSlice';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://voiceybill-server.vercel.app/api';

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const auth = (getState() as RootState).auth;
    if (auth?.accessToken) {
      headers.set('Authorization', `Bearer ${auth.accessToken}`);
    }
    return headers;
  },
});

// Wraps every request: on 401 try to refresh the token once, then retry.
// If refresh also fails, dispatch logout so the app redirects to sign-in.
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    // Attempt token refresh
    const refreshResult = await baseQuery(
      { url: '/auth/refresh-token', method: 'POST' },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      const { user, accessToken } = refreshResult.data as { user: any; accessToken: string };
      api.dispatch(setCredentials({ user, accessToken }));
      // Retry the original request with the new token
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Refresh failed — clear auth and send user to sign-in
      api.dispatch(logout());
      api.dispatch(apiClient.util.resetApiState());
    }
  }

  return result;
};

export const apiClient = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  refetchOnMountOrArgChange: true,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: ['transactions', 'analytics', 'billingSubscription', 'reports', 'user', 'Analytics'],
  endpoints: () => ({}),
});
