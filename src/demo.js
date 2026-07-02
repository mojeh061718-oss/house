// Sample projects: a furnished one-bedroom apartment and a luxury mansion,
// available as templates from the home screen.
import { emptyProject, DEFAULTS } from './core/state.js';
import { ITEM_MAP } from './catalog/items.js';
import { uid, detectRooms, roomKey, pointInPolygon } from './core/geometry.js';

const T_EXT = DEFAULTS.exteriorThickness;
const T_INT = DEFAULTS.wallThickness;

/** Build a project skeleton with helpers shared by the templates. */
function projectBuilder(name) {
  const p = emptyProject(name);
  let wallN = 0, itemN = 0, openN = 0;
  const api = {
    p,
    wall(ax, ay, bx, by, thickness = T_EXT) {
      const w = { id: `t_w${wallN++}`, ax, ay, bx, by, thickness, height: p.settings.wallHeight };
      p.walls.push(w);
      return w;
    },
    opening(w, type, t, opts = {}) {
      const isDoor = type !== 'window';
      p.openings.push({
        id: `t_o${openN++}`, wallId: w.id, type, t,
        width: opts.width ?? (isDoor ? DEFAULTS.doorWidth : DEFAULTS.windowWidth),
        height: opts.height ?? (isDoor ? DEFAULTS.doorHeight : DEFAULTS.windowHeight),
        sill: isDoor ? 0 : (opts.sill ?? DEFAULTS.windowSill),
        flip: opts.flip ?? false,
        swing: opts.swing ?? false
      });
    },
    item(defId, x, y, rotation = 0, extra = {}) {
      const def = ITEM_MAP.get(defId);
      p.items.push({
        id: `t_i${itemN++}`, defId, x, y, rotation,
        w: def.w, d: def.d, h: def.h,
        elevation: def.elevation ?? 0,
        palette: def.palettes ? 0 : undefined,
        ...extra
      });
    },
    /** Assign room names/materials by which labelled region the centroid falls in. */
    styleRooms(regions) {
      const rooms = detectRooms(p.walls);
      for (const r of rooms) {
        for (const reg of regions) {
          if (pointInPolygon(r.centroid.x, r.centroid.y, [
            { x: reg.x1, y: reg.y1 }, { x: reg.x2, y: reg.y1 },
            { x: reg.x2, y: reg.y2 }, { x: reg.x1, y: reg.y2 }
          ])) {
            p.roomStyles[roomKey(r)] = { name: reg.name, floor: reg.floor, wall: reg.wallMat };
            break;
          }
        }
      }
    },
    finish() {
      const suffix = uid('').slice(3);
      for (const arr of [p.walls, p.openings, p.items]) {
        for (const e of arr) e.id += suffix;
      }
      for (const o of p.openings) o.wallId += suffix;
      return p;
    }
  };
  return api;
}

export function demoProject() {
  const p = emptyProject('Riverside Apartment');
  let wallN = 0, itemN = 0, openN = 0;

  const wall = (ax, ay, bx, by, thickness = T_EXT) => {
    const w = { id: `demo_w${wallN++}`, ax, ay, bx, by, thickness, height: p.settings.wallHeight };
    p.walls.push(w);
    return w;
  };
  const opening = (w, type, t, opts = {}) => {
    const isDoor = type !== 'window';
    p.openings.push({
      id: `demo_o${openN++}`, wallId: w.id, type, t,
      width: opts.width ?? (isDoor ? DEFAULTS.doorWidth : DEFAULTS.windowWidth),
      height: opts.height ?? (isDoor ? DEFAULTS.doorHeight : DEFAULTS.windowHeight),
      sill: isDoor ? 0 : (opts.sill ?? DEFAULTS.windowSill),
      flip: opts.flip ?? false,
      swing: opts.swing ?? false
    });
  };
  const item = (defId, x, y, rotation = 0, extra = {}) => {
    const def = ITEM_MAP.get(defId);
    p.items.push({
      id: `demo_i${itemN++}`, defId, x, y, rotation,
      w: def.w, d: def.d, h: def.h,
      elevation: def.elevation ?? 0,
      palette: def.palettes ? 0 : undefined,
      ...extra
    });
  };

  // ---- shell: 9.4 m x 6.6 m ----
  const top = wall(0, 0, 940, 0);
  const right = wall(940, 0, 940, 660);
  const bottom = wall(940, 660, 0, 660);
  const left = wall(0, 660, 0, 0);
  const divider = wall(560, 0, 560, 660, T_INT);   // living | bedroom+bath
  wall(560, 400, 940, 400, T_INT);                  // bedroom | bathroom

  // entry + interior doors
  opening(bottom, 'door', (940 - 470) / 940, { width: 100, swing: true });
  opening(divider, 'door', 200 / 660, { flip: true });   // bedroom
  opening(divider, 'door', 530 / 660, { width: 80 });    // bathroom
  // windows
  opening(top, 'window', 180 / 940, { width: 150 });
  opening(top, 'window', 430 / 940, { width: 130 });
  opening(top, 'window', 750 / 940, { width: 150 });
  opening(right, 'window', 180 / 660, { width: 140 });
  opening(right, 'window', 530 / 660, { width: 70, sill: 130, height: 90 });
  opening(left, 'window', (660 - 300) / 660, { width: 120, sill: 110, height: 110 });

  // ---- room styles (keys derived from room centroids) ----
  p.roomStyles = {
    'r_7_8': { name: 'Living · Kitchen', floor: 'oak', wall: 'paint_warmwhite' },
    'r_19_5': { name: 'Bedroom', floor: 'carpet_beige', wall: 'paint_sage' },
    'r_19_13': { name: 'Bathroom', floor: 'tile_gray', wall: 'tile_bath' }
  };

  const R = Math.PI / 2;

  // ---- kitchen along the left wall ----
  item('fridge', 52, 95, -R);
  item('counter', 52, 165, -R);
  item('stove', 52, 228, -R);
  item('counter_sink', 52, 300, -R);
  item('dishwasher', 52, 363, -R);
  item('counter', 52, 426, -R);
  item('hood', 36, 228, -R);
  item('wall_cabinet', 30, 150, -R);
  item('wall_cabinet', 30, 390, -R);
  item('island', 200, 255, R);
  item('bar_stool', 275, 215, R);
  item('bar_stool', 275, 295, R);
  item('pendant_light', 200, 255);

  // ---- dining nook (top right of living) ----
  item('dining_table', 425, 150, R);
  item('chair', 372, 112, -R);
  item('chair', 372, 190, -R);
  item('chair', 478, 112, R);
  item('chair', 478, 190, R);
  item('pendant_light', 425, 150);
  item('curtains', 430, 16);

  // ---- living zone (bottom of the open space) ----
  item('rug_rect', 300, 540, 0, { w: 240, d: 170 });
  item('sofa3', 300, 468);
  item('coffee_table', 300, 565);
  item('tv_stand', 300, 626, Math.PI);
  item('tv_wall', 300, 646, Math.PI);
  item('floor_lamp', 165, 480);
  item('armchair', 175, 555, -R * 0.85);
  item('plant_large', 528, 618);
  item('bookshelf', 528, 480, R, { palette: 1 });
  item('wall_art_a', 551, 350, R);
  item('curtains', 180, 16);
  item('ceiling_light', 300, 450);

  // ---- bedroom ----
  item('bed_double', 750, 140, 0, { palette: 1 });
  item('nightstand', 640, 45);
  item('nightstand', 860, 45);
  item('wardrobe', 898, 300, R);
  item('dresser', 600, 290, -R);
  item('rug_round', 750, 265, 0, { palette: 2 });
  item('wall_art_b', 570, 250, -R);
  item('curtains', 922, 180, R);
  item('ceiling_light', 740, 220);
  item('plant_small', 600, 370);

  // ---- bathroom ----
  item('bathtub', 745, 448);
  item('washer', 600, 440);
  item('vanity', 625, 624, Math.PI);
  item('mirror_wall', 625, 646, Math.PI);
  item('toilet', 712, 618, Math.PI);
  item('shower', 884, 606);
  item('ceiling_light', 750, 530);

  // give ids a unique run suffix so future additions never collide
  const suffix = uid('').slice(3);
  for (const arr of [p.walls, p.openings, p.items]) {
    for (const e of arr) e.id += suffix;
  }
  for (const o of p.openings) o.wallId += suffix;

  return p;
}

/** Luxury single-story mansion: 20m x 14m, nine rooms, landscaped yard. */
export function mansionProject() {
  const b = projectBuilder('Luxury Estate');
  const { wall, opening, item } = b;
  const R = Math.PI / 2;

  // ---- shell 2000 x 1400 ----
  const top = wall(0, 0, 2000, 0);
  const right = wall(2000, 0, 2000, 1400);
  const bottom = wall(2000, 1400, 0, 1400);
  const left = wall(0, 1400, 0, 0);
  // ---- interior ----
  const v1 = wall(700, 0, 700, 700, T_INT);        // great room | kitchen
  const v2 = wall(1300, 0, 1300, 500, T_INT);      // kitchen | dining
  const h1 = wall(0, 700, 1000, 700, T_INT);       // great room | office+foyer
  const v3 = wall(500, 700, 500, 1400, T_INT);     // office | foyer
  const v4 = wall(1000, 700, 1000, 1400, T_INT);   // foyer | suite hall
  const h2 = wall(1000, 500, 2000, 500, T_INT);    // kitchen/dining | suite
  const v5 = wall(1400, 500, 1400, 1400, T_INT);   // suite hall/bath | bedroom
  const h3 = wall(1000, 950, 1400, 950, T_INT);    // bath | suite hall
  const v4b = wall(1000, 500, 1000, 700, T_INT);   // hall | bath boundary

  // ---- doors ----
  opening(bottom, 'door', (2000 - 750) / 2000, { width: 150, swing: true }); // grand entry
  opening(h1, 'door', 650 / 1000, { width: 110 });        // great room ↔ foyer
  opening(v3, 'door', 350 / 700, { flip: true });          // foyer ↔ office
  opening(v4, 'door', 500 / 700, { width: 110 });          // foyer ↔ suite hall
  opening(v5, 'door', (1150 - 500) / 900, { flip: true }); // hall ↔ master bedroom
  opening(h3, 'door', 200 / 400);                          // hall ↔ master bath
  opening(v1, 'doorway', 350 / 700, { width: 140 });       // great room ↔ kitchen
  opening(v2, 'doorway', 250 / 500, { width: 130 });       // kitchen ↔ dining

  // ---- windows ----
  opening(top, 'window', 350 / 2000, { width: 200 });
  opening(top, 'window', 1000 / 2000, { width: 160 });
  opening(top, 'window', 1650 / 2000, { width: 200 });
  opening(left, 'window', (1400 - 350) / 1400, { width: 170 });
  opening(left, 'window', (1400 - 1050) / 1400, { width: 150 });
  opening(right, 'window', 250 / 1400, { width: 160 });
  opening(right, 'window', 900 / 1400, { width: 200 });
  opening(bottom, 'window', (2000 - 250) / 2000, { width: 170 });   // office front
  opening(bottom, 'window', (2000 - 1700) / 2000, { width: 200 }); // bedroom front

  // ---- room styles by region ----
  b.styleRooms([
    { name: 'Great Room', x1: 0, y1: 0, x2: 700, y2: 700, floor: 'walnut', wallMat: 'paint_warmwhite' },
    { name: 'Kitchen', x1: 700, y1: 0, x2: 1300, y2: 700, floor: 'marble_white', wallMat: 'paint_offwhite' },
    { name: 'Dining', x1: 1300, y1: 0, x2: 2000, y2: 500, floor: 'parquet', wallMat: 'paint_sage' },
    { name: 'Office', x1: 0, y1: 700, x2: 500, y2: 1400, floor: 'oak', wallMat: 'paint_navy' },
    { name: 'Foyer', x1: 500, y1: 700, x2: 1000, y2: 1400, floor: 'marble_white', wallMat: 'paint_greige' },
    { name: 'Master Bath', x1: 1000, y1: 500, x2: 1400, y2: 950, floor: 'tile_checker', wallMat: 'tile_bath' },
    { name: 'Suite Hall', x1: 1000, y1: 950, x2: 1400, y2: 1400, floor: 'walnut', wallMat: 'paint_greige' },
    { name: 'Master Bedroom', x1: 1400, y1: 500, x2: 2000, y2: 1400, floor: 'carpet_beige', wallMat: 'paint_blush' }
  ]);

  // ---- great room ----
  item('rug_rect', 350, 350, 0, { w: 300, d: 220 });
  item('sofa3', 350, 240, 0, { palette: 1 });
  item('sofa2', 160, 350, -R, { palette: 1 });
  item('armchair', 540, 350, R, { palette: 1 });
  item('coffee_table', 350, 380);
  item('fireplace', 350, 660, Math.PI);
  item('tv_wall', 350, 24);
  item('bookshelf', 640, 120, R);
  item('floor_lamp', 580, 550);
  item('plant_large', 60, 630);
  item('ceiling_light', 350, 350);
  item('wall_art_a', 60, 350, -R);

  // ---- kitchen ----
  item('fridge', 760, 60, 0);
  item('counter', 840, 55, 0);
  item('counter_sink', 930, 55, 0);
  item('stove', 1020, 55, 0);
  item('counter', 1100, 55, 0);
  item('dishwasher', 1180, 55, 0);
  item('hood', 1020, 40, 0);
  item('wall_cabinet', 860, 30, 0);
  item('wall_cabinet', 1140, 30, 0);
  item('island', 1000, 320, 0);
  item('bar_stool', 950, 420, Math.PI);
  item('bar_stool', 1050, 420, Math.PI);
  item('pendant_light', 1000, 320);
  item('plant_small', 730, 640);

  // ---- dining ----
  item('dining_table', 1650, 250, 0);
  item('chair', 1540, 200, -R); item('chair', 1540, 300, -R);
  item('chair', 1760, 200, R); item('chair', 1760, 300, R);
  item('chair', 1650, 140, Math.PI); item('chair', 1650, 360, 0);
  item('pendant_light', 1650, 250);
  item('curtains', 1650, 16);

  // ---- office ----
  item('desk', 250, 800, Math.PI);
  item('office_chair', 250, 900, 0);
  item('bookshelf', 60, 1050, -R, { palette: 1 });
  item('plant_large', 430, 1340);
  item('wall_art_b', 470, 1000, R);
  item('ceiling_light', 250, 1050);

  // ---- foyer ----
  item('rug_round', 750, 1150);
  item('side_table', 560, 1340);
  item('mirror_wall', 510, 1050, -R);
  item('pendant_light', 750, 1100);
  item('plant_large', 950, 1340);

  // ---- master bath ----
  item('bathtub', 1200, 580, 0);
  item('shower', 1340, 890, Math.PI);
  item('vanity', 1080, 900, Math.PI);
  item('mirror_wall', 1080, 935, Math.PI);
  item('toilet', 1050, 570, -R);
  item('ceiling_light', 1200, 720);

  // ---- suite hall (walk-in) ----
  item('wardrobe', 1040, 1030, -R);
  item('wardrobe', 1040, 1200, -R);
  item('dresser', 1300, 1340, Math.PI, { palette: 1 });
  item('ceiling_light', 1200, 1150);

  // ---- master bedroom ----
  item('bed_double', 1700, 660, 0, { palette: 3 });
  item('nightstand', 1580, 560, 0, { palette: 1 });
  item('nightstand', 1820, 560, 0, { palette: 1 });
  item('rug_round', 1700, 830, 0, { palette: 1 });
  item('bench_outdoor', 1700, 900, 0, { palette: 1 });
  item('dresser', 1950, 1100, R, { palette: 1 });
  item('tv_wall', 1700, 1376, Math.PI);
  item('curtains', 1985, 900, R);
  item('ceiling_light', 1700, 800);
  item('wall_art_a', 1500, 520, 0);

  // ---- yard ----
  item('driveway', 480, 1720, R, { w: 620, d: 300 });
  item('car', 480, 1700, 0, { palette: 3 });
  item('sidewalk', 750, 1560, R, { w: 300, d: 110 });
  item('sidewalk', 900, 1680, 0, { w: 340, d: 110 });
  item('lamp_post', 640, 1500);
  item('lamp_post', 890, 1500);
  item('mailbox', 1180, 1720, Math.PI);
  item('tree_oak', 2200, 300);
  item('tree_oak', -220, 900);
  item('tree_pine', 2220, 1100);
  item('tree_pine', -180, 200);
  item('pond', 2350, 700, 0, { w: 340, d: 240 });
  item('bench_outdoor', 2340, 900, -R * 0.8);
  item('pool', 1000, -420, 0);
  item('hedge', 300, -80, 0);
  item('hedge', 520, -80, 0);
  item('plant_large', 1780, 1480);

  return b.finish();
}
