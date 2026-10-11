import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/components/useTheme";
import { getReciter } from "@/constants/reciters";
import { downloadKey, useDownloadsStore } from "@/store/downloads";
import { useSettingsStore } from "@/store/settings";

interface DownloadAudioRowProps {
    surahNumber: number;
    ayahCount: number;
}

/** Download a Surah's recitation (for the chosen reciter) to listen without internet. */
export function DownloadAudioRow({ surahNumber, ayahCount }: DownloadAudioRowProps) {
    const { t } = useTranslation();
    const { colors, radius } = useTheme();
    const reciterId = useSettingsStore((state) => state.reciterId);
    const key = downloadKey(reciterId, surahNumber);
    const isDownloaded = useDownloadsStore((state) => state.completed[key] === true);
    const active = useDownloadsStore((state) => state.active[key]);
    const { download, cancel, remove } = useDownloadsStore.getState();
    const reciter = getReciter(reciterId);

    const running = active && !active.failed;
    const action = running
        ? { label: t("reader.cancelDownload"), onPress: () => cancel(reciterId, surahNumber), icon: "close-circle-outline" as const }
        : isDownloaded
          ? { label: t("reader.removeDownload"), onPress: () => remove(reciterId, surahNumber), icon: "trash-outline" as const }
          : { label: t("reader.download"), onPress: () => void download(reciterId, surahNumber, ayahCount), icon: "cloud-download-outline" as const };

    return (
        <View style={[styles.wrap, { backgroundColor: colors.surface2, borderRadius: radius.md }]}>
            <View style={styles.top}>
                <Ionicons name={isDownloaded ? "checkmark-circle" : "cloud-download-outline"} size={24} color={isDownloaded ? colors.mushaf : colors.ink2} />
                <View style={styles.text}>
                    <AppText variant="bodyStrong">{isDownloaded ? t("reader.downloaded") : t("reader.download")}</AppText>
                    <AppText variant="caption" muted>
                        {running ? t("reader.downloading", { done: active.done, total: active.total, percent: Math.round((active.done / active.total) * 100) }) : t("reader.downloadWith", { name: reciter.name })}
                    </AppText>
                </View>
                <Pressable onPress={action.onPress} accessibilityRole="button" accessibilityLabel={action.label} hitSlop={8} style={styles.button}>
                    <Ionicons name={action.icon} size={24} color={isDownloaded ? colors.danger : colors.mushaf} />
                </Pressable>
            </View>
            {running ? (
                <View style={[styles.track, { backgroundColor: colors.line }]}>
                    <View style={[styles.fill, { backgroundColor: colors.mushaf, width: `${Math.round((active.done / active.total) * 100)}%` }]} />
                </View>
            ) : null}
            {active?.failed ? (
                <AppText variant="caption" color={colors.danger}>
                    {t("reader.downloadFailed")}
                </AppText>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { padding: 12, gap: 10 },
    top: { flexDirection: "row", alignItems: "center", gap: 12 },
    text: { flex: 1, minWidth: 0 },
    button: { padding: 4 },
    track: { height: 5, borderRadius: 3, overflow: "hidden" },
    fill: { height: "100%", borderRadius: 3 },
});
