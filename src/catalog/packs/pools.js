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
// KEY RULE: the water() surface must be the TOPMOST element of a pool. Three.js
// has no CSG, so a solid coping slab drawn over the water would hide it. Instead
// the coping deck sits at ~12cm and the (inset) water fills to ~13.5cm — proud
// of the deck by ~1.5cm — so the rim frames a brim-full pool and water always
// shows. A dark basin sits just under the water to tint its depth.
const DECK = 12;      // coping deck top
const WTOP = 13.5;    // water surface top (proud of the deck)

/** Dark basin + proud rippled water filling a rectangular interior. */
function waterRect(g, cx, cz, bw, bd, basinHex, top = WTOP, r = 0) {
  box(g, solid(basinHex, 0.4), bw, top - 1, bd, cx, 0, cz, r ? { r } : {});
  const wt = box(g, water(), bw - 6, top, bd - 6, cx, 0, cz, r ? { r: r * 0.85 } : {});
  wt.receiveShadow = true;
}

/** Dark basin + proud rippled water filling a round interior (radius r). */
function waterDisc(g, cx, cz, r, basinHex, top = WTOP, seg = 44) {
  cyl(g, solid(basinHex, 0.4), r, top - 1, cx, 0, cz, { seg });
  const wt = cyl(g, water(), r - 4, top, cx, 0, cz, { seg });
  wt.receiveShadow = true;
}

/** Coping rim + dark basin + brim-full water for a rectangular pool. */
function rectPool(g, w, d, p, o = {}) {
  const rim = o.rim ?? 26;
  const basinHex = (p && p.basin) || o.basin || '#123a52';
  const cope = o.cope || tex('real_travertine', Math.max(1, w / 220), Math.max(1, d / 220));
  box(g, cope, w, DECK, d, 0, 0, 0, { r: 3 });                      // stone coping deck (top 12)
  const bw = Math.max(24, w - rim * 2), bd = Math.max(24, d - rim * 2);
  waterRect(g, 0, 0, bw, bd, basinHex);                             // proud water fills the opening
  return { bw, bd, basinHex };
}

/** Chrome pool ladder straddling one wall between z1..z2 at x. */
function ladder(g, x, z1, z2) {
  cyl(g, chrome(), 1.8, 24, x, 12, z1);
  cyl(g, chrome(), 1.8, 24, x, 12, z2);
  cyl(g, chrome(), 1.8, Math.abs(z2 - z1), x, 34, (z1 + z2) / 2, { rx: Math.PI / 2 });
}

const jet = (g, x, y, z) => sphere(g, glow('#bfe9ff', 0.55, 0.3), 3, x, y, z, { seg: 10 });

// ---- individual pool bodies -----------------------------------------------

function infinityPool(g, w, d, p) {
  const rim = 26;
  const basinHex = (p && p.basin) || '#0e2f45';
  const cope = tex('real_travertine', Math.max(1, w / 220), Math.max(1, d / 220));
  box(g, cope, w, DECK, d - rim, 0, 0, -rim / 2, { r: 3 });          // coping on 3 sides, open at +Z
  const bw = w - rim * 2, bd = d - rim * 0.6;
  waterRect(g, 0, rim * 0.2, bw, bd, basinHex);                      // brim-full water
  box(g, cope, bw + 8, DECK - 1, 3, 0, 0, d / 2 - 1.5);              // thin vanishing lip
  const sheet = box(g, water(), bw, 13, 1.5, 0, 0.5, d / 2 + 0.6);   // sheet falling over the edge
  sheet.receiveShadow = true;
  box(g, solid('#20323f', 0.5), bw + 12, 3, 8, 0, 0, d / 2 + 7);     // catch trough beyond
}

function lapPool(g, w, d, p) {
  const { bw, bd } = rectPool(g, w, d, p);
  box(g, solid('#0b1c28', 0.4), bw * 0.9, 0.6, 10, 0, 11, 0);        // center lane line (just under surface)
  for (const sgn of [-1, 1]) box(g, solid('#0b1c28', 0.4), 26, 0.6, 6, sgn * (bw * 0.42), 11, 0);
  ladder(g, bw / 2 - 8, -14, 14);
}

function plungePool(g, w, d, p) {
  const { bw, bd } = rectPool(g, w, d, p, { basin: (p && p.basin) || '#0f3346' });
  box(g, solid('#2a5f78', 0.5), bw, 8, 26, 0, 0, bd / 2 - 13);       // submerged bench seat
  for (const x of [-bw * 0.22, bw * 0.22]) cyl(g, glow('#cfeeff', 0.4, 0.3), 5, 1, x, 12, bd / 2 - 13, { seg: 14 });
  for (let i = 0; i < 3; i++) box(g, tex('tile_white', 1, 1), 46, 4 + i * 2, 12, 0, 0, -(bd / 2 - 10 - i * 13), { r: 3 });
}

function kidneyPool(g, w, d, p) {
  const cope = tex('real_travertine', 1.6, 1.6);
  const basinHex = (p && p.basin) || '#123a52';
  const m = Math.min(w, d);
  const lobes = [[-w * 0.17, 0, m * 0.32], [w * 0.20, d * 0.06, m * 0.27]];
  for (const [cx, cz, r] of lobes) cyl(g, cope, r + 14, DECK, cx, 0, cz, { seg: 40 });  // coping
  for (const [cx, cz, r] of lobes) waterDisc(g, cx, cz, r, basinHex, WTOP, 40);         // brim-full water
  for (const x of [-w * 0.17, w * 0.20]) jet(g, x, WTOP - 1, 0);
}

function rectModernPool(g, w, d, p) {
  const { bw, bd } = rectPool(g, w, d, p, { cope: tex('tile_gray', Math.max(1, w / 220), Math.max(1, d / 220)), rim: 22 });
  box(g, solid('#4f93a6', 0.4), bw, 10, 60, 0, 0, -(bd / 2 - 30));   // sun/tanning shelf, one end (paler, shallow)
  ladder(g, bw / 2 - 8, -14, 14);
}

function lPool(g, w, d, p) {
  const basinHex = (p && p.basin) || '#123a52';
  const cope = tex('real_travertine', Math.max(1, w / 220), Math.max(1, d / 220));
  const armD = d * 0.5, legW = w * 0.55;
  box(g, cope, w, DECK, armD, 0, 0, -(d / 2 - armD / 2), { r: 3 });  // top arm coping
  box(g, cope, legW, DECK, d, -(w / 2 - legW / 2), 0, 0, { r: 3 });  // left leg coping
  const b1w = w - 40, b1d = armD - 30;
  const b2w = legW - 40, b2d = d - 30;
  waterRect(g, 0, -(d / 2 - armD / 2), b1w, b1d, basinHex);          // brim-full water, both wings
  waterRect(g, -(w / 2 - legW / 2), 0, b2w, b2d, basinHex);
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
  cyl(g, tex('real_travertine', 2, 2), sr + 10, 22, sx, 0, sz, { seg: 40 });  // raised spa wall (rim at 22)
  waterDisc(g, sx, sz, sr, basinHex, 24, 40);                                  // spa water proud of its wall
  const spill = box(g, water(), 44, 22, 4, sx - 34, 2, sz + 34, { ry: Math.PI / 4 }); // spillover weir into pool
  spill.receiveShadow = true;
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; jet(g, sx + Math.cos(a) * (sr - 12), 24, sz + Math.sin(a) * (sr - 12)); }
}

function tanningPool(g, w, d, p) {
  const { bw, bd } = rectPool(g, w, d, p);
  const ledgeD = Math.min(bd * 0.34, 100);
  box(g, solid('#6fa9bd', 0.4), bw, 11, ledgeD, 0, 0, -(bd / 2 - ledgeD / 2));    // pale shallow Baja shelf floor
  for (const x of [-bw * 0.2, bw * 0.2]) cyl(g, glow('#cfeeff', 0.4, 0.3), 5, 1, x, 12, -(bd / 2 - ledgeD / 2), { seg: 14 });
  ladder(g, bw / 2 - 8, bd / 2 - 30, bd / 2 - 4);
}

function ovalPool(g, w, d, p) {
  const basinHex = (p && p.basin) || '#123a52', rb = 100;
  const c1 = cyl(g, tex('real_travertine', 3, 3), rb, DECK, 0, 0, 0, { seg: 60 });
  c1.scale.set(w / (2 * rb), 1, d / (2 * rb));                       // coping oval (top 12)
  const c2 = cyl(g, solid(basinHex, 0.4), rb, WTOP - 1, 0, 0, 0, { seg: 60 });
  c2.scale.set((w - 52) / (2 * rb), 1, (d - 52) / (2 * rb));         // basin
  const wt = cyl(g, water(), rb, WTOP, 0, 0, 0, { seg: 60 });
  wt.scale.set((w - 66) / (2 * rb), 1, (d - 66) / (2 * rb));         // brim-full water (proud)
  wt.receiveShadow = true;
}

function romanPool(g, w, d, p) {
  const basinHex = (p && p.basin) || '#123a52';
  box(g, tex('real_travertine', Math.max(1, w / 220), Math.max(1, d / 220)), w, DECK, d, 0, 0, 0, { r: Math.min(w, d) * 0.22 });
  const bw = w - 52, bd = d - 52;
  waterRect(g, 0, 0, bw, bd, basinHex, WTOP, Math.min(bw, bd) * 0.16); // brim-full rounded water
  for (let i = 0; i < 3; i++) {                                     // roman fan steps at -Z end (submerged)
    const sw = bw * (0.5 - i * 0.09);
    box(g, tex('tile_white', 1, 1), sw, 5 + i * 2, 20, 0, 0, -(bd / 2 - 14 - i * 16), { r: 6 });
  }
}

function cocktailPool(g, w, d, p) {
  const { bw, bd } = rectPool(g, w, d, p);
  box(g, solid('#2a5f78', 0.5), bw, 9, 18, 0, 0, -(bd / 2 - 9));     // wrap bench (submerged)
  box(g, solid('#2a5f78', 0.5), 18, 9, bd, -(bw / 2 - 9), 0, 0);
  for (const x of [-bw * 0.2, 0, bw * 0.2]) for (const z of [-bd * 0.15, bd * 0.15])
    cyl(g, glow('#cfeeff', 0.4, 0.3), 4, 1, x, 12, z, { seg: 12 });  // bubbler jets
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
      cyl(g, wood('#5b4632', 0.8), 108, 60, 0, 0, 0, { seg: 44 });            // wood barrel; its top face is the rim
      cyl(g, solid('#2a6f88', 0.35), 96, 62, 0, 0, 0, { seg: 40 });           // basin, proud of the barrel
      const wt = cyl(g, water(), 92, 63, 0, 0, 0, { seg: 40 });               // water surface on top
      wt.receiveShadow = true;
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; box(g, solid('#2e3440', 0.5), 26, 5, 10, Math.cos(a) * 84, 63, Math.sin(a) * 84, { r: 3, ry: -a }); }
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; jet(g, Math.cos(a) * 66, 63, Math.sin(a) * 66); }
      for (let i = 0; i < 10; i++) { const a = i * 2.2; sphere(g, glow('#dff2ff', 0.4, 0.2), 2.2, Math.cos(a) * 40, 64 + (i % 3) * 3, Math.sin(a) * 40, { seg: 8 }); }
      return g;
    }
  },
  {
    id: 'spa_square', name: 'Modern Square Spa', cat: 'outdoor', w: 200, d: 200, h: 80,
    palettes: null, plan: { type: 'hottub' }, light: { color: '#59c3e6', intensity: 0.7, distance: 190, y: 60 },
    build: () => {
      const g = G();
      box(g, solid('#26292e', 0.5), 200, 62, 200, 0, 0, 0, { r: 8, seg: 4 });   // dark cabinet
      box(g, tex('tile_gray', 2, 2), 200, 4, 200, 0, 62, 0, { r: 4 });          // flush tile deck (top 66)
      box(g, solid('#2a6f88', 0.35), 164, 68, 164, 0, 0, 0, { r: 6 });          // basin proud of the deck
      const wt = box(g, water(), 158, 69, 158, 0, 0, 0, { r: 6 });              // water surface on top
      wt.receiveShadow = true;
      const sh = box(g, water(), 150, 66, 10, 0, 0, 104);                       // spillover sheet, front face
      sh.receiveShadow = true;
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) jet(g, -54 + i * 36, 69, -54 + j * 36);
      return g;
    }
  },
  {
    id: 'spa_stock', name: 'Stock Tank Spa', cat: 'outdoor', w: 200, d: 200, h: 64,
    palettes: null, plan: { type: 'hottub' }, light: { color: '#59c3e6', intensity: 0.6, distance: 170, y: 48 },
    build: () => {
      const g = G();
      cyl(g, metal('#8a9099', 0.5), 100, 56, 0, 0, 0, { seg: 8 });              // galvanized tank
      for (const y of [12, 30, 46]) cyl(g, metal('#c9ced4', 0.4), 101, 4, 0, y, 0, { seg: 8 }); // ribs
      cyl(g, metal('#b7bcc2', 0.4), 102, 5, 0, 52, 0, { seg: 8 });              // top rail (below the water)
      cyl(g, solid('#1d4a63', 0.4), 92, 58, 0, 0, 0, { seg: 40 });              // basin
      const wt = cyl(g, water(), 88, 59, 0, 0, 0, { seg: 40 });                 // water surface on top
      wt.receiveShadow = true;
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; jet(g, Math.cos(a) * 70, 59, Math.sin(a) * 70); }
      return g;
    }
  }
];
