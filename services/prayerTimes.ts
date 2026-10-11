import { getJson } from "./http";

// api.aladhan.com: free, no key. One request returns a whole month for a location.
const BASE_URL = "https://api.aladhan.com/v1";

export type PrayerName = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";
export const PRAYER_NAMES: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

/** Calculation methods people in Wird's main regions use. The id is Aladhan's method number. */
export interface CalculationMethod {
    id: number;
    key: "singapore" | "kemenag" | "jakim" | "mwl" | "makkah" | "isna" | "egypt" | "karachi";
    name: string;
}

export const calculationMethods: CalculationMethod[] = [
    { id: 11, key: "singapore", name: "MUIS, Singapore" },
    { id: 20, key: "kemenag", name: "Kemenag, Indonesia" },
    { id: 17, key: "jakim", name: "JAKIM, Malaysia" },
    { id: 3, key: "mwl", name: "Muslim World League" },
    { id: 4, key: "makkah", name: "Umm al-Qura, Makkah" },
    { id: 2, key: "isna", name: "ISNA, North America" },
    { id: 5, key: "egypt", name: "Egyptian General Authority" },
    { id: 1, key: "karachi", name: "Karachi" },
];

export const DEFAULT_METHOD_ID = 11;

export interface DayTimes {
    /** "YYYY-MM-DD" in the location's own time zone. */
    date: string;
    /** "HH:MM" for each prayer, 24-hour, local to the location. */
    times: Record<PrayerName | "imsak" | "sunrise", string>;
}

export interface PrayerMonth {
    /** IANA time zone of the location, e.g. "Asia/Singapore". */
    timezone: string;
    days: DayTimes[];
}

// ---- Raw shape (only the fields read) ----

interface CalendarResponse {
    data: {
        timings: Record<string, string>;
        date: { gregorian: { date: string } };
        meta: { timezone: string };
    }[];
}

/** "05:32 (+08)" → "05:32". */
export function cleanTime(value: string): string {
    return value.replace(/\s*\(.*\)\s*$/, "").trim();
}

/** "11-10-2026" (day-month-year) → "2026-10-11". */
function isoDate(gregorian: string): string {
    const [day, month, year] = gregorian.split("-");
    return `${year}-${month}-${day}`;
}

export function mapCalendar(response: CalendarResponse): PrayerMonth {
    const timezone = response.data[0]?.meta.timezone ?? "UTC";
    return {
        timezone,
        days: response.data.map((day) => ({
            date: isoDate(day.date.gregorian.date),
            times: {
                imsak: cleanTime(day.timings.Imsak),
                fajr: cleanTime(day.timings.Fajr),
                sunrise: cleanTime(day.timings.Sunrise),
                dhuhr: cleanTime(day.timings.Dhuhr),
                asr: cleanTime(day.timings.Asr),
                maghrib: cleanTime(day.timings.Maghrib),
                isha: cleanTime(day.timings.Isha),
            },
        })),
    };
}

export async function getPrayerMonth(latitude: number, longitude: number, year: number, month: number, methodId: number): Promise<PrayerMonth> {
    const url = `${BASE_URL}/calendar/${year}/${month}?latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}&method=${methodId}`;
    return mapCalendar(await getJson<CalendarResponse>(url));
}

// ---- Working with times in the location's time zone ----

/** The wall-clock offset of a time zone from UTC at an instant, in minutes. Uses Intl, so it follows DST rules. */
export function zoneOffsetMinutes(timezone: string, at: Date): number {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).formatToParts(at);
    const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
    const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
    return Math.round((asUtc - at.getTime()) / 60_000);
}

/** The real instant for "date HH:MM" on a clock in `timezone`. */
export function instantFor(date: string, time: string, timezone: string): Date {
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    const guess = Date.UTC(year, month - 1, day, hour, minute);
    // The offset depends on the instant itself (DST), so correct the guess once.
    const offset = zoneOffsetMinutes(timezone, new Date(guess));
    const corrected = guess - offset * 60_000;
    const offset2 = zoneOffsetMinutes(timezone, new Date(corrected));
    return new Date(guess - offset2 * 60_000);
}

export interface NextPrayer {
    name: PrayerName;
    at: Date;
}

/** The first prayer after `now`, looking through the given days (which should cover today and tomorrow). */
export function nextPrayer(days: DayTimes[], timezone: string, now: Date): NextPrayer | null {
    let best: NextPrayer | null = null;
    for (const day of days) {
        for (const name of PRAYER_NAMES) {
            const at = instantFor(day.date, day.times[name], timezone);
            if (at.getTime() > now.getTime() && (!best || at.getTime() < best.at.getTime())) best = { name, at };
        }
    }
    return best;
}

/** Whole minutes from `now` to `at`, rounded up so "in 0 min" never shows before the time. */
export function minutesUntil(at: Date, now: Date): number {
    return Math.max(0, Math.ceil((at.getTime() - now.getTime()) / 60_000));
}

/** The day's entry for a "YYYY-MM-DD" date. */
export function dayFor(month: PrayerMonth, date: string): DayTimes | undefined {
    return month.days.find((day) => day.date === date);
}

/** "05:32": an instant as a 24-hour clock time in the prayer location's own time zone. */
export function formatClock(at: Date, timezone: string): string {
    return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: timezone }).format(at);
}
