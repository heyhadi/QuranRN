const KAABA = { latitude: 21.422487, longitude: 39.826206 };

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

/** Normalise any angle to the range [0, 360). */
export function normaliseDegrees(degrees: number): number {
    return ((degrees % 360) + 360) % 360;
}

/** Initial great-circle bearing from a point to the Kaaba, in degrees clockwise from true north. */
export function qiblaBearing(latitude: number, longitude: number): number {
    const lat = toRadians(latitude);
    const kaabaLat = toRadians(KAABA.latitude);
    const deltaLon = toRadians(KAABA.longitude - longitude);
    const y = Math.sin(deltaLon);
    const x = Math.cos(lat) * Math.tan(kaabaLat) - Math.sin(lat) * Math.cos(deltaLon);
    return normaliseDegrees(toDegrees(Math.atan2(y, x)));
}

/** How far to rotate the Qibla arrow, given where the phone is pointing. */
export function arrowRotation(bearing: number, deviceHeading: number): number {
    return normaliseDegrees(bearing - deviceHeading);
}

const COMPASS_POINTS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

export function compassPoint(degrees: number): (typeof COMPASS_POINTS)[number] {
    return COMPASS_POINTS[Math.round(normaliseDegrees(degrees) / 45) % 8];
}
