import { tajweedRules } from "@/constants/tajweed";
import { mapTajweedChapter, parseTajweed, plainText, shapeSafe, type QuranComTajweedResponse } from "../tajweed";
import fixture from "./fixtures/tajweed.json";
import page604 from "./fixtures/mushafPage604.json";
import page187 from "./fixtures/mushafPage187.json";
import page2 from "./fixtures/mushafPage2.json";

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

describe("shapeSafe (drawing coloured text on Android)", () => {
    const ZWJ = "\u200D";
    const MARK = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED\u08D3-\u08FF]/;

    it("keeps a vowel mark with its letter instead of starting a run with it", () => {
        // ذ + a coloured dagger alef + لِكَ: the mark must not be cut off from the ذ.
        expect(shapeSafe([{ text: "ذ" }, { text: "ٰ", rule: "madda_normal" }, { text: "لِكَ" }])).toEqual([
            { text: "ذٰ", rule: "madda_normal" },
            { text: "لِكَ" },
        ]);
    });

    it("joins the letters on both sides of a colour boundary in the middle of a word", () => {
        expect(shapeSafe([{ text: "ب" }, { text: "س", rule: "qalaqah" }, { text: "م" }])).toEqual([
            { text: `ب${ZWJ}` },
            { text: `${ZWJ}س${ZWJ}`, rule: "qalaqah" },
            { text: `${ZWJ}م` },
        ]);
    });

    it("adds no joiner after a letter that never joins forward", () => {
        expect(shapeSafe([{ text: "ر" }, { text: "ب", rule: "qalaqah" }])).toEqual([{ text: "ر" }, { text: "ب", rule: "qalaqah" }]);
        expect(shapeSafe([{ text: "ٱ" }, { text: "ل", rule: "laam_shamsiyah" }])).toEqual([{ text: "ٱ" }, { text: "ل", rule: "laam_shamsiyah" }]);
    });

    it("adds no joiner before a space or a hamza on its own", () => {
        expect(shapeSafe([{ text: "ب" }, { text: " ", rule: "qalaqah" }])).toEqual([{ text: "ب" }, { text: " ", rule: "qalaqah" }]);
        expect(shapeSafe([{ text: "ب" }, { text: "ء", rule: "qalaqah" }])).toEqual([{ text: "ب" }, { text: "ء", rule: "qalaqah" }]);
    });

    it("merges neighbouring groups that share a rule and keeps the text intact", () => {
        const segments = [{ text: "مَ" }, { text: "ن", rule: "ghunnah" as const }, { text: "ّ", rule: "ghunnah" as const }, { text: "ا" }];
        const shaped = shapeSafe(segments);

        expect(plainText(shaped)).toBe("مَنّا");
        expect(shaped.filter((segment) => segment.rule === "ghunnah")).toHaveLength(1);
    });

    it("never changes the letters, never starts a run with a mark, and never leaves a joiner at the ends of a word", () => {
        for (const page of [page2, page187, page604]) {
            for (const verse of page.verses) {
                for (const word of verse.words) {
                    if (!word.text_uthmani_tajweed) continue;
                    const original = parseTajweed(word.text_uthmani_tajweed);
                    const shaped = shapeSafe(original);

                    expect(plainText(shaped)).toBe(plainText(original));
                    for (const run of shaped) expect(MARK.test(run.text.replace(ZWJ, "")[0] ?? "")).toBe(false);
                    expect(shaped[0]?.text.startsWith(ZWJ)).toBe(false);
                    expect(shaped[shaped.length - 1]?.text.endsWith(ZWJ)).toBe(false);
                }
            }
        }
    });
});
