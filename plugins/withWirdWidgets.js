/**
 * withWirdWidgets — native Android home-screen widgets for Wird.
 *
 * - Registers WirdWidgetPackage in MainApplication so WirdWidgetModule
 *   resolves from JS.
 * - Copies Widget Kotlin sources into android/app/src/main/java/com/heyhadi/wird/widget/.
 * - Copies Widget layout, drawable, xml, and values resources into android/app/src/main/res/.
 * - Declares the Prayer, Daily Ayah, and Khatam AppWidgetProvider receivers in AndroidManifest.xml.
 */
const { withDangerousMod, withMainApplication } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const KOTLIN_SRC_DIR = 'com/heyhadi/wird/widget';

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const withWirdWidgets = (config) => {
  // 1. Register WirdWidgetPackage in MainApplication.kt
  config = withMainApplication(config, (config) => {
    let contents = config.modResults.contents;
    const importLine = 'import com.heyhadi.wird.widget.WirdWidgetPackage';
    if (!contents.includes(importLine)) {
      contents = contents.replace(
        /(^import .+$\n)(?![\s\S]*^import )/m,
        (match) => `${match}${importLine}\n`,
      );
    }

    const anchor = 'PackageList(this).packages.apply {';
    if (!contents.includes(anchor)) {
      console.warn('[withWirdWidgets] PackageList anchor not found; skipping registration');
    } else if (!contents.includes('WirdWidgetPackage()')) {
      contents = contents.replace(
        anchor,
        `${anchor}\n          // Wird home-screen widgets module.\n` +
          '          add(WirdWidgetPackage())',
      );
    }
    config.modResults.contents = contents;
    return config;
  });

  // 2. Copy native files & add receivers to AndroidManifest.xml
  config = withDangerousMod(config, [
    'android',
    (config) => {
      const androidDir = config.modRequest.platformProjectRoot;
      const projectRoot = config.modRequest.projectRoot;

      // Copy Kotlin sources
      const srcJavaDir = path.join(
        projectRoot,
        'native-modules',
        'android',
        'app',
        'src',
        'main',
        'java',
        KOTLIN_SRC_DIR
      );
      const destJavaDir = path.join(
        androidDir,
        'app',
        'src',
        'main',
        'java',
        KOTLIN_SRC_DIR
      );
      copyDirRecursive(srcJavaDir, destJavaDir);

      // Copy XML/drawable/layout/values resources
      const srcResDir = path.join(
        projectRoot,
        'native-modules',
        'android',
        'app',
        'src',
        'main',
        'res'
      );
      const destResDir = path.join(androidDir, 'app', 'src', 'main', 'res');
      copyDirRecursive(srcResDir, destResDir);

      // Add receivers to AndroidManifest.xml
      const manifestPath = path.join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml');
      if (fs.existsSync(manifestPath)) {
        let manifest = fs.readFileSync(manifestPath, 'utf8');
        if (!manifest.includes('com.heyhadi.wird.widget.PrayerWidgetProvider')) {
          const receiversBlock = `
        <!-- Wird Home-Screen Widgets -->
        <receiver
            android:name="com.heyhadi.wird.widget.PrayerWidgetProvider"
            android:label="@string/widget_prayer_label"
            android:exported="true">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data
                android:name="android.appwidget.provider"
                android:resource="@xml/widget_prayer_info" />
        </receiver>

        <receiver
            android:name="com.heyhadi.wird.widget.DailyAyahWidgetProvider"
            android:label="@string/widget_daily_ayah_label"
            android:exported="true">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data
                android:name="android.appwidget.provider"
                android:resource="@xml/widget_daily_ayah_info" />
        </receiver>

        <receiver
            android:name="com.heyhadi.wird.widget.KhatamWidgetProvider"
            android:label="@string/widget_khatam_label"
            android:exported="true">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data
                android:name="android.appwidget.provider"
                android:resource="@xml/widget_khatam_info" />
        </receiver>
    </application>`;
          manifest = manifest.replace('</application>', receiversBlock);
          fs.writeFileSync(manifestPath, manifest);
        }
      }

      return config;
    },
  ]);

  return config;
};

module.exports = withWirdWidgets;
