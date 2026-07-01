// Sample project: a furnished one-bedroom apartment, loaded on first run so
// the app opens with something beautiful instead of a blank grid.
import { emptyProject, DEFAULTS } from './core/state.js';
import { ITEM_MAP } from './catalog/items.js';
import { uid } from './core/geometry.js';

const T_EXT = DEFAULTS.exteriorThickness;
const T_INT = DEFAULTS.wallThickness;

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
