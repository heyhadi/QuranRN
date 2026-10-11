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
| Doa / adhkar | equran `/api/doa` | bundled Hisnul Muslim content (equran doa is Indonesian-only) |
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
- [ ] Audio quality setting: every reciter has one fixed bitrate for now
- Not found: Islam Sobhi (no per-ayah source)

## Phase 4: Reading depth (done, except mushaf mode)
- [x] English translations (6 editions) with tappable footnotes
- [x] Tajweed colouring for all 17 rules in the data, tap a letter for the rule, legend, and a learning screen with a real example ayah you can hear
- [x] Tafsir sheet with 8 editions (Kemenag, Ibn Kathir, Ma'arif, Tazkirul, Muyassar, Sa'di, Tabari, Qurtubi)
- [x] Word-by-word with transliteration, meaning and per-word audio
- [x] Optional transliteration line, notes on ayahs, bookmark collections
- [x] Search every ayah by meaning (needs a connection)
- [ ] Mushaf page mode (604 Madani pages): stretch goal, needs page fonts

## Phase 5: Habits (done, except widgets)
- [x] Hifz mode: range, repeat 1/3/5/10, pause, practice reciter, hide and tap to reveal, mark memorized, overview
- [x] Khatam planner: 30/60/90/180 days, daily goal, streak, progress by Juz, new round
- [x] Daily ayah and khatam reminders
- [ ] Home-screen widgets: need `expo-apple-targets` and native work; not started

## Phase 6: Worship tools (done, except adhkar)
- [x] Prayer times by location (MUIS, Kemenag, JAKIM and five more methods), next prayer countdown, adhan reminders, saved for offline use
- [x] Qibla compass, inside the Prayer tab
- [x] Doa (equran.id, Indonesian), Asmaul Husna (99 names, English meanings), tasbih with haptics
- [x] Hijri date on Home
- [ ] Morning/evening adhkar: not included, no verified source for the texts yet. Doa have Indonesian meanings only; English doa translations need a source I can verify
- [ ] Ramadan mode (imsak/iftar reminders): imsak time is fetched; the mode itself is not built

## Phase 7: Sharing and polish
- [ ] Share an ayah as an image (`react-native-view-shot`), copy/share as text
- [ ] Accessibility: screen-reader labels (both languages), system font scaling
- [ ] Store listing in ID and EN
- [ ] App icon, splash screen, store listing

## Later (not planned now)
- Cloud sync / accounts
- AI-generated tafsir; if ever added, quote real tafsir text with its source named
