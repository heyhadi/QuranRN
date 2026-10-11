import * as Location from "expo-location";
import { useCallback, useEffect, useMemo, useState } from "react";
import { dateKey } from "@/services/khatam";
import { dayFor, getPrayerMonth, type DayTimes, type PrayerMonth } from "@/services/prayerTimes";
import { monthKey, usePrayerStore } from "@/store/prayer";

export type PrayerTimesState =
    | { status: "loading" }
    | { status: "needs-location"; denied: boolean }
    | { status: "offline" }
    | { status: "ready"; timezone: string; today: DayTimes; days: DayTimes[]; isStale: boolean };

function monthsNeeded(now: Date): { year: number; month: number }[] {
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return [
        { year: now.getFullYear(), month: now.getMonth() + 1 },
        { year: next.getFullYear(), month: next.getMonth() + 1 },
    ];
}

/**
 * Prayer times for the phone's location. The last known location and the fetched months are saved, so
 * the screen works offline after the first load; the location is only asked for when there is none.
 */
export function usePrayerTimes() {
    const location = usePrayerStore((state) => state.location);
    const methodId = usePrayerStore((state) => state.methodId);
    const months = usePrayerStore((state) => state.months);
    const setLocation = usePrayerStore((state) => state.setLocation);
    const saveMonth = usePrayerStore((state) => state.saveMonth);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [fetchFailed, setFetchFailed] = useState(false);
    const [locating, setLocating] = useState(false);
    const [attempt, setAttempt] = useState(0);

    const requestLocation = useCallback(async () => {
        setLocating(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== Location.PermissionStatus.GRANTED) {
                setPermissionDenied(true);
                return;
            }
            setPermissionDenied(false);
            const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            setLocation(position.coords.latitude, position.coords.longitude);
        } catch {
            setPermissionDenied(false);
        } finally {
            setLocating(false);
        }
    }, [setLocation]);

    // Fetch this month and next for the saved location, whenever the location, method or a retry changes.
    useEffect(() => {
        if (!location) return;
        let cancelled = false;
        (async () => {
            const now = new Date();
            let failed = false;
            for (const { year, month } of monthsNeeded(now)) {
                const key = monthKey(year, month, methodId, location.latitude, location.longitude);
                if (usePrayerStore.getState().months[key]) continue;
                try {
                    const result = await getPrayerMonth(location.latitude, location.longitude, year, month, methodId);
                    if (!cancelled) saveMonth(key, result);
                } catch {
                    failed = true;
                }
            }
            if (!cancelled) setFetchFailed(failed);
        })();
        return () => {
            cancelled = true;
        };
    }, [location, methodId, attempt, saveMonth]);

    const state: PrayerTimesState = useMemo(() => {
        if (!location) return locating ? { status: "loading" } : { status: "needs-location", denied: permissionDenied };
        const now = new Date();
        const found: PrayerMonth[] = monthsNeeded(now)
            .map(({ year, month }) => months[monthKey(year, month, methodId, location.latitude, location.longitude)])
            .filter((entry): entry is PrayerMonth => entry !== undefined);
        if (found.length === 0) return fetchFailed ? { status: "offline" } : { status: "loading" };
        const timezone = found[0].timezone;
        const days = found.flatMap((entry) => entry.days);
        // "Today" is the calendar day at the prayer location, not at the phone's own zone.
        const zoneDate = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
        const today = dayFor(found[0], zoneDate) ?? days.find((day) => day.date === zoneDate) ?? days.find((day) => day.date === dateKey(now));
        if (!today) return fetchFailed ? { status: "offline" } : { status: "loading" };
        return { status: "ready", timezone, today, days, isStale: fetchFailed };
    }, [location, months, methodId, fetchFailed, locating, permissionDenied]);

    return { state, requestLocation, retry: () => setAttempt((value) => value + 1), locating };
}
