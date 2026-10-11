import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/components/useTheme";

interface StarNumberProps {
    value: number;
    /** Outer size in points. */
    size?: number;
    /** Filled in brass, for the ayah that is playing. */
    active?: boolean;
    /** Override the outline colour, e.g. on a dark card. */
    accent?: string;
    /** Override the number colour. */
    ink?: string;
}

/**
 * A number inside an eight-point star (two overlapping squares), used for Surah numbers and ayah
 * markers. Drawn with views, so it stays crisp at any size and follows the theme.
 */
export function StarNumber({ value, size = 32, active, accent, ink }: StarNumberProps) {
    const { colors, fonts } = useTheme();
    const inset = size * 0.15;
    const square = {
        position: "absolute" as const,
        top: inset,
        left: inset,
        right: inset,
        bottom: inset,
        borderWidth: 1.5,
        borderColor: accent ?? colors.brass,
        borderRadius: size * 0.12,
        backgroundColor: active ? (accent ?? colors.brass) : "transparent",
    };
    const digits = String(value).length;
    return (
        <View style={[styles.wrap, { width: size, height: size }]} accessibilityElementsHidden importantForAccessibility="no">
            <View style={square} />
            <View style={[square, { transform: [{ rotate: "45deg" }] }]} />
            <Text
                style={{
                    fontFamily: fonts.bodyBold,
                    fontSize: size * (digits > 2 ? 0.28 : 0.34),
                    color: active ? colors.surface : (ink ?? colors.mushaf),
                    fontVariant: ["tabular-nums"],
                }}
            >
                {value}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { alignItems: "center", justifyContent: "center" },
});
