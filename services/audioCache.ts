import { Directory, File, Paths } from "expo-file-system";

// Streamed recitation is kept in the app's cache folder so the next ayah can start at once and a repeated
// ayah is not downloaded again. Files here are a convenience: the system may clear the folder when storage
// is low, and the cache is kept under a size limit, oldest files removed first. Surahs the person downloads
// on purpose live elsewhere (services/audioDownloads.ts) and are never touched.

export const CACHE_LIMIT_BYTES = 150 * 1024 * 1024;
const PART_SUFFIX = ".part";
const STALE_PART_MS = 60 * 60 * 1000;

export interface CacheEntry {
    name: string;
    size: number;
    /** Epoch milliseconds the file was last written. */
    modified: number;
}

/** A file name for an audio URL, e.g. "https://everyayah.com/data/Alafasy_128kbps/002255.mp3" → "Alafasy_128kbps_002255.mp3". */
export function cacheNameFor(url: string): string {
    const path = url.replace(/^https?:\/\/[^/]+\//, "").replace(/^(data|audio-partial)\//, "");
    return path.replace(/[^A-Za-z0-9._-]/g, "_");
}

/** Which files to delete so the rest fit under the limit: the oldest first, only as many as needed. */
export function planEviction(entries: CacheEntry[], maxBytes: number): string[] {
    let total = entries.reduce((sum, entry) => sum + entry.size, 0);
    const doomed: string[] = [];
    for (const entry of [...entries].sort((a, b) => a.modified - b.modified)) {
        if (total <= maxBytes) break;
        doomed.push(entry.name);
        total -= entry.size;
    }
    return doomed;
}

const directory = () => new Directory(Paths.cache, "audio-stream");
const inFlight = new Map<string, Promise<void>>();

/** The saved copy of an audio URL, or null when there is none. */
export function cachedAudioUri(url: string): string | null {
    try {
        const file = new File(directory(), cacheNameFor(url));
        return file.exists && (file.size ?? 0) > 0 ? file.uri : null;
    } catch {
        return null;
    }
}

/** Download an audio URL into the cache in the background. Safe to call again: a file already saved, or on its way, is skipped. */
export function prefetchAudio(url: string): Promise<void> {
    const name = cacheNameFor(url);
    const existing = inFlight.get(name);
    if (existing) return existing;
    const task = (async () => {
        try {
            const dir = directory();
            if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
            const final = new File(dir, name);
            if (final.exists && (final.size ?? 0) > 0) return;
            // Downloaded under a temporary name and renamed when whole, so a half file is never played.
            const part = new File(dir, name + PART_SUFFIX);
            if (part.exists) part.delete();
            try {
                await File.downloadFileAsync(url, part);
                part.rename(name);
            } catch (error) {
                if (part.exists) part.delete();
                throw error;
            }
            trimCache();
        } finally {
            inFlight.delete(name);
        }
    })();
    inFlight.set(name, task);
    return task;
}

function entries(): { name: string; file: File; entry: CacheEntry }[] {
    const dir = directory();
    if (!dir.exists) return [];
    const found: { name: string; file: File; entry: CacheEntry }[] = [];
    for (const item of dir.list()) {
        if (!(item instanceof File)) continue;
        try {
            const info = item.info();
            const name = item.name;
            found.push({ name, file: item, entry: { name, size: info.size ?? item.size ?? 0, modified: info.modificationTime ?? 0 } });
        } catch {
            // A file that cannot be read is left alone.
        }
    }
    return found;
}

/** Keep the cache under its limit, and remove temporary files an interrupted download left behind. */
export function trimCache(maxBytes: number = CACHE_LIMIT_BYTES): void {
    try {
        const all = entries();
        const now = Date.now();
        for (const { name, file, entry } of all) if (name.endsWith(PART_SUFFIX) && now - entry.modified > STALE_PART_MS) file.delete();
        const whole = all.filter(({ name }) => !name.endsWith(PART_SUFFIX));
        const doomed = new Set(planEviction(whole.map(({ entry }) => entry), maxBytes));
        for (const { name, file } of whole) if (doomed.has(name)) file.delete();
    } catch {
        // Trimming is housekeeping; it must never get in the way of playback.
    }
}

/** How much space the cache uses, in bytes. */
export function cacheSizeBytes(): number {
    try {
        return entries().reduce((sum, { entry }) => sum + entry.size, 0);
    } catch {
        return 0;
    }
}

export function clearAudioCache(): void {
    try {
        const dir = directory();
        if (dir.exists) dir.delete();
    } catch {
        // Nothing to clear.
    }
}

/** "38 MB", "1.2 GB", "0 KB": a size for people. */
export function formatBytes(bytes: number): string {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
    return `${Math.round(bytes / 1024)} KB`;
}
