import { storage } from "@/store/storage";

export const WIDGET_STORAGE_KEY = "wird_widgets_payload";

export interface PrayerWidgetScheduleItem {
    name: string;
    time: string;
    isNext: boolean;
}

export interface PrayerWidgetData {
    nextPrayerName: string;
    nextPrayerTime: string;
    nextPrayerTimestamp: number;
    locationName: string;
    schedule: PrayerWidgetScheduleItem[];
}

export interface DailyAyahWidgetData {
    surahNumber: number;
    ayahNumber: number;
    surahName: string;
    textArabic: string;
    translation: string;
}

export interface KhatamWidgetData {
    streakDays: number;
    todayPages: number;
    targetPages: number;
    percentComplete: number;
    daysRemaining: number;
}

export interface WidgetPayload {
    updatedAt: number;
    language: "en" | "id";
    prayer?: PrayerWidgetData;
    dailyAyah?: DailyAyahWidgetData;
    khatam?: KhatamWidgetData;
}

/**
 * Saves the combined widget payload into shared storage.
 * On iOS and Android native builds, this data is mapped to App Groups
 * (UserDefaults suite "group.com.heyhadi.wird") and SharedPreferences.
 */
export function saveWidgetPayload(payload: WidgetPayload): void {
    storage.set(WIDGET_STORAGE_KEY, JSON.stringify(payload));
}

/**
 * Reads the latest widget payload from storage.
 */
export function getWidgetPayload(): WidgetPayload | null {
    const raw = storage.getString(WIDGET_STORAGE_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as WidgetPayload;
    } catch {
        return null;
    }
}
