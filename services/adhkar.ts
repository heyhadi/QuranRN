import morningEn from "@/constants/adhkar/morning-dhikr.en.json";
import morningId from "@/constants/adhkar/morning-dhikr.id.json";
import eveningEn from "@/constants/adhkar/evening-dhikr.en.json";
import eveningId from "@/constants/adhkar/evening-dhikr.id.json";
import afterEn from "@/constants/adhkar/dhikr-after-salah.en.json";
import afterId from "@/constants/adhkar/dhikr-after-salah.id.json";
import dailyEn from "@/constants/adhkar/daily-dua.en.json";
import dailyId from "@/constants/adhkar/daily-dua.id.json";
import selectedEn from "@/constants/adhkar/selected-dua.en.json";
import selectedId from "@/constants/adhkar/selected-dua.id.json";

export type AdhkarSetId = "morning" | "evening" | "afterSalah" | "dailyDua" | "selectedDua";
export type AdhkarLanguage = "en" | "id";

export interface AdhkarItem {
    title: string;
    arabic: string;
    latin: string;
    translation: string;
    /** How many times to recite it (1 when the text names no number). */
    repeat: number;
    /** The repeat instruction as published, e.g. "Recite 3x". */
    note: string;
    benefit: string;
    source: string;
}

/** The adhkar read as a daily routine, in the order they are shown as tabs. */
export const ADHKAR_ROUTINES: AdhkarSetId[] = ["morning", "evening", "afterSalah"];

const DATA: Record<AdhkarSetId, Record<AdhkarLanguage, AdhkarItem[]>> = {
    morning: { en: morningEn, id: morningId },
    evening: { en: eveningEn, id: eveningId },
    afterSalah: { en: afterEn, id: afterId },
    dailyDua: { en: dailyEn, id: dailyId },
    selectedDua: { en: selectedEn, id: selectedId },
};

export function getAdhkar(set: AdhkarSetId, language: AdhkarLanguage): AdhkarItem[] {
    return DATA[set][language];
}

/** The routine that fits the hour: morning adhkar until the afternoon, evening adhkar after. */
export function routineForHour(hour: number): "morning" | "evening" {
    return hour >= 4 && hour < 15 ? "morning" : "evening";
}
