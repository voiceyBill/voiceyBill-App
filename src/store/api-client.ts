import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { RootState } from './store';
import { setCredentials, logout, ReportSetting, User } from '../features/auth/authSlice';
import { getRefreshToken, setRefreshToken, deleteRefreshToken } from '../lib/tokenStorage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://voiceybill-server.vercel.app/api';

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const auth = (getState() as RootState).auth;
    if (auth?.accessToken) {
      headers.set('Authorization', `Bearer ${auth.accessToken}`);
    }
    return headers;
  },
});

type RefreshResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt?: string | number;
  reportSetting?: ReportSetting | null;
};

// Single-flight guard for the refresh request. Multiple parallel 401s share
// one refresh attempt instead of stampeding the endpoint (which would also
// invalidate each other's freshly rotated tokens).
let refreshInFlight: Promise<RefreshResponse | null> | null = null;

const performRefresh = async (
  api: Parameters<BaseQueryFn>[1],
  extraOptions: Parameters<BaseQueryFn>[2]
): Promise<RefreshResponse | null> => {
  const storedRefreshToken = await getRefreshToken();
  if (!storedRefreshToken) return null;

  const refreshResult = await baseQuery(
    { url: '/auth/refresh-token', method: 'POST', body: { refreshToken: storedRefreshToken } },
    api,
    extraOptions
  );

  if (!refreshResult.data) return null;

  const data = refreshResult.data as RefreshResponse;
  // Persist the rotated refresh token *before* dispatching setCredentials so a
  // racing 401 that arrives after this point can find the new token on disk.
  await setRefreshToken(data.refreshToken);
  api.dispatch(
    setCredentials({
      user: data.user,
      accessToken: data.accessToken,
      reportSetting: data.reportSetting ?? null,
    })
  );
  return data;
};

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await baseQuery(args, api, extraOptions);

  // passport-jwt's default 401 response is plain text ("Unauthorized"), which
  // fetchBaseQuery's JSON parser wraps as PARSING_ERROR with originalStatus:401.
  // Treat that the same as a clean 401 so the refresh path actually fires.
  const errStatus = result.error?.status;
  const originalStatus = (result.error as { originalStatus?: number } | undefined)?.originalStatus;
  const is401 = errStatus === 401 || (errStatus === 'PARSING_ERROR' && originalStatus === 401);
  if (!is401) return result;

  // Don't try to refresh a failed refresh call — that would loop.
  const argsUrl = typeof args === 'string' ? args : args.url;
  if (argsUrl === '/auth/refresh-token') return result;

  if (!refreshInFlight) {
    refreshInFlight = performRefresh(api, extraOptions).finally(() => {
      refreshInFlight = null;
    });
  }

  const refreshed = await refreshInFlight;

  if (refreshed) {
    // Retry the original request with the new access token.
    result = await baseQuery(args, api, extraOptions);
  } else {
    await deleteRefreshToken();
    api.dispatch(logout());
    api.dispatch(apiClient.util.resetApiState());
  }

  return result;
};

export const apiClient = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  refetchOnMountOrArgChange: true,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: ['transactions', 'analytics', 'billingSubscription', 'reports', 'user', 'Analytics', 'budget'],
  endpoints: () => ({}),
});
