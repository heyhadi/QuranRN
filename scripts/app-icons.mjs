// Renders the app icon, the Android adaptive-icon foreground, the splash mark and the favicon in assets/images
// from docs/readme-src/app-mark.html. Uses your installed Google Chrome through playwright-core.
// Run: node scripts/app-icons.mjs
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = pathToFileURL(resolve(ROOT, 'docs/readme-src/app-mark.html')).href;
const OUT = resolve(ROOT, 'assets/images');

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
for (const [variant, file] of [['icon', 'icon.png'], ['adaptive', 'adaptive-icon.png'], ['splash', 'splash-icon.png']]) {
  await page.goto(`${SRC}?v=${variant}`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: resolve(OUT, file), omitBackground: variant !== 'icon' });
}
await page.setViewportSize({ width: 1024, height: 1024 });
await page.goto(`${SRC}?v=icon`);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: resolve(OUT, 'favicon.png'), clip: { x: 0, y: 0, width: 1024, height: 1024 } });
await browser.close();
