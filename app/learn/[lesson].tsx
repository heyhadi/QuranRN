import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import { AppText } from "@/components/ui/AppText";
import { OrnateCard } from "@/components/ui/Plate";
import { useTheme } from "@/components/useTheme";
import { learnLanguage, type HijaiyahLetter, type LearnLanguage } from "@/constants/hijaiyah";
import { buildQuiz, hasPassed, lessonsForLevel, lessonById, readingRows, seededRandom, type ConnectedWord, type LessonLevel, type QuranWord, type QuizQuestion, type VowelKind } from "@/services/learnRead";
import { clipUri, hasClip, type ClipKind } from "@/services/learnReadAudio";
import { useAudioPlayerStore } from "@/store/audioPlayer";
import { useLearnReadStore } from "@/store/learnRead";

type Step = "letters" | "read" | "quiz" | "result";

/**
 * Plays a letter's clip (name, fathah, kasrah, dammah) or a Quran word's clip.
 * Shown where the audio is bundled or a remote word URL is provided.
 */
function PlayButton({
    letter,
    kind,
    language,
    size = 28,
    url,
    targetId,
}: {
    letter?: HijaiyahLetter;
    kind: ClipKind;
    language: LearnLanguage;
    size?: number;
    url?: string;
    targetId?: string;
}) {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const toggleClip = useAudioPlayerStore((state) => state.toggleClip);
    const target = targetId ?? (kind === "word" ? (url ?? letter?.id) : (letter?.id ?? url));
    if (!target || !hasClip(kind, target)) return null;

    return (
        <Pressable
            onPress={async () => {
                const uri = await clipUri(kind, target);
                if (uri) toggleClip(uri);
            }}
            accessibilityRole="button"
            accessibilityLabel={
                url
                    ? t("learn.listenWord")
                    : kind === "name"
                    ? t("learn.listenName", { name: letter?.name[language] })
                    : t("learn.listen", { sound: letter?.sound[language] })
            }
            hitSlop={8}
        >
            <Ionicons name="volume-high" size={size} color={colors.mushaf} />
        </Pressable>
    );
}

function ConnectedFormsRow({ letter }: { letter: HijaiyahLetter }) {
    const { colors, fonts, spacing, radius } = useTheme();
    const { t } = useTranslation();
    const positions = [
        { label: t("learn.isolated"), form: letter.forms.isolated },
        { label: t("learn.initial"), form: letter.forms.initial },
        { label: t("learn.medial"), form: letter.forms.medial },
        { label: t("learn.final"), form: letter.forms.final },
    ];
    return (
        <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
            <AppText variant="caption" muted>
                {t("learn.formsTitle")}
            </AppText>
            <View style={[styles.formsRow, { gap: spacing.xs }]}>
                {positions.map((pos, idx) => (
                    <View
                        key={idx}
                        style={[
                            styles.formBox,
                            { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.sm },
                        ]}
                    >
                        <AppText style={[styles.formArabic, { fontFamily: fonts.quran, color: colors.ink }]}>
                            {pos.form}
                        </AppText>
                        <AppText variant="caption" muted style={{ fontSize: 10 }}>
                            {pos.label}
                        </AppText>
                    </View>
                ))}
            </View>
            {letter.nonConnecting ? (
                <AppText variant="caption" color={colors.heroAccent} style={{ marginTop: 2 }}>
                    {t("learn.nonConnectingNotice")}
                </AppText>
            ) : null}
        </View>
    );
}

function LetterCard({
    letter,
    language,
    initialVowel = "fathah",
    showForms = false,
    fixedVowel,
}: {
    letter: HijaiyahLetter;
    language: LearnLanguage;
    initialVowel?: VowelKind;
    showForms?: boolean;
    fixedVowel?: VowelKind;
}) {
    const { t } = useTranslation();
    const { colors, fonts, spacing, radius } = useTheme();
    const toggleClip = useAudioPlayerStore((state) => state.toggleClip);
    const [vowel, setVowel] = useState<VowelKind>(fixedVowel ?? initialVowel);

    const activeVowel = fixedVowel ?? vowel;
    const activeArabic =
        activeVowel === "kasrah"
            ? letter.kasrah
            : activeVowel === "dammah"
            ? letter.dammah
            : activeVowel === "fathatain"
            ? letter.fathatain
            : activeVowel === "kasratain"
            ? letter.kasratain
            : activeVowel === "dammatain"
            ? letter.dammatain
            : letter.fathah;

    const activeSound =
        activeVowel === "kasrah"
            ? letter.soundKasrah[language]
            : activeVowel === "dammah"
            ? letter.soundDammah[language]
            : activeVowel === "fathatain"
            ? letter.soundAn[language]
            : activeVowel === "kasratain"
            ? letter.soundIn[language]
            : activeVowel === "dammatain"
            ? letter.soundUn[language]
            : letter.sound[language];

    return (
        <OrnateCard style={[styles.letterCard, { padding: spacing.lg, gap: spacing.sm }]}>
            <View style={[styles.letterRow, { gap: spacing.md }]}>
                <View style={styles.flex}>
                    <AppText variant="title">{letter.name[language]}</AppText>
                    <AppText variant="caption" muted>
                        {letter.makhraj[language]}
                    </AppText>
                </View>
                <AppText style={[styles.bareArabic, { fontFamily: fonts.quran, color: colors.ink2 }]} accessibilityLabel={letter.nameArabic}>
                    {letter.letter}
                </AppText>
            </View>

            {/* Harakat Switcher or Tanwin Badge */}
            {!fixedVowel ? (
                <View style={[styles.vowelTrack, { backgroundColor: colors.surface2, borderRadius: radius.sm }]}>
                    {(["fathah", "kasrah", "dammah"] as const).map((v) => {
                        const selected = vowel === v;
                        return (
                            <Pressable
                                key={v}
                                onPress={() => setVowel(v)}
                                style={[
                                    styles.vowelSegment,
                                    selected && { backgroundColor: colors.surface, borderRadius: radius.sm - 2 },
                                ]}
                            >
                                <AppText variant="caption" color={selected ? colors.ink : colors.ink2}>
                                    {t(`learn.${v}`)}
                                </AppText>
                            </Pressable>
                        );
                    })}
                </View>
            ) : (
                <View style={[styles.letterRow, styles.centerRow, { paddingVertical: 4 }]}>
                    <AppText variant="caption" color={colors.heroAccent} style={{ fontWeight: "600" }}>
                        {t(`learn.${fixedVowel}`)}
                    </AppText>
                </View>
            )}

            <Pressable
                onPress={async () => {
                    const uri = await clipUri(activeVowel, letter.id);
                    if (uri) toggleClip(uri);
                }}
                accessibilityRole="button"
                accessibilityLabel={t("learn.readAs", { sound: activeSound })}
            >
                <AppText style={[styles.bigArabic, { fontFamily: fonts.quran, color: colors.ink }]} accessibilityLabel={activeSound}>
                    {activeArabic}
                </AppText>
            </Pressable>

            <View style={[styles.letterRow, styles.centerRow, { gap: spacing.sm }]}>
                <AppText variant="bodyStrong" color={colors.mushaf}>
                    {t("learn.readAs", { sound: activeSound })}
                </AppText>
                <PlayButton letter={letter} kind={activeVowel} language={language} size={22} />
            </View>

            {showForms && <ConnectedFormsRow letter={letter} />}
        </OrnateCard>
    );
}

function ConnectedWordCard({ word, language }: { word: ConnectedWord; language: LearnLanguage }) {
    const { colors, fonts, spacing } = useTheme();
    return (
        <OrnateCard style={[styles.letterCard, { padding: spacing.lg, gap: spacing.sm }]}>
            <AppText style={[styles.bigArabic, { fontFamily: fonts.quran, color: colors.ink }]} accessibilityLabel={word.arabic}>
                {word.arabic}
            </AppText>
            <View style={[styles.letterRow, styles.centerRow, { gap: spacing.sm }]}>
                <AppText variant="title" color={colors.mushaf}>
                    {word.transliteration[language]}
                </AppText>
            </View>
            {word.meaning ? (
                <AppText variant="body" muted style={styles.center}>
                    {word.meaning[language]}
                </AppText>
            ) : null}
        </OrnateCard>
    );
}

function WordCard({ word, language }: { word: QuranWord; language: LearnLanguage }) {
    const { t } = useTranslation();
    const { colors, fonts, spacing } = useTheme();
    return (
        <OrnateCard style={[styles.letterCard, { padding: spacing.lg, gap: spacing.sm }]}>
            <View style={[styles.letterRow, styles.centerRow, { justifyContent: "space-between" }]}>
                <AppText variant="title">{word.transliteration[language]}</AppText>
                <PlayButton kind="word" language={language} targetId={word.id} url={word.audioUrl} size={26} />
            </View>
            <AppText style={[styles.bigArabic, { fontFamily: fonts.quran, color: colors.ink }]} accessibilityLabel={word.arabic}>
                {word.arabic}
            </AppText>
            <AppText variant="body" muted style={styles.center}>
                {t("learn.wordMeaning", { meaning: word.meaning[language] })}
            </AppText>
        </OrnateCard>
    );
}

/** One reading row, right to left. Tap a syllable to check how it sounds. */
function ReadingRow({
    row,
    language,
    vowel = "fathah",
}: {
    row: HijaiyahLetter[];
    language: LearnLanguage;
    vowel?: VowelKind;
}) {
    const { colors, fonts, spacing, radius } = useTheme();
    const toggleClip = useAudioPlayerStore((state) => state.toggleClip);
    const [revealed, setRevealed] = useState<Set<number>>(new Set());
    return (
        <View style={[styles.readingRow, { gap: spacing.sm }]}>
            {row.map((letter, index) => {
                const shown = revealed.has(index);
                const arabic =
                    vowel === "kasrah"
                        ? letter.kasrah
                        : vowel === "dammah"
                        ? letter.dammah
                        : vowel === "fathatain"
                        ? letter.fathatain
                        : vowel === "kasratain"
                        ? letter.kasratain
                        : vowel === "dammatain"
                        ? letter.dammatain
                        : letter.fathah;
                const sound =
                    vowel === "kasrah"
                        ? letter.soundKasrah[language]
                        : vowel === "dammah"
                        ? letter.soundDammah[language]
                        : vowel === "fathatain"
                        ? letter.soundAn[language]
                        : vowel === "kasratain"
                        ? letter.soundIn[language]
                        : vowel === "dammatain"
                        ? letter.soundUn[language]
                        : letter.sound[language];
                return (
                    <Pressable
                        key={`${letter.id}-${index}`}
                        onPress={async () => {
                            setRevealed((current) => new Set(current).add(index));
                            const uri = await clipUri(vowel, letter.id);
                            if (uri) toggleClip(uri);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={shown ? sound : arabic}
                        style={[styles.syllable, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md }]}
                    >
                        <AppText style={[styles.rowArabic, { fontFamily: fonts.quran, color: colors.ink }]}>{arabic}</AppText>
                        <AppText variant="bodyStrong" color={shown ? colors.mushaf : "transparent"}>
                            {sound}
                        </AppText>
                    </Pressable>
                );
            })}
        </View>
    );
}

function Question({ question, language, onAnswer }: { question: QuizQuestion; language: LearnLanguage; onAnswer: (correct: boolean) => void }) {
    const { t } = useTranslation();
    const { colors, fonts, spacing, radius } = useTheme();
    const [picked, setPicked] = useState<string | null>(null);
    const isWordQuiz = question.kind === "readWord" || question.kind === "findWord";
    const isConnectedForm = question.kind === "connectedForm";
    const isWhichLetter = question.kind === "whichLetter";
    const readSound = question.kind === "readSound";
    const vowel = question.vowel ?? "fathah";

    // Heading title
    const heading = isConnectedForm
        ? question.formPosition === "initial"
            ? t("learn.quizFindInitial")
            : question.formPosition === "medial"
            ? t("learn.quizFindMedial")
            : t("learn.quizFindFinal")
        : isWhichLetter
        ? t("learn.quizWhichLetter")
        : isWordQuiz
        ? question.kind === "readWord"
            ? t("learn.quizReadSound")
            : t("learn.quizFindLetter")
        : readSound
        ? t("learn.quizReadSound")
        : t("learn.quizFindLetter");

    // Correct target identification
    const targetId = isWordQuiz ? question.wordAnswer?.id ?? "" : question.answer.id;
    const isCorrect = picked === targetId;

    // Prompt content
    const promptArabic = isWordQuiz
        ? question.wordAnswer?.arabic ?? ""
        : isConnectedForm
        ? question.answer.letter
        : isWhichLetter
        ? question.answer.forms[question.formPosition ?? "medial"]
        : vowel === "kasrah"
        ? question.answer.kasrah
        : vowel === "dammah"
        ? question.answer.dammah
        : vowel === "fathatain"
        ? question.answer.fathatain
        : vowel === "kasratain"
        ? question.answer.kasratain
        : vowel === "dammatain"
        ? question.answer.dammatain
        : question.answer.fathah;

    const promptSound = isWordQuiz
        ? question.wordAnswer?.transliteration[language] ?? ""
        : isConnectedForm || isWhichLetter
        ? question.answer.name[language]
        : vowel === "kasrah"
        ? question.answer.soundKasrah[language]
        : vowel === "dammah"
        ? question.answer.soundDammah[language]
        : vowel === "fathatain"
        ? question.answer.soundAn[language]
        : vowel === "kasratain"
        ? question.answer.soundIn[language]
        : vowel === "dammatain"
        ? question.answer.soundUn[language]
        : question.answer.sound[language];

    // Word options or Letter options
    const renderOptions = () => {
        if (isWordQuiz && question.wordOptions) {
            return question.wordOptions.map((opt) => {
                const isSelected = opt.id === picked;
                const isThisAnswer = opt.id === targetId;
                const background = picked === null ? colors.surface : isThisAnswer ? colors.mushafSoft : isSelected ? colors.surface2 : colors.surface;
                const border = picked === null ? colors.line : isThisAnswer ? colors.mushaf : isSelected ? colors.danger : colors.line;
                return (
                    <Pressable
                        key={opt.id}
                        disabled={picked !== null}
                        onPress={() => setPicked(opt.id)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        style={[styles.option, { backgroundColor: background, borderColor: border, borderRadius: radius.lg }]}
                    >
                        {question.kind === "readWord" ? (
                            <AppText variant="title">{opt.transliteration[language]}</AppText>
                        ) : (
                            <AppText style={[styles.optionArabic, { fontFamily: fonts.quran, color: colors.ink }]}>{opt.arabic}</AppText>
                        )}
                    </Pressable>
                );
            });
        }

        return question.options.map((option) => {
            const isThisAnswer = option.id === question.answer.id;
            const isSelected = option.id === picked;
            const background = picked === null ? colors.surface : isThisAnswer ? colors.mushafSoft : isSelected ? colors.surface2 : colors.surface;
            const border = picked === null ? colors.line : isThisAnswer ? colors.mushaf : isSelected ? colors.danger : colors.line;

            let optionContent;
            if (isConnectedForm) {
                const formText = option.forms[question.formPosition ?? "initial"];
                optionContent = <AppText style={[styles.optionArabic, { fontFamily: fonts.quran, color: colors.ink }]}>{formText}</AppText>;
            } else if (isWhichLetter) {
                optionContent = (
                    <View style={[styles.letterRow, { gap: spacing.sm }]}>
                        <AppText style={[styles.formArabic, { fontFamily: fonts.quran, color: colors.ink }]}>{option.letter}</AppText>
                        <AppText variant="title">{option.name[language]}</AppText>
                    </View>
                );
            } else if (readSound) {
                const sound =
                    vowel === "kasrah"
                        ? option.soundKasrah[language]
                        : vowel === "dammah"
                        ? option.soundDammah[language]
                        : vowel === "fathatain"
                        ? option.soundAn[language]
                        : vowel === "kasratain"
                        ? option.soundIn[language]
                        : vowel === "dammatain"
                        ? option.soundUn[language]
                        : option.sound[language];
                optionContent = <AppText variant="title">{sound}</AppText>;
            } else {
                const arabic =
                    vowel === "kasrah"
                        ? option.kasrah
                        : vowel === "dammah"
                        ? option.dammah
                        : vowel === "fathatain"
                        ? option.fathatain
                        : vowel === "kasratain"
                        ? option.kasratain
                        : vowel === "dammatain"
                        ? option.dammatain
                        : option.fathah;
                optionContent = <AppText style={[styles.optionArabic, { fontFamily: fonts.quran, color: colors.ink }]}>{arabic}</AppText>;
            }

            return (
                <Pressable
                    key={option.id}
                    disabled={picked !== null}
                    onPress={() => setPicked(option.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    style={[styles.option, { backgroundColor: background, borderColor: border, borderRadius: radius.lg }]}
                >
                    {optionContent}
                </Pressable>
            );
        });
    };

    return (
        <View style={{ gap: spacing.lg }}>
            <AppText variant="heading" style={styles.center}>
                {heading}
            </AppText>
            <View style={styles.promptBox}>
                {isWordQuiz ? (
                    question.kind === "readWord" ? (
                        <View style={[styles.letterRow, styles.centerRow, { gap: spacing.md }]}>
                            <AppText style={[styles.bigArabic, { fontFamily: fonts.quran, color: colors.ink }]}>{promptArabic}</AppText>
                            <PlayButton kind={vowel === "sukun" ? "sukun" : "word"} language={language} targetId={question.wordAnswer?.id} url={question.wordAnswer?.audioUrl} size={30} />
                        </View>
                    ) : (
                        <View style={[styles.letterRow, styles.centerRow, { gap: spacing.md }]}>
                            <AppText style={[styles.bigSound, { color: colors.ink }]}>{promptSound}</AppText>
                            <PlayButton kind={vowel === "sukun" ? "sukun" : "word"} language={language} targetId={question.wordAnswer?.id} url={question.wordAnswer?.audioUrl} size={34} />
                        </View>
                    )
                ) : isConnectedForm ? (
                    <View style={[styles.letterRow, styles.centerRow, { gap: spacing.md }]}>
                        <AppText style={[styles.bigArabic, { fontFamily: fonts.quran, color: colors.ink }]}>{promptArabic}</AppText>
                        <PlayButton letter={question.answer} kind="name" language={language} size={28} />
                    </View>
                ) : isWhichLetter ? (
                    <AppText style={[styles.bigArabic, { fontFamily: fonts.quran, color: colors.ink }]}>{promptArabic}</AppText>
                ) : readSound ? (
                    <AppText style={[styles.bigArabic, { fontFamily: fonts.quran, color: colors.ink }]}>{promptArabic}</AppText>
                ) : (
                    <View style={[styles.letterRow, styles.centerRow, { gap: spacing.md }]}>
                        <AppText style={[styles.bigSound, { color: colors.ink }]}>{promptSound}</AppText>
                        <PlayButton letter={question.answer} kind={vowel} language={language} size={34} />
                    </View>
                )}
            </View>
            <View style={[styles.options, { gap: spacing.md }]}>
                {renderOptions()}
            </View>
            {picked !== null ? (
                <View style={{ gap: spacing.sm }}>
                    <AppText variant="bodyStrong" color={isCorrect ? colors.mushaf : colors.danger} style={styles.center}>
                        {isCorrect
                            ? t("learn.correct")
                            : t("learn.wrong", { sound: promptSound })}
                    </AppText>
                    <Button mode="contained" onPress={() => onAnswer(isCorrect)}>
                        {t("learn.next")}
                    </Button>
                </View>
            ) : null}
        </View>
    );
}

/** A lesson: meet the new letters, read rows of them, then a short quiz. */
export default function LessonScreen() {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const { colors, spacing } = useTheme();
    const params = useLocalSearchParams<{ lesson: string; step?: Step; correct?: string }>();
    const lesson = lessonById(params.lesson ?? "");
    const language = learnLanguage(i18n.language);
    const recordQuiz = useLearnReadStore((state) => state.recordQuiz);

    const [step, setStep] = useState<Step>(() => params.step ?? "letters");
    // A new seed for every attempt, so a retried quiz asks in a different order.
    const [seed, setSeed] = useState(() => Date.now());
    const rows = useMemo(() => (lesson ? readingRows(lesson, seededRandom(seed)) : []), [lesson, seed]);
    const quiz = useMemo(() => (lesson ? buildQuiz(lesson, language, seededRandom(seed + 1)) : []), [lesson, language, seed]);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [correct, setCorrect] = useState(() => (params.correct !== undefined ? Number(params.correct) : 0));

    if (!lesson) {
        return (
            <View style={[styles.screen, styles.centerBox, { backgroundColor: colors.paper }]}>
                <AppText muted>{t("learn.notFound")}</AppText>
            </View>
        );
    }

    const currentLevelLessons = lessonsForLevel(lesson.level);
    const next = currentLevelLessons.find((candidate) => candidate.number === lesson.number + 1);
    const passed = hasPassed(correct, quiz.length);

    const answer = (wasCorrect: boolean) => {
        const total = correct + (wasCorrect ? 1 : 0);
        setCorrect(total);
        if (questionIndex + 1 < quiz.length) {
            setQuestionIndex(questionIndex + 1);
            return;
        }
        recordQuiz(lesson.id, total, quiz.length);
        setStep("result");
    };

    const retry = () => {
        setSeed(Date.now());
        setQuestionIndex(0);
        setCorrect(0);
        setStep("quiz");
    };

    return (
        <View style={[styles.screen, { backgroundColor: colors.paper }]}>
            <Stack.Screen options={{ title: step === "result" ? "" : t("learn.lesson", { number: lesson.number }) }} />
            <ScrollView contentContainerStyle={[{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl }, step === "result" && styles.resultContainer]}>
                {step === "letters" ? (
                    <>
                        {lesson.words ? (
                            <>
                                <AppText muted>{lesson.level === 4 ? t("learn.level4Lesson4") : t("learn.level5Desc")}</AppText>
                                {lesson.words.map((word) => (
                                    <WordCard key={word.id} word={word} language={language} />
                                ))}
                            </>
                        ) : (
                            <>
                                <AppText muted>{t(`learn.level${lesson.level}Desc`)}</AppText>
                                {lesson.letters.map((letter) => (
                                    <LetterCard
                                        key={letter.id}
                                        letter={letter}
                                        language={language}
                                        fixedVowel={lesson.vowelKind}
                                        initialVowel={lesson.level === 2 ? "kasrah" : "fathah"}
                                        showForms={lesson.level === 3}
                                    />
                                ))}
                            </>
                        )}
                        <Button mode="contained" onPress={() => setStep("read")}>
                            {t("learn.toReading")}
                        </Button>
                    </>
                ) : step === "read" ? (
                    <>
                        <AppText muted>
                            {lesson.connectedWords ? t("learn.readConnectedIntro") : t("learn.readIntro")}
                        </AppText>
                        {lesson.connectedWords ? (
                            lesson.connectedWords.map((word) => (
                                <ConnectedWordCard key={word.id} word={word} language={language} />
                            ))
                        ) : lesson.words ? (
                            lesson.words.map((word) => (
                                <WordCard key={word.id} word={word} language={language} />
                            ))
                        ) : (
                            rows.map((row, index) => (
                                <ReadingRow
                                    key={`${seed}-${index}`}
                                    row={row}
                                    language={language}
                                    vowel={lesson.vowelKind ?? (lesson.level === 2 ? (index % 2 === 0 ? "kasrah" : "dammah") : "fathah")}
                                />
                            ))
                        )}
                        <Button mode="contained" onPress={() => setStep("quiz")}>
                            {t("learn.toQuiz")}
                        </Button>
                        <Button mode="text" onPress={() => setStep("letters")}>
                            {t("learn.backToLetters")}
                        </Button>
                    </>
                ) : step === "quiz" ? (
                    <>
                        <AppText variant="label" muted style={styles.center}>
                            {t("learn.questionOf", { current: questionIndex + 1, total: quiz.length })}
                        </AppText>
                        <Question key={`${seed}-${questionIndex}`} question={quiz[questionIndex]} language={language} onAnswer={answer} />
                    </>
                ) : (
                    <View style={[styles.resultBox, { gap: spacing.md }]}>
                        {passed ? (
                            <View style={styles.centerBox}>
                                <View style={[styles.congratsBadge, { backgroundColor: colors.brassSoft }]}>
                                    <Ionicons name="sparkles" size={38} color={colors.brass} />
                                </View>
                            </View>
                        ) : null}
                        <AppText variant="title" style={styles.center}>
                            {t("learn.lesson", { number: lesson.number })}
                        </AppText>
                        <AppText variant="display" style={styles.center}>
                            {t("learn.score", { correct, total: quiz.length })}
                        </AppText>
                        <AppText style={styles.center} muted>
                            {passed ? t("learn.passed") : t("learn.notPassed", { needed: Math.ceil(quiz.length * 0.8) })}
                        </AppText>
                        {passed && next ? (
                            <Button mode="contained" onPress={() => router.replace({ pathname: "/learn/[lesson]" as any, params: { lesson: next.id } })}>
                                {t("learn.nextLesson", { number: next.number })}
                            </Button>
                        ) : null}
                        {passed && !next ? <AppText variant="bodyStrong" style={styles.center}>{t("learn.levelDone")}</AppText> : null}
                        <Button mode={passed ? "outlined" : "contained"} onPress={retry}>
                            {t("learn.retry")}
                        </Button>
                        <Button mode="text" onPress={() => setStep("read")}>
                            {t("learn.practiseAgain")}
                        </Button>
                        <Button mode="text" onPress={() => router.back()}>
                            {t("learn.backToLessons")}
                        </Button>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    flex: { flex: 1 },
    center: { textAlign: "center" },
    centerBox: { alignItems: "center", justifyContent: "center" },
    centerRow: { justifyContent: "center" },
    resultContainer: { flexGrow: 1, justifyContent: "center", paddingBottom: 80 },
    resultBox: { width: "100%" },
    congratsBadge: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 4 },
    letterCard: {},
    letterRow: { flexDirection: "row", alignItems: "center" },
    // Amiri's marks sit high above the letter; the generous line height keeps the fathah from clipping.
    bigArabic: { fontSize: 88, lineHeight: 150, textAlign: "center", writingDirection: "rtl" },
    bareArabic: { fontSize: 34, lineHeight: 64, writingDirection: "rtl" },
    bigSound: { fontSize: 44, lineHeight: 56, fontWeight: "600" },
    promptBox: { alignItems: "center", justifyContent: "center", minHeight: 140 },
    readingRow: { flexDirection: "row-reverse", justifyContent: "center", flexWrap: "wrap" },
    syllable: { minWidth: 68, alignItems: "center", paddingHorizontal: 10, paddingBottom: 6, borderWidth: StyleSheet.hairlineWidth },
    rowArabic: { fontSize: 40, lineHeight: 80, writingDirection: "rtl" },
    options: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
    option: { width: "46%", minHeight: 84, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
    optionArabic: { fontSize: 44, lineHeight: 88, writingDirection: "rtl" },
    vowelTrack: { flexDirection: "row", padding: 3, gap: 4, marginVertical: 4 },
    vowelSegment: { flex: 1, alignItems: "center", paddingVertical: 6 },
    formsRow: { flexDirection: "row", gap: 6, justifyContent: "space-between" },
    formBox: { flex: 1, alignItems: "center", paddingVertical: 6, borderWidth: 1 },
    formArabic: { fontSize: 24, lineHeight: 40, writingDirection: "rtl" },
});
