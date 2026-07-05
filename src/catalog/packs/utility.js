import { G, box, cyl, sphere, legs4, knob, handleBar, solid, wood, metal, chrome, glass, water, tex, glow } from '../builders.js';

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
      box(g, body, 60, 88, 64, 0, 44, 0, { r: 2 });
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
      box(g, body, 60, 88, 64, 0, 44, 0, { r: 2 });
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
        box(g, body, 60, 86, 64, 0, 43 + yb, 0, { r: 2 });
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
      box(g, body, 60, 36, 64, 0, 18, 0, { r: 2 });
      box(g, solid('#20242a', 0.3), 52, 24, 2, 0, 18, 32.5);       // drawer face
      handleBar(g, 0, 18, 34, 26, false, metal('#c9ced4', 0.3));
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
      box(g, tub, 56, 26, 54, 0, 78, 0, { r: 4 });                 // deep basin
      box(g, solid('#c7cbce', 0.3), 48, 20, 46, 0, 80, 0, { r: 3 }); // interior
      box(g, water(), 46, 3, 44, 0, 74, 0, { r: 3 });
      cyl(g, chrome(), 2, 3, 0, 74, 0, { seg: 16 });               // drain
      // gooseneck faucet
      cyl(g, chrome(), 1.8, 22, 0, 92, -22);
      cyl(g, chrome(), 1.6, 14, 0, 112, -16, { rx: Math.PI / 2 });
      cyl(g, chrome(), 1.5, 8, 0, 110, -6, { rx: Math.PI / 2 });
      for (const sx of [-7, 7]) knob(g, sx, 93, -22, 2.4);
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
      box(g, cab, 120, 86, 60, 0, 43, 0, { r: 1 });
      // four drawer / door faces
      for (const sx of [-1, 1]) {
        box(g, wood(p.wood, 0.45), 56, 40, 2, sx * 30, 60, 31);
        box(g, wood(p.wood, 0.45), 56, 34, 2, sx * 30, 26, 31);
        handleBar(g, sx * 30, 60, 33, 16, false, metal('#c9ced4', 0.3));
        handleBar(g, sx * 30, 26, 33, 16, false, metal('#c9ced4', 0.3));
      }
      box(g, solid('#e9e7e2', 0.3), 124, 6, 63, 0, 89, 0, { r: 1 }); // stone counter
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
      for (const sx of [-1, 1]) box(g, frame, 5, 86, 55, sx * 56, 43, 0);
      box(g, solid('#e9e7e2', 0.3), 120, 6, 57, 0, 89, 0, { r: 1 }); // counter
      box(g, frame, 114, 4, 52, 0, 44, 0);                            // mid shelf
      // woven baskets on the shelf
      const baskets = ['#c9a978', '#9fae9a', '#c58f6a'];
      for (let i = -1; i <= 1; i++) {
        box(g, solid(baskets[i + 1], 0.85), 32, 26, 42, i * 38, 60, 0, { r: 3 });
        box(g, solid('#3a332a', 0.9), 28, 22, 38, i * 38, 61, 0, { r: 2 });
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
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, m, 2, 182, sx * 44, 91, sz * 21);
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
      box(g, cab, 46, 200, 56, 0, 100, 0, { r: 1 });
      box(g, wood(p.wood, 0.45), 42, 150, 2, 0, 96, 28);         // tall door
      box(g, wood(p.wood, 0.45), 42, 40, 2, 0, 178, 28);        // upper door
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
      cyl(g, tank, 27, 138, 0, 70, 0, { seg: 28 });
      cyl(g, tank, 27, 8, 0, 143, 0, { seg: 28, rTop: 24 });      // domed top
      box(g, solid('#9aa0a6', 0.5), 24, 16, 3, 0, 40, 27);        // control box
      // hot/cold pipes + flue
      for (const sx of [-9, 9]) cyl(g, metal('#b06a3a', 0.4), 2, 24, sx, 150, -6);
      cyl(g, metal('#a8adb2', 0.5), 6, 24, 0, 156, 0, { seg: 16 }); // flue
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
      for (const s of [-1, 1]) cyl(g, m, 1.4, 100, s * 20, 44, 0, { rx: s * 0.5 });
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
      box(g, solid(p.body, 0.9), 46, 60, 36, 0, 30, 0, { r: 6 });
      box(g, solid('#efe9dd', 0.9), 40, 8, 30, 0, 62, 0, { r: 4 }); // stuffed laundry
      box(g, solid(p.body, 0.85), 44, 6, 34, 0, 58, 0, { r: 5 });   // rolled rim
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
      box(g, back, 150, 200, 4, 0, 100, -19);                       // back panel
      // three bays divided by uprights
      for (let i = -1; i <= 1; i++) box(g, cab, 3, 200, 42, i * 49, 100, 0);
      box(g, cab, 150, 3, 42, 0, 200, 0);                           // top
      // bench seat
      box(g, cab, 150, 5, 42, 0, 46, 0, { r: 1 });
      // lower shoe cubbies (open boxes under the bench)
      for (let i = -1; i <= 1; i++) {
        box(g, solid('#00000022', 1), 40, 38, 34, i * 49, 24, 2);   // cubby shadow box
        box(g, cab, 40, 2, 34, i * 49, 24, 2);                       // divider shelf
      }
      // coat hooks at seat-back height
      for (let i = -1; i <= 1; i++) for (const sx of [-14, 14]) {
        cyl(g, metal('#4a4d52', 0.4), 1.2, 8, i * 49 + sx, 120, -14, { rx: Math.PI / 3 });
        sphere(g, metal('#4a4d52', 0.4), 1.8, i * 49 + sx, 116, -10);
      }
      // upper open cubbies (for baskets / hats)
      box(g, cab, 150, 3, 42, 0, 168, 0);
      for (let i = -1; i <= 1; i++) box(g, solid('#c9a978', 0.85), 40, 24, 34, i * 49, 182, 0, { r: 3 });
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
      box(g, cab, 88, 92, 32, 0, 46, -1, { r: 1 });                 // carcass
      // 3 columns x 3 rows of open cubbies
      for (let c = -1; c <= 1; c++) box(g, cab, 2, 88, 30, c * 28, 46, 1);
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
      box(g, cab, 110, 40, 38, 0, 22, 0, { r: 1 });
      box(g, solid('#d8ccb8', 0.8), 110, 6, 38, 0, 45, 0, { r: 2 }); // cushion top
      for (let i = -1; i <= 1; i++) box(g, solid('#00000022', 1), 32, 30, 32, i * 36, 20, 2); // open cubbies
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
      // splash panel behind
      box(g, tex('tile_subway', 1.6, 2.4), 72, 128, 3, 0, 64, -28);
      // shallow floor basin
      box(g, solid('#c7cbce', 0.3), 66, 14, 52, 0, 7, 4, { r: 3 });
      box(g, solid('#aeb3b7', 0.3), 58, 10, 44, 0, 8, 4, { r: 2 });
      box(g, water(), 56, 2, 42, 0, 9, 4, { r: 2 });
      cyl(g, chrome(), 2.2, 2, 0, 8, 4, { seg: 16 });               // drain grate
      // wall faucet + coiled hose
      cyl(g, chrome(), 2, 8, 0, 96, -26, { rx: Math.PI / 2 });
      cyl(g, chrome(), 1.8, 16, 0, 96, -20);
      cyl(g, chrome(), 1.5, 10, 0, 104, -13, { rx: Math.PI / 2 });
      for (const sx of [-10, 10]) { cyl(g, chrome(), 2.4, 2, sx, 92, -26, { rx: Math.PI / 2 }); knob(g, sx, 92, -23, 2); }
      // sprayer hose hanging
      for (let i = 0; i < 5; i++) sphere(g, solid('#3a3f45', 0.5), 1.6, 24, 90 - i * 12, -22 + Math.sin(i) * 3);
      box(g, solid('#2b2f34', 0.4), 6, 12, 5, 24, 30, -20, { r: 2 }); // sprayer head
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
      box(g, basin, 62, 30, 62, 0, 15, 0, { r: 3 });
      box(g, solid('#c2c6c9', 0.35), 52, 22, 52, 0, 18, 0, { r: 2 });
      box(g, water(), 50, 2, 50, 0, 20, 0, { r: 2 });
      cyl(g, chrome(), 2, 2, 8, 20, 8, { seg: 16 });
      // tall service faucet with lever
      cyl(g, chrome(), 1.8, 40, -22, 50, -24);
      cyl(g, chrome(), 1.6, 22, -22, 88, -14, { rx: Math.PI / 2 });
      box(g, chrome(), 10, 2, 2, -14, 86, -24);
      return g;
    }
  }
];
