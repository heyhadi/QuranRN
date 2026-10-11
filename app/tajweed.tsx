import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { MiniPlayer } from "@/components/MiniPlayer";
import { TajweedText } from "@/components/TajweedText";
import { RuleDetails } from "@/components/TajweedSheets";
import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/components/useTheme";
import { tajweedRules, type TajweedRule } from "@/constants/tajweed";
import { useSurahList, useTajweedVerse } from "@/services/queries";
import { useAudioPlayerStore, usePlayingAyah } from "@/store/audioPlayer";

function RuleCard({ rule, surahName }: { rule: TajweedRule; surahName: string }) {
    const { t } = useTranslation();
    const { colors, spacing, radius } = useTheme();
    const [surahNumber, ayahNumber] = rule.example.split(":").map(Number);
    const example = useTajweedVerse(rule.example);
    const playingAyah = usePlayingAyah(surahNumber);
    const toggle = useAudioPlayerStore((state) => state.toggle);
    const isPlaying = playingAyah === ayahNumber;

    return (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md }]}>
            <RuleDetails ruleId={rule.id} />
            <View style={[styles.example, { backgroundColor: colors.surface2, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm }]}>
                <View style={styles.exampleHead}>
                    <AppText variant="label" muted style={styles.flex}>
                        {`${t("tajweed.example")} · ${surahName} ${rule.example}`}
                    </AppText>
                    <Pressable
                        onPress={() => toggle([{ surahNumber, ayahNumber, surahName }], 0)}
                        accessibilityRole="button"
                        accessibilityLabel={t(isPlaying ? "tajweed.stopExample" : "tajweed.playExample", { reference: rule.example })}
                        hitSlop={8}
                    >
                        <Ionicons name={isPlaying ? "stop-circle" : "play-circle"} size={32} color={colors.mushaf} />
                    </Pressable>
                </View>
                {example.isPending ? (
                    <ActivityIndicator color={colors.mushaf} />
                ) : example.data ? (
                    <TajweedText segments={example.data} size={30} />
                ) : (
                    <AppText variant="caption" muted>
                        {t("tajweed.colorError")}
                    </AppText>
                )}
            </View>
        </View>
    );
}

/** A card for every tajweed rule: what it is, how to say it, and a real example you can hear. */
export default function TajweedScreen() {
    const { t } = useTranslation();
    const { colors, spacing } = useTheme();
    const surahs = useSurahList().data;
    const names = useMemo(() => new Map((surahs ?? []).map((surah) => [surah.number, surah.nameLatin])), [surahs]);
    const renderItem = useCallback(
        ({ item }: { item: TajweedRule }) => <RuleCard rule={item} surahName={names.get(Number(item.example.split(":")[0])) ?? ""} />,
        [names],
    );

    return (
        <View style={[styles.screen, { backgroundColor: colors.paper }]}>
            <Stack.Screen options={{ title: t("tajweed.learnTitle") }} />
            <FlatList
                data={tajweedRules}
                keyExtractor={(rule) => rule.id}
                renderItem={renderItem}
                ListHeaderComponent={
                    <AppText muted style={{ paddingBottom: spacing.sm }}>
                        {t("tajweed.learnIntro")}
                    </AppText>
                }
                contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
            />
            <MiniPlayer safeBottom />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    flex: { flex: 1 },
    card: { borderWidth: StyleSheet.hairlineWidth },
    example: {},
    exampleHead: { flexDirection: "row", alignItems: "center", gap: 8 },
});
