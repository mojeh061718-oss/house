// Screenshot the Add-Furniture catalog panel (redesigned slim header).
// Opens the mansion, switches to 3D, opens the catalog via the FAB, selects a
// category, and shots it — plus the search-expanded state.
import { chromium } from 'playwright-core';
const EXEC = process.env.CHROMIUM ||
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const URL = process.env.APP_URL || 'http://localhost:5173/';
const OUT = process.env.OUT || 'tests/qa/catalog';
import fs from 'node:fs'; fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const b = await chromium.launch({ executablePath: EXEC,
    args: ['--use-gl=angle','--use-angle=swiftshader','--no-sandbox'] });
  const VP = { phone: ['phone', 780, 1180], compact: ['compact', 1024, 470] };
  const [label, w, h] = VP[process.env.VP] || ['wide', 1200, 820];
  const page = await b.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', e => console.error('PAGEERROR:', e.message));
  const log = (...a) => console.log(Date.now() % 100000, ...a);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 }); log('goto');
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 }); log('reload');
  await page.waitForSelector('#homeNew', { timeout: 60000, state: 'visible' }); log('home ready');
  await page.click('#homeNew'); log('clicked new');
  await page.waitForSelector('#fabAdd', { timeout: 60000, state: 'visible' }); log('fab ready');
  // dismiss the one-time "work offline" modal if it appears
  await page.waitForTimeout(500);
  const cancel = page.locator('.modal button', { hasText: /cancel/i }).first();
  if (await cancel.count()) { await cancel.click().catch(()=>{}); log('dismissed modal'); }
  await page.click('#fabAdd'); log('opened catalog');
  await page.waitForSelector('#catGrid .cat-card, #catGrid .cat-section', { timeout: 20000 }).catch(()=>{});
  await page.waitForTimeout(600);
  // pick the Outdoor category so the grid has content like the user's shot
  await page.evaluate(() => { const t=[...document.querySelectorAll('.cat-tab')].find(b=>b.textContent==='Outdoor'); t && t.click(); });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/catalog-${label}.png` });
  await page.click('#catSearchBtn');
  await page.waitForTimeout(200);
  await page.type('#catSearch', 'bed');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/catalog-${label}-search.png` });
  console.log(`${label}: shot ok`);
  await b.close();
})();
