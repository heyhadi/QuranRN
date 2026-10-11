import { mapSearch, mapTafsir, mapTranslations, mapWords } from "../quranCom";
import search from "./fixtures/search_patience.json";
import tafsir from "./fixtures/tafsir169_112_1.json";
import translation from "./fixtures/translation20_112.json";
import words from "./fixtures/words112_1.json";

// Fixtures: trimmed copies of real api.quran.com v4 responses.

describe("mapTranslations", () => {
    it("keys each translation by ayah number, counting from 1", () => {
        const byAyah = mapTranslations(translation);

        expect(Object.keys(byAyah)).toEqual(["1", "2", "3", "4"]);
        expect(byAyah[1]).toContain("He is Allāh");
    });
});

describe("mapWords", () => {
    it("keeps the words and drops the ayah-end marker", () => {
        const result = mapWords(words);

        expect(result.map((word) => word.transliteration)).toEqual(["qul", "huwa", "l-lahu", "aḥadun"]);
        expect(result[3]).toMatchObject({ position: 4, meaning: "the One" });
    });

    it("turns the relative audio path into a full URL", () => {
        expect(mapWords(words)[0].audioUrl).toBe("https://verses.quran.com/wbw/112_001_001.mp3");
    });

    it("uses empty strings and a null URL when a word has no data", () => {
        const sparse = { verse: { words: [{ position: 1, char_type_name: "word", text_uthmani: null, transliteration: { text: null }, translation: { text: null }, audio_url: null }] } };

        expect(mapWords(sparse)).toEqual([{ position: 1, arabic: "", transliteration: "", meaning: "", audioUrl: null }]);
    });
});

describe("mapTafsir", () => {
    it("returns the edition name and the HTML", () => {
        const result = mapTafsir(tafsir);

        expect(result.editionName).toBe("Ibn Kathir (Abridged)");
        expect(result.html).toMatch(/^<h2>/);
    });
});

describe("mapSearch", () => {
    it("splits the verse key and keeps the matched snippet", () => {
        const [first] = mapSearch(search);

        expect(first).toMatchObject({ surahNumber: 70, ayahNumber: 5 });
        expect(first.snippet).toContain("<em>patience</em>");
    });
});
