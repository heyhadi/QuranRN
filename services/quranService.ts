import { getJson } from "./http";
import {
    mapChapterMeanings,
    mapSurahDetail,
    mapSurahList,
    mapTafsir,
    type EquranSurahDetailResponse,
    type EquranSurahListResponse,
    type EquranTafsirResponse,
    type QuranComChaptersResponse,
} from "./mappers";
import type { SurahDetail, SurahSummary, TafsirEntry } from "./types";

const API_BASE_URL = "https://equran.id/api/v2";
const QURAN_COM_API_URL = "https://api.quran.com/api/v4";

/** English Surah meanings from quran.com; equran.id only has Indonesian ones. */
export async function getEnglishSurahMeanings(): Promise<Record<number, string>> {
    return mapChapterMeanings(await getJson<QuranComChaptersResponse>(`${QURAN_COM_API_URL}/chapters?language=en`));
}

export async function getSurahList(): Promise<SurahSummary[]> {
    return mapSurahList(await getJson<EquranSurahListResponse>(`${API_BASE_URL}/surat`));
}

export async function getSurahDetail(surahNumber: number): Promise<SurahDetail> {
    return mapSurahDetail(await getJson<EquranSurahDetailResponse>(`${API_BASE_URL}/surat/${surahNumber}`));
}

export async function getTafsir(surahNumber: number): Promise<TafsirEntry[]> {
    return mapTafsir(await getJson<EquranTafsirResponse>(`${API_BASE_URL}/tafsir/${surahNumber}`));
}
