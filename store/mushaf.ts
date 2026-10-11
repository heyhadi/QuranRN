import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isValidMushafPage } from "@/services/mushaf";
import { zustandStorage } from "./storage";

interface MushafState {
    /** The page the reader was last on (1 to 604); null until the mushaf has been opened. */
    page: number | null;
    setPage: (page: number) => void;
}

export const useMushafStore = create<MushafState>()(
    persist(
        (set) => ({
            page: null,
            setPage: (page) => {
                if (isValidMushafPage(page)) set({ page });
            },
        }),
        { name: "mushaf", storage: zustandStorage, version: 1 },
    ),
);
