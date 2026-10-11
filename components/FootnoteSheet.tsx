import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";
import { Button } from "react-native-paper";
import { AppText } from "@/components/ui/AppText";
import { Sheet } from "@/components/ui/Sheet";
import { useTheme } from "@/components/useTheme";
import { useFootnote } from "@/services/queries";
import { decodeEntities } from "@/services/richText";

interface FootnoteSheetProps {
    footnoteId: number | null;
    onDismiss: () => void;
}

/** The translator's note behind a footnote marker, loaded when it is tapped. */
export function FootnoteSheet({ footnoteId, onDismiss }: FootnoteSheetProps) {
    const { t } = useTranslation();
    const { colors, spacing } = useTheme();
    const footnote = useFootnote(footnoteId);
    return (
        <Sheet visible={footnoteId !== null} onDismiss={onDismiss} title={t("footnote.title")} maxHeightRatio={0.6}>
            <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.sm }}>
                {footnote.isPending ? (
                    <ActivityIndicator color={colors.mushaf} />
                ) : footnote.data ? (
                    <AppText style={{ lineHeight: 24 }}>{decodeEntities(footnote.data.replace(/<[^>]+>/g, ""))}</AppText>
                ) : (
                    <>
                        <AppText>{t("footnote.error")}</AppText>
                        <Button onPress={() => footnote.refetch()} style={{ alignSelf: "flex-start" }}>
                            {t("common.tryAgain")}
                        </Button>
                    </>
                )}
            </View>
        </Sheet>
    );
}
