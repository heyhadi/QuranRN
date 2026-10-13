import { instantFor, PRAYER_NAMES, type DayTimes, type PrayerName } from "./prayerTimes";
import { ramadanDayOf, SUHOOR_LEAD_MINUTES } from "./ramadan";

// Pure planning of which local notifications to schedule. The native scheduling lives in
// services/notifications.ts; keeping the planning here makes it testable without a device.

export type ReminderKind = "adhan" | "dailyAyah" | "khatam" | "suhoor" | "iftar";

export interface PlannedReminder {
    /** Stable id, so rescheduling replaces rather than duplicates. */
    id: string;
    kind: ReminderKind;
    at: Date;
    /** Which prayer, for adhan reminders. */
    prayer?: PrayerName;
    /** The imsak time ("HH:MM"), for suhoor reminders. */
    imsak?: string;
}

export interface ReminderSettings {
    adhanEnabled: Record<PrayerName, boolean>;
    /** Play the adhan audio (not just the notification sound) at prayer times. */
    adhanAudioEnabled: boolean;
    dailyAyahEnabled: boolean;
    dailyAyahTime: string;
    khatamReminderEnabled: boolean;
    khatamReminderTime: string;
    /** Suhoor and iftar reminders on the days of Ramadan. */
    ramadanEnabled: boolean;
}

/** iOS keeps at most 64 pending local notifications; stay under it and keep room for the daily ones. */
export const MAX_PENDING = 60;

export function parseTime(time: string): { hour: number; minute: number } | null {
    const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
    if (!match) return null;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    return hour <= 23 && minute <= 59 ? { hour, minute } : null;
}

/**
 * The reminders to schedule from `now`: adhan at each enabled prayer's real time for the days we have
 * times for, plus the next week of daily ayah / khatam reminders at the chosen local time. Past times are
 * skipped, and the list is trimmed to the platform limit, earliest first.
 */
export function planReminders(settings: ReminderSettings, days: DayTimes[], timezone: string, now: Date, localDate: (offsetDays: number) => string): PlannedReminder[] {
    const planned: PlannedReminder[] = [];

    for (const day of days) {
        for (const prayer of PRAYER_NAMES) {
            if (!settings.adhanEnabled[prayer]) continue;
            const at = instantFor(day.date, day.times[prayer], timezone);
            if (at.getTime() > now.getTime()) planned.push({ id: `adhan-${day.date}-${prayer}`, kind: "adhan", at, prayer });
        }
    }

    if (settings.ramadanEnabled) {
        for (const day of days) {
            if (ramadanDayOf(day.date) === null) continue;
            const imsak = instantFor(day.date, day.times.imsak, timezone);
            const suhoor = new Date(imsak.getTime() - SUHOOR_LEAD_MINUTES * 60_000);
            if (suhoor.getTime() > now.getTime()) planned.push({ id: `suhoor-${day.date}`, kind: "suhoor", at: suhoor, imsak: day.times.imsak });
            const iftar = instantFor(day.date, day.times.maghrib, timezone);
            if (iftar.getTime() > now.getTime()) planned.push({ id: `iftar-${day.date}`, kind: "iftar", at: iftar });
        }
    }

    const addDaily = (kind: "dailyAyah" | "khatam", enabled: boolean, time: string) => {
        const parsed = parseTime(time);
        if (!enabled || !parsed) return;
        for (let offset = 0; offset < 7; offset++) {
            const date = localDate(offset);
            // Local time of the phone, not of the prayer location: these are the user's own habits.
            const [year, month, dayOfMonth] = date.split("-").map(Number);
            const at = new Date(year, month - 1, dayOfMonth, parsed.hour, parsed.minute);
            if (at.getTime() > now.getTime()) planned.push({ id: `${kind}-${date}`, kind, at });
        }
    };
    addDaily("dailyAyah", settings.dailyAyahEnabled, settings.dailyAyahTime);
    addDaily("khatam", settings.khatamReminderEnabled, settings.khatamReminderTime);

    return planned.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, MAX_PENDING);
}
