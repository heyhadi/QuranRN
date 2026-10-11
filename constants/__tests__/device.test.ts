import { isPhone, lockPhoneToPortrait } from "../device";

describe("isPhone", () => {
    it.each([[390, 844], [844, 390], [430, 932], [360, 800]])("treats %ix%i as a phone", (width, height) => expect(isPhone(width, height)).toBe(true));
    it.each([[744, 1133], [834, 1194], [1024, 1366], [1366, 1024], [768, 1024]])("treats %ix%i as a tablet", (width, height) => expect(isPhone(width, height)).toBe(false));
});

describe("lockPhoneToPortrait", () => {
    it("never throws when the native module is missing", async () => {
        // In the test environment the module has no native side, as on an older dev build.
        await expect(lockPhoneToPortrait()).resolves.toBeUndefined();
    });
});
