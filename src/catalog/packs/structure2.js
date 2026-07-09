// Structures pack 2 — substantial outbuildings: garages, carports, ADUs,
// greenhouses, barns, cabanas and play structures. Real architecture: eaves,
// trim, door/window reveals, roof overhangs. Big surfaces use tex(), glass
// meshes are added LAST in each build (depthWrite:false sorting).
import {
  G, box, cyl, sphere, prism, pyramid, solid, wood, metal, glass, glow, tex,
  lathe, sweep, drape, cushion, strut, foliage, torus, buildFlag, flagTexture
} from '../builders.js';

const WOODS = [
  { name: 'Cedar', chip: '#9c7550', wood: '#9c7550' },
  { name: 'Charcoal', chip: '#3c3c40', wood: '#3c3c40' },
  { name: 'Whitewash', chip: '#d8cfbe', wood: '#d8cfbe' }
];

export const STRUCTURE2_ITEMS = [
  // ---- Double garage --------------------------------------------------------
  {
    id: 'struct_garage_double', name: 'Double Garage', cat: 'structure',
    w: 620, d: 640, h: 335,
    palettes: [
      { name: 'Classic White', chip: '#e7e3d8', sid: 'siding_white', roof: 'shingle_charcoal', trim: '#3f4348', door: '#dcd6c8' },
      { name: 'Greige', chip: '#8e857a', sid: 'siding_greige', roof: 'shingle_brown', trim: '#4a4238', door: '#cfc8ba' },
      { name: 'Charcoal', chip: '#44484d', sid: 'siding_charcoal', roof: 'shingle_slate', trim: '#23262a', door: '#3a3e43' }
    ],
    plan: { type: 'shed' },
    build: (p) => {
      const g = G();
      const trim = solid(p.trim, 0.55);
      const doorMat = solid(p.door, 0.45);
      const gutterMat = metal('#d9d6cd', 0.4);
      // body walls
      box(g, tex(p.sid, 3.5, 1.5), 620, 250, 620, 0, 0, 0);
      // gable roof, ridge along x, 30cm eaves front/back, siding gables
      prism(g, tex(p.roof, 1, 1), 632, 80, 680, 0, 250, 0, tex(p.sid, 1, 1));
      box(g, trim, 640, 6, 18, 0, 327, 0);                       // ridge cap
      // gutter line + downspouts with elbows back to the wall
      for (const sz of [-1, 1]) box(g, gutterMat, 636, 9, 11, 0, 243, sz * 342);
      for (const sx of [-1, 1]) {
        cyl(g, gutterMat, 2.6, 240, sx * 300, 0, 313);
        cyl(g, gutterMat, 2.6, 32, sx * 300, 241, 328, { rx: Math.PI / 2 });
      }
      // corner boards
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        box(g, trim, 11, 250, 11, sx * 307, 0, sz * 307);
      }
      // sectional panel door: slab + 4 raised panels with reveal gaps
      box(g, doorMat, 486, 214, 4, 0, 0, 309);
      for (let i = 0; i < 4; i++) {
        box(g, doorMat, 478, 46, 4, 0, 6 + i * 52, 311, { r: 2 });
      }
      box(g, metal('#8a8e93', 0.35), 26, 4, 2, 0, 26, 313.8);    // lift handle
      // door surround trim
      box(g, trim, 508, 16, 5, 0, 212, 311);
      for (const sx of [-1, 1]) box(g, trim, 16, 212, 5, sx * 250, 0, 311);
      // side entry door (left wall) with knob
      box(g, trim, 4, 206, 100, -310, 0, 180);
      box(g, doorMat, 5, 200, 90, -311, 0, 180);
      sphere(g, metal('#c8b070', 0.3), 2.2, -314, 100, 212);
      // gable vents/windows on both gable ends (opaque trim now, glass later)
      for (const sx of [-1, 1]) box(g, trim, 5, 44, 44, sx * 331, 262, 0);
      // carriage lamps flanking the big door (intrigue)
      for (const sx of [-1, 1]) {
        box(g, trim, 6, 8, 8, sx * 272, 212, 314);
        box(g, glow('#ffdca0', 0.85, 0.5), 9, 16, 9, sx * 272, 220, 314);
        box(g, trim, 12, 3, 12, sx * 272, 236, 314);
      }
      // broom-finish driveway apron
      box(g, tex('concrete_broom', 3, 0.5), 500, 6, 88, 0, 0, 356);
      // GLASS LAST: door window row + gable windows
      for (const wx of [-180, -60, 60, 180]) box(g, glass(), 100, 26, 2, wx, 172, 313.2);
      for (const sx of [-1, 1]) box(g, glass(), 2, 34, 34, sx * 333, 267, 0);
      return g;
    }
  },

  // ---- Steel carport --------------------------------------------------------
  {
    id: 'struct_carport_steel', name: 'Steel Carport', cat: 'structure',
    w: 380, d: 570, h: 260,
    palettes: [
      { name: 'Graphite', chip: '#3f4348', steel: '#3f4348', roof: 'corrugated_gray' },
      { name: 'White', chip: '#e4e2dc', steel: '#dcdad2', roof: 'corrugated_white' },
      { name: 'Forest', chip: '#3e4d40', steel: '#3e4d40', roof: 'corrugated_gray' }
    ],
    plan: { type: 'pergola' },
    build: (p) => {
      const g = G();
      const steel = metal(p.steel, 0.45);
      const corr = tex(p.roof, 2, 8);
      // concrete parking pad
      box(g, tex('concrete_broom', 2.5, 4), 370, 8, 566, 0, 0, 0);
      // six square posts on the pad — clear span underneath for a car
      for (const sx of [-1, 1]) for (const z of [-255, 0, 255]) {
        box(g, steel, 9, 216, 9, sx * 170, 8, z);
      }
      // side beams running the full length
      for (const sx of [-1, 1]) box(g, steel, 10, 12, 560, sx * 170, 216, 0);
      // knee braces at the end posts
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        strut(g, steel, sx * 170, 178, sz * 255, sx * 170, 222, sz * 200, 3.2);
      }
      // arched cross-bows carrying the roof
      for (const z of [-255, 0, 255]) {
        sweep(g, steel, [
          [-172, 224, z], [-86, 244, z], [0, 250, z], [86, 244, z], [172, 224, z]
        ], 3, { seg: 24 });
      }
      // three corrugated roof sheets forming the shallow arch
      box(g, corr, 150, 5, 574, 0, 250, 0);
      for (const sx of [-1, 1]) {
        box(g, corr, 110, 5, 574, sx * 125, 234, 0, { rz: sx * -0.2 });
      }
      return g;
    }
  },

  // ---- Modern studio ADU / backyard office ----------------------------------
  {
    id: 'struct_studio_adu', name: 'Backyard Studio ADU', cat: 'structure',
    w: 500, d: 420, h: 290,
    palettes: [
      { name: 'Charcoal & Cedar', chip: '#44484d', sid: 'siding_charcoal', cedar: '#a97a4e' },
      { name: 'Iron Ore', chip: '#3a3d40', sid: 'siding_ironore', cedar: '#b58a54' },
      { name: 'Seasalt', chip: '#dfe3dc', sid: 'siding_seasalt', cedar: '#9c7550' }
    ],
    plan: { type: 'shed' },
    build: (p) => {
      const g = G();
      const wallT = tex(p.sid, 2.5, 1.5);
      const cedar = wood(p.cedar, 0.55);
      const dark = solid('#26282c', 0.6);
      // U-shell: back + two side walls (front is glass + cedar)
      box(g, wallT, 480, 262, 16, 0, 0, -192);
      box(g, wallT, 16, 262, 384, -232, 0, -8);
      box(g, wallT, 16, 262, 400, 232, 0, 0);
      // cedar slat accent section (front left) with flush entry door
      box(g, dark, 160, 262, 10, -160, 0, 187);
      for (let i = 0; i < 5; i++) {
        box(g, cedar, 7, 262, 5, -236 + i * 14, 0, 194);
      }
      box(g, wood('#2e3134', 0.4), 90, 224, 6, -121, 0, 191);
      cyl(g, metal('#c6cace', 0.3), 1.3, 60, -86, 100, 196);      // pull bar
      for (const y of [232, 246]) box(g, cedar, 90, 6, 5, -121, y, 194);
      // window-wall framing: mullions + header + sill channel
      for (const mx of [-76, 25, 126, 219]) box(g, dark, 10, 252, 10, mx, 0, 187);
      box(g, dark, 305, 10, 12, 71.5, 252, 187);
      box(g, dark, 295, 5, 10, 71.5, 0, 187);
      // interior visible through the glass wall
      box(g, tex('oak', 2, 2), 444, 6, 356, 0, 2, -6);
      box(g, tex('carpet_gray', 1.5, 1), 170, 3, 120, 40, 8, 60);
      box(g, wood('#5a4634', 0.5), 160, 55, 42, 60, 8, -160);     // credenza
      cyl(g, solid('#b8b4ac', 0.8), 14, 30, -180, 8, -150, { rTop: 16 });
      foliage(g, '#3f5f2c', '#88b04c', -180, 60, -150, 22, 6, 17);
      box(g, wood('#7a6248', 0.5), 130, 6, 60, 120, 70, 120);     // desk
      for (const sx of [-1, 1]) box(g, dark, 5, 70, 55, 120 + sx * 58, 8, 120);
      box(g, solid('#1a1c1e', 0.4), 50, 32, 4, 120, 80, 110);     // monitor
      cyl(g, dark, 17, 4, 100, 8, 55);                            // chair base
      cyl(g, dark, 2.5, 30, 100, 12, 55);
      box(g, solid('#4a4e54', 0.7), 40, 8, 40, 100, 42, 55, { r: 3 });
      box(g, solid('#4a4e54', 0.7), 38, 42, 8, 100, 48, 74, { r: 3 });
      cyl(g, dark, 0.5, 40, 60, 218, 40);                         // pendant cord
      sphere(g, glow('#ffe2b0', 1.1, 0.4), 7, 60, 214, 40);
      // flat roof slab with big front overhang + light coping cap
      box(g, dark, 524, 16, 452, 0, 258, 8);
      box(g, solid('#c8c4ba', 0.8), 512, 5, 440, 0, 274, 8);
      // entry step
      box(g, tex('concrete_broom', 1, 0.5), 110, 12, 50, -121, 0, 214);
      // GLASS LAST: three full-height panes
      box(g, glass(), 91, 246, 2.5, -25.5, 4, 187);
      box(g, glass(), 91, 246, 2.5, 75.5, 4, 187);
      box(g, glass(), 83, 246, 2.5, 172.5, 4, 187);
      return g;
    }
  },

  // ---- Victorian glass greenhouse -------------------------------------------
  {
    id: 'struct_greenhouse_victorian', name: 'Victorian Greenhouse', cat: 'structure',
    w: 380, d: 470, h: 350,
    palettes: null, plan: { type: 'greenhouse' },
    build: () => {
      const g = G();
      const frameW = solid('#e9e6de', 0.5);
      const gl = glass();
      // brick kick-wall base
      box(g, tex('brick_red', 2.5, 0.5), 360, 55, 460, 0, 0, 0);
      // corner posts + wall mullions (white painted steel)
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        box(g, frameW, 8, 185, 8, sx * 176, 55, sz * 222);
      }
      for (const sx of [-1, 1]) for (const z of [-152, -76, 0, 76, 152]) {
        box(g, frameW, 5, 185, 5, sx * 176, 55, z);
      }
      for (const sz of [-1, 1]) for (const x of [-112, -44, 44, 112]) {
        box(g, frameW, 5, 185, 5, x, 55, sz * 226);
      }
      // eave beams + gable fascia
      for (const sx of [-1, 1]) box(g, frameW, 10, 8, 470, sx * 178, 236, 0);
      for (const sz of [-1, 1]) box(g, frameW, 372, 8, 8, 0, 236, sz * 232);
      // white rafters riding the glass roof slopes
      for (const sx of [-1, 1]) for (const z of [-150, -50, 50, 150]) {
        box(g, frameW, 200, 5, 6, sx * 90, 279.5, z, { rz: sx * -0.43 });
      }
      // raised ridge-vent risers + crest rail + turned finials
      for (const sx of [-1, 1]) box(g, frameW, 5, 16, 396, sx * 15, 310, 0);
      box(g, frameW, 6, 5, 416, 0, 345, 0);
      for (const sz of [-1, 1]) {
        const f = lathe(g, frameW, [[3, 0], [1.2, 5], [2.8, 8], [0.2, 15]], 0, 342, sz * 206, { seg: 16 });
        f.rotation.y = 0;
      }
      // glazed entry door on the front gable
      for (const sx of [-1, 1]) box(g, frameW, 6, 205, 6, sx * 42, 0, 232);
      box(g, frameW, 96, 8, 6, 0, 205, 232);
      box(g, frameW, 78, 60, 5, 0, 0, 231);                       // lower panel
      box(g, frameW, 84, 6, 5, 0, 60, 231.5);                     // mid rail
      cyl(g, metal('#3a3d42', 0.4), 1, 24, 28, 84, 235);          // pull
      box(g, solid('#a9a396', 0.9), 90, 6, 26, 0, 0, 246, { r: 2 }); // stone step
      // interior potting bench with terracotta pots (visible through glass)
      box(g, wood('#7a6248', 0.6), 150, 7, 44, -85, 82, -40);
      for (const lx of [-150, -20]) box(g, wood('#7a6248', 0.6), 7, 82, 38, lx, 0, -40);
      for (const [px, seed] of [[-120, 3], [-55, 7]]) {
        lathe(g, solid('#b06a4a', 0.8), [[5, 0], [7.5, 1], [8.6, 10], [9.6, 11.5], [9, 12.8], [7, 12.2]], px, 89, -40, { seg: 20 });
        cyl(g, solid('#2b2016', 0.98), 7.6, 1.5, px, 98.7, -40, { seg: 16 });
        foliage(g, seed === 3 ? '#5f7f3c' : '#4f6f2c', seed === 3 ? '#9dc25a' : '#8db84e', px, 108, -40, 14, 5, seed);
      }
      // tall floor plant near the back corner
      lathe(g, solid('#b06a4a', 0.8), [[7, 0], [10, 1.2], [11.5, 14], [12.6, 16], [12, 17.5], [9.6, 16.8]], 110, 55, -140, { seg: 20 });
      cyl(g, solid('#2b2016', 0.98), 10, 1.5, 110, 70, -140, { seg: 16 });
      foliage(g, '#4f6f2c', '#8db84e', 110, 84, -140, 16, 6, 11);
      // GLASS LAST: wall box, main roof, ridge-vent roof, door pane
      box(g, gl, 348, 185, 448, 0, 55, 0);
      const roof = prism(g, gl, 472, 85, 380, 0, 240, 0);
      roof.rotation.y = Math.PI / 2;
      const vent = prism(g, gl, 410, 24, 70, 0, 324, 0);
      vent.rotation.y = Math.PI / 2;
      box(g, gl, 76, 138, 2, 0, 64, 230.5);
      return g;
    }
  },

  // ---- Firewood lean-to -----------------------------------------------------
  {
    id: 'struct_firewood_leanto', name: 'Firewood Lean-To', cat: 'structure',
    w: 270, d: 130, h: 210,
    palettes: WOODS, plan: { type: 'shed' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.65);
      // posts: tall at the open front, short at the back (mono pitch)
      for (const sx of [-1, 1]) {
        box(g, wd, 9, 198, 9, sx * 126, 0, 42);
        box(g, wd, 9, 162, 9, sx * 126, 0, -42);
        strut(g, wd, sx * 126, 196, 44, sx * 126, 160, -46, 4);
      }
      // corrugated roof sloping to the back
      box(g, tex('corrugated_gray', 4, 2), 290, 5, 128, 0, 179.5, 0, { rx: -0.37 });
      // back + side slat walls
      for (const y of [25, 65, 105, 138]) box(g, wd, 252, 13, 4, 0, y, -47);
      for (const sx of [-1, 1]) for (const y of [45, 95]) {
        box(g, wd, 4, 13, 86, sx * 128, y, 0);
      }
      // raised plank floor keeps the wood dry
      box(g, wood('#6a533a', 0.75), 248, 8, 92, 0, 0, 0);
      // stacked split logs — ends facing out (the intrigue IS the stack)
      const tones = [wood('#b99a6e', 0.85), wood('#a5825a', 0.85), wood('#8a6a48', 0.85)];
      let s = 77;
      const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
      const rows = [[17, 8], [33.5, 8], [50, 8], [66.5, 8], [82, 5]];
      for (let ri = 0; ri < rows.length; ri++) {
        const [ry, n] = rows[ri];
        for (let i = 0; i < n; i++) {
          const lx = -112 + i * 20.5 + (ri % 2) * 9 + (rnd() - 0.5) * 3;
          const r = 7.5 + rnd() * 2;
          cyl(g, tones[(i + ri) % 3], r, 84 + rnd() * 4, lx, ry, (rnd() - 0.5) * 6, { rx: Math.PI / 2, seg: 12 });
        }
      }
      // chopping block + leaning axe beside the stack
      cyl(g, wood('#7a5c3c', 0.9), 17, 34, 92, 8, 8, { seg: 18 });
      box(g, metal('#7a7e83', 0.35), 10, 8, 5, 114, 8, 22, { ry: 0.4 });
      strut(g, wood('#9c7550', 0.6), 114, 14, 22, 102, 60, 34, 1.8);
      return g;
    }
  },

  // ---- Gambrel storage barn ---------------------------------------------------
  {
    id: 'struct_barn_gambrel', name: 'Gambrel Barn', cat: 'structure',
    w: 350, d: 330, h: 340,
    palettes: [
      { name: 'Barn Red', chip: '#7c3b34', sid: 'siding_barnred', roof: '#4a4d52' },
      { name: 'Charcoal', chip: '#44484d', sid: 'siding_charcoal', roof: '#3a3d41' },
      { name: 'Hunter', chip: '#39503f', sid: 'siding_hunter', roof: '#4f4a42' }
    ],
    plan: { type: 'shed' },
    build: (p) => {
      const g = G();
      const wallT = tex(p.sid, 2, 1);
      const roofM = solid(p.roof, 0.7);
      const trimW = solid('#e8e4da', 0.55);
      // main body
      box(g, wallT, 340, 170, 320, 0, 0, 0);
      // gambrel roof: steep lower panels + shallow upper prism (ridge along z)
      for (const sx of [-1, 1]) {
        box(g, roofM, 124, 7, 340, sx * 131, 210.5, 0, { rz: sx * -0.87 });
      }
      const upper = prism(g, roofM, 344, 80, 204, 0, 256, 0, roofM);
      upper.rotation.y = Math.PI / 2;
      // gable-end fill (stepped boxes + cap prism, recessed to avoid z-fights)
      for (const sz of [-1, 1]) {
        box(g, wallT, 264, 46, 12, 0, 168, sz * 154);
        box(g, wallT, 190, 40, 12, 0, 212, sz * 153.7);
        const cap = prism(g, wallT, 12, 82, 190, 0, 250, sz * 153.4, wallT);
        cap.rotation.y = Math.PI / 2;
      }
      // corner trim
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        box(g, trimW, 10, 170, 10, sx * 166, 0, sz * 152);
      }
      // X-brace double doors with white surround
      box(g, trimW, 156, 10, 6, 0, 132, 162);
      for (const sx of [-1, 1]) box(g, trimW, 10, 136, 6, sx * 72, 0, 162);
      for (const sx of [-1, 1]) {
        box(g, wood('#6a4f38', 0.6), 66, 128, 5, sx * 34, 2, 160.5);
        for (const sd of [-1, 1]) {
          box(g, wood('#5a4230', 0.6), 7, 138, 2.5, sx * 34, -2, 163.5, { rz: sd * 0.47 });
        }
        cyl(g, metal('#9a9ea4', 0.3), 1.4, 12, sx * 8, 62, 163.8);
      }
      // loft window with muntin cross
      box(g, trimW, 50, 56, 3, 0, 196, 160.8);
      box(g, trimW, 3, 46, 2, 0, 200, 162.6);
      box(g, trimW, 40, 3, 2, 0, 221, 162.6);
      // hay-hoist beam + pulley + rope at the ridge (intrigue)
      box(g, trimW, 8, 8, 40, 0, 318, 172);
      cyl(g, metal('#5a5e62', 0.4), 4, 4, 0, 312, 186, { rz: Math.PI / 2 });
      cyl(g, solid('#b8a684', 0.9), 0.7, 26, 0, 286, 186);
      // GLASS LAST: loft window pane
      box(g, glass(), 42, 48, 2, 0, 199, 161.6);
      return g;
    }
  },

  // ---- Pool cabana ------------------------------------------------------------
  {
    id: 'struct_pool_cabana', name: 'Pool Cabana', cat: 'structure',
    w: 340, d: 300, h: 285,
    palettes: [
      { name: 'Ivory & Teak', chip: '#efe9dc', canvas: '#efe9dc', wood: '#b58a54' },
      { name: 'Slate & Cedar', chip: '#5a6068', canvas: '#5a6068', wood: '#9c7550' }
    ],
    plan: { type: 'pergola' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.6);
      const canvas = solid(p.canvas, 0.92);
      const curt = solid('#f6f2ea', 0.9);
      // wood deck platform
      box(g, tex('deck_wood', 1, 1), 320, 12, 280, 0, 0, 0);
      // posts + perimeter beams
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        box(g, wd, 12, 226, 12, sx * 140, 12, sz * 120);
      }
      for (const sz of [-1, 1]) box(g, wd, 300, 12, 10, 0, 226, sz * 120);
      for (const sx of [-1, 1]) box(g, wd, 10, 12, 260, sx * 140, 226, 0);
      // canvas hip roof + finial
      pyramid(g, canvas, 360, 72, 320, 0, 234, 0);
      sphere(g, wd, 5, 0, 308, 0);
      // louvered privacy wall at the back
      for (const y of [24, 58, 92, 126, 160]) {
        box(g, wd, 272, 10, 4, 0, y, -114, { rx: 0.42 });
      }
      box(g, wd, 272, 8, 6, 0, 12, -114);
      box(g, wd, 272, 8, 6, 0, 188, -114);
      // sheer curtains at the front corners + one side (paired for two faces)
      for (const sx of [-1, 1]) {
        drape(g, curt, 70, 218, sx * 118, 234, 116, { sag: 4, wave: 8, folds: 5, seed: sx * 3 });
        drape(g, curt, 70, 218, sx * 118, 234, 115.2, { sag: 4, wave: 8, folds: 5, seed: -sx * 3, ry: Math.PI });
      }
      drape(g, curt, 84, 218, 137, 234, -30, { sag: 4, wave: 8, folds: 5, seed: 8, ry: -Math.PI / 2 });
      drape(g, curt, 84, 218, 136.2, 234, -30, { sag: 4, wave: 8, folds: 5, seed: -8, ry: Math.PI / 2 });
      // lounge inside: teak chaise with cushions + towel
      box(g, wd, 150, 10, 56, -50, 12, 20);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        box(g, wd, 5, 12, 5, -50 + sx * 68, 0, 20 + sz * 22);
      }
      cushion(g, solid('#e8e2d2', 0.85), 146, 10, 52, -50, 22, 20, { puff: 0.2 });
      cushion(g, solid('#e8e2d2', 0.85), 42, 9, 50, -114, 40, 20, { puff: 0.22, rz: 1.05 });
      box(g, solid('#d86a5a', 0.9), 38, 4, 30, -8, 32.5, 20, { r: 2 });
      // side table with a cold drink (intrigue)
      cyl(g, wd, 16, 40, 60, 12, -40, { seg: 20 });
      cyl(g, solid('#d8913c', 0.35), 3, 9, 60, 52, -40, { seg: 12 });
      return g;
    }
  },

  // ---- Covered breezeway walkway ----------------------------------------------
  {
    id: 'struct_breezeway', name: 'Covered Breezeway', cat: 'structure',
    w: 630, d: 220, h: 255,
    palettes: WOODS, plan: { type: 'pergola' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.65);
      // walkway slab
      box(g, tex('concrete_broom', 4, 1), 600, 6, 140, 0, 0, 0);
      // five post bays
      for (const x of [-280, -140, 0, 140, 280]) {
        for (const sz of [-1, 1]) box(g, wd, 10, 218, 10, x, 0, sz * 80);
      }
      // long beams
      for (const sz of [-1, 1]) box(g, wd, 632, 14, 10, 0, 218, sz * 80);
      // knee braces at ends + center
      for (const x of [-280, 0, 280]) for (const sd of [-1, 1]) {
        if (x === -280 && sd < 0) continue;
        if (x === 280 && sd > 0) continue;
        for (const sz of [-1, 1]) {
          strut(g, wd, x, 172, sz * 80, x + sd * 55, 222, sz * 80, 3.4);
        }
      }
      // repeating rafters with overhung tails + two purlins
      for (let x = -288; x <= 288; x += 36) {
        box(g, wd, 8, 12, 220, x, 232, 0);
      }
      for (const sz of [-1, 1]) box(g, wd, 632, 6, 8, 0, 244, sz * 40);
      // string lights zig-zagging between the beams (intrigue)
      const pts = [];
      for (let i = 0; i <= 8; i++) {
        pts.push([-280 + i * 70, i % 2 === 0 ? 214 : 202, i % 2 === 0 ? -76 : 76]);
      }
      sweep(g, solid('#2a2c2e', 0.7), pts, 0.7, { seg: 48 });
      for (let i = 1; i < 8; i++) {
        sphere(g, glow('#ffd9a0', 1.2, 0.4), 2.4, pts[i][0], pts[i][1] - 3.5, pts[i][2], { seg: 10 });
      }
      return g;
    }
  },

  // ---- Kids playhouse tower ----------------------------------------------------
  {
    id: 'struct_playhouse_tower', name: 'Playhouse Tower', cat: 'structure',
    w: 375, d: 260, h: 320,
    palettes: [
      { name: 'Seasalt', chip: '#dfe3dc', sid: 'siding_seasalt', roof: 'shingle_red', slide: '#3d9fd8' },
      { name: 'Butter', chip: '#efd98a', sid: 'siding_softyellow', roof: 'shingle_charcoal', slide: '#4cae54' }
    ],
    plan: { type: 'shed' },
    build: (p) => {
      const g = G();
      const wd = wood('#9c7550', 0.65);
      const slideM = solid(p.slide, 0.4);
      const trimW = solid('#f2efe6', 0.55);
      // tower posts + cross bracing + elevated deck
      for (const x of [-165, -15]) for (const sz of [-1, 1]) {
        box(g, wd, 10, 128, 10, x, 0, sz * 70);
      }
      strut(g, wd, -165, 8, -70, -15, 100, -70, 3);
      strut(g, wd, -15, 8, -70, -165, 100, -70, 3);
      box(g, tex('deck_wood', 0.5, 0.5), 170, 12, 170, -90, 128, 0);
      // sandbox underneath (intrigue) with a toy bucket
      box(g, tex('real_sand', 1, 1), 150, 10, 140, -90, 0, 0);
      cyl(g, solid('#e8b64a', 0.5), 7, 9, -60, 10, 40, { rTop: 8, seg: 14 });
      // little house on the deck
      box(g, tex(p.sid, 1, 1), 110, 105, 110, -120, 140, -25);
      prism(g, tex(p.roof, 1, 1), 130, 55, 130, -120, 245, -25, tex(p.sid, 1, 1));
      // kid door + windows (trim now, glass later)
      box(g, trimW, 42, 64, 4, -95, 142, 31);
      box(g, wood('#6a4f38', 0.55), 34, 56, 4, -95, 144, 33);
      sphere(g, metal('#c8b070', 0.3), 1.5, -105, 172, 35.5);
      box(g, trimW, 30, 30, 4, -145, 180, 31);
      box(g, trimW, 5, 34, 34, -176, 178, -25);
      // deck railing (front + left) with pickets
      box(g, wd, 160, 6, 8, -90, 180, 82);
      for (const x of [-160, -125, -90, -55, -20]) box(g, wd, 5, 42, 4, x, 140, 82);
      box(g, wd, 8, 6, 55, -171, 180, 57);
      for (const z of [40, 72]) box(g, wd, 4, 42, 5, -171, 140, z);
      // captain's steering wheel on the front rail (intrigue)
      cyl(g, wd, 1.6, 10, -30, 180, 84);
      torus(g, wood('#6a4f38', 0.5), 11, 2, -30, 192, 85, { rx: 0 });
      cyl(g, wood('#6a4f38', 0.5), 1.2, 26, -30, 179, 85);
      cyl(g, wood('#6a4f38', 0.5), 1.2, 26, -30, 192, 85, { rz: Math.PI / 2 });
      sphere(g, wood('#6a4f38', 0.5), 2.6, -30, 192, 85.5);
      // ladder up the right side
      strut(g, wd, -8, 126, 40, 62, 0, 40, 3);
      strut(g, wd, -8, 126, 64, 62, 0, 64, 3);
      for (const t of [0.2, 0.4, 0.6, 0.8]) {
        cyl(g, wd, 1.8, 30, -8 + 70 * t, 126 - 126 * t, 52, { rx: Math.PI / 2, seg: 10 });
      }
      // slide from the deck edge down to a ground flare
      box(g, slideM, 213, 5, 44, 85, 71.5, 0, { rz: -0.646 });
      for (const sz of [-1, 1]) box(g, slideM, 213, 12, 4, 85, 75, sz * 21, { rz: -0.646 });
      box(g, slideM, 36, 4, 44, 184, 2, 0, { r: 2 });
      box(g, wd, 8, 62, 8, 85, 0, 10);
      // pennant flag at the roof peak
      cyl(g, metal('#8a8e93', 0.35), 1, 42, -120, 296, -25);
      buildFlag(g, flagTexture('kid', p.slide, '#f4efe2'), 30, 18, -119, 330, -25);
      // GLASS LAST: house windows
      box(g, glass(), 24, 24, 2, -145, 183, 34);
      box(g, glass(), 2, 26, 26, -178, 182, -25);
      return g;
    }
  }
];
