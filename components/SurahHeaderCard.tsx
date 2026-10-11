import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { StarNumber } from "@/components/ui/StarNumber";
import { useTheme } from "@/components/useTheme";

interface SurahHeaderCardProps {
    number: number;
    nameArabic: string;
    nameLatin: string;
    meaning: string;
    /** e.g. "Makkiyah", "4 ayat", "Juz 30", shown as chips. */
    details: string[];
}

/**
 * The title plate at the top of a Surah, like the ornamental heading of a printed mushaf: a deep
 * green card with a brass inner frame, a faint star watermark and the name in large calligraphy.
 */
export function SurahHeaderCard({ number, nameArabic, nameLatin, meaning, details }: SurahHeaderCardProps) {
    const { colors, fonts } = useTheme();
    const { heroBackground, heroInk, heroAccent } = colors;
    const watermark = { position: "absolute" as const, width: 200, height: 200, borderWidth: 14, borderColor: heroAccent, opacity: 0.1, borderRadius: 26 };

    return (
        <View style={[styles.card, { backgroundColor: heroBackground }]}>
            {/* Large faint star in the corner, and a soft darker disc for depth. */}
            <View style={[styles.disc, { backgroundColor: "#000000" }]} />
            <View style={[watermark, styles.watermarkOne]} />
            <View style={[watermark, styles.watermarkOne, { transform: [{ rotate: "45deg" }] }]} />
            <View style={[styles.frame, { borderColor: heroAccent }]} />

            <View style={styles.content}>
                <StarNumber value={number} size={48} accent={heroAccent} ink={heroInk} />
                <Text style={[styles.arabic, { fontFamily: fonts.quranBold, color: heroInk }]} accessibilityLabel={nameLatin}>
                    {nameArabic}
                </Text>
                <AppText variant="title" color={heroAccent} style={styles.center}>
                    {nameLatin}
                </AppText>
                <AppText color={heroInk} style={[styles.center, styles.meaning]}>
                    {meaning}
                </AppText>
                <View style={styles.chips}>
                    {details.map((detail) => (
                        <View key={detail} style={[styles.chip, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
                            <AppText variant="caption" color={heroInk} style={styles.chipText}>
                                {detail}
                            </AppText>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { borderRadius: 24, overflow: "hidden", paddingVertical: 28, paddingHorizontal: 20 },
    disc: { position: "absolute", width: 260, height: 260, borderRadius: 130, bottom: -150, left: -70, opacity: 0.18 },
    watermarkOne: { right: -70, top: -70 },
    frame: { position: "absolute", top: 8, left: 8, right: 8, bottom: 8, borderWidth: StyleSheet.hairlineWidth * 2, borderRadius: 17, opacity: 0.55 },
    content: { alignItems: "center", gap: 4 },
    arabic: { fontSize: 46, lineHeight: 84, textAlign: "center", writingDirection: "rtl", marginTop: 4 },
    center: { textAlign: "center" },
    meaning: { opacity: 0.85, textAlign: "center" },
    chips: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 14 },
    chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
    chipText: { fontWeight: "600" },
});
