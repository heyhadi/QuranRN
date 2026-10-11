import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useBookmarksStore } from "./bookmarks";
import { zustandStorage } from "./storage";

/** Colours a collection can have; picked in rotation as collections are added. */
export const COLLECTION_COLORS = ["#A67A2C", "#0F5A46", "#3D6BF0", "#8E1AA3", "#D9650A", "#CC1016"] as const;

export interface Collection {
    id: string;
    name: string;
    color: string;
}

interface CollectionsState {
    collections: Collection[];
    /** Create a collection and return it. Names are trimmed; a blank name creates nothing. */
    addCollection: (name: string) => Collection | null;
    removeCollection: (id: string) => void;
}

export const useCollectionsStore = create<CollectionsState>()(
    persist(
        (set, get) => ({
            collections: [],
            addCollection: (name) => {
                const trimmed = name.trim();
                if (!trimmed) return null;
                const existing = get().collections.find((collection) => collection.name.toLowerCase() === trimmed.toLowerCase());
                if (existing) return existing;
                const collection: Collection = {
                    id: `c${Date.now().toString(36)}${get().collections.length}`,
                    name: trimmed,
                    color: COLLECTION_COLORS[get().collections.length % COLLECTION_COLORS.length],
                };
                set((state) => ({ collections: [...state.collections, collection] }));
                return collection;
            },
            removeCollection: (id) => {
                // Bookmarks in the collection stay saved, just without one.
                useBookmarksStore.getState().clearCollection(id);
                set((state) => ({ collections: state.collections.filter((collection) => collection.id !== id) }));
            },
        }),
        { name: "collections", storage: zustandStorage, version: 1 },
    ),
);
