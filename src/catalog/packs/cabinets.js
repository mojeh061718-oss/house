import { G, box, cyl, sphere, wood, solid, metal, glass, handleBar, knob } from '../builders.js';

// Cabinetry pack — the corner cabinets people always need, plus a full range
// of base, wall, tall and dining cabinets. Corner units are free-standing
// (drop them in a corner and rotate) so they aren't fighting the single-wall
// anchor. Origin at footprint centre on the ground; front faces +Z.

const CAB = [
  { name: 'White Shaker', chip: '#eae7e0', wood: '#eae7e0', top: '#d9d5cc' },
  { name: 'Sage Green', chip: '#8f9c86', wood: '#8f9c86', top: '#e9e7e2' },
  { name: 'Navy', chip: '#2f3b4c', wood: '#2f3b4c', top: '#e9e7e2' },
  { name: 'Walnut', chip: '#6e4a2f', wood: '#6e4a2f', top: '#2b2b2d' },
  { name: 'Charcoal', chip: '#3a3f45', wood: '#3a3f45', top: '#d8d5cf' }
];
const hw = (p) => metal(p.wood === '#2f3b4c' || p.wood === '#3a3f45' ? '#c9a24a' : '#b8bcc0', 0.3);

// a simple slab/shaker door with a rail frame + pull
function shakerDoor(g, wd, ht, x, y, z, p, vertical = true) {
  const d = wood(p.wood, 0.45);
  box(g, d, wd, ht, 2.4, x, y, z + 0.2, { r: 0.5 });
  box(g, wood(p.wood, 0.55), wd - 12, ht - 12, 1, x, y, z + 1.1); // inset shaker panel
  handleBar(g, x + (vertical ? wd / 2 - 6 : 0), y + (vertical ? ht - 12 : ht / 2), z + 2.2, vertical ? 14 : 16, vertical, hw(p));
}

export const CABINET_ITEMS = [
  // ---- Corner base cabinet (diagonal door) --------------------------------
  {
    id: 'cab_corner_base', name: 'Corner Base Cabinet', cat: 'kitchen', w: 92, d: 92, h: 92,
    palettes: CAB, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const cab = wood(p.wood, 0.5);
      box(g, solid('#2b2622', 0.7), 84, 8, 84, 0, 0, 0);       // recessed toe kick
      box(g, cab, 90, 78, 90, 0, 8, 0, { r: 0.5 });            // carcass 8..86
      // diagonal door across the front-right (+x,+z) corner
      const door = wood(p.wood, 0.45);
      box(g, door, 64, 70, 2.5, 23, 12, 23, { ry: -Math.PI / 4 });
      knob(g, 41, 52, 41, 2.6);
      box(g, solid(p.top, 0.3), 98, 6, 98, 0, 86, 0, { r: 1 }); // counter overhang
      return g;
    }
  },
  // ---- Lazy-susan corner base (open, turntable) ---------------------------
  {
    id: 'cab_lazy_susan', name: 'Lazy-Susan Corner', cat: 'kitchen', w: 96, d: 96, h: 92,
    palettes: CAB, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const cab = wood(p.wood, 0.5);
      box(g, solid('#2b2622', 0.7), 88, 8, 88, 0, 0, 0);
      box(g, cab, 94, 78, 94, 0, 8, 0, { r: 0.5 });
      // two bi-fold doors meeting at the corner
      for (const s of [-1, 1]) box(g, wood(p.wood, 0.45), 44, 70, 2.4, s * 24, 12, 47.2, { r: 0.5 });
      box(g, solid(p.top, 0.3), 100, 6, 100, 0, 86, 0, { r: 1 });
      // round turntable shelves peeking through
      for (const sy of [30, 60]) cyl(g, solid('#cfcabd', 0.5), 30, 2, 0, sy, 0, { seg: 28 });
      return g;
    }
  },
  // ---- Corner wall cabinet (diagonal, floats) -----------------------------
  {
    id: 'cab_corner_wall', name: 'Corner Wall Cabinet', cat: 'kitchen', w: 66, d: 66, h: 74,
    elevation: 150, palettes: CAB, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const cab = wood(p.wood, 0.5);
      box(g, cab, 64, 74, 64, 0, 0, 0, { r: 0.5 });
      box(g, wood(p.wood, 0.45), 50, 66, 2.4, 16, 4, 16, { ry: -Math.PI / 4 });
      knob(g, 30, 20, 30, 2.4);
      return g;
    }
  },
  // ---- Base cabinet, two doors --------------------------------------------
  {
    id: 'cab_base_2door', name: 'Base Cabinet (2-Door)', cat: 'kitchen', w: 90, d: 60, h: 91,
    palettes: CAB, plan: { type: 'counter' },
    build: (p) => {
      const g = G();
      box(g, solid('#2b2622', 0.7), 84, 8, 56, 0, 0, 0);
      box(g, wood(p.wood, 0.5), 90, 77, 60, 0, 8, 0, { r: 0.5 });
      for (const s of [-1, 1]) shakerDoor(g, 42, 60, s * 22, 16, 30, p);
      box(g, solid(p.top, 0.3), 94, 6, 63, 0, 85, 0, { r: 1 });
      return g;
    }
  },
  // ---- Base cabinet, drawer stack -----------------------------------------
  {
    id: 'cab_base_drawers', name: 'Base Cabinet (Drawers)', cat: 'kitchen', w: 60, d: 60, h: 91,
    palettes: CAB, plan: { type: 'counter' },
    build: (p) => {
      const g = G();
      box(g, solid('#2b2622', 0.7), 54, 8, 56, 0, 0, 0);
      box(g, wood(p.wood, 0.5), 60, 77, 60, 0, 8, 0, { r: 0.5 });
      const hs = [26, 24, 24];
      let y = 12;
      for (const dh of hs) { box(g, wood(p.wood, 0.45), 54, dh - 4, 2.4, 0, y, 30.2, { r: 0.5 }); handleBar(g, 0, y + (dh - 4) / 2, 32.4, 20, false, hw(p)); y += dh; }
      box(g, solid(p.top, 0.3), 64, 6, 63, 0, 85, 0, { r: 1 });
      return g;
    }
  },
  // ---- Deep pots-and-pans drawer base -------------------------------------
  {
    id: 'cab_base_pots', name: 'Pots & Pans Drawers', cat: 'kitchen', w: 76, d: 60, h: 91,
    palettes: CAB, plan: { type: 'counter' },
    build: (p) => {
      const g = G();
      box(g, solid('#2b2622', 0.7), 70, 8, 56, 0, 0, 0);
      box(g, wood(p.wood, 0.5), 76, 77, 60, 0, 8, 0, { r: 0.5 });
      let y = 12;
      for (const dh of [38, 36]) { box(g, wood(p.wood, 0.45), 70, dh - 4, 2.4, 0, y, 30.2, { r: 0.5 }); handleBar(g, 0, y + (dh - 4) / 2, 32.4, 28, false, hw(p)); y += dh; }
      box(g, solid(p.top, 0.3), 80, 6, 63, 0, 85, 0, { r: 1 });
      return g;
    }
  },
  // ---- Wall cabinet, two doors --------------------------------------------
  {
    id: 'cab_wall_2door', name: 'Wall Cabinet (2-Door)', cat: 'kitchen', w: 90, d: 34, h: 76,
    elevation: 150, mount: 'wall', palettes: CAB, plan: { type: 'wallCabinet' },
    build: (p) => {
      const g = G();
      box(g, wood(p.wood, 0.5), 90, 76, 34, 0, 0, -1, { r: 0.5 });
      for (const s of [-1, 1]) shakerDoor(g, 42, 70, s * 22, 3, 16, p);
      return g;
    }
  },
  // ---- Glass-front wall cabinet -------------------------------------------
  {
    id: 'cab_wall_glass', name: 'Glass-Front Wall Cabinet', cat: 'kitchen', w: 76, d: 34, h: 84,
    elevation: 150, mount: 'wall', palettes: CAB, plan: { type: 'wallCabinet' },
    build: (p) => {
      const g = G();
      box(g, wood(p.wood, 0.5), 76, 84, 34, 0, 0, -1, { r: 0.5 });
      box(g, solid('#efece5', 0.6), 70, 78, 30, 0, 0, -1);          // lit interior
      for (const s of [-1, 1]) {
        box(g, wood(p.wood, 0.5), 36, 82, 2.4, s * 19, -1, 16.5, { r: 0.5 });   // stile frame
        box(g, glass(), 30, 74, 1, s * 19, 0, 17.4);
        handleBar(g, s * 19 + (s > 0 ? -14 : 14), 0, 18.4, 16, true, hw(p));
      }
      return g;
    }
  },
  // ---- Tall pantry cabinet -------------------------------------------------
  {
    id: 'cab_tall_pantry', name: 'Tall Pantry Cabinet', cat: 'kitchen', w: 62, d: 62, h: 214,
    palettes: CAB, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      box(g, solid('#2b2622', 0.7), 56, 8, 58, 0, 0, 0);
      box(g, wood(p.wood, 0.5), 62, 206, 62, 0, 8, 0, { r: 0.5 });
      box(g, wood(p.wood, 0.45), 56, 128, 2.4, 0, 12, 31.2, { r: 0.5 }); // lower door
      box(g, wood(p.wood, 0.45), 56, 60, 2.4, 0, 146, 31.2, { r: 0.5 }); // upper door
      handleBar(g, 22, 130, 33, 20, true, hw(p));
      handleBar(g, 22, 150, 33, 16, true, hw(p));
      return g;
    }
  },
  // ---- Dining sideboard / buffet ------------------------------------------
  {
    id: 'cab_buffet', name: 'Sideboard / Buffet', cat: 'dining', w: 150, d: 48, h: 86,
    palettes: CAB, plan: { type: 'counter' },
    build: (p) => {
      const g = G();
      const cab = wood(p.wood, 0.5);
      box(g, cab, 150, 74, 48, 0, 10, 0, { r: 1 });
      for (const x of [-52, 0, 52]) { box(g, wood(p.wood, 0.45), 44, 22, 2.4, x, 54, 24.2, { r: 0.5 }); handleBar(g, x, 55, 26.4, 18, false, hw(p)); } // drawer row
      for (const x of [-52, 0, 52]) { box(g, wood(p.wood, 0.45), 44, 36, 2.4, x, 16, 24.2, { r: 0.5 }); knob(g, x, 34, 26, 2.2); } // door row
      // tapered legs
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, wood(p.wood, 0.5), 3, 10, sx * 70, 5, sz * 20, { rTop: 1.6 });
      box(g, solid(p.top, 0.3), 154, 4, 52, 0, 84, 0, { r: 1 });
      return g;
    }
  },
  // ---- China / display hutch (glass) --------------------------------------
  {
    id: 'cab_china_hutch', name: 'China Display Hutch', cat: 'dining', w: 120, d: 46, h: 200,
    palettes: CAB, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const cab = wood(p.wood, 0.5);
      box(g, cab, 120, 82, 46, 0, 4, 0, { r: 1 });                 // base
      for (const x of [-30, 30]) { box(g, wood(p.wood, 0.45), 54, 60, 2.4, x, 12, 22.2, { r: 0.5 }); knob(g, x + (x > 0 ? -20 : 20), 40, 24, 2.2); }
      box(g, solid(p.top, 0.3), 124, 4, 50, 0, 86, 0, { r: 1 });   // mid counter
      // glass upper hutch
      box(g, cab, 116, 108, 40, 0, 90, -2, { r: 1 });
      box(g, solid('#efece5', 0.6), 108, 100, 34, 0, 94, -2);
      for (const sh of [118, 150]) box(g, solid('#efece5', 0.7), 108, 1.5, 34, 0, sh, -2); // shelves
      for (const x of [-28, 28]) { box(g, wood(p.wood, 0.5), 56, 104, 2.2, x, 92, 18.5, { r: 0.5 }); box(g, glass(), 48, 96, 1, x, 94, 19.2); handleBar(g, x + (x > 0 ? -20 : 20), 100, 20.2, 22, true, hw(p)); }
      return g;
    }
  },
  // ---- Bathroom vanity, two doors -----------------------------------------
  {
    id: 'cab_vanity_2door', name: 'Bath Vanity Cabinet', cat: 'bathroom', w: 90, d: 52, h: 86,
    palettes: CAB, plan: { type: 'counter' },
    build: (p) => {
      const g = G();
      box(g, solid('#2b2622', 0.7), 84, 8, 48, 0, 0, 0);
      box(g, wood(p.wood, 0.5), 90, 72, 52, 0, 8, 0, { r: 0.5 });
      for (const s of [-1, 1]) shakerDoor(g, 42, 56, s * 22, 16, 26, p);
      box(g, solid('#e9e7e2', 0.2), 94, 6, 55, 0, 80, 0, { r: 1 });   // stone top
      // undermount basin + faucet
      box(g, solid('#f3f1ec', 0.15), 44, 8, 30, 0, 78, 0, { r: 6 });
      cyl(g, metal('#c9ced4', 0.2), 1.6, 16, 0, 86, -16);
      cyl(g, metal('#c9ced4', 0.2), 1.4, 8, 0, 98, -10, { rx: Math.PI / 2 });
      return g;
    }
  },
  // ---- Open shelf base / bookcase cube ------------------------------------
  {
    id: 'cab_open_base', name: 'Open Cubby Base', cat: 'kitchen', w: 90, d: 40, h: 86,
    palettes: CAB, plan: { type: 'counter' },
    build: (p) => {
      const g = G();
      const cab = wood(p.wood, 0.5);
      box(g, cab, 90, 74, 40, 0, 8, -1, { r: 0.5 });
      for (const x of [-30, 0, 30]) box(g, cab, 2, 70, 38, x, 10, 0);       // dividers
      for (const y of [30, 55]) box(g, cab, 86, 2, 38, 0, y, 0);            // shelves
      box(g, solid(p.top, 0.3), 94, 6, 44, 0, 84, 0, { r: 1 });
      return g;
    }
  }
];
