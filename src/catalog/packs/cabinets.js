import { G, box, cyl, sphere, wood, solid, metal, glass, handleBar, knob, lathe, sweep } from '../builders.js';

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

// Turned lathe knob (stem, collar, mushroom cap) pointing out of the door face
// along +z, or yawed by `ry` for diagonal corner doors. Beats a bare sphere.
function turnedKnob(g, m, x, y, z, r = 2.2, ry = 0) {
  const k = lathe(g, m, [[r * 0.55, 0], [r * 0.8, 0.5], [r * 0.45, 1.4], [r, 2.6], [r * 0.8, 3.6], [r * 0.25, 4.1]], x, y, z, { seg: 18 });
  k.rotation.order = 'YXZ';
  k.rotation.set(Math.PI / 2, ry, 0);
  return k;
}

export const CABINET_ITEMS = [
  // ---- Corner base cabinet (diagonal door) --------------------------------
  {
    id: 'cab_corner_base', name: 'Corner Base Cabinet', cat: 'kitchen', w: 92, d: 92, h: 92,
    palettes: CAB, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const cab = wood(p.wood, 0.5);
      // L-shaped carcass + kick so the diagonal front is actually exposed
      box(g, solid('#2b2622', 0.7), 84, 8, 42, 0, 0, -21);
      box(g, solid('#2b2622', 0.7), 42, 8, 42, -21, 0, 21);
      box(g, solid('#2b2622', 0.7), 58, 8, 4, 20.5, 0, 20.5, { ry: -Math.PI / 4 }); // kick under door
      box(g, cab, 90, 78, 45, 0, 8, -22.5, { r: 0.5 });
      box(g, cab, 45, 78, 45, -22.5, 8, 22.5, { r: 0.5 });
      // diagonal door across the front-right (+x,+z) corner
      box(g, wood(p.wood, 0.45), 62, 70, 2.5, 23, 12, 23, { ry: -Math.PI / 4 });
      turnedKnob(g, hw(p), 20, 52, 27.5, 2.4, Math.PI / 4);
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
      // two bi-fold doors meeting at the corner, with turned knobs
      for (const s of [-1, 1]) {
        box(g, wood(p.wood, 0.45), 44, 70, 2.4, s * 24, 12, 47.2, { r: 0.5 });
        turnedKnob(g, hw(p), s * 8, 47, 48.4, 2.2);
      }
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
      // L-shaped carcass exposes the diagonal door
      box(g, cab, 64, 74, 32, 0, 0, -16, { r: 0.5 });
      box(g, cab, 32, 74, 32, -16, 0, 16, { r: 0.5 });
      box(g, wood(p.wood, 0.45), 46, 70, 2.4, 16, 2, 16, { ry: -Math.PI / 4 });
      turnedKnob(g, hw(p), 13.5, 20, 20.5, 2.2, Math.PI / 4);
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
      // OPEN carcass (top/bottom/sides/back) so the glass shows a real interior
      const shell = wood(p.wood, 0.5);
      box(g, shell, 76, 3, 34, 0, 81, -1, { r: 0.5 });               // top
      box(g, shell, 76, 3, 34, 0, 0, -1, { r: 0.5 });                // bottom
      for (const s of [-1, 1]) box(g, shell, 3, 84, 34, s * 36.5, 0, -1, { r: 0.5 });
      box(g, shell, 76, 84, 3, 0, 0, -16.5);                         // back
      box(g, solid('#efece5', 0.6), 69, 76, 1, 0, 3.5, -14.6);       // lit back liner
      // styled shelves visible through the glass (single panes, no nested shells)
      box(g, solid('#e3ddd2', 0.55), 70, 1.6, 26, 0, 26, -2);
      box(g, solid('#e3ddd2', 0.55), 70, 1.6, 26, 0, 54, -2);
      for (const [px, py] of [[-14, 27.6], [-14, 55.6]]) {           // plate stacks
        cyl(g, solid('#f0ede6', 0.4), 7, 1, px, py, 0, { seg: 24 });
        cyl(g, solid('#f0ede6', 0.4), 6.2, 1, px, py + 1, 0, { seg: 24 });
        cyl(g, solid('#f0ede6', 0.4), 5.4, 1, px, py + 2, 0, { seg: 24 });
      }
      lathe(g, solid('#7c8aa0', 0.4), [[2.2, 0], [5, 1], [6, 6], [3.4, 11], [2.4, 13], [3.2, 15.5]], 14, 27.6, 0, { seg: 24 }); // pitcher
      lathe(g, solid('#c9b8a2', 0.45), [[2, 0], [4.4, 0.8], [5, 5], [2.6, 9], [2, 10.5]], 14, 55.6, 0, { seg: 24 });            // small urn
      for (const s of [-1, 1]) {
        // slim stile frame strips + a single glass pane per door
        box(g, shell, 4, 82, 2.4, s * 36, 1, 16.5, { r: 0.5 });
        box(g, shell, 4, 82, 2.4, s * 2.5, 1, 16.5, { r: 0.5 });
        box(g, shell, 33, 4, 2.4, s * 19.25, 1, 16.5, { r: 0.5 });
        box(g, shell, 33, 4, 2.4, s * 19.25, 79, 16.5, { r: 0.5 });
        box(g, glass(), 31, 74, 1, s * 19.25, 4.5, 16.8);
        handleBar(g, s * 4, 30, 18.4, 16, true, hw(p));
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
      for (const x of [-52, 0, 52]) { box(g, wood(p.wood, 0.45), 44, 36, 2.4, x, 16, 24.2, { r: 0.5 }); turnedKnob(g, hw(p), x, 34, 25.6, 2.2); } // door row
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
      for (const x of [-30, 30]) { box(g, wood(p.wood, 0.45), 54, 60, 2.4, x, 12, 22.2, { r: 0.5 }); turnedKnob(g, hw(p), x + (x > 0 ? -20 : 20), 40, 23.4, 2.2); }
      box(g, solid(p.top, 0.3), 124, 4, 50, 0, 86, 0, { r: 1 });   // mid counter
      // glass upper hutch — OPEN carcass so the china actually shows
      box(g, cab, 116, 4, 40, 0, 194, -2, { r: 0.5 });               // hutch top
      for (const s of [-1, 1]) box(g, cab, 3, 108, 40, s * 56.5, 90, -2, { r: 0.5 });
      box(g, cab, 116, 108, 3, 0, 90, -20.5);                        // back
      box(g, solid('#efece5', 0.6), 108, 100, 1, 0, 92, -18.7);      // lit back liner
      for (const sh of [118, 150]) box(g, solid('#e3ddd2', 0.7), 110, 1.6, 30, 0, sh, -5); // shelves
      // displayed china (plate stacks + turned teapot + urn) behind the glass
      for (const [px, py] of [[-30, 119.6], [30, 151.6]]) {
        cyl(g, solid('#f0ede6', 0.4), 8, 1.1, px, py, -5, { seg: 24 });
        cyl(g, solid('#f0ede6', 0.4), 7, 1.1, px, py + 1.1, -5, { seg: 24 });
        cyl(g, solid('#f0ede6', 0.4), 6, 1.1, px, py + 2.2, -5, { seg: 24 });
      }
      lathe(g, solid('#8fa3b8', 0.4), [[3, 0], [7, 1.2], [8, 6], [4.5, 11], [3, 12.5], [3.6, 14.5]], 22, 119.6, -5, { seg: 24 }); // ginger jar
      lathe(g, solid('#c9b8a2', 0.45), [[2.4, 0], [5.4, 1], [6.2, 6], [3.2, 11], [2.4, 13]], -22, 151.6, -5, { seg: 24 });        // urn
      for (const x of [-28, 28]) {
        // door frame strips + a single glass pane per door
        box(g, cab, 4, 104, 2.2, x - 26, 92, 18.5, { r: 0.5 });
        box(g, cab, 4, 104, 2.2, x + 26, 92, 18.5, { r: 0.5 });
        box(g, cab, 48, 4, 2.2, x, 92, 18.5, { r: 0.5 });
        box(g, cab, 48, 4, 2.2, x, 192, 18.5, { r: 0.5 });
        box(g, glass(), 50, 96, 1, x, 96, 18.8);
        handleBar(g, x + (x > 0 ? -22 : 22), 130, 20.2, 22, true, hw(p));
      }
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
      // raised basin deck (proud of the stone — no coplanar tops)
      box(g, solid('#f3f1ec', 0.15), 44, 9.5, 30, 0, 78, 0, { r: 6 });
      // smooth swept gooseneck + lathe escutcheon + side lever
      const fm = metal('#c9ced4', 0.25);
      lathe(g, fm, [[2.8, 0], [2.6, 0.6], [1.9, 1.2], [1.7, 2.2]], 0, 85.7, -18, { seg: 20 });
      sweep(g, fm, [[0, 86, -18], [0, 98, -18], [0, 102, -15.5], [0, 103.5, -11], [0, 100.5, -6.5], [0, 97, -5.5]], 1.4, { seg: 32 });
      cyl(g, fm, 1.6, 1.6, 0, 95.4, -5.5, { seg: 14 });
      cyl(g, fm, 1.0, 2.6, 4.6, 86, -18, { seg: 12 });
      box(g, fm, 5.5, 1.1, 1.4, 7, 88.4, -18, { r: 0.5, rz: -0.2 });
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
