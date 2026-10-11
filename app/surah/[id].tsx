import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Switch, View, type ViewToken } from "react-native";
import { Button } from "react-native-paper";
import Toast from "react-native-toast-message";
import AyahCard from "@/components/AyahCard";
import { AyahSheet } from "@/components/AyahSheet";
import { ShareAyahSheet, type ShareAyahPayload } from "@/components/ShareAyahSheet";
import { DownloadAudioRow } from "@/components/DownloadAudioRow";
import { FootnoteSheet } from "@/components/FootnoteSheet";
import { MiniPlayer } from "@/components/MiniPlayer";
import { SurahHeaderCard } from "@/components/SurahHeaderCard";
import { LegendSheet, RuleSheet } from "@/components/TajweedSheets";
import { AppText } from "@/components/ui/AppText";
import { IconButton } from "@/components/ui/IconButton";
import { Sheet } from "@/components/ui/Sheet";
import { useTheme } from "@/components/useTheme";
import { englishTranslations } from "@/constants/editions";
import type { TajweedRuleId } from "@/constants/tajweed";
import { arabicFontSize } from "@/constants/theme";
import { juzOf } from "@/services/juz";
import { useEnglishSurahMeanings, useEnglishTranslation, useSurahDetail, useTajweed } from "@/services/queries";
import { translationText } from "@/services/richText";
import type { Ayah } from "@/services/types";
import { useIsLoading, usePlayingAyah, useAudioPlayerStore, type Track } from "@/store/audioPlayer";
import { bookmarkKey, useBookmarksStore } from "@/store/bookmarks";
import { useKhatamStore } from "@/store/khatam";
import { useNotesStore } from "@/store/notes";
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

type SheetTab = "words" | "tafsir" | "notes";

export default function Surah() {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const { colors, spacing, radius, fonts } = useTheme();
    const params = useLocalSearchParams<{ id: string; ayah?: string }>();
    const surahNumber = parsePositiveInt(params.id) ?? 0;
    const targetAyah = parsePositiveInt(params.ayah);
    const isEnglish = i18n.language === "en";

    const surahQuery = useSurahDetail(surahNumber);
    const englishMeanings = useEnglishSurahMeanings(isEnglish);
    const surah = surahQuery.data;
    const ayahs = useMemo(() => surah?.ayahs ?? [], [surah]);

    const arabicSize = useSettingsStore((state) => state.arabicFontSize);
    const showTranslation = useSettingsStore((state) => state.showTranslation);
    const showTransliteration = useSettingsStore((state) => state.showTransliteration);
    const tajweedEnabled = useSettingsStore((state) => state.tajweedEnabled);
    const englishTranslationId = useSettingsStore((state) => state.englishTranslationId);
    // Tajweed colours and English translations come from quran.com; the reader shows plain text / the
    // Indonesian translation until they arrive (or if they can't load).
    const tajweed = useTajweed(surahNumber, tajweedEnabled);
    const englishTranslation = useEnglishTranslation(surahNumber, englishTranslationId, isEnglish && showTranslation);

    const bookmarks = useBookmarksStore((state) => state.bookmarks);
    const toggleBookmark = useBookmarksStore((state) => state.toggleBookmark);
    const notes = useNotesStore((state) => state.notes);
    const playingAyah = usePlayingAyah(surahNumber);
    const audioLoading = useIsLoading();
    const toggleAudio = useAudioPlayerStore((state) => state.toggle);
    const setLastRead = useReadingProgressStore((state) => state.setLastRead);
    const recordRead = useKhatamStore((state) => state.recordRead);

    const [sheetAyah, setSheetAyah] = useState<Ayah | null>(null);
    const [sheetTab, setSheetTab] = useState<SheetTab>("words");
    const [displayOpen, setDisplayOpen] = useState(false);
    const [legendOpen, setLegendOpen] = useState(false);
    const [ruleId, setRuleId] = useState<TajweedRuleId | null>(null);
    const [footnoteId, setFootnoteId] = useState<number | null>(null);
    const listRef = useRef<FlatList<Ayah>>(null);
    const scrollRetries = useRef(0);

    const queue: Track[] = useMemo(
        () => ayahs.map((ayah) => ({ surahNumber: ayah.surahNumber, ayahNumber: ayah.ayahNumber, surahName: surah?.nameLatin ?? "" })),
        [ayahs, surah?.nameLatin],
    );

    const openSheet = useCallback((ayah: Ayah, tab: SheetTab) => {
        setSheetTab(tab);
        setSheetAyah(ayah);
    }, []);

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

    // ---- Leaving the screen: remember where the reader was (recitation keeps playing in the mini-player). ----
    const lastVisibleAyah = useRef<number | null>(null);
    const surahNameRef = useRef<string | null>(null);
    surahNameRef.current = surah?.nameLatin ?? null;

    // Every ayah that was on screen at some point counts as read, for the khatam planner and streak.
    const seenAyahs = useRef(new Set<number>());
    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken<Ayah>[] }) => {
        const visible = viewableItems.filter((token) => token.isViewable && token.item);
        if (visible[0]) lastVisibleAyah.current = visible[0].item.ayahNumber;
        for (const token of visible) seenAyahs.current.add(token.item.ayahNumber);
    }).current;

    useEffect(() => {
        const seen = seenAyahs.current;
        return () => {
            if (lastVisibleAyah.current !== null && surahNameRef.current) {
                setLastRead({ surahNumber, ayahNumber: lastVisibleAyah.current, surahNameLatin: surahNameRef.current });
            }
            recordRead(surahNumber, [...seen]);
        };
    }, [surahNumber, setLastRead, recordRead]);

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

    const [sharePayload, setSharePayload] = useState<ShareAyahPayload | null>(null);
    const handleShare = useCallback(
        (ayah: Ayah) => {
            if (!surah) return;
            const reference = t("reader.shareSuffix", { surah: surah.nameLatin, surahNumber: surah.number, ayah: ayah.ayahNumber });
            const english = isEnglish ? englishTranslation.data?.[ayah.ayahNumber] : undefined;
            const meaning = english ? translationText(english) : ayah.translation;
            setSharePayload({ arabic: ayah.textArabic, meaning, reference });
        },
        [surah, t, isEnglish, englishTranslation.data],
    );

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

    const meaning = (isEnglish && englishMeanings.data?.[surah.number]) || surah.meaning;
    const translationFailed = isEnglish && showTranslation && englishTranslation.isError;

    const header = (
        <View style={{ padding: spacing.lg, gap: spacing.lg }}>
            <SurahHeaderCard
                number={surah.number}
                nameArabic={surah.nameArabic}
                nameLatin={surah.nameLatin}
                meaning={meaning}
                details={[t(`common.place.${surah.revelationPlace}`), t("common.ayahCount", { count: surah.ayahCount }), t("common.juz", { number: juzOf(surah.number, 1) })]}
            />
            {!NO_SEPARATE_BASMALAH.has(surah.number) ? (
                <AppText style={[styles.basmalah, { fontFamily: fonts.quran, color: colors.ink }]}>{BASMALAH}</AppText>
            ) : null}
            {translationFailed ? (
                <AppText variant="caption" muted style={styles.centerText}>
                    {t("reader.translationFallback")}
                </AppText>
            ) : null}
        </View>
    );

    const footer = (
        <View style={[styles.footer, { padding: spacing.lg, gap: spacing.md }]}>
            {surah.previous ? (
                <Pressable
                    onPress={() => router.replace({ pathname: "/surah/[id]", params: { id: surah.previous!.number } })}
                    accessibilityRole="button"
                    accessibilityLabel={t("reader.previous", { name: surah.previous.nameLatin })}
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
                        <View style={styles.headerButtons}>
                            <IconButton plain icon="repeat-outline" size={40} onPress={() => router.push({ pathname: "/hifz/[id]", params: { id: surah.number } })} accessibilityLabel={t("hifz.open")} />
                            <IconButton plain icon="text-outline" size={40} onPress={() => setDisplayOpen(true)} accessibilityLabel={t("reader.displaySettings")} />
                        </View>
                    ),
                }}
            />
            <FlatList
                ref={listRef}
                data={ayahs}
                extraData={{ bookmarks, notes, playingAyah, audioLoading, arabicSize, showTranslation, showTransliteration, tajweedEnabled, tajweed: tajweed.data, english: englishTranslation.data }}
                keyExtractor={(item) => bookmarkKey(item.surahNumber, item.ayahNumber)}
                onScrollToIndexFailed={handleScrollToIndexFailed}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={VIEWABILITY_CONFIG}
                ListHeaderComponent={header}
                ListFooterComponent={footer}
                contentContainerStyle={{ paddingHorizontal: spacing.sm }}
                // On Android, rows scrolled off screen are detached by default, which can clip a row whose height
                // changed afterwards (as when the Arabic size is raised). Rows are cheap enough to keep attached.
                removeClippedSubviews={false}
                renderItem={({ item, index }) => {
                    const key = bookmarkKey(item.surahNumber, item.ayahNumber);
                    return (
                        <AyahCard
                            // A new key with the size makes the row be measured again from scratch, so its height always fits the text.
                            key={`${key}:${arabicSize}`}
                            ayah={item}
                            arabicSize={arabicSize}
                            tajweed={tajweedEnabled ? tajweed.data?.[item.ayahNumber] : undefined}
                            showTranslation={showTranslation}
                            translationHtml={isEnglish ? englishTranslation.data?.[item.ayahNumber] : undefined}
                            showTransliteration={showTransliteration}
                            isBookmarked={key in bookmarks}
                            hasNote={key in notes}
                            isPlaying={playingAyah === item.ayahNumber}
                            isLoading={audioLoading && playingAyah === item.ayahNumber}
                            onPlay={() => toggleAudio(queue, index)}
                            onBookmarkPress={() => handleBookmarkPress(item)}
                            onWordsPress={() => openSheet(item, "words")}
                            onTafsirPress={() => openSheet(item, "tafsir")}
                            onNotePress={() => openSheet(item, "notes")}
                            onSharePress={() => handleShare(item)}
                            onRulePress={setRuleId}
                            onFootnotePress={setFootnoteId}
                        />
                    );
                }}
            />

            <ShareAyahSheet payload={sharePayload} onDismiss={() => setSharePayload(null)} />
            <AyahSheet ayah={sheetAyah} surahName={surah.nameLatin} initialTab={sheetTab} onDismiss={() => setSheetAyah(null)} />
            <RuleSheet ruleId={ruleId} onDismiss={() => setRuleId(null)} />
            <LegendSheet visible={legendOpen} onDismiss={() => setLegendOpen(false)} />
            <FootnoteSheet footnoteId={footnoteId} onDismiss={() => setFootnoteId(null)} />

            <Sheet visible={displayOpen} onDismiss={() => setDisplayOpen(false)} title={t("reader.display")} maxHeightRatio={0.88}>
                <DisplaySettings
                    arabicSize={arabicSize}
                    sampleText={ayahs[0]?.textArabic ?? BASMALAH}
                    surahNumber={surah.number}
                    ayahCount={surah.ayahCount}
                    isEnglish={isEnglish}
                    onOpenLegend={() => {
                        setDisplayOpen(false);
                        setLegendOpen(true);
                    }}
                />
            </Sheet>
            <MiniPlayer safeBottom />
        </View>
    );
}

interface DisplaySettingsProps {
    arabicSize: number;
    sampleText: string;
    surahNumber: number;
    ayahCount: number;
    isEnglish: boolean;
    onOpenLegend: () => void;
}

function DisplaySettings({ arabicSize, sampleText, surahNumber, ayahCount, isEnglish, onOpenLegend }: DisplaySettingsProps) {
    const { t } = useTranslation();
    const { colors, spacing, radius } = useTheme();
    const settings = useSettingsStore();
    const row = (label: string, value: boolean, onChange: (value: boolean) => void) => (
        <View style={styles.settingRow}>
            <AppText variant="bodyStrong" style={styles.flex}>
                {label}
            </AppText>
            <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.mushaf }} accessibilityLabel={label} />
        </View>
    );

    return (
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg }}>
            <View style={styles.settingRow}>
                <AppText variant="bodyStrong">{t("reader.textSize")}</AppText>
                <View style={styles.stepper}>
                    <IconButton icon="remove" onPress={() => settings.stepArabicFontSize(-1)} disabled={arabicSize <= arabicFontSize.min} accessibilityLabel={t("reader.smaller")} />
                    <AppText variant="bodyStrong" style={styles.sizeValue}>
                        {arabicSize}
                    </AppText>
                    <IconButton icon="add" onPress={() => settings.stepArabicFontSize(1)} disabled={arabicSize >= arabicFontSize.max} accessibilityLabel={t("reader.larger")} />
                </View>
            </View>
            <AppText variant="arabic" size={arabicSize}>
                {sampleText}
            </AppText>
            {row(t("reader.showTranslation"), settings.showTranslation, settings.setShowTranslation)}
            {row(t("settingsReading.transliteration"), settings.showTransliteration, settings.setShowTransliteration)}
            {row(t("settingsReading.tajweed"), settings.tajweedEnabled, settings.setTajweedEnabled)}
            <Pressable onPress={onOpenLegend} accessibilityRole="button">
                <AppText variant="bodyStrong" color={colors.mushaf}>
                    {`${t("settingsReading.legend")} ›`}
                </AppText>
            </Pressable>
            {isEnglish && settings.showTranslation ? (
                <View style={{ gap: spacing.sm }}>
                    <AppText variant="label" muted>
                        {t("settingsReading.translationEdition")}
                    </AppText>
                    <View style={styles.chips}>
                        {englishTranslations.map((edition) => {
                            const selected = edition.id === settings.englishTranslationId;
                            return (
                                <Pressable
                                    key={edition.id}
                                    onPress={() => settings.setEnglishTranslationId(edition.id)}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected }}
                                    style={[styles.chip, { backgroundColor: selected ? colors.mushaf : colors.surface2, borderRadius: radius.pill }]}
                                >
                                    <AppText variant="caption" color={selected ? colors.onMushaf : colors.ink2} style={styles.chipText}>
                                        {edition.name}
                                    </AppText>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>
            ) : null}
            <DownloadAudioRow surahNumber={surahNumber} ayahCount={ayahCount} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerButtons: { flexDirection: "row", gap: 8 },
    flex: { flex: 1 },
    centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 16 },
    centerText: { textAlign: "center" },
    basmalah: { fontSize: 26, lineHeight: 52, textAlign: "center" },
    footer: { flexDirection: "row" },
    navButton: { flex: 1, paddingVertical: 14, paddingHorizontal: 16 },
    right: { textAlign: "right" },
    settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
    stepper: { flexDirection: "row", alignItems: "center", gap: 12 },
    sizeValue: { minWidth: 28, textAlign: "center", fontVariant: ["tabular-nums"] },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 7 },
    chipText: { fontWeight: "600" },
});
