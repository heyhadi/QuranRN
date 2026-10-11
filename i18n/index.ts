import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/locales/en.json";
import id from "@/locales/id.json";
import type { LanguagePreference } from "@/store/settings";

export type AppLanguage = "id" | "en";

export const resources = { en: { translation: en }, id: { translation: id } } as const;

/**
 * The phone's language, read through the standard Intl API (Hermes reports the device locale), so no
 * native module is needed. Indonesian and Malay phones get Indonesian; everyone else gets English.
 */
export function deviceLanguage(locale: string = Intl.DateTimeFormat().resolvedOptions().locale): AppLanguage {
    const code = locale.toLowerCase().split(/[-_]/)[0];
    return code === "id" || code === "in" || code === "ms" ? "id" : "en";
}

export function resolveLanguage(preference: LanguagePreference, locale?: string): AppLanguage {
    return preference === "system" ? deviceLanguage(locale) : preference;
}

i18n.use(initReactI18next).init({
    resources,
    lng: deviceLanguage(),
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    returnNull: false,
});

export default i18n;
