#!/usr/bin/env node
// Visual regression harness: captures canonical screenshots and pixel-diffs
// them against committed baselines so rendering regressions can't slip in.
//
//   node tests/visual.js            compare against tests/baselines/
//   node tests/visual.js --update   regenerate baselines
//
// Requires a preview server on :4173 (npm run preview) and playwright-core
// with the container chromium (see CHROMIUM env or default path below).
import { chromium } from 'playwright-core';
import { PNG } from 'pngjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.join(DIR, 'baselines');
const OUT = path.join(DIR, 'out');
const UPDATE = process.argv.includes('--update');
const URL_BASE = process.env.APP_URL || 'http://localhost:4173/';
const EXEC = process.env.CHROMIUM ||
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
// tolerate GPU/font wobble: per-channel delta and % of pixels allowed to differ
const CHANNEL_TOL = 26;
const PIXEL_PCT_TOL = 1.0;

/** The first-run offline prompt can pop over the studio at slightly different
 *  times per run — poll it away before interacting. */
async function dismissPrompts(p) {
  for (let i = 0; i < 8; i++) {
    const hit = await p.evaluate(() => {
      const c = [...document.querySelectorAll('.modal-scrim button')]
        .find(b => /cancel|later|not now/i.test(b.textContent || ''));
      if (c) { c.click(); return true; }
      return false;
    });
    if (hit) { await p.waitForTimeout(300); return; }
    await p.waitForTimeout(400);
  }
}

const SHOTS = [
  { name: 'home', run: async (p) => {
      // wait until the splash is fully faded away, not just until home exists —
      // catching the crossfade mid-flight made this shot flaky
      await p.waitForFunction(() => {
        const s = document.getElementById('splash');
        const h = document.getElementById('home');
        const gone = !s || getComputedStyle(s).display === 'none' || parseFloat(getComputedStyle(s).opacity) === 0;
        return gone && h && !h.classList.contains('hidden');
      }, { timeout: 20000 }).catch(() => {});
      await p.waitForTimeout(800);
  } },
  {
    name: 'mansion-2d',
    run: async (p) => {
      await p.click('#homeMansion');
      await p.waitForTimeout(2600);
      await dismissPrompts(p);
    }
  },
  {
    name: 'mansion-3d-day',
    run: async (p) => {
      await dismissPrompts(p);
      await p.click('[data-view="3d"]');
      await p.waitForTimeout(3800);
      await p.evaluate(() => homestudio.viewer.applyTimeOfDay(12));
      await p.waitForTimeout(2000); // let lighting/camera fully settle (day keyframe)
    }
  },
  {
    name: 'mansion-3d-night',
    run: async (p) => {
      await p.evaluate(() => homestudio.viewer.applyTimeOfDay(22));
      await p.waitForTimeout(2000);
    }
  }
];

function diffPngs(aBuf, bBuf) {
  const a = PNG.sync.read(aBuf);
  const b = PNG.sync.read(bBuf);
  if (a.width !== b.width || a.height !== b.height) return { pct: 100, reason: 'size' };
  let bad = 0;
  const total = a.width * a.height;
  for (let i = 0; i < a.data.length; i += 4) {
    if (Math.abs(a.data[i] - b.data[i]) > CHANNEL_TOL ||
        Math.abs(a.data[i + 1] - b.data[i + 1]) > CHANNEL_TOL ||
        Math.abs(a.data[i + 2] - b.data[i + 2]) > CHANNEL_TOL) bad++;
  }
  return { pct: (bad / total) * 100 };
}

(async () => {
  fs.mkdirSync(BASE, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: EXEC,
    // --no-proxy-server: the CI/agent containers route loopback through an
    // HTTP proxy, which stalls compositing and times out screenshots
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--no-sandbox', '--no-proxy-server']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', e => { console.error('PAGEERROR:', e.message); process.exitCode = 1; });
  await page.goto(URL_BASE, { waitUntil: 'networkidle' });
  // projects live in IndexedDB (localStorage is only a fallback) — clear BOTH,
  // or the previous run's saved template shows on home and shifts every pixel
  await page.evaluate(() => {
    localStorage.clear();
    return new Promise((res) => {
      const r = indexedDB.deleteDatabase('honeycutt');
      r.onsuccess = r.onerror = r.onblocked = () => res();
      setTimeout(res, 2000);
    });
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2600); // splash → home

  let failures = 0;
  for (const shot of SHOTS) {
    await shot.run(page);
    const buf = await page.screenshot({ timeout: 120000 }); // SwiftShader under load is slow
    const basePath = path.join(BASE, shot.name + '.png');
    if (UPDATE || !fs.existsSync(basePath)) {
      fs.writeFileSync(basePath, buf);
      console.log(`baseline written: ${shot.name}`);
      continue;
    }
    const { pct, reason } = diffPngs(fs.readFileSync(basePath), buf);
    const ok = pct <= PIXEL_PCT_TOL;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${shot.name}: ${pct.toFixed(2)}% pixels differ${reason ? ' (' + reason + ')' : ''}`);
    if (!ok) {
      failures++;
      fs.writeFileSync(path.join(OUT, shot.name + '.actual.png'), buf);
    }
  }
  await browser.close();
  if (failures) {
    console.error(`${failures} visual regression(s) — actuals in tests/out/`);
    process.exit(1);
  }
  console.log('visual regression: all clear');
})();
