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
