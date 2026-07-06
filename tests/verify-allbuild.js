// Build every catalog item (all palettes) in the browser and report throws +
// the heaviest items by mesh count — catches assets that crash on select/place
// or that are pathologically heavy (a memory/OOM risk).
import { chromium } from 'playwright-core';
const EXEC = process.env.CHROMIUM ||
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const URL = process.env.APP_URL || 'http://localhost:4173/';

(async () => {
  const b = await chromium.launch({ executablePath: EXEC,
    args: ['--use-gl=angle','--use-angle=swiftshader','--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 900, height: 640 }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForSelector('#homeNew', { timeout: 60000, state: 'visible' });
  await page.click('#homeNew');
  await page.waitForSelector('#fabAdd', { timeout: 60000, state: 'visible' });

  const res = await page.evaluate(() => {
    const hs = window.homestudio, THREE = hs.THREE;
    const out = { total: 0, throws: [], heavy: [], maxMeshes: 0 };
    for (const def of hs.ITEMS) {
      const pals = def.palettes || [null];
      for (let pi = 0; pi < pals.length; pi++) {
        out.total++;
        try {
          const g = def.build(pals[pi] ? def.palettes[pi] : {});
          let meshes = 0;
          g.traverse(o => { if (o.isMesh) meshes++; });
          if (pi === 0) out.heavy.push({ id: def.id, meshes });
          out.maxMeshes = Math.max(out.maxMeshes, meshes);
          g.traverse(o => o.geometry?.dispose?.());
        } catch (e) {
          out.throws.push(def.id + ' [pal ' + pi + ']: ' + e.message);
        }
      }
    }
    out.heavy.sort((a, b) => b.meshes - a.meshes);
    out.heavy = out.heavy.slice(0, 12);
    return out;
  });
  console.log('items×palettes built:', res.total);
  console.log('throws:', res.throws.length ? JSON.stringify(res.throws, null, 2) : 'none');
  console.log('max meshes in one item:', res.maxMeshes);
  console.log('heaviest:', JSON.stringify(res.heavy));
  if (errs.length) console.log('PAGE ERRORS:', errs.join('\n'));
  console.log(res.throws.length || errs.length ? 'FAIL' : 'PASS');
  await b.close();
})();
