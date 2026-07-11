import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

/**
 * redux-persist storage backed by encrypted MMKV.
 *
 * - Much faster than AsyncStorage (memory-mapped reads), which shortens
 *   rehydration on cold start.
 * - Encrypted at rest: the persisted store holds the user's financial data
 *   (transactions, budgets, auth), which previously sat in plaintext
 *   AsyncStorage. The encryption key is generated once and kept in the
 *   device keychain (SecureStore) — the same place as the refresh token.
 * - One-time migration copies the existing AsyncStorage persist keys into
 *   MMKV so current users keep their session and cache after updating.
 * - Falls back to AsyncStorage transparently when the native MMKV module is
 *   unavailable (e.g. Expo Go), so development flows keep working.
 */

const ENCRYPTION_KEY_ID = "voiceybill.cacheKey";
const MIGRATION_FLAG = "__migrated_from_asyncstorage_v1";
const PERSIST_KEYS = ["persist:root", "persist:api"];

type KV = {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
  contains(key: string): boolean;
};

let storePromise: Promise<KV | null> | null = null;

const initStore = async (): Promise<KV | null> => {
  try {
    // Lazy require so environments without the native module (Expo Go) fall
    // back to AsyncStorage instead of crashing at import time.
    const { MMKV } = require("react-native-mmkv") as {
      MMKV: new (config: { id: string; encryptionKey: string }) => KV;
    };

    // MMKV encryption keys are limited to 16 bytes — 8 random bytes hex-encoded.
    let key = await SecureStore.getItemAsync(ENCRYPTION_KEY_ID);
    if (!key) {
      const bytes = await Crypto.getRandomBytesAsync(8);
      key = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      await SecureStore.setItemAsync(ENCRYPTION_KEY_ID, key);
    }

    const mmkv = new MMKV({ id: "voiceybill-cache", encryptionKey: key });

    // One-time migration so existing users keep their session and cached data.
    if (!mmkv.contains(MIGRATION_FLAG)) {
      for (const persistKey of PERSIST_KEYS) {
        const value = await AsyncStorage.getItem(persistKey);
        if (value != null && !mmkv.contains(persistKey)) {
          mmkv.set(persistKey, value);
        }
      }
      mmkv.set(MIGRATION_FLAG, "true");
      AsyncStorage.multiRemove(PERSIST_KEYS).catch(() => {});
    }

    return mmkv;
  } catch {
    return null;
  }
};

const ensureStore = () => (storePromise ??= initStore());

export const persistStorage = {
  async getItem(key: string): Promise<string | null> {
    const store = await ensureStore();
    if (!store) return AsyncStorage.getItem(key);
    return store.getString(key) ?? null;
  },
  async setItem(key: string, value: string): Promise<void> {
    const store = await ensureStore();
    if (!store) return AsyncStorage.setItem(key, value);
    store.set(key, value);
  },
  async removeItem(key: string): Promise<void> {
    const store = await ensureStore();
    if (!store) return AsyncStorage.removeItem(key);
    store.delete(key);
  },
};
