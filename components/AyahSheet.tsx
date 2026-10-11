import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Button } from "react-native-paper";
import { AppText } from "@/components/ui/AppText";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Sheet } from "@/components/ui/Sheet";
import { useTheme } from "@/components/useTheme";
import { defaultTafsirFor, getTafsirEdition, tafsirEditions, type TafsirId } from "@/constants/editions";
import type { AppLanguage } from "@/i18n";
import { htmlToBlocks } from "@/services/richText";
import { useQuranComTafsir, useTafsir, useWords } from "@/services/queries";
import type { Ayah } from "@/services/types";
import { useAudioPlayerStore } from "@/store/audioPlayer";
import { bookmarkKey, useBookmarksStore } from "@/store/bookmarks";
import { COLLECTION_COLORS, useCollectionsStore } from "@/store/collections";
import { useNotesStore } from "@/store/notes";
import { useSettingsStore } from "@/store/settings";

type Tab = "words" | "tafsir" | "notes";

interface AyahSheetProps {
    ayah: Ayah | null;
    surahName: string;
    initialTab?: Tab;
    onDismiss: () => void;
}

export function AyahSheet({ ayah, surahName, initialTab = "words", onDismiss }: AyahSheetProps) {
    const { t, i18n } = useTranslation();
    const { colors, spacing } = useTheme();
    const [tab, setTab] = useState<Tab>(initialTab);

    // Reopen on the tab that was asked for, not the one left open last time.
    useEffect(() => {
        if (ayah) setTab(initialTab);
    }, [ayah, initialTab]);

    return (
        <Sheet visible={ayah !== null} onDismiss={onDismiss} title={ayah ? t("ayahSheet.title", { surah: surahName, ayah: ayah.ayahNumber }) : ""} maxHeightRatio={0.88}>
            {ayah ? (
                <View style={{ gap: spacing.md, flexShrink: 1 }}>
                    <View style={{ paddingHorizontal: spacing.lg }}>
                        <SegmentedControl<Tab>
                            value={tab}
                            onChange={setTab}
                            options={[
                                { value: "words", label: t("ayahSheet.words") },
                                { value: "tafsir", label: t("ayahSheet.tafsir") },
                                { value: "notes", label: t("ayahSheet.notes") },
                            ]}
                        />
                    </View>
                    {tab === "words" ? <WordsTab ayah={ayah} language={i18n.language as AppLanguage} /> : null}
                    {tab === "tafsir" ? <TafsirTab ayah={ayah} language={i18n.language as AppLanguage} /> : null}
                    {tab === "notes" ? <NotesTab ayah={ayah} surahName={surahName} /> : null}
                </View>
            ) : null}
        </Sheet>
    );
}

// ---- Words ----

function WordsTab({ ayah, language }: { ayah: Ayah; language: AppLanguage }) {
    const { t } = useTranslation();
    const { colors, spacing, radius } = useTheme();
    const words = useWords(ayah.surahNumber, ayah.ayahNumber, language);
    const clipUrl = useAudioPlayerStore((state) => state.clipUrl);
    const toggleClip = useAudioPlayerStore((state) => state.toggleClip);

    if (words.isPending) return <ActivityIndicator color={colors.mushaf} style={{ margin: spacing.xl }} />;
    if (words.isError) {
        return (
            <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm, alignItems: "flex-start" }}>
                <AppText>{t("ayahSheet.wordsError")}</AppText>
                <Button onPress={() => words.refetch()}>{t("common.tryAgain")}</Button>
            </View>
        );
    }
    return (
        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md }}>
            <AppText variant="caption" muted>
                {t("ayahSheet.tapWord")}
            </AppText>
            <View style={styles.words}>
                {words.data.map((word) => {
                    const playing = word.audioUrl !== null && clipUrl === word.audioUrl;
                    return (
                        <Pressable
                            key={word.position}
                            onPress={() => word.audioUrl && toggleClip(word.audioUrl)}
                            accessibilityRole="button"
                            accessibilityLabel={t("ayahSheet.playWord", { word: word.transliteration || word.meaning })}
                            style={[styles.word, { backgroundColor: playing ? colors.mushafSoft : colors.surface2, borderRadius: radius.md }]}
                        >
                            <AppText variant="arabic" size={26} style={styles.center} color={colors.mushaf}>
                                {word.arabic}
                            </AppText>
                            <AppText variant="caption" muted style={[styles.center, styles.italic]}>
                                {word.transliteration}
                            </AppText>
                            <AppText variant="bodyStrong" style={[styles.center, styles.meaning]}>
                                {word.meaning}
                            </AppText>
                        </Pressable>
                    );
                })}
            </View>
            <AppText variant="caption" muted>
                {t("ayahSheet.wordsSource")}
            </AppText>
        </ScrollView>
    );
}

// ---- Tafsir ----

function TafsirTab({ ayah, language }: { ayah: Ayah; language: AppLanguage }) {
    const { t } = useTranslation();
    const { colors, spacing, radius } = useTheme();
    const tafsirChoice = useSettingsStore((state) => state.tafsirChoice);
    const setTafsirChoice = useSettingsStore((state) => state.setTafsirChoice);
    const selectedId: TafsirId = tafsirChoice ?? defaultTafsirFor(language);
    const edition = getTafsirEdition(selectedId);

    const kemenag = useTafsir(ayah.surahNumber);
    const remote = useQuranComTafsir(selectedId, ayah.surahNumber, ayah.ayahNumber);
    const query = selectedId === "kemenag" ? kemenag : remote;

    // The app language's tafsirs first, then the rest.
    const ordered = useMemo(() => [...tafsirEditions].sort((a, b) => Number(b.language === language) - Number(a.language === language)), [language]);

    const blocks = useMemo(() => {
        if (selectedId === "kemenag") {
            const entry = kemenag.data?.find((item) => item.ayahNumber === ayah.ayahNumber);
            return entry ? htmlToBlocks(`<p>${entry.text.replace(/\n/g, "<br>")}</p>`) : null;
        }
        return remote.data ? htmlToBlocks(remote.data.html) : null;
    }, [selectedId, kemenag.data, remote.data, ayah.ayahNumber]);

    const isArabic = edition.language === "ar";

    return (
        <View style={{ gap: spacing.md, flexShrink: 1 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }} style={styles.chipRow}>
                {ordered.map((item) => {
                    const selected = item.id === selectedId;
                    return (
                        <Pressable
                            key={String(item.id)}
                            onPress={() => setTafsirChoice(item.id)}
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                            style={[styles.chip, { backgroundColor: selected ? colors.mushaf : colors.surface2, borderRadius: radius.pill }]}
                        >
                            <AppText variant="caption" color={selected ? colors.onMushaf : colors.ink2} style={styles.bold}>
                                {item.name}
                            </AppText>
                        </Pressable>
                    );
                })}
            </ScrollView>
            {query.isPending ? (
                <ActivityIndicator color={colors.mushaf} style={{ margin: spacing.xl }} />
            ) : blocks ? (
                <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md }}>
                    {isArabic ? (
                        <AppText variant="caption" muted>
                            {t("ayahSheet.tafsirArabic")}
                        </AppText>
                    ) : null}
                    {blocks.map((block, index) =>
                        isArabic ? (
                            <AppText key={index} style={[styles.arabicTafsir, block.kind === "heading" && styles.bold]}>
                                {block.text}
                            </AppText>
                        ) : (
                            <AppText key={index} variant={block.kind === "heading" ? "heading" : "body"} style={block.kind === "paragraph" ? styles.tafsirText : undefined}>
                                {block.text}
                            </AppText>
                        ),
                    )}
                    <AppText variant="caption" muted>
                        {edition.name}
                    </AppText>
                </ScrollView>
            ) : (
                <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm, alignItems: "flex-start" }}>
                    <AppText>{t("ayahSheet.tafsirError")}</AppText>
                    <Button onPress={() => query.refetch()}>{t("common.tryAgain")}</Button>
                </View>
            )}
        </View>
    );
}

// ---- Notes and collections ----

function NotesTab({ ayah, surahName }: { ayah: Ayah; surahName: string }) {
    const { t } = useTranslation();
    const { colors, spacing, radius } = useTheme();
    const key = bookmarkKey(ayah.surahNumber, ayah.ayahNumber);
    const savedNote = useNotesStore((state) => state.notes[key]?.text ?? "");
    const setNote = useNotesStore((state) => state.setNote);
    const [draft, setDraft] = useState(savedNote);
    const [newName, setNewName] = useState("");
    const collections = useCollectionsStore((state) => state.collections);
    const addCollection = useCollectionsStore((state) => state.addCollection);
    const removeCollection = useCollectionsStore((state) => state.removeCollection);
    const bookmark = useBookmarksStore((state) => state.bookmarks[key]);
    const setCollection = useBookmarksStore((state) => state.setCollection);

    // Save a moment after typing stops, and on the way out, so a note is never lost to a closed sheet.
    useEffect(() => {
        const timer = setTimeout(() => setNote(ayah.surahNumber, ayah.ayahNumber, draft), 600);
        return () => {
            clearTimeout(timer);
        };
    }, [draft, ayah.surahNumber, ayah.ayahNumber, setNote]);
    useEffect(() => () => setNote(ayah.surahNumber, ayah.ayahNumber, draftRef.current), [ayah.surahNumber, ayah.ayahNumber, setNote]);
    const draftRef = React.useRef(draft);
    draftRef.current = draft;

    const asBookmark = { surahNumber: ayah.surahNumber, ayahNumber: ayah.ayahNumber, surahNameLatin: surahName, textArabic: ayah.textArabic };

    return (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.lg }}>
            <View style={{ gap: spacing.xs }}>
                <AppText variant="label" muted>
                    {t("ayahSheet.noteLabel")}
                </AppText>
                <TextInput
                    value={draft}
                    onChangeText={setDraft}
                    placeholder={t("ayahSheet.notePlaceholder")}
                    placeholderTextColor={colors.ink2}
                    multiline
                    textAlignVertical="top"
                    accessibilityLabel={t("ayahSheet.noteLabel")}
                    style={[styles.noteInput, { backgroundColor: colors.surface2, borderRadius: radius.md, color: colors.ink }]}
                />
            </View>

            <View style={{ gap: spacing.sm }}>
                <AppText variant="label" muted>
                    {t("ayahSheet.collection")}
                </AppText>
                <View style={styles.collectionRow}>
                    <Pressable
                        onPress={() => setCollection(asBookmark, null)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: !bookmark?.collectionId }}
                        style={[styles.chip, { backgroundColor: !bookmark?.collectionId ? colors.mushaf : colors.surface2, borderRadius: radius.pill }]}
                    >
                        <AppText variant="caption" color={!bookmark?.collectionId ? colors.onMushaf : colors.ink2} style={styles.bold}>
                            {t("ayahSheet.noCollection")}
                        </AppText>
                    </Pressable>
                    {collections.map((collection) => {
                        const selected = bookmark?.collectionId === collection.id;
                        return (
                            <Pressable
                                key={collection.id}
                                onPress={() => setCollection(asBookmark, collection.id)}
                                onLongPress={() => removeCollection(collection.id)}
                                accessibilityRole="button"
                                accessibilityState={{ selected }}
                                accessibilityActions={[{ name: "delete", label: t("ayahSheet.removeCollection", { name: collection.name }) }]}
                                onAccessibilityAction={() => removeCollection(collection.id)}
                                style={[styles.chip, { backgroundColor: selected ? collection.color : colors.surface2, borderRadius: radius.pill }]}
                            >
                                <View style={styles.chipInner}>
                                    {!selected ? <View style={[styles.dot, { backgroundColor: collection.color }]} /> : null}
                                    <AppText variant="caption" color={selected ? "#FFFFFF" : colors.ink2} style={styles.bold}>
                                        {collection.name}
                                    </AppText>
                                </View>
                            </Pressable>
                        );
                    })}
                </View>
                <View style={styles.newRow}>
                    <TextInput
                        value={newName}
                        onChangeText={setNewName}
                        placeholder={t("ayahSheet.newCollectionPlaceholder")}
                        placeholderTextColor={colors.ink2}
                        accessibilityLabel={t("ayahSheet.newCollection")}
                        returnKeyType="done"
                        onSubmitEditing={() => {
                            const created = addCollection(newName);
                            if (created) setCollection(asBookmark, created.id);
                            setNewName("");
                        }}
                        style={[styles.newInput, { backgroundColor: colors.surface2, borderRadius: radius.md, color: colors.ink }]}
                    />
                    <Pressable
                        onPress={() => {
                            const created = addCollection(newName);
                            if (created) setCollection(asBookmark, created.id);
                            setNewName("");
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={t("ayahSheet.addCollection")}
                        style={[styles.addButton, { backgroundColor: colors.mushaf, borderRadius: radius.md }]}
                    >
                        <Ionicons name="add" size={22} color={colors.onMushaf} />
                    </Pressable>
                </View>
                <AppText variant="caption" muted>
                    {`${COLLECTION_COLORS.length > 0 ? "" : ""}${t("saved.hint")}`}
                </AppText>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    center: { textAlign: "center" },
    italic: { fontStyle: "italic" },
    bold: { fontWeight: "600" },
    meaning: { fontSize: 13 },
    words: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
    word: { width: "48.5%", alignItems: "center", paddingVertical: 8, paddingHorizontal: 6, gap: 2 },
    chipRow: { flexGrow: 0 },
    chip: { paddingHorizontal: 12, paddingVertical: 7 },
    chipInner: { flexDirection: "row", alignItems: "center", gap: 6 },
    dot: { width: 9, height: 9, borderRadius: 5 },
    tafsirText: { lineHeight: 25 },
    arabicTafsir: { fontSize: 18, lineHeight: 32, textAlign: "right", writingDirection: "rtl" },
    noteInput: { minHeight: 110, padding: 12, fontSize: 16 },
    collectionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    newRow: { flexDirection: "row", gap: 8 },
    newInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
    addButton: { width: 44, alignItems: "center", justifyContent: "center" },
});
