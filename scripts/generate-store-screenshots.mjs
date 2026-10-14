// Generates App Store and Google Play screenshots for Wird in English and Indonesian.
// Captures live screens from the booted iOS Simulator, then frames them with
// localized headlines, subtitles, and Wird branding at 1290×2796 resolution.
//
// Run: node scripts/generate-store-screenshots.mjs
import { execSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const STORE_SRC = resolve(ROOT, "docs/store-src");
const STORE_ASSETS = resolve(ROOT, "docs/store-assets");
const RAW_DIR = resolve(STORE_ASSETS, "raw");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const run = (cmd) => {
    try {
        return execSync(cmd, { stdio: "pipe", encoding: "utf8" });
    } catch (e) {
        return e.stdout || "";
    }
};

const SCREENS = {
    en: [
        {
            id: "01-today",
            url: "wird://today",
            eyebrow: "Daily Habit",
            headline: "Your Daily Portion of the Quran",
            subtitle: "Keep up your reading streak, next prayer countdown, and daily ayah.",
        },
        {
            id: "02-mushaf",
            url: "wird://mushaf",
            eyebrow: "Madani Mushaf",
            headline: "Read Page by Page with Tajweed",
            subtitle: "Full 604-page Madani layout with justified lines and tajweed color guidance.",
        },
        {
            id: "03-reader",
            url: "wird://surah/1",
            eyebrow: "Reading & Tafsir",
            headline: "Word-by-Word & Deep Explanations",
            subtitle: "Tappable tajweed rules, transliteration, and authentic tafsir editions.",
        },
        {
            id: "04-reciters",
            url: "wird://reciters",
            eyebrow: "Audio Recitation",
            headline: "Listen to 27 World-Class Reciters",
            subtitle: "Per-ayah repeat, sleep timer, background audio, and offline downloads.",
        },
        {
            id: "05-prayer",
            url: "wird://prayer",
            eyebrow: "Prayer & Qibla",
            headline: "Accurate Prayer Times & Direction",
            subtitle: "Localized timetable with 8 calculation methods and smooth Qibla compass.",
        },
        {
            id: "06-adhkar",
            url: "wird://adhkar",
            eyebrow: "Remembrance",
            headline: "Calm Daily Adhkar & Duas",
            subtitle: "Morning, evening, and after-prayer adhkar with tactile progress counters.",
        },
        {
            id: "07-learn",
            url: "wird://learn",
            eyebrow: "Learn Arabic",
            headline: "Learn to Read Arabic from Scratch",
            subtitle: "A progressive primer with pronunciation audio and interactive quizzes.",
        },
    ],
    id: [
        {
            id: "01-today",
            url: "wird://today",
            eyebrow: "Kebiasaan Harian",
            headline: "Porsi Harian Al-Quran Anda",
            subtitle: "Jaga rangkaian membaca, hitung mundur salat, dan ayat pilihan hari ini.",
        },
        {
            id: "02-mushaf",
            url: "wird://mushaf",
            eyebrow: "Mushaf Madinah",
            headline: "Baca Halaman demi Halaman",
            subtitle: "604 halaman mushaf Madinah dengan teks rata dan panduan warna tajwid.",
        },
        {
            id: "03-reader",
            url: "wird://surah/1",
            eyebrow: "Membaca & Tafsir",
            headline: "Kata per Kata & Tafsir Lengkap",
            subtitle: "Sentuh hukum tajwid, transliterasi Latin, dan tafsir resmi Kemenag RI.",
        },
        {
            id: "04-reciters",
            url: "wird://reciters",
            eyebrow: "Audio Murottal",
            headline: "Dengarkan 27 Qari Terkemuka Dunia",
            subtitle: "Pengulangan per ayat, pewaktu tidur, audio latar, dan unduhan offline.",
        },
        {
            id: "05-prayer",
            url: "wird://prayer",
            eyebrow: "Salat & Kiblat",
            headline: "Jadwal Salat Akurat & Arah Kiblat",
            subtitle: "Waktu salat otomatis sesuai lokasi serta kompas kiblat yang akurat.",
        },
        {
            id: "06-adhkar",
            url: "wird://adhkar",
            eyebrow: "Zikir & Doa",
            headline: "Zikir Harian & Doa Berlandaskan Hadits",
            subtitle: "Zikir pagi, petang, dan setelah salat dengan penghitung taktil yang tenang.",
        },
        {
            id: "07-learn",
            url: "wird://learn",
            eyebrow: "Belajar Membaca",
            headline: "Belajar Membaca Al-Quran dari Awal",
            subtitle: "Metode bertahap dengan audio pengucapan makhraj dan kuis interaktif.",
        },
    ],
};

async function main() {
    console.log("=== Wird Store Screenshot Generator ===");

    // Ensure output directories exist
    for (const lang of ["en", "id"]) {
        mkdirSync(resolve(RAW_DIR, lang), { recursive: true });
        mkdirSync(resolve(STORE_ASSETS, lang), { recursive: true });
    }

    // Configure clean simulator status bar
    console.log("Configuring simulator status bar (9:41 AM, full battery, full wifi)...");
    run('xcrun simctl status_bar booted override --time "9:41" --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3');

    // Launch Playwright with Chrome
    console.log("Launching Chromium for high-res store framing...");
    const browser = await chromium.launch({ channel: "chrome" });
    const page = await browser.newPage({
        viewport: { width: 1290, height: 2796 },
        deviceScaleFactor: 1,
    });

    const cardTemplateUrl = pathToFileURL(resolve(STORE_SRC, "screenshot-card.html")).href;

    for (const lang of ["en", "id"]) {
        console.log(`\n--- Capturing screenshots for language: ${lang.toUpperCase()} ---`);

        // Set app language and dark theme via deep link
        run(`xcrun simctl openurl booted "wird://settings?lang=${lang}&theme=dark"`);
        await sleep(1500);

        const screens = SCREENS[lang];
        for (const screen of screens) {
            console.log(`[${lang}] Navigating to: ${screen.headline} (${screen.url})...`);
            run(`xcrun simctl openurl booted "${screen.url}"`);
            await sleep(2200);

            // Raw capture
            const rawPath = resolve(RAW_DIR, lang, `${screen.id}.png`);
            run(`xcrun simctl io booted screenshot "${rawPath}"`);

            // Framed App Store card
            const q = new URLSearchParams({
                e: screen.eyebrow,
                h: screen.headline,
                s: screen.subtitle,
                img: pathToFileURL(rawPath).href,
            });

            await page.goto(`${cardTemplateUrl}?${q.toString()}`);
            await page.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].map((img) => img.decode())]));

            const outPath = resolve(STORE_ASSETS, lang, `${screen.id}.png`);
            await page.screenshot({ path: outPath });
            console.log(`  ✓ Generated: docs/store-assets/${lang}/${screen.id}.png`);
        }
    }

    await browser.close();

    // Clean up status bar
    console.log("\nResetting simulator status bar...");
    run("xcrun simctl status_bar booted clear");

    console.log("\nAll 14 store screenshots (7 EN, 7 ID) successfully created in docs/store-assets/!");
}

main().catch((err) => {
    console.error("Error generating store screenshots:", err);
    process.exit(1);
});
