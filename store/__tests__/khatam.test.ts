import { countCovered } from "@/services/khatam";
import { useKhatamStore } from "../khatam";
import { storage } from "../storage";

const day = (iso: string) => {
    const [year, month, date] = iso.split("-").map(Number);
    return new Date(year, month - 1, date, 12);
};
const state = () => useKhatamStore.getState();

beforeEach(() => {
    storage.clearAll();
    useKhatamStore.setState({ plan: null, read: [], log: {}, completedRounds: 0 });
});

describe("recording reading", () => {
    it("counts each ayah once, however many times it is seen", () => {
        state().recordRead(112, [1, 2, 3], day("2026-10-11"));
        state().recordRead(112, [2, 3, 4], day("2026-10-11"));

        expect(countCovered(state().read)).toBe(4);
        expect(state().log["2026-10-11"]).toBe(4);
    });

    it("adds to the right day", () => {
        state().recordRead(1, [1, 2], day("2026-10-10"));
        state().recordRead(1, [3, 4, 5], day("2026-10-11"));

        expect(state().log).toEqual({ "2026-10-10": 2, "2026-10-11": 3 });
    });

    it("does not log anything when nothing new was read", () => {
        state().recordRead(1, [1, 2], day("2026-10-10"));
        state().recordRead(1, [1, 2], day("2026-10-11"));

        expect(state().log).toEqual({ "2026-10-10": 2 });
    });

    it("keeps ayahs of different Surahs apart", () => {
        state().recordRead(1, [5], day("2026-10-11"));
        state().recordRead(2, [5], day("2026-10-11"));

        expect(countCovered(state().read)).toBe(2);
    });

    it("saves to device storage", () => {
        state().recordRead(112, [1], day("2026-10-11"));

        expect(JSON.parse(storage.getString("khatam") ?? "{}").state.log["2026-10-11"]).toBe(1);
    });
});

describe("plan", () => {
    it("starts today with the chosen length and stops without losing progress", () => {
        state().recordRead(1, [1, 2, 3], day("2026-10-11"));

        state().startPlan(30, day("2026-10-11"));
        expect(state().plan).toEqual({ startDate: "2026-10-11", targetDays: 30 });

        state().stopPlan();
        expect(state().plan).toBeNull();
        expect(countCovered(state().read)).toBe(3);
    });

    it("starts a new round without losing the daily log", () => {
        state().recordRead(1, [1, 2, 3], day("2026-10-11"));

        state().startNewRound();

        expect(state().read).toEqual([]);
        expect(state().completedRounds).toBe(1);
        expect(state().log["2026-10-11"]).toBe(3);
    });
});
