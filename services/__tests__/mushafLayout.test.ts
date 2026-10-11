import { listIndexOf, MAX_SINGLE_WIDTH, mushafLayout, pageAt, pagesOfSpread, SPREADS, spreadIndexOf } from "../mushafLayout";

describe("mushafLayout", () => {
    it("shows one page on a phone, as wide as the screen allows", () => {
        const layout = mushafLayout(390, 760, 34);

        expect(layout.spread).toBe(false);
        expect(layout.pageWidth).toBe(358);
        expect(layout.pageHeight).toBe(726);
    });

    it("keeps the page's proportions on a tall tablet instead of stretching it", () => {
        const layout = mushafLayout(820, 1100, 34);

        expect(layout.spread).toBe(false);
        expect(layout.pageWidth).toBeCloseTo(layout.pageHeight * 0.55, 5);
        expect(layout.pageWidth).toBeLessThanOrEqual(MAX_SINGLE_WIDTH);
    });

    it("shows a two-page spread when a tablet is turned sideways", () => {
        const layout = mushafLayout(1194, 780, 34);

        expect(layout.spread).toBe(true);
        expect(layout.pageWidth * 2).toBeLessThan(1194);
        expect(layout.pageWidth).toBeCloseTo(layout.pageHeight * 0.55, 5);
    });

    it("falls back to one page when two would not fit", () => {
        expect(mushafLayout(700, 780, 34).spread).toBe(false);
    });
});

describe("spreads", () => {
    it("pairs an odd page on the right with the even page facing it", () => {
        expect(pagesOfSpread(0)).toEqual([1, 2]);
        expect(pagesOfSpread(64)).toEqual([129, 130]);
        expect(pagesOfSpread(SPREADS - 1)).toEqual([603, 604]);
    });

    it("has 302 spreads for the 604 pages", () => {
        expect(SPREADS).toBe(302);
    });

    it("maps a page to its list position and back", () => {
        expect(spreadIndexOf(1)).toBe(0);
        expect(spreadIndexOf(2)).toBe(0);
        expect(spreadIndexOf(130)).toBe(64);
        expect(listIndexOf(130, true)).toBe(64);
        expect(listIndexOf(130, false)).toBe(129);
        expect(pageAt(64, true)).toBe(129);
        expect(pageAt(129, false)).toBe(130);
    });
});
