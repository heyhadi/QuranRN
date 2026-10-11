import { getJson } from "./http";
import {
    mapSurahDetail,
    mapSurahList,
    mapTafsir,
    type EquranSurahDetailResponse,
    type EquranSurahListResponse,
    type EquranTafsirResponse,
} from "./mappers";
import type { SurahDetail, SurahSummary, TafsirEntry } from "./types";

const API_BASE_URL = "https://equran.id/api/v2";

export async function getSurahList(): Promise<SurahSummary[]> {
    return mapSurahList(await getJson<EquranSurahListResponse>(`${API_BASE_URL}/surat`));
}

export async function getSurahDetail(surahNumber: number): Promise<SurahDetail> {
    return mapSurahDetail(await getJson<EquranSurahDetailResponse>(`${API_BASE_URL}/surat/${surahNumber}`));
}

export async function getTafsir(surahNumber: number): Promise<TafsirEntry[]> {
    return mapTafsir(await getJson<EquranTafsirResponse>(`${API_BASE_URL}/tafsir/${surahNumber}`));
}
