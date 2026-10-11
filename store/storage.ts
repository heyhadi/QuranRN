import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { createMMKV } from "react-native-mmkv";
import { createJSONStorage } from "zustand/middleware";

// One MMKV file for everything the app saves on the device.
// Under Jest, react-native-mmkv swaps in an in-memory mock automatically.
export const storage = createMMKV({ id: "wird" });

// MMKV is synchronous, so the same adapter fits both zustand and the TanStack sync persister.
const mmkvStringStorage = {
    getItem: (key: string): string | null => storage.getString(key) ?? null,
    setItem: (key: string, value: string): void => storage.set(key, value),
    removeItem: (key: string): void => {
        storage.remove(key);
    },
};

/** Storage for zustand's `persist` middleware. */
export const zustandStorage = createJSONStorage(() => mmkvStringStorage);

/** Saves the TanStack Query cache, so Surahs read once stay available offline. */
export const queryPersister = createSyncStoragePersister({ storage: mmkvStringStorage, key: "query-cache" });
