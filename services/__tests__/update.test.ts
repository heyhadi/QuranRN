import { buildFromTag } from "../update";

describe("buildFromTag", () => {
    it("reads the versionCode after the dash, the form CI tags releases with", () => {
        expect(buildFromTag("v1.0.16-16")).toBe(16);
        expect(buildFromTag("v2.4.0-62")).toBe(62);
    });

    it("reads older tags that end in the versionCode, like the v1.0.15 release", () => {
        expect(buildFromTag("v1.0.15")).toBe(15);
        expect(buildFromTag("1.0.12")).toBe(12);
    });

    it("finds build 15 newer than an installed build 14", () => {
        expect(buildFromTag("v1.0.15")).toBeGreaterThan(14);
    });

    it("gives 0 for tags it doesn't understand, so no update is offered by mistake", () => {
        expect(buildFromTag("")).toBe(0);
        expect(buildFromTag("latest")).toBe(0);
        expect(buildFromTag("v1.0.15-beta")).toBe(0);
        expect(buildFromTag("v1.0")).toBe(0);
    });
});
