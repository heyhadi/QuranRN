import { HIJAIYAH } from "@/constants/hijaiyah";
import { hasClip } from "../learnReadAudio";

describe("learn to read audio", () => {
    it("has a name clip for every letter", () => {
        expect(HIJAIYAH.filter((letter) => !hasClip("name", letter.id)).map((letter) => letter.id)).toEqual([]);
    });

    it("has no fathah clips yet, so lessons stay text-only for syllables", () => {
        expect(HIJAIYAH.some((letter) => hasClip("fathah", letter.id))).toBe(false);
    });

    it("knows nothing about letters outside the alphabet", () => {
        expect(hasClip("name", "lam-alif")).toBe(false);
    });
});
