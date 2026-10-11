import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Amiri_400Regular, Amiri_700Bold } from "@expo-google-fonts/amiri";
import { ReemKufi_600SemiBold, ReemKufi_700Bold } from "@expo-google-fonts/reem-kufi";
import { SourceSans3_400Regular, SourceSans3_600SemiBold, SourceSans3_700Bold } from "@expo-google-fonts/source-sans-3";
import { DarkTheme, DefaultTheme, ThemeProvider, type Theme as NavigationTheme } from "expo-router/react-navigation";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MD3DarkTheme, MD3LightTheme, PaperProvider, type MD3Theme } from "react-native-paper";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import { useTheme } from "@/components/useTheme";
import i18n, { resolveLanguage } from "@/i18n";
import { useSettingsStore } from "@/store/settings";
import { queryPersister } from "@/store/storage";

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
    initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const queryClient = new QueryClient({
    defaultOptions: {
        // Cached Surahs must outlive the persister's maxAge, or they're dropped before they can be restored.
        queries: { gcTime: ONE_WEEK_MS * 4, retry: 2 },
    },
});

export default function RootLayout() {
    const [loaded, error] = useFonts({
        // Amiri, not Amiri Quran: the Quran variant is a colour font that paints vowel marks red and blue.
        Amiri_400Regular,
        Amiri_700Bold,
        ReemKufi_600SemiBold,
        ReemKufi_700Bold,
        SourceSans3_400Regular,
        SourceSans3_600SemiBold,
        SourceSans3_700Bold,
        ...FontAwesome.font,
    });

    // Expo Router uses Error Boundaries to catch errors in the navigation tree.
    useEffect(() => {
        if (error) throw error;
    }, [error]);

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    if (!loaded) {
        return null;
    }

    return <RootLayoutNav />;
}

function RootLayoutNav() {
    const { scheme, colors, fonts } = useTheme();
    const languagePreference = useSettingsStore((state) => state.languagePreference);

    useEffect(() => {
        void i18n.changeLanguage(resolveLanguage(languagePreference));
    }, [languagePreference]);

    const paperTheme: MD3Theme = useMemo(() => {
        const base = scheme === "dark" ? MD3DarkTheme : MD3LightTheme;
        return {
            ...base,
            colors: {
                ...base.colors,
                primary: colors.mushaf,
                onPrimary: colors.onMushaf,
                secondary: colors.brass,
                background: colors.paper,
                surface: colors.surface,
                surfaceVariant: colors.surface2,
                onSurface: colors.ink,
                onSurfaceVariant: colors.ink2,
                outline: colors.line,
                error: colors.danger,
            },
        };
    }, [scheme, colors]);

    const navigationTheme: NavigationTheme = useMemo(() => {
        const base = scheme === "dark" ? DarkTheme : DefaultTheme;
        return {
            ...base,
            colors: {
                ...base.colors,
                primary: colors.mushaf,
                background: colors.paper,
                card: colors.surface,
                text: colors.ink,
                border: colors.line,
            },
        };
    }, [scheme, colors]);

    return (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.paper }}>
            <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: queryPersister, maxAge: ONE_WEEK_MS * 4 }}>
                <PaperProvider theme={paperTheme}>
                    <ThemeProvider value={navigationTheme}>
                        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
                        <Stack
                            screenOptions={{
                                headerStyle: { backgroundColor: colors.paper },
                                headerTintColor: colors.ink,
                                headerTitleStyle: { fontFamily: fonts.display, color: colors.ink },
                                headerShadowVisible: false,
                                headerBackButtonDisplayMode: "minimal",
                                contentStyle: { backgroundColor: colors.paper },
                            }}
                        >
                            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                            <Stack.Screen name="surah/[id]" />
                            <Stack.Screen name="reciters" />
                            <Stack.Screen name="tajweed" />
                            <Stack.Screen name="khatam" />
                            <Stack.Screen name="doa" />
                            <Stack.Screen name="adhkar" />
                            <Stack.Screen name="asma" />
                            <Stack.Screen name="tasbih" />
                            <Stack.Screen name="hifz/index" />
                            <Stack.Screen name="hifz/[id]" />
                        </Stack>
                        <Toast />
                    </ThemeProvider>
                </PaperProvider>
            </PersistQueryClientProvider>
        </GestureHandlerRootView>
    );
}
