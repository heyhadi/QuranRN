# Home-Screen Widgets Architecture

Wird home-screen widgets are designed to support both iOS (WidgetKit / SwiftUI) and Android (`AppWidgetProvider` / RemoteViews), sharing the calm, ornate aesthetics of the app.

## 1. Widget Types

### A. Next Prayer Widget (Small & Medium)
- **Small (2×2):**
  - Next prayer name in bold Arabic and Latin (e.g. "Dhuhr / الظهر")
  - Time of prayer (e.g. "12:56")
  - Relative countdown (e.g. "in 35 min" / "dalam 35 mnt")
  - City / Location name
  - Background: Emerald mushaf gradient (`#126B54` to `#082F25`) with gold border.
- **Medium (4×2):**
  - Same as small on left side.
  - Right side: Full 5-prayer timetable with past prayers dimmed and upcoming prayer highlighted with gold indicator diamond (`◆`).

### B. Daily Ayah Widget (Medium & Large)
- **Medium (4×2):**
  - Daily ayah in Arabic calligraphy (Amiri font).
  - Translation in device language (English Saheeh International / Indonesian Kemenag).
  - Surah reference chip (e.g. "Al-'Asr 103:3").
- **Large (4×4):**
  - Longer Quranic passage with full calligraphy box and footnote/context.

### C. Khatam Streak & Progress (Small)
- Current streak count with flame icon (`🔥 14 days`).
- Daily reading goal progress ring / bar (e.g. `4 / 4 pages read today`).
- Days remaining in current Khatam plan.

---

## 2. Shared Data Bridge

Widgets run outside the main React Native process and cannot execute the JavaScript bundle on every tick.
Communication uses shared persistent storage:

```
[ React Native App (Wird) ]
          │
          ▼  services/widgets.ts
   [ Shared Storage ]
    ├── iOS: App Group UserDefaults ("group.com.heyhadi.wird")
    └── Android: SharedPreferences ("wird_widget_prefs")
          │
    ┌─────┴────────────────┐
    ▼                      ▼
[ iOS WidgetKit ]     [ Android AppWidget ]
(SwiftUI Views)       (RemoteViews / Glance)
```

The app updates the payload whenever:
1. The app launches or returns to the foreground.
2. Prayer times are recalculated (location change or new day).
3. Ayahs or pages are marked as read in Khatam / Mushaf mode.
4. The user changes language or theme preferences.

Payload format (`WIDGET_STORAGE_KEY = "wird_widgets_payload"`):
```json
{
  "updatedAt": 1728900000000,
  "language": "en",
  "prayer": {
    "nextPrayerName": "Dhuhr",
    "nextPrayerTime": "12:56",
    "nextPrayerTimestamp": 1728910000000,
    "locationName": "Jakarta",
    "schedule": [
      { "name": "Fajr", "time": "04:30", "isNext": false },
      { "name": "Dhuhr", "time": "12:56", "isNext": true },
      { "name": "Asr", "time": "16:06", "isNext": false },
      { "name": "Maghrib", "time": "18:33", "isNext": false },
      { "name": "Isha", "time": "20:00", "isNext": false }
    ]
  },
  "dailyAyah": {
    "surahNumber": 103,
    "ayahNumber": 3,
    "surahName": "Al-'Asr",
    "textArabic": "إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ",
    "translation": "Except for those who have believed and done righteous deeds"
  },
  "khatam": {
    "streakDays": 5,
    "todayPages": 2,
    "targetPages": 4,
    "percentComplete": 50,
    "daysRemaining": 25
  }
}
```

---

## 3. iOS Implementation (WidgetKit)

- **Target:** `WirdWidgetExtension`
- **Capabilities:** App Groups (`group.com.heyhadi.wird`)
- **Swift Source:**
  - `WirdWidgetBundle.swift`: Registers `PrayerWidget`, `DailyAyahWidget`, `KhatamWidget`.
  - `PrayerTimelineProvider.swift`: Generates timeline entries for each upcoming prayer until midnight.
  - `PrayerWidgetView.swift`: SwiftUI views using `ContainerRelativeShape()`, custom Reem Kufi / Amiri fonts, and emerald gradient.
- **Deep Linking:**
  - Tapping prayer widget opens `wird://prayer`.
  - Tapping daily ayah widget opens `wird://surah/{surahNumber}?ayah={ayahNumber}`.
  - Tapping khatam widget opens `wird://khatam`.

---

## 4. Android Implementation (`AppWidgetProvider`)

- **Receiver:** `WirdPrayerWidgetReceiver` in `AndroidManifest.xml` with `<intent-filter>` for `android.appwidget.action.APPWIDGET_UPDATE`.
- **Layouts:**
  - `res/xml/prayer_widget_info.xml`
  - `res/layout/widget_prayer_small.xml`
  - `res/layout/widget_prayer_medium.xml`
- **Update Mechanism:**
  - `AlarmManager` or `WorkManager` triggers `onUpdate` at prayer transition timestamps.
  - `PendingIntent` triggers deep links `wird://prayer` on click.
