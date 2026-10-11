import { maxScaleFor } from "../AppText";

describe("maxScaleFor", () => {
    it("leaves Quran text to its own size setting", () => {
        expect(maxScaleFor("arabic")).toBe(1);
    });

    it("caps big headings tighter than body text", () => {
        expect(maxScaleFor("display")).toBeLessThan(maxScaleFor("body"));
        expect(maxScaleFor("title")).toBeLessThan(maxScaleFor("body"));
    });

    it("lets body text grow the most", () => {
        expect(maxScaleFor("body")).toBeGreaterThanOrEqual(1.5);
        expect(maxScaleFor("bodyStrong")).toBe(maxScaleFor("body"));
    });
});
