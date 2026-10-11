import { instantFor, type DayTimes } from "./prayerTimes";

/** The Hijri month number of Ramadan. */
const RAMADAN = 9;

/**
 * The day of Ramadan (1 to 30) for a date, or null outside Ramadan or when the device has no Islamic
 * calendar. Uses the Umm al-Qura calendar, the same one as the Hijri date shown on Home.
 */
export function ramadanDay(date: Date): number | null {
    try {
        const formatter = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { day: "numeric", month: "numeric", year: "numeric" });
        if (!formatter.resolvedOptions().calendar.startsWith("islamic")) return null;
        const parts = formatter.formatToParts(date);
        const month = Number(parts.find((part) => part.type === "month")?.value);
        const day = Number(parts.find((part) => part.type === "day")?.value);
        return month === RAMADAN && day >= 1 ? day : null;
    } catch {
        return null;
    }
}

/** Ramadan day for a "YYYY-MM-DD" calendar date, read at midday so a time zone cannot shift the day. */
export function ramadanDayOf(dateKey: string): number | null {
    const [year, month, day] = dateKey.split("-").map(Number);
    return ramadanDay(new Date(year, month - 1, day, 12));
}

/** How long before imsak the suhoor reminder goes off. */
export const SUHOOR_LEAD_MINUTES = 30;

export type FastPhase = "before" | "fasting" | "after";

export interface FastStatus {
    phase: FastPhase;
    /** Imsak and iftar (Maghrib) as instants. */
    imsak: Date;
    iftar: Date;
}

/** Where the day's fast stands: not begun (before imsak), under way, or done (after Maghrib). */
export function fastStatus(day: DayTimes, timezone: string, now: Date): FastStatus {
    const imsak = instantFor(day.date, day.times.imsak, timezone);
    const iftar = instantFor(day.date, day.times.maghrib, timezone);
    const phase: FastPhase = now < imsak ? "before" : now < iftar ? "fasting" : "after";
    return { phase, imsak, iftar };
}
