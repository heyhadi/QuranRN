import { bookmarkKey, sortBookmarks, useBookmarksStore, type NewBookmark } from "../bookmarks";
import { storage } from "../storage";

const ayah = (surahNumber: number, ayahNumber: number): NewBookmark => ({
    surahNumber,
    ayahNumber,
    surahNameLatin: `Surah ${surahNumber}`,
    textArabic: "…",
});

beforeEach(() => {
    useBookmarksStore.setState({ bookmarks: {} });
    storage.clearAll();
});

describe("bookmarks store", () => {
    it("keeps the same ayah number in different Surahs as separate bookmarks", () => {
        const { addBookmark, removeBookmark } = useBookmarksStore.getState();
        addBookmark(ayah(1, 5));
        addBookmark(ayah(2, 5));

        removeBookmark(2, 5);

        expect(Object.keys(useBookmarksStore.getState().bookmarks)).toEqual([bookmarkKey(1, 5)]);
    });

    it("toggles a bookmark on and off and reports the new state", () => {
        const { toggleBookmark } = useBookmarksStore.getState();

        expect(toggleBookmark(ayah(18, 10))).toBe(true);
        expect(bookmarkKey(18, 10) in useBookmarksStore.getState().bookmarks).toBe(true);

        expect(toggleBookmark(ayah(18, 10))).toBe(false);
        expect(useBookmarksStore.getState().bookmarks).toEqual({});
    });

    it("saves bookmarks to device storage", () => {
        useBookmarksStore.getState().addBookmark(ayah(36, 1));

        const saved = JSON.parse(storage.getString("bookmarks") ?? "{}");
        expect(Object.keys(saved.state.bookmarks)).toEqual([bookmarkKey(36, 1)]);
    });
});

describe("sortBookmarks", () => {
    it("lists the newest bookmark first", () => {
        const older = { ...ayah(1, 1), createdAt: 1 };
        const newer = { ...ayah(2, 1), createdAt: 2 };

        expect(sortBookmarks({ a: older, b: newer })).toEqual([newer, older]);
    });
});
