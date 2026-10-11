import React from "react";
import { Text, type TextProps, type TextStyle } from "react-native";
import { useTheme } from "@/components/useTheme";

export type TextVariant = "display" | "title" | "heading" | "body" | "bodyStrong" | "caption" | "label" | "arabic";

interface AppTextProps extends TextProps {
    variant?: TextVariant;
    /** Use the secondary ink colour. */
    muted?: boolean;
    color?: string;
    /** Arabic only: size in points (defaults to the reader's setting is the caller's job). */
    size?: number;
}

/**
 * How far each style grows with the phone's font size setting. Body text follows it generously; big
 * headings and tiny labels are capped so layouts hold; Quran text has its own size setting instead.
 */
export function maxScaleFor(variant: TextVariant): number {
    switch (variant) {
        case "arabic":
            return 1;
        case "display":
        case "title":
            return 1.3;
        case "label":
        case "caption":
            return 1.5;
        default:
            return 1.8;
    }
}

/** Text in the Wird type scale: Reem Kufi for headings, Source Sans 3 for UI, Amiri Quran for Quran text. */
export function AppText({ variant = "body", muted, color, size, style, ...rest }: AppTextProps) {
    const { colors, fonts } = useTheme();
    const variants: Record<TextVariant, TextStyle> = {
        display: { fontFamily: fonts.displayBold, fontSize: 28, lineHeight: 36 },
        title: { fontFamily: fonts.display, fontSize: 20, lineHeight: 28 },
        heading: { fontFamily: fonts.display, fontSize: 16, lineHeight: 22 },
        body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23 },
        bodyStrong: { fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 23 },
        caption: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
        label: { fontFamily: fonts.bodyBold, fontSize: 11, lineHeight: 14, letterSpacing: 0.8, textTransform: "uppercase" },
        arabic: {
            fontFamily: fonts.quran,
            fontSize: size ?? 28,
            lineHeight: (size ?? 28) * 2,
            textAlign: "right",
            writingDirection: "rtl",
        },
    };
    return (
        <Text
            maxFontSizeMultiplier={maxScaleFor(variant)}
            // Quran text has its own size setting; the phone's font scale must not change it a second time.
            allowFontScaling={variant !== "arabic"}
            style={[variants[variant], { color: color ?? (muted ? colors.ink2 : colors.ink) }, style]}
            {...rest}
        />
    );
}
