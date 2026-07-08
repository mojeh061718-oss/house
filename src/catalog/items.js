// The furniture & appliance catalog. Every item is a parametric 3D model
// assembled from primitives (no external assets), with architectural 2D plan
// symbols and selectable finish palettes.
import {
  G, box, cyl, sphere, legs4, strut, segment, torus, handleBar, knob, shade, wavyPanel, prism, pyramid,
  solid, wood, tex, metal, chrome, glass, mirror, water, artMaterial, foliage, blob, buildPond,
  buildTallGrass, flagTexture, buildFlag, glow, netMaterial
} from './builders.js';
import { EXTRA_ITEMS } from './extras.js';

export const CATEGORIES = [
  { id: 'living', name: 'Living Room' },
  { id: 'bedroom', name: 'Bedroom' },
  { id: 'kitchen', name: 'Kitchen' },
  { id: 'bathroom', name: 'Bathroom' },
  { id: 'utility', name: 'Utility & Laundry' },
  { id: 'dining', name: 'Dining' },
  { id: 'office', name: 'Office' },
  { id: 'decor', name: 'Decor & Lighting' },
  { id: 'structure', name: 'Stairs & Structure' },
  { id: 'games', name: 'Games & Fun' },
  { id: 'patio', name: 'Patio & Lounge' },
  { id: 'pools', name: 'Pools & Spas' },
  { id: 'water', name: 'Water Features' },
  { id: 'waterfront', name: 'Docks & Boats' },
  { id: 'yard', name: 'Yard & Garden' },
  { id: 'farm', name: 'Farm & Homestead' },
  { id: 'outdoor', name: 'Outdoor' }
];

const FABRICS = [
  { name: 'Grey', chip: '#8e8e92', fabric: 'fabric_gray' },
  { name: 'Beige', chip: '#c4b49a', fabric: 'fabric_beige' },
  { name: 'Blue', chip: '#5a6e8c', fabric: 'fabric_blue' },
  { name: 'Green', chip: '#6d7d64', fabric: 'fabric_green' }
];

const WOODS = [
  { name: 'Oak', chip: '#a07a4f', wood: '#a07a4f' },
  { name: 'Walnut', chip: '#5f4632', wood: '#5f4632' },
  { name: 'White', chip: '#e8e4dc', wood: '#e8e4dc' },
  { name: 'Black', chip: '#3a3735', wood: '#3a3735' }
];

const dark = '#33312e';

const ROOFS = [
  { name: 'Charcoal', chip: '#4b4d51', roof: 'shingle_charcoal' },
  { name: 'Timber', chip: '#6a5442', roof: 'shingle_brown' },
  { name: 'Clay', chip: '#8d4a34', roof: 'shingle_red' },
  { name: 'Slate', chip: '#4e5a5e', roof: 'shingle_slate' },
  { name: 'Metal', chip: '#5b6166', roof: 'roof_metal' },
  { name: 'Scale Slate', chip: '#3f4448', roof: 'real_roof_slate' },
  { name: 'Aged Clay', chip: '#9a5a40', roof: 'real_roof_clay' }
];

// drawable fence styles: geometry recipe + colors + height
const FENCE_STYLES = [
  { name: 'White Picket', chip: '#e8e6e0', style: 'picket', color: '#e8e6e0', post: '#dedbd2', h: 105 },
  { name: 'Cedar Privacy', chip: '#9c7a56', style: 'privacy', color: '#9c7a56', post: '#8a6a48', h: 180 },
  { name: 'Ranch Rail', chip: '#6a4f36', style: 'ranch', color: '#6a4f36', post: '#5a4230', h: 120 },
  { name: 'Modern Slat', chip: '#3a3c3e', style: 'slat', color: '#4a4438', post: '#2f3134', h: 140 }
];

// deck/pad finishes: mat id + how many cm one texture tile covers
const DECK_FINISHES = [
  { name: 'Deck Boards', chip: '#8a6a4a', mat: 'deck_wood', scale: 200 },
  { name: 'Whitewashed', chip: '#ddd2c2', mat: 'whitewash', scale: 200 },
  { name: 'Wenge', chip: '#4a3a30', mat: 'real_wenge', scale: 240 },
  { name: 'Tumbled Stone', chip: '#e0c9a2', mat: 'real_tumbled_cream', scale: 200 },
  { name: 'Basket Pavers', chip: '#c8a878', mat: 'real_basket_pavers', scale: 260 },
  { name: 'Cobblestone', chip: '#8d8d88', mat: 'real_cobblestone', scale: 280 }
];
const PAD_FINISHES = [
  { name: 'Asphalt', chip: '#3d3f42', mat: 'counter_dark', scale: 260 },
  { name: 'Concrete', chip: '#a5a29b', mat: 'pavement', scale: 220 },
  { name: 'Pavers', chip: '#c8a878', mat: 'real_basket_pavers', scale: 260 },
  { name: 'Cobblestone', chip: '#8d8d88', mat: 'real_cobblestone', scale: 280 },
  { name: 'Gravel', chip: '#9a938a', mat: 'gravel', scale: 200 }
];

/** In-ground pool at true size: fixed rim width, tiled basin, real water. */
function buildPool(w, d) {
  const g = G();
  box(g, tex('tile_white', w / 210, d / 210), w, 12, d, 0, 0, 0, { r: 3 }); // deck rim
  const bw = w - 60, bd = d - 60; // basin inside a fixed 30cm coping
  box(g, tex('tile_bath', bw / 150, bd / 150), bw, 3, bd, 0, 3, 0);
  box(g, solid('#1d4a63', 0.35), bw - 6, 4, bd - 6, 0, 5, 0);
  const wt = box(g, water(), bw - 8, 7, bd - 8, 0, 9, 0);
  wt.receiveShadow = true;
  // chrome ladder on the right end
  cyl(g, chrome(), 2, 26, w / 2 - 60, 12, -15);
  cyl(g, chrome(), 2, 26, w / 2 - 60, 12, 15);
  cyl(g, chrome(), 2, 34, w / 2 - 60, 30, 0, { rx: Math.PI / 2 });
  return g;
}

/** Flat surface pad built at true size, so the finish never stretches. */
function buildSurfacePad(p, w, d, h) {
  const g = G();
  const mat = p?.mat || 'deck_wood';
  const scale = p?.scale || 200;
  box(g, tex(mat, w / scale, d / scale), w, h, d, 0, 0, 0, { r: 1 });
  return g;
}

/** Natural pond: an organic wobbled outline inside the drawn area, with a
 *  mud bed, rippled water and a jittered ring of rocks around the shore. */
function buildWaterArea(w, d) {
  return buildPond(w, d);
}

function sofaBuilder(seats, W, D, H) {
  return (p) => {
    const g = G();
    const fab = tex(p.fabric, 2, 2);
    const armW = 18, seatD = D - 24, baseH = 22;
    const innerW = W - armW * 2;
    // plinth + legs
    legs4(g, solid('#4a4038', 0.6), W - 8, D - 8, 6, 2.2, 5);
    box(g, fab, W, baseH, D, 0, 6, 0, { r: 4 });
    // arms
    box(g, fab, armW, H - 24, D, -(W / 2 - armW / 2), 6, 0, { r: 6 });
    box(g, fab, armW, H - 24, D, W / 2 - armW / 2, 6, 0, { r: 6 });
    // back
    box(g, fab, innerW, H - 6 - baseH, 22, 0, baseH, -(D / 2 - 11), { r: 6 });
    // cushions
    const cw = innerW / seats;
    for (let i = 0; i < seats; i++) {
      const x = -innerW / 2 + cw / 2 + i * cw;
      box(g, fab, cw - 4, 14, seatD - 20, x, baseH + 4, 6, { r: 5 });
      box(g, fab, cw - 6, H - baseH - 26, 14, x, baseH + 16, -(D / 2 - 26), { r: 5, rx: -0.12 });
    }
    return g;
  };
}

/**
 * Dress a bed: plush mattress, a rumpled duvet built from overlapping soft
 * "rolls" (real fold relief, cheaply), a turned-down top-sheet cuff, plump
 * pillows and an optional folded throw at the foot. Head is at -Z, foot +Z.
 *   g       group to add to
 *   mw, md  mattress width (x) and depth (z)
 *   topY    y of the bed platform the mattress rests on
 *   opts    { pillows=2, duvet=<material>, throw=<hex|null>, puff=1 }
 */
function dressBed(g, mw, md, topY, opts = {}) {
  const pillows = opts.pillows ?? 2;
  const puff = opts.puff ?? 1;
  const duvet = opts.duvet || solid('#e9e4d8', 0.85);
  const linen = solid('#f7f4ec', 0.88);   // crisp top sheet / cuff
  const mattH = 15 * puff;
  const mTop = topY + mattH;
  // plush mattress
  box(g, solid('#f4f1ea', 0.9), mw, mattH, md, 0, topY, 0, { r: 7 });
  // duvet zone: from just past the pillows to the foot
  const zFoot = md / 2 - 6;
  const zHead = -md / 2 + Math.min(md * 0.26, 52);
  const duvD = Math.max(30, zFoot - zHead);
  const rolls = Math.max(4, Math.round(duvD / 32));
  const seg = duvD / rolls;
  for (let i = 0; i < rolls; i++) {
    const z = zHead + (i + 0.5) * seg;
    const hh = (11 + (i % 2 ? 3 : 1)) * puff;    // alternate puffiness → rumples
    box(g, duvet, mw * 0.99, hh, seg + 5, 0, mTop - 1.5, z,
      { r: Math.min(hh / 2, seg * 0.6, 6) });
  }
  // turned-down top-sheet cuff over the duvet's head edge
  box(g, linen, mw * 0.99, 7 * puff, 20, 0, mTop + 2.5 * puff, zHead + 4, { r: 3 });
  // plump pillows resting against the head, leaning back
  const pillow = solid('#fbfaf6', 0.92);
  const pw = pillows > 1 ? mw * 0.42 : mw * 0.6;
  const xs = pillows > 1 ? [-mw * 0.24, mw * 0.24] : [0];
  for (let i = 0; i < xs.length; i++) {
    const py = mTop + 8 * puff;
    box(g, pillow, pw, 17 * puff, 40, xs[i], py, -md / 2 + 30,
      { r: Math.min(9 * puff, pw * 0.4), rx: -0.22, ry: (i - 0.5) * 0.08 });
  }
  // optional folded throw across the foot
  if (opts.throw) {
    box(g, solid(opts.throw, 0.8), mw * 0.92, 11 * puff, 34, 0, mTop + 3, zFoot - 20, { r: 4 });
  }
}

export const ITEMS = [
  // ======================= LIVING ROOM =======================
  {
    id: 'sofa3', name: 'Sofa · 3 Seat', cat: 'living', w: 220, d: 95, h: 82,
    palettes: FABRICS, plan: { type: 'sofa', seats: 3 },
    build: sofaBuilder(3, 220, 95, 82)
  },
  {
    id: 'sofa2', name: 'Loveseat', cat: 'living', w: 160, d: 92, h: 82,
    palettes: FABRICS, plan: { type: 'sofa', seats: 2 },
    build: sofaBuilder(2, 160, 92, 82)
  },
  {
    id: 'armchair', name: 'Armchair', cat: 'living', w: 88, d: 88, h: 82,
    palettes: FABRICS, plan: { type: 'sofa', seats: 1 },
    build: sofaBuilder(1, 88, 88, 82)
  },
  {
    id: 'coffee_table', name: 'Coffee Table', cat: 'living', w: 110, d: 60, h: 44,
    palettes: WOODS, plan: { type: 'table' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.5);
      box(g, wd, 110, 4, 60, 0, 40, 0, { r: 1.2 });
      box(g, wd, 100, 3, 50, 0, 14, 0);
      legs4(g, solid(dark, 0.4), 104, 54, 40, 2, 5, true);
      // a book + tray for life
      box(g, solid('#7c4434', 0.8), 20, 2.4, 14, -22, 44, 4);
      box(g, solid('#39506b', 0.8), 17, 2, 12, -20, 46.4, 2, { ry: 0.3 });
      cyl(g, solid('#d9cdb8', 0.7), 9, 2.5, 26, 44, -6);
      return g;
    }
  },
  {
    id: 'side_table', name: 'Side Table', cat: 'living', w: 45, d: 45, h: 55,
    palettes: WOODS, plan: { type: 'tableRound' },
    build: (p) => {
      const g = G();
      cyl(g, wood(p.wood, 0.5), 22.5, 3, 0, 52, 0);
      cyl(g, solid(dark, 0.4), 2, 52, 0, 0, 0);
      cyl(g, solid(dark, 0.4), 14, 2, 0, 0, 0);
      return g;
    }
  },
  {
    id: 'tv_stand', name: 'Media Console', cat: 'living', w: 160, d: 42, h: 52,
    palettes: WOODS, plan: { type: 'storage' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.55);
      box(g, wd, 160, 40, 42, 0, 12, 0, { r: 1.5 });
      legs4(g, solid(dark, 0.4), 150, 36, 12, 1.8, 4, true);
      box(g, solid(dark, 0.5), 77, 34, 1.5, -40, 15, 21);
      box(g, solid(dark, 0.5), 77, 34, 1.5, 40, 15, 21);
      handleBar(g, -6, 32, 22.2, 10);
      handleBar(g, 6, 32, 22.2, 10);
      return g;
    }
  },
  {
    id: 'tv_wall', name: 'Wall TV 55"', cat: 'living', w: 124, d: 8, h: 72,
    elevation: 110, mount: 'wall', palettes: null, plan: { type: 'tv' },
    build: () => {
      const g = G();
      box(g, solid('#1c1d1f', 0.4), 124, 70, 4, 0, 1, -1.5);
      const screen = glow('#0e1620', 0.55, 0.05, '#16324a');
      box(g, screen, 116, 63, 1, 0, 4.5, 0.6);
      box(g, metal('#3f4246', 0.4), 20, 30, 3, 0, 20, -3.4);
      return g;
    }
  },
  {
    id: 'bookshelf', name: 'Bookshelf', cat: 'living', w: 90, d: 30, h: 200,
    palettes: WOODS, plan: { type: 'storage' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.6);
      box(g, wd, 90, 200, 30, 0, 0, 0);
      const inner = solid(p.wood === '#e8e4dc' ? '#d8d2c8' : '#2e2b28', 0.7);
      const bookCols = ['#7c4434', '#39506b', '#5d7a6c', '#c2b49a', '#a86450', '#40474f', '#b98a5e', '#6b4a6e'];
      let s = 7;
      const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
      for (let shelf = 0; shelf < 5; shelf++) {
        const y = 12 + shelf * 37;
        box(g, inner, 78, 33, 24, 0, y, 2);
        // rows of books
        let x = -36;
        while (x < 30 && shelf !== 2) {
          const bw = 2.5 + rand() * 3, bh = 20 + rand() * 9;
          box(g, solid(bookCols[Math.floor(rand() * bookCols.length)], 0.85), bw, bh, 16 + rand() * 4, x + bw / 2, y, 3);
          x += bw + 0.6;
          if (rand() < 0.12) x += 8;
        }
        if (shelf === 2) {
          cyl(g, solid('#c9bfa8', 0.7), 6, 14, -20, y, 2);
          foliage(g, '#5d7a4c', '#6f8f5a', -20, y + 20, 2, 9, 6, 5);
          box(g, solid('#3a3735', 0.5), 20, 14, 4, 14, y, 2, { ry: -0.2 });
        }
      }
      return g;
    }
  },
  {
    id: 'rug_rect', name: 'Area Rug', cat: 'living', w: 200, d: 140, h: 1.5, noShadow: true,
    palettes: FABRICS, plan: { type: 'rug' },
    build: (p) => {
      const g = G();
      const m = tex(p.fabric, 3, 2);
      box(g, m, 200, 1.5, 140, 0, 0, 0);
      box(g, tex(p.fabric, 0.4, 0.4), 200, 1.2, 8, 0, 0.2, -66);
      box(g, tex(p.fabric, 0.4, 0.4), 200, 1.2, 8, 0, 0.2, 66);
      return g;
    }
  },
  {
    id: 'rug_round', name: 'Round Rug', cat: 'living', w: 160, d: 160, h: 1.5, noShadow: true,
    palettes: FABRICS, plan: { type: 'rugRound' },
    build: (p) => {
      const g = G();
      cyl(g, tex(p.fabric, 3, 3), 80, 1.5, 0, 0, 0, { seg: 48 });
      return g;
    }
  },
  {
    id: 'floor_lamp', name: 'Floor Lamp', cat: 'living', w: 38, d: 38, h: 158,
    palettes: null, plan: { type: 'lampRound' },
    light: { y: 135, color: '#ffd9a0', intensity: 0.9, distance: 450 },
    build: () => {
      const g = G();
      cyl(g, solid(dark, 0.4), 14, 2.5, 0, 0, 0);
      cyl(g, metal('#6e6a64', 0.4), 1.4, 130, 0, 2, 0);
      shade(g, '#e8dcc4', 19, 15, 28, 0, 128, 0);
      return g;
    }
  },
  {
    id: 'fireplace', name: 'Fireplace', cat: 'living', w: 140, d: 42, h: 112,
    palettes: null, plan: { type: 'fireplace' },
    light: { y: 45, color: '#ff9a40', intensity: 1.1, distance: 350 },
    build: () => {
      const g = G();
      box(g, tex('brick_white', 1.4, 1.1), 140, 104, 40, 0, 0, 0);
      box(g, solid('#e6e0d4', 0.6), 148, 8, 46, 0, 104, 0, { r: 1.5 });
      box(g, solid('#1a1817', 0.9), 76, 60, 6, 0, 14, 17.4);
      box(g, solid('#2a2320', 0.9), 68, 52, 24, 0, 16, 4);
      const fire = glow('#ff8c30', 1.4, 0.6, '#ff6a10');
      cyl(g, solid('#4a3626', 0.95), 4.5, 40, -12, 20, 8, { rz: Math.PI / 2.3 });
      cyl(g, solid('#54402e', 0.95), 4, 40, 8, 20, 6, { rz: Math.PI / 1.8 });
      sphere(g, fire, 9, 0, 30, 6, { sy: 1.6, seg: 10 });
      sphere(g, fire, 6, -12, 27, 8, { sy: 1.5, seg: 10 });
      sphere(g, fire, 6, 11, 26, 7, { sy: 1.4, seg: 10 });
      return g;
    }
  },

  // ======================= BEDROOM =======================
  {
    id: 'bed_double', name: 'Double Bed', cat: 'bedroom', w: 168, d: 212, h: 96,
    palettes: FABRICS, plan: { type: 'bed', pillows: 2 },
    build: (p) => {
      const g = G();
      const frame = wood('#6e5a44', 0.6);
      const blanket = tex(p.fabric, 2.4, 2.4);
      legs4(g, frame, 160, 204, 10, 3, 6, true);
      box(g, frame, 168, 22, 212, 0, 8, 0, { r: 2 });
      box(g, frame, 168, 66, 8, 0, 30, -102, { r: 3 }); // headboard
      dressBed(g, 156, 196, 30, { pillows: 2, duvet: blanket });
      return g;
    }
  },
  {
    id: 'bed_single', name: 'Single Bed', cat: 'bedroom', w: 96, d: 204, h: 90,
    palettes: FABRICS, plan: { type: 'bed', pillows: 1 },
    build: (p) => {
      const g = G();
      const frame = wood('#6e5a44', 0.6);
      legs4(g, frame, 90, 196, 10, 3, 6, true);
      box(g, frame, 96, 20, 204, 0, 8, 0, { r: 2 });
      box(g, frame, 96, 58, 8, 0, 28, -98, { r: 3 });
      dressBed(g, 86, 188, 28, { pillows: 1, duvet: tex(p.fabric, 2, 2) });
      return g;
    }
  },
  {
    id: 'nightstand', name: 'Nightstand', cat: 'bedroom', w: 46, d: 40, h: 56,
    palettes: WOODS, plan: { type: 'storage' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.55);
      legs4(g, solid(dark, 0.4), 40, 34, 12, 1.6, 3, true);
      box(g, wd, 46, 44, 40, 0, 12, 0, { r: 1.5 });
      box(g, wood(p.wood, 0.45), 40, 16, 1.5, 0, 34, 20.2);
      box(g, wood(p.wood, 0.45), 40, 16, 1.5, 0, 15, 20.2);
      knob(g, 0, 42, 21.5);
      knob(g, 0, 23, 21.5);
      return g;
    }
  },
  {
    id: 'wardrobe', name: 'Wardrobe', cat: 'bedroom', w: 152, d: 62, h: 222,
    palettes: WOODS, plan: { type: 'wardrobe' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.55);
      box(g, wd, 152, 214, 62, 0, 0, 0, { r: 1 });
      box(g, wood(p.wood, 0.42), 72, 204, 2, -38, 4, 30.5);
      box(g, wood(p.wood, 0.42), 72, 204, 2, 38, 4, 30.5);
      box(g, wd, 152, 8, 62, 0, 214, 0);
      handleBar(g, -5, 120, 32, 26, true);
      handleBar(g, 5, 120, 32, 26, true);
      return g;
    }
  },
  {
    id: 'dresser', name: 'Dresser', cat: 'bedroom', w: 122, d: 50, h: 86,
    palettes: WOODS, plan: { type: 'storage' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.55);
      legs4(g, solid(dark, 0.4), 114, 44, 10, 1.8, 3, true);
      box(g, wd, 122, 74, 50, 0, 10, 0, { r: 1.5 });
      for (let r = 0; r < 3; r++) {
        const y = 16 + r * 23;
        box(g, wood(p.wood, 0.42), 112, 19, 1.5, 0, y, 25.2);
        handleBar(g, -24, y + 10, 26.4, 12);
        handleBar(g, 24, y + 10, 26.4, 12);
      }
      return g;
    }
  },

  // ======================= KITCHEN =======================
  {
    id: 'counter', name: 'Base Cabinet', cat: 'kitchen', w: 60, d: 62, h: 91,
    palettes: WOODS, plan: { type: 'counter' },
    build: (p) => {
      const g = G();
      box(g, solid('#3a3835', 0.8), 56, 10, 54, 0, 0, -2);
      box(g, wood(p.wood, 0.5), 60, 76, 58, 0, 10, -2, { r: 0.8 });
      box(g, wood(p.wood, 0.42), 54, 70, 1.6, 0, 12, 27.5);
      handleBar(g, 20, 76, 28.6, 14, true);
      box(g, tex('countertop', 0.5, 0.5), 62, 4, 62, 0, 87, 0, { r: 0.8 });
      return g;
    }
  },
  {
    id: 'counter_sink', name: 'Sink Cabinet', cat: 'kitchen', w: 80, d: 62, h: 91,
    palettes: WOODS, plan: { type: 'sink' },
    build: (p) => {
      const g = G();
      box(g, solid('#3a3835', 0.8), 76, 10, 54, 0, 0, -2);
      box(g, wood(p.wood, 0.5), 80, 76, 58, 0, 10, -2, { r: 0.8 });
      box(g, wood(p.wood, 0.42), 36, 70, 1.6, -20, 12, 27.5);
      box(g, wood(p.wood, 0.42), 36, 70, 1.6, 20, 12, 27.5);
      handleBar(g, -6, 76, 28.6, 12, true);
      handleBar(g, 6, 76, 28.6, 12, true);
      box(g, tex('countertop', 0.6, 0.5), 82, 4, 62, 0, 87, 0, { r: 0.8 });
      // basin
      box(g, metal('#c4c8cc', 0.25), 50, 3, 40, 0, 90.4, 0);
      box(g, metal('#9aa0a6', 0.3), 44, 14, 34, 0, 78, 0);
      // faucet
      cyl(g, chrome(), 1.6, 24, 0, 91, -16);
      cyl(g, chrome(), 1.4, 16, 0, 113, -8.5, { rx: Math.PI / 2 });
      return g;
    }
  },
  {
    id: 'wall_cabinet', name: 'Wall Cabinet', cat: 'kitchen', w: 80, d: 36, h: 72,
    elevation: 145, mount: 'wall', palettes: WOODS, plan: { type: 'wallCabinet' },
    build: (p) => {
      const g = G();
      box(g, wood(p.wood, 0.5), 80, 72, 36, 0, 0, 0, { r: 0.8 });
      box(g, wood(p.wood, 0.42), 37, 66, 1.6, -19.5, 3, 18.5);
      box(g, wood(p.wood, 0.42), 37, 66, 1.6, 19.5, 3, 18.5);
      handleBar(g, -5, 14, 19.6, 12, true);
      handleBar(g, 5, 14, 19.6, 12, true);
      return g;
    }
  },
  {
    id: 'island', name: 'Kitchen Island', cat: 'kitchen', w: 182, d: 92, h: 92,
    palettes: WOODS, plan: { type: 'counter' },
    build: (p) => {
      const g = G();
      box(g, wood(p.wood, 0.5), 176, 84, 84, 0, 2, 0, { r: 1 });
      for (let i = -1; i <= 1; i++) {
        box(g, wood(p.wood, 0.42), 52, 78, 1.6, i * 57, 5, 42.8);
        handleBar(g, i * 57, 74, 43.8, 20);
      }
      box(g, tex('countertop', 1.2, 0.7), 182, 5, 92, 0, 87, 0, { r: 1 });
      return g;
    }
  },
  {
    id: 'fridge', name: 'Refrigerator', cat: 'kitchen', w: 76, d: 72, h: 182,
    palettes: null, plan: { type: 'appliance', label: 'RF' },
    build: () => {
      const g = G();
      const body = metal('#c9cdd1', 0.35);
      box(g, body, 76, 178, 68, 0, 2, -1, { r: 2.5 });
      box(g, metal('#b8bcc0', 0.3), 76, 62, 2, 0, 4, 33.6, { r: 1 });
      box(g, metal('#b8bcc0', 0.3), 76, 110, 2, 0, 70, 33.6, { r: 1 });
      handleBar(g, -28, 120, 36.4, 42, true);
      handleBar(g, -28, 58, 36.4, 26, true);
      // water dispenser
      box(g, solid('#2e3134', 0.5), 22, 30, 1.5, 8, 120, 34.4);
      return g;
    }
  },
  {
    id: 'stove', name: 'Range Cooker', cat: 'kitchen', w: 62, d: 62, h: 91,
    palettes: null, plan: { type: 'stove' },
    build: () => {
      const g = G();
      const body = metal('#c4c8cc', 0.4);
      box(g, body, 62, 84, 58, 0, 2, -1, { r: 1 });
      // oven door
      box(g, solid('#22262a', 0.3), 52, 42, 2, 0, 14, 28.5, { r: 1 });
      box(g, metal('#dde0e3', 0.3), 52, 3, 4, 0, 60, 29.5);
      // control panel + knobs
      box(g, body, 62, 10, 4, 0, 66, 28);
      for (let i = 0; i < 4; i++) cyl(g, solid('#2e3134', 0.4), 2.2, 2.5, -21 + i * 14, 69.5, 30.4, { rx: Math.PI / 2 });
      // cooktop
      box(g, solid('#17191c', 0.15), 60, 2.5, 56, 0, 86, -1, { r: 0.8 });
      for (const [bx, bz, br] of [[-15, -15, 8], [15, -15, 6.5], [-15, 13, 6.5], [15, 13, 8]]) {
        cyl(g, solid('#000000', 0.3), br, 0.5, bx, 88.5, bz, { seg: 28 });
        cyl(g, solid('#3a3d40', 0.5), br - 2, 0.4, bx, 89, bz, { seg: 28 });
      }
      return g;
    }
  },
  {
    id: 'hood', name: 'Range Hood', cat: 'kitchen', w: 80, d: 52, h: 62,
    elevation: 150, mount: 'wall', palettes: null, plan: { type: 'wallCabinet' },
    build: () => {
      const g = G();
      const steel = metal('#c4c8cc', 0.3);
      box(g, steel, 80, 8, 52, 0, 0, 0, { r: 1 });
      // rectangular tapered canopy (true footprint — no rotated-square overhang)
      pyramid(g, steel, 76, 40, 48, 0, 6, -2);
      box(g, metal('#babec2', 0.35), 22, 30, 22, 0, 32, -2);
      box(g, metal('#a9adb1', 0.4), 24, 2.5, 24, 0, 27, -2, { r: 0.5 }); // chimney collar
      box(g, solid('#26292d', 0.35), 74, 1.5, 46, 0, -1.2, 0, { r: 0.5 }); // recessed filter face (underside)
      return g;
    }
  },
  {
    hidden: true, id: 'dishwasher_legacy', name: 'Dishwasher', cat: 'kitchen', w: 60, d: 62, h: 86,
    palettes: null, plan: { type: 'appliance', label: 'DW' },
    build: () => {
      const g = G();
      box(g, metal('#c9cdd1', 0.35), 60, 80, 58, 0, 2, -1, { r: 1 });
      box(g, metal('#b4b8bc', 0.3), 56, 66, 2, 0, 6, 28.5, { r: 1 });
      box(g, metal('#dde0e3', 0.3), 56, 3.5, 4, 0, 74, 29.5);
      box(g, solid('#2e3134', 0.4), 40, 4, 1.5, 0, 77, 28.8);
      return g;
    }
  },
  {
    id: 'washer', name: 'Washing Machine', cat: 'kitchen', w: 60, d: 62, h: 85,
    palettes: null, plan: { type: 'washer' },
    build: () => {
      const g = G();
      box(g, solid('#e6e8ea', 0.5), 60, 82, 58, 0, 0, -1, { r: 1.5 });
      cyl(g, metal('#a8acb0', 0.3), 20, 3, 0, 36, 28.2, { rx: Math.PI / 2, seg: 32 });
      cyl(g, solid('#20262e', 0.1), 16, 3.4, 0, 36, 28.4, { rx: Math.PI / 2, seg: 32 });
      box(g, solid('#c8ccd0', 0.4), 52, 9, 1.5, 0, 68, 28.3);
      cyl(g, solid('#4a4e52', 0.4), 3, 2, 20, 72.5, 29, { rx: Math.PI / 2 });
      return g;
    }
  },
  {
    id: 'bar_stool', name: 'Bar Stool', cat: 'kitchen', w: 40, d: 40, h: 76,
    palettes: WOODS, plan: { type: 'stool' },
    build: (p) => {
      const g = G();
      cyl(g, wood(p.wood, 0.5), 17, 5, 0, 71, 0, { seg: 28 });
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const leg = cyl(g, solid(dark, 0.4), 1.6, 74, Math.cos(a) * 13, 0, Math.sin(a) * 13);
        leg.rotation.z = Math.cos(a) * 0.1;
        leg.rotation.x = -Math.sin(a) * 0.1;
      }
      cyl(g, metal('#8e9296', 0.4), 11, 1.2, 0, 24, 0, { seg: 24 });
      return g;
    }
  },

  // ======================= BATHROOM =======================
  {
    hidden: true, // superseded by the bathroom pack's bath_toilet_skirted (kept for old saves)
    id: 'toilet', name: 'Toilet', cat: 'bathroom', w: 40, d: 70, h: 78,
    palettes: null, plan: { type: 'toilet' },
    build: () => {
      const g = G();
      const white = solid('#f2f1ee', 0.25);
      box(g, white, 38, 36, 18, 0, 40, -24, { r: 3 });   // tank
      box(g, white, 30, 4, 12, 0, 77, -24, { r: 1.5 });  // lid button area
      cyl(g, metal('#c4c8cc', 0.3), 2.2, 1.5, 0, 78.5, -24);
      box(g, white, 24, 36, 24, 0, 2, -12, { r: 4 });    // pedestal
      const bowl = sphere(g, white, 19, 0, 40, 6, { sy: 0.42, sx: 0.92 });
      bowl.scale.z = 1.25;
      sphere(g, solid('#e2e1de', 0.3), 16, 0, 44.5, 6, { sy: 0.14, sx: 0.85, sz: 1.15 });
      return g;
    }
  },
  {
    id: 'bathtub', name: 'Bathtub', cat: 'bathroom', w: 172, d: 78, h: 58,
    palettes: null, plan: { type: 'bathtub' },
    build: () => {
      const g = G();
      const white = solid('#f2f1ee', 0.2);
      box(g, white, 172, 56, 78, 0, 0, 0, { r: 8 });
      box(g, solid('#e4e3e0', 0.25), 148, 30, 56, 0, 28, 0, { r: 10 });
      box(g, white, 148, 6, 56, 0, 22, 0, { r: 6 });
      cyl(g, chrome(), 1.8, 18, -70, 56, -22);
      cyl(g, chrome(), 1.5, 14, -70, 72, -15.5, { rx: Math.PI / 2 });
      cyl(g, chrome(), 2.4, 3, -60, 55, -30, { rx: 0 });
      cyl(g, chrome(), 2.4, 3, -52, 55, -30);
      return g;
    }
  },
  {
    id: 'shower', name: 'Shower', cat: 'bathroom', w: 92, d: 92, h: 212,
    palettes: null, plan: { type: 'shower' },
    build: () => {
      const g = G();
      box(g, solid('#e8e7e4', 0.3), 92, 6, 92, 0, 0, 0, { r: 2 });
      box(g, glass(), 2, 198, 88, -45, 6, 0);
      box(g, glass(), 88, 198, 2, 0, 6, 45);
      box(g, metal('#b0b4b8', 0.3), 3, 200, 3, -45, 5, 45);
      box(g, metal('#b0b4b8', 0.3), 3, 200, 3, -45, 5, -44);
      box(g, metal('#b0b4b8', 0.3), 3, 200, 3, 44, 5, 45);
      cyl(g, chrome(), 1.6, 60, 30, 130, -42);
      cyl(g, chrome(), 9, 1.5, 30, 190, -34, { seg: 24 });
      cyl(g, chrome(), 2.5, 8, 30, 100, -43.5, { rx: Math.PI / 2 });
      return g;
    }
  },
  {
    id: 'vanity', name: 'Vanity Unit', cat: 'bathroom', w: 82, d: 50, h: 86,
    palettes: WOODS, plan: { type: 'sink' },
    build: (p) => {
      const g = G();
      legs4(g, metal('#7c8084', 0.4), 74, 42, 12, 1.6, 3, true);
      box(g, wood(p.wood, 0.5), 82, 62, 48, 0, 12, 0, { r: 1 });
      box(g, wood(p.wood, 0.42), 76, 27, 1.5, 0, 16, 24.2);
      box(g, wood(p.wood, 0.42), 76, 27, 1.5, 0, 45, 24.2);
      handleBar(g, 0, 32, 25.2, 16);
      handleBar(g, 0, 61, 25.2, 16);
      box(g, tex('countertop', 0.5, 0.4), 84, 3, 50, 0, 74, 0, { r: 0.8 });
      const basin = sphere(g, solid('#f4f3f0', 0.2), 16, 0, 80, 2, { sy: 0.45 });
      basin.scale.x = 1.25;
      cyl(g, chrome(), 1.4, 18, 0, 76, -17);
      cyl(g, chrome(), 1.2, 12, 0, 93, -11.5, { rx: Math.PI / 2 });
      return g;
    }
  },
  {
    id: 'mirror_wall', name: 'Wall Mirror', cat: 'bathroom', w: 64, d: 5, h: 92,
    elevation: 100, mount: 'wall', palettes: null, plan: { type: 'wallDecor' },
    build: () => {
      const g = G();
      box(g, solid('#3a3735', 0.5), 64, 92, 3, 0, 0, -1);
      box(g, mirror(), 58, 86, 1.5, 0, 3, 0.6);
      return g;
    }
  },

  // ======================= DINING =======================
  {
    id: 'dining_table', name: 'Dining Table', cat: 'dining', w: 182, d: 92, h: 76,
    palettes: WOODS, plan: { type: 'table' },
    build: (p) => {
      const g = G();
      box(g, wood(p.wood, 0.45), 182, 5, 92, 0, 71, 0, { r: 1.2 });
      legs4(g, wood(p.wood, 0.5), 168, 80, 71, 3.2, 8, true);
      return g;
    }
  },
  {
    id: 'dining_table_round', name: 'Round Table', cat: 'dining', w: 124, d: 124, h: 76,
    palettes: WOODS, plan: { type: 'tableRound' },
    build: (p) => {
      const g = G();
      cyl(g, wood(p.wood, 0.45), 62, 5, 0, 71, 0, { seg: 40 });
      cyl(g, wood(p.wood, 0.5), 5, 66, 0, 4, 0);
      cyl(g, wood(p.wood, 0.5), 24, 4, 0, 0, 0, { seg: 32 });
      return g;
    }
  },
  {
    id: 'chair', name: 'Dining Chair', cat: 'dining', w: 46, d: 52, h: 88,
    palettes: WOODS, plan: { type: 'chair' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.55);
      box(g, wd, 44, 4, 44, 0, 44, 2, { r: 1.5 });
      box(g, solid('#c8bca4', 0.9), 40, 4, 40, 0, 48, 2, { r: 2 });
      legs4(g, wd, 40, 42, 44, 1.8, 3);
      const back = box(g, wd, 42, 46, 3, 0, 46, -20);
      back.rotation.x = 0.08;
      return g;
    }
  },

  // ======================= OFFICE =======================
  {
    id: 'desk', name: 'Desk', cat: 'office', w: 142, d: 70, h: 75,
    palettes: WOODS, plan: { type: 'table' },
    build: (p) => {
      const g = G();
      box(g, wood(p.wood, 0.5), 142, 4, 70, 0, 71, 0, { r: 1 });
      box(g, solid(dark, 0.45), 4, 68, 62, -66, 2, 0);
      box(g, solid(dark, 0.45), 4, 68, 62, 66, 2, 0);
      // drawer unit
      box(g, wood(p.wood, 0.5), 38, 52, 58, 46, 18, 0, { r: 1 });
      for (let r = 0; r < 3; r++) {
        box(g, wood(p.wood, 0.42), 34, 14, 1.5, 46, 21 + r * 16, 29.5);
        handleBar(g, 46, 28 + r * 16, 30.5, 12);
      }
      // laptop
      box(g, metal('#9ca0a4', 0.4), 32, 1.5, 22, -22, 75, 2);
      const lid = box(g, metal('#9ca0a4', 0.4), 32, 22, 1.2, -22, 75.6, -9);
      lid.rotation.x = -0.35;
      lid.position.y = 76 + 10;
      lid.position.z = -13;
      return g;
    }
  },
  {
    id: 'office_chair', name: 'Office Chair', cat: 'office', w: 62, d: 62, h: 104,
    palettes: null, plan: { type: 'officeChair' },
    build: () => {
      const g = G();
      const mesh = solid('#2c2c2e', 0.72);      // upholstery
      const shell = solid('#1c1c1e', 0.5);      // plastic shell/arms
      const alum = metal('#8e9297', 0.35);
      // 5-star base: tapered spokes sloping down to castered feet
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + Math.PI / 10;
        const fx = Math.cos(a) * 25, fz = Math.sin(a) * 25;
        strut(g, alum, Math.cos(a) * 4, 9, Math.sin(a) * 4, fx, 5, fz, 2.6, { rTop: 1.8 });
        sphere(g, solid('#141416', 0.45), 3.2, fx, 3.2, fz);                 // caster wheel
        cyl(g, shell, 1.6, 4, fx, 5.6, fz);                                  // caster fork
      }
      cyl(g, alum, 4.5, 6, 0, 4, 0, { rTop: 3.6 });      // hub
      cyl(g, chrome(), 2.2, 24, 0, 9, 0);                // gas lift
      cyl(g, shell, 3.4, 13, 0, 9, 0, { rTop: 2.9 });    // cylinder boot
      box(g, shell, 34, 3, 30, 0, 40, 1, { r: 1 });      // tilt mechanism
      // contoured seat: main pad + waterfall front lip, slight recline
      box(g, mesh, 47, 9, 44, 0, 43, 1, { r: 4.5, rx: -0.05 });
      box(g, mesh, 45, 7, 12, 0, 42.5, 21, { r: 3.5, rx: 0.3 });
      // curved back: shell + lumbar bulge + soft headrest, tilted back
      box(g, mesh, 45, 52, 7.5, 0, 51, -22.5, { r: 4, rx: 0.1 });
      box(g, mesh, 40, 17, 5, 0, 57, -18.6, { r: 2.5, rx: 0.13 });          // lumbar pad
      box(g, mesh, 32, 13, 7, 0, 92, -27, { r: 3.5, rx: 0.22 });            // headrest
      box(g, shell, 41, 46, 2.5, 0, 54, -27.2, { r: 2, rx: 0.1 });          // back shell
      // arms: L-supports rising from the seat frame with padded tops
      for (const s of [-1, 1]) {
        strut(g, shell, s * 22, 42, 6, s * 26, 62, 2, 2.2);
        box(g, shell, 5.5, 2.5, 25, s * 26.5, 62, -3, { r: 1 });
        box(g, solid('#242427', 0.6), 7.5, 3.5, 26, s * 26.5, 64, -3, { r: 1.6 });
      }
      return g;
    }
  },

  // ======================= DECOR & LIGHTING =======================
  {
    id: 'plant_large', name: 'Fiddle Leaf Plant', cat: 'decor', w: 55, d: 55, h: 150,
    palettes: null, plan: { type: 'plant' },
    build: () => {
      const g = G();
      cyl(g, solid('#b8977c', 0.75), 16, 30, 0, 0, 0, { rTop: 19 });
      cyl(g, solid('#4a3a2c', 0.95), 14, 3, 0, 30, 0);
      cyl(g, solid('#5c4632', 0.9), 2.2, 60, 0, 32, 0);
      foliage(g, '#4a6e3a', '#5d8348', 0, 108, 0, 30, 12, 11);
      return g;
    }
  },
  {
    id: 'plant_small', name: 'Potted Plant', cat: 'decor', w: 26, d: 26, h: 48,
    palettes: null, plan: { type: 'plant' },
    build: () => {
      const g = G();
      cyl(g, solid('#c9c0ae', 0.7), 8.5, 14, 0, 0, 0, { rTop: 10.5 });
      cyl(g, solid('#4a3a2c', 0.95), 7.5, 2, 0, 14, 0);
      foliage(g, '#55763f', '#68894e', 0, 30, 0, 13, 8, 23);
      return g;
    }
  },
  {
    id: 'ceiling_light', name: 'Ceiling Light', cat: 'decor', w: 42, d: 42, h: 18,
    mount: 'ceiling', palettes: null, plan: { type: 'lampRound' },
    light: { y: -8, color: '#fff2dc', intensity: 1.3, distance: 650 },
    build: () => {
      const g = G();
      // built hanging from y=0 downward; viewer positions at ceiling
      cyl(g, metal('#b8bcc0', 0.4), 6, 2, 0, -2, 0);
      const globeMat = glow('#f4ead6', 0.75, 0.6, '#f4e2bc');
      sphere(g, globeMat, 15, 0, -10, 0, { sy: 0.62 });
      return g;
    }
  },
  {
    id: 'pendant_light', name: 'Pendant Lamp', cat: 'decor', w: 36, d: 36, h: 92,
    mount: 'ceiling', palettes: null, plan: { type: 'lampRound' },
    light: { y: -80, color: '#ffe0b0', intensity: 1.1, distance: 520 },
    build: () => {
      const g = G();
      cyl(g, metal('#4a4c50', 0.4), 5, 2, 0, -2, 0);
      cyl(g, solid('#2c2c2e', 0.5), 0.4, 62, 0, -64, 0);
      shade(g, '#3f4246', 15, 6, 22, 0, -86, 0);
      const bulb = glow('#ffe8c0', 1.2, 0.4, '#ffd9a0');
      sphere(g, bulb, 4.5, 0, -82, 0);
      return g;
    }
  },
  {
    id: 'wall_art_a', name: 'Canvas Art I', cat: 'decor', w: 82, d: 5, h: 62,
    elevation: 140, mount: 'wall', palettes: null, plan: { type: 'wallDecor' },
    build: () => {
      const g = G();
      box(g, solid('#2e2b28', 0.6), 82, 62, 3, 0, 0, -1);
      box(g, artMaterial(2), 76, 56, 1.5, 0, 3, 0.6);
      return g;
    }
  },
  {
    id: 'wall_art_b', name: 'Canvas Art II', cat: 'decor', w: 62, d: 5, h: 82,
    elevation: 130, mount: 'wall', palettes: null, plan: { type: 'wallDecor' },
    build: () => {
      const g = G();
      box(g, solid('#8a7a5e', 0.6), 62, 82, 3, 0, 0, -1);
      box(g, artMaterial(7), 56, 76, 1.5, 0, 3, 0.6);
      return g;
    }
  },
  {
    id: 'curtains', name: 'Curtains', cat: 'decor', w: 160, d: 14, h: 244,
    palettes: FABRICS, plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      cyl(g, metal('#8a8478', 0.4), 1.6, 164, 0, 240, 0, { rz: Math.PI / 2 });
      sphere(g, metal('#8a8478', 0.4), 3, -82, 240, 0);
      sphere(g, metal('#8a8478', 0.4), 3, 82, 240, 0);
      const fab = tex(p.fabric, 2, 3);
      const left = wavyPanel(g, fab, 62, 236, 5, 10);
      left.position.set(-46, 0, 0);
      const right = wavyPanel(g, fab, 62, 236, 5, 10);
      right.position.set(46, 0, 0);
      return g;
    }
  },
  {
    id: 'shelf_wall', name: 'Wall Shelf', cat: 'decor', w: 92, d: 24, h: 6,
    elevation: 150, mount: 'wall', palettes: WOODS, plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      box(g, wood(p.wood, 0.5), 92, 4, 24, 0, 0, 0, { r: 0.8 });
      box(g, solid('#5d4a36', 0.8), 12, 10, 2, -30, 4, 4, { ry: 0.15 });
      box(g, solid('#39506b', 0.8), 10, 12, 2, -16, 4, 4);
      cyl(g, solid('#c9bfa8', 0.7), 5, 9, 24, 4, 0);
      foliage(g, '#5d7a4c', '#6f8f5a', 24, 16, 0, 7, 5, 31);
      return g;
    }
  },

  // ======================= OUTDOOR =======================
  {
    id: 'tree_oak', name: 'Shade Tree', cat: 'outdoor', w: 260, d: 260, h: 420,
    palettes: null, plan: { type: 'plant' },
    build: () => {
      const g = G();
      // flared trunk with three main branches reaching into the crown
      const bark = solid('#54422e', 0.95);
      cyl(g, bark, 16, 165, 0, 0, 0, { rTop: 10 });
      cyl(g, bark, 7, 110, 0, 120, 0, { rz: 0.5 });
      cyl(g, bark, 6, 100, 0, 135, 0, { rz: -0.55 });
      cyl(g, bark, 5, 85, 0, 150, 0, { rx: 0.45 });
      // full dappled crown; satellite tufts overlap the crown base so the
      // canopy reads as one irregular mass, not detached balls
      foliage(g, '#33591f', '#6fa03e', 0, 300, 0, 112, 16, 17);
      blob(g, '#33591f', '#649238', 48, 80, 250, 28, { seed: 41, sy: 0.85 });
      blob(g, '#2f5220', '#5d8a34', 44, -74, 244, -32, { seed: 42, sy: 0.82 });
      blob(g, '#365e22', '#68983a', 40, 8, 236, -52, { seed: 44, sy: 0.8 });
      return g;
    }
  },
  {
    id: 'tree_birch', name: 'Birch Tree', cat: 'outdoor', w: 200, d: 200, h: 430,
    palettes: null, plan: { type: 'plant' },
    build: () => {
      const g = G();
      // pale birch bark with dark scars following the taper
      const bark = solid('#d3ccbc', 0.85);
      cyl(g, bark, 10, 240, 0, 0, 0, { rTop: 6 });
      cyl(g, bark, 5, 120, 0, 180, 0, { rz: 0.35 });
      let s = 7;
      const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
      for (let i = 0; i < 12; i++) {
        const y = 20 + rand() * 200;
        const rAt = 10 - (y / 240) * 4; // trunk radius at that height
        const a = rand() * Math.PI * 2;
        const m = box(g, solid('#41403a', 0.9), 5 + rand() * 6, 2.5, 1.4,
          Math.cos(a) * (rAt - 0.4), y, Math.sin(a) * (rAt - 0.4), { r: 1 });
        m.rotation.y = -a + Math.PI / 2;
      }
      // light, airy crown: overlapping tufts up the leader
      blob(g, '#557f33', '#9aba60', 58, 0, 330, 0, { seed: 50, sy: 1.05 });
      blob(g, '#4f7830', '#93b45a', 42, 44, 292, 18, { seed: 51, sy: 0.95 });
      blob(g, '#527c31', '#a0be62', 40, -40, 286, -16, { seed: 52, sy: 0.92 });
      blob(g, '#5d8a3a', '#a9c86e', 32, 8, 388, 2, { seed: 53, sy: 1.05 });
      blob(g, '#557f33', '#9cbc5e', 26, -26, 352, 22, { seed: 54, sy: 0.9 });
      return g;
    }
  },
  {
    id: 'tree_pine', name: 'Pine Tree', cat: 'outdoor', w: 180, d: 180, h: 460,
    palettes: null, plan: { type: 'plant' },
    build: () => {
      const g = G();
      cyl(g, solid('#4e3d2c', 0.95), 13, 130, 0, 0, 0, { rTop: 9 });
      // fluffy boughs: stacked lumpy tiers that OVERLAP so the spire reads as
      // one continuous tree (the old spacing left the top tiers floating)
      const tiers = [
        [86, 100, 0.5], [72, 160, 0.54], [58, 215, 0.58], [46, 268, 0.62],
        [35, 314, 0.68], [25, 352, 0.78], [16, 384, 1.0]
      ];
      tiers.forEach(([r, y, sy], i) => {
        blob(g, '#24421f', '#4a7534', r, (i % 2 ? 3 : -3), y, (i % 3 - 1) * 3, { seed: 61 + i * 3, sy });
      });
      blob(g, '#2a4a24', '#548038', 10, 0, 412, 0, { seed: 80, sy: 1.3 });
      return g;
    }
  },
  {
    id: 'hedge', name: 'Hedge', cat: 'outdoor', w: 200, d: 55, h: 95,
    palettes: null, plan: { type: 'hedge' },
    build: () => {
      const g = G();
      // Clipped hedge: a rounded leafy core block, its top and faces broken by
      // MANY small high-detail foliage tufts that stay INSIDE the silhouette —
      // big stretched blobs poked out of the ends and read as faceted lumps.
      box(g, solid('#3a602e', 0.95), 188, 74, 44, 0, 3, 0, { r: 14, seg: 4 });
      let sd = 90;
      // large half-BURIED tufts: only their crowns break the clipped surface,
      // so the hedge reads as one undulating leafy mass (small surface-mounted
      // tufts read as warts; big protruding blobs read as faceted lumps)
      for (let bx = -76; bx <= 76; bx += 19) {
        blob(g, '#3a632c', '#548238', 20 + (sd % 3) * 3, bx, 62 - (sd % 2) * 5, ((sd % 2) ? 5 : -5),
          { seed: sd++, sy: 0.75, detail: 3, amp: 0.07 });
      }
      for (const zs of [1, -1]) {
        for (let bx = -64; bx <= 64; bx += 32) {
          blob(g, '#345a2a', '#4e7c35', 17 + (sd % 3) * 3, bx + (sd % 2) * 7, 34 + (sd % 3) * 10, zs * 8,
            { seed: sd++, sy: 0.9, detail: 3, amp: 0.07 });
        }
      }
      for (const xs of [1, -1]) {
        blob(g, '#38602c', '#54823a', 18, xs * 80, 40, 0, { seed: sd++, sy: 1.0, detail: 3, amp: 0.06 });
      }
      // woody trunk stubs peeking out under the foliage skirt
      const bark = solid('#4a3826', 0.95);
      for (const bx of [-62, 0, 62]) cyl(g, bark, 2.6, 12, bx, 0, 0, { rTop: 2 });
      return g;
    }
  },
  {
    id: 'bush_cloud', name: 'Garden Bush', cat: 'outdoor', w: 120, d: 120, h: 105,
    palettes: null, plan: { type: 'plant' },
    build: () => {
      const g = G();
      foliage(g, '#375c22', '#6d9c42', 0, 52, 0, 52, 10, 33);
      cyl(g, solid('#54422e', 0.95), 5, 24, 0, 0, 0);
      return g;
    }
  },
  {
    id: 'sidewalk', name: 'Sidewalk', cat: 'outdoor', w: 300, d: 120, h: 5, noShadow: true,
    hidden: true, // superseded by the drawable path_sidewalk (kept for old saves)
    palettes: null, plan: { type: 'slab' },
    build: () => {
      const g = G();
      box(g, tex('pavement', 1.5, 0.6), 300, 5, 120, 0, 0, 0);
      return g;
    }
  },
  {
    id: 'driveway', name: 'Driveway', cat: 'outdoor', w: 550, d: 300, h: 4, noShadow: true,
    hidden: true, // superseded by the drawable path_driveway (kept for old saves)
    palettes: null, plan: { type: 'slab' },
    build: () => {
      const g = G();
      box(g, tex('counter_dark', 2.5, 1.4), 550, 4, 300, 0, 0, 0);
      box(g, tex('pavement', 0.3, 1.4), 12, 4.5, 300, -269, 0, 0);
      box(g, tex('pavement', 0.3, 1.4), 12, 4.5, 300, 269, 0, 0);
      return g;
    }
  },
  {
    id: 'patio', name: 'Patio Deck', cat: 'outdoor', w: 360, d: 240, h: 12, noShadow: true,
    areaDraw: true, palettes: DECK_FINISHES, plan: { type: 'slab' },
    build: (p) => buildSurfacePad(p, 360, 240, 12),
    buildSized: (p, w, d) => buildSurfacePad(p, w, d, 12)
  },
  {
    id: 'pad_drive', name: 'Driveway Pad', cat: 'outdoor', w: 550, d: 300, h: 6, noShadow: true,
    areaDraw: true, palettes: PAD_FINISHES, plan: { type: 'slab' },
    build: (p) => buildSurfacePad(p, 550, 300, 6),
    buildSized: (p, w, d) => buildSurfacePad(p, w, d, 6)
  },
  {
    id: 'water_area', name: 'Pond', cat: 'outdoor', w: 400, d: 300, h: 10, noShadow: true,
    areaDraw: true, palettes: null, plan: { type: 'pond' },
    build: () => buildWaterArea(400, 300),
    buildSized: (p, w, d) => buildWaterArea(w, d)
  },
  {
    id: 'grass_patch', name: 'Tall Grass', cat: 'outdoor', w: 300, d: 220, h: 70, noShadow: true,
    areaDraw: true, plan: { type: 'grass' },
    palettes: [
      { name: 'Meadow', chip: '#5d7a37', base: '#42592a', tips: '#82a04c', height: 55 },
      { name: 'Wheat Field', chip: '#c2a45c', base: '#997b3e', tips: '#dcc478', height: 80 },
      { name: 'Prairie', chip: '#8a8a4e', base: '#5f6b34', tips: '#b0ac64', height: 95 }
    ],
    build: (p) => buildTallGrass(p, 300, 220),
    buildSized: (p, w, d) => buildTallGrass(p, w, d)
  },
  {
    hidden: true, id: 'mailbox_legacy', name: 'Mailbox', cat: 'outdoor', w: 30, d: 55, h: 115,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      box(g, solid('#4a3c2c', 0.85), 9, 100, 9, 0, 0, 0);
      const bodyMat = solid('#2e3440', 0.5);
      box(g, bodyMat, 26, 20, 46, 0, 100, 0, { r: 6 });
      box(g, bodyMat, 26, 4, 46, 0, 98, 0 );
      box(g, solid('#c74a3a', 0.5), 2.5, 16, 3, 15, 108, -12);
      knob(g, 0, 108, 24, 1.8);
      return g;
    }
  },
  {
    id: 'car', name: 'Car', cat: 'outdoor', w: 185, d: 465, h: 145,
    palettes: [
      { name: 'White', chip: '#e8e8ea', body: '#e8e8ea' },
      { name: 'Black', chip: '#26282c', body: '#26282c' },
      { name: 'Red', chip: '#a83226', body: '#a83226' },
      { name: 'Blue', chip: '#2f4a78', body: '#2f4a78' },
      { name: 'Silver', chip: '#b8bcc2', body: '#b8bcc2' }
    ],
    plan: { type: 'car' },
    build: (p) => {
      const g = G();
      const paint = solid(p.body, 0.28);
      const darkGlass = solid('#1d2733', 0.1);
      const trim = solid('#1e2023', 0.6);
      const tire = solid('#1c1c1e', 0.9);
      const rim = metal('#c2c6cc', 0.3);
      // wheels with dark wheel-well arches flush with the rockers
      for (const [wz, wx] of [[-148, -79], [-148, 79], [148, -79], [148, 79]]) {
        cyl(g, trim, 39, 3, Math.sign(wx) * 85.5, 33, wz, { rz: Math.PI / 2, seg: 26 }); // arch inset
        cyl(g, tire, 32, 22, wx, 32, wz, { rz: Math.PI / 2, seg: 26 });
        cyl(g, rim, 17, 23.5, wx, 32, wz, { rz: Math.PI / 2, seg: 20 });
        cyl(g, solid('#3a3d42', 0.4), 6, 24.5, wx, 32, wz, { rz: Math.PI / 2 });        // hub
      }
      box(g, trim, 166, 10, 424, 0, 16, 0, { r: 4, seg: 2 });        // rocker/underbody
      box(g, paint, 174, 56, 450, 0, 22, 0, { r: 15, seg: 4 });      // lower body
      box(g, paint, 156, 58, 232, 0, 70, 24, { r: 19, seg: 4 });     // greenhouse/cabin
      box(g, darkGlass, 159, 42, 238, 0, 78, 24, { r: 14, seg: 3 }); // wraparound glass band (proud of the cabin)
      // face: grille + slim headlights + lower intake
      box(g, trim, 92, 14, 4, 0, 47, -224, { r: 2 });
      box(g, trim, 130, 9, 4, 0, 27, -224, { r: 2 });
      box(g, solid('#eef2f4', 0.2), 32, 7, 4, -58, 63, -223.5, { r: 2 });
      box(g, solid('#eef2f4', 0.2), 32, 7, 4, 58, 63, -223.5, { r: 2 });
      // tail: light bar + plate recess
      box(g, solid('#8a1f16', 0.35), 130, 7, 4, 0, 66, 223.5, { r: 2 });
      box(g, trim, 44, 14, 3, 0, 40, 224, { r: 1.5 });
      // side mirrors
      for (const s of [-1, 1]) box(g, paint, 7, 6, 12, s * 88, 84, -32, { r: 2 });
      return g;
    }
  },
  {
    id: 'lamp_post', name: 'Lamp Post', cat: 'outdoor', w: 45, d: 45, h: 300,
    palettes: null, plan: { type: 'lampRound' },
    light: { y: 275, color: '#ffe2b0', intensity: 1.6, distance: 900 },
    build: () => {
      const g = G();
      const iron = solid('#2c2e32', 0.55);
      cyl(g, iron, 14, 6, 0, 0, 0);
      cyl(g, iron, 4.5, 265, 0, 4, 0, { rTop: 3 });
      cyl(g, iron, 7, 4, 0, 268, 0);
      const glassMat = glow('#ffe9c4', 0.9, 0.4, '#ffd9a0');
      cyl(g, glassMat, 9, 18, 0, 272, 0, { rTop: 6, seg: 6 });
      cyl(g, iron, 11, 4, 0, 290, 0, { rTop: 2, seg: 6 });
      return g;
    }
  },
  {
    id: 'fence', name: 'Fence Section', cat: 'outdoor', hidden: true, w: 240, d: 8, h: 110,
    palettes: [
      { name: 'White', chip: '#e6e2d8', wood: '#e6e2d8' },
      { name: 'Cedar', chip: '#8a6a4a', wood: '#8a6a4a' }
    ],
    plan: { type: 'fence' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.8);
      box(g, wd, 7, 108, 7, -118, 0, 0);
      box(g, wd, 7, 108, 7, 118, 0, 0);
      box(g, wd, 236, 7, 4, 0, 88, 0);
      box(g, wd, 236, 7, 4, 0, 28, 0);
      for (let x = -108; x <= 108; x += 18) {
        box(g, wd, 9, 100, 2.5, x, 4, 3);
      }
      return g;
    }
  },
  {
    id: 'pond', name: 'Garden Pond', cat: 'outdoor', w: 280, d: 200, h: 18, noShadow: true,
    palettes: null, plan: { type: 'pond' },
    build: () => {
      const g = G();
      // water surface (irregular oval)
      const w = cyl(g, water(), 128, 3, 0, 6, 0, { seg: 28 });
      w.scale.z = 0.72;
      w.scale.x = 1.04;
      // stone rim
      let s = 55;
      const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2;
        const rx = Math.cos(a) * 134 * 1.02, rz = Math.sin(a) * 134 * 0.74;
        const rockMat = solid(rand() < 0.5 ? '#8a8478' : '#75705f', 0.9);
        sphere(g, rockMat, 9 + rand() * 7, rx, 6, rz, { sy: 0.6, seg: 8 });
      }
      // lily pads
      for (let i = 0; i < 4; i++) {
        const a = rand() * Math.PI * 2, d = rand() * 80;
        cyl(g, solid('#3f7038', 0.8), 8 + rand() * 5, 0.8, Math.cos(a) * d, 9, Math.sin(a) * d * 0.7, { seg: 12 });
      }
      return g;
    }
  },
  {
    id: 'pool', name: 'Swimming Pool', cat: 'outdoor', w: 500, d: 300, h: 24, noShadow: true,
    areaDraw: true, palettes: null, plan: { type: 'pool' },
    build: () => buildPool(500, 300),
    buildSized: (p, w, d) => buildPool(w, d)
  },
  {
    id: 'pool_above', name: 'Above-Ground Pool', cat: 'outdoor', w: 400, d: 400, h: 135, noShadow: true,
    palettes: null, plan: { type: 'pool' },
    build: () => {
      const g = G();
      // corrugated steel ring wall with a top rail
      const wall = cyl(g, tex('corrugated_white', 8, 1), 196, 122, 0, 0, 0, { seg: 40 });
      wall.castShadow = true;
      const railMat = solid('#dcd8ce', 0.6);
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        const seg = box(g, railMat, 92, 6, 26, Math.cos(a) * 188, 124, Math.sin(a) * 188, { r: 2 });
        seg.rotation.y = -a + Math.PI / 2;
        box(g, solid('#b8b4aa', 0.5), 5, 122, 5, Math.cos(a) * 197, 0, Math.sin(a) * 197);
      }
      // water surface rides just above the shell so it reads from any angle
      const w = cyl(g, water(), 183, 4, 0, 122.5, 0, { seg: 36 });
      w.receiveShadow = true;
      // A-frame ladder leaning over the wall: outer flight from the ground,
      // small platform over the top rail, inner flight dropping to the water
      const ch = chrome();
      for (const s of [-1, 1]) {
        strut(g, ch, 254, 0, s * 17, 199, 144, s * 17, 2.4);   // outer stringers
        strut(g, ch, 199, 144, s * 17, 154, 30, s * 17, 2.2);  // inner stringers
        strut(g, ch, 254, 0, s * 17, 244, 116, s * 17, 1.4);   // handrail uprights
        strut(g, ch, 244, 116, s * 17, 202, 158, s * 17, 1.4); // handrails to the top
      }
      for (const t of [0.2, 0.4, 0.6, 0.8]) {                  // outer treads
        box(g, ch, 12, 3, 32, 254 - 55 * t, 144 * t, 0, { r: 1 });
      }
      for (const t of [0.28, 0.56]) {                          // inner treads (to water)
        box(g, ch, 12, 3, 32, 199 - 45 * t, 144 - 114 * t, 0, { r: 1 });
      }
      box(g, solid('#e4e7ea', 0.5), 34, 4, 40, 199, 146, 0, { r: 2 }); // top platform
      return g;
    }
  },
  {
    id: 'pool_above_deck', name: 'Pool + Deck', cat: 'outdoor', w: 640, d: 420, h: 220, noShadow: true,
    palettes: null, plan: { type: 'pool' },
    build: () => {
      const g = G();
      // above-ground pool on the right
      const wall = cyl(g, tex('corrugated_gray', 8, 1), 190, 118, 130, 0, 0, { seg: 40 });
      wall.castShadow = true;
      const railMat = solid('#d8d4ca', 0.6);
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        const seg = box(g, railMat, 88, 6, 24, 130 + Math.cos(a) * 182, 120, Math.sin(a) * 182, { r: 2 });
        seg.rotation.y = -a + Math.PI / 2;
      }
      const w = cyl(g, water(), 177, 4, 130, 118.5, 0, { seg: 36 });
      w.receiveShadow = true;
      // raised wooden deck flush with the pool top, on the left
      const deckTex = tex('deck_wood', 1.4, 1);
      box(g, deckTex, 260, 10, 300, -180, 120, 0, { r: 1 });
      const post = wood('#6a4f36', 0.8);
      for (const [px, pz] of [[-296, -136], [-296, 136], [-70, -136], [-70, 136]]) {
        box(g, post, 10, 120, 10, px, 0, pz);
      }
      // railing around the deck's outer edges
      const rail = wood('#7a5c40', 0.7);
      box(g, rail, 260, 5, 7, -180, 216, -146);
      box(g, rail, 260, 5, 7, -180, 216, 146);
      box(g, rail, 7, 5, 300, -306, 216, 0);
      for (let i = 0; i < 7; i++) {
        box(g, rail, 4, 90, 4, -300 + i * 38, 128, -146);
        box(g, rail, 4, 90, 4, -300 + i * 38, 128, 146);
      }
      for (let i = 0; i < 8; i++) box(g, rail, 4, 90, 4, -306, 128, -132 + i * 38);
      // stairs up to the deck
      for (let i = 0; i < 5; i++) {
        box(g, deckTex, 90, 8, 26, -180, 22 * i + 14, 172 + (4 - i) * 26, { r: 1 });
      }
      return g;
    }
  },
  {
    id: 'bench_outdoor', name: 'Garden Bench', cat: 'outdoor', w: 150, d: 62, h: 88,
    palettes: WOODS, plan: { type: 'sofa', seats: 2 },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.75);
      const iron = solid('#33342f', 0.6);
      for (const sx of [-1, 1]) {
        box(g, iron, 6, 44, 54, sx * 66, 0, 0, { r: 2 });
        box(g, iron, 6, 42, 8, sx * 66, 44, -24, { r: 2, rx: -0.15 });
      }
      for (let i = 0; i < 5; i++) {
        box(g, wd, 138, 3.5, 8.5, 0, 44, -22 + i * 11, { r: 1 });
      }
      for (let i = 0; i < 3; i++) {
        box(g, wd, 138, 8.5, 3.5, 0, 52 + i * 12, -27, { r: 1, rx: -0.15 });
      }
      return g;
    }
  },

  // ======================= STAIRS & STRUCTURE =======================
  {
    id: 'stairs', name: 'Staircase', cat: 'structure', w: 110, d: 300, h: 290,
    palettes: WOODS, plan: { type: 'stairs' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.6);
      const riser = solid('#ece8e0', 0.75);
      const steps = 15, W = 104, H = 290, D = 300;
      const rise = H / steps, run = D / steps;
      for (let i = 0; i < steps; i++) {
        const z = D / 2 - run * (i + 0.5);
        box(g, riser, W - 6, rise - 3.5, 3, 0, rise * i, z + run / 2 - 1.6);
        box(g, wd, W, 3.5, run + 4, 0, rise * (i + 1) - 3.5, z, { r: 0.8 });
      }
      // stringers hug the treads on both sides
      const ang = Math.atan2(H, D);
      const len = Math.hypot(H, D);
      for (const sx of [-1, 1]) {
        box(g, wd, 5, 26, len, sx * (W / 2 + 0.5), H / 2 - 24, 0, { rx: ang });
      }
      // handrail: posts follow the slope, rail on top
      const iron = metal('#2e3033', 0.45);
      for (let i = 1; i < steps; i += 3) {
        const z = D / 2 - run * (i + 0.5);
        cyl(g, iron, 1.6, 64, W / 2 + 3, rise * (i + 1), z);
      }
      box(g, wood(p.wood, 0.4), 7, 5, len + 10, W / 2 + 3, H / 2 + 66, 0, { rx: ang, r: 2 });
      return g;
    }
  },
  {
    id: 'stairs_l', name: 'L-Shaped Stairs', cat: 'structure', w: 210, d: 210, h: 290,
    palettes: WOODS, plan: { type: 'stairs' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.6);
      const riser = solid('#ece8e0', 0.75);
      const H = 290, rise = H / 16, W = 100;
      // lower flight climbs along +z half, on the left side
      const run1 = 110 / 7;
      for (let i = 0; i < 7; i++) {
        const z = 105 - run1 * (i + 0.5);
        box(g, riser, W - 6, rise - 3.5, 3, -55, rise * i, z + run1 / 2 - 1.6);
        box(g, wd, W, 3.5, run1 + 3, -55, rise * (i + 1) - 3.5, z);
      }
      // stringers under the lower flight
      const a1 = Math.atan2(rise * 7, 110), l1 = Math.hypot(rise * 7, 110);
      for (const sx of [-1, 1]) {
        box(g, wd, 5, 24, l1, -55 + sx * (W / 2 + 0.5), rise * 3.5 - 22, 50, { rx: a1 });
      }
      // landing platform in the corner
      box(g, wd, W + 5, 6, W + 5, -55, rise * 7, -55, { r: 1 });
      box(g, solid('#d9d4ca', 0.8), W, rise * 7, W, -55, 0, -55);
      // upper flight turns 90° and climbs along +x
      const run2 = 155 / 8;
      for (let i = 0; i < 8; i++) {
        const x = -5 + run2 * (i + 0.5);
        box(g, riser, 3, rise - 3.5, W - 6, x - run2 / 2 + 1.6, rise * (7 + i), -55);
        box(g, wd, run2 + 3, 3.5, W, x, rise * (8 + i) - 3.5, -55);
      }
      // stringers + handrail follow the upper flight (slope runs along x)
      const a2 = Math.atan2(rise * 8, 155), l2 = Math.hypot(rise * 8, 155);
      for (const sz of [-1, 1]) {
        box(g, wd, l2, 24, 5, 72, rise * 11.5 - 22, -55 + sz * (W / 2 + 0.5), { rz: a2 });
      }
      const iron = metal('#2e3033', 0.45);
      for (let i = 1; i < 8; i += 2) {
        cyl(g, iron, 1.6, 54, -5 + run2 * (i + 0.5), rise * (8 + i), -108);
      }
      box(g, wood(p.wood, 0.4), l2 + 8, 5, 7, 72, rise * 11.5 + 66, -108, { rz: a2, r: 2 });
      // corner newel at the landing
      cyl(g, iron, 2.4, rise * 7 + 96, -2, 0, -2);
      return g;
    }
  },
  // --- roofs: they drop onto the top of the wall line (elevation = wall height)
  //     and can be resized/rotated like any item to cover the footprint ---
  {
    id: 'roof_gable', name: 'Gable Roof', cat: 'structure', w: 700, d: 560, h: 200,
    elevation: 260, palettes: ROOFS, plan: { type: 'roof' }, autoFit: true,
    build: (p) => {
      const g = G();
      const shingle = tex(p.roof, 1, 1);
      const gableEnd = tex('siding_white', 1, 1);
      prism(g, shingle, 700, 190, 560, 0, 8, 0, gableEnd);
      // eave fascia + soffit slab, dropped below the base so it overlaps
      // the wall top (hides the roof/wall seam)
      box(g, solid('#e8e3d8', 0.7), 700, 15, 576, 0, -6, 0);
      // ridge cap
      box(g, solid('#3c3e42', 0.8), 704, 7, 16, 0, 194, 0, { r: 2 });
      return g;
    }
  },
  {
    id: 'roof_hip', name: 'Hip Roof', cat: 'structure', w: 700, d: 560, h: 190,
    elevation: 260, palettes: ROOFS, plan: { type: 'roof' }, autoFit: true,
    build: (p) => {
      const g = G();
      pyramid(g, tex(p.roof, 5, 3), 740, 182, 600, 0, 8, 0);
      box(g, solid('#e8e3d8', 0.7), 740, 15, 600, 0, -6, 0);
      return g;
    }
  },
  {
    id: 'roof_shed', name: 'Shed Roof', cat: 'structure', w: 500, d: 420, h: 130,
    elevation: 260, palettes: ROOFS, plan: { type: 'roof' }, autoFit: true,
    build: (p) => {
      const g = G();
      const ang = Math.atan2(110, 420);
      const len = Math.hypot(110, 420);
      const panel = box(g, tex(p.roof, 2.6, 2.4), 520, 10, len + 16, 0, 55, 0, { rx: ang });
      panel.castShadow = true;
      box(g, solid('#e8e3d8', 0.7), 520, 9, 14, 0, 104, -206, { rx: ang });
      box(g, solid('#e8e3d8', 0.7), 520, 9, 14, 0, -4, 206, { rx: ang });
      // soffit slab below the base hides the roof/wall seam
      box(g, solid('#e8e3d8', 0.7), 500, 15, 424, 0, -6, 0);
      return g;
    }
  },
  {
    id: 'roof_flat', name: 'Flat Roof', cat: 'structure', w: 600, d: 500, h: 45,
    elevation: 260, palettes: null, plan: { type: 'roof' }, autoFit: true,
    build: () => {
      const g = G();
      box(g, tex('gravel', 3, 2.5), 600, 14, 500, 0, 0, 0);
      const parapet = solid('#d8d2c6', 0.8);
      // skirt below the base hides the roof/wall seam
      box(g, parapet, 600, 15, 500, 0, -6, 0);
      box(g, parapet, 600, 40, 16, 0, 0, -242);
      box(g, parapet, 600, 40, 16, 0, 0, 242);
      box(g, parapet, 16, 40, 468, -292, 0, 0);
      box(g, parapet, 16, 40, 468, 292, 0, 0);
      return g;
    }
  },
  {
    id: 'dormer', name: 'Dormer', cat: 'structure', w: 160, d: 150, h: 170,
    elevation: 300, palettes: ROOFS, plan: { type: 'roof' },
    build: (p) => {
      const g = G();
      const face = tex('siding_white', 1, 1);
      box(g, face, 140, 110, 130, 0, 0, 0);
      // window on the front face
      box(g, solid('#3a3e44', 0.4), 70, 66, 4, 0, 26, 66);
      box(g, solid('#1d2733', 0.12), 62, 58, 3, 0, 30, 67);
      box(g, solid('#e8e6e0', 0.5), 4, 58, 3.5, 0, 30, 67.5);
      prism(g, tex(p.roof, 1, 1), 156, 62, 150, 0, 108, 0, face);
      return g;
    }
  },
  {
    id: 'chimney', name: 'Chimney', cat: 'structure', w: 70, d: 70, h: 210,
    elevation: 300, palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      box(g, tex('brick_red', 0.5, 1.4), 64, 190, 64, 0, 0, 0);
      box(g, solid('#c9c2b4', 0.7), 76, 10, 76, 0, 190, 0, { r: 1.5 });
      box(g, solid('#33342f', 0.8), 34, 12, 34, 0, 198, 0);
      return g;
    }
  },
  {
    id: 'elevator', name: 'Elevator', cat: 'structure', w: 170, d: 170, h: 285,
    palettes: null, plan: { type: 'elevator' },
    build: () => {
      const g = G();
      const shell = solid('#cfccc4', 0.85);
      const steel = metal('#b9bdc4', 0.28);
      const brushed = metal('#a7abb2', 0.4);
      // shaft: back + sides + top
      box(g, shell, 170, 285, 10, 0, 0, -80);
      box(g, shell, 10, 285, 170, -80, 0, 0);
      box(g, shell, 10, 285, 170, 80, 0, 0);
      box(g, shell, 170, 10, 170, 0, 275, 0);
      // front fascia with door cutout look
      box(g, shell, 30, 285, 10, -70, 0, 80);
      box(g, shell, 30, 285, 10, 70, 0, 80);
      box(g, shell, 170, 55, 10, 0, 230, 80);
      // brushed-steel double doors + frame
      box(g, steel, 116, 218, 3, 0, 0, 78);
      box(g, brushed, 54, 214, 3.5, -28.5, 2, 79.5);
      box(g, brushed, 54, 214, 3.5, 28.5, 2, 79.5);
      box(g, solid('#1e2126', 0.5), 2.5, 214, 4, 0, 2, 79.6);
      // call panel with lit buttons
      box(g, brushed, 13, 26, 2.5, 68, 118, 85.5);
      const up = glow('#ffd9a0', 0.9, 0.4, '#ffb84d');
      const dn = glow('#cfe4ff', 0.6, 0.4, '#7db8ff');
      sphere(g, up, 2.2, 68, 133, 87);
      sphere(g, dn, 2.2, 68, 124, 87);
      // floor indicator strip
      const ind = glow('#2a2d33', 0.5, 0.4, '#ff7828');
      box(g, ind, 40, 7, 2, 0, 236, 85.5);
      return g;
    }
  },

  // ======================= BACKYARD =======================
  {
    id: 'swing_set', name: 'Swing Set', cat: 'outdoor', w: 300, d: 200, h: 225,
    palettes: null, plan: { type: 'swingset' },
    build: () => {
      const g = G();
      const frame = wood('#7c5c3e', 0.7);
      const chain = metal('#a6acb2', 0.45);
      const BEAM = 212;            // top-beam height
      const EX = 138;             // A-frame half-span (x)
      const SPREAD = 74;          // foot splay in z
      // twin A-frames: two splayed legs per end meeting under the beam
      for (const sx of [-1, 1]) {
        const apex = sx * EX;
        strut(g, frame, apex, 0, -SPREAD, apex, BEAM, 0, 6.5, { rTop: 5 });
        strut(g, frame, apex, 0, SPREAD, apex, BEAM, 0, 6.5, { rTop: 5 });
        // cross-tie low between the two feet
        strut(g, frame, apex, 26, -SPREAD + 6, apex, 26, SPREAD - 6, 3);
      }
      // top beam running the full span, just over the apexes
      cyl(g, frame, 6.5, EX * 2 + 16, 0, BEAM, 0, { rz: Math.PI / 2, seg: 16 });
      // hanger eyes + two belt swings
      for (const sx of [-62, 62]) {
        const seatY = 48, seatZ = 4;
        for (const c of [-15, 15]) {
          sphere(g, chain, 1.8, sx + c, BEAM - 4, 0, { seg: 8 });
          strut(g, chain, sx + c, BEAM - 4, 0, sx + c, seatY + 3, seatZ, 0.9, { seg: 6 });
        }
        // slung rubber belt seat (dips in the middle)
        const seat = solid('#26292f', 0.6);
        box(g, seat, 46, 3.5, 15, sx, seatY, seatZ, { r: 1.6 });
        box(g, seat, 46, 2.4, 9, sx, seatY - 1.6, seatZ, { r: 1.2 });
      }
      return g;
    }
  },
  {
    id: 'grill', name: 'BBQ Grill', cat: 'outdoor', w: 130, d: 65, h: 112,
    palettes: null, plan: { type: 'grill' },
    build: () => {
      const g = G();
      const body = metal('#2b2e33', 0.35);
      const steel = metal('#b9bdc4', 0.3);
      // cart with wheels
      box(g, body, 90, 60, 52, -14, 28, 0, { r: 4 });
      cyl(g, solid('#1c1c1e', 0.9), 10, 6, -50, 10, 20, { rz: Math.PI / 2 });
      cyl(g, solid('#1c1c1e', 0.9), 10, 6, -50, 10, -20, { rz: Math.PI / 2 });
      box(g, body, 6, 26, 6, 26, 0, 20);
      box(g, body, 6, 26, 6, 26, 0, -20);
      // lid with handle + thermometer
      box(g, body, 88, 24, 50, -14, 88, 0, { r: 12, seg: 4 });
      handleBar(g, -14, 102, 27, 46);
      cyl(g, steel, 4, 2, -14, 99, 26, { rx: Math.PI / 2 });
      // side shelf + knobs
      box(g, steel, 34, 3, 46, 48, 84, 0, { r: 1 });
      for (const kx of [-40, -22, -4]) knob(g, kx, 74, 27, 2.2);
      return g;
    }
  },
  {
    hidden: true, id: 'fire_pit_legacy', name: 'Fire Pit', cat: 'outdoor', w: 110, d: 110, h: 45,
    palettes: null, plan: { type: 'rings' },
    light: { y: 42, color: '#ff9440', intensity: 1.5, distance: 520 },
    build: () => {
      const g = G();
      // stone ring
      let s = 91;
      const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        const rockMat = solid(rand() < 0.5 ? '#8a8478' : '#726d5f', 0.95);
        box(g, rockMat, 22, 26 + rand() * 6, 16, Math.cos(a) * 46, 0, Math.sin(a) * 46, { r: 5, ry: -a });
      }
      cyl(g, solid('#242220', 0.95), 40, 8, 0, 4, 0);
      // logs + embers + flames
      const log = wood('#4a3a28', 0.9);
      cyl(g, log, 6, 52, 0, 16, 0, { rz: Math.PI / 2, ry: 0.5 });
      cyl(g, log, 6, 52, 0, 16, 0, { rz: Math.PI / 2, ry: -0.6 });
      const ember = glow('#ff6a20', 1.4, 0.6, '#ff5a10');
      const flame = glow('#ffb347', 1.8, 0.5, '#ff9430');
      sphere(g, ember, 9, 4, 14, 2, { sy: 0.5, seg: 10 });
      cyl(g, flame, 8, 22, 0, 18, 0, { rTop: 1.5, seg: 8 });
      cyl(g, flame, 5, 15, 9, 17, -6, { rTop: 1, seg: 8 });
      return g;
    }
  },
  {
    id: 'hot_tub', name: 'Hot Tub', cat: 'outdoor', w: 220, d: 220, h: 92,
    palettes: null, plan: { type: 'hottub' },
    build: () => {
      const g = G();
      // wood cabinet + acrylic rim frame around an open water basin
      box(g, wood('#6a5138', 0.8), 220, 78, 220, 0, 0, 0, { r: 10, seg: 4 });
      const rim = solid('#e8e6e0', 0.35);
      box(g, rim, 208, 14, 26, 0, 78, -91, { r: 6, seg: 4 });
      box(g, rim, 208, 14, 26, 0, 78, 91, { r: 6, seg: 4 });
      box(g, rim, 26, 14, 156, -91, 78, 0, { r: 6, seg: 4 });
      box(g, rim, 26, 14, 156, 91, 78, 0, { r: 6, seg: 4 });
      box(g, solid('#3a7d9c', 0.3), 158, 6, 158, 0, 76, 0);
      const w = box(g, water(), 156, 4, 156, 0, 82, 0);
      w.receiveShadow = true;
      // headrest pads + control panel on the rim
      for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
        box(g, solid('#2e3440', 0.5), 34, 5, 12,
          Math.cos(a) * 88, 92, Math.sin(a) * 88, { r: 3, ry: -a + Math.PI / 2 });
      }
      box(g, solid('#1e2126', 0.4), 20, 3, 12, 74, 92, 74, { r: 2, ry: Math.PI / 4 });
      return g;
    }
  },
  {
    hidden: true, id: 'trampoline_legacy', name: 'Trampoline', cat: 'outdoor', w: 300, d: 300, h: 92,
    palettes: null, plan: { type: 'rings' },
    build: () => {
      const g = G();
      const steel = metal('#7d838c', 0.4);
      // legs + frame ring (ring approximated by a thin flat cylinder pair)
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + 0.3;
        cyl(g, steel, 3.5, 82, Math.cos(a) * 128, 0, Math.sin(a) * 128);
      }
      cyl(g, solid('#2a4a7c', 0.6), 148, 6, 0, 81, 0, { seg: 32 });   // blue spring pad
      cyl(g, solid('#1e2126', 0.75), 119, 4, 0, 84.5, 0, { seg: 32 }); // jump mat sits proud

      return g;
    }
  },
  {
    id: 'patio_set', name: 'Patio Set', cat: 'outdoor', w: 230, d: 230, h: 245,
    palettes: null, plan: { type: 'patioset' },
    build: () => {
      const g = G();
      const iron = solid('#33342f', 0.6);
      // round table + umbrella through the middle
      cyl(g, glass(), 55, 3, 0, 70, 0, { seg: 28 });
      cyl(g, iron, 3, 70, 0, 0, 0);
      cyl(g, iron, 22, 3, 0, 0, 0);
      cyl(g, iron, 2.2, 168, 0, 73, 0);
      shade(g, '#b0483a', 108, 10, 32, 0, 210, 0);
      // four chairs facing in
      for (const a of [0.6, 2.2, 3.8, 5.4]) {
        const cx = Math.cos(a) * 92, cz = Math.sin(a) * 92;
        const face = Math.atan2(-cz, -cx);
        box(g, iron, 42, 4, 42, cx, 42, cz, { r: 3, ry: -face });
        box(g, iron, 4, 46, 42, cx - Math.cos(face) * 20, 44, cz - Math.sin(face) * 20, { r: 3, ry: -face });
        for (const lx of [-1, 1]) for (const lz of [-1, 1]) {
          box(g, iron, 3.2, 42, 3.2, cx + lx * 16, 0, cz + lz * 16);
        }
      }
      return g;
    }
  },
  {
    id: 'bball_hoop', name: 'Basketball Hoop', cat: 'outdoor', w: 115, d: 120, h: 305,
    palettes: null, plan: { type: 'hoop' },
    build: () => {
      const g = G();
      const steel = metal('#3a3d42', 0.4);
      box(g, solid('#2a2d31', 0.7), 60, 14, 70, 0, 0, 20, { r: 4 });   // base
      cyl(g, steel, 5, 285, 0, 8, 40, { rTop: 4 });
      box(g, steel, 5, 5, 46, 0, 275, 16, { rx: 0.12 });
      // backboard + hoop + net
      box(g, solid('#e8eaec', 0.4), 110, 68, 4, 0, 245, -8);
      box(g, solid('#c8412e', 0.5), 44, 30, 4.5, 0, 252, -7.8);
      // true ring rim on a short bracket, with a tapering net below
      box(g, solid('#d3591f', 0.4), 10, 3, 8, 0, 246.5, -13);
      torus(g, solid('#d3591f', 0.4), 21, 1.7, 0, 246.5, -32, { seg: 30, tubeSeg: 10 });
      // netMaterial is unique per call — mutating a cached solid() here used to
      // corrupt every other item sharing that material
      cyl(g, netMaterial('#eceff2', 9, 4), 13, 30, 0, 216, -32, { rTop: 20, seg: 16, open: true });
      return g;
    }
  },
  // --- draggable paths: drag on the plan and the surface is laid along the stroke ---
  {
    id: 'path_fence', name: 'Fence', cat: 'outdoor', w: 240, d: 12, h: 110, noShadow: true,
    palettes: FENCE_STYLES, plan: { type: 'path' },
    path: { mat: 'pavement', width: 12, surface: 'fence' },
    build: (p) => {
      // catalog thumbnail: a short section in the chosen style
      const g = G();
      const c = solid(p.color || '#e8e6e0', 0.8);
      const pc = solid(p.post || p.color || '#e8e6e0', 0.85);
      const H = p.h || 105;
      box(g, pc, 10, H + 4, 10, -110, 0, 0);
      box(g, pc, 10, H + 4, 10, 110, 0, 0);
      if (p.style === 'ranch') {
        for (const y of [H * 0.25, H * 0.55, H * 0.85]) box(g, c, 220, 10, 4, 0, y, 0);
      } else if (p.style === 'slat') {
        for (let i = 0; i < 7; i++) box(g, c, 220, 9, 3, 0, 12 + i * (H - 16) / 6, 0);
      } else {
        for (const y of [H * 0.28, H * 0.8]) box(g, c, 220, 6, 4, 0, y, 0);
        const gap = p.style === 'privacy' ? 15 : 16;
        const wdt = p.style === 'privacy' ? 14.4 : 8;
        for (let x = -105; x <= 105; x += gap) box(g, c, wdt, H, 2.5, x, 2, 2.5);
      }
      return g;
    }
  },
  {
    id: 'path_sidewalk', name: 'Sidewalk', cat: 'outdoor', w: 240, d: 120, h: 5, noShadow: true,
    palettes: null, plan: { type: 'path' }, path: { mat: 'concrete_broom', width: 120 },
    build: () => {
      const g = G();
      box(g, tex('concrete_broom', 1.6, 0.8), 240, 5, 120, 0, 0, 0);
      return g;
    }
  },
  {
    id: 'path_driveway', name: 'Driveway', cat: 'outdoor', w: 300, d: 280, h: 4, noShadow: true,
    palettes: null, plan: { type: 'path' }, path: { mat: 'asphalt', width: 280 },
    build: () => {
      const g = G();
      box(g, tex('asphalt', 0.95, 0.9), 300, 4, 280, 0, 0, 0);
      return g;
    }
  },
  {
    id: 'path_gravel', name: 'Gravel Path', cat: 'outdoor', w: 200, d: 90, h: 4, noShadow: true,
    palettes: null, plan: { type: 'path' }, path: { mat: 'gravel', width: 90 },
    build: () => {
      const g = G();
      box(g, tex('gravel', 1.2, 0.6), 200, 4, 90, 0, 0, 0);
      return g;
    }
  },
  {
    id: 'path_stream', name: 'Water Stream', cat: 'outdoor', w: 260, d: 150, h: 8, noShadow: true,
    palettes: null, plan: { type: 'path' }, path: { mat: 'water', width: 150, surface: 'water' },
    build: () => {
      const g = G();
      box(g, solid('#3a7d9c', 0.3), 260, 4, 150, 0, 0, 0);
      const w = box(g, water(), 252, 4, 142, 0, 3, 0);
      w.receiveShadow = true;
      return g;
    }
  },
  // --- decorative rock path (drag on the plan, stones scatter along it) ---
  {
    id: 'path_rock', name: 'Rock Path', cat: 'outdoor', w: 220, d: 100, h: 12, noShadow: true,
    palettes: null, plan: { type: 'path' }, path: { mat: 'gravel', width: 100, surface: 'rocks' },
    build: () => {
      // catalog thumbnail: a short bed of scattered stones
      const g = G();
      box(g, tex('gravel', 1.1, 0.6), 220, 3, 100, 0, 0, 0);
      let s = 7;
      const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
      const tones = ['#8f8b83', '#a7a29a', '#726d66', '#b9b1a4'];
      for (let i = 0; i < 24; i++) {
        const r = 8 + rnd() * 8;
        const b = blob(g, tones[i % 4], '#5f5a54', r,
          -100 + rnd() * 200, r * 0.5, -44 + rnd() * 88, { seed: i + 3, sy: 0.6, detail: 2 });
        b.rotation.y = rnd() * Math.PI;
      }
      return g;
    }
  },

  // ===== EXTERIOR & LAWN LIGHTING =====
  {
    id: 'light_path', name: 'Path Light', cat: 'outdoor', w: 16, d: 16, h: 48, noShadow: true,
    palettes: null, plan: { type: 'lampRound' },
    light: { y: 40, color: '#ffd9a0', intensity: 0.7, distance: 260 },
    build: () => {
      const g = G();
      const dark = metal('#2f3236', 0.45);
      cyl(g, dark, 1.6, 40, 0, 0, 0);                 // slim stake
      cyl(g, dark, 6.5, 4, 0, 42, 0, { rTop: 2.5 });  // little roof cap
      cyl(g, glow('#ffe4ad', 1.2), 4.6, 6, 0, 35, 0); // glowing lamp under it
      return g;
    }
  },
  {
    id: 'light_bollard', name: 'Bollard Light', cat: 'outdoor', w: 22, d: 22, h: 92, noShadow: true,
    palettes: null, plan: { type: 'lampRound' },
    light: { y: 82, color: '#ffe0aa', intensity: 0.9, distance: 340 },
    build: () => {
      const g = G();
      const body = metal('#3b3e43', 0.4);
      cyl(g, body, 6, 84, 0, 0, 0);                   // post
      cyl(g, glow('#ffe8bd', 1.1), 5.6, 6, 0, 78, 0); // glowing band near top
      cyl(g, body, 7, 6, 0, 84, 0, { rTop: 5 });      // cap over the band
      return g;
    }
  },
  {
    id: 'light_spot', name: 'Garden Uplight', cat: 'outdoor', w: 16, d: 16, h: 22, noShadow: true,
    palettes: null, plan: { type: 'lampRound' },
    light: { y: 20, color: '#eaf3ff', intensity: 1.0, distance: 300 },
    build: () => {
      const g = G();
      const dark = metal('#33363b', 0.4);
      cyl(g, dark, 1.4, 12, 0, 0, 0);                 // ground spike
      const head = cyl(g, dark, 4.5, 9, 0, 12, 0, { rx: -0.5 }); // tilted-up can
      head.rotation.x = -0.5;
      cyl(g, glow('#eaf3ff', 1.6), 3.6, 2, 0, 18, 2); // bright lens
      return g;
    }
  },
  {
    id: 'light_well', name: 'In-Ground Well Light', cat: 'outdoor', w: 18, d: 18, h: 6, noShadow: true,
    palettes: null, plan: { type: 'lampRound' },
    light: { y: 12, color: '#ffe6b4', intensity: 0.8, distance: 300 },
    build: () => {
      const g = G();
      cyl(g, metal('#3a3d42', 0.5), 8, 5, 0, 0, 0);   // flush housing ring
      cyl(g, glow('#ffeec4', 1.5), 6, 2, 0, 3, 0);    // upward-facing lens
      return g;
    }
  },
  {
    id: 'light_flood', name: 'Flood Light', cat: 'outdoor', w: 22, d: 20, h: 46, noShadow: true,
    palettes: null, plan: { type: 'box' },
    light: { y: 42, color: '#eef4ff', intensity: 1.7, distance: 520 },
    build: () => {
      const g = G();
      const dark = metal('#2c2f33', 0.4);
      cyl(g, dark, 1.8, 38, 0, 0, 0);                 // stake
      const head = box(g, dark, 20, 12, 8, 0, 40, 0, { r: 2 }); // housing
      head.rotation.x = 0.35;
      const lens = box(g, glow('#eef4ff', 1.8), 16, 9, 1.5, 0, 41, 4);
      lens.rotation.x = 0.35;
      return g;
    }
  },
  {
    id: 'light_string', name: 'String Lights', cat: 'outdoor', w: 300, d: 12, h: 220, noShadow: true,
    palettes: null, plan: { type: 'box' },
    light: { y: 165, color: '#ffdca0', intensity: 0.8, distance: 480 },
    build: () => {
      const g = G();
      const wd = wood('#6b5236', 0.7);
      for (const sx of [-1, 1]) cyl(g, wd, 4, 208, sx * 145, 0, 0);   // two posts
      const bulbMat = glow('#ffe1a6', 1.6);
      const wireMat = solid('#2b2b2b', 0.6);
      const N = 11, W = 290, top = 206, sag = 66;
      let prev = null;
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const x = -W / 2 + W * t;
        const y = top - 4 * sag * t * (1 - t);        // parabolic droop
        if (prev) {                                    // dark wire segment
          const dx = x - prev.x, dy = y - prev.y;
          const len = Math.hypot(dx, dy);
          const seg = cyl(g, wireMat, 0.5, len, (x + prev.x) / 2, (y + prev.y) / 2 - len / 2, 0);
          seg.rotation.z = Math.atan2(dx, -dy);
        }
        sphere(g, bulbMat, 3.2, x, y - 4, Math.sin(i * 2.1) * 2.4); // hanging bulb, light sway
        prev = { x, y };
      }
      return g;
    }
  },
  {
    id: 'light_sconce', name: 'Outdoor Wall Sconce', cat: 'outdoor', w: 18, d: 14, h: 34,
    mount: 'wall', palettes: null, plan: { type: 'wallDecor' },
    light: { y: 0, color: '#ffdca0', intensity: 0.8, distance: 300 },
    build: () => {
      const g = G();
      const dark = metal('#2e3034', 0.4);
      box(g, dark, 12, 4, 3, 0, -2, -5);               // back plate
      box(g, dark, 3, 20, 3, 0, 4, 0);                 // arm/frame
      // glowing lantern box with a small cap
      box(g, glow('#ffe6bd', 1.0), 9, 12, 8, 0, 10, 2, { r: 1 });
      box(g, dark, 12, 3, 11, 0, 22, 2, { r: 1 });     // roof
      return g;
    }
  },
  {
    id: 'light_postcap', name: 'Post Cap Light', cat: 'outdoor', w: 12, d: 12, h: 12, noShadow: true,
    palettes: null, plan: { type: 'box' },
    light: { y: 10, color: '#ffe0aa', intensity: 0.5, distance: 200 },
    build: () => {
      const g = G();
      const dark = metal('#33363b', 0.45);
      box(g, dark, 11, 3, 11, 0, 0, 0, { r: 1 });      // base skirt
      box(g, glow('#ffe6c2', 1.1), 8, 6, 8, 0, 3, 0, { r: 1 }); // glowing cube
      box(g, dark, 11, 2.5, 11, 0, 9, 0, { r: 1 });    // cap top
      return g;
    }
  },
  {
    id: 'torch_tiki', name: 'Tiki Torch', cat: 'outdoor', w: 16, d: 16, h: 150, noShadow: true,
    palettes: null, plan: { type: 'lampRound' },
    light: { y: 140, color: '#ff8a3a', intensity: 1.0, distance: 300 },
    build: () => {
      const g = G();
      const bamboo = wood('#9a7b45', 0.7);
      cyl(g, bamboo, 3, 132, 0, 0, 0);                 // bamboo pole
      for (const y of [40, 76, 112]) cyl(g, wood('#7c6236', 0.7), 3.4, 3, 0, y, 0); // nodes
      cyl(g, metal('#3a3128', 0.5), 5, 10, 0, 130, 0); // brass fuel canister
      // flame
      const flame = sphere(g, glow('#ff7a1e', 2.0), 5, 0, 146, 0, { sy: 1.7 });
      sphere(g, glow('#ffd24d', 1.6), 3, 0, 150, 0, { sy: 1.6 });
      return g;
    }
  },
  {
    id: 'lantern_garden', name: 'Garden Lantern', cat: 'outdoor', w: 24, d: 24, h: 62, noShadow: true,
    palettes: null, plan: { type: 'lampRound' },
    light: { y: 40, color: '#ffdca0', intensity: 0.8, distance: 300 },
    build: () => {
      const g = G();
      const dark = metal('#2c2e31', 0.4);
      cyl(g, dark, 8, 6, 0, 0, 0, { rTop: 6.5 });      // footed base
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, dark, 2, 30, 2, sx * 7, 8, sz * 7); // cage posts
      box(g, glow('#ffe6bd', 0.95), 12, 26, 12, 0, 10, 0, { r: 1 }); // glowing glass box
      // pagoda-ish cap
      box(g, dark, 20, 3, 20, 0, 38, 0, { r: 1 });
      cyl(g, dark, 7, 8, 0, 41, 0, { rTop: 0.5 });
      sphere(g, dark, 2, 0, 50, 0);
      return g;
    }
  },

  // ===== FLAGS =====
  {
    id: 'flag_us', name: 'American Flag Pole', cat: 'outdoor', w: 190, d: 50, h: 600, noShadow: true,
    palettes: null, plan: { type: 'flag' },
    build: () => {
      const g = G();
      const pole = metal('#d7dade', 0.3);
      cyl(g, solid('#8a8f95', 0.6), 14, 8, 0, 0, 0, { rTop: 10 }); // base collar
      cyl(g, pole, 3, 592, 0, 6, 0);                   // tall pole
      sphere(g, glow('#ffd24d', 0.5, 0.3), 5, 0, 600, 0); // gold finial ball
      buildFlag(g, flagTexture('us'), 172, 94, 4, 500, 0, { ry: 0 });
      return g;
    }
  },
  {
    id: 'flag_garden', name: 'Garden Flag', cat: 'outdoor', w: 40, d: 12, h: 90, noShadow: true,
    palettes: [
      { name: 'Red', chip: '#b72436', a: '#b72436', b: '#f4efe2' },
      { name: 'Navy', chip: '#2c3e5c', a: '#2c3e5c', b: '#f4efe2' },
      { name: 'Green', chip: '#2f6d4f', a: '#2f6d4f', b: '#f4efe2' },
      { name: 'Black & Gold', chip: '#2b2d30', a: '#2b2d30', b: '#e9c85a' }
    ],
    plan: { type: 'flag' },
    build: (p) => {
      const g = G();
      const rod = metal('#3a3d42', 0.4);
      cyl(g, rod, 1, 84, 0, 0, 0);                     // shepherd-hook rod
      const arm = cyl(g, rod, 1, 26, 0, 84, 0, { rz: Math.PI / 2 });
      arm.position.set(13, 84, 0);
      buildFlag(g, flagTexture('banner', p?.a || '#b72436', p?.b || '#f4efe2'), 32, 44, 1, 40, 0, { ry: 0 });
      return g;
    }
  },
  {
    id: 'flag_wall', name: 'Wall-Mounted Flag', cat: 'outdoor', w: 12, d: 150, h: 80,
    mount: 'wall', palettes: [
      { name: 'Stars & Stripes', chip: '#b22234', kind: 'us' },
      { name: 'Red', chip: '#b72436', kind: 'banner', a: '#b72436', b: '#f4efe2' },
      { name: 'Navy', chip: '#2c3e5c', kind: 'banner', a: '#2c3e5c', b: '#f4efe2' }
    ],
    plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      const rod = metal('#8a8f95', 0.35);
      // angled pole coming off the wall (wall face is -z; pole reaches +z/up)
      const pole = cyl(g, rod, 2, 120, 0, 6, 0, { rx: -0.9 });
      pole.rotation.x = -0.9;
      sphere(g, glow('#ffd24d', 0.4, 0.3), 3.5, 0, 92, 78);
      const tex = flagTexture(p?.kind || 'us', p?.a, p?.b);
      buildFlag(g, tex, 92, 52, 2, 60, 30, { ry: -Math.PI / 2 });
      return g;
    }
  },

  // ===== DECORATIVE ROCKS =====
  {
    id: 'boulder', name: 'Boulder', cat: 'outdoor', w: 90, d: 70, h: 55, noShadow: true,
    palettes: [
      { name: 'Granite Grey', chip: '#8f8b83', a: '#8f8b83', b: '#5f5a54' },
      { name: 'Sandstone', chip: '#c2ad86', a: '#c2ad86', b: '#8a7550' },
      { name: 'Slate', chip: '#5f6469', a: '#5f6469', b: '#3a3d42' }
    ],
    plan: { type: 'rock' },
    build: (p) => {
      const g = G();
      const b = blob(g, p?.a || '#8f8b83', p?.b || '#5f5a54', 40, 0, 20, 0, { seed: 12, sy: 0.7, detail: 3 });
      b.scale.set(1.1, 1, 0.85);
      return g;
    }
  },
  {
    id: 'rock_cluster', name: 'Rock Cluster', cat: 'outdoor', w: 140, d: 110, h: 40, noShadow: true,
    palettes: [
      { name: 'Granite Grey', chip: '#8f8b83', a: '#8f8b83', b: '#5f5a54' },
      { name: 'Sandstone', chip: '#c2ad86', a: '#c2ad86', b: '#8a7550' },
      { name: 'River Rock', chip: '#7d8890', a: '#7d8890', b: '#4c545a' }
    ],
    plan: { type: 'rock' },
    build: (p) => {
      const g = G();
      let s = 91;
      const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
      const spots = [[-40, -20, 26], [30, -30, 32], [10, 25, 22], [-25, 30, 18], [50, 20, 16]];
      spots.forEach(([x, z, r], i) => {
        const b = blob(g, p?.a || '#8f8b83', p?.b || '#5f5a54', r, x, r * 0.5, z, { seed: i + 5, sy: 0.62, detail: 2 });
        b.rotation.y = rnd() * Math.PI;
        b.scale.set(1 + rnd() * 0.3, 1, 0.8 + rnd() * 0.3);
      });
      return g;
    }
  },

  {
    id: 'pergola', name: 'Pergola', cat: 'outdoor', w: 300, d: 300, h: 250,
    palettes: WOODS, plan: { type: 'pergola' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.7);
      // four posts + double beams both ways + slat roof
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        box(g, wd, 14, 228, 14, sx * 135, 0, sz * 135);
      }
      for (const sz of [-1, 1]) box(g, wd, 300, 14, 8, 0, 228, sz * 135);
      for (let x = -135; x <= 135; x += 30) {
        box(g, wd, 6, 8, 296, x, 242, 0);
      }
      return g;
    }
  },

  // ======================= EXPANSION PACK: INDOOR =======================
  {
    id: 'sofa_l', name: 'Sectional Sofa', cat: 'living', w: 280, d: 200, h: 82,
    palettes: FABRICS, plan: { type: 'sofa', seats: 4 },
    build: (p) => {
      const g = G();
      const fab = tex(p.fabric, 2, 2);
      const baseH = 22, armW = 18;
      legs4(g, solid('#4a4038', 0.6), 270, 190, 6, 2.2, 6);
      // long run along the back + chaise leg on the left
      box(g, fab, 280, baseH, 95, 0, 6, -52.5, { r: 4 });
      box(g, fab, 95, baseH, 105, -92.5, 6, 47.5, { r: 4 });
      // back + arms
      box(g, fab, 280, 60 - baseH, 22, 0, baseH + 6, -89, { r: 6 });
      box(g, fab, armW, 54 - baseH, 92, 131, baseH, -52, { r: 6 });
      box(g, fab, armW, 54 - baseH, 105, -131, baseH, 47.5, { r: 6 });
      // seat + chaise cushions
      for (let i = 0; i < 3; i++) {
        box(g, fab, 84, 14, 70, -88 + i * 88, baseH + 4, -46, { r: 5 });
        box(g, fab, 82, 34, 14, -88 + i * 88, baseH + 16, -72, { r: 5, rx: -0.12 });
      }
      box(g, fab, 84, 14, 96, -92.5, baseH + 4, 48, { r: 5 });
      return g;
    }
  },
  {
    hidden: true, id: 'recliner_legacy', name: 'Recliner', cat: 'living', w: 92, d: 160, h: 100,
    palettes: FABRICS, plan: { type: 'sofa', seats: 1 },
    build: (p) => {
      const g = G();
      const fab = tex(p.fabric, 2, 2);
      box(g, fab, 92, 26, 90, 0, 0, -20, { r: 6 });
      box(g, fab, 20, 34, 86, -36, 22, -22, { r: 7 });
      box(g, fab, 20, 34, 86, 36, 22, -22, { r: 7 });
      box(g, fab, 56, 14, 66, 0, 26, -22, { r: 5 });
      box(g, fab, 60, 62, 20, 0, 34, -60, { r: 8, rx: -0.24 });
      // extended footrest
      box(g, fab, 56, 12, 52, 0, 22, 44, { r: 5, rx: 0.16 });
      box(g, metal('#5a5d61', 0.4), 4, 18, 30, -16, 4, 26, { rx: 0.5 });
      box(g, metal('#5a5d61', 0.4), 4, 18, 30, 16, 4, 26, { rx: 0.5 });
      return g;
    }
  },
  {
    id: 'piano', name: 'Upright Piano', cat: 'living', w: 150, d: 64, h: 126,
    palettes: null, plan: { type: 'storage' },
    build: () => {
      const g = G();
      const body = wood('#2e2622', 0.35);
      box(g, body, 150, 100, 40, 0, 26, -10, { r: 2 });          // upper body
      box(g, body, 150, 8, 62, 0, 66, 0, { r: 1.5 });            // key bed
      // keys
      box(g, solid('#f2efe6', 0.3), 122, 3, 16, 0, 74, 18);
      for (let i = 0; i < 18; i++) {
        box(g, solid('#1a1a1c', 0.3), 3.4, 3.2, 9, -57 + i * 6.7, 75.5, 14.5);
      }
      box(g, body, 150, 5, 20, 0, 78, -4);                        // fallboard
      box(g, body, 130, 22, 3, 0, 92, 10.5, { rx: -0.22 });       // music desk
      for (const sx of [-1, 1]) box(g, body, 10, 66, 12, sx * 66, 0, 20); // front legs
      box(g, body, 150, 6, 8, 0, 120, 16, { r: 1.5 });            // top lid lip
      // brass pedals on a small toe block
      box(g, body, 44, 10, 8, 0, 0, 24, { r: 1 });
      for (const px of [-10, 0, 10]) box(g, metal('#b8a468', 0.3), 5, 3, 12, px, 8, 26);
      return g;
    }
  },
  {
    id: 'pool_table', name: 'Pool Table', cat: 'living', w: 254, d: 140, h: 82,
    palettes: null, plan: { type: 'table' },
    build: () => {
      const g = G();
      const mahogany = wood('#4e3526', 0.45);
      box(g, mahogany, 254, 16, 140, 0, 62, 0, { r: 3 });         // rail frame
      box(g, solid('#2e6b45', 0.95), 226, 4, 112, 0, 75, 0);      // felt
      // pockets
      for (const [px, pz] of [[-113, -56], [0, -60], [113, -56], [-113, 56], [0, 60], [113, 56]]) {
        cyl(g, solid('#141416', 0.6), 8, 5, px, 74, pz);
      }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        box(g, mahogany, 16, 62, 16, sx * 108, 0, sz * 52, { r: 2 });
      }
      // a few balls + cue resting on the felt
      sphere(g, solid('#e8e4da', 0.2), 4, -30, 81, 6);
      sphere(g, solid('#b03a2e', 0.2), 4, 22, 81, -12);
      sphere(g, solid('#2952a3', 0.2), 4, 34, 81, 14);
      cyl(g, wood('#b08a5e', 0.4), 1.6, 130, -40, 80, 34, { rz: Math.PI / 2 });
      return g;
    }
  },
  {
    id: 'mirror_floor', name: 'Floor Mirror', cat: 'decor', w: 62, d: 24, h: 172,
    palettes: WOODS, plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      const frame = wood(p.wood, 0.5);
      const lean = -0.1;
      box(g, frame, 62, 172, 5, 0, 0, 0, { r: 2, rx: lean });
      const m = box(g, mirror(), 52, 160, 2, 0, 6, 2.2, { rx: lean });
      m.position.z += 1;
      return g;
    }
  },
  {
    id: 'ceiling_fan', name: 'Ceiling Fan', cat: 'decor', w: 132, d: 132, h: 45,
    mount: 'ceiling', palettes: null, plan: { type: 'lampRound' },
    light: { y: -34, color: '#fff2dc', intensity: 1.2, distance: 620 },
    build: () => {
      const g = G();
      const steel = metal('#8a8e93', 0.35);
      cyl(g, steel, 3, 14, 0, -14, 0);
      cyl(g, steel, 9, 8, 0, -24, 0);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        const blade = box(g, wood('#6a4f38', 0.5), 56, 2.2, 16, Math.cos(a) * 36, -22, Math.sin(a) * 36, { r: 3 });
        blade.rotation.y = -a;
        blade.rotation.z = 0.06;
      }
      const globe = glow('#f4ead6', 0.7, 0.6, '#f4e2bc');
      sphere(g, globe, 9, 0, -30, 0, { sy: 0.7 });
      return g;
    }
  },
  {
    id: 'bunk_bed', name: 'Bunk Bed', cat: 'bedroom', w: 104, d: 208, h: 165,
    palettes: WOODS, plan: { type: 'bed' },
    build: (p) => {
      const g = G();
      const frame = wood(p.wood, 0.55);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        box(g, frame, 8, 160, 8, sx * 48, 0, sz * 100);
      }
      for (const y of [22, 96]) {
        box(g, frame, 104, 8, 208, 0, y, 0, { r: 1 });
        dressBed(g, 94, 196, y + 8, {
          pillows: 1, puff: 0.82,
          duvet: solid(y > 50 ? '#7d94b8' : '#b8907d', 0.82)
        });
      }
      // guard rail + ladder
      box(g, frame, 100, 6, 4, 0, 122, 102);
      for (let i = 0; i < 4; i++) box(g, frame, 26, 4, 4, 66, 24 + i * 30, 60);
      box(g, frame, 4, 130, 4, 54, 8, 60);
      box(g, frame, 4, 130, 4, 78, 8, 60);
      return g;
    }
  },
  {
    hidden: true, id: 'crib_legacy', name: 'Baby Crib', cat: 'bedroom', w: 74, d: 134, h: 95,
    palettes: WOODS, plan: { type: 'bed' },
    build: (p) => {
      const g = G();
      const frame = wood(p.wood, 0.5);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        box(g, frame, 6, 92, 6, sx * 34, 0, sz * 64, { r: 2 });
      }
      box(g, frame, 74, 6, 134, 0, 32, 0, { r: 1 });
      box(g, solid('#f4f1ea', 0.7), 66, 10, 124, 0, 37, 0, { r: 3 });
      // bar rails on all four sides
      for (const sz of [-1, 1]) {
        box(g, frame, 74, 4, 5, 0, 84, sz * 64);
        for (let x = -28; x <= 28; x += 8) box(g, frame, 2.4, 46, 2.4, x, 38, sz * 64);
      }
      for (const sx of [-1, 1]) {
        box(g, frame, 5, 4, 128, sx * 34, 84, 0);
        for (let z = -56; z <= 56; z += 8) box(g, frame, 2.4, 46, 2.4, sx * 34, 38, z);
      }
      return g;
    }
  },
  {
    id: 'sideboard', name: 'Sideboard', cat: 'dining', w: 168, d: 46, h: 82,
    palettes: WOODS, plan: { type: 'storage' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.5);
      legs4(g, solid(dark, 0.4), 158, 38, 14, 2, 5, true);
      box(g, wd, 168, 62, 46, 0, 14, 0, { r: 1.5 });
      for (let i = 0; i < 3; i++) {
        box(g, wood(p.wood, 0.42), 52, 56, 1.5, -56 + i * 56, 17, 23.2);
        knob(g, -38 + i * 56, 45, 24.4);
      }
      // decor on top: vase + bowl
      cyl(g, solid('#c8beac', 0.6), 6, 22, -55, 76, 0, { rTop: 3.5 });
      foliage(g, '#5d7a4c', '#728f5e', -55, 102, 0, 9, 4, 21);
      cyl(g, solid('#8a8478', 0.5), 11, 5, 40, 76, 0, { rTop: 13 });
      return g;
    }
  },
  {
    id: 'wine_cabinet', name: 'Wine Cabinet', cat: 'dining', w: 82, d: 42, h: 180,
    palettes: WOODS, plan: { type: 'storage' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.5);
      box(g, wd, 82, 176, 42, 0, 0, 0, { r: 1.5 });
      box(g, solid('#25211e', 0.7), 72, 86, 3, 0, 82, 20);
      // bottle racks peeking out of the lower half
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          const bottle = cyl(g, solid(['#3a4a2e', '#4a2e33', '#2e3a4a'][(r + c) % 3], 0.3),
            4.2, 30, -27 + c * 18, 18 + r * 20, 8, { rx: Math.PI / 2 });
          sphere(g, solid('#6a6f5a', 0.4), 2, -27 + c * 18, 18 + r * 20, 25);
        }
      }
      // glass upper door
      box(g, glass(), 72, 82, 2, 0, 84, 21.5);
      handleBar(g, 30, 110, 22.5, 14, true);
      return g;
    }
  },
  {
    hidden: true, id: 'vanity_double_legacy', name: 'Double Vanity', cat: 'bathroom', w: 152, d: 52, h: 86,
    palettes: WOODS, plan: { type: 'sink' },
    build: (p) => {
      const g = G();
      legs4(g, metal('#7c8084', 0.4), 142, 44, 12, 1.6, 3, true);
      box(g, wood(p.wood, 0.5), 152, 62, 50, 0, 12, 0, { r: 1 });
      for (const sx of [-38, 38]) {
        box(g, wood(p.wood, 0.42), 66, 56, 1.5, sx, 15, 25.2);
        handleBar(g, sx, 43, 26.2, 16);
      }
      box(g, tex('countertop', 0.9, 0.4), 154, 3, 52, 0, 74, 0, { r: 0.8 });
      for (const sx of [-38, 38]) {
        const basin = sphere(g, solid('#f4f3f0', 0.2), 15, sx, 80, 2, { sy: 0.45 });
        basin.scale.x = 1.25;
        cyl(g, chrome(), 1.4, 18, sx, 76, -17);
        cyl(g, chrome(), 1.2, 12, sx, 93, -11.5, { rx: Math.PI / 2 });
      }
      return g;
    }
  },
  {
    id: 'treadmill', name: 'Treadmill', cat: 'office', w: 82, d: 190, h: 142,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      const body = metal('#33363b', 0.4);
      box(g, body, 76, 14, 170, 0, 0, 8, { r: 5 });
      box(g, solid('#1c1e21', 0.9), 58, 3, 140, 0, 14, 14, { r: 2 });
      // uprights + console
      for (const sx of [-1, 1]) box(g, body, 6, 120, 8, sx * 34, 10, -70, { rx: 0.22 });
      box(g, body, 76, 8, 5, 0, 126, -94, { rx: 0.3 });
      const screen = glow('#1a2632', 0.5, 0.3, '#2e5a7c');
      box(g, screen, 40, 24, 4, 0, 128, -90, { rx: -0.35 });
      return g;
    }
  },

  // ======================= EXPANSION PACK: OUTDOOR =======================
  {
    id: 'truck', name: 'Pickup Truck', cat: 'outdoor', w: 200, d: 560, h: 190,
    palettes: [
      { name: 'White', chip: '#e8e8ea', body: '#e8e8ea' },
      { name: 'Black', chip: '#26282c', body: '#26282c' },
      { name: 'Red', chip: '#8d3021', body: '#8d3021' },
      { name: 'Steel', chip: '#5f6a74', body: '#5f6a74' }
    ],
    plan: { type: 'car' },
    build: (p) => {
      const g = G();
      const paint = solid(p.body, 0.28);
      const darkGlass = solid('#1d2733', 0.1);
      const trim = solid('#1e2023', 0.6);
      const tire = solid('#1c1c1e', 0.9);
      const rim = metal('#c2c6cc', 0.3);
      // wheels with dark arch insets flush to the body sides
      for (const [wz, wx] of [[-178, -84], [-178, 84], [162, -84], [162, 84]]) {
        cyl(g, trim, 47, 3, Math.sign(wx) * 92, 40, wz, { rz: Math.PI / 2, seg: 26 });
        cyl(g, tire, 39, 26, wx, 39, wz, { rz: Math.PI / 2, seg: 26 });
        cyl(g, rim, 20, 27.5, wx, 39, wz, { rz: Math.PI / 2, seg: 20 });
        cyl(g, solid('#3a3d42', 0.4), 7, 28.5, wx, 39, wz, { rz: Math.PI / 2 });
      }
      box(g, trim, 176, 14, 500, 0, 20, 0, { r: 4, seg: 2 });         // frame/underbody
      box(g, paint, 186, 60, 540, 0, 26, 0, { r: 12, seg: 4 });       // lower body
      box(g, paint, 178, 34, 155, 0, 84, -190, { r: 10, seg: 3 });    // hood (lower than cab)
      box(g, paint, 180, 76, 182, 0, 84, -34, { r: 15, seg: 4 });     // cab
      box(g, darkGlass, 183, 36, 187, 0, 112, -34, { r: 12, seg: 3 }); // glass band (proud of the cab)
      // open cargo bed
      box(g, solid('#2b2d31', 0.75), 164, 6, 205, 0, 86, 162);
      box(g, paint, 10, 40, 212, -88, 84, 162, { r: 3 });
      box(g, paint, 10, 40, 212, 88, 84, 162, { r: 3 });
      box(g, paint, 172, 40, 10, 0, 84, 265, { r: 3 });               // tailgate
      // face: chrome grille bar + headlights; tail: vertical lamps
      box(g, metal('#c9cdd2', 0.25), 128, 22, 5, 0, 74, -269, { r: 2 });
      box(g, solid('#eef2f4', 0.2), 34, 10, 4, -66, 96, -268.5, { r: 2 });
      box(g, solid('#eef2f4', 0.2), 34, 10, 4, 66, 96, -268.5, { r: 2 });
      box(g, solid('#8a1f16', 0.35), 10, 26, 4, -80, 90, 270.5, { r: 2 });
      box(g, solid('#8a1f16', 0.35), 10, 26, 4, 80, 90, 270.5, { r: 2 });
      box(g, metal('#9aa0a6', 0.4), 172, 12, 10, 0, 30, -272);        // bumpers
      box(g, metal('#9aa0a6', 0.4), 172, 12, 10, 0, 30, 272);
      for (const s of [-1, 1]) {
        box(g, trim, 10, 5, 150, s * 95, 34, -30, { r: 2 });          // running boards
        box(g, paint, 8, 8, 14, s * 96, 118, -104, { r: 2 });         // mirrors
      }
      return g;
    }
  },
  {
    id: 'bicycle', name: 'Bicycle', cat: 'outdoor', w: 45, d: 170, h: 105,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      const frame = metal('#8d3021', 0.3);
      const tire = solid('#26262a', 0.85);
      for (const z of [-55, 55]) {
        cyl(g, tire, 33, 3, 0, 33, z, { rz: Math.PI / 2 });
        cyl(g, metal('#c2c6cc', 0.25), 29, 3.4, 0, 33, z, { rz: Math.PI / 2 });
      }
      // frame tubes
      box(g, frame, 3.5, 3.5, 62, 0, 60, -22, { rx: 0.25 });
      box(g, frame, 3.5, 52, 3.5, 0, 33, -55, { rx: 0.32 });
      box(g, frame, 3.5, 48, 3.5, 0, 33, 42, { rx: -0.28 });
      box(g, frame, 3.5, 44, 3.5, 0, 42, 8, { rx: -0.2 });
      // handlebars + seat + pedals
      box(g, metal('#2b2d31', 0.4), 34, 3, 3, 0, 92, -62);
      box(g, solid('#1e1e20', 0.7), 9, 4, 24, 0, 84, 24, { r: 2 });
      cyl(g, metal('#6d7278', 0.4), 6, 4, 0, 36, 6, { rz: Math.PI / 2 });
      return g;
    }
  },
  {
    id: 'fountain', name: 'Garden Fountain', cat: 'outdoor', w: 220, d: 220, h: 150,
    palettes: null, plan: { type: 'rings' },
    build: () => {
      const g = G();
      const stone = solid('#b3aca0', 0.85);
      cyl(g, stone, 105, 34, 0, 0, 0, { seg: 26 });
      cyl(g, solid('#8f887c', 0.9), 96, 6, 0, 32, 0, { seg: 26 });
      let w = cyl(g, water(), 92, 5, 0, 30, 0, { seg: 26 });
      w.receiveShadow = true;
      cyl(g, stone, 12, 62, 0, 30, 0);
      cyl(g, stone, 48, 12, 0, 88, 0, { seg: 22 });
      w = cyl(g, water(), 43, 4, 0, 98, 0, { seg: 22 });
      cyl(g, stone, 7, 34, 0, 98, 0);
      cyl(g, stone, 22, 9, 0, 130, 0, { seg: 18 });
      cyl(g, water(), 18, 3.5, 0, 137, 0, { seg: 18 });
      sphere(g, stone, 6, 0, 146, 0);
      return g;
    }
  },
  {
    id: 'gazebo', name: 'Gazebo', cat: 'outdoor', w: 340, d: 340, h: 320,
    palettes: WOODS, plan: { type: 'pergola' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.7);
      // round timber deck on a low plinth, posts just inside the deck edge
      cyl(g, wood('#6b5949', 0.85), 152, 6, 0, 0, 0, { seg: 24 });
      cyl(g, wd, 148, 8, 0, 6, 0, { seg: 24 });
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        const px = Math.cos(a) * 130, pz = Math.sin(a) * 130;
        box(g, wd, 11, 226, 11, px, 14, pz);
        cyl(g, wd, 7.5, 4, px, 240, pz);                     // capital under the eave
        // railing between posts (skip the entry side): rails + turned balusters
        if (i !== 4) {
          const a2 = ((i + 1) / 6) * Math.PI * 2 + Math.PI / 6;
          const qx = Math.cos(a2) * 130, qz = Math.sin(a2) * 130;
          const len = Math.hypot(qx - px, qz - pz);
          const rot = -Math.atan2(qz - pz, qx - px);
          const mx = (px + qx) / 2, mz = (pz + qz) / 2;
          box(g, wd, len - 12, 6, 6, mx, 92, mz, { ry: rot, r: 1.5 });
          box(g, wd, len - 12, 5, 5, mx, 24, mz, { ry: rot, r: 1 });
          for (let b = 1; b <= 4; b++) {
            const t = b / 5;
            cyl(g, wd, 2.2, 63, px + (qx - px) * t, 29, pz + (qz - pz) * t, { seg: 8 });
          }
        }
      }
      // smooth shingled cone roof with a fascia ring and finial
      cyl(g, solid('#4a3d33', 0.85), 186, 9, 0, 236, 0, { rTop: 182, seg: 24, open: true }); // fascia
      cyl(g, tex('shingle_brown', 5, 1.5), 184, 78, 0, 240, 0, { rTop: 3, seg: 24 });
      cyl(g, wd, 6, 12, 0, 314, 0, { rTop: 4 });
      sphere(g, wd, 6.5, 0, 330, 0);
      return g;
    }
  },
  {
    id: 'shed_garden', name: 'Garden Shed', cat: 'outdoor', w: 300, d: 220, h: 260,
    palettes: [
      { name: 'White', chip: '#e7e3d8', siding: 'siding_white' },
      { name: 'Cedar', chip: '#8a6a4a', siding: 'cedar_shake' },
      { name: 'Grey', chip: '#a9adad', siding: 'siding_gray' }
    ],
    plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const skin = tex(p.siding, 1.6, 1);
      box(g, skin, 296, 200, 216, 0, 0, 0);
      prism(g, tex('shingle_charcoal', 1, 1), 316, 70, 250, 0, 198, 0, skin);
      // door + hinges + window
      box(g, wood('#5d4a36', 0.6), 78, 160, 4, -60, 0, 109);
      knob(g, -32, 82, 112);
      box(g, solid('#3a3e44', 0.4), 62, 58, 4, 70, 90, 109);
      box(g, solid('#cfe0e8', 0.15), 54, 50, 3, 70, 94, 110);
      box(g, solid('#e8e6e0', 0.5), 3.5, 50, 3.5, 70, 94, 110.5);
      return g;
    }
  },
  {
    id: 'dog_house', name: 'Dog House', cat: 'outdoor', w: 96, d: 116, h: 100,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      const skin = wood('#8a5c3c', 0.7);
      box(g, skin, 92, 66, 112, 0, 0, 0);
      prism(g, tex('shingle_red', 1, 1), 104, 34, 124, 0, 64, 0, skin);
      // arched doorway (approximated: box + half-cylinder)
      box(g, solid('#241d16', 0.95), 36, 34, 4, 0, 0, 55);
      const arch = cyl(g, solid('#241d16', 0.95), 18, 4, 0, 34, 55, { rx: Math.PI / 2 });
      // food bowl
      cyl(g, metal('#b9bdc4', 0.3), 9, 5, 34, 0, 74);
      return g;
    }
  },
  {
    id: 'flower_bed', name: 'Flower Bed', cat: 'outdoor', w: 170, d: 85, h: 42,
    palettes: null, plan: { type: 'hedge' },
    build: () => {
      const g = G();
      let s = 77;
      const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
      // stone border
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const rx = Math.cos(a) * 76, rz = Math.sin(a) * 34;
        const rock = sphere(g, solid(rand() < 0.5 ? '#8a8478' : '#75705f', 0.9), 9 + rand() * 4, rx, 4, rz, { sy: 0.6, seg: 8 });
        rock.rotation.y = rand() * Math.PI;
      }
      const soil = cyl(g, solid('#4a3a28', 0.98), 72, 8, 0, 0, 0, { seg: 24 });
      soil.scale.z = 0.44;
      // lumpy foliage bed the blooms rise out of
      for (const [fx, fz, fr, sd] of [[-42, 0, 20, 130], [2, 4, 23, 133], [46, -3, 19, 137]]) {
        const b = blob(g, '#33571f', '#54803a', fr, fx, 12, fz, { seed: sd, sy: 0.6 });
        b.scale.z = 0.75;
      }
      // blooms: visible stems, a petal whorl and a bright center
      const heads = ['#c94a63', '#e0a33c', '#9c6bbf', '#ece7dc', '#d3591f', '#c94a63', '#e0a33c'];
      for (let i = 0; i < 7; i++) {
        const fx = -60 + i * 20 + (rand() - 0.5) * 8, fz = (rand() - 0.5) * 40;
        const fh = 20 + rand() * 14;
        cyl(g, solid('#4e6b34', 0.9), 0.9, fh, fx, 10, fz);
        const petals = sphere(g, solid(heads[i], 0.6), 4.6 + rand() * 1.6, fx, 11 + fh, fz, { sy: 0.42, seg: 10 });
        petals.rotation.x = (rand() - 0.5) * 0.4;
        sphere(g, solid('#e8c02e', 0.55), 1.7, fx, 12.5 + fh, fz, { seg: 8 });
      }
      return g;
    }
  },
  {
    id: 'planter_box', name: 'Planter Box', cat: 'outdoor', w: 110, d: 42, h: 52,
    palettes: WOODS, plan: { type: 'hedge' },
    build: (p) => {
      const g = G();
      box(g, wood(p.wood, 0.75), 110, 40, 42, 0, 0, 0, { r: 2 });
      box(g, solid('#4a3a28', 0.98), 100, 4, 34, 0, 36, 0);
      foliage(g, '#4e6b34', '#5f8040', -30, 52, 0, 14, 5, 41);
      foliage(g, '#5d7a4c', '#728f5e', 8, 54, 4, 15, 5, 42);
      foliage(g, '#3f6b2e', '#548a3c', 40, 50, -4, 12, 4, 43);
      return g;
    }
  },
  {
    id: 'lounger', name: 'Sun Lounger', cat: 'outdoor', w: 66, d: 186, h: 72,
    palettes: null, plan: { type: 'sofa', seats: 1 },
    build: () => {
      const g = G();
      const frame = wood('#8a6a4a', 0.7);
      const canvas = solid('#dad4c4', 0.85);
      for (const sx of [-1, 1]) {
        box(g, frame, 5, 5, 180, sx * 29, 28, 0);
        box(g, frame, 5, 28, 5, sx * 29, 0, -80);
        box(g, frame, 5, 28, 5, sx * 29, 0, 60);
      }
      box(g, canvas, 56, 4, 118, 0, 32, 22, { r: 2 });
      box(g, canvas, 56, 4, 74, 0, 52, -54, { r: 2, rx: -0.62 });
      return g;
    }
  },
  {
    id: 'slide', name: 'Playground Slide', cat: 'outdoor', w: 96, d: 280, h: 165,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      const steel = metal('#7d838c', 0.4);
      const plastic = solid('#d9482f', 0.5);
      const yellow = solid('#e8b23a', 0.5);
      const TOP = 120;
      // support posts (back pair tall, front pair short) + angled foot braces
      for (const sx of [-1, 1]) {
        box(g, steel, 5, TOP, 5, sx * 28, 0, -104);
        box(g, steel, 5, 66, 5, sx * 28, 0, -44);
        strut(g, steel, sx * 28, 6, -104, sx * 28, 6, -44, 2.2);   // side rail tie
      }
      // deck + guard panels + grab hood at the top of the chute
      box(g, plastic, 62, 6, 52, 0, TOP, -98, { r: 2 });
      for (const sx of [-1, 1]) box(g, yellow, 4, 40, 52, sx * 30, TOP + 6, -98, { r: 2 });
      box(g, yellow, 62, 40, 4, 0, TOP + 6, -122, { r: 2 });     // back guard
      for (const sx of [-1, 1]) strut(g, steel, sx * 26, TOP, -74, sx * 26, TOP + 52, -74, 2.4);
      cyl(g, steel, 2.4, 56, 0, TOP + 52, -74, { rz: Math.PI / 2, seg: 12 });  // hood grab bar
      // angled ladder at the very back
      for (const sx of [-1, 1]) strut(g, steel, sx * 26, 0, -152, sx * 26, TOP, -118, 3);
      for (let i = 0; i < 5; i++) { const t = (i + 0.5) / 5; box(g, steel, 50, 3.5, 5, 0, t * (TOP - 6) + 4, -152 + t * 34, { r: 1.5 }); }
      // two-part chute: steep upper run, flatter run-out, up-curved end lip
      box(g, plastic, 54, 5, 148, 0, 73.5, -18, { rx: 0.64, r: 2.5 });   // steep bed
      box(g, plastic, 54, 5, 86, 0, 20.5, 66, { rx: 0.27, r: 2.5 });      // run-out bed
      box(g, plastic, 54, 5, 22, 0, 11, 118, { rx: -0.34, r: 2.5 });      // kick-up lip
      // raised side rails hugging both chute segments
      for (const sx of [-1, 1]) {
        box(g, yellow, 6, 17, 148, sx * 27, 78, -18, { rx: 0.64, r: 2 });
        box(g, yellow, 6, 15, 86, sx * 27, 25, 66, { rx: 0.27, r: 2 });
      }
      return g;
    }
  },
  {
    id: 'sandbox', name: 'Sandbox', cat: 'outdoor', w: 170, d: 170, h: 32,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      const frame = wood('#8a6a4a', 0.8);
      const cap = wood('#a5855c', 0.6);
      const sand = solid('#dcc794', 0.98);
      // plank walls
      box(g, frame, 170, 26, 20, 0, 0, -75);
      box(g, frame, 170, 26, 20, 0, 0, 75);
      box(g, frame, 20, 26, 130, -75, 0, 0);
      box(g, frame, 20, 26, 130, 75, 0, 0);
      // mounded sand: flat fill + a gentle central rise
      box(g, sand, 132, 15, 132, 0, 0, 0);
      sphere(g, sand, 46, 0, 11, 2, { sy: 0.2, sx: 1.32, sz: 1.26, seg: 22 });
      // triangular corner seats on the rails
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        box(g, cap, 50, 5, 50, sx * 52, 26, sz * 52, { r: 2, ry: Math.PI / 4 });
      }
      // toy pail (tapered, with a wire handle) + a dumped sand tower + shovel
      cyl(g, solid('#2f8fd0', 0.5), 8, 14, 34, 16, 22, { rTop: 10.5, seg: 16 });
      cyl(g, solid('#2f8fd0', 0.5), 10.5, 2.4, 34, 30, 22, { seg: 16 });
      strut(g, metal('#c9ccd0', 0.35), 24, 30, 22, 44, 30, 22, 0.7, { seg: 6 });
      cyl(g, sand, 11, 17, -32, 12, -20, { seg: 12 });   // sandcastle tower
      cyl(g, sand, 8, 5, -32, 29, -20, { seg: 12 });
      strut(g, solid('#e14e3a', 0.5), -18, 20, 34, -44, 33, 50, 1.3, { seg: 8 });  // shovel shaft
      box(g, solid('#e14e3a', 0.5), 11, 2, 15, -46, 32, 52, { r: 1, ry: 0.5 });    // shovel blade
      return g;
    }
  },

  {
    id: 'shipping_container', name: 'Shipping Container', cat: 'outdoor', w: 244, d: 1220, h: 260,
    palettes: [
      { name: 'Rust Red', chip: '#8d3a28', body: '#8d3a28' },
      { name: 'Ocean Blue', chip: '#2e4a68', body: '#2e4a68' },
      { name: 'Forest', chip: '#3f5c40', body: '#3f5c40' },
      { name: 'Grey', chip: '#6d7278', body: '#6d7278' }
    ],
    plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const paint = solid(p.body, 0.55);
      const trim = solid('#33363a', 0.5);
      box(g, paint, 232, 252, 1210, 0, 4, 0);
      box(g, trim, 240, 6, 1218, 0, 0, 0);
      box(g, trim, 240, 6, 1218, 0, 252, 0);
      // corrugation ribs down both long sides
      for (let z = -570; z <= 570; z += 60) {
        box(g, paint, 8, 244, 22, -119, 4, z);
        box(g, paint, 8, 244, 22, 119, 4, z);
      }
      // corner castings
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const sy of [0, 242]) {
        box(g, trim, 20, 18, 20, sx * 112, sy, sz * 601);
      }
      // cargo doors with lock rods on the front end
      box(g, paint, 112, 240, 8, -58, 6, 606);
      box(g, paint, 112, 240, 8, 58, 6, 606);
      for (const rx of [-88, -30, 30, 88]) {
        cyl(g, metal('#b9bdc4', 0.35), 2.2, 232, rx, 8, 611);
        box(g, metal('#b9bdc4', 0.35), 10, 4, 6, rx + 8, 120, 611);
      }
      return g;
    }
  },
  {
    id: 'hill_mound', name: 'Grass Hill', cat: 'outdoor', w: 800, d: 500, h: 200, noShadow: true,
    palettes: null, plan: { type: 'hedge' },
    build: () => {
      const g = G();
      // displaced grassy dome: an undulating silhouette built by noising a
      // sphere in-place and folding everything below grade flat (so the bbox
      // honours the declared 200cm height — no buried half-sphere)
      const mound = sphere(g, tex('grass', 5, 3), 250, 0, 0, 0, { seg: 30 });
      mound.receiveShadow = true;
      const pos = mound.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i) * 1.55, y = pos.getY(i) * 0.78, z = pos.getZ(i) * 0.94;
        // gentle low-amp undulation so the crown and shoulders roll
        const n = Math.sin(x * 0.011 + 1.3) * Math.cos(z * 0.017 + 0.4) +
                  Math.sin((x + z) * 0.008 + 2.1) * 0.7 +
                  Math.cos(x * 0.021 - z * 0.012) * 0.4;
        const f = 1 + n * 0.045;
        x *= f; z *= f; y = y * f - 14;
        if (y < 0) y = 0;         // fold the underside flat at grade
        pos.setXYZ(i, x, y, z);
      }
      mound.geometry.computeVertexNormals();
      // boulders + a shrub so it reads as landscape, not a bump
      sphere(g, solid('#8a8478', 0.95), 26, -290, 0, 130, { sy: 0.6, seg: 10 });
      sphere(g, solid('#75705f', 0.95), 18, 250, 0, -150, { sy: 0.65, seg: 10 });
      foliage(g, '#3d5c2e', '#4a7038', -240, 30, -140, 26, 6, 91);
      return g;
    }
  },

  // ======================= GARDEN & FLOWERS =======================
  {
    id: 'sunflower', name: 'Sunflower', cat: 'outdoor', w: 60, d: 60, h: 180,
    palettes: null, plan: { type: 'plant' },
    build: () => {
      const g = G();
      buildSunflower(g, 0, 0, 165, 17, 5);
      return g;
    }
  },
  {
    id: 'sunflower_mammoth', name: 'Mammoth Sunflower', cat: 'outdoor', w: 120, d: 120, h: 380,
    palettes: null, plan: { type: 'plant' },
    build: () => {
      const g = G();
      buildSunflower(g, 0, 0, 355, 34, 11);
      return g;
    }
  },
  {
    id: 'sunflower_row', name: 'Sunflower Row', cat: 'outdoor', w: 200, d: 70, h: 230,
    palettes: null, plan: { type: 'plant' },
    build: () => {
      const g = G();
      box(g, solid('#4a3a28', 0.98), 196, 10, 54, 0, 0, 0, { r: 4 });
      buildSunflower(g, -70, -8, 172, 17, 21);
      buildSunflower(g, -22, 10, 210, 20, 22);
      buildSunflower(g, 28, -6, 150, 15, 23);
      buildSunflower(g, 74, 8, 192, 18, 24);
      return g;
    }
  },
  {
    id: 'rose_bush', name: 'Rose Bush', cat: 'outdoor', w: 95, d: 95, h: 100,
    palettes: [
      { name: 'Red', chip: '#b3273a', bloom: '#b3273a' },
      { name: 'Pink', chip: '#d87d9c', bloom: '#d87d9c' },
      { name: 'White', chip: '#ece7dc', bloom: '#ece7dc' },
      { name: 'Yellow', chip: '#e0b23c', bloom: '#e0b23c' }
    ],
    plan: { type: 'plant' },
    build: (p) => {
      const g = G();
      cyl(g, solid('#4e3a26', 0.95), 3.5, 20, 0, 0, 0, { rTop: 2.6 });
      // layered leafy mound (deep interior -> sunlit crown)
      blob(g, '#2c4d1c', '#4a7030', 34, 0, 42, 0, { seed: 51, sy: 1.0 });
      blob(g, '#33571f', '#558038', 26, -20, 56, 10, { seed: 54, sy: 0.9 });
      blob(g, '#30521e', '#517c34', 25, 21, 54, -12, { seed: 57, sy: 0.92 });
      blob(g, '#365a22', '#5c8a3c', 20, 2, 68, 4, { seed: 60, sy: 0.85 });
      let s = 61;
      const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
      const bloomMat = solid(p.bloom, 0.55);
      const heartMat = solid('#3a2b1a', 0.8);
      // roses sit ON the crown: cupped outer whorl + rising inner bud + heart
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + rand() * 0.5;
        const r = 10 + rand() * 22;
        const bx = Math.cos(a) * r, bz = Math.sin(a) * r;
        // blooms ride ON the mound's crown surface, standing proud on stems
        const by = 90 - r * 0.55 + rand() * 5;
        cyl(g, solid('#3f6b28', 0.9), 0.8, 14 + rand() * 5, bx, by - 15, bz); // stem into the bush
        const rr = 4.8 + rand() * 2.2;
        sphere(g, bloomMat, rr, bx, by, bz, { sy: 0.62, seg: 10 });          // outer whorl
        sphere(g, bloomMat, rr * 0.62, bx, by + rr * 0.34, bz, { sy: 0.78, seg: 8 }); // inner bud
        sphere(g, heartMat, rr * 0.22, bx, by + rr * 0.62, bz, { seg: 6 });  // dark heart
      }
      return g;
    }
  },
  {
    id: 'tulip_bed', name: 'Tulip Bed', cat: 'outdoor', w: 130, d: 75, h: 50,
    palettes: null, plan: { type: 'plant' },
    build: () => {
      const g = G();
      box(g, solid('#4a3a28', 0.98), 126, 10, 70, 0, 0, 0, { r: 4 });
      let s = 41;
      const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
      const colors = ['#c8283c', '#e0a33c', '#9c50b8', '#e05a7c', '#ece7dc', '#c8283c', '#e0a33c', '#e05a7c'];
      for (let i = 0; i < 8; i++) {
        const tx = -47 + (i % 4) * 31 + (rand() - 0.5) * 10;
        const tz = (i < 4 ? -16 : 16) + (rand() - 0.5) * 10;
        const th = 26 + rand() * 12;
        const lean = (rand() - 0.5) * 0.12;
        const stem = cyl(g, solid('#3f6b28', 0.9), 1.2, th, tx, 8, tz);
        stem.rotation.z = lean;
        // broad strap leaf hugging the stem
        const leaf = sphere(g, solid('#4a7a30', 0.9), 6, tx + 4, 15, tz - 1, { sy: 1.9, sz: 0.42, seg: 8 });
        leaf.scale.x = 0.2;
        leaf.rotation.z = 0.38;
        leaf.rotation.y = rand() * Math.PI;
        // tulip cup: egg-shaped outer petals + lighter inner petals peeking out
        const bx = tx + Math.sin(lean) * th;
        sphere(g, solid(colors[i], 0.55), 5.4, bx, 8 + th + 3.5, tz, { sy: 1.25, sx: 0.92, seg: 12 });
        sphere(g, solid('#f2e4c0', 0.6), 3.1, bx, 8 + th + 7.5, tz, { sy: 1.05, seg: 8 });
      }
      return g;
    }
  },
  {
    id: 'raised_bed', name: 'Raised Garden Bed', cat: 'outdoor', w: 220, d: 110, h: 75,
    palettes: WOODS, plan: { type: 'hedge' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.8);
      box(g, wd, 220, 42, 14, 0, 0, -48);
      box(g, wd, 220, 42, 14, 0, 0, 48);
      box(g, wd, 14, 42, 82, -103, 0, 0);
      box(g, wd, 14, 42, 82, 103, 0, 0);
      box(g, solid('#463522', 0.98), 196, 36, 82, 0, 0, 0);
      let s = 87;
      const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
      // three planted rows: leafy greens, tomatoes on stakes, carrots' tops
      for (let i = 0; i < 5; i++) {
        const x = -80 + i * 40;
        foliage(g, '#4e7a2e', '#68954a', x, 44, -26, 11, 4, 60 + i);
        cyl(g, wood('#8a6a4a', 0.9), 1.2, 46, x + 2, 36, 4);
        foliage(g, '#3f6b28', '#548a3c', x, 62, 4, 8, 3, 70 + i);
        sphere(g, solid('#c8412e', 0.5), 3.4, x - 3, 56, 6, { seg: 8 });
        sphere(g, solid('#e05a30', 0.5), 2.8, x + 4, 48, 2, { seg: 8 });
        foliage(g, '#55842e', '#6da03c', x + (rand() - 0.5) * 10, 42, 30, 7, 3, 80 + i);
      }
      return g;
    }
  },
  // ===================== PREMIUM PACK (v2.15) =====================
  // living
  {
    id: 'sofa_sectional', name: 'L-Sectional Sofa', cat: 'living', w: 300, d: 220, h: 78,
    palettes: FABRICS, plan: { type: 'sofa', seats: 4 },
    build: (p) => {
      const g = G();
      const f = tex(p.fabric, 2.4, 1);
      box(g, solid('#4a453e', 0.8), 296, 14, 96, 0, 0, -58, { r: 2 });
      box(g, solid('#4a453e', 0.8), 96, 14, 120, -100, 0, 50, { r: 2 });
      box(g, f, 296, 40, 96, 0, 8, -58, { r: 8 });
      box(g, f, 96, 40, 120, -100, 8, 50, { r: 8 });
      box(g, f, 296, 34, 18, 0, 44, -96, { r: 7 });
      box(g, f, 20, 26, 90, 138, 44, -58, { r: 7 });
      for (let i = 0; i < 3; i++) box(g, f, 88, 16, 80, -96 + i * 96, 46, -54, { r: 7 });
      box(g, f, 90, 16, 108, -100, 46, 52, { r: 7 });
      for (let i = 0; i < 3; i++) box(g, f, 80, 40, 14, -96 + i * 96, 52, -88, { r: 7, rx: -0.12 });
      return g;
    }
  },
  {
    id: 'sofa_chester', name: 'Chesterfield Sofa', cat: 'living', w: 220, d: 95, h: 80,
    palettes: [{ name: 'Cognac', chip: '#8a5a34', c: '#8a5a34' }, { name: 'Oxblood', chip: '#6a2e2a', c: '#6a2e2a' }, { name: 'Forest', chip: '#3a5240', c: '#3a5240' }],
    plan: { type: 'sofa', seats: 3 },
    build: (p) => {
      const g = G();
      const lth = solid(p.c, 0.45);
      box(g, lth, 216, 42, 88, 0, 0, 0, { r: 10 });
      box(g, lth, 216, 40, 20, 0, 40, -34, { r: 10 });
      for (const s of [-1, 1]) box(g, lth, 22, 34, 80, s * 97, 36, 0, { r: 10 });
      for (let i = 0; i < 6; i++) sphere(g, solid('#2e2622', 0.5), 1.6, -75 + i * 30, 62, -25);
      for (let i = 0; i < 2; i++) box(g, lth, 92, 12, 62, -48 + i * 96, 42, 6, { r: 6 });
      legs4(g, wood('#4a3826'), 210, 82, 8, 3, 10);
      return g;
    }
  },
  {
    id: 'media_console', name: 'Media Console', cat: 'living', w: 200, d: 45, h: 55,
    palettes: WOODS, plan: { type: 'table' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood);
      box(g, wd, 200, 44, 45, 0, 8, 0, { r: 2 });
      box(g, solid('#1d1f22', 0.3), 92, 30, 2, -51, 15, 22);
      box(g, solid('#1d1f22', 0.3), 92, 30, 2, 51, 15, 22);
      handleBar(g, -51, 30, 23.5, 16); handleBar(g, 51, 30, 23.5, 16);
      legs4(g, metal('#8a8d90'), 190, 38, 8, 2, 8);
      box(g, solid('#26282c', 0.4), 160, 6, 10, 0, 52.2, 12, { r: 3 });
      return g;
    }
  },
  {
    id: 'recliner', name: 'Recliner', cat: 'living', w: 90, d: 100, h: 100,
    palettes: FABRICS, plan: { type: 'chair' },
    build: (p) => {
      const g = G();
      const f = tex(p.fabric, 1, 1);
      box(g, f, 84, 30, 80, 0, 0, 4, { r: 9 });
      box(g, f, 70, 60, 20, 0, 28, -34, { r: 10, rx: -0.25 });
      for (const s of [-1, 1]) box(g, f, 16, 30, 74, s * 36, 28, 2, { r: 8 });
      box(g, f, 62, 10, 42, 0, 16, 52, { r: 6, rx: 0.35 });
      return g;
    }
  },
  {
    id: 'shelf_ladder', name: 'Ladder Shelf', cat: 'living', w: 65, d: 40, h: 190,
    palettes: WOODS, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood);
      for (const s of [-1, 1]) box(g, wd, 5, 190, 5, s * 30, 0, -14, { rx: 0.18 });
      for (let i = 0; i < 4; i++) box(g, wd, 62, 3, 34 - i * 7, 0, 42 + i * 44, -2 - i * 5);
      box(g, wood('#7a5c40'), 16, 20, 12, -14, 45, 2);
      box(g, wood('#4a5a6a'), 12, 17, 10, 4, 45, 2);
      sphere(g, solid('#c8a878', 0.7), 7, 18, 96, -8);
      return g;
    }
  },
  {
    id: 'pouf', name: 'Round Pouf', cat: 'living', w: 55, d: 55, h: 38,
    palettes: FABRICS, plan: { type: 'tableRound' },
    build: (p) => {
      const g = G();
      const m = tex(p.fabric, 1, 1);
      cyl(g, m, 27, 34, 0, 0, 0, { seg: 20 });
      sphere(g, m, 27, 0, 34, 0, { sy: 0.28 });
      return g;
    }
  },
  {
    id: 'fireplace_wall', name: 'Electric Fireplace', cat: 'living', w: 150, d: 20, h: 130,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      box(g, tex('stone_veneer', 1.4, 1.2), 150, 128, 18, 0, 0, 0, { r: 1 });
      box(g, solid('#141414', 0.3), 110, 42, 3, 0, 34, 9);
      box(g, solid('#1d1d1d', 0.4), 104, 36, 1, 0, 37, 9.5);
      for (let i = 0; i < 5; i++) sphere(g, solid('#ff7a26', 0.6), 4, -34 + i * 17, 42, 10);
      box(g, wood('#6a4f36'), 130, 6, 24, 0, 96, 2, { r: 2 });
      return g;
    },
    light: { y: 45, color: '#ff8a3a', intensity: 0.8, distance: 260 }
  },
  // bedroom
  {
    id: 'bed_canopy', name: 'Canopy Bed', cat: 'bedroom', w: 175, d: 215, h: 210,
    palettes: WOODS, plan: { type: 'bed', pillows: 2 },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood);
      box(g, wd, 175, 28, 212, 0, 6, 0, { r: 2 });
      dressBed(g, 165, 196, 34, { pillows: 2, duvet: tex('fabric_beige', 2, 2), throw: '#9c8a6a' });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, wd, 7, 205, 7, sx * 84, 0, sz * 102);
      box(g, wd, 175, 5, 7, 0, 202, -102); box(g, wd, 175, 5, 7, 0, 202, 102);
      box(g, wd, 7, 5, 210, -84, 202, 0); box(g, wd, 7, 5, 210, 84, 202, 0);
      return g;
    }
  },
  {
    id: 'bed_bunk', name: 'Bunk Bed', cat: 'bedroom', w: 105, d: 205, h: 165,
    palettes: WOODS, plan: { type: 'bed', pillows: 1 },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood);
      for (const y of [22, 110]) {
        box(g, wd, 105, 14, 205, 0, y, 0, { r: 2 });
        dressBed(g, 96, 192, y + 14, {
          pillows: 1, puff: 0.82,
          duvet: solid(y > 50 ? '#8fb0c8' : '#d8b59a', 0.85)
        });
      }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, wd, 8, 160, 8, sx * 48, 0, sz * 98);
      box(g, wd, 100, 12, 4, 0, 130, 100);
      for (const dx of [0, 14]) box(g, wd, 4, 100, 4, 40 + dx, 20, 102);
      for (let i = 0; i < 4; i++) box(g, wd, 22, 4, 4, 47, 34 + i * 26, 102);
      return g;
    }
  },
  {
    id: 'crib', name: 'Baby Crib', cat: 'bedroom', w: 130, d: 70, h: 95,
    palettes: WOODS, plan: { type: 'bed', pillows: 1 },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood);
      box(g, wd, 130, 8, 70, 0, 28, 0, { r: 2 });
      box(g, solid('#f6f2ea', 0.95), 122, 12, 62, 0, 34, 0, { r: 4 });
      for (const sz of [-1, 1]) {
        box(g, wd, 130, 4, 4, 0, 88, sz * 33);
        for (let i = 0; i < 12; i++) box(g, wd, 2.5, 56, 2.5, -60 + i * 11, 32, sz * 33);
      }
      for (const sx of [-1, 1]) {
        box(g, wd, 4, 92, 4, sx * 63, 0, -33); box(g, wd, 4, 92, 4, sx * 63, 0, 33);
        box(g, wd, 4, 4, 66, sx * 63, 88, 0);
        for (let i = 0; i < 5; i++) box(g, wd, 2.5, 56, 2.5, sx * 63, 32, -27 + i * 13.5);
      }
      return g;
    }
  },
  {
    id: 'vanity_makeup', name: 'Makeup Vanity', cat: 'bedroom', w: 110, d: 45, h: 140,
    palettes: WOODS, plan: { type: 'table' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood);
      box(g, wd, 110, 6, 45, 0, 72, 0, { r: 2 });
      legs4(g, wd, 100, 38, 72, 2.5, 6);
      box(g, wd, 30, 12, 40, -38, 60, 0); knob(g, -38, 66, 21);
      cyl(g, wood('#8a6a4a'), 28, 2.5, 0, 82, -19.5, { rx: Math.PI / 2, seg: 28 });
      cyl(g, mirror(), 26, 2, 0, 84, -18, { rx: Math.PI / 2, seg: 28 });
      // upholstered stool tucked under the tabletop (stays inside the footprint)
      const stool = G();
      stool.position.set(26, 0, 24);
      g.add(stool);
      cyl(stool, tex('fabric_beige', 1, 1), 15.5, 8, 0, 38, 0, { seg: 16 });
      legs4(stool, wd, 26, 26, 38, 2, 3);
      return g;
    }
  },
  {
    id: 'bench_bed', name: 'Bed Bench', cat: 'bedroom', w: 130, d: 42, h: 45,
    palettes: FABRICS, plan: { type: 'sofa', seats: 2 },
    build: (p) => {
      const g = G();
      box(g, tex(p.fabric, 1.6, 0.6), 130, 18, 42, 0, 27, 0, { r: 7 });
      legs4(g, metal('#8a8d90'), 120, 34, 27, 2, 6);
      return g;
    }
  },
  {
    id: 'armoire', name: 'Armoire', cat: 'bedroom', w: 120, d: 60, h: 200,
    palettes: WOODS, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood);
      box(g, wd, 120, 196, 58, 0, 0, 0, { r: 2 });
      for (const s of [-1, 1]) {
        box(g, wd, 54, 182, 2, s * 29, 7, 29);
        handleBar(g, s * 6, 95, 31, 22, true);
      }
      box(g, wd, 124, 8, 62, 0, 196, 0, { r: 2 });
      return g;
    }
  },
  // kitchen
  {
    id: 'island_stools', name: 'Island + Stools', cat: 'kitchen', w: 220, d: 150, h: 92,
    palettes: WOODS, plan: { type: 'table' },
    build: (p) => {
      const g = G();
      box(g, wood(p.wood), 200, 84, 90, 0, 0, -20, { r: 2 });
      box(g, tex('countertop', 2, 1), 220, 8, 110, 0, 84, -20, { r: 2 });
      for (const s of [-1, 1]) { box(g, wood(p.wood), 50, 70, 2, s * 48, 6, 26); handleBar(g, s * 48, 62, 27, 18); }
      for (let i = 0; i < 3; i++) {
        const x = -70 + i * 70;
        cyl(g, metal('#6a6d70'), 3, 62, x, 0, 52);
        cyl(g, wood('#4a3826'), 17, 5, x, 62, 52, { seg: 18 });
      }
      return g;
    }
  },
  {
    id: 'range_hood', name: 'Range + Hood', cat: 'kitchen', w: 90, d: 65, h: 210,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      box(g, metal('#c8cbce', 0.3), 90, 90, 62, 0, 0, 0, { r: 1 });
      box(g, solid('#17181a', 0.3), 80, 40, 2, 0, 30, 31);
      handleBar(g, 0, 76, 33, 70);
      box(g, solid('#1d1f22', 0.5), 86, 3, 58, 0, 90, 0);
      for (let i = 0; i < 4; i++) cyl(g, solid('#2a2c2e', 0.5), 9, 1.5, -30 + (i % 2) * 60, 91.5, -14 + Math.floor(i / 2) * 28, { seg: 16 });
      box(g, metal('#c8cbce', 0.3), 88, 22, 55, 0, 150, 0, { r: 1 });
      prism(g, metal('#c8cbce', 0.3), 60, 40, 40, 0, 172, 0);
      return g;
    }
  },
  {
    id: 'fridge_french', name: 'French-Door Fridge', cat: 'kitchen', w: 92, d: 72, h: 178,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      const st = metal('#c4c7ca', 0.25);
      box(g, st, 92, 176, 70, 0, 0, 0, { r: 3 });
      box(g, solid('#9a9da0', 0.35), 90, 2, 68, 0, 108, 0);
      box(g, solid('#9a9da0', 0.35), 2, 66, 68, 0, 110, 0);
      handleBar(g, -8, 130, 36.5, 40, true); handleBar(g, 8, 130, 36.5, 40, true);
      handleBar(g, 0, 88, 36.5, 60);
      box(g, solid('#26282a', 0.3), 26, 34, 1.5, -22, 128, 35.6);
      return g;
    }
  },
  {
    id: 'pantry_cab', name: 'Pantry Cabinet', cat: 'kitchen', w: 80, d: 60, h: 210,
    palettes: WOODS, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood);
      box(g, wd, 80, 208, 58, 0, 0, 0, { r: 1.5 });
      for (const s of [-1, 1]) { box(g, wd, 36, 198, 2, s * 20, 5, 29); handleBar(g, s * 5, 105, 31, 26, true); }
      return g;
    }
  },
  {
    id: 'coffee_bar', name: 'Coffee Station', cat: 'kitchen', w: 120, d: 50, h: 140,
    palettes: WOODS, plan: { type: 'table' },
    build: (p) => {
      const g = G();
      box(g, wood(p.wood), 120, 84, 48, 0, 0, 0, { r: 2 });
      box(g, tex('countertop', 1.2, 0.5), 124, 6, 52, 0, 84, 0, { r: 2 });
      box(g, solid('#2a2c2e', 0.4), 26, 34, 30, -34, 90, 0, { r: 3 });
      box(g, metal('#9a9da0'), 20, 6, 24, -34, 124, 0, { r: 2 });
      cyl(g, solid('#e8e4dc', 0.7), 8, 20, 8, 90, 4);
      box(g, wood('#8a6a4a'), 30, 3, 30, 36, 90, 0, { r: 2 });
      for (let i = 0; i < 3; i++) cyl(g, solid(['#c8a878', '#8a5a34', '#e0d6c8'][i], 0.7), 4.5, 12, 26 + i * 11, 93, -6, { seg: 12 });
      box(g, wood(p.wood), 116, 44, 3, 0, 96, -22);
      box(g, wood(p.wood), 110, 3, 16, 0, 128, -15);
      return g;
    }
  },
  {
    id: 'dishwasher', name: 'Dishwasher', cat: 'kitchen', w: 60, d: 62, h: 86,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      box(g, metal('#c4c7ca', 0.25), 60, 84, 60, 0, 0, 0, { r: 1.5 });
      handleBar(g, 0, 74, 31, 44);
      box(g, solid('#26282a', 0.4), 44, 4, 1.5, 0, 78, 30.6);
      return g;
    }
  },
  {
    id: 'wine_cabinet_k', name: 'Wine Cabinet', cat: 'kitchen', w: 70, d: 45, h: 130,
    palettes: WOODS, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      box(g, wood(p.wood), 70, 128, 43, 0, 0, 0, { r: 2 });
      box(g, glass(), 54, 80, 1.5, 0, 40, 21.8);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
        cyl(g, solid(['#3a2430', '#2a3a2a', '#3a3020', '#2e2a3a'][c], 0.3), 3.6, 26, -21 + c * 14, 48 + r * 22, 8, { rx: Math.PI / 2 });
      }
      handleBar(g, 24, 70, 22.5, 20, true);
      return g;
    }
  },
  // bathroom
  {
    id: 'tub_free', name: 'Freestanding Tub', cat: 'bathroom', w: 170, d: 80, h: 60,
    palettes: null, plan: { type: 'tableRound' },
    build: () => {
      const g = G();
      const wh = solid('#f4f2ee', 0.22);
      // oval acrylic shell (true 170x80 footprint) with a rolled rim
      sphere(g, wh, 82, 0, 28, 0, { sy: 0.36, sz: 0.45, seg: 26 });
      torus(g, wh, 78, 4.5, 0, 55.5, 0, { sy: 0.45, seg: 36, tubeSeg: 12 }); // (local y = world z once laid flat)
      const wt = sphere(g, water(160), 64, 0, 52, 0, { sy: 0.1, sz: 0.44, seg: 24 });
      wt.receiveShadow = true;
      // freestanding floor-mounted filler standing beside the foot end
      cyl(g, chrome(), 2.2, 62, -90, 0, 0);
      cyl(g, chrome(), 1.8, 26, -78, 61, 0, { rz: Math.PI / 2 });
      cyl(g, chrome(), 1.6, 8, -66, 54, 0);
      return g;
    }
  },
  {
    id: 'shower_walkin', name: 'Walk-in Shower', cat: 'bathroom', w: 120, d: 120, h: 210,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      box(g, tex('tile_bath', 1.2, 2), 120, 208, 6, 0, 0, -57);
      box(g, tex('tile_bath', 1.2, 2), 6, 208, 120, -57, 0, 0);
      box(g, tex('tile_white', 1.2, 1.2), 120, 5, 120, 0, 0, 0);
      box(g, glass(), 2, 200, 114, 58, 4, 0);
      box(g, glass(), 60, 200, 2, 28, 4, 58);
      cyl(g, chrome(), 1.8, 190, -50, 6, -50);
      box(g, chrome(), 20, 2, 20, -44, 196, -44, { r: 2 });
      return g;
    }
  },
  {
    id: 'vanity_double', name: 'Double Vanity', cat: 'bathroom', w: 160, d: 55, h: 200,
    palettes: WOODS, plan: { type: 'table' },
    build: (p) => {
      const g = G();
      box(g, wood(p.wood), 160, 80, 52, 0, 0, 0, { r: 2 });
      box(g, tex('countertop', 1.6, 0.55), 164, 6, 56, 0, 80, 0, { r: 2 });
      for (const s of [-1, 1]) {
        sphere(g, solid('#f4f2ee', 0.2), 22, s * 42, 86, 0, { sy: 0.3 });
        cyl(g, chrome(), 1.6, 18, s * 42, 86, -18);
        box(g, wood(p.wood), 58, 74, 3, s * 42, 108, -26.5);
        box(g, mirror(), 54, 70, 2, s * 42, 110, -25);
        handleBar(g, s * 42, 45, 27, 20);
      }
      return g;
    }
  },
  {
    id: 'towel_ladder', name: 'Towel Ladder', cat: 'bathroom', w: 50, d: 8, h: 170,
    palettes: WOODS, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood);
      for (const s of [-1, 1]) box(g, wd, 4, 170, 4, s * 23, 0, 0, { rx: 0.12 });
      for (let i = 0; i < 4; i++) box(g, wd, 46, 3, 3, 0, 40 + i * 36, -2 + i * 1.4);
      box(g, solid('#dfe8ea', 0.95), 44, 26, 3, 0, 96, 4, { r: 2 });
      box(g, solid('#c9d8da', 0.95), 44, 20, 3, 0, 56, 5.4, { r: 2 });
      return g;
    }
  },
  {
    id: 'washer_dryer', name: 'Washer + Dryer', cat: 'bathroom', w: 65, d: 65, h: 175,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      for (const y of [0, 88]) {
        box(g, solid('#e8e6e2', 0.4), 65, 86, 63, 0, y, 0, { r: 3 });
        cyl(g, solid('#26282a', 0.2), 22, 2, 0, y + 40, 30.6, { rx: Math.PI / 2, seg: 24 });
        cyl(g, glass(), 18, 2, 0, y + 40, 31.6, { rx: Math.PI / 2, seg: 24 });
        box(g, solid('#c8c6c2', 0.4), 60, 8, 1.5, 0, y + 74, 31);
      }
      return g;
    }
  },
  {
    id: 'mirror_led', name: 'LED Mirror', cat: 'bathroom', w: 90, d: 5, h: 70, mount: 'wall', elevation: 120,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      box(g, mirror(), 88, 66, 2, 0, 0, 0, { r: 2 });
      box(g, solid('#fff6e0', 0.4), 92, 2, 2.4, 0, -2, 0, { r: 1 });
      box(g, solid('#fff6e0', 0.4), 92, 2, 2.4, 0, 66, 0, { r: 1 });
      return g;
    },
    light: { y: 30, color: '#fff2d8', intensity: 0.5, distance: 200 }
  },
  // dining
  {
    id: 'table_farm', name: 'Farmhouse Table', cat: 'dining', w: 240, d: 100, h: 78,
    palettes: WOODS, plan: { type: 'table' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood);
      box(g, wd, 240, 7, 100, 0, 71, 0, { r: 1.5 });
      for (const s of [-1, 1]) {
        box(g, wd, 10, 62, 80, s * 105, 8, 0, { r: 2 });
        box(g, wd, 14, 8, 90, s * 105, 0, 0, { r: 2 });
      }
      box(g, wd, 200, 8, 10, 0, 24, 0);
      return g;
    }
  },
  {
    id: 'buffet', name: 'Buffet Sideboard', cat: 'dining', w: 180, d: 48, h: 85,
    palettes: WOODS, plan: { type: 'table' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood);
      box(g, wd, 180, 74, 46, 0, 6, 0, { r: 2 });
      for (let i = 0; i < 3; i++) { box(g, wd, 54, 64, 2, -60 + i * 60, 11, 23); handleBar(g, -60 + i * 60, 45, 25, 16); }
      legs4(g, wd, 170, 40, 6, 2.5, 6);
      sphere(g, solid('#b8c4c8', 0.3), 9, -50, 88, 0);
      box(g, wood('#3a5240'), 14, 18, 14, 55, 80, 0, { r: 2 });
      return g;
    }
  },
  {
    id: 'bar_cart', name: 'Bar Cart', cat: 'dining', w: 75, d: 45, h: 85,
    palettes: null, plan: { type: 'table' },
    build: () => {
      const g = G();
      const brass = metal('#c8a860', 0.3);
      for (const y of [26, 74]) box(g, glass(), 70, 2, 42, 0, y, 0);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, brass, 1.6, 80, sx * 33, 0, sz * 19);
      for (const sx of [-1, 1]) cyl(g, brass, 4.5, 2, sx * 33, 0, 0, { seg: 14, rx: Math.PI / 2 });
      for (let i = 0; i < 3; i++) cyl(g, solid(['#2a3a2a', '#3a2430', '#c8b088'][i], 0.25), 3.4, 22, -18 + i * 12, 76, -8, { seg: 10 });
      return g;
    }
  },
  {
    id: 'china_cabinet', name: 'China Cabinet', cat: 'dining', w: 110, d: 45, h: 195,
    palettes: WOODS, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood);
      box(g, wd, 110, 80, 44, 0, 0, 0, { r: 2 });
      box(g, wd, 104, 108, 36, 0, 82, -3, { r: 2 });
      box(g, glass(), 92, 96, 1.5, 0, 88, 15.6);
      for (let i = 0; i < 2; i++) box(g, wd, 96, 2, 30, 0, 118 + i * 32, -3);
      for (let i = 0; i < 4; i++) cyl(g, solid('#e8e6e0', 0.4), 6, 1.5, -36 + i * 24, 120, -3, { seg: 14 });
      handleBar(g, -20, 45, 23, 14); handleBar(g, 20, 45, 23, 14);
      return g;
    }
  },
  // office
  {
    id: 'desk_l', name: 'L-Desk + Monitors', cat: 'office', w: 180, d: 160, h: 120,
    palettes: WOODS, plan: { type: 'table' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood);
      box(g, wd, 180, 6, 70, 0, 70, -45, { r: 2 });
      box(g, wd, 70, 6, 90, -55, 70, 35, { r: 2 });
      legs4(g, metal('#6a6d70'), 170, 60, 70, 2.5, 6, true);
      box(g, metal('#6a6d70'), 6, 70, 6, -55, 0, 72);
      for (const dx of [-28, 28]) {
        box(g, solid('#17181a', 0.3), 50, 30, 2, dx, 92, -68, { rx: -0.06 });
        cyl(g, solid('#2a2c2e', 0.5), 4, 14, dx, 76, -70);
      }
      box(g, solid('#26282a', 0.4), 42, 1.6, 14, 0, 76.5, -30, { r: 1 });
      return g;
    }
  },
  {
    id: 'chair_exec', name: 'Executive Chair', cat: 'office', w: 65, d: 65, h: 118,
    palettes: null, plan: { type: 'chair' },
    build: () => {
      const g = G();
      const lth = solid('#2a2c30', 0.45);
      cyl(g, metal('#7a7d80'), 3, 26, 0, 8, 0);
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * Math.PI * 2;
        const leg = box(g, metal('#7a7d80'), 26, 3, 5, Math.cos(a) * 14, 4, Math.sin(a) * 14);
        leg.rotation.y = -a;
      }
      box(g, lth, 52, 10, 52, 0, 36, 0, { r: 8 });
      box(g, lth, 50, 62, 12, 0, 46, -24, { r: 9, rx: -0.08 });
      for (const s of [-1, 1]) box(g, lth, 8, 6, 34, s * 28, 58, 0, { r: 3 });
      return g;
    }
  },
  {
    id: 'bookwall', name: 'Bookcase Wall', cat: 'office', w: 200, d: 35, h: 220,
    palettes: WOODS, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood);
      box(g, wd, 200, 218, 8, 0, 0, -13);
      for (let c = 0; c < 4; c++) box(g, wd, 4, 218, 33, -98 + c * 65.3, 0, 0);
      for (let r2 = 0; r2 < 5; r2++) box(g, wd, 200, 4, 33, 0, 40 + r2 * 44, 0);
      let sd2 = 5;
      const rnd = () => { sd2 = (sd2 * 1664525 + 1013904223) >>> 0; return sd2 / 4294967296; };
      const cols = ['#7a5c40', '#4a5a6a', '#7c4434', '#3a5240', '#8a8058', '#5a4a6a'];
      for (let r2 = 0; r2 < 5; r2++) for (let c = 0; c < 3; c++) {
        let x = -88 + c * 65.3;
        const n = 4 + Math.floor(rnd() * 4);
        for (let b = 0; b < n; b++) {
          box(g, solid(cols[(b + c + r2) % 6], 0.85), 4 + rnd() * 3, 24 + rnd() * 10, 20, x, 4 + r2 * 44, 0);
          x += 6 + rnd() * 3;
        }
      }
      return g;
    }
  },
  {
    id: 'printer_stand', name: 'Printer Stand', cat: 'office', w: 60, d: 50, h: 75,
    palettes: WOODS, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      box(g, wood(p.wood), 60, 60, 48, 0, 0, 0, { r: 2 });
      box(g, solid('#dfdfdc', 0.4), 46, 22, 38, 0, 60, 0, { r: 3 });
      box(g, solid('#26282a', 0.4), 30, 2, 20, 0, 82, -4);
      return g;
    }
  },
  // decor & lighting
  {
    id: 'chandelier_crystal', name: 'Crystal Chandelier', cat: 'decor', w: 70, d: 70, h: 75, mount: 'ceiling',
    palettes: null, plan: { type: 'rugRound' },
    build: () => {
      const g = G();
      const brass = metal('#c8b070', 0.25);
      cyl(g, brass, 1.2, 40, 0, -40, 0);
      cyl(g, brass, 16, 3, 0, -44, 0, { seg: 18 });
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2;
        const x = Math.cos(a) * 26, z = Math.sin(a) * 26;
        shade(g, '#fff4da', 4, 3, 9, x, -60, z);
        for (let k = 0; k < 3; k++) sphere(g, glass(), 1.6, x * (0.75 - k * 0.14), -62 - k * 6, z * (0.75 - k * 0.14));
      }
      sphere(g, glass(), 7, 0, -72, 0);
      return g;
    },
    light: { y: -55, color: '#ffe8b8', intensity: 1.2, distance: 520 }
  },
  {
    id: 'lamp_arc', name: 'Arc Floor Lamp', cat: 'decor', w: 120, d: 40, h: 200,
    palettes: null, plan: { type: 'rugRound' },
    build: () => {
      const g = G();
      cyl(g, solid('#3a3c3e', 0.5), 14, 5, -45, 0, 0, { seg: 18 });
      cyl(g, metal('#9a9da0'), 1.8, 175, -52, 0, 0, { rz: -0.55 });
      shade(g, '#f0e8d8', 15, 9, 20, 40, 152, 0);
      return g;
    },
    light: { y: 160, color: '#ffe9c0', intensity: 0.9, distance: 420 }
  },
  {
    id: 'pendant_trio', name: 'Pendant Trio', cat: 'decor', w: 130, d: 25, h: 60, mount: 'ceiling',
    palettes: null, plan: { type: 'rug' },
    build: () => {
      const g = G();
      for (let i = 0; i < 3; i++) {
        const x = -45 + i * 45;
        cyl(g, metal('#3a3c3e'), 0.8, 34, x, -34, 0);
        shade(g, '#2f3134', 9, 4, 13, x, -48, 0);
      }
      return g;
    },
    light: { y: -45, color: '#ffdba0', intensity: 1.0, distance: 380 }
  },
  {
    id: 'sconce_pair', name: 'Wall Sconces', cat: 'decor', w: 100, d: 12, h: 30, mount: 'wall', elevation: 165,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      for (const s of [-1, 1]) {
        box(g, metal('#c8b070', 0.3), 3, 16, 3, s * 40, 0, -3);
        shade(g, '#f4ead2', 6, 4.5, 11, s * 40, 8, 2);
      }
      return g;
    },
    light: { y: 15, color: '#ffe9c0', intensity: 0.7, distance: 260 }
  },
  {
    id: 'plant_monstera', name: 'Monstera Plant', cat: 'decor', w: 90, d: 90, h: 150,
    palettes: null, plan: { type: 'plant' },
    build: () => {
      const g = G();
      cyl(g, solid('#b8825a', 0.85), 18, 26, 0, 0, 0, { rTop: 15, seg: 16 });
      cyl(g, solid('#4a3626', 0.95), 14, 3, 0, 26, 0, { seg: 16 });
      let sd3 = 17;
      const rnd = () => { sd3 = (sd3 * 1664525 + 1013904223) >>> 0; return sd3 / 4294967296; };
      const stemMat = solid('#456f30', 0.7);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + rnd() * 0.6;
        const dx = Math.cos(a), dz = Math.sin(a);
        const reach = 16 + rnd() * 12;                  // leaf center distance
        const top = 76 + rnd() * 48;                    // leaf height
        // arched petiole: rises from the soil, bows outward to the leaf
        segment(g, stemMat, [dx * 3, 27, dz * 3], [dx * reach * 0.55, top * 0.72, dz * reach * 0.55], 1.6, 1.3, 8);
        segment(g, stemMat, [dx * reach * 0.55, top * 0.72, dz * reach * 0.55], [dx * reach, top - 3, dz * reach], 1.3, 0.9, 8);
        // split leaf: two glossy side lobes + a drooping tip lobe, with the
        // gaps between them reading as the monstera's cuts
        const lg = G();
        lg.position.set(dx * reach, top, dz * reach);
        lg.rotation.y = -a;
        lg.rotation.z = -(0.25 + rnd() * 0.3);          // leaf plane tips outward
        g.add(lg);
        const lm = solid(rnd() < 0.5 ? '#2c5a2e' : '#38703a', 0.35);
        const L = 12 + rnd() * 5;                       // leaf size
        // fan of five finger-lobes: they merge near the petiole and diverge
        // toward the edge, leaving the monstera's characteristic cuts
        const sizes = [0.6, 0.85, 1, 0.85, 0.6];
        for (let k = -2; k <= 2; k++) {
          const ang = k * 0.42;
          const r = L * sizes[k + 2];
          const d = L * 0.35 + r * 0.85;
          const lobe = sphere(lg, lm, r, Math.cos(ang) * d, 0, Math.sin(ang) * d,
            { sy: 0.08, sx: 1.3, sz: 0.48, seg: 10 });
          lobe.rotation.y = -ang;
        }
      }
      return g;
    }
  },
  {
    id: 'gallery_wall', name: 'Gallery Wall', cat: 'decor', w: 160, d: 6, h: 110, mount: 'wall', elevation: 120,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      const frames = [
        [-55, 30, 34, 44], [-12, 42, 40, 28], [-14, 4, 44, 30], [34, 22, 30, 40], [62, 40, 22, 22], [62, 2, 22, 30]
      ];
      frames.forEach(([x, y, w2, h2], i) => {
        box(g, wood(i % 2 ? '#3a3735' : '#8a6a4a'), w2, h2, 2.5, x, y, 0);
        box(g, artMaterial(i + 40), w2 - 6, h2 - 6, 1.6, x, y + 3, 0.8);
      });
      return g;
    }
  },
  {
    id: 'mirror_leaning', name: 'Leaning Mirror', cat: 'decor', w: 70, d: 20, h: 180,
    palettes: WOODS, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      box(g, wood(p.wood), 70, 180, 4, 0, 0, 0, { r: 2, rx: -0.08 });
      box(g, mirror(), 60, 170, 1.6, 0, 4, 1.8, { rx: -0.08 });
      return g;
    }
  },
  {
    id: 'aquarium', name: 'Aquarium', cat: 'decor', w: 120, d: 45, h: 130,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      box(g, wood('#3a3735'), 120, 60, 44, 0, 0, 0, { r: 2 });
      box(g, glass(), 114, 60, 40, 0, 60, 0);
      const wt = box(g, water(), 110, 50, 36, 0, 62, 0);
      wt.castShadow = false;
      box(g, solid('#c8b088', 0.95), 108, 6, 34, 0, 62, 0);
      for (let i = 0; i < 3; i++) blob(g, '#2f5b30', '#4a8a3c', 6, -30 + i * 30, 72, 0, { seed: 30 + i, sy: 1.6, detail: 1 });
      for (let i = 0; i < 4; i++) sphere(g, solid(['#e8a03a', '#e86a3a', '#e8d03a', '#3a8ae8'][i], 0.5), 2.4, -35 + i * 24, 90 + (i % 2) * 12, 4, { sx: 1.6 });
      box(g, wood('#3a3735'), 120, 6, 44, 0, 120, 0, { r: 2 });
      return g;
    },
    light: { y: 115, color: '#a8d8ff', intensity: 0.6, distance: 240 }
  },
  // outdoor
  {
    id: 'grill_station', name: 'BBQ Grill', cat: 'outdoor', w: 140, d: 65, h: 120,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      const st = metal('#b8bbbe', 0.3);
      box(g, solid('#26282a', 0.4), 76, 42, 55, -20, 2, 0, { r: 3 });
      box(g, st, 80, 45, 58, -20, 45, 0, { r: 3 });
      sphere(g, st, 40, -20, 92, 0, { sy: 0.5, seg: 20 });
      handleBar(g, -20, 106, 20, 40);
      box(g, wood('#8a6a4a'), 44, 4, 56, 48, 88, 0, { r: 2 });
      box(g, st, 6, 86, 6, 48, 0, -20); box(g, st, 6, 86, 6, 48, 0, 20);
      for (let i = 0; i < 3; i++) cyl(g, solid('#17181a', 0.4), 3.4, 6, -44 + i * 22, 66, 29, { rx: Math.PI / 2 });
      return g;
    }
  },
  {
    id: 'fire_pit', name: 'Fire Pit', cat: 'outdoor', w: 110, d: 110, h: 45,
    palettes: null, plan: { type: 'tableRound' },
    build: () => {
      const g = G();
      cyl(g, tex('stone_veneer', 2.4, 0.4), 55, 40, 0, 0, 0, { seg: 24 });
      cyl(g, solid('#1d1d1d', 0.9), 46, 4, 0, 40, 0, { seg: 24 });
      let sd4 = 3;
      const rnd = () => { sd4 = (sd4 * 1664525 + 1013904223) >>> 0; return sd4 / 4294967296; };
      for (let i = 0; i < 7; i++) {
        const lg = cyl(g, wood('#4a3626'), 3.4, 32, (rnd() - 0.5) * 26, 41, (rnd() - 0.5) * 26, { rx: Math.PI / 2 });
        lg.rotation.y = rnd() * Math.PI;
      }
      // low licking flames (stay near the declared 45cm profile)
      for (let i = 0; i < 4; i++) {
        const f = cyl(g, glow('#ff8a2a', 1.6, 0.6, '#ff6a1a'), 7 - i, 10 + i * 3.5, (rnd() - 0.5) * 14, 43, (rnd() - 0.5) * 14, { rTop: 0.5, seg: 8 });
        f.castShadow = false;
      }
      return g;
    },
    light: { y: 60, color: '#ff8a3a', intensity: 1.3, distance: 420 }
  },
  {
    id: 'outdoor_sofa', name: 'Outdoor Lounge Set', cat: 'outdoor', w: 260, d: 220, h: 70,
    palettes: null, plan: { type: 'sofa', seats: 4 },
    build: () => {
      const g = G();
      const rat = wood('#6a5a44', 0.85);
      const cush = solid('#dfd8c8', 0.9);
      box(g, rat, 250, 30, 80, 0, 0, -65, { r: 4 });
      box(g, rat, 80, 30, 120, -85, 0, 40, { r: 4 });
      box(g, cush, 240, 12, 70, 0, 30, -65, { r: 5 });
      box(g, cush, 70, 12, 110, -85, 30, 40, { r: 5 });
      box(g, rat, 250, 28, 12, 0, 30, -102, { r: 4 });
      for (let i = 0; i < 3; i++) box(g, cush, 70, 34, 10, -80 + i * 80, 40, -96, { r: 5, rx: -0.1 });
      box(g, rat, 90, 32, 90, 55, 0, 45, { r: 4 });
      box(g, glass(), 84, 2, 84, 55, 32, 45);
      return g;
    }
  },
  {
    id: 'hammock', name: 'Hammock', cat: 'outdoor', w: 300, d: 110, h: 115,
    palettes: null, plan: { type: 'rug' },
    build: () => {
      const g = G();
      const st = metal('#4c4f53', 0.45);
      const cloth = tex('fabric_beige', 1.5, 1);
      const rope = solid('#cfc9ba', 0.85);
      const wdBar = wood('#8a6a4a', 0.6);
      // steel stand: ground beam, splayed feet, arched arms rising to hooks
      box(g, st, 236, 7, 9, 0, 0, 0, { r: 3 });
      for (const s of [-1, 1]) {
        box(g, st, 8, 6, 60, s * 108, 0, 0, { r: 2 });                  // cross feet
        strut(g, st, s * 116, 4, 0, s * 138, 68, 0, 4, { rTop: 3.4 });  // arm lower
        strut(g, st, s * 138, 68, 0, s * 128, 106, 0, 3.4, { rTop: 3 }); // arm upper (arches in)
        sphere(g, st, 4, s * 128, 108, 0);                              // hook boss
      }
      // catenary-sagging bed: strip chain following the sag, wider amidships
      const HX = 128, HY = 108;   // hook points
      const BX = 78;              // spreader-bar x
      const sagY = (t) => 62 + 26 * (t * t);   // t: 0 center -> 1 at spreader
      const N = 7;
      for (let i = 0; i < N; i++) {
        const t0 = (i / N) * 2 - 1, t1 = ((i + 1) / N) * 2 - 1;   // -1..1
        const x0 = t0 * BX, x1 = t1 * BX;
        const y0 = sagY(Math.abs(t0)), y1 = sagY(Math.abs(t1));
        const wZ = 96 - Math.max(Math.abs(t0), Math.abs(t1)) * 26; // taper toward ends
        const len = Math.hypot(x1 - x0, y1 - y0) + 1.5;
        const strip = box(g, cloth, len, 2.2, wZ, (x0 + x1) / 2, (y0 + y1) / 2 - 1.1, 0, { r: 1 });
        strip.rotation.z = Math.atan2(y1 - y0, x1 - x0);
      }
      for (const s of [-1, 1]) {
        cyl(g, wdBar, 2.6, 92, s * BX, sagY(1), 0, { rx: Math.PI / 2 });  // spreader bar
        // taut ropes fanning from the bed edge through the spreader to the hook
        for (const rz of [-40, -14, 14, 40]) {
          strut(g, rope, s * BX, sagY(1), rz, s * HX, HY, 0, 0.8);
        }
      }
      return g;
    }
  },
  {
    id: 'trampoline', name: 'Trampoline', cat: 'outdoor', w: 300, d: 300, h: 210,
    palettes: null, plan: { type: 'rings' },
    build: () => {
      const g = G();
      const R = 148;              // frame radius
      const PAD = 82;             // pad/frame height
      const NET_TOP = 200;        // top of the enclosure
      // splayed galvanised legs (W-frame feet)
      for (let i = 0; i < 4; i++) {
        const a = (i + 0.5) / 4 * Math.PI * 2;
        strut(g, metal('#8a8f95', 0.4), Math.cos(a) * R, PAD - 4, Math.sin(a) * R,
          Math.cos(a) * (R + 22), 0, Math.sin(a) * (R + 22), 3);
        strut(g, metal('#8a8f95', 0.4), Math.cos(a) * R, PAD - 4, Math.sin(a) * R,
          Math.cos(a) * (R - 30), 0, Math.sin(a) * (R - 30), 3);
      }
      // spring frame band + blue safety pad + black jumping mat
      cyl(g, metal('#9a9ea4', 0.4), R, 8, 0, PAD - 8, 0, { open: true, seg: 40 });
      cyl(g, solid('#3a6ea8', 0.82), R, 8, 0, PAD, 0, { seg: 40 });
      cyl(g, solid('#15181c', 0.92), R - 15, 5, 0, PAD + 5, 0, { seg: 40 });
      // enclosure poles with foam sleeves + padded top ring + net mesh
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2;
        const px = Math.cos(a) * (R - 3), pz = Math.sin(a) * (R - 3);
        cyl(g, metal('#7a7d80', 0.4), 2.6, NET_TOP - PAD, px, PAD, pz);
        cyl(g, solid('#2f6ea3', 0.6), 4.2, 64, px, PAD + 6, pz);   // foam sleeve
      }
      cyl(g, solid('#2f6ea3', 0.7), R - 1, 8, 0, NET_TOP - 4, 0, { open: true, seg: 40 });
      cyl(g, netMaterial(), R - 2, NET_TOP - PAD - 10, 0, PAD + 6, 0, { open: true, seg: 44 });
      return g;
    }
  },
  {
    id: 'playhouse', name: 'Kids Playhouse', cat: 'outdoor', w: 180, d: 160, h: 190,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      box(g, tex('siding_butter', 1.6, 1), 160, 120, 140, 0, 0, 0, { r: 1 });
      prism(g, tex('shingle_red', 1, 1), 176, 62, 156, 0, 118, 0, tex('siding_white', 1, 1));
      box(g, wood('#6a4f36'), 40, 74, 4, -30, 0, 70.5);
      box(g, solid('#e8e6e0', 0.7), 40, 40, 3, 40, 47, 70.6, { r: 1 });
      box(g, solid('#bcd8e2', 0.2), 34, 34, 2, 40, 50, 71);
      box(g, solid('#bcd8e2', 0.2), 30, 30, 2, 0, 50, -70.5);
      return g;
    }
  },
  {
    id: 'greenhouse', name: 'Greenhouse', cat: 'outdoor', w: 240, d: 180, h: 210,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      const fr = metal('#4a5a4a', 0.5);
      box(g, fr, 240, 4, 180, 0, 0, 0);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, fr, 5, 150, 5, sx * 116, 0, sz * 86);
      for (const sz of [-1, 1]) box(g, glass(), 230, 146, 2, 0, 2, sz * 87);
      for (const sx of [-1, 1]) box(g, glass(), 2, 146, 172, sx * 117, 2, 0);
      prism(g, glass(), 244, 60, 186, 0, 150, 0, glass());
      box(g, fr, 240, 4, 4, 0, 148, -88); box(g, fr, 240, 4, 4, 0, 148, 88);
      box(g, wood('#8a6a4a'), 200, 8, 40, 0, 76, -55);
      for (let i = 0; i < 4; i++) blob(g, '#375c22', '#6d9c42', 12, -70 + i * 46, 84, -55, { seed: 70 + i, detail: 1 });
      return g;
    }
  },
  {
    id: 'mailbox', name: 'Mailbox', cat: 'outdoor', w: 30, d: 50, h: 115,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      box(g, wood('#5a4632'), 8, 100, 8, 0, 0, 0);
      box(g, metal('#3a3c3e', 0.5), 24, 20, 44, 0, 100, 0, { r: 6 });
      box(g, solid('#c43a30', 0.6), 2.5, 12, 3, 14, 106, 12);
      return g;
    }
  },
  {
    id: 'garden_arch', name: 'Garden Arbor', cat: 'outdoor', w: 140, d: 50, h: 230,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      const wd = wood('#e8e4dc', 0.75);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, wd, 6, 200, 6, sx * 62, 0, sz * 20);
      for (let i = 0; i < 6; i++) box(g, wd, 8, 4, 56, -60 + i * 24, 202 + Math.sin(i / 5 * Math.PI) * 16, 0);
      for (const sx of [-1, 1]) {
        box(g, wd, 4, 4, 44, sx * 62, 90, 0); box(g, wd, 4, 4, 44, sx * 62, 140, 0);
        blob(g, '#375c22', '#679a40', 22, sx * 62, 120, 0, { seed: 81 + sx, sy: 2.4, detail: 1 });
      }
      blob(g, '#3f6b2e', '#7aa848', 26, 0, 212, 0, { seed: 85, sy: 0.7 });
      return g;
    }
  },
  {
    id: 'tree_palm', name: 'Palm Tree', cat: 'outdoor', w: 240, d: 240, h: 420,
    palettes: null, plan: { type: 'plant' },
    build: () => {
      const g = G();
      // gently curving trunk built from ringed, tapering segments — the ring
      // ledges come from alternating radii and tones stacking down the curve
      const px = (t) => -16 + 42 * Math.pow(t, 1.7);
      const py = (t) => 356 * t;
      for (let i = 0; i < 10; i++) {
        const t0 = i / 10, t1 = (i + 1) / 10;
        const r0 = 12.5 - t0 * 5 + (i % 2 ? 1.1 : 0);
        const r1 = 12 - t1 * 5;
        segment(g, solid(i % 2 ? '#8a7050' : '#77624a', 0.92),
          [px(t0), py(t0), 0], [px(t1), py(t1), 0], r0, r1, 10);
      }
      const CX = px(1), CY = py(1) + 2;      // crown center
      // fibrous collar where the fronds sheath the trunk top
      cyl(g, solid('#6d5238', 0.95), 10.5, 14, CX, CY - 12, 0, { rTop: 7 });
      sphere(g, solid('#5f4a34', 0.9), 8, CX, CY - 2, 0, { sy: 1.1 });
      // 10 fronds, TRUE pinnate construction: an arched tapering rachis with
      // individual leaflets swept forward and drooping harder toward the tip.
      // (The viewer merges same-material meshes, so ~19 primitives per frond
      // still costs ~2 draw calls for the whole crown.)
      const rib = solid('#5a7a34', 0.8);
      const leafTones = [solid('#2f6b31', 0.72), solid('#3c7d33', 0.72), solid('#356f2c', 0.72)];
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + 0.35 + (i % 2) * 0.11;
        const dx = Math.cos(a), dz = Math.sin(a);
        const pxr = -dz, pzr = dx;                       // horizontal perpendicular
        const v = 6 + (i % 3) * 8 + (i % 2) * 5;         // per-frond droop
        const R = (t) => 6 + 106 * t;                    // radial reach along the frond
        const Y = (t) => CY + 6 + 30 * t - (36 + v) * t * t; // rises, then bows down
        const leaf = leafTones[i % 3];
        // rachis follows the same arc in 3 tapering pieces
        let prev = [CX + dx * R(0), Y(0), dz * R(0)];
        for (const t of [0.35, 0.7, 1]) {
          const nxt = [CX + dx * R(t), Y(t), dz * R(t)];
          segment(g, rib, prev, nxt, 2.4 * (1 - t * 0.75) + 0.4, 2.4 * (1 - t * 0.8) + 0.25, 7);
          prev = nxt;
        }
        // leaflet pairs: long near the base, short at the tip, drooping more
        // as they go out; swept slightly forward along the rachis
        for (let k = 0; k < 10; k++) {
          const t = 0.1 + (k / 9) * 0.85;
          const bx = CX + dx * R(t), by = Y(t), bz = dz * R(t);
          const len = 40 * (1 - 0.52 * t) + 6;
          const droop = len * (0.28 + 0.55 * t);
          for (const sgn of [1, -1]) {
            const hx = dx * 0.42 + pxr * sgn * 0.9, hz = dz * 0.42 + pzr * sgn * 0.9;
            const hl = Math.hypot(hx, hz);
            segment(g, leaf,
              [bx, by + 0.5, bz],
              [bx + (hx / hl) * len * 0.95, by - droop, bz + (hz / hl) * len * 0.95],
              1.8, 0.15, 5);
          }
        }
        // tip blade finishes the frond
        segment(g, leaf, prev, [prev[0] + dx * 16, prev[1] - 10, prev[2] + dz * 16], 0.8, 0.1, 5);
      }
      // a couple of dead fronds hanging under the crown (real palms keep a skirt)
      for (const [aa, dl] of [[1.1, 34], [3.9, 28]]) {
        const ddx = Math.cos(aa), ddz = Math.sin(aa);
        segment(g, solid('#8a7248', 0.95), [CX + ddx * 8, CY - 8, ddz * 8],
          [CX + ddx * 26, CY - 8 - dl, ddz * 26], 1.6, 0.3, 6);
      }
      // coconut cluster tucked under the crown
      const nut = solid('#6a4f36', 0.85);
      sphere(g, nut, 7.5, CX - 9, CY - 10, 5);
      sphere(g, nut, 6.5, CX + 8, CY - 12, -7);
      sphere(g, nut, 6, CX + 1, CY - 14, 9);
      return g;
    }
  },
  {
    id: 'tree_maple_red', name: 'Red Maple', cat: 'outdoor', w: 240, d: 240, h: 400,
    palettes: null, plan: { type: 'plant' },
    build: () => {
      const g = G();
      const bark = solid('#4a3a30', 0.95);
      cyl(g, bark, 13, 160, 0, 0, 0, { rTop: 8 });
      cyl(g, bark, 6, 90, 0, 115, 0, { rz: 0.5 });
      cyl(g, bark, 5, 85, 0, 125, 0, { rz: -0.5 });
      foliage(g, '#7a2a20', '#c8542e', 0, 280, 0, 100, 14, 55);
      blob(g, '#6e2418', '#b8442a', 42, 85, 205, 25, { seed: 96, sy: 0.85 });
      return g;
    }
  },
  {
    id: 'boulder_set', name: 'Landscape Boulders', cat: 'outdoor', w: 160, d: 110, h: 55,
    palettes: null, plan: { type: 'hedge' },
    build: () => {
      const g = G();
      blob(g, '#6e6a60', '#a8a296', 34, -40, 20, 0, { seed: 11, sy: 0.72 });
      blob(g, '#75705f', '#b0a898', 24, 32, 14, 18, { seed: 12, sy: 0.68 });
      blob(g, '#66625a', '#9a948a', 16, 55, 10, -22, { seed: 13, sy: 0.7 });
      blob(g, '#375c22', '#679a40', 12, -8, 8, 30, { seed: 14, sy: 0.9 });
      return g;
    }
  },
  // structure
  {
    id: 'porch_column', name: 'Porch Column', cat: 'structure', w: 35, d: 35, h: 280,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      const wh = solid('#eceae4', 0.7);
      box(g, wh, 34, 10, 34, 0, 0, 0, { r: 1 });
      cyl(g, wh, 11, 258, 0, 10, 0, { rTop: 9.5, seg: 20 });
      box(g, wh, 30, 6, 30, 0, 268, 0, { r: 1 });
      box(g, wh, 34, 6, 34, 0, 274, 0, { r: 1 });
      return g;
    }
  },
  {
    id: 'glass_rail', name: 'Glass Railing', cat: 'structure', w: 200, d: 10, h: 105,
    palettes: null, plan: { type: 'fence' },
    build: () => {
      const g = G();
      const st = metal('#9a9da0', 0.3);
      for (let i = 0; i < 4; i++) box(g, st, 4, 100, 4, -95 + i * 63.3, 0, 0);
      box(g, st, 200, 5, 6, 0, 100, 0, { r: 2 });
      box(g, glass(), 192, 88, 1.2, 0, 8, 0);
      return g;
    }
  },
  {
    id: 'carport', name: 'Carport', cat: 'structure', w: 360, d: 560, h: 260,
    palettes: null, plan: { type: 'pergola' },
    build: () => {
      const g = G();
      const st = metal('#5a5d60', 0.5);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, st, 10, 235, 10, sx * 170, 0, sz * 265);
      for (const sz of [-1, 1]) box(g, st, 356, 10, 12, 0, 232, sz * 265);
      box(g, tex('corrugated_gray', 4, 5), 360, 6, 560, 0, 244, 0, { rx: 0.05 });
      return g;
    }
  },
  {
    id: 'balcony_planter', name: 'Rail Planter', cat: 'structure', w: 90, d: 25, h: 35,
    palettes: null, plan: { type: 'hedge' },
    build: () => {
      const g = G();
      box(g, solid('#4a4438', 0.8), 88, 22, 24, 0, 0, 0, { r: 2 });
      for (let i = 0; i < 4; i++) blob(g, '#375c22', '#6d9c42', 11, -33 + i * 22, 24, 0, { seed: 41 + i, detail: 1 });
      for (let i = 0; i < 3; i++) sphere(g, solid(['#c43a50', '#e8b03a', '#c46ad0'][i], 0.7), 3, -22 + i * 22, 34, 6);
      return g;
    }
  }
];

// v2.22.0 content packs: 100+ modern/fun/outdoor assets, authored in
// src/catalog/packs/* and merged in here so ITEM_MAP and the catalog pick
// them up like any built-in item.
ITEMS.push(...EXTRA_ITEMS);

// Sweep the original broad "Outdoor" bucket into the finer categories so pools,
// water, waterfront, patio and yard items each get their own tab. Keyed on the
// 2D plan symbol; anything unmatched stays under "Outdoor".
const OUTDOOR_RECAT = {
  pool: 'pools', hottub: 'pools',
  pond: 'water',
  boat: 'waterfront', dock: 'waterfront',
  patioset: 'patio', grill: 'patio', umbrella: 'patio', lounger: 'patio', slab: 'patio',
  pergola: 'yard', fence: 'yard', hedge: 'yard', flag: 'yard', rock: 'yard',
  lampRound: 'yard', plant: 'yard', swingset: 'yard', hoop: 'yard', car: 'yard'
};
for (const it of ITEMS) {
  if (it.cat !== 'outdoor') continue;
  const nc = OUTDOOR_RECAT[it.plan?.type];
  if (nc) it.cat = nc;
}

/** Shared sunflower builder: stalk with leaves, seed disk, two petal rings. */
function buildSunflower(g, x, z, h, headR, seed) {
  let s = seed * 7919 + 13;
  const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const lean = (rand() - 0.5) * 0.14;
  const stalk = cyl(g, solid('#4e7a2e', 0.9), headR * 0.16, h, x, 0, z, { rTop: headR * 0.1 });
  stalk.rotation.z = lean;
  // large heart-shaped leaves alternating up the stalk
  for (let i = 0; i < 4; i++) {
    const ly = h * (0.22 + i * 0.16);
    const side = i % 2 ? 1 : -1;
    const leaf = sphere(g, solid(i % 2 ? '#47732a' : '#528434', 0.9),
      headR * 0.85, x + side * headR * 0.75 + ly * lean, ly, z + (rand() - 0.5) * 6, { seg: 10 });
    leaf.scale.set(1.15, 0.16, 0.7);
    leaf.rotation.z = side * 0.5;
    leaf.rotation.y = (rand() - 0.5) * 0.8;
  }
  // flower head faces slightly forward and toward the sun
  const head = G();
  head.position.set(x + h * lean * 0.8, h, z);
  head.rotation.x = 0.42;
  head.rotation.y = (rand() - 0.5) * 0.5;
  g.add(head);
  const petalA = solid('#f4b81e', 0.6);
  const petalB = solid('#e29b12', 0.65);
  // one ring of bold petals over a scalloped back-whorl disc (reads as the
  // offset second ring at a fraction of the meshes)
  const backDisk = cyl(head, petalB, headR * 1.02, headR * 0.08, 0, 0, 0, { seg: 14 });
  backDisk.rotation.x = Math.PI / 2;
  backDisk.position.z = -headR * 0.04;
  const petals = Math.min(16, Math.max(11, Math.round(headR * 0.55)));
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2;
    const pm = sphere(head, petalA, headR * 0.38,
      Math.cos(a) * headR * 1.08, Math.sin(a) * headR * 1.08, 0.5, { seg: 8 });
    pm.scale.set(1.65, 0.52, 0.12);
    pm.rotation.z = a;
  }
  // seed disk: dark center with a lighter rim
  const disk = cyl(head, solid('#4a331c', 0.95), headR * 0.72, headR * 0.16, 0, 0, 0, { seg: 24 });
  disk.rotation.x = Math.PI / 2;
  const core = cyl(head, solid('#2e1f10', 0.98), headR * 0.45, headR * 0.18, 0, 0, 0, { seg: 20 });
  core.rotation.x = Math.PI / 2;
  // green sepals behind the head
  const sepal = cyl(head, solid('#3f6b28', 0.9), headR * 0.8, headR * 0.1, 0, 0, 0, { seg: 12 });
  sepal.rotation.x = Math.PI / 2;
  sepal.position.z = -headR * 0.12;
}

export const ITEM_MAP = new Map(ITEMS.map(i => [i.id, i]));

export function paletteFor(item, def) {
  const d = def || ITEM_MAP.get(item.defId);
  if (!d || !d.palettes) return {};
  return d.palettes[Math.min(item.palette ?? 0, d.palettes.length - 1)] || d.palettes[0];
}
