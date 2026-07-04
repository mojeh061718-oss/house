// Preset home shells ("stamps"): one tap lays down a complete structure —
// walls, openings, roofs, exterior finish and named rooms — that can then
// be edited like anything drawn by hand. Coordinates are shell-local cm.
import { ITEM_MAP } from '../catalog/items.js';
import { pointInPolygon } from './geometry.js';

const EXT = 20;  // exterior wall thickness
const INT = 12;  // interior wall thickness

export const SHELLS = [
  {
    id: 'barndo_open',
    name: 'Barndominium 40×60',
    desc: 'Open great room, two beds, bath & utility, metal gable roof',
    size: [1830, 1220],
    build(api) {
      api.settings({ wallHeight: 300, exteriorWall: 'bb_black' });
      const n = api.wall(0, 0, 1830, 0, EXT);
      const e = api.wall(1830, 0, 1830, 1220, EXT);
      const s = api.wall(1830, 1220, 0, 1220, EXT);
      const w = api.wall(0, 1220, 0, 0, EXT);
      const spine = api.wall(1220, 0, 1220, 1220, INT);
      api.wall(1220, 440, 1830, 440, INT);
      api.wall(1220, 800, 1830, 800, INT);
      api.wall(1520, 440, 1520, 800, INT);
      // front: entry + picture windows; gable end gets the barn slider
      api.opening(s, 'door', 0.667, { width: 110 });
      api.opening(s, 'window', 0.85, { width: 220 });
      api.opening(s, 'window', 0.45, { width: 220 });
      api.opening(s, 'window', 0.17, { width: 160 });
      api.opening(w, 'slidingDoor', 0.5, { width: 360, height: 260 });
      api.opening(n, 'window', 0.15, { width: 180 });
      api.opening(n, 'window', 0.4, { width: 180 });
      api.opening(n, 'window', 0.83, { width: 160 });
      api.opening(e, 'window', 0.2, { width: 140 });
      api.opening(e, 'window', 0.8, { width: 140 });
      api.opening(spine, 'door', 0.18);
      api.opening(spine, 'doorway', 0.51, { width: 100 });
      api.opening(spine, 'door', 0.83);
      api.room(600, 600, 'Great Room', 'wide_oak');
      api.room(1520, 220, 'Main Bedroom', 'carpet_beige');
      api.room(1370, 620, 'Bath', 'tile_white', 'tile_bath');
      api.room(1670, 620, 'Utility', 'concrete_floor');
      api.room(1520, 1010, 'Bedroom 2', 'carpet_gray');
      api.item('roof_gable', 915, 610, 0, { w: 1990, d: 1420, h: 330, elevation: 300, palette: 4 });
      api.item('patio', 610, 1350, 0, { w: 520, d: 220 });
      api.item('flower_bed', 1000, 1330);
      api.item('lamp_post', 300, 1330);
    }
  },
  {
    id: 'barndo_compact',
    name: 'Barndominium 30×40',
    desc: 'Compact metal-shell home: open living, bedroom, bath, utility',
    size: [1220, 915],
    build(api) {
      api.settings({ wallHeight: 300, exteriorWall: 'bb_black' });
      const n = api.wall(0, 0, 1220, 0, EXT);
      const e = api.wall(1220, 0, 1220, 915, EXT);
      const s = api.wall(1220, 915, 0, 915, EXT);
      const w = api.wall(0, 915, 0, 0, EXT);
      const spine = api.wall(760, 0, 760, 915, INT);
      api.wall(760, 460, 1220, 460, INT);
      api.wall(990, 460, 990, 915, INT);
      api.opening(s, 'door', 0.69, { width: 100 });
      api.opening(s, 'window', 0.87, { width: 200 });
      api.opening(w, 'slidingDoor', 0.5, { width: 300, height: 260 });
      api.opening(n, 'window', 0.25, { width: 200 });
      api.opening(n, 'window', 0.75, { width: 150 });
      api.opening(e, 'window', 0.25, { width: 130 });
      api.opening(spine, 'door', 0.25);
      api.opening(spine, 'door', 0.75);
      api.wallDoor(990, 460, 915, 0.5); // bath→utility via helper below
      api.room(380, 460, 'Great Room', 'honey_pine');
      api.room(990, 230, 'Bedroom', 'carpet_beige');
      api.room(875, 690, 'Bath', 'tile_white', 'tile_bath');
      api.room(1105, 690, 'Utility', 'concrete_floor');
      api.item('roof_gable', 610, 457, 0, { w: 1360, d: 1100, h: 280, elevation: 300, palette: 4 });
      api.item('patio', 840, 1030, 0, { w: 380, d: 180 });
    }
  },
  {
    id: 'barndo_porch',
    name: 'Barndominium + Porch',
    desc: 'Timber-roof barndo with a full-width covered front porch',
    size: [1525, 1300],
    build(api) {
      api.settings({ wallHeight: 300, exteriorWall: 'siding_gray' });
      const n = api.wall(0, 0, 1525, 0, EXT);
      const e = api.wall(1525, 0, 1525, 1000, EXT);
      const s = api.wall(1525, 1000, 0, 1000, EXT);
      const w = api.wall(0, 1000, 0, 0, EXT);
      const spine = api.wall(1015, 0, 1015, 1000, INT);
      api.wall(1015, 500, 1525, 500, INT);
      api.opening(s, 'door', 0.67, { width: 110 });
      api.opening(s, 'window', 0.86, { width: 200 });
      api.opening(s, 'window', 0.45, { width: 200 });
      api.opening(s, 'window', 0.15, { width: 160 });
      api.opening(w, 'slidingDoor', 0.5, { width: 320, height: 260 });
      api.opening(n, 'window', 0.3, { width: 200 });
      api.opening(n, 'window', 0.8, { width: 160 });
      api.opening(spine, 'door', 0.25);
      api.opening(spine, 'door', 0.75);
      api.room(500, 500, 'Great Room', 'hickory');
      api.room(1270, 250, 'Bedroom', 'carpet_beige');
      api.room(1270, 750, 'Bath & Laundry', 'tile_beige', 'tile_bath');
      api.item('roof_gable', 762, 500, 0, { w: 1665, d: 1200, h: 310, elevation: 300, palette: 1 });
      api.item('patio', 762, 1140, 0, { w: 1525, d: 260 });
      api.item('pergola', 762, 1140, 0, { w: 1545, d: 280, h: 250, palette: 1 });
      api.item('bench_outdoor', 380, 1150, 0, { palette: 1 });
      api.item('flower_bed', 1180, 1150);
    }
  },
  {
    id: 'container_single',
    name: 'Container Home 40 ft',
    desc: 'Single high-cube container: open studio + bath, corrugated steel',
    size: [1220, 244],
    build(api) {
      api.settings({ wallHeight: 260, exteriorWall: 'corrugated_gray' });
      const n = api.wall(0, 0, 1220, 0, 8);
      const e = api.wall(1220, 0, 1220, 244, 8);
      const s = api.wall(1220, 244, 0, 244, 8);
      const w = api.wall(0, 244, 0, 0, 8);
      const part = api.wall(920, 0, 920, 244, 8);
      api.opening(s, 'door', 0.85, { width: 90 });
      api.opening(s, 'window', 0.55, { width: 180 });
      api.opening(s, 'window', 0.3, { width: 180 });
      api.opening(w, 'slidingDoor', 0.5, { width: 200, height: 220 });
      api.opening(n, 'window', 0.5, { width: 160 });
      api.opening(part, 'door', 0.5, { width: 80 });
      api.room(460, 122, 'Studio', 'whitewash');
      api.room(1070, 122, 'Bath', 'tile_white', 'tile_bath');
      api.item('roof_flat', 610, 122, 0, { w: 1300, d: 330, h: 30, elevation: 260 });
      api.item('patio', 610, 360, 0, { w: 600, d: 180 });
    }
  },
  {
    id: 'container_double',
    name: 'Container Home ×2',
    desc: 'Two joined 40 ft containers: living, bedroom and bath',
    size: [1220, 488],
    build(api) {
      api.settings({ wallHeight: 260, exteriorWall: 'corrugated_white' });
      const n = api.wall(0, 0, 1220, 0, 8);
      const e = api.wall(1220, 0, 1220, 488, 8);
      const s = api.wall(1220, 488, 0, 488, 8);
      const w = api.wall(0, 488, 0, 0, 8);
      const part = api.wall(920, 0, 920, 488, 8);
      api.wall(920, 244, 1220, 244, 8);
      api.opening(s, 'door', 0.8, { width: 90 });
      api.opening(s, 'window', 0.5, { width: 200 });
      api.opening(s, 'window', 0.22, { width: 200 });
      api.opening(w, 'slidingDoor', 0.5, { width: 260, height: 220 });
      api.opening(n, 'window', 0.35, { width: 180 });
      api.opening(n, 'window', 0.85, { width: 140 });
      api.opening(part, 'door', 0.25, { width: 84 });
      api.opening(part, 'door', 0.75, { width: 84 });
      api.room(460, 244, 'Living', 'wide_oak');
      api.room(1070, 122, 'Bath', 'tile_white', 'tile_bath');
      api.room(1070, 366, 'Bedroom', 'carpet_gray');
      api.item('roof_flat', 610, 244, 0, { w: 1300, d: 570, h: 30, elevation: 260 });
      api.item('patio', 500, 620, 0, { w: 700, d: 200 });
      api.item('planter_box', 940, 600);
    }
  },
  {
    id: 'container_l',
    name: 'Container Home L',
    desc: 'Two 40 ft containers at 90\u00b0 — living wing + bedroom wing around a corner patio',
    size: [1220, 1220],
    build(api) {
      api.settings({ wallHeight: 260, exteriorWall: 'real_corrugated' });
      // wing A: east-west living container along the top
      const an = api.wall(0, 0, 1220, 0, 8);
      const ae = api.wall(1220, 0, 1220, 244, 8);
      const as = api.wall(1220, 244, 244, 244, 8);
      const aw = api.wall(0, 0, 0, 244, 8);
      // wing B: north-south bedroom container down the left
      const bw = api.wall(0, 244, 0, 1220, 8);
      const bs = api.wall(0, 1220, 244, 1220, 8);
      const be = api.wall(244, 244, 244, 1220, 8);
      api.wall(0, 244, 244, 244, 8);
      const bpart = api.wall(0, 830, 244, 830, 8);
      // living wing: glass to the patio + kitchen window
      api.opening(as, 'slidingDoor', 0.3, { width: 260, height: 220 });
      api.opening(as, 'window', 0.72, { width: 200, height: 140, sill: 80 });
      api.opening(an, 'window', 0.2, { width: 180 });
      api.opening(an, 'window', 0.6, { width: 180 });
      api.opening(ae, 'window', 0.5, { width: 140 });
      // bedroom wing: entry door + windows
      api.opening(be, 'door', 0.12, { width: 90 });
      api.opening(be, 'slidingDoor', 0.62, { width: 200, height: 210 });
      api.opening(bw, 'window', 0.3, { width: 160 });
      api.opening(bw, 'window', 0.75, { width: 160 });
      api.opening(bs, 'window', 0.5, { width: 140 });
      api.opening(bpart, 'door', 0.5, { width: 84 });
      api.room(610, 122, 'Living + Kitchen', 'real_caramel_plank');
      api.room(122, 540, 'Bedroom', 'real_carpet_oat');
      api.room(122, 1025, 'Bath & Laundry', 'real_white_tile', 'tile_bath');
      api.item('roof_flat', 610, 122, 0, { w: 1300, d: 330, h: 30, elevation: 260 });
      api.item('roof_flat', 122, 732, 0, { w: 330, d: 1060, h: 30, elevation: 260.6 });
      // the sheltered corner becomes the patio
      api.item('patio', 620, 620, 0, { w: 640, d: 640 });
      api.item('patio_set', 620, 620, 0);
      api.item('planter_box', 950, 380);
      api.item('tree_birch', 1080, 900);
    }
  },
  {
    id: 'container_stack',
    name: 'Container Stack + Roof Deck',
    desc: 'Two containers down, one stacked up top with a railed roof deck',
    size: [1220, 488],
    build(api) {
      api.settings({ wallHeight: 260, exteriorWall: 'real_corrugated' });
      const n = api.wall(0, 0, 1220, 0, 8);
      const e = api.wall(1220, 0, 1220, 488, 8);
      const s = api.wall(1220, 488, 0, 488, 8);
      const w = api.wall(0, 488, 0, 0, 8);
      const mid = api.wall(0, 244, 1220, 244, 8);
      const part = api.wall(760, 244, 760, 488, 8);
      api.opening(s, 'slidingDoor', 0.25, { width: 260, height: 220 });
      api.opening(s, 'door', 0.62, { width: 90 });
      api.opening(s, 'window', 0.85, { width: 160 });
      api.opening(n, 'window', 0.2, { width: 200 });
      api.opening(n, 'window', 0.55, { width: 200 });
      api.opening(n, 'window', 0.85, { width: 140 });
      api.opening(w, 'window', 0.5, { width: 150 });
      api.opening(mid, 'doorway', 0.3, { width: 110 });
      api.opening(mid, 'door', 0.8, { width: 84 });
      api.opening(part, 'door', 0.5, { width: 84 });
      api.item('stairs', 1100, 122, Math.PI / 2, {});
      api.room(500, 122, 'Kitchen + Dining', 'real_honey_strip');
      api.room(380, 366, 'Living', 'real_caramel_plank');
      api.room(990, 366, 'Bath', 'real_white_tile', 'tile_bath');
      api.item('planter_box', -80, 560);
      api.item('tree_oak', 1400, 620);
    },
    // upper container sits over the back row; the front row becomes a deck
    build2(api) {
      const n = api.wall(0, 0, 1220, 0, 8);
      const e = api.wall(1220, 0, 1220, 244, 8);
      const s = api.wall(1220, 244, 0, 244, 8);
      const w = api.wall(0, 244, 0, 0, 8);
      const part = api.wall(820, 0, 820, 244, 8);
      api.opening(s, 'slidingDoor', 0.35, { width: 240, height: 210 });
      api.opening(s, 'window', 0.8, { width: 160, height: 120, sill: 85 });
      api.opening(n, 'window', 0.3, { width: 180 });
      api.opening(n, 'window', 0.75, { width: 160 });
      api.opening(w, 'window', 0.5, { width: 140 });
      api.opening(part, 'door', 0.5, { width: 84 });
      api.room(400, 122, 'Main Suite', 'real_carpet_oat');
      api.room(1020, 122, 'En-suite', 'real_white_tile', 'tile_bath');
      api.item('roof_flat', 610, 122, 0, { w: 1290, d: 320, h: 26, elevation: 260 });
      // roof deck over the front container
      api.item('patio', 550, 366, 0, { w: 1060, d: 230 });
      api.item('glass_rail', 550, 470, 0, { w: 1080, d: 10, h: 105 });
      api.item('glass_rail', 30, 366, Math.PI / 2, { w: 220, d: 10, h: 105 });
      api.item('glass_rail', 1070, 366, Math.PI / 2, { w: 220, d: 10, h: 105 });
      api.item('patio_set', 350, 370, 0);
      api.item('planter_box', 900, 380);
    }
  },
  {
    id: 'container_court',
    name: 'Container Courtyard',
    desc: 'Three containers wrap a private central courtyard, U-shaped',
    size: [1220, 976],
    build(api) {
      api.settings({ wallHeight: 260, exteriorWall: 'real_corrugated' });
      // back container spans the full width
      const bn = api.wall(0, 0, 1220, 0, 8);
      const bs = api.wall(0, 244, 1220, 244, 8);
      const bw = api.wall(0, 0, 0, 244, 8);
      const be = api.wall(1220, 0, 1220, 244, 8);
      api.wall(690, 0, 690, 244, 8);
      const bpart = api.wall(940, 0, 940, 244, 8);
      // left wing
      const lw = api.wall(0, 244, 0, 976, 8);
      const le = api.wall(244, 244, 244, 976, 8);
      const ls = api.wall(0, 976, 244, 976, 8);
      // right wing
      const rw = api.wall(976, 244, 976, 976, 8);
      const re = api.wall(1220, 244, 1220, 976, 8);
      const rs = api.wall(976, 976, 1220, 976, 8);
      // openings: every room opens to the courtyard
      api.opening(bs, 'slidingDoor', 0.28, { width: 240, height: 215 });
      api.opening(bs, 'window', 0.62, { width: 160, height: 130, sill: 85 });
      api.opening(le, 'slidingDoor', 0.4, { width: 220, height: 215 });
      api.opening(rw, 'slidingDoor', 0.4, { width: 220, height: 215 });
      api.opening(ls, 'door', 0.5, { width: 90 });
      api.opening(bn, 'window', 0.18, { width: 180 });
      api.opening(bn, 'window', 0.45, { width: 180 });
      api.opening(bn, 'window', 0.85, { width: 140 });
      api.opening(lw, 'window', 0.4, { width: 160 });
      api.opening(re, 'window', 0.4, { width: 160 });
      api.opening(bpart, 'door', 0.5, { width: 84 });
      api.room(345, 122, 'Kitchen + Dining', 'real_honey_strip');
      api.room(815, 122, 'Pantry', 'concrete_floor');
      api.room(1080, 122, 'Bath', 'real_white_tile', 'tile_bath');
      api.room(122, 610, 'Living', 'real_caramel_plank');
      api.room(1098, 610, 'Bedroom', 'real_carpet_oat');
      api.item('roof_flat', 610, 122, 0, { w: 1300, d: 330, h: 30, elevation: 260 });
      api.item('roof_flat', 122, 610, 0, { w: 330, d: 820, h: 30, elevation: 260.6 });
      api.item('roof_flat', 1098, 610, 0, { w: 330, d: 820, h: 30, elevation: 261.2 });
      // courtyard: deck, dining set, greenery
      api.item('patio', 610, 640, 0, { w: 700, d: 720 });
      api.item('patio_set', 610, 700, 0);
      api.item('planter_box', 400, 360);
      api.item('planter_box', 820, 360);
      api.item('bush_cloud', 350, 900);
      api.item('tree_birch', 880, 920);
    }
  },
  {
    id: 'hill_home',
    name: 'Hillside Home',
    desc: 'Earth-sheltered house tucked into a grass hill, glass front',
    size: [1000, 800],
    build(api) {
      api.settings({ wallHeight: 260, exteriorWall: 'stucco_warm' });
      const n = api.wall(0, 0, 1000, 0, 24);
      const e = api.wall(1000, 0, 1000, 800, 24);
      const s = api.wall(1000, 800, 0, 800, 24);
      const w = api.wall(0, 800, 0, 0, 24);
      const spine = api.wall(620, 0, 620, 800, INT);
      api.wall(620, 400, 1000, 400, INT);
      api.wall(620, 600, 1000, 600, INT);
      // all glass on the exposed south face
      api.opening(s, 'slidingDoor', 0.75, { width: 240, height: 230 });
      api.opening(s, 'window', 0.45, { width: 260, height: 200, sill: 40 });
      api.opening(s, 'window', 0.12, { width: 180, height: 200, sill: 40 });
      api.opening(spine, 'door', 0.25);
      api.opening(spine, 'doorway', 0.62, { width: 100 });
      api.opening(spine, 'door', 0.875);
      api.room(310, 400, 'Living', 'concrete_floor');
      api.room(810, 200, 'Bedroom', 'carpet_beige');
      api.room(810, 500, 'Bath', 'tile_white', 'tile_bath');
      api.room(810, 700, 'Pantry', 'concrete_floor');
      api.item('roof_flat', 500, 400, 0, { w: 1080, d: 880, h: 30, elevation: 260 });
      // the hill swallows the back half of the house
      api.item('hill_mound', 500, 60, 0, { w: 2000, d: 1150, h: 400 });
      api.item('hill_mound', 1250, 300, 0, { w: 900, d: 600, h: 230 });
      api.item('patio', 500, 940, 0, { w: 700, d: 220 });
      api.item('flower_bed', 950, 920);
      api.item('tree_oak', -180, 920);
    }
  }
];

/** Stamp a shell into the project at (ox, oy). Returns the created walls. */
export function stampShell(store, shell, ox, oy) {
  store.checkpoint();
  const rooms = [];
  const walls = [];
  const api = {
    wall(ax, ay, bx, by, t) {
      const w = store.addWall(ax + ox, ay + oy, bx + ox, by + oy, t);
      walls.push(w);
      return w;
    },
    // door on the wall that runs from (x,y1) to (x,y2) — convenience for
    // partitions created inline without keeping a reference
    wallDoor(x, y1, y2, t) {
      const w = walls.find(wl =>
        Math.abs(wl.ax - (x + ox)) < 1 && Math.abs(wl.bx - (x + ox)) < 1);
      if (w) store.addOpening(w.id, 'door', t);
    },
    opening(wall, type, t, opts = {}) {
      const o = store.addOpening(wall.id, type, t, opts);
      if (opts.height) o.height = opts.height;
      if (opts.sill !== undefined) o.sill = opts.sill;
      return o;
    },
    item(defId, x, y, rot = 0, extra = {}) {
      const def = ITEM_MAP.get(defId);
      if (!def) return null;
      const it = store.addItem(defId, x + ox, y + oy, rot, def);
      Object.assign(it, extra);
      return it;
    },
    room(x, y, name, floor, wallMat) {
      rooms.push({ x: x + ox, y: y + oy, name, floor, wall: wallMat });
    },
    settings(s) {
      Object.assign(store.project.settings, s);
      // wall height applies to the stamped walls too
      if (s.wallHeight) for (const w of walls) w.height = s.wallHeight;
    }
  };
  const finishLevel = () => {
    for (const w of walls) {
      if (store.project.settings.wallHeight) w.height = store.project.settings.wallHeight;
    }
    store.commit(true);
    for (const rm of rooms) {
      const room = store.rooms.find(r => pointInPolygon(rm.x, rm.y, r.polygon));
      if (!room) continue;
      const style = store.roomStyle(room.key);
      style.name = rm.name;
      if (rm.floor) style.floor = rm.floor;
      if (rm.wall) style.wall = rm.wall;
    }
    store.commit(false);
  };

  shell.build(api);
  finishLevel();

  // two-storey shells: stamp the upper floor, then come back down
  if (shell.build2) {
    const base = store.project.activeLevel;
    if (store.project.levels.length <= base + 1) store.addLevel();
    else store.setActiveLevel(base + 1, false);
    walls.length = 0;
    rooms.length = 0;
    shell.build2(api);
    finishLevel();
    store.setActiveLevel(base, false);
    store.commit(true);
  }
}

/** Small plan preview of a shell for the catalog card. */
export function drawShellPreview(canvas, shell, size = 120) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.fillStyle = '#f2f3f5';
  ctx.fillRect(0, 0, size, size);
  const segs = [];
  const api = {
    wall(ax, ay, bx, by, t) { const w = { ax, ay, bx, by, t: t || 12 }; segs.push(w); return w; },
    wallDoor() {}, opening() {}, item() {}, room() {}, settings() {}
  };
  shell.build(api);
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  for (const sg of segs) {
    minX = Math.min(minX, sg.ax, sg.bx); maxX = Math.max(maxX, sg.ax, sg.bx);
    minY = Math.min(minY, sg.ay, sg.by); maxY = Math.max(maxY, sg.ay, sg.by);
  }
  const pad = 12;
  const sc = Math.min((size - pad * 2) / (maxX - minX), (size - pad * 2) / (maxY - minY));
  const offx = (size - (maxX - minX) * sc) / 2 - minX * sc;
  const offy = (size - (maxY - minY) * sc) / 2 - minY * sc;
  ctx.strokeStyle = '#3d4148';
  ctx.lineCap = 'square';
  for (const sg of segs) {
    ctx.lineWidth = Math.max(1.6, sg.t * sc);
    ctx.beginPath();
    ctx.moveTo(sg.ax * sc + offx, sg.ay * sc + offy);
    ctx.lineTo(sg.bx * sc + offx, sg.by * sc + offy);
    ctx.stroke();
  }
}
