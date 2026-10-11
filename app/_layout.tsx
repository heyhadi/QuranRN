import FontAwesome from "@expo/vector-icons/FontAwesome";
import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { PaperProvider } from "react-native-paper";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import { useColorScheme } from "@/components/useColorScheme";
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
        AmiriQuran_400Regular: require("../assets/fonts/AmiriQuran-Regular.ttf"),
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
    const colorScheme = useColorScheme();

    return (
        <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: queryPersister, maxAge: ONE_WEEK_MS * 4 }}>
            <PaperProvider>
                <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
                    <Stack>
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen
                            name="surah/[id]"
                            options={{
                                headerStyle: { backgroundColor: "green" },
                                headerTintColor: "white",
                                headerTitleStyle: { color: "white" },
                                headerBackButtonDisplayMode: "minimal",
                            }}
                        />
                    </Stack>
                    <Toast />
                </ThemeProvider>
            </PaperProvider>
        </PersistQueryClientProvider>
    );
}
