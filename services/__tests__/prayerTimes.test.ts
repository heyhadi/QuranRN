import { cleanTime, dayFor, instantFor, mapCalendar, minutesUntil, nextPrayer, zoneOffsetMinutes, formatClock } from "../prayerTimes";
import calendar from "./fixtures/prayerCalendar.json";

// Fixture: three real days (10 to 12 Oct 2026) from api.aladhan.com for Singapore, method 11 (MUIS).

describe("cleanTime", () => {
    it("drops the time zone suffix", () => {
        expect(cleanTime("05:32 (+08)")).toBe("05:32");
        expect(cleanTime("16:06")).toBe("16:06");
    });
});

describe("mapCalendar", () => {
    const month = mapCalendar(calendar);

    it("turns Aladhan's day-month-year dates into ISO dates and keeps the time zone", () => {
        expect(month.timezone).toBe("Asia/Singapore");
        expect(month.days.map((day) => day.date)).toEqual(["2026-10-10", "2026-10-11", "2026-10-12"]);
    });

    it("reads the five prayers, imsak and sunrise as plain HH:MM", () => {
        expect(dayFor(month, "2026-10-11")?.times).toMatchObject({ fajr: "05:32", dhuhr: "12:52", asr: "16:06", maghrib: "18:54", isha: "20:03", imsak: "05:22" });
    });

    it("finds nothing for a day outside the fixture", () => {
        expect(dayFor(month, "2026-11-01")).toBeUndefined();
    });
});

describe("time zones", () => {
    it("gives the offset of a zone at an instant, following daylight saving", () => {
        expect(zoneOffsetMinutes("Asia/Singapore", new Date("2026-10-11T00:00:00Z"))).toBe(480);
        expect(zoneOffsetMinutes("Asia/Jakarta", new Date("2026-10-11T00:00:00Z"))).toBe(420);
        expect(zoneOffsetMinutes("Europe/London", new Date("2026-07-01T12:00:00Z"))).toBe(60);
        expect(zoneOffsetMinutes("Europe/London", new Date("2026-01-01T12:00:00Z"))).toBe(0);
    });

    it("builds the real instant for a wall-clock time at the location, whatever the phone's own zone", () => {
        // 16:06 in Singapore (UTC+8) is 08:06 UTC.
        expect(instantFor("2026-10-11", "16:06", "Asia/Singapore").toISOString()).toBe("2026-10-11T08:06:00.000Z");
        // 05:30 in London in July (BST, UTC+1) is 04:30 UTC.
        expect(instantFor("2026-07-01", "05:30", "Europe/London").toISOString()).toBe("2026-07-01T04:30:00.000Z");
    });

    it("handles a time that falls just after the clocks change", () => {
        // London springs forward on 29 Mar 2026 at 01:00 UTC; 12:00 local that day is 11:00 UTC.
        expect(instantFor("2026-03-29", "12:00", "Europe/London").toISOString()).toBe("2026-03-29T11:00:00.000Z");
    });
});

describe("nextPrayer", () => {
    const month = mapCalendar(calendar);
    const at = (iso: string) => new Date(iso);

    it("finds the next prayer today", () => {
        // 15:00 Singapore time is 07:00 UTC, before Asr at 16:06.
        const next = nextPrayer(month.days, month.timezone, at("2026-10-11T07:00:00Z"));

        expect(next?.name).toBe("asr");
        expect(next?.at.toISOString()).toBe("2026-10-11T08:06:00.000Z");
    });

    it("rolls over to tomorrow's Fajr after Isha", () => {
        // 21:00 Singapore time is 13:00 UTC, after Isha at 20:03.
        const next = nextPrayer(month.days, month.timezone, at("2026-10-11T13:00:00Z"));

        expect(next?.name).toBe("fajr");
        expect(next?.at.getTime()).toBeGreaterThan(at("2026-10-11T13:00:00Z").getTime());
    });

    it("returns null when there are no later times", () => {
        expect(nextPrayer(month.days, month.timezone, at("2027-01-01T00:00:00Z"))).toBeNull();
    });
});

describe("minutesUntil", () => {
    it("rounds up and never goes negative", () => {
        const now = new Date("2026-10-11T08:00:00Z");

        expect(minutesUntil(new Date("2026-10-11T08:06:30Z"), now)).toBe(7);
        expect(minutesUntil(new Date("2026-10-11T07:00:00Z"), now)).toBe(0);
    });
});

describe("formatClock", () => {
    it("shows the time in the given zone, not the phone's", () => {
        const at = new Date("2026-10-11T21:32:00Z");
        expect(formatClock(at, "Asia/Singapore")).toBe("05:32");
        expect(formatClock(at, "Asia/Jakarta")).toBe("04:32");
        expect(formatClock(at, "UTC")).toBe("21:32");
    });
});
