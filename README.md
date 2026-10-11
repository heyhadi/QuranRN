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
| **Read all 114 Surahs.** Arabic in the Amiri Quran typeface, with the Indonesian translation from Kemenag under every ayah. | **Listen ayah by ayah.** Tap play on any ayah; recitation continues to the next one and the list follows along. Tap again to stop. |
| **Tafsir for every ayah.** The Kemenag tafsir opens in a scrollable sheet. If it fails to load, the Surah still opens and the sheet offers a retry. | **Bookmarks that stay.** Bookmark any ayah; bookmarks are saved on the device and jump straight back to the ayah. Long-press to remove. |
| **Continue reading.** The home screen remembers the last ayah you were reading and takes you back to it. | **Search.** Find a Surah by Latin name (`al baqarah`, `alkahf`), meaning (`gua`) or number (`18`). |
| **Works offline.** Every Surah you open is cached on the device for four weeks, so it opens again without a connection. | **Qibla compass.** The direction to the Kaaba from where you are, with the phone's own compass heading. |

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
- Tests cover the API mappers, search, the HTTP client, Qibla maths, bookmarks and the audio player.
  Mapper tests run against trimmed copies of real equran.id responses
  (`services/__tests__/fixtures/`).
- `node scripts/readme-images.mjs` regenerates the README images from the design mockups in
  `docs/quranrn-plan.html`, using your installed Chrome.

## Coming next

Phase 1 (upgrade, data layer, bug fixes) is done. Next, in order (details in [ROADMAP.md](ROADMAP.md)):

1. ~~Foundation and bug fixes~~
2. Redesign: mushaf green and brass theme, dark mode, Indonesian and English throughout
3. Audio: about 25 reciters, a mini-player that keeps playing across screens, lock-screen controls
4. Reading depth: tajweed colouring with rule explanations, word-by-word meaning, more tafsirs
5. Habits: hifz (memorisation) mode, khatam planner and streaks, daily ayah, widgets
6. Worship tools: prayer times, adhkar, doa, tasbih
7. Sharing and polish: share an ayah as an image, accessibility

![Tajweed colours you can tap, and word-by-word meaning](docs/images/2-tajweed-you-can-tap.png)

![Hifz mode and the reciter library](docs/images/3-memorise-and-listen.png)

![Prayer times, Qibla and tasbih](docs/images/4-prayer-qibla-tasbih.png)

These are design mockups from the plan; the Quran text and tajweed markup in them are real (quran.com),
and the prayer times are sample data.

## Known limits

- Indonesian only for now; English arrives with the redesign.
- One reciter (Abdullah Al-Juhany); the reciter picker comes in the audio phase.
- Audio stops when the app goes to the background or the phone locks.
- A Surah needs a connection the first time it is opened.
- The Qibla compass needs a real device; simulators have no compass.

## Credits

- Quran text, Indonesian translation and tafsir (Kemenag RI) and recitation audio via [equran.id](https://equran.id).
- [Amiri Quran](https://github.com/aliftype/amiri) typeface by Khaled Hosny, under the SIL Open Font License.

---

© 2026 Munawirul Hadi. All rights reserved. The source is public to read; it is not licensed for reuse.
