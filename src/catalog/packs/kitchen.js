// High-detail modern/luxury kitchen catalog pack. Parametric models built from
// primitives only (no external assets), using the app's photo textures for
// counters, backsplashes and cabinet fronts. All dims in cm; +Y up; front +Z.
import { G, box, cyl, sphere, legs4, handleBar, knob, glow, solid, wood, metal, chrome, glass, tex } from '../builders.js';

// Cabinet + counter finish palettes: `cab` paints the doors/carcass, `top` is a
// counter texture id, `grain` swaps painted for a wood-grain finish.
const KIT_PAL = [
  { name: 'White & Marble', chip: '#eef0ee', cab: '#eef0ee', top: 'real_marble' },
  { name: 'Navy & Quartz', chip: '#2c3a4f', cab: '#2c3a4f', top: 'countertop' },
  { name: 'Sage & Nero', chip: '#7c8770', cab: '#7c8770', top: 'real_nero' },
  { name: 'Matte Black & Terrazzo', chip: '#2b2b2d', cab: '#2b2b2d', top: 'real_terrazzo' },
  { name: 'Oak & Travertine', chip: '#a07a4f', cab: '#a07a4f', top: 'real_travertine', grain: true }
];

const carcass = (p) => (p.grain ? wood(p.cab, 0.5) : solid(p.cab, 0.5));
const door = (p) => (p.grain ? wood(p.cab, 0.42) : solid(p.cab, 0.42));
const STEEL = () => metal('#c4c8cc', 0.35);
const STEEL_D = () => metal('#b4b8bc', 0.3);
const DARKGLASS = '#1c2024';
const KICK = '#26282a';

// One shaker-style door face with an inset panel + pull. vertical pull.
function shakerDoor(g, p, w, h, x, y, z, pullSide = 0) {
  box(g, door(p), w, h, 1.6, x, y, z);
  box(g, carcass(p), w - 8, h - 8, 0.6, x, y + 4, z + 0.9); // recessed inset shadow line
  const px = pullSide === 0 ? x : x + pullSide * (w / 2 - 5);
  handleBar(g, px, y + h - 12, z + 2.4, Math.min(h - 20, 22), true);
}

export const KITCHEN_ITEMS = [
  // ============================= ISLAND =============================
  {
    id: 'kit_island', name: 'Kitchen Island (Waterfall)', cat: 'kitchen', w: 210, d: 104, h: 92,
    palettes: KIT_PAL, plan: { type: 'counter' },
    build: (p) => {
      const g = G();
      const top = tex(p.top, 1.4, 0.9);
      // cabinet carcass, inset from the marble ends for the waterfall reveal
      box(g, solid(KICK, 0.85), 190, 9, 74, 0, 0, -4);           // toe kick
      box(g, carcass(p), 196, 77, 82, 0, 9, -4, { r: 1 });        // body
      // seating overhang side: three drawer/door fronts
      for (let i = -1; i <= 1; i++) shakerDoor(g, p, 58, 66, i * 63, 14, 37.2, i);
      // back (kitchen) side lower cabinets
      box(g, door(p), 190, 66, 1.4, 0, 14, -44.6);
      // waterfall marble: full-height slabs down both ends + overhanging top
      box(g, top, 5, 88, 104, -102.5, 0, 0);
      box(g, top, 5, 88, 104, 102.5, 0, 0);
      box(g, top, 210, 5, 104, 0, 88, 0, { r: 0.6 });
      // two counter stools tucked under the overhang
      for (const sx of [-45, 45]) {
        cyl(g, wood('#6b533b', 0.5), 16, 4, sx, 60, 44, { seg: 26 });
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
          const leg = cyl(g, metal('#3a3d40', 0.4), 1.4, 62, sx + Math.cos(a) * 12, 0, 44 + Math.sin(a) * 12);
          leg.rotation.z = Math.cos(a) * 0.09; leg.rotation.x = -Math.sin(a) * 0.09;
        }
        cyl(g, metal('#8e9296', 0.4), 11, 1.2, sx, 26, 44, { seg: 22 });
      }
      return g;
    }
  },

  // ========================= BASE CABINET RUN =========================
  {
    id: 'kit_base_run', name: 'Base Cabinet Run', cat: 'kitchen', w: 180, d: 62, h: 91,
    palettes: KIT_PAL, plan: { type: 'counter' },
    build: (p) => {
      const g = G();
      box(g, solid(KICK, 0.85), 172, 9, 54, 0, 0, -3);
      box(g, carcass(p), 178, 77, 58, 0, 9, -3, { r: 0.8 });
      // three bays: a drawer stack + two doors
      box(g, door(p), 56, 18, 1.6, -60, 68, 27.5); handleBar(g, -60, 71, 28.6, 22);
      box(g, door(p), 56, 44, 1.6, -60, 22, 27.5);   handleBar(g, -60, 60, 28.6, 12, true);
      shakerDoor(g, p, 56, 66, 0, 14, 27.5, -1);
      shakerDoor(g, p, 56, 66, 60, 14, 27.5, 1);
      // stone counter with a small backsplash lip
      box(g, tex(p.top, 1.4, 0.6), 182, 4.5, 62, 0, 87, 0, { r: 0.6 });
      box(g, tex(p.top, 1.4, 0.2), 182, 9, 3, 0, 91.5, -29.5);
      return g;
    }
  },
  {
    id: 'kit_corner_base', name: 'Corner Base Cabinet', cat: 'kitchen', w: 100, d: 100, h: 91,
    palettes: KIT_PAL, plan: { type: 'counter' },
    build: (p) => {
      const g = G();
      box(g, solid(KICK, 0.85), 94, 9, 94, 0, 0, 0);
      box(g, carcass(p), 98, 77, 98, 0, 9, 0, { r: 0.8 });
      // angled corner door face (diagonal front)
      const dc = box(g, door(p), 62, 66, 1.6, 0, 14, 0, { ry: -Math.PI / 4 });
      dc.position.set(24, 47, 24);
      handleBar(g, 20, 22, 28, 12, true);
      // L-shaped stone counter (two overlapping slabs)
      box(g, tex(p.top, 0.8, 0.8), 100, 4.5, 62, 0, 87, -19, { r: 0.6 });
      box(g, tex(p.top, 0.8, 0.8), 62, 4.5, 100, -19, 87, 0, { r: 0.6 });
      return g;
    }
  },

  // ======================== TALL STORAGE =========================
  {
    id: 'kit_pantry', name: 'Tall Pantry Cabinet', cat: 'kitchen', w: 62, d: 62, h: 214,
    palettes: KIT_PAL, plan: { type: 'wardrobe' },
    build: (p) => {
      const g = G();
      box(g, solid(KICK, 0.85), 58, 9, 54, 0, 0, -3);
      box(g, carcass(p), 62, 205, 58, 0, 9, -3, { r: 0.8 });
      // two stacked full doors
      shakerDoor(g, p, 58, 96, 0, 14, 28.5, 1);
      shakerDoor(g, p, 58, 96, 0, 114, 28.5, 1);
      // handles already added by shakerDoor pullSide
      handleBar(g, 24, 96, 30.4, 26, true);
      handleBar(g, 24, 196, 30.4, 26, true);
      return g;
    }
  },
  {
    id: 'kit_wall_cab', name: 'Wall Cabinets', cat: 'kitchen', w: 90, d: 34, h: 74,
    elevation: 148, mount: 'wall', palettes: KIT_PAL, plan: { type: 'wallCabinet' },
    build: (p) => {
      const g = G();
      box(g, carcass(p), 90, 74, 34, 0, 0, 0, { r: 0.8 });
      shakerDoor(g, p, 43, 68, -22.5, 3, 17.5, -1);
      shakerDoor(g, p, 43, 68, 22.5, 3, 17.5, 1);
      box(g, solid('#20242a', 0.6), 84, 2, 30, 0, 74, 0); // under-cabinet valance
      return g;
    }
  },
  {
    id: 'kit_open_shelf', name: 'Open Shelving', cat: 'kitchen', w: 110, d: 26, h: 78,
    elevation: 132, mount: 'wall', palettes: KIT_PAL, plan: { type: 'wallCabinet' },
    build: (p) => {
      const g = G();
      const shelf = wood(p.grain ? p.cab : '#8a6b47', 0.5);
      const brk = metal('#2a2c2e', 0.4);
      for (const sy of [8, 42, 76]) {
        box(g, shelf, 110, 4, 26, 0, sy, 0, { r: 0.5 });
        for (const bx of [-46, 46]) {
          box(g, brk, 3, 4, 24, bx, sy - 4, -1);          // top rail
          box(g, brk, 3, 24, 3, bx, sy - 24, -11);        // wall drop
        }
      }
      // a little styled crockery on the shelves
      cyl(g, solid('#e7e3da', 0.6), 6, 14, -30, 12, 2);
      cyl(g, solid('#c65b3c', 0.6), 5, 11, 18, 12, 2);
      box(g, solid('#4a5568', 0.6), 8, 20, 8, 34, 46, 0, { r: 1 });
      cyl(g, solid('#dcd6cc', 0.6), 7, 9, -24, 80, 2);
      return g;
    }
  },

  // ========================= APPLIANCES =========================
  {
    id: 'kit_range', name: 'Pro Gas Range', cat: 'kitchen', w: 76, d: 66, h: 94,
    palettes: null, plan: { type: 'stove' },
    build: () => {
      const g = G();
      const body = STEEL();
      box(g, body, 76, 84, 60, 0, 2, -2, { r: 1 });
      // big double oven glass door + full-width bar handle
      box(g, solid(DARKGLASS, 0.15), 66, 46, 2, 0, 16, 30, { r: 1 });
      box(g, chrome(), 66, 3, 3, 0, 60, 31);
      cyl(g, chrome(), 1.5, 62, 0, 65.5, 32, { rz: Math.PI / 2 });
      // backguard + red control knobs
      box(g, body, 76, 14, 5, 0, 78, -30);
      for (let i = 0; i < 6; i++) {
        cyl(g, solid('#b0342a', 0.4), 2.4, 3, -32 + i * 12.8, 84, 27, { rx: Math.PI / 2 });
      }
      // stainless cooktop deck + cast-iron grates
      box(g, metal('#a8acb0', 0.3), 74, 3, 58, 0, 86, -2, { r: 0.5 });
      const grate = solid('#161616', 0.6);
      for (const gx of [-24, 0, 24]) box(g, grate, 20, 2, 52, gx, 89, -2);
      const burners = [[-24, -18], [-24, 14], [0, -18], [0, 14], [24, -18], [24, 14]];
      for (const [bx, bz] of burners) {
        cyl(g, solid('#0d0d0d', 0.4), 4.5, 2.5, bx, 88.5, bz, { seg: 20 });
        cyl(g, glow('#ff6a20', 0.9), 2.2, 1.2, bx, 90.4, bz, { seg: 18 });
      }
      return g;
    }
  },
  {
    id: 'kit_fridge', name: 'French-Door Refrigerator', cat: 'kitchen', w: 92, d: 74, h: 186,
    palettes: null, plan: { type: 'appliance', label: 'RF' },
    build: () => {
      const g = G();
      const body = STEEL();
      box(g, body, 92, 182, 70, 0, 2, -1, { r: 2.5 });
      // upper French doors
      box(g, STEEL_D(), 43, 108, 2, -22.5, 70, 34.6, { r: 1 });
      box(g, STEEL_D(), 43, 108, 2, 22.5, 70, 34.6, { r: 1 });
      handleBar(g, -3, 120, 36.6, 90, true);
      handleBar(g, 3, 120, 36.6, 90, true);
      // lower freezer drawer
      box(g, STEEL_D(), 88, 58, 2, 0, 6, 34.6, { r: 1 });
      handleBar(g, 0, 60, 36.6, 44);
      // recessed water/ice dispenser
      box(g, solid('#1a1d20', 0.4), 26, 40, 1.5, -22.5, 118, 35.5);
      box(g, glow('#6fa8c8', 0.4), 22, 8, 0.6, -22.5, 150, 36);
      return g;
    }
  },
  {
    id: 'kit_wall_oven', name: 'Built-in Wall Oven Column', cat: 'kitchen', w: 64, d: 62, h: 210,
    palettes: KIT_PAL, plan: { type: 'appliance', label: 'OV' },
    build: (p) => {
      const g = G();
      box(g, carcass(p), 64, 205, 58, 0, 4, -3, { r: 0.8 }); // surround cabinet
      const body = STEEL();
      // two stacked ovens in the middle of the column
      for (const oy of [70, 128]) {
        box(g, body, 58, 54, 4, 0, oy, 27, { r: 1 });
        box(g, solid(DARKGLASS, 0.15), 46, 34, 2, 0, oy + 8, 29.4, { r: 1 });
        box(g, chrome(), 50, 3.5, 3, 0, oy + 46, 30);        // handle bar
        box(g, solid('#111417', 0.4), 40, 6, 1.5, 0, oy + 46, 29.6); // control strip
      }
      box(g, glow('#ffb060', 0.5), 40, 26, 0.6, 0, 82, 29.2); // lit lower oven
      // warming drawer at the base
      box(g, body, 58, 24, 4, 0, 20, 27, { r: 1 });
      handleBar(g, 0, 40, 30, 40);
      return g;
    }
  },
  {
    id: 'kit_dishwasher', name: 'Dishwasher', cat: 'kitchen', w: 60, d: 62, h: 87,
    palettes: null, plan: { type: 'appliance', label: 'DW' },
    build: () => {
      const g = G();
      box(g, STEEL(), 60, 82, 58, 0, 2, -1, { r: 1 });
      box(g, STEEL_D(), 56, 64, 2, 0, 8, 28.6, { r: 1 });    // door panel
      box(g, chrome(), 52, 3.5, 4, 0, 76, 29.6);             // pocket handle
      box(g, solid('#1a1d20', 0.4), 40, 4, 1.5, 0, 79, 28.9); // control strip
      box(g, glow('#7fd0ff', 0.5), 3, 3, 0.6, -20, 79, 29.2); // status light
      return g;
    }
  },
  {
    id: 'kit_hood', name: 'Over-Range Hood', cat: 'kitchen', w: 82, d: 54, h: 30,
    elevation: 150, mount: 'wall', palettes: null, plan: { type: 'wallCabinet' },
    light: { y: -6, color: '#fff2d0', intensity: 0.7, distance: 220 },
    build: () => {
      const g = G();
      const body = STEEL();
      box(g, body, 82, 14, 54, 0, 16, 0, { r: 1 });          // canopy top
      // sloped stainless apron
      box(g, body, 82, 16, 30, 0, 0, 12, { r: 1, rx: -0.5 });
      box(g, metal('#a8acb0', 0.3), 76, 2, 46, 0, 2, 0);     // baffle underside
      box(g, glow('#fff2d0', 0.6), 30, 0.6, 8, 0, 1.4, 8);   // task light
      box(g, solid('#1a1d20', 0.4), 20, 3, 1.5, 0, 8, 26);   // control buttons
      return g;
    }
  },
  {
    id: 'kit_hood_chimney', name: 'Range Hood Chimney', cat: 'kitchen', w: 60, d: 46, h: 116,
    elevation: 150, mount: 'wall', palettes: null, plan: { type: 'wallCabinet' },
    light: { y: 4, color: '#fff2d0', intensity: 0.7, distance: 220 },
    build: () => {
      const g = G();
      const body = STEEL();
      // wide trapezoid canopy that narrows into a chimney flue
      cyl(g, body, 34, 30, 0, 0, 4, { rTop: 15, seg: 4 }).rotation.y = Math.PI / 4;
      box(g, body, 24, 86, 20, 0, 30, 4, { r: 0.5 });        // flue
      box(g, metal('#a8acb0', 0.3), 56, 2, 40, 0, 0.5, 0);   // baffle underside
      box(g, glow('#fff2d0', 0.6), 26, 0.6, 8, 0, 0, 6);
      return g;
    }
  },
  {
    id: 'kit_microwave', name: 'Countertop Microwave', cat: 'kitchen', w: 52, d: 40, h: 30,
    palettes: null, plan: { type: 'appliance', label: 'MW' },
    build: () => {
      const g = G();
      box(g, STEEL(), 52, 30, 40, 0, 0, 0, { r: 1.5 });
      box(g, solid(DARKGLASS, 0.15), 32, 22, 2, -6, 4, 20.4, { r: 1 }); // window
      box(g, metal('#9ea2a6', 0.3), 26, 16, 0.6, -6, 7, 21);           // mesh tint
      box(g, solid('#1a1d20', 0.5), 12, 24, 1.5, 18, 3, 20.4, { r: 1 }); // keypad
      box(g, glow('#4fe08a', 0.5), 8, 2, 0.4, 18, 21, 21);              // display
      handleBar(g, 8, 15, 21.4, 18, true);
      return g;
    }
  },
  {
    id: 'kit_wine_fridge', name: 'Wine Fridge', cat: 'kitchen', w: 46, d: 60, h: 88,
    palettes: null, plan: { type: 'appliance', label: 'WF' },
    build: () => {
      const g = G();
      box(g, STEEL(), 46, 84, 56, 0, 2, -2, { r: 1 });
      box(g, solid('#0e1a1f', 0.4), 38, 68, 40, 0, 10, 0);   // cool dark interior
      box(g, glow('#6fa8c8', 0.35), 34, 60, 0.6, 0, 14, -18); // interior led
      // slanted bottle racks with bottles
      for (let r = 0; r < 5; r++) {
        const y = 16 + r * 12;
        box(g, metal('#8a8e92', 0.4), 34, 1.5, 36, 0, y, 0);
        for (let b = 0; b < 3; b++) {
          cyl(g, solid(['#3a1f22', '#2a3a24', '#402a1a'][b], 0.5), 3, 30, -11 + b * 11, y + 2, 4, { rx: 1.15, seg: 14 });
        }
      }
      box(g, glass(), 40, 72, 2, 0, 8, 28.6, { r: 1 });      // glass door
      handleBar(g, 16, 44, 30.6, 44, true);
      return g;
    }
  },
  {
    id: 'kit_coffee_station', name: 'Espresso Station', cat: 'kitchen', w: 90, d: 58, h: 140,
    palettes: KIT_PAL, plan: { type: 'counter' },
    build: (p) => {
      const g = G();
      box(g, solid(KICK, 0.85), 84, 9, 50, 0, 0, -3);
      box(g, carcass(p), 90, 77, 54, 0, 9, -3, { r: 0.8 });  // lower cabinet
      shakerDoor(g, p, 42, 66, -22, 14, 25.5, -1);
      shakerDoor(g, p, 42, 66, 22, 14, 25.5, 1);
      box(g, tex(p.top, 0.7, 0.5), 90, 4.5, 58, 0, 87, 0, { r: 0.6 }); // stone counter
      // open upper shelf niche
      box(g, carcass(p), 90, 6, 24, 0, 132, -14);
      box(g, tex('tile_subway', 1.2, 0.6), 90, 40, 1.5, 0, 92, -28); // tiled niche back
      // chrome espresso machine on the counter
      box(g, metal('#d0d4d8', 0.25), 40, 34, 40, -18, 91.5, -2, { r: 2 });
      box(g, solid('#17191c', 0.3), 30, 16, 6, -18, 100, 18);
      cyl(g, chrome(), 2, 10, -30, 96, 14, { rx: 0.4 });      // portafilter
      cyl(g, solid('#2a2c2e', 0.4), 3, 4, -30, 92, 14);       // cup under group
      box(g, glow('#ff5a3a', 0.5), 3, 3, 0.6, -6, 118, 20);   // power light
      // grinder + mugs
      cyl(g, metal('#9a9ea2', 0.3), 6, 26, 20, 91.5, -4, { seg: 20 });
      cyl(g, solid('#1c1e20', 0.4), 5, 8, 20, 117, -4);
      for (const cx of [10, 22, 34]) cyl(g, solid('#e7e3da', 0.6), 4, 7, cx, 91.5, 22);
      return g;
    }
  },

  // ============================ SINKS ============================
  {
    id: 'kit_farm_sink', name: 'Farmhouse Apron Sink', cat: 'kitchen', w: 84, d: 62, h: 91,
    palettes: KIT_PAL, plan: { type: 'sink' },
    build: (p) => {
      const g = G();
      box(g, solid(KICK, 0.85), 78, 9, 54, 0, 0, -3);
      box(g, carcass(p), 84, 77, 58, 0, 9, -3, { r: 0.8 });
      // exposed white fireclay apron front
      const fire = solid('#f2efe9', 0.35);
      box(g, fire, 66, 46, 6, 0, 40, 28, { r: 2 });
      box(g, door(p), 84, 30, 1.4, 0, 10, 28.5);             // door below apron
      handleBar(g, 0, 32, 29.6, 20);
      // stone counter wraps around the exposed basin
      box(g, tex(p.top, 0.9, 0.6), 84, 4.5, 62, 0, 87, -8, { r: 0.6 });
      box(g, tex(p.top, 0.9, 0.2), 84, 9, 3, 0, 91.5, -29.5);
      // deep single basin
      box(g, fire, 60, 30, 40, 0, 56, 6);
      box(g, solid('#e6e3dc', 0.4), 54, 24, 34, 0, 62, 6);   // hollow
      // tall gooseneck faucet
      cyl(g, chrome(), 2, 30, -22, 91, -18);
      cyl(g, chrome(), 1.8, 20, -22, 121, -10, { rx: Math.PI / 2 });
      cyl(g, chrome(), 1.5, 8, -22, 121, 0, { rx: 0 });
      cyl(g, chrome(), 1.4, 12, -10, 91, -18);               // side sprayer/handle
      return g;
    }
  },
  {
    id: 'kit_sink_cab', name: 'Undermount Sink Cabinet', cat: 'kitchen', w: 90, d: 62, h: 91,
    palettes: KIT_PAL, plan: { type: 'sink' },
    build: (p) => {
      const g = G();
      box(g, solid(KICK, 0.85), 84, 9, 54, 0, 0, -3);
      box(g, carcass(p), 90, 77, 58, 0, 9, -3, { r: 0.8 });
      shakerDoor(g, p, 42, 66, -22, 14, 27.5, -1);
      shakerDoor(g, p, 42, 66, 22, 14, 27.5, 1);
      // stone counter with undermount cutout implied by basin below top
      box(g, tex(p.top, 1.0, 0.6), 90, 4.5, 62, 0, 87, 0, { r: 0.6 });
      box(g, tex(p.top, 1.0, 0.2), 90, 9, 3, 0, 91.5, -29.5);
      // stainless undermount basin (top rim just under counter)
      box(g, metal('#c4c8cc', 0.25), 52, 3, 40, 0, 86, 2);
      box(g, metal('#9aa0a6', 0.3), 46, 16, 34, 0, 71, 2);
      box(g, metal('#9aa0a6', 0.3), 44, 14, 32, 0, 73, 2);   // hollow inner
      // single-lever chrome faucet
      cyl(g, chrome(), 1.7, 26, 0, 91, -16);
      cyl(g, chrome(), 1.5, 18, 0, 115, -8, { rx: Math.PI / 2 });
      cyl(g, chrome(), 1.3, 5, 0, 113, 0);
      box(g, chrome(), 3, 6, 2, 12, 92, -16, { r: 1 });      // lever handle
      return g;
    }
  },

  // ========================= FREESTANDING =========================
  {
    id: 'kit_butcher_cart', name: 'Butcher-Block Cart', cat: 'kitchen', w: 90, d: 54, h: 88,
    palettes: null, plan: { type: 'storage' },
    build: () => {
      const g = G();
      const frame = metal('#8e9296', 0.35);
      // four steel legs on casters
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        cyl(g, frame, 2, 78, sx * 40, 6, sz * 22);
        sphere(g, solid('#1c1e20', 0.4), 3.5, sx * 40, 4, sz * 22);
      }
      // lower slatted shelf
      box(g, wood('#7a5c3c', 0.5), 82, 3, 44, 0, 22, 0, { r: 0.5 });
      // stainless towel bar on the end
      cyl(g, chrome(), 1, 44, 46, 60, 0, { rz: Math.PI / 2 });
      // thick end-grain butcher block top
      box(g, tex('real_strip_oak', 1.2, 0.8), 90, 10, 54, 0, 78, 0, { r: 1 });
      // a knife block + cutting detail on top
      box(g, wood('#5f4632', 0.5), 14, 16, 10, 30, 88, -12, { r: 1, rz: -0.15 });
      cyl(g, solid('#e7e3da', 0.5), 10, 3, -24, 88, 6, { seg: 24 });
      return g;
    }
  },
  {
    id: 'kit_bar_stool', name: 'Counter Bar Stool', cat: 'kitchen', w: 42, d: 42, h: 92,
    palettes: KIT_PAL, plan: { type: 'stool' },
    build: (p) => {
      const g = G();
      const legmat = p.grain ? wood(p.cab, 0.5) : metal('#3a3d40', 0.4);
      // upholstered saddle seat
      cyl(g, solid(p.grain ? '#6b533b' : p.cab, 0.6), 18, 6, 0, 76, 0, { seg: 30 });
      box(g, solid(p.grain ? '#6b533b' : p.cab, 0.6), 34, 22, 6, 0, 82, -15, { r: 3 }); // low back
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const leg = cyl(g, legmat, 1.6, 78, Math.cos(a) * 14, 0, Math.sin(a) * 14);
        leg.rotation.z = Math.cos(a) * 0.1; leg.rotation.x = -Math.sin(a) * 0.1;
      }
      cyl(g, metal('#8e9296', 0.4), 13, 1.4, 0, 26, 0, { seg: 26 }); // footrest ring
      return g;
    }
  },

  // ======================= WALL FINISH =======================
  {
    id: 'kit_backsplash', name: 'Backsplash Panel', cat: 'kitchen', w: 120, d: 4, h: 60,
    elevation: 92, mount: 'wall', palettes: [
      { name: 'Subway Tile', chip: '#e9e6df', tile: 'tile_subway' },
      { name: 'White Tile', chip: '#f0efe9', tile: 'real_white_tile' },
      { name: 'Blue Mosaic', chip: '#4a6a8c', tile: 'real_mosaic_blue' },
      { name: 'Marble Slab', chip: '#e6e4de', tile: 'real_marble' }
    ], plan: { type: 'box' },
    build: (p) => {
      const g = G();
      box(g, tex(p.tile, 2.4, 1.2), 120, 60, 4, 0, 0, 0, { r: 0.4 });
      box(g, solid('#d8d4cc', 0.4), 120, 2, 5, 0, 60, 0);    // top trim
      return g;
    }
  }
];
