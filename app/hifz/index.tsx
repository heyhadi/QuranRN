import { Stack, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, StyleSheet, View } from "react-native";
import { ListRow } from "@/components/SurahRow";
import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/components/useTheme";
import { useSurahList } from "@/services/queries";
import { useHifzStore, surahsInProgress } from "@/store/hifz";

/** Surahs being memorized, with progress. A Surah is started from its reader (the hifz button). */
export default function HifzOverview() {
    const { t } = useTranslation();
    const router = useRouter();
    const { colors, spacing } = useTheme();
    const memorized = useHifzStore((state) => state.memorized);
    const surahs = useSurahList().data;
    const byNumber = useMemo(() => new Map((surahs ?? []).map((surah) => [surah.number, surah])), [surahs]);
    const inProgress = useMemo(() => surahsInProgress(memorized), [memorized]);
    const total = Object.keys(memorized).length;

    return (
        <View style={[styles.screen, { backgroundColor: colors.paper }]}>
            <Stack.Screen options={{ title: t("hifz.title") }} />
            <FlatList
                data={inProgress}
                keyExtractor={(item) => String(item.surahNumber)}
                ListHeaderComponent={
                    <View style={{ padding: spacing.lg, gap: spacing.sm }}>
                        <AppText variant="display">{t("hifz.count", { count: total })}</AppText>
                        <AppText muted>{t("hifz.intro")}</AppText>
                        {inProgress.length > 0 ? (
                            <AppText variant="label" muted style={{ paddingTop: spacing.md }}>
                                {t("hifz.inProgress")}
                            </AppText>
                        ) : null}
                    </View>
                }
                ListEmptyComponent={
                    <AppText muted style={[styles.center, { padding: spacing.xl }]}>
                        {t("hifz.none")}
                    </AppText>
                }
                renderItem={({ item }) => {
                    const surah = byNumber.get(item.surahNumber);
                    return (
                        <ListRow
                            number={item.surahNumber}
                            title={surah?.nameLatin ?? String(item.surahNumber)}
                            subtitle={t("hifz.progressOf", { done: item.count, total: surah?.ayahCount ?? "?" })}
                            arabic={surah?.nameArabic ?? ""}
                            onPress={() => router.push({ pathname: "/hifz/[id]", params: { id: item.surahNumber } })}
                        />
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    center: { textAlign: "center" },
});
