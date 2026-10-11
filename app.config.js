// Adds the commit the app was built from, so Settings can show exactly which build is installed.
// EAS sets EAS_BUILD_GIT_COMMIT_HASH while it builds; a local run has none.
module.exports = ({ config }) => ({
    ...config,
    extra: { ...config.extra, build: (process.env.EAS_BUILD_GIT_COMMIT_HASH || "").slice(0, 7) || null },
});
