import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { TajweedText } from "@/components/TajweedText";
import { TranslationText } from "@/components/TranslationText";
import { AppText } from "@/components/ui/AppText";
import { IconButton } from "@/components/ui/IconButton";
import { StarNumber } from "@/components/ui/StarNumber";
import { useTheme } from "@/components/useTheme";
import type { TajweedRuleId } from "@/constants/tajweed";
import type { TajweedSegment } from "@/services/tajweed";
import type { Ayah } from "@/services/types";

interface AyahCardProps {
    ayah: Ayah;
    arabicSize: number;
    /** Tajweed-coloured text; when missing (switched off, or still loading) the plain text is shown. */
    tajweed?: TajweedSegment[];
    showTranslation: boolean;
    /** An English translation as HTML; when missing the Indonesian one from equran.id is shown. */
    translationHtml?: string;
    showTransliteration: boolean;
    isPlaying: boolean;
    isBookmarked: boolean;
    hasNote: boolean;
    onPlay: () => void;
    onBookmarkPress: () => void;
    onWordsPress: () => void;
    onTafsirPress: () => void;
    onNotePress: () => void;
    onSharePress: () => void;
    onRulePress: (rule: TajweedRuleId) => void;
    onFootnotePress: (footnoteId: number) => void;
}

const AyahCard = React.memo(function AyahCard({
    ayah,
    arabicSize,
    tajweed,
    showTranslation,
    translationHtml,
    showTransliteration,
    isPlaying,
    isBookmarked,
    hasNote,
    onPlay,
    onBookmarkPress,
    onWordsPress,
    onTafsirPress,
    onNotePress,
    onSharePress,
    onRulePress,
    onFootnotePress,
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
                    <IconButton icon={isPlaying ? "stop" : "play"} primary={isPlaying} size={32} onPress={onPlay} accessibilityLabel={t(isPlaying ? "reader.stop" : "reader.play", { ayah: n })} />
                    <IconButton
                        icon={isBookmarked ? "bookmark" : "bookmark-outline"}
                        color={isBookmarked ? colors.brass : undefined}
                        size={32}
                        onPress={onBookmarkPress}
                        accessibilityLabel={t(isBookmarked ? "reader.removeBookmark" : "reader.bookmark", { ayah: n })}
                    />
                    <IconButton icon="language-outline" size={32} onPress={onWordsPress} accessibilityLabel={t("ayahSheet.words")} />
                    <IconButton icon="book-outline" size={32} onPress={onTafsirPress} accessibilityLabel={t("reader.tafsir", { ayah: n })} />
                    <IconButton
                        icon={hasNote ? "create" : "create-outline"}
                        color={hasNote ? colors.brass : undefined}
                        size={32}
                        onPress={onNotePress}
                        accessibilityLabel={t("ayahSheet.notes")}
                    />
                    <IconButton icon="share-outline" size={32} onPress={onSharePress} accessibilityLabel={t("reader.share", { ayah: n })} />
                </View>
            </View>
            {tajweed ? (
                <TajweedText segments={tajweed} size={arabicSize} onRulePress={onRulePress} />
            ) : (
                <AppText variant="arabic" size={arabicSize}>
                    {ayah.textArabic}
                </AppText>
            )}
            {showTransliteration ? (
                <AppText variant="caption" muted style={styles.transliteration}>
                    {ayah.transliteration}
                </AppText>
            ) : null}
            {showTranslation ? (
                translationHtml ? (
                    <TranslationText html={translationHtml} onFootnotePress={onFootnotePress} />
                ) : (
                    <AppText style={styles.translation}>{ayah.translation}</AppText>
                )
            ) : null}
        </View>
    );
});

export default AyahCard;

const styles = StyleSheet.create({
    card: { borderBottomWidth: StyleSheet.hairlineWidth },
    toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    actions: { flexDirection: "row", gap: 6 },
    transliteration: { fontStyle: "italic", lineHeight: 20 },
    translation: { fontSize: 15, lineHeight: 24 },
});
