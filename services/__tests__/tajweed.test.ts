import { tajweedRules } from "@/constants/tajweed";
import { mapTajweedChapter, parseTajweed, plainText, type QuranComTajweedResponse } from "../tajweed";
import fixture from "./fixtures/tajweed.json";

// Fixture: real api.quran.com text_uthmani_tajweed for Surahs 112 and 113 plus one short example ayah per rule.
const verse = (key: string) => fixture.verses.find((candidate) => candidate.verse_key === key)!.text_uthmani_tajweed;
/** The same markup with every tag and the ayah-end marker removed: what the reader must still show. */
const stripped = (markup: string) => markup.replace(/<span class=end>.*?<\/span>/g, "").replace(/<[^>]+>/g, "").trim();

describe("parseTajweed", () => {
    it("splits marked letters from plain text and keeps the order", () => {
        const segments = parseTajweed(verse("112:1"));

        expect(segments.map((segment) => segment.rule ?? null)).toEqual([null, "ham_wasl", null, "qalaqah", null]);
        expect(plainText(segments)).toBe(stripped(verse("112:1")));
    });

    it("drops the ayah-end marker", () => {
        expect(verse("112:1")).toContain("<span class=end>");

        expect(plainText(parseTajweed(verse("112:1")))).not.toMatch(/[١٢٣٤٥]/);
    });

    it("maps quran.com's slnt class to our silent rule", () => {
        const rules = parseTajweed(verse("20:28")).map((segment) => segment.rule);

        expect(rules).toContain("silent");
    });

    it("keeps text with an unknown class as plain text instead of losing it", () => {
        const segments = parseTajweed("أ<tajweed class=brand_new>ب</tajweed>ج");

        expect(plainText(segments)).toBe("أبج");
        expect(segments.every((segment) => !segment.rule)).toBe(true);
    });

    it("returns plain text unchanged when there is no markup", () => {
        expect(parseTajweed("بِسْمِ ٱللَّهِ")).toEqual([{ text: "بِسْمِ ٱللَّهِ" }]);
    });

    it("handles an empty string", () => {
        expect(parseTajweed("")).toEqual([]);
    });
});

describe("example ayahs", () => {
    it.each(tajweedRules.filter((rule) => fixture.verses.some((candidate) => candidate.verse_key === rule.example)))("$id: $example really contains the rule", (rule) => {
        const rules = parseTajweed(verse(rule.example)).map((segment) => segment.rule);

        expect(rules).toContain(rule.id);
    });

    it("has a fixture verse for every rule's example", () => {
        const missing = tajweedRules.filter((rule) => !fixture.verses.some((candidate) => candidate.verse_key === rule.example));

        expect(missing.map((rule) => rule.id)).toEqual([]);
    });
});

describe("mapTajweedChapter", () => {
    it("keys segments by ayah number", () => {
        const response: QuranComTajweedResponse = { verses: fixture.verses.filter((candidate) => candidate.verse_key.startsWith("112:")) };

        const byAyah = mapTajweedChapter(response);

        expect(Object.keys(byAyah)).toEqual(["1", "2", "3", "4"]);
        expect(plainText(byAyah[2])).toBe(stripped(verse("112:2")));
    });
});
