import { AYAH_COUNTS } from "@/constants/ayahCounts";
import { DAILY_AYAHS, dailyAyahFor } from "@/constants/dailyAyahs";

describe("daily ayah list", () => {
    it("only names ayahs that exist, with no repeats", () => {
        for (const reference of DAILY_AYAHS) {
            const [surah, ayah] = reference.split(":").map(Number);
            expect(surah).toBeGreaterThanOrEqual(1);
            expect(surah).toBeLessThanOrEqual(114);
            expect(ayah).toBeGreaterThanOrEqual(1);
            expect(ayah).toBeLessThanOrEqual(AYAH_COUNTS[surah - 1]);
        }
        expect(new Set(DAILY_AYAHS).size).toBe(DAILY_AYAHS.length);
    });
});

describe("dailyAyahFor", () => {
    it("gives the same ayah for the same day, whatever the time", () => {
        expect(dailyAyahFor(new Date(2026, 9, 11, 0, 5))).toBe(dailyAyahFor(new Date(2026, 9, 11, 23, 55)));
    });

    it("moves to a different ayah the next day and cycles through the whole list", () => {
        const seen = new Set<string>();
        for (let day = 0; day < DAILY_AYAHS.length; day++) seen.add(dailyAyahFor(new Date(2026, 0, 1 + day)));

        expect(dailyAyahFor(new Date(2026, 9, 11))).not.toBe(dailyAyahFor(new Date(2026, 9, 12)));
        expect(seen.size).toBe(DAILY_AYAHS.length);
    });
});
