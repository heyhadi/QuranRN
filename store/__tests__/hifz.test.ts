import { memorizedCount, surahsInProgress, useHifzStore } from "../hifz";
import { storage } from "../storage";

const state = () => useHifzStore.getState();

beforeEach(() => {
    storage.clearAll();
    useHifzStore.setState({ memorized: {}, reciterId: "husary-muallim", repeatEach: 3, pauseSeconds: 2, hideText: false });
});

describe("memorized ayahs", () => {
    it("marks and unmarks one ayah", () => {
        state().setMemorized(112, 1, true);
        expect(state().memorized).toEqual({ "112:1": true });

        state().setMemorized(112, 1, false);
        expect(state().memorized).toEqual({});
    });

    it("marks a range in either order", () => {
        state().setRangeMemorized(112, 3, 1, true);

        expect(Object.keys(state().memorized).sort()).toEqual(["112:1", "112:2", "112:3"]);

        state().setRangeMemorized(112, 2, 3, false);
        expect(Object.keys(state().memorized)).toEqual(["112:1"]);
    });

    it("keeps the same ayah number in different Surahs apart", () => {
        state().setMemorized(1, 5, true);
        state().setMemorized(2, 5, true);

        expect(memorizedCount(state().memorized, 1)).toBe(1);
        expect(memorizedCount(state().memorized, 2)).toBe(1);
        expect(memorizedCount(state().memorized, 12)).toBe(0);
    });

    it("does not confuse Surah 1 with Surah 11 or 112 when counting", () => {
        state().setRangeMemorized(112, 1, 4, true);
        state().setRangeMemorized(11, 1, 2, true);

        expect(memorizedCount(state().memorized, 1)).toBe(0);
        expect(memorizedCount(state().memorized, 11)).toBe(2);
    });
});

describe("surahsInProgress", () => {
    it("lists Surahs with progress, in order, with counts", () => {
        state().setRangeMemorized(112, 1, 4, true);
        state().setRangeMemorized(1, 1, 3, true);

        expect(surahsInProgress(state().memorized)).toEqual([
            { surahNumber: 1, count: 3 },
            { surahNumber: 112, count: 4 },
        ]);
    });
});

describe("practice settings", () => {
    it("saves them to device storage", () => {
        state().setRepeatEach(5);
        state().setPauseSeconds(4);
        state().setHideText(true);

        expect(JSON.parse(storage.getString("hifz") ?? "{}").state).toMatchObject({ repeatEach: 5, pauseSeconds: 4, hideText: true });
    });
});
