import { Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, View, type ViewToken } from "react-native";
import { Button, Modal, Text as PaperText, Portal } from "react-native-paper";
import Toast from "react-native-toast-message";
import AyahCard from "@/components/AyahCard";
import { useSurahDetail, useTafsir } from "@/services/queries";
import type { Ayah } from "@/services/types";
import { usePlayingAyah, useAudioPlayerStore, type Track } from "@/store/audioPlayer";
import { bookmarkKey, useBookmarksStore } from "@/store/bookmarks";
import { useReadingProgressStore } from "@/store/readingProgress";
import { useSettingsStore } from "@/store/settings";

const SCROLL_RETRY_LIMIT = 3;
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 50 };

function parsePositiveInt(value: string | string[] | undefined): number | null {
    const raw = Array.isArray(value) ? value[0] : value;
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export default function Surah() {
    const params = useLocalSearchParams<{ id: string; ayah?: string }>();
    const surahNumber = parsePositiveInt(params.id) ?? 0;
    const targetAyah = parsePositiveInt(params.ayah);

    // Surah and tafsir load in parallel; a tafsir failure only affects the tafsir sheet.
    const surahQuery = useSurahDetail(surahNumber);
    const tafsirQuery = useTafsir(surahNumber);
    const surah = surahQuery.data;
    const ayahs = useMemo(() => surah?.ayahs ?? [], [surah]);

    const bookmarks = useBookmarksStore((state) => state.bookmarks);
    const toggleBookmark = useBookmarksStore((state) => state.toggleBookmark);
    const reciterId = useSettingsStore((state) => state.reciterId);
    const playingAyah = usePlayingAyah(surahNumber);
    const toggleAudio = useAudioPlayerStore((state) => state.toggle);
    const stopAudio = useAudioPlayerStore((state) => state.stop);
    const setLastRead = useReadingProgressStore((state) => state.setLastRead);

    const [tafsirAyah, setTafsirAyah] = useState<number | null>(null);
    const listRef = useRef<FlatList<Ayah>>(null);
    const scrollRetries = useRef(0);

    const queue: Track[] = useMemo(
        () =>
            ayahs.map((ayah) => ({
                surahNumber: ayah.surahNumber,
                ayahNumber: ayah.ayahNumber,
                url: ayah.audio[reciterId] ?? Object.values(ayah.audio)[0],
            })),
        [ayahs, reciterId],
    );

    // ---- Scrolling: one helper for both "jump to ayah" and "follow the playing ayah". ----
    const scrollToAyah = useCallback(
        (ayahNumber: number) => {
            const index = ayahNumber - 1;
            if (index < 0 || index >= ayahs.length) return;
            scrollRetries.current = 0;
            listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.2 });
        },
        [ayahs.length],
    );

    // FlatList can't scroll to rows it hasn't measured yet: jump close by estimate, then retry.
    const handleScrollToIndexFailed = useCallback(
        (info: { index: number; averageItemLength: number }) => {
            if (scrollRetries.current >= SCROLL_RETRY_LIMIT) return;
            scrollRetries.current += 1;
            listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
            setTimeout(() => listRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.2 }), 100);
        },
        [],
    );

    useEffect(() => {
        if (targetAyah === null || ayahs.length === 0) return;
        const timer = setTimeout(() => scrollToAyah(targetAyah), 50);
        return () => clearTimeout(timer);
    }, [targetAyah, ayahs.length, scrollToAyah]);

    useEffect(() => {
        if (playingAyah !== null) scrollToAyah(playingAyah);
    }, [playingAyah, scrollToAyah]);

    // ---- Leaving the screen: stop audio and remember where the reader was. ----
    const lastVisibleAyah = useRef<number | null>(null);
    const surahNameRef = useRef<string | null>(null);
    surahNameRef.current = surah?.nameLatin ?? null;

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken<Ayah>[] }) => {
        const first = viewableItems.find((token) => token.isViewable)?.item;
        if (first) lastVisibleAyah.current = first.ayahNumber;
    }).current;

    useEffect(() => {
        return () => {
            stopAudio();
            if (lastVisibleAyah.current !== null && surahNameRef.current) {
                setLastRead({ surahNumber, ayahNumber: lastVisibleAyah.current, surahNameLatin: surahNameRef.current });
            }
        };
    }, [surahNumber, stopAudio, setLastRead]);

    const handleBookmarkPress = useCallback(
        (ayah: Ayah) => {
            if (!surah) return;
            const nowBookmarked = toggleBookmark({
                surahNumber: ayah.surahNumber,
                ayahNumber: ayah.ayahNumber,
                surahNameLatin: surah.nameLatin,
                textArabic: ayah.textArabic,
            });
            Toast.show({
                text1: nowBookmarked ? "Bookmark added" : "Bookmark removed",
                text2: `Surah ${surah.nameLatin}, Ayah ${ayah.ayahNumber}`,
                type: nowBookmarked ? "success" : "info",
                position: "top",
            });
        },
        [surah, toggleBookmark],
    );

    const tafsirText = tafsirAyah === null ? undefined : tafsirQuery.data?.find((entry) => entry.ayahNumber === tafsirAyah)?.text;

    if (surahQuery.isPending) {
        return (
            <View style={styles.centered}>
                <Stack.Screen options={{ title: "" }} />
                <ActivityIndicator size="large" color="green" />
            </View>
        );
    }

    if (surahQuery.isError || !surah) {
        return (
            <View style={styles.centered}>
                <Stack.Screen options={{ title: "" }} />
                <Text style={styles.message}>Couldn't load this Surah. Check your connection and try again.</Text>
                <Button mode="contained" buttonColor="green" onPress={() => surahQuery.refetch()}>
                    Try again
                </Button>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: surah.nameLatin }} />
            <FlatList
                ref={listRef}
                data={ayahs}
                extraData={{ bookmarks, playingAyah }}
                keyExtractor={(item) => bookmarkKey(item.surahNumber, item.ayahNumber)}
                onScrollToIndexFailed={handleScrollToIndexFailed}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={VIEWABILITY_CONFIG}
                contentContainerStyle={styles.listContent}
                renderItem={({ item, index }) => (
                    <AyahCard
                        nomorAyat={item.ayahNumber}
                        teksArab={item.textArabic}
                        teksIndonesia={item.translation}
                        isBookmarked={bookmarkKey(item.surahNumber, item.ayahNumber) in bookmarks}
                        isPlaying={playingAyah === item.ayahNumber}
                        onPlay={() => toggleAudio(queue, index)}
                        onBookmarkPress={() => handleBookmarkPress(item)}
                        onTafsirPress={() => setTafsirAyah(item.ayahNumber)}
                    />
                )}
            />
            <Portal>
                <Modal visible={tafsirAyah !== null} onDismiss={() => setTafsirAyah(null)} contentContainerStyle={styles.modal}>
                    <PaperText variant="titleMedium" style={styles.modalTitle}>
                        Tafsir · {surah.nameLatin} {tafsirAyah}
                    </PaperText>
                    {tafsirQuery.isPending ? (
                        <ActivityIndicator color="green" />
                    ) : tafsirText ? (
                        <ScrollView>
                            <PaperText style={styles.tafsirText}>{tafsirText}</PaperText>
                        </ScrollView>
                    ) : (
                        <View style={styles.tafsirError}>
                            <PaperText>Couldn't load the tafsir for this ayah.</PaperText>
                            <Button onPress={() => tafsirQuery.refetch()} textColor="green">
                                Try again
                            </Button>
                        </View>
                    )}
                </Modal>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        padding: 12,
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        gap: 16,
    },
    message: {
        fontSize: 16,
        textAlign: "center",
    },
    modal: {
        width: "88%",
        maxHeight: "80%",
        backgroundColor: "white",
        borderRadius: 12,
        padding: 20,
        alignSelf: "center",
        gap: 12,
    },
    modalTitle: {
        fontWeight: "bold",
    },
    tafsirText: {
        lineHeight: 22,
    },
    tafsirError: {
        gap: 8,
        alignItems: "flex-start",
    },
});
