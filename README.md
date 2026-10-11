<p align="center">
  <img src="docs/images/icon.png" width="84" alt="Wird icon">
</p>

<h1 align="center">Wird</h1>

<p align="center">
  <strong>Your daily portion of the Quran.</strong><br>
  A Quran reader for iOS and Android: Arabic text with Indonesian translation and tafsir,
  ayah-by-ayah recitation, bookmarks, and a Qibla compass. Surahs you have read stay available offline.
</p>

<p align="center">
  <a href="#what-it-does">Features</a> ·
  <a href="#how-it-works">How it works</a> ·
  <a href="#development">Development</a> ·
  <a href="#coming-next">Coming next</a> ·
  <a href="ROADMAP.md">Roadmap</a>
</p>

![Wird: home, reader with tajweed colours, and word-by-word meaning](docs/images/1-your-daily-portion.png)

<p align="center"><sub>Design preview of the redesign in progress. What the app does today is listed under <a href="#what-it-does">What it does</a>.</sub></p>

*Wird* (وِرْد) is the portion of Quran a person keeps up every day. This is a personal project.

## What it does

|  |  |
|---|---|
| **Read all 114 Surahs.** Arabic in the Amiri typeface with the translation under every ayah: Kemenag in Indonesian, or one of six English editions with tappable footnotes. | **Tajweed you can tap.** Every rule in its own colour. Tap a letter to see the rule and how to say it, or open the learning screen for a real example of each rule that you can hear. |
| **Word by word.** Tap any ayah for each word's transliteration and meaning, and hear the word. | **Tafsir.** Eight editions: Kemenag, Ibn Kathir, Ma'arif al-Qur'an, Tazkirul Quran, Muyassar, As-Sa'di, At-Tabari and Al-Qurtubi. |
| **27 reciters.** Per-ayah audio with a mini-player that keeps going while you browse. Repeat, loop, speed, sleep timer, lock-screen controls, and download a Surah to listen offline. | **Hifz mode.** Repeat an ayah or range, hide the text and tap to check yourself, practise with Husary's slow teaching recitation, and mark ayahs memorized. |
| **Khatam planner.** Finish the Quran in 30 to 180 days, with a daily goal, a streak and a map of the 30 Juz. | **Prayer times.** By location with MUIS, Kemenag, JAKIM and five other methods, a countdown to the next prayer, reminders, and a Qibla compass. Saved for offline use. |
| **Notes and collections.** Write a note on any ayah and file bookmarks into coloured collections. | **Search.** By Surah name, meaning or number, by Juz, or every ayah by meaning. |
| **Adhkar, dua, Asmaul Husna and tasbih.** Morning, evening and after-prayer adhkar with counters, everyday dua with hadith sources, the 99 names, and a counter that vibrates at 33, 66 and 99. | **Indonesian and English**, light and dark. Surahs you have read open again without a connection. |

## How it works

**Data.** Quran text, translation, tafsir and per-ayah audio come from the [equran.id](https://equran.id) v2 API.
Screens never see the raw responses: `services/mappers.ts` turns them into the app's own types
(`services/types.ts`), so a change in the API is fixed in one place. Requests go through a small
`fetch` wrapper with a timeout and typed errors (`services/http.ts`).

**Offline.** Data is fetched with TanStack Query. Quran text and tafsir never change, so cached
entries never go stale, and the whole query cache is saved to MMKV with the sync persister. A Surah
opened once opens again without a network.

**Saved state.** Bookmarks, the last-read position and settings are small zustand stores saved to
MMKV (`store/`). A bookmark is keyed by Surah *and* ayah (`2:255`), so ayah 5 of one Surah is never
confused with ayah 5 of another.

**Audio.** One `expo-audio` player serves the whole app (`store/audioPlayer.ts`). When an ayah
finishes, the player reads the queue and position from the store at that moment, rather than from a
closure captured when playback started, so auto-advance always moves to the right ayah. Leaving a
Surah stops playback.

**Jumping to an ayah.** Bookmarks and Continue reading open `/surah/[id]?ayah=N`. Ayah cards have
different heights, so the list can't always scroll to a row it hasn't measured yet; when that
happens it jumps close by estimate and retries.

**Qibla.** The bearing to the Kaaba is the initial great-circle bearing from your position
(`services/qibla.ts`, tested against known values for Singapore, Jakarta, London and New York). The
heading comes from the operating system's compass through `expo-location`, which already corrects
for tilt and magnetic declination, so no raw magnetometer maths is needed.

## Development

Wird uses native modules (MMKV, `expo-audio`), so it runs as an Expo **development build**, not in
Expo Go.

```sh
npm install
npm run ios                       # build and open in the iOS Simulator (needs Xcode)
npm run android                   # build and open on an Android emulator or device (needs Android Studio)
npx expo start                    # after the first build: start Metro and live-reload as usual
npm run test:ci                   # unit tests (Jest)
npm run typecheck
npm run build:android:preview     # Android APK built in the cloud with EAS
```

- Stack: Expo SDK 57, React Native 0.86, React 19, Expo Router, TanStack Query, zustand, MMKV,
  react-native-paper.
- `ios/` and `android/` are generated from `app.json` by `expo prebuild` and are not committed.
- Tests cover the API mappers, the tajweed and rich-text parsers, search, Qibla maths, prayer times and time zones, reminder planning, khatam maths, and every store. Fixtures are trimmed copies of real API responses.
  Mapper tests run against trimmed copies of real equran.id responses
  (`services/__tests__/fixtures/`).
- `node scripts/readme-images.mjs` regenerates the README images from the design mockups in
  `docs/quranrn-plan.html`, using your installed Chrome.

## Coming next

Phases 1 to 6 of [ROADMAP.md](ROADMAP.md) are built. Still to do:

1. Home-screen widgets
2. Mushaf page mode
3. Share an ayah as an image, accessibility pass, store listing

![Tajweed colours you can tap, and word-by-word meaning](docs/images/2-tajweed-you-can-tap.png)

![Hifz mode and the reciter library](docs/images/3-memorise-and-listen.png)

![Prayer times, Qibla and tasbih](docs/images/4-prayer-qibla-tasbih.png)

These images are design mockups; the Quran text and tajweed markup in them are real (quran.com), and the
prayer times are sample data. The app itself now follows them closely.

## Known limits

- Indonesian doa come from equran.id (227); the English dua list is the smaller bundled set (46). The Asmaul Husna meanings are in English.
- A Surah needs a connection the first time it is opened, and tajweed colours, English translations,
  word-by-word and the other tafsirs need one the first time each is used.
- Background audio and lock-screen controls are set up but still need to be checked on a real phone.
- Ayah search by meaning always needs a connection.
- The Qibla compass needs a real device; simulators have no compass.

## Credits

- Quran text, Indonesian translation, Kemenag tafsir and doa via [equran.id](https://equran.id).
- Adhkar and English dua from [fitrahive/dua-dhikr](https://github.com/fitrahive/dua-dhikr) (MIT), bundled in `constants/adhkar/`.
- English translations, tajweed text, word-by-word, other tafsirs and ayah search via [quran.com](https://quran.com); more recitations from [everyayah.com](https://everyayah.com); prayer times and Asmaul Husna from [aladhan.com](https://aladhan.com).
- [Amiri](https://github.com/aliftype/amiri) typeface by Khaled Hosny, [Reem Kufi](https://github.com/aliftype/reem-kufi) and [Source Sans 3](https://github.com/adobe-fonts/source-sans), all under the SIL Open Font License.

---

© 2026 Munawirul Hadi. All rights reserved. The source is public to read; it is not licensed for reuse.
