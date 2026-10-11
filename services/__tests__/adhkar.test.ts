import { ADHKAR_ROUTINES, getAdhkar, routineForHour, type AdhkarLanguage, type AdhkarSetId } from "../adhkar";

const sets: AdhkarSetId[] = [...ADHKAR_ROUTINES, "dailyDua", "selectedDua"];
const languages: AdhkarLanguage[] = ["en", "id"];

describe("bundled adhkar", () => {
    it.each(sets)("%s has the same entries in English and Indonesian", (set) => {
        const en = getAdhkar(set, "en");
        const id = getAdhkar(set, "id");
        expect(en.length).toBeGreaterThan(0);
        expect(id.length).toBe(en.length);
        en.forEach((item, index) => {
            expect(item.arabic.normalize("NFC")).toBe(id[index].arabic.normalize("NFC"));
            expect(item.repeat).toBe(id[index].repeat);
        });
    });

    it.each(sets.flatMap((set) => languages.map((language) => [set, language] as const)))("%s (%s) is complete", (set, language) => {
        for (const item of getAdhkar(set, language)) {
            expect(item.title).not.toBe("");
            expect(item.arabic).toMatch(/[؀-ۿ]/);
            expect(item.translation).not.toBe("");
            expect(item.repeat).toBeGreaterThanOrEqual(1);
        }
    });

    it("gives the English app English text", () => {
        expect(getAdhkar("morning", "en")[0].title).toBe("Ayatul Kursi");
        expect(getAdhkar("dailyDua", "en")[0].title).toMatch(/^Supplication/);
        expect(getAdhkar("dailyDua", "id")[0].title).not.toMatch(/^Supplication/);
    });
});

describe("routineForHour", () => {
    it("is morning from dawn to mid-afternoon and evening after", () => {
        expect(routineForHour(5)).toBe("morning");
        expect(routineForHour(14)).toBe("morning");
        expect(routineForHour(15)).toBe("evening");
        expect(routineForHour(23)).toBe("evening");
        expect(routineForHour(2)).toBe("evening");
    });
});
