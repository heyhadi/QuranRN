import { Ionicons } from "@expo/vector-icons";
import { BottomTabBar, Tabs } from "expo-router/js-tabs";
import React from "react";
import { useTranslation } from "react-i18next";
import { View, type ColorValue } from "react-native";
import { MiniPlayer } from "@/components/MiniPlayer";
import { useTheme } from "@/components/useTheme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function tabIcon(active: IconName, inactive: IconName) {
    return ({ color, focused }: { color: ColorValue; focused: boolean }) => (
        <Ionicons name={focused ? active : inactive} size={24} color={color} />
    );
}

export default function TabLayout() {
    const { t } = useTranslation();
    const { colors, fonts } = useTheme();

    return (
        <Tabs
            tabBar={(props) => (
                <View style={{ backgroundColor: colors.surface }}>
                    <MiniPlayer />
                    <BottomTabBar {...props} />
                </View>
            )}
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.mushaf,
                tabBarInactiveTintColor: colors.ink2,
                tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
                tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
            }}
        >
            <Tabs.Screen name="index" options={{ title: t("tabs.quran"), tabBarIcon: tabIcon("book", "book-outline") }} />
            <Tabs.Screen name="bookmark" options={{ title: t("tabs.saved"), tabBarIcon: tabIcon("bookmark", "bookmark-outline") }} />
            <Tabs.Screen name="prayer" options={{ title: t("tabs.prayer"), tabBarIcon: tabIcon("moon", "moon-outline") }} />
            <Tabs.Screen name="more" options={{ title: t("tabs.more"), tabBarIcon: tabIcon("apps", "apps-outline") }} />
            <Tabs.Screen name="settings" options={{ title: t("tabs.settings"), tabBarIcon: tabIcon("settings", "settings-outline") }} />
        </Tabs>
    );
}
