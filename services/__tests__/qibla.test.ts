import { arrowRotation, compassPoint, normaliseDegrees, qiblaBearing } from "../qibla";

describe("qiblaBearing", () => {
    // Reference bearings from standard great-circle Qibla tables, to the nearest degree.
    it.each([
        ["Singapore", 1.3521, 103.8198, 293],
        ["Jakarta", -6.2088, 106.8456, 295],
        ["London", 51.5074, -0.1278, 119],
        ["New York", 40.7128, -74.006, 58],
    ])("points from %s to the Kaaba", (_city, latitude, longitude, expected) => {
        expect(Math.abs(qiblaBearing(latitude, longitude) - expected)).toBeLessThan(1);
    });

    it("always returns an angle in [0, 360)", () => {
        const bearing = qiblaBearing(-33.8688, 151.2093);
        expect(bearing).toBeGreaterThanOrEqual(0);
        expect(bearing).toBeLessThan(360);
    });
});

describe("arrowRotation", () => {
    it("is 0 when the phone faces the Qibla", () => {
        expect(arrowRotation(293, 293)).toBe(0);
    });

    it("wraps around north", () => {
        expect(arrowRotation(10, 350)).toBe(20);
        expect(arrowRotation(350, 10)).toBe(340);
    });
});

describe("normaliseDegrees", () => {
    it("maps negative and large angles into [0, 360)", () => {
        expect(normaliseDegrees(-90)).toBe(270);
        expect(normaliseDegrees(720)).toBe(0);
    });
});

describe("compassPoint", () => {
    it("names the nearest of the eight compass points", () => {
        expect(compassPoint(293)).toBe("NW");
        expect(compassPoint(0)).toBe("N");
        expect(compassPoint(359)).toBe("N");
        expect(compassPoint(119)).toBe("SE");
    });
});
