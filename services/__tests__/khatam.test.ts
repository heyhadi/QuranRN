import { AYAH_COUNTS, TOTAL_AYAHS } from "@/constants/ayahCounts";
import { addToIntervals, countCovered, currentStreak, dailyTarget, dateKey, fromGlobalAyahIndex, globalAyahIndex, juzAt, juzCompletion, khatamProgress, longestStreak, type Interval } from "../khatam";

const day = (iso: string) => {
    const [year, month, date] = iso.split("-").map(Number);
    return new Date(year, month - 1, date, 14, 30);
};

describe("ayah counts", () => {
    it("are 114 Surahs adding up to 6,236 ayahs", () => {
        expect(AYAH_COUNTS).toHaveLength(114);
        expect(AYAH_COUNTS.reduce((sum, count) => sum + count, 0)).toBe(TOTAL_AYAHS);
    });
});

describe("globalAyahIndex and back", () => {
    it.each([
        [1, 1, 1],
        [1, 7, 7],
        [2, 1, 8],
        [2, 286, 293],
        [114, 6, 6236],
    ])("%i:%i is position %i", (surah, ayah, position) => {
        expect(globalAyahIndex(surah, ayah)).toBe(position);
        expect(fromGlobalAyahIndex(position)).toEqual({ surahNumber: surah, ayahNumber: ayah });
    });

    it("round-trips every ayah of the Quran", () => {
        let expected = 0;
        for (let surah = 1; surah <= 114; surah++) {
            for (let ayah = 1; ayah <= AYAH_COUNTS[surah - 1]; ayah++) {
                expected += 1;
                if (globalAyahIndex(surah, ayah) !== expected) throw new Error(`${surah}:${ayah} is not position ${expected}`);
            }
        }
        expect(expected).toBe(TOTAL_AYAHS);
    });

    it("keeps out-of-range positions inside the Quran", () => {
        expect(fromGlobalAyahIndex(0)).toEqual({ surahNumber: 1, ayahNumber: 1 });
        expect(fromGlobalAyahIndex(99999)).toEqual({ surahNumber: 114, ayahNumber: 6 });
    });
});

describe("dailyTarget", () => {
    it("rounds up so the plan finishes on time", () => {
        expect(dailyTarget(30)).toBe(208);
        expect(dailyTarget(1)).toBe(6236);
        expect(dailyTarget(0)).toBe(6236);
    });
});

describe("streaks", () => {
    const log = { "2026-10-07": 12, "2026-10-08": 40, "2026-10-09": 5, "2026-10-10": 30 };

    it("counts days in a row up to today, once today has some reading", () => {
        expect(currentStreak({ ...log, "2026-10-11": 3 }, day("2026-10-11"))).toBe(5);
    });

    it("keeps yesterday's streak alive while today is still empty", () => {
        expect(currentStreak(log, day("2026-10-11"))).toBe(4);
    });

    it("resets after a missed day", () => {
        expect(currentStreak(log, day("2026-10-12"))).toBe(0);
    });

    it("finds the longest run in the log", () => {
        expect(longestStreak({ ...log, "2026-10-01": 9, "2026-10-02": 9 })).toBe(4);
        expect(longestStreak({})).toBe(0);
    });

    it("counts across month and year boundaries", () => {
        expect(currentStreak({ "2026-12-30": 1, "2026-12-31": 1, "2027-01-01": 1 }, day("2027-01-01"))).toBe(3);
    });

    it("does not count a day logged as zero", () => {
        expect(currentStreak({ "2026-10-10": 0 }, day("2026-10-10"))).toBe(0);
    });
});

describe("dateKey", () => {
    it("uses the local calendar day", () => {
        expect(dateKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
    });
});

describe("khatamProgress", () => {
    it("reports the share read, days left and the pace needed to finish on time", () => {
        const progress = khatamProgress(3118, day("2026-10-01"), 30, day("2026-10-11"));

        expect(progress.fraction).toBeCloseTo(0.5, 2);
        expect(progress.daysLeft).toBe(20);
        expect(progress.perDayToFinish).toBe(Math.ceil((TOTAL_AYAHS - 3118) / 20));
    });

    it("never reports negative days and flags a finished plan", () => {
        const late = khatamProgress(TOTAL_AYAHS, day("2026-01-01"), 30, day("2026-10-11"));

        expect(late.daysLeft).toBe(0);
        expect(late.isFinished).toBe(true);
        expect(late.perDayToFinish).toBe(0);
    });
});

describe("intervals", () => {
    it("merges touching and overlapping ranges and ignores repeats", () => {
        let read: Interval[] = [];
        read = addToIntervals(read, [1, 2, 3, 3]);
        read = addToIntervals(read, [5, 6]);
        expect(read).toEqual([[1, 3], [5, 6]]);

        read = addToIntervals(read, [4]);
        expect(read).toEqual([[1, 6]]);
        expect(countCovered(read)).toBe(6);
    });

    it("keeps separate ranges separate and sorted", () => {
        expect(addToIntervals([[100, 110]], [3, 4, 50])).toEqual([[3, 4], [50, 50], [100, 110]]);
    });

    it("drops positions outside the Quran", () => {
        expect(addToIntervals([], [0, -5, 6237, 6236])).toEqual([[6236, 6236]]);
    });
});

describe("juzCompletion", () => {
    it("shows how much of each Juz is covered", () => {
        const start = globalAyahIndex(2, 142);
        const completion = juzCompletion([[1, start + 9]]);

        expect(completion[0]).toBe(1);
        expect(completion[1]).toBeGreaterThan(0);
        expect(completion[1]).toBeLessThan(1);
        expect(completion[2]).toBe(0);
        expect(completion).toHaveLength(30);
    });

    it("counts only what was really read, not what lies between", () => {
        const completion = juzCompletion([[globalAyahIndex(18, 1), globalAyahIndex(18, 10)]]);

        expect(completion[14]).toBeGreaterThan(0);
        expect(completion[13]).toBe(0);
    });

    it("marks the whole Quran as read", () => {
        expect(juzCompletion([[1, TOTAL_AYAHS]]).every((share) => share === 1)).toBe(true);
    });
});

describe("juzAt", () => {
    it("names the Juz at a position", () => {
        expect(juzAt(globalAyahIndex(18, 1))).toBe(15);
        expect(juzAt(1)).toBe(1);
    });
});
