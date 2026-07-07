// 1) normal boot: splash plays and the home screen appears.
// 2) simulate the module failing to load (version skew): the failsafe must
//    still start the splash animation and surface a reload button.
import { chromium } from 'playwright-core';
const EXEC = process.env.CHROMIUM ||
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const URL = process.env.APP_URL || 'http://localhost:4173/';

(async () => {
  const b = await chromium.launch({ executablePath: EXEC,
    args: ['--use-gl=angle','--use-angle=swiftshader','--no-sandbox'] });

  // --- normal boot ---
  {
    const ctx = await b.newContext({ viewport: { width: 430, height: 932 }, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
    // animation auto-plays from CSS: the house paths should be mid/partly drawn
    await page.waitForTimeout(900);
    const drawing = await page.evaluate(() => {
      const p = document.querySelector('.sh-walls');
      if (!p) return false;
      const off = parseFloat(getComputedStyle(p).strokeDashoffset);
      return off < 0.999;   // < 1 means the draw animation has progressed
    });
    await page.waitForFunction(() => {
      const h = document.getElementById('home');
      return h && !h.classList.contains('hidden');
    }, { timeout: 8000 }).catch(() => {});
    const homeShown = await page.evaluate(() => {
      const h = document.getElementById('home');
      return h && !h.classList.contains('hidden');
    });
    console.log('normal: houseDrawing=' + drawing + ' homeShown=' + homeShown);
    await ctx.close();
  }

  // --- module blocked (simulate 404 of the app bundle) ---
  {
    const ctx = await b.newContext({ viewport: { width: 430, height: 932 }, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await page.route(/index-.*\.js/, r => r.abort());   // kill the app module
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(900);
    const drawing = await page.evaluate(() => {
      const p = document.querySelector('.sh-walls');
      if (!p) return false;
      return parseFloat(getComputedStyle(p).strokeDashoffset) < 0.999;  // animates even w/o the module
    });
    await page.waitForTimeout(9000);
    const recover = await page.evaluate(() => !!document.getElementById('splash-recover'));
    console.log('blocked: houseDrawing=' + drawing + ' recoverButton=' + recover);
    console.log((drawing && recover) ? 'PASS: splash animates without JS + offers reload when module dies'
                                     : 'FAIL: failsafe did not engage');
    await ctx.close();
  }
  await b.close();
})();
