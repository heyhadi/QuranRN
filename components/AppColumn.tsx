import { useSegments } from "expo-router";
import React from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useTheme } from "@/components/useTheme";

/** On a wide screen the app stays a comfortable reading column, centred, instead of stretching edge to edge. */
export const COLUMN_MAX_WIDTH = 760;

/** Screens that use the whole width themselves (the mushaf lays out a page, or two, on its own). */
const FULL_WIDTH_ROUTES = new Set(["mushaf"]);

export function isColumnCapped(width: number, routes: readonly string[]): boolean {
    return width > COLUMN_MAX_WIDTH && !routes.some((route) => FULL_WIDTH_ROUTES.has(route));
}

export function AppColumn({ children }: { children: React.ReactNode }) {
    const { width } = useWindowDimensions();
    const segments = useSegments() as string[];
    const { colors } = useTheme();
    const capped = isColumnCapped(width, segments);
    return (
        <View style={[styles.outer, { backgroundColor: colors.paper }]}>
            <View style={[styles.column, capped && { maxWidth: COLUMN_MAX_WIDTH, borderLeftWidth: StyleSheet.hairlineWidth, borderRightWidth: StyleSheet.hairlineWidth, borderColor: colors.line }]}>{children}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    outer: { flex: 1, alignItems: "center" },
    column: { flex: 1, width: "100%" },
});
