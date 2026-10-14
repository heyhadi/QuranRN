// Adds the commit the app was built from, so Settings can show exactly which build is installed.
// EAS sets EAS_BUILD_GIT_COMMIT_HASH while it builds; GitHub Actions sets GITHUB_SHA;
// a local run has neither.
//
// APP_VARIANT=development (set by the EAS "development" profile) builds "Wird Dev" with its own
// Android package, so it installs next to the release app instead of replacing it and its data.
const isDev = process.env.APP_VARIANT === "development";

module.exports = ({ config }) => ({
    ...config,
    ...(isDev ? { name: "Wird Dev", android: { ...config.android, package: `${config.android.package}.dev` } } : {}),
    extra: { ...config.extra, build: (process.env.EAS_BUILD_GIT_COMMIT_HASH || process.env.GITHUB_SHA || "").slice(0, 7) || null },
});
