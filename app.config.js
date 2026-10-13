// Adds the commit the app was built from, so Settings can show exactly which build is installed.
// EAS sets EAS_BUILD_GIT_COMMIT_HASH while it builds; GitHub Actions sets GITHUB_SHA;
// a local run has neither.
module.exports = ({ config }) => ({
    ...config,
    extra: { ...config.extra, build: (process.env.EAS_BUILD_GIT_COMMIT_HASH || process.env.GITHUB_SHA || "").slice(0, 7) || null },
});
