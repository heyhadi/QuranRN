import { Stack, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { FlatList, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import { ListRow } from "@/components/SurahRow";
import { AppText } from "@/components/ui/AppText";
import { PlateCard } from "@/components/ui/Plate";
import { useTheme } from "@/components/useTheme";
import { learnLanguage } from "@/constants/hijaiyah";
import { LEVEL_1, type Lesson } from "@/services/learnRead";
import { nextLesson, passedCount, useLearnReadStore } from "@/store/learnRead";

/** Learn to Read, level 1: the lessons, what each one teaches, and where the learner is. */
export default function LearnOverview() {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const { colors, spacing } = useTheme();
    const progress = useLearnReadStore((state) => state.lessons);
    const language = learnLanguage(i18n.language);
    const passed = passedCount(progress);
    const next = nextLesson(progress);
    const open = (lesson: Lesson) => router.push({ pathname: "/learn/[lesson]", params: { lesson: lesson.id } });

    const subtitleFor = (lesson: Lesson) => {
        const names = lesson.letters.map((letter) => letter.name[language]).join(", ");
        const state = progress[lesson.id];
        if (state?.passedAt) return `${names} · ${t("learn.done")}`;
        if (state) return `${names} · ${t("learn.best", { percent: Math.round(state.best * 100) })}`;
        return names;
    };

    return (
        <View style={[styles.screen, { backgroundColor: colors.paper }]}>
            <Stack.Screen options={{ title: t("learn.title") }} />
            <FlatList
                data={LEVEL_1}
                keyExtractor={(lesson) => lesson.id}
                ListHeaderComponent={
                    <View style={{ padding: spacing.lg, gap: spacing.md }}>
                        <PlateCard style={{ padding: spacing.xl, gap: spacing.sm }}>
                            <AppText variant="label" color={colors.heroAccent}>
                                {t("learn.level", { level: 1 })}
                            </AppText>
                            <AppText variant="title" color={colors.heroInk}>
                                {t("learn.level1Title")}
                            </AppText>
                            <AppText variant="caption" color={colors.heroInk}>
                                {t("learn.progress", { done: passed, total: LEVEL_1.length })}
                            </AppText>
                            {next ? (
                                <Button mode="contained" buttonColor={colors.heroAccent} textColor={colors.heroBackground} onPress={() => open(next)} style={styles.alignStart}>
                                    {passed === 0 ? t("learn.start") : t("learn.continue", { number: next.number })}
                                </Button>
                            ) : (
                                <AppText variant="bodyStrong" color={colors.heroInk}>
                                    {t("learn.levelDone")}
                                </AppText>
                            )}
                        </PlateCard>
                        <AppText muted>{t("learn.intro")}</AppText>
                        <AppText variant="label" muted style={{ paddingTop: spacing.sm }}>
                            {t("learn.lessons")}
                        </AppText>
                    </View>
                }
                renderItem={({ item }) => (
                    <ListRow
                        number={item.number}
                        title={t("learn.lesson", { number: item.number })}
                        subtitle={subtitleFor(item)}
                        arabic={item.letters.map((letter) => letter.fathah).join(" ")}
                        onPress={() => open(item)}
                    />
                )}
                contentContainerStyle={{ paddingBottom: spacing.xxl }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    alignStart: { alignSelf: "flex-start", marginTop: 8 },
});
