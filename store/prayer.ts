import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_METHOD_ID, PRAYER_NAMES, type PrayerMonth, type PrayerName } from "@/services/prayerTimes";
import { zustandStorage } from "./storage";

export interface SavedLocation {
    latitude: number;
    longitude: number;
    /** When the location was taken (epoch ms). */
    savedAt: number;
}

interface PrayerState {
    /** The last known location; prayer times are worked out for it, so the screen works offline. */
    location: SavedLocation | null;
    methodId: number;
    /** Notify at the time of each prayer. */
    adhanEnabled: Record<PrayerName, boolean>;
    /** Play the adhan audio when a prayer-time notification arrives. */
    adhanAudioEnabled: boolean;
    /** Remind about the day's ayah. */
    dailyAyahEnabled: boolean;
    /** "HH:MM" local time of the daily ayah reminder. */
    dailyAyahTime: string;
    /** Remind to read the day's khatam portion. */
    khatamReminderEnabled: boolean;
    khatamReminderTime: string;
    /** Suhoor and iftar reminders during Ramadan. */
    ramadanEnabled: boolean;
    /** Saved months, keyed "YYYY-MM:method:lat:lon" (rounded), so a month is fetched once. */
    months: Record<string, PrayerMonth>;
    setLocation: (latitude: number, longitude: number) => void;
    setMethodId: (methodId: number) => void;
    setAdhan: (prayer: PrayerName, enabled: boolean) => void;
    setAdhanAudioEnabled: (enabled: boolean) => void;
    setDailyAyahEnabled: (enabled: boolean) => void;
    setDailyAyahTime: (time: string) => void;
    setKhatamReminderEnabled: (enabled: boolean) => void;
    setKhatamReminderTime: (time: string) => void;
    setRamadanEnabled: (enabled: boolean) => void;
    saveMonth: (key: string, month: PrayerMonth) => void;
}

const MAX_SAVED_MONTHS = 6;

export const monthKey = (year: number, month: number, methodId: number, latitude: number, longitude: number) =>
    `${year}-${String(month).padStart(2, "0")}:${methodId}:${latitude.toFixed(1)}:${longitude.toFixed(1)}`;

export const usePrayerStore = create<PrayerState>()(
    persist(
        (set) => ({
            location: null,
            methodId: DEFAULT_METHOD_ID,
            adhanEnabled: Object.fromEntries(PRAYER_NAMES.map((name) => [name, false])) as Record<PrayerName, boolean>,
            adhanAudioEnabled: true,
            dailyAyahEnabled: false,
            dailyAyahTime: "07:00",
            khatamReminderEnabled: false,
            khatamReminderTime: "20:00",
            ramadanEnabled: false,
            months: {},
            setLocation: (latitude, longitude) => set({ location: { latitude, longitude, savedAt: Date.now() } }),
            setMethodId: (methodId) => set({ methodId }),
            setAdhan: (prayer, enabled) => set((state) => ({ adhanEnabled: { ...state.adhanEnabled, [prayer]: enabled } })),
            setAdhanAudioEnabled: (adhanAudioEnabled) => set({ adhanAudioEnabled }),
            setDailyAyahEnabled: (dailyAyahEnabled) => set({ dailyAyahEnabled }),
            setDailyAyahTime: (dailyAyahTime) => set({ dailyAyahTime }),
            setKhatamReminderEnabled: (khatamReminderEnabled) => set({ khatamReminderEnabled }),
            setKhatamReminderTime: (khatamReminderTime) => set({ khatamReminderTime }),
            setRamadanEnabled: (ramadanEnabled) => set({ ramadanEnabled }),
            saveMonth: (key, month) =>
                set((state) => {
                    const months = { ...state.months, [key]: month };
                    // Keep the newest few months only, so saved data stays small.
                    const keys = Object.keys(months).sort();
                    for (const old of keys.slice(0, Math.max(0, keys.length - MAX_SAVED_MONTHS))) delete months[old];
                    return { months };
                }),
        }),
        { name: "prayer", storage: zustandStorage, version: 1 },
    ),
);
