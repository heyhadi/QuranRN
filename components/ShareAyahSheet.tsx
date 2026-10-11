import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, Share, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { AppText } from "@/components/ui/AppText";
import { Sheet } from "@/components/ui/Sheet";
import { useTheme } from "@/components/useTheme";
import { palettes } from "@/constants/theme";

export interface ShareAyahPayload {
    arabic: string;
    meaning: string;
    /** e.g. "Al-Baqarah 2:255". */
    reference: string;
}

/** The card that becomes the image. It always uses the light brand colours, so it looks the same in any theme. */
function AyahImageCard({ payload }: { payload: ShareAyahPayload }) {
    const palette = palettes.light;
    return (
        <View collapsable={false} style={[styles.card, { backgroundColor: palette.heroBackground }]}>
            <View style={[styles.frame, { borderColor: palette.heroAccent }]}>
                <AppText variant="arabic" size={28} color={palette.heroInk} style={styles.arabic}>
                    {payload.arabic}
                </AppText>
                <View style={[styles.rule, { backgroundColor: palette.heroAccent }]} />
                <AppText color={palette.heroInk} style={styles.meaning}>
                    {payload.meaning}
                </AppText>
                <AppText variant="bodyStrong" color={palette.heroAccent} style={styles.reference}>
                    {payload.reference}
                </AppText>
                <AppText variant="caption" color={palette.heroInk} style={styles.brand}>
                    Wird
                </AppText>
            </View>
        </View>
    );
}

interface ShareAyahSheetProps {
    payload: ShareAyahPayload | null;
    onDismiss: () => void;
}

/** Preview an ayah card and share it as an image, or as plain text. */
export function ShareAyahSheet({ payload, onDismiss }: ShareAyahSheetProps) {
    const { t } = useTranslation();
    const { spacing } = useTheme();
    const cardRef = useRef<View>(null);
    const [busy, setBusy] = useState(false);

    const shareImage = async () => {
        if (!cardRef.current) return;
        setBusy(true);
        try {
            if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is not available");
            const uri = await captureRef(cardRef, { format: "png", quality: 1, result: "tmpfile" });
            await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: t("share.title") });
        } catch {
            Alert.alert(t("share.failed"));
        } finally {
            setBusy(false);
        }
    };

    const shareText = () => {
        if (!payload) return;
        void Share.share({ message: `${payload.arabic}\n\n${payload.meaning}\n\n— ${payload.reference}` });
    };

    return (
        <Sheet visible={payload !== null} onDismiss={onDismiss} title={t("share.title")} maxHeightRatio={0.9}>
            {payload ? (
                <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
                    <View ref={cardRef} collapsable={false}>
                        <AyahImageCard payload={payload} />
                    </View>
                    <Button mode="contained" icon="image-outline" onPress={shareImage} loading={busy} disabled={busy}>
                        {t("share.image")}
                    </Button>
                    <Button mode="outlined" icon="text" onPress={shareText}>
                        {t("share.text")}
                    </Button>
                </ScrollView>
            ) : null}
        </Sheet>
    );
}

const styles = StyleSheet.create({
    card: { padding: 16, borderRadius: 16 },
    frame: { borderWidth: 1, borderRadius: 12, padding: 20, gap: 14 },
    arabic: { textAlign: "center" },
    rule: { height: 1, width: 48, alignSelf: "center", opacity: 0.7 },
    meaning: { textAlign: "center", fontSize: 15, lineHeight: 23 },
    reference: { textAlign: "center" },
    brand: { textAlign: "center", opacity: 0.7, letterSpacing: 2 },
});
