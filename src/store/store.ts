import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  persistReducer,
  persistStore,
  createTransform,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import { setupListeners } from '@reduxjs/toolkit/query';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { apiClient } from './api-client';
import authReducer from '../features/auth/authSlice';
import { persistStorage } from '../lib/persistStorage';

type RootReducerType = ReturnType<typeof rootReducer>;

const persistConfig = {
  key: 'root',
  // Encrypted MMKV (AsyncStorage fallback in Expo Go) — see lib/persistStorage.
  storage: persistStorage,
  blacklist: [apiClient.reducerPath],
};

// PERF: persist the RTK Query cache so a cold start renders the last-known
// data instantly (no skeletons) while stale entries refetch silently in the
// background (refetchOnMountOrArgChange handles the refresh).
//
// Only settled, successful query entries are written — an entry persisted
// mid-flight ("pending") would rehydrate as a query that never resolves.
// Capped to the most recent entries so the persisted cache (parsed on the JS
// thread every launch) can't grow unbounded over months of use.
const MAX_PERSISTED_QUERIES = 40;

const fulfilledQueriesOnly = createTransform(
  (
    inbound: Record<
      string,
      { status?: string; fulfilledTimeStamp?: number } | undefined
    >,
  ) =>
    Object.fromEntries(
      Object.entries(inbound ?? {})
        .filter(([, entry]) => entry?.status === 'fulfilled')
        .sort(
          ([, a], [, b]) =>
            (b?.fulfilledTimeStamp ?? 0) - (a?.fulfilledTimeStamp ?? 0),
        )
        .slice(0, MAX_PERSISTED_QUERIES),
    ),
  (outbound) => outbound,
  { whitelist: ['queries'] },
);

const apiPersistConfig = {
  key: apiClient.reducerPath,
  storage: persistStorage,
  // Persist only the response cache + its tag index. Never `subscriptions`,
  // `mutations` or `config` — those are runtime state.
  whitelist: ['queries', 'provided'],
  transforms: [fulfilledQueriesOnly],
  // RTK Query ingests the stored payload itself via extractRehydrationInfo
  // (see api-client.ts). Returning the reduced state here stops redux-persist
  // from also shallow-merging raw partial state into the slice, which would
  // clobber its internal runtime keys.
  stateReconciler: (
    _inbound: unknown,
    _original: unknown,
    reduced: ReturnType<typeof apiClient.reducer>,
  ) => reduced,
};

const rootReducer = combineReducers({
  [apiClient.reducerPath]: persistReducer(
    apiPersistConfig as never,
    apiClient.reducer,
  ),
  auth: authReducer,
});

const persistedReducer = persistReducer<RootReducerType>(
  persistConfig,
  rootReducer
);

const reduxPersistActions = [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER];

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: reduxPersistActions,
      },
    }).concat(apiClient.middleware),
});

export const persistor = persistStore(store);

// Wire up RTK Query's focus/reconnect refetching. AppState drives
// refetchOnFocus (returning to the foreground); NetInfo drives
// refetchOnReconnect — without it, regaining connectivity while the app is
// open never triggered recovery until the user happened to background and
// return.
setupListeners(
  store.dispatch,
  (dispatch, { onFocus, onFocusLost, onOnline, onOffline }) => {
    const appStateSubscription = AppState.addEventListener(
      'change',
      (nextState) => {
        if (nextState === 'active') {
          onFocus();
        } else {
          onFocusLost();
        }
      },
    );
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        onOnline();
      } else {
        onOffline();
      }
    });
    return () => {
      appStateSubscription.remove();
      unsubscribeNetInfo();
    };
  },
);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
