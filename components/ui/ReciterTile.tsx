import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/components/useTheme";
import type { Reciter } from "@/constants/reciters";

interface ReciterTileProps {
    reciter: Reciter;
    size?: number;
    /** Solid green, for the selected reciter. */
    selected?: boolean;
    /** Brass, for the mini-player. */
    accent?: boolean;
}

/**
 * A reciter shown by the Arabic name listeners know them by, on a faint eight-point star. No photos
 * are needed, and it stays readable at small sizes.
 */
export function ReciterTile({ reciter, size = 46, selected, accent }: ReciterTileProps) {
    const { colors, fonts } = useTheme();
    const background = selected ? colors.mushaf : accent ? colors.brass : colors.surface2;
    const ink = selected ? colors.onMushaf : accent ? colors.surface : colors.mushaf;
    const star = { position: "absolute" as const, top: size * 0.15, left: size * 0.15, right: size * 0.15, bottom: size * 0.15, borderWidth: 1, borderColor: ink, opacity: 0.18, borderRadius: 3 };
    return (
        <View style={[styles.tile, { width: size, height: size, borderRadius: size * 0.26, backgroundColor: background }]} accessibilityElementsHidden importantForAccessibility="no">
            <View style={star} />
            <View style={[star, { transform: [{ rotate: "45deg" }] }]} />
            <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: fonts.displayBold, fontSize: size * 0.26, color: ink, paddingHorizontal: size * 0.08 }}>
                {reciter.arabic}
            </Text>
            {reciter.englishAudio ? (
                <View style={[styles.badge, { backgroundColor: colors.brass }]}>
                    <Text style={[styles.badgeText, { color: colors.surface }]}>EN</Text>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    tile: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
    badge: { position: "absolute", bottom: 2, left: 3, borderRadius: 3, paddingHorizontal: 3 },
    badgeText: { fontSize: 7.5, fontWeight: "700" },
});
