import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { qiblaBearing } from "@/services/qibla";

export type QiblaState =
    | { status: "loading" }
    | { status: "permission-denied" }
    | { status: "error"; message: string }
    | { status: "ready"; bearing: number; heading: number | null };

/** Qibla bearing from the device's location, plus the live compass heading (null until the compass reports). */
export function useQiblaDirection(): QiblaState {
    const [state, setState] = useState<QiblaState>({ status: "loading" });

    useEffect(() => {
        let cancelled = false;
        let headingSubscription: Location.LocationSubscription | null = null;

        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (cancelled) return;
                if (status !== Location.PermissionStatus.GRANTED) {
                    setState({ status: "permission-denied" });
                    return;
                }
                const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                if (cancelled) return;
                const bearing = qiblaBearing(position.coords.latitude, position.coords.longitude);
                setState({ status: "ready", bearing, heading: null });

                headingSubscription = await Location.watchHeadingAsync((heading) => {
                    // trueHeading is -1 when the OS can't resolve true north yet; fall back to magnetic.
                    const value = heading.trueHeading >= 0 ? heading.trueHeading : heading.magHeading;
                    setState({ status: "ready", bearing, heading: value });
                });
                if (cancelled) headingSubscription.remove();
            } catch (error) {
                if (!cancelled) setState({ status: "error", message: error instanceof Error ? error.message : String(error) });
            }
        })();

        return () => {
            cancelled = true;
            headingSubscription?.remove();
        };
    }, []);

    return state;
}
