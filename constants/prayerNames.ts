import type { PrayerName } from "@/services/prayerTimes";

/** The five prayers in Arabic, for the calligraphic name on the prayer card. */
export const PRAYER_ARABIC: Record<PrayerName, string> = {
    fajr: "الفجر",
    dhuhr: "الظهر",
    asr: "العصر",
    maghrib: "المغرب",
    isha: "العشاء",
};
