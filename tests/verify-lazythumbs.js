// Prove the catalog no longer builds every thumbnail on open: open the "All"
// tab and count how many card images actually have a rendered src shortly
// after — should be a small visible subset, not all ~300+.
import { chromium } from 'playwright-core';
const EXEC = process.env.CHROMIUM ||
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const URL = process.env.APP_URL || 'http://localhost:4173/';

(async () => {
  const b = await chromium.launch({ executablePath: EXEC,
    args: ['--use-gl=angle','--use-angle=swiftshader','--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1024, height: 470 }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.error('PAGEERROR:', e.message));
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForSelector('#homeNew', { timeout: 60000, state: 'visible' });
  await page.click('#homeNew');
  await page.waitForSelector('#fabAdd', { timeout: 60000, state: 'visible' });
  await page.waitForTimeout(400);
  const cancel = page.locator('.modal button', { hasText: /cancel/i }).first();
  if (await cancel.count()) await cancel.click().catch(()=>{});
  await page.click('#fabAdd');
  await page.waitForSelector('#catGrid .cat-card', { timeout: 20000 });
  await page.waitForTimeout(1500);
  const stat = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('#catGrid .cat-card img')];
    const withSrc = imgs.filter(i => i.src && i.src.startsWith('data:')).length;
    return { total: imgs.length, rendered: withSrc };
  });
  console.log(JSON.stringify(stat));
  // lazy = only a visible subset rendered; the whole point is rendered << total
  const ok = stat.total > 40 && stat.rendered < stat.total * 0.6;
  console.log(ok ? `PASS: lazy — ${stat.rendered}/${stat.total} thumbnails built on open`
                 : `CHECK: ${stat.rendered}/${stat.total} built (expected a small subset)`);
  await b.close();
})();
