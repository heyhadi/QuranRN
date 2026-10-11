import { storage } from "../storage";
import { useTasbihStore } from "../tasbih";

const state = () => useTasbihStore.getState();
const day = new Date(2026, 9, 11, 12);

beforeEach(() => {
    storage.clearAll();
    useTasbihStore.setState({ count: 0, target: 33, history: {} });
});

describe("tasbih", () => {
    it("counts taps and totals them per day", () => {
        for (let i = 0; i < 5; i++) state().tap(day);

        expect(state().count).toBe(5);
        expect(state().history["2026-10-11"]).toBe(5);
    });

    it("tells the screen to vibrate at the target and at each 33", () => {
        state().setTarget(99);
        const results = Array.from({ length: 99 }, () => state().tap(day));

        expect(results.map((hit, index) => (hit ? index + 1 : null)).filter(Boolean)).toEqual([33, 66, 99]);
    });

    it("vibrates at the target when it is not a multiple of 33", () => {
        state().setTarget(100);
        const hits = Array.from({ length: 100 }, () => state().tap(day)).map((hit, index) => (hit ? index + 1 : null)).filter(Boolean);

        expect(hits).toEqual([33, 66, 99, 100]);
    });

    it("resets the count but keeps the day's total", () => {
        for (let i = 0; i < 10; i++) state().tap(day);

        state().reset();

        expect(state().count).toBe(0);
        expect(state().history["2026-10-11"]).toBe(10);
    });

    it("saves to device storage", () => {
        state().tap(day);

        expect(JSON.parse(storage.getString("tasbih") ?? "{}").state.count).toBe(1);
    });
});
