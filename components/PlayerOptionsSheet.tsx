import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Switch, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { ReciterTile } from "@/components/ui/ReciterTile";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Sheet } from "@/components/ui/Sheet";
import { useTheme } from "@/components/useTheme";
import { getReciter } from "@/constants/reciters";
import { useAudioPlayerStore } from "@/store/audioPlayer";
import { PLAYBACK_RATES, useSettingsStore } from "@/store/settings";

const REPEAT_OPTIONS = [1, 2, 3, 5] as const;
const SLEEP_OPTIONS = [null, 10, 20, 30, 60] as const;

interface PlayerOptionsSheetProps {
    visible: boolean;
    onDismiss: () => void;
}

/** Speed, repeat, loop, sleep timer and reciter for whatever is playing. */
export function PlayerOptionsSheet({ visible, onDismiss }: PlayerOptionsSheetProps) {
    const { t } = useTranslation();
    const router = useRouter();
    const { colors, spacing, radius } = useTheme();
    const { playbackRate, setPlaybackRate, reciterId } = useSettingsStore();
    const { repeatEach, setRepeatEach, loopQueue, setLoopQueue, sleepAt, sleepChoice, setSleepTimer } = useAudioPlayerStore();
    const reciter = getReciter(reciterId);

    return (
        <Sheet visible={visible} onDismiss={onDismiss} title={t("player.options")}>
            <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg }}>
                <Pressable
                    onPress={() => {
                        onDismiss();
                        router.push("/reciters");
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`${t("player.changeReciter")}: ${reciter.name}`}
                    style={[styles.reciterRow, { backgroundColor: colors.surface2, borderRadius: radius.md }]}
                >
                    <ReciterTile reciter={reciter} size={44} accent />
                    <View style={styles.flex}>
                        <AppText variant="label" muted>
                            {t("player.reciter")}
                        </AppText>
                        <AppText variant="bodyStrong" numberOfLines={1}>
                            {reciter.name}
                        </AppText>
                    </View>
                    <AppText color={colors.mushaf} variant="bodyStrong">
                        {t("player.changeReciter")}
                    </AppText>
                </Pressable>

                <View style={{ gap: spacing.sm }}>
                    <AppText variant="label" muted>
                        {t("player.speed")}
                    </AppText>
                    <SegmentedControl<string>
                        value={String(playbackRate)}
                        onChange={(value) => setPlaybackRate(Number(value))}
                        options={PLAYBACK_RATES.map((rate) => ({ value: String(rate), label: `${rate}×` }))}
                    />
                </View>

                <View style={{ gap: spacing.sm }}>
                    <AppText variant="label" muted>
                        {t("player.repeat")}
                    </AppText>
                    <SegmentedControl<string>
                        value={String(repeatEach)}
                        onChange={(value) => setRepeatEach(Number(value))}
                        options={REPEAT_OPTIONS.map((times) => ({ value: String(times), label: t("player.repeatTimes", { count: times }) }))}
                    />
                </View>

                <View style={styles.row}>
                    <AppText variant="bodyStrong" style={styles.flex}>
                        {t("player.loop")}
                    </AppText>
                    <Switch value={loopQueue} onValueChange={setLoopQueue} trackColor={{ true: colors.mushaf }} accessibilityLabel={t("player.loop")} />
                </View>

                <View style={{ gap: spacing.sm }}>
                    <AppText variant="label" muted>
                        {t("player.sleep")}
                    </AppText>
                    <SegmentedControl<string>
                        value={String(sleepChoice)}
                        onChange={(value) => setSleepTimer(value === "null" ? null : Number(value))}
                        options={SLEEP_OPTIONS.map((minutes) => ({
                            value: String(minutes),
                            label: minutes === null ? t("player.sleepOff") : t("player.sleepMinutes", { count: minutes }),
                        }))}
                    />
                    {sleepAt !== null ? (
                        <AppText variant="caption" muted>
                            {t("player.sleepEnds", { time: new Date(sleepAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })}
                        </AppText>
                    ) : null}
                </View>
            </View>
        </Sheet>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    row: { flexDirection: "row", alignItems: "center", gap: 12 },
    reciterRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
});
