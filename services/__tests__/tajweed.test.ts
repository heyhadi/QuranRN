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

describe("parseTajweed with the per-word tag", () => {
    it("reads <rule class=…> the same way as <tajweed class=…>", () => {
        expect(parseTajweed("ا<rule class=madda_necessary>لٓ</rule><rule class=madda_necessary>مٓ</rule>")).toEqual([
            { text: "ا" },
            { text: "لٓ", rule: "madda_necessary" },
            { text: "مٓ", rule: "madda_necessary" },
        ]);
    });
});

describe("parseTajweed with nested rules", () => {
    it("colours the inner rule's letters with the inner rule and the rest with the outer one", () => {
        const markup = "تُسۡرِف<rule class=madda_obligatory_monfasel>ُوٓ<rule class=slnt>اۡ</rule>\u200cۚ</rule>";

        expect(parseTajweed(markup)).toEqual([
            { text: "تُسۡرِف" },
            { text: "ُوٓ", rule: "madda_permissible" },
            { text: "اۡ", rule: "silent" },
            { text: "\u200cۚ", rule: "madda_permissible" },
        ]);
    });

    it("lets a wrapper class we do not know leave its letters to the rule around it", () => {
        expect(parseTajweed("ذ<rule class=madda_normal><rule class=custom-alef-maksora>ٰ</rule></rule>لِكَ")).toEqual([{ text: "ذ" }, { text: "ٰ", rule: "madda_normal" }, { text: "لِكَ" }]);
    });

    it("leaves no markup behind", () => {
        const parsed = parseTajweed("a<rule class=qalaqah>b<rule class=slnt>c</rule></rule>d<span class=end>٢</span>");
        expect(parsed.map((segment) => segment.text).join("")).toBe("abcd");
    });
});

describe("the mushaf's two obligatory madd classes", () => {
    it("reads the connected madd as obligatory and the separated madd as permissible", () => {
        expect(parseTajweed("<rule class=madda_obligatory_mottasel>ءَا</rule>")[0].rule).toBe("madda_obligatory");
        expect(parseTajweed("<rule class=madda_obligatory_monfasel>ءَا</rule>")[0].rule).toBe("madda_permissible");
    });
});
