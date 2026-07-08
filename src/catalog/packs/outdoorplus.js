import { G, box, cyl, sphere, prism, blob, foliage, solid, wood, metal, glass, glow, tex, segment, strut, torus, textMaterial } from '../builders.js';

// Outdoor Extras — backyard play, garden & utility pieces. Procedural only.
const WOODS = [
  { name: 'Cedar', chip: '#9c7550', wood: '#9c7550' },
  { name: 'Redwood', chip: '#8a5638', wood: '#8a5638' },
  { name: 'Charcoal', chip: '#3c3c40', wood: '#3c3c40' }
];

// tiny deterministic PRNG for stone/log variation
function rng(seed) {
  let s = seed >>> 0 || 7;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export const OUTDOORPLUS_ITEMS = [
  // ---- 1. A-frame swing set with slide --------------------------------------
  {
    id: 'odx_swing_set', name: 'Swing Set with Slide', cat: 'yard', w: 480, d: 185, h: 215,
    palettes: [
      { name: 'Cedar/Green', chip: '#9c7550', wood: '#9c7550', accent: '#2f7d5a' },
      { name: 'Redwood/Blue', chip: '#8a5638', wood: '#8a5638', accent: '#33628f' },
      { name: 'Charcoal/Red', chip: '#3c3c40', wood: '#3c3c40', accent: '#a8433a' }
    ],
    plan: { type: 'swingset' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.62);
      const chain = metal('#9aa0a6', 0.4);
      const rubber = solid('#26282c', 0.7);
      const slideM = solid(p.accent, 0.4);
      // top beam — runs from the far A-frame into the tower
      box(g, wd, 268, 13, 11, -98, 196, 0);
      // A-frame legs (angled, real geometry) + ground pads
      const feet = [];
      for (const sz of [-1, 1]) {
        strut(g, wd, -220, 203, 0, -234, 3, sz * 84, 5.5);
        strut(g, wd, 10, 203, 0, 10, 3, sz * 84, 5.5);
        feet.push([-234, sz * 84], [10, sz * 84]);
      }
      for (const [fx, fz] of feet) box(g, wd, 14, 4, 14, fx, 0, fz);
      // cross ties on each A-frame
      strut(g, wd, -230, 58, -60, -230, 58, 60, 3.5);
      strut(g, wd, 10, 58, -60, 10, 58, 60, 3.5);
      // two swings on chains — second one gently swayed
      for (const [xc, zSeat] of [[-165, 0], [-65, 10]]) {
        for (const sx of [-1, 1]) strut(g, chain, xc + sx * 17, 193, 0, xc + sx * 17, 46, zSeat, 0.8, { seg: 6 });
        box(g, rubber, 44, 5, 15, xc, 43, zSeat, { r: 2, rx: zSeat * 0.008 });
      }
      // play tower: 4 posts + deck
      for (const px of [32, 106]) for (const sz of [-1, 1]) box(g, wd, 9, 150, 9, px, 0, sz * 42);
      box(g, wd, 84, 8, 94, 69, 95, 0);
      // guard rails (back + swing side) with balusters
      box(g, wd, 80, 5, 4, 69, 138, -44);
      for (const bx of [45, 62, 79, 96]) cyl(g, wd, 1.3, 35, bx, 103, -43, { seg: 8 });
      box(g, wd, 5, 5, 86, 31, 138, 0);
      for (const bz of [-24, 0, 24]) cyl(g, wd, 1.3, 35, 31.5, 103, bz, { seg: 8 });
      // ladder up the front
      strut(g, wd, 48, 0, 105, 48, 100, 49, 2.6);
      strut(g, wd, 86, 0, 105, 86, 100, 49, 2.6);
      for (const t of [0.2, 0.4, 0.6, 0.8]) {
        strut(g, wd, 48, t * 98, 105 - t * 56, 86, t * 98, 105 - t * 56, 1.7, { seg: 8 });
      }
      // slide off the right side of the deck (~37°) with side rails + run-out
      box(g, slideM, 150, 4, 40, 171, 51.5, 0, { rz: -0.65 });
      for (const sz of [-1, 1]) box(g, slideM, 150, 9, 3.5, 171, 53, sz * 18.5, { rz: -0.65 });
      box(g, slideM, 30, 4, 40, 242, 1, 0, { r: 2 });
      return g;
    }
  },

  // ---- 2. Seesaw -------------------------------------------------------------
  {
    id: 'odx_seesaw', name: 'Playground Seesaw', cat: 'yard', w: 300, d: 58, h: 96,
    palettes: [
      { name: 'Sunny Yellow', chip: '#d9a83c' },
      { name: 'Fire Red', chip: '#b8483c' },
      { name: 'Grass Green', chip: '#4f8a4c' }
    ],
    plan: { type: 'game', label: 'SEESAW' },
    build: (p) => {
      const g = G();
      const paint = solid(p.chip, 0.45);
      const steel = metal('#5a5e63', 0.4);
      const rubber = solid('#26282c', 0.7);
      const t = 0.26;                                  // board tilt
      const bt = (x) => 44.5 + x * Math.sin(t) + 3.5 * Math.cos(t); // board top y at x
      // pivot A-stands + axle
      for (const sz of [-1, 1]) {
        strut(g, steel, -26, 0, sz * 22, 0, 38, sz * 19, 3.8);
        strut(g, steel, 26, 0, sz * 22, 0, 38, sz * 19, 3.8);
        box(g, steel, 10, 3, 10, -24, 0, sz * 21);
        box(g, steel, 10, 3, 10, 24, 0, sz * 21);
      }
      cyl(g, steel, 3.2, 46, 0, 40, 0, { rx: Math.PI / 2 });
      // tilted plank
      box(g, paint, 290, 7, 26, 0, 41, 0, { rz: t, r: 2 });
      // seats
      for (const sx of [-1, 1]) box(g, rubber, 30, 4, 24, sx * 118, bt(sx * 118) - 0.5, 0, { rz: t, r: 2 });
      // handle bars (inverted U at each seat)
      for (const sx of [-1, 1]) {
        const hx = sx * 92, hy = bt(hx);
        for (const sz of [-1, 1]) strut(g, steel, hx, hy - 1, sz * 8, hx - sx * 5, hy + 19, sz * 8, 1.4, { seg: 8 });
        strut(g, steel, hx - sx * 5, hy + 19, -8, hx - sx * 5, hy + 19, 8, 1.4, { seg: 8 });
      }
      // half-buried tires under both ends (bump stops)
      for (const sx of [-1, 1]) {
        torus(g, rubber, 7.5, 3.6, sx * 120, 2, 0, { rx: 0, ry: Math.PI / 2, seg: 22, tubeSeg: 10 });
      }
      return g;
    }
  },

  // ---- 3. Sandbox with bench edge -------------------------------------------
  {
    id: 'odx_sandbox_covered', name: 'Bench-Edge Sandbox', cat: 'yard', w: 172, d: 172, h: 38,
    palettes: WOODS, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.7);
      // plank walls + cap rails
      for (const sz of [-1, 1]) {
        box(g, wd, 170, 24, 12, 0, 0, sz * 79);
        box(g, wd, 12, 24, 146, sz * 79, 0, 0);
        box(g, wd, 172, 4, 16, 0, 24, sz * 79);
        box(g, wd, 16, 4, 148, sz * 79, 24, 0);
      }
      // corner bench seats (diagonal boards)
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        box(g, wd, 46, 4, 46, sx * 58, 24, sz * 58, { ry: Math.PI / 4, r: 1.5 });
      }
      // mounded sand
      blob(g, '#c6a873', '#e6d3a2', 66, 0, 16, 0, { seed: 9, sy: 0.22, amp: 0.05 });
      // toy pail with rim ring + little shovel resting on a corner bench
      cyl(g, solid('#c0453a', 0.5), 7, 11, 34, 26, 30, { rTop: 8.6, seg: 16 });
      torus(g, solid('#8f3129', 0.5), 8.2, 0.8, 34, 37, 30, { seg: 24, tubeSeg: 8 });
      box(g, solid('#d9a83c', 0.5), 2.6, 1.6, 16, -55, 28, -52, { ry: 0.8 });
      box(g, solid('#d9a83c', 0.5), 7, 1.6, 8, -61, 28, -60, { ry: 0.8 });
      return g;
    }
  },

  // ---- 4. Treehouse-style platform playhouse ---------------------------------
  {
    id: 'odx_treehouse_platform', name: 'Platform Playhouse', cat: 'yard', w: 205, d: 200, h: 250,
    palettes: [
      { name: 'Cedar', chip: '#9c7550', wood: '#9c7550' },
      { name: 'Forest', chip: '#5a6e52', wood: '#5a6e52' },
      { name: 'Grey', chip: '#8a8a86', wood: '#8a8a86' }
    ],
    plan: { type: 'shed' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.68);
      const trim = wood('#e2dbc8', 0.6);
      const roofM = solid('#4a4e52', 0.72);
      const dark = solid('#241c12', 0.9);
      // 4 posts + knee braces
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        box(g, wd, 11, 100, 11, sx * 88, 0, sz * 62);
        strut(g, wd, sx * 88, 42, sz * 62, sx * 58, 96, sz * 40, 3.2);
      }
      // deck platform
      box(g, wd, 200, 10, 168, 0, 100, 0);
      // playhouse walls (set back to leave a porch strip)
      box(g, wd, 150, 95, 118, 0, 110, -18);
      // doorway + front window with trim
      box(g, dark, 40, 62, 4, -30, 110, 39.5);
      box(g, trim, 46, 66, 3, -30, 108, 38.8);
      box(g, dark, 40, 62, 4, -30, 110, 40.2);
      box(g, trim, 36, 32, 3, 35, 149, 40.5);
      box(g, solid('#241c12', 0.85), 28, 24, 2, 35, 153, 41.4);
      box(g, glass(), 30, 26, 3, 35, 152, 41.8);
      // side windows
      for (const sx of [-1, 1]) {
        box(g, trim, 4, 34, 34, sx * 76, 142, -18);
        box(g, solid('#241c12', 0.85), 2.5, 26, 26, sx * 77.2, 146, -18);
        box(g, glass(), 3, 28, 28, sx * 77.6, 145, -18);
      }
      // gable roof, ridge facing front
      const roof = prism(g, roofM, 138, 42, 172, 0, 205, -18, wood(p.wood, 0.68));
      roof.rotation.y = Math.PI / 2;
      // porch railing (with gap for the ladder)
      box(g, wd, 6, 34, 6, -95, 110, 78);
      box(g, wd, 6, 34, 6, 25, 110, 78);
      box(g, wd, 124, 5, 4, -35, 140, 78);
      for (const bx of [-75, -55, -35, -15, 5]) cyl(g, wd, 1.3, 30, bx, 110, 78, { seg: 8 });
      // ladder to the deck
      strut(g, wd, 55, 0, 108, 55, 108, 82, 2.6);
      strut(g, wd, 85, 0, 108, 85, 108, 82, 2.6);
      for (const t of [0.18, 0.36, 0.54, 0.72, 0.9]) {
        strut(g, wd, 55, t * 104, 108 - t * 26, 85, t * 104, 108 - t * 26, 1.7, { seg: 8 });
      }
      return g;
    }
  },

  // ---- 5. L-shaped outdoor kitchen -------------------------------------------
  {
    id: 'odx_outdoor_kitchen', name: 'Outdoor Kitchen (L)', cat: 'yard', w: 260, d: 190, h: 122,
    palettes: null, plan: { type: 'grill' },
    build: () => {
      const g = G();
      const stone = tex('stone_veneer', 2.4, 1);
      const top = tex('counter_dark', 2.2, 1);
      const ss = metal('#c9cdd2', 0.28);
      const ssDark = metal('#9ba0a6', 0.35);
      const dark = solid('#1c1e21', 0.6);
      // masonry L: main run along the back + return on the left
      box(g, stone, 260, 88, 70, 0, 0, -60);
      box(g, stone, 70, 88, 120, -95, 0, 35);
      // granite counters (abutting, not overlapping)
      box(g, top, 268, 7, 78, 0, 88, -60, { r: 1.5 });
      box(g, top, 78, 7, 121, -95, 88, 39.5, { r: 1.5 });
      // low granite upstand behind the grill
      box(g, top, 260, 16, 8, 0, 95, -92, { r: 1.5 });
      // built-in grill: hood + handle + control panel + knobs
      box(g, ss, 92, 26, 62, 20, 95, -60, { r: 5 });
      cyl(g, ssDark, 1.7, 76, 20, 114, -28, { rz: Math.PI / 2, seg: 10 });
      box(g, ssDark, 92, 14, 2.5, 20, 62, -24.5);
      for (const kx of [-10, 8, 26, 44]) cyl(g, dark, 2.2, 3, kx, 68, -23.6, { rx: Math.PI / 2, seg: 12 });
      // stainless storage doors under the counter
      for (const dx of [-100, -56]) {
        box(g, ss, 38, 54, 2.5, dx, 10, -23.8, { r: 1.5 });
        cyl(g, ssDark, 1.1, 26, dx, 56, -21.8, { rz: Math.PI / 2, seg: 8 });
      }
      // fridge door on the return (facing into the L) + vent
      box(g, ss, 2.5, 62, 50, -58.6, 8, 55, { r: 1.5 });
      cyl(g, ssDark, 1.2, 40, -56.4, 20, 34, { seg: 8 });
      box(g, dark, 2, 8, 44, -58.4, 74, 55);
      // herb pot dressing the return counter
      cyl(g, solid('#b06a4a', 0.85), 6, 11, -95, 95, 78, { rTop: 7.8, seg: 14 });
      foliage(g, '#4f6f2c', '#8db84e', -95, 110, 78, 9, 5, 14);
      return g;
    }
  },

  // ---- 6. Pizza oven on stone base (distinct from lounge stucco oven) --------
  {
    id: 'odx_pizza_oven_stand', name: 'Clay Pizza Oven & Stone Base', cat: 'yard', w: 136, d: 106, h: 162,
    palettes: null, plan: { type: 'grill' },
    light: { y: 105, color: '#ff8a3c', intensity: 0.9, distance: 300 },
    build: () => {
      const g = G();
      const dark = solid('#141210', 0.95);
      const bark = wood('#5f4a36', 0.85);
      const endW = solid('#c9a878', 0.9);
      // stacked-stone base with a firewood niche
      box(g, tex('stone_veneer', 1.4, 1), 128, 88, 96, 0, 0, -2, { r: 2 });
      box(g, dark, 88, 52, 8, 0, 8, 42.5);
      // split firewood stacked in the niche (ends read as pale discs)
      const R = rng(31);
      const logRows = [[18, [-30, -10, 12, 32]], [31, [-20, 2, 22]]];
      for (const [ly, xs] of logRows) for (const x of xs) {
        const r = 5.6 + R() * 2.2;
        cyl(g, bark, r, 26, x, ly + (R() - 0.5) * 2, 34, { rx: Math.PI / 2, seg: 12 });
        cyl(g, endW, r * 0.86, 1.6, x, ly, 47.5, { rx: Math.PI / 2, seg: 12 });
      }
      // granite hearth slab
      box(g, tex('counter_dark', 1.6, 1), 136, 7, 104, 0, 88, -2, { r: 2 });
      // terracotta clay dome
      sphere(g, solid('#a8623c', 0.75), 42, 0, 96, -12, { sy: 0.82, seg: 24 });
      // mouth vestibule embedded in the dome front: dark throat + brick arch ring
      box(g, dark, 28, 15, 14, 0, 95, 23);
      cyl(g, dark, 14, 14, 0, 110, 23, { rx: Math.PI / 2, seg: 18 });
      torus(g, solid('#9a4a34', 0.8), 16.5, 3.4, 0, 110, 27.5, { rx: 0, seg: 26, tubeSeg: 10 });
      // brick landing shelf in front of the mouth
      box(g, solid('#9a4a34', 0.8), 40, 4, 15, 0, 95, 36, { r: 1 });
      // ember glow inside
      sphere(g, glow('#ff7a30', 1.5, 0.5), 6, 0, 100, 20, { sy: 0.5, seg: 10 });
      // chimney + rain cap
      cyl(g, solid('#8a4638', 0.8), 7.5, 34, 0, 124, -18, { seg: 14 });
      cyl(g, metal('#3a3d40', 0.5), 9.5, 3, 0, 158, -18, { seg: 14 });
      // wooden peel lying flat on the hearth
      const lw = wood('#c9a878', 0.6);
      cyl(g, lw, 1.2, 30, 46, 96.2, 28, { rx: Math.PI / 2, seg: 8 });
      box(g, lw, 13, 1.6, 20, 46, 95.4, 3, { r: 1 });
      return g;
    }
  },

  // ---- 7. Firewood rack ------------------------------------------------------
  {
    id: 'odx_firewood_rack', name: 'Stacked Firewood Rack', cat: 'yard', w: 155, d: 44, h: 120,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      const steel = solid('#2b2d31', 0.5);
      const bark = wood('#5f4a36', 0.85);
      const ends = [solid('#c9a878', 0.9), solid('#b8926a', 0.9)];
      // steel frame: uprights, top ties, ground rails, feet
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) box(g, steel, 5, 116, 5, sx * 71, 2, sz * 16);
        box(g, steel, 5, 4, 38, sx * 71, 114, 0);
        box(g, steel, 10, 4, 40, sx * 71, 0, 0);
      }
      for (const sz of [-1, 1]) box(g, steel, 152, 5, 5, 0, 6, sz * 16);
      // split logs — varied radii, jitter, pale end discs
      const R = rng(97);
      const rows = [7, 6, 5, 3, 2];
      let y = 11;
      rows.forEach((n, ri) => {
        const span = (n - 1) * 19;
        const rBase = 6.4 + R() * 1.2;
        for (let i = 0; i < n; i++) {
          const r = rBase - 0.8 + R() * 1.8;
          const x = -span / 2 + i * 19 + (R() - 0.5) * 4;
          const zj = (R() - 0.5) * 5;
          const yy = y + r;
          cyl(g, bark, r, 36, x, yy, zj, { rx: Math.PI / 2 + (R() - 0.5) * 0.08, seg: 12 });
          cyl(g, ends[(i + ri) % 2], r * 0.87, 1.6, x, yy, zj + 18.6, { rx: Math.PI / 2, seg: 12 });
        }
        y += rBase * 1.85;
      });
      return g;
    }
  },

  // ---- 8. Rain barrel ---------------------------------------------------------
  {
    id: 'odx_rain_barrel', name: 'Rain Barrel', cat: 'yard', w: 64, d: 72, h: 134,
    palettes: [
      { name: 'Oak', chip: '#7a5540', wood: '#7a5540' },
      { name: 'Weathered', chip: '#6e675c', wood: '#6e675c' }
    ],
    plan: { type: 'lampRound' },
    build: (p) => {
      const g = G();
      const stave = wood(p.wood, 0.75);
      const band = metal('#5a5e62', 0.4);
      const alum = metal('#b4b8bc', 0.45);
      const brass = metal('#b08d57', 0.35);
      // bellied barrel: two mirrored tapered drums, faceted like staves
      cyl(g, stave, 27, 45, 0, 2, 0, { rTop: 31, seg: 16 });
      cyl(g, stave, 31, 45, 0, 47, 0, { rTop: 27, seg: 16 });
      // steel bands at foot, belly and shoulder
      cyl(g, band, 28.6, 4, 0, 10, 0, { rTop: 29.3, seg: 16 });
      cyl(g, band, 31.6, 4, 0, 45, 0, { seg: 16 });
      cyl(g, band, 29.2, 4, 0, 80, 0, { rTop: 28.4, seg: 16 });
      // lid with dark screened inlet
      cyl(g, wood('#5c4432', 0.7), 27.2, 3.5, 0, 92, 0, { seg: 16 });
      cyl(g, solid('#17140f', 0.9), 6.5, 2.2, 0, 95.5, -13);
      // downspout dropping in from behind: flared head, riser, elbow
      cyl(g, alum, 5.6, 6, 0, 126, -30, { rTop: 7.6, seg: 10 });
      strut(g, alum, 0, 128, -30, 0, 100, -30, 5.4, { seg: 10 });
      strut(g, alum, 0, 102, -30, 0, 96.5, -14, 5.2, { seg: 10 });
      // brass spigot with handle
      cyl(g, brass, 1.9, 8, 0, 16, 30, { rx: Math.PI / 2, seg: 10 });
      box(g, brass, 1.6, 4.5, 1.6, 0, 17.5, 33.5);
      cyl(g, brass, 2.6, 1.8, 0, 15.1, 34.2, { rx: Math.PI / 2, seg: 10 });
      return g;
    }
  },

  // ---- 9. Compost bin ---------------------------------------------------------
  {
    id: 'odx_compost_bin', name: 'Slatted Compost Bin', cat: 'yard', w: 106, d: 106, h: 90,
    palettes: WOODS, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.78);
      // corner posts
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, wd, 8, 84, 8, sx * 48, 0, sz * 48);
      // slats with air gaps — front kept lower so the heap shows
      for (const y of [6, 24, 42, 60, 74]) {
        box(g, wd, 96, 11, 4, 0, y, -48);
        box(g, wd, 4, 11, 96, -48, y, 0);
        box(g, wd, 4, 11, 96, 48, y, 0);
        if (y < 48) box(g, wd, 96, 11, 4, 0, y, 48);
      }
      // dark compost mound peeking over the open top + straw flecks
      blob(g, '#2b2014', '#4c3b22', 44, 0, 56, -4, { seed: 23, sy: 0.55, amp: 0.09 });
      blob(g, '#8a7448', '#c2a86a', 9, -18, 74, 6, { seed: 5, sy: 0.5, detail: 1 });
      blob(g, '#7c683e', '#b09858', 7, 20, 70, -16, { seed: 12, sy: 0.5, detail: 1 });
      return g;
    }
  },

  // ---- 10. Rotary clothesline --------------------------------------------------
  {
    id: 'odx_clothesline', name: 'Rotary Clothesline', cat: 'yard', w: 200, d: 200, h: 176,
    palettes: null, plan: { type: 'umbrella' },
    build: () => {
      const g = G();
      const galv = metal('#b0b4b8', 0.42);
      const lineM = solid('#e8e6e0', 0.6);
      // pole + ground socket + hub + crank
      cyl(g, galv, 3.4, 150, 0, 0, 0, { seg: 12 });
      cyl(g, solid('#8a8e92', 0.7), 5.2, 7, 0, 0, 0, { seg: 12 });
      cyl(g, galv, 5, 9, 0, 147, 0, { seg: 12 });
      cyl(g, galv, 1.2, 10, 6, 118, 0, { rz: Math.PI / 2, seg: 8 });
      // 4 arms to the diagonals, tilted up, with struts
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        strut(g, galv, 0, 152, 0, sx * 95, 172, sz * 95, 2.1, { rTop: 1.3, seg: 8 });
        strut(g, galv, 0, 122, 0, sx * 47, 162, sz * 47, 1.1, { seg: 6 });
      }
      // concentric square lines strung between the arms
      for (const t of [0.55, 0.78, 1.0]) {
        const d = 95 * t, y = 152 + 20 * t;
        strut(g, lineM, -d, y, d, d, y, d, 0.45, { seg: 5 });
        strut(g, lineM, -d, y, -d, d, y, -d, 0.45, { seg: 5 });
        strut(g, lineM, d, y, -d, d, y, d, 0.45, { seg: 5 });
        strut(g, lineM, -d, y, -d, -d, y, d, 0.45, { seg: 5 });
      }
      // hanging laundry with a hint of sway + clothespins
      const cloths = [
        [-34, 95, 30, 36, '#d8e4ee', 0.05, 0],
        [22, 95, 26, 32, '#e6d9c4', -0.06, 0],
        [95, -18, 34, 30, '#a8bfd4', 0.045, 1],
        [8, -74.1, 28, 34, '#e8e2d6', -0.05, 0]
      ];
      for (const [cx, cz, cw, chh, col, sway, side] of cloths) {
        const y = Math.abs(cz) > 90 || Math.abs(cx) > 90 ? 172 : 167.6;
        const m = box(g, solid(col, 0.85), cw, chh, 1.2, cx, y - chh, cz, { r: 0.5 });
        if (side) m.rotation.y = Math.PI / 2;
        m.rotation.z += sway;
        for (const sp of [-1, 1]) {
          const px = side ? cx : cx + sp * (cw / 2 - 3);
          const pz = side ? cz + sp * (cw / 2 - 3) : cz;
          box(g, wood('#b89a6a', 0.7), side ? 1.8 : 1.6, 3.4, side ? 1.6 : 1.8, px, y - 1.4, pz);
        }
      }
      return g;
    }
  },

  // ---- 11. Dry-stacked stone wall ---------------------------------------------
  {
    id: 'odx_stone_wall', name: 'Fieldstone Wall', cat: 'yard', w: 240, d: 48, h: 90,
    palettes: null, plan: { type: 'rock' },
    build: () => {
      const g = G();
      const tones = [
        ['#5e5952', '#7d7669'], ['#544f47', '#6e6759'],
        ['#665f54', '#87806f'], ['#4c4841', '#655f55'],
        ['#6b6152', '#8a7d66']
      ];
      const R = rng(1234);
      // three tightly packed courses of rounded fieldstones
      for (let c = 0; c < 3; c++) {
        const yc = 14 + c * 25;
        let x = -112 + (c % 2) * 10;
        let i = 0;
        while (x < 108) {
          const r = 14 + R() * 4;
          const sx = 1.1 + R() * 0.35;
          const tone = tones[(i * 2 + c * 3 + 1) % tones.length];
          const b = blob(g, tone[0], tone[1], r, x + r * sx * 0.7, yc + (R() - 0.5) * 2.5,
            (R() - 0.5) * 3, { seed: c * 17 + i * 3 + 2, sy: 0.66, amp: 0.07, detail: 2 });
          b.scale.x = sx;
          b.scale.z = Math.min(1.25, 21 / r);
          b.rotation.y = (R() - 0.5) * 0.3;
          x += r * 2 * sx * 0.68;
          i++;
        }
      }
      // flatter capstones
      const capT = ['#57534b', '#645e54'];
      for (let x = -102; x <= 102; x += 40.5) {
        box(g, solid(capT[(Math.round(x / 40.5) & 1) ? 0 : 1], 0.95), 41, 10, 44, x, 74,
          (R() - 0.5) * 3, { r: 4, ry: (R() - 0.5) * 0.12 });
      }
      return g;
    }
  },

  // ---- 12. Wheelbarrow ----------------------------------------------------------
  {
    id: 'odx_wheelbarrow', name: 'Garden Wheelbarrow', cat: 'yard', w: 52, d: 140, h: 64,
    palettes: [
      { name: 'Barn Red', chip: '#9e3a30' },
      { name: 'Forest', chip: '#3f6b52' },
      { name: 'Galvanized', chip: '#b8bcc0' }
    ],
    plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const trayM = solid(p.chip, 0.5);
      const steelD = solid('#2b2d31', 0.5);
      const rubber = solid('#1d1f22', 0.8);
      // flared tray: 4-sided tapered drum, rotated & stretched into a tub
      const tub = cyl(g, trayM, 22, 28, 0, 20, 6, { rTop: 38, seg: 4 });
      tub.geometry.rotateY(Math.PI / 4); // bake: scale below must act on world axes
      tub.scale.set(0.88, 1, 1.45);
      // rolled rim
      box(g, trayM, 50, 3, 4, 0, 46.5, 45);
      box(g, trayM, 50, 3, 4, 0, 46.5, -33);
      for (const sx of [-1, 1]) box(g, trayM, 4, 3, 78, sx * 23.5, 46.5, 6);
      // heaped dirt
      const dirt = blob(g, '#42311f', '#66512f', 20, 0, 46, 5, { seed: 8, sy: 0.5, amp: 0.08 });
      dirt.scale.set(0.9, 1, 1.5);
      // single front wheel + hub
      torus(g, rubber, 12, 4.5, 0, 16.5, 52, { rx: 0, ry: Math.PI / 2, seg: 26, tubeSeg: 10 });
      cyl(g, steelD, 3, 9, 0, 16.5, 52, { rz: Math.PI / 2, seg: 10 });
      // handle rails running grip → axle, with rubber grips
      for (const sx of [-1, 1]) {
        strut(g, steelD, sx * 14, 58, -66, sx * 5, 16.5, 51, 2.1, { seg: 8 });
        strut(g, rubber, sx * 14, 58, -66, sx * 15.5, 62.5, -77, 2.5, { seg: 8 });
        // legs + pads
        strut(g, steelD, sx * 12, 32, -38, sx * 16, 1.5, -44, 1.9, { seg: 8 });
        box(g, steelD, 7, 2.5, 9, sx * 16, 0, -45);
      }
      box(g, steelD, 28, 3, 3, 0, 13, -40);
      return g;
    }
  },

  // ---- 13. Birdhouse on a post (with bird) --------------------------------------
  {
    id: 'odx_birdhouse_post', name: 'Birdhouse Post', cat: 'yard', w: 34, d: 34, h: 200,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      const post = wood('#6a533a', 0.7);
      const body = wood('#a8977c', 0.65);
      const roofM = solid('#4a4e52', 0.7);
      const dark = solid('#17130e', 0.95);
      // post + cap plate
      box(g, post, 9, 150, 9, 0, 0, 0);
      box(g, post, 26, 3, 22, 0, 150, 0);
      // house body
      box(g, body, 26, 30, 22, 0, 153, 0, { r: 1 });
      // entry hole + perch
      cyl(g, dark, 4, 2, 0, 170, 10.5, { rx: Math.PI / 2, seg: 16 });
      cyl(g, post, 0.9, 8, 0, 162, 13.5, { rx: Math.PI / 2, seg: 8 });
      // gable roof slabs (ridge along z, generous eaves) + ridge cap
      box(g, roofM, 20, 2.6, 30, 8, 183.5, 0, { rz: -0.55 });
      box(g, roofM, 20, 2.6, 30, -8, 183.5, 0, { rz: 0.55 });
      box(g, solid('#3c4045', 0.7), 3.4, 2.2, 30, 0, 189.6, 0, { r: 1 });
      // --- bluebird perched on the ridge: massed spheres, beak + tail ---
      const blue = solid('#4a7fb5', 0.75);
      const breast = solid('#c97b4a', 0.8);
      sphere(g, blue, 4, 0, 195.3, -2, { sz: 1.3, seg: 14 });         // body
      sphere(g, breast, 3.6, 0, 194.4, 2, { seg: 14 });               // breast
      sphere(g, blue, 3, 0, 199.6, 4.4, { seg: 14 });                 // head
      cyl(g, solid('#3a3a3a', 0.5), 1.1, 3.6, 0, 199.4, 7, { rx: Math.PI / 2, rTop: 0.15, seg: 8 });
      box(g, blue, 2.6, 1.1, 7.5, 0, 194.4, -9, { rx: 0.42 });        // tail, angled up
      for (const sx of [-1, 1]) {
        sphere(g, solid('#3f6d9c', 0.75), 2.6, sx * 3, 195.5, -1.2, { sx: 0.55, sz: 1.25, seg: 12 }); // wings
        sphere(g, solid('#141414', 0.4), 0.52, sx * 1.5, 200.4, 6.4, { seg: 8 });                     // eyes
      }
      return g;
    }
  },

  // ---- 14. Lean-to cold frame / mini greenhouse ---------------------------------
  {
    id: 'odx_greenhouse_mini', name: 'Cold Frame Greenhouse', cat: 'yard', w: 156, d: 78, h: 82,
    palettes: null, plan: { type: 'greenhouse' },
    build: () => {
      const g = G();
      const cedar = wood('#8a684a', 0.7);
      const frameM = solid('#e8e4da', 0.5);
      const terra = solid('#b06a4a', 0.85);
      // cedar box: tall back, low front, sides + sloped side caps
      box(g, cedar, 152, 70, 6, 0, 0, -33);
      box(g, cedar, 152, 45, 6, 0, 0, 33);
      for (const sx of [-1, 1]) {
        box(g, cedar, 6, 45, 60, sx * 73, 0, 0);
        box(g, cedar, 6, 5, 74, sx * 73, 55, 0, { rx: 0.353 });
      }
      // glazed lids: white border frame + mullion around a real glass pane
      const makeLid = (px, py, pz, rx) => {
        const lid = G();
        for (const sz of [-1, 1]) box(lid, frameM, 72, 4, 8, 0, 0, sz * 34);
        for (const sx of [-1, 1]) box(lid, frameM, 8, 4, 76, sx * 32, 0, 0);
        box(lid, frameM, 5, 3.6, 60, 0, 0.2, 0);
        box(lid, glass(), 60, 2, 62, 0, 1, 0);
        lid.rotation.x = rx;
        lid.position.set(px, py, pz);
        g.add(lid);
      };
      makeLid(-38, 59.5, 0, 0.362);              // closed lid
      makeLid(38, 75.5, 4.7, -0.12);             // propped-open lid
      strut(g, wood('#8a6a4a', 0.7), 38, 45, 27, 38, 76, 29, 1.3, { seg: 6 });
      // soil bed + potted seedling rows inside
      box(g, solid('#3a2c1e', 0.97), 138, 8, 56, 0, 2, -1);
      const R = rng(55);
      for (const z of [-16, 12]) for (const x of [-48, -8, 32]) {
        cyl(g, terra, 5.2, 10, x, 10, z, { rTop: 6.8, seg: 12 });
        blob(g, '#4f6f2c', '#8db84e', 6, x, 23, z, { seed: (x + 60) + z, sy: 0.85, detail: 2, amp: 0.12 });
      }
      return g;
    }
  },

  // ---- 15. Dog house --------------------------------------------------------------
  {
    id: 'odx_dog_house', name: 'Gable Dog House', cat: 'yard', w: 104, d: 118, h: 106,
    palettes: [
      { name: 'Barn Red', chip: '#8e4438', wood: '#8e4438' },
      { name: 'Cedar', chip: '#9c7550', wood: '#9c7550' },
      { name: 'Slate', chip: '#5c646c', wood: '#5c646c' }
    ],
    plan: { type: 'shed' },
    build: (p) => {
      const g = G();
      const wall = wood(p.wood, 0.68);
      const trim = solid('#e8e2d4', 0.55);
      const dark = solid('#17130e', 0.95);
      // raised floor slab + body
      box(g, wood('#4c3a28', 0.75), 100, 8, 110, 0, 0, 0, { r: 1.5 });
      box(g, wall, 88, 62, 96, 0, 8, 0);
      // arched doorway: dark rectangular inset + dark round arch + white trim
      box(g, dark, 34, 28, 5, 0, 8, 46.5);
      cyl(g, dark, 17, 5, 0, 36, 46.5, { rx: Math.PI / 2, seg: 20 });
      torus(g, trim, 18.5, 2.2, 0, 36, 48.4, { rx: 0, seg: 24, tubeSeg: 8 });
      for (const sx of [-1, 1]) box(g, trim, 4, 30, 3, sx * 18.5, 8, 47.6);
      // cedar-shake gable roof, ridge front-to-back, wood gable ends
      const roof = prism(g, tex('cedar_shake', 1.2, 1.2), 118, 32, 104, 0, 70, 0, wood(p.wood, 0.68));
      roof.rotation.y = Math.PI / 2;
      box(g, solid('#5c4632', 0.7), 6, 5, 120, 0, 99.5, 0, { r: 2 });
      // name plaque over the door (clear of the roof slope)
      box(g, textMaterial('REX', { bg: '#3a2f22', fg: '#ecdfc0', border: '#c9a86a', size: 130 }),
        24, 9, 2.5, 0, 60, 47.8);
      // food bowl on the slab by the door
      cyl(g, metal('#c0453a', 0.45), 7.5, 5, 36, 8, 44, { rTop: 9, seg: 16 });
      blob(g, '#8a6a3c', '#b89258', 6, 36, 13.5, 44, { seed: 3, sy: 0.4, detail: 1 });
      return g;
    }
  },

  // ---- 16. Garden arch with bench ---------------------------------------------
  {
    id: 'odx_garden_arch_bench', name: 'Rose Arch Bench', cat: 'yard', w: 165, d: 80, h: 232,
    palettes: [
      { name: 'White', chip: '#e6e2d8', wood: '#e6e2d8' },
      { name: 'Cedar', chip: '#9c7550', wood: '#9c7550' },
      { name: 'Sage', chip: '#7c8a6e', wood: '#7c8a6e' }
    ],
    plan: { type: 'pergola' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.55);
      // posts
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, wd, 8, 170, 8, sx * 72, 0, sz * 30);
      // curved arch top: two arcs of chained segments + cross slats
      const arc = [];
      for (let i = 0; i <= 5; i++) {
        const ph = Math.PI - (i * Math.PI) / 5;
        arc.push([72 * Math.cos(ph), 170 + 56 * Math.sin(ph)]);
      }
      for (const sz of [-1, 1]) {
        for (let i = 0; i < 5; i++) {
          segment(g, wd, [arc[i][0], arc[i][1], sz * 30], [arc[i + 1][0], arc[i + 1][1], sz * 30], 4, 4, 8);
        }
      }
      for (let i = 1; i <= 4; i++) strut(g, wd, arc[i][0], arc[i][1], -34, arc[i][0], arc[i][1], 34, 2.4, { seg: 8 });
      // side lattice panels
      for (const sx of [-1, 1]) {
        for (const y of [95, 135]) box(g, wd, 4, 4, 56, sx * 72, y, 0);
        for (const z of [-18, 0, 18]) box(g, wd, 4, 84, 4, sx * 72, 78, z);
      }
      // integrated bench: slat seat, legs, back rails
      for (const zs of [-13, 1, 15]) box(g, wd, 132, 4.5, 11, 0, 42, zs, { r: 1.5 });
      for (const sx of [-1, 1]) box(g, wd, 7, 42, 34, sx * 58, 0, 1);
      for (const y of [58, 74]) box(g, wd, 132, 9, 4, 0, y, -24);
      // climbing roses: chained vine clusters trailing up the posts and over
      // the arch so they read as one climbing plant per side, with blooms
      const vine = [
        [-70, 62, 20, 10, 41], [-70, 98, 16, 12, 55], [-68, 136, 10, 13, 63],
        [-60, 176, 4, 12, 71], [-42, 214, -4, 13, 79],
        [70, 70, -16, 11, 87], [70, 112, -14, 13, 95], [70, 152, 6, 11, 29], [54, 208, 8, 12, 37]
      ];
      for (const [vx, vy, vz, vr, vs] of vine) {
        foliage(g, '#3d5c26', '#6f9a3c', vx, vy, vz, vr, 3, vs);
      }
      for (const [fx, fy, fz, s] of [[-66, 138, 20, 1], [-46, 218, 4, 2], [58, 214, -2, 3], [72, 114, -20, 4], [-72, 96, 22, 5]]) {
        blob(g, '#b0526e', '#e08aa2', 4.2, fx, fy, fz, { seed: s, detail: 1, amp: 0.12 });
      }
      return g;
    }
  }
];
