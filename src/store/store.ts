import { combineReducers, configureStore } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { apiClient } from './api-client';
import authReducer from '../features/auth/authSlice';

type RootReducerType = ReturnType<typeof rootReducer>;

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  blacklist: [apiClient.reducerPath],
};

// PERF: persist the RTK Query cache so a cold start renders the last-known
// data instantly (no skeletons) while stale entries refetch silently in the
// background (refetchOnMountOrArgChange handles the refresh).
//
// Only settled, successful query entries are written — an entry persisted
// mid-flight ("pending") would rehydrate as a query that never resolves.
const fulfilledQueriesOnly = createTransform(
  (inbound: Record<string, { status?: string } | undefined>) =>
    Object.fromEntries(
      Object.entries(inbound ?? {}).filter(
        ([, entry]) => entry?.status === 'fulfilled',
      ),
    ),
  (outbound) => outbound,
  { whitelist: ['queries'] },
);

const apiPersistConfig = {
  key: apiClient.reducerPath,
  storage: AsyncStorage,
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

// Wire up RTK Query's focus/reconnect refetching using React Native's AppState.
// This makes refetchOnFocus work when the app returns to the foreground.
setupListeners(store.dispatch, (dispatch, { onFocus, onFocusLost }) => {
  const subscription = AppState.addEventListener('change', (nextState) => {
    if (nextState === 'active') {
      onFocus();
    } else {
      onFocusLost();
    }
  });
  return () => subscription.remove();
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
