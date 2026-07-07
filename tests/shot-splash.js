// Screenshot the static logo screen itself (block the app module so it never
// fades to home). Also set the version text the way main.js would, so we can
// see the version line.
import { chromium } from 'playwright-core';
const EXEC = process.env.CHROMIUM ||
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const URL = process.env.APP_URL || 'http://localhost:4173/';
import fs from 'node:fs'; fs.mkdirSync('tests/qa/splash', { recursive: true });

(async () => {
  const b = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  for (const [tag, w, h] of [['portrait', 430, 932], ['landscape', 932, 430]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await page.route(/index-.*\.js/, r => r.abort());   // stop the app from taking over the splash
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
    // fill the version like main.js would (module is blocked here)
    await page.evaluate(() => { const v = document.getElementById('splashVer'); if (v) v.textContent = 'v3.2.7'; });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `tests/qa/splash/logo-${tag}.png` });
    await ctx.close();
  }
  await b.close();
  console.log('shot logo-portrait / logo-landscape');
})();
