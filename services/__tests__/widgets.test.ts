import { getWidgetPayload, saveWidgetPayload, WIDGET_STORAGE_KEY, type WidgetPayload } from "../widgets";
import { storage } from "@/store/storage";

describe("widgets service", () => {
    beforeEach(() => {
        storage.remove(WIDGET_STORAGE_KEY);
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
});
