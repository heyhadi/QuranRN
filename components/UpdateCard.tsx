import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/components/useTheme";
import { spacing, radius, fonts } from "@/constants/theme";
import {
    addDownloadProgressListener,
    checkForUpdate,
    installUpdate,
    type AvailableUpdate,
} from "@/services/update";

type InstallState = "idle" | "downloading" | "needs-permission" | "failed";

/**
 * "Update available" card for the home screen. Checks the repo's latest
 * GitHub release once per mount; renders nothing when up to date, offline,
 * or on a local build.
 */
export function UpdateCard() {
    const { colors } = useTheme();
    const [update, setUpdate] = useState<AvailableUpdate | null>(null);
    const [state, setState] = useState<InstallState>("idle");
    const [progress, setProgress] = useState(0); // 0..1 while downloading

    useEffect(() => {
        let cancelled = false;
        checkForUpdate()
            .then((u) => {
                if (!cancelled) setUpdate(u);
            })
            .catch(() => undefined); // offline or rate-limited: try next time
        return () => {
            cancelled = true;
        };
    }, []);

    if (!update) return null;

    const handleInstall = async () => {
        setState("downloading");
        setProgress(0);
        const unsub = addDownloadProgressListener((p) => {
            if (p.total > 0) setProgress(Math.min(1, p.downloaded / p.total));
        });
        try {
            await installUpdate(update);
            setState("idle"); // Android's installer is open now
        } catch (e) {
            const code = (e as { code?: string }).code;
            setState(code === "NEEDS_INSTALL_PERMISSION" ? "needs-permission" : "failed");
        } finally {
            unsub();
        }
    };

    const detail =
        state === "downloading"
            ? `Lagi download… ${Math.round(progress * 100)}%`
            : state === "needs-permission"
              ? "Izinkan Wird pasang aplikasi di pengaturan yang kebuka, terus ketuk Update lagi."
              : state === "failed"
                ? "Gagal pasang update. Cek internet kamu terus coba lagi."
                : `${update.title} siap dipasang.`;

    return (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={styles.row}>
                <View style={[styles.icon, { backgroundColor: colors.mushafSoft }]}>
                    <Text style={styles.iconText}>⬆️</Text>
                </View>
                <View style={styles.main}>
                    <Text style={[styles.title, { color: colors.ink, fontFamily: fonts.bodyMedium }]}>
                        Ada versi baru
                    </Text>
                    <Text style={[styles.detail, { color: colors.ink2 }]}>{detail}</Text>
                </View>
                <Pressable
                    accessibilityRole="button"
                    disabled={state === "downloading"}
                    onPress={handleInstall}
                    style={({ pressed }) => [
                        styles.button,
                        { borderColor: colors.mushaf },
                        pressed && { opacity: 0.7 },
                        state === "downloading" && { opacity: 0.45 },
                    ]}
                >
                    <Text style={[styles.buttonText, { color: colors.mushaf, fontFamily: fonts.bodyMedium }]}>
                        Update
                    </Text>
                </Pressable>
            </View>
            {state === "downloading" && (
                <View
                    style={[styles.track, { backgroundColor: colors.surface2 }]}
                    accessibilityRole="progressbar"
                    accessibilityValue={{ now: Math.round(progress * 100), min: 0, max: 100 }}
                >
                    <View
                        style={[
                            styles.fill,
                            { width: `${Math.round(progress * 100)}%`, backgroundColor: colors.mushaf },
                        ]}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
    },
    icon: {
        width: 40,
        height: 40,
        borderRadius: radius.md,
        alignItems: "center",
        justifyContent: "center",
    },
    iconText: { fontSize: 20 },
    main: { flex: 1 },
    title: { fontSize: 15 },
    detail: { fontSize: 13, marginTop: 2 },
    button: {
        borderWidth: 1.5,
        borderRadius: radius.pill,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    buttonText: { fontSize: 14 },
    track: {
        height: 6,
        borderRadius: 3,
        marginTop: spacing.sm,
        overflow: "hidden",
    },
    fill: {
        height: 6,
        borderRadius: 3,
    },
});
