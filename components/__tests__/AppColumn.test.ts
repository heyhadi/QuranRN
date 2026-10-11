import { COLUMN_MAX_WIDTH, isColumnCapped } from "../AppColumn";

describe("isColumnCapped", () => {
    it("leaves a phone at its full width", () => {
        expect(isColumnCapped(390, ["(tabs)"])).toBe(false);
        expect(isColumnCapped(COLUMN_MAX_WIDTH, ["(tabs)"])).toBe(false);
    });

    it("caps the app on a wide screen", () => {
        expect(isColumnCapped(820, ["(tabs)"])).toBe(true);
        expect(isColumnCapped(1194, ["surah", "[id]"])).toBe(true);
    });

    it("lets the mushaf use the whole width", () => {
        expect(isColumnCapped(1194, ["mushaf"])).toBe(false);
    });
});
