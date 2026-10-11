import { arabicFontSize } from "@/constants/theme";
import { clampArabicFontSize, useSettingsStore } from "../settings";
import { storage } from "../storage";

beforeEach(() => {
    storage.clearAll();
    useSettingsStore.setState({ arabicFontSize: arabicFontSize.default, themePreference: "system", languagePreference: "system" });
});

describe("settings store", () => {
    it("steps the Arabic size and stops at the limits", () => {
        const { stepArabicFontSize } = useSettingsStore.getState();

        stepArabicFontSize(1);
        expect(useSettingsStore.getState().arabicFontSize).toBe(arabicFontSize.default + arabicFontSize.step);

        for (let i = 0; i < 20; i++) stepArabicFontSize(1);
        expect(useSettingsStore.getState().arabicFontSize).toBe(arabicFontSize.max);

        for (let i = 0; i < 20; i++) stepArabicFontSize(-1);
        expect(useSettingsStore.getState().arabicFontSize).toBe(arabicFontSize.min);
    });

    it("saves the chosen theme and language", () => {
        useSettingsStore.getState().setThemePreference("dark");
        useSettingsStore.getState().setLanguagePreference("en");

        const saved = JSON.parse(storage.getString("settings") ?? "{}");
        expect(saved.state).toMatchObject({ themePreference: "dark", languagePreference: "en" });
    });
});

describe("clampArabicFontSize", () => {
    it("keeps sizes inside the allowed range", () => {
        expect(clampArabicFontSize(5)).toBe(arabicFontSize.min);
        expect(clampArabicFontSize(99)).toBe(arabicFontSize.max);
        expect(clampArabicFontSize(30)).toBe(30);
    });
});
