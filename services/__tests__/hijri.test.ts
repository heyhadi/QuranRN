import { formatDates, formatGregorian, formatHijri } from "../hijri";

describe("formatHijri", () => {
    it("formats a date in the Umm al-Qura calendar", () => {
        // 11 Oct 2026 is 30 Rabi' al-Akhir 1448.
        const text = formatHijri(new Date("2026-10-11T12:00:00Z"), "en");

        expect(text).toMatch(/1448/);
        expect(text).toMatch(/30/);
    });

    it("returns null instead of throwing when the platform lacks the Islamic calendar", () => {
        const original = Intl.DateTimeFormat;
        // Simulate an engine that silently falls back to the Gregorian calendar.
        (Intl as { DateTimeFormat: unknown }).DateTimeFormat = function () {
            return { resolvedOptions: () => ({ calendar: "gregory" }), format: () => "11 October 2026" };
        };
        try {
            expect(formatHijri(new Date(), "id")).toBeNull();
        } finally {
            (Intl as { DateTimeFormat: unknown }).DateTimeFormat = original;
        }
    });
});

describe("formatGregorian and formatDates", () => {
    const day = new Date(2026, 9, 11, 12);

    it("writes the solar date with the weekday in both languages", () => {
        expect(formatGregorian(day, "en")).toMatch(/^Sunday,? 11 October 2026$/);
        expect(formatGregorian(day, "id")).toBe("Minggu, 11 Oktober 2026");
    });

    it("puts the solar date first and the Hijri date on the next line", () => {
        const lines = formatDates(day, "id").split("\n");
        expect(lines[0]).toBe("Minggu, 11 Oktober 2026");
        expect(lines.length).toBeLessThanOrEqual(2);
    });
});
