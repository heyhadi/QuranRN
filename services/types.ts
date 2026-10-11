// App-facing types. Screens only see these; raw API shapes stay inside services/.

export type RevelationPlace = "Mekah" | "Madinah";

export interface SurahSummary {
    number: number;
    nameArabic: string;
    nameLatin: string;
    meaning: string;
    ayahCount: number;
    revelationPlace: RevelationPlace;
}

export interface Ayah {
    surahNumber: number;
    ayahNumber: number;
    textArabic: string;
    transliteration: string;
    translation: string;
    /** Per-ayah audio URL keyed by equran.id reciter id ("01"–"06"). */
    audio: Record<string, string>;
}

export interface SurahNeighbour {
    number: number;
    nameLatin: string;
}

export interface SurahDetail extends SurahSummary {
    ayahs: Ayah[];
    next: SurahNeighbour | null;
    previous: SurahNeighbour | null;
}

export interface TafsirEntry {
    ayahNumber: number;
    text: string;
}
