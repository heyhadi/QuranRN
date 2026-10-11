import { bookmarkKey, useBookmarksStore, type NewBookmark } from "../bookmarks";
import { useCollectionsStore } from "../collections";
import { useNotesStore } from "../notes";
import { storage } from "../storage";

const ayah = (surahNumber: number, ayahNumber: number): NewBookmark => ({ surahNumber, ayahNumber, surahNameLatin: `Surah ${surahNumber}`, textArabic: "…" });

beforeEach(() => {
    storage.clearAll();
    useNotesStore.setState({ notes: {} });
    useCollectionsStore.setState({ collections: [] });
    useBookmarksStore.setState({ bookmarks: {} });
});

describe("notes", () => {
    it("saves a trimmed note per ayah and removes it when emptied", () => {
        useNotesStore.getState().setNote(2, 255, "  Ayat al-Kursi, read before sleep  ");
        expect(useNotesStore.getState().notes[bookmarkKey(2, 255)].text).toBe("Ayat al-Kursi, read before sleep");

        useNotesStore.getState().setNote(2, 255, "   ");
        expect(useNotesStore.getState().notes).toEqual({});
    });

    it("keeps the same ayah number in different Surahs apart", () => {
        useNotesStore.getState().setNote(1, 5, "one");
        useNotesStore.getState().setNote(2, 5, "two");

        expect(Object.keys(useNotesStore.getState().notes).sort()).toEqual(["1:5", "2:5"]);
    });

    it("saves notes to device storage", () => {
        useNotesStore.getState().setNote(36, 1, "Ya Sin");

        expect(JSON.parse(storage.getString("notes") ?? "{}").state.notes["36:1"].text).toBe("Ya Sin");
    });
});

describe("collections", () => {
    it("adds collections with rotating colours and ignores blank or duplicate names", () => {
        const first = useCollectionsStore.getState().addCollection("Daily");
        const second = useCollectionsStore.getState().addCollection("Jumu'ah");

        expect(first?.color).not.toBe(second?.color);
        expect(useCollectionsStore.getState().addCollection("   ")).toBeNull();
        expect(useCollectionsStore.getState().addCollection("daily")?.id).toBe(first?.id);
        expect(useCollectionsStore.getState().collections).toHaveLength(2);
    });

    it("files a bookmark in a collection, bookmarking the ayah if needed", () => {
        const collection = useCollectionsStore.getState().addCollection("Daily")!;

        useBookmarksStore.getState().setCollection(ayah(18, 10), collection.id);

        expect(useBookmarksStore.getState().bookmarks[bookmarkKey(18, 10)].collectionId).toBe(collection.id);
    });

    it("moves a bookmark out of a collection", () => {
        const collection = useCollectionsStore.getState().addCollection("Daily")!;
        useBookmarksStore.getState().setCollection(ayah(18, 10), collection.id);

        useBookmarksStore.getState().setCollection(ayah(18, 10), null);

        expect(useBookmarksStore.getState().bookmarks[bookmarkKey(18, 10)].collectionId).toBeUndefined();
    });

    it("keeps bookmarks when their collection is deleted", () => {
        const collection = useCollectionsStore.getState().addCollection("Daily")!;
        useBookmarksStore.getState().setCollection(ayah(18, 10), collection.id);

        useCollectionsStore.getState().removeCollection(collection.id);

        const bookmark = useBookmarksStore.getState().bookmarks[bookmarkKey(18, 10)];
        expect(bookmark).toBeDefined();
        expect(bookmark.collectionId).toBeUndefined();
    });
});
