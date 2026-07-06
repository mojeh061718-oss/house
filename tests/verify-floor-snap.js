// Verify floor-surface edge snapping: place a patio near a vertical wall and a
// second patio, run the snap, and assert the edges line up flush.
import { chromium } from 'playwright-core';
const EXEC = process.env.CHROMIUM ||
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const URL = process.env.APP_URL || 'http://localhost:5173/';

(async () => {
  const b = await chromium.launch({ executablePath: EXEC,
    args: ['--use-gl=angle','--use-angle=swiftshader','--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 1000, height: 700 } });
  page.on('pageerror', e => console.error('PAGEERROR:', e.message));
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForSelector('#homeNew', { timeout: 60000, state: 'visible' });
  await page.click('#homeNew');
  await page.waitForSelector('#fabAdd', { timeout: 60000, state: 'visible' });

  const res = await page.evaluate(() => {
    const hs = window.homestudio, ed = hs.editor, st = hs.store;
    st.snapEnabled = true;
    ed.view.scale = 0.55;
    const p = st.project;
    p.walls.length = 0; p.items.length = 0;
    // a vertical wall at x=0 (thickness 20 → inner face at x=+10)
    p.walls.push({ id: 'w1', ax: 0, ay: -300, bx: 0, by: 300, thickness: 20, height: 260 });
    // patio (slab) placed with its left edge ~13cm from the wall face (should snap flush)
    const patio = { id: 'p1', defId: 'patio', x: 200, y: 0, rotation: 0, w: 360, d: 240 };
    p.items.push(patio);
    // wall inner face at x=10; want left edge (x - w/2) == 10 → x == 190
    patio.x = 187;                      // 3cm off → within 16px/0.55≈29cm tol
    ed.snapSurfaceEdges(patio);
    const snappedToWall = patio.x;      // expect 190 (left edge flush to x=10)
    // second patio to the right; its left edge should butt to patio's right edge
    const patio2 = { id: 'p2', defId: 'patio', x: 560, y: 0, rotation: 0, w: 360, d: 240 };
    p.items.push(patio2);
    // patio right edge = 190+180 = 370; want patio2 left edge (x-180)=370 → x=550
    patio2.x = 553;                     // 3cm off
    ed.snapSurfaceEdges(patio2);
    return { snappedToWall, patio2x: patio2.x, isSurface: ed.isSurfaceDef(hs.ITEM_MAP.get('patio')) };
  });
  console.log(JSON.stringify(res));
  const ok = res.isSurface && Math.abs(res.snappedToWall - 190) < 0.6 && Math.abs(res.patio2x - 550) < 0.6;
  console.log(ok ? 'PASS: flooring edge-snaps flush to wall and adjacent surface'
                 : 'FAIL: snapping did not align as expected');
  await b.close();
  process.exit(ok ? 0 : 1);
})();
