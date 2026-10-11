import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { ListRow } from "@/components/SurahRow";
import { AppText } from "@/components/ui/AppText";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useTheme } from "@/components/useTheme";
import type { AppLanguage } from "@/i18n";
import { formatHijri } from "@/services/hijri";
import { juzOf, juzStarts, type JuzStart } from "@/services/juz";
import { useEnglishSurahMeanings, useSurahList } from "@/services/queries";
import { filterSurahs } from "@/services/surahSearch";
import type { SurahSummary } from "@/services/types";
import { useReadingProgressStore } from "@/store/readingProgress";

type ListMode = "surah" | "juz";

export default function Home() {
    const { t, i18n } = useTranslation();
    const language = i18n.language as AppLanguage;
    const router = useRouter();
    const { colors, radius, spacing, fonts } = useTheme();
    const surahList = useSurahList();
    const englishMeanings = useEnglishSurahMeanings(language === "en");
    const lastRead = useReadingProgressStore((state) => state.lastRead);
    const [searchQuery, setSearchQuery] = useState("");
    const [mode, setMode] = useState<ListMode>("surah");

    // equran.id only has Indonesian meanings; in English, use quran.com's once they have loaded.
    const surahs: SurahSummary[] = useMemo(() => {
        const list = surahList.data ?? [];
        const meanings = language === "en" ? englishMeanings.data : undefined;
        return meanings ? list.map((surah) => ({ ...surah, meaning: meanings[surah.number] ?? surah.meaning })) : list;
    }, [surahList.data, englishMeanings.data, language]);

    const filteredSurahs = useMemo(() => filterSurahs(surahs, searchQuery), [surahs, searchQuery]);
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

            <View style={[styles.search, { backgroundColor: colors.surface2, borderRadius: radius.md }]}>
                <Ionicons name="search" size={18} color={colors.ink2} />
                <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={t("home.searchPlaceholder")}
                    placeholderTextColor={colors.ink2}
                    // Surah names are transliterations; autocorrect turns "kahf" into "Kahn".
                    autoCorrect={false}
                    autoCapitalize="none"
                    spellCheck={false}
                    clearButtonMode="while-editing"
                    returnKeyType="search"
                    accessibilityLabel={t("home.searchPlaceholder")}
                    style={[styles.searchInput, { color: colors.ink, fontFamily: fonts.body }]}
                />
            </View>

            {!searchQuery ? (
                <SegmentedControl<ListMode>
                    value={mode}
                    onChange={setMode}
                    options={[
                        { value: "surah", label: t("home.tabSurah") },
                        { value: "juz", label: t("home.tabJuz") },
                    ]}
                />
            ) : null}
        </View>
    );

    const showJuz = mode === "juz" && !searchQuery;

    return (
        <SafeAreaView edges={["top"]} style={[styles.screen, { backgroundColor: colors.paper }]}>
            {showJuz ? (
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
    search: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12 },
    searchInput: { flex: 1, fontSize: 16, paddingVertical: 10 },
});
