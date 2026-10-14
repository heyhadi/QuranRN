import {
    buildWidgetPayload,
    getWidgetPayload,
    saveWidgetPayload,
    syncWidgetData,
    WIDGET_STORAGE_KEY,
    type WidgetPayload,
} from "../widgets";
import { storage } from "@/store/storage";
import { NativeModules, Platform } from "react-native";

describe("widgets service", () => {
    beforeEach(() => {
        storage.remove(WIDGET_STORAGE_KEY);
        jest.clearAllMocks();
    });

    it("returns null when no widget payload is saved", () => {
        expect(getWidgetPayload()).toBeNull();
    });

    it("saves and retrieves full widget payload correctly", () => {
        const payload: WidgetPayload = {
            updatedAt: 1728900000000,
            language: "en",
            prayer: {
                nextPrayerName: "Dhuhr",
                nextPrayerTime: "12:56",
                nextPrayerTimestamp: 1728910000000,
                locationName: "Jakarta",
                schedule: [
                    { name: "Fajr", time: "04:30", isNext: false },
                    { name: "Dhuhr", time: "12:56", isNext: true },
                ],
            },
            dailyAyah: {
                surahNumber: 103,
                ayahNumber: 3,
                surahName: "Al-'Asr",
                textArabic: "إِلَّا الَّذِينَ آمَنُوا",
                translation: "Except for those who have believed",
            },
            khatam: {
                streakDays: 5,
                todayPages: 2,
                targetPages: 4,
                percentComplete: 50,
                daysRemaining: 25,
            },
        };

        saveWidgetPayload(payload);
        const retrieved = getWidgetPayload();
        expect(retrieved).toEqual(payload);
    });

    it("handles corrupt JSON gracefully", () => {
        storage.set(WIDGET_STORAGE_KEY, "{ invalid json");
        expect(getWidgetPayload()).toBeNull();
    });

    it("builds widget payload correctly using helper", () => {
        const payload = buildWidgetPayload({
            language: "id",
            khatam: {
                streakDays: 3,
                todayPages: 1,
                targetPages: 4,
                percentComplete: 25,
                daysRemaining: 20,
            },
        });
        expect(payload.language).toBe("id");
        expect(payload.khatam?.streakDays).toBe(3);
        expect(payload.updatedAt).toBeGreaterThan(0);
    });

    it("calls NativeModules.WirdWidgetModule on Android if available", async () => {
        const origOs = Platform.OS;
        (Platform as { OS: string }).OS = "android";

        const mockUpdate = jest.fn().mockResolvedValue(true);
        NativeModules.WirdWidgetModule = {
            updateWidgetData: mockUpdate,
        };

        const payload = buildWidgetPayload({ language: "en" });
        await syncWidgetData(payload);

        expect(mockUpdate).toHaveBeenCalledWith(JSON.stringify(payload));

        (Platform as { OS: string }).OS = origOs;
        delete NativeModules.WirdWidgetModule;
    });

    it("handles native module errors gracefully without throwing", async () => {
        const origOs = Platform.OS;
        (Platform as { OS: string }).OS = "android";

        NativeModules.WirdWidgetModule = {
            updateWidgetData: jest.fn().mockImplementation(() => {
                throw new Error("Bridge failure");
            }),
        };

        const payload = buildWidgetPayload({ language: "en" });
        expect(() => saveWidgetPayload(payload)).not.toThrow();
        await expect(syncWidgetData(payload)).resolves.toBeUndefined();

        (Platform as { OS: string }).OS = origOs;
        delete NativeModules.WirdWidgetModule;
    });

    it("safely handles missing or empty WirdWidgetModule on Android", async () => {
        const origOs = Platform.OS;
        (Platform as { OS: string }).OS = "android";

        NativeModules.WirdWidgetModule = undefined;
        const payload = buildWidgetPayload({ language: "en" });
        expect(() => saveWidgetPayload(payload)).not.toThrow();
        await expect(syncWidgetData(payload)).resolves.toBeUndefined();

        NativeModules.WirdWidgetModule = {};
        expect(() => saveWidgetPayload(payload)).not.toThrow();
        await expect(syncWidgetData(payload)).resolves.toBeUndefined();

        (Platform as { OS: string }).OS = origOs;
        delete NativeModules.WirdWidgetModule;
    });

    it("handles non-Android platforms without calling native module", async () => {
        const origOs = Platform.OS;
        (Platform as { OS: string }).OS = "ios";

        const mockUpdate = jest.fn();
        NativeModules.WirdWidgetModule = { updateWidgetData: mockUpdate };

        const payload = buildWidgetPayload({ language: "en" });
        saveWidgetPayload(payload);
        await syncWidgetData(payload);

        expect(mockUpdate).not.toHaveBeenCalled();

        (Platform as { OS: string }).OS = origOs;
        delete NativeModules.WirdWidgetModule;
    });
});
