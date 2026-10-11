import { create } from "zustand";
import { persist } from "zustand/middleware";
import { bookmarkKey } from "./bookmarks";
import { zustandStorage } from "./storage";

export interface Note {
    text: string;
    updatedAt: number;
}

interface NotesState {
    /** Personal notes by ayah, keyed "surah:ayah". */
    notes: Record<string, Note>;
    /** Save a note; an empty (or whitespace-only) note removes it. */
    setNote: (surahNumber: number, ayahNumber: number, text: string) => void;
}

export const useNotesStore = create<NotesState>()(
    persist(
        (set) => ({
            notes: {},
            setNote: (surahNumber, ayahNumber, text) =>
                set((state) => {
                    const key = bookmarkKey(surahNumber, ayahNumber);
                    const trimmed = text.trim();
                    if (!trimmed) {
                        const { [key]: _removed, ...rest } = state.notes;
                        return { notes: rest };
                    }
                    return { notes: { ...state.notes, [key]: { text: trimmed, updatedAt: Date.now() } } };
                }),
        }),
        { name: "notes", storage: zustandStorage, version: 1 },
    ),
);

export function useNote(surahNumber: number, ayahNumber: number): Note | undefined {
    return useNotesStore((state) => state.notes[bookmarkKey(surahNumber, ayahNumber)]);
}
