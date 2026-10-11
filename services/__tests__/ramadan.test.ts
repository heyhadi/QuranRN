import { mapCalendar } from "../prayerTimes";
import { fastStatus, ramadanDay, ramadanDayOf } from "../ramadan";
import calendar from "./fixtures/prayerCalendar.json";

describe("ramadanDay", () => {
    // Umm al-Qura: 1 Ramadan 1446 fell on 1 March 2025, and Shawwal began on 30 March 2025.
    it("counts the days of Ramadan", () => {
        expect(ramadanDay(new Date(2025, 2, 1, 12))).toBe(1);
        expect(ramadanDay(new Date(2025, 2, 15, 12))).toBe(15);
        expect(ramadanDay(new Date(2025, 2, 29, 12))).toBe(29);
    });

    it("is null outside Ramadan", () => {
        expect(ramadanDay(new Date(2025, 1, 20, 12))).toBeNull();
        expect(ramadanDay(new Date(2025, 3, 15, 12))).toBeNull();
        expect(ramadanDay(new Date(2026, 9, 11, 12))).toBeNull();
    });

    it("reads a calendar date the same way", () => {
        expect(ramadanDayOf("2025-03-10")).toBe(10);
        expect(ramadanDayOf("2026-10-11")).toBeNull();
    });
});

describe("fastStatus", () => {
    const month = mapCalendar(calendar);
    const day = month.days.find((entry) => entry.date === "2026-10-11")!;

    it("moves from before imsak, through the fast, to after iftar", () => {
        // Singapore is UTC+8; on the fixture day imsak is early morning and Maghrib in the evening.
        const before = fastStatus(day, month.timezone, new Date("2026-10-10T19:00:00Z"));
        expect(before.phase).toBe("before");
        const during = fastStatus(day, month.timezone, new Date("2026-10-11T04:00:00Z"));
        expect(during.phase).toBe("fasting");
        const after = fastStatus(day, month.timezone, new Date("2026-10-11T12:00:00Z"));
        expect(after.phase).toBe("after");
        expect(during.iftar.getTime()).toBeGreaterThan(during.imsak.getTime());
    });
});
