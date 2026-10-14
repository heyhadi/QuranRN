import { HIJAIYAH } from "@/constants/hijaiyah";
import { hasClip } from "../learnReadAudio";

describe("learn to read audio", () => {
    it("has a name clip for every letter", () => {
        expect(HIJAIYAH.filter((letter) => !hasClip("name", letter.id)).map((letter) => letter.id)).toEqual([]);
    });

    it("has fathah, kasrah, and dammah clips for all letters", () => {
        expect(HIJAIYAH.filter((letter) => !hasClip("fathah", letter.id)).map((letter) => letter.id)).toEqual([]);
        expect(HIJAIYAH.filter((letter) => !hasClip("kasrah", letter.id)).map((letter) => letter.id)).toEqual([]);
        expect(HIJAIYAH.filter((letter) => !hasClip("dammah", letter.id)).map((letter) => letter.id)).toEqual([]);
    });

    it("knows nothing about letters outside the alphabet", () => {
        expect(hasClip("name", "lam-alif")).toBe(false);
    });
});
