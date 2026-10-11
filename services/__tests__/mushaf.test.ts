import { firstPageOf, MUSHAF_PAGES, SURAH_FIRST_PAGE, SURAH_LAST_PAGE, surahOnPage } from "@/constants/surahPages";
import { isValidMushafPage, mapMushafPage, type MushafPageResponse } from "../mushaf";
import page1 from "./fixtures/mushafPage1.json";
import page2 from "./fixtures/mushafPage2.json";
import page187 from "./fixtures/mushafPage187.json";
import page604 from "./fixtures/mushafPage604.json";

// Fixtures: real responses from api.quran.com/api/v4/verses/by_page/{n}, trimmed to the fields read.

const kinds = (response: MushafPageResponse, page: number) => mapMushafPage(response, page).lines.map((line) => `${line.lineNumber}:${line.kind}`);

describe("mapMushafPage", () => {
    it("gives Al-Fatihah a title line and then its seven ayahs (the bismillah is ayah 1)", () => {
        const page = mapMushafPage(page1, 1);

        expect(page.lines[0]).toEqual({ kind: "header", lineNumber: 1, surahNumber: 1 });
        expect(page.lines.filter((line) => line.kind === "text")).toHaveLength(7);
        expect(page.lines.some((line) => line.kind === "bismillah")).toBe(false);
    });

    it("puts the title and the bismillah before a Surah that starts mid-page", () => {
        expect(kinds(page2, 2).slice(0, 3)).toEqual(["1:header", "2:bismillah", "3:text"]);
    });

    it("gives At-Tawbah a title line only", () => {
        const [first, second] = mapMushafPage(page187, 187).lines;

        expect(first).toEqual({ kind: "header", lineNumber: 1, surahNumber: 9 });
        expect(second.kind).toBe("text");
        expect(mapMushafPage(page187, 187).lines.some((line) => line.kind === "bismillah")).toBe(false);
    });

    it("fills all fifteen lines of a page that holds three short Surahs", () => {
        const page = mapMushafPage(page604, 604);

        expect(page.lines.map((line) => line.lineNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
        expect(page.lines.filter((line) => line.kind === "header").map((line) => (line.kind === "header" ? line.surahNumber : 0))).toEqual([112, 113, 114]);
        expect(page.lines.filter((line) => line.kind === "bismillah")).toHaveLength(3);
    });

    it("keeps each word's Surah and ayah and marks the ayah-end circles", () => {
        const lines = mapMushafPage(page1, 1).lines.flatMap((line) => (line.kind === "text" ? line.words : []));

        expect(lines[0]).toMatchObject({ surahNumber: 1, ayahNumber: 1, isEnd: false });
        const ends = lines.filter((word) => word.isEnd);
        expect(ends.map((word) => word.ayahNumber)).toEqual([1, 2, 3, 4, 5, 6, 7]);
        expect(lines.every((word) => word.text.length > 0)).toBe(true);
    });

    it("keeps lines in page order", () => {
        for (const [response, number] of [[page1, 1], [page2, 2], [page187, 187], [page604, 604]] as const) {
            const numbers = mapMushafPage(response, number).lines.map((line) => line.lineNumber);
            expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
        }
    });
});

describe("tajweed on a page", () => {
    it("splits a word into coloured runs when the page has the markup", () => {
        const words = mapMushafPage(page2, 2).lines.flatMap((line) => (line.kind === "text" ? line.words : []));
        const first = words[0];

        expect(first.text).toBe("الٓمٓ");
        expect(first.segments?.map((segment) => segment.rule)).toEqual([undefined, "madda_necessary", "madda_necessary"]);
        expect(letters(first.segments!.map((segment) => segment.text).join(""))).toBe(letters("الٓمٓ"));
    });

    // The coloured text spells a few things differently from the plain text (a small sukun, hamza on alef
    // instead of a tatweel), so what is checked is that it holds only Arabic, with nothing left over from the markup.
    const ARABIC_ONLY = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u200C\u200D\s]+$/;
    const letters = (text: string) => text.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08FF\u200C\s]/g, "").normalize("NFC");

    it("holds only Arabic in the coloured text", () => {
        for (const [response, number] of [[page1, 1], [page2, 2], [page187, 187], [page604, 604]] as const) {
            const words = mapMushafPage(response, number).lines.flatMap((line) => (line.kind === "text" ? line.words : []));
            for (const word of words.filter((entry) => entry.segments)) {
                for (const segment of word.segments!) expect(segment.text).toMatch(ARABIC_ONLY);
            }
        }
    });

    it("never leaves markup in the text, including the empty alef-maksora tag", () => {
        for (const [response, number] of [[page1, 1], [page2, 2], [page187, 187], [page604, 604]] as const) {
            const words = mapMushafPage(response, number).lines.flatMap((line) => (line.kind === "text" ? line.words : []));
            for (const word of words) for (const segment of word.segments ?? []) expect(segment.text).not.toMatch(/[<>]/);
        }
    });

    it("gives the ayah-end circles no colouring", () => {
        const words = mapMushafPage(page1, 1).lines.flatMap((line) => (line.kind === "text" ? line.words : []));
        expect(words.filter((word) => word.isEnd).every((word) => word.segments === undefined)).toBe(true);
    });
});

describe("Surah pages", () => {
    it("lists a first and last page for every Surah, in order", () => {
        expect(SURAH_FIRST_PAGE).toHaveLength(114);
        expect(SURAH_LAST_PAGE).toHaveLength(114);
        expect(SURAH_FIRST_PAGE[0]).toBe(1);
        expect(SURAH_LAST_PAGE[113]).toBe(MUSHAF_PAGES);
        for (let i = 0; i < 114; i++) {
            expect(SURAH_LAST_PAGE[i]).toBeGreaterThanOrEqual(SURAH_FIRST_PAGE[i]);
            if (i > 0) expect(SURAH_FIRST_PAGE[i]).toBeGreaterThanOrEqual(SURAH_FIRST_PAGE[i - 1]);
        }
    });

    it("finds where a Surah starts and which Surah is on a page", () => {
        expect(firstPageOf(2)).toBe(2);
        expect(firstPageOf(9)).toBe(187);
        expect(firstPageOf(112)).toBe(604);
        expect(surahOnPage(1)).toBe(1);
        expect(surahOnPage(49)).toBe(2);
        expect(surahOnPage(50)).toBe(3);
        expect(surahOnPage(604)).toBe(114);
    });

    it("accepts only whole pages 1 to 604", () => {
        expect([1, 604].every(isValidMushafPage)).toBe(true);
        expect([0, 605, 1.5, NaN].some(isValidMushafPage)).toBe(false);
    });
});
