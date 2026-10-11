import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandStorage } from "./storage";

/** equran.id reciter ids: 01 Al-Juhany, 02 Al-Qasim, 03 As-Sudais, 04 Al-Dossari, 05 Alafasy, 06 Yasser Al-Dosari. */
export const DEFAULT_RECITER_ID = "01";

interface SettingsState {
    reciterId: string;
    setReciterId: (reciterId: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            reciterId: DEFAULT_RECITER_ID,
            setReciterId: (reciterId) => set({ reciterId }),
        }),
        { name: "settings", storage: zustandStorage, version: 1 },
    ),
);
