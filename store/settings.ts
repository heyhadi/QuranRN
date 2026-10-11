import { create } from "zustand";
import { persist } from "zustand/middleware";
import { arabicFontSize } from "@/constants/theme";
import { zustandStorage } from "./storage";

/** equran.id reciter ids: 01 Al-Juhany, 02 Al-Qasim, 03 As-Sudais, 04 Al-Dossari, 05 Alafasy, 06 Yasser Al-Dosari. */
export const DEFAULT_RECITER_ID = "01";

export type ThemePreference = "system" | "light" | "dark";
export type LanguagePreference = "system" | "id" | "en";

interface SettingsState {
    reciterId: string;
    themePreference: ThemePreference;
    languagePreference: LanguagePreference;
    /** Arabic text size in points. */
    arabicFontSize: number;
    showTranslation: boolean;
    setReciterId: (reciterId: string) => void;
    setThemePreference: (preference: ThemePreference) => void;
    setLanguagePreference: (preference: LanguagePreference) => void;
    /** Step the Arabic size up (+1) or down (-1), staying inside the allowed range. */
    stepArabicFontSize: (direction: 1 | -1) => void;
    setShowTranslation: (show: boolean) => void;
}

export function clampArabicFontSize(size: number): number {
    return Math.min(arabicFontSize.max, Math.max(arabicFontSize.min, size));
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            reciterId: DEFAULT_RECITER_ID,
            themePreference: "system",
            languagePreference: "system",
            arabicFontSize: arabicFontSize.default,
            showTranslation: true,
            setReciterId: (reciterId) => set({ reciterId }),
            setThemePreference: (themePreference) => set({ themePreference }),
            setLanguagePreference: (languagePreference) => set({ languagePreference }),
            stepArabicFontSize: (direction) =>
                set((state) => ({ arabicFontSize: clampArabicFontSize(state.arabicFontSize + direction * arabicFontSize.step) })),
            setShowTranslation: (showTranslation) => set({ showTranslation }),
        }),
        // Fields added after version 1 fall back to the defaults above when the saved state lacks them.
        { name: "settings", storage: zustandStorage, version: 1 },
    ),
);
