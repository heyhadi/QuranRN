import { Stack } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import { OrnateCard } from "@/components/ui/Plate";
import { AppText } from "@/components/ui/AppText";
import { StarNumber } from "@/components/ui/StarNumber";
import { useTheme } from "@/components/useTheme";
import { useAsmaulHusna } from "@/services/queries";

/** The 99 names of Allah with their English meanings (aladhan.com has no verified Indonesian text). */
export default function AsmaScreen() {
    const { t, i18n } = useTranslation();
    const { colors, spacing, radius } = useTheme();
    const names = useAsmaulHusna();

    return (
        <View style={[styles.screen, { backgroundColor: colors.paper }]}>
            <Stack.Screen options={{ title: t("more.asma") }} />
            {names.isPending ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.mushaf} />
                </View>
            ) : names.isError ? (
                <View style={styles.centered}>
                    <AppText style={styles.center}>{t("more.doaLoadError")}</AppText>
                    <Button mode="contained" onPress={() => names.refetch()}>
                        {t("common.tryAgain")}
                    </Button>
                </View>
            ) : (
                <FlatList
                    data={names.data}
                    keyExtractor={(item) => String(item.number)}
                    numColumns={2}
                    columnWrapperStyle={{ gap: spacing.md, paddingHorizontal: spacing.lg }}
                    contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xxl }}
                    ListHeaderComponent={
                        <View style={{ padding: spacing.lg, gap: spacing.xs }}>
                            <AppText muted>{t("more.asmaIntro")}</AppText>
                            {i18n.language === "id" ? (
                                <AppText variant="caption" muted>
                                    {t("more.asmaMeaningNote")}
                                </AppText>
                            ) : null}
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View style={styles.cell}>
                        <OrnateCard style={[styles.cardContent, { padding: spacing.md }]}>
                            <StarNumber value={item.number} size={32} />
                            <AppText variant="arabic" size={28} style={styles.center}>
                                {item.arabic}
                            </AppText>
                            <AppText variant="bodyStrong" style={styles.center}>
                                {item.transliteration}
                            </AppText>
                            <AppText variant="caption" muted style={styles.center}>
                                {item.meaning}
                            </AppText>
                        </OrnateCard>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    center: { textAlign: "center" },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
    cell: { flex: 1 },
    cardContent: { alignItems: "center", gap: 4 },
});
