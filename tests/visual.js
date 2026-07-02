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

const SHOTS = [
  { name: 'home', run: async (p) => { /* home screen after splash */ } },
  {
    name: 'mansion-2d',
    run: async (p) => {
      await p.click('#homeMansion');
      await p.waitForTimeout(2600);
    }
  },
  {
    name: 'mansion-3d-day',
    run: async (p) => {
      await p.click('[data-view="3d"]');
      await p.waitForTimeout(3800);
      await p.evaluate(() => homestudio.viewer.applyTimeOfDay(12));
      await p.waitForTimeout(600);
    }
  },
  {
    name: 'mansion-3d-night',
    run: async (p) => {
      await p.evaluate(() => homestudio.viewer.applyTimeOfDay(22));
      await p.waitForTimeout(600);
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
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', e => { console.error('PAGEERROR:', e.message); process.exitCode = 1; });
  await page.goto(URL_BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2600); // splash → home

  let failures = 0;
  for (const shot of SHOTS) {
    await shot.run(page);
    const buf = await page.screenshot();
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
