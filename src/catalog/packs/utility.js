import { G, box, cyl, sphere, legs4, knob, handleBar, solid, wood, metal, chrome, glass, water, tex, glow, lathe, cushion, drape, sweep, torus } from '../builders.js';

// Utility, laundry & mudroom pack. Front-load appliances, laundry sinks &
// cabinets, mudroom lockers with shoe cubbies, and floor drains / wash
// stations. Origin at footprint centre on the ground; +Y up; front faces +Z.

const APPLIANCE = [
  { name: 'White', chip: '#eef0f1', body: '#eef0f1', rough: 0.35 },
  { name: 'Graphite', chip: '#3c4046', body: '#3c4046', rough: 0.4 },
  { name: 'Stainless', chip: '#c2c7cc', body: '#c2c7cc', rough: 0.3 }
];
const CABINET = [
  { name: 'White Shaker', chip: '#eae7e0', wood: '#eae7e0' },
  { name: 'Sage Green', chip: '#8f9c86', wood: '#8f9c86' },
  { name: 'Navy', chip: '#2f3b4c', wood: '#2f3b4c' },
  { name: 'Walnut', chip: '#6e4a2f', wood: '#6e4a2f' }
];

// front-load appliance door: recessed glass porthole
function frontDoor(g, bodyMat, y) {
  cyl(g, metal('#9aa0a6', 0.4), 24, 3, 0, y, 31, { rz: Math.PI / 2, seg: 32 });
  cyl(g, solid('#20242a', 0.2), 20, 2, 0, y, 32.5, { rz: Math.PI / 2, seg: 32 });
  cyl(g, glass(), 16, 2.2, 0, y, 33, { rz: Math.PI / 2, seg: 32 });
}

export const UTILITY_ITEMS = [
  // ---- Front-load washer ---------------------------------------------------
  {
    id: 'util_washer', name: 'Front-Load Washer', cat: 'utility', w: 60, d: 64, h: 90,
    palettes: APPLIANCE, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const body = solid(p.body, p.rough);
      box(g, body, 60, 88, 64, 0, 0, 0, { r: 2 });
      box(g, solid('#111417', 0.3), 54, 10, 2, 0, 80, 32);           // control panel
      cyl(g, glow('#39d0e6', 0.5, 0.3), 1.2, 1, 20, 80, 33, { rz: Math.PI / 2 });
      box(g, solid('#2a2e33', 0.3), 14, 8, 2, -14, 80, 33);          // dial recess
      knob(g, -14, 80, 34, 3);
      frontDoor(g, body, 40);
      handleBar(g, 20, 40, 34, 10, true, metal('#c9ced4', 0.3));
      return g;
    }
  },
  // ---- Front-load dryer ----------------------------------------------------
  {
    id: 'util_dryer', name: 'Front-Load Dryer', cat: 'utility', w: 60, d: 64, h: 90,
    palettes: APPLIANCE, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const body = solid(p.body, p.rough);
      box(g, body, 60, 88, 64, 0, 0, 0, { r: 2 });
      box(g, solid('#111417', 0.3), 54, 10, 2, 0, 80, 32);
      box(g, solid('#2a2e33', 0.3), 14, 8, 2, -14, 80, 33);
      knob(g, -14, 80, 34, 3);
      // solid door with a slim vent grille
      cyl(g, metal('#9aa0a6', 0.4), 24, 3, 0, 40, 31, { rz: Math.PI / 2, seg: 32 });
      cyl(g, solid('#d7dbdf', 0.4), 21, 2, 0, 40, 32.5, { rz: Math.PI / 2, seg: 32 });
      for (let i = -2; i <= 2; i++) box(g, solid('#8b9096', 0.4), 26, 1, 1, 0, 40 + i * 5, 33.6);
      handleBar(g, 20, 40, 34, 10, true, metal('#c9ced4', 0.3));
      return g;
    }
  },
  // ---- Stacked washer + dryer ---------------------------------------------
  {
    id: 'util_stack', name: 'Stacked Washer / Dryer', cat: 'utility', w: 60, d: 64, h: 180,
    palettes: APPLIANCE, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const body = solid(p.body, p.rough);
      for (const yb of [0, 88]) {
        box(g, body, 60, 86, 64, 0, yb, 0, { r: 2 });
        box(g, solid('#111417', 0.3), 54, 8, 2, 0, 78 + yb, 32);
        knob(g, -16, 78 + yb, 34, 2.6);
        frontDoor(g, body, 40 + yb);
        handleBar(g, 20, 40 + yb, 34, 9, true, metal('#c9ced4', 0.3));
      }
      return g;
    }
  },
  // ---- Laundry pedestal drawer --------------------------------------------
  {
    id: 'util_pedestal', name: 'Appliance Pedestal Drawer', cat: 'utility', w: 60, d: 64, h: 38,
    palettes: APPLIANCE, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const body = solid(p.body, p.rough);
      box(g, body, 60, 36, 64, 0, 0, 0, { r: 2 });
      box(g, solid('#20242a', 0.3), 52, 24, 2, 0, 6, 32.5);       // drawer face
      handleBar(g, 0, 22, 34, 26, false, metal('#c9ced4', 0.3));
      return g;
    }
  },
  // ---- Utility / laundry sink ---------------------------------------------
  {
    id: 'util_laundry_sink', name: 'Utility Laundry Sink', cat: 'utility', w: 58, d: 56, h: 92,
    palettes: null, plan: { type: 'sink' },
    build: () => {
      const g = G();
      const tub = solid('#dfe2e4', 0.4);
      legs4(g, metal('#8b9096', 0.35), 54, 52, 66, 2, 4);
      // deep OPEN tub: floor + four walls so the basin actually reads
      box(g, tub, 56, 4, 54, 0, 78, 0, { r: 2 });                  // tub floor
      for (const sz of [-1, 1]) box(g, tub, 56, 24, 5, 0, 80, sz * 24.5, { r: 2 });
      for (const sx of [-1, 1]) box(g, tub, 5, 24, 54, sx * 25.5, 80, 0, { r: 2 });
      box(g, solid('#c7cbce', 0.3), 45, 0.8, 43, 0, 82.1, 0);      // well bottom
      box(g, water(), 46.5, 2, 44.5, 0, 93.5, 0, { r: 1.5 });      // half-full water line
      // smooth chrome gooseneck + lever handles on turned bosses
      lathe(g, chrome(), [[3, 0], [2.8, 0.7], [2, 1.5], [1.8, 2.6]], 0, 103.6, -24.5, { seg: 20 });
      sweep(g, chrome(), [[0, 104, -24.5], [0, 118, -24.5], [0, 122, -21.5], [0, 123.5, -16], [0, 120, -11], [0, 116, -10]], 1.7, { seg: 36 });
      cyl(g, chrome(), 1.9, 1.8, 0, 114.2, -10, { seg: 14 });
      for (const sx of [-7.5, 7.5]) {
        lathe(g, chrome(), [[1.9, 0], [1.5, 0.8], [1.1, 2]], sx, 103.7, -24.5, { seg: 14 });
        box(g, chrome(), 1.4, 1.2, 6, sx, 105.5, -22.5, { r: 0.5 });
      }
      return g;
    }
  },
  // ---- Laundry base cabinet + counter -------------------------------------
  {
    id: 'util_base_cabinet', name: 'Laundry Base Cabinet', cat: 'utility', w: 120, d: 60, h: 92,
    palettes: CABINET, plan: { type: 'counter' },
    build: (p) => {
      const g = G();
      const cab = wood(p.wood, 0.5);
      box(g, cab, 120, 86, 60, 0, 0, 0, { r: 1 });
      // four drawer / door faces
      for (const sx of [-1, 1]) {
        box(g, wood(p.wood, 0.45), 56, 40, 2, sx * 30, 44, 31);
        box(g, wood(p.wood, 0.45), 56, 34, 2, sx * 30, 6, 31);
        handleBar(g, sx * 30, 64, 33, 16, false, metal('#c9ced4', 0.3));
        handleBar(g, sx * 30, 26, 33, 16, false, metal('#c9ced4', 0.3));
      }
      box(g, solid('#e9e7e2', 0.3), 124, 6, 63, 0, 86, 0, { r: 1 }); // stone counter
      return g;
    }
  },
  // ---- Laundry wall cabinet -----------------------------------------------
  {
    id: 'util_wall_cabinet', name: 'Laundry Wall Cabinet', cat: 'utility', w: 120, d: 34, h: 72,
    elevation: 150, mount: 'wall', palettes: CABINET, plan: { type: 'wallCabinet' },
    build: (p) => {
      const g = G();
      const cab = wood(p.wood, 0.5);
      box(g, cab, 120, 72, 34, 0, 0, -1, { r: 1 });
      for (const sx of [-1, 1]) {
        box(g, wood(p.wood, 0.45), 57, 66, 2, sx * 30, 0, 16.5);
        handleBar(g, sx * 5, -20, 18, 20, true, metal('#c9ced4', 0.3));
      }
      return g;
    }
  },
  // ---- Folding counter with baskets ---------------------------------------
  {
    id: 'util_folding_counter', name: 'Folding Counter + Baskets', cat: 'utility', w: 120, d: 55, h: 92,
    palettes: CABINET, plan: { type: 'counter' },
    build: (p) => {
      const g = G();
      const frame = wood(p.wood, 0.5);
      for (const sx of [-1, 1]) box(g, frame, 5, 86, 55, sx * 56, 0, 0);
      box(g, solid('#e9e7e2', 0.3), 120, 6, 57, 0, 86, 0, { r: 1 }); // counter
      box(g, frame, 114, 4, 52, 0, 44, 0);                            // mid shelf
      // woven baskets on the shelf
      const baskets = ['#c9a978', '#9fae9a', '#c58f6a'];
      for (let i = -1; i <= 1; i++) {
        box(g, solid(baskets[i + 1], 0.85), 32, 26, 42, i * 38, 48, 0, { r: 3 });
        box(g, solid('#3a332a', 0.9), 28, 22, 38, i * 38, 49, 0, { r: 2 });
      }
      return g;
    }
  },
  // ---- Chrome wire shelving -----------------------------------------------
  {
    id: 'util_wire_shelving', name: 'Wire Storage Shelving', cat: 'utility', w: 92, d: 46, h: 182,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      const m = metal('#b9bec3', 0.3);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, m, 2, 182, sx * 44, 0, sz * 21);
      for (const sy of [8, 52, 96, 140, 178]) {
        box(g, m, 92, 2, 46, 0, sy, 0);
        for (let i = -3; i <= 3; i++) box(g, m, 1, 1.5, 46, i * 13, sy + 1.5, 0);
      }
      return g;
    }
  },
  // ---- Broom / utility cabinet --------------------------------------------
  {
    id: 'util_broom_cabinet', name: 'Tall Utility Cabinet', cat: 'utility', w: 46, d: 56, h: 200,
    palettes: CABINET, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const cab = wood(p.wood, 0.5);
      box(g, cab, 46, 200, 56, 0, 0, 0, { r: 1 });
      box(g, wood(p.wood, 0.45), 42, 150, 2, 0, 8, 28);         // tall door
      box(g, wood(p.wood, 0.45), 42, 40, 2, 0, 160, 28);        // upper door
      handleBar(g, 16, 96, 30, 26, true, metal('#c9ced4', 0.3));
      handleBar(g, 16, 178, 30, 14, true, metal('#c9ced4', 0.3));
      return g;
    }
  },
  // ---- Tank water heater ---------------------------------------------------
  {
    id: 'util_water_heater', name: 'Water Heater', cat: 'utility', w: 56, d: 56, h: 150,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      const tank = metal('#d3d7da', 0.4);
      cyl(g, tank, 27, 138, 0, 0, 0, { seg: 28 });
      cyl(g, tank, 27, 8, 0, 143, 0, { seg: 28, rTop: 24 });      // domed top
      box(g, solid('#9aa0a6', 0.5), 24, 16, 3, 0, 40, 27);        // control box
      // copper supply lines with real swept bends + T&P relief run to the floor
      const cu = metal('#b06a3a', 0.4);
      sweep(g, cu, [[-9, 148, -6], [-9, 158, -6], [-11.5, 162, -6], [-17, 163.5, -6], [-22, 163.5, -6], [-25.5, 166, -6], [-26, 172, -6]], 1.9, { seg: 32 });
      sweep(g, cu, [[9, 148, -6], [9, 155, -6], [11.5, 159, -6], [17, 160.5, -6], [22, 160.5, -6], [25.5, 163, -6], [26, 172, -6]], 1.9, { seg: 32 });
      cyl(g, metal('#a8adb2', 0.5), 8, 3, 0, 149.5, 0, { seg: 24, rTop: 6 });  // draft hood
      cyl(g, metal('#a8adb2', 0.5), 6, 22, 0, 152, 0, { seg: 24 });            // flue
      box(g, metal('#c8a24a', 0.35), 4, 5, 4, 26, 92, 4, { r: 1 });            // brass T&P valve
      sweep(g, cu, [[26, 96, 4], [29.5, 94, 4], [30.5, 88, 4], [30.5, 40, 4], [30.5, 8, 4]], 1.3, { seg: 20 }); // relief drain pipe
      return g;
    }
  },
  // ---- Folding drying rack -------------------------------------------------
  {
    id: 'util_drying_rack', name: 'Folding Drying Rack', cat: 'utility', w: 60, d: 52, h: 110,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      const m = metal('#e6e9ec', 0.35);
      for (const sz of [-1, 1]) {
        for (const sx of [-1, 1]) cyl(g, m, 1.4, 108, sx * 28, 54, sz * 22, { rz: sx * sz * 0.06 });
        box(g, m, 58, 2, 2, 0, 6, sz * 22);
        box(g, m, 58, 2, 2, 0, 104, sz * 22);
      }
      for (let i = 0; i < 6; i++) cyl(g, m, 0.8, 44, 0, 30 + i * 14, 0, { rz: Math.PI / 2 }); // rungs
      return g;
    }
  },
  // ---- Ironing board -------------------------------------------------------
  {
    id: 'util_ironing_board', name: 'Ironing Board', cat: 'utility', w: 122, d: 40, h: 88,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      box(g, solid('#cdd6dd', 0.7), 118, 4, 36, 6, 86, 0, { r: 16 }); // padded top (tapered look)
      box(g, solid('#b7c1c9', 0.7), 40, 3, 30, -50, 86.5, 0, { r: 14 });
      const m = metal('#9aa0a6', 0.35);
      // X-frame legs run floor (y≈0) up to the underside of the top (y≈86)
      for (const s of [-1, 1]) cyl(g, m, 1.4, 96, s * 20, -4, 0, { rx: s * 0.5 });
      box(g, m, 40, 2, 2, 0, 4, 0);
      // an iron resting on the rest
      box(g, solid('#2b2f34', 0.4), 18, 8, 11, 40, 92, 0, { r: 4 });
      cyl(g, glow('#e2483a', 0.5, 0.4), 1, 1, 46, 92, 6, { rz: Math.PI / 2 });
      return g;
    }
  },
  // ---- Laundry hamper ------------------------------------------------------
  {
    id: 'util_hamper', name: 'Laundry Hamper', cat: 'utility', w: 46, d: 36, h: 62,
    palettes: [
      { name: 'Natural', chip: '#c9a978', body: '#c9a978' },
      { name: 'Grey', chip: '#9aa0a6', body: '#9aa0a6' },
      { name: 'Charcoal', chip: '#3a3f45', body: '#3a3f45' }
    ],
    plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const band = { '#c9a978': '#a8865a', '#9aa0a6': '#7e848a', '#3a3f45': '#26292d' }[p.body] || '#8a8478';
      // tapered woven basket — ONE lathe profile with a rolled rim
      lathe(g, solid(p.body, 0.9), [[14.5, 0], [19, 1.5], [20.5, 12], [21.8, 40], [22.4, 54], [21.6, 58], [20, 56.5], [19, 44], [17.5, 12], [1, 10]], 0, 0, 0, { seg: 32 });
      for (const [ry, rr] of [[14, 20.7], [30, 21.2], [46, 21.9]]) torus(g, solid(band, 0.9), rr, 0.9, 0, ry, 0); // weave bands
      // stuffed laundry cresting the rim
      cushion(g, solid('#efe9dd', 0.9), 27, 11, 27, 0, 51, 0, { puff: 0.45, dimple: 0.2 });
      // a towel flopped over the front edge (fold cap + drape panels)
      const tw = solid('#c8cdd2', 0.85);
      cyl(g, tw, 2.4, 19, 0, 58.4, 20.6, { rz: Math.PI / 2, seg: 16 });
      drape(g, tw, 19, 24, 0, 58.2, 22.6, { sag: 2.2, wave: 2, folds: 3, seed: 3 });
      drape(g, tw, 19, 13, 0, 58.2, 18.4, { sag: 2, wave: 1.8, folds: 3, seed: 6, ry: Math.PI });
      return g;
    }
  },
  // ---- Mudroom locker bench with shoe cubbies ------------------------------
  {
    id: 'mud_locker_bench', name: 'Mudroom Locker + Cubbies', cat: 'utility', w: 150, d: 42, h: 200,
    palettes: CABINET, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const cab = wood(p.wood, 0.5);
      const back = wood(p.wood, 0.55);
      box(g, back, 150, 200, 4, 0, 0, -19);                       // back panel
      // three bays divided by uprights
      for (let i = -1; i <= 1; i++) box(g, cab, 3, 200, 42, i * 49, 0, 0);
      box(g, cab, 150, 3, 42, 0, 200, 0);                           // top
      // bench seat
      box(g, cab, 150, 5, 42, 0, 46, 0, { r: 1 });
      // lower shoe cubbies (open boxes under the bench seat at 46)
      for (let i = -1; i <= 1; i++) {
        box(g, solid('#17191c', 0.95), 40, 44, 34, i * 49, 1, 3);    // cubby shadow box
        box(g, cab, 40, 2, 34, i * 49, 24, 3);                       // divider shelf
      }
      // coat hooks at seat-back height
      for (let i = -1; i <= 1; i++) for (const sx of [-14, 14]) {
        cyl(g, metal('#4a4d52', 0.4), 1.2, 8, i * 49 + sx, 120, -14, { rx: Math.PI / 3 });
        sphere(g, metal('#4a4d52', 0.4), 1.8, i * 49 + sx, 116, -10);
      }
      // upper open cubbies (for baskets / hats) — baskets sit ON the 168 shelf
      // and stay under the 200 top instead of clipping through it
      box(g, cab, 150, 3, 42, 0, 168, 0);
      for (let i = -1; i <= 1; i++) box(g, solid('#c9a978', 0.85), 40, 24, 34, i * 49, 171, 0, { r: 3 });
      return g;
    }
  },
  // ---- Freestanding shoe cubby --------------------------------------------
  {
    id: 'mud_shoe_cubby', name: 'Shoe Cubby Organizer', cat: 'utility', w: 88, d: 32, h: 92,
    palettes: CABINET, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const cab = wood(p.wood, 0.5);
      box(g, cab, 88, 92, 32, 0, 0, -1, { r: 1 });                 // carcass
      // 3 columns x 3 rows of open cubbies
      for (let c = -1; c <= 1; c++) box(g, cab, 2, 88, 30, c * 28, 0, 1);
      for (const ry of [24, 46, 68]) box(g, cab, 86, 2, 30, 0, ry, 1);
      // a couple of shoe pairs
      for (const [cx, cy] of [[-28, 12], [28, 34], [0, 56]]) {
        for (const sx of [-6, 6]) box(g, solid('#8a5a3a', 0.6), 9, 6, 20, cx + sx, cy, 4, { r: 3 });
      }
      return g;
    }
  },
  // ---- Wall coat-hook rail with shelf --------------------------------------
  {
    id: 'mud_hook_rail', name: 'Coat Hook Rail + Shelf', cat: 'utility', w: 120, d: 22, h: 40,
    elevation: 160, mount: 'wall', palettes: CABINET, plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      const board = wood(p.wood, 0.5);
      box(g, board, 120, 30, 4, 0, -2, -8);                         // back board
      box(g, board, 120, 4, 22, 0, 14, 0, { r: 1 });                // top shelf
      for (let i = -2; i <= 2; i++) {
        box(g, metal('#3a3d42', 0.4), 3, 10, 3, i * 26, -8, -2);
        box(g, metal('#3a3d42', 0.4), 3, 3, 8, i * 26, -12, 1);
      }
      return g;
    }
  },
  // ---- Storage bench -------------------------------------------------------
  {
    id: 'mud_bench', name: 'Storage Bench', cat: 'utility', w: 110, d: 38, h: 48,
    palettes: CABINET, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const cab = wood(p.wood, 0.5);
      box(g, cab, 110, 40, 38, 0, 0, 0, { r: 1 });
      box(g, solid('#d8ccb8', 0.8), 110, 6, 38, 0, 40, 0, { r: 2 }); // cushion top
      // open cubbies — front face pokes just proud of the carcass so they read
      for (let i = -1; i <= 1; i++) box(g, solid('#17191c', 0.95), 32, 30, 32, i * 36, 5, 3.5); // open cubbies
      return g;
    }
  },
  // ---- Floor drain ---------------------------------------------------------
  {
    id: 'util_floor_drain', name: 'Floor Drain', cat: 'utility', w: 20, d: 20, h: 3,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      box(g, metal('#9aa0a6', 0.4), 20, 3, 20, 0, 1.5, 0, { r: 2 });
      box(g, solid('#5b6066', 0.4), 15, 2, 15, 0, 2.4, 0, { r: 1 });
      for (let i = -2; i <= 2; i++) box(g, metal('#b9bec3', 0.35), 13, 1.4, 1.2, 0, 3, i * 3);
      return g;
    }
  },
  // ---- Utility wash station ------------------------------------------------
  {
    id: 'util_wash_station', name: 'Utility Wash Station', cat: 'utility', w: 72, d: 60, h: 128,
    palettes: null, plan: { type: 'sink' },
    build: () => {
      const g = G();
      // splash panel behind (runs floor to top — no floating slab)
      box(g, tex('tile_subway', 1.6, 2.4), 72, 128, 3, 0, 0, -28);
      // shallow OPEN floor basin: slab + raised lip walls, standing water inside
      const tray = solid('#c7cbce', 0.3);
      box(g, tray, 66, 5, 52, 0, 0, 4, { r: 2 });                  // floor slab
      for (const sz of [-1, 1]) box(g, tray, 66, 9, 5, 0, 3, 4 + sz * 23.5, { r: 2 });
      for (const sx of [-1, 1]) box(g, tray, 5, 9, 52, sx * 30.5, 3, 4, { r: 2 });
      box(g, solid('#aeb3b7', 0.3), 54, 0.8, 40, 0, 5.1, 4);       // well bottom
      box(g, water(), 53, 1.8, 39, 0, 6, 4, { r: 1 });             // standing water
      // wall-mount faucet: ONE smooth sweep from the wall over the basin
      cyl(g, chrome(), 3, 1.6, 0, 96, -26.5, { rx: Math.PI / 2, seg: 20 }); // wall escutcheon
      sweep(g, chrome(), [[0, 96, -27], [0, 96, -22], [0, 101, -18.5], [0, 104.5, -13], [0, 101, -8], [0, 97, -7]], 1.7, { seg: 36 });
      cyl(g, chrome(), 1.9, 1.8, 0, 95.2, -7, { seg: 14 });
      for (const sx of [-10, 10]) {
        cyl(g, chrome(), 2.2, 2, sx, 92, -26, { rx: Math.PI / 2, seg: 16 });
        box(g, chrome(), 1.4, 1.2, 6, sx, 91.4, -22.4, { r: 0.5 });          // levers
      }
      // sprayer wand on a smooth hanging hose (no more bead chain)
      sweep(g, solid('#3a3f45', 0.5), [[10, 92, -25], [20, 86, -21], [26, 70, -19], [23, 54, -22], [24, 40, -21], [24, 37, -20.5]], 1.1, { seg: 36 });
      box(g, chrome(), 2.2, 2.4, 6, 24, 32, -24);                            // wall clip
      lathe(g, solid('#2b2f34', 0.4), [[2.9, 0], [2.5, 2], [1.3, 4.5], [1.1, 13.5], [1.6, 15]], 24, 22, -20.5, { seg: 18 });
      return g;
    }
  },
  // ---- Mop / slop sink -----------------------------------------------------
  {
    id: 'util_mop_sink', name: 'Mop / Slop Sink', cat: 'utility', w: 62, d: 62, h: 42,
    palettes: null, plan: { type: 'sink' },
    build: () => {
      const g = G();
      const basin = solid('#dcdfe1', 0.4);
      // OPEN basin: floor slab + four walls, so the well actually reads
      box(g, basin, 62, 8, 62, 0, 0, 0, { r: 3 });                 // floor
      for (const sz of [-1, 1]) box(g, basin, 62, 24, 7, 0, 6, sz * 27.5, { r: 2.5 });
      for (const sx of [-1, 1]) box(g, basin, 7, 24, 62, sx * 27.5, 6, 0, { r: 2.5 });
      box(g, solid('#c2c6c9', 0.35), 47.5, 1.2, 47.5, 0, 7.4, 0);  // well bottom
      box(g, water(), 47, 2, 47, 0, 8.6, 0, { r: 1.5 });           // standing water
      // service faucet: turned escutcheon + ONE smooth sweep over the basin
      lathe(g, chrome(), [[3, 0], [2.8, 0.7], [2, 1.5], [1.8, 2.6]], -22, 29.6, -27, { seg: 20 });
      sweep(g, chrome(), [[-22, 30, -27], [-22, 48, -27], [-20.5, 53, -23.5], [-16.5, 54.5, -18], [-12.5, 51, -13], [-11.5, 46.5, -12]], 1.6, { seg: 36 });
      cyl(g, chrome(), 1.8, 1.8, -11.5, 44.7, -12, { seg: 14 });
      cyl(g, chrome(), 1.2, 3, -17, 29.6, -27, { seg: 12 });
      box(g, chrome(), 6, 1.2, 1.6, -14.5, 32.4, -27, { r: 0.5, rz: -0.2 });
      // galvanized mop bucket standing in the water (intrigue)
      lathe(g, metal('#aab0b4', 0.45), [[6.2, 0], [7.4, 1], [9.2, 15], [9.6, 16.5], [8.8, 15.8], [8.4, 10], [6, 1.8], [0.6, 2]], 10, 8.8, 8, { seg: 24 });
      sweep(g, metal('#8a9094', 0.4), [[1.6, 23.8, 8], [4.5, 28.2, 8], [10, 30.2, 8], [15.5, 28.2, 8], [18.4, 23.8, 8]], 0.55, { seg: 24 }); // bail handle
      return g;
    }
  }
];
