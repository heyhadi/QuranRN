import type { AppLanguage } from "@/i18n";

/**
 * Today's Hijri date (Umm al-Qura calendar), e.g. "30 Rabiulakhir 1448 H".
 * Returns null when the platform's Intl data has no Islamic calendar, so the caller can hide it.
 */
export function formatHijri(date: Date, language: AppLanguage): string | null {
    const locale = language === "id" ? "id-ID-u-ca-islamic-umalqura" : "en-GB-u-ca-islamic-umalqura";
    try {
        const formatter = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" });
        if (!formatter.resolvedOptions().calendar.startsWith("islamic")) return null;
        return formatter.format(date);
    } catch {
        return null;
    }
}

/** Today's solar (Gregorian) date with the weekday, e.g. "Sunday, 11 October 2026" / "Minggu, 11 Oktober 2026". */
export function formatGregorian(date: Date, language: AppLanguage): string {
    return new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", calendar: "gregory" }).format(date);
}

/** Both dates on two lines: solar first, then Hijri when the device has the calendar. */
export function formatDates(date: Date, language: AppLanguage): string {
    const hijri = formatHijri(date, language);
    const solar = formatGregorian(date, language);
    return hijri ? `${solar}\n${hijri}` : solar;
}
