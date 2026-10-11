import { Directory, File, Paths } from "expo-file-system";
import { ayahAudioUrl, type AudioQuality } from "@/constants/reciters";

// Downloaded recitation lives in the app's document folder: audio/{reciter}/{SSS}/{AAA}.mp3.
// Anything missing is streamed as usual, so a partly downloaded Surah still plays.

const pad = (value: number) => String(value).padStart(3, "0");

const surahDirectory = (reciterId: string, surahNumber: number) => new Directory(Paths.document, "audio", reciterId, pad(surahNumber));
const ayahFile = (reciterId: string, surahNumber: number, ayahNumber: number) => new File(surahDirectory(reciterId, surahNumber), `${pad(ayahNumber)}.mp3`);

/** The local file for an ayah if it was downloaded, otherwise null. */
export function localAyahUri(reciterId: string, surahNumber: number, ayahNumber: number): string | null {
    try {
        const file = ayahFile(reciterId, surahNumber, ayahNumber);
        return file.exists ? file.uri : null;
    } catch {
        return null;
    }
}

/** How many ayahs of a Surah are already on the device for this reciter. */
export function downloadedAyahCount(reciterId: string, surahNumber: number, ayahCount: number): number {
    let count = 0;
    for (let ayah = 1; ayah <= ayahCount; ayah++) if (localAyahUri(reciterId, surahNumber, ayah)) count++;
    return count;
}

const PARALLEL_DOWNLOADS = 3;

interface DownloadOptions {
    reciterId: string;
    surahNumber: number;
    ayahCount: number;
    /** Which files to fetch where a reciter has a smaller version. */
    quality?: AudioQuality;
    /** Called after each ayah with how many are done. */
    onProgress: (done: number) => void;
    /** Checked between ayahs; return true to stop. */
    shouldCancel: () => boolean;
}

/**
 * Download every ayah of a Surah that isn't on the device yet, a few at a time. A file that fails
 * is removed, so a later attempt never mistakes a half-written file for a finished one.
 */
export async function downloadSurahAudio({ reciterId, surahNumber, ayahCount, quality = "standard", onProgress, shouldCancel }: DownloadOptions): Promise<void> {
    const directory = surahDirectory(reciterId, surahNumber);
    if (!directory.exists) directory.create({ intermediates: true, idempotent: true });

    const pending = Array.from({ length: ayahCount }, (_, index) => index + 1);
    let done = 0;
    const worker = async () => {
        while (pending.length > 0 && !shouldCancel()) {
            const ayah = pending.shift()!;
            const file = ayahFile(reciterId, surahNumber, ayah);
            if (!file.exists) {
                try {
                    await File.downloadFileAsync(ayahAudioUrl(reciterId, surahNumber, ayah, quality), file);
                } catch (error) {
                    if (file.exists) file.delete();
                    throw error;
                }
            }
            done += 1;
            onProgress(done);
        }
    };
    await Promise.all(Array.from({ length: PARALLEL_DOWNLOADS }, worker));
}

export function deleteSurahAudio(reciterId: string, surahNumber: number): void {
    const directory = surahDirectory(reciterId, surahNumber);
    if (directory.exists) directory.delete();
}
