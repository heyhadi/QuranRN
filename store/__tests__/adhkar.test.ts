import { adhkarKey, completedIn, countsFor, useAdhkarStore } from "../adhkar";

const monday = new Date(2026, 9, 12, 8);
const tuesday = new Date(2026, 9, 13, 8);

beforeEach(() => useAdhkarStore.setState({ day: "2026-10-12", counts: {} }));

describe("adhkar counts", () => {
    it("counts up to the repeat and no further", () => {
        const { recite } = useAdhkarStore.getState();
        expect(recite("morning", 1, 3, monday)).toBe(1);
        recite("morning", 1, 3, monday);
        recite("morning", 1, 3, monday);
        expect(recite("morning", 1, 3, monday)).toBe(3);
    });

    it("starts again on a new day", () => {
        useAdhkarStore.getState().recite("morning", 0, 1, monday);
        expect(countsFor(useAdhkarStore.getState(), tuesday)).toEqual({});
        expect(useAdhkarStore.getState().recite("morning", 0, 1, tuesday)).toBe(1);
        expect(useAdhkarStore.getState().day).toBe("2026-10-13");
    });

    it("tells how many entries of a set are complete", () => {
        const { recite } = useAdhkarStore.getState();
        recite("evening", 0, 1, monday);
        recite("evening", 1, 3, monday);
        const counts = countsFor(useAdhkarStore.getState(), monday);
        expect(completedIn(counts, "evening", [1, 3, 1])).toBe(1);
        expect(counts[adhkarKey("evening", 1)]).toBe(1);
    });

    it("resets one set only", () => {
        const { recite, resetSet } = useAdhkarStore.getState();
        recite("morning", 0, 1, monday);
        recite("evening", 0, 1, monday);
        resetSet("morning", monday);
        expect(useAdhkarStore.getState().counts).toEqual({ "evening:0": 1 });
    });
});
