import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { REHYDRATE } from "redux-persist";
import type { Action } from "@reduxjs/toolkit";
import { RootState } from "./store";
import {
  setCredentials,
  logout,
  ReportSetting,
  User,
} from "../features/auth/authSlice";
import {
  getRefreshToken,
  setRefreshToken,
  deleteRefreshToken,
} from "../lib/tokenStorage";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://voiceybill-server.vercel.app/api";

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const auth = (getState() as RootState).auth;
    if (auth?.accessToken) {
      headers.set("Authorization", `Bearer ${auth.accessToken}`);
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
  extraOptions: Parameters<BaseQueryFn>[2],
): Promise<RefreshResponse | null> => {
  const storedRefreshToken = await getRefreshToken();
  if (!storedRefreshToken) return null;

  const refreshResult = await baseQuery(
    {
      url: "/auth/refresh-token",
      method: "POST",
      body: { refreshToken: storedRefreshToken },
    },
    api,
    extraOptions,
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
    }),
  );
  return data;
};

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // passport-jwt's default 401 response is plain text ("Unauthorized"), which
  // fetchBaseQuery's JSON parser wraps as PARSING_ERROR with originalStatus:401.
  // Treat that the same as a clean 401 so the refresh path actually fires.
  const errStatus = result.error?.status;
  const originalStatus = (
    result.error as { originalStatus?: number } | undefined
  )?.originalStatus;
  const is401 =
    errStatus === 401 ||
    (errStatus === "PARSING_ERROR" && originalStatus === 401);
  if (!is401) return result;

  // Don't try to refresh a failed refresh call — that would loop.
  const argsUrl = typeof args === "string" ? args : args.url;
  if (argsUrl === "/auth/refresh-token") return result;

  // A 401 on a request that carried NO access token isn't an expired session —
  // it's a normal auth failure (e.g. wrong password on /auth/login). Running the
  // refresh path here finds no refresh token, then calls resetApiState(), which
  // aborts the in-flight login mutation and surfaces a misleading "Aborted" /
  // "can't reach the server" error instead of the server's real 401 message.
  // Returning the result lets the screen show "Invalid email/password".
  const hasAccessToken = !!(api.getState() as RootState).auth?.accessToken;
  if (!hasAccessToken) return result;

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

// Shape of the REHYDRATE action dispatched by the nested api persistReducer
// (see store.ts): `key` is the slice's persist key, `payload` its stored state.
type RehydrateAction = Action<typeof REHYDRATE> & {
  key?: string;
  payload?: Record<string, unknown> | null;
};

export const apiClient = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  // PERF: ingest the persisted query cache on startup so screens render the
  // last-known data instantly instead of skeletons. Combined with
  // refetchOnMountOrArgChange below, anything stale still refreshes silently
  // in the background — cached-first, network-second.
  extractRehydrationInfo(action, { reducerPath }) {
    const a = action as RehydrateAction;
    if (a.type === REHYDRATE && a.key === reducerPath && a.payload) {
      // The transform in store.ts persists only `queries` + `provided`;
      // normalise the shape RTK Query's rehydration handler expects.
      return {
        queries: (a.payload.queries as any) ?? {},
        provided: (a.payload.provided as any) ?? {},
        mutations: {},
      } as any;
    }
    return undefined;
  },
  // PERF: refetch on mount only if the cached data is older than 30s, instead of
  // on *every* screen mount. Navigating back to a screen within the window is
  // now instant (no spinner/skeleton flash) while still refreshing stale data.
  // Mutations invalidate tags, so create/edit/delete still force a refresh
  // regardless of this threshold — behaviour is preserved.
  refetchOnMountOrArgChange: 30,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: [
    "transactions",
    "analytics",
    "billingSubscription",
    "reports",
    "user",
    "Analytics",
    "budget",
    "categories",
  ],
  endpoints: () => ({}),
});
