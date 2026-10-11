jest.mock("expo-file-system", () => ({ Directory: class {}, File: class {}, Paths: { cache: {} } }));

import { cacheNameFor, formatBytes, planEviction, type CacheEntry } from "../audioCache";

const MB = 1024 * 1024;
const file = (name: string, size: number, modified: number): CacheEntry => ({ name, size, modified });

describe("cacheNameFor", () => {
    it("turns an everyayah URL into one flat file name", () => {
        expect(cacheNameFor("https://everyayah.com/data/Alafasy_128kbps/002255.mp3")).toBe("Alafasy_128kbps_002255.mp3");
        expect(cacheNameFor("https://everyayah.com/data/MultiLanguage/Basfar_Walk_192kbps/001002.mp3")).toBe("MultiLanguage_Basfar_Walk_192kbps_001002.mp3");
    });

    it("turns an equran.id URL into one flat file name", () => {
        expect(cacheNameFor("https://cdn.equran.id/audio-partial/Abdullah-Al-Juhany/112001.mp3")).toBe("Abdullah-Al-Juhany_112001.mp3");
    });

    it("gives different quality folders different names", () => {
        expect(cacheNameFor("https://everyayah.com/data/Alafasy_64kbps/002255.mp3")).not.toBe(cacheNameFor("https://everyayah.com/data/Alafasy_128kbps/002255.mp3"));
    });
});

describe("planEviction", () => {
    it("removes nothing while the cache fits", () => {
        expect(planEviction([file("a", 10 * MB, 1), file("b", 10 * MB, 2)], 50 * MB)).toEqual([]);
    });

    it("removes the oldest files first, and only as many as needed", () => {
        const files = [file("new", 40 * MB, 30), file("old", 40 * MB, 10), file("mid", 40 * MB, 20)];

        expect(planEviction(files, 90 * MB)).toEqual(["old"]);
        expect(planEviction(files, 50 * MB)).toEqual(["old", "mid"]);
    });

    it("can empty the cache when the limit is zero", () => {
        expect(planEviction([file("a", 1, 1), file("b", 1, 2)], 0)).toEqual(["a", "b"]);
    });
});

describe("formatBytes", () => {
    it("writes a size people can read", () => {
        expect(formatBytes(0)).toBe("0 KB");
        expect(formatBytes(512 * 1024)).toBe("512 KB");
        expect(formatBytes(38 * MB)).toBe("38 MB");
        expect(formatBytes(1.5 * 1024 * MB)).toBe("1.5 GB");
    });
});
