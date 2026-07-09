// Bedroom pack — premium beds, wardrobes, vanities, kids' furniture.
// All dimensions in cm; origin centered on floor; +Z is the item's front.
// Soft goods lean on cushion() (inflated boxes) and drape() (hanging cloth);
// turned parts use lathe(); everything else stays a few dozen primitives.
import {
  G, box, cyl, sphere, strut, sweep, lathe, cushion, drape, torus,
  blob, shade, knob, solid, glow, wood, metal, tex, mirror, artMaterial
} from '../builders.js';

// ---------------------------------------------------------------- palettes
const BEDFAB = [
  { name: 'Oat Linen', chip: '#c4b49a', fabric: 'fabric_beige', duvet: '#e9e4d8', throw: '#8d7a63', accent: '#c8b18c', wood: '#5f4632' },
  { name: 'Dove Grey', chip: '#8e8e92', fabric: 'fabric_gray', duvet: '#dfdfdc', throw: '#5a6e8c', accent: '#b9c2cc', wood: '#3a3735' },
  { name: 'Slate Blue', chip: '#5a6e8c', fabric: 'fabric_blue', duvet: '#dde2ea', throw: '#39506b', accent: '#8fa3bd', wood: '#4a4038' },
  { name: 'Sage', chip: '#6d7d64', fabric: 'fabric_green', duvet: '#e4e8dc', throw: '#5d7a4c', accent: '#a8b598', wood: '#5f4632' }
];
const WOODS = [
  { name: 'Walnut', chip: '#5f4632', wood: '#5f4632', tex: 'real_walnut_strip' },
  { name: 'Oak', chip: '#a07a4f', wood: '#a07a4f', tex: 'real_strip_oak' },
  { name: 'Caramel', chip: '#8a5a34', wood: '#8a5a34', tex: 'real_caramel_plank' },
  { name: 'Ivory', chip: '#e8e4dc', wood: '#e8e4dc', tex: null }
];
const PAINTS = [
  { name: 'Cloud White', chip: '#f0ece4', wood: '#f0ece4', a: '#d9b3ac', b: '#8ba7bd' },
  { name: 'Sage', chip: '#9fb193', wood: '#9fb193', a: '#f0ece4', b: '#d9c48a' },
  { name: 'Dusty Blue', chip: '#8ba7bd', wood: '#8ba7bd', a: '#f0ece4', b: '#d9b3ac' },
  { name: 'Natural Pine', chip: '#c8a878', wood: '#c8a878', a: '#9fb193', b: '#d9b3ac' }
];
const dark = '#33312e';
const brass = () => metal('#b08d57', 0.35);
const carc = (p, rx = 1, ry = 1) => p.tex ? tex(p.tex, rx, ry) : wood(p.wood, 0.5);

// bar pull hardware: rod + two standoffs, mounted on a +z face
function barPull(g, m, x, y, z, len = 13) {
  cyl(g, m, 0.7, len, x, y, z + 1.7, { rz: Math.PI / 2, seg: 10 });
  for (const s of [-1, 1]) cyl(g, m, 0.55, 2.2, x + s * (len / 2 - 1), y, z + 0.6, { rx: Math.PI / 2, seg: 8 });
}
// slim tapered round leg
function tleg(g, mat, x, z, h, r = 3) { cyl(g, mat, r, h, x, 0, z, { rTop: r * 0.6 }); }

// Layered bedding: fitted-sheet mattress, duvet, fold-back cuff, pillows,
// accent pillow, folded throw (optionally cascading over the side edge).
function makeBed(g, mw, md, topY, o = {}) {
  const puff = o.puff ?? 1, zC = o.zC ?? 0;
  const mattH = 17 * puff, mTop = topY + mattH;
  cushion(g, solid('#f3f0e8', 0.92), mw, mattH, md, 0, topY, zC, { puff: 0.07, dimple: 0.04 });
  const duv = o.duvet || solid('#e9e4d8', 0.85);
  const zHead = zC - md / 2 + Math.min(md * 0.3, 58);
  const zFoot = zC + md / 2 - 3;
  cushion(g, duv, mw + 10, 10 * puff, zFoot - zHead, 0, mTop - 4 * puff, (zHead + zFoot) / 2, { puff: 0.13, dimple: 0.18 });
  cushion(g, solid('#f8f5ee', 0.9), mw + 11, 5.5 * puff, 22, 0, mTop + 2.4 * puff, zHead + 7, { puff: 0.2, dimple: 0.06 });
  const pil = solid('#fbfaf6', 0.92);
  const n = o.pillows ?? 2;
  if (n >= 2) {
    for (const s of [-1, 1])
      cushion(g, pil, mw * 0.42, 15 * puff, 34, s * mw * 0.24, mTop - 1, zC - md / 2 + 20, { puff: 0.3, dimple: 0.06, rx: -0.32, ry: s * 0.05 });
    if (n >= 4)
      for (const s of [-1, 1])
        cushion(g, pil, mw * 0.38, 13 * puff, 28, s * mw * 0.22, mTop + 1, zC - md / 2 + 33, { puff: 0.32, dimple: 0.05, rx: -0.38, ry: -s * 0.08 });
  } else {
    cushion(g, pil, mw * 0.56, 14 * puff, 32, 0, mTop - 1, zC - md / 2 + 19, { puff: 0.3, dimple: 0.06, rx: -0.3 });
  }
  if (o.accent)
    cushion(g, solid(o.accent, 0.85), mw * 0.26, 11 * puff, 22, mw * 0.05, mTop + 2, zC - md / 2 + (n >= 4 ? 47 : 39), { puff: 0.35, dimple: 0.04, rx: -0.24, ry: -0.35 });
  if (o.throwHex) {
    const tm = solid(o.throwHex, 0.85);
    cushion(g, tm, mw * 0.8, 5.5 * puff, 42, -mw * 0.04, mTop + 4.2 * puff, zFoot - 27, { puff: 0.2, dimple: 0.28, ry: 0.04 });
    if (o.drapeThrow) {
      drape(g, tm, 42, o.drapeThrow, mw / 2 + 5, mTop + 7, zFoot - 27, { sag: 1.5, wave: 1.8, folds: 2, seed: 4, ry: Math.PI / 2 });
      drape(g, tm, 42, o.drapeThrow, mw / 2 + 4.2, mTop + 7, zFoot - 27, { sag: 1.5, wave: 1.8, folds: 2, seed: 4, ry: -Math.PI / 2 });
    }
  }
}

export const BEDROOM2_ITEMS = [
  // ---------------------------------------------------------------- upholstered king
  {
    id: 'bed2_king_uph', name: 'Upholstered King Bed', cat: 'bedroom', w: 200, d: 226, h: 130,
    palettes: BEDFAB, plan: { type: 'bed', pillows: 2 },
    build: (p) => {
      const g = G();
      const f = tex(p.fabric, 2, 2);
      // recessed plinth + upholstered base rail
      box(g, solid(dark, 0.85), 188, 12, 198, 0, 0, 6, { r: 2 });
      box(g, f, 198, 24, 212, 0, 12, 6, { r: 6 });
      // tall channel-tufted headboard (channels stay inside the frame)
      box(g, f, 200, 124, 12, 0, 4, -106, { r: 5 });
      for (let i = 0; i < 6; i++)
        cushion(g, f, 30.5, 100, 6, -82.5 + i * 33, 14, -99.2, { puff: 0.12, dimple: 0.02 });
      // low turned wood feet
      for (const [x, z] of [[-88, -90], [88, -90], [-88, 96], [88, 96]]) tleg(g, wood(p.wood, 0.4), x, z, 10, 3.4);
      // layered bedding: fitted sheet, duvet + cuff, 4 pillows, cascading throw
      makeBed(g, 190, 198, 36, {
        pillows: 4, duvet: solid(p.duvet, 0.85), accent: p.accent,
        throwHex: p.throw, drapeThrow: 44, zC: 6
      });
      return g;
    }
  },
  // ---------------------------------------------------------------- canopy four-poster
  {
    id: 'bed2_four_poster', name: 'Canopy Four-Poster Bed', cat: 'bedroom', w: 192, d: 218, h: 232,
    palettes: WOODS, plan: { type: 'bed', pillows: 2 },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.5);
      const cloth = solid('#efe9dc', 0.9);
      box(g, wd, 176, 30, 202, 0, 2, 0, { r: 2.5 });                 // base
      box(g, wd, 176, 58, 8, 0, 32, -97, { r: 3 });                  // headboard
      // turned posts with finials at the four corners
      const prof = [[5, 0], [5.6, 2], [4, 5], [3.6, 9], [4.4, 90], [3.2, 96], [3.4, 190],
        [4.6, 196], [2.6, 200], [4, 205], [2.8, 209], [1.4, 213]];
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        lathe(g, wd, prof, sx * 89, 0, sz * 102, { seg: 20 });
        sphere(g, wd, 2.6, sx * 89, 215, sz * 102, { seg: 12 });
      }
      // canopy frame rails
      for (const sz of [-1, 1]) box(g, wd, 184, 5, 6, 0, 204, sz * 102);
      for (const sx of [-1, 1]) box(g, wd, 6, 5, 204, sx * 89, 204, 0);
      // linen valance skirting all four rails (outward faces)
      drape(g, cloth, 176, 30, 0, 203, 105.5, { sag: 2.5, wave: 3, folds: 6, seed: 2 });
      drape(g, cloth, 176, 30, 0, 203, -105.5, { sag: 2.5, wave: 3, folds: 6, seed: 5, ry: Math.PI });
      drape(g, cloth, 196, 30, 92.5, 203, 0, { sag: 2.5, wave: 3, folds: 7, seed: 3, ry: -Math.PI / 2 });
      drape(g, cloth, 196, 30, -92.5, 203, 0, { sag: 2.5, wave: 3, folds: 7, seed: 7, ry: Math.PI / 2 });
      // full-height curtains gathered at the two head corners
      for (const sx of [-1, 1]) {
        drape(g, cloth, 40, 196, sx * 80, 202, -94, { sag: 4, wave: 5, folds: 4, seed: sx * 3, ry: sx * -0.78 });
        drape(g, cloth, 40, 196, sx * 79.4, 202, -93.4, { sag: 4, wave: 5, folds: 4, seed: sx * 3, ry: sx * -0.78 + Math.PI });
      }
      makeBed(g, 168, 194, 32, { pillows: 4, duvet: solid('#e9e4d8', 0.85), accent: '#c8b18c', throwHex: '#8d7a63' });
      return g;
    }
  },
  // ---------------------------------------------------------------- low platform bed
  {
    id: 'bed2_platform', name: 'Low Platform Bed', cat: 'bedroom', w: 180, d: 220, h: 75,
    palettes: [
      { name: 'Walnut', chip: '#5f4632', wood: '#5f4632', tex: 'real_walnut_strip', glow: null },
      { name: 'Oak', chip: '#a07a4f', wood: '#a07a4f', tex: 'real_strip_oak', glow: null },
      { name: 'Ebony Glow', chip: '#3a3735', wood: '#3a3735', tex: 'real_wenge', glow: '#ffb45c' }
    ],
    plan: { type: 'bed', pillows: 2 },
    build: (p) => {
      const g = G();
      const t = carc(p, 2, 2);
      // recessed plinth → the deck reads as floating
      box(g, solid('#26241f', 0.9), 126, 9, 164, 0, 0, 4, { r: 1.5 });
      if (p.glow) box(g, glow(p.glow, 1.6), 176, 2.2, 214, 0, 8.8, 4);
      box(g, t, 180, 13, 220, 0, 11, 4, { r: 2.5 });                 // platform deck
      box(g, t, 180, 50, 9, 0, 24, -109.5, { r: 2 });                // low wide headboard
      // bedside ledge styling: book + espresso cup on the exposed foot ledge
      box(g, solid('#39506b', 0.7), 20, 2.6, 14, -62, 24, 104, { r: 0.5, ry: 0.2 });
      cyl(g, solid('#e8e2d6', 0.4), 3.2, 3.6, 64, 24, 105, { rTop: 2.6, seg: 14 });
      makeBed(g, 156, 196, 24, {
        pillows: 4, puff: 0.92, duvet: solid('#e6e1d5', 0.85),
        accent: '#b9a37e', throwHex: '#6b5d49', drapeThrow: 26, zC: -4
      });
      return g;
    }
  },
  // ---------------------------------------------------------------- bunk bed
  {
    id: 'bed2_bunk', name: 'Bunk Bed + Ladder', cat: 'bedroom', w: 110, d: 212, h: 178,
    palettes: PAINTS, plan: { type: 'bed', pillows: 1 },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.5);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, wd, 7, 172, 7, sx * 50, 0, sz * 99); // posts
      for (const y of [16, 104]) {
        box(g, wd, 104, 12, 200, 0, y, 0, { r: 2 });                 // decks
        for (const sz of [-1, 1]) box(g, wd, 96, 16, 5, 0, y + 4, sz * 96.5); // head/foot boards
        makeBed(g, 94, 188, y + 12, { pillows: 1, puff: 0.68, duvet: solid(y > 50 ? p.a : p.b, 0.85) });
      }
      // full safety rails both sides of the top bunk, tied into the posts
      for (const sx of [-1, 1]) {
        box(g, wd, 5, 5, 192, sx * 50, 141, 0, { r: 1.5 });
        for (let i = 0; i < 4; i++) box(g, wd, 4, 25, 4, sx * 50, 116, -63 + i * 42);
      }
      // angled ladder at the foot with round rungs
      for (const sx of [-1, 1]) strut(g, wd, sx * 15, 0, 128, sx * 15, 118, 98, 2.4);
      for (let i = 1; i <= 4; i++) {
        const f = i / 4.6;
        cyl(g, wd, 1.6, 27, 0, 118 * f, 128 - 30 * f, { rz: Math.PI / 2, seg: 10 });
      }
      return g;
    }
  },
  // ---------------------------------------------------------------- kids house-frame bed
  {
    id: 'bed2_house', name: 'House-Frame Kids Bed', cat: 'bedroom', w: 106, d: 206, h: 182,
    palettes: PAINTS, plan: { type: 'bed', pillows: 1 },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.45);
      box(g, wd, 106, 16, 206, 0, 0, 0, { r: 2 });                   // low platform
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, wd, 6, 112, 6, sx * 50, 0, sz * 100);
      for (const sx of [-1, 1]) box(g, wd, 6, 6, 206, sx * 50, 112, 0);   // eave rails
      for (const sz of [-1, 1]) box(g, wd, 106, 6, 6, 0, 112, sz * 100);
      // gable rafters meeting a ridge beam
      for (const sz of [-1, 1]) for (const sx of [-1, 1])
        strut(g, wd, sx * 50, 115, sz * 100, 0, 176, sz * 100, 3);
      box(g, wd, 5, 5, 206, 0, 174, 0);                              // ridge
      // pennant garland swagged across the front gable
      sweep(g, solid('#e8e2d6', 0.9), [[-38, 152, 100.5], [0, 138, 101], [38, 152, 100.5]], 0.4, { seg: 16 });
      const cols = [p.a, p.b, '#e8d9a0', p.a, p.b];
      for (let i = 0; i < 5; i++) {
        const x = -30 + i * 15, y = 138 + (x * x) / 1444 * 14;
        box(g, solid(cols[i], 0.8), 5, 5, 0.8, x, y - 5.2, 100.6, { rz: 0.78 });
      }
      makeBed(g, 94, 190, 16, { pillows: 1, puff: 0.72, duvet: solid(p.a, 0.85), accent: p.b });
      return g;
    }
  },
  // ---------------------------------------------------------------- crib + mobile
  {
    id: 'bed2_crib', name: 'Crib with Mobile', cat: 'bedroom', w: 138, d: 80, h: 158,
    palettes: PAINTS, plan: { type: 'bed', pillows: 1 },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.45);
      // posts + finials
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        box(g, wd, 5.5, 88, 5.5, sx * 64, 0, sz * 36, { r: 1 });
        sphere(g, wd, 3.2, sx * 64, 90, sz * 36, { seg: 12 });
      }
      // solid curved end panels
      for (const sx of [-1, 1]) box(g, wd, 6, 58, 68, sx * 64, 26, 0, { r: 3 });
      // long-side rails + round slats
      for (const sz of [-1, 1]) {
        box(g, wd, 126, 4.5, 4.5, 0, 82, sz * 36, { r: 1 });
        box(g, wd, 126, 4, 4.5, 0, 26, sz * 36, { r: 1 });
        for (let i = 0; i < 10; i++) cyl(g, wd, 1.25, 52, -56 + i * 12.5, 30, sz * 36, { seg: 10 });
      }
      box(g, wd, 124, 5, 66, 0, 24, 0);                              // mattress platform
      cushion(g, solid('#f6f2ea', 0.92), 120, 10, 62, 0, 29, 0, { puff: 0.1, dimple: 0.05 });
      cushion(g, solid(p.a, 0.85), 52, 6, 40, -22, 38, 2, { puff: 0.25, dimple: 0.1, ry: 0.12 }); // folded blanket
      // resident bunny
      sphere(g, solid('#e8e2d6', 0.9), 6, 34, 44, 0, { sy: 1.1, seg: 14 });
      sphere(g, solid('#e8e2d6', 0.9), 4.2, 34, 52, -4, { seg: 14 });
      for (const s of [-1, 1]) cyl(g, solid('#e8e2d6', 0.9), 1.3, 7, 34 + s * 2.4, 54, -5, { rTop: 0.9, seg: 8 });
      // mobile: curved arm over the mattress, four dangling shapes
      sweep(g, metal('#c9ccd0', 0.35), [[62, 88, 30], [56, 118, 18], [28, 138, 6], [0, 145, 0]], 1.1, { seg: 20 });
      cyl(g, wd, 3.5, 2.2, 0, 143, 0, { seg: 14 });
      torus(g, wood(p.wood, 0.45), 10.5, 0.7, 0, 142, 1.5, { seg: 28, tubeSeg: 8 });
      const hang = [[-10, 0, '#d9b3ac'], [10, 3, '#8ba7bd'], [0, -10, '#e8d9a0'], [0, 10, '#9fb193']];
      hang.forEach(([hx, hz, c], i) => {
        cyl(g, solid('#b9b3a8', 0.8), 0.25, 9 + i * 2, hx, 133 - i * 2, hz, { seg: 6 });
        if (i === 2) box(g, solid(c, 0.7), 4.4, 4.4, 1.6, hx, 128 - i * 2, hz, { rz: 0.78 });
        else sphere(g, solid(c, 0.7), 2.6, hx, 131 - i * 2, hz, { seg: 12 });
      });
      return g;
    }
  },
  // ---------------------------------------------------------------- 6-drawer dresser
  {
    id: 'bed2_dresser6', name: '6-Drawer Dresser', cat: 'bedroom', w: 152, d: 50, h: 84,
    palettes: WOODS, plan: { type: 'storage' },
    build: (p) => {
      const g = G();
      const t = carc(p, 2, 1), fr = wood(p.wood, 0.45), m = brass();
      for (const [x, z] of [[-68, -18], [68, -18], [-68, 18], [68, 18]]) tleg(g, m, x, z, 11, 2.6);
      box(g, t, 150, 66, 50, 0, 11, 0, { r: 1.5 });                  // carcass
      box(g, t, 152, 4, 51, 0, 77, 0, { r: 1 });                     // top slab
      // 2 × 3 drawer fronts with brass bar pulls
      for (let c = 0; c < 2; c++) for (let r = 0; r < 3; r++) {
        const x = (c ? 1 : -1) * 37, y = 15 + r * 21;
        box(g, fr, 70, 19, 2, x, y, 24.6, { r: 0.8 });
        barPull(g, m, x, y + 9.5, 25.6, 14);
      }
      // styling: ceramic vase with a sprig + a catch-all tray
      lathe(g, solid('#c9bfa8', 0.5), [[3, 0], [6.4, 1.6], [7.6, 6], [6.6, 12], [3.2, 16], [3.6, 19]], -52, 81, -6, { seg: 24 });
      blob(g, '#5d7a4c', '#7a9660', 6.5, -52, 105, -6, { seed: 8, sy: 1.25, detail: 3 });
      box(g, solid('#3a3530', 0.5), 26, 2, 16, 40, 81, 0, { r: 0.6 });
      return g;
    }
  },
  // ---------------------------------------------------------------- 5-drawer chest
  {
    id: 'bed2_chest5', name: 'Tall 5-Drawer Chest', cat: 'bedroom', w: 92, d: 50, h: 132,
    palettes: WOODS, plan: { type: 'storage' },
    build: (p) => {
      const g = G();
      const t = carc(p, 1, 2), fr = wood(p.wood, 0.45), m = brass();
      box(g, solid(dark, 0.85), 84, 6, 44, 0, 0, 0, { r: 1 });       // recessed plinth
      box(g, t, 92, 112, 50, 0, 6, 0, { r: 1.5 });                   // carcass
      box(g, t, 94, 4, 51, 0, 118, 0, { r: 1 });                     // top
      // graduated drawers — deepest at the bottom, like a real chest
      const hs = [25, 23, 21, 19, 17];
      let y = 9;
      for (let i = 0; i < 5; i++) {
        box(g, fr, 84, hs[i] - 2.5, 2, 0, y, 24.6, { r: 0.8 });
        barPull(g, m, 0, y + (hs[i] - 2.5) / 2, 25.6, 16);
        y += hs[i];
      }
      // framed photo + trailing plant on top
      box(g, solid('#2e2b28', 0.6), 16, 20, 1.6, -24, 122, -8, { ry: 0.2 });
      box(g, artMaterial(6), 13, 17, 1, -24, 123.5, -7.2, { ry: 0.2 });
      cyl(g, solid('#b5654a', 0.7), 6, 9, 26, 122, -6, { rTop: 7, seg: 16 });
      blob(g, '#4a6e3a', '#5d8348', 8, 26, 133, -6, { seed: 4, sy: 0.85, detail: 3 });
      return g;
    }
  },
  // ---------------------------------------------------------------- sliding wardrobe
  {
    id: 'bed2_wardrobe_slide', name: 'Sliding-Door Wardrobe', cat: 'bedroom', w: 200, d: 68, h: 214,
    palettes: WOODS, plan: { type: 'wardrobe' },
    build: (p) => {
      const g = G();
      const t = carc(p, 2, 2), fr = wood(p.wood, 0.45);
      const m = metal('#9a9ea4', 0.3);
      box(g, solid(dark, 0.85), 192, 5, 60, 0, 0, 0, { r: 1 });      // plinth
      box(g, t, 200, 198, 62, 0, 5, 0, { r: 1 });                    // carcass
      box(g, t, 202, 9, 66, 0, 203, 0, { r: 1.5 });                  // top fascia
      // exposed track hardware top + bottom
      box(g, m, 196, 2.5, 5, 0, 197, 32);
      box(g, m, 196, 2, 5, 0, 5, 32);
      // left door: wood panel on the inner track
      box(g, fr, 99, 188, 3, -50, 8, 31);
      cyl(g, m, 1, 34, -6, 84, 33.2);                                // vertical edge pull
      // right door: framed MIRROR panel riding the outer track
      box(g, fr, 99, 188, 3, 50, 8, 34.6);
      box(g, mirror(), 87, 174, 1, 50, 15, 36);
      for (const s of [-1, 1]) box(g, fr, 4, 188, 1.5, 50 + s * 47.5, 8, 36);
      cyl(g, m, 1, 34, 4, 84, 36.8);
      return g;
    }
  },
  // ---------------------------------------------------------------- vanity + stool + mirror
  {
    id: 'bed2_vanity', name: 'Vanity Set with Mirror', cat: 'bedroom', w: 116, d: 82, h: 150,
    palettes: WOODS, plan: { type: 'table' },
    build: (p) => {
      const g = G();
      const t = carc(p, 1, 1), wd = wood(p.wood, 0.45), m = brass();
      // table over at the back half
      box(g, t, 112, 5, 42, 0, 70, -16, { r: 1.2 });                 // top
      box(g, wd, 104, 9, 36, 0, 61, -16, { r: 1 });                  // apron/drawer band
      for (const s of [-1, 1]) { box(g, wd, 42, 7, 1.6, s * 26, 62, 2.6); knob(g, s * 26, 65.5, 3.6); }
      // turned legs
      const lp = [[2.6, 0], [1.8, 2], [2.6, 8], [3.3, 34], [2.6, 48], [3.4, 52], [3.4, 61]];
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) lathe(g, wd, lp, sx * 50, 0, -16 + sz * 16, { seg: 14 });
      // round mirror on a brass stem
      cyl(g, m, 1.4, 46, 0, 73, -34.5);
      torus(g, m, 25, 1.8, 0, 122, -34, { rx: 0, seg: 40 });
      cyl(g, mirror(), 23.6, 1.4, 0, 122, -34.8, { rx: Math.PI / 2, seg: 36 });
      // upholstered stool pulled out in front
      cushion(g, tex('fabric_beige', 1, 1), 36, 11, 36, 0, 34, 22, { puff: 0.3, dimple: 0.35 });
      for (const sx of [-1, 1]) for (const sz of [-1, 1])
        cyl(g, wd, 2.2, 34, sx * 13, 0, 22 + sz * 13, { rTop: 1.3, rx: sz * 0.1, rz: -sx * 0.1 });
      // perfume + tray styling
      lathe(g, solid('#d9c9b0', 0.35), [[2.4, 0], [3.4, 1], [3.6, 5], [1.4, 7], [1.4, 9.4]], -38, 75, -22, { seg: 16 });
      sphere(g, brass(), 1.4, -38, 85.1, -22, { seg: 10 });
      box(g, solid('#3a3530', 0.5), 24, 1.6, 14, 30, 75, -18, { r: 0.5 });
      return g;
    }
  },
  // ---------------------------------------------------------------- leaning mirror
  {
    id: 'bed2_mirror_lean', name: 'Leaning Floor Mirror', cat: 'bedroom', w: 70, d: 38, h: 188,
    palettes: [
      { name: 'Brass', chip: '#b08d57', f: '#b08d57', metal: true },
      { name: 'Matte Black', chip: '#2e2c2a', f: '#2e2c2a', metal: true },
      { name: 'Oak', chip: '#a07a4f', f: '#a07a4f', metal: false }
    ],
    plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      const fm = p.metal ? metal(p.f, 0.35) : wood(p.f, 0.45);
      const sub = G();
      // frame rails proud of a backing panel, mirror recessed between them
      box(sub, fm, 70, 6, 4.5, 0, 0, 0, { r: 1 });
      box(sub, fm, 70, 6, 4.5, 0, 180, 0, { r: 1 });
      for (const s of [-1, 1]) box(sub, fm, 6, 174, 4.5, s * 32, 6, 0, { r: 1 });
      box(sub, solid('#2a2724', 0.7), 60, 176, 1.4, 0, 5, -1.2);
      box(sub, mirror(), 58, 174, 1, 0, 6, -0.2);
      // a silk scarf tossed over one top corner
      drape(sub, solid('#b5654a', 0.7), 15, 34, 22, 184, 2.6, { sag: 2, wave: 2.6, folds: 2, seed: 3 });
      drape(sub, solid('#b5654a', 0.7), 15, 26, 22, 184, 1.8, { sag: 2, wave: 2.6, folds: 2, seed: 6, ry: Math.PI });
      sub.rotation.x = -0.11;                                        // lean back against the wall
      sub.position.set(0, 0.4, 8);
      g.add(sub);
      return g;
    }
  },
  // ---------------------------------------------------------------- end-of-bed bench
  {
    id: 'bed2_bench', name: 'End-of-Bed Bench', cat: 'bedroom', w: 136, d: 46, h: 50,
    palettes: BEDFAB, plan: { type: 'sofa', seats: 2 },
    build: (p) => {
      const g = G();
      const f = tex(p.fabric, 2, 1), m = brass();
      // plump upholstered top with three proud tuft buttons
      cushion(g, f, 136, 17, 46, 0, 30, 0, { puff: 0.2, dimple: 0.28 });
      for (let i = 0; i < 3; i++) sphere(g, solid(p.wood, 0.5), 1.3, -34 + i * 34, 47.9, 0, { seg: 10 });
      // sleek brass sled legs + stretcher
      for (const s of [-1, 1]) {
        box(g, m, 3, 30, 3, s * 58, 0, -17);
        box(g, m, 3, 30, 3, s * 58, 0, 17);
        box(g, m, 3, 3, 37, s * 58, 0, 0);
      }
      box(g, m, 110, 2.6, 2.6, 0, 12, 0);
      // folded blanket resting on one end
      cushion(g, solid(p.throw, 0.85), 34, 6, 38, -44, 46, 0, { puff: 0.22, dimple: 0.1, ry: 0.06 });
      cushion(g, solid(p.throw, 0.85), 27, 4.5, 30, -43, 51.5, 1, { puff: 0.26, dimple: 0.08, ry: -0.05 });
      return g;
    }
  },
  // ---------------------------------------------------------------- reading corner
  {
    id: 'bed2_reading', name: 'Reading Chair + Lamp', cat: 'bedroom', w: 120, d: 100, h: 158,
    palettes: BEDFAB, plan: { type: 'chair' },
    light: { y: 132, color: '#ffdca8', intensity: 0.8, distance: 380 },
    build: (p) => {
      const g = G();
      const f = tex(p.fabric, 2, 2), wl = wood(p.wood, 0.4);
      // armchair, angled a touch into the corner
      const ch = G(); ch.position.set(-18, 0, 8); ch.rotation.y = 0.16; g.add(ch);
      box(ch, f, 76, 24, 72, 0, 10, 0, { r: 7 });
      box(ch, f, 68, 54, 18, 0, 24, -28, { r: 9, rx: -0.08 });
      for (const s of [-1, 1]) box(ch, f, 15, 32, 70, s * 33, 12, 0, { r: 7 });
      cushion(ch, f, 56, 16, 58, 0, 32, 4, { puff: 0.16, dimple: 0.55 });
      cushion(ch, f, 52, 34, 14, 0, 44, -24, { puff: 0.2, dimple: 0.06, rx: -0.14 });
      cushion(ch, solid(p.accent, 0.8), 26, 24, 10, 14, 44, -14, { puff: 0.35, dimple: 0.04, ry: -0.4, rx: -0.24 });
      for (const [x, z] of [[-32, -30], [32, -30], [-32, 30], [32, 30]]) tleg(ch, wl, x, z, 10, 2.8);
      // throw folded over one arm, falling down the outside
      const tm = solid(p.throw, 0.85);
      cushion(ch, tm, 17, 4.5, 28, -33, 44.5, 2, { puff: 0.22, dimple: 0.12 });
      drape(ch, tm, 28, 27, -42, 46.5, 2, { sag: 3, wave: 2.6, folds: 3, seed: 2, ry: Math.PI / 2 });
      drape(ch, tm, 28, 27, -41.4, 46.5, 2, { sag: 3, wave: 2.6, folds: 3, seed: 2, ry: -Math.PI / 2 });
      // slim brass reading lamp behind the right shoulder
      const m = brass();
      cyl(g, m, 11, 2.4, 46, 0, -30);
      cyl(g, m, 1.4, 128, 46, 2, -30);
      shade(g, '#efe7d6', 13, 9, 17, 46, 124, -30);
      sphere(g, glow('#fff2d8', 1.1), 4, 46, 131, -30);
      // side table with an open book + mug
      cyl(g, wl, 14, 3, 44, 46, 26);
      cyl(g, m, 1.6, 46, 44, 0, 26);
      cyl(g, m, 9, 1.6, 44, 0, 26);
      box(g, solid('#c96f4a', 0.7), 17, 1.8, 12, 42, 49, 24, { ry: -0.3 });
      cyl(g, solid('#e8e2d6', 0.4), 3, 4.4, 50, 49, 32, { seg: 14 });
      return g;
    }
  },
  // ---------------------------------------------------------------- toy chest
  {
    id: 'bed2_toychest', name: 'Toy Chest', cat: 'bedroom', w: 96, d: 50, h: 62,
    palettes: PAINTS, plan: { type: 'storage' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.45);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, wd, 6, 8, 6, sx * 43, 0, sz * 21, { r: 1 });
      box(g, wd, 96, 40, 50, 0, 4, 0, { r: 2.5 });                   // chest body
      box(g, solid('#4a4238', 0.95), 84, 1.2, 38, 0, 44.1, 0);       // shadowed interior opening
      box(g, wd, 88, 30, 2, 0, 8, 25.2, { r: 1 });                   // front frame panel
      // rope handles on the ends
      for (const s of [-1, 1]) torus(g, solid('#b09a72', 0.9), 4.5, 1.1, s * 48.4, 26, 0, { rx: 0, ry: Math.PI / 2, seg: 24 });
      // lid propped open ~45°, hinged along the back top edge
      box(g, wd, 96, 4, 52, 0, 60.6, -3.9, { r: 1.5, rx: -0.8 });
      // toys spilling out: ball, blocks, teddy peeking over the rim
      sphere(g, solid('#c05a4a', 0.6), 6.5, -28, 46, 2, { seg: 16 });
      box(g, solid(p.b, 0.7), 8, 8, 8, -8, 42, 6, { r: 1, ry: 0.4 });
      box(g, solid('#d9c48a', 0.7), 7, 7, 7, 2, 44, -6, { r: 1, ry: -0.3, rz: 0.15 });
      sphere(g, solid('#a8875f', 0.85), 7.5, 26, 44, 0, { sy: 1.05, seg: 14 });
      sphere(g, solid('#a8875f', 0.85), 5.4, 26, 53, -2, { seg: 14 });
      for (const s of [-1, 1]) cyl(g, solid('#a8875f', 0.85), 1.7, 6, 26 + s * 3.4, 56, -2.5, { rTop: 1.2, seg: 8 });
      sphere(g, solid('#3a3028', 0.5), 0.8, 24.4, 54, 2.6, { seg: 8 });
      sphere(g, solid('#3a3028', 0.5), 0.8, 27.6, 54, 2.6, { seg: 8 });
      return g;
    }
  },
  // ---------------------------------------------------------------- laundry hamper
  {
    id: 'bed2_hamper', name: 'Woven Laundry Hamper', cat: 'bedroom', w: 52, d: 52, h: 72,
    palettes: [
      { name: 'Honey Rattan', chip: '#b08d5d', c: '#b08d5d', band: '#8f6c44' },
      { name: 'Grey Wash', chip: '#9a938a', c: '#9a938a', band: '#79736a' },
      { name: 'Seagrass', chip: '#a8a06e', c: '#a8a06e', band: '#847c50' }
    ],
    plan: { type: 'stool' },
    build: (p) => {
      const g = G();
      const rat = solid(p.c, 0.9);
      // basket body turned in one profile, lip rolled inward
      lathe(g, rat, [[16, 0], [21, 2.5], [23, 12], [23.6, 28], [24.2, 42], [25, 54], [25.6, 58], [23.8, 58], [23.2, 50]], 0, 0, 0, { seg: 28 });
      // proud weave bands
      for (const [y, R] of [[8, 22.4], [20, 23.3], [32, 23.8], [44, 24.4], [55, 25.4]])
        torus(g, solid(p.band, 0.9), R, 1.05, 0, y, 0, { seg: 36, tubeSeg: 8 });
      // side handles
      for (const s of [-1, 1]) torus(g, solid(p.band, 0.85), 4.4, 1, s * 25.6, 46, 0, { rx: 0, ry: Math.PI / 2, seg: 20 });
      // laundry mounding over the top, a sleeve flopped over the front rim
      cushion(g, solid('#f1ede4', 0.92), 36, 12, 36, 0, 52, 0, { puff: 0.32, dimple: 0.12 });
      drape(g, solid('#8fa3bd', 0.9), 13, 22, 0, 62, 24.4, { sag: 2, wave: 2.4, folds: 2, seed: 2 });
      drape(g, solid('#8fa3bd', 0.9), 13, 16, 0, 62, 23.6, { sag: 2, wave: 2.4, folds: 2, seed: 5, ry: Math.PI });
      // woven lid resting ajar on the pile
      cyl(g, rat, 24.5, 3, 0, 60, -3, { rx: 0.2, seg: 28 });
      torus(g, solid(p.band, 0.9), 23.2, 1, 0, 63.6, -4.2, { rx: -Math.PI / 2 + 0.2, seg: 32, tubeSeg: 8 });
      return g;
    }
  },
  // ---------------------------------------------------------------- nightstand + lamp
  {
    id: 'bed2_nightstand', name: 'Nightstand with Lamp', cat: 'bedroom', w: 54, d: 44, h: 92,
    palettes: WOODS, plan: { type: 'storage' },
    light: { y: 78, color: '#ffdfae', intensity: 0.7, distance: 300 },
    build: (p) => {
      const g = G();
      const t = carc(p, 1, 1), fr = wood(p.wood, 0.45), m = brass();
      for (const [x, z] of [[-22, -17], [22, -17], [-22, 17], [22, 17]]) tleg(g, m, x, z, 11, 2);
      box(g, t, 52, 33, 44, 0, 11, 0, { r: 1.5 });                   // body
      box(g, t, 54, 3.5, 45, 0, 44, 0, { r: 1 });                    // top
      for (const [y, h] of [[14, 12], [28, 13]]) {
        box(g, fr, 44, h, 1.8, 0, y, 21.6, { r: 0.6 });
        knob(g, 0, y + h / 2, 22.8);
      }
      // ceramic lamp: turned base, linen shade, warm bulb
      lathe(g, solid('#c9bfa8', 0.45), [[6.5, 0], [8.6, 2.5], [8.2, 12], [4.6, 18], [2, 21], [1.5, 30]], -6, 47.5, -6, { seg: 24 });
      shade(g, '#efe7d6', 12, 9, 15, -6, 74, -6);
      sphere(g, glow('#fff2d8', 1.1), 3.6, -6, 80, -6);
      // bedside clutter: two stacked books + reading glasses
      box(g, solid('#39506b', 0.7), 17, 2.4, 12, 14, 47.5, 8, { r: 0.5 });
      box(g, solid('#7c4434', 0.7), 15, 2.2, 11, 14, 49.9, 8, { r: 0.5, ry: 0.22 });
      torus(g, solid('#2a2724', 0.4), 2, 0.35, 12, 52.6, 7, { seg: 18 });
      torus(g, solid('#2a2724', 0.4), 2, 0.35, 16.6, 52.6, 7.4, { seg: 18 });
      return g;
    }
  }
];
