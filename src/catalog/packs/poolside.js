// Poolside gear & pool floats — playful outdoor pack.
// Built only from primitive helpers; no external assets, no THREE import.
import { G, box, cyl, sphere, pyramid, legs4, shade, solid, wood, metal, chrome, glass, glow, netMaterial, torus, segment } from '../builders.js';

// small deterministic RNG factory for scattered detail (sprinkles, etc.)
const rng = (seed) => {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
};

// Smooth tapered chain through [x,y,z,r] points: segments whose radii blend,
// with matching joint spheres so the elbows round off (no visible balls).
function chain(g, mat, pts) {
  sphere(g, mat, pts[0][3], pts[0][0], pts[0][1], pts[0][2], { seg: 14 });
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    segment(g, mat, [a[0], a[1], a[2]], [b[0], b[1], b[2]], a[3], b[3], 14);
    sphere(g, mat, b[3], b[0], b[1], b[2], { seg: 14 });
  }
}

export const POOLSIDE_ITEMS = [
  // ---------------------------------------------------------------- FLOATS ---
  {
    id: 'float_donut', name: 'Donut Float', cat: 'outdoor', w: 118, d: 118, h: 38, noShadow: true,
    palettes: [
      { name: 'Strawberry', chip: '#f2a0c0', body: '#f7d9c4', glaze: '#ef7fae' },
      { name: 'Chocolate', chip: '#7a4a30', body: '#e7c9a8', glaze: '#6f4327' },
      { name: 'Blue Raspberry', chip: '#5fc7e8', body: '#f2ddc4', glaze: '#4fbfe6' }
    ],
    plan: { type: 'rugRound' },
    build: (p) => {
      const g = G();
      const dough = solid(p.body, 0.7);
      const glaze = solid(p.glaze, 0.55);
      // fried ring — one real smooth torus
      torus(g, dough, 40, 17, 0, 17, 0, { seg: 48, tubeSeg: 20 });
      // frosting cap: a slightly fatter, vertically squashed torus riding the
      // upper half so it reads as a poured glaze band with a proud edge
      torus(g, glaze, 40, 18.5, 0, 22, 0, { seg: 48, tubeSeg: 16, sz: 0.7 });
      // a dozen sprinkles resting on the glaze
      const r = rng(7);
      const cols = ['#ef4b4b', '#f4d03f', '#3ba7e6', '#4fbf6a', '#ffffff', '#c56bd6'];
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + r() * 0.4;
        const rad = 40 + (r() - 0.5) * 16;
        box(g, solid(cols[i % cols.length], 0.5), 5, 1.6, 1.8,
          Math.cos(a) * rad, 32.5 - Math.abs(rad - 40) * 0.3, Math.sin(a) * rad,
          { ry: r() * Math.PI });
      }
      return g;
    }
  },
  {
    id: 'float_flamingo', name: 'Flamingo Float', cat: 'outdoor', w: 96, d: 168, h: 92, noShadow: true,
    palettes: [
      { name: 'Pink', chip: '#f27ba0', body: '#f27ba0' },
      { name: 'Coral', chip: '#f5885f', body: '#f5885f' }
    ],
    plan: { type: 'rugRound' },
    build: (p) => {
      const g = G();
      const pink = solid(p.body, 0.6);
      // inflatable ring base the rider sits in
      torus(g, pink, 34, 13, 0, 13, 0, { seg: 44, tubeSeg: 16, sy: 1.25 });
      // massed body: overlapping spheres so the union reads as one smooth form
      sphere(g, pink, 26, 0, 30, -6, { sx: 1.05, sy: 0.8, sz: 1.5, seg: 20 });  // body core
      sphere(g, pink, 20, 0, 28, 28, { sz: 1.1, seg: 18 });                     // chest
      // kicked-up tail feathers
      segment(g, pink, [0, 34, -38], [0, 56, -60], 10, 3, 12);
      segment(g, pink, [0, 32, -42], [0, 48, -64], 8, 2.5, 12);
      // wing hints: flattened spheres hugging the flanks
      for (const s of [-1, 1]) {
        sphere(g, pink, 17, s * 21, 33, -8, { sx: 0.5, sy: 0.65, sz: 1.45, seg: 16 });
        sphere(g, pink, 12, s * 25, 28, 0, { sx: 0.4, sy: 0.55, sz: 1.2, seg: 14 });
      }
      // smooth S-curve neck: tapered segment chain, radii blending
      chain(g, pink, [
        [0, 32, 38, 9.2], [0, 50, 54, 8.2], [0, 66, 60, 7.2],
        [0, 78, 56, 6.5], [0, 86, 46, 6]
      ]);
      // head elongated toward the bill
      sphere(g, pink, 9.5, 0, 87, 41, { sz: 1.2, seg: 18 });
      for (const s of [-1, 1]) sphere(g, solid('#1c1c1e', 0.4), 1.9, s * 6, 90, 45, { seg: 10 });
      // downcurved bill, pale base with a black tip
      segment(g, solid('#f2ddd2', 0.5), [0, 86, 49], [0, 79, 57], 4.2, 2.6, 12);
      segment(g, solid('#1c1c1e', 0.4), [0, 79, 57], [0, 73, 60], 2.6, 1.1, 10);
      return g;
    }
  },
  {
    id: 'float_swan', name: 'Swan Float', cat: 'outdoor', w: 96, d: 168, h: 96, noShadow: true,
    palettes: null,
    plan: { type: 'rugRound' },
    build: () => {
      const g = G();
      const white = solid('#f4f4f2', 0.6);
      // inflatable ring base
      torus(g, white, 34, 13, 0, 13, 0, { seg: 44, tubeSeg: 16, sy: 1.25 });
      // massed body
      sphere(g, white, 28, 0, 30, -4, { sy: 0.85, sz: 1.6, seg: 20 });   // body core
      sphere(g, white, 20, 0, 32, 30, { sz: 1.05, seg: 18 });            // breast
      // raised folded wings sweeping up toward the tail
      for (const s of [-1, 1]) {
        sphere(g, white, 20, s * 19, 38, -12, { sx: 0.45, sy: 0.85, sz: 1.5, seg: 16 });
        sphere(g, white, 14, s * 14, 50, -30, { sx: 0.36, sy: 0.7, sz: 1.2, seg: 14 });
      }
      // upswept pointed tail
      segment(g, white, [0, 36, -42], [0, 58, -62], 9, 2.5, 12);
      // tall smooth S-neck: tapered segment chain
      chain(g, white, [
        [0, 36, 36, 8.5], [0, 56, 46, 7.5], [0, 72, 46, 6.8],
        [0, 84, 38, 6.2], [0, 92, 28, 5.8]
      ]);
      // head + orange bill with the black basal knob
      sphere(g, white, 8.5, 0, 93, 23, { sz: 1.2, seg: 18 });
      for (const s of [-1, 1]) sphere(g, solid('#1c1c1e', 0.4), 1.6, s * 4.6, 95.5, 27, { seg: 10 });
      segment(g, solid('#e8862e', 0.5), [0, 92, 30], [0, 89, 42], 3.4, 1.3, 12);
      sphere(g, solid('#1c1c1e', 0.5), 2.8, 0, 94, 30.5, { seg: 10 });
      return g;
    }
  },
  {
    id: 'float_ring', name: 'Inner Tube', cat: 'outdoor', w: 108, d: 108, h: 30, noShadow: true,
    palettes: [
      { name: 'Aqua', chip: '#33bcd6', body: '#33bcd6' },
      { name: 'Lime', chip: '#8bd142', body: '#8bd142' },
      { name: 'Sunset', chip: '#f5883f', body: '#f5883f' }
    ],
    plan: { type: 'rings' },
    build: (p) => {
      const g = G();
      const mat = solid(p.body, 0.5);
      const accent = solid('#f4f4f2', 0.5);
      // one real smooth torus tube
      torus(g, mat, 39, 15, 0, 15, 0, { seg: 48, tubeSeg: 18 });
      // white sticker stripes wrapping the top of the tube
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + 0.4;
        box(g, accent, 9, 1.6, 20, Math.cos(a) * 39, 29.2, Math.sin(a) * 39, { r: 0.8, ry: -a });
      }
      // inflation valve on the inner shoulder
      cyl(g, solid('#2b2d31', 0.5), 2.2, 4, 0, 27, -26, { seg: 10 });
      return g;
    }
  },
  {
    id: 'float_raft', name: 'Lounger Raft', cat: 'outdoor', w: 82, d: 194, h: 22, noShadow: true,
    palettes: [
      { name: 'Turquoise', chip: '#2fb6c4', body: '#2fb6c4' },
      { name: 'Mango', chip: '#f2a13c', body: '#f2a13c' },
      { name: 'Berry', chip: '#c85a9a', body: '#c85a9a' }
    ],
    plan: { type: 'rugRound' },
    build: (p) => {
      const mat = solid(p.body, 0.55);
      const g = G();
      box(g, mat, 78, 16, 190, 0, 0, 0, { r: 12, seg: 4 });         // mattress body
      for (let z = -78; z <= 66; z += 24) cyl(g, mat, 5, 76, 0, 15, z, { rz: Math.PI / 2, seg: 12 }); // ribs
      box(g, mat, 74, 14, 34, 0, 15, 74, { r: 10, seg: 4 });        // pillow end
      return g;
    }
  },
  {
    id: 'float_beachball', name: 'Beach Ball', cat: 'outdoor', w: 42, d: 42, h: 42,
    palettes: null,
    plan: { type: 'rings' },
    build: () => {
      const g = G();
      sphere(g, solid('#f6f6f4', 0.45), 20, 0, 21, 0);              // white core
      const cols = ['#e23b3b', '#f2c53d', '#3b7fe2', '#3bb35a', '#e8852a'];
      cols.forEach((c, i) => {
        const sub = G();
        sub.position.set(0, 21, 0);
        sub.rotation.y = (i * Math.PI) / cols.length;
        sphere(sub, solid(c, 0.45), 20.4, 0, 0, 0, { sz: 0.17 });   // longitudinal gore
        g.add(sub);
      });
      sphere(g, solid('#f6f6f4', 0.45), 4, 0, 41, 0, { sy: 0.6 });  // pole cap
      return g;
    }
  },
  {
    id: 'float_drink_tray', name: 'Floating Drink Tray', cat: 'outdoor', w: 54, d: 54, h: 16, noShadow: true,
    palettes: null,
    plan: { type: 'rugRound' },
    build: () => {
      const g = G();
      cyl(g, solid('#f2d24a', 0.5), 26, 8, 0, 0, 0, { seg: 28 });   // yellow float disc
      cyl(g, solid('#e6b800', 0.6), 20, 2, 0, 8, 0, { seg: 28 });   // recessed deck
      for (const [x, z] of [[-11, 0], [11, 0]]) {
        cyl(g, solid('#c99a00', 0.6), 6, 6, x, 4, z, { seg: 16 });  // cup holder wells
        cyl(g, solid('#2f2f33', 0.9), 5, 5.5, x, 4.4, z, { seg: 16 });
      }
      cyl(g, solid('#d94f4f', 0.4), 4.5, 12, -11, 9, 0, { seg: 14 }); // red can
      cyl(g, glass(), 4.5, 12, 11, 9, 0, { rTop: 5, seg: 14 });       // glass
      cyl(g, solid('#9ad14a', 0.5), 2.5, 1.5, 11, 21, 0, { seg: 10 }); // lime wedge
      return g;
    }
  },

  // -------------------------------------------------------------- LOUNGING ---
  {
    id: 'pool_chaise', name: 'Chaise Lounge', cat: 'outdoor', w: 66, d: 202, h: 96,
    palettes: [
      { name: 'Teal', chip: '#2f9aa8', fab: '#2f9aa8' },
      { name: 'Navy', chip: '#2c3e60', fab: '#2c3e60' },
      { name: 'Cream', chip: '#e6ddc8', fab: '#e6ddc8' }
    ],
    plan: { type: 'lounger' },
    build: (p) => {
      const g = G();
      const frame = metal('#d7dade', 0.35);
      const fab = solid(p.fab, 0.85);
      // side rails + tapered legs + wheels at the head end
      for (const sx of [-1, 1]) {
        box(g, frame, 4, 4, 196, sx * 29, 34, 0, { r: 2 });
        box(g, frame, 4, 34, 4, sx * 29, 0, 62);
        cyl(g, solid('#2a2d31', 0.6), 7, 5, sx * 29, 5, -88, { rz: Math.PI / 2, seg: 14 }); // wheel
        box(g, frame, 4, 20, 4, sx * 29, 36, 84, { rx: -0.5 });      // armrest riser
        box(g, frame, 4, 4, 40, sx * 29, 54, 92, { rx: 0.2 });       // armrest
      }
      box(g, fab, 56, 5, 120, 0, 36, -18, { r: 3, seg: 4 });         // seat pad
      box(g, fab, 56, 5, 78, 0, 60, 68, { r: 3, seg: 4, rx: -0.7 }); // raised adjustable back
      box(g, frame, 50, 3, 4, 0, 40, 108, { rx: -0.7 });             // back support bar
      cyl(g, solid('#f2f0ea', 0.9), 9, 40, 0, 66, 82, { rz: Math.PI / 2, seg: 14 }); // rolled towel
      return g;
    }
  },
  {
    id: 'pool_double_lounger', name: 'Double Sun Lounger', cat: 'outdoor', w: 156, d: 200, h: 74,
    palettes: [
      { name: 'Slate', chip: '#586066', fab: '#586066' },
      { name: 'Sand', chip: '#d8c9a8', fab: '#d8c9a8' }
    ],
    plan: { type: 'lounger' },
    build: (p) => {
      const g = G();
      const frame = wood('#7a5a3c', 0.7);
      const fab = solid(p.fab, 0.85);
      for (const sx of [-1, 1]) {
        box(g, frame, 6, 6, 194, sx * 74, 30, 0);
        box(g, frame, 6, 30, 6, sx * 74, 0, -84);
        box(g, frame, 6, 30, 6, sx * 74, 0, 84);
      }
      box(g, frame, 148, 6, 6, 0, 30, -84);
      box(g, frame, 148, 6, 6, 0, 30, 84);
      for (const sx of [-1, 1]) {
        box(g, fab, 68, 6, 122, sx * 40, 36, -22, { r: 3, seg: 4 });     // seat pads
        box(g, fab, 68, 6, 72, sx * 40, 56, 62, { r: 3, seg: 4, rx: -0.62 }); // backs
        box(g, fab, 60, 8, 20, sx * 40, 42, 78, { r: 5, seg: 4 });        // headrest pillow
      }
      box(g, wood('#6a4c30', 0.6), 18, 12, 40, 0, 33, 60, { r: 2 });      // center drink shelf
      return g;
    }
  },
  {
    id: 'pool_cabana', name: 'Cabana Daybed', cat: 'outdoor', w: 214, d: 208, h: 216,
    palettes: [
      { name: 'White Linen', chip: '#eae4d6', drape: '#eae4d6', cushion: '#d9cbb0' },
      { name: 'Cabana Stripe', chip: '#2f7d9c', drape: '#e8ecee', cushion: '#2f7d9c' }
    ],
    plan: { type: 'patioset' },
    build: (p) => {
      const g = G();
      const rattan = wood('#8a6a46', 0.75);
      const cushion = solid(p.cushion, 0.85);
      const drape = solid(p.drape, 0.9);
      box(g, rattan, 200, 30, 194, 0, 0, 0, { r: 8, seg: 4 });        // bed base
      box(g, cushion, 188, 16, 182, 0, 30, 0, { r: 8, seg: 4 });      // mattress
      // curved back + side bolsters
      box(g, cushion, 188, 46, 20, 0, 46, -84, { r: 10, seg: 4 });
      for (const sx of [-1, 1]) box(g, cushion, 20, 34, 150, sx * 88, 46, 12, { r: 8, seg: 4 });
      for (const sx of [-1, 1]) box(g, solid('#c85a6a', 0.85), 44, 22, 22, sx * 50, 50, 60, { r: 10, seg: 4 }); // throw pillows
      // 4 posts + flat canopy
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, rattan, 9, 168, 9, sx * 96, 30, sz * 92);
      box(g, wood('#7a5a3c', 0.6), 224, 12, 216, 0, 198, 0, { r: 4 }); // canopy roof
      // corner drapes
      for (const sx of [-1, 1]) box(g, drape, 6, 150, 40, sx * 100, 48, -92, { r: 2 });
      return g;
    }
  },

  // ------------------------------------------------------- UMBRELLAS & SETS ---
  {
    id: 'pool_umbrella', name: 'Pool Umbrella', cat: 'outdoor', w: 300, d: 300, h: 262,
    palettes: [
      { name: 'Sunny', chip: '#f2b134', canopy: '#f2b134' },
      { name: 'Aqua', chip: '#2fa8bf', canopy: '#2fa8bf' },
      { name: 'Coral', chip: '#e8705a', canopy: '#e8705a' }
    ],
    plan: { type: 'umbrella' },
    build: (p) => {
      const g = G();
      const pole = chrome();
      cyl(g, solid('#3a3d42', 0.6), 34, 12, 0, 0, 0, { seg: 28 });    // weighted base
      cyl(g, solid('#54585e', 0.5), 26, 6, 0, 12, 0, { seg: 28 });
      cyl(g, pole, 4, 236, 0, 6, 0);                                   // mast
      shade(g, p.canopy, 148, 10, 46, 0, 208, 0);                      // canopy shell
      cyl(g, solid('#f6f6f2', 0.7), 4.5, 8, 0, 250, 0, { seg: 12 });   // finial
      // scalloped valance + ribs
      const dark = solid(p.canopy, 0.85);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        box(g, dark, 3, 2.5, 148, Math.cos(a) * 74, 214, Math.sin(a) * 74, { ry: -a, rx: 0.3 });
        sphere(g, dark, 6, Math.cos(a) * 146, 206, Math.sin(a) * 146, { sy: 0.6 });
      }
      return g;
    }
  },
  {
    id: 'pool_bistro', name: 'Bistro Umbrella Set', cat: 'outdoor', w: 200, d: 200, h: 232,
    palettes: null,
    plan: { type: 'patioset' },
    build: () => {
      const g = G();
      const iron = solid('#33352f', 0.6);
      cyl(g, iron, 3, 72, 0, 0, 0);                                    // table pedestal
      cyl(g, iron, 22, 3, 0, 0, 0, { seg: 20 });
      cyl(g, solid('#e8e4da', 0.5), 44, 4, 0, 72, 0, { seg: 28 });     // round tabletop
      cyl(g, chrome(), 2.4, 158, 0, 76, 0);                           // umbrella mast
      shade(g, '#c14a3a', 96, 8, 34, 0, 196, 0);                       // canopy
      for (const a of [0.9, 2.4, 3.9, 5.4]) {                          // 4 chairs
        const cx = Math.cos(a) * 78, cz = Math.sin(a) * 78, f = Math.atan2(-cz, -cx);
        box(g, iron, 38, 4, 38, cx, 44, cz, { r: 3, ry: -f });
        box(g, iron, 4, 40, 36, cx - Math.cos(f) * 17, 46, cz - Math.sin(f) * 17, { r: 3, ry: -f });
        for (const lx of [-1, 1]) for (const lz of [-1, 1]) box(g, iron, 3, 44, 3, cx + lx * 15, 0, cz + lz * 15);
      }
      return g;
    }
  },
  {
    id: 'pool_bar', name: 'Tiki Pool Bar', cat: 'outdoor', w: 250, d: 130, h: 236,
    palettes: null,
    plan: { type: 'patioset' },
    build: () => {
      const g = G();
      const bamboo = wood('#b89358', 0.75);
      const dark = wood('#6a4a2c', 0.7);
      // counter body + top + footrest
      box(g, bamboo, 200, 96, 46, 0, 0, -18, { r: 4 });
      for (let x = -92; x <= 92; x += 16) box(g, dark, 4, 96, 4, x, 0, 4);  // bamboo facing slats
      box(g, dark, 214, 8, 58, 0, 96, -14, { r: 3 });                        // bar top
      cyl(g, metal('#9aa0a6', 0.35), 3, 200, 0, 12, 22, { rz: Math.PI / 2 }); // foot rail
      // corner posts + thatch hip roof
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, dark, 5, 100, sx * 100, 104, sz * 40);
      pyramid(g, solid('#a9803f', 0.95), 260, 46, 150, 0, 190, -8);
      pyramid(g, solid('#8a6631', 0.95), 200, 22, 110, 0, 208, -8);
      // hanging lantern
      cyl(g, dark, 1, 20, 0, 168, 40);
      sphere(g, glow('#ff9a3c', 0.9), 8, 0, 160, 40, { seg: 12 });
      // two stools facing the bar
      for (const sx of [-1, 1]) {
        cyl(g, solid('#c85a3a', 0.6), 15, 6, sx * 55, 62, 44, { seg: 18 });
        cyl(g, metal('#9aa0a6', 0.35), 3, 62, sx * 55, 0, 44);
        cyl(g, metal('#9aa0a6', 0.35), 12, 2, sx * 55, 20, 44, { seg: 16 });
      }
      return g;
    }
  },

  // -------------------------------------------------------- POOLSIDE FIXTURES ---
  {
    id: 'pool_diving_board', name: 'Diving Board', cat: 'outdoor', w: 54, d: 262, h: 58,
    palettes: null,
    plan: { type: 'box' },
    build: () => {
      const g = G();
      const metalM = metal('#9aa0a6', 0.4);
      box(g, solid('#8a8f96', 0.7), 54, 20, 60, 0, 0, -100, { r: 4 });  // concrete footing
      for (const sx of [-1, 1]) box(g, metalM, 6, 40, 6, sx * 18, 20, -108); // stanchions
      cyl(g, chrome(), 6, 46, 0, 40, -78, { rz: Math.PI / 2, seg: 16 }); // fulcrum roller
      // springboard plank tilting slightly toward the water (+Z)
      box(g, solid('#e9ecef', 0.6), 46, 7, 240, 0, 42, 26, { r: 3, rx: 0.03 });
      box(g, solid('#c8cbcf', 0.85), 42, 1.5, 90, 0, 46, 84, { rx: 0.03 }); // non-slip grip pad
      for (const sx of [-1, 1]) box(g, chrome(), 3, 22, 70, sx * 22, 46, -70, { r: 1.5 }); // side handrails
      return g;
    }
  },
  {
    id: 'pool_slide', name: 'Pool Slide', cat: 'outdoor', w: 112, d: 288, h: 202,
    palettes: [
      { name: 'Blue', chip: '#2f7fd6', body: '#2f7fd6' },
      { name: 'Green', chip: '#37a85a', body: '#37a85a' }
    ],
    plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const plastic = solid(p.body, 0.5);
      const steel = metal('#b8bcc2', 0.4);
      // support legs + platform at the back (-Z, high)
      for (const sx of [-1, 1]) {
        box(g, steel, 6, 150, 6, sx * 40, 0, -120);
        box(g, steel, 6, 90, 6, sx * 40, 0, -60, { rx: 0.16 });
      }
      for (let i = 0; i < 5; i++) box(g, steel, 74, 4, 5, 0, 22 + i * 26, -120); // ladder rungs
      box(g, plastic, 88, 8, 60, 0, 150, -104, { r: 4 });                        // top platform
      // curved chute — quarter-arc of tilted segments
      for (let i = 0; i <= 6; i++) {
        const t = i / 6;
        const y = 22 + 128 * Math.cos(t * Math.PI / 2);
        const z = -104 + 190 * Math.sin(t * Math.PI / 2);
        const rx = t * Math.PI * 0.42;
        box(g, plastic, 66, 8, 46, 0, y, z, { r: 6, seg: 3, rx });
        for (const sx of [-1, 1]) box(g, plastic, 8, 22, 46, sx * 33, y + 8, z, { r: 3, rx }); // side rails
      }
      cyl(g, plastic, 34, 8, 0, 4, 92, { seg: 24, sz: 0.7 });                     // splash runout lip
      return g;
    }
  },
  {
    id: 'pool_ladder', name: 'Pool Ladder', cat: 'outdoor', w: 56, d: 52, h: 122,
    palettes: null,
    plan: { type: 'box' },
    build: () => {
      const g = G();
      const rail = chrome();
      // two rails: down into the pool (front, +Z) and curved handrails rising back
      for (const sx of [-1, 1]) {
        cyl(g, rail, 2.6, 118, sx * 22, 0, 14);                        // handrail uprights
        cyl(g, rail, 2.6, 24, sx * 22, 118, 14, { rx: 0.9 });          // curved handrail top
        cyl(g, rail, 2.6, 60, sx * 22, 0, -14, { rx: -0.12 });         // rear leg on deck
      }
      cyl(g, rail, 2.6, 44, 0, 118, 6, { rz: Math.PI / 2, seg: 14 });  // top cross-brace
      for (let i = 0; i < 4; i++) {                                    // steps descending into water
        box(g, solid('#dfe3e6', 0.5), 42, 3, 9, 0, 30 - i * 12, 14 + i * 4, { r: 2 });
      }
      for (const sx of [-1, 1]) sphere(g, solid('#3a3d42', 0.6), 4, sx * 22, 0, -14, { sy: 0.6 }); // deck feet
      return g;
    }
  },
  {
    id: 'pool_volley_net', name: 'Pool Volleyball Net', cat: 'outdoor', w: 470, d: 16, h: 118,
    palettes: null,
    plan: { type: 'box' },
    build: () => {
      const g = G();
      const post = metal('#c2c6cc', 0.35);
      for (const sx of [-1, 1]) {
        cyl(g, post, 5, 116, sx * 230, 0, 0, { rTop: 4 });
        cyl(g, solid('#3a3d42', 0.6), 16, 6, sx * 230, 0, 0, { seg: 18 }); // base
      }
      box(g, solid('#2f6ea3', 0.6), 452, 8, 3, 0, 100, 0);            // top tape band
      box(g, solid('#2f6ea3', 0.6), 452, 6, 3, 0, 40, 0);            // bottom tape band
      box(g, netMaterial('#f0f2f4', 40, 5), 452, 56, 1.5, 0, 44, 0);  // mesh net
      return g;
    }
  },
  {
    id: 'pool_lifering', name: 'Life-Ring Stand', cat: 'outdoor', w: 72, d: 32, h: 132,
    palettes: null,
    plan: { type: 'box' },
    build: () => {
      const g = G();
      const post = wood('#7a5a3c', 0.7);
      box(g, solid('#3a3d42', 0.6), 44, 6, 30, 0, 0, 0, { r: 3 });    // base
      cyl(g, post, 4, 120, 0, 6, 0);                                  // post
      box(g, post, 40, 5, 5, 0, 92, 0);                              // hanging arm
      // life ring mounted vertically facing +Z: one smooth white torus
      const cy = 62, R = 26, r = 7;
      torus(g, solid('#f2f2ee', 0.55), R, r, 0, cy, 8, { rx: 0, seg: 44, tubeSeg: 14 });
      // four red rescue bands wrapping the tube at the diagonals
      const band = solid('#d63a3a', 0.55);
      for (let i = 0; i < 4; i++) {
        const a = Math.PI / 4 + (i / 4) * Math.PI * 2;
        box(g, band, 16.5, 13, 16.5, Math.cos(a) * R, cy + Math.sin(a) * R - 6.5, 8,
          { r: 6.2, seg: 4, rz: a });
      }
      // four rope-wrap marks at top/bottom/sides (grab line lashings)
      const rope = solid('#d8cdb4', 0.8);
      torus(g, rope, r + 0.9, 0.9, R, cy, 8, {});                        // side: tangent vertical
      torus(g, rope, r + 0.9, 0.9, -R, cy, 8, {});
      torus(g, rope, r + 0.9, 0.9, 0, cy + R, 8, { rx: 0, ry: Math.PI / 2 }); // top: tangent along x
      torus(g, rope, r + 0.9, 0.9, 0, cy - R, 8, { rx: 0, ry: Math.PI / 2 });
      for (const sx of [-1, 1]) cyl(g, post, 1.5, 34, sx * 12, 92, 8, { rx: 0.5 }); // support ropes
      return g;
    }
  },
  {
    id: 'pool_shower', name: 'Poolside Shower', cat: 'outdoor', w: 60, d: 60, h: 226,
    palettes: null,
    plan: { type: 'box' },
    build: () => {
      const g = G();
      const pipe = chrome();
      cyl(g, solid('#7d8288', 0.7), 30, 8, 0, 0, 0, { seg: 24 });     // stone base pad
      cyl(g, solid('#54585e', 0.6), 22, 3, 0, 8, 0, { seg: 24 });     // drain grate
      cyl(g, pipe, 4, 210, 0, 8, -8);                                 // riser pipe
      box(g, pipe, 4, 4, 46, 0, 216, 14, { rx: 0.2 });               // shower arm
      cyl(g, pipe, 14, 6, 0, 210, 38, { seg: 20 });                  // shower head
      cyl(g, solid('#3a3d42', 0.5), 12, 2, 0, 208, 38, { seg: 20 });
      for (const sx of [-1, 1]) cyl(g, pipe, 4, 8, sx * 12, 60, 6, { rz: Math.PI / 2, seg: 14 }); // taps
      cyl(g, pipe, 3, 10, 0, 150, -12, { rx: Math.PI / 2, seg: 12 }); // towel hook peg
      return g;
    }
  },
  {
    id: 'pool_towel_rack', name: 'Towel Rack', cat: 'outdoor', w: 96, d: 44, h: 116,
    palettes: null,
    plan: { type: 'box' },
    build: () => {
      const g = G();
      const frame = wood('#caa46a', 0.7);
      for (const sx of [-1, 1]) {
        box(g, frame, 5, 112, 5, sx * 44, 0, 0);
        box(g, frame, 5, 5, 38, sx * 44, 2, 0);                       // foot
        box(g, frame, 5, 5, 30, sx * 44, 108, 0);                     // top cap
      }
      const cols = ['#e8705a', '#2f9aa8', '#f2c53d'];
      for (let i = 0; i < 3; i++) {
        const y = 34 + i * 34;
        cyl(g, frame, 3, 84, 0, y, 12, { rz: Math.PI / 2, seg: 14 }); // bar
        box(g, solid(cols[i], 0.9), 60, 30, 8, 0, y - 26, 12, { r: 3 }); // folded towel draped over
      }
      return g;
    }
  },
  {
    id: 'pool_cooler', name: 'Rolling Cooler', cat: 'outdoor', w: 84, d: 52, h: 62,
    palettes: [
      { name: 'Red', chip: '#c9463a', body: '#c9463a' },
      { name: 'Cooler Blue', chip: '#3573b0', body: '#3573b0' }
    ],
    plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const body = solid(p.body, 0.5);
      const white = solid('#eef0f0', 0.5);
      box(g, body, 84, 42, 50, 0, 8, 0, { r: 6, seg: 4 });            // chest body
      box(g, white, 86, 12, 52, 0, 50, 0, { r: 6, seg: 4 });         // hinged lid
      box(g, solid('#3a3d42', 0.5), 30, 4, 6, 0, 58, 22, { r: 2 });  // lid latch
      for (const sx of [-1, 1]) cyl(g, solid('#2a2d31', 0.7), 8, 10, sx * 34, 8, -18, { rz: Math.PI / 2, seg: 16 }); // wheels
      cyl(g, metal('#b8bcc2', 0.4), 2.5, 52, 0, 60, -22, { rz: Math.PI / 2, seg: 12 });  // pull handle bar
      for (const sx of [-1, 1]) cyl(g, metal('#b8bcc2', 0.4), 2, 24, sx * 24, 48, -22, { rx: -0.5, seg: 12 });
      return g;
    }
  },
  {
    id: 'pool_side_table', name: 'Poolside Drinks Table', cat: 'outdoor', w: 50, d: 50, h: 56,
    palettes: null,
    plan: { type: 'tableRound' },
    build: () => {
      const g = G();
      const frame = metal('#d7dade', 0.35);
      cyl(g, solid('#e8e4da', 0.5), 24, 5, 0, 48, 0, { seg: 26 });    // round top
      legs4(g, frame, 40, 40, 48, 2, 5);                             // 4 splayed legs
      cyl(g, frame, 18, 2, 0, 20, 0, { seg: 20 });                   // lower shelf
      // drinks on top
      cyl(g, solid('#d94f4f', 0.4), 4.5, 13, -8, 53, 4, { seg: 14 });  // soda can
      cyl(g, glass(), 5, 12, 9, 53, -3, { rTop: 5.5, seg: 16 });       // iced glass
      cyl(g, solid('#f2c53d', 0.5), 2.5, 1.5, 9, 65, -3, { seg: 10 }); // lemon slice
      return g;
    }
  }
];
