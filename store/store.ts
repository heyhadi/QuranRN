import { create } from 'zustand';



interface BookmarkState {
    bookmarks: { nomorAyat: number; teksArab: string; namaSurah:string; nomorSurah:number }[];
    addBookmark: (ayah: { nomorAyat: number; teksArab: string; namaSurah:string;  nomorSurah: number}) => void;
    removeBookmark: (ayah: { nomorAyat: number; teksArab: string; namaSurah:string; nomorSurah: number}) => void;
}

const useBookmarksStore = create<BookmarkState>((set) => ({
    bookmarks: [],
    addBookmark: (ayah: { nomorAyat: number; teksArab: string; namaSurah:string; nomorSurah:number }) => {
        set((state) => ({ bookmarks: [...state.bookmarks, ayah] }));
    },
    removeBookmark: (ayah: { nomorAyat: number; teksArab: string; }) => {
        set((state) => ({
            bookmarks: state.bookmarks.filter((bookmark) => bookmark.nomorAyat !== ayah.nomorAyat),
        }));
    },
}));

export const useSetAyahIndexStore = create<any>((set) => ({
    currentIndex: null,
    setCurrentIndex: (index: number) => {
        set({ currentIndex: index });
    },
}));

export default useBookmarksStore;
