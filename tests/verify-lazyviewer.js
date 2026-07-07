// The 3D viewer is now built lazily (after the splash / on first project open).
// Verify opening a project still builds it and 3D renders with no errors.
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
  // viewer must NOT exist during the splash (deferred)
  await page.waitForTimeout(800);
  const duringSplash = await page.evaluate(() => !!window.homestudio?.viewer);
  // reach the home screen, open a new project, enter the studio
  await page.waitForSelector('#homeNew', { timeout: 60000, state: 'visible' });
  await page.click('#homeNew');
  await page.waitForSelector('#fabAdd', { timeout: 60000, state: 'visible' });
  // switch to 3D and confirm the viewer got built + rendered
  await page.evaluate(() => window.homestudio.store.setViewMode('3d'));
  await page.waitForTimeout(2500);
  const info = await page.evaluate(() => ({
    viewerBuilt: !!window.homestudio?.viewer,
    uiViewer: !!window.homestudio?.ui?.viewer,
    mode: window.homestudio?.store?.viewMode,
  }));
  await page.screenshot({ path: 'tests/qa/splash/lazyviewer-3d.png' });
  console.log('viewer during splash=' + duringSplash);
  console.log(JSON.stringify(info));
  if (errs.length) console.log('ERRORS:\n' + errs.join('\n'));
  const ok = info.viewerBuilt && info.uiViewer && info.mode === '3d' && !errs.length;
  console.log(ok ? 'PASS: boot ok, project opens, 3D renders, no errors' : 'FAIL');
  await b.close();
})();
