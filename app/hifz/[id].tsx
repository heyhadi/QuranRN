import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { Button } from "react-native-paper";
import { MiniPlayer } from "@/components/MiniPlayer";
import { AppText } from "@/components/ui/AppText";
import { IconButton } from "@/components/ui/IconButton";
import { ReciterTile } from "@/components/ui/ReciterTile";
import { StarNumber } from "@/components/ui/StarNumber";
import { useTheme } from "@/components/useTheme";
import { getReciter, reciters } from "@/constants/reciters";
import { useSurahDetail } from "@/services/queries";
import type { Ayah } from "@/services/types";
import { useAudioPlayerStore, usePlayingAyah, type Track } from "@/store/audioPlayer";
import { HIFZ_PAUSE_OPTIONS, HIFZ_REPEAT_OPTIONS, memorizedCount, useHifzStore } from "@/store/hifz";
import { bookmarkKey } from "@/store/bookmarks";

// Reciters offered for practice: the teaching recitation first, then a few clear, steady ones.
const PRACTICE_RECITER_IDS = ["husary-muallim", "husary", "minshawi", "alafasy", "muaiqly"];

function Chips<T extends number | string>({ options, value, onChange, label }: { options: { id: T; label: string }[]; value: T; onChange: (id: T) => void; label: string }) {
    const { colors, radius } = useTheme();
    return (
        <View style={styles.chips} accessibilityLabel={label}>
            {options.map((option) => {
                const selected = option.id === value;
                return (
                    <Pressable
                        key={String(option.id)}
                        onPress={() => onChange(option.id)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        style={[styles.chip, { backgroundColor: selected ? colors.mushaf : colors.surface2, borderRadius: radius.pill }]}
                    >
                        <AppText variant="bodyStrong" color={selected ? colors.onMushaf : colors.ink2}>
                            {option.label}
                        </AppText>
                    </Pressable>
                );
            })}
        </View>
    );
}

export default function HifzScreen() {
    const { t } = useTranslation();
    const { colors, spacing, radius } = useTheme();
    const params = useLocalSearchParams<{ id: string }>();
    const surahNumber = Number(Array.isArray(params.id) ? params.id[0] : params.id) || 0;
    const surahQuery = useSurahDetail(surahNumber);
    const surah = surahQuery.data;
    const ayahs = useMemo(() => surah?.ayahs ?? [], [surah]);

    const hifz = useHifzStore();
    const playingAyah = usePlayingAyah(surahNumber);
    const playFrom = useAudioPlayerStore((state) => state.playFrom);
    const stop = useAudioPlayerStore((state) => state.stop);
    const setPlayerRepeat = useAudioPlayerStore((state) => state.setRepeatEach);

    const total = ayahs.length;
    const memorized = memorizedCount(hifz.memorized, surahNumber);
    const [from, setFrom] = useState(1);
    const [to, setTo] = useState(Math.min(5, Math.max(1, total)));
    const [revealed, setRevealed] = useState<Set<number>>(new Set());

    // The range follows the Surah once it has loaded (a short Surah has fewer than 5 ayahs).
    const upper = total || 1;
    const rangeFrom = Math.min(Math.max(1, from), upper);
    const rangeTo = Math.min(Math.max(rangeFrom, to), upper);
    const isPlaying = playingAyah !== null;

    const startPractice = useCallback(
        (first: number, last: number) => {
            if (!surah) return;
            const queue: Track[] = ayahs
                .filter((ayah) => ayah.ayahNumber >= first && ayah.ayahNumber <= last)
                .map((ayah) => ({ surahNumber: ayah.surahNumber, ayahNumber: ayah.ayahNumber, surahName: surah.nameLatin }));
            setPlayerRepeat(hifz.repeatEach, hifz.pauseSeconds * 1000);
            playFrom(queue, 0, { reciterId: hifz.reciterId });
        },
        [surah, ayahs, hifz.repeatEach, hifz.pauseSeconds, hifz.reciterId, playFrom, setPlayerRepeat],
    );

    const reveal = (ayahNumber: number) => setRevealed((current) => new Set(current).add(ayahNumber));

    if (surahQuery.isPending) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.paper }]}>
                <ActivityIndicator color={colors.mushaf} size="large" />
            </View>
        );
    }
    if (!surah) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.paper }]}>
                <AppText style={styles.center}>{t("reader.loadError")}</AppText>
                <Button mode="contained" onPress={() => surahQuery.refetch()}>
                    {t("common.tryAgain")}
                </Button>
            </View>
        );
    }

    const stepper = (label: string, value: number, onChange: (next: number) => void, min: number, max: number) => (
        <View style={styles.stepperRow}>
            <AppText variant="bodyStrong" style={styles.flex}>
                {label}
            </AppText>
            <IconButton icon="remove" size={32} onPress={() => onChange(Math.max(min, value - 1))} disabled={value <= min} accessibilityLabel={`${label} −`} />
            <AppText variant="bodyStrong" style={styles.stepValue}>
                {value}
            </AppText>
            <IconButton icon="add" size={32} onPress={() => onChange(Math.min(max, value + 1))} disabled={value >= max} accessibilityLabel={`${label} +`} />
        </View>
    );

    const renderAyah = ({ item }: { item: Ayah }) => {
        const key = bookmarkKey(item.surahNumber, item.ayahNumber);
        const done = key in hifz.memorized;
        const inRange = item.ayahNumber >= rangeFrom && item.ayahNumber <= rangeTo;
        const veiled = hifz.hideText && !revealed.has(item.ayahNumber);
        const current = playingAyah === item.ayahNumber;
        return (
            <Pressable
                onPress={() => (veiled ? reveal(item.ayahNumber) : undefined)}
                accessibilityRole={veiled ? "button" : undefined}
                accessibilityLabel={veiled ? t("hifz.hidden") : undefined}
                style={[
                    styles.ayah,
                    { backgroundColor: current ? colors.mushafSoft : colors.surface, borderColor: inRange ? colors.mushaf : colors.line, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
                ]}
            >
                <View style={styles.ayahHead}>
                    <StarNumber value={item.ayahNumber} size={32} active={current} />
                    <View style={styles.flex} />
                    <IconButton icon="play" size={30} onPress={() => startPractice(item.ayahNumber, Math.max(item.ayahNumber, rangeTo))} accessibilityLabel={t("hifz.playFrom", { ayah: item.ayahNumber })} />
                    <Pressable
                        onPress={() => hifz.setMemorized(item.surahNumber, item.ayahNumber, !done)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: done }}
                        accessibilityLabel={t(done ? "hifz.unmark" : "hifz.markMemorized", { ayah: item.ayahNumber })}
                        hitSlop={8}
                        style={[styles.check, { backgroundColor: done ? colors.mushaf : "transparent", borderColor: done ? colors.mushaf : colors.line }]}
                    >
                        {done ? <Ionicons name="checkmark" size={18} color={colors.onMushaf} /> : null}
                    </Pressable>
                </View>
                {veiled ? (
                    <View style={[styles.veil, { backgroundColor: colors.surface2, borderRadius: radius.md }]}>
                        <Ionicons name="eye-off-outline" size={20} color={colors.ink2} />
                        <AppText variant="caption" muted>
                            {t("hifz.hidden")}
                        </AppText>
                    </View>
                ) : (
                    <AppText variant="arabic" size={Math.min(32, 28)}>
                        {item.textArabic}
                    </AppText>
                )}
            </Pressable>
        );
    };

    const header = (
        <View style={{ gap: spacing.lg, padding: spacing.lg }}>
            <View style={[styles.hero, { backgroundColor: colors.heroBackground, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm }]}>
                <AppText variant="title" color={colors.heroInk}>
                    {surah.nameLatin}
                </AppText>
                <AppText variant="caption" color={colors.heroAccent}>
                    {t("hifz.progressOf", { done: memorized, total })}
                </AppText>
                <View style={[styles.track, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
                    <View style={[styles.fill, { backgroundColor: colors.heroAccent, width: `${total ? Math.round((memorized / total) * 100) : 0}%` }]} />
                </View>
            </View>

            <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md }]}>
                <AppText variant="label" muted>
                    {t("hifz.range")}
                </AppText>
                {stepper(t("hifz.from"), rangeFrom, (next) => { setFrom(next); if (next > rangeTo) setTo(next); }, 1, upper)}
                {stepper(t("hifz.to"), rangeTo, setTo, rangeFrom, upper)}

                <AppText variant="label" muted>
                    {t("hifz.repeat")}
                </AppText>
                <Chips label={t("hifz.repeat")} value={hifz.repeatEach} onChange={hifz.setRepeatEach} options={HIFZ_REPEAT_OPTIONS.map((times) => ({ id: times, label: `${times}×` }))} />

                <AppText variant="label" muted>
                    {t("hifz.pause")}
                </AppText>
                <Chips label={t("hifz.pause")} value={hifz.pauseSeconds} onChange={hifz.setPauseSeconds} options={HIFZ_PAUSE_OPTIONS.map((seconds) => ({ id: seconds, label: t("hifz.secondsShort", { count: seconds }) }))} />

                <AppText variant="label" muted>
                    {t("hifz.reciter")}
                </AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                    {PRACTICE_RECITER_IDS.map((id) => {
                        const reciter = getReciter(id);
                        const selected = id === hifz.reciterId;
                        return (
                            <Pressable
                                key={id}
                                onPress={() => hifz.setReciterId(id)}
                                accessibilityRole="button"
                                accessibilityState={{ selected }}
                                accessibilityLabel={`${reciter.name} ${reciter.styles.join(", ")}`}
                                style={styles.reciterChoice}
                            >
                                <ReciterTile reciter={reciter} selected={selected} size={52} />
                                <AppText variant="caption" muted numberOfLines={1} style={styles.reciterStyle}>
                                    {reciter.styles[0]}
                                </AppText>
                            </Pressable>
                        );
                    })}
                </ScrollView>
                {hifz.reciterId === "husary-muallim" ? (
                    <AppText variant="caption" muted>
                        {t("hifz.reciterNote")}
                    </AppText>
                ) : null}

                <View style={styles.stepperRow}>
                    <AppText variant="bodyStrong" style={styles.flex}>
                        {t("hifz.hide")}
                    </AppText>
                    <Switch value={hifz.hideText} onValueChange={(value) => { hifz.setHideText(value); setRevealed(new Set()); }} trackColor={{ true: colors.mushaf }} accessibilityLabel={t("hifz.hide")} />
                </View>
                {hifz.hideText ? (
                    <AppText variant="caption" muted>
                        {t("hifz.revealHint")}
                    </AppText>
                ) : null}

                <Button mode="contained" icon={isPlaying ? "stop" : "play"} onPress={() => (isPlaying ? stop() : startPractice(rangeFrom, rangeTo))}>
                    {isPlaying ? t("hifz.stop") : t("hifz.play")}
                </Button>
            </View>
        </View>
    );

    return (
        <View style={[styles.screen, { backgroundColor: colors.paper }]}>
            <Stack.Screen options={{ title: t("hifz.title") }} />
            <FlatList
                data={ayahs}
                keyExtractor={(item) => bookmarkKey(item.surahNumber, item.ayahNumber)}
                ListHeaderComponent={header}
                renderItem={renderAyah}
                extraData={{ memorized: hifz.memorized, hide: hifz.hideText, revealed, playingAyah, rangeFrom, rangeTo }}
                contentContainerStyle={{ paddingBottom: spacing.xxl, gap: spacing.sm, paddingHorizontal: spacing.lg }}
            />
            <MiniPlayer safeBottom />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    flex: { flex: 1 },
    center: { textAlign: "center" },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
    hero: { overflow: "hidden" },
    track: { height: 8, borderRadius: 4, overflow: "hidden" },
    fill: { height: "100%", borderRadius: 4 },
    panel: { borderWidth: StyleSheet.hairlineWidth },
    stepperRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    stepValue: { minWidth: 30, textAlign: "center", fontVariant: ["tabular-nums"] },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 8 },
    reciterChoice: { alignItems: "center", gap: 4, width: 64 },
    reciterStyle: { fontSize: 11 },
    ayah: { borderWidth: 1.5 },
    ayahHead: { flexDirection: "row", alignItems: "center", gap: 8 },
    check: { width: 30, height: 30, borderRadius: 8, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
    veil: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 22 },
});
