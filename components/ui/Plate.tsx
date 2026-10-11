import React from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/components/useTheme";

interface PlateProps {
    children: React.ReactNode;
    /** Layout and padding of the content (the plate itself has none). */
    style?: StyleProp<ViewStyle>;
    onPress?: () => void;
    accessibilityLabel?: string;
    /** Which corner holds the star watermark. */
    corner?: "right" | "left";
}

/** The two squares of an eight-point star, drawn with views. */
function Star({ size, color, opacity, style }: { size: number; color: string; opacity: number; style: ViewStyle }) {
    const square: ViewStyle = { position: "absolute", width: size, height: size, borderWidth: Math.max(2, size / 14), borderColor: color, opacity, borderRadius: size * 0.14 };
    return (
        <View pointerEvents="none" style={[{ position: "absolute", width: size, height: size }, style]}>
            <View style={square} />
            <View style={[square, { transform: [{ rotate: "45deg" }] }]} />
        </View>
    );
}

function Wrapper({ onPress, accessibilityLabel, style, children }: { onPress?: () => void; accessibilityLabel?: string; style: StyleProp<ViewStyle>; children: React.ReactNode }) {
    if (!onPress) return <View style={style}>{children}</View>;
    return (
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={({ pressed }) => [style, pressed && { opacity: 0.92 }]}>
            {children}
        </Pressable>
    );
}

/**
 * A deep green plate like the heading of a printed mushaf: brass inner frame, a faint star in the
 * corner and a soft shaded disc for depth. Used for the cards that carry a screen's main message.
 */
export function PlateCard({ children, style, onPress, accessibilityLabel, corner = "right" }: PlateProps) {
    const { colors } = useTheme();
    return (
        <Wrapper onPress={onPress} accessibilityLabel={accessibilityLabel} style={[styles.plate, { backgroundColor: colors.heroBackground }]}>
            <View pointerEvents="none" style={[styles.disc, corner === "right" ? { left: -60 } : { right: -60 }]} />
            <Star size={150} color={colors.heroAccent} opacity={0.06} style={corner === "right" ? { right: -50, top: -50 } : { left: -50, top: -50 }} />
            <View pointerEvents="none" style={[styles.frame, { borderColor: colors.heroAccent }]} />
            <View style={style}>{children}</View>
        </Wrapper>
    );
}

/**
 * The surface card with the same hand-finished feel, lighter: just a hairline brass inner frame.
 */
export function OrnateCard({ children, style, onPress, accessibilityLabel }: PlateProps) {
    const { colors, scheme } = useTheme();
    return (
        <Wrapper onPress={onPress} accessibilityLabel={accessibilityLabel} style={[styles.ornate, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View pointerEvents="none" style={[styles.innerFrame, { borderColor: colors.brass, opacity: scheme === "dark" ? 0.28 : 0.3 }]} />
            <View style={style}>{children}</View>
        </Wrapper>
    );
}

const styles = StyleSheet.create({
    plate: { borderRadius: 20, overflow: "hidden" },
    disc: { position: "absolute", width: 200, height: 200, borderRadius: 100, bottom: -130, backgroundColor: "#000000", opacity: 0.18 },
    frame: { position: "absolute", top: 6, left: 6, right: 6, bottom: 6, borderWidth: StyleSheet.hairlineWidth * 2, borderRadius: 15, opacity: 0.5 },
    ornate: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
    innerFrame: { position: "absolute", top: 4, left: 4, right: 4, bottom: 4, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12 },
});
