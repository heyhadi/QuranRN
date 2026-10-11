import { Link, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/components/useTheme";

export default function NotFoundScreen() {
    const { t } = useTranslation();
    const { colors } = useTheme();
    return (
        <>
            <Stack.Screen options={{ title: t("notFound.title") }} />
            <View style={[styles.container, { backgroundColor: colors.paper }]}>
                <AppText variant="title">{t("notFound.message")}</AppText>
                <Link href="/" style={styles.link}>
                    <AppText variant="bodyStrong" color={colors.mushaf}>
                        {t("notFound.goHome")}
                    </AppText>
                </Link>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
    link: { marginTop: 15, paddingVertical: 15 },
});
