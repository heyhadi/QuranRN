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
import { useActiveReciterId, useAudioPlayerStore, useCurrentTrack, useIsLoading } from "@/store/audioPlayer";

/**
 * The bar above the tabs while anything is playing. It stays on every screen, so recitation
 * carries on while you browse, and tapping it opens the ayah that is playing.
 */
export function MiniPlayer({ safeBottom = false }: { /** Pad for the home indicator; leave off above the tab bar, which does it. */ safeBottom?: boolean }) {
    const { t } = useTranslation();
    const router = useRouter();
    const { colors, radius, spacing, scheme } = useTheme();
    // Light mode: a dark bar. Dark mode: a raised dark card, so it does not glare against the screen.
    const barBackground = scheme === "dark" ? colors.surface2 : colors.ink;
    const barForeground = scheme === "dark" ? colors.ink : colors.paper;
    const track = useCurrentTrack();
    const status = useAudioPlayerStore((state) => state.status);
    const loading = useIsLoading();
    const togglePause = useAudioPlayerStore((state) => state.togglePause);
    const next = useAudioPlayerStore((state) => state.next);
    const previous = useAudioPlayerStore((state) => state.previous);
    const stop = useAudioPlayerStore((state) => state.stop);
    const hasNext = useAudioPlayerStore((state) => state.currentIndex !== null && state.currentIndex + 1 < state.queue.length);
    const reciter = getReciter(useActiveReciterId());
    const insets = useSafeAreaInsets();
    const [optionsOpen, setOptionsOpen] = useState(false);

    if (!track || status === "stopped") return null;

    return (
        <>
            <View style={[styles.wrap, { paddingHorizontal: spacing.sm, paddingTop: spacing.sm, paddingBottom: safeBottom ? Math.max(insets.bottom, spacing.sm) : spacing.sm, backgroundColor: safeBottom ? colors.paper : "transparent" }]}>
                <View style={[styles.bar, { backgroundColor: barBackground, borderRadius: radius.lg }, scheme === "dark" && { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line }]}>
                    <Pressable
                        style={styles.info}
                        onPress={() => router.push({ pathname: "/surah/[id]", params: { id: track.surahNumber, ayah: track.ayahNumber } })}
                        accessibilityRole="button"
                        accessibilityLabel={t("player.openSurah", { surah: track.surahName, ayah: track.ayahNumber })}
                    >
                        <ReciterTile reciter={reciter} size={40} accent />
                        <View style={styles.text}>
                            <AppText variant="bodyStrong" color={barForeground} numberOfLines={1}>
                                {`${track.surahName} · ${track.ayahNumber}`}
                            </AppText>
                            <AppText variant="caption" color={barForeground} style={styles.dim} numberOfLines={1}>
                                {loading ? t("player.loading") : reciter.name}
                            </AppText>
                        </View>
                    </Pressable>
                    <View style={styles.controls}>
                        <IconButton icon="play-skip-back" plain size={34} color={barForeground} onPress={previous} accessibilityLabel={t("player.previous")} />
                        <IconButton
                            icon={status === "playing" ? "pause" : "play"}
                            loading={loading}
                            size={40}
                            primary
                            onPress={togglePause}
                            accessibilityLabel={t(status === "playing" ? "player.pause" : "player.play")}
                        />
                        <IconButton icon="play-skip-forward" plain size={34} color={barForeground} disabled={!hasNext} onPress={next} accessibilityLabel={t("player.next")} />
                        <IconButton icon="options" plain size={34} color={barForeground} onPress={() => setOptionsOpen(true)} accessibilityLabel={t("player.options")} />
                        <IconButton icon="close" plain size={34} color={barForeground} onPress={stop} accessibilityLabel={t("player.close")} />
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
