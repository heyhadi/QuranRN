import { decodeEntities, htmlToBlocks, parseTranslation, translationText } from "../richText";

// Snippets below are real api.quran.com responses.
const HALEEM = "In the name of Allāh,<sup foot_note=195932>1</sup> the Entirely Merciful, the Especially Merciful.<sup foot_note=195931>2</sup>";
const IBN_KATHIR = "<h2>Which was revealed in Makkah</h2><h2>The Reason for the Revelation</h2><p>Imam Ahmad recorded that the idolators said, &quot;O Muhammad!&quot;</p><p>بِسْمِ اللَّهِ</p>";

describe("parseTranslation", () => {
    it("separates footnote markers from the text, keeping their ids", () => {
        const segments = parseTranslation(HALEEM);

        expect(segments.map((segment) => segment.footnoteId ?? null)).toEqual([null, 195932, null, 195931]);
        expect(segments[1].text).toBe("1");
    });

    it("marks italic words, which a translator uses for additions", () => {
        const segments = parseTranslation('He is <i class="s">the</i> One');

        expect(segments).toEqual([{ text: "He is " }, { text: "the", italic: true }, { text: " One" }]);
    });

    it("strips any other tag and decodes entities", () => {
        expect(parseTranslation("Say, &quot;He is <b>Allāh</b>&quot;")).toEqual([{ text: 'Say, "He is Allāh"' }]);
    });

    it("returns plain text for text without markup", () => {
        expect(parseTranslation("Alif Lām Mīm.")).toEqual([{ text: "Alif Lām Mīm." }]);
    });
});

describe("translationText", () => {
    it("drops footnote markers", () => {
        expect(translationText(HALEEM)).toBe("In the name of Allāh, the Entirely Merciful, the Especially Merciful.");
    });
});

describe("htmlToBlocks", () => {
    it("splits tafsir into headings and paragraphs", () => {
        const blocks = htmlToBlocks(IBN_KATHIR);

        expect(blocks.map((block) => block.kind)).toEqual(["heading", "heading", "paragraph", "paragraph"]);
        expect(blocks[2].text).toBe('Imam Ahmad recorded that the idolators said, "O Muhammad!"');
        expect(blocks[3].text).toBe("بِسْمِ اللَّهِ");
    });

    it("keeps loose text outside any tag", () => {
        expect(htmlToBlocks("Just text")).toEqual([{ kind: "paragraph", text: "Just text" }]);
    });

    it("turns <br> into line breaks", () => {
        expect(htmlToBlocks("<p>one<br>two</p>")[0].text).toBe("one\ntwo");
    });

    it("returns nothing for empty input", () => {
        expect(htmlToBlocks("")).toEqual([]);
    });
});

describe("decodeEntities", () => {
    it("decodes named and numeric entities and leaves unknown ones alone", () => {
        expect(decodeEntities("a &amp; b &#8217; &#x2019; &unknown;")).toBe("a & b ’ ’ &unknown;");
    });
});
