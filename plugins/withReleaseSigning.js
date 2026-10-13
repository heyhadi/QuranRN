/**
 * withReleaseSigning — signs the release APK with our keystore.
 *
 * Reads from environment (set by CI):
 *   WIRD_KEYSTORE_FILE     — absolute path to the .p12 keystore
 *   WIRD_STORE_PASSWORD    — keystore password
 *   WIRD_KEY_ALIAS         — key alias
 *   WIRD_KEY_PASSWORD      — key password
 *
 * No-op when the env vars are absent (local debug builds don't need it).
 */
const { withAppBuildGradle } = require('@expo/config-plugins');

const withReleaseSigning = (config) => {
  return withAppBuildGradle(config, (config) => {
    const storeFile = process.env.WIRD_KEYSTORE_FILE;
    const storePassword = process.env.WIRD_STORE_PASSWORD;
    const keyAlias = process.env.WIRD_KEY_ALIAS;
    const keyPassword = process.env.WIRD_KEY_PASSWORD;
    if (!storeFile || !storePassword || !keyAlias || !keyPassword) {
      return config;
    }
    let contents = config.modResults.contents;
    if (contents.includes('wirdRelease')) {
      return config; // already applied
    }
    const signingBlock = `
    signingConfigs {
        create("wirdRelease") {
            storeFile = file("${storeFile}")
            storePassword = "${storePassword}"
            keyAlias = "${keyAlias}"
            keyPassword = "${keyPassword}"
        }
    }`;
    // Insert signingConfigs inside the android { } block, before buildTypes.
    contents = contents.replace(
      /(\n\s*buildTypes\s*\{)/,
      `${signingBlock}$1`,
    );
    // Point the release build type at it.
    contents = contents.replace(
      /getByName\("release"\)\s*\{/,
      (match) => `${match}\n            signingConfig = signingConfigs.getByName("wirdRelease")`,
    );
    config.modResults.contents = contents;
    return config;
  });
};

module.exports = withReleaseSigning;
