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
    const out = { total: 0, throws: [], heavy: [], maxMeshes: 0, sizeLies: [] };
    // Known intentional overhangs (canopies, eaves, blades) may exceed the
    // declared footprint a little; flag anything clearly out of contract.
    const TOL = 1.45;     // built size may be up to 45% over the declared w/d/h
    const MINR = 0.35;    // ...and no smaller than 35% of it (buried/vestigial builds)
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
          // bbox-vs-def contract: the built model must roughly match its
          // declared footprint — the plan symbol, selection box and wall
          // snapping all trust def.w/d/h (a kayak once built 3.5× its width)
          if (pi === 0 && !def.path && !def.areaDraw && !def.buildSized) {
            const bb = new THREE.Box3().setFromObject(g);
            const s = bb.getSize(new THREE.Vector3());
            const checks = [['w', s.x, def.w], ['h', s.y, def.h], ['d', s.z, def.d]];
            for (const [axis, built, decl] of checks) {
              if (!decl || decl < 12) continue; // tiny/undeclared axes are noise
              if (built > decl * TOL || built < decl * MINR) {
                out.sizeLies.push(`${def.id}: built ${axis}=${Math.round(built)} vs declared ${decl}`);
              }
            }
          }
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
  console.log('size contract violations (' + res.sizeLies.length + '):');
  for (const l of res.sizeLies) console.log('  ' + l);
  if (errs.length) console.log('PAGE ERRORS:', errs.join('\n'));
  // the size contract is ENFORCED — the whole catalog reached zero violations
  // in the 4.0 asset pass and must stay there (LENIENT_SIZE=1 to bypass while
  // iterating locally)
  const sizeFail = process.env.LENIENT_SIZE !== '1' && res.sizeLies.length > 0;
  console.log(res.throws.length || errs.length || sizeFail ? 'FAIL' : 'PASS');
  await b.close();
})();
