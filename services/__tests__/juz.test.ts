import { juzOf, juzStarts } from "../juz";

describe("juzStarts", () => {
    it("lists all 30 Juz in reading order", () => {
        expect(juzStarts.map((start) => start.juz)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
        for (let i = 1; i < juzStarts.length; i++) {
            const previous = juzStarts[i - 1];
            const current = juzStarts[i];
            const isLater =
                current.surahNumber > previous.surahNumber ||
                (current.surahNumber === previous.surahNumber && current.ayahNumber > previous.ayahNumber);
            expect(isLater).toBe(true);
        }
    });
});

describe("juzOf", () => {
    it.each([
        [1, 1, 1],
        [2, 141, 1],
        [2, 142, 2],
        [2, 255, 3],
        [18, 1, 15],
        [18, 75, 16],
        [36, 1, 22],
        [114, 6, 30],
    ])("puts %i:%i in Juz %i", (surah, ayah, juz) => {
        expect(juzOf(surah, ayah)).toBe(juz);
    });
});
