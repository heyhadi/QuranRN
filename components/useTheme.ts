import { useColorScheme } from "react-native";
import { fonts, palettes, radius, spacing, type ColorScheme, type Palette } from "@/constants/theme";
import { useSettingsStore } from "@/store/settings";

export interface Theme {
    scheme: ColorScheme;
    colors: Palette;
    fonts: typeof fonts;
    spacing: typeof spacing;
    radius: typeof radius;
}

/** The active theme: the user's choice in Settings, or the system appearance when set to "system". */
export function useTheme(): Theme {
    const systemScheme = useColorScheme();
    const preference = useSettingsStore((state) => state.themePreference);
    const scheme: ColorScheme = preference === "system" ? (systemScheme === "dark" ? "dark" : "light") : preference;
    return { scheme, colors: palettes[scheme], fonts, spacing, radius };
}
