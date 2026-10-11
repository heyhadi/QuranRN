import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "@/components/ui/AppText";
import { useQiblaDirection } from "@/components/useQiblaDirection";
import { useTheme } from "@/components/useTheme";
import { arrowRotation, compassPoint } from "@/services/qibla";

export default function Qibla() {
    const { t } = useTranslation();
    const { colors, spacing } = useTheme();
    const qibla = useQiblaDirection();

    let body: React.ReactNode;
    if (qibla.status === "loading") {
        body = (
            <>
                <ActivityIndicator size="large" color={colors.mushaf} />
                <AppText muted>{t("qibla.finding")}</AppText>
            </>
        );
    } else if (qibla.status === "permission-denied") {
        body = (
            <>
                <AppText style={styles.center}>{t("qibla.permission")}</AppText>
                <Button mode="contained" onPress={() => Linking.openSettings()}>
                    {t("qibla.openSettings")}
                </Button>
            </>
        );
    } else if (qibla.status === "error") {
        body = <AppText style={styles.center}>{t("qibla.locationError")}</AppText>;
    } else {
        const { bearing, heading } = qibla;
        const rotation = heading === null ? 0 : arrowRotation(bearing, heading);
        const isFacingQibla = heading !== null && (rotation < 5 || rotation > 355);
        body = (
            <>
                <View style={[styles.dial, { borderColor: isFacingQibla ? colors.mushaf : colors.line, backgroundColor: colors.surface }]}>
                    <AppText variant="label" muted style={styles.north}>
                        N
                    </AppText>
                    <View style={{ transform: [{ rotate: `${rotation}deg` }] }}>
                        {/* The "navigate" icon points up and to the right; turn it so 0° points straight up. */}
                        <Ionicons name="navigate" size={96} color={isFacingQibla ? colors.mushaf : colors.brass} style={styles.arrow} />
                    </View>
                </View>
                <AppText variant="display">{`${Math.round(bearing)}° ${compassPoint(bearing)}`}</AppText>
                <AppText muted style={styles.center}>
                    {heading === null ? t("qibla.waiting") : isFacingQibla ? t("qibla.facing") : t("qibla.turn")}
                </AppText>
            </>
        );
    }

    return (
        <SafeAreaView edges={["top"]} style={[styles.screen, { backgroundColor: colors.paper }]}>
            <AppText variant="display" style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }} accessibilityRole="header">
                {t("qibla.title")}
            </AppText>
            <View style={[styles.body, { padding: spacing.xl, gap: spacing.lg }]}>{body}</View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    body: { flex: 1, alignItems: "center", justifyContent: "center" },
    center: { textAlign: "center" },
    dial: { width: 240, height: 240, borderRadius: 120, borderWidth: 3, alignItems: "center", justifyContent: "center" },
    north: { position: "absolute", top: 12 },
    arrow: { transform: [{ rotate: "-45deg" }] },
});
