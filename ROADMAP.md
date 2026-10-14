# Wird Roadmap

Wird (وِرْد): the portion of Quran you keep up every day. Store name "Wird Quran", subtitle "Quran, Tajweed & Hifz" / "Al-Quran, Tajwid & Hafalan". Before release: check the stores directly, trademarks (PDKI, USPTO) and domains.

## Decisions

- **Build type:** Expo development build (not Expo Go). Widgets, background audio with lock-screen controls, MMKV and offline audio downloads all need native modules.
- **Language:** fully bilingual, Indonesian and English. The app follows the device language (switchable in Settings), and every feature works in both, including the tajweed legend, word-by-word, tafsir, transliteration, adhkar/doa and notifications. No screen is Indonesian-only.

| Content | Indonesian | English |
|---|---|---|
| UI text | `locales/id.json` | `locales/en.json` |
| Ayah translation | equran (Kemenag) | quran.com: Saheeh International (20, default), Abdel Haleem (85), Yusuf Ali (22), Pickthall (19), Usmani (84), Hilali-Khan (203) |
| Tafsir | equran (Kemenag) | quran.com: Ibn Kathir abridged (169), Ma'arif al-Qur'an (168), Tazkirul Quran (817) |
| Word-by-word meaning | quran.com `language=id` | quran.com `language=en` |
| Transliteration | quran.com per-word (Latin script, same for both) | same |
| Tajweed rule names + explanations | written by us (`content/tajweed.id.json`) | written by us (`content/tajweed.en.json`) |
| Doa / adhkar | equran `/api/doa` | bundled fitrahive/dua-dhikr (MIT), with English translations |
| Hijri months, prayer names | localized strings | localized strings |
- **Data sources:**

| Source | Used for |
|---|---|
| `equran.id/api/v2` | Surah list, Indonesian translation, Kemenag tafsir, 5 reciters' audio, doa |
| `api.quran.com/api/v4` (no API key needed) | Tajweed markup (`text_uthmani_tajweed`), word-by-word (with `language=id`), per-word audio, extra tafsirs (Ibn Kathir, Ma'arif, Muyassar, Sa'di, Tabari, Qurtubi…), Juz/page/hizb metadata |
| `everyayah.com/data/{reciter}/{SSSAAA}.mp3` | Per-ayah audio for reciters not on equran/quran.com (Maher Al-Muaiqly, Al-Qatami, Ghamdi, Ajamy, Budair…) and Basfar + English audio translation |
| `api.aladhan.com` | Prayer times, Hijri date |

Everything goes through `services/`, which turns each response into the app's own types, so screens never see raw API shapes. Responses are cached so reading works offline.

---

## Phase 1: Foundation and bug fixes (done)
- [x] Expo SDK 57 (React 19.2, React Native 0.86), `expo-audio`, `expo-router/react-navigation`
- [x] Development build runs on the iOS Simulator and as an Android APK built with EAS; MMKV 4 and `expo-audio` need it. Still to try on a physical iPhone
- [x] Unused packages and Expo template leftovers removed; `react-native-qibla-finder` replaced by `services/qibla.ts` + `components/useQiblaDirection.ts`
- [x] Typed API layer and mappers, TanStack Query with the cache saved to MMKV; Zustand stores saved to MMKV
- [x] Target ayah passed through the route; bookmark, scroll, audio, tafsir-modal and search fixes
- [x] Jest tests throughout (see `npm run test:ci`)

## Phase 2: Design system and redesign (done)
- [x] Theme tokens, light/dark/system, wired into Paper and navigation (`constants/theme.ts`)
- [x] Fonts: Reem Kufi, Source Sans 3 and Amiri (Amiri Quran was dropped: it is a colour font that paints vowel marks)
- [x] i18n (Indonesian and English): every string in `locales/*.json`, with a test that both files have the same keys
- [x] Home: greeting with Hijri date, Continue reading, Khatam and Hifz tiles, search by name, meaning or number, Surah / Juz / Ayat modes
- [x] Reader: mushaf-style title plate, star ayah markers, adjustable Arabic size, translation and transliteration on/off, bottom sheets
- [x] Saved: Arabic preview, notes, collections filter, swipe to remove
- [x] Settings: theme, language, Arabic size, translation and tafsir editions, tajweed, reciter

## Phase 3: Audio (done, except the items below)
- [x] Global player and mini-player above the tabs and on the reader
- [x] Reciter library: 27 reciters with per-ayah audio, picker with search, style filters, favourites and samples (`constants/reciters.ts`)
- [x] Switching reciter mid-Surah keeps the place; separate practice reciter for hifz (Husary Muallim)
- [x] Next/previous, repeat each ayah, loop the Surah, playback speed, sleep timer
- [x] Background playback and lock-screen controls (configured; **to be checked on a real device**)
- [x] Download a Surah for offline listening
- [x] Audio quality setting: a data saver that streams and downloads the smaller files (half the size or less) for the 11 of 27 reciters that offer one on everyayah.com, each checked against the first and last ayah and by file size. The others stay as they are
- Not found: Islam Sobhi (no per-ayah source)

## Phase 4: Reading depth (done)
- [x] English translations (6 editions) with tappable footnotes
- [x] Tajweed colouring for all 17 rules in the data, tap a letter for the rule, legend, and a learning screen with a real example ayah you can hear
- [x] Tafsir sheet with 8 editions (Kemenag, Ibn Kathir, Ma'arif, Tazkirul, Muyassar, Sa'di, Tabari, Qurtubi)
- [x] Word-by-word with transliteration, meaning and per-word audio
- [x] Optional transliteration line, notes on ayahs, bookmark collections
- [x] Search every ayah by meaning (needs a connection)
- [x] Mushaf page mode: all 604 Madani pages rebuilt from quran.com's line data (justified lines, Surah title banners, bismillah, ayah-end circles), tajweed colours with tap-for-rule, page jump and Surah list, reads count toward Khatam, page width capped for tablets. Tapping a word opens the ayah in the reader

## Phase 5: Habits (done, except widgets)
- [x] Hifz mode: range, repeat 1/3/5/10, pause, practice reciter, hide and tap to reveal, mark memorized, overview
- [x] Khatam planner: 30/60/90/180 days, daily goal, streak, progress by Juz, new round
- [x] Daily ayah and khatam reminders
- [ ] Home-screen widgets: need `expo-apple-targets` and native work; not started

## Phase 6: Worship tools (done)
- [x] Prayer times by location (MUIS, Kemenag, JAKIM and five more methods), next prayer countdown, adhan reminders, saved for offline use
- [x] Qibla compass, inside the Prayer tab
- [x] Doa (equran.id, Indonesian), Asmaul Husna (99 names, English meanings), tasbih with haptics
- [x] Solar and Hijri dates on Home and Today
- [x] Morning, evening and after-prayer adhkar with daily counters, and English dua (bundled from fitrahive/dua-dhikr, MIT, each with its hadith source)
- [x] Today tab: next prayer, daily reading goal, ayah of the day, adhkar, hifz and tasbih
- [x] Ramadan mode: imsak and iftar countdown on Today, suhoor and iftar reminders (Umm al-Qura calendar)

## Phase 7: Sharing and polish (done, except store screenshots)
- [x] Share an ayah as an image (`react-native-view-shot`) or as text
- [x] Accessibility: every control has a role and a label or visible text, system font scaling is capped per text style so layouts hold (a screen-reader pass on a device is still to do)
- [x] Store listing copy in ID and EN (`docs/store-listing.md`)
- [x] App icon, splash and Android notification icon from one mark (`scripts/app-icons.mjs`)
- [x] Mushaf-plate cards and framed Surah title; dark theme and transliteration on by default
- [x] Audio data saver (smaller files for 11 of 27 reciters), loading spinner while an ayah streams
- [x] Feedback in Settings: email and GitHub issue, with only the app version, system and language attached
- [ ] Store screenshots in ID and EN

## Phase 8: Mushaf (done)
- [x] Mushaf page mode (see Phase 4) with a framed Surah title plate with star finials, tajweed colours and a screen title naming every Surah on the page

## Phase 9: Android, tablets and audio cache (done, needs device checks)
- [x] Coloured tajweed no longer falls apart on Android: letters keep their marks and stay joined across colour runs; nested tajweed rules are read correctly
- [x] Arabic text no longer clipped at larger sizes on Android (rows kept attached and re-measured; Quran text ignores the phone's font scale)
- [x] Next two ayahs fetched while one plays, kept in a 150 MB cache; cache size and Clear in Settings
- [x] Tablet layout: centred column, sheets capped, landscape on tablets only, two-page mushaf spread
- [x] Android notification icon (white star silhouette) instead of a square
- [x] Development build profile for live testing on a phone; arm64-only Android builds and a rising version code; the build commit shown in Settings
- [ ] Check on real devices: reminders, lock-screen audio card, share-as-image, iPad landscape and the mushaf spread
- [ ] Softer look for the Adhkar and dua cards

## Phase 10: Learn to Read / Belajar Membaca (level 1 built, needs audio and review)
A beginner course for reading Arabic, taught the way the classic primers do it (a few letters at a time, read in rows), with our own lessons and name. It does not use the Iqro brand or copy any book's pages.
- [x] Level 1: the 28 letters with fathah in 7 lessons of 4. Meet each letter, read mixed rows right to left (tap to check), then an 8-question quiz; 80% finishes a lesson. Progress saved per lesson; entry on the More tab
- [x] Quiz distractors favour look-alike letters; no two options spelled the same; no letter asked twice in a row
- [x] Development builds install next to the release app as "Wird Dev" (`APP_VARIANT=development`), so testing a branch on a phone keeps the release app's data
- [ ] **Audio:** record the syllables with a qualified reciter (28 fathah clips first, then kasrah/dammah and letter names: about 116 clips, WAV 48 kHz mono, delivered as AAC/MP3), with a signed release and an open licence (CC BY 4.0 or CC0). Drop them into `assets/audio/learn/` and `services/learnReadAudio.ts`; play buttons appear on their own. No openly licensed set was clean enough: the closest is Ruaa GHAREEB's Wikimedia Commons clips (CC BY-SA 4.0, fathah only, unknown reciter), usable only after a teacher listens to all of them
- [ ] **Review by a teacher (ustadz/ustadzah):** letter order (Indonesian classes put و before ه), Latin spellings for both languages, alif's fathah written on hamzah (أَ), and the lesson wording
- [ ] Level 2: kasrah and dammah. Level 3: joined letters (start, middle, end forms; needs the Android shaping care from Phase 9). Then tanwin, sukun and shaddah, mad, and reading real Quran words with quran.com's word audio

## Later (not planned now)
- Cloud sync / accounts
- AI-generated tafsir; if ever added, quote real tafsir text with its source named
