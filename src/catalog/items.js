// The furniture & appliance catalog. Every item is a parametric 3D model
// assembled from primitives (no external assets), with architectural 2D plan
// symbols and selectable finish palettes.
import {
  G, box, cyl, sphere, legs4, handleBar, knob, shade, wavyPanel, prism, pyramid,
  solid, wood, tex, metal, chrome, glass, mirror, water, artMaterial, foliage
} from './builders.js';

export const CATEGORIES = [
  { id: 'living', name: 'Living Room' },
  { id: 'bedroom', name: 'Bedroom' },
  { id: 'kitchen', name: 'Kitchen' },
  { id: 'bathroom', name: 'Bathroom' },
  { id: 'dining', name: 'Dining' },
  { id: 'office', name: 'Office' },
  { id: 'decor', name: 'Decor & Lighting' },
  { id: 'structure', name: 'Stairs & Structure' },
  { id: 'outdoor', name: 'Outdoor' }
];

const FABRICS = [
  { name: 'Grey', chip: '#8e8e92', fabric: 'fabric_gray' },
  { name: 'Beige', chip: '#c4b49a', fabric: 'fabric_beige' },
  { name: 'Blue', chip: '#5a6e8c', fabric: 'fabric_blue' },
  { name: 'Green', chip: '#6d7d64', fabric: 'fabric_green' }
];

const WOODS = [
  { name: 'Oak', chip: '#a07a4f', wood: '#a07a4f' },
  { name: 'Walnut', chip: '#5f4632', wood: '#5f4632' },
  { name: 'White', chip: '#e8e4dc', wood: '#e8e4dc' },
  { name: 'Black', chip: '#3a3735', wood: '#3a3735' }
];

const dark = '#33312e';

const ROOFS = [
  { name: 'Charcoal', chip: '#4b4d51', roof: 'shingle_charcoal' },
  { name: 'Timber', chip: '#6a5442', roof: 'shingle_brown' },
  { name: 'Clay', chip: '#8d4a34', roof: 'shingle_red' },
  { name: 'Slate', chip: '#4e5a5e', roof: 'shingle_slate' },
  { name: 'Metal', chip: '#5b6166', roof: 'roof_metal' },
  { name: 'Scale Slate', chip: '#3f4448', roof: 'real_roof_slate' },
  { name: 'Aged Clay', chip: '#9a5a40', roof: 'real_roof_clay' }
];

function sofaBuilder(seats, W, D, H) {
  return (p) => {
    const g = G();
    const fab = tex(p.fabric, 2, 2);
    const armW = 18, seatD = D - 24, baseH = 22;
    const innerW = W - armW * 2;
    // plinth + legs
    legs4(g, solid('#4a4038', 0.6), W - 8, D - 8, 6, 2.2, 5);
    box(g, fab, W, baseH, D, 0, 6, 0, { r: 4 });
    // arms
    box(g, fab, armW, H - 24, D, -(W / 2 - armW / 2), 6, 0, { r: 6 });
    box(g, fab, armW, H - 24, D, W / 2 - armW / 2, 6, 0, { r: 6 });
    // back
    box(g, fab, innerW, H - 6 - baseH, 22, 0, baseH, -(D / 2 - 11), { r: 6 });
    // cushions
    const cw = innerW / seats;
    for (let i = 0; i < seats; i++) {
      const x = -innerW / 2 + cw / 2 + i * cw;
      box(g, fab, cw - 4, 14, seatD - 20, x, baseH + 4, 6, { r: 5 });
      box(g, fab, cw - 6, H - baseH - 26, 14, x, baseH + 16, -(D / 2 - 26), { r: 5, rx: -0.12 });
    }
    return g;
  };
}

export const ITEMS = [
  // ======================= LIVING ROOM =======================
  {
    id: 'sofa3', name: 'Sofa · 3 Seat', cat: 'living', w: 220, d: 95, h: 82,
    palettes: FABRICS, plan: { type: 'sofa', seats: 3 },
    build: sofaBuilder(3, 220, 95, 82)
  },
  {
    id: 'sofa2', name: 'Loveseat', cat: 'living', w: 160, d: 92, h: 82,
    palettes: FABRICS, plan: { type: 'sofa', seats: 2 },
    build: sofaBuilder(2, 160, 92, 82)
  },
  {
    id: 'armchair', name: 'Armchair', cat: 'living', w: 88, d: 88, h: 82,
    palettes: FABRICS, plan: { type: 'sofa', seats: 1 },
    build: sofaBuilder(1, 88, 88, 82)
  },
  {
    id: 'coffee_table', name: 'Coffee Table', cat: 'living', w: 110, d: 60, h: 44,
    palettes: WOODS, plan: { type: 'table' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.5);
      box(g, wd, 110, 4, 60, 0, 40, 0, { r: 1.2 });
      box(g, wd, 100, 3, 50, 0, 14, 0);
      legs4(g, solid(dark, 0.4), 104, 54, 40, 2, 5, true);
      // a book + tray for life
      box(g, solid('#7c4434', 0.8), 20, 2.4, 14, -22, 44, 4);
      box(g, solid('#39506b', 0.8), 17, 2, 12, -20, 46.4, 2, { ry: 0.3 });
      cyl(g, solid('#d9cdb8', 0.7), 9, 2.5, 26, 44, -6);
      return g;
    }
  },
  {
    id: 'side_table', name: 'Side Table', cat: 'living', w: 45, d: 45, h: 55,
    palettes: WOODS, plan: { type: 'tableRound' },
    build: (p) => {
      const g = G();
      cyl(g, wood(p.wood, 0.5), 22.5, 3, 0, 52, 0);
      cyl(g, solid(dark, 0.4), 2, 52, 0, 0, 0);
      cyl(g, solid(dark, 0.4), 14, 2, 0, 0, 0);
      return g;
    }
  },
  {
    id: 'tv_stand', name: 'Media Console', cat: 'living', w: 160, d: 42, h: 52,
    palettes: WOODS, plan: { type: 'storage' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.55);
      box(g, wd, 160, 40, 42, 0, 12, 0, { r: 1.5 });
      legs4(g, solid(dark, 0.4), 150, 36, 12, 1.8, 4, true);
      box(g, solid(dark, 0.5), 77, 34, 1.5, -40, 15, 21);
      box(g, solid(dark, 0.5), 77, 34, 1.5, 40, 15, 21);
      handleBar(g, -6, 32, 22.2, 10);
      handleBar(g, 6, 32, 22.2, 10);
      return g;
    }
  },
  {
    id: 'tv_wall', name: 'Wall TV 55"', cat: 'living', w: 124, d: 8, h: 72,
    elevation: 110, mount: 'wall', palettes: null, plan: { type: 'tv' },
    build: () => {
      const g = G();
      box(g, solid('#1c1d1f', 0.4), 124, 70, 4, 0, 1, -1.5);
      const screen = solid('#0e1620', 0.05);
      screen.emissive?.set?.('#16324a');
      box(g, screen, 116, 63, 1, 0, 4.5, 0.6);
      box(g, metal('#3f4246', 0.4), 20, 30, 3, 0, 20, -3.4);
      return g;
    }
  },
  {
    id: 'bookshelf', name: 'Bookshelf', cat: 'living', w: 90, d: 30, h: 200,
    palettes: WOODS, plan: { type: 'storage' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.6);
      box(g, wd, 90, 200, 30, 0, 0, 0);
      const inner = solid(p.wood === '#e8e4dc' ? '#d8d2c8' : '#2e2b28', 0.7);
      const bookCols = ['#7c4434', '#39506b', '#5d7a6c', '#c2b49a', '#a86450', '#40474f', '#b98a5e', '#6b4a6e'];
      let s = 7;
      const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
      for (let shelf = 0; shelf < 5; shelf++) {
        const y = 12 + shelf * 37;
        box(g, inner, 78, 33, 24, 0, y, 2);
        // rows of books
        let x = -36;
        while (x < 30 && shelf !== 2) {
          const bw = 2.5 + rand() * 3, bh = 20 + rand() * 9;
          box(g, solid(bookCols[Math.floor(rand() * bookCols.length)], 0.85), bw, bh, 16 + rand() * 4, x + bw / 2, y, 3);
          x += bw + 0.6;
          if (rand() < 0.12) x += 8;
        }
        if (shelf === 2) {
          cyl(g, solid('#c9bfa8', 0.7), 6, 14, -20, y, 2);
          foliage(g, '#5d7a4c', '#6f8f5a', -20, y + 20, 2, 9, 6, 5);
          box(g, solid('#3a3735', 0.5), 20, 14, 4, 14, y, 2, { ry: -0.2 });
        }
      }
      return g;
    }
  },
  {
    id: 'rug_rect', name: 'Area Rug', cat: 'living', w: 200, d: 140, h: 1.5, noShadow: true,
    palettes: FABRICS, plan: { type: 'rug' },
    build: (p) => {
      const g = G();
      const m = tex(p.fabric, 3, 2);
      box(g, m, 200, 1.5, 140, 0, 0, 0);
      box(g, tex(p.fabric, 0.4, 0.4), 200, 1.2, 8, 0, 0.2, -66);
      box(g, tex(p.fabric, 0.4, 0.4), 200, 1.2, 8, 0, 0.2, 66);
      return g;
    }
  },
  {
    id: 'rug_round', name: 'Round Rug', cat: 'living', w: 160, d: 160, h: 1.5, noShadow: true,
    palettes: FABRICS, plan: { type: 'rugRound' },
    build: (p) => {
      const g = G();
      cyl(g, tex(p.fabric, 3, 3), 80, 1.5, 0, 0, 0, { seg: 48 });
      return g;
    }
  },
  {
    id: 'floor_lamp', name: 'Floor Lamp', cat: 'living', w: 38, d: 38, h: 158,
    palettes: null, plan: { type: 'lampRound' },
    light: { y: 135, color: '#ffd9a0', intensity: 0.9, distance: 450 },
    build: () => {
      const g = G();
      cyl(g, solid(dark, 0.4), 14, 2.5, 0, 0, 0);
      cyl(g, metal('#6e6a64', 0.4), 1.4, 130, 0, 2, 0);
      shade(g, '#e8dcc4', 19, 15, 28, 0, 128, 0);
      return g;
    }
  },
  {
    id: 'fireplace', name: 'Fireplace', cat: 'living', w: 140, d: 42, h: 112,
    palettes: null, plan: { type: 'fireplace' },
    light: { y: 45, color: '#ff9a40', intensity: 1.1, distance: 350 },
    build: () => {
      const g = G();
      box(g, tex('brick_white', 1.4, 1.1), 140, 104, 40, 0, 0, 0);
      box(g, solid('#e6e0d4', 0.6), 148, 8, 46, 0, 104, 0, { r: 1.5 });
      box(g, solid('#1a1817', 0.9), 76, 60, 6, 0, 14, 17.4);
      box(g, solid('#2a2320', 0.9), 68, 52, 24, 0, 16, 4);
      const fire = solid('#ff8c30', 0.6);
      fire.emissive.set('#ff6a10');
      fire.emissiveIntensity = 1.4;
      cyl(g, solid('#4a3626', 0.95), 4.5, 40, -12, 20, 8, { rz: Math.PI / 2.3 });
      cyl(g, solid('#54402e', 0.95), 4, 40, 8, 20, 6, { rz: Math.PI / 1.8 });
      sphere(g, fire, 9, 0, 30, 6, { sy: 1.6, seg: 10 });
      sphere(g, fire, 6, -12, 27, 8, { sy: 1.5, seg: 10 });
      sphere(g, fire, 6, 11, 26, 7, { sy: 1.4, seg: 10 });
      return g;
    }
  },

  // ======================= BEDROOM =======================
  {
    id: 'bed_double', name: 'Double Bed', cat: 'bedroom', w: 168, d: 212, h: 96,
    palettes: FABRICS, plan: { type: 'bed', pillows: 2 },
    build: (p) => {
      const g = G();
      const frame = wood('#6e5a44', 0.6);
      const blanket = tex(p.fabric, 2.4, 2.4);
      legs4(g, frame, 160, 204, 10, 3, 6, true);
      box(g, frame, 168, 22, 212, 0, 8, 0, { r: 2 });
      box(g, frame, 168, 66, 8, 0, 30, -102, { r: 3 }); // headboard
      box(g, solid('#f0ede6', 0.9), 156, 16, 196, 0, 26, 2, { r: 5 }); // mattress
      box(g, blanket, 160, 12, 140, 0, 34, 32, { r: 4 });   // blanket
      box(g, blanket, 160, 4, 30, 0, 33, -38, { r: 2 });    // folded edge
      box(g, solid('#ffffff', 0.95), 62, 12, 38, -40, 40, -74, { r: 5, ry: 0.06 });
      box(g, solid('#ffffff', 0.95), 62, 12, 38, 40, 40, -74, { r: 5, ry: -0.05 });
      return g;
    }
  },
  {
    id: 'bed_single', name: 'Single Bed', cat: 'bedroom', w: 96, d: 204, h: 90,
    palettes: FABRICS, plan: { type: 'bed', pillows: 1 },
    build: (p) => {
      const g = G();
      const frame = wood('#6e5a44', 0.6);
      legs4(g, frame, 90, 196, 10, 3, 6, true);
      box(g, frame, 96, 20, 204, 0, 8, 0, { r: 2 });
      box(g, frame, 96, 58, 8, 0, 28, -98, { r: 3 });
      box(g, solid('#f0ede6', 0.9), 86, 15, 188, 0, 24, 2, { r: 5 });
      box(g, tex(p.fabric, 2, 2), 90, 11, 132, 0, 31, 30, { r: 4 });
      box(g, solid('#ffffff', 0.95), 58, 11, 36, 0, 36, -70, { r: 5 });
      return g;
    }
  },
  {
    id: 'nightstand', name: 'Nightstand', cat: 'bedroom', w: 46, d: 40, h: 56,
    palettes: WOODS, plan: { type: 'storage' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.55);
      legs4(g, solid(dark, 0.4), 40, 34, 12, 1.6, 3, true);
      box(g, wd, 46, 44, 40, 0, 12, 0, { r: 1.5 });
      box(g, wood(p.wood, 0.45), 40, 16, 1.5, 0, 34, 20.2);
      box(g, wood(p.wood, 0.45), 40, 16, 1.5, 0, 15, 20.2);
      knob(g, 0, 42, 21.5);
      knob(g, 0, 23, 21.5);
      return g;
    }
  },
  {
    id: 'wardrobe', name: 'Wardrobe', cat: 'bedroom', w: 152, d: 62, h: 222,
    palettes: WOODS, plan: { type: 'wardrobe' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.55);
      box(g, wd, 152, 214, 62, 0, 0, 0, { r: 1 });
      box(g, wood(p.wood, 0.42), 72, 204, 2, -38, 4, 30.5);
      box(g, wood(p.wood, 0.42), 72, 204, 2, 38, 4, 30.5);
      box(g, wd, 152, 8, 62, 0, 214, 0);
      handleBar(g, -5, 120, 32, 26, true);
      handleBar(g, 5, 120, 32, 26, true);
      return g;
    }
  },
  {
    id: 'dresser', name: 'Dresser', cat: 'bedroom', w: 122, d: 50, h: 86,
    palettes: WOODS, plan: { type: 'storage' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.55);
      legs4(g, solid(dark, 0.4), 114, 44, 10, 1.8, 3, true);
      box(g, wd, 122, 74, 50, 0, 10, 0, { r: 1.5 });
      for (let r = 0; r < 3; r++) {
        const y = 16 + r * 23;
        box(g, wood(p.wood, 0.42), 112, 19, 1.5, 0, y, 25.2);
        handleBar(g, -24, y + 10, 26.4, 12);
        handleBar(g, 24, y + 10, 26.4, 12);
      }
      return g;
    }
  },

  // ======================= KITCHEN =======================
  {
    id: 'counter', name: 'Base Cabinet', cat: 'kitchen', w: 60, d: 62, h: 91,
    palettes: WOODS, plan: { type: 'counter' },
    build: (p) => {
      const g = G();
      box(g, solid('#3a3835', 0.8), 56, 10, 54, 0, 0, -2);
      box(g, wood(p.wood, 0.5), 60, 76, 58, 0, 10, -2, { r: 0.8 });
      box(g, wood(p.wood, 0.42), 54, 70, 1.6, 0, 12, 27.5);
      handleBar(g, 20, 76, 28.6, 14, true);
      box(g, tex('countertop', 0.5, 0.5), 62, 4, 62, 0, 87, 0, { r: 0.8 });
      return g;
    }
  },
  {
    id: 'counter_sink', name: 'Sink Cabinet', cat: 'kitchen', w: 80, d: 62, h: 91,
    palettes: WOODS, plan: { type: 'sink' },
    build: (p) => {
      const g = G();
      box(g, solid('#3a3835', 0.8), 76, 10, 54, 0, 0, -2);
      box(g, wood(p.wood, 0.5), 80, 76, 58, 0, 10, -2, { r: 0.8 });
      box(g, wood(p.wood, 0.42), 36, 70, 1.6, -20, 12, 27.5);
      box(g, wood(p.wood, 0.42), 36, 70, 1.6, 20, 12, 27.5);
      handleBar(g, -6, 76, 28.6, 12, true);
      handleBar(g, 6, 76, 28.6, 12, true);
      box(g, tex('countertop', 0.6, 0.5), 82, 4, 62, 0, 87, 0, { r: 0.8 });
      // basin
      box(g, metal('#c4c8cc', 0.25), 50, 3, 40, 0, 90.4, 0);
      box(g, metal('#9aa0a6', 0.3), 44, 14, 34, 0, 78, 0);
      // faucet
      cyl(g, chrome(), 1.6, 24, 0, 91, -16);
      cyl(g, chrome(), 1.4, 16, 0, 113, -8.5, { rx: Math.PI / 2 });
      return g;
    }
  },
  {
    id: 'wall_cabinet', name: 'Wall Cabinet', cat: 'kitchen', w: 80, d: 36, h: 72,
    elevation: 145, mount: 'wall', palettes: WOODS, plan: { type: 'wallCabinet' },
    build: (p) => {
      const g = G();
      box(g, wood(p.wood, 0.5), 80, 72, 36, 0, 0, 0, { r: 0.8 });
      box(g, wood(p.wood, 0.42), 37, 66, 1.6, -19.5, 3, 18.5);
      box(g, wood(p.wood, 0.42), 37, 66, 1.6, 19.5, 3, 18.5);
      handleBar(g, -5, 14, 19.6, 12, true);
      handleBar(g, 5, 14, 19.6, 12, true);
      return g;
    }
  },
  {
    id: 'island', name: 'Kitchen Island', cat: 'kitchen', w: 182, d: 92, h: 92,
    palettes: WOODS, plan: { type: 'counter' },
    build: (p) => {
      const g = G();
      box(g, wood(p.wood, 0.5), 176, 84, 84, 0, 2, 0, { r: 1 });
      for (let i = -1; i <= 1; i++) {
        box(g, wood(p.wood, 0.42), 52, 78, 1.6, i * 57, 5, 42.8);
        handleBar(g, i * 57, 74, 43.8, 20);
      }
      box(g, tex('countertop', 1.2, 0.7), 182, 5, 92, 0, 87, 0, { r: 1 });
      return g;
    }
  },
  {
    id: 'fridge', name: 'Refrigerator', cat: 'kitchen', w: 76, d: 72, h: 182,
    palettes: null, plan: { type: 'appliance', label: 'RF' },
    build: () => {
      const g = G();
      const body = metal('#c9cdd1', 0.35);
      box(g, body, 76, 178, 68, 0, 2, -1, { r: 2.5 });
      box(g, metal('#b8bcc0', 0.3), 76, 62, 2, 0, 4, 33.6, { r: 1 });
      box(g, metal('#b8bcc0', 0.3), 76, 110, 2, 0, 70, 33.6, { r: 1 });
      handleBar(g, -28, 120, 36.4, 42, true);
      handleBar(g, -28, 58, 36.4, 26, true);
      // water dispenser
      box(g, solid('#2e3134', 0.5), 22, 30, 1.5, 8, 120, 34.4);
      return g;
    }
  },
  {
    id: 'stove', name: 'Range Cooker', cat: 'kitchen', w: 62, d: 62, h: 91,
    palettes: null, plan: { type: 'stove' },
    build: () => {
      const g = G();
      const body = metal('#c4c8cc', 0.4);
      box(g, body, 62, 84, 58, 0, 2, -1, { r: 1 });
      // oven door
      box(g, solid('#22262a', 0.3), 52, 42, 2, 0, 14, 28.5, { r: 1 });
      box(g, metal('#dde0e3', 0.3), 52, 3, 4, 0, 60, 29.5);
      // control panel + knobs
      box(g, body, 62, 10, 4, 0, 66, 28);
      for (let i = 0; i < 4; i++) cyl(g, solid('#2e3134', 0.4), 2.2, 2.5, -21 + i * 14, 69.5, 30.4, { rx: Math.PI / 2 });
      // cooktop
      box(g, solid('#17191c', 0.15), 60, 2.5, 56, 0, 86, -1, { r: 0.8 });
      for (const [bx, bz, br] of [[-15, -15, 8], [15, -15, 6.5], [-15, 13, 6.5], [15, 13, 8]]) {
        cyl(g, solid('#000000', 0.3), br, 0.5, bx, 88.5, bz, { seg: 28 });
        cyl(g, solid('#3a3d40', 0.5), br - 2, 0.4, bx, 89, bz, { seg: 28 });
      }
      return g;
    }
  },
  {
    id: 'hood', name: 'Range Hood', cat: 'kitchen', w: 80, d: 52, h: 62,
    elevation: 150, mount: 'wall', palettes: null, plan: { type: 'wallCabinet' },
    build: () => {
      const g = G();
      box(g, metal('#c4c8cc', 0.3), 80, 8, 52, 0, 0, 0, { r: 1 });
      // pyramid canopy: 4-segment cylinder rotated 45°
      cyl(g, metal('#c4c8cc', 0.3), 40, 26, 0, 6, -2, { rTop: 15, seg: 4 }).rotation.y = Math.PI / 4;
      box(g, metal('#babec2', 0.35), 22, 34, 22, 0, 28, -2);
      return g;
    }
  },
  {
    id: 'dishwasher', name: 'Dishwasher', cat: 'kitchen', w: 60, d: 62, h: 86,
    palettes: null, plan: { type: 'appliance', label: 'DW' },
    build: () => {
      const g = G();
      box(g, metal('#c9cdd1', 0.35), 60, 80, 58, 0, 2, -1, { r: 1 });
      box(g, metal('#b4b8bc', 0.3), 56, 66, 2, 0, 6, 28.5, { r: 1 });
      box(g, metal('#dde0e3', 0.3), 56, 3.5, 4, 0, 74, 29.5);
      box(g, solid('#2e3134', 0.4), 40, 4, 1.5, 0, 77, 28.8);
      return g;
    }
  },
  {
    id: 'washer', name: 'Washing Machine', cat: 'kitchen', w: 60, d: 62, h: 85,
    palettes: null, plan: { type: 'washer' },
    build: () => {
      const g = G();
      box(g, solid('#e6e8ea', 0.5), 60, 82, 58, 0, 0, -1, { r: 1.5 });
      cyl(g, metal('#a8acb0', 0.3), 20, 3, 0, 36, 28.2, { rx: Math.PI / 2, seg: 32 });
      cyl(g, solid('#20262e', 0.1), 16, 3.4, 0, 36, 28.4, { rx: Math.PI / 2, seg: 32 });
      box(g, solid('#c8ccd0', 0.4), 52, 9, 1.5, 0, 68, 28.3);
      cyl(g, solid('#4a4e52', 0.4), 3, 2, 20, 72.5, 29, { rx: Math.PI / 2 });
      return g;
    }
  },
  {
    id: 'bar_stool', name: 'Bar Stool', cat: 'kitchen', w: 40, d: 40, h: 76,
    palettes: WOODS, plan: { type: 'stool' },
    build: (p) => {
      const g = G();
      cyl(g, wood(p.wood, 0.5), 17, 5, 0, 71, 0, { seg: 28 });
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const leg = cyl(g, solid(dark, 0.4), 1.6, 74, Math.cos(a) * 13, 0, Math.sin(a) * 13);
        leg.rotation.z = Math.cos(a) * 0.1;
        leg.rotation.x = -Math.sin(a) * 0.1;
      }
      cyl(g, metal('#8e9296', 0.4), 11, 1.2, 0, 24, 0, { seg: 24 });
      return g;
    }
  },

  // ======================= BATHROOM =======================
  {
    id: 'toilet', name: 'Toilet', cat: 'bathroom', w: 40, d: 70, h: 78,
    palettes: null, plan: { type: 'toilet' },
    build: () => {
      const g = G();
      const white = solid('#f2f1ee', 0.25);
      box(g, white, 38, 36, 18, 0, 40, -24, { r: 3 });   // tank
      box(g, white, 30, 4, 12, 0, 77, -24, { r: 1.5 });  // lid button area
      cyl(g, metal('#c4c8cc', 0.3), 2.2, 1.5, 0, 78.5, -24);
      box(g, white, 24, 36, 24, 0, 2, -12, { r: 4 });    // pedestal
      const bowl = sphere(g, white, 19, 0, 40, 6, { sy: 0.42, sx: 0.92 });
      bowl.scale.z = 1.25;
      sphere(g, solid('#e2e1de', 0.3), 16, 0, 44.5, 6, { sy: 0.14, sx: 0.85, sz: 1.15 });
      return g;
    }
  },
  {
    id: 'bathtub', name: 'Bathtub', cat: 'bathroom', w: 172, d: 78, h: 58,
    palettes: null, plan: { type: 'bathtub' },
    build: () => {
      const g = G();
      const white = solid('#f2f1ee', 0.2);
      box(g, white, 172, 56, 78, 0, 0, 0, { r: 8 });
      box(g, solid('#e4e3e0', 0.25), 148, 30, 56, 0, 28, 0, { r: 10 });
      box(g, white, 148, 6, 56, 0, 22, 0, { r: 6 });
      cyl(g, chrome(), 1.8, 18, -70, 56, -22);
      cyl(g, chrome(), 1.5, 14, -70, 72, -15.5, { rx: Math.PI / 2 });
      cyl(g, chrome(), 2.4, 3, -60, 55, -30, { rx: 0 });
      cyl(g, chrome(), 2.4, 3, -52, 55, -30);
      return g;
    }
  },
  {
    id: 'shower', name: 'Shower', cat: 'bathroom', w: 92, d: 92, h: 212,
    palettes: null, plan: { type: 'shower' },
    build: () => {
      const g = G();
      box(g, solid('#e8e7e4', 0.3), 92, 6, 92, 0, 0, 0, { r: 2 });
      box(g, glass(), 2, 198, 88, -45, 6, 0);
      box(g, glass(), 88, 198, 2, 0, 6, 45);
      box(g, metal('#b0b4b8', 0.3), 3, 200, 3, -45, 5, 45);
      box(g, metal('#b0b4b8', 0.3), 3, 200, 3, -45, 5, -44);
      box(g, metal('#b0b4b8', 0.3), 3, 200, 3, 44, 5, 45);
      cyl(g, chrome(), 1.6, 60, 30, 130, -42);
      cyl(g, chrome(), 9, 1.5, 30, 190, -34, { seg: 24 });
      cyl(g, chrome(), 2.5, 8, 30, 100, -43.5, { rx: Math.PI / 2 });
      return g;
    }
  },
  {
    id: 'vanity', name: 'Vanity Unit', cat: 'bathroom', w: 82, d: 50, h: 86,
    palettes: WOODS, plan: { type: 'sink' },
    build: (p) => {
      const g = G();
      legs4(g, metal('#7c8084', 0.4), 74, 42, 12, 1.6, 3, true);
      box(g, wood(p.wood, 0.5), 82, 62, 48, 0, 12, 0, { r: 1 });
      box(g, wood(p.wood, 0.42), 76, 27, 1.5, 0, 16, 24.2);
      box(g, wood(p.wood, 0.42), 76, 27, 1.5, 0, 45, 24.2);
      handleBar(g, 0, 32, 25.2, 16);
      handleBar(g, 0, 61, 25.2, 16);
      box(g, tex('countertop', 0.5, 0.4), 84, 3, 50, 0, 74, 0, { r: 0.8 });
      const basin = sphere(g, solid('#f4f3f0', 0.2), 16, 0, 80, 2, { sy: 0.45 });
      basin.scale.x = 1.25;
      cyl(g, chrome(), 1.4, 18, 0, 76, -17);
      cyl(g, chrome(), 1.2, 12, 0, 93, -11.5, { rx: Math.PI / 2 });
      return g;
    }
  },
  {
    id: 'mirror_wall', name: 'Wall Mirror', cat: 'bathroom', w: 64, d: 5, h: 92,
    elevation: 100, mount: 'wall', palettes: null, plan: { type: 'wallDecor' },
    build: () => {
      const g = G();
      box(g, solid('#3a3735', 0.5), 64, 92, 3, 0, 0, -1);
      box(g, mirror(), 58, 86, 1.5, 0, 3, 0.6);
      return g;
    }
  },

  // ======================= DINING =======================
  {
    id: 'dining_table', name: 'Dining Table', cat: 'dining', w: 182, d: 92, h: 76,
    palettes: WOODS, plan: { type: 'table' },
    build: (p) => {
      const g = G();
      box(g, wood(p.wood, 0.45), 182, 5, 92, 0, 71, 0, { r: 1.2 });
      legs4(g, wood(p.wood, 0.5), 168, 80, 71, 3.2, 8, true);
      return g;
    }
  },
  {
    id: 'dining_table_round', name: 'Round Table', cat: 'dining', w: 124, d: 124, h: 76,
    palettes: WOODS, plan: { type: 'tableRound' },
    build: (p) => {
      const g = G();
      cyl(g, wood(p.wood, 0.45), 62, 5, 0, 71, 0, { seg: 40 });
      cyl(g, wood(p.wood, 0.5), 5, 66, 0, 4, 0);
      cyl(g, wood(p.wood, 0.5), 24, 4, 0, 0, 0, { seg: 32 });
      return g;
    }
  },
  {
    id: 'chair', name: 'Dining Chair', cat: 'dining', w: 46, d: 52, h: 88,
    palettes: WOODS, plan: { type: 'chair' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.55);
      box(g, wd, 44, 4, 44, 0, 44, 2, { r: 1.5 });
      box(g, solid('#c8bca4', 0.9), 40, 4, 40, 0, 48, 2, { r: 2 });
      legs4(g, wd, 40, 42, 44, 1.8, 3);
      const back = box(g, wd, 42, 46, 3, 0, 46, -20);
      back.rotation.x = 0.08;
      return g;
    }
  },

  // ======================= OFFICE =======================
  {
    id: 'desk', name: 'Desk', cat: 'office', w: 142, d: 70, h: 75,
    palettes: WOODS, plan: { type: 'table' },
    build: (p) => {
      const g = G();
      box(g, wood(p.wood, 0.5), 142, 4, 70, 0, 71, 0, { r: 1 });
      box(g, solid(dark, 0.45), 4, 68, 62, -66, 2, 0);
      box(g, solid(dark, 0.45), 4, 68, 62, 66, 2, 0);
      // drawer unit
      box(g, wood(p.wood, 0.5), 38, 52, 58, 46, 18, 0, { r: 1 });
      for (let r = 0; r < 3; r++) {
        box(g, wood(p.wood, 0.42), 34, 14, 1.5, 46, 21 + r * 16, 29.5);
        handleBar(g, 46, 28 + r * 16, 30.5, 12);
      }
      // laptop
      box(g, metal('#9ca0a4', 0.4), 32, 1.5, 22, -22, 75, 2);
      const lid = box(g, metal('#9ca0a4', 0.4), 32, 22, 1.2, -22, 75.6, -9);
      lid.rotation.x = -0.35;
      lid.position.y = 76 + 10;
      lid.position.z = -13;
      return g;
    }
  },
  {
    id: 'office_chair', name: 'Office Chair', cat: 'office', w: 62, d: 62, h: 104,
    palettes: null, plan: { type: 'officeChair' },
    build: () => {
      const g = G();
      const black = solid('#2c2c2e', 0.7);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const arm = box(g, black, 26, 3, 5, Math.cos(a) * 13, 3, Math.sin(a) * 13, { ry: -a });
        arm.castShadow = true;
        sphere(g, solid('#1a1a1c', 0.5), 3.4, Math.cos(a) * 26, 3.4, Math.sin(a) * 26);
      }
      cyl(g, metal('#7e8286', 0.35), 2.4, 30, 0, 5, 0);
      box(g, black, 48, 8, 46, 0, 44, 2, { r: 3.5 });
      const back = box(g, black, 46, 54, 7, 0, 52, -22, { r: 3.5 });
      back.rotation.x = 0.1;
      box(g, black, 8, 3, 26, -25, 62, 0, { r: 1.5 });
      box(g, black, 8, 3, 26, 25, 62, 0, { r: 1.5 });
      box(g, black, 3, 16, 3, -25, 46, 0);
      box(g, black, 3, 16, 3, 25, 46, 0);
      return g;
    }
  },

  // ======================= DECOR & LIGHTING =======================
  {
    id: 'plant_large', name: 'Fiddle Leaf Plant', cat: 'decor', w: 55, d: 55, h: 150,
    palettes: null, plan: { type: 'plant' },
    build: () => {
      const g = G();
      cyl(g, solid('#b8977c', 0.75), 16, 30, 0, 0, 0, { rTop: 19 });
      cyl(g, solid('#4a3a2c', 0.95), 14, 3, 0, 30, 0);
      cyl(g, solid('#5c4632', 0.9), 2.2, 60, 0, 32, 0);
      foliage(g, '#4a6e3a', '#5d8348', 0, 108, 0, 30, 12, 11);
      return g;
    }
  },
  {
    id: 'plant_small', name: 'Potted Plant', cat: 'decor', w: 26, d: 26, h: 48,
    palettes: null, plan: { type: 'plant' },
    build: () => {
      const g = G();
      cyl(g, solid('#c9c0ae', 0.7), 8.5, 14, 0, 0, 0, { rTop: 10.5 });
      cyl(g, solid('#4a3a2c', 0.95), 7.5, 2, 0, 14, 0);
      foliage(g, '#55763f', '#68894e', 0, 30, 0, 13, 8, 23);
      return g;
    }
  },
  {
    id: 'ceiling_light', name: 'Ceiling Light', cat: 'decor', w: 42, d: 42, h: 18,
    mount: 'ceiling', palettes: null, plan: { type: 'lampRound' },
    light: { y: -8, color: '#fff2dc', intensity: 1.3, distance: 650 },
    build: () => {
      const g = G();
      // built hanging from y=0 downward; viewer positions at ceiling
      cyl(g, metal('#b8bcc0', 0.4), 6, 2, 0, -2, 0);
      const globeMat = solid('#f4ead6', 0.6);
      globeMat.emissive?.set?.('#f4e2bc');
      if (globeMat.emissiveIntensity !== undefined) globeMat.emissiveIntensity = 0.75;
      sphere(g, globeMat, 15, 0, -10, 0, { sy: 0.62 });
      return g;
    }
  },
  {
    id: 'pendant_light', name: 'Pendant Lamp', cat: 'decor', w: 36, d: 36, h: 92,
    mount: 'ceiling', palettes: null, plan: { type: 'lampRound' },
    light: { y: -80, color: '#ffe0b0', intensity: 1.1, distance: 520 },
    build: () => {
      const g = G();
      cyl(g, metal('#4a4c50', 0.4), 5, 2, 0, -2, 0);
      cyl(g, solid('#2c2c2e', 0.5), 0.4, 62, 0, -64, 0);
      shade(g, '#3f4246', 15, 6, 22, 0, -86, 0);
      const bulb = solid('#ffe8c0', 0.4);
      bulb.emissive?.set?.('#ffd9a0');
      if (bulb.emissiveIntensity !== undefined) bulb.emissiveIntensity = 1.2;
      sphere(g, bulb, 4.5, 0, -82, 0);
      return g;
    }
  },
  {
    id: 'wall_art_a', name: 'Canvas Art I', cat: 'decor', w: 82, d: 5, h: 62,
    elevation: 140, mount: 'wall', palettes: null, plan: { type: 'wallDecor' },
    build: () => {
      const g = G();
      box(g, solid('#2e2b28', 0.6), 82, 62, 3, 0, 0, -1);
      box(g, artMaterial(2), 76, 56, 1.5, 0, 3, 0.6);
      return g;
    }
  },
  {
    id: 'wall_art_b', name: 'Canvas Art II', cat: 'decor', w: 62, d: 5, h: 82,
    elevation: 130, mount: 'wall', palettes: null, plan: { type: 'wallDecor' },
    build: () => {
      const g = G();
      box(g, solid('#8a7a5e', 0.6), 62, 82, 3, 0, 0, -1);
      box(g, artMaterial(7), 56, 76, 1.5, 0, 3, 0.6);
      return g;
    }
  },
  {
    id: 'curtains', name: 'Curtains', cat: 'decor', w: 160, d: 14, h: 244,
    palettes: FABRICS, plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      cyl(g, metal('#8a8478', 0.4), 1.6, 164, 0, 240, 0, { rz: Math.PI / 2 });
      sphere(g, metal('#8a8478', 0.4), 3, -82, 240, 0);
      sphere(g, metal('#8a8478', 0.4), 3, 82, 240, 0);
      const fab = tex(p.fabric, 2, 3);
      const left = wavyPanel(g, fab, 62, 236, 5, 10);
      left.position.set(-46, 0, 0);
      const right = wavyPanel(g, fab, 62, 236, 5, 10);
      right.position.set(46, 0, 0);
      return g;
    }
  },
  {
    id: 'shelf_wall', name: 'Wall Shelf', cat: 'decor', w: 92, d: 24, h: 6,
    elevation: 150, mount: 'wall', palettes: WOODS, plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      box(g, wood(p.wood, 0.5), 92, 4, 24, 0, 0, 0, { r: 0.8 });
      box(g, solid('#5d4a36', 0.8), 12, 10, 2, -30, 4, 4, { ry: 0.15 });
      box(g, solid('#39506b', 0.8), 10, 12, 2, -16, 4, 4);
      cyl(g, solid('#c9bfa8', 0.7), 5, 9, 24, 4, 0);
      foliage(g, '#5d7a4c', '#6f8f5a', 24, 16, 0, 7, 5, 31);
      return g;
    }
  },

  // ======================= OUTDOOR =======================
  {
    id: 'tree_oak', name: 'Shade Tree', cat: 'outdoor', w: 260, d: 260, h: 420,
    palettes: null, plan: { type: 'plant' },
    build: () => {
      const g = G();
      cyl(g, solid('#5a4632', 0.95), 14, 170, 0, 0, 0, { rTop: 9 });
      cyl(g, solid('#5a4632', 0.95), 6, 90, 0, 120, 0, { rz: 0.5 });
      cyl(g, solid('#5a4632', 0.95), 5, 80, 0, 130, 0, { rz: -0.55 });
      foliage(g, '#3f6b2e', '#548a3c', 0, 300, 0, 105, 14, 17);
      return g;
    }
  },
  {
    id: 'tree_pine', name: 'Pine Tree', cat: 'outdoor', w: 180, d: 180, h: 460,
    palettes: null, plan: { type: 'plant' },
    build: () => {
      const g = G();
      cyl(g, solid('#63503a', 0.95), 12, 120, 0, 0, 0, { rTop: 8 });
      const green = solid('#2f5b30', 0.95);
      const green2 = solid('#3a6b38', 0.95);
      cyl(g, green, 88, 130, 0, 90, 0, { rTop: 0.5, seg: 12 });
      cyl(g, green2, 68, 120, 0, 190, 0, { rTop: 0.5, seg: 12 });
      cyl(g, green, 46, 110, 0, 285, 0, { rTop: 0.5, seg: 12 });
      cyl(g, green2, 26, 85, 0, 375, 0, { rTop: 0.5, seg: 12 });
      return g;
    }
  },
  {
    id: 'hedge', name: 'Hedge', cat: 'outdoor', w: 200, d: 55, h: 95,
    palettes: null, plan: { type: 'hedge' },
    build: () => {
      const g = G();
      box(g, solid('#3d5c2e', 0.95), 200, 90, 55, 0, 0, 0, { r: 14, seg: 4 });
      box(g, solid('#4a7038', 0.95), 194, 12, 49, 0, 84, 0, { r: 6 });
      return g;
    }
  },
  {
    id: 'sidewalk', name: 'Sidewalk', cat: 'outdoor', w: 300, d: 120, h: 5, noShadow: true,
    hidden: true, // superseded by the drawable path_sidewalk (kept for old saves)
    palettes: null, plan: { type: 'slab' },
    build: () => {
      const g = G();
      box(g, tex('pavement', 1.5, 0.6), 300, 5, 120, 0, 0, 0);
      return g;
    }
  },
  {
    id: 'driveway', name: 'Driveway', cat: 'outdoor', w: 550, d: 300, h: 4, noShadow: true,
    hidden: true, // superseded by the drawable path_driveway (kept for old saves)
    palettes: null, plan: { type: 'slab' },
    build: () => {
      const g = G();
      box(g, tex('counter_dark', 2.5, 1.4), 550, 4, 300, 0, 0, 0);
      box(g, tex('pavement', 0.3, 1.4), 12, 4.5, 300, -269, 0, 0);
      box(g, tex('pavement', 0.3, 1.4), 12, 4.5, 300, 269, 0, 0);
      return g;
    }
  },
  {
    id: 'patio', name: 'Patio Deck', cat: 'outdoor', w: 360, d: 240, h: 12, noShadow: true,
    areaDraw: true, palettes: null, plan: { type: 'slab' },
    build: () => {
      const g = G();
      box(g, tex('deck_wood', 1.5, 1), 360, 12, 240, 0, 0, 0, { r: 1 });
      return g;
    }
  },
  {
    id: 'mailbox', name: 'Mailbox', cat: 'outdoor', w: 30, d: 55, h: 115,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      box(g, solid('#4a3c2c', 0.85), 9, 100, 9, 0, 0, 0);
      const bodyMat = solid('#2e3440', 0.5);
      box(g, bodyMat, 26, 20, 46, 0, 100, 0, { r: 6 });
      box(g, bodyMat, 26, 4, 46, 0, 98, 0 );
      box(g, solid('#c74a3a', 0.5), 2.5, 16, 3, 15, 108, -12);
      knob(g, 0, 108, 24, 1.8);
      return g;
    }
  },
  {
    id: 'car', name: 'Car', cat: 'outdoor', w: 185, d: 465, h: 145,
    palettes: [
      { name: 'White', chip: '#e8e8ea', body: '#e8e8ea' },
      { name: 'Black', chip: '#26282c', body: '#26282c' },
      { name: 'Red', chip: '#a83226', body: '#a83226' },
      { name: 'Blue', chip: '#2f4a78', body: '#2f4a78' },
      { name: 'Silver', chip: '#b8bcc2', body: '#b8bcc2' }
    ],
    plan: { type: 'car' },
    build: (p) => {
      const g = G();
      const paint = solid(p.body, 0.32);
      const darkGlass = solid('#1d2733', 0.12);
      const tire = solid('#1c1c1e', 0.9);
      const rim = metal('#c2c6cc', 0.3);
      // wheels (axles run along item width/x)
      for (const [wz, wx] of [[-150, -78], [-150, 78], [150, -78], [150, 78]]) {
        cyl(g, tire, 33, 22, wx, 33, wz, { rz: Math.PI / 2 });
        cyl(g, rim, 18, 23.5, wx, 33, wz, { rz: Math.PI / 2 });
      }
      box(g, paint, 172, 62, 440, 0, 32, 0, { r: 16, seg: 4 });     // body
      box(g, paint, 160, 52, 230, 0, 82, 18, { r: 18, seg: 4 });    // cabin
      box(g, darkGlass, 152, 40, 218, 0, 88, 18, { r: 14, seg: 4 }); // glass band
      box(g, solid('#f4f0d8', 0.3), 24, 12, 6, -62, 62, -218);      // headlights
      box(g, solid('#f4f0d8', 0.3), 24, 12, 6, 62, 62, -218);
      box(g, solid('#7a2018', 0.4), 24, 10, 6, -62, 64, 218);       // taillights
      box(g, solid('#7a2018', 0.4), 24, 10, 6, 62, 64, 218);
      box(g, metal('#9aa0a6', 0.4), 150, 8, 10, 0, 30, -222);       // bumpers
      box(g, metal('#9aa0a6', 0.4), 150, 8, 10, 0, 30, 222);
      return g;
    }
  },
  {
    id: 'lamp_post', name: 'Lamp Post', cat: 'outdoor', w: 45, d: 45, h: 300,
    palettes: null, plan: { type: 'lampRound' },
    light: { y: 275, color: '#ffe2b0', intensity: 1.6, distance: 900 },
    build: () => {
      const g = G();
      const iron = solid('#2c2e32', 0.55);
      cyl(g, iron, 14, 6, 0, 0, 0);
      cyl(g, iron, 4.5, 265, 0, 4, 0, { rTop: 3 });
      cyl(g, iron, 7, 4, 0, 268, 0);
      const glassMat = solid('#ffe9c4', 0.4);
      glassMat.emissive.set('#ffd9a0');
      glassMat.emissiveIntensity = 0.9;
      cyl(g, glassMat, 9, 18, 0, 272, 0, { rTop: 6, seg: 6 });
      cyl(g, iron, 11, 4, 0, 290, 0, { rTop: 2, seg: 6 });
      return g;
    }
  },
  {
    id: 'fence', name: 'Fence Section', cat: 'outdoor', w: 240, d: 8, h: 110,
    palettes: [
      { name: 'White', chip: '#e6e2d8', wood: '#e6e2d8' },
      { name: 'Cedar', chip: '#8a6a4a', wood: '#8a6a4a' }
    ],
    plan: { type: 'fence' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.8);
      box(g, wd, 7, 108, 7, -118, 0, 0);
      box(g, wd, 7, 108, 7, 118, 0, 0);
      box(g, wd, 236, 7, 4, 0, 88, 0);
      box(g, wd, 236, 7, 4, 0, 28, 0);
      for (let x = -108; x <= 108; x += 18) {
        box(g, wd, 9, 100, 2.5, x, 4, 3);
      }
      return g;
    }
  },
  {
    id: 'pond', name: 'Garden Pond', cat: 'outdoor', w: 280, d: 200, h: 18, noShadow: true,
    palettes: null, plan: { type: 'pond' },
    build: () => {
      const g = G();
      // water surface (irregular oval)
      const w = cyl(g, water(), 128, 3, 0, 6, 0, { seg: 28 });
      w.scale.z = 0.72;
      w.scale.x = 1.04;
      // stone rim
      let s = 55;
      const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2;
        const rx = Math.cos(a) * 134 * 1.02, rz = Math.sin(a) * 134 * 0.74;
        const rockMat = solid(rand() < 0.5 ? '#8a8478' : '#75705f', 0.9);
        sphere(g, rockMat, 9 + rand() * 7, rx, 6, rz, { sy: 0.6, seg: 8 });
      }
      // lily pads
      for (let i = 0; i < 4; i++) {
        const a = rand() * Math.PI * 2, d = rand() * 80;
        cyl(g, solid('#3f7038', 0.8), 8 + rand() * 5, 0.8, Math.cos(a) * d, 9, Math.sin(a) * d * 0.7, { seg: 12 });
      }
      return g;
    }
  },
  {
    id: 'pool', name: 'Swimming Pool', cat: 'outdoor', w: 500, d: 300, h: 24, noShadow: true,
    areaDraw: true, palettes: null, plan: { type: 'pool' },
    build: () => {
      const g = G();
      box(g, tex('tile_white', 2.4, 1.5), 500, 12, 300, 0, 0, 0, { r: 3 });   // deck rim
      box(g, solid('#3a7d9c', 0.3), 440, 10, 240, 0, 4, 0);                    // basin
      const w = box(g, water(), 432, 6, 232, 0, 10, 0);
      w.receiveShadow = true;
      // chrome ladder
      cyl(g, chrome(), 2, 26, 190, 12, -60);
      cyl(g, chrome(), 2, 26, 190, 12, -90);
      cyl(g, chrome(), 2, 30, 190, 30, -75, { rx: Math.PI / 2 });
      return g;
    }
  },
  {
    id: 'bench_outdoor', name: 'Garden Bench', cat: 'outdoor', w: 150, d: 62, h: 88,
    palettes: WOODS, plan: { type: 'sofa', seats: 2 },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.75);
      const iron = solid('#33342f', 0.6);
      for (const sx of [-1, 1]) {
        box(g, iron, 6, 44, 54, sx * 66, 0, 0, { r: 2 });
        box(g, iron, 6, 42, 8, sx * 66, 44, -24, { r: 2, rx: -0.15 });
      }
      for (let i = 0; i < 5; i++) {
        box(g, wd, 138, 3.5, 8.5, 0, 44, -22 + i * 11, { r: 1 });
      }
      for (let i = 0; i < 3; i++) {
        box(g, wd, 138, 8.5, 3.5, 0, 52 + i * 12, -27, { r: 1, rx: -0.15 });
      }
      return g;
    }
  },

  // ======================= STAIRS & STRUCTURE =======================
  {
    id: 'stairs', name: 'Staircase', cat: 'structure', w: 110, d: 300, h: 290,
    palettes: WOODS, plan: { type: 'stairs' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.6);
      const riser = solid('#ece8e0', 0.75);
      const steps = 15, W = 104, H = 290, D = 300;
      const rise = H / steps, run = D / steps;
      for (let i = 0; i < steps; i++) {
        const z = D / 2 - run * (i + 0.5);
        box(g, riser, W - 6, rise - 3.5, 3, 0, rise * i, z + run / 2 - 1.6);
        box(g, wd, W, 3.5, run + 4, 0, rise * (i + 1) - 3.5, z, { r: 0.8 });
      }
      // stringers hug the treads on both sides
      const ang = Math.atan2(H, D);
      const len = Math.hypot(H, D);
      for (const sx of [-1, 1]) {
        box(g, wd, 5, 26, len, sx * (W / 2 + 0.5), H / 2 - 24, 0, { rx: ang });
      }
      // handrail: posts follow the slope, rail on top
      const iron = metal('#2e3033', 0.45);
      for (let i = 1; i < steps; i += 3) {
        const z = D / 2 - run * (i + 0.5);
        cyl(g, iron, 1.6, 64, W / 2 + 3, rise * (i + 1), z);
      }
      box(g, wood(p.wood, 0.4), 7, 5, len + 10, W / 2 + 3, H / 2 + 66, 0, { rx: ang, r: 2 });
      return g;
    }
  },
  {
    id: 'stairs_l', name: 'L-Shaped Stairs', cat: 'structure', w: 210, d: 210, h: 290,
    palettes: WOODS, plan: { type: 'stairs' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.6);
      const riser = solid('#ece8e0', 0.75);
      const H = 290, rise = H / 16, W = 100;
      // lower flight climbs along +z half, on the left side
      const run1 = 110 / 7;
      for (let i = 0; i < 7; i++) {
        const z = 105 - run1 * (i + 0.5);
        box(g, riser, W - 6, rise - 3.5, 3, -55, rise * i, z + run1 / 2 - 1.6);
        box(g, wd, W, 3.5, run1 + 3, -55, rise * (i + 1) - 3.5, z);
      }
      // stringers under the lower flight
      const a1 = Math.atan2(rise * 7, 110), l1 = Math.hypot(rise * 7, 110);
      for (const sx of [-1, 1]) {
        box(g, wd, 5, 24, l1, -55 + sx * (W / 2 + 0.5), rise * 3.5 - 22, 50, { rx: a1 });
      }
      // landing platform in the corner
      box(g, wd, W + 5, 6, W + 5, -55, rise * 7, -55, { r: 1 });
      box(g, solid('#d9d4ca', 0.8), W, rise * 7, W, -55, 0, -55);
      // upper flight turns 90° and climbs along +x
      const run2 = 155 / 8;
      for (let i = 0; i < 8; i++) {
        const x = -5 + run2 * (i + 0.5);
        box(g, riser, 3, rise - 3.5, W - 6, x - run2 / 2 + 1.6, rise * (7 + i), -55);
        box(g, wd, run2 + 3, 3.5, W, x, rise * (8 + i) - 3.5, -55);
      }
      // stringers + handrail follow the upper flight (slope runs along x)
      const a2 = Math.atan2(rise * 8, 155), l2 = Math.hypot(rise * 8, 155);
      for (const sz of [-1, 1]) {
        box(g, wd, l2, 24, 5, 72, rise * 11.5 - 22, -55 + sz * (W / 2 + 0.5), { rz: a2 });
      }
      const iron = metal('#2e3033', 0.45);
      for (let i = 1; i < 8; i += 2) {
        cyl(g, iron, 1.6, 54, -5 + run2 * (i + 0.5), rise * (8 + i), -108);
      }
      box(g, wood(p.wood, 0.4), l2 + 8, 5, 7, 72, rise * 11.5 + 66, -108, { rz: a2, r: 2 });
      // corner newel at the landing
      cyl(g, iron, 2.4, rise * 7 + 96, -2, 0, -2);
      return g;
    }
  },
  // --- roofs: they drop onto the top of the wall line (elevation = wall height)
  //     and can be resized/rotated like any item to cover the footprint ---
  {
    id: 'roof_gable', name: 'Gable Roof', cat: 'structure', w: 700, d: 560, h: 200,
    elevation: 260, palettes: ROOFS, plan: { type: 'roof' }, autoFit: true,
    build: (p) => {
      const g = G();
      const shingle = tex(p.roof, 1, 1);
      const gableEnd = tex('siding_white', 1, 1);
      prism(g, shingle, 700, 190, 560, 0, 8, 0, gableEnd);
      // eave fascia + soffit slab, dropped below the base so it overlaps
      // the wall top (hides the roof/wall seam)
      box(g, solid('#e8e3d8', 0.7), 700, 15, 576, 0, -6, 0);
      // ridge cap
      box(g, solid('#3c3e42', 0.8), 704, 7, 16, 0, 194, 0, { r: 2 });
      return g;
    }
  },
  {
    id: 'roof_hip', name: 'Hip Roof', cat: 'structure', w: 700, d: 560, h: 190,
    elevation: 260, palettes: ROOFS, plan: { type: 'roof' }, autoFit: true,
    build: (p) => {
      const g = G();
      pyramid(g, tex(p.roof, 5, 3), 740, 182, 600, 0, 8, 0);
      box(g, solid('#e8e3d8', 0.7), 740, 15, 600, 0, -6, 0);
      return g;
    }
  },
  {
    id: 'roof_shed', name: 'Shed Roof', cat: 'structure', w: 500, d: 420, h: 130,
    elevation: 260, palettes: ROOFS, plan: { type: 'roof' }, autoFit: true,
    build: (p) => {
      const g = G();
      const ang = Math.atan2(110, 420);
      const len = Math.hypot(110, 420);
      const panel = box(g, tex(p.roof, 2.6, 2.4), 520, 10, len + 16, 0, 55, 0, { rx: ang });
      panel.castShadow = true;
      box(g, solid('#e8e3d8', 0.7), 520, 9, 14, 0, 104, -206, { rx: ang });
      box(g, solid('#e8e3d8', 0.7), 520, 9, 14, 0, -4, 206, { rx: ang });
      // soffit slab below the base hides the roof/wall seam
      box(g, solid('#e8e3d8', 0.7), 500, 15, 424, 0, -6, 0);
      return g;
    }
  },
  {
    id: 'roof_flat', name: 'Flat Roof', cat: 'structure', w: 600, d: 500, h: 45,
    elevation: 260, palettes: null, plan: { type: 'roof' }, autoFit: true,
    build: () => {
      const g = G();
      box(g, tex('gravel', 3, 2.5), 600, 14, 500, 0, 0, 0);
      const parapet = solid('#d8d2c6', 0.8);
      // skirt below the base hides the roof/wall seam
      box(g, parapet, 600, 15, 500, 0, -6, 0);
      box(g, parapet, 600, 40, 16, 0, 0, -242);
      box(g, parapet, 600, 40, 16, 0, 0, 242);
      box(g, parapet, 16, 40, 468, -292, 0, 0);
      box(g, parapet, 16, 40, 468, 292, 0, 0);
      return g;
    }
  },
  {
    id: 'dormer', name: 'Dormer', cat: 'structure', w: 160, d: 150, h: 170,
    elevation: 300, palettes: ROOFS, plan: { type: 'roof' },
    build: (p) => {
      const g = G();
      const face = tex('siding_white', 1, 1);
      box(g, face, 140, 110, 130, 0, 0, 0);
      // window on the front face
      box(g, solid('#3a3e44', 0.4), 70, 66, 4, 0, 26, 66);
      box(g, solid('#1d2733', 0.12), 62, 58, 3, 0, 30, 67);
      box(g, solid('#e8e6e0', 0.5), 4, 58, 3.5, 0, 30, 67.5);
      prism(g, tex(p.roof, 1, 1), 156, 62, 150, 0, 108, 0, face);
      return g;
    }
  },
  {
    id: 'chimney', name: 'Chimney', cat: 'structure', w: 70, d: 70, h: 210,
    elevation: 300, palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      box(g, tex('brick_red', 0.5, 1.4), 64, 190, 64, 0, 0, 0);
      box(g, solid('#c9c2b4', 0.7), 76, 10, 76, 0, 190, 0, { r: 1.5 });
      box(g, solid('#33342f', 0.8), 34, 12, 34, 0, 198, 0);
      return g;
    }
  },
  {
    id: 'elevator', name: 'Elevator', cat: 'structure', w: 170, d: 170, h: 285,
    palettes: null, plan: { type: 'elevator' },
    build: () => {
      const g = G();
      const shell = solid('#cfccc4', 0.85);
      const steel = metal('#b9bdc4', 0.28);
      const brushed = metal('#a7abb2', 0.4);
      // shaft: back + sides + top
      box(g, shell, 170, 285, 10, 0, 0, -80);
      box(g, shell, 10, 285, 170, -80, 0, 0);
      box(g, shell, 10, 285, 170, 80, 0, 0);
      box(g, shell, 170, 10, 170, 0, 275, 0);
      // front fascia with door cutout look
      box(g, shell, 30, 285, 10, -70, 0, 80);
      box(g, shell, 30, 285, 10, 70, 0, 80);
      box(g, shell, 170, 55, 10, 0, 230, 80);
      // brushed-steel double doors + frame
      box(g, steel, 116, 218, 3, 0, 0, 78);
      box(g, brushed, 54, 214, 3.5, -28.5, 2, 79.5);
      box(g, brushed, 54, 214, 3.5, 28.5, 2, 79.5);
      box(g, solid('#1e2126', 0.5), 2.5, 214, 4, 0, 2, 79.6);
      // call panel with lit buttons
      box(g, brushed, 13, 26, 2.5, 68, 118, 85.5);
      const up = solid('#ffd9a0', 0.4); up.emissive.set('#ffb84d'); up.emissiveIntensity = 0.9;
      const dn = solid('#cfe4ff', 0.4); dn.emissive.set('#7db8ff'); dn.emissiveIntensity = 0.6;
      sphere(g, up, 2.2, 68, 133, 87);
      sphere(g, dn, 2.2, 68, 124, 87);
      // floor indicator strip
      const ind = solid('#2a2d33', 0.4); ind.emissive.set('#ff7828'); ind.emissiveIntensity = 0.5;
      box(g, ind, 40, 7, 2, 0, 236, 85.5);
      return g;
    }
  },

  // ======================= BACKYARD =======================
  {
    id: 'swing_set', name: 'Swing Set', cat: 'outdoor', w: 300, d: 190, h: 225,
    palettes: null, plan: { type: 'swingset' },
    build: () => {
      const g = G();
      const frame = wood('#8a6a4a', 0.75);
      const chain = metal('#9aa0a6', 0.5);
      // A-frame ends + top beam
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          box(g, frame, 9, 235, 9, sx * 140, 0, sz * 4, { rx: sz * 0.38 });
        }
      }
      cyl(g, frame, 6, 296, 0, 213, 0, { rz: Math.PI / 2 });
      // two swings
      for (const sx of [-60, 60]) {
        for (const c of [-16, 16]) cyl(g, chain, 0.9, 158, sx + c, 55, 0);
        box(g, solid('#2e3440', 0.55), 44, 4.5, 17, sx, 52, 0, { r: 2 });
      }
      return g;
    }
  },
  {
    id: 'grill', name: 'BBQ Grill', cat: 'outdoor', w: 130, d: 65, h: 112,
    palettes: null, plan: { type: 'grill' },
    build: () => {
      const g = G();
      const body = metal('#2b2e33', 0.35);
      const steel = metal('#b9bdc4', 0.3);
      // cart with wheels
      box(g, body, 90, 60, 52, -14, 28, 0, { r: 4 });
      cyl(g, solid('#1c1c1e', 0.9), 10, 6, -50, 10, 20, { rz: Math.PI / 2 });
      cyl(g, solid('#1c1c1e', 0.9), 10, 6, -50, 10, -20, { rz: Math.PI / 2 });
      box(g, body, 6, 26, 6, 26, 0, 20);
      box(g, body, 6, 26, 6, 26, 0, -20);
      // lid with handle + thermometer
      box(g, body, 88, 24, 50, -14, 88, 0, { r: 12, seg: 4 });
      handleBar(g, -14, 102, 27, 46);
      cyl(g, steel, 4, 2, -14, 99, 26, { rx: Math.PI / 2 });
      // side shelf + knobs
      box(g, steel, 34, 3, 46, 48, 84, 0, { r: 1 });
      for (const kx of [-40, -22, -4]) knob(g, kx, 74, 27, 2.2);
      return g;
    }
  },
  {
    id: 'fire_pit', name: 'Fire Pit', cat: 'outdoor', w: 110, d: 110, h: 45,
    palettes: null, plan: { type: 'rings' },
    light: { y: 42, color: '#ff9440', intensity: 1.5, distance: 520 },
    build: () => {
      const g = G();
      // stone ring
      let s = 91;
      const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        const rockMat = solid(rand() < 0.5 ? '#8a8478' : '#726d5f', 0.95);
        box(g, rockMat, 22, 26 + rand() * 6, 16, Math.cos(a) * 46, 0, Math.sin(a) * 46, { r: 5, ry: -a });
      }
      cyl(g, solid('#242220', 0.95), 40, 8, 0, 4, 0);
      // logs + embers + flames
      const log = wood('#4a3a28', 0.9);
      cyl(g, log, 6, 52, 0, 16, 0, { rz: Math.PI / 2, ry: 0.5 });
      cyl(g, log, 6, 52, 0, 16, 0, { rz: Math.PI / 2, ry: -0.6 });
      const ember = solid('#ff6a20', 0.6); ember.emissive.set('#ff5a10'); ember.emissiveIntensity = 1.4;
      const flame = solid('#ffb347', 0.5); flame.emissive.set('#ff9430'); flame.emissiveIntensity = 1.8;
      sphere(g, ember, 9, 4, 14, 2, { sy: 0.5, seg: 10 });
      cyl(g, flame, 8, 22, 0, 18, 0, { rTop: 1.5, seg: 8 });
      cyl(g, flame, 5, 15, 9, 17, -6, { rTop: 1, seg: 8 });
      return g;
    }
  },
  {
    id: 'hot_tub', name: 'Hot Tub', cat: 'outdoor', w: 220, d: 220, h: 92,
    palettes: null, plan: { type: 'hottub' },
    build: () => {
      const g = G();
      // wood cabinet + acrylic rim frame around an open water basin
      box(g, wood('#6a5138', 0.8), 220, 78, 220, 0, 0, 0, { r: 10, seg: 4 });
      const rim = solid('#e8e6e0', 0.35);
      box(g, rim, 208, 14, 26, 0, 78, -91, { r: 6, seg: 4 });
      box(g, rim, 208, 14, 26, 0, 78, 91, { r: 6, seg: 4 });
      box(g, rim, 26, 14, 156, -91, 78, 0, { r: 6, seg: 4 });
      box(g, rim, 26, 14, 156, 91, 78, 0, { r: 6, seg: 4 });
      box(g, solid('#3a7d9c', 0.3), 158, 6, 158, 0, 76, 0);
      const w = box(g, water(), 156, 4, 156, 0, 82, 0);
      w.receiveShadow = true;
      // headrest pads + control panel on the rim
      for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
        box(g, solid('#2e3440', 0.5), 34, 5, 12,
          Math.cos(a) * 88, 92, Math.sin(a) * 88, { r: 3, ry: -a + Math.PI / 2 });
      }
      box(g, solid('#1e2126', 0.4), 20, 3, 12, 74, 92, 74, { r: 2, ry: Math.PI / 4 });
      return g;
    }
  },
  {
    id: 'trampoline', name: 'Trampoline', cat: 'outdoor', w: 300, d: 300, h: 92,
    palettes: null, plan: { type: 'rings' },
    build: () => {
      const g = G();
      const steel = metal('#7d838c', 0.4);
      // legs + frame ring (ring approximated by a thin flat cylinder pair)
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + 0.3;
        cyl(g, steel, 3.5, 82, Math.cos(a) * 128, 0, Math.sin(a) * 128);
      }
      cyl(g, solid('#2a4a7c', 0.6), 148, 6, 0, 81, 0, { seg: 32 });   // blue spring pad
      cyl(g, solid('#1e2126', 0.75), 119, 4, 0, 84.5, 0, { seg: 32 }); // jump mat sits proud

      return g;
    }
  },
  {
    id: 'patio_set', name: 'Patio Set', cat: 'outdoor', w: 230, d: 230, h: 245,
    palettes: null, plan: { type: 'patioset' },
    build: () => {
      const g = G();
      const iron = solid('#33342f', 0.6);
      // round table + umbrella through the middle
      cyl(g, glass(), 55, 3, 0, 70, 0, { seg: 28 });
      cyl(g, iron, 3, 70, 0, 0, 0);
      cyl(g, iron, 22, 3, 0, 0, 0);
      cyl(g, iron, 2.2, 168, 0, 73, 0);
      shade(g, '#b0483a', 108, 10, 32, 0, 210, 0);
      // four chairs facing in
      for (const a of [0.6, 2.2, 3.8, 5.4]) {
        const cx = Math.cos(a) * 92, cz = Math.sin(a) * 92;
        const face = Math.atan2(-cz, -cx);
        box(g, iron, 42, 4, 42, cx, 42, cz, { r: 3, ry: -face });
        box(g, iron, 4, 46, 42, cx - Math.cos(face) * 20, 44, cz - Math.sin(face) * 20, { r: 3, ry: -face });
        for (const lx of [-1, 1]) for (const lz of [-1, 1]) {
          box(g, iron, 3.2, 42, 3.2, cx + lx * 16, 0, cz + lz * 16);
        }
      }
      return g;
    }
  },
  {
    id: 'bball_hoop', name: 'Basketball Hoop', cat: 'outdoor', w: 115, d: 120, h: 305,
    palettes: null, plan: { type: 'hoop' },
    build: () => {
      const g = G();
      const steel = metal('#3a3d42', 0.4);
      box(g, solid('#2a2d31', 0.7), 60, 14, 70, 0, 0, 20, { r: 4 });   // base
      cyl(g, steel, 5, 285, 0, 8, 40, { rTop: 4 });
      box(g, steel, 5, 5, 46, 0, 275, 16, { rx: 0.12 });
      // backboard + hoop + net
      box(g, solid('#e8eaec', 0.4), 110, 68, 4, 0, 245, -8);
      box(g, solid('#c8412e', 0.5), 44, 30, 4.5, 0, 252, -7.8);
      cyl(g, solid('#d3591f', 0.4), 23, 2.5, 0, 248, -32, { seg: 20 });
      const net = solid('#eceff2', 0.9);
      net.transparent = true; net.opacity = 0.55;
      cyl(g, net, 22, 34, 0, 214, -32, { rTop: 22, seg: 10 }).material.wireframe = true;
      return g;
    }
  },
  // --- draggable paths: drag on the plan and the surface is laid along the stroke ---
  {
    id: 'path_sidewalk', name: 'Sidewalk', cat: 'outdoor', w: 240, d: 120, h: 5, noShadow: true,
    palettes: null, plan: { type: 'path' }, path: { mat: 'pavement', width: 120 },
    build: () => {
      const g = G();
      box(g, tex('pavement', 1.2, 0.6), 240, 5, 120, 0, 0, 0);
      return g;
    }
  },
  {
    id: 'path_driveway', name: 'Driveway', cat: 'outdoor', w: 300, d: 280, h: 4, noShadow: true,
    palettes: null, plan: { type: 'path' }, path: { mat: 'counter_dark', width: 280 },
    build: () => {
      const g = G();
      box(g, tex('counter_dark', 1.5, 1.4), 300, 4, 280, 0, 0, 0);
      return g;
    }
  },
  {
    id: 'path_gravel', name: 'Gravel Path', cat: 'outdoor', w: 200, d: 90, h: 4, noShadow: true,
    palettes: null, plan: { type: 'path' }, path: { mat: 'gravel', width: 90 },
    build: () => {
      const g = G();
      box(g, tex('gravel', 1.2, 0.6), 200, 4, 90, 0, 0, 0);
      return g;
    }
  },
  {
    id: 'path_stream', name: 'Water Stream', cat: 'outdoor', w: 260, d: 150, h: 8, noShadow: true,
    palettes: null, plan: { type: 'path' }, path: { mat: 'water', width: 150, surface: 'water' },
    build: () => {
      const g = G();
      box(g, solid('#3a7d9c', 0.3), 260, 4, 150, 0, 0, 0);
      const w = box(g, water(), 252, 4, 142, 0, 3, 0);
      w.receiveShadow = true;
      return g;
    }
  },
  {
    id: 'pergola', name: 'Pergola', cat: 'outdoor', w: 300, d: 300, h: 250,
    palettes: WOODS, plan: { type: 'pergola' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.7);
      // four posts + double beams both ways + slat roof
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        box(g, wd, 14, 228, 14, sx * 135, 0, sz * 135);
      }
      for (const sz of [-1, 1]) box(g, wd, 300, 14, 8, 0, 228, sz * 135);
      for (let x = -135; x <= 135; x += 30) {
        box(g, wd, 6, 8, 296, x, 242, 0);
      }
      return g;
    }
  },

  // ======================= EXPANSION PACK: INDOOR =======================
  {
    id: 'sofa_l', name: 'Sectional Sofa', cat: 'living', w: 280, d: 200, h: 82,
    palettes: FABRICS, plan: { type: 'sofa', seats: 4 },
    build: (p) => {
      const g = G();
      const fab = tex(p.fabric, 2, 2);
      const baseH = 22, armW = 18;
      legs4(g, solid('#4a4038', 0.6), 270, 190, 6, 2.2, 6);
      // long run along the back + chaise leg on the left
      box(g, fab, 280, baseH, 95, 0, 6, -52.5, { r: 4 });
      box(g, fab, 95, baseH, 105, -92.5, 6, 47.5, { r: 4 });
      // back + arms
      box(g, fab, 280, 60 - baseH, 22, 0, baseH + 6, -89, { r: 6 });
      box(g, fab, armW, 54 - baseH, 92, 131, baseH, -52, { r: 6 });
      box(g, fab, armW, 54 - baseH, 105, -131, baseH, 47.5, { r: 6 });
      // seat + chaise cushions
      for (let i = 0; i < 3; i++) {
        box(g, fab, 84, 14, 70, -88 + i * 88, baseH + 4, -46, { r: 5 });
        box(g, fab, 82, 34, 14, -88 + i * 88, baseH + 16, -72, { r: 5, rx: -0.12 });
      }
      box(g, fab, 84, 14, 96, -92.5, baseH + 4, 48, { r: 5 });
      return g;
    }
  },
  {
    id: 'recliner', name: 'Recliner', cat: 'living', w: 92, d: 160, h: 100,
    palettes: FABRICS, plan: { type: 'sofa', seats: 1 },
    build: (p) => {
      const g = G();
      const fab = tex(p.fabric, 2, 2);
      box(g, fab, 92, 26, 90, 0, 0, -20, { r: 6 });
      box(g, fab, 20, 34, 86, -36, 22, -22, { r: 7 });
      box(g, fab, 20, 34, 86, 36, 22, -22, { r: 7 });
      box(g, fab, 56, 14, 66, 0, 26, -22, { r: 5 });
      box(g, fab, 60, 62, 20, 0, 34, -60, { r: 8, rx: -0.24 });
      // extended footrest
      box(g, fab, 56, 12, 52, 0, 22, 44, { r: 5, rx: 0.16 });
      box(g, metal('#5a5d61', 0.4), 4, 18, 30, -16, 4, 26, { rx: 0.5 });
      box(g, metal('#5a5d61', 0.4), 4, 18, 30, 16, 4, 26, { rx: 0.5 });
      return g;
    }
  },
  {
    id: 'piano', name: 'Upright Piano', cat: 'living', w: 150, d: 64, h: 126,
    palettes: null, plan: { type: 'storage' },
    build: () => {
      const g = G();
      const body = wood('#2e2622', 0.35);
      box(g, body, 150, 100, 40, 0, 26, -10, { r: 2 });          // upper body
      box(g, body, 150, 8, 62, 0, 66, 0, { r: 1.5 });            // key bed
      // keys
      box(g, solid('#f2efe6', 0.3), 122, 3, 16, 0, 74, 18);
      for (let i = 0; i < 18; i++) {
        box(g, solid('#1a1a1c', 0.3), 3.4, 3.2, 9, -57 + i * 6.7, 75.5, 14.5);
      }
      box(g, body, 150, 5, 20, 0, 78, -4);                        // fallboard
      for (const sx of [-1, 1]) box(g, body, 10, 66, 12, sx * 66, 0, 20); // front legs
      // pedals + bench
      for (const px of [-10, 0, 10]) box(g, metal('#b8a468', 0.3), 5, 3, 10, px, 6, 24);
      box(g, body, 74, 6, 34, 0, 46, 78, { r: 1.5 });
      legs4(g, body, 66, 28, 46, 3, 4, true);
      const bench = g.children.slice(-4);
      for (const leg of bench) leg.position.z += 78;
      return g;
    }
  },
  {
    id: 'pool_table', name: 'Pool Table', cat: 'living', w: 254, d: 140, h: 82,
    palettes: null, plan: { type: 'table' },
    build: () => {
      const g = G();
      const mahogany = wood('#4e3526', 0.45);
      box(g, mahogany, 254, 16, 140, 0, 62, 0, { r: 3 });         // rail frame
      box(g, solid('#2e6b45', 0.95), 226, 4, 112, 0, 75, 0);      // felt
      // pockets
      for (const [px, pz] of [[-113, -56], [0, -60], [113, -56], [-113, 56], [0, 60], [113, 56]]) {
        cyl(g, solid('#141416', 0.6), 8, 5, px, 74, pz);
      }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        box(g, mahogany, 16, 62, 16, sx * 108, 0, sz * 52, { r: 2 });
      }
      // a few balls + cue resting on the felt
      sphere(g, solid('#e8e4da', 0.2), 4, -30, 81, 6);
      sphere(g, solid('#b03a2e', 0.2), 4, 22, 81, -12);
      sphere(g, solid('#2952a3', 0.2), 4, 34, 81, 14);
      cyl(g, wood('#b08a5e', 0.4), 1.6, 130, -40, 80, 34, { rz: Math.PI / 2 });
      return g;
    }
  },
  {
    id: 'mirror_floor', name: 'Floor Mirror', cat: 'decor', w: 62, d: 14, h: 172,
    palettes: WOODS, plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      const frame = wood(p.wood, 0.5);
      const lean = -0.1;
      box(g, frame, 62, 172, 5, 0, 0, 0, { r: 2, rx: lean });
      const m = box(g, mirror(), 52, 160, 2, 0, 6, 2.2, { rx: lean });
      m.position.z += 1;
      return g;
    }
  },
  {
    id: 'ceiling_fan', name: 'Ceiling Fan', cat: 'decor', w: 132, d: 132, h: 45,
    mount: 'ceiling', palettes: null, plan: { type: 'lampRound' },
    light: { y: -34, color: '#fff2dc', intensity: 1.2, distance: 620 },
    build: () => {
      const g = G();
      const steel = metal('#8a8e93', 0.35);
      cyl(g, steel, 3, 14, 0, -14, 0);
      cyl(g, steel, 9, 8, 0, -24, 0);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        const blade = box(g, wood('#6a4f38', 0.5), 56, 2.2, 16, Math.cos(a) * 36, -22, Math.sin(a) * 36, { r: 3 });
        blade.rotation.y = -a;
        blade.rotation.z = 0.06;
      }
      const globe = solid('#f4ead6', 0.6);
      globe.emissive.set('#f4e2bc');
      globe.emissiveIntensity = 0.7;
      sphere(g, globe, 9, 0, -30, 0, { sy: 0.7 });
      return g;
    }
  },
  {
    id: 'bunk_bed', name: 'Bunk Bed', cat: 'bedroom', w: 104, d: 208, h: 165,
    palettes: WOODS, plan: { type: 'bed' },
    build: (p) => {
      const g = G();
      const frame = wood(p.wood, 0.55);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        box(g, frame, 8, 160, 8, sx * 48, 0, sz * 100);
      }
      for (const y of [22, 96]) {
        box(g, frame, 104, 8, 208, 0, y, 0, { r: 1 });
        box(g, solid('#f0ede6', 0.7), 94, 12, 196, 0, y + 8, 0, { r: 4 });
        box(g, solid(y > 50 ? '#7d94b8' : '#b8907d', 0.8), 94, 5, 90, 0, y + 17, -50, { r: 3 });
        box(g, solid('#fdfdfb', 0.6), 60, 7, 34, 0, y + 18, -80, { r: 3 });
      }
      // guard rail + ladder
      box(g, frame, 100, 6, 4, 0, 122, 102);
      for (let i = 0; i < 4; i++) box(g, frame, 26, 4, 4, 66, 24 + i * 30, 60);
      box(g, frame, 4, 130, 4, 54, 8, 60);
      box(g, frame, 4, 130, 4, 78, 8, 60);
      return g;
    }
  },
  {
    id: 'crib', name: 'Baby Crib', cat: 'bedroom', w: 74, d: 134, h: 95,
    palettes: WOODS, plan: { type: 'bed' },
    build: (p) => {
      const g = G();
      const frame = wood(p.wood, 0.5);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        box(g, frame, 6, 92, 6, sx * 34, 0, sz * 64, { r: 2 });
      }
      box(g, frame, 74, 6, 134, 0, 32, 0, { r: 1 });
      box(g, solid('#f4f1ea', 0.7), 66, 10, 124, 0, 37, 0, { r: 3 });
      // bar rails on all four sides
      for (const sz of [-1, 1]) {
        box(g, frame, 74, 4, 5, 0, 84, sz * 64);
        for (let x = -28; x <= 28; x += 8) box(g, frame, 2.4, 46, 2.4, x, 38, sz * 64);
      }
      for (const sx of [-1, 1]) {
        box(g, frame, 5, 4, 128, sx * 34, 84, 0);
        for (let z = -56; z <= 56; z += 8) box(g, frame, 2.4, 46, 2.4, sx * 34, 38, z);
      }
      return g;
    }
  },
  {
    id: 'sideboard', name: 'Sideboard', cat: 'dining', w: 168, d: 46, h: 82,
    palettes: WOODS, plan: { type: 'storage' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.5);
      legs4(g, solid(dark, 0.4), 158, 38, 14, 2, 5, true);
      box(g, wd, 168, 62, 46, 0, 14, 0, { r: 1.5 });
      for (let i = 0; i < 3; i++) {
        box(g, wood(p.wood, 0.42), 52, 56, 1.5, -56 + i * 56, 17, 23.2);
        knob(g, -38 + i * 56, 45, 24.4);
      }
      // decor on top: vase + bowl
      cyl(g, solid('#c8beac', 0.6), 6, 22, -55, 76, 0, { rTop: 3.5 });
      foliage(g, '#5d7a4c', '#728f5e', -55, 102, 0, 9, 4, 21);
      cyl(g, solid('#8a8478', 0.5), 11, 5, 40, 76, 0, { rTop: 13 });
      return g;
    }
  },
  {
    id: 'wine_cabinet', name: 'Wine Cabinet', cat: 'dining', w: 82, d: 42, h: 180,
    palettes: WOODS, plan: { type: 'storage' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.5);
      box(g, wd, 82, 176, 42, 0, 0, 0, { r: 1.5 });
      box(g, solid('#25211e', 0.7), 72, 86, 3, 0, 82, 20);
      // bottle racks peeking out of the lower half
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          const bottle = cyl(g, solid(['#3a4a2e', '#4a2e33', '#2e3a4a'][(r + c) % 3], 0.3),
            4.2, 30, -27 + c * 18, 18 + r * 20, 8, { rx: Math.PI / 2 });
          sphere(g, solid('#6a6f5a', 0.4), 2, -27 + c * 18, 18 + r * 20, 25);
        }
      }
      // glass upper door
      box(g, glass(), 72, 82, 2, 0, 84, 21.5);
      handleBar(g, 30, 110, 22.5, 14, true);
      return g;
    }
  },
  {
    id: 'vanity_double', name: 'Double Vanity', cat: 'bathroom', w: 152, d: 52, h: 86,
    palettes: WOODS, plan: { type: 'sink' },
    build: (p) => {
      const g = G();
      legs4(g, metal('#7c8084', 0.4), 142, 44, 12, 1.6, 3, true);
      box(g, wood(p.wood, 0.5), 152, 62, 50, 0, 12, 0, { r: 1 });
      for (const sx of [-38, 38]) {
        box(g, wood(p.wood, 0.42), 66, 56, 1.5, sx, 15, 25.2);
        handleBar(g, sx, 43, 26.2, 16);
      }
      box(g, tex('countertop', 0.9, 0.4), 154, 3, 52, 0, 74, 0, { r: 0.8 });
      for (const sx of [-38, 38]) {
        const basin = sphere(g, solid('#f4f3f0', 0.2), 15, sx, 80, 2, { sy: 0.45 });
        basin.scale.x = 1.25;
        cyl(g, chrome(), 1.4, 18, sx, 76, -17);
        cyl(g, chrome(), 1.2, 12, sx, 93, -11.5, { rx: Math.PI / 2 });
      }
      return g;
    }
  },
  {
    id: 'treadmill', name: 'Treadmill', cat: 'office', w: 82, d: 190, h: 142,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      const body = metal('#33363b', 0.4);
      box(g, body, 76, 14, 170, 0, 0, 8, { r: 5 });
      box(g, solid('#1c1e21', 0.9), 58, 3, 140, 0, 14, 14, { r: 2 });
      // uprights + console
      for (const sx of [-1, 1]) box(g, body, 6, 120, 8, sx * 34, 10, -70, { rx: 0.22 });
      box(g, body, 76, 8, 5, 0, 126, -94, { rx: 0.3 });
      const screen = solid('#1a2632', 0.3);
      screen.emissive.set('#2e5a7c');
      screen.emissiveIntensity = 0.5;
      box(g, screen, 40, 24, 4, 0, 128, -90, { rx: -0.35 });
      return g;
    }
  },

  // ======================= EXPANSION PACK: OUTDOOR =======================
  {
    id: 'truck', name: 'Pickup Truck', cat: 'outdoor', w: 200, d: 560, h: 190,
    palettes: [
      { name: 'White', chip: '#e8e8ea', body: '#e8e8ea' },
      { name: 'Black', chip: '#26282c', body: '#26282c' },
      { name: 'Red', chip: '#8d3021', body: '#8d3021' },
      { name: 'Steel', chip: '#5f6a74', body: '#5f6a74' }
    ],
    plan: { type: 'car' },
    build: (p) => {
      const g = G();
      const paint = solid(p.body, 0.32);
      const darkGlass = solid('#1d2733', 0.12);
      const tire = solid('#1c1c1e', 0.9);
      const rim = metal('#c2c6cc', 0.3);
      for (const [wz, wx] of [[-180, -84], [-180, 84], [160, -84], [160, 84]]) {
        cyl(g, tire, 40, 26, wx, 40, wz, { rz: Math.PI / 2 });
        cyl(g, rim, 22, 27.5, wx, 40, wz, { rz: Math.PI / 2 });
      }
      box(g, paint, 186, 66, 540, 0, 44, 0, { r: 8, seg: 4 });   // chassis body
      box(g, paint, 178, 62, 190, 0, 104, -60, { r: 10, seg: 4 }); // cab
      box(g, darkGlass, 170, 46, 178, 0, 112, -58, { r: 9, seg: 4 });
      // open bed
      box(g, solid('#2b2d31', 0.7), 166, 6, 220, 0, 106, 150);
      box(g, paint, 8, 34, 220, -85, 110, 150);
      box(g, paint, 8, 34, 220, 85, 110, 150);
      box(g, paint, 170, 34, 8, 0, 110, 262);
      box(g, solid('#f4f0d8', 0.3), 30, 12, 6, -66, 78, -264);
      box(g, solid('#f4f0d8', 0.3), 30, 12, 6, 66, 78, -264);
      box(g, solid('#7a2018', 0.4), 26, 12, 6, -74, 92, 266);
      box(g, solid('#7a2018', 0.4), 26, 12, 6, 74, 92, 266);
      box(g, metal('#9aa0a6', 0.4), 170, 12, 12, 0, 34, -268);
      box(g, metal('#9aa0a6', 0.4), 170, 12, 12, 0, 34, 268);
      return g;
    }
  },
  {
    id: 'bicycle', name: 'Bicycle', cat: 'outdoor', w: 45, d: 170, h: 105,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      const frame = metal('#8d3021', 0.3);
      const tire = solid('#26262a', 0.85);
      for (const z of [-55, 55]) {
        cyl(g, tire, 33, 3, 0, 33, z, { rz: Math.PI / 2 });
        cyl(g, metal('#c2c6cc', 0.25), 29, 3.4, 0, 33, z, { rz: Math.PI / 2 });
      }
      // frame tubes
      box(g, frame, 3.5, 3.5, 62, 0, 60, -22, { rx: 0.25 });
      box(g, frame, 3.5, 52, 3.5, 0, 33, -55, { rx: 0.32 });
      box(g, frame, 3.5, 48, 3.5, 0, 33, 42, { rx: -0.28 });
      box(g, frame, 3.5, 44, 3.5, 0, 42, 8, { rx: -0.2 });
      // handlebars + seat + pedals
      box(g, metal('#2b2d31', 0.4), 34, 3, 3, 0, 92, -62);
      box(g, solid('#1e1e20', 0.7), 9, 4, 24, 0, 84, 24, { r: 2 });
      cyl(g, metal('#6d7278', 0.4), 6, 4, 0, 36, 6, { rz: Math.PI / 2 });
      return g;
    }
  },
  {
    id: 'fountain', name: 'Garden Fountain', cat: 'outdoor', w: 220, d: 220, h: 150,
    palettes: null, plan: { type: 'rings' },
    build: () => {
      const g = G();
      const stone = solid('#b3aca0', 0.85);
      cyl(g, stone, 105, 34, 0, 0, 0, { seg: 26 });
      cyl(g, solid('#8f887c', 0.9), 96, 6, 0, 32, 0, { seg: 26 });
      let w = cyl(g, water(), 92, 5, 0, 30, 0, { seg: 26 });
      w.receiveShadow = true;
      cyl(g, stone, 12, 62, 0, 30, 0);
      cyl(g, stone, 48, 12, 0, 88, 0, { seg: 22 });
      w = cyl(g, water(), 43, 4, 0, 98, 0, { seg: 22 });
      cyl(g, stone, 7, 34, 0, 98, 0);
      cyl(g, stone, 22, 9, 0, 130, 0, { seg: 18 });
      cyl(g, water(), 18, 3.5, 0, 137, 0, { seg: 18 });
      sphere(g, stone, 6, 0, 146, 0);
      return g;
    }
  },
  {
    id: 'gazebo', name: 'Gazebo', cat: 'outdoor', w: 340, d: 340, h: 320,
    palettes: WOODS, plan: { type: 'pergola' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.7);
      // hexagonal posts + railing + deck
      cyl(g, wd, 160, 10, 0, 0, 0, { seg: 6 });
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        const px = Math.cos(a) * 140, pz = Math.sin(a) * 140;
        box(g, wd, 11, 240, 11, px, 8, pz);
        // railing between posts (skip the entry side)
        if (i !== 4) {
          const a2 = ((i + 1) / 6) * Math.PI * 2 + Math.PI / 6;
          const qx = Math.cos(a2) * 140, qz = Math.sin(a2) * 140;
          const mx = (px + qx) / 2, mz = (pz + qz) / 2;
          const len = Math.hypot(qx - px, qz - pz);
          const rot = -Math.atan2(qz - pz, qx - px);
          box(g, wd, len - 14, 6, 5, mx, 90, mz, { ry: rot });
          box(g, wd, len - 14, 6, 5, mx, 40, mz, { ry: rot });
        }
      }
      // hex roof + finial
      const roofMesh = cyl(g, tex('shingle_brown', 4, 2), 205, 82, 0, 244, 0, { rTop: 3, seg: 6 });
      roofMesh.rotation.y = Math.PI / 6;
      sphere(g, wd, 8, 0, 330, 0);
      return g;
    }
  },
  {
    id: 'shed_garden', name: 'Garden Shed', cat: 'outdoor', w: 300, d: 220, h: 260,
    palettes: [
      { name: 'White', chip: '#e7e3d8', siding: 'siding_white' },
      { name: 'Cedar', chip: '#8a6a4a', siding: 'cedar_shake' },
      { name: 'Grey', chip: '#a9adad', siding: 'siding_gray' }
    ],
    plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const skin = tex(p.siding, 1.6, 1);
      box(g, skin, 296, 200, 216, 0, 0, 0);
      prism(g, tex('shingle_charcoal', 1, 1), 316, 70, 250, 0, 198, 0, skin);
      // door + hinges + window
      box(g, wood('#5d4a36', 0.6), 78, 160, 4, -60, 0, 109);
      knob(g, -32, 82, 112);
      box(g, solid('#3a3e44', 0.4), 62, 58, 4, 70, 90, 109);
      box(g, solid('#cfe0e8', 0.15), 54, 50, 3, 70, 94, 110);
      box(g, solid('#e8e6e0', 0.5), 3.5, 50, 3.5, 70, 94, 110.5);
      return g;
    }
  },
  {
    id: 'dog_house', name: 'Dog House', cat: 'outdoor', w: 96, d: 116, h: 100,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      const skin = wood('#8a5c3c', 0.7);
      box(g, skin, 92, 66, 112, 0, 0, 0);
      prism(g, tex('shingle_red', 1, 1), 104, 34, 124, 0, 64, 0, skin);
      // arched doorway (approximated: box + half-cylinder)
      box(g, solid('#241d16', 0.95), 36, 34, 4, 0, 0, 55);
      const arch = cyl(g, solid('#241d16', 0.95), 18, 4, 0, 34, 55, { rx: Math.PI / 2 });
      // food bowl
      cyl(g, metal('#b9bdc4', 0.3), 9, 5, 34, 0, 74);
      return g;
    }
  },
  {
    id: 'flower_bed', name: 'Flower Bed', cat: 'outdoor', w: 170, d: 85, h: 42,
    palettes: null, plan: { type: 'hedge' },
    build: () => {
      const g = G();
      let s = 77;
      const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
      // stone border
      for (let i = 0; i < 18; i++) {
        const t = i / 18;
        const a = t * Math.PI * 2;
        const rx = Math.cos(a) * 78, rz = Math.sin(a) * 36;
        sphere(g, solid(rand() < 0.5 ? '#8a8478' : '#75705f', 0.9), 8 + rand() * 4, rx, 4, rz, { sy: 0.65, seg: 8 });
      }
      const soil = cyl(g, solid('#4a3a28', 0.98), 74, 8, 0, 0, 0, { seg: 24 });
      soil.scale.z = 0.46;
      // flowers: stems + colored heads
      const heads = ['#c94a63', '#e0a33c', '#9c6bbf', '#e8e4da', '#d3591f'];
      for (let i = 0; i < 14; i++) {
        const fx = (rand() - 0.5) * 130, fz = (rand() - 0.5) * 56;
        const fh = 16 + rand() * 14;
        cyl(g, solid('#4e6b34', 0.9), 1, fh, fx, 6, fz);
        sphere(g, solid(heads[Math.floor(rand() * heads.length)], 0.7), 3.5 + rand() * 2, fx, 8 + fh, fz, { seg: 8 });
      }
      return g;
    }
  },
  {
    id: 'planter_box', name: 'Planter Box', cat: 'outdoor', w: 110, d: 42, h: 52,
    palettes: WOODS, plan: { type: 'hedge' },
    build: (p) => {
      const g = G();
      box(g, wood(p.wood, 0.75), 110, 40, 42, 0, 0, 0, { r: 2 });
      box(g, solid('#4a3a28', 0.98), 100, 4, 34, 0, 36, 0);
      foliage(g, '#4e6b34', '#5f8040', -30, 52, 0, 14, 5, 41);
      foliage(g, '#5d7a4c', '#728f5e', 8, 54, 4, 15, 5, 42);
      foliage(g, '#3f6b2e', '#548a3c', 40, 50, -4, 12, 4, 43);
      return g;
    }
  },
  {
    id: 'lounger', name: 'Sun Lounger', cat: 'outdoor', w: 66, d: 186, h: 72,
    palettes: null, plan: { type: 'sofa', seats: 1 },
    build: () => {
      const g = G();
      const frame = wood('#8a6a4a', 0.7);
      const canvas = solid('#dad4c4', 0.85);
      for (const sx of [-1, 1]) {
        box(g, frame, 5, 5, 180, sx * 29, 28, 0);
        box(g, frame, 5, 28, 5, sx * 29, 0, -80);
        box(g, frame, 5, 28, 5, sx * 29, 0, 60);
      }
      box(g, canvas, 56, 4, 118, 0, 32, 22, { r: 2 });
      box(g, canvas, 56, 4, 74, 0, 52, -54, { r: 2, rx: -0.62 });
      return g;
    }
  },
  {
    id: 'slide', name: 'Playground Slide', cat: 'outdoor', w: 96, d: 260, h: 165,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      const steel = metal('#7d838c', 0.4);
      const plastic = solid('#c8412e', 0.5);
      // platform + ladder at the back
      for (const sx of [-1, 1]) {
        box(g, steel, 5, 128, 5, sx * 30, 0, -100);
        box(g, steel, 5, 118, 5, sx * 30, 0, -55, { rx: 0.1 });
      }
      for (let i = 0; i < 5; i++) box(g, steel, 54, 4, 5, 0, 18 + i * 24, -100);
      box(g, plastic, 64, 6, 44, 0, 126, -78, { r: 2 });
      // slide surface with side rails
      const ang = 0.52;
      box(g, plastic, 52, 5, 210, 0, 62, 30, { rx: ang, r: 2 });
      box(g, plastic, 6, 14, 210, -26, 66, 30, { rx: ang, r: 2 });
      box(g, plastic, 6, 14, 210, 26, 66, 30, { rx: ang, r: 2 });
      return g;
    }
  },
  {
    id: 'sandbox', name: 'Sandbox', cat: 'outdoor', w: 170, d: 170, h: 32,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      const frame = wood('#8a6a4a', 0.8);
      box(g, frame, 170, 28, 18, 0, 0, -76);
      box(g, frame, 170, 28, 18, 0, 0, 76);
      box(g, frame, 18, 28, 134, -76, 0, 0);
      box(g, frame, 18, 28, 134, 76, 0, 0);
      box(g, solid('#d9c391', 0.98), 134, 20, 134, 0, 0, 0);
      // bucket + shovel
      cyl(g, solid('#2f6ea3', 0.5), 8, 12, 30, 20, 24, { rTop: 6.5 });
      box(g, solid('#e0a33c', 0.5), 4, 2, 26, -26, 21, -12, { ry: 0.6 });
      return g;
    }
  },

  {
    id: 'shipping_container', name: 'Shipping Container', cat: 'outdoor', w: 244, d: 1220, h: 260,
    palettes: [
      { name: 'Rust Red', chip: '#8d3a28', body: '#8d3a28' },
      { name: 'Ocean Blue', chip: '#2e4a68', body: '#2e4a68' },
      { name: 'Forest', chip: '#3f5c40', body: '#3f5c40' },
      { name: 'Grey', chip: '#6d7278', body: '#6d7278' }
    ],
    plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const paint = solid(p.body, 0.55);
      const trim = solid('#33363a', 0.5);
      box(g, paint, 232, 252, 1210, 0, 4, 0);
      box(g, trim, 240, 6, 1218, 0, 0, 0);
      box(g, trim, 240, 6, 1218, 0, 252, 0);
      // corrugation ribs down both long sides
      for (let z = -570; z <= 570; z += 60) {
        box(g, paint, 8, 244, 22, -119, 4, z);
        box(g, paint, 8, 244, 22, 119, 4, z);
      }
      // corner castings
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const sy of [0, 242]) {
        box(g, trim, 20, 18, 20, sx * 112, sy, sz * 601);
      }
      // cargo doors with lock rods on the front end
      box(g, paint, 112, 240, 8, -58, 6, 606);
      box(g, paint, 112, 240, 8, 58, 6, 606);
      for (const rx of [-88, -30, 30, 88]) {
        cyl(g, metal('#b9bdc4', 0.35), 2.2, 232, rx, 8, 611);
        box(g, metal('#b9bdc4', 0.35), 10, 4, 6, rx + 8, 120, 611);
      }
      return g;
    }
  },
  {
    id: 'hill_mound', name: 'Grass Hill', cat: 'outdoor', w: 800, d: 500, h: 200, noShadow: true,
    palettes: null, plan: { type: 'hedge' },
    build: () => {
      const g = G();
      const mound = sphere(g, tex('grass', 5, 3), 250, 0, 0, 0, { seg: 28 });
      mound.scale.set(1.6, 0.8, 1.0);
      mound.position.y = -18;   // settle into the ground for a soft edge
      mound.receiveShadow = true;
      // boulders + a shrub so it reads as landscape, not a bump
      sphere(g, solid('#8a8478', 0.95), 26, -290, 0, 130, { sy: 0.6, seg: 10 });
      sphere(g, solid('#75705f', 0.95), 18, 250, 0, -150, { sy: 0.65, seg: 10 });
      foliage(g, '#3d5c2e', '#4a7038', -240, 30, -140, 26, 6, 91);
      return g;
    }
  },

  // ======================= GARDEN & FLOWERS =======================
  {
    id: 'sunflower', name: 'Sunflower', cat: 'outdoor', w: 60, d: 60, h: 180,
    palettes: null, plan: { type: 'plant' },
    build: () => {
      const g = G();
      buildSunflower(g, 0, 0, 165, 17, 5);
      return g;
    }
  },
  {
    id: 'sunflower_mammoth', name: 'Mammoth Sunflower', cat: 'outdoor', w: 120, d: 120, h: 380,
    palettes: null, plan: { type: 'plant' },
    build: () => {
      const g = G();
      buildSunflower(g, 0, 0, 355, 34, 11);
      return g;
    }
  },
  {
    id: 'sunflower_row', name: 'Sunflower Row', cat: 'outdoor', w: 200, d: 70, h: 230,
    palettes: null, plan: { type: 'plant' },
    build: () => {
      const g = G();
      box(g, solid('#4a3a28', 0.98), 196, 10, 54, 0, 0, 0, { r: 4 });
      buildSunflower(g, -70, -8, 172, 17, 21);
      buildSunflower(g, -22, 10, 210, 20, 22);
      buildSunflower(g, 28, -6, 150, 15, 23);
      buildSunflower(g, 74, 8, 192, 18, 24);
      return g;
    }
  },
  {
    id: 'rose_bush', name: 'Rose Bush', cat: 'outdoor', w: 95, d: 95, h: 100,
    palettes: [
      { name: 'Red', chip: '#b3273a', bloom: '#b3273a' },
      { name: 'Pink', chip: '#d87d9c', bloom: '#d87d9c' },
      { name: 'White', chip: '#ece7dc', bloom: '#ece7dc' },
      { name: 'Yellow', chip: '#e0b23c', bloom: '#e0b23c' }
    ],
    plan: { type: 'plant' },
    build: (p) => {
      const g = G();
      cyl(g, solid('#4e3a26', 0.95), 3.5, 18, 0, 0, 0);
      foliage(g, '#33571f', '#4a7030', 0, 100, 0, 40, 12, 51);
      let s = 61;
      const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
      const bloomMat = solid(p.bloom, 0.65);
      const heartMat = solid('#3a2b1a', 0.8);
      for (let i = 0; i < 12; i++) {
        const a = rand() * Math.PI * 2;
        const r = 18 + rand() * 24;
        const bx = Math.cos(a) * r, bz = Math.sin(a) * r;
        const by = 82 + rand() * 42 - r * 0.3;
        sphere(g, bloomMat, 5.5 + rand() * 3, bx, by, bz, { sy: 0.82, seg: 10 });
        sphere(g, heartMat, 1.6, bx, by + 4, bz, { seg: 6 });
      }
      return g;
    }
  },
  {
    id: 'tulip_bed', name: 'Tulip Bed', cat: 'outdoor', w: 130, d: 75, h: 50,
    palettes: null, plan: { type: 'plant' },
    build: () => {
      const g = G();
      box(g, solid('#4a3a28', 0.98), 126, 10, 70, 0, 0, 0, { r: 4 });
      let s = 41;
      const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
      const colors = ['#c8283c', '#e0a33c', '#9c50b8', '#e05a7c', '#ece7dc'];
      for (let ix = 0; ix < 6; ix++) {
        for (let iz = 0; iz < 3; iz++) {
          const tx = -50 + ix * 20 + (rand() - 0.5) * 8;
          const tz = -22 + iz * 22 + (rand() - 0.5) * 8;
          const th = 26 + rand() * 12;
          cyl(g, solid('#3f6b28', 0.9), 1.1, th, tx, 8, tz);
          // leaf blade
          const leaf = sphere(g, solid('#4a7a30', 0.9), 5, tx + 3, 14, tz, { sy: 1.6, seg: 6 });
          leaf.scale.x = 0.25;
          // cupped bloom
          sphere(g, solid(colors[Math.floor(rand() * colors.length)], 0.6),
            4.6, tx, 8 + th + 3, tz, { sy: 1.3, seg: 10 });
        }
      }
      return g;
    }
  },
  {
    id: 'raised_bed', name: 'Raised Garden Bed', cat: 'outdoor', w: 220, d: 110, h: 75,
    palettes: WOODS, plan: { type: 'hedge' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.8);
      box(g, wd, 220, 42, 14, 0, 0, -48);
      box(g, wd, 220, 42, 14, 0, 0, 48);
      box(g, wd, 14, 42, 82, -103, 0, 0);
      box(g, wd, 14, 42, 82, 103, 0, 0);
      box(g, solid('#463522', 0.98), 196, 36, 82, 0, 0, 0);
      let s = 87;
      const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
      // three planted rows: leafy greens, tomatoes on stakes, carrots' tops
      for (let i = 0; i < 5; i++) {
        const x = -80 + i * 40;
        foliage(g, '#4e7a2e', '#68954a', x, 44, -26, 11, 4, 60 + i);
        cyl(g, wood('#8a6a4a', 0.9), 1.2, 46, x + 2, 36, 4);
        foliage(g, '#3f6b28', '#548a3c', x, 62, 4, 8, 3, 70 + i);
        sphere(g, solid('#c8412e', 0.5), 3.4, x - 3, 56, 6, { seg: 8 });
        sphere(g, solid('#e05a30', 0.5), 2.8, x + 4, 48, 2, { seg: 8 });
        foliage(g, '#55842e', '#6da03c', x + (rand() - 0.5) * 10, 42, 30, 7, 3, 80 + i);
      }
      return g;
    }
  }
];

/** Shared sunflower builder: stalk with leaves, seed disk, two petal rings. */
function buildSunflower(g, x, z, h, headR, seed) {
  let s = seed * 7919 + 13;
  const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const lean = (rand() - 0.5) * 0.14;
  const stalk = cyl(g, solid('#4e7a2e', 0.9), headR * 0.16, h, x, 0, z, { rTop: headR * 0.1 });
  stalk.rotation.z = lean;
  // large heart-shaped leaves alternating up the stalk
  for (let i = 0; i < 4; i++) {
    const ly = h * (0.22 + i * 0.16);
    const side = i % 2 ? 1 : -1;
    const leaf = sphere(g, solid(i % 2 ? '#47732a' : '#528434', 0.9),
      headR * 0.85, x + side * headR * 0.75 + ly * lean, ly, z + (rand() - 0.5) * 6, { seg: 10 });
    leaf.scale.set(1.15, 0.16, 0.7);
    leaf.rotation.z = side * 0.5;
    leaf.rotation.y = (rand() - 0.5) * 0.8;
  }
  // flower head faces slightly forward and toward the sun
  const head = G();
  head.position.set(x + h * lean * 0.8, h, z);
  head.rotation.x = 0.42;
  head.rotation.y = (rand() - 0.5) * 0.5;
  g.add(head);
  const petalA = solid('#f4b81e', 0.6);
  const petalB = solid('#e29b12', 0.65);
  const petals = Math.max(14, Math.round(headR * 1.1));
  for (let ring = 0; ring < 2; ring++) {
    const rr = headR * (ring ? 0.94 : 1.12);
    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * Math.PI * 2 + ring * (Math.PI / petals);
      const pm = sphere(head, ring ? petalB : petalA, headR * 0.34,
        Math.cos(a) * rr, Math.sin(a) * rr, ring ? 1.5 : 0, { seg: 8 });
      pm.scale.set(1.5, 0.5, 0.12);
      pm.rotation.z = a;
    }
  }
  // seed disk: dark center with a lighter rim
  const disk = cyl(head, solid('#4a331c', 0.95), headR * 0.72, headR * 0.16, 0, 0, 0, { seg: 24 });
  disk.rotation.x = Math.PI / 2;
  const core = cyl(head, solid('#2e1f10', 0.98), headR * 0.45, headR * 0.18, 0, 0, 0, { seg: 20 });
  core.rotation.x = Math.PI / 2;
  // green sepals behind the head
  const sepal = cyl(head, solid('#3f6b28', 0.9), headR * 0.8, headR * 0.1, 0, 0, 0, { seg: 12 });
  sepal.rotation.x = Math.PI / 2;
  sepal.position.z = -headR * 0.12;
}

export const ITEM_MAP = new Map(ITEMS.map(i => [i.id, i]));

export function paletteFor(item, def) {
  const d = def || ITEM_MAP.get(item.defId);
  if (!d || !d.palettes) return {};
  return d.palettes[Math.min(item.palette ?? 0, d.palettes.length - 1)] || d.palettes[0];
}
