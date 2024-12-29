import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Entypo from "@expo/vector-icons/Entypo";
import { Link, Tabs } from "expo-router";
import { Pressable } from "react-native";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: { name: React.ComponentProps<typeof FontAwesome>["name"]; color: string }) {
    return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}
function TabBarIcon5(props: { name: React.ComponentProps<typeof FontAwesome5>["name"]; color: string }) {
    return <FontAwesome5 size={28} style={{ marginBottom: -3 }} {...props} />;
}

function TabBarIconEntypo(props: { name: React.ComponentProps<typeof Entypo>["name"]; color: string }) {
    return <Entypo size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: "white",
                headerTitleStyle: {
                    color: "white",
                },
                tabBarInactiveTintColor: "#fff6",
                headerShown: useClientOnlyValue(false, true),
                headerTitleAlign: "center",
                headerStyle: {
                    backgroundColor: "green",
                    
                },
                tabBarStyle: {
                    backgroundColor: "green",
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
                }}
            />
            <Tabs.Screen
                name="qibla"
                options={{
                    title: "Qibla",
                    tabBarIcon: ({ color }) => <TabBarIconEntypo name="compass" color={color} />,
                }}
            />
            <Tabs.Screen
                name="bookmark"
                options={{
                    title: "Bookmark",
                    tabBarIcon: ({ color }) => <TabBarIconEntypo name="book" color={color} />,
                }}
            />
        </Tabs>
    );
}
