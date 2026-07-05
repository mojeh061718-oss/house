// Pools & spas content pack — parametric water features built only from
// primitive helpers. Every pool reads as: light stone coping rim + a dark
// recessed basin + an inset, slightly-sunken rippled water() surface, plus at
// least one detail (steps, ledge, jets, rock edge, spillover).
// All dims in cm; origin at footprint center on the ground; +Y up.
import { G, box, cyl, sphere, blob, foliage, solid, wood, metal, chrome, tex, water, glow } from '../builders.js';

// Water-tint palettes: the translucent water() reads its depth/hue from the
// dark basin below it, so swapping the basin color re-tints the pool.
const WATER_TINTS = [
  { name: 'Deep Blue', chip: '#1d5f86', basin: '#123a52' },
  { name: 'Aqua', chip: '#37a7bd', basin: '#1f6f86' },
  { name: 'Caribbean', chip: '#2bb3a3', basin: '#137a6b' },
  { name: 'Black Bottom', chip: '#1b2530', basin: '#0c1620' }
];

// ---- shared local builders ------------------------------------------------

/** Coping rim + dark basin + recessed water for a rectangular pool.
 *  Water top sits ~1.5cm below the 12cm coping so the rim frames it. */
function rectPool(g, w, d, p, o = {}) {
  const rim = o.rim ?? 26;
  const basinHex = (p && p.basin) || o.basin || '#123a52';
  const cope = o.cope || tex('real_tumbled_cream', Math.max(1, w / 220), Math.max(1, d / 220));
  box(g, cope, w, 12, d, 0, 0, 0, { r: 3 });                        // stone coping deck
  const bw = Math.max(24, w - rim * 2), bd = Math.max(24, d - rim * 2);
  box(g, solid(basinHex, 0.4), bw, 8, bd, 0, 2, 0);                 // dark plaster basin
  const wt = box(g, water(), bw - 8, 7, bd - 8, 0, 3.5, 0);         // recessed water, top ~10.5
  wt.receiveShadow = true;
  return { bw, bd, basinHex };
}

/** Chrome pool ladder straddling one wall between z1..z2 at x. */
function ladder(g, x, z1, z2) {
  cyl(g, chrome(), 1.8, 26, x, 8, z1);
  cyl(g, chrome(), 1.8, 26, x, 8, z2);
  cyl(g, chrome(), 1.8, Math.abs(z2 - z1), x, 30, (z1 + z2) / 2, { rx: Math.PI / 2 });
}

const jet = (g, x, y, z) => sphere(g, glow('#bfe9ff', 0.55, 0.3), 3, x, y, z, { seg: 10 });

// ---- individual pool bodies -----------------------------------------------

function infinityPool(g, w, d, p) {
  const rim = 26;
  const basinHex = (p && p.basin) || '#0e2f45';
  const cope = tex('real_tumbled_cream', Math.max(1, w / 220), Math.max(1, d / 220));
  box(g, cope, w, 12, d - rim, 0, 0, -rim / 2, { r: 3 });            // coping on 3 sides, open at +Z
  const bw = w - rim * 2, bd = d - rim * 0.6;
  box(g, solid(basinHex, 0.4), bw, 8, bd, 0, 2, rim * 0.2);
  const wt = box(g, water(), bw - 8, 7, bd, 0, 3.5, rim * 0.2);
  wt.receiveShadow = true;
  box(g, cope, bw + 8, 11, 3, 0, 0, d / 2 - 1.5);                    // thin vanishing lip flush w/ water
  const sheet = box(g, water(), bw, 10, 1.5, 0, -9, d / 2 + 0.6);    // sheet falling over the edge
  sheet.receiveShadow = true;
  box(g, solid('#20323f', 0.5), bw + 12, 3, 8, 0, 0, d / 2 + 7);     // catch trough beyond
}

function lapPool(g, w, d, p) {
  const { bw, bd } = rectPool(g, w, d, p);
  box(g, solid('#0b1c28', 0.4), bw * 0.9, 0.6, 10, 0, 7.4, 0);       // center lane line (length = w)
  for (const sgn of [-1, 1]) box(g, solid('#0b1c28', 0.4), 26, 0.6, 6, sgn * (bw * 0.42), 7.4, 0);
  ladder(g, bw / 2 - 8, -14, 14);
}

function plungePool(g, w, d, p) {
  const { bw, bd } = rectPool(g, w, d, p, { basin: (p && p.basin) || '#0f3346' });
  box(g, solid('#2a5f78', 0.5), bw, 4, 26, 0, 2, bd / 2 - 13);       // submerged bench seat
  for (const x of [-bw * 0.22, bw * 0.22]) cyl(g, glow('#cfeeff', 0.4, 0.3), 5, 1, x, 8, bd / 2 - 13, { seg: 14 });
  for (let i = 0; i < 3; i++) box(g, tex('tile_white', 1, 1), 46, 3, 12, 0, 3 - i * 0.6, -(bd / 2 - 10 - i * 13), { r: 4 });
}

function kidneyPool(g, w, d, p) {
  const cope = tex('real_tumbled_cream', 1.6, 1.6);
  const basin = solid((p && p.basin) || '#123a52', 0.4);
  const m = Math.min(w, d);
  const lobes = [[-w * 0.17, 0, m * 0.32], [w * 0.20, d * 0.06, m * 0.27]];
  for (const [cx, cz, r] of lobes) cyl(g, cope, r + 14, 12, cx, 0, cz, { seg: 40 });
  for (const [cx, cz, r] of lobes) {
    cyl(g, basin, r, 8, cx, 1, cz, { seg: 40 });
    const wt = cyl(g, water(), r - 6, 7, cx, 2.5, cz, { seg: 40 });
    wt.receiveShadow = true;
  }
  for (const x of [-w * 0.17, w * 0.20]) jet(g, x, 9, 0);
}

function rectModernPool(g, w, d, p) {
  const { bw, bd } = rectPool(g, w, d, p, { cope: tex('tile_gray', Math.max(1, w / 220), Math.max(1, d / 220)), rim: 22 });
  box(g, solid('#4f93a6', 0.4), bw, 7, 60, 0, 2, -(bd / 2 - 30));    // sun/tanning shelf, one end
  const sw = box(g, water(), bw - 6, 4, 56, 0, 7, -(bd / 2 - 30));
  sw.receiveShadow = true;
  ladder(g, bw / 2 - 8, -14, 14);
}

function lPool(g, w, d, p) {
  const basinHex = (p && p.basin) || '#123a52';
  const cope = tex('real_tumbled_cream', Math.max(1, w / 220), Math.max(1, d / 220));
  const armD = d * 0.5, legW = w * 0.55;
  box(g, cope, w, 12, armD, 0, 0, -(d / 2 - armD / 2), { r: 3 });    // top arm coping
  box(g, cope, legW, 12, d, -(w / 2 - legW / 2), 0, 0, { r: 3 });    // left leg coping
  const b1w = w - 40, b1d = armD - 30;
  const b2w = legW - 40, b2d = d - 30;
  box(g, solid(basinHex, 0.4), b1w, 8, b1d, 0, 2, -(d / 2 - armD / 2));
  box(g, solid(basinHex, 0.4), b2w, 8, b2d, -(w / 2 - legW / 2), 2, 0);
  const w1 = box(g, water(), b1w - 8, 7, b1d - 8, 0, 3.5, -(d / 2 - armD / 2));
  const w2 = box(g, water(), b2w - 8, 7, b2d - 8, -(w / 2 - legW / 2), 3.3, 0);
  w1.receiveShadow = true; w2.receiveShadow = true;
  ladder(g, w / 2 - 24, -(d / 2 - armD / 2) - 14, -(d / 2 - armD / 2) + 14);
}

function lagoonPool(g, w, d, p) {
  const rb = 100, rx = w / 2, rz = d / 2;
  const bed = cyl(g, solid('#12332b', 0.9), rb, 3, 0, 1, 0, { seg: 44 });
  bed.scale.set(w / (2 * rb), 1, d / (2 * rb));
  const wt = cyl(g, water(), rb * 0.94, 6, 0, 2, 0, { seg: 44 });
  wt.scale.set(w / (2 * rb), 1, d / (2 * rb));
  wt.receiveShadow = true;
  let s = 53; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const n = Math.max(14, Math.round((rx + rz) / 26));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd() * 0.25;
    const wob = 1 + 0.08 * Math.sin(a * 3 + 1.7) + 0.05 * Math.sin(a * 5 + 0.4);
    const r = 8 + rnd() * 10;
    blob(g, '#6f6a60', '#9a948a', r, Math.cos(a) * rx * wob * 0.98, 2 + r * 0.2, Math.sin(a) * rz * wob * 0.98,
      { seed: i + 3, sy: 0.6 + rnd() * 0.2 });
  }
  blob(g, '#5c574e', '#857f74', 22, rx * 0.5, 11, -rz * 0.5, { seed: 9 });  // waterfall boulder
  foliage(g, '#2f5a2a', '#5c9c46', rx * 0.52, 18, -rz * 0.52, 28, 10, 4);   // tropical planting
}

function poolSpaCombo(g, w, d, p) {
  const { bw, bd, basinHex } = rectPool(g, w, d, p);
  const sx = w / 2 - 70, sz = -(d / 2 - 70), sr = 52;
  cyl(g, tex('real_tumbled_cream', 2, 2), sr + 10, 26, sx, 0, sz, { seg: 40 }); // raised spa wall
  cyl(g, solid(basinHex, 0.4), sr, 6, sx, 24, sz, { seg: 40 });
  const sw = cyl(g, water(), sr - 6, 5, sx, 26, sz, { seg: 40 });
  sw.receiveShadow = true;
  const spill = box(g, water(), 44, 22, 4, sx - 34, 6, sz + 34, { ry: Math.PI / 4 }); // spillover weir into pool
  spill.receiveShadow = true;
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; jet(g, sx + Math.cos(a) * (sr - 12), 27, sz + Math.sin(a) * (sr - 12)); }
}

function tanningPool(g, w, d, p) {
  const { bw, bd } = rectPool(g, w, d, p);
  const ledgeD = Math.min(bd * 0.34, 100);
  box(g, solid('#6fa9bd', 0.4), bw, 7, ledgeD, 0, 2, -(bd / 2 - ledgeD / 2));       // pale shallow Baja shelf floor
  const lw = box(g, water(), bw - 6, 4, ledgeD - 4, 0, 7, -(bd / 2 - ledgeD / 2));  // thin water over the shelf
  lw.receiveShadow = true;
  for (const x of [-bw * 0.2, bw * 0.2]) cyl(g, glow('#cfeeff', 0.4, 0.3), 5, 1, x, 7.5, -(bd / 2 - ledgeD / 2), { seg: 14 });
  ladder(g, bw / 2 - 8, bd / 2 - 30, bd / 2 - 4);
}

function ovalPool(g, w, d, p) {
  const basinHex = (p && p.basin) || '#123a52', rb = 100;
  const c1 = cyl(g, tex('real_tumbled_cream', 3, 3), rb, 12, 0, 0, 0, { seg: 60 });
  c1.scale.set(w / (2 * rb), 1, d / (2 * rb));
  const c2 = cyl(g, solid(basinHex, 0.4), rb, 8, 0, 1.5, 0, { seg: 60 });
  c2.scale.set((w - 52) / (2 * rb), 1, (d - 52) / (2 * rb));
  const wt = cyl(g, water(), rb, 7, 0, 3, 0, { seg: 60 });
  wt.scale.set((w - 66) / (2 * rb), 1, (d - 66) / (2 * rb));
  wt.receiveShadow = true;
}

function romanPool(g, w, d, p) {
  const basinHex = (p && p.basin) || '#123a52';
  box(g, tex('real_tumbled_cream', Math.max(1, w / 220), Math.max(1, d / 220)), w, 12, d, 0, 0, 0, { r: Math.min(w, d) * 0.22 });
  const bw = w - 52, bd = d - 52;
  box(g, solid(basinHex, 0.4), bw, 8, bd, 0, 2, 0, { r: Math.min(bw, bd) * 0.18 });
  const wt = box(g, water(), bw - 8, 7, bd - 8, 0, 3.5, 0, { r: Math.min(bw, bd) * 0.16 });
  wt.receiveShadow = true;
  for (let i = 0; i < 3; i++) {                                     // roman fan steps at -Z end
    const sw = bw * (0.5 - i * 0.09);
    box(g, tex('tile_white', 1, 1), sw, 3 + i, 20, 0, 3 - i * 0.6, -(bd / 2 - 14 - i * 16), { r: 8 });
  }
}

function cocktailPool(g, w, d, p) {
  const { bw, bd } = rectPool(g, w, d, p);
  box(g, solid('#2a5f78', 0.5), bw, 4, 18, 0, 2, -(bd / 2 - 9));     // wrap bench (two sides)
  box(g, solid('#2a5f78', 0.5), 18, 4, bd, -(bw / 2 - 9), 2, 0);
  for (const x of [-bw * 0.2, 0, bw * 0.2]) for (const z of [-bd * 0.15, bd * 0.15])
    cyl(g, glow('#cfeeff', 0.4, 0.3), 4, 1, x, 8, z, { seg: 12 });   // bubbler jets
}

function splashPad(g, w, d) {
  box(g, tex('pavement', Math.max(1, w / 200), Math.max(1, d / 200)), w, 6, d, 0, 0, 0, { r: 2 });
  let s = 7; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const cols = Math.max(3, Math.round(w / 120)), rows = Math.max(2, Math.round(d / 120));
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x = -w / 2 + (i + 0.5) * w / cols, z = -d / 2 + (j + 0.5) * d / rows;
    cyl(g, metal('#8f959c', 0.4), 3, 2, x, 6, z, { seg: 12 });        // ground nozzle
    cyl(g, glow('#bcdcff', 0.4, 0.3), 6, 1, x, 6.4, z, { seg: 14 });  // wet splash ring
    const hh = 18 + rnd() * 34;
    const plume = cyl(g, water(), 2.4, hh, x, 7, z, { seg: 10, rTop: 5 });
    plume.receiveShadow = true;
  }
}

// ---- catalog defs ---------------------------------------------------------

export const POOLS_ITEMS = [
  {
    id: 'pool_infinity', name: 'Infinity Pool', cat: 'outdoor', w: 520, d: 320, h: 24, noShadow: true,
    areaDraw: true, palettes: WATER_TINTS, plan: { type: 'pool' },
    build: (p) => { const g = G(); infinityPool(g, 520, 320, p); return g; },
    buildSized: (p, w, d) => { const g = G(); infinityPool(g, w, d, p); return g; }
  },
  {
    id: 'pool_lap', name: 'Lap Pool', cat: 'outdoor', w: 760, d: 200, h: 24, noShadow: true,
    areaDraw: true, palettes: WATER_TINTS, plan: { type: 'pool' },
    build: (p) => { const g = G(); lapPool(g, 760, 200, p); return g; },
    buildSized: (p, w, d) => { const g = G(); lapPool(g, w, d, p); return g; }
  },
  {
    id: 'pool_plunge', name: 'Plunge Pool', cat: 'outdoor', w: 240, d: 240, h: 26, noShadow: true,
    areaDraw: true, palettes: WATER_TINTS, plan: { type: 'pool' },
    build: (p) => { const g = G(); plungePool(g, 240, 240, p); return g; },
    buildSized: (p, w, d) => { const g = G(); plungePool(g, w, d, p); return g; }
  },
  {
    id: 'pool_kidney', name: 'Kidney Pool', cat: 'outdoor', w: 460, d: 320, h: 24, noShadow: true,
    areaDraw: true, palettes: WATER_TINTS, plan: { type: 'pool' },
    build: (p) => { const g = G(); kidneyPool(g, 460, 320, p); return g; },
    buildSized: (p, w, d) => { const g = G(); kidneyPool(g, w, d, p); return g; }
  },
  {
    id: 'pool_rect_modern', name: 'Modern Rectangular Pool', cat: 'outdoor', w: 520, d: 300, h: 24, noShadow: true,
    areaDraw: true, palettes: WATER_TINTS, plan: { type: 'pool' },
    build: (p) => { const g = G(); rectModernPool(g, 520, 300, p); return g; },
    buildSized: (p, w, d) => { const g = G(); rectModernPool(g, w, d, p); return g; }
  },
  {
    id: 'pool_lshape', name: 'L-Shaped Pool', cat: 'outdoor', w: 460, d: 420, h: 24, noShadow: true,
    areaDraw: true, palettes: WATER_TINTS, plan: { type: 'pool' },
    build: (p) => { const g = G(); lPool(g, 460, 420, p); return g; },
    buildSized: (p, w, d) => { const g = G(); lPool(g, w, d, p); return g; }
  },
  {
    id: 'pool_lagoon', name: 'Natural Lagoon Pool', cat: 'outdoor', w: 480, d: 380, h: 22, noShadow: true,
    areaDraw: true, palettes: null, plan: { type: 'pond' },
    build: (p) => { const g = G(); lagoonPool(g, 480, 380, p); return g; },
    buildSized: (p, w, d) => { const g = G(); lagoonPool(g, w, d, p); return g; }
  },
  {
    id: 'pool_spa_combo', name: 'Pool + Spa Combo', cat: 'outdoor', w: 540, d: 340, h: 26, noShadow: true,
    areaDraw: true, palettes: WATER_TINTS, plan: { type: 'pool' },
    build: (p) => { const g = G(); poolSpaCombo(g, 540, 340, p); return g; },
    buildSized: (p, w, d) => { const g = G(); poolSpaCombo(g, w, d, p); return g; }
  },
  {
    id: 'pool_tanning', name: 'Tanning-Ledge Pool', cat: 'outdoor', w: 520, d: 320, h: 24, noShadow: true,
    areaDraw: true, palettes: WATER_TINTS, plan: { type: 'pool' },
    build: (p) => { const g = G(); tanningPool(g, 520, 320, p); return g; },
    buildSized: (p, w, d) => { const g = G(); tanningPool(g, w, d, p); return g; }
  },
  {
    id: 'pool_oval', name: 'Oval Pool', cat: 'outdoor', w: 460, d: 300, h: 24, noShadow: true,
    areaDraw: true, palettes: WATER_TINTS, plan: { type: 'pool' },
    build: (p) => { const g = G(); ovalPool(g, 460, 300, p); return g; },
    buildSized: (p, w, d) => { const g = G(); ovalPool(g, w, d, p); return g; }
  },
  {
    id: 'pool_roman', name: 'Roman Pool', cat: 'outdoor', w: 500, d: 320, h: 24, noShadow: true,
    areaDraw: true, palettes: WATER_TINTS, plan: { type: 'pool' },
    build: (p) => { const g = G(); romanPool(g, 500, 320, p); return g; },
    buildSized: (p, w, d) => { const g = G(); romanPool(g, w, d, p); return g; }
  },
  {
    id: 'pool_cocktail', name: 'Cocktail Pool', cat: 'outdoor', w: 280, d: 280, h: 24, noShadow: true,
    areaDraw: true, palettes: WATER_TINTS, plan: { type: 'pool' },
    build: (p) => { const g = G(); cocktailPool(g, 280, 280, p); return g; },
    buildSized: (p, w, d) => { const g = G(); cocktailPool(g, w, d, p); return g; }
  },
  {
    id: 'pool_splash', name: 'Splash Pad', cat: 'outdoor', w: 360, d: 300, h: 8, noShadow: true,
    areaDraw: true, palettes: null, plan: { type: 'pool' },
    build: () => { const g = G(); splashPad(g, 360, 300); return g; },
    buildSized: (p, w, d) => { const g = G(); splashPad(g, w, d); return g; }
  },
  {
    id: 'spa_round', name: 'Round Hot Tub', cat: 'outdoor', w: 216, d: 216, h: 74,
    palettes: null, plan: { type: 'hottub' }, light: { color: '#59c3e6', intensity: 0.7, distance: 190, y: 55 },
    build: () => {
      const g = G();
      cyl(g, wood('#5b4632', 0.8), 108, 60, 0, 0, 0, { seg: 44 });            // wood barrel
      cyl(g, tex('real_tumbled_cream', 3, 1), 100, 14, 0, 60, 0, { seg: 44 }); // coping rim
      cyl(g, solid('#2a6f88', 0.35), 86, 6, 0, 58, 0, { seg: 40 });            // basin
      const wt = cyl(g, water(), 82, 6, 0, 60, 0, { seg: 40 });
      wt.receiveShadow = true;
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; box(g, solid('#2e3440', 0.5), 26, 5, 10, Math.cos(a) * 78, 66, Math.sin(a) * 78, { r: 3, ry: -a }); }
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; jet(g, Math.cos(a) * 66, 62, Math.sin(a) * 66); }
      for (let i = 0; i < 10; i++) { const a = i * 2.2; sphere(g, glow('#dff2ff', 0.4, 0.2), 2.2, Math.cos(a) * 40, 63 + (i % 3) * 3, Math.sin(a) * 40, { seg: 8 }); }
      return g;
    }
  },
  {
    id: 'spa_square', name: 'Modern Square Spa', cat: 'outdoor', w: 200, d: 200, h: 80,
    palettes: null, plan: { type: 'hottub' }, light: { color: '#59c3e6', intensity: 0.7, distance: 190, y: 60 },
    build: () => {
      const g = G();
      box(g, solid('#26292e', 0.5), 200, 66, 200, 0, 0, 0, { r: 8, seg: 4 });   // dark cabinet
      box(g, tex('tile_gray', 2, 2), 196, 12, 196, 0, 66, 0, { r: 4, seg: 4 }); // rim
      box(g, solid('#2a6f88', 0.35), 150, 6, 150, 0, 64, 0);
      const wt = box(g, water(), 150, 6, 150, 0, 66, 0);
      wt.receiveShadow = true;
      box(g, tex('tile_gray', 2, 0.4), 150, 4, 14, 0, 66, 106);                 // linear spillover weir
      const sh = box(g, water(), 146, 3, 10, 0, 68, 106);
      sh.receiveShadow = true;
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) jet(g, -54 + i * 36, 68, -54 + j * 36);
      return g;
    }
  },
  {
    id: 'spa_stock', name: 'Stock Tank Spa', cat: 'outdoor', w: 200, d: 200, h: 64,
    palettes: null, plan: { type: 'hottub' }, light: { color: '#59c3e6', intensity: 0.6, distance: 170, y: 48 },
    build: () => {
      const g = G();
      cyl(g, metal('#8a9099', 0.5), 100, 58, 0, 0, 0, { seg: 8 });              // galvanized tank
      for (const y of [12, 30, 46]) cyl(g, metal('#c9ced4', 0.4), 101, 4, 0, y, 0, { seg: 8 }); // ribs
      cyl(g, metal('#b7bcc2', 0.4), 102, 6, 0, 56, 0, { seg: 8 });              // top rail
      cyl(g, solid('#1d4a63', 0.4), 94, 5, 0, 50, 0, { seg: 40 });
      const wt = cyl(g, water(), 92, 5, 0, 53, 0, { seg: 40 });
      wt.receiveShadow = true;
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; jet(g, Math.cos(a) * 70, 55, Math.sin(a) * 70); }
      return g;
    }
  }
];
