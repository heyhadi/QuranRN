import type { Ayah, RevelationPlace, SurahDetail, SurahNeighbour, SurahSummary, TafsirEntry } from "./types";

// Raw shapes from https://equran.id/api/v2. Only the fields the app reads are declared.

interface EquranEnvelope<T> {
    code: number;
    message: string;
    data: T;
}

interface EquranSurah {
    nomor: number;
    nama: string;
    namaLatin: string;
    jumlahAyat: number;
    tempatTurun: string;
    arti: string;
}

interface EquranAyah {
    nomorAyat: number;
    teksArab: string;
    teksLatin: string;
    teksIndonesia: string;
    audio: Record<string, string>;
}

interface EquranNeighbour {
    nomor: number;
    namaLatin: string;
}

interface EquranSurahDetail extends EquranSurah {
    ayat: EquranAyah[];
    // equran.id sends `false` instead of null at either end of the Quran.
    suratSelanjutnya: EquranNeighbour | false;
    suratSebelumnya: EquranNeighbour | false;
}

interface EquranTafsir extends EquranSurah {
    tafsir: { ayat: number; teks: string }[];
}

export type EquranSurahListResponse = EquranEnvelope<EquranSurah[]>;
export type EquranSurahDetailResponse = EquranEnvelope<EquranSurahDetail>;
export type EquranTafsirResponse = EquranEnvelope<EquranTafsir>;

function toRevelationPlace(value: string): RevelationPlace {
    return value === "Madinah" ? "Madinah" : "Mekah";
}

function toSurahSummary(raw: EquranSurah): SurahSummary {
    return {
        number: raw.nomor,
        nameArabic: raw.nama,
        nameLatin: raw.namaLatin,
        meaning: raw.arti,
        ayahCount: raw.jumlahAyat,
        revelationPlace: toRevelationPlace(raw.tempatTurun),
    };
}

function toNeighbour(raw: EquranNeighbour | false): SurahNeighbour | null {
    return raw ? { number: raw.nomor, nameLatin: raw.namaLatin } : null;
}

export function mapSurahList(response: EquranSurahListResponse): SurahSummary[] {
    return response.data.map(toSurahSummary);
}

export function mapSurahDetail(response: EquranSurahDetailResponse): SurahDetail {
    const raw = response.data;
    const ayahs: Ayah[] = raw.ayat.map((ayah) => ({
        surahNumber: raw.nomor,
        ayahNumber: ayah.nomorAyat,
        textArabic: ayah.teksArab,
        transliteration: ayah.teksLatin,
        translation: ayah.teksIndonesia,
        audio: ayah.audio,
    }));
    return {
        ...toSurahSummary(raw),
        ayahs,
        next: toNeighbour(raw.suratSelanjutnya),
        previous: toNeighbour(raw.suratSebelumnya),
    };
}

export function mapTafsir(response: EquranTafsirResponse): TafsirEntry[] {
    return response.data.tafsir.map((entry) => ({ ayahNumber: entry.ayat, text: entry.teks }));
}
