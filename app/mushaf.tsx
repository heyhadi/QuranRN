import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Keyboard, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Button } from "react-native-paper";
import { MushafPageView } from "@/components/MushafPageView";
import { AppText } from "@/components/ui/AppText";
import { IconButton } from "@/components/ui/IconButton";
import { Sheet } from "@/components/ui/Sheet";
import { LegendSheet, RuleSheet } from "@/components/TajweedSheets";
import { useTheme } from "@/components/useTheme";
import { firstPageOf, MUSHAF_PAGES } from "@/constants/surahPages";
import type { TajweedRuleId } from "@/constants/tajweed";
import { isValidMushafPage, type MushafWord } from "@/services/mushaf";
import { useMushafPage, useSurahList } from "@/services/queries";
import { useKhatamStore } from "@/store/khatam";
import { useMushafStore } from "@/store/mushaf";
import { useReadingProgressStore } from "@/store/readingProgress";
import { useSettingsStore } from "@/store/settings";

/** On a tablet the page stays a comfortable reading width, centred. */
const MAX_PAGE_WIDTH = 640;
const FOOTER = 34;
/** Space kept clear at each side of the page. */
const SIDE_MARGIN = 16;
/** How long a page has to stay on screen before its ayahs count as read for the Khatam plan. */
const READ_AFTER_MS = 2000;
const PAGES = Array.from({ length: MUSHAF_PAGES }, (_, index) => index + 1);

export default function MushafScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { colors, spacing, radius } = useTheme();
    const params = useLocalSearchParams<{ page?: string; surah?: string }>();
    const savedPage = useMushafStore((state) => state.page);
    const setSavedPage = useMushafStore((state) => state.setPage);
    const lastRead = useReadingProgressStore((state) => state.lastRead);
    const surahs = useSurahList();
    const tajweedEnabled = useSettingsStore((state) => state.tajweedEnabled);
    const setTajweedEnabled = useSettingsStore((state) => state.setTajweedEnabled);
    const [ruleId, setRuleId] = useState<TajweedRuleId | null>(null);
    const [legendOpen, setLegendOpen] = useState(false);

    // Where to open: an explicit page, a Surah's first page, the page left on, the Surah last read, or page 1.
    const startPage = useMemo(() => {
        const fromParam = Number(params.page);
        if (isValidMushafPage(fromParam)) return fromParam;
        const surah = Number(params.surah);
        if (Number.isInteger(surah) && surah >= 1 && surah <= 114) return firstPageOf(surah);
        return savedPage ?? (lastRead ? firstPageOf(lastRead.surahNumber) : 1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [size, setSize] = useState<{ width: number; height: number } | null>(null);
    const [page, setPage] = useState(startPage);
    const [jumpOpen, setJumpOpen] = useState(false);
    const [pageInput, setPageInput] = useState("");
    const listRef = useRef<FlatList<number>>(null);

    const pageWidth = size ? Math.min(size.width, MAX_PAGE_WIDTH) - SIDE_MARGIN * 2 : 0;
    const pageHeight = size ? size.height - FOOTER : 0;

    const goTo = useCallback(
        (target: number) => {
            if (!isValidMushafPage(target)) return;
            setPage(target);
            setSavedPage(target);
            listRef.current?.scrollToIndex({ index: target - 1, animated: false });
        },
        [setSavedPage],
    );

    // The ayahs on the page count as read once the page has stayed on screen for a moment.
    const current = useMushafPage(page);
    const recordRead = useKhatamStore((state) => state.recordRead);
    useEffect(() => {
        if (!current.data) return;
        const timer = setTimeout(() => {
            const bySurah = new Map<number, Set<number>>();
            for (const line of current.data.lines) {
                if (line.kind !== "text") continue;
                for (const word of line.words) bySurah.set(word.surahNumber, (bySurah.get(word.surahNumber) ?? new Set()).add(word.ayahNumber));
            }
            for (const [surah, ayahs] of bySurah) recordRead(surah, [...ayahs]);
        }, READ_AFTER_MS);
        return () => clearTimeout(timer);
    }, [current.data, recordRead]);

    const onWordPress = useCallback((word: MushafWord) => router.push({ pathname: "/surah/[id]", params: { id: word.surahNumber, ayah: word.ayahNumber } }), [router]);

    const submitJump = () => {
        const target = Number(pageInput);
        if (isValidMushafPage(target)) {
            Keyboard.dismiss();
            setJumpOpen(false);
            setPageInput("");
            goTo(target);
        }
    };

    const firstSurahOnPage = useMemo(() => {
        const line = current.data?.lines.find((entry) => entry.kind === "text");
        return line && line.kind === "text" ? line.words[0].surahNumber : null;
    }, [current.data]);
    const surahName = firstSurahOnPage ? surahs.data?.find((surah) => surah.number === firstSurahOnPage)?.nameLatin : undefined;

    return (
        <View style={[styles.screen, { backgroundColor: colors.paper }]}>
            <Stack.Screen
                options={{
                    title: surahName ?? t("mushaf.title"),
                    headerRight: () => (
                        <View style={styles.headerButtons}>
                            <IconButton
                                plain
                                icon={tajweedEnabled ? "color-palette" : "color-palette-outline"}
                                size={40}
                                onPress={() => setTajweedEnabled(!tajweedEnabled)}
                                accessibilityLabel={t("settingsReading.tajweed")}
                                color={tajweedEnabled ? colors.mushaf : undefined}
                            />
                            <IconButton plain icon="search" size={40} onPress={() => setJumpOpen(true)} accessibilityLabel={t("mushaf.goTo")} />
                        </View>
                    ),
                }}
            />
            <View style={styles.body} onLayout={(event) => setSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}>
                {size ? (
                    // `inverted` makes the first page sit on the right and swipes run right to left, like a printed mushaf.
                    <FlatList
                        ref={listRef}
                        data={PAGES}
                        horizontal
                        inverted
                        pagingEnabled
                        snapToInterval={size.width}
                        decelerationRate="fast"
                        disableIntervalMomentum
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => String(item)}
                        initialScrollIndex={startPage - 1}
                        getItemLayout={(_, index) => ({ length: size.width, offset: size.width * index, index })}
                        windowSize={3}
                        maxToRenderPerBatch={2}
                        initialNumToRender={1}
                        removeClippedSubviews
                        onMomentumScrollEnd={(event) => {
                            const next = Math.round(event.nativeEvent.contentOffset.x / size.width) + 1;
                            if (next !== page && isValidMushafPage(next)) {
                                setPage(next);
                                setSavedPage(next);
                            }
                        }}
                        renderItem={({ item }) => (
                            <View style={{ width: size.width, height: size.height, alignItems: "center" }}>
                                <View style={{ width: pageWidth, height: pageHeight }}>
                                    <MushafPageView pageNumber={item} width={pageWidth} height={pageHeight} tajweed={tajweedEnabled} onWordPress={onWordPress} onRulePress={setRuleId} />
                                </View>
                                <AppText variant="caption" muted style={styles.footer} accessibilityLabel={t("mushaf.page", { page: item })}>
                                    {item}
                                </AppText>
                            </View>
                        )}
                    />
                ) : null}
            </View>

            <RuleSheet ruleId={ruleId} onDismiss={() => setRuleId(null)} />
            <LegendSheet visible={legendOpen} onDismiss={() => setLegendOpen(false)} />
            <Sheet visible={jumpOpen} onDismiss={() => setJumpOpen(false)} title={t("mushaf.goTo")} maxHeightRatio={0.85}>
                <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: spacing.md }}>
                    <View style={styles.jumpRow}>
                        <TextInput
                            value={pageInput}
                            onChangeText={(text) => setPageInput(text.replace(/\D/g, "").slice(0, 3))}
                            placeholder={t("mushaf.pageHint", { total: MUSHAF_PAGES })}
                            placeholderTextColor={colors.ink2}
                            keyboardType="number-pad"
                            returnKeyType="go"
                            onSubmitEditing={submitJump}
                            accessibilityLabel={t("mushaf.pageHint", { total: MUSHAF_PAGES })}
                            style={[styles.input, { color: colors.ink, backgroundColor: colors.surface2, borderRadius: radius.md }]}
                        />
                        <Button mode="contained" onPress={submitJump} disabled={!isValidMushafPage(Number(pageInput))}>
                            {t("mushaf.go")}
                        </Button>
                    </View>
                    <AppText variant="label" muted>
                        {t("mushaf.surahs")}
                    </AppText>
                </View>
                <FlatList
                    data={surahs.data ?? []}
                    keyExtractor={(item) => String(item.number)}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                        <Pressable
                            onPress={() => {
                                setJumpOpen(false);
                                goTo(firstPageOf(item.number));
                            }}
                            accessibilityRole="button"
                            style={[styles.surahRow, { borderTopColor: colors.line }]}
                        >
                            <AppText style={styles.flex}>{`${item.number}. ${item.nameLatin}`}</AppText>
                            <AppText variant="caption" muted>
                                {firstPageOf(item.number)}
                            </AppText>
                            <Ionicons name="chevron-forward" size={16} color={colors.ink2} />
                        </Pressable>
                    )}
                />
            </Sheet>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    body: { flex: 1 },
    flex: { flex: 1 },
    footer: { height: FOOTER, textAlignVertical: "center", fontVariant: ["tabular-nums"] },
    headerButtons: { flexDirection: "row", gap: 4 },
    jumpRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    input: { flex: 1, fontSize: 16, paddingHorizontal: 14, paddingVertical: 10 },
    surahRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
