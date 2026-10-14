# Real Device Verification & Runbook

This runbook guides verification of native features on physical iOS and Android devices, as well as tablet spreads.

---

## 1. iPad Landscape & Mushaf Spread

### Verified in Simulator:
- [x] iPad 10th generation rotated to landscape displays the two-page spread side-by-side (`services/mushafLayout.ts`).
- [x] Page 1 (Al-Fatihah) sits on the right, Page 2 (Al-Baqarah) sits on the left, matching traditional printed Quran orientation.
- [x] Header plates with finials, tajweed color markers, and ayah end numbers scale smoothly.
- [x] Navigation bar title reflects both pages (`Al-Fatihah - Al-Baqarah`).

### Physical Tablet Check:
1. Turn physical iPad/tablet to landscape mode.
2. Verify smooth rotation without jitter or broken font baseline.
3. Tap on an ayah word in either page: it should open the ayah in the Surah reader sheet.
4. Swipe right-to-left to turn pages forward: Page 3 and Page 4 should appear side-by-side.

---

## 2. Lock-Screen Audio Controls & Background Recitation

### Verification Steps:
1. Open any Surah (e.g. Al-Fatihah or Al-Mulk).
2. Tap the Play button on an Ayah.
3. Lock the phone (or background the app by going to the Home Screen).
4. **Lock-Screen Player:**
   - Verify lock screen media player shows:
     - Title: Surah name & Ayah number (e.g. "Al-Fatihah · Ayah 1")
     - Artist: Reciter name (e.g. "Mishary Rashid Alafasy")
     - Album: "Wird Quran"
   - Controls:
     - Tap **Pause**: Audio pauses immediately.
     - Tap **Play**: Audio resumes without restarting.
     - Tap **Next**: Skips to the next ayah; title updates to match.
5. **Headphones / Bluetooth:**
   - Connect Bluetooth earbuds (AirPods / Galaxy Buds).
   - Press play/pause on the earbud stem: verify proper toggle response.

---

## 3. Share-as-Image (`react-native-view-shot` + `expo-sharing`)

### Verification Steps:
1. In Surah reader, locate any ayah card.
2. Tap the **Share** button (rightmost icon in the action bar).
3. The **Share Ayah Sheet** opens, displaying a light-palette preview card with:
   - Gold ornamental border (`#C9A35A`)
   - Arabic calligraphy
   - Meaning text and Surah reference (e.g. "Al-Baqarah 2:255")
   - Wird signature branding
4. Tap **Share Image**:
   - The native OS share sheet (AirDrop, WhatsApp, Telegram, Save Image) opens.
   - Select "Save Image" or send to a test chat.
   - Inspect the saved image in Photos: check that edges are sharp and no text is clipped.
5. Tap **Share Text**:
   - Verify plain text copy includes Arabic text, translation, and reference link.

---

## 4. Notifications & Prayer Reminders

### Verification Steps:
1. Open **Prayer** tab (`/prayer`).
2. Tap the bell icon next to any prayer (e.g. Maghrib).
3. Select notification options (Adhan sound or gentle tone).
4. In Settings -> Reminders, toggle:
   - Daily Ayah reminder (set time 2 minutes ahead for testing).
   - Khatam reminder.
5. Lock the phone and wait for the reminder timestamp:
   - On iOS: Verify adhan audio plays cleanly (`adhan_ios.caf`).
   - On Android: Verify custom notification icon (white star silhouette) and sound (`adhan.mp3`).
   - Tapping the notification opens the app directly to the relevant screen.
