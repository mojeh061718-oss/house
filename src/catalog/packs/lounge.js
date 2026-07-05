// Modern outdoor lounge & entertainment pack. Built only from primitive
// helpers; all dimensions in cm, origin at footprint center on the floor,
// front faces +Z.
import { G, box, cyl, sphere, glass, glow, tex, solid, wood, metal } from '../builders.js';

// fabric/frame palettes for cushioned seating
const FAB = [
  { name: 'Sand', chip: '#d7cbb4', fabric: '#d7cbb4', frame: '#33352f' },
  { name: 'Charcoal', chip: '#585b5f', fabric: '#585b5f', frame: '#2b2d2f' },
  { name: 'Teal', chip: '#3f6f74', fabric: '#3f6f74', frame: '#e6e2da' },
  { name: 'Rust', chip: '#b0603f', fabric: '#b0603f', frame: '#4a4a4a' }
];
// wood-tone palettes (frame = wood, fabric = cushion accent)
const WOODPAL = [
  { name: 'Teak', chip: '#b0824e', fabric: '#e7e0cf', frame: '#b0824e' },
  { name: 'Walnut', chip: '#5f4632', fabric: '#d6cbb6', frame: '#5f4632' },
  { name: 'Driftwood', chip: '#9a917f', fabric: '#eae4d6', frame: '#9a917f' },
  { name: 'Ebony', chip: '#33302c', fabric: '#c9b48c', frame: '#33302c' }
];

export const LOUNGE_ITEMS = [
  {
    id: 'out_sectional', name: 'Outdoor Corner Sectional', cat: 'outdoor', w: 280, d: 210, h: 74,
    palettes: FAB, plan: { type: 'sofa' },
    build: (p) => {
      const g = G();
      const fr = solid(p.frame, 0.6);
      const fab = solid(p.fabric, 0.95);
      // L-shaped low platform base
      box(g, fr, 280, 22, 90, 0, 0, -60, { r: 4 });
      box(g, fr, 90, 22, 120, -95, 0, 45, { r: 4 });
      // seat cushions along the back run
      for (const cx of [-92, 0, 92]) box(g, fab, 90, 16, 80, cx, 22, -60, { r: 8 });
      // chaise seat cushion
      box(g, fab, 80, 16, 110, -95, 22, 45, { r: 8 });
      // back cushions
      for (const cx of [-92, 0, 92]) box(g, fab, 88, 34, 20, cx, 38, -95, { r: 9, rx: -0.06 });
      box(g, fab, 20, 34, 110, -131, 38, 45, { r: 9, rz: 0.06 });
      // right arm
      box(g, fr, 20, 44, 90, 138, 0, -60, { r: 6 });
      // throw pillows
      box(g, solid('#efe9dd', 0.95), 42, 42, 14, 60, 40, -72, { r: 9, ry: 0.3 });
      box(g, solid('#c98a5a', 0.95), 42, 42, 14, -95, 40, 8, { r: 9, ry: -0.2 });
      return g;
    }
  },
  {
    id: 'out_loveseat', name: 'Outdoor Loveseat', cat: 'outdoor', w: 150, d: 84, h: 74,
    palettes: FAB, plan: { type: 'sofa' },
    build: (p) => {
      const g = G();
      const fr = solid(p.frame, 0.6);
      const fab = solid(p.fabric, 0.95);
      box(g, fr, 150, 20, 82, 0, 0, 0, { r: 4 });
      for (const cx of [-37, 37]) box(g, fab, 66, 16, 70, cx, 20, 4, { r: 8 });
      for (const cx of [-37, 37]) box(g, fab, 64, 32, 18, cx, 36, -30, { r: 9, rx: -0.06 });
      for (const s of [-1, 1]) box(g, fr, 16, 44, 82, s * 67, 0, 0, { r: 6 });
      box(g, solid('#efe9dd', 0.95), 34, 34, 12, -37, 42, -6, { r: 7, ry: 0.2 });
      // short feet
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, metal('#2a2c2e', 0.5), 3, 6, sx * 66, 0, sz * 34);
      return g;
    }
  },
  {
    id: 'patio_egg_swing', name: 'Hanging Egg Chair', cat: 'outdoor', w: 110, d: 110, h: 200,
    palettes: FAB, plan: { type: 'chair' },
    build: (p) => {
      const g = G();
      const fr = metal('#2e3033', 0.4);
      const wick = solid('#b89a6a', 0.85);
      const fab = solid(p.fabric, 0.95);
      box(g, fr, 26, 8, 90, 0, 0, -40, { r: 4 });        // base plate
      cyl(g, fr, 4, 190, 0, 8, -40);                      // pole
      cyl(g, fr, 4, 56, 0, 188, -14, { rx: Math.PI / 2 }); // top arm to center
      for (const s of [-1, 1]) cyl(g, fr, 0.8, 34, s * 16, 154, 6); // chains
      sphere(g, wick, 46, 0, 110, 6, { sy: 1.05, seg: 18 });        // pod shell
      sphere(g, solid('#2a2620', 0.7), 39, 0, 108, 22, { sy: 1.05, seg: 16 }); // hollow opening
      box(g, fab, 62, 16, 46, 0, 92, 14, { r: 12 });      // seat cushion
      box(g, fab, 58, 40, 14, 0, 104, -18, { r: 12, rx: -0.1 }); // back cushion
      return g;
    }
  },
  {
    id: 'patio_hammock', name: 'Hammock with Stand', cat: 'outdoor', w: 270, d: 90, h: 120,
    palettes: FAB, plan: { type: 'lounger' },
    build: (p) => {
      const g = G();
      const fr = metal('#3a3d40', 0.4);
      const fab = solid(p.fabric, 0.95);
      box(g, fr, 250, 8, 14, 0, 0, 0, { r: 4 });          // base bar
      for (const s of [-1, 1]) {
        cyl(g, fr, 5, 120, s * 125, 0, 0, { rz: -s * 0.5 });
        cyl(g, fr, 4, 60, s * 88, 104, 0, { rz: -s * 1.0 });
      }
      sphere(g, fab, 66, 0, 54, 0, { sx: 1.7, sy: 0.32, sz: 0.62, seg: 18 }); // sagging bed
      for (const s of [-1, 1]) for (const z of [-1, 1]) cyl(g, fr, 0.6, 60, s * 96, 62, z * 18, { rz: s * 0.5 }); // ropes
      return g;
    }
  },
  {
    id: 'patio_hammock_chair', name: 'Hanging Hammock Chair', cat: 'outdoor', w: 100, d: 100, h: 185,
    palettes: WOODPAL, plan: { type: 'chair' },
    build: (p) => {
      const g = G();
      const fr = metal('#2e3033', 0.4);
      const fab = solid(p.fabric, 0.95);
      const bar = wood(p.frame, 0.6);
      box(g, fr, 26, 8, 80, 0, 0, -34, { r: 4 });
      cyl(g, fr, 4, 180, 0, 8, -34);
      cyl(g, fr, 4, 50, 0, 178, -12, { rx: Math.PI / 2 });
      box(g, bar, 96, 4, 4, 0, 150, 8, { r: 2 });         // spreader bar
      for (const s of [-1, 1]) cyl(g, fr, 0.7, 32, s * 44, 150, 8);
      box(g, fab, 88, 8, 70, 0, 86, 12, { r: 10 });       // seat
      box(g, fab, 88, 64, 8, 0, 90, -20, { r: 10, rx: -0.2 }); // back
      for (const s of [-1, 1]) cyl(g, fr, 0.6, 66, s * 44, 120, -6, { rx: 0.3 });
      return g;
    }
  },
  {
    id: 'patio_adirondack', name: 'Adirondack Chair', cat: 'outdoor', w: 80, d: 95, h: 100,
    palettes: WOODPAL, plan: { type: 'chair' },
    build: (p) => {
      const g = G();
      const wd = wood(p.frame, 0.6);
      for (let i = 0; i < 6; i++) box(g, wd, 64, 3, 10, 0, 32 - i * 1.6, -24 + i * 11, { rx: -0.14 }); // seat slats
      for (let i = 0; i < 5; i++) { const x = (i - 2) * 13; box(g, wd, 11, 64, 3, x, 40, -36, { rx: -0.4 }); } // back fan
      for (const s of [-1, 1]) box(g, wd, 10, 4, 54, s * 35, 46, -6, { r: 2 }); // arms
      for (const s of [-1, 1]) box(g, wd, 5, 48, 5, s * 35, 0, 18);            // front legs
      for (const s of [-1, 1]) box(g, wd, 5, 40, 5, s * 30, 0, -30);           // rear legs
      box(g, wd, 66, 10, 5, 0, 30, 22);                                        // front apron
      return g;
    }
  },
  {
    id: 'out_fire_table', name: 'Gas Fire Table', cat: 'outdoor', w: 120, d: 70, h: 60,
    palettes: null, plan: { type: 'fireplace' },
    light: { y: 44, color: '#ff9440', intensity: 1.4, distance: 520 },
    build: () => {
      const g = G();
      box(g, solid('#6f6a60', 0.85), 120, 36, 70, 0, 0, 0, { r: 4 });   // concrete base
      box(g, solid('#45423c', 0.8), 122, 5, 72, 0, 36, 0, { r: 3 });    // rim
      box(g, solid('#141414', 0.4), 74, 3, 34, 0, 39, 0);               // burner pan
      for (const z of [-19, 19]) box(g, glass(), 78, 20, 2, 0, 42, z);  // wind guard
      for (const x of [-39, 39]) box(g, glass(), 2, 20, 40, x, 42, 0);
      const ember = glow('#ff6a20', 1.7, 0.5);
      let s = 7; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
      for (let i = 0; i < 12; i++) sphere(g, ember, 3.2, (rnd() - 0.5) * 64, 41, (rnd() - 0.5) * 28, { seg: 8 });
      const flame = glow('#ffb347', 1.9, 0.4);
      for (const fx of [-24, 0, 24]) cyl(g, flame, 5, 18, fx, 41, 0, { rTop: 1, seg: 8 });
      return g;
    }
  },
  {
    id: 'out_kitchen_island', name: 'Outdoor Kitchen Island', cat: 'outdoor', w: 200, d: 70, h: 92,
    palettes: null, plan: { type: 'grill' },
    build: () => {
      const g = G();
      const body = solid('#cfc6b4', 0.85);
      const steel = metal('#c4c8cc', 0.35);
      const top = tex('counter_dark', 2, 1);
      box(g, body, 200, 84, 70, 0, 0, 0, { r: 3 });           // cabinet
      box(g, top, 204, 6, 74, 0, 84, 0, { r: 2 });            // counter
      box(g, steel, 70, 30, 58, 52, 90, 0, { r: 14 });        // grill hood
      box(g, solid('#2a2c2e', 0.5), 66, 6, 50, 52, 90, 0, { r: 3 }); // grill body
      box(g, steel, 44, 8, 44, -58, 88, 0, { r: 3 });         // sink basin
      box(g, solid('#1a1a1a', 0.4), 34, 4, 34, -58, 90, 0);
      for (const dx of [-58, -8, 42]) {
        box(g, steel, 44, 50, 2, dx, 18, 36, { r: 2 });        // doors
        cyl(g, metal('#e2e5e8', 0.3), 1, 20, dx + 16, 32, 37); // handles
      }
      for (const kx of [30, 46, 62]) cyl(g, metal('#3a3d40', 0.3), 2.2, 4, kx, 86, 34);
      return g;
    }
  },
  {
    id: 'out_pizza_oven', name: 'Wood-Fired Pizza Oven', cat: 'outdoor', w: 120, d: 110, h: 170,
    palettes: null, plan: { type: 'grill' },
    light: { y: 100, color: '#ff8a3c', intensity: 1.1, distance: 340 },
    build: () => {
      const g = G();
      const stucco = solid('#e6ded0', 0.85);
      const base = solid('#7a7368', 0.85);
      box(g, base, 120, 86, 100, 0, 0, 0, { r: 3 });          // stand
      box(g, tex('counter_dark', 1.6, 1), 124, 5, 104, 0, 86, 0, { r: 2 });
      sphere(g, stucco, 52, 0, 92, -4, { sy: 0.9, seg: 20 });  // dome
      box(g, solid('#8a3f2c', 0.7), 52, 34, 8, 0, 100, 50, { r: 4 }); // arch surround
      box(g, solid('#1b1815', 0.5), 44, 30, 20, 0, 100, 44, { r: 6 }); // mouth
      const ember = glow('#ff6a20', 1.7, 0.5);
      sphere(g, ember, 10, 0, 96, 38, { sy: 0.5, seg: 10 });
      const flame = glow('#ffb347', 1.9, 0.4);
      cyl(g, flame, 6, 16, -8, 98, 34, { rTop: 1, seg: 8 });
      cyl(g, flame, 5, 13, 8, 99, 36, { rTop: 1, seg: 8 });
      cyl(g, solid('#3a3d40', 0.7), 7, 40, 0, 150, -30, { rTop: 6 }); // chimney
      return g;
    }
  },
  {
    id: 'out_bar_counter', name: 'Outdoor Bar Counter', cat: 'outdoor', w: 200, d: 120, h: 106,
    palettes: null, plan: { type: 'patioset' },
    build: () => {
      const g = G();
      const wd = wood('#7a5c3e', 0.6);
      const top = tex('counter_dark', 2, 1);
      const st = metal('#2c2e30', 0.4);
      box(g, wd, 200, 100, 50, 0, 0, -20, { r: 3 });          // counter body
      box(g, top, 206, 6, 86, 0, 100, -2, { r: 2 });          // overhang top
      cyl(g, st, 2, 196, 0, 18, 22, { rz: Math.PI / 2 });     // foot rail
      for (const x of [-90, 90]) cyl(g, st, 2, 18, x, 0, 22);
      for (const sx of [-64, 0, 64]) {                        // stools
        const sm = metal('#3a3d40', 0.4);
        cyl(g, solid('#c9b48c', 0.7), 18, 8, sx, 70, 40, { seg: 20 });
        for (const a of [0.8, 2.3, 3.9, 5.5]) cyl(g, sm, 1.6, 70, sx + Math.cos(a) * 13, 0, 40 + Math.sin(a) * 13, { rz: 0.1 * Math.cos(a), rx: 0.1 * Math.sin(a) });
        cyl(g, sm, 13, 2, sx, 26, 40, { seg: 16 });
      }
      return g;
    }
  },
  {
    id: 'out_tv_stand', name: 'Outdoor TV on Stand', cat: 'outdoor', w: 160, d: 48, h: 175,
    palettes: null, plan: { type: 'tv' },
    light: { y: 100, color: '#8fb4e0', intensity: 0.7, distance: 280 },
    build: () => {
      const g = G();
      const dark = solid('#1a1a1a', 0.4);
      const st = solid('#2c2e30', 0.6);
      box(g, solid('#3a3d40', 0.6), 150, 44, 44, 0, 0, 0, { r: 3 });  // console
      box(g, tex('counter_dark', 1.5, 1), 154, 4, 48, 0, 44, 0, { r: 2 });
      for (const dx of [-38, 38]) box(g, solid('#26282a', 0.5), 64, 32, 2, dx, 10, 23, { r: 2 });
      cyl(g, st, 4, 44, 0, 48, -6);                                   // pole
      box(g, dark, 40, 6, 20, 0, 78, -6);                             // bracket
      box(g, dark, 146, 84, 5, 0, 90, -8, { r: 2 });                  // bezel
      box(g, glow('#3a5f82', 0.7, 0.3), 138, 76, 1, 0, 92, -5);       // screen
      return g;
    }
  },
  {
    id: 'patio_projector_screen', name: 'Projector Screen', cat: 'outdoor', w: 220, d: 60, h: 215,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      const fr = metal('#2c2e30', 0.4);
      box(g, fr, 220, 10, 10, 0, 205, 0, { r: 3 });            // roller housing
      box(g, solid('#f2f0ea', 0.6), 210, 172, 2, 0, 30, 1);    // screen
      box(g, fr, 214, 4, 4, 0, 28, 0);                         // bottom bar
      for (const s of [-1, 1]) box(g, fr, 4, 176, 4, s * 106, 28, 0); // side rails
      // splayed tripod feet at each end
      for (const s of [-1, 1]) {
        cyl(g, fr, 4, 28, s * 106, 0, 0);
        for (const a of [0.6, 2.5, 4.0]) cyl(g, fr, 2.5, 30, s * 106 + Math.cos(a) * 22, 0, Math.sin(a) * 22, { rz: 0.22 * Math.cos(a), rx: 0.22 * Math.sin(a) });
      }
      return g;
    }
  },
  {
    id: 'patio_heater', name: 'Patio Heater', cat: 'outdoor', w: 70, d: 70, h: 210,
    palettes: null, plan: { type: 'umbrella' },
    light: { y: 170, color: '#ff9440', intensity: 1.3, distance: 420 },
    build: () => {
      const g = G();
      const st = metal('#3a3d40', 0.4);
      const steel = metal('#c6cace', 0.3);
      cyl(g, solid('#2a2c2e', 0.6), 30, 10, 0, 0, 0, { seg: 24 });    // weighted base
      cyl(g, st, 7, 150, 0, 10, 0);                                   // pole
      cyl(g, st, 10, 20, 0, 160, 0);                                  // burner housing
      cyl(g, glow('#ff7a2a', 1.6, 0.4), 11, 10, 0, 158, 0, { seg: 24 }); // glow ring
      cyl(g, steel, 12, 16, 0, 180, 0, { rTop: 34, seg: 28 });        // reflector dome
      cyl(g, steel, 6, 10, 0, 196, 0, { rTop: 3 });                   // top cap
      return g;
    }
  },
  {
    id: 'patio_chiminea', name: 'Chiminea', cat: 'outdoor', w: 70, d: 70, h: 145,
    palettes: null, plan: { type: 'fireplace' },
    light: { y: 64, color: '#ff8a3c', intensity: 1.1, distance: 340 },
    build: () => {
      const g = G();
      const clay = solid('#a7623f', 0.8);
      const st = metal('#2c2e30', 0.4);
      for (const a of [0, 2.09, 4.19]) cyl(g, st, 2, 40, Math.cos(a) * 26, 0, Math.sin(a) * 26, { rz: 0.12 * Math.cos(a), rx: 0.12 * Math.sin(a) }); // stand legs
      cyl(g, st, 28, 3, 0, 40, 0, { rTop: 28, seg: 24 });   // ring plate
      sphere(g, clay, 30, 0, 66, 0, { sy: 1.05, seg: 20 });  // bulb body
      box(g, solid('#1b1512', 0.5), 22, 24, 14, 0, 64, 26, { r: 6 }); // mouth
      const ember = glow('#ff6a20', 1.7, 0.5);
      sphere(g, ember, 7, 0, 60, 22, { sy: 0.5, seg: 10 });
      const flame = glow('#ffb347', 1.9, 0.4);
      cyl(g, flame, 4, 14, 0, 62, 20, { rTop: 1, seg: 8 });
      cyl(g, clay, 14, 42, 0, 92, 0, { rTop: 9 });           // neck
      cyl(g, clay, 11, 8, 0, 132, 0, { rTop: 13 });          // rim cap
      return g;
    }
  },
  {
    id: 'out_daybed_canopy', name: 'Canopy Daybed', cat: 'outdoor', w: 200, d: 200, h: 194,
    palettes: FAB, plan: { type: 'bed' },
    build: (p) => {
      const g = G();
      const fr = wood(p.frame, 0.6);
      const fab = solid(p.fabric, 0.95);
      const canopy = solid('#eae3d4', 0.9);
      box(g, fr, 200, 26, 200, 0, 0, 0, { r: 4 });           // platform
      box(g, fab, 188, 18, 188, 0, 26, 0, { r: 10 });        // mattress
      box(g, fab, 184, 30, 22, 0, 44, -84, { r: 10 });       // back bolster
      for (const s of [-1, 1]) box(g, fab, 22, 30, 150, s * 84, 44, 20, { r: 10 }); // side bolsters
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, fr, 8, 180, 8, sx * 94, 0, sz * 94); // posts
      for (const sz of [-1, 1]) box(g, fr, 196, 8, 8, 0, 180, sz * 94);  // top frame
      for (const sx of [-1, 1]) box(g, fr, 8, 8, 196, sx * 94, 180, 0);
      box(g, canopy, 200, 6, 200, 0, 188, 0, { r: 3 });      // canopy top
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, canopy, 10, 150, 10, sx * 94, 30, sz * 94, { r: 3 }); // drapes
      return g;
    }
  },
  {
    id: 'patio_porch_swing', name: 'Porch Swing', cat: 'outdoor', w: 200, d: 110, h: 190,
    palettes: WOODPAL, plan: { type: 'sofa' },
    build: (p) => {
      const g = G();
      const wd = wood(p.frame, 0.6);
      const fab = solid(p.fabric, 0.95);
      const ch = metal('#8a8d90', 0.4);
      for (const s of [-1, 1]) {                              // A-frame legs
        box(g, wd, 8, 180, 8, s * 95, 0, -40, { rz: -s * 0.12 });
        box(g, wd, 8, 180, 8, s * 95, 0, 40, { rz: -s * 0.12 });
        box(g, wd, 8, 10, 96, s * 90, 178, 0);
      }
      box(g, wd, 200, 10, 10, 0, 182, 0, { r: 3 });          // top beam
      for (const s of [-1, 1]) { cyl(g, ch, 1, 76, s * 58, 106, 26); cyl(g, ch, 1, 76, s * 58, 106, -26); }
      box(g, wd, 130, 6, 60, 0, 100, 0, { r: 3 });           // seat
      box(g, wd, 130, 50, 6, 0, 106, -27, { r: 3, rx: -0.12 }); // back
      for (const s of [-1, 1]) box(g, wd, 6, 26, 60, s * 62, 106, 0, { r: 3 }); // arms
      box(g, fab, 120, 10, 54, 0, 106, 2, { r: 6 });         // seat cushion
      box(g, fab, 120, 40, 10, 0, 112, -24, { r: 6, rx: -0.12 }); // back cushion
      return g;
    }
  },
  {
    id: 'out_coffee_table', name: 'Outdoor Coffee Table', cat: 'outdoor', w: 110, d: 60, h: 36,
    palettes: WOODPAL, plan: { type: 'table' },
    build: (p) => {
      const g = G();
      const wd = wood(p.frame, 0.6);
      box(g, wd, 110, 5, 60, 0, 30, 0, { r: 2 });            // top
      box(g, wd, 98, 4, 48, 0, 13, 0, { r: 2 });             // lower shelf
      for (const s of [-1, 1]) for (const z of [-1, 1]) box(g, wd, 6, 34, 6, s * 48, 0, z * 24);
      return g;
    }
  },
  {
    id: 'patio_sun_lounger', name: 'Sun Lounger', cat: 'outdoor', w: 66, d: 190, h: 95,
    palettes: FAB, plan: { type: 'lounger' },
    build: (p) => {
      const g = G();
      const fr = metal(p.frame, 0.4);
      const fab = solid(p.fabric, 0.95);
      for (const s of [-1, 1]) box(g, fr, 6, 6, 190, s * 30, 34, 0, { r: 3 }); // side rails
      for (const s of [-1, 1]) for (const z of [-70, 70]) cyl(g, fr, 2.6, 34, s * 30, 0, z);
      box(g, fr, 60, 4, 150, 0, 34, 18, { r: 2 });           // slat platform
      box(g, fab, 58, 12, 140, 0, 38, 20, { r: 8 });         // seat cushion
      box(g, fab, 58, 12, 66, 0, 54, -64, { r: 8, rx: 0.6 }); // reclined back
      box(g, solid('#efe9dd', 0.95), 34, 10, 20, 0, 74, -86, { r: 6, rx: 0.6 }); // headrest
      for (const s of [-1, 1]) cyl(g, solid('#2a2c2e', 0.6), 7, 4, s * 30, 7, 92, { rz: Math.PI / 2 }); // wheels
      return g;
    }
  }
];
