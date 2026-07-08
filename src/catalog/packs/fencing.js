import { G, box, cyl, sphere, pyramid, foliage, solid, wood, metal, chrome, netMaterial } from '../builders.js';

// Shared catalog thumbnail for drawable fences: a short section in the palette's
// style. The real 3D run is drawn by buildFenceModel via path.surface:'fence',
// which reads the palette {style,color,post,h}. Mirrors the core path_fence build.
const fenceThumb = (p) => {
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
};

// factory for a drawable path fence item
const drawFence = (id, name, pal) => ({
  id, name, cat: 'yard', w: 240, d: 12, h: pal[0].h, noShadow: true,
  palettes: pal, plan: { type: 'path' },
  path: { mat: 'pavement', width: 12, surface: 'fence' },
  build: (p) => fenceThumb(p)
});

export const FENCING_ITEMS = [
  // ---------------------------------------------------------------------------
  // (A) DRAWABLE PATH FENCES — drag along the plan; buildFenceModel renders them
  // ---------------------------------------------------------------------------
  drawFence('fence_aluminum', 'Black Aluminum Fence', [
    { name: 'Matte Black', chip: '#2e3034', style: 'picket', color: '#2e3034', post: '#26282b', h: 120 },
    { name: 'Bronze', chip: '#4a3d2e', style: 'picket', color: '#4a3d2e', post: '#3a2f24', h: 120 }
  ]),
  drawFence('fence_vinyl_privacy', 'White Vinyl Privacy', [
    { name: 'White Vinyl', chip: '#f2f0ea', style: 'privacy', color: '#f2f0ea', post: '#e4e1d8', h: 185 },
    { name: 'Almond', chip: '#e6dcc6', style: 'privacy', color: '#e6dcc6', post: '#d6cbb2', h: 185 }
  ]),
  drawFence('fence_shadowbox', 'Cedar Shadowbox', [
    { name: 'Natural Cedar', chip: '#9c7a56', style: 'privacy', color: '#9c7a56', post: '#7a5c3c', h: 170 }
  ]),
  drawFence('fence_horizontal', 'Horizontal Slat Modern', [
    { name: 'Charcoal', chip: '#4a4438', style: 'slat', color: '#5a5348', post: '#33352f', h: 150 },
    { name: 'Ipe', chip: '#6a4b32', style: 'slat', color: '#6a4b32', post: '#3a2c1e', h: 150 }
  ]),
  drawFence('fence_splitrail', 'Split Rail Ranch', [
    { name: 'Weathered', chip: '#7a5c3c', style: 'ranch', color: '#7a5c3c', post: '#63492f', h: 110 }
  ]),
  // Chain-link gets a bespoke thumb build: thin round posts + top rail + a
  // translucent woven-mesh panel (netMaterial) instead of horizontal slats.
  // NOTE: drawn RUNS are still rendered by buildFenceModel (arch3d.js), which
  // only knows ranch/slat/picket/privacy — the palette keeps style:'slat' so
  // long runs stay functional until a 'chainlink' style exists there.
  {
    id: 'fence_chainlink', name: 'Galvanized Chain-Link', cat: 'yard', w: 240, d: 12, h: 125, noShadow: true,
    palettes: [
      { name: 'Galvanized', chip: '#aeb2b6', style: 'slat', color: '#aeb2b6', post: '#8f9398', h: 125 }
    ],
    plan: { type: 'path' },
    path: { mat: 'pavement', width: 12, surface: 'fence' },
    build: (p) => {
      p = p || {};
      const g = G();
      const H = p.h || 125;
      const pm = metal(p.post || '#8f9398', 0.35);
      // thin round line posts with dome caps
      for (const x of [-110, 0, 110]) {
        cyl(g, pm, 3, H, x, 0, 0, { seg: 12 });
        sphere(g, pm, 3.6, x, H, 0, { sy: 0.6 });
      }
      // top rail + bottom tension wire
      cyl(g, pm, 2, 220, 0, H - 4, 0, { rz: Math.PI / 2, seg: 10 });
      cyl(g, pm, 0.9, 220, 0, 8, 0, { rz: Math.PI / 2, seg: 8 });
      // woven wire fabric: translucent high-repeat grid between the posts
      box(g, netMaterial('#3a3f44', 7, 3.5), 220, H - 14, 0.4, 0, 6, 0);
      return g;
    }
  },
  drawFence('fence_wrought_run', 'Wrought Iron Fence', [
    { name: 'Wrought Iron', chip: '#24262a', style: 'picket', color: '#24262a', post: '#1c1e21', h: 135 }
  ]),

  // ---------------------------------------------------------------------------
  // (B) GATES & PANELS — placeable items between fence runs (plan type 'fence')
  //     Swing face is along +Z; posts flank at x = +/- w/2.
  // ---------------------------------------------------------------------------
  {
    id: 'gate_garden_single', name: 'Garden Gate', cat: 'yard', w: 100, d: 14, h: 112,
    plan: { type: 'fence' },
    palettes: [
      { name: 'White', chip: '#f2f0ea', color: '#f2f0ea', post: '#e4e1d8' },
      { name: 'Cedar', chip: '#9c7a56', color: '#9c7a56', post: '#7a5c3c' },
      { name: 'Black', chip: '#2c2e31', color: '#2c2e31', post: '#242629' }
    ],
    build: (p) => {
      p = p || {};
      const g = G(), H = 112;
      const wm = solid(p.color || '#f2f0ea', 0.75);
      const pm = solid(p.post || '#e4e1d8', 0.8);
      const irn = metal('#3a3d42', 0.4);
      // posts + caps
      for (const sx of [-48, 48]) {
        box(g, pm, 11, H + 14, 11, sx, 0, 0, { r: 2 });
        pyramid(g, pm, 13, 9, 13, sx, H + 14, 0);
      }
      // leaf: two rails + pointed pickets, set toward the swing face
      box(g, wm, 84, 8, 4, 0, H * 0.24, 3);
      box(g, wm, 84, 8, 4, 0, H * 0.78, 3);
      for (let x = -38; x <= 38; x += 12) {
        box(g, wm, 8, H - 12, 3, x, 4, 3);
        pyramid(g, wm, 8, 7, 3, x, H - 8, 3);
      }
      // hinges + latch
      box(g, irn, 6, 5, 4, -42, H * 0.24, 5.5);
      box(g, irn, 6, 5, 4, -42, H * 0.78, 5.5);
      box(g, irn, 8, 4, 4, 42, H * 0.5, 5.5);
      return g;
    }
  },
  {
    id: 'gate_driveway_double', name: 'Driveway Gate (Double)', cat: 'yard', w: 360, d: 16, h: 155,
    plan: { type: 'fence' },
    palettes: [
      { name: 'Black Iron', chip: '#26282b', color: '#26282b', post: '#1e2023' },
      { name: 'Bronze', chip: '#3f342a', color: '#3f342a', post: '#2e271f' }
    ],
    build: (p) => {
      p = p || {};
      const g = G(), H = 150;
      const im = metal(p.color || '#26282b', 0.4);
      const fm = metal(p.post || '#1e2023', 0.4);
      // heavy posts + ball caps
      for (const sx of [-175, 175]) {
        box(g, fm, 16, H + 22, 16, sx, 0, 0, { r: 2 });
        sphere(g, fm, 10, sx, H + 26, 0);
      }
      // two ornamental leaves meeting at center, bars arching up toward the middle
      for (const s of [-1, 1]) {
        const cx = s * 88;
        box(g, im, 168, 10, 6, cx, H * 0.12, 4);
        box(g, im, 168, 10, 6, cx, H * 0.9, 4);
        box(g, im, 8, H * 0.82, 6, cx - 80, H * 0.1, 4);
        box(g, im, 8, H * 0.82, 6, cx + 80, H * 0.1, 4);
        for (let i = -70; i <= 70; i += 14) {
          const xg = cx + i;
          const barH = H * 0.62 + (1 - Math.min(Math.abs(xg) / 180, 1)) * H * 0.24;
          box(g, im, 5, barH, 5, xg, H * 0.1, 4);
          sphere(g, im, 4, xg, H * 0.1 + barH, 4);
        }
      }
      // outer hinges + center drop-latch
      for (const sy of [H * 0.25, H * 0.75]) {
        box(g, fm, 8, 6, 5, -167, sy, 6);
        box(g, fm, 8, 6, 5, 167, sy, 6);
      }
      box(g, fm, 6, 40, 6, 0, H * 0.1, 6);
      return g;
    }
  },
  {
    id: 'gate_farm_tube', name: 'Farm Tube Gate', cat: 'yard', w: 300, d: 12, h: 114,
    plan: { type: 'fence' },
    palettes: [
      { name: 'Galvanized', chip: '#aeb2b6', color: '#aeb2b6', post: '#8f9398' },
      { name: 'Farm Green', chip: '#3d5c40', color: '#3d5c40', post: '#2c4530' },
      { name: 'Black', chip: '#2c2e31', color: '#2c2e31', post: '#242629' }
    ],
    build: (p) => {
      p = p || {};
      const g = G(), H = 110;
      const tm = metal(p.color || '#aeb2b6', 0.35);
      const pm = metal(p.post || '#8f9398', 0.4);
      // hinge posts
      box(g, pm, 12, H + 16, 12, -146, 0, 0, { r: 2 });
      box(g, pm, 12, H + 16, 12, 146, 0, 0, { r: 2 });
      // vertical end frames of the leaf
      box(g, tm, 6, H - 6, 6, -138, 4, 3);
      box(g, tm, 6, H - 6, 6, 138, 4, 3);
      // 5 horizontal tubes running along x
      for (let k = 0; k < 5; k++) {
        const y = 14 + k * (H - 24) / 4;
        cyl(g, tm, 3, 282, 0, y, 3, { rz: Math.PI / 2, seg: 12 });
      }
      // diagonal brace
      box(g, tm, 301, 5, 5, 0, H * 0.5, 2, { rz: Math.atan2(H - 20, 276) });
      // hinge pins + latch loop
      cyl(g, pm, 4, 12, -142, H * 0.2, 4, { seg: 10 });
      cyl(g, pm, 4, 12, -142, H * 0.8, 4, { seg: 10 });
      cyl(g, tm, 5, 8, 142, H * 0.5, 5, { rz: Math.PI / 2, seg: 10 });
      return g;
    }
  },
  {
    id: 'gate_arched_arbor', name: 'Arched Garden Gate (Arbor)', cat: 'yard', w: 150, d: 44, h: 232,
    plan: { type: 'fence' },
    palettes: [
      { name: 'Cedar', chip: '#9c7a56', color: '#9c7a56', post: '#8a6a48' },
      { name: 'White', chip: '#f2f0ea', color: '#f2f0ea', post: '#e4e1d8' }
    ],
    build: (p) => {
      p = p || {};
      const g = G(), H = 112, AH = 210;
      const wm = wood(p.color || '#9c7a56');
      const gm = wood(p.post || '#8a6a48');
      const irn = metal('#3a3d42', 0.4);
      // 4 arbor posts
      for (const sx of [-66, 66]) for (const sz of [-16, 16]) box(g, wm, 10, AH, 10, sx, 0, sz, { r: 2 });
      // top beams along the run + cross slats forming the arbor roof
      box(g, wm, 150, 8, 8, 0, AH, -16);
      box(g, wm, 150, 8, 8, 0, AH, 16);
      for (let x = -60; x <= 60; x += 15) box(g, wm, 8, 8, 46, x, AH + 4, 0);
      // arched corner brackets (angled struts)
      box(g, wm, 34, 6, 6, -50, AH - 20, -16, { rz: Math.PI / 4 });
      box(g, wm, 34, 6, 6, 50, AH - 20, -16, { rz: -Math.PI / 4 });
      // climbing greenery over the top — small clusters spread along x so the
      // canopy stays inside the arbor's declared 44cm depth
      foliage(g, '#4a7a3a', '#38602c', -40, AH + 8, 0, 18, 7, 3);
      foliage(g, '#4a7a3a', '#38602c', 0, AH + 12, 0, 18, 7, 9);
      foliage(g, '#4a7a3a', '#38602c', 40, AH + 8, 0, 18, 7, 17);
      // the small gate hung on the front face
      box(g, gm, 120, 8, 4, 0, H * 0.22, 16);
      box(g, gm, 120, 8, 4, 0, H * 0.8, 16);
      for (let x = -52; x <= 52; x += 13) {
        box(g, gm, 8, H - 8, 3, x, 4, 16);
        pyramid(g, gm, 8, 6, 3, x, H - 4, 16);
      }
      box(g, irn, 6, 5, 4, -58, H * 0.22, 18);
      box(g, irn, 6, 5, 4, -58, H * 0.8, 18);
      box(g, irn, 8, 4, 4, 58, H * 0.5, 18);
      return g;
    }
  },
  {
    id: 'gate_wrought_iron', name: 'Wrought Iron Gate', cat: 'yard', w: 120, d: 14, h: 142,
    plan: { type: 'fence' },
    palettes: [
      { name: 'Black', chip: '#24262a', color: '#24262a', post: '#1c1e21' },
      { name: 'Antique Bronze', chip: '#3d3226', color: '#3d3226', post: '#2c241b' }
    ],
    build: (p) => {
      p = p || {};
      const g = G(), H = 140;
      const im = metal(p.color || '#24262a', 0.4);
      const pm = metal(p.post || '#1c1e21', 0.4);
      // posts + ball caps
      for (const sx of [-58, 58]) {
        box(g, pm, 12, H + 16, 12, sx, 0, 0, { r: 2 });
        sphere(g, pm, 8, sx, H + 20, 0);
      }
      // frame rails
      for (const y of [H * 0.1, H * 0.55, H * 0.92]) box(g, im, 104, 6, 6, 0, y, 4);
      // spear-topped pickets
      for (let x = -46; x <= 46; x += 11) {
        box(g, im, 4, H - 6, 4, x, 3, 4);
        pyramid(g, im, 7, 9, 7, x, H - 3, 4);
      }
      // small scroll accents mid-height
      for (const sx of [-24, 0, 24]) {
        box(g, im, 18, 4, 4, sx, H * 0.4, 5, { rz: Math.PI / 5 });
        box(g, im, 18, 4, 4, sx, H * 0.4, 5, { rz: -Math.PI / 5 });
      }
      // hinges + latch
      box(g, pm, 7, 6, 4, -52, H * 0.1, 6);
      box(g, pm, 7, 6, 4, -52, H * 0.92, 6);
      box(g, pm, 8, 5, 5, 52, H * 0.5, 6);
      return g;
    }
  },
  {
    id: 'gate_privacy', name: 'Privacy Gate', cat: 'yard', w: 112, d: 14, h: 182,
    plan: { type: 'fence' },
    palettes: [
      { name: 'Cedar', chip: '#9c7a56', color: '#9c7a56', post: '#7a5c3c' },
      { name: 'Gray Wash', chip: '#8a8880', color: '#8a8880', post: '#6f6d66' }
    ],
    build: (p) => {
      p = p || {};
      const g = G(), H = 180;
      const wm = wood(p.color || '#9c7a56');
      const pm = wood(p.post || '#7a5c3c');
      const irn = metal('#3a3d42', 0.4);
      // posts + caps
      for (const sx of [-54, 54]) {
        box(g, pm, 12, H + 14, 12, sx, 0, 0, { r: 2 });
        box(g, pm, 15, 6, 15, sx, H + 14, 0, { r: 1 });
      }
      // frame rails
      for (const y of [H * 0.06, H * 0.5, H * 0.92]) box(g, wm, 96, 8, 5, 0, y, 3);
      // solid vertical boards
      for (let x = -44; x <= 44; x += 14.5) box(g, wm, 14, H - 12, 3, x, 6, 4);
      // top cap rail
      box(g, wm, 100, 6, 8, 0, H - 4, 4, { r: 1 });
      // heavy hinges + handle
      for (const sy of [H * 0.15, H * 0.5, H * 0.85]) box(g, irn, 7, 6, 4, -48, sy, 6);
      box(g, irn, 5, 22, 4, 46, H * 0.5, 6);
      return g;
    }
  },
  {
    id: 'gate_sliding', name: 'Sliding Gate', cat: 'yard', w: 300, d: 16, h: 152,
    plan: { type: 'fence' },
    palettes: [
      { name: 'Matte Black', chip: '#2e3034', color: '#2e3034', post: '#26282b' },
      { name: 'Galvanized', chip: '#aeb2b6', color: '#aeb2b6', post: '#8f9398' }
    ],
    build: (p) => {
      p = p || {};
      const g = G(), H = 150;
      const im = metal(p.color || '#2e3034', 0.4);
      const pm = metal(p.post || '#26282b', 0.4);
      // ground track + receiving post
      box(g, metal('#3a3d42', 0.5), 300, 4, 10, 0, 0, 3);
      box(g, pm, 12, H + 16, 12, 145, 0, -8, { r: 2 });
      // leaf frame
      box(g, im, 272, 8, 6, 0, H * 0.9, 3);
      box(g, im, 272, 8, 6, 0, H * 0.12, 3);
      box(g, im, 8, H * 0.82, 6, -132, H * 0.1, 3);
      box(g, im, 8, H * 0.82, 6, 132, H * 0.1, 3);
      // vertical bars
      for (let x = -120; x <= 120; x += 13) box(g, im, 4, H * 0.78, 4, x, H * 0.12, 3);
      // diagonal brace
      box(g, im, 300, 5, 5, 0, H * 0.5, 2, { rz: Math.atan2(H * 0.78, 264) });
      // rollers riding the track
      cyl(g, chrome(), 7, 6, -85, 6, 3, { rx: Math.PI / 2, seg: 14 });
      cyl(g, chrome(), 7, 6, 85, 6, 3, { rx: Math.PI / 2, seg: 14 });
      return g;
    }
  },
  {
    id: 'fence_corner_post', name: 'Fence Corner Post', cat: 'yard', w: 16, d: 16, h: 132,
    plan: { type: 'fence' },
    palettes: [
      { name: 'White', chip: '#f2f0ea', color: '#f2f0ea' },
      { name: 'Cedar', chip: '#9c7a56', color: '#9c7a56' },
      { name: 'Black', chip: '#2c2e31', color: '#2c2e31' }
    ],
    build: (p) => {
      p = p || {};
      const g = G(), H = 130;
      const pm = solid(p.color || '#f2f0ea', 0.8);
      box(g, pm, 13, H, 13, 0, 0, 0, { r: 1.5 });
      // trim ring, pyramid cap + ball finial
      box(g, pm, 16, 7, 16, 0, H - 18, 0, { r: 1 });
      pyramid(g, pm, 17, 12, 17, 0, H, 0);
      sphere(g, pm, 4.5, 0, H + 14, 0);
      return g;
    }
  },
  {
    id: 'fence_lattice_panel', name: 'Lattice Panel', cat: 'yard', w: 182, d: 8, h: 152,
    plan: { type: 'fence' },
    palettes: [
      { name: 'White', chip: '#f2f0ea', color: '#f2f0ea' },
      { name: 'Cedar', chip: '#9c7a56', color: '#9c7a56' },
      { name: 'Green', chip: '#3d5c40', color: '#3d5c40' }
    ],
    build: (p) => {
      p = p || {};
      const g = G(), H = 150;
      const wm = wood(p.color || '#f2f0ea');
      // outer frame
      box(g, wm, 182, 12, 8, 0, 0, 0);
      box(g, wm, 182, 12, 8, 0, H - 12, 0);
      box(g, wm, 12, H, 8, -85, 0, 0);
      box(g, wm, 12, H, 8, 85, 0, 0);
      // crisscross lattice slats (both diagonals), each clipped to the frame
      // opening so nothing pokes past the stiles or rails
      const X = 80, Y0 = 10, Y1 = H - 10;      // opening half-width / rail span
      for (const dir of [1, -1]) {
        // dir>0 → rz +45° slats along x+y=c; dir<0 → rz −45° slats along x−y=c
        for (let c = -(X + Y1); c <= X + Y1; c += 22) {
          const ya = Math.max(Y0, dir > 0 ? c - X : -X - c);
          const yb = Math.min(Y1, dir > 0 ? c + X : X - c);
          if (yb - ya < 16) continue;
          const yc = (ya + yb) / 2;
          const xc = dir > 0 ? c - yc : yc + c;
          const L = (yb - ya) * Math.SQRT2;
          box(g, wm, 4, L, 3, xc, yc - L / 2, dir > 0 ? 2 : 3, { rz: dir * Math.PI / 4 });
        }
      }
      return g;
    }
  }
];
