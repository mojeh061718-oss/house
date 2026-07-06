// Capture the startup splash in a PORTRAIT viewport to diagnose the orientation
// handling (forced-landscape rotation) and any flash/jank at boot.
import { chromium } from 'playwright-core';
const EXEC = process.env.CHROMIUM ||
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const URL = process.env.APP_URL || 'http://localhost:4173/';
import fs from 'node:fs'; fs.mkdirSync('tests/qa/splash', { recursive: true });

(async () => {
  const b = await chromium.launch({ executablePath: EXEC,
    args: ['--use-gl=angle','--use-angle=swiftshader','--no-sandbox'] });
  // iPhone-ish portrait
  const land = process.env.LAND === '1';
  const ctx = await b.newContext({ viewport: land ? { width: 932, height: 430 } : { width: 430, height: 932 },
    deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  const tag = land ? 'landscape' : 'portrait';
  const page = await ctx.newPage();
  page.on('pageerror', e => console.error('PAGEERROR:', e.message));
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
  for (const t of [150, 600, 1400]) {
    await page.waitForTimeout(t === 150 ? 150 : t - (t === 600 ? 150 : 600));
    await page.screenshot({ path: `tests/qa/splash/${tag}-${t}.png` });
  }
  const info = await page.evaluate(() => ({
    forceLandscape: document.documentElement.classList.contains('force-landscape'),
    innerW: window.innerWidth, innerH: window.innerHeight,
    appW: document.getElementById('app')?.style.width,
    appH: document.getElementById('app')?.style.height,
    appTransform: getComputedStyle(document.getElementById('app')).transform.slice(0, 40),
    splashPlay: document.getElementById('splash')?.classList.contains('play'),
    splashVisible: !document.getElementById('splash')?.classList.contains('fade-out')
  }));
  console.log(JSON.stringify(info, null, 2));
  await b.close();
})();
