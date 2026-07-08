import { G, box, cyl, sphere, prism, foliage, solid, glow, wood, metal, glass, tex, water } from '../builders.js';

// Backyard deck options — platforms, raised decks, railings, stairs & trim.
// All built from primitive helpers; origin at footprint center on the ground;
// +Y up; the "front" faces +Z. Photo deck textures (tex('deck_wood', …) and
// the real_* plank photos) drive the plank look on platforms.

// Reusable decking tones. `mat` (optional) picks a photo texture; otherwise the
// surface is laid as gapped plank boards tinted to `wood`.
const DECK_TONES = [
  { name: 'Composite Gray', chip: '#8f9196', wood: '#8f9196' },
  { name: 'Cedar', chip: '#b0864f', wood: '#b0864f' },
  { name: 'Mahogany', chip: '#7a3b28', wood: '#7a3b28' },
  { name: 'Weathered Gray', chip: '#9a9789', wood: '#9a9789' }
];
const RAIL_TONES = [
  { name: 'Cedar', chip: '#b0864f', wood: '#b0864f' },
  { name: 'White', chip: '#e6e1d5', wood: '#e6e1d5' },
  { name: 'Black', chip: '#33363a', wood: '#33363a' }
];

/** Deck surface + fascia rim. Photo texture when pal.mat is set, else gapped
 *  plank boards tinted to pal.wood. Built with its top sitting at y0+h. */
function deckSurface(g, w, d, h, pal, y0 = 0) {
  const rimHex = pal.rim || (pal.mat ? '#6f543a' : pal.wood || '#6f543a');
  if (pal.mat) {
    const sc = pal.scale || 200;
    const rx = Math.max(1, w / sc), ry = Math.max(1, d / sc);
    box(g, tex(pal.mat, rx, ry), w, h, d, 0, y0, 0, { r: 1 });
  } else {
    box(g, solid('#2b2622', 0.9), w, h * 0.7, d, 0, y0, 0); // dark substrate/gaps
    const pm = wood(pal.wood || '#8a6a4a', 0.6);
    const step = 16.4; // ~15cm plank + gap
    const n = Math.max(1, Math.floor(w / step));
    const start = -((n - 1) * step) / 2;
    for (let i = 0; i < n; i++) {
      box(g, pm, 15, h, d - 2, start + i * step, y0, 0, { r: 0.5 });
    }
  }
  // fascia rim frame slightly proud of the field
  const rim = wood(rimHex, 0.55);
  box(g, rim, w + 6, h + 3, 5, 0, y0, d / 2 + 1.5);
  box(g, rim, w + 6, h + 3, 5, 0, y0, -d / 2 - 1.5);
  box(g, rim, 5, h + 3, d + 6, w / 2 + 1.5, y0, 0);
  box(g, rim, 5, h + 3, d + 6, -w / 2 - 1.5, y0, 0);
}

/** A run of railing: two end posts, top + bottom rail, and `fill` between. */
function railRun(g, len, h, postHex, fill) {
  const post = wood(postHex, 0.6);
  for (const x of [-len / 2 + 4, len / 2 - 4]) box(g, post, 9, h, 9, x, 0, 0);
  box(g, post, len, 8, 9, 0, h - 8, 0);          // top rail
  box(g, post, len - 20, 5, 7, 0, 12, 0);        // bottom rail
  fill(post);
}

export const DECKS_ITEMS = [
  // ---- composite deck platform (drawable, resizable) -----------------------
  {
    id: 'deck_platform', name: 'Composite Deck', cat: 'patio', w: 360, d: 260, h: 13, noShadow: true,
    areaDraw: true,
    palettes: [
      { name: 'Composite Gray', chip: '#8f9196', wood: '#8f9196' },
      { name: 'Deck Boards', chip: '#8a6a4a', mat: 'deck_wood', scale: 200, rim: '#6f543a' },
      { name: 'Caramel Plank', chip: '#a9702f', mat: 'real_caramel_plank', scale: 240, rim: '#7a5230' },
      { name: 'Rustic Espresso', chip: '#4f3b2c', mat: 'real_espresso_rustic', scale: 250, rim: '#3a2c22' },
      { name: 'Weathered Gray', chip: '#9a9789', wood: '#9a9789' }
    ],
    plan: { type: 'slab' },
    build: (p) => { const g = G(); deckSurface(g, 360, 260, 13, p); return g; },
    buildSized: (p, w, d) => { const g = G(); deckSurface(g, w, d, 13, p); return g; }
  },

  // ---- floating low deck (drawable, resizable) -----------------------------
  {
    id: 'deck_floating', name: 'Floating Low Deck', cat: 'patio', w: 340, d: 300, h: 10, noShadow: true,
    areaDraw: true, palettes: DECK_TONES, plan: { type: 'slab' },
    build: (p) => { const g = G(); deckLow(g, 340, 300, p); return g; },
    buildSized: (p, w, d) => { const g = G(); deckLow(g, w, d, p); return g; }
  },

  // ---- raised deck with skirting + stairs ----------------------------------
  {
    id: 'deck_raised', name: 'Raised Deck', cat: 'patio', w: 360, d: 280, h: 100,
    palettes: DECK_TONES, plan: { type: 'slab' },
    build: (p) => {
      const g = G();
      const H = 88;
      const post = wood('#5c4633', 0.7);
      const beam = wood('#6b5238', 0.6);
      // support posts on a grid
      for (const sx of [-1, 0, 1]) for (const sz of [-1, 1]) {
        box(g, post, 12, H - 8, 12, sx * 150, 0, sz * 116);
      }
      // perimeter rim beams under the deck
      for (const sz of [-1, 1]) box(g, beam, 360, 14, 10, 0, H - 22, sz * 130);
      for (const sx of [-1, 1]) box(g, beam, 10, 14, 280, sx * 170, H - 22, 0);
      // deck surface on top
      deckSurface(g, 356, 276, 10, p, H - 10);
      // skirting: vertical slats on the +z face, recessed solid panels elsewhere
      const skirt = wood('#4a3a2c', 0.75);
      for (let x = -168; x <= 168; x += 15) box(g, skirt, 8, H - 24, 3, x, 8, 138);
      for (const sz of [-1, 1]) box(g, solid('#2f2620', 0.9), 340, H - 24, 3, 0, 8, sz * 133);
      for (const sx of [-1, 1]) box(g, solid('#2f2620', 0.9), 3, H - 24, 260, sx * 172, 8, 0);
      // stairs down off the +z side (4 steps)
      const dm = wood(p.wood || '#8a6a4a', 0.6);
      for (let i = 0; i < 4; i++) {
        const top = H - i * 22; const z = 150 + i * 30;
        box(g, solid('#3a2f26', 0.85), 120, 22, 4, 0, top - 22, z + 14); // riser
        box(g, dm, 120, 5, 32, 0, top - 5, z, { r: 0.5 });               // tread
      }
      return g;
    }
  },

  // ---- multi-level deck ----------------------------------------------------
  {
    id: 'deck_multilevel', name: 'Multi-Level Deck', cat: 'patio', w: 420, d: 300, h: 55,
    palettes: DECK_TONES, plan: { type: 'slab' },
    build: (p) => {
      const g = G();
      // upper level (back, +z half) raised on short posts
      const post = wood('#5c4633', 0.7);
      for (const sx of [-1, 1]) for (const z of [10, 130]) box(g, post, 10, 40, 10, sx * 180, 0, z);
      deckSurface(g, 420, 150, 12, p, 40);
      // lower level (front, -z half) at mid height
      for (const sx of [-1, 1]) for (const z of [-130, -10]) box(g, post, 10, 20, 10, sx * 150, 0, z);
      deckSurface(g, 360, 150, 12, p, 20);
      // connecting step between levels
      const dm = wood(p.wood || '#8a6a4a', 0.6);
      box(g, dm, 300, 5, 34, 0, 15, -32, { r: 0.5 });
      return g;
    }
  },

  // ---- pool deck surround --------------------------------------------------
  {
    id: 'deck_pool_surround', name: 'Pool Deck Surround', cat: 'patio', w: 460, d: 360, h: 14, noShadow: true,
    palettes: DECK_TONES, plan: { type: 'slab' },
    build: (p) => {
      const g = G();
      // deck framing a rectangular water opening in the middle
      deckBand(g, 460, 360, 14, p, 0, 0, { hole: { w: 280, d: 180, x: 0, z: 0 } });
      // recessed pool: dark basin + real rippled water surface
      box(g, solid('#1d4a63', 0.4), 280, 6, 180, 0, 0, 0);
      const wt = box(g, water(280), 274, 9, 174, 0, 3, 0);
      wt.receiveShadow = true;
      return g;
    }
  },

  // ---- deck stairs (3 steps) ----------------------------------------------
  {
    id: 'deck_stairs', name: 'Deck Stairs', cat: 'patio', w: 140, d: 120, h: 66,
    palettes: DECK_TONES, plan: { type: 'stairs' },
    build: (p) => {
      const g = G();
      const dm = wood(p.wood || '#8a6a4a', 0.6);
      const riser = solid('#3a2f26', 0.85);
      for (let i = 0; i < 3; i++) {
        const top = (3 - i) * 22; const z = -40 + i * 34;
        box(g, riser, 140, 22, 4, 0, top - 22, z - 15); // riser
        box(g, dm, 140, 5, 36, 0, top - 5, z, { r: 0.5 }); // tread
      }
      // triangular side stringers
      for (const x of [-68, 68]) prism(g, wood('#5c4633', 0.7), 6, 66, 100, x, 0, -6);
      return g;
    }
  },

  // ---- wood baluster railing section --------------------------------------
  {
    id: 'deck_rail_wood', name: 'Wood Deck Railing', cat: 'patio', w: 180, d: 10, h: 100,
    palettes: RAIL_TONES, plan: { type: 'fence' },
    build: (p) => {
      const g = G();
      railRun(g, 180, 100, p.wood, (mat) => {
        for (let x = -78; x <= 78; x += 12) box(g, mat, 4, 78, 4, x, 12, 0);
      });
      return g;
    }
  },

  // ---- glass deck railing --------------------------------------------------
  {
    id: 'deck_rail_glass', name: 'Glass Deck Railing', cat: 'patio', w: 180, d: 10, h: 100,
    palettes: [
      { name: 'Black Posts', chip: '#33363a', wood: '#33363a' },
      { name: 'Silver Posts', chip: '#b8bcc0', wood: '#b8bcc0' },
      { name: 'Cedar Posts', chip: '#b0864f', wood: '#b0864f' }
    ],
    plan: { type: 'fence' },
    build: (p) => {
      const g = G();
      const post = metal(p.wood, 0.4);
      for (const x of [-86, -29, 29, 86]) box(g, post, 7, 100, 7, x, 0, 0);
      box(g, post, 180, 8, 10, 0, 92, 0);           // top rail
      // two tempered glass infill panels
      for (const x of [-57, 57]) box(g, glass(), 108, 78, 3, x, 10, 0);
      return g;
    }
  },

  // ---- cable / steel railing ----------------------------------------------
  {
    id: 'deck_rail_cable', name: 'Cable Deck Railing', cat: 'patio', w: 180, d: 10, h: 100,
    palettes: [
      { name: 'Black Frame', chip: '#33363a', wood: '#33363a' },
      { name: 'Steel', chip: '#b8bcc0', wood: '#b8bcc0' }
    ],
    plan: { type: 'fence' },
    build: (p) => {
      const g = G();
      const frame = metal(p.wood, 0.4);
      const cable = metal('#c9ced4', 0.3);
      for (const x of [-86, 86]) box(g, frame, 8, 96, 8, x, 0, 0);
      box(g, wood('#8a6a4a', 0.6), 180, 9, 11, 0, 92, 0); // wood top cap
      for (let y = 20; y <= 82; y += 10) cyl(g, cable, 0.8, 170, 0, y, 0, { rz: Math.PI / 2, seg: 8 });
      return g;
    }
  },

  // ---- corner post + post-cap light ---------------------------------------
  {
    id: 'deck_post_light', name: 'Post Cap Light', cat: 'patio', w: 16, d: 16, h: 102,
    palettes: [
      { name: 'Cedar', chip: '#b0864f', wood: '#b0864f' },
      { name: 'Black', chip: '#33363a', wood: '#33363a' },
      { name: 'White', chip: '#e6e1d5', wood: '#e6e1d5' }
    ],
    plan: { type: 'box' },
    light: { y: 96, color: '#ffe6b4', intensity: 0.7, distance: 220 },
    build: (p) => {
      const g = G();
      box(g, wood(p.wood, 0.6), 12, 90, 12, 0, 0, 0);       // 4x4 post
      box(g, metal('#8a9096', 0.4), 15, 4, 15, 0, 90, 0, { r: 1 }); // cap base
      box(g, glow('#ffe6b4', 1.1), 11, 8, 11, 0, 94, 0);    // glowing lens
      box(g, metal('#8a9096', 0.4), 13, 3, 13, 0, 102, 0, { r: 1 }); // cap top
      return g;
    }
  },

  // ---- built-in deck bench -------------------------------------------------
  {
    id: 'deck_bench', name: 'Built-in Deck Bench', cat: 'patio', w: 170, d: 48, h: 84,
    palettes: DECK_TONES, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const dm = wood(p.wood || '#8a6a4a', 0.6);
      const leg = wood('#5c4633', 0.7);
      // legs / supports
      for (const x of [-72, 72]) { box(g, leg, 8, 42, 44, x, 0, 0); }
      // seat slats
      for (let z = -18; z <= 18; z += 12) box(g, dm, 170, 5, 10, 0, 42, z, { r: 0.5 });
      // back slats
      for (let y = 52; y <= 78; y += 9) box(g, dm, 170, 6, 5, 0, y, -20);
      for (const x of [-72, 72]) box(g, leg, 7, 44, 7, x, 40, -20); // back posts
      return g;
    }
  },

  // ---- deck planter box ----------------------------------------------------
  {
    id: 'deck_planter', name: 'Deck Planter Box', cat: 'patio', w: 90, d: 42, h: 58,
    palettes: DECK_TONES, plan: { type: 'plant' },
    build: (p) => {
      const g = G();
      const dm = wood(p.wood || '#8a6a4a', 0.6);
      // slatted box walls
      for (const sz of [-1, 1]) box(g, dm, 90, 44, 4, 0, 6, sz * 19);
      for (const sx of [-1, 1]) box(g, dm, 4, 44, 42, sx * 43, 6, 0);
      box(g, dm, 92, 5, 44, 0, 46, 0, { r: 1 }); // top cap rail
      box(g, solid('#3a2c20', 0.95), 82, 6, 34, 0, 40, 0); // soil
      // trailing foliage
      foliage(g, '#3d5a2e', '#7ba05a', 0, 46, 0, 32, 12, 5);
      foliage(g, '#4a6a34', '#8bb060', -26, 44, 6, 20, 8, 11);
      foliage(g, '#3d5a2e', '#7ba05a', 28, 44, -6, 22, 8, 21);
      return g;
    }
  },

  // ---- pergola over deck ---------------------------------------------------
  {
    id: 'deck_pergola', name: 'Deck with Pergola', cat: 'patio', w: 340, d: 320, h: 246,
    palettes: DECK_TONES, plan: { type: 'pergola' },
    build: (p) => {
      const g = G();
      // deck platform base
      deckSurface(g, 340, 320, 12, p, 0);
      const wd = wood('#6b5238', 0.7);
      // four posts + double beams both ways + slat roof
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, wd, 14, 222, 14, sx * 150, 12, sz * 145);
      for (const sz of [-1, 1]) box(g, wd, 340, 14, 9, 0, 224, sz * 145);
      for (const sx of [-1, 1]) box(g, wd, 9, 14, 320, sx * 150, 232, 0);
      for (let x = -150; x <= 150; x += 26) box(g, wd, 6, 8, 316, x, 240, 0);
      return g;
    }
  },

  // ---- hot-tub deck platform ----------------------------------------------
  {
    id: 'deck_hottub', name: 'Hot Tub Deck', cat: 'patio', w: 320, d: 300, h: 62,
    palettes: DECK_TONES, plan: { type: 'slab' },
    build: (p) => {
      const g = G();
      const H = 50;
      const post = wood('#5c4633', 0.7);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, post, 12, H - 6, 12, sx * 140, 0, sz * 128);
      // skirting band
      box(g, solid('#3a2f26', 0.85), 320, H - 8, 4, 0, 4, 145);
      box(g, solid('#3a2f26', 0.85), 320, H - 8, 4, 0, 4, -145);
      // deck surface RAISED onto the platform, with a square tub opening
      const band = G();
      deckBand(band, 320, 300, 12, p, 0, 0, { hole: { w: 150, d: 150, x: 70, z: 0 } });
      band.position.y = H - 12;
      g.add(band);
      // sunken hot tub filling the opening, brim proud of the deck
      const cx = 70;
      box(g, solid('#2b2d31', 0.6), 150, H, 150, cx, 0, 0);      // shell
      box(g, tex('tile_white', 0.8, 0.8), 138, H - 2, 138, cx, 2, 0);
      box(g, solid('#1d4a63', 0.4), 132, H - 1, 132, cx, 3, 0);  // dark basin tint
      const wt = box(g, water(150), 130, H, 130, cx, 4, 0);
      wt.receiveShadow = true;
      // a few jets / bubbles at the water surface
      for (const jz of [-40, 0, 40]) sphere(g, glow('#dff2f6', 0.3), 4, cx, H + 3, jz, { seg: 8 });
      return g;
    }
  },

  // ---- lattice skirting panel ---------------------------------------------
  {
    id: 'deck_lattice', name: 'Deck Skirting Lattice', cat: 'patio', w: 122, d: 6, h: 80,
    palettes: [
      { name: 'Cedar', chip: '#b0864f', wood: '#b0864f' },
      { name: 'White', chip: '#e6e1d5', wood: '#e6e1d5' },
      { name: 'Weathered', chip: '#9a9789', wood: '#9a9789' }
    ],
    plan: { type: 'fence' },
    build: (p) => {
      const g = G();
      const fr = wood(p.wood, 0.6);
      // outer frame
      box(g, fr, 122, 6, 6, 0, 0, 0);
      box(g, fr, 122, 6, 6, 0, 74, 0);
      for (const x of [-58, 58]) box(g, fr, 6, 74, 6, x, 6, 0);
      // criss-cross lattice slats, clipped to stay inside the frame
      const slat = wood(p.wood, 0.65);
      for (const a of [0.72, -0.72]) {
        const dx = -Math.sin(a), dy = Math.cos(a);
        for (let i = -8; i <= 8; i++) {
          const xc = i * 12;                       // slat centerline at mid-height
          const t1 = (56 - xc) / dx, t2 = (-56 - xc) / dx;
          const tP = Math.min(Math.max(t1, t2), 33 / dy);
          const tM = Math.max(Math.min(t1, t2), -33 / dy);
          if (tP - tM < 12) continue;
          const L = tP - tM, tMid = (tP + tM) / 2;
          box(g, slat, 3, L, 2.5, xc + dx * tMid, 40 + dy * tMid - L / 2, a > 0 ? 1.2 : -1.2,
            { rz: a });
        }
      }
      return g;
    }
  }
];

// ---- low platform: minimal-rim floating deck --------------------------------
function deckLow(g, w, d, pal) {
  box(g, solid('#3a322a', 0.9), w - 8, 5, d - 8, 0, 0, 0); // low joist frame
  deckSurface(g, w, d, 8, pal, 5);
}

// ---- deck band placed at (cx,cz), optional rectangular hole -----------------
function deckBand(g, w, d, h, pal, cx, cz, opts = {}) {
  const sub = G();
  if (opts.hole) {
    const { w: hw, d: hd, x: hx, z: hz } = opts.hole;
    // build four sub-bands framing the hole
    const left = -w / 2, right = w / 2, top = d / 2, bot = -d / 2;
    const hL = hx - hw / 2, hR = hx + hw / 2, hT = hz + hd / 2, hB = hz - hd / 2;
    // top strip (+z), bottom strip (-z), then left/right of the hole
    bandRect(sub, pal, h, left, right, hT, top, 0, 0);
    bandRect(sub, pal, h, left, right, bot, hB, 0, 0);
    bandRect(sub, pal, h, left, hL, hB, hT, 0, 0);
    bandRect(sub, pal, h, hR, right, hB, hT, 0, 0);
  } else {
    deckSurface(sub, w, d, h, pal, 0);
  }
  sub.position.set(cx, 0, cz);
  g.add(sub);
}

// helper: a rectangular deck strip spanning [x0,x1]×[z0,z1]
function bandRect(g, pal, h, x0, x1, z0, z1, ox, oz) {
  const w = x1 - x0, d = z1 - z0;
  if (w <= 1 || d <= 1) return;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const sub = G();
  deckSurface(sub, w, d, h, pal, 0);
  sub.position.set(cx, 0, cz);
  g.add(sub);
}
