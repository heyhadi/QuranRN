import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_ENGLISH_TRANSLATION_ID, type TafsirId } from "@/constants/editions";
import { DEFAULT_RECITER_ID, legacyReciterIds } from "@/constants/reciters";
import { arabicFontSize } from "@/constants/theme";
import { zustandStorage } from "./storage";

export type ThemePreference = "system" | "light" | "dark";
export type LanguagePreference = "system" | "id" | "en";

export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5] as const;

interface SettingsState {
    reciterId: string;
    /** Reciters pinned to the top of the picker. */
    favouriteReciterIds: string[];
    playbackRate: number;
    themePreference: ThemePreference;
    languagePreference: LanguagePreference;
    /** Arabic text size in points. */
    arabicFontSize: number;
    showTranslation: boolean;
    /** Colour the Arabic text by tajweed rule. */
    tajweedEnabled: boolean;
    /** Show the Latin transliteration under each ayah. */
    showTransliteration: boolean;
    /** quran.com translation shown when the app is in English. */
    englishTranslationId: number;
    /** The tafsir to open; null follows the app language. */
    tafsirChoice: TafsirId | null;
    setReciterId: (reciterId: string) => void;
    toggleFavouriteReciter: (reciterId: string) => void;
    setPlaybackRate: (rate: number) => void;
    setThemePreference: (preference: ThemePreference) => void;
    setLanguagePreference: (preference: LanguagePreference) => void;
    /** Step the Arabic size up (+1) or down (-1), staying inside the allowed range. */
    stepArabicFontSize: (direction: 1 | -1) => void;
    setShowTranslation: (show: boolean) => void;
    setTajweedEnabled: (enabled: boolean) => void;
    setShowTransliteration: (show: boolean) => void;
    setEnglishTranslationId: (id: number) => void;
    setTafsirChoice: (choice: TafsirId | null) => void;
}

export function clampArabicFontSize(size: number): number {
    return Math.min(arabicFontSize.max, Math.max(arabicFontSize.min, size));
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            reciterId: DEFAULT_RECITER_ID,
            favouriteReciterIds: [],
            playbackRate: 1,
            themePreference: "dark",
            languagePreference: "system",
            arabicFontSize: arabicFontSize.default,
            showTranslation: true,
            tajweedEnabled: true,
            showTransliteration: false,
            englishTranslationId: DEFAULT_ENGLISH_TRANSLATION_ID,
            tafsirChoice: null,
            setReciterId: (reciterId) => set({ reciterId }),
            toggleFavouriteReciter: (reciterId) =>
                set((state) => ({
                    favouriteReciterIds: state.favouriteReciterIds.includes(reciterId)
                        ? state.favouriteReciterIds.filter((id) => id !== reciterId)
                        : [...state.favouriteReciterIds, reciterId],
                })),
            setPlaybackRate: (playbackRate) => set({ playbackRate }),
            setThemePreference: (themePreference) => set({ themePreference }),
            setLanguagePreference: (languagePreference) => set({ languagePreference }),
            stepArabicFontSize: (direction) =>
                set((state) => ({ arabicFontSize: clampArabicFontSize(state.arabicFontSize + direction * arabicFontSize.step) })),
            setShowTranslation: (showTranslation) => set({ showTranslation }),
            setTajweedEnabled: (tajweedEnabled) => set({ tajweedEnabled }),
            setShowTransliteration: (showTransliteration) => set({ showTransliteration }),
            setEnglishTranslationId: (englishTranslationId) => set({ englishTranslationId }),
            setTafsirChoice: (tafsirChoice) => set({ tafsirChoice }),
        }),
        {
            name: "settings",
            storage: zustandStorage,
            version: 2,
            // v1 saved equran.id's numeric reciter ids ("05"); v2 uses the reciter catalogue's ids.
            migrate: (persisted, version) => {
                const state = (persisted ?? {}) as Record<string, unknown>;
                if (version < 2 && typeof state.reciterId === "string") {
                    state.reciterId = legacyReciterIds[state.reciterId] ?? DEFAULT_RECITER_ID;
                }
                return state as unknown as SettingsState;
            },
        },
    ),
);
