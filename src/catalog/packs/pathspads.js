// PATHS & PADS pack — 16 drawable walkway strokes and drag-to-size ground
// pads. Paths are rendered in 3D by arch3d's buildPathModel from def.path
// (the build() here only feeds the catalog thumbnail); pads are flat raised
// slabs (≤14 cm) that fill exactly the dragged w×d.
import { G, box, cyl, solid, wood, metal, tex } from '../builders.js';

// ---------------------------------------------------------------------------
// helpers

/** Thumbnail strip for a drawable path: one textured slab at the path width. */
function pathThumb(mat, len, width, h, scale) {
  const g = G();
  box(g, tex(mat, len / scale, width / scale), len, h, width, 0, 0, 0);
  return g;
}

/** Thin painted line lying on top of a slab (top = slab height). */
function paint(g, mat, w, d, x, z, topY, ry = 0) {
  const m = box(g, mat, w, 0.35, d, x, topY - 0.15, z, ry ? { ry } : {});
  m.castShadow = false;
  return m;
}

// ---------------------------------------------------------------------------
// palettes

const CONCRETE_PADS = [
  { name: 'Broom Grey', chip: '#bdb9b1', mat: 'concrete_broom', scale: 150, joint: '#8f8b82' },
  { name: 'Panel Smooth', chip: '#a5a29b', mat: 'pavement', scale: 200, joint: '#7d7a73' },
  { name: 'Warm Buff', chip: '#c9c0ae', mat: 'real_tumbled_cream', scale: 220, joint: '#95896f' }
];
const PAVER_PADS = [
  { name: 'Sand Pavers / Brick', chip: '#c8b49a', mat: 'real_basket_pavers', scale: 300, border: 'real_brick_red', bscale: 110 },
  { name: 'Cobble / Concrete', chip: '#8d8d88', mat: 'real_cobblestone', scale: 320, border: 'pavement', bscale: 120 },
  { name: 'Blush Stone / Cream', chip: '#c4a294', mat: 'real_blush_stone', scale: 240, border: 'real_tumbled_cream', bscale: 110 }
];
const GRAVEL_PADS = [
  { name: 'Pea Gravel', chip: '#9a938a', mat: 'gravel', scale: 140, timber: '#7a5c3c' },
  { name: 'White Rock', chip: '#cfccc4', mat: 'real_gravel_white', scale: 220, timber: '#6a4f36' },
  { name: 'Sand Court', chip: '#cdb37c', mat: 'real_sand', scale: 300, timber: '#8a6a48' }
];
const SPORT_PADS = [
  { name: 'Forest / Rust', chip: '#2f5d4a', base: '#31584a', key: '#9c4a38', line: '#f0ede2' },
  { name: 'Royal / Navy', chip: '#3a66a8', base: '#3a66a8', key: '#243d63', line: '#f2f3f5' },
  { name: 'Asphalt / Gold', chip: '#3a3c40', base: '#3b3d42', key: '#7d3b31', line: '#f3d05a' }
];
const PLAY_PADS = [
  { name: 'Meadow Green', chip: '#5b9068', base: '#5b9068', band: '#83b285', dot: '#cfe3c4' },
  { name: 'Harbor Blue', chip: '#4d7fae', base: '#4d7fae', band: '#7fa9cc', dot: '#d3e3ef' },
  { name: 'Terracotta', chip: '#bf7350', base: '#bf7350', band: '#d69a72', dot: '#f0dbc0' }
];
const PARKING_PADS = [
  { name: 'Asphalt / White', chip: '#3a3c40', mat: 'asphalt', scale: 320, line: '#e8e6df', stop: '#b8b4ab' },
  { name: 'Asphalt / Yellow', chip: '#46484c', mat: 'asphalt', scale: 320, line: '#e3c14e', stop: '#b8b4ab' },
  { name: 'Concrete / Yellow', chip: '#a5a29b', mat: 'pavement', scale: 200, line: '#d9b846', stop: '#8f8b82' }
];
const FIREPIT_PADS = [
  { name: 'Grey / Slate', chip: '#9a938a', mat: 'gravel', scale: 140, stone: '#6d6a64', stone2: '#7d7a72', core: '#57534d' },
  { name: 'White / Cream', chip: '#cfccc4', mat: 'real_gravel_white', scale: 220, stone: '#b3a488', stone2: '#c2b498', core: '#8a8276' }
];
const HOTTUB_PADS = [
  { name: 'Broom Concrete', chip: '#bdb9b1', mat: 'concrete_broom', scale: 150, cap: 'pavement', cscale: 200 },
  { name: 'Charcoal Panel', chip: '#6f6d68', mat: 'pavement', scale: 200, cap: 'concrete_broom', cscale: 150 }
];

// ---------------------------------------------------------------------------
// pad builders (buildSized fills exactly w×d, flat ≤14 cm, ≤25 meshes)

/** Broom concrete pad with scored expansion-joint grooves. */
function buildConcretePad(p, w, d, h) {
  const g = G();
  box(g, tex(p.mat, w / p.scale, d / p.scale), w, h, d, 0, 0, 0, { r: 1.5 });
  const joint = solid(p.joint, 0.92);
  const nx = Math.min(4, Math.max(1, Math.round(w / 170) - 1));
  const nz = Math.min(3, Math.max(0, Math.round(d / 170) - 1));
  for (let i = 1; i <= nx; i++) paint(g, joint, 1.6, d - 5, -w / 2 + (w * i) / (nx + 1), 0, h + 0.1);
  for (let i = 1; i <= nz; i++) paint(g, joint, w - 5, 1.6, 0, -d / 2 + (d * i) / (nz + 1), h + 0.1);
  return g;
}

/** Paver patio with a contrasting soldier-course border row. */
function buildPaverPad(p, w, d, h) {
  const g = G();
  const bw = Math.min(14, w / 6, d / 6); // border course width
  box(g, tex(p.mat, (w - 2 * bw) / p.scale, (d - 2 * bw) / p.scale), w - 2 * bw, h, d - 2 * bw, 0, 0, 0);
  // soldier course: units run across the border, so repeat along each edge
  box(g, tex(p.border, w / p.bscale, 0.5), w, h, bw, 0, 0, -(d - bw) / 2, { r: 1 });
  box(g, tex(p.border, w / p.bscale, 0.5), w, h, bw, 0, 0, (d - bw) / 2, { r: 1 });
  box(g, tex(p.border, 0.5, (d - 2 * bw) / p.bscale), bw, h, d - 2 * bw, -(w - bw) / 2, 0, 0, { r: 1 });
  box(g, tex(p.border, 0.5, (d - 2 * bw) / p.bscale), bw, h, d - 2 * bw, (w - bw) / 2, 0, 0, { r: 1 });
  return g;
}

/** Contained gravel pad inside a timber edging frame. */
function buildGravelPad(p, w, d, h) {
  const g = G();
  const t = Math.min(10, w / 8, d / 8); // timber thickness
  const wm = wood(p.timber, 0.8);
  box(g, wm, w, h, t, 0, 0, -(d - t) / 2, { r: 1.4 });
  box(g, wm, w, h, t, 0, 0, (d - t) / 2, { r: 1.4 });
  box(g, wm, t, h, d - 2 * t, -(w - t) / 2, 0, 0, { r: 1.4 });
  box(g, wm, t, h, d - 2 * t, (w - t) / 2, 0, 0, { r: 1.4 });
  const fill = box(g, tex(p.mat, (w - t) / p.scale, (d - t) / p.scale),
    w - 2 * t + 2, h - 3, d - 2 * t + 2, 0, 0, 0);
  fill.castShadow = false;
  return g;
}

/** Sport half-court: acrylic slab, painted key + free-throw arc + border. */
function buildSportPad(p, w, d, h) {
  const g = G();
  box(g, solid(p.base, 0.88), w, h, d, 0, 0, 0, { r: 1.5 });
  const line = solid(p.line, 0.6);
  const inset = Math.min(12, w * 0.04, d * 0.04);
  const iw = w - 2 * inset, idp = d - 2 * inset;
  const top = h;
  // boundary
  paint(g, line, iw, 3, 0, -idp / 2, top + 0.1);
  paint(g, line, iw, 3, 0, idp / 2, top + 0.1);
  paint(g, line, 3, idp, -iw / 2, 0, top + 0.1);
  paint(g, line, 3, idp, iw / 2, 0, top + 0.1);
  // painted key against the -z baseline
  const kw = Math.min(120, iw * 0.4);
  const kl = Math.min(idp * 0.45, 180);
  const keyFill = box(g, solid(p.key, 0.85), kw, 0.25, kl, 0, top, -idp / 2 + kl / 2);
  keyFill.castShadow = false;
  paint(g, line, 3, kl, -kw / 2, -idp / 2 + kl / 2, top + 0.35);
  paint(g, line, 3, kl, kw / 2, -idp / 2 + kl / 2, top + 0.35);
  paint(g, line, kw + 3, 3, 0, -idp / 2 + kl, top + 0.35);
  // free-throw arc: short tangent segments over the key top
  const r = kw / 2, cx = 0, cz = -idp / 2 + kl, segs = 7;
  for (let i = 0; i < segs; i++) {
    const a = (Math.PI * (i + 0.5)) / segs;
    const segLen = ((Math.PI * r) / segs) * 1.06;
    paint(g, line, segLen, 3, cx + Math.cos(a) * r, cz + Math.sin(a) * r, top + 0.35, a + Math.PI / 2);
  }
  return g;
}

/** Poured rubber safety surface with rounded corners and play accents. */
function buildPlayPad(p, w, d, h) {
  const g = G();
  box(g, solid(p.base, 0.96), w, h, d, 0, 0, 0, { r: Math.min(9, w / 5, d / 5) });
  const band = box(g, solid(p.band, 0.96), w - 34, 0.3, d - 34, 0, h - 0.1,
    0, { r: Math.min(8, (w - 34) / 5, (d - 34) / 5) });
  band.castShadow = false;
  const dot = solid(p.dot, 0.95);
  const rr = Math.min(22, w / 7, d / 7);
  for (const [fx, fz, s] of [[-0.24, -0.18, 1], [0.2, 0.14, 0.72], [-0.05, 0.26, 0.5]]) {
    const c = cyl(g, dot, rr * s, 0.3, w * fx, h + 0.05, d * fz, { seg: 26 });
    c.castShadow = false;
  }
  return g;
}

/** Reinforced hot-tub pad: chamfered two-step slab + corner anchor plates. */
function buildHottubPad(p, w, d, h) {
  const g = G();
  const capH = 3.5;
  box(g, tex(p.cap, w / p.cscale, d / p.cscale), w, h - capH, d, 0, 0, 0, { r: 1.5 });
  box(g, tex(p.mat, (w - 7) / p.scale, (d - 7) / p.scale), w - 7, capH, d - 7, 0, h - capH, 0, { r: 2 });
  const plate = metal('#9aa0a6', 0.45);
  const ix = w / 2 - Math.min(30, w / 5), iz = d / 2 - Math.min(30, d / 5);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    box(g, plate, 12, 0.8, 12, sx * ix, h, sz * iz, { r: 0.4 });
    cyl(g, metal('#6d7278', 0.4), 1.3, 1.5, sx * ix, h, sz * iz, { seg: 10 });
  }
  cyl(g, metal('#6d7278', 0.5), 4, 0.6, 0, h, 0, { seg: 16 }); // conduit stub cap
  return g;
}

/** Parking pad: asphalt slab, painted stall lines, precast wheel stops. */
function buildParkingPad(p, w, d, h) {
  const g = G();
  box(g, tex(p.mat, w / p.scale, d / p.scale), w, h, d, 0, 0, 0, { r: 1.5 });
  const line = solid(p.line, 0.6);
  const stalls = Math.min(4, Math.max(1, Math.round(w / 270)));
  const sw = w / stalls;
  const len = d * 0.86;
  for (let i = 0; i <= stalls; i++) {
    const x = -w / 2 + i * sw;
    paint(g, line, 3.5, len, Math.max(-w / 2 + 2, Math.min(w / 2 - 2, x)), -d / 2 + len / 2 + 4, h + 0.1);
  }
  const stopM = solid(p.stop, 0.85);
  for (let i = 0; i < stalls; i++) {
    const x = -w / 2 + (i + 0.5) * sw;
    const stop = box(g, stopM, Math.min(90, sw * 0.55), 4.5, 11, x, h, -d / 2 + d * 0.16, { r: 1.6 });
    stop.castShadow = false;
  }
  return g;
}

/** Circular fire-pit pad: gravel disc, stone ring band, ember core. */
function buildFirepitPad(p, w, d, h) {
  const g = G();
  const rx = w / 2, rz = d / 2;
  const base = cyl(g, tex(p.mat, w / p.scale, d / p.scale), rx, 6, 0, 0, 0, { seg: 40 });
  base.scale.z = rz / rx;
  base.castShadow = false;
  const R = Math.min(rx, rz) * 0.42; // circular stone ring even on an oval pad
  const n = 10;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const bl = ((Math.PI * 2 * R) / n) * 0.92;
    box(g, solid(i % 2 ? p.stone : p.stone2, 0.9), bl, h - 6, 14,
      Math.cos(a) * R, 6, Math.sin(a) * R, { ry: -a + Math.PI / 2, r: 1.6 });
  }
  const core = cyl(g, solid(p.core, 0.98), R - 8, 1.2, 0, 6, 0, { seg: 28 });
  core.castShadow = false;
  return g;
}

// ---------------------------------------------------------------------------

export const PATHSPADS_ITEMS = [
  // ---- drawable paths -------------------------------------------------------
  {
    id: 'pathp_brick_herringbone', name: 'Herringbone Brick Path', cat: 'paths',
    w: 240, d: 100, h: 4, noShadow: true, palettes: null,
    plan: { type: 'path' }, path: { mat: 'real_brick_red', width: 100 },
    build: () => pathThumb('real_brick_red', 240, 100, 4, 200)
  },
  {
    id: 'pathp_flagstone', name: 'Flagstone Walk', cat: 'paths',
    w: 240, d: 110, h: 4, noShadow: true, palettes: null,
    plan: { type: 'path' }, path: { mat: 'real_plank_pavers', width: 110 },
    build: () => pathThumb('real_plank_pavers', 240, 110, 4, 300)
  },
  {
    id: 'pathp_stepping_stones', name: 'Stepping Stone Path', cat: 'paths',
    w: 220, d: 50, h: 4, noShadow: true, palettes: null,
    plan: { type: 'path' }, path: { mat: 'real_tumbled_cream', width: 50 },
    build: () => pathThumb('real_tumbled_cream', 220, 50, 4, 200)
  },
  {
    id: 'pathp_cobblestone', name: 'Cobblestone Lane', cat: 'paths',
    w: 300, d: 200, h: 4, noShadow: true, palettes: null,
    plan: { type: 'path' }, path: { mat: 'real_cobblestone', width: 200 },
    build: () => pathThumb('real_cobblestone', 300, 200, 4, 320)
  },
  {
    id: 'pathp_boardwalk', name: 'Boardwalk', cat: 'paths',
    w: 260, d: 130, h: 5, noShadow: true, palettes: null,
    plan: { type: 'path' }, path: { mat: 'deck_wood', width: 130 },
    build: () => pathThumb('deck_wood', 260, 130, 5, 260)
  },
  {
    id: 'pathp_mulch', name: 'Mulch Garden Path', cat: 'paths',
    w: 220, d: 80, h: 4, noShadow: true, palettes: null,
    plan: { type: 'path' }, path: { mat: 'real_meadow', width: 80 },
    build: () => pathThumb('real_meadow', 220, 80, 4, 420)
  },
  {
    id: 'pathp_crushed_shell', name: 'Crushed Shell Path', cat: 'paths',
    w: 220, d: 90, h: 4, noShadow: true, palettes: null,
    plan: { type: 'path' }, path: { mat: 'real_gravel_white', width: 90 },
    build: () => pathThumb('real_gravel_white', 220, 90, 4, 240)
  },
  {
    id: 'pathp_rubber_track', name: 'Jogging Track', cat: 'paths',
    w: 280, d: 140, h: 4, noShadow: true, palettes: null,
    plan: { type: 'path' }, path: { mat: 'asphalt', width: 140 },
    build: () => pathThumb('asphalt', 280, 140, 4, 320)
  },
  // ---- ground pads ----------------------------------------------------------
  {
    id: 'padp_concrete', name: 'Concrete Pad', cat: 'paths', w: 400, d: 300, h: 10,
    noShadow: true, areaDraw: true, palettes: CONCRETE_PADS, plan: { type: 'slab' },
    build: (p) => buildConcretePad(p, 400, 300, 10),
    buildSized: (p, w, d) => buildConcretePad(p, w, d, 10)
  },
  {
    id: 'padp_paver', name: 'Paver Patio Pad', cat: 'paths', w: 360, d: 280, h: 10,
    noShadow: true, areaDraw: true, palettes: PAVER_PADS, plan: { type: 'slab' },
    build: (p) => buildPaverPad(p, 360, 280, 10),
    buildSized: (p, w, d) => buildPaverPad(p, w, d, 10)
  },
  {
    id: 'padp_gravel', name: 'Gravel Pad', cat: 'paths', w: 300, d: 240, h: 12,
    noShadow: true, areaDraw: true, palettes: GRAVEL_PADS, plan: { type: 'slab' },
    build: (p) => buildGravelPad(p, 300, 240, 12),
    buildSized: (p, w, d) => buildGravelPad(p, w, d, 12)
  },
  {
    id: 'padp_sport', name: 'Sport Half-Court', cat: 'paths', w: 500, d: 420, h: 8,
    noShadow: true, areaDraw: true, palettes: SPORT_PADS, plan: { type: 'slab' },
    build: (p) => buildSportPad(p, 500, 420, 8),
    buildSized: (p, w, d) => buildSportPad(p, w, d, 8)
  },
  {
    id: 'padp_playground', name: 'Playground Safety Pad', cat: 'paths', w: 400, d: 300, h: 10,
    noShadow: true, areaDraw: true, palettes: PLAY_PADS, plan: { type: 'slab' },
    build: (p) => buildPlayPad(p, 400, 300, 10),
    buildSized: (p, w, d) => buildPlayPad(p, w, d, 10)
  },
  {
    id: 'padp_hottub', name: 'Hot Tub Pad', cat: 'paths', w: 260, d: 260, h: 12,
    noShadow: true, areaDraw: true, palettes: HOTTUB_PADS, plan: { type: 'slab' },
    build: (p) => buildHottubPad(p, 260, 260, 12),
    buildSized: (p, w, d) => buildHottubPad(p, w, d, 12)
  },
  {
    id: 'padp_parking', name: 'Parking Pad', cat: 'paths', w: 500, d: 520, h: 8,
    noShadow: true, areaDraw: true, palettes: PARKING_PADS, plan: { type: 'slab' },
    build: (p) => buildParkingPad(p, 500, 520, 8),
    buildSized: (p, w, d) => buildParkingPad(p, w, d, 8)
  },
  {
    id: 'padp_firepit_ring', name: 'Fire Pit Ring Pad', cat: 'paths', w: 300, d: 300, h: 13,
    noShadow: true, areaDraw: true, palettes: FIREPIT_PADS, plan: { type: 'slab' },
    build: (p) => buildFirepitPad(p, 300, 300, 13),
    buildSized: (p, w, d) => buildFirepitPad(p, w, d, 13)
  }
];
