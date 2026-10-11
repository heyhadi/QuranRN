import { mapChapterMeanings, mapSurahDetail, mapSurahList, mapTafsir } from "../mappers";
import chaptersEnResponse from "./fixtures/chaptersEn.json";
import surahListResponse from "./fixtures/surahList.json";
import surah112Response from "./fixtures/surah112.json";
import tafsir112Response from "./fixtures/tafsir112.json";

// Fixtures are trimmed copies of real equran.id v2 responses.

describe("mapSurahList", () => {
    it("maps each Surah to the app's summary shape", () => {
        const surahs = mapSurahList(surahListResponse);

        expect(surahs).toHaveLength(3);
        expect(surahs[2]).toEqual({
            number: 112,
            nameArabic: "الاخلاص",
            nameLatin: "Al-Ikhlas",
            meaning: "Ikhlas",
            ayahCount: 4,
            revelationPlace: "Mekah",
        });
    });

    it("keeps Madinah Surahs as Madinah", () => {
        const [, alBaqarah] = mapSurahList(surahListResponse);

        expect(alBaqarah.revelationPlace).toBe("Madinah");
    });
});

describe("mapSurahDetail", () => {
    it("numbers ayahs from nomorAyat and tags each with its Surah", () => {
        const surah = mapSurahDetail(surah112Response);

        expect(surah.ayahs.map((ayah) => [ayah.surahNumber, ayah.ayahNumber])).toEqual([
            [112, 1],
            [112, 2],
        ]);
        expect(surah.ayahs[0].transliteration).toBe("Qul huwallāhu aḥad(un).");
        expect(surah.ayahs[0].audio["05"]).toMatch(/Misyari-Rasyid-Al-Afasi\/112001\.mp3$/);
    });

    it("maps neighbouring Surahs", () => {
        const surah = mapSurahDetail(surah112Response);

        expect(surah.next).toEqual({ number: 113, nameLatin: "Al-Falaq" });
        expect(surah.previous).toEqual({ number: 111, nameLatin: "Al-Lahab" });
    });

    it("turns equran's `false` neighbour at the start of the Quran into null", () => {
        const firstSurah = { ...surah112Response, data: { ...surah112Response.data, suratSebelumnya: false as const } };

        expect(mapSurahDetail(firstSurah).previous).toBeNull();
    });
});

describe("mapTafsir", () => {
    it("maps tafsir entries by ayah number", () => {
        const tafsir = mapTafsir(tafsir112Response);

        expect(tafsir.map((entry) => entry.ayahNumber)).toEqual([1, 2]);
        expect(tafsir[0].text).toMatch(/^Pada ayat ini/);
    });
});

describe("mapChapterMeanings", () => {
    it("keys quran.com's English meanings by Surah number", () => {
        // Fixture: trimmed copy of a real api.quran.com/api/v4/chapters?language=en response.
        expect(mapChapterMeanings(chaptersEnResponse)).toEqual({ 1: "The Opener", 18: "The Cave", 112: "The Sincerity" });
    });
});
