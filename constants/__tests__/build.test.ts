import { versionLabel } from "../build";

describe("versionLabel", () => {
    it("names the commit of an EAS build", () => {
        expect(versionLabel("1.0.0", "87defc1")).toBe("1.0.0 (87defc1)");
    });

    it("says dev when there is no commit", () => {
        expect(versionLabel("1.0.0", null)).toBe("1.0.0 (dev)");
        expect(versionLabel(undefined, undefined)).toBe("1.0.0 (dev)");
        expect(versionLabel("1.2.0", "")).toBe("1.2.0 (dev)");
    });
});
