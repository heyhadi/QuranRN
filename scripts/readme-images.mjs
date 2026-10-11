// Generates the README images in docs/images from the design mockups in docs/quranrn-plan.html.
// Uses your installed Google Chrome through playwright-core (no browser download).
// Run: node scripts/readme-images.mjs
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(ROOT, 'docs/readme-src');
const SHOTS = resolve(SRC, '.out');
const OUT = resolve(ROOT, 'docs/images');
mkdirSync(SHOTS, { recursive: true });
mkdirSync(OUT, { recursive: true });

const fileUrl = (path) => pathToFileURL(path).href;
const browser = await chromium.launch({ channel: 'chrome' });

// 1. Phone mockups from the plan page, in English and light theme, at 2x for sharp text.
const PHONES = ['home', 'reader', 'ayah-sheet', 'reciters', 'hifz', 'prayer'];
{
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2, colorScheme: 'light' });
  await page.goto(fileUrl(resolve(ROOT, 'docs/quranrn-plan.html')));
  // The artifact viewer adds `[hidden]{display:none}` when it publishes the page; the local file lacks it.
  // A transparent page keeps the white page background out of the bezel's rounded corners.
  await page.addStyleTag({ content: '[hidden]{display:none!important} html,body,main,section{background:transparent!important}' });
  await page.evaluate(() => document.fonts.ready);
  const phones = page.locator('#screens .phone');
  for (const [i, name] of PHONES.entries()) {
    await phones.nth(i).screenshot({ path: resolve(SHOTS, `${name}.png`), omitBackground: true });
  }
  await page.close();
}

// 2. App icon.
{
  const page = await browser.newPage({ viewport: { width: 512, height: 512 } });
  await page.goto(fileUrl(resolve(SRC, 'icon.html')));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: resolve(OUT, 'icon.png'), omitBackground: true });
  await page.close();
}

// 3. 1280x800 banners, in the style of form-keeper's README images.
const BANNERS = [
  {
    file: '1-your-daily-portion.png',
    e: 'Wird · design preview',
    h: 'Your daily portion of the Quran.',
    s: 'Read, listen and memorise, with tajweed colours, tafsir and about 25 reciters. In Indonesian and English.',
    shots: ['home', 'reader', 'ayah-sheet'],
  },
  {
    file: '2-tajweed-you-can-tap.png',
    e: 'Reading',
    h: 'Tajweed you can tap.',
    s: 'Every rule in its own colour. Tap a letter to see the rule and how to say it, or a word for its meaning.',
    shots: ['reader', 'ayah-sheet'],
  },
  {
    file: '3-memorise-and-listen.png',
    e: 'Hifz and audio',
    h: 'Memorise with your favourite reciter.',
    s: 'Repeat an ayah, hide it to test yourself, and track what you have memorised. Switch reciters without losing your place.',
    shots: ['hifz', 'reciters'],
  },
  {
    file: '4-prayer-qibla-tasbih.png',
    e: 'Every day',
    h: 'Prayer times, Qibla and tasbih.',
    s: 'Prayer times for where you are, a Qibla compass, and a tasbih counter that vibrates at 33.',
    shots: ['prayer'],
  },
];
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  for (const b of BANNERS) {
    const q = new URLSearchParams({ e: b.e, h: b.h, s: b.s, frame: 'none' });
    for (const s of b.shots) q.append('shot', fileUrl(resolve(SHOTS, `${s}.png`)));
    await page.goto(`${fileUrl(resolve(SRC, 'banner.html'))}?${q}`);
    await page.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].map((img) => img.decode())]));
    await page.screenshot({ path: resolve(OUT, b.file) });
    console.log(`docs/images/${b.file}`);
  }
  await page.close();
}

await browser.close();
