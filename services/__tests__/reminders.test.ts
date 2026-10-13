import { mapCalendar } from "../prayerTimes";
import { MAX_PENDING, parseTime, planReminders, type ReminderSettings } from "../reminders";
import calendar from "./fixtures/prayerCalendar.json";

const month = mapCalendar(calendar);
const none: ReminderSettings = {
    adhanEnabled: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
    adhanAudioEnabled: true,
    dailyAyahEnabled: false,
    dailyAyahTime: "07:00",
    khatamReminderEnabled: false,
    khatamReminderTime: "20:00",
    ramadanEnabled: false,
};
// A phone date helper: today is 11 Oct 2026, so offset 0 is that day.
const localDate = (offset: number) => {
    const date = new Date(2026, 9, 11 + offset);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const plan = (settings: ReminderSettings, now: string) => planReminders(settings, month.days, month.timezone, new Date(now), localDate);

describe("parseTime", () => {
    it.each([
        ["07:00", { hour: 7, minute: 0 }],
        ["7:05", { hour: 7, minute: 5 }],
        ["23:59", { hour: 23, minute: 59 }],
    ])("reads %s", (input, expected) => expect(parseTime(input)).toEqual(expected));

    it.each(["24:00", "12:60", "noon", "", "7"])("rejects %j", (input) => expect(parseTime(input)).toBeNull());
});

describe("planReminders", () => {
    it("plans nothing when everything is off", () => {
        expect(plan(none, "2026-10-10T00:00:00Z")).toEqual([]);
    });

    it("plans adhan only for the enabled prayers, in time order", () => {
        // 00:00 UTC is 08:00 in Singapore, so Fajr (05:32) on the 10th has already passed.
        const reminders = plan({ ...none, adhanEnabled: { ...none.adhanEnabled, fajr: true, maghrib: true } }, "2026-10-10T00:00:00Z");

        expect(reminders.map((reminder) => reminder.id)).toEqual([
            "adhan-2026-10-10-maghrib", // 18:54 SGT
            "adhan-2026-10-11-fajr",
            "adhan-2026-10-11-maghrib",
            "adhan-2026-10-12-fajr",
            "adhan-2026-10-12-maghrib",
        ]);
    });

    it("skips prayers that have already passed", () => {
        // 17:00 SGT on 11 Oct (09:00 UTC): Fajr, Dhuhr and Asr have passed.
        const reminders = plan({ ...none, adhanEnabled: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true } }, "2026-10-11T09:00:00Z");

        expect(reminders[0].id).toBe("adhan-2026-10-11-maghrib");
        expect(reminders.some((reminder) => reminder.id === "adhan-2026-10-11-asr")).toBe(false);
    });

    it("schedules each adhan at the right real instant", () => {
        const [first] = plan({ ...none, adhanEnabled: { ...none.adhanEnabled, asr: true } }, "2026-10-11T00:00:00Z");

        expect(first.at.toISOString()).toBe("2026-10-11T08:06:00.000Z");
    });

    it("plans a week of daily ayah reminders at the chosen local time, skipping today's if it has passed", () => {
        const reminders = planReminders({ ...none, dailyAyahEnabled: true, dailyAyahTime: "07:00" }, [], "UTC", new Date(2026, 9, 11, 9, 0), localDate);

        expect(reminders).toHaveLength(6);
        expect(reminders[0].id).toBe("dailyAyah-2026-10-12");
    });

    it("includes today's reminder when its time has not come yet", () => {
        const reminders = planReminders({ ...none, khatamReminderEnabled: true, khatamReminderTime: "20:00" }, [], "UTC", new Date(2026, 9, 11, 9, 0), localDate);

        expect(reminders).toHaveLength(7);
        expect(reminders[0].id).toBe("khatam-2026-10-11");
    });

    it("ignores a daily reminder whose time is not valid", () => {
        expect(planReminders({ ...none, dailyAyahEnabled: true, dailyAyahTime: "later" }, [], "UTC", new Date(2026, 9, 11), localDate)).toEqual([]);
    });

    it("never plans more than the platform allows, keeping the earliest", () => {
        const many = Array.from({ length: 30 }, (_, index) => ({ date: localDate(index), times: month.days[0].times }));
        const reminders = planReminders({ ...none, adhanEnabled: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true } }, many, month.timezone, new Date("2026-10-01T00:00:00Z"), localDate);

        expect(reminders).toHaveLength(MAX_PENDING);
        expect(reminders[0].at.getTime()).toBeLessThanOrEqual(reminders[MAX_PENDING - 1].at.getTime());
    });
});

describe("Ramadan reminders", () => {
    const base = month.days[0];
    // Two real dates: 28 Feb 2025 is the last day of Sha'ban, 1 Mar 2025 is the first of Ramadan (Umm al-Qura).
    const days = ["2025-02-28", "2025-03-01"].map((date) => ({ date, times: base.times }));
    const ramadan = { ...none, ramadanEnabled: true };
    const run = (settings: ReminderSettings) => planReminders(settings, days, month.timezone, new Date("2025-02-27T00:00:00Z"), localDate);

    it("plans suhoor and iftar only on days of Ramadan", () => {
        const reminders = run(ramadan);
        expect(reminders.map((reminder) => reminder.id)).toEqual(["suhoor-2025-03-01", "iftar-2025-03-01"]);
    });

    it("sets suhoor 30 minutes before imsak and iftar at Maghrib", () => {
        const [suhoor, iftar] = run(ramadan);
        expect(suhoor.imsak).toBe(base.times.imsak);
        // imsak on the fixture day, 30 minutes earlier, in Singapore time (UTC+8)
        const [hour, minute] = base.times.imsak.split(":").map(Number);
        const expected = Date.UTC(2025, 2, 1, hour - 8, minute - 30);
        expect(suhoor.at.getTime()).toBe(expected);
        const [maghribHour, maghribMinute] = base.times.maghrib.split(":").map(Number);
        expect(iftar.at.getTime()).toBe(Date.UTC(2025, 2, 1, maghribHour - 8, maghribMinute));
    });

    it("plans nothing when the setting is off", () => {
        expect(run(none)).toEqual([]);
    });
});
