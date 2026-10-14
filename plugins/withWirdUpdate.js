/**
 * withWirdUpdate — in-app update from the repo's GitHub Releases.
 *
 * - Copies UpdateModule.kt + WirdUpdatePackage.kt into android/.
 * - Registers WirdUpdatePackage in MainApplication so the UpdateModule
 *   native module resolves from JS.
 * - Adds the FileProvider paths for the downloaded APK.
 */
const { withDangerousMod, withMainApplication } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PACKAGE_PATH = 'com/heyhadi/wird/update';
const KOTLIN_FILES = ['UpdateModule.kt', 'WirdUpdatePackage.kt'];

function copyKotlinSources(projectRoot, androidDir) {
  const srcDir = path.join(projectRoot, 'native-modules', 'android', 'app', 'src', 'main', 'java', PACKAGE_PATH);
  const destDir = path.join(androidDir, 'app', 'src', 'main', 'java', PACKAGE_PATH);
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of KOTLIN_FILES) {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
  }
}

const withWirdUpdate = (config) => {
  config = withDangerousMod(config, [
    'android',
    (config) => {
      const androidDir = config.modRequest.platformProjectRoot;
      copyKotlinSources(config.modRequest.projectRoot, androidDir);

      // FileProvider paths for the update APK
      const resDir = path.join(androidDir, 'app', 'src', 'main', 'res', 'xml');
      fs.mkdirSync(resDir, { recursive: true });
      const pathsFile = path.join(resDir, 'wird_update_paths.xml');
      if (!fs.existsSync(pathsFile)) {
        fs.writeFileSync(
          pathsFile,
          '<?xml version="1.0" encoding="utf-8"?>\n<paths>\n    <cache-path name="updates" path="updates/" />\n</paths>\n'
        );
      }

      // FileProvider declaration in AndroidManifest
      const manifestPath = path.join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml');
      let manifest = fs.readFileSync(manifestPath, 'utf8');
      if (!manifest.includes('com.heyhadi.wird.updates')) {
        manifest = manifest.replace(
          '</application>',
          `    <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="com.heyhadi.wird.updates"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/wird_update_paths" />
        </provider>
    </application>`
        );
        fs.writeFileSync(manifestPath, manifest);
      }
      return config;
    },
  ]);

  config = withMainApplication(config, (config) => {
    let contents = config.modResults.contents;
    if (!contents.includes('WirdUpdatePackage')) {
      contents = contents.replace(
        'import expo.modules.ReactNativeHostWrapper',
        'import expo.modules.ReactNativeHostWrapper\nimport com.heyhadi.wird.update.WirdUpdatePackage'
      );
      contents = contents.replace(
        'packages.add(',
        'packages.add(WirdUpdatePackage())\n      packages.add('
      );
      config.modResults.contents = contents;
    }
    return config;
  });

  return config;
};

module.exports = withWirdUpdate;
