import { NativeModules, Platform } from "react-native";
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
 * On Android, writes to SharedPreferences and updates all home screen widgets via WirdWidgetModule.
 * On iOS, writes to App Group UserDefaults.
 */
export function saveWidgetPayload(payload: WidgetPayload): void {
    const raw = JSON.stringify(payload);
    storage.set(WIDGET_STORAGE_KEY, raw);

    if (Platform.OS === "android") {
        const module = NativeModules.WirdWidgetModule;
        if (module && typeof module.updateWidgetData === "function") {
            try {
                module.updateWidgetData(raw);
            } catch {
                // Silently ignore in mock or test environments
            }
        }
    }
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

export interface BuildWidgetPayloadParams {
    language: "en" | "id";
    prayer?: PrayerWidgetData;
    dailyAyah?: DailyAyahWidgetData;
    khatam?: KhatamWidgetData;
}

export function buildWidgetPayload(params: BuildWidgetPayloadParams): WidgetPayload {
    return {
        updatedAt: Date.now(),
        language: params.language,
        prayer: params.prayer,
        dailyAyah: params.dailyAyah,
        khatam: params.khatam,
    };
}

export async function syncWidgetData(payload: WidgetPayload): Promise<void> {
    saveWidgetPayload(payload);
    if (Platform.OS === "android") {
        const module = NativeModules.WirdWidgetModule;
        if (module && typeof module.updateWidgetData === "function") {
            try {
                await module.updateWidgetData(JSON.stringify(payload));
            } catch {
                // Ignore in testing or dev environments
            }
        }
    }
}
