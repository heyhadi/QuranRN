import { ayahAudioUrl, DEFAULT_RECITER_ID, getReciter, legacyReciterIds, reciters } from "../reciters";

describe("reciter catalogue", () => {
    it("has unique ids and a valid default", () => {
        const ids = reciters.map((reciter) => reciter.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids).toContain(DEFAULT_RECITER_ID);
    });

    it("maps every legacy equran.id id to a reciter in the catalogue", () => {
        for (const id of Object.values(legacyReciterIds)) {
            expect(reciters.some((reciter) => reciter.id === id)).toBe(true);
        }
    });

    it("has an Arabic tile name and at least one style for every reciter", () => {
        for (const reciter of reciters) {
            expect(reciter.arabic).toMatch(/[؀-ۿ]/);
            expect(reciter.styles.length).toBeGreaterThan(0);
        }
    });

    it("falls back to the default reciter for an unknown id", () => {
        expect(getReciter("nobody").id).toBe(DEFAULT_RECITER_ID);
    });
});

describe("ayahAudioUrl", () => {
    it("pads the Surah and ayah to three digits", () => {
        expect(ayahAudioUrl("alafasy", 2, 255)).toBe("https://everyayah.com/data/Alafasy_128kbps/002255.mp3");
        expect(ayahAudioUrl("alafasy", 1, 1)).toBe("https://everyayah.com/data/Alafasy_128kbps/001001.mp3");
        expect(ayahAudioUrl("alafasy", 114, 6)).toBe("https://everyayah.com/data/Alafasy_128kbps/114006.mp3");
    });

    it("uses equran.id's CDN for its own reciters", () => {
        expect(ayahAudioUrl("juhany", 112, 1)).toBe("https://cdn.equran.id/audio-partial/Abdullah-Al-Juhany/112001.mp3");
    });

    it("keeps the sub-folder of the English audio translation", () => {
        expect(ayahAudioUrl("basfar-walk", 1, 2)).toBe("https://everyayah.com/data/MultiLanguage/Basfar_Walk_192kbps/001002.mp3");
    });
});
