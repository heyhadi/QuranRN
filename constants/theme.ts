// Wird design tokens: mushaf green carries the brand and reading state, brass marks place and
// progress (ayah markers, Surah numbers, streaks). Values match docs/quranrn-plan.html.

import type { TajweedColorKey } from "./tajweed";

export type ColorScheme = "light" | "dark";

export interface Palette {
    /** Screen background. */
    paper: string;
    /** Cards, sheets, tab bar. */
    surface: string;
    /** Wells, chips, inactive segments. */
    surface2: string;
    ink: string;
    ink2: string;
    line: string;
    mushaf: string;
    mushafSoft: string;
    onMushaf: string;
    brass: string;
    brassSoft: string;
    danger: string;
    /** Feature cards (Surah title plate, Continue reading): deep green with cream text, in both themes. */
    heroBackground: string;
    heroInk: string;
    heroAccent: string;
    /** Letter colours for each tajweed rule family. */
    tajweed: Record<TajweedColorKey, string>;
}

export const palettes: Record<ColorScheme, Palette> = {
    light: {
        paper: "#F4F7F4",
        surface: "#FFFFFF",
        surface2: "#E9EFEB",
        ink: "#142520",
        ink2: "#4E625B",
        line: "#D3DDD7",
        mushaf: "#0F5A46",
        mushafSoft: "#DCEDE5",
        onMushaf: "#FFFFFF",
        brass: "#A67A2C",
        brassSoft: "#F3E8D3",
        danger: "#B42318",
        heroBackground: "#0F5A46",
        heroInk: "#F6F1E4",
        heroAccent: "#D9B86C",
        tajweed: {
            silent: "#8E9894",
            maddNormal: "#3D6BF0",
            maddPermissible: "#3442E0",
            maddObligatory: "#1F3BB0",
            maddNecessary: "#0A1690",
            qalqalah: "#CC1016",
            ikhfa: "#8E1AA3",
            ikhfaShafawi: "#C0169F",
            ghunnah: "#D9650A",
            iqlab: "#0E8CC4",
            idghamGhunnah: "#127C62",
            idghamWithout: "#2C8A12",
            idghamShafawi: "#4F9A00",
        },
    },
    dark: {
        paper: "#0B1310",
        surface: "#121D19",
        surface2: "#1A2823",
        ink: "#E3ECE8",
        ink2: "#9DB0A8",
        line: "#26362F",
        mushaf: "#4FBF98",
        mushafSoft: "#173A2F",
        onMushaf: "#06231A",
        brass: "#D6AE62",
        brassSoft: "#3A2F1A",
        danger: "#F07067",
        heroBackground: "#12382E",
        heroInk: "#EFE8D6",
        heroAccent: "#D6AE62",
        tajweed: {
            silent: "#7D8A85",
            maddNormal: "#86A6FF",
            maddPermissible: "#9AA2FF",
            maddObligatory: "#7C95FF",
            maddNecessary: "#6F7CFF",
            qalqalah: "#FF6268",
            ikhfa: "#D57AE8",
            ikhfaShafawi: "#F075D2",
            ghunnah: "#FFA25A",
            iqlab: "#4CC3F5",
            idghamGhunnah: "#45C9A6",
            idghamWithout: "#6AD255",
            idghamShafawi: "#A3E04A",
        },
    },
};

/** Font family names, as registered with useFonts in app/_layout.tsx. */
export const fonts = {
    display: "ReemKufi_600SemiBold",
    displayBold: "ReemKufi_700Bold",
    body: "SourceSans3_400Regular",
    bodyMedium: "SourceSans3_600SemiBold",
    bodyBold: "SourceSans3_700Bold",
    quran: "Amiri_400Regular",
    quranBold: "Amiri_700Bold",
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 } as const;

/** Arabic text size range offered in Settings, in points. */
export const arabicFontSize = { min: 20, max: 40, step: 2, default: 28 } as const;
