import { G, box, cyl, sphere, prism, wavyPanel, blob, foliage, solid, wood, metal, glass, glow, tex } from '../builders.js';

// Modern outdoor structures & yard features — all parametric, primitives only.
const WOODS = [
  { name: 'Cedar', chip: '#9c7550', wood: '#9c7550' },
  { name: 'Teak', chip: '#b58a54', wood: '#b58a54' },
  { name: 'Charcoal', chip: '#3c3c40', wood: '#3c3c40' },
  { name: 'Whitewash', chip: '#d8cfbe', wood: '#d8cfbe' }
];

export const STRUCTURES_ITEMS = [
  // ---- Modern slat pergola --------------------------------------------------
  {
    id: 'struct_pergola_slat', name: 'Louvered Pergola', cat: 'outdoor', w: 320, d: 300, h: 240,
    palettes: WOODS, plan: { type: 'pergola' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.65);
      const frame = metal('#3a3d42', 0.5);
      // four square posts
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        box(g, wd, 16, 224, 16, sx * 148, 0, sz * 138);
      }
      // perimeter beams
      for (const sz of [-1, 1]) box(g, frame, 320, 18, 12, 0, 224, sz * 138);
      for (const sx of [-1, 1]) box(g, frame, 12, 18, 288, sx * 148, 224, 0);
      // horizontal louvered slats across the top
      for (let z = -128; z <= 128; z += 16) {
        box(g, wd, 300, 10, 5, 0, 236, z, { rx: 0.32 });
      }
      return g;
    }
  },

  // ---- Cabana / canopy ------------------------------------------------------
  {
    id: 'struct_cabana', name: 'Cabana Canopy', cat: 'outdoor', w: 300, d: 260, h: 250,
    palettes: WOODS, plan: { type: 'pergola' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.6);
      const fabric = solid('#efe9dc', 0.95);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        cyl(g, wd, 7, 228, sx * 138, 0, sz * 118);
      }
      for (const sz of [-1, 1]) box(g, wd, 296, 10, 8, 0, 228, sz * 118);
      // draped fabric canopy
      const canopy = wavyPanel(g, fabric, 292, 250, 5, 14);
      canopy.position.set(-146, 240, 118);
      canopy.rotation.x = Math.PI / 2;
      // tie-back sheer curtains at the back corners
      for (const sx of [-1, 1]) {
        const c = wavyPanel(g, solid('#f6f2ea', 0.9), 90, 210, 4, 8);
        c.position.set(sx * 138 - 45, 210, -118);
      }
      return g;
    }
  },

  // ---- She-shed -------------------------------------------------------------
  {
    id: 'struct_she_shed', name: 'She-Shed', cat: 'outdoor', w: 300, d: 260, h: 260,
    palettes: [
      { name: 'Sage', chip: '#8a9a7c', wood: '#8a9a7c' },
      { name: 'Blush', chip: '#d8b6ac', wood: '#d8b6ac' },
      { name: 'Cedar', chip: '#9c7550', wood: '#9c7550' }
    ],
    plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const wall = tex('siding_sand', 3, 2);
      const trim = wood(p.wood, 0.6);
      const roof = solid('#4a4e52', 0.7);
      // box body
      box(g, wall, 300, 190, 260, 0, 0, 0);
      // corner + base trim
      for (const sx of [-1, 1]) box(g, trim, 10, 190, 10, sx * 148, 0, 130);
      box(g, trim, 300, 12, 262, 0, 0, 0);
      // gabled roof running along x
      prism(g, roof, 300, 70, 280, 0, 190, 0, solid('#5a5e62', 0.75));
      box(g, trim, 316, 8, 8, 0, 190, 142);
      // dutch door
      box(g, wood('#6a4f38', 0.55), 70, 150, 6, 0, 0, 131);
      box(g, glass(), 54, 40, 3, 0, 100, 133);
      sphere(g, metal('#c8b070', 0.3), 3, 22, 78, 134);
      // flanking windows with boxes
      for (const sx of [-1, 1]) {
        box(g, wood('#f2ede2', 0.6), 60, 60, 5, sx * 95, 95, 130);
        box(g, glass(), 50, 50, 3, sx * 95, 100, 131);
        box(g, trim, 62, 14, 20, sx * 95, 62, 136);
        foliage(g, '#6f8a4a', '#a6c46a', sx * 95, 82, 140, 22, 8, 11 + sx);
      }
      return g;
    }
  },

  // ---- Greenhouse -----------------------------------------------------------
  {
    id: 'struct_greenhouse', name: 'Glass Greenhouse', cat: 'outdoor', w: 260, d: 340, h: 250,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      const gl = glass();
      const frame = metal('#eae7e0', 0.4);
      const H = 170;
      // glazed walls
      box(g, gl, 258, H, 338, 0, 6, 0);
      // low masonry base
      box(g, tex('gravel', 3, 1), 260, 18, 340, 0, 0, 0);
      // corner + mid frame ribs
      for (const sx of [-1, 1]) {
        cyl(g, frame, 3.5, H, sx * 128, 6, 168, { seg: 6 });
        cyl(g, frame, 3.5, H, sx * 128, 6, -168, { seg: 6 });
        for (let z = -112; z <= 112; z += 56) cyl(g, frame, 2.6, H, sx * 128, 6, z, { seg: 6 });
      }
      // eave beams
      for (const sx of [-1, 1]) box(g, frame, 5, 5, 340, sx * 128, H + 6, 0);
      // glass gable roof
      prism(g, gl, 260, 62, 342, 0, H + 6, 0);
      // ridge + rafters
      box(g, frame, 5, 5, 342, 0, H + 66, 0);
      for (let z = -150; z <= 150; z += 50) {
        box(g, frame, 258, 3, 3, 0, H + 8, z, { rz: 0 });
      }
      // interior potting bench with plants
      box(g, wood('#7a6248', 0.6), 120, 8, 40, -60, 78, 130);
      foliage(g, '#5f7f3c', '#9dc25a', -90, 100, 130, 18, 8, 3);
      foliage(g, '#6f8a4a', '#a6c46a', -30, 100, 130, 18, 8, 5);
      return g;
    }
  },

  // ---- Outdoor shower (lit) -------------------------------------------------
  {
    id: 'yard_outdoor_shower', name: 'Outdoor Shower', cat: 'outdoor', w: 120, d: 120, h: 230,
    palettes: WOODS, plan: { type: 'shower' },
    light: { y: 150, color: '#eaf2ff', intensity: 0.5, distance: 200 },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.55);
      const pipe = metal('#c6cace', 0.3);
      // slatted privacy back + side wall
      for (let y = 6; y < 210; y += 16) {
        box(g, wd, 110, 11, 6, 0, y, -55);
        box(g, wd, 6, 11, 110, -55, y, 0);
      }
      // corner posts
      for (const [x, z] of [[-55, -55], [55, -55], [-55, 55]]) box(g, wd, 8, 220, 8, x, 0, z);
      // teak drainage floor
      for (let x = -46; x <= 46; x += 12) box(g, wd, 8, 4, 100, x, 2, 0);
      // plumbing riser + gooseneck + head
      cyl(g, pipe, 2.4, 195, -46, 6, -46);
      cyl(g, pipe, 2.4, 40, -46, 201, -46, { rx: Math.PI / 2 });
      cyl(g, pipe, 2.4, 40, -26, 201, -46, { rz: 0 });
      cyl(g, metal('#d6dadf', 0.2), 9, 5, -46, 196, -26);
      cyl(g, glow('#eaf2ff', 0.6), 8, 2, -46, 194, -26);
      // control valve
      cyl(g, pipe, 4, 5, -30, 120, -50, { rx: Math.PI / 2 });
      return g;
    }
  },

  // ---- Raised garden bed ----------------------------------------------------
  {
    id: 'yard_raised_bed', name: 'Raised Garden Bed', cat: 'outdoor', w: 200, d: 100, h: 46,
    palettes: WOODS, plan: { type: 'plant' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.7);
      // plank walls
      box(g, wd, 200, 44, 8, 0, 0, 46);
      box(g, wd, 200, 44, 8, 0, 0, -46);
      box(g, wd, 8, 44, 100, 100, 0, 0);
      box(g, wd, 8, 44, 100, -100, 0, 0);
      // corner posts / cap rail
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, wd, 12, 48, 12, sx * 96, 0, sz * 42);
      box(g, wd, 204, 6, 12, 0, 44, 46);
      box(g, wd, 204, 6, 12, 0, 44, -46);
      // soil
      box(g, solid('#3a2c1e', 0.98), 184, 8, 84, 0, 34, 0);
      // rows of leafy crops
      for (let x = -78; x <= 78; x += 26) {
        foliage(g, '#4f6f2c', '#8db84e', x, 46, 22, 14, 7, x + 40);
        foliage(g, '#5a7a34', '#9dc25a', x, 46, -22, 14, 7, x + 120);
      }
      return g;
    }
  },

  // ---- Vertical garden wall -------------------------------------------------
  {
    id: 'yard_vertical_garden', name: 'Living Wall', cat: 'outdoor', w: 160, d: 24, h: 200,
    palettes: null, plan: { type: 'fence' },
    build: () => {
      const g = G();
      const frame = metal('#43464b', 0.5);
      // backing panel + frame
      box(g, solid('#2e3033', 0.8), 156, 196, 6, 0, 4, -8);
      for (const sx of [-1, 1]) box(g, frame, 8, 200, 10, sx * 76, 0, -4);
      box(g, frame, 160, 8, 10, 0, 0, -4);
      box(g, frame, 160, 8, 10, 0, 192, -4);
      // staggered planter troughs with cascading greenery
      for (let row = 0; row < 5; row++) {
        const y = 20 + row * 38;
        box(g, solid('#5a5d62', 0.7), 150, 12, 16, 0, y, 2);
        for (let x = -60; x <= 60; x += 30) {
          foliage(g, '#3f5f26', '#7da845', x, y + 16, 8, 15, 8, row * 13 + x + 200);
        }
      }
      return g;
    }
  },

  // ---- Modern planter box with plant ---------------------------------------
  {
    id: 'yard_planter_box', name: 'Tapered Planter', cat: 'outdoor', w: 60, d: 60, h: 130,
    palettes: [
      { name: 'Concrete', chip: '#b8b4ac' },
      { name: 'Charcoal', chip: '#3a3c40' },
      { name: 'Terracotta', chip: '#b06a4a' }
    ],
    plan: { type: 'plant' },
    build: (p) => {
      const g = G();
      const pot = solid(p.chip, 0.85);
      // tapered vessel
      box(g, pot, 52, 58, 52, 0, 0, 0, { r: 4 });
      box(g, solid('#2b2016', 0.98), 44, 6, 44, 0, 52, 0);
      // slim modern shrub: trunk + foliage crown
      cyl(g, wood('#6a533a', 0.6), 3, 40, 0, 56, 0);
      foliage(g, '#3f5f2c', '#88b04c', 0, 108, 0, 30, 12, 42);
      foliage(g, '#4f6f36', '#9dc25a', 0, 92, 0, 26, 10, 71);
      return g;
    }
  },

  // ---- Privacy screen panel -------------------------------------------------
  {
    id: 'struct_privacy_screen', name: 'Privacy Screen', cat: 'outdoor', w: 180, d: 14, h: 200,
    palettes: WOODS, plan: { type: 'fence' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.6);
      const frame = metal('#38393d', 0.5);
      // steel frame
      for (const sx of [-1, 1]) box(g, frame, 8, 200, 12, sx * 86, 0, 0);
      box(g, frame, 180, 8, 12, 0, 0, 0);
      box(g, frame, 180, 8, 12, 0, 192, 0);
      // vertical slats
      for (let x = -76; x <= 76; x += 11) box(g, wd, 6, 188, 6, x, 6, 0);
      return g;
    }
  },

  // ---- Modern horizontal-slat fence panel ----------------------------------
  {
    id: 'struct_fence_horizontal', name: 'Slat Fence Panel', cat: 'outdoor', w: 240, d: 12, h: 150,
    palettes: WOODS, plan: { type: 'fence' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.7);
      const post = solid('#33353a', 0.6);
      // posts
      for (const sx of [-1, 1]) box(g, post, 12, 150, 12, sx * 116, 0, 0);
      // horizontal slats with reveal gaps
      for (let y = 8; y < 148; y += 16) box(g, wd, 226, 12, 6, 0, y, 0);
      // post caps
      for (const sx of [-1, 1]) box(g, post, 15, 5, 15, sx * 116, 150, 0);
      return g;
    }
  },

  // ---- Bike rack ------------------------------------------------------------
  {
    id: 'yard_bike_rack', name: 'Bike Rack', cat: 'outdoor', w: 180, d: 40, h: 75,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      const steel = metal('#5a5e63', 0.35);
      // three inverted-U loops
      for (const x of [-70, 0, 70]) {
        cyl(g, steel, 3.4, 60, x - 14, 0, 0);
        cyl(g, steel, 3.4, 60, x + 14, 0, 0);
        cyl(g, steel, 3.4, 28, x, 60, 0, { rz: Math.PI / 2 });
        sphere(g, steel, 3.4, x - 14, 60, 0);
        sphere(g, steel, 3.4, x + 14, 60, 0);
      }
      // ground rail tying loops together
      box(g, solid('#3c3f43', 0.6), 168, 5, 6, 0, 0, 0);
      return g;
    }
  },

  // ---- EV charger (lit) -----------------------------------------------------
  {
    id: 'yard_ev_charger', name: 'EV Charger', cat: 'outdoor', w: 36, d: 24, h: 145,
    palettes: [
      { name: 'White', chip: '#e8e8ea' },
      { name: 'Graphite', chip: '#2c2e32' }
    ],
    plan: { type: 'box' },
    light: { y: 120, color: '#57e0a0', intensity: 0.4, distance: 130 },
    build: (p) => {
      const g = G();
      const body = solid(p.chip, 0.4);
      const dark = solid('#1e2024', 0.5);
      // pedestal + head
      cyl(g, metal('#7a7e82', 0.4), 7, 30, 0, 0, 0);
      box(g, body, 34, 100, 22, 0, 26, 0, { r: 8 });
      // glowing status screen
      box(g, dark, 26, 40, 3, 0, 78, 11.5);
      box(g, glow('#57e0a0', 0.9), 22, 34, 2, 0, 80, 12.4);
      // coiled cable + connector holstered on the side
      cyl(g, solid('#141518', 0.7), 3, 45, 18, 40, 0, { rz: Math.PI / 2 });
      box(g, dark, 8, 16, 10, 20, 44, 4, { r: 3 });
      return g;
    }
  },

  // ---- Modern mailbox -------------------------------------------------------
  {
    id: 'yard_mailbox', name: 'Modern Mailbox', cat: 'outdoor', w: 26, d: 46, h: 130,
    palettes: [
      { name: 'Black', chip: '#26282c' },
      { name: 'Cedar Post', chip: '#8a6a4a', wood: '#8a6a4a' },
      { name: 'White', chip: '#e6e2d8' }
    ],
    plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const post = wood(p.wood || '#6a533a', 0.55);
      const bodyMat = solid(p.chip, 0.35);
      // slim square post
      box(g, post, 10, 112, 10, 0, 0, 0);
      // wedge-topped letterbox
      box(g, bodyMat, 24, 26, 42, 0, 100, 0, { r: 3 });
      box(g, bodyMat, 24, 10, 42, 0, 122, 0, { rz: 0, rx: 0 });
      // slot + flag
      box(g, solid('#111214', 0.5), 16, 2.5, 4, 0, 116, 21);
      box(g, solid('#c74a3a', 0.5), 2.5, 18, 4, 13, 104, -14);
      // house numbers plate
      box(g, metal('#c8ccd0', 0.3), 20, 8, 2, 0, 70, 6);
      return g;
    }
  },

  // ---- Garden fountain post -------------------------------------------------
  {
    id: 'yard_fountain_post', name: 'Garden Fountain', cat: 'outdoor', w: 70, d: 70, h: 120,
    palettes: [
      { name: 'Stone', chip: '#b0aca2' },
      { name: 'Slate', chip: '#565b60' }
    ],
    plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const stone = solid(p.chip, 0.9);
      const basin = solid('#8f8b82', 0.85);
      // catch basin
      cyl(g, basin, 34, 12, 0, 0, 0);
      cyl(g, glass(), 30, 6, 0, 8, 0);
      // monolith spout column
      box(g, stone, 22, 108, 22, 0, 12, 0, { r: 3 });
      // water sheet spilling from a scupper
      box(g, glass(), 14, 70, 3, 0, 40, 12);
      cyl(g, metal('#9a9ea4', 0.4), 3, 6, 0, 100, 11, { rx: Math.PI / 2 });
      // pebbles in the basin
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        blob(g, '#7a756c', '#a49e94', 3.5, Math.cos(a) * 22, 9, Math.sin(a) * 22, { seed: i + 5, sy: 0.5, detail: 1 });
      }
      return g;
    }
  },

  // ---- Trellis arch ---------------------------------------------------------
  {
    id: 'struct_trellis_arch', name: 'Trellis Arch', cat: 'outdoor', w: 140, d: 60, h: 240,
    palettes: WOODS, plan: { type: 'pergola' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.6);
      // four posts
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, wd, 8, 210, 8, sx * 64, 0, sz * 26);
      // arched top beams (stepped boxes approximating a curve)
      for (const sz of [-1, 1]) {
        box(g, wd, 140, 8, 6, 0, 210, sz * 26);
        box(g, wd, 110, 8, 6, 0, 220, sz * 26);
        box(g, wd, 70, 8, 6, 0, 228, sz * 26);
      }
      // lattice cross-slats on the sides
      for (const sx of [-1, 1]) {
        for (let y = 20; y < 200; y += 24) box(g, wd, 5, 5, 52, sx * 64, y, 0);
      }
      for (let z = -20; z <= 20; z += 20) box(g, wd, 132, 5, 5, 0, 205, z);
      // climbing vine
      for (const sx of [-1, 1]) foliage(g, '#3f5f26', '#7da845', sx * 64, 150, 26, 30, 12, sx * 30 + 60);
      return g;
    }
  },

  // ---- Wood storage shed ----------------------------------------------------
  {
    id: 'struct_wood_shed', name: 'Storage Shed', cat: 'outdoor', w: 300, d: 220, h: 235,
    palettes: WOODS, plan: { type: 'storage' },
    build: (p) => {
      const g = G();
      const wall = wood(p.wood, 0.75);
      const roof = solid('#40444a', 0.7);
      const trim = solid('#2e3034', 0.6);
      // body with vertical board texture via slats on the front
      box(g, wall, 300, 180, 220, 0, 0, 0);
      // mono-pitch (lean-to) roof — a shallow prism, ridge to one side
      prism(g, roof, 300, 34, 240, 0, 180, -20, solid('#4a4e54', 0.72));
      box(g, trim, 314, 6, 6, 0, 180, 118);
      // double barn doors
      for (const sx of [-1, 1]) {
        box(g, solid('#5a4632', 0.6), 68, 168, 6, sx * 36, 4, 111);
        box(g, trim, 68, 8, 8, sx * 36, 150, 114);
        box(g, trim, 68, 8, 8, sx * 36, 40, 114);
      }
      cyl(g, metal('#9a9ea4', 0.3), 2, 24, 4, 88, 115, { rx: Math.PI / 2 });
      // small vent gable window
      box(g, glass(), 40, 30, 3, 0, 120, 111);
      return g;
    }
  },

  // ---- Barrel sauna ---------------------------------------------------------
  {
    id: 'struct_barrel_sauna', name: 'Barrel Sauna', cat: 'outdoor', w: 220, d: 200, h: 200,
    palettes: [
      { name: 'Cedar', chip: '#a9773f', wood: '#a9773f' },
      { name: 'Thermowood', chip: '#7a5230', wood: '#7a5230' }
    ],
    plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.6);
      const staveDark = wood('#8a5f30', 0.7);
      // big horizontal barrel body (cyl laid along z via rx)
      cyl(g, wd, 95, 210, 0, 95, 0, { rx: Math.PI / 2, seg: 28 });
      // stave banding rings
      for (const z of [-90, 90]) cyl(g, metal('#5a5e62', 0.4), 96, 4, 0, 95, z, { rx: Math.PI / 2, seg: 28 });
      // front face wall (flat) + door + window
      cyl(g, staveDark, 93, 6, 0, 95, 103, { rx: Math.PI / 2, seg: 28 });
      box(g, wood('#6a4a2c', 0.6), 56, 130, 5, 0, 12, 106);
      box(g, glass(), 40, 40, 3, 0, 100, 107);
      sphere(g, metal('#c8b070', 0.3), 3, 22, 70, 108);
      // cradle supports keeping the barrel off the ground
      for (const z of [-70, 70]) {
        box(g, wd, 200, 14, 16, 0, 0, z);
        for (const sx of [-1, 1]) box(g, wd, 16, 30, 16, sx * 78, 0, z, { rz: sx * 0.35 });
      }
      // little chimney
      cyl(g, metal('#3a3c40', 0.5), 6, 40, 55, 175, -60);
      return g;
    }
  },

  // ---- Cold-plunge tub ------------------------------------------------------
  {
    id: 'yard_cold_plunge', name: 'Cold-Plunge Tub', cat: 'outdoor', w: 90, d: 130, h: 90,
    palettes: [
      { name: 'Cedar', chip: '#9c7550', wood: '#9c7550' },
      { name: 'Black', chip: '#2a2c30', wood: '#2a2c30' }
    ],
    plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.55);
      // stave tub walls
      box(g, wd, 90, 84, 130, 0, 0, 0, { r: 10 });
      // banding
      for (const y of [14, 66]) box(g, metal('#5a5e62', 0.4), 92, 5, 132, 0, y, 0);
      // water surface inset
      box(g, glass(), 74, 6, 114, 0, 74, 0, { r: 6 });
      // spout + digital chiller unit
      cyl(g, metal('#c6cace', 0.3), 2.5, 14, 30, 80, 55, { rx: 0.6 });
      box(g, solid('#26282c', 0.5), 26, 30, 18, 0, 0, 72, { r: 3 });
      box(g, glow('#6fd0ff', 0.7), 18, 8, 2, 0, 16, 81);
      return g;
    }
  },

  // ---- Outdoor sink / prep station -----------------------------------------
  {
    id: 'yard_outdoor_sink', name: 'Outdoor Prep Sink', cat: 'outdoor', w: 130, d: 60, h: 95,
    palettes: WOODS, plan: { type: 'sink' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.6);
      const counter = solid('#6f7378', 0.5);
      const steel = metal('#c6cace', 0.25);
      // cabinet with slat doors
      box(g, wd, 130, 82, 58, 0, 0, 0);
      for (let x = -56; x <= 56; x += 10) box(g, wood('#5a4a38', 0.6), 6, 60, 4, x, 12, 29.5);
      // concrete counter
      box(g, counter, 134, 8, 62, 0, 82, 0);
      // recessed steel sink
      box(g, steel, 44, 8, 40, 26, 78, 0);
      // gooseneck faucet
      cyl(g, steel, 2.4, 30, 26, 90, -14);
      cyl(g, steel, 2.4, 22, 26, 118, -3, { rx: Math.PI / 2 });
      // backsplash + shelf
      box(g, counter, 134, 26, 6, 0, 90, -29);
      box(g, wd, 120, 4, 16, 0, 130, -24);
      return g;
    }
  },

  // ---- Potting bench --------------------------------------------------------
  {
    id: 'yard_potting_bench', name: 'Potting Bench', cat: 'outdoor', w: 150, d: 60, h: 200,
    palettes: WOODS, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.7);
      // legs
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, wd, 8, 88, 8, sx * 68, 0, sz * 24);
      // worktop + galvanized tray
      box(g, wd, 150, 8, 60, 0, 88, 0);
      box(g, metal('#a8acb0', 0.35), 90, 8, 42, -24, 96, 0);
      // lower shelf
      box(g, wd, 150, 6, 56, 0, 26, 0);
      // upper hutch frame + shelves + hanging tools
      for (const sx of [-1, 1]) box(g, wd, 8, 108, 8, sx * 68, 96, -24);
      box(g, wd, 150, 6, 26, 0, 200, -24);
      box(g, wd, 150, 6, 20, 0, 160, -22);
      // pots on the shelf
      for (const x of [-50, -30, 40]) {
        cyl(g, solid('#b06a4a', 0.85), 8, 12, x, 166, -22, { rTop: 10 });
        foliage(g, '#4f6f2c', '#8db84e', x, 182, -22, 12, 6, x + 90);
      }
      // hanging trowel + fork
      for (const x of [10, 24]) box(g, metal('#8a8e92', 0.4), 3, 26, 2, x, 178, -19);
      return g;
    }
  },

  // ---- Arbor with bench -----------------------------------------------------
  {
    id: 'struct_arbor_bench', name: 'Arbor Bench', cat: 'outdoor', w: 170, d: 90, h: 230,
    palettes: WOODS, plan: { type: 'pergola' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.6);
      // four posts
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, wd, 9, 220, 9, sx * 78, 0, sz * 38);
      // top slat roof + beams
      for (const sz of [-1, 1]) box(g, wd, 180, 8, 7, 0, 220, sz * 38);
      for (let z = -34; z <= 34; z += 12) box(g, wd, 176, 6, 5, 0, 230, z);
      // lattice side panels
      for (const sx of [-1, 1]) {
        for (let y = 60; y < 210; y += 26) box(g, wd, 5, 4, 70, sx * 78, y, 0);
        for (let z = -30; z <= 30; z += 20) box(g, wd, 5, 150, 4, sx * 78, 55, z);
      }
      // the bench: seat, legs, back slats
      for (const sx of [-1, 1]) box(g, wd, 6, 42, 6, sx * 70, 0, 14);
      box(g, wd, 158, 8, 48, 0, 42, 6);
      for (let y = 54; y < 96; y += 12) box(g, wd, 152, 8, 5, 0, y, -16);
      // climbing roses over the top
      foliage(g, '#3f5f26', '#84a844', 40, 224, 20, 26, 10, 33);
      foliage(g, '#4f6f36', '#9dc25a', -50, 224, -20, 24, 9, 71);
      return g;
    }
  },

  // ---- Modern house-number plinth ------------------------------------------
  {
    id: 'yard_house_number', name: 'House Number Plinth', cat: 'outdoor', w: 60, d: 20, h: 110,
    palettes: [
      { name: 'Concrete', chip: '#b4b0a8' },
      { name: 'Corten', chip: '#8a5236' },
      { name: 'Charcoal', chip: '#34363a' }
    ],
    plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const plinth = solid(p.chip, 0.8);
      // monolith slab
      box(g, plinth, 56, 108, 16, 0, 0, 0, { r: 3 });
      // brushed steel number panel
      box(g, metal('#c6cace', 0.25), 40, 60, 2, 0, 34, 8.5);
      // three raised digit blocks
      for (const [x, y] of [[-11, 46], [1, 60], [12, 40]]) {
        box(g, solid('#1e2024', 0.4), 8, 14, 3, x, y, 10);
      }
      // planted base bed
      box(g, solid('#3a2c1e', 0.98), 60, 8, 20, 0, 0, 0);
      foliage(g, '#5f7f3c', '#9dc25a', 22, 12, 4, 12, 6, 8);
      foliage(g, '#4f6f2c', '#8db84e', -22, 12, -3, 11, 6, 19);
      return g;
    }
  }
];
