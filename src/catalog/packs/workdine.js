// Office + dining pack — desks, chairs, storage; dining tables, sideboards, bar
// seating. All dimensions in cm; origin centered on floor; +Z front. Every item
// carries an explicit cat ('office' | 'dining') — this pack is NOT auto-tagged.
import {
  G, box, cyl, sphere, legs4, handleBar, knob, solid, glow, wood, metal, chrome,
  glass, tex, lathe, cushion, sweep, segment, strut, torus, blob, foliage,
  artMaterial
} from '../builders.js';

const WOODS = [
  { name: 'Walnut', chip: '#5f4632', wood: '#5f4632', tex: 'real_walnut_strip' },
  { name: 'Oak', chip: '#a07a4f', wood: '#a07a4f', tex: 'real_strip_oak' },
  { name: 'Caramel', chip: '#8a5a34', wood: '#8a5a34', tex: 'real_caramel_plank' },
  { name: 'Black', chip: '#3a3735', wood: '#3a3735', tex: 'real_walnut_strip' }
];
const SEAT = [
  { name: 'Dove Grey', chip: '#8e8e92', fabric: 'fabric_gray', wood: '#4a4038' },
  { name: 'Oat Beige', chip: '#c4b49a', fabric: 'fabric_beige', wood: '#6a4f36' },
  { name: 'Slate Blue', chip: '#5a6e8c', fabric: 'fabric_blue', wood: '#3a3735' },
  { name: 'Sage', chip: '#6d7d64', fabric: 'fabric_green', wood: '#5f4632' }
];
const dark = '#33312e';
const seatMat = (p) => tex(p.fabric, 2, 2);
const BRASS = '#b08d57';

/** Flat-screen monitor on a disc-foot stand; front faces +Z; base at y. */
function monitor(g, w, h, x, y, z, ry = 0, emis = '#2e5a7c', inten = 0.55) {
  const sub = G();
  const shell = solid('#17181b', 0.45);
  cyl(sub, shell, 7, 1.6, 0, 0, 2, { seg: 20 });
  cyl(sub, shell, 1.8, 14, 0, 1.2, 2.4, { rTop: 1.5 });
  box(sub, shell, w, h, 2.2, 0, 9, 0, { r: 0.8, rx: -0.07 });
  box(sub, glow('#101c26', inten, 0.25, emis), w - 3.5, h - 3.5, 1, 0, 10.5, 1.2, { rx: -0.07 });
  sub.position.set(x, y, z);
  sub.rotation.y = ry;
  g.add(sub);
  return sub;
}

/** 5-star castered chair base + gas lift; hub top ends at y≈33. */
function starBase(g) {
  const alum = metal('#8e9297', 0.35);
  const shell = solid('#1c1c1e', 0.5);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + Math.PI / 10;
    const fx = Math.cos(a) * 25, fz = Math.sin(a) * 25;
    strut(g, alum, Math.cos(a) * 4, 9, Math.sin(a) * 4, fx, 5, fz, 2.6, { rTop: 1.8 });
    sphere(g, solid('#141416', 0.45), 3.2, fx, 3.2, fz);
    cyl(g, shell, 1.6, 4, fx, 5.6, fz);
  }
  cyl(g, alum, 4.5, 6, 0, 4, 0, { rTop: 3.6 });
  cyl(g, chrome(), 2.2, 24, 0, 9, 0);
  cyl(g, shell, 3.4, 13, 0, 9, 0, { rTop: 2.9 });
}

/** Wine bottle lying near-horizontal, neck toward +z and dipping down. */
function bottleAngled(g, hex, x, y, z) {
  const m = solid(hex, 0.3);
  segment(g, m, [x, y, z], [x, y - 4, z + 15.5], 4, 3.6, 12);
  segment(g, m, [x, y - 4, z + 15.5], [x, y - 6, z + 23], 2.2, 1.3, 8);
  sphere(g, solid('#8a2d33', 0.5), 1.5, x, y - 6, z + 23, { seg: 10 });
}

/** Standing wine/spirits bottle (lathe profile), base at y. */
function bottleStanding(g, hex, x, y, z, s = 1) {
  lathe(g, solid(hex, 0.28), [
    [3.4 * s, 0], [3.7 * s, 1.5 * s], [3.7 * s, 16 * s], [2.4 * s, 19 * s],
    [1.2 * s, 22 * s], [1.15 * s, 26 * s], [1.5 * s, 26.8 * s], [1.2 * s, 27.6 * s]
  ], x, y, z, { seg: 18 });
}

export const WORKDINE_ITEMS = [

  // ======================================================== OFFICE (13)
  // -------------------------------------------- standing desk, dual monitors
  {
    id: 'wd_desk_standing', name: 'Standing Desk (Dual Monitors)', cat: 'office',
    w: 150, d: 70, h: 142, palettes: WOODS, plan: { type: 'table' },
    build: (p) => {
      const g = G();
      const m = metal('#2e3034', 0.4);
      box(g, tex(p.tex, 1, 1), 150, 4, 70, 0, 103, 0, { r: 1.2 });   // raised top
      for (const s of [-1, 1]) {                                      // lifting legs
        box(g, m, 12, 3, 62, s * 60, 0, 0, { r: 1.4 });               // T-foot
        box(g, m, 7, 55, 7, s * 60, 3, 0);                            // lower column
        box(g, m, 5.2, 47, 5.2, s * 60, 57, 0);                       // telescoped upper
      }
      box(g, m, 110, 5, 5, 0, 86, 0);                                 // crossbar
      box(g, solid('#1b1c1e', 0.5), 10, 2.5, 6, 48, 100.4, 30);       // height paddle
      monitor(g, 46, 28, -24, 107, -21, 0.15);
      monitor(g, 46, 28, 24, 107, -21, -0.15);
      box(g, solid('#2e3a44', 0.85), 72, 0.8, 34, 4, 107, 10, { r: 0.4 }); // desk mat
      box(g, solid('#26282a', 0.4), 44, 1.8, 15, -6, 107.8, 10, { r: 0.8 }); // keyboard
      sphere(g, solid('#26282a', 0.4), 3, 30, 109.3, 10, { sy: 0.55, sx: 0.72 }); // mouse
      cyl(g, solid('#8a4a3a', 0.5), 3.4, 9, -58, 107, 18);            // coffee mug
      torus(g, solid('#8a4a3a', 0.5), 2.2, 0.7, -53.8, 111.5, 18, { seg: 16 });
      return g;
    }
  },
  // -------------------------------------------- L-shaped corner desk setup
  {
    id: 'wd_desk_corner', name: 'Corner L-Desk Setup', cat: 'office',
    w: 170, d: 170, h: 115, palettes: WOODS, plan: { type: 'table' },
    build: (p) => {
      const g = G();
      const t = tex(p.tex, 1, 1), wd = wood(p.wood, 0.5);
      box(g, t, 170, 5, 60, 0, 70, -55, { r: 1 });                    // main run
      box(g, t, 60, 5, 110, -55, 70, 30, { r: 1 });                   // return run
      box(g, wd, 4, 70, 54, -83, 0, -55);                             // end panels
      box(g, wd, 56, 70, 4, -55, 0, 83);
      // drawer pedestal under the main run
      box(g, wd, 40, 62, 52, 60, 4, -55, { r: 1 });
      for (let r = 0; r < 3; r++) {
        box(g, wood(p.wood, 0.42), 34, 16, 1.5, 60, 8 + r * 19, -28.6);
        handleBar(g, 60, 16 + r * 19, -27.6, 12);
      }
      monitor(g, 50, 30, -52, 75, -52, Math.PI / 4);                  // corner monitor
      const pad = box(g, solid('#2e3a44', 0.85), 60, 0.8, 32, -36, 75, -36, { r: 0.4 });
      pad.rotation.y = Math.PI / 4;
      const kb = box(g, solid('#26282a', 0.4), 42, 1.8, 14, -35, 75.8, -35, { r: 0.8 });
      kb.rotation.y = Math.PI / 4;
      cyl(g, solid('#3a3d42', 0.6), 4, 9, 8, 75, -66);                // pen cup
      for (const [dx, rz] of [[-1.2, 0.12], [1, -0.1]])
        cyl(g, solid('#c9a13a', 0.6), 0.5, 11, 8 + dx, 74.5, -66, { rz });
      cyl(g, solid('#b5654a', 0.7), 6, 10, -55, 75, 62, { rTop: 7 }); // potted plant
      blob(g, '#4a6e3a', '#5d8348', 9, -55, 88, 62, { seed: 7, sy: 0.9 });
      return g;
    }
  },
  // -------------------------------------------- executive desk
  {
    id: 'wd_desk_exec', name: 'Executive Desk', cat: 'office',
    w: 190, d: 90, h: 77, palettes: WOODS, plan: { type: 'table' },
    build: (p) => {
      const g = G();
      const t = tex(p.tex, 1, 1), wd = wood(p.wood, 0.5);
      const brass = metal(BRASS, 0.3);
      box(g, t, 190, 6, 90, 0, 70, 0, { r: 1.5 });                    // slab top
      for (const s of [-1, 1]) {                                      // pedestals
        box(g, wd, 46, 8, 74, s * 68, 0, 0);
        box(g, t, 46, 62, 78, s * 68, 8, 0, { r: 1 });
        for (let r = 0; r < 3; r++) {                                 // drawers face -z
          box(g, wood(p.wood, 0.42), 40, 17, 1.5, s * 68, 11 + r * 19, -39.6);
          handleBar(g, s * 68, 20 + r * 19, -40.6, 14, false, brass);
        }
      }
      box(g, wd, 88, 46, 3, 0, 20, 39.5);                             // modesty panel
      box(g, solid('#5a2e28', 0.55), 62, 1, 42, 0, 76, -12, { r: 0.5 }); // leather blotter
      // banker's lamp: brass stem + green glass shade over a warm bulb
      cyl(g, brass, 3.8, 1.4, -66, 76, -30, { seg: 18 });
      cyl(g, brass, 1, 16, -66, 77, -30);
      sphere(g, glow('#fff2cc', 1.1, 0.4), 2.1, -66, 93.6, -25.6);
      box(g, solid('#2e5c46', 0.3), 16, 5, 9, -66, 94.6, -27, { r: 2.4, rx: 0.12 });
      box(g, solid('#1d1e20', 0.5), 16, 2.5, 20, 58, 76, -24, { r: 1 }); // desk phone
      box(g, solid('#1d1e20', 0.5), 4.5, 2.5, 18, 51.5, 78, -24, { r: 1.2 });
      return g;
    }
  },
  // -------------------------------------------- ergonomic task chair
  {
    id: 'wd_chair_task', name: 'Ergonomic Task Chair', cat: 'office',
    w: 64, d: 64, h: 97, palettes: SEAT, plan: { type: 'officeChair' },
    build: (p) => {
      const g = G();
      const f = seatMat(p);
      const shell = solid('#1c1c1e', 0.5);
      starBase(g);
      box(g, shell, 32, 3, 28, 0, 37, 1, { r: 1 });                   // tilt mechanism
      cushion(g, f, 47, 9, 44, 0, 40, 1, { puff: 0.2, dimple: 0.55 }); // contoured seat
      cushion(g, f, 43, 8, 12, 0, 39.4, 20, { puff: 0.3, dimple: 0.05, rx: 0.24 }); // waterfall lip
      box(g, shell, 40, 44, 2.5, 0, 52, -26.5, { r: 2, rx: -0.1 });   // back shell
      cushion(g, f, 43, 47, 8, 0, 49, -23, { puff: 0.2, dimple: 0.06, rx: -0.1 }); // back pad
      cushion(g, f, 37, 13, 5.5, 0, 57, -18.3, { puff: 0.32, dimple: 0.04, rx: -0.1 }); // lumbar bulge
      for (const s of [-1, 1]) {                                       // adjustable arms
        strut(g, shell, s * 20, 41, 6, s * 26, 60, 0, 2.8);
        box(g, solid('#242427', 0.6), 7.5, 3.2, 25, s * 26.5, 60, -4, { r: 1.5 });
      }
      return g;
    }
  },
  // -------------------------------------------- ladder bookshelf
  {
    id: 'wd_shelf_ladder', name: 'Ladder Bookshelf', cat: 'office',
    w: 70, d: 44, h: 180, palettes: WOODS, plan: { type: 'storage' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.5);
      for (const s of [-1, 1]) box(g, wd, 5, 182, 4, s * 32.5, -0.4, 8, { rx: -0.17 }); // leaning rails
      const shelves = [[26, 36], [65, 30], [104, 24], [143, 18]];      // [y, depth]
      const books = ['#7c4434', '#39506b', '#5d7a4c', '#c2b49a', '#40474f'];
      for (const [y, dep] of shelves) {
        const zr = 23.4 - 0.1724 * y;                                  // rail line
        box(g, wd, 61, 3, dep, 0, y, zr - dep / 2 + 2, { r: 0.6 });
      }
      // books on the two middle shelves (heights vary, one leans)
      for (let b = 0; b < 5; b++)
        box(g, solid(books[b], 0.75), 4, 20 + (b % 3) * 3, 20, -18 + b * 8, 68, 3.5, { ry: b === 4 ? 0.28 : 0 });
      for (let b = 0; b < 4; b++)
        box(g, solid(books[(b + 2) % 5], 0.75), 3.8, 17 + (b % 2) * 4, 16, -14 + b * 8, 107, 0.5);
      box(g, solid('#a8845c', 0.9), 34, 15, 26, -8, 29, 5.5, { r: 3 }); // woven basket
      cyl(g, solid('#c9bfa8', 0.6), 5.5, 9, 8, 146, -6);               // top-shelf plant
      blob(g, '#4a6e3a', '#5d8348', 8, 8, 156, -6, { seed: 9, sy: 0.85 });
      return g;
    }
  },
  // -------------------------------------------- 3-drawer filing cabinet
  {
    id: 'wd_filing', name: 'Filing Cabinet', cat: 'office',
    w: 46, d: 64, h: 103, palettes: [
      { name: 'Graphite', chip: '#565b63', body: '#565b63' },
      { name: 'Bone', chip: '#d9d4c8', body: '#d9d4c8' },
      { name: 'Forest', chip: '#3a5240', body: '#3a5240' }
    ],
    plan: { type: 'storage' },
    build: (p) => {
      const g = G();
      const steel = solid(p.body, 0.5);
      const pull = metal('#9a9ea4', 0.3);
      box(g, solid('#26282a', 0.7), 40, 2, 54, 0, 0, 0);              // plinth
      box(g, steel, 44, 100, 58, 0, 2, 0, { r: 1.5 });                // body
      for (const y of [8, 40]) {                                       // closed drawers
        box(g, steel, 40, 28, 1.5, 0, y, 28.6, { r: 0.8 });
        handleBar(g, 0, y + 21, 30, 16, false, pull);
        box(g, pull, 8, 3.5, 0.5, 0, y + 12, 29.6);                    // label holder
      }
      // top drawer pulled open: shallow tub + hanging folders standing proud
      box(g, steel, 38, 10, 40, 0, 74, 16);
      box(g, steel, 40, 28, 1.5, 0, 72, 36.6, { r: 0.8 });
      handleBar(g, 0, 93, 38, 16, false, pull);
      box(g, pull, 8, 3.5, 0.5, 0, 84, 37.6);
      const folder = ['#5d7a4c', '#c9b98a', '#5d7a4c', '#c9b98a', '#8a5a4a'];
      for (let i = 0; i < 5; i++)
        box(g, solid(folder[i], 0.85), 33, 15 + (i % 2) * 2, 1.6, 0, 79, 2 + i * 6.5);
      box(g, solid('#e8e4d8', 0.9), 6, 3.5, 0.6, -8, 96, 8.5, { rz: 0.05 }); // index tab
      return g;
    }
  },
  // -------------------------------------------- office credenza
  {
    id: 'wd_credenza_office', name: 'Office Credenza', cat: 'office',
    w: 160, d: 45, h: 66, palettes: WOODS, plan: { type: 'storage' },
    build: (p) => {
      const g = G();
      const t = tex(p.tex, 2, 1);
      legs4(g, metal('#2e3034', 0.4), 150, 36, 12, 1.8, 5, true);
      box(g, t, 160, 48, 44, 0, 12, 0, { r: 1.5 });                   // carcass
      box(g, t, 160, 4, 45, 0, 60, 0, { r: 1 });                      // top
      // sliding doors on two tracks — one wood, one lacquer, overlapping
      box(g, wood(p.wood, 0.42), 82, 40, 1.5, -39, 16, 22.4);
      box(g, solid('#e6e1d6', 0.42), 82, 40, 1.5, 41, 16, 23.8);
      handleBar(g, -4, 36, 23.4, 10, true);
      handleBar(g, 6, 36, 24.8, 10, true);
      // top styling: binder trio + plant
      const binder = ['#39506b', '#7c4434', '#3a5240'];
      for (let i = 0; i < 3; i++)
        box(g, solid(binder[i], 0.7), 4.5, 26, 20, -58 + i * 6, 62, -4, { rz: i === 2 ? -0.12 : 0 });
      cyl(g, solid('#c9bfa8', 0.6), 6.5, 11, 52, 62, 0, { rTop: 7.5 });
      blob(g, '#4a6e3a', '#5d8348', 10, 52, 77, 0, { seed: 15, sy: 0.9 });
      return g;
    }
  },
  // -------------------------------------------- desk with hutch
  {
    id: 'wd_desk_hutch', name: 'Desk with Hutch', cat: 'office',
    w: 120, d: 62, h: 162, palettes: WOODS, plan: { type: 'table' },
    build: (p) => {
      const g = G();
      const t = tex(p.tex, 1, 1), wd = wood(p.wood, 0.5);
      for (const s of [-1, 1]) box(g, t, 4, 70, 58, s * 58, 0, 2);    // desk side panels
      box(g, t, 120, 4, 62, 0, 70, 0, { r: 1 });                      // desktop
      box(g, wd, 108, 28, 2, 0, 38, -27);                             // modesty panel
      // hutch: sides, top, shelf, back
      for (const s of [-1, 1]) box(g, t, 4, 84, 26, s * 58, 74, -17);
      box(g, t, 120, 4, 28, 0, 158, -16, { r: 1 });
      box(g, wd, 112, 3, 24, 0, 118, -17);
      box(g, wd, 112, 84, 1.5, 0, 74, -29.4);
      box(g, wd, 3, 37, 22, 14, 121, -17);                            // cubby divider
      const books = ['#7c4434', '#39506b', '#5d7a4c', '#c2b49a', '#8a5a34'];
      for (let b = 0; b < 5; b++)
        box(g, solid(books[b], 0.75), 4, 22 + (b % 3) * 3, 18, -46 + b * 7.5, 121, -18, { ry: b === 4 ? 0.24 : 0 });
      cyl(g, solid('#3a3d42', 0.5), 5.5, 1.4, 38, 121, -16, { seg: 20 }); // desk clock
      cyl(g, solid('#e8e4da', 0.4), 4.6, 1, 38, 121.5, -15.8, { seg: 20 });
      // work surface: laptop + paper stack + task lamp
      box(g, metal('#9ca0a4', 0.4), 32, 1.5, 22, -14, 74, 6);
      box(g, metal('#9ca0a4', 0.4), 32, 22, 1.2, -14, 84, -6, { rx: -0.42 });
      box(g, solid('#eeebe2', 0.9), 22, 2.5, 28, 32, 74, 8, { ry: 0.1 });
      cyl(g, solid('#1d1e20', 0.5), 4, 1.6, -46, 74, 10, { seg: 16 });
      strut(g, solid('#1d1e20', 0.5), -46, 75, 10, -42, 96, 2, 0.9);
      box(g, glow('#fff2d8', 0.9, 0.4), 10, 2.5, 5, -42, 95, 0, { rx: 0.3 });
      return g;
    }
  },
  // -------------------------------------------- gaming battlestation
  {
    id: 'wd_battlestation', name: 'Gaming Battlestation', cat: 'office',
    w: 160, d: 80, h: 112, palettes: null, plan: { type: 'table' },
    build: () => {
      const g = G();
      const top = solid('#1d1f23', 0.5);
      const frame = metal('#26282c', 0.4);
      box(g, top, 160, 5, 75, 0, 68, 2, { r: 1.5 });
      legs4(g, frame, 148, 62, 68, 3, 7, true);
      box(g, glow('#c92a8e', 1.5, 0.4), 140, 1.5, 1.5, 0, 65.5, 38);  // RGB underglow strip
      // curved ultrawide: three angled segments sharing one stand
      cyl(g, frame, 9, 1.8, 0, 73, -22, { seg: 20 });
      cyl(g, frame, 2, 15, 0, 74, -21, { rTop: 1.6 });
      const seg = (x, z, ry) => {
        const sub = G();
        box(sub, solid('#141518', 0.4), 32, 27, 2, 0, 0, 0, { r: 0.8 });
        box(sub, glow('#0d1a24', 0.8, 0.25, '#2a6a8c'), 30.5, 25, 1, 0, 1, 1.1);
        sub.position.set(x, 87, z); sub.rotation.y = ry; g.add(sub);
      };
      seg(0, -26, 0); seg(-30.4, -22.6, 0.24); seg(30.4, -22.6, -0.24);
      box(g, glow('#2ad4d4', 1.2, 0.4), 56, 2, 1, 0, 96, -27.6);      // bias light behind
      box(g, solid('#141518', 0.5), 88, 0.8, 34, -6, 73, 16, { r: 0.4 }); // XL deskpad
      box(g, solid('#1a1b1e', 0.4), 40, 2.4, 14, -14, 73.8, 16, { r: 0.8 }); // keyboard
      box(g, glow('#7a3ac9', 1.1, 0.4), 36, 0.5, 10, -14, 74.4, 16);  // per-key RGB seam
      sphere(g, solid('#1a1b1e', 0.4), 3, 22, 75.5, 18, { sy: 0.55, sx: 0.72 });
      // PC tower with glow intake fans
      box(g, solid('#141518', 0.4), 22, 46, 44, 62, 0, 8, { r: 1.5 });
      torus(g, glow('#2ad4d4', 1.3, 0.4), 4, 0.9, 62, 34, 30.6, { seg: 22 });
      torus(g, glow('#c92a8e', 1.3, 0.4), 4, 0.9, 62, 22, 30.6, { seg: 22 });
      box(g, glow('#2ad4d4', 1.1, 0.4), 1.2, 40, 1.2, 51.4, 3, 28);   // front edge strip
      return g;
    }
  },
  // -------------------------------------------- drafting table + stool
  {
    id: 'wd_drafting', name: 'Drafting Table & Stool', cat: 'office',
    w: 120, d: 110, h: 98, palettes: WOODS, plan: { type: 'table' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.5);
      const m = metal('#2e3034', 0.4);
      // tilted work surface, hinged high at the back
      box(g, tex(p.tex, 1, 1), 100, 4, 74, 0, 78, -18, { r: 1, rx: 0.34 });
      box(g, wd, 100, 3, 4.5, 0, 67.6, 18.2, { rx: 0.34 });           // pencil ledge
      // taped-down drawing sheet + blue plan lines
      box(g, solid('#f2efe6', 0.9), 58, 0.6, 44, 0, 81.8, -17.2, { rx: 0.34, ry: 0.04 });
      box(g, solid('#5a7ea6', 0.7), 34, 0.4, 1.4, -2, 82.4, -21.5, { rx: 0.34 });
      box(g, solid('#5a7ea6', 0.7), 22, 0.4, 1.4, -6, 82.7, -12.6, { rx: 0.34 });
      // A-frame legs + stretchers
      strut(g, m, -46, 0, 8, -40, 74, -12, 2.4);
      strut(g, m, 46, 0, 8, 40, 74, -12, 2.4);
      strut(g, m, -46, 0, -50, -40, 80, -28, 2.4);
      strut(g, m, 46, 0, -50, 40, 80, -28, 2.4);
      box(g, m, 84, 4, 4, 0, 26, -22);
      for (const s of [-1, 1]) strut(g, m, s * 43.2, 28, 8, s * 43.2, 28, -50, 1.8);
      // round drafting stool pulled up front-right
      const sx = 32, sz = 40;
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        cyl(g, m, 1.6, 62, sx + Math.cos(a) * 12, 0, sz + Math.sin(a) * 12,
          { rTop: 1.2, rx: -Math.sin(a) * 0.14, rz: Math.cos(a) * 0.14 });
      }
      torus(g, m, 12, 0.8, sx, 22, sz, { rx: Math.PI / 2, seg: 24 });
      cushion(g, solid('#5a2e28', 0.5), 28, 6, 28, sx, 60, sz, { puff: 0.3, dimple: 0.4 });
      return g;
    }
  },
  // -------------------------------------------- rolling whiteboard
  {
    id: 'wd_whiteboard', name: 'Rolling Whiteboard', cat: 'office',
    w: 130, d: 55, h: 176, palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      const m = metal('#8e9297', 0.35);
      const shell = solid('#1c1c1e', 0.5);
      for (const s of [-1, 1]) {                                       // A-legs + casters
        strut(g, m, s * 60, 6, 21, s * 60, 96, 0, 2.4);
        strut(g, m, s * 60, 6, -21, s * 60, 96, 0, 2.4);
        for (const z of [-20, 20]) {
          sphere(g, solid('#141416', 0.45), 3.4, s * 60, 3.4, z);
          cyl(g, shell, 1.6, 4, s * 60, 5.8, z);
        }
        box(g, m, 5, 80, 5, s * 60, 93, 0);                            // uprights
      }
      box(g, metal('#c4c8cc', 0.4), 122, 92, 3, 0, 78, 0, { r: 1 });  // frame
      box(g, solid('#f4f5f2', 0.15), 116, 86, 1.2, 0, 81, 1.1);       // gloss face
      box(g, solid('#f4f5f2', 0.25), 116, 86, 1.2, 0, 81, -1.1);      // back face
      box(g, m, 62, 1.5, 9, 0, 71.5, 6);                              // marker tray
      box(g, m, 62, 3, 1, 0, 71.5, 10);
      const pens = ['#b03a3a', '#3a62b0', '#2c2c2e'];
      for (let i = 0; i < 3; i++)
        cyl(g, solid(pens[i], 0.5), 1, 10, -18 + i * 14, 74, 6.4, { rz: Math.PI / 2 });
      box(g, solid('#4a4d52', 0.7), 10, 3.5, 5.5, 24, 73, 6.2);       // eraser
      // half-erased sprint notes: strokes + a circled item
      box(g, solid('#3a62b0', 0.6), 42, 1.3, 0.3, -22, 138, 1.8, { rz: -0.02 });
      box(g, solid('#3a62b0', 0.6), 34, 1.3, 0.3, -26, 128, 1.8, { rz: 0.02 });
      box(g, solid('#3a62b0', 0.6), 38, 1.3, 0.3, -24, 118, 1.8);
      box(g, solid('#4a9a5c', 0.6), 24, 1.3, 0.3, 30, 100, 1.8, { rz: 0.06 });
      torus(g, solid('#b03a3a', 0.6), 8, 0.55, 32, 128, 1.8, { seg: 24 });
      return g;
    }
  },
  // -------------------------------------------- printer cart
  {
    id: 'wd_printer_cart', name: 'Printer Cart', cat: 'office',
    w: 62, d: 52, h: 96, palettes: WOODS, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const m = metal('#2e3034', 0.4);
      const shell = solid('#1c1c1e', 0.5);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {           // posts + casters
        box(g, m, 3, 62, 3, sx * 28, 6, sz * 23);
        sphere(g, solid('#141416', 0.45), 3, sx * 28, 3, sz * 23);
        cyl(g, shell, 1.4, 3.6, sx * 28, 5, sz * 23);
      }
      box(g, tex(p.tex, 1, 1), 62, 3, 52, 0, 68, 0, { r: 1 });        // top
      box(g, tex(p.tex, 1, 1), 58, 2.5, 48, 0, 36, 0);                // paper shelf
      box(g, tex(p.tex, 1, 1), 58, 2.5, 48, 0, 10, 0);                // bottom shelf
      // reams of paper (one wrapped in blue)
      box(g, solid('#e8e6e0', 0.85), 23, 6, 30, -14, 38.5, 0);
      box(g, solid('#e8e6e0', 0.85), 23, 6, 30, 12, 38.5, 0, { ry: 0.06 });
      box(g, solid('#7a97b0', 0.7), 23, 6, 30, -13, 44.5, 0, { ry: -0.05 });
      // printer with a fresh page in the output tray
      box(g, solid('#dfe0dc', 0.5), 44, 23, 36, 0, 71, -2, { r: 2.5 });
      box(g, solid('#c9cac6', 0.5), 24, 1.5, 14, 0, 78, 20);
      box(g, solid('#f6f4ee', 0.9), 20, 0.4, 12, 0, 79.7, 21, { ry: 0.04 });
      box(g, glow('#2a6a8c', 0.9, 0.3), 8, 0.8, 5, 15, 94.2, 8, { rx: -0.25 }); // status screen
      return g;
    }
  },
  // -------------------------------------------- cork pinboard (wall)
  {
    id: 'wd_pinboard', name: 'Cork Pinboard', cat: 'office',
    w: 92, d: 6, h: 64, elevation: 140, mount: 'wall',
    palettes: null, plan: { type: 'wallDecor' },
    build: () => {
      const g = G();
      const fr = wood('#8a6b47', 0.5);
      box(g, solid('#bf9663', 0.95), 88, 58, 2, 0, 3, -0.6);          // cork field
      box(g, fr, 92, 4, 3, 0, 0, 0);                                  // frame rails
      box(g, fr, 92, 4, 3, 0, 60, 0);
      box(g, fr, 4, 56, 3, -44, 4, 0);
      box(g, fr, 4, 56, 3, 44, 4, 0);
      // pinned layers: notes, stickies, a photo, a to-do list
      const note = (w, h, x, y, hex, rz, pin) => {
        box(g, solid(hex, 0.9), w, h, 0.5, x, y - h / 2, 0.7, { rz });
        sphere(g, solid(pin, 0.4), 1, x, y - 1.5, 1.5, { seg: 10 });
      };
      note(15, 11, -28, 50, '#f4f1e8', 0.06, '#c0392b');
      note(9, 9, -8, 52, '#e8d75a', -0.1, '#3a62b0');
      note(10, 8, 12, 46, '#a8c4d4', 0.05, '#c0392b');
      note(12, 16, -31, 26, '#f4f1e8', -0.04, '#4a9a5c');
      note(9, 9, 3, 24, '#e8d75a', 0.12, '#c0392b');
      note(11, 9, 25, 22, '#d4e0c4', -0.08, '#e0a03a');
      box(g, solid('#f4f1e8', 0.85), 17, 13, 0.5, 30, 39, 0.7, { rz: -0.06 }); // snapshot
      box(g, artMaterial(6), 15, 11, 0.4, 30, 40, 1.05, { rz: -0.06 });
      sphere(g, solid('#3a62b0', 0.4), 1, 30, 46, 1.5, { seg: 10 });
      return g;
    }
  },

  // ======================================================== DINING (12)
  // -------------------------------------------- farmhouse trestle + benches
  {
    id: 'wd_table_trestle', name: 'Trestle Table + Benches', cat: 'dining',
    w: 226, d: 162, h: 77, palettes: WOODS, plan: { type: 'table' },
    build: (p) => {
      const g = G();
      const t = tex(p.tex, 1.4, 0.7), wd = wood(p.wood, 0.5);
      box(g, t, 220, 6, 100, 0, 72, 0, { r: 1.2 });                   // plank top
      for (const s of [-1, 1]) {                                       // trestle ends
        box(g, wd, 12, 7, 88, s * 88, 0, 0, { r: 2 });
        box(g, wd, 10, 59, 26, s * 88, 7, 0);
        box(g, wd, 12, 6, 78, s * 88, 66, 0);
      }
      box(g, wd, 168, 9, 7, 0, 26, 0);                                // stretcher
      for (const s of [-1, 1]) box(g, wd, 3, 13, 9, s * 82, 24, 0);   // through-pegs
      for (const sz of [-1, 1]) {                                      // two benches
        const z = sz * 64;
        box(g, t, 180, 5, 32, 0, 40, z, { r: 1.5 });
        for (const sx of [-1, 1]) {
          box(g, wd, 8, 5, 30, sx * 72, 0, z, { r: 1.5 });
          box(g, wd, 7, 35, 18, sx * 72, 5, z);
        }
        box(g, wd, 132, 5, 5, 0, 18, z);
      }
      // fruit bowl centerpiece
      lathe(g, solid('#d9cdb8', 0.55), [[4, 0], [12, 1.6], [15, 5.5], [14, 5.5], [12.6, 2.4], [4.6, 1]], 0, 78, 0, { seg: 28 });
      sphere(g, solid('#c94a3a', 0.5), 4, -4, 84.5, 2, { seg: 12 });
      sphere(g, solid('#d98c3a', 0.5), 4, 5, 84.5, -3, { seg: 12 });
      sphere(g, solid('#8aa03a', 0.5), 3.8, 1, 88, 3, { seg: 12 });
      return g;
    }
  },
  // -------------------------------------------- round pedestal table + 4 chairs
  {
    id: 'wd_table_pedestal', name: 'Pedestal Table + 4 Chairs', cat: 'dining',
    w: 190, d: 190, h: 90, palettes: WOODS, plan: { type: 'tableRound' },
    build: (p) => {
      const g = G();
      const t = tex(p.tex, 1, 1), wd = wood(p.wood, 0.5);
      cyl(g, t, 60, 5, 0, 71, 0, { seg: 44 });                        // round top
      lathe(g, wd, [                                                   // turned pedestal
        [17, 0], [15, 2], [7.5, 6], [5.5, 14], [4.8, 32], [5.6, 48],
        [7.5, 58], [13, 66], [14.5, 71]
      ], 0, 0, 0, { seg: 32 });
      for (let i = 0; i < 4; i++) {                                    // four low feet
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        strut(g, wd, Math.cos(a) * 8, 2.5, Math.sin(a) * 8, Math.cos(a) * 22, 0.5, Math.sin(a) * 22, 3.4, { rTop: 2.2 });
      }
      const lin = solid('#d6cdbb', 0.9);
      for (let i = 0; i < 4; i++) {                                    // chairs N/E/S/W
        const a = (i / 4) * Math.PI * 2;
        const sub = G();
        cyl(sub, wd, 2.1, 42, -17, 0, 15, { rTop: 1.4 });
        cyl(sub, wd, 2.1, 42, 17, 0, 15, { rTop: 1.4 });
        cyl(sub, wd, 2.1, 86, -17, 0, -18, { rTop: 1.5, rx: 0.05 });  // back posts
        cyl(sub, wd, 2.1, 86, 17, 0, -18, { rTop: 1.5, rx: 0.05 });
        box(sub, wd, 40, 4, 40, 0, 42, 0, { r: 1.5 });
        cushion(sub, lin, 36, 4, 36, 0, 46, 1, { puff: 0.24, dimple: 0.3 });
        box(sub, wd, 38, 9, 3, 0, 76, -21.5, { rx: 0.05 });           // crest rail
        box(sub, wd, 36, 6, 2.5, 0, 60, -20.6, { rx: 0.05 });         // mid slat
        sub.position.set(Math.cos(a) * 70, 0, Math.sin(a) * 70);
        sub.rotation.y = -a - Math.PI / 2;
        g.add(sub);
      }
      return g;
    }
  },
  // -------------------------------------------- glass-top modern table
  {
    id: 'wd_table_glass', name: 'Glass Dining Table', cat: 'dining',
    w: 180, d: 95, h: 76, palettes: null, plan: { type: 'table' },
    build: () => {
      const g = G();
      const m = metal('#c9ccd0', 0.25);
      for (const s of [-1, 1]) {                                       // sled frame ends
        for (const sz of [-1, 1]) box(g, m, 4.5, 70, 7, s * 78, 0, sz * 30);
        box(g, m, 4.5, 4, 76, s * 78, 0, 0, { r: 1.5 });
        box(g, m, 4.5, 3, 68, s * 78, 70, 0);
      }
      box(g, m, 148, 4.5, 6, 0, 63, 0);                               // spine beam
      // centerpiece bowl + apples (opaque, before the glass)
      lathe(g, solid('#e8e4dc', 0.4), [[3.5, 0], [10.5, 1.4], [13, 4.6], [12.2, 4.6], [11, 2], [4, 0.9]], 0, 76.2, 0, { seg: 28 });
      sphere(g, solid('#7c9a3a', 0.45), 3.4, -3.5, 80.6, 1.5, { seg: 12 });
      sphere(g, solid('#8aa845', 0.45), 3.4, 4, 80.6, -2, { seg: 12 });
      sphere(g, solid('#7c9a3a', 0.45), 3.2, 0.5, 84, 2.5, { seg: 12 });
      for (const s of [-1, 1])                                        // woven placemats
        box(g, solid('#8a7a5e', 0.9), 42, 0.5, 30, s * 52, 76.1, 0, { r: 0.3 });
      // glass slab LAST (depthWrite:false)
      box(g, glass(), 180, 1.4, 95, 0, 74.6, 0, { r: 0.4 });
      return g;
    }
  },
  // -------------------------------------------- china hutch with dishes
  {
    id: 'wd_hutch_china', name: 'China Hutch', cat: 'dining',
    w: 115, d: 48, h: 190, palettes: WOODS, plan: { type: 'storage' },
    build: (p) => {
      const g = G();
      const t = tex(p.tex, 1, 1.6), wd = wood(p.wood, 0.5);
      box(g, solid('#26282a', 0.7), 106, 2, 42, 0, 0, 0);             // plinth
      box(g, t, 115, 78, 46, 0, 2, 0, { r: 1.5 });                    // base cabinet
      for (const s of [-1, 1]) {
        box(g, wood(p.wood, 0.42), 50, 14, 1.5, s * 28, 62, 23.4);    // drawers
        handleBar(g, s * 28, 69, 24.4, 14, false, metal(BRASS, 0.3));
        box(g, wood(p.wood, 0.42), 50, 40, 1.5, s * 28, 18, 23.4);    // doors
        knob(g, s * 8, 40, 24.6, 1.5);
      }
      box(g, t, 115, 3, 48, 0, 80, 0, { r: 0.8 });                    // counter
      for (const s of [-1, 1]) box(g, t, 4, 100, 30, s * 55.5, 83, -8); // upper sides
      box(g, t, 115, 4, 32, 0, 183, -8, { r: 0.8 });                  // top
      box(g, t, 119, 3.5, 34, 0, 186.5, -8, { r: 1 });                // crown
      box(g, solid('#e2dbc8', 0.85), 107, 100, 1.5, 0, 83, -21.6);    // beadboard back
      const china = solid('#e9e7e1', 0.3);
      const accent = solid('#5a7ea6', 0.4);
      for (const sy of [116, 149]) {                                   // display shelves
        box(g, wd, 107, 2.5, 26, 0, sy, -8);
        box(g, wd, 100, 1.5, 2, 0, sy + 2.5, -1);                     // plate rail
        for (let i = 0; i < 4; i++) {                                  // standing plates
          cyl(g, china, 8.5, 1.2, -39 + i * 26, sy + 10.5, -14, { rx: 1.44, seg: 22 });
          cyl(g, accent, 5.2, 1.3, -39 + i * 26, sy + 10.5, -13.7, { rx: 1.44, seg: 18 });
        }
      }
      // counter styling: stacked bowls + teapot
      cyl(g, china, 7, 2, -32, 83, -4, { rTop: 8, seg: 22 });
      cyl(g, china, 6, 1.8, -32, 85, -4, { rTop: 7, seg: 22 });
      lathe(g, accent, [[2.6, 0], [6.4, 1.6], [7.2, 5.5], [4.6, 9], [5, 10.4], [3.4, 10.8]], 30, 83, -4, { seg: 22 });
      return g;
    }
  },
  // -------------------------------------------- buffet sideboard
  {
    id: 'wd_buffet_deluxe', name: 'Dining Buffet', cat: 'dining',
    w: 175, d: 50, h: 88, palettes: WOODS, plan: { type: 'storage' },
    build: (p) => {
      const g = G();
      const t = tex(p.tex, 2, 1), wd = wood(p.wood, 0.5);
      const brass = metal(BRASS, 0.3);
      for (const [x, z] of [[-80, -18], [80, -18], [-80, 18], [80, 18]])
        cyl(g, wd, 3.2, 18, x, 0, z, { rTop: 1.7, rz: x > 0 ? 0.12 : -0.12, rx: z > 0 ? 0.12 : -0.12 });
      box(g, t, 175, 62, 48, 0, 18, 0, { r: 2 });                     // body
      box(g, t, 179, 4, 50, 0, 80, 0, { r: 1 });                      // top
      for (const s of [-1, 1]) {                                       // side doors
        box(g, wood(p.wood, 0.42), 52, 54, 1.5, s * 58, 22, 24.4);
        sphere(g, brass, 1.7, s * 34, 49, 25.4);
      }
      box(g, wood(p.wood, 0.42), 55, 12, 1.5, 0, 64, 24.4);           // stacked drawers
      handleBar(g, 0, 70, 25.4, 16, false, brass);
      box(g, wood(p.wood, 0.42), 55, 12, 1.5, 0, 50, 24.4);
      handleBar(g, 0, 56, 25.4, 16, false, brass);
      box(g, solid('#211f1c', 0.8), 55, 26, 2, 0, 21, 23.2);          // open bay shadow
      box(g, solid('#a8845c', 0.9), 46, 20, 4, 0, 22, 22.4, { r: 2 }); // woven basket front
      // top styling: runner + brass candlesticks with lit candles
      box(g, solid('#ded5c2', 0.9), 60, 0.8, 44, 0, 84, 0, { r: 0.4 });
      for (const s of [-1, 1]) {
        lathe(g, brass, [[3.6, 0], [1.6, 1.4], [1.2, 8], [1.8, 11], [2.6, 12.5]], s * 18, 84.8, 0, { seg: 18 });
        cyl(g, solid('#efe7d6', 0.5), 1.5, 8, s * 18, 97.3, 0);
        sphere(g, glow('#ffd9a0', 1.6, 0.4), 0.9, s * 18, 106.2, 0, { seg: 10, sy: 1.5 });
      }
      return g;
    }
  },
  // -------------------------------------------- brass bar cart
  {
    id: 'wd_bar_cart_brass', name: 'Brass Bar Cart', cat: 'dining',
    w: 85, d: 48, h: 92, palettes: null, plan: { type: 'table' },
    build: () => {
      const g = G();
      const brass = metal(BRASS, 0.28);
      const shelf = wood('#4a3826', 0.45);
      for (const sx of [-1, 1]) for (const sz of [-1, 1])
        cyl(g, brass, 1.5, sx < 0 ? 68 : 72, sx * 37, sx < 0 ? 10 : 6, sz * 19);
      box(g, shelf, 78, 2.5, 42, 0, 72, 0, { r: 1 });                 // top tray
      box(g, shelf, 78, 2.5, 42, 0, 24, 0, { r: 1 });                 // lower shelf
      for (const y of [78, 30]) {                                      // gallery rails
        for (const sz of [-1, 1]) cyl(g, brass, 0.6, 74, 0, y, sz * 20.5, { rz: Math.PI / 2 });
        for (const sx of [-1, 1]) cyl(g, brass, 0.6, 39, sx * 37.5, y, 0, { rx: Math.PI / 2 });
      }
      sweep(g, brass, [                                                // push handle
        [-38, 74, -16], [-46, 80, -13], [-49, 86, 0], [-46, 80, 13], [-38, 74, 16]
      ], 1.1, { seg: 24 });
      // rolling gear: axle + two wheels under the handle end, casters at the other
      cyl(g, brass, 0.9, 46, -37, 9.8, 0, { rx: Math.PI / 2 });
      for (const sz of [-1, 1]) {
        torus(g, brass, 8.6, 1.2, -37, 9.8, sz * 21.4, { seg: 26 });
        cyl(g, brass, 7.6, 1.4, -37, 9.8, sz * 21.4, { rx: Math.PI / 2, seg: 22 });
      }
      for (const sz of [-1, 1]) sphere(g, solid('#141416', 0.45), 3.4, 37, 3.6, sz * 19);
      // stocked top: bottles, shaker, ice bucket with champagne
      bottleStanding(g, '#3a4a2e', -22, 74.5, -8);
      bottleStanding(g, '#6a3a20', -12, 74.5, 4, 0.92);
      bottleStanding(g, '#2e3a4a', -25, 74.5, 8, 0.85);
      lathe(g, chrome(), [[4.4, 0], [5, 1.2], [5, 8], [3.4, 12], [2.6, 15], [3, 16.5]], 4, 74.5, 6, { seg: 20 });
      lathe(g, chrome(), [[6.8, 0], [8.2, 2], [9, 9], [9.6, 10.5]], 24, 74.5, -2, { seg: 22 });
      cyl(g, solid('#3a4a2e', 0.3), 1.4, 9, 26, 82, -2, { rz: -0.18 });
      sphere(g, solid('#c8a860', 0.4), 1.7, 27.6, 91.6, -2, { seg: 10 });
      // lower shelf: lowball glasses
      for (const x of [-14, 0]) cyl(g, solid('#dfe4e6', 0.12), 3.2, 7, x, 26.5, 4, { rTop: 3.6, seg: 16 });
      return g;
    }
  },
  // -------------------------------------------- wall wine rack
  {
    id: 'wd_wine_rack_wall', name: 'Wall Wine Rack', cat: 'dining',
    w: 84, d: 34, h: 64, elevation: 122, mount: 'wall',
    palettes: WOODS, plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.5);
      const wine = ['#3a4a2e', '#4a2e33', '#2e3a4a', '#4a2e33', '#3a4a2e', '#6a3a20'];
      for (const [i, y] of [[0, 22], [1, 52]].values()) {
        box(g, wd, 80, 3.5, 4.5, 0, y, 8);                            // cradle rails
        box(g, wd, 80, 3.5, 4.5, 0, y + 7, -6);
        for (const s of [-1, 1]) box(g, wd, 4, 18, 20, s * 40, y - 4, 0); // side brackets
        for (let b = 0; b < 3; b++)                                    // angled bottles
          bottleAngled(g, wine[i * 3 + b], -22 + b * 22, y + 9, -8);
      }
      return g;
    }
  },
  // -------------------------------------------- upholstered parsons chair
  {
    id: 'wd_chair_parsons', name: 'Parsons Dining Chair', cat: 'dining',
    w: 50, d: 62, h: 99, palettes: SEAT, plan: { type: 'chair' },
    build: (p) => {
      const g = G();
      const f = seatMat(p);
      const wl = wood(p.wood, 0.45);
      for (const s of [-1, 1]) {
        cyl(g, wl, 2.3, 42, s * 19.5, 0, 21, { rTop: 1.5 });          // front legs
        cyl(g, wl, 2.3, 44, s * 19.5, 0, -23, { rTop: 1.7, rx: -0.05 }); // raked back legs
      }
      box(g, f, 46, 10, 52, 0, 32, 0, { r: 3 });                      // upholstered frame
      cushion(g, f, 44, 7, 49, 0, 41, 1, { puff: 0.2, dimple: 0.4 }); // seat
      box(g, f, 46, 54, 9, 0, 44, -25, { r: 4, rx: -0.08 });          // tall clean back
      cushion(g, f, 41, 47, 4.5, 0, 47, -20.2, { puff: 0.16, dimple: 0.05, rx: -0.08 }); // face pad
      return g;
    }
  },
  // -------------------------------------------- set of 3 counter stools
  {
    id: 'wd_stool_counter3', name: 'Counter Stools (Set of 3)', cat: 'dining',
    w: 140, d: 46, h: 84, palettes: WOODS, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const t = tex(p.tex, 1, 1);
      const m = metal('#2e3034', 0.35);
      for (const x of [-47, 0, 47]) {
        for (const sx of [-1, 1]) for (const sz of [-1, 1])
          cyl(g, m, 1.6, 63, x + sx * 11, 0, sz * 10,
            { rTop: 1.25, rx: sz * 0.12, rz: -sx * 0.12 });
        torus(g, m, 12.5, 0.8, x, 24, 0, { rx: Math.PI / 2, seg: 24 });
        cyl(g, t, 16, 4, x, 62, 0, { seg: 28 });                      // seat at 66
        sweep(g, m, [                                                  // low hoop back
          [x - 13, 66, -9], [x - 14.5, 75, -12], [x, 79, -14], [x + 14.5, 75, -12], [x + 13, 66, -9]
        ], 1.3, { seg: 22 });
      }
      return g;
    }
  },
  // -------------------------------------------- corner banquette bench
  {
    id: 'wd_banquette', name: 'Corner Banquette', cat: 'dining',
    w: 190, d: 190, h: 90, palettes: SEAT, plan: { type: 'sofa', seats: 4 },
    build: (p) => {
      const g = G();
      const f = seatMat(p);
      const plinth = solid('#3f3a34', 0.8);
      box(g, plinth, 186, 10, 58, 0, 0, -64);                         // bases
      box(g, plinth, 58, 10, 126, -64, 0, 28);
      box(g, f, 190, 26, 62, 0, 10, -64, { r: 5 });                   // seat decks
      box(g, f, 62, 26, 128, -64, 10, 31, { r: 5 });
      box(g, f, 190, 52, 14, 0, 36, -88, { r: 5 });                   // tall backs
      box(g, f, 14, 52, 126, -88, 36, 32, { r: 5 });
      // seat pads
      for (const x of [0, 64]) cushion(g, f, 58, 11, 52, x, 34, -62, { puff: 0.14, dimple: 0.5 });
      for (const z of [0, 64]) cushion(g, f, 52, 11, 58, -62, 34, z, { puff: 0.14, dimple: 0.5 });
      cushion(g, f, 52, 11, 52, -63, 34, -63, { puff: 0.14, dimple: 0.4 });
      // leaning back cushions
      for (const x of [-62, 2, 64]) cushion(g, f, 56, 38, 13, x, 44, -76, { puff: 0.2, dimple: 0.06, rx: -0.12 });
      for (const z of [2, 64]) cushion(g, f, 13, 38, 56, -76, 44, z, { puff: 0.2, dimple: 0.06, rz: 0.12 });
      // tossed throw pillows
      cushion(g, tex('fabric_beige', 1, 1), 36, 34, 12, -60, 46, -60, { puff: 0.32, ry: 0.7, rx: -0.3 });
      cushion(g, solid('#c99a3a', 0.8), 32, 30, 11, 44, 44, -70, { puff: 0.33, ry: -0.3, rx: -0.28 });
      cushion(g, tex('fabric_beige', 1, 1), 32, 30, 11, -70, 44, 74, { puff: 0.33, ry: 1.2, rz: 0.24 });
      return g;
    }
  },
  // -------------------------------------------- pub high-top + 2 stools
  {
    id: 'wd_pub_set', name: 'Pub High-Top + 2 Stools', cat: 'dining',
    w: 122, d: 78, h: 106, palettes: WOODS, plan: { type: 'tableRound' },
    build: (p) => {
      const g = G();
      const t = tex(p.tex, 1, 1);
      const m = metal('#2e3034', 0.35);
      lathe(g, m, [[23, 0], [22, 1.6], [9, 3.2], [4.6, 5.5], [4.2, 8]], 0, 0, 0, { seg: 32 });
      cyl(g, m, 3.6, 92, 0, 6, 0);                                    // column
      torus(g, m, 10, 1.1, 0, 41, 0, { rx: Math.PI / 2, seg: 26 });   // foot ring
      cyl(g, m, 8, 2, 0, 96, 0, { rTop: 10 });                        // top spider
      cyl(g, t, 33, 4, 0, 98, 0, { seg: 40 });                        // round top at 102
      for (const s of [-1, 1]) {                                       // two stools
        const x = s * 44;
        for (const sx of [-1, 1]) for (const sz of [-1, 1])
          cyl(g, m, 1.5, 72, x + sx * 10, 0, sz * 9,
            { rTop: 1.2, rx: sz * 0.13, rz: -sx * 0.13 });
        torus(g, m, 11, 0.8, x, 27, 0, { rx: Math.PI / 2, seg: 24 });
        cyl(g, t, 14.5, 4, x, 71, 0, { seg: 26 });                    // seat at 75
      }
      // shared snack: a small bowl of nuts on the tabletop
      lathe(g, solid('#d9cdb8', 0.55), [[2, 0], [5.4, 1], [6.4, 2.8], [5.8, 2.8], [5, 1.2], [2.4, 0.6]], 0, 102, 4, { seg: 20 });
      return g;
    }
  },
  // -------------------------------------------- kids high chair
  {
    id: 'wd_highchair', name: 'Kids High Chair', cat: 'dining',
    w: 54, d: 62, h: 92, palettes: [
      { name: 'Natural', chip: '#a07a4f', wood: '#a07a4f', accent: '#c9573a' },
      { name: 'White', chip: '#e8e4dc', wood: '#e8e4dc', accent: '#3a7c94' },
      { name: 'Walnut', chip: '#5f4632', wood: '#5f4632', accent: '#c9a13a' }
    ],
    plan: { type: 'chair' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.45);
      const acc = solid(p.accent, 0.55);
      strut(g, wd, -12, 52, 10, -23, 0, 24, 2.1, { rTop: 2.4 });      // splayed legs
      strut(g, wd, 12, 52, 10, 23, 0, 24, 2.1, { rTop: 2.4 });
      strut(g, wd, -12, 52, -10, -23, 0, -24, 2.1, { rTop: 2.4 });
      strut(g, wd, 12, 52, -10, 23, 0, -24, 2.1, { rTop: 2.4 });
      strut(g, wd, -19, 18, 18.6, 19, 18, 18.6, 1.4);                 // rungs
      strut(g, wd, -19, 18, -18.6, 19, 18, -18.6, 1.4);
      box(g, wd, 34, 4, 30, 0, 52, 0, { r: 1.5 });                    // seat
      cushion(g, acc, 29, 3.5, 25, 0, 56, 1, { puff: 0.32, dimple: 0.3 });
      for (const s of [-1, 1]) cyl(g, wd, 1.8, 36, s * 14, 54, -12.6, { rTop: 1.5, rx: -0.06 }); // back posts
      box(g, wd, 31, 15, 2.5, 0, 74, -14.5, { rx: -0.06, r: 1 });     // back panel
      box(g, wd, 33, 5, 3.5, 0, 87, -15.4, { rx: -0.06, r: 1.2 });    // crest rail
      for (const s of [-1, 1]) {                                       // armrests
        box(g, wd, 3, 2.8, 24, s * 15.5, 65, -1);
        cyl(g, wd, 1.3, 13, s * 15.5, 56, 10);
      }
      box(g, solid('#ece8e0', 0.5), 40, 3, 22, 0, 68, 15, { r: 2 });  // feeding tray
      box(g, solid('#ece8e0', 0.5), 40, 2, 3, 0, 69.5, 25, { r: 1 }); // tray lip
      cyl(g, acc, 3, 5.5, 9, 71, 14, { rTop: 2.5, seg: 16 });         // sippy cup
      sphere(g, acc, 1.2, 9, 77.5, 14, { seg: 10 });
      box(g, wd, 26, 3, 10, 0, 28, 12, { r: 1 });                     // footrest
      return g;
    }
  }
];
