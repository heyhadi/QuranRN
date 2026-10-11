import en from "@/locales/en.json";
import id from "@/locales/id.json";
import { deviceLanguage, resolveLanguage } from "..";

function keys(value: unknown, prefix = ""): string[] {
    if (typeof value !== "object" || value === null) return [prefix];
    return Object.entries(value).flatMap(([key, child]) => keys(child, prefix ? `${prefix}.${key}` : key));
}

describe("translations", () => {
    it("has the same keys in English and Indonesian", () => {
        expect(keys(id).sort()).toEqual(keys(en).sort());
    });

    it("has no empty strings", () => {
        for (const locale of [en, id]) {
            const empty = keys(locale).filter((key) => key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], locale) === "");
            expect(empty).toEqual([]);
        }
    });
});

describe("deviceLanguage", () => {
    it.each([
        ["id-ID", "id"],
        ["in_ID", "id"],
        ["ms-MY", "id"],
        ["en-SG", "en"],
        ["en-US", "en"],
        ["ar-SA", "en"],
    ])("maps %s to %s", (locale, expected) => {
        expect(deviceLanguage(locale)).toBe(expected);
    });
});

describe("resolveLanguage", () => {
    it("follows the device when set to system", () => {
        expect(resolveLanguage("system", "id-ID")).toBe("id");
    });

    it("uses an explicit choice over the device language", () => {
        expect(resolveLanguage("en", "id-ID")).toBe("en");
    });
});
