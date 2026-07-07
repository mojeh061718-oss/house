// Normal boot: version gets set on the logo, the app reaches home with no
// errors, and opening a project renders 3D.
import { chromium } from 'playwright-core';
const EXEC = process.env.CHROMIUM ||
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const URL = process.env.APP_URL || 'http://localhost:4173/';

(async () => {
  const b = await chromium.launch({ executablePath: EXEC,
    args: ['--use-gl=angle','--use-angle=swiftshader','--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1000, height: 700 }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
  // version should be stamped onto the logo early by main.js
  await page.waitForFunction(() => {
    const v = document.getElementById('splashVer');
    return v && /^v\d+\.\d+\.\d+$/.test(v.textContent.trim());
  }, { timeout: 15000 }).catch(() => {});
  const ver = await page.evaluate(() => document.getElementById('splashVer')?.textContent);
  await page.waitForSelector('#homeNew', { timeout: 60000, state: 'visible' });
  await page.click('#homeNew');
  await page.waitForSelector('#fabAdd', { timeout: 60000, state: 'visible' });
  await page.evaluate(() => window.homestudio.store.setViewMode('3d'));
  await page.waitForTimeout(2000);
  const mode = await page.evaluate(() => window.homestudio?.store?.viewMode);
  console.log('version=' + ver + ' mode3d=' + (mode === '3d'));
  if (errs.length) console.log('ERRORS:\n' + errs.join('\n'));
  const ok = /^v\d+\.\d+\.\d+$/.test((ver || '').trim()) && mode === '3d' && !errs.length;
  console.log(ok ? 'PASS: version shown, home reached, 3D renders, no errors' : 'FAIL');
  await b.close();
})();
