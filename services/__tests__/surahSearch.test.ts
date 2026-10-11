import { filterSurahs } from "../surahSearch";
import type { SurahSummary } from "../types";

const surah = (number: number, nameLatin: string, meaning: string): SurahSummary => ({
    number,
    nameLatin,
    meaning,
    nameArabic: "",
    ayahCount: 1,
    revelationPlace: "Mekah",
});

const surahs = [surah(1, "Al-Fatihah", "Pembukaan"), surah(2, "Al-Baqarah", "Sapi"), surah(18, "Al-Kahf", "Gua"), surah(112, "Al-Ikhlas", "Ikhlas")];

describe("filterSurahs", () => {
    it("returns every Surah for an empty query", () => {
        expect(filterSurahs(surahs, "  ")).toEqual(surahs);
    });

    it("ignores case, spaces and hyphens in names", () => {
        expect(filterSurahs(surahs, "al baqarah").map((s) => s.number)).toEqual([2]);
        expect(filterSurahs(surahs, "ALKAHF").map((s) => s.number)).toEqual([18]);
    });

    it("matches the meaning", () => {
        expect(filterSurahs(surahs, "gua").map((s) => s.number)).toEqual([18]);
    });

    it("matches a number exactly, not as a substring", () => {
        expect(filterSurahs(surahs, "2").map((s) => s.number)).toEqual([2]);
        expect(filterSurahs(surahs, "112").map((s) => s.number)).toEqual([112]);
    });

    it("returns nothing when no Surah matches", () => {
        expect(filterSurahs(surahs, "zzz")).toEqual([]);
    });
});
