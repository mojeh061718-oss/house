// Modern outdoor lounge & entertainment pack. Built only from primitive
// helpers; all dimensions in cm, origin at footprint center on the floor,
// front faces +Z.
import { G, box, cyl, sphere, glass, glow, tex, solid, wood, metal, strut, torus, lathe, cushion, drape, sweep } from '../builders.js';

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
      // soft seat cushions along the back run (sat-in dimples)
      for (const cx of [-92, 0, 92]) cushion(g, fab, 90, 16, 80, cx, 22, -60, { puff: 0.13, dimple: 0.5 });
      // chaise seat cushion
      cushion(g, fab, 80, 16, 110, -95, 22, 45, { puff: 0.13, dimple: 0.45 });
      // plump back cushions leaning into the frame
      for (const cx of [-92, 0, 92]) cushion(g, fab, 88, 32, 20, cx, 38, -95, { puff: 0.22, dimple: 0.1, rx: -0.06 });
      cushion(g, fab, 20, 32, 108, -131, 38, 45, { puff: 0.22, dimple: 0.1, rz: 0.06 });
      // right arm
      box(g, fr, 20, 44, 90, 138, 0, -60, { r: 6 });
      // one throw pillow tossed at an angle (intrigue)
      cushion(g, solid('#c98a5a', 0.95), 42, 40, 13, 60, 38, -76, { puff: 0.32, dimple: 0.05, ry: 0.35, rx: -0.1 });
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
      for (const cx of [-37, 37]) cushion(g, fab, 66, 16, 70, cx, 20, 4, { puff: 0.13, dimple: 0.5 });
      for (const cx of [-37, 37]) cushion(g, fab, 64, 30, 18, cx, 36, -30, { puff: 0.22, dimple: 0.1, rx: -0.06 });
      for (const s of [-1, 1]) box(g, fr, 16, 44, 82, s * 67, 0, 0, { r: 6 });
      // one angled throw pillow (intrigue)
      cushion(g, solid('#efe9dd', 0.95), 34, 32, 11, -37, 38, -22, { puff: 0.3, dimple: 0.05, ry: 0.25, rx: -0.08 });
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
      const wickDark = solid('#93744c', 0.85);
      const fab = solid(p.fabric, 0.95);
      // weighted round base + arched stand curving over the pod
      cyl(g, fr, 30, 6, 0, 0, -42, { seg: 28 });
      strut(g, fr, 0, 5, -42, 0, 148, -40, 4.4, { rTop: 4 });
      strut(g, fr, 0, 148, -40, 0, 184, -18, 4, { rTop: 3.6 });
      strut(g, fr, 0, 184, -18, 0, 195, 4, 3.6, { rTop: 3 });
      sphere(g, fr, 3.6, 0, 195, 4, { seg: 10 });
      // hanging chain from hook to pod crown
      strut(g, fr, 0, 195, 4, 0, 160, -12, 1.1);
      // open-basket pod: squashed bowl + tall back shell form an egg with a
      // REAL front-top opening, so the cushions genuinely show
      sphere(g, wick, 43, 0, 86, 4, { sy: 0.62, seg: 26 });          // basket bowl
      sphere(g, wick, 40, 0, 118, -18, { sy: 1.2, sz: 0.9, seg: 26 }); // wrapping back shell
      // woven lip running the basket rim
      torus(g, wickDark, 41, 2.5, 0, 111, 4, { seg: 44, tubeSeg: 10 });
      // cushions in the opening
      box(g, fab, 46, 12, 40, 0, 106, 2, { r: 8 });                  // seat pad
      box(g, fab, 42, 34, 10, 0, 114, 2, { r: 8, rx: -0.22 });       // back pad
      return g;
    }
  },
  {
    id: 'patio_hammock', name: 'Hammock with Stand', cat: 'outdoor', w: 270, d: 90, h: 120,
    palettes: FAB, plan: { type: 'lounger' },
    build: (p) => {
      const g = G();
      const fr = metal('#4c4f53', 0.45);
      const fab = solid(p.fabric, 0.95);
      const rope = solid('#cfc9ba', 0.85);
      // steel stand: ground beam, cross feet, arched arms rising to hooks
      box(g, fr, 210, 7, 9, 0, 0, 0, { r: 3 });
      for (const s of [-1, 1]) {
        box(g, fr, 8, 6, 56, s * 96, 0, 0, { r: 2 });
        strut(g, fr, s * 103, 4, 0, s * 122, 62, 0, 3.8, { rTop: 3.2 });
        strut(g, fr, s * 122, 62, 0, s * 112, 98, 0, 3.2, { rTop: 2.8 });
        sphere(g, fr, 3.8, s * 112, 100, 0, { seg: 10 });
      }
      // catenary-sagging bed: strip chain following the sag, wider amidships
      const HX = 112, HY = 100, BX = 66;
      const sagY = (t) => 52 + 24 * t * t;
      const N = 7;
      for (let i = 0; i < N; i++) {
        const t0 = (i / N) * 2 - 1, t1 = ((i + 1) / N) * 2 - 1;
        const x0 = t0 * BX, x1 = t1 * BX;
        const y0 = sagY(Math.abs(t0)), y1 = sagY(Math.abs(t1));
        const wZ = 80 - Math.max(Math.abs(t0), Math.abs(t1)) * 22;
        const len = Math.hypot(x1 - x0, y1 - y0) + 1.5;
        const strip = box(g, fab, len, 2.2, wZ, (x0 + x1) / 2, (y0 + y1) / 2 - 1.1, 0, { r: 1 });
        strip.rotation.z = Math.atan2(y1 - y0, x1 - x0);
      }
      for (const s of [-1, 1]) {
        cyl(g, wood('#a9825a', 0.6), 2.6, 78, s * BX, sagY(1), 0, { rx: Math.PI / 2, seg: 10 }); // spreader bar
        // taut ropes fanning from the spreader bar to the stand hooks
        for (const rz of [-34, -12, 12, 34]) strut(g, rope, s * BX, sagY(1), rz, s * HX, HY, 0, 0.8);
      }
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
      const fab = solid(p.fabric, 0.95);
      for (let i = 0; i < 6; i++) box(g, wd, 64, 3, 10, 0, 32 - i * 1.6, -24 + i * 11, { rx: -0.14 }); // seat slats
      for (let i = 0; i < 5; i++) { const x = (i - 2) * 13; box(g, wd, 11, 64, 3, x, 40, -36, { rx: -0.4 }); } // back fan
      for (const s of [-1, 1]) box(g, wd, 10, 4, 54, s * 35, 46, -6, { r: 2 }); // arms
      for (const s of [-1, 1]) box(g, wd, 5, 48, 5, s * 35, 0, 18);            // front legs
      for (const s of [-1, 1]) box(g, wd, 5, 40, 5, s * 30, 0, -30);           // rear legs
      box(g, wd, 66, 10, 5, 0, 30, 22);                                        // front apron
      // weather-fabric seat pad + one pillow leaned into the back fan (intrigue)
      cushion(g, fab, 56, 7, 56, 0, 27, 1, { puff: 0.28, dimple: 0.3, rx: -0.14 });
      cushion(g, fab, 36, 34, 11, 0, 40, -27, { puff: 0.3, dimple: 0.05, rx: -0.42, ry: 0.18 });
      return g;
    }
  },
  {
    id: 'out_fire_table', name: 'Gas Fire Table', cat: 'outdoor', w: 120, d: 70, h: 60,
    palettes: null, plan: { type: 'fireplace' },
    light: { y: 44, color: '#ff9440', intensity: 1.4, distance: 520 },
    build: () => {
      const g = G();
      box(g, solid('#6f6a60', 0.85), 120, 34, 70, 0, 0, 0, { r: 4 });   // concrete base
      box(g, solid('#45423c', 0.8), 122, 6, 72, 0, 34, 0, { r: 3 });    // cap slab
      // spun-steel fire bowl set into the slab — one smooth lathe profile,
      // outer wall rising to the rim then dipping back down to the pan
      lathe(g, solid('#26262a', 0.55), [
        [8, 0], [24, 0.6], [30, 3], [33, 7], [34, 11.5],
        [32.5, 10.8], [30, 6.5], [26, 4.6], [1, 4.2]
      ], 0, 38, 0, { seg: 36 });
      // lava rocks piled BELOW rim level (rim y≈49.5)
      const rock = solid('#2b2b2e', 0.95);
      let s = 7; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
      for (let i = 0; i < 14; i++) {
        const a = rnd() * Math.PI * 2, rr = rnd() * 23;
        sphere(g, rock, 2 + rnd() * 1.4, Math.cos(a) * rr, 43.5 + rnd() * 1.8, Math.sin(a) * rr, { seg: 8, sy: 0.8 });
      }
      const ember = glow('#ff6a20', 1.7, 0.5);
      for (let i = 0; i < 5; i++) {
        const a = rnd() * Math.PI * 2, rr = rnd() * 19;
        sphere(g, ember, 1.8, Math.cos(a) * rr, 45, Math.sin(a) * rr, { seg: 8 });
      }
      // licking flames rising off the rock bed
      const flame = glow('#ffb347', 1.9, 0.4);
      cyl(g, flame, 6, 17, 0, 45, 0, { rTop: 0.8, seg: 10 });
      cyl(g, flame, 4.5, 13, -13, 45, 5, { rTop: 0.7, seg: 10 });
      cyl(g, flame, 4, 11, 12, 45, -6, { rTop: 0.6, seg: 10 });
      cyl(g, glow('#ff7a24', 2.1, 0.4), 3, 9, 4, 45, 8, { rTop: 0.5, seg: 8 });
      // cylindrical glass wind guard seated on the bowl rim (intrigue)
      cyl(g, glass(), 30.5, 15, 0, 48.5, 0, { open: true, seg: 36 });
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
      // hood handle floating on standoffs
      for (const hx of [32, 72]) cyl(g, metal('#e2e5e8', 0.3), 1.1, 4, hx, 104, 28, { rx: Math.PI / 2 });
      cyl(g, metal('#e2e5e8', 0.3), 1.3, 46, 52, 105, 31, { rz: Math.PI / 2 });
      // farmhouse sink: proud rim, basin floor recessed well below it
      box(g, steel, 46, 7, 42, -58, 84.5, 0, { r: 2 });
      box(g, solid('#1a1a1a', 0.4), 38, 4, 34, -58, 82, 0);
      // gooseneck faucet — lathe base column + smooth sweep arc (intrigue)
      lathe(g, steel, [[3, 0], [2.2, 1.5], [1.8, 12]], -58, 91, -17, { seg: 18 });
      sweep(g, steel, [
        [-58, 102, -17], [-58, 112, -16], [-57.5, 116, -12], [-57.5, 116, -5], [-57.5, 111, -2]
      ], 1.5, { seg: 22 });
      cyl(g, steel, 1, 3, -57.5, 108.5, -2);                  // spout tip
      box(g, steel, 1.4, 4.5, 1.4, -50, 91.3, -17, { rz: -0.5 }); // lever handle
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
      const sm = metal('#3a3d40', 0.4);
      for (const sx of [-64, 0, 64]) {                        // stools
        // turned pedestal leg — one smooth lathe profile, no cylinder stack
        lathe(g, sm, [[13, 0], [12, 1.6], [3.2, 4], [2.6, 32], [3.6, 38], [2.6, 44], [2.8, 58], [5.5, 62]], sx, 0, 40, { seg: 24 });
        // padded round seat with rolled edge
        lathe(g, solid('#c9b48c', 0.85), [[5, 0], [14.5, 1], [17, 3.5], [16, 6.5], [11, 8.2], [1, 8.6]], sx, 62, 40, { seg: 26 });
        torus(g, sm, 13.5, 1.1, sx, 24, 40, {});              // foot ring
      }
      // lemonade service on the bar top (intrigue): pitcher with a lemon
      // wheel on the rim, two tumblers, a green bottle
      lathe(g, glass(), [[4.5, 0], [7, 1], [8, 7], [7.2, 13], [6.2, 17], [6.6, 20]], -62, 106, -22, { seg: 24 });
      cyl(g, solid('#f2cf4e', 0.55), 6.4, 12, -62, 107, -22, { seg: 20 });
      cyl(g, solid('#f6e27a', 0.6), 3.2, 0.7, -57, 122, -22, { rz: 0.5, seg: 16 });
      for (const tx of [-44, -36]) lathe(g, glass(), [[2.6, 0], [3.4, 1], [3.8, 8], [3.6, 9.5]], tx, 106, -14, { seg: 18 });
      lathe(g, solid('#2e5a38', 0.35), [[2.9, 0], [4, 1], [4.2, 11], [2.4, 15], [1.3, 17], [1.4, 21]], 46, 106, -26, { seg: 20 });
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
      // domed propane-tank base + tapering stem — smooth lathe profiles
      lathe(g, solid('#2a2c2e', 0.6), [[26, 0], [30, 2.5], [30.5, 7], [27, 12], [18, 16], [8, 18]], 0, 0, 0, { seg: 32 });
      lathe(g, st, [[7, 0], [5.2, 8], [4, 30], [3.6, 90], [3.6, 128], [4.6, 138], [4, 146]], 0, 16, 0, { seg: 24 });
      // burner can with emitter-screen glow band
      lathe(g, st, [[6.5, 0], [9.5, 2], [10.5, 9], [10.5, 20], [9, 24]], 0, 158, 0, { seg: 28 });
      cyl(g, glow('#ff7a2a', 1.6, 0.4), 10.8, 9, 0, 164, 0, { seg: 28, open: true });
      cyl(g, solid('#16171a', 0.5), 2.2, 2.5, 0, 150, 9, { rx: Math.PI / 2 }); // control knob (intrigue)
      // center stem carrying the mushroom reflector dish
      cyl(g, st, 2.4, 24, 0, 180, 0);
      lathe(g, steel, [[2, 16], [12, 8], [22, 3], [30, 0], [30.5, 1.2], [22, 4.4], [12, 9.6], [3, 17]], 0, 184, 0, { seg: 36 });
      lathe(g, steel, [[3, 0], [3.4, 2], [1.6, 4], [1.8, 6], [0.2, 8]], 0, 200, 0, { seg: 20 }); // finial cap
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
      // hanging bench at chair height (~46cm) — chains run the beam down to it
      const SEAT = 46;
      for (const s of [-1, 1]) for (const z of [26, -26]) cyl(g, ch, 1, 182 - (SEAT + 4), s * 58, SEAT + 4, z);
      box(g, wd, 130, 6, 60, 0, SEAT, 0, { r: 3 });          // seat
      box(g, wd, 130, 52, 6, 0, SEAT + 6, -27, { r: 3, rx: -0.12 }); // back
      for (const s of [-1, 1]) box(g, wd, 6, 26, 60, s * 62, SEAT + 6, 0, { r: 3 }); // arms
      box(g, fab, 120, 10, 54, 0, SEAT + 6, 2, { r: 6 });    // seat cushion
      box(g, fab, 120, 40, 10, 0, SEAT + 12, -24, { r: 6, rx: -0.12 }); // back cushion
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
