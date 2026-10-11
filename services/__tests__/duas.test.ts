import { filterDuas, groupDuas, mapAsmaulHusna, mapDuas } from "../duas";
import asma from "./fixtures/asmaulHusna.json";
import doa from "./fixtures/doa.json";

// Fixtures: real responses from equran.id/api/doa and api.aladhan.com/v1/asmaAlHusna.

describe("mapDuas", () => {
    it("maps equran.id's fields to the app's", () => {
        const [first] = mapDuas(doa);

        expect(first).toMatchObject({ id: 1, group: "Doa Sebelum dan Sesudah Tidur", title: "Doa Sebelum Tidur 1" });
        expect(first.arabic).toMatch(/[؀-ۿ]/);
        expect(first.transliteration).toMatch(/^Bismika/);
        expect(first.meaning).toMatch(/^Dengan nama Engkau/);
    });
});

describe("groupDuas", () => {
    it("collects duas under their heading and keeps the order", () => {
        const duas = [
            { id: 1, group: "A", title: "a1", arabic: "", transliteration: "", meaning: "", source: "" },
            { id: 2, group: "B", title: "b1", arabic: "", transliteration: "", meaning: "", source: "" },
            { id: 3, group: "A", title: "a2", arabic: "", transliteration: "", meaning: "", source: "" },
        ];

        expect(groupDuas(duas).map((group) => [group.name, group.duas.map((dua) => dua.title)])).toEqual([
            ["A", ["a1", "a2"]],
            ["B", ["b1"]],
        ]);
    });
});

describe("filterDuas", () => {
    const duas = mapDuas(doa);

    it("matches the title, group or meaning regardless of case", () => {
        expect(filterDuas(duas, "tidur")).toHaveLength(2);
        expect(filterDuas(duas, "DENGAN NAMA")).not.toHaveLength(0);
    });

    it("returns everything for an empty query and nothing for no match", () => {
        expect(filterDuas(duas, "  ")).toHaveLength(2);
        expect(filterDuas(duas, "zzzz")).toEqual([]);
    });
});

describe("mapAsmaulHusna", () => {
    it("keeps the number, Arabic, transliteration and English meaning", () => {
        const names = mapAsmaulHusna(asma);

        expect(names.map((name) => name.number)).toEqual([1, 2, 99]);
        expect(names[0]).toMatchObject({ transliteration: "Ar Rahmaan", meaning: "The Beneficent" });
        expect(names[2].meaning).toBe("The Patient One");
    });
});
