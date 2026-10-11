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
    const watermark = { position: "absolute" as const, width: 150, height: 150, borderWidth: 10, borderColor: heroAccent, opacity: 0.08, borderRadius: 20 };

    return (
        <View style={[styles.card, { backgroundColor: heroBackground }]}>
            {/* Large faint star in the corner, and a soft darker disc for depth. */}
            <View style={[styles.disc, { backgroundColor: "#000000" }]} />
            <View style={[watermark, styles.watermarkOne]} />
            <View style={[watermark, styles.watermarkOne, { transform: [{ rotate: "45deg" }] }]} />
            <View style={[styles.frame, { borderColor: heroAccent }]} />

            <View style={styles.content}>
                <StarNumber value={number} size={38} accent={heroAccent} ink={heroInk} />
                <Text style={[styles.arabic, { fontFamily: fonts.quranBold, color: heroInk }]} accessibilityLabel={nameLatin}>
                    {nameArabic}
                </Text>
                <AppText color={heroInk} style={styles.center}>
                    <AppText variant="heading" color={heroAccent}>
                        {nameLatin}
                    </AppText>
                    {`  ·  ${meaning}`}
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
    card: { borderRadius: 20, overflow: "hidden", paddingVertical: 18, paddingHorizontal: 16 },
    disc: { position: "absolute", width: 200, height: 200, borderRadius: 100, bottom: -120, left: -60, opacity: 0.18 },
    watermarkOne: { right: -55, top: -55 },
    frame: { position: "absolute", top: 6, left: 6, right: 6, bottom: 6, borderWidth: StyleSheet.hairlineWidth * 2, borderRadius: 15, opacity: 0.5 },
    content: { alignItems: "center", gap: 4 },
    arabic: { fontSize: 36, lineHeight: 62, textAlign: "center", writingDirection: "rtl" },
    center: { textAlign: "center" },
    chips: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 10 },
    chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
    chipText: { fontWeight: "600" },
});
