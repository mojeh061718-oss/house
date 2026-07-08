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
      // the hint pill fades on its own timer — hide it so shot timing can't
      // produce a phantom 2% diff at the bottom of the frame
      await p.evaluate(() => document.getElementById('hintPill')?.classList.add('hidden'));
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
  // block service workers like every other suite: the SW claiming the page
  // mid-run can reload it and the shot lands on a fresh splash
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.on('pageerror', e => { console.error('PAGEERROR:', e.message); process.exitCode = 1; });
  // NOTE: no storage clearing needed — a fresh Playwright context starts with
  // empty localStorage AND IndexedDB. (A clear+reload here used to deadlock:
  // deleteDatabase blocked on the app's open connection, and the reloaded
  // boot's open() then queued behind the pending delete → dead splash.)
  await page.goto(URL_BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2600); // splash → home

  let failures = 0;
  for (const shot of SHOTS) {
    await shot.run(page);
    // force TWO fresh animation frames before capturing: under SwiftShader the
    // compositor can lag the DOM by many seconds, and screenshots otherwise
    // grab a stale frame (this suite once baselined a dead splash while the
    // DOM said the home screen was up)
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    let buf = await page.screenshot({ timeout: 120000 }); // SwiftShader under load is slow
    // PIXEL-verified capture: even after the rAF barrier, SwiftShader can
    // serve a frame from before the splash faded. The home screen has the
    // blue "New project" disc at (143,184); the splash is near-black there.
    // Reshoot until the pixels agree with the DOM (max ~60s).
    if (shot.name === 'home') {
      for (let tries = 0; tries < 30; tries++) {
        const img = PNG.sync.read(buf);
        const i = (184 * img.width + 143) * 4;
        const [r, g, b2] = [img.data[i], img.data[i + 1], img.data[i + 2]];
        if (b2 > 120 && b2 > r + 40) break; // blue disc → the real home frame
        await page.waitForTimeout(2000);
        await page.evaluate(() => new Promise(r2 => requestAnimationFrame(() => requestAnimationFrame(r2))));
        buf = await page.screenshot({ timeout: 120000 });
      }
    }
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
