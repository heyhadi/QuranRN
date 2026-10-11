import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { StarNumber } from "@/components/ui/StarNumber";
import { useTheme } from "@/components/useTheme";

interface ListRowProps {
    number: number;
    title: string;
    subtitle: string;
    arabic: string;
    onPress: () => void;
    accessibilityLabel?: string;
}

/** One row in the Surah or Juz list: star number, Latin name with details, Arabic name. */
export const ListRow = React.memo(function ListRow({ number, title, subtitle, arabic, onPress, accessibilityLabel }: ListRowProps) {
    const { colors, fonts, spacing } = useTheme();
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? `${title}, ${subtitle}`}
            style={({ pressed }) => [
                styles.row,
                { paddingHorizontal: spacing.lg, borderBottomColor: colors.line, backgroundColor: pressed ? colors.surface2 : "transparent" },
            ]}
        >
            <StarNumber value={number} size={38} />
            <View style={styles.text}>
                <AppText variant="bodyStrong" numberOfLines={1}>
                    {title}
                </AppText>
                <AppText variant="caption" muted numberOfLines={1}>
                    {subtitle}
                </AppText>
            </View>
            <AppText style={[styles.arabic, { fontFamily: fonts.quran, color: colors.mushaf }]} numberOfLines={1}>
                {arabic}
            </AppText>
        </Pressable>
    );
});

const styles = StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
    text: { flex: 1, minWidth: 0 },
    arabic: { fontSize: 22, lineHeight: 40, writingDirection: "rtl" },
});
