import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { IconButton } from "@/components/ui/IconButton";
import { StarNumber } from "@/components/ui/StarNumber";
import { useTheme } from "@/components/useTheme";
import type { Ayah } from "@/services/types";

interface AyahCardProps {
    ayah: Ayah;
    arabicSize: number;
    showTranslation: boolean;
    isPlaying: boolean;
    isBookmarked: boolean;
    onPlay: () => void;
    onBookmarkPress: () => void;
    onTafsirPress: () => void;
    onSharePress: () => void;
}

const AyahCard = React.memo(function AyahCard({
    ayah,
    arabicSize,
    showTranslation,
    isPlaying,
    isBookmarked,
    onPlay,
    onBookmarkPress,
    onTafsirPress,
    onSharePress,
}: AyahCardProps) {
    const { t } = useTranslation();
    const { colors, spacing, radius } = useTheme();
    const n = ayah.ayahNumber;

    return (
        <View
            style={[
                styles.card,
                {
                    padding: spacing.lg,
                    gap: spacing.md,
                    borderRadius: radius.lg,
                    backgroundColor: isPlaying ? colors.mushafSoft : "transparent",
                    borderBottomColor: colors.line,
                },
            ]}
        >
            <View style={styles.toolbar}>
                <StarNumber value={n} size={34} active={isPlaying} />
                <View style={styles.actions}>
                    <IconButton icon={isPlaying ? "stop" : "play"} primary={isPlaying} size={34} onPress={onPlay} accessibilityLabel={t(isPlaying ? "reader.stop" : "reader.play", { ayah: n })} />
                    <IconButton
                        icon={isBookmarked ? "bookmark" : "bookmark-outline"}
                        color={isBookmarked ? colors.brass : undefined}
                        size={34}
                        onPress={onBookmarkPress}
                        accessibilityLabel={t(isBookmarked ? "reader.removeBookmark" : "reader.bookmark", { ayah: n })}
                    />
                    <IconButton icon="book-outline" size={34} onPress={onTafsirPress} accessibilityLabel={t("reader.tafsir", { ayah: n })} />
                    <IconButton icon="share-outline" size={34} onPress={onSharePress} accessibilityLabel={t("reader.share", { ayah: n })} />
                </View>
            </View>
            <AppText variant="arabic" size={arabicSize}>
                {ayah.textArabic}
            </AppText>
            {showTranslation ? <AppText style={styles.translation}>{ayah.translation}</AppText> : null}
        </View>
    );
});

export default AyahCard;

const styles = StyleSheet.create({
    card: { borderBottomWidth: StyleSheet.hairlineWidth },
    toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    actions: { flexDirection: "row", gap: 8 },
    translation: { fontSize: 15, lineHeight: 23 },
});
