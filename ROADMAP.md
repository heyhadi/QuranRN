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

## Phase 1: Foundation and bug fixes
- [x] Upgrade Expo SDK 52 → 57 (React 19.2, React Native 0.86); move `expo-av` → `expo-audio`; migrate `@react-navigation/native` imports to `expo-router/react-navigation`
- [ ] Set up the development build (EAS / `expo prebuild`) and run on a device; MMKV 4 needs it
- [x] Remove unused dependencies (`react-native-mmkv-storage`, AsyncStorage, `@types/axios`, axios, `expo-web-browser`, `expo-sensors`, Google Fonts packages) and Expo template leftovers
- [x] Replace `react-native-qibla-finder` (stuck on React Native 0.74) with our own hook: `services/qibla.ts` + `components/useQiblaDirection.ts`
- [x] Typed API layer + mappers, TanStack Query with a cache saved to MMKV
- [x] Zustand stores saved to MMKV: bookmarks, settings, last-read (hifz/khatam progress stores come in Phase 5)
- [x] Pass the target ayah through the route (`/surah/[id]?ayah=N`) instead of `useSetAyahIndexStore`
- [x] Fix: bookmarks are keyed by ayah number only, so they collide across Surahs → key them by `surah:ayah`
- [x] Fix: bookmark icon doesn't update when tapped
- [x] Fix: a failed tafsir request breaks the Surah screen; fetch Surah and tafsir in parallel
- [x] Fix: three scroll effects disagree on the index (off-by-one); add `onScrollToIndexFailed`
- [x] Fix: audio keeps playing after leaving the screen; auto-advance uses stale state
- [x] Fix: the modal is passed a string instead of a boolean; tafsir text can't scroll; `console.log` on every search keystroke
- [x] Jest tests for stores, mappers, search, HTTP and Qibla maths (tajweed parser tests come with the parser in Phase 4)

## Phase 2: Design system and redesign
- [ ] Theme tokens (colour, spacing, type), light/dark, connected to the Paper theme
- [ ] Home: "Continue reading" card, Surah / Juz tabs, search by name, meaning or number
- [ ] Reader: ornamental ayah markers, adjustable Arabic size, translation on/off, ayah action menu
- [ ] Bookmarks: Arabic preview, swipe to delete
- [ ] i18n: `i18next` + `expo-localization`, follow the device language; move every hard-coded string into `locales/{id,en}.json`. The existing UI mixes "Ayat" and "Ayah"; translate it consistently
- [ ] Settings screen: app language, translation edition (per language), tafsir edition, theme, font size, reciter, tajweed on/off, word-by-word on/off, transliteration on/off

## Phase 3: Audio
- [ ] Global audio player + mini-player bar above the tabs (keeps playing across screens)
- [ ] **Reciter library.** All need per-ayah files (needed for ayah highlighting, repeat and hifz mode). One `reciters.ts` catalogue maps each reciter to a URL template, so adding one is a single entry:

| Reciter | Style | Source |
|---|---|---|
| Mishary Rashid Alafasy | Murattal | equran 05 / quran.com 7 |
| Abdurrahman As-Sudais | Murattal | equran 03 / quran.com 3 |
| Yasser Al-Dosari | Murattal | equran 06 / everyayah |
| Maher Al-Muaiqly | Murattal | everyayah |
| Saud Ash-Shuraym | Murattal | quran.com 10 / everyayah |
| Abdul Basit Abdus Samad | Murattal **and** Mujawwad | quran.com 2 / 1 |
| Mahmoud Khalil Al-Husary | Murattal, Mujawwad, **Muallim** (teaching pace: good for tajweed and hifz) | quran.com 6 / 12 |
| Mohamed Siddiq Al-Minshawi | Murattal and Mujawwad | quran.com 9 / 8 |
| Nasser Al-Qatami | Murattal | everyayah |
| Ahmed Al-Ajamy | Murattal | everyayah |
| Saad Al-Ghamdi | Murattal | everyayah |
| Abu Bakr Ash-Shatri | Murattal | quran.com 4 |
| Hani Ar-Rifai | Murattal | quran.com 5 |
| Salah Al-Budair, Fares Abbad, Muhammad Jibreel, Ibrahim Al-Akhdar, Abdullah Basfar, Ali Al-Hudhaify | Murattal | everyayah |
| Abdullah Al-Juhany, Abdul Muhsin Al-Qasim, Ibrahim Al-Dossari | Murattal | equran 01 / 02 / 04 |
| **Basfar + Ibrahim Walk** | Arabic followed by **English audio translation** | everyayah `MultiLanguage/Basfar_Walk_192kbps` |

  Before adding each one: confirm its files exist for all 6,236 ayahs (test the first and last ayah of every Surah; Abdul Basit Mujawwad on everyayah timed out in testing, so use quran.com's copy). Islam Sobhi is popular but I found no per-ayah source; add him only if one turns up (full-Surah playback only otherwise).
- [ ] Reciter picker: photo, name, style chip (Murattal/Mujawwad/Muallim), 10-second sample of Al-Fatihah, favourite reciters at the top
- [ ] Switching reciters mid-Surah continues from the current ayah
- [ ] Optional different reciter for hifz mode (e.g. Husary Muallim) than for normal listening
- [ ] Audio quality setting (low on mobile data / high on Wi-Fi) where the source offers several bitrates
- [ ] Next/previous, repeat, playback speed
- [ ] Background playback + lock-screen controls
- [ ] Sleep timer
- [ ] Download a Surah's audio for offline listening

## Phase 4: Reading depth
- [ ] **English translation:** load the chosen quran.com translation when the language is English; render the `<sup foot_note=…>` markers as tappable footnotes (fetched from `/foot_notes/{id}`), not raw tags
- [ ] **Tajweed colouring:** parse `<tajweed class=…>` into coloured `<Text>` spans; legend sheet explaining each rule in ID and EN (ghunnah, ikhfa, ikhfa shafawi, idgham ±ghunnah, idgham shafawi/mutajanisayn, iqlab, qalqalah, madd normal/permissible/obligatory/necessary, hamzat wasl, lam shamsiyah, silent). Tapping a coloured letter shows that rule's name and a short explanation in the user's language
- [ ] **Tajweed learning cards:** one card per rule (ID/EN) with what it is, how to pronounce it, an example ayah with that rule highlighted, and the example's audio
- [ ] **Tafsir upgrade:** bottom sheet with a tafsir picker grouped by language (ID: Kemenag; EN: Ibn Kathir, Ma'arif, Tazkirul; AR: Muyassar, Sa'di, Tabari…), defaults to the app language, remembers the choice, shows HTML formatting properly
- [ ] **Word-by-word:** tap a word → transliteration + meaning in the app language + play that word's audio
- [ ] **Transliteration line** under the Arabic text (optional), for readers who don't read Arabic script yet
- [ ] Notes on ayahs, bookmark collections (named, coloured)
- [ ] Search inside ayah text and translations (over the cached data)
- [ ] Mushaf page mode (604 Madani pages); needs page-specific fonts, so this is a stretch goal

## Phase 5: Habits
- [ ] **Hifz mode:** repeat an ayah/range N times with a gap, blur/hide text with tap-to-reveal, mark ayahs memorized, progress per Surah/Juz
- [ ] **Khatam planner:** pick a target number of days → daily portion, streak, Juz progress
- [ ] Daily ayah notification
- [ ] Home-screen widgets (ayah of the day, continue reading); iOS needs `expo-apple-targets`

## Phase 6: Worship tools
- [ ] Prayer times (location-based) + adhan notifications
- [ ] Qibla: location-permission handling, custom compass using `expo-sensors` + `expo-location`
- [ ] Morning/evening adhkar (ID + EN translation and transliteration) + tasbih counter (vibration feedback, saved counts)
- [ ] Doa collection: equran `/api/doa` for ID, bundled Hisnul Muslim for EN; Asmaul Husna with ID and EN meanings
- [ ] Hijri date, Ramadan mode (imsak/iftar times, event reminders)

## Phase 7: Sharing and polish
- [ ] Share an ayah as an image (`react-native-view-shot`), copy/share as text
- [ ] Accessibility: screen-reader labels (both languages), system font scaling
- [ ] Store listing in ID and EN
- [ ] App icon, splash screen, store listing

## Later (not planned now)
- Cloud sync / accounts
- AI-generated tafsir; if ever added, quote real tafsir text with its source named
