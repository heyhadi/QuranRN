import { AYAH_COUNTS, TOTAL_AYAHS } from "@/constants/ayahCounts";
import { juzOf, juzStarts } from "./juz";

/** Position in the whole Quran, 1 to 6,236: Al-Fatihah 1 is 1, An-Nas 6 is 6,236. */
export function globalAyahIndex(surahNumber: number, ayahNumber: number): number {
    let index = ayahNumber;
    for (let surah = 1; surah < surahNumber; surah++) index += AYAH_COUNTS[surah - 1];
    return index;
}

/** The Surah and ayah at a position in the whole Quran. */
export function fromGlobalAyahIndex(index: number): { surahNumber: number; ayahNumber: number } {
    let remaining = Math.min(Math.max(Math.round(index), 1), TOTAL_AYAHS);
    for (let surah = 1; surah <= AYAH_COUNTS.length; surah++) {
        const count = AYAH_COUNTS[surah - 1];
        if (remaining <= count) return { surahNumber: surah, ayahNumber: remaining };
        remaining -= count;
    }
    return { surahNumber: 114, ayahNumber: AYAH_COUNTS[113] };
}

/** Ayahs to read each day to finish the Quran in `targetDays` days. */
export function dailyTarget(targetDays: number): number {
    return Math.ceil(TOTAL_AYAHS / Math.max(1, targetDays));
}

/** "2026-10-11": the calendar day in the user's own time zone, which is what a streak should count. */
export function dateKey(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
}

function shiftDays(date: Date, days: number): Date {
    const shifted = new Date(date);
    shifted.setDate(shifted.getDate() + days);
    return shifted;
}

/**
 * Days in a row with some reading, counting back from today. A day with no reading yet does not break
 * the streak until it is over, so a streak of 5 stays 5 all of today until you have had the chance to read.
 */
export function currentStreak(log: Record<string, number>, today: Date): number {
    let streak = 0;
    let day = (log[dateKey(today)] ?? 0) > 0 ? today : shiftDays(today, -1);
    while ((log[dateKey(day)] ?? 0) > 0) {
        streak += 1;
        day = shiftDays(day, -1);
    }
    return streak;
}

export function longestStreak(log: Record<string, number>): number {
    const days = Object.keys(log)
        .filter((key) => log[key] > 0)
        .sort();
    let longest = 0;
    let run = 0;
    let previous: Date | null = null;
    for (const key of days) {
        const [year, month, day] = key.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        run = previous && dateKey(shiftDays(previous, 1)) === key ? run + 1 : 1;
        longest = Math.max(longest, run);
        previous = date;
    }
    return longest;
}

export type Interval = [start: number, end: number];

/** Add the positions to a list of sorted, non-overlapping intervals, merging any that touch. */
export function addToIntervals(intervals: Interval[], positions: number[]): Interval[] {
    const sorted = [...new Set(positions)].filter((position) => position >= 1 && position <= TOTAL_AYAHS).sort((a, b) => a - b);
    const added: Interval[] = [];
    for (const position of sorted) {
        const last = added[added.length - 1];
        if (last && position === last[1] + 1) last[1] = position;
        else added.push([position, position]);
    }
    const merged: Interval[] = [];
    for (const interval of [...intervals, ...added].sort((a, b) => a[0] - b[0])) {
        const last = merged[merged.length - 1];
        if (last && interval[0] <= last[1] + 1) last[1] = Math.max(last[1], interval[1]);
        else merged.push([interval[0], interval[1]]);
    }
    return merged;
}

/** How many ayahs the intervals cover. */
export function countCovered(intervals: Interval[]): number {
    return intervals.reduce((sum, [start, end]) => sum + (end - start + 1), 0);
}

export interface KhatamProgress {
    /** Ayahs read so far, as a share of the whole Quran (0 to 1). */
    fraction: number;
    /** Whole days left of the plan, never below 0. */
    daysLeft: number;
    /** Ayahs left to read each remaining day to finish on time. */
    perDayToFinish: number;
    isFinished: boolean;
}

export function khatamProgress(readCount: number, startDate: Date, targetDays: number, today: Date): KhatamProgress {
    const fraction = Math.min(1, Math.max(0, readCount / TOTAL_AYAHS));
    const elapsed = Math.max(0, Math.round((startOfDay(today).getTime() - startOfDay(startDate).getTime()) / 86_400_000));
    const daysLeft = Math.max(0, targetDays - elapsed);
    const remaining = TOTAL_AYAHS - readCount;
    return { fraction, daysLeft, perDayToFinish: remaining <= 0 ? 0 : Math.ceil(remaining / Math.max(1, daysLeft)), isFinished: remaining <= 0 };
}

function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** For each of the 30 Juz, the share of its ayahs that have been read (0 to 1). */
export function juzCompletion(intervals: Interval[]): number[] {
    return juzStarts.map((start, index) => {
        const first = globalAyahIndex(start.surahNumber, start.ayahNumber);
        const next = juzStarts[index + 1];
        const last = next ? globalAyahIndex(next.surahNumber, next.ayahNumber) - 1 : TOTAL_AYAHS;
        let covered = 0;
        for (const [from, to] of intervals) {
            const overlap = Math.min(to, last) - Math.max(from, first) + 1;
            if (overlap > 0) covered += overlap;
        }
        return covered / (last - first + 1);
    });
}

/** The Juz a position falls in. */
export function juzAt(position: number): number {
    const { surahNumber, ayahNumber } = fromGlobalAyahIndex(position);
    return juzOf(surahNumber, ayahNumber);
}
