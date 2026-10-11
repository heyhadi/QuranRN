import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { SavedList } from "@/components/SavedList";
import { ListRow } from "@/components/SurahRow";
import { AppText } from "@/components/ui/AppText";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useTheme } from "@/components/useTheme";
import type { AppLanguage } from "@/i18n";
import { formatHijri } from "@/services/hijri";
import { juzOf, juzStarts, type JuzStart } from "@/services/juz";
import { useAyahSearch, useEnglishSurahMeanings, useSurahList } from "@/services/queries";
import type { AyahSearchResult } from "@/services/quranCom";
import { parseHighlight } from "@/services/richText";
import { filterSurahs } from "@/services/surahSearch";
import type { SurahSummary } from "@/services/types";
import { dateKey, dailyTarget } from "@/services/khatam";
import { TOTAL_AYAHS } from "@/constants/ayahCounts";
import { useHifzStore } from "@/store/hifz";
import { useKhatamStore, useReadCount } from "@/store/khatam";
import { useReadingProgressStore } from "@/store/readingProgress";

type ListMode = "surah" | "juz" | "ayah" | "saved";

export default function Home() {
    const { t, i18n } = useTranslation();
    const language = i18n.language as AppLanguage;
    const router = useRouter();
    const { colors, radius, spacing, fonts } = useTheme();
    const surahList = useSurahList();
    const englishMeanings = useEnglishSurahMeanings(language === "en");
    const lastRead = useReadingProgressStore((state) => state.lastRead);
    const readCount = useReadCount();
    const khatamPlan = useKhatamStore((state) => state.plan);
    const todayRead = useKhatamStore((state) => state.log[dateKey(new Date())] ?? 0);
    const memorizedTotal = useHifzStore((state) => Object.keys(state.memorized).length);
    const [searchQuery, setSearchQuery] = useState("");
    const [mode, setMode] = useState<ListMode>("surah");

    // equran.id only has Indonesian meanings; in English, use quran.com's once they have loaded.
    const surahs: SurahSummary[] = useMemo(() => {
        const list = surahList.data ?? [];
        const meanings = language === "en" ? englishMeanings.data : undefined;
        return meanings ? list.map((surah) => ({ ...surah, meaning: meanings[surah.number] ?? surah.meaning })) : list;
    }, [surahList.data, englishMeanings.data, language]);

    const filteredSurahs = useMemo(() => filterSurahs(surahs, searchQuery), [surahs, searchQuery]);
    // Searching ayahs by meaning goes to quran.com, so it needs a connection and a few letters to start.
    const ayahSearch = useAyahSearch(mode === "ayah" ? searchQuery : "", language);
    const surahByNumber = useMemo(() => new Map(surahs.map((surah) => [surah.number, surah])), [surahs]);
    const hijri = useMemo(() => formatHijri(new Date(), language), [language]);

    const openSurah = useCallback(
        (surahNumber: number, ayahNumber?: number) =>
            router.push({ pathname: "/surah/[id]", params: ayahNumber ? { id: surahNumber, ayah: ayahNumber } : { id: surahNumber } }),
        [router],
    );

    if (surahList.isPending) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.paper }]}>
                <ActivityIndicator size="large" color={colors.mushaf} />
            </View>
        );
    }

    if (surahList.isError) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.paper }]}>
                <AppText style={styles.centerText}>{t("home.loadError")}</AppText>
                <Button mode="contained" onPress={() => surahList.refetch()}>
                    {t("common.tryAgain")}
                </Button>
            </View>
        );
    }

    const header = (
        <View style={{ gap: spacing.lg, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
            <View>
                <AppText variant="display">{t("home.greeting")}</AppText>
                {hijri ? <AppText muted>{hijri}</AppText> : null}
            </View>

            {lastRead && !searchQuery ? (
                <Pressable
                    onPress={() => openSurah(lastRead.surahNumber, lastRead.ayahNumber)}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.continueCard, { backgroundColor: colors.heroBackground, borderRadius: radius.lg, opacity: pressed ? 0.9 : 1 }]}
                >
                    <View style={styles.continueText}>
                        <AppText variant="caption" color={colors.heroAccent} style={styles.dim}>
                            {t("home.continueReading")}
                        </AppText>
                        <AppText variant="title" color={colors.heroInk}>
                            {lastRead.surahNameLatin}
                        </AppText>
                        <AppText variant="caption" color={colors.heroInk} style={styles.dim}>
                            {t("home.continueAyah", { ayah: lastRead.ayahNumber, juz: juzOf(lastRead.surahNumber, lastRead.ayahNumber) })}
                        </AppText>
                    </View>
                    <AppText style={{ fontFamily: fonts.quran, fontSize: 26, lineHeight: 48, color: colors.heroAccent }}>
                        {surahByNumber.get(lastRead.surahNumber)?.nameArabic ?? ""}
                    </AppText>
                </Pressable>
            ) : null}

            {!searchQuery ? (
                <View style={styles.tiles}>
                    <Pressable
                        onPress={() => router.push("/khatam")}
                        accessibilityRole="button"
                        style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg }]}
                    >
                        <AppText variant="label" muted>
                            {t("khatam.tile")}
                        </AppText>
                        <AppText variant="title">{t("khatam.percent", { value: Math.floor((readCount / TOTAL_AYAHS) * 100) })}</AppText>
                        <AppText variant="caption" muted>
                            {khatamPlan ? t("khatam.todayRead", { read: todayRead, goal: dailyTarget(khatamPlan.targetDays) }) : t("khatam.start")}
                        </AppText>
                    </Pressable>
                    <Pressable
                        onPress={() => router.push("/hifz")}
                        accessibilityRole="button"
                        style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg }]}
                    >
                        <AppText variant="label" muted>
                            {t("hifz.tile")}
                        </AppText>
                        <AppText variant="title">{memorizedTotal}</AppText>
                        <AppText variant="caption" muted numberOfLines={1}>
                            {t("hifz.count", { count: memorizedTotal })}
                        </AppText>
                    </Pressable>
                </View>
            ) : null}

            {mode !== "saved" ? (
                <View style={[styles.search, { backgroundColor: colors.surface2, borderRadius: radius.md }]}>
                    <Ionicons name="search" size={18} color={colors.ink2} />
                    <TextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder={t(mode === "ayah" ? "search.ayahHint" : "home.searchPlaceholder")}
                        placeholderTextColor={colors.ink2}
                        // Surah names are transliterations; autocorrect turns "kahf" into "Kahn".
                        autoCorrect={false}
                        autoCapitalize="none"
                        spellCheck={false}
                        clearButtonMode="while-editing"
                        returnKeyType="search"
                        accessibilityLabel={t(mode === "ayah" ? "search.ayahHint" : "home.searchPlaceholder")}
                        style={[styles.searchInput, { color: colors.ink, fontFamily: fonts.body }]}
                    />
                </View>
            ) : null}

            <SegmentedControl<ListMode>
                value={mode}
                onChange={setMode}
                options={[
                    { value: "surah", label: t("home.tabSurah") },
                    { value: "juz", label: t("home.tabJuz") },
                    { value: "ayah", label: t("search.ayah") },
                    { value: "saved", label: t("tabs.saved") },
                ]}
            />
        </View>
    );

    const showJuz = mode === "juz" && !searchQuery;
    const showAyahSearch = mode === "ayah";
    const showSaved = mode === "saved";

    return (
        <SafeAreaView edges={["top"]} style={[styles.screen, { backgroundColor: colors.paper }]}>
            {showSaved ? (
                <SavedList header={header} />
            ) : showAyahSearch ? (
                <FlatList<AyahSearchResult>
                    data={ayahSearch.data ?? []}
                    keyExtractor={(item) => `${item.surahNumber}:${item.ayahNumber}`}
                    ListHeaderComponent={header}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    ListEmptyComponent={
                        <AppText muted style={[styles.centerText, { marginTop: spacing.xl, paddingHorizontal: spacing.lg }]}>
                            {searchQuery.trim().length < 3
                                ? t("search.ayahMin")
                                : ayahSearch.isFetching
                                  ? ""
                                  : ayahSearch.isError
                                    ? t("search.ayahError")
                                    : t("search.ayahNone", { query: searchQuery })}
                        </AppText>
                    }
                    ListFooterComponent={ayahSearch.isFetching ? <ActivityIndicator color={colors.mushaf} style={{ margin: spacing.lg }} /> : null}
                    renderItem={({ item }) => {
                        const surah = surahByNumber.get(item.surahNumber);
                        return (
                            <Pressable
                                onPress={() => openSurah(item.surahNumber, item.ayahNumber)}
                                accessibilityRole="button"
                                style={({ pressed }) => [styles.result, { borderBottomColor: colors.line, backgroundColor: pressed ? colors.surface2 : "transparent", paddingHorizontal: spacing.lg }]}
                            >
                                <AppText variant="label" color={colors.brass}>
                                    {t("search.ayahResult", { surah: surah?.nameLatin ?? item.surahNumber, ayah: `${item.surahNumber}:${item.ayahNumber}` })}
                                </AppText>
                                <AppText variant="arabic" size={22} numberOfLines={2}>
                                    {item.arabic}
                                </AppText>
                                {item.snippet ? (
                                    <AppText variant="caption" muted numberOfLines={3}>
                                        {parseHighlight(item.snippet).map((part, index) =>
                                            part.highlight ? (
                                                <Text key={index} style={{ color: colors.mushaf, fontWeight: "700" }}>
                                                    {part.text}
                                                </Text>
                                            ) : (
                                                part.text
                                            ),
                                        )}
                                    </AppText>
                                ) : null}
                            </Pressable>
                        );
                    }}
                />
            ) : showJuz ? (
                <FlatList<JuzStart>
                    data={juzStarts}
                    keyExtractor={(item) => String(item.juz)}
                    ListHeaderComponent={header}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => {
                        const surah = surahByNumber.get(item.surahNumber);
                        return (
                            <ListRow
                                number={item.juz}
                                title={t("common.juz", { number: item.juz })}
                                subtitle={t("home.juzStartsAt", { surah: surah?.nameLatin ?? item.surahNumber, ayah: item.ayahNumber })}
                                arabic={surah?.nameArabic ?? ""}
                                onPress={() => openSurah(item.surahNumber, item.ayahNumber)}
                            />
                        );
                    }}
                />
            ) : (
                <FlatList<SurahSummary>
                    data={filteredSurahs}
                    keyExtractor={(item) => String(item.number)}
                    ListHeaderComponent={header}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    ListEmptyComponent={
                        <AppText muted style={[styles.centerText, { marginTop: spacing.xl }]}>
                            {t("home.noMatch", { query: searchQuery })}
                        </AppText>
                    }
                    renderItem={({ item }) => (
                        <ListRow
                            number={item.number}
                            title={item.nameLatin}
                            subtitle={`${item.meaning} · ${t(`common.place.${item.revelationPlace}`)} · ${t("common.ayahCount", { count: item.ayahCount })}`}
                            arabic={item.nameArabic}
                            onPress={() => openSurah(item.number)}
                        />
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 16 },
    centerText: { textAlign: "center" },
    continueCard: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
    continueText: { flex: 1, gap: 2 },
    dim: { opacity: 0.85 },
    tiles: { flexDirection: "row", gap: 12 },
    tile: { flex: 1, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 2 },
    search: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12 },
    searchInput: { flex: 1, fontSize: 16, paddingVertical: 10 },
    result: { paddingVertical: 12, gap: 4, borderBottomWidth: StyleSheet.hairlineWidth },
});
