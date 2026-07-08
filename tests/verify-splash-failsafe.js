// 1) normal boot: the static splash logo is visible, home appears, and the
//    failsafe reload button is NEVER left showing over a working app (it must
//    retract even if it fired during a slow boot).
// 2) simulate the module failing to load (version skew): the failsafe must
//    surface a reload button on the still-visible splash.
import { chromium } from 'playwright-core';
const EXEC = process.env.CHROMIUM ||
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const URL = process.env.APP_URL || 'http://localhost:4173/';

(async () => {
  const b = await chromium.launch({ executablePath: EXEC,
    args: ['--use-gl=angle','--use-angle=swiftshader','--no-sandbox'] });
  let fail = false;

  // --- normal boot ---
  {
    const ctx = await b.newContext({ viewport: { width: 430, height: 932 }, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const logoShown = await page.evaluate(() => {
      const l = document.querySelector('.splash-logo');
      return !!l && l.getBoundingClientRect().width > 40;
    });
    await page.waitForFunction(() => {
      const h = document.getElementById('home');
      return h && !h.classList.contains('hidden');
    }, { timeout: 15000 }).catch(() => {});
    const homeShown = await page.evaluate(() => {
      const h = document.getElementById('home');
      return h && !h.classList.contains('hidden');
    });
    // wait past both failsafe stages, then confirm neither is left on screen
    await page.waitForTimeout(8000);
    const leftovers = await page.evaluate(() => ({
      recover: !!document.getElementById('splash-recover'),
      slow: !!document.getElementById('splash-slow'),
    }));
    console.log(`normal: logo=${logoShown} home=${homeShown} leftoverReload=${leftovers.recover} leftoverSlow=${leftovers.slow}`);
    if (!logoShown || !homeShown || leftovers.recover || leftovers.slow) fail = true;
    await ctx.close();
  }

  // --- module blocked (simulate 404 of the app bundle) ---
  {
    const ctx = await b.newContext({ viewport: { width: 430, height: 932 }, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await page.route(/index-.*\.js/, r => r.abort());   // kill the app module
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(5000);
    const slow = await page.evaluate(() => !!document.getElementById('splash-slow'));
    await page.waitForTimeout(3500);
    const recover = await page.evaluate(() => !!document.getElementById('splash-recover'));
    console.log(`blocked: stillLoadingNote=${slow} recoverButton=${recover}`);
    if (!recover) fail = true;
    await ctx.close();
  }
  console.log(fail ? 'FAIL' : 'PASS: splash shows, failsafe fires when dead, retracts when alive');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
