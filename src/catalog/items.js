// The furniture & appliance catalog. Every item is a parametric 3D model
// assembled from primitives (no external assets), with architectural 2D plan
// symbols and selectable finish palettes.
import {
  G, box, cyl, sphere, legs4, handleBar, knob, shade, wavyPanel,
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
    palettes: null, plan: { type: 'slab' },
    build: () => {
      const g = G();
      box(g, tex('pavement', 1.5, 0.6), 300, 5, 120, 0, 0, 0);
      return g;
    }
  },
  {
    id: 'driveway', name: 'Driveway', cat: 'outdoor', w: 550, d: 300, h: 4, noShadow: true,
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
    palettes: null, plan: { type: 'slab' },
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
    palettes: null, plan: { type: 'pool' },
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
  }
];

export const ITEM_MAP = new Map(ITEMS.map(i => [i.id, i]));

export function paletteFor(item, def) {
  const d = def || ITEM_MAP.get(item.defId);
  if (!d || !d.palettes) return {};
  return d.palettes[Math.min(item.palette ?? 0, d.palettes.length - 1)] || d.palettes[0];
}
