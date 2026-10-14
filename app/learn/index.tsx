import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import { ListRow } from "@/components/SurahRow";
import { AppText } from "@/components/ui/AppText";
import { PlateCard } from "@/components/ui/Plate";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useTheme } from "@/components/useTheme";
import { learnLanguage } from "@/constants/hijaiyah";
import { lessonsForLevel, type Lesson, type LessonLevel } from "@/services/learnRead";
import { nextLesson, passedCount, useLearnReadStore } from "@/store/learnRead";

/** Learn to Read: multi-level overview from alphabet basics to real Quran words. */
export default function LearnOverview() {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const { colors, spacing } = useTheme();
    const progress = useLearnReadStore((state) => state.lessons);
    const language = learnLanguage(i18n.language);
    const [level, setLevel] = useState<LessonLevel>(1);

    const levelLessons = lessonsForLevel(level);
    const passed = passedCount(progress, level);
    const next = nextLesson(progress, level);
    const open = (lesson: Lesson) => router.push({ pathname: "/learn/[lesson]" as any, params: { lesson: lesson.id } });

    const subtitleFor = (lesson: Lesson) => {
        let labels = "";
        if (lesson.level === 4) {
            labels = t(`learn.level4Lesson${lesson.number}`);
        } else if (lesson.words) {
            labels = lesson.words.map((w) => w.transliteration[language]).join(", ");
        } else {
            labels = lesson.letters.map((letter) => letter.name[language]).join(", ");
        }
        const state = progress[lesson.id];
        if (state?.passedAt) return `${labels} · ${t("learn.done")}`;
        if (state) return `${labels} · ${t("learn.best", { percent: Math.round(state.best * 100) })}`;
        return labels;
    };

    const arabicPreview = (lesson: Lesson) => {
        if (lesson.words) {
            return lesson.words.slice(0, 3).map((w) => w.arabic).join(" ");
        }
        if (lesson.level === 2) {
            return lesson.letters.map((l) => `${l.fathah} ${l.kasrah} ${l.dammah}`).slice(0, 2).join(" ");
        }
        if (lesson.level === 3) {
            if (lesson.connectedWords && lesson.connectedWords.length > 0) {
                return lesson.connectedWords.slice(0, 2).map((w) => w.arabic).join(" ");
            }
            return lesson.letters.map((l) => `${l.forms.initial}${l.forms.medial}${l.forms.final}`).slice(0, 2).join(" ");
        }
        if (lesson.level === 4) {
            if (lesson.vowelKind === "fathatain") {
                return lesson.letters.slice(0, 3).map((l) => l.fathatain).join(" ");
            }
            if (lesson.vowelKind === "kasratain") {
                return lesson.letters.slice(0, 3).map((l) => l.kasratain).join(" ");
            }
            if (lesson.vowelKind === "dammatain") {
                return lesson.letters.slice(0, 3).map((l) => l.dammatain).join(" ");
            }
        }
        return lesson.letters.map((letter) => letter.fathah).join(" ");
    };

    const levelOptions: { value: string; label: string }[] = [
        { value: "1", label: "1" },
        { value: "2", label: "2" },
        { value: "3", label: "3" },
        { value: "4", label: "4" },
        { value: "5", label: "5" },
    ];

    return (
        <View style={[styles.screen, { backgroundColor: colors.paper }]}>
            <Stack.Screen options={{ title: t("learn.title") }} />
            <FlatList
                data={levelLessons}
                keyExtractor={(lesson) => lesson.id}
                ListHeaderComponent={
                    <View style={{ padding: spacing.lg, gap: spacing.md }}>
                        <SegmentedControl
                            options={levelOptions}
                            value={String(level)}
                            onChange={(val) => setLevel(Number(val) as LessonLevel)}
                            accessibilityLabel={t("learn.levelSelector")}
                        />
                        <PlateCard style={{ padding: spacing.xl, gap: spacing.sm }}>
                            <AppText variant="label" color={colors.heroAccent}>
                                {t("learn.level", { level })}
                            </AppText>
                            <AppText variant="title" color={colors.heroInk}>
                                {t(`learn.level${level}Title`)}
                            </AppText>
                            <AppText variant="caption" color={colors.heroInk}>
                                {t("learn.progress", { done: passed, total: levelLessons.length })}
                            </AppText>
                            {next ? (
                                <Button mode="contained" buttonColor={colors.heroAccent} textColor={colors.heroBackground} onPress={() => open(next)} style={styles.alignStart}>
                                    {passed === 0 ? t("learn.start") : t("learn.continue", { number: next.number })}
                                </Button>
                            ) : (
                                <AppText variant="bodyStrong" color={colors.heroInk}>
                                    {t("learn.passed")}
                                </AppText>
                            )}
                        </PlateCard>
                        <AppText muted>{t(`learn.level${level}Desc`)}</AppText>
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
                        arabic={arabicPreview(item)}
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
