import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PlayerOptionsSheet } from "@/components/PlayerOptionsSheet";
import { AppText } from "@/components/ui/AppText";
import { IconButton } from "@/components/ui/IconButton";
import { ReciterTile } from "@/components/ui/ReciterTile";
import { useTheme } from "@/components/useTheme";
import { getReciter } from "@/constants/reciters";
import { useAudioPlayerStore, useCurrentTrack } from "@/store/audioPlayer";
import { useSettingsStore } from "@/store/settings";

/**
 * The bar above the tabs while anything is playing. It stays on every screen, so recitation
 * carries on while you browse, and tapping it opens the ayah that is playing.
 */
export function MiniPlayer({ safeBottom = false }: { /** Pad for the home indicator; leave off above the tab bar, which does it. */ safeBottom?: boolean }) {
    const { t } = useTranslation();
    const router = useRouter();
    const { colors, radius, spacing } = useTheme();
    const track = useCurrentTrack();
    const status = useAudioPlayerStore((state) => state.status);
    const togglePause = useAudioPlayerStore((state) => state.togglePause);
    const next = useAudioPlayerStore((state) => state.next);
    const previous = useAudioPlayerStore((state) => state.previous);
    const stop = useAudioPlayerStore((state) => state.stop);
    const hasNext = useAudioPlayerStore((state) => state.currentIndex !== null && state.currentIndex + 1 < state.queue.length);
    const reciter = getReciter(useSettingsStore((state) => state.reciterId));
    const insets = useSafeAreaInsets();
    const [optionsOpen, setOptionsOpen] = useState(false);

    if (!track || status === "stopped") return null;

    return (
        <>
            <View style={[styles.wrap, { paddingHorizontal: spacing.sm, paddingTop: spacing.sm, paddingBottom: safeBottom ? Math.max(insets.bottom, spacing.sm) : spacing.sm, backgroundColor: safeBottom ? colors.paper : "transparent" }]}>
                <View style={[styles.bar, { backgroundColor: colors.ink, borderRadius: radius.lg }]}>
                    <Pressable
                        style={styles.info}
                        onPress={() => router.push({ pathname: "/surah/[id]", params: { id: track.surahNumber, ayah: track.ayahNumber } })}
                        accessibilityRole="button"
                        accessibilityLabel={t("player.openSurah", { surah: track.surahName, ayah: track.ayahNumber })}
                    >
                        <ReciterTile reciter={reciter} size={40} accent />
                        <View style={styles.text}>
                            <AppText variant="bodyStrong" color={colors.paper} numberOfLines={1}>
                                {`${track.surahName} · ${track.ayahNumber}`}
                            </AppText>
                            <AppText variant="caption" color={colors.paper} style={styles.dim} numberOfLines={1}>
                                {reciter.name}
                            </AppText>
                        </View>
                    </Pressable>
                    <View style={styles.controls}>
                        <IconButton icon="play-skip-back" plain size={34} color={colors.paper} onPress={previous} accessibilityLabel={t("player.previous")} />
                        <IconButton
                            icon={status === "playing" ? "pause" : "play"}
                            size={40}
                            primary
                            onPress={togglePause}
                            accessibilityLabel={t(status === "playing" ? "player.pause" : "player.play")}
                        />
                        <IconButton icon="play-skip-forward" plain size={34} color={colors.paper} disabled={!hasNext} onPress={next} accessibilityLabel={t("player.next")} />
                        <IconButton icon="options" plain size={34} color={colors.paper} onPress={() => setOptionsOpen(true)} accessibilityLabel={t("player.options")} />
                        <IconButton icon="close" plain size={34} color={colors.paper} onPress={stop} accessibilityLabel={t("player.close")} />
                    </View>
                </View>
            </View>
            <PlayerOptionsSheet visible={optionsOpen} onDismiss={() => setOptionsOpen(false)} />
        </>
    );
}

const styles = StyleSheet.create({
    wrap: {},
    bar: { padding: 8, gap: 4 },
    info: { flexDirection: "row", alignItems: "center", gap: 10 },
    text: { flex: 1, minWidth: 0 },
    dim: { opacity: 0.7 },
    controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
