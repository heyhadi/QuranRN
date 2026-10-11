import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandStorage } from "./storage";

export interface Bookmark {
    surahNumber: number;
    ayahNumber: number;
    surahNameLatin: string;
    textArabic: string;
    createdAt: number;
    /** The collection this bookmark was filed in, if any. */
    collectionId?: string;
}

export type NewBookmark = Omit<Bookmark, "createdAt">;

/** Bookmarks are identified by Surah and ayah together; ayah 5 of Al-Baqarah is not ayah 5 of Al-Fatihah. */
export const bookmarkKey = (surahNumber: number, ayahNumber: number) => `${surahNumber}:${ayahNumber}`;

interface BookmarksState {
    bookmarks: Record<string, Bookmark>;
    addBookmark: (bookmark: NewBookmark) => void;
    removeBookmark: (surahNumber: number, ayahNumber: number) => void;
    /** Adds the bookmark if missing, removes it if present. Returns whether it is now bookmarked. */
    toggleBookmark: (bookmark: NewBookmark) => boolean;
    /** File a bookmark in a collection (or null for none). Bookmarks the ayah first if it isn't yet. */
    setCollection: (bookmark: NewBookmark, collectionId: string | null) => void;
    /** Take every bookmark out of a collection, e.g. because it was deleted. */
    clearCollection: (collectionId: string) => void;
}

export const useBookmarksStore = create<BookmarksState>()(
    persist(
        (set, get) => ({
            bookmarks: {},
            addBookmark: (bookmark) =>
                set((state) => ({
                    bookmarks: {
                        ...state.bookmarks,
                        [bookmarkKey(bookmark.surahNumber, bookmark.ayahNumber)]: { ...bookmark, createdAt: Date.now() },
                    },
                })),
            removeBookmark: (surahNumber, ayahNumber) =>
                set((state) => {
                    const { [bookmarkKey(surahNumber, ayahNumber)]: _removed, ...rest } = state.bookmarks;
                    return { bookmarks: rest };
                }),
            toggleBookmark: (bookmark) => {
                const isBookmarked = bookmarkKey(bookmark.surahNumber, bookmark.ayahNumber) in get().bookmarks;
                if (isBookmarked) get().removeBookmark(bookmark.surahNumber, bookmark.ayahNumber);
                else get().addBookmark(bookmark);
                return !isBookmarked;
            },
            setCollection: (bookmark, collectionId) =>
                set((state) => {
                    const key = bookmarkKey(bookmark.surahNumber, bookmark.ayahNumber);
                    const existing = state.bookmarks[key] ?? { ...bookmark, createdAt: Date.now() };
                    const { collectionId: _old, ...rest } = existing;
                    return { bookmarks: { ...state.bookmarks, [key]: collectionId ? { ...rest, collectionId } : rest } };
                }),
            clearCollection: (collectionId) =>
                set((state) => ({
                    bookmarks: Object.fromEntries(
                        Object.entries(state.bookmarks).map(([key, bookmark]) => {
                            if (bookmark.collectionId !== collectionId) return [key, bookmark];
                            const { collectionId: _removed, ...rest } = bookmark;
                            return [key, rest];
                        }),
                    ),
                })),
        }),
        { name: "bookmarks", storage: zustandStorage, version: 1 },
    ),
);

export function useIsBookmarked(surahNumber: number, ayahNumber: number): boolean {
    return useBookmarksStore((state) => bookmarkKey(surahNumber, ayahNumber) in state.bookmarks);
}

/** Newest first. */
export function sortBookmarks(bookmarks: Record<string, Bookmark>): Bookmark[] {
    return Object.values(bookmarks).sort((a, b) => b.createdAt - a.createdAt);
}
