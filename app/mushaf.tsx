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
import { listIndexOf, mushafLayout, pageAt, pagesOfSpread, SPREAD_GAP, SPREADS, spreadIndexOf } from "@/services/mushafLayout";
import { useMushafPage, useSurahList } from "@/services/queries";
import { useKhatamStore } from "@/store/khatam";
import { useMushafStore } from "@/store/mushaf";
import { useReadingProgressStore } from "@/store/readingProgress";
import { useSettingsStore } from "@/store/settings";

const FOOTER = 34;
/** How long a page has to stay on screen before its ayahs count as read for the Khatam plan. */
const READ_AFTER_MS = 2000;

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

    useEffect(() => {
        setSavedPage(page);
    }, [page, setSavedPage]);

    // One page, or two side by side when a tablet is turned sideways; the page always keeps its proportions.
    const layout = size ? mushafLayout(size.width, size.height, FOOTER) : null;
    const spread = layout?.spread ?? false;
    const pageWidth = layout?.pageWidth ?? 0;
    const pageHeight = layout?.pageHeight ?? 0;
    const listData = useMemo(() => Array.from({ length: spread ? SPREADS : MUSHAF_PAGES }, (_, index) => index), [spread]);
    const [rightPage, leftPage] = spread ? pagesOfSpread(spreadIndexOf(page)) : [page, null];

    const goTo = useCallback(
        (target: number) => {
            if (!isValidMushafPage(target)) return;
            setPage(target);
            setSavedPage(target);
            listRef.current?.scrollToIndex({ index: listIndexOf(target, spread), animated: false });
        },
        [setSavedPage, spread],
    );

    // The pages in view (one, or both of a spread): their ayahs count as read once they have stayed on screen a moment.
    const rightData = useMushafPage(rightPage);
    const leftData = useMushafPage(leftPage ?? 0);
    const visibleLines = useMemo(() => [...(rightData.data?.lines ?? []), ...(leftData.data?.lines ?? [])], [rightData.data, leftData.data]);
    const recordRead = useKhatamStore((state) => state.recordRead);
    useEffect(() => {
        if (visibleLines.length === 0) return;
        const timer = setTimeout(() => {
            const bySurah = new Map<number, Set<number>>();
            for (const line of visibleLines) {
                if (line.kind !== "text") continue;
                for (const word of line.words) bySurah.set(word.surahNumber, (bySurah.get(word.surahNumber) ?? new Set()).add(word.ayahNumber));
            }
            for (const [surah, ayahs] of bySurah) recordRead(surah, [...ayahs]);
        }, READ_AFTER_MS);
        return () => clearTimeout(timer);
    }, [visibleLines, recordRead]);

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

    // Every Surah that has ayahs on the page, in order: a page can hold the end of one Surah and the start of the next.
    const surahNumbersOnPage = useMemo(() => {
        const numbers: number[] = [];
        for (const line of visibleLines) {
            if (line.kind !== "text") continue;
            for (const word of line.words) if (!numbers.includes(word.surahNumber)) numbers.push(word.surahNumber);
        }
        return numbers;
    }, [visibleLines]);
    const nameOf = (number: number) => surahs.data?.find((surah) => surah.number === number)?.nameLatin;
    const surahName = surahNumbersOnPage.length === 0 ? undefined : surahNumbersOnPage.length === 1 ? nameOf(surahNumbersOnPage[0]) : `${nameOf(surahNumbersOnPage[0])} – ${nameOf(surahNumbersOnPage[surahNumbersOnPage.length - 1])}`;

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
                        key={spread ? "spread" : "single"}
                        ref={listRef}
                        data={listData}
                        horizontal
                        inverted
                        pagingEnabled
                        snapToInterval={size.width}
                        decelerationRate="fast"
                        disableIntervalMomentum
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => String(item)}
                        initialScrollIndex={listIndexOf(page, spread)}
                        getItemLayout={(_, index) => ({ length: size.width, offset: size.width * index, index })}
                        windowSize={3}
                        maxToRenderPerBatch={2}
                        initialNumToRender={1}
                        removeClippedSubviews
                        onMomentumScrollEnd={(event) => {
                            const next = pageAt(Math.round(event.nativeEvent.contentOffset.x / size.width), spread);
                            if (next !== rightPage && isValidMushafPage(next)) {
                                setPage(next);
                                setSavedPage(next);
                            }
                        }}
                        renderItem={({ item }) => {
                            const [right, left] = spread ? pagesOfSpread(item) : [item + 1, null];
                            return (
                                <View style={{ width: size.width, height: size.height, alignItems: "center" }}>
                                    <View style={[styles.spread, { gap: SPREAD_GAP }]}>
                                        {[right, left].map((number) =>
                                            number === null ? null : (
                                                <View key={number} style={{ width: pageWidth }}>
                                                    <View style={{ width: pageWidth, height: pageHeight }}>
                                                        <MushafPageView pageNumber={number} width={pageWidth} height={pageHeight} tajweed={tajweedEnabled} onWordPress={onWordPress} onRulePress={setRuleId} />
                                                    </View>
                                                    <AppText variant="caption" muted style={styles.footer} accessibilityLabel={t("mushaf.page", { page: number })}>
                                                        {number}
                                                    </AppText>
                                                </View>
                                            ),
                                        )}
                                    </View>
                                </View>
                            );
                        }}
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
    // Right to left, so the odd page of a spread sits on the right.
    spread: { flexDirection: "row-reverse", justifyContent: "center" },
    footer: { height: FOOTER, textAlign: "center", textAlignVertical: "center", fontVariant: ["tabular-nums"] },
    headerButtons: { flexDirection: "row", gap: 4 },
    jumpRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    input: { flex: 1, fontSize: 16, paddingHorizontal: 14, paddingVertical: 10 },
    surahRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
