#!/usr/bin/env node
// Screenshot catalog items in isolation for asset-QA.
//   node tests/qa-shot.js <label> id1 id2 id3 ...
// Renders each id from two angles into tests/qa/<label>/<id>_<az>.png and
// prints the document title (which carries QA-OK / QA-THROW + bbox dims).
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const label = process.argv[2] || 'shot';
const ids = process.argv.slice(3);
const OUT = path.join(DIR, 'qa', label);
fs.mkdirSync(OUT, { recursive: true });
const URL_BASE = process.env.APP_URL || 'http://localhost:5173/qa-item.html';
const EXEC = process.env.CHROMIUM ||
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const ANGLES = [35, 135];

(async () => {
  const browser = await chromium.launch({
    executablePath: EXEC,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 720, height: 720 } });
  page.on('pageerror', e => console.error('PAGEERROR:', e.message));
  for (const id of ids) {
    for (const az of ANGLES) {
      const url = `${URL_BASE}?id=${encodeURIComponent(id)}&az=${az}&grid=0`;
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => window.__qaReady === true, { timeout: 8000 }).catch(() => {});
      const title = await page.title();
      if (az === ANGLES[0]) console.log(title);
      await page.screenshot({ path: path.join(OUT, `${id}_${az}.png`) });
    }
  }
  await browser.close();
})();
