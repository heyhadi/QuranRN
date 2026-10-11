import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, ScrollView, Share, StyleSheet, Switch, View, type ViewToken } from "react-native";
import { Button } from "react-native-paper";
import Toast from "react-native-toast-message";
import AyahCard from "@/components/AyahCard";
import { AppText } from "@/components/ui/AppText";
import { IconButton } from "@/components/ui/IconButton";
import { DownloadAudioRow } from "@/components/DownloadAudioRow";
import { MiniPlayer } from "@/components/MiniPlayer";
import { Sheet } from "@/components/ui/Sheet";
import { useTheme } from "@/components/useTheme";
import { arabicFontSize } from "@/constants/theme";
import { juzOf } from "@/services/juz";
import { useEnglishSurahMeanings, useSurahDetail, useTafsir } from "@/services/queries";
import type { Ayah } from "@/services/types";
import { usePlayingAyah, useAudioPlayerStore, type Track } from "@/store/audioPlayer";
import { bookmarkKey, useBookmarksStore } from "@/store/bookmarks";
import { useReadingProgressStore } from "@/store/readingProgress";
import { useSettingsStore } from "@/store/settings";

const SCROLL_RETRY_LIMIT = 3;
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 50 };
// Al-Fatihah's first ayah is the basmalah itself, and At-Tawbah has none.
const NO_SEPARATE_BASMALAH = new Set([1, 9]);
const BASMALAH = "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ";

function parsePositiveInt(value: string | string[] | undefined): number | null {
    const raw = Array.isArray(value) ? value[0] : value;
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export default function Surah() {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const { colors, spacing, radius, fonts } = useTheme();
    const params = useLocalSearchParams<{ id: string; ayah?: string }>();
    const surahNumber = parsePositiveInt(params.id) ?? 0;
    const targetAyah = parsePositiveInt(params.ayah);

    // Surah and tafsir load in parallel; a tafsir failure only affects the tafsir sheet.
    const surahQuery = useSurahDetail(surahNumber);
    const tafsirQuery = useTafsir(surahNumber);
    const englishMeanings = useEnglishSurahMeanings(i18n.language === "en");
    const surah = surahQuery.data;
    const ayahs = useMemo(() => surah?.ayahs ?? [], [surah]);

    const bookmarks = useBookmarksStore((state) => state.bookmarks);
    const toggleBookmark = useBookmarksStore((state) => state.toggleBookmark);
    const { arabicFontSize: arabicSize, showTranslation, stepArabicFontSize, setShowTranslation } = useSettingsStore();
    const playingAyah = usePlayingAyah(surahNumber);
    const toggleAudio = useAudioPlayerStore((state) => state.toggle);
    const setLastRead = useReadingProgressStore((state) => state.setLastRead);

    const [tafsirAyah, setTafsirAyah] = useState<number | null>(null);
    const [displayOpen, setDisplayOpen] = useState(false);
    const listRef = useRef<FlatList<Ayah>>(null);
    const scrollRetries = useRef(0);

    const queue: Track[] = useMemo(
        () =>
            ayahs.map((ayah) => ({
                surahNumber: ayah.surahNumber,
                ayahNumber: ayah.ayahNumber,
                surahName: surah?.nameLatin ?? "",
            })),
        [ayahs, surah?.nameLatin],
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
    const handleScrollToIndexFailed = useCallback((info: { index: number; averageItemLength: number }) => {
        if (scrollRetries.current >= SCROLL_RETRY_LIMIT) return;
        scrollRetries.current += 1;
        listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
        setTimeout(() => listRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.2 }), 100);
    }, []);

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
        // Recitation keeps playing when you leave (the mini-player controls it); only the position is saved.
        return () => {
            if (lastVisibleAyah.current !== null && surahNameRef.current) {
                setLastRead({ surahNumber, ayahNumber: lastVisibleAyah.current, surahNameLatin: surahNameRef.current });
            }
        };
    }, [surahNumber, setLastRead]);

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
                text1: t(nowBookmarked ? "reader.bookmarkAdded" : "reader.bookmarkRemoved"),
                text2: t("reader.bookmarkDetail", { surah: surah.nameLatin, ayah: ayah.ayahNumber }),
                type: nowBookmarked ? "success" : "info",
                position: "top",
            });
        },
        [surah, toggleBookmark, t],
    );

    const handleShare = useCallback(
        (ayah: Ayah) => {
            if (!surah) return;
            const reference = t("reader.shareSuffix", { surah: surah.nameLatin, surahNumber: surah.number, ayah: ayah.ayahNumber });
            void Share.share({ message: `${ayah.textArabic}\n\n${ayah.translation}\n\n— ${reference}` });
        },
        [surah, t],
    );

    const tafsirText = tafsirAyah === null ? undefined : tafsirQuery.data?.find((entry) => entry.ayahNumber === tafsirAyah)?.text;

    if (surahQuery.isPending) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.paper }]}>
                <Stack.Screen options={{ title: "" }} />
                <ActivityIndicator size="large" color={colors.mushaf} />
            </View>
        );
    }

    if (surahQuery.isError || !surah) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.paper }]}>
                <Stack.Screen options={{ title: "" }} />
                <AppText style={styles.centerText}>{t("reader.loadError")}</AppText>
                <Button mode="contained" onPress={() => surahQuery.refetch()}>
                    {t("common.tryAgain")}
                </Button>
            </View>
        );
    }

    const meaning = (i18n.language === "en" && englishMeanings.data?.[surah.number]) || surah.meaning;

    const header = (
        <View style={{ padding: spacing.lg, gap: spacing.lg }}>
            <View style={[styles.infoCard, { backgroundColor: colors.mushaf, borderRadius: radius.lg, padding: spacing.xl }]}>
                <AppText style={{ fontFamily: fonts.quran, fontSize: 34, lineHeight: 64, color: colors.onMushaf }}>{surah.nameArabic}</AppText>
                <AppText variant="title" color={colors.onMushaf}>
                    {surah.nameLatin}
                </AppText>
                <AppText color={colors.onMushaf} style={styles.dim}>
                    {meaning}
                </AppText>
                <View style={[styles.divider, { backgroundColor: colors.onMushaf }]} />
                <AppText variant="caption" color={colors.onMushaf} style={styles.dim}>
                    {`${t(`common.place.${surah.revelationPlace}`)} · ${t("common.ayahCount", { count: surah.ayahCount })} · ${t("common.juz", { number: juzOf(surah.number, 1) })}`}
                </AppText>
            </View>
            {!NO_SEPARATE_BASMALAH.has(surah.number) ? (
                <AppText style={[styles.basmalah, { fontFamily: fonts.quran, color: colors.ink }]}>{BASMALAH}</AppText>
            ) : null}
        </View>
    );

    const footer = (
        <View style={[styles.footer, { padding: spacing.lg, gap: spacing.md }]}>
            {surah.previous ? (
                <Pressable
                    onPress={() => router.replace({ pathname: "/surah/[id]", params: { id: surah.previous!.number } })}
                    accessibilityRole="button"
                    style={[styles.navButton, { backgroundColor: colors.surface2, borderRadius: radius.md }]}
                >
                    <AppText variant="bodyStrong" numberOfLines={1}>
                        {`‹ ${surah.previous.nameLatin}`}
                    </AppText>
                </Pressable>
            ) : (
                <View style={styles.navButton} />
            )}
            {surah.next ? (
                <Pressable
                    onPress={() => router.replace({ pathname: "/surah/[id]", params: { id: surah.next!.number } })}
                    accessibilityRole="button"
                    accessibilityLabel={t("reader.next", { name: surah.next.nameLatin })}
                    style={[styles.navButton, { backgroundColor: colors.mushaf, borderRadius: radius.md }]}
                >
                    <AppText variant="bodyStrong" color={colors.onMushaf} numberOfLines={1} style={styles.right}>
                        {`${surah.next.nameLatin} ›`}
                    </AppText>
                </Pressable>
            ) : null}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.paper }]}>
            <Stack.Screen
                options={{
                    title: surah.nameLatin,
                    headerRight: () => (
                        <IconButton icon="text-outline" size={34} onPress={() => setDisplayOpen(true)} accessibilityLabel={t("reader.displaySettings")} />
                    ),
                }}
            />
            <FlatList
                ref={listRef}
                data={ayahs}
                extraData={{ bookmarks, playingAyah, arabicSize, showTranslation }}
                keyExtractor={(item) => bookmarkKey(item.surahNumber, item.ayahNumber)}
                onScrollToIndexFailed={handleScrollToIndexFailed}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={VIEWABILITY_CONFIG}
                ListHeaderComponent={header}
                ListFooterComponent={footer}
                contentContainerStyle={{ paddingHorizontal: spacing.sm }}
                renderItem={({ item, index }) => (
                    <AyahCard
                        ayah={item}
                        arabicSize={arabicSize}
                        showTranslation={showTranslation}
                        isBookmarked={bookmarkKey(item.surahNumber, item.ayahNumber) in bookmarks}
                        isPlaying={playingAyah === item.ayahNumber}
                        onPlay={() => toggleAudio(queue, index)}
                        onBookmarkPress={() => handleBookmarkPress(item)}
                        onTafsirPress={() => setTafsirAyah(item.ayahNumber)}
                        onSharePress={() => handleShare(item)}
                    />
                )}
            />

            <Sheet
                visible={tafsirAyah !== null}
                onDismiss={() => setTafsirAyah(null)}
                title={t("reader.tafsirTitle", { surah: surah.nameLatin, ayah: tafsirAyah ?? "" })}
            >
                {tafsirQuery.isPending ? (
                    <ActivityIndicator color={colors.mushaf} style={{ margin: spacing.xl }} />
                ) : tafsirText ? (
                    <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md }}>
                        <AppText style={styles.tafsir}>{tafsirText}</AppText>
                        <AppText variant="caption" muted>
                            {t("reader.tafsirSource")}
                        </AppText>
                    </ScrollView>
                ) : (
                    <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm, alignItems: "flex-start" }}>
                        <AppText>{t("reader.tafsirError")}</AppText>
                        <Button onPress={() => tafsirQuery.refetch()}>{t("common.tryAgain")}</Button>
                    </View>
                )}
            </Sheet>

            <Sheet visible={displayOpen} onDismiss={() => setDisplayOpen(false)} title={t("reader.display")}>
                <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg }}>
                    <View style={styles.settingRow}>
                        <AppText variant="bodyStrong">{t("reader.textSize")}</AppText>
                        <View style={styles.stepper}>
                            <IconButton icon="remove" onPress={() => stepArabicFontSize(-1)} disabled={arabicSize <= arabicFontSize.min} accessibilityLabel={t("reader.smaller")} />
                            <AppText variant="bodyStrong" style={styles.sizeValue}>
                                {arabicSize}
                            </AppText>
                            <IconButton icon="add" onPress={() => stepArabicFontSize(1)} disabled={arabicSize >= arabicFontSize.max} accessibilityLabel={t("reader.larger")} />
                        </View>
                    </View>
                    <AppText variant="arabic" size={arabicSize}>
                        {ayahs[0]?.textArabic ?? BASMALAH}
                    </AppText>
                    <View style={styles.settingRow}>
                        <AppText variant="bodyStrong">{t("reader.showTranslation")}</AppText>
                        <Switch value={showTranslation} onValueChange={setShowTranslation} trackColor={{ true: colors.mushaf }} />
                    </View>
                    <DownloadAudioRow surahNumber={surah.number} ayahCount={surah.ayahCount} />
                </View>
            </Sheet>
            <MiniPlayer safeBottom />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 16 },
    centerText: { textAlign: "center" },
    infoCard: { alignItems: "center", gap: 2 },
    divider: { height: StyleSheet.hairlineWidth, alignSelf: "stretch", opacity: 0.35, marginVertical: 10 },
    dim: { opacity: 0.85, textAlign: "center" },
    basmalah: { fontSize: 26, lineHeight: 52, textAlign: "center" },
    tafsir: { lineHeight: 25 },
    footer: { flexDirection: "row" },
    navButton: { flex: 1, paddingVertical: 14, paddingHorizontal: 16 },
    right: { textAlign: "right" },
    settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    stepper: { flexDirection: "row", alignItems: "center", gap: 12 },
    sizeValue: { minWidth: 28, textAlign: "center", fontVariant: ["tabular-nums"] },
});
