import { G, box, cyl, sphere, prism, segment, torus, wood, metal, chrome, solid, glow, tex } from '../builders.js';

// Docks, piers & watercraft — all built from primitive helpers.
// Origin at footprint center on the ground; +Y up; bow/front faces +Z.

export const DOCKS_ITEMS = [
  // ---- straight wood dock --------------------------------------------------
  {
    id: 'dock_straight', name: 'Wood Dock', cat: 'outdoor', w: 200, d: 600, h: 45, noShadow: true,
    palettes: [
      { name: 'Cedar', chip: '#b0864f', wood: '#b0864f' },
      { name: 'Weathered Gray', chip: '#9a9789', wood: '#9a9789' },
      { name: 'Walnut', chip: '#6f4d31', wood: '#6f4d31' }
    ],
    plan: { type: 'dock' },
    build: (p) => {
      const g = G();
      const deck = tex('deck_wood', 2, 6);
      const post = wood(p.wood, 0.7);
      const rail = wood(p.wood, 0.6);
      // pilings under the four edges
      for (const z of [-260, -90, 90, 260]) {
        for (const x of [-80, 80]) cyl(g, post, 7, 46, x, 0, z);
      }
      // deck planks + stringers
      box(g, wood(p.wood, 0.65), 200, 8, 600, 0, 38, 0);
      box(g, deck, 190, 5, 596, 0, 46, 0);
      // bull-rail along both long edges
      for (const x of [-92, 92]) box(g, rail, 6, 6, 596, x, 51, 0);
      return g;
    }
  },

  // ---- L-shaped dock -------------------------------------------------------
  {
    id: 'dock_l', name: 'L-Shaped Dock', cat: 'outdoor', w: 420, d: 560, h: 45, noShadow: true,
    palettes: [
      { name: 'Cedar', chip: '#b0864f', wood: '#b0864f' },
      { name: 'Weathered Gray', chip: '#9a9789', wood: '#9a9789' },
      { name: 'Teak', chip: '#8a5a2b', wood: '#8a5a2b' }
    ],
    plan: { type: 'dock' },
    build: (p) => {
      const g = G();
      const deck = tex('deck_wood', 2, 5);
      const post = wood(p.wood, 0.7);
      // walkway (runs along z, on the -x side)
      for (const z of [-230, -60, 130]) cyl(g, post, 7, 46, -100, 0, z);
      box(g, wood(p.wood, 0.65), 160, 8, 500, -100, 38, 0);
      box(g, deck, 152, 5, 496, -100, 46, 0);
      // foot of the L (runs along x at +z end)
      for (const x of [-160, 20, 180]) cyl(g, post, 7, 46, x, 0, 210);
      box(g, wood(p.wood, 0.65), 420, 8, 160, 0, 38, 200);
      box(g, deck, 416, 5, 152, 0, 46, 200);
      // cleats on the platform
      for (const cx of [-150, 170]) box(g, metal('#3a3d42', 0.5), 6, 5, 20, cx, 49, 250);
      return g;
    }
  },

  // ---- T-shaped dock -------------------------------------------------------
  {
    id: 'dock_t', name: 'T-Shaped Dock', cat: 'outdoor', w: 480, d: 560, h: 45, noShadow: true,
    palettes: [
      { name: 'Cedar', chip: '#b0864f', wood: '#b0864f' },
      { name: 'Weathered Gray', chip: '#9a9789', wood: '#9a9789' },
      { name: 'Driftwood', chip: '#7d766a', wood: '#7d766a' }
    ],
    plan: { type: 'dock' },
    build: (p) => {
      const g = G();
      const deck = tex('deck_wood', 2, 5);
      const post = wood(p.wood, 0.7);
      // stem walkway
      for (const z of [-230, -70, 100]) cyl(g, post, 7, 46, 0, 0, z);
      box(g, wood(p.wood, 0.65), 160, 8, 500, 0, 38, -20);
      box(g, deck, 152, 5, 496, 0, 46, -20);
      // T-head at +z end
      for (const x of [-200, -60, 60, 200]) cyl(g, post, 7, 46, x, 0, 220);
      box(g, wood(p.wood, 0.65), 480, 8, 150, 0, 38, 210);
      box(g, deck, 476, 5, 142, 0, 46, 210);
      for (const cx of [-210, 210]) box(g, metal('#3a3d42', 0.5), 6, 5, 20, cx, 49, 250);
      return g;
    }
  },

  // ---- floating dock -------------------------------------------------------
  {
    id: 'dock_floating', name: 'Floating Dock', cat: 'outdoor', w: 240, d: 360, h: 32, noShadow: true,
    palettes: [
      { name: 'Cedar', chip: '#b0864f', wood: '#b0864f' },
      { name: 'Composite Gray', chip: '#8f9196', wood: '#8f9196' }
    ],
    plan: { type: 'dock' },
    build: (p) => {
      const g = G();
      const deck = tex('deck_wood', 2, 3);
      // black floatation drums underneath
      const drum = solid('#26282c', 0.6);
      for (const z of [-120, 0, 120]) {
        cyl(g, drum, 15, 220, 0, 6, z, { rz: Math.PI / 2, seg: 16 });
      }
      box(g, wood(p.wood, 0.65), 240, 7, 360, 0, 22, 0);
      box(g, deck, 234, 5, 354, 0, 29, 0);
      // rub-rail trim
      for (const x of [-118, 118]) box(g, solid('#3a3d42', 0.5), 5, 8, 360, x, 24, 0);
      return g;
    }
  },

  // ---- swim raft / platform ------------------------------------------------
  {
    id: 'dock_swim_raft', name: 'Swim Raft', cat: 'outdoor', w: 260, d: 260, h: 40, noShadow: true,
    palettes: [
      { name: 'Cedar', chip: '#b0864f', wood: '#b0864f' },
      { name: 'Weathered Gray', chip: '#9a9789', wood: '#9a9789' }
    ],
    plan: { type: 'dock' },
    build: (p) => {
      const g = G();
      const deck = tex('deck_wood', 3, 3);
      const drum = solid('#2b2d31', 0.6);
      // four corner floatation drums under the platform
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        cyl(g, drum, 18, 20, sx * 88, 0, sz * 88, { seg: 20 });
        cyl(g, drum, 19, 4, sx * 88, 16, sz * 88, { seg: 20 });   // top rib
      }
      // framed deck (fits the 260 footprint honestly)
      box(g, wood(p.wood, 0.65), 240, 7, 240, 0, 20, 0);
      box(g, deck, 234, 5, 234, 0, 27, 0);
      // rub-rail trim on two edges
      for (const x of [-119, 119]) box(g, solid('#3a3d42', 0.5), 5, 7, 240, x, 22, 0);
      // swim ladder folded against the +z edge
      const rail = chrome();
      for (const x of [-16, 16]) {
        cyl(g, rail, 1.8, 34, x, 0, 124);                          // rails to the water
        cyl(g, rail, 1.8, 10, x, 34, 119, { rx: -1.1 });           // curled grab top
      }
      for (const y of [8, 20]) cyl(g, rail, 1.3, 30, 0, y, 124, { rz: Math.PI / 2, seg: 10 });
      return g;
    }
  },

  // ---- pier with railing ---------------------------------------------------
  {
    id: 'dock_pier_rail', name: 'Railed Pier', cat: 'outdoor', w: 200, d: 640, h: 130, noShadow: true,
    palettes: [
      { name: 'Cedar', chip: '#b0864f', wood: '#b0864f' },
      { name: 'Weathered Gray', chip: '#9a9789', wood: '#9a9789' },
      { name: 'Painted White', chip: '#e4ded2', wood: '#e4ded2' }
    ],
    plan: { type: 'dock' },
    build: (p) => {
      const g = G();
      const deck = tex('deck_wood', 2, 6);
      const post = wood(p.wood, 0.7);
      for (const z of [-270, -90, 90, 270]) {
        for (const x of [-85, 85]) cyl(g, post, 7, 45, x, 0, z);
      }
      box(g, wood(p.wood, 0.65), 200, 8, 640, 0, 37, 0);
      box(g, deck, 190, 5, 636, 0, 45, 0);
      // railing posts + top rail on both sides
      for (const x of [-92, 92]) {
        for (const z of [-280, -140, 0, 140, 280]) box(g, post, 6, 82, 6, x, 50, z);
        box(g, wood(p.wood, 0.6), 7, 6, 636, x, 128, 0);
        box(g, wood(p.wood, 0.6), 7, 4, 636, x, 96, 0);
      }
      return g;
    }
  },

  // ---- dock ladder ---------------------------------------------------------
  {
    id: 'dock_ladder', name: 'Dock Ladder', cat: 'outdoor', w: 50, d: 24, h: 120,
    palettes: null,
    plan: { type: 'box' },
    build: () => {
      const g = G();
      const rail = chrome();
      // two curved-over top rails
      for (const x of [-18, 18]) {
        cyl(g, rail, 2.2, 100, x, 0, 8, {});
        cyl(g, rail, 2.2, 20, x, 100, 0, { rx: Math.PI / 2 });
      }
      // rungs descending toward -z (into the water)
      for (let i = 0; i < 5; i++) {
        cyl(g, rail, 1.6, 40, 0, i * 22, 8 - i * 3, { rz: Math.PI / 2 });
      }
      return g;
    }
  },

  // ---- boat lift -----------------------------------------------------------
  {
    id: 'dock_boatlift', name: 'Boat Lift', cat: 'outdoor', w: 300, d: 420, h: 220,
    palettes: null,
    plan: { type: 'box' },
    build: () => {
      const g = G();
      const frame = metal('#8a9096', 0.4);
      const cradle = metal('#5f656a', 0.45);
      const guide = metal('#c9ced4', 0.4);
      // four corner posts
      for (const x of [-135, 135]) for (const z of [-185, 185]) cyl(g, frame, 8, 196, x, 0, z);
      // top perimeter beams
      for (const x of [-135, 135]) box(g, frame, 12, 12, 400, x, 192, 0);
      box(g, frame, 290, 12, 12, 0, 192, 0);
      // PEAKED fabric canopy (ridge fore-aft) — reads as a boat-lift top, not a
      // flat table slab that dominated the old top-down view
      const canopy = prism(g, solid('#2f6aa8', 0.7), 400, 44, 300, 0, 204, 0, solid('#245081', 0.7));
      canopy.rotation.y = Math.PI / 2;
      // valance skirt along the eaves so the canopy reads from the side
      for (const x of [-150, 150]) box(g, solid('#245081', 0.7), 6, 18, 400, x, 196, 0);
      // boat cradle: two long bunks the hull rests on, raised on the lift
      for (const x of [-72, 72]) box(g, cradle, 20, 14, 350, x, 44, 0, { r: 3 });
      // vertical guide poles at bow & stern so it clearly cradles a boat
      for (const x of [-96, 96]) for (const z of [-150, 150]) cyl(g, guide, 4, 96, x, 44, z);
      // corner bunk uprights + a winch/motor box on one side
      for (const x of [-135, 135]) for (const z of [-185, 185]) box(g, cradle, 10, 44, 10, x, 26, z);
      box(g, metal('#3a3d42', 0.5), 42, 42, 30, 150, 70, 40, { r: 4 });
      return g;
    }
  },

  // ---- dock cleat / piling -------------------------------------------------
  {
    id: 'dock_cleat', name: 'Piling & Cleat', cat: 'outdoor', w: 30, d: 30, h: 130,
    palettes: [
      { name: 'Cedar', chip: '#8a5a2b', wood: '#8a5a2b' },
      { name: 'Weathered Gray', chip: '#8f8b7f', wood: '#8f8b7f' }
    ],
    plan: { type: 'box' },
    build: (p) => {
      const g = G();
      cyl(g, wood(p.wood, 0.75), 11, 122, 0, 0, 0, { rTop: 10, seg: 14 });
      // rounded cap
      sphere(g, wood(p.wood, 0.7), 11, 0, 122, 0, { sy: 0.6 });
      // metal cleat bolted near the top
      const cl = metal('#3a3d42', 0.5);
      box(g, cl, 26, 5, 6, 0, 104, 12);
      for (const x of [-9, 9]) cyl(g, cl, 4.5, 8, x, 104, 12, { rTop: 6, rz: Math.PI / 2 });
      return g;
    }
  },

  // ---- mooring buoy --------------------------------------------------------
  {
    id: 'dock_buoy', name: 'Mooring Buoy', cat: 'outdoor', w: 44, d: 44, h: 70,
    palettes: [
      { name: 'Red & White', chip: '#c23a2e', body: '#c23a2e', top: '#e8e2d6' },
      { name: 'Yellow', chip: '#e0b23a', body: '#e0b23a', top: '#e8e2d6' },
      { name: 'Orange', chip: '#dd7327', body: '#dd7327', top: '#e8e2d6' }
    ],
    plan: { type: 'rings' },
    build: (p) => {
      const g = G();
      sphere(g, solid(p.body, 0.5), 22, 0, 24, 0, { sy: 0.9 });
      box(g, solid(p.top, 0.55), 30, 5, 30, 0, 38, 0, { r: 2 });
      // top post + ring
      cyl(g, metal('#8a9096', 0.4), 3, 26, 0, 42, 0);
      cyl(g, metal('#3a3d42', 0.5), 6, 3, 0, 66, 0, { rTop: 6, seg: 12, rx: Math.PI / 2 });
      // reflective band
      cyl(g, glow('#e8e2d6', 0.4, 0.5), 22.4, 6, 0, 22, 0, { seg: 20 });
      return g;
    }
  },

  // ---- kayak ---------------------------------------------------------------
  {
    id: 'boat_kayak', name: 'Kayak', cat: 'outdoor', w: 60, d: 320, h: 34,
    palettes: [
      { name: 'Yellow', chip: '#e6b028', hull: '#e6b028' },
      { name: 'Red', chip: '#c0392b', hull: '#c0392b' },
      { name: 'Teal', chip: '#1f8a8a', hull: '#1f8a8a' },
      { name: 'Orange', chip: '#dd6b20', hull: '#dd6b20' }
    ],
    plan: { type: 'boat' },
    build: (p) => {
      const g = G();
      const hull = solid(p.hull, 0.45);
      // slim hull: long overlapping flattened sections blending into the tips
      sphere(g, hull, 28, 0, 12, 0, { sy: 0.42, sz: 3.4, seg: 26 });         // midships (long)
      for (const s of [-1, 1]) {
        sphere(g, hull, 20, 0, 11, s * 105, { sx: 0.85, sy: 0.38, sz: 2.0, seg: 20 });
        sphere(g, hull, 11, 0, 10, s * 140, { sx: 0.7, sy: 0.34, sz: 1.6, seg: 16 });
        // bow / stern points rising to the tips
        segment(g, hull, [0, 10, s * 138], [0, 14, s * 159], 6, 1.5, 12);
      }
      // raised cockpit coaming (real torus rim, clearly proud of the deck)
      torus(g, solid(p.hull, 0.35), 20, 3, 0, 24.5, -8, { sx: 0.95, sy: 1.4, seg: 36, tubeSeg: 10 });
      // dark cockpit well + seat with a low backband
      const well = cyl(g, solid('#26282c', 0.7), 17, 8, 0, 17, -8, { seg: 24 });
      well.scale.z = 1.55;
      box(g, solid('#3a3d42', 0.8), 24, 3, 26, 0, 19.5, -14, { r: 4 });
      box(g, solid('#3a3d42', 0.8), 22, 8, 3, 0, 20, -27, { r: 1.5, rx: -0.2 });
      // deck bungee lines hugging the foredeck curve
      box(g, solid('#26282c', 0.6), 16, 1.4, 2, 0, 21.0, 60, { r: 0.7 });
      box(g, solid('#26282c', 0.6), 13, 1.4, 2, 0, 17.4, 84, { r: 0.7 });
      // paddle resting across the cockpit coaming, inside the footprint
      const shaft = solid('#2b2d31', 0.5);
      segment(g, shaft, [-20, 27, -70], [20, 27, 78], 2.1, 2.1, 10);
      for (const s of [-1, 1]) {
        const bl = sphere(g, solid('#c9c4b6', 0.5), 12, s * 20, 27, s * 82, { sx: 0.42, sy: 0.18, sz: 1.6, seg: 14 });
        bl.rotation.y = 0.26;
      }
      return g;
    }
  },

  // ---- canoe ---------------------------------------------------------------
  {
    id: 'boat_canoe', name: 'Canoe', cat: 'outdoor', w: 78, d: 400, h: 40,
    palettes: [
      { name: 'Cedar', chip: '#a9713c', hull: '#a9713c' },
      { name: 'Green', chip: '#3a6b4a', hull: '#3a6b4a' },
      { name: 'Red', chip: '#b23a30', hull: '#b23a30' }
    ],
    plan: { type: 'boat' },
    build: (p) => {
      const g = G();
      const hull = solid(p.hull, 0.5);
      const inner = solid('#c9b48a', 0.6);
      sphere(g, hull, 38, 0, 18, 0, { sx: 0.95, sy: 0.6, sz: 5.1, seg: 24 });
      // open interior
      sphere(g, inner, 33, 0, 24, 0, { sx: 0.9, sy: 0.55, sz: 4.9, seg: 22 });
      // gunwale rails + thwart seats
      for (const x of [-34, 34]) box(g, wood('#7a5230', 0.5), 4, 4, 340, x, 34, 0);
      box(g, wood('#8a5a2b', 0.5), 66, 4, 20, 0, 32, -90);
      box(g, wood('#8a5a2b', 0.5), 66, 4, 20, 0, 32, 90);
      // yoke
      box(g, wood('#7a5230', 0.5), 66, 4, 10, 0, 32, 0);
      return g;
    }
  },

  // ---- stand-up paddleboard ------------------------------------------------
  {
    id: 'boat_sup', name: 'Paddleboard', cat: 'outdoor', w: 76, d: 330, h: 20,
    palettes: [
      { name: 'Aqua', chip: '#37b3c4', hull: '#37b3c4' },
      { name: 'Coral', chip: '#e2725b', hull: '#e2725b' },
      { name: 'Lime', chip: '#9dc21f', hull: '#9dc21f' }
    ],
    plan: { type: 'boat' },
    build: (p) => {
      const g = G();
      const board = solid(p.hull, 0.4);
      // flat elongated board lying deck-up, resting on its centre fin
      box(g, board, 70, 10, 300, 0, 10, 0, { r: 10, seg: 5 });
      // deck pad traction
      box(g, solid('#2b2d31', 0.9), 56, 2, 180, 0, 20, -20, { r: 8 });
      // swept fin under the tail (fills the gap to the ground)
      prism(g, board, 4, 10, 26, 0, 0, 130);
      // paddle laid lengthwise along the deck
      const shaft = solid('#d9d4c6', 0.5);
      cyl(g, shaft, 1.6, 180, 12, 22, 20, { rx: Math.PI / 2 });
      box(g, board, 14, 2, 24, 12, 22, 130, { r: 4 });
      return g;
    }
  },

  // ---- rowboat -------------------------------------------------------------
  {
    id: 'boat_rowboat', name: 'Rowboat', cat: 'outdoor', w: 130, d: 340, h: 55,
    palettes: [
      { name: 'White', chip: '#e6e1d5', hull: '#e6e1d5' },
      { name: 'Green', chip: '#3f6b52', hull: '#3f6b52' },
      { name: 'Navy', chip: '#2c3e5c', hull: '#2c3e5c' }
    ],
    plan: { type: 'boat' },
    build: (p) => {
      const g = G();
      const hullm = solid(p.hull, 0.5);
      const floor = wood('#c2a877', 0.6);
      const trim = wood('#6f4d31', 0.5);
      const seat = wood('#8a5a2b', 0.55);
      // flat bottom boards (main run + tapering bow boards)
      box(g, floor, 82, 5, 200, 0, 0, -58, { r: 2 });
      box(g, floor, 34, 5, 56, 0, 0, 88, { r: 2 });
      box(g, floor, 16, 5, 30, 0, 0, 135, { r: 2 });
      for (const s of [-1, 1]) {
        // flared side planks, slightly toed-in toward the stern
        box(g, hullm, 6, 46, 200, s * 46, 0, -58, { ry: s * 0.05, rz: -s * 0.22 });
        // long raked bow planks converging at the stem
        box(g, hullm, 6, 44, 135, s * 27, 2, 105, { ry: -s * 0.364, rz: -s * 0.15 });
        // gunwale caps following the sheer
        box(g, trim, 7, 4, 202, s * 50.5, 44, -58, { ry: s * 0.05, r: 1 });
        box(g, trim, 6, 4, 134, s * 30, 44, 105, { ry: -s * 0.364, r: 1 });
        // oarlock pins
        cyl(g, chrome(), 1.2, 7, s * 50, 45, -8, { seg: 8 });
        // oars shipped inboard, blades forward, resting on the thwarts
        cyl(g, wood('#a9713c', 0.5), 2, 230, s * 21, 36, -12, { rx: Math.PI / 2, seg: 10 });
        sphere(g, wood('#a9713c', 0.5), 11, s * 21, 36, 112, { sx: 0.35, sy: 0.14, sz: 1.6, seg: 12 });
      }
      // bow stem post
      segment(g, trim, [0, 0, 162], [0, 52, 170], 4, 2.8, 10);
      // flat transom + cap rail
      box(g, hullm, 86, 44, 6, 0, 1, -156, { r: 2 });
      box(g, trim, 90, 4, 9, 0, 45, -156, { r: 1 });
      // three bench thwarts
      box(g, seat, 84, 5, 22, 0, 30, -105);
      box(g, seat, 92, 5, 22, 0, 30, -12);
      box(g, seat, 62, 5, 22, 0, 30, 85);
      return g;
    }
  },

  // ---- small sailboat ------------------------------------------------------
  {
    id: 'boat_sailboat', name: 'Sailboat', cat: 'outdoor', w: 140, d: 380, h: 420,
    palettes: [
      { name: 'White Hull', chip: '#eae5d9', hull: '#eae5d9' },
      { name: 'Blue Hull', chip: '#294a72', hull: '#294a72' },
      { name: 'Red Hull', chip: '#a8352a', hull: '#a8352a' }
    ],
    plan: { type: 'boat' },
    build: (p) => {
      const g = G();
      const hull = solid(p.hull, 0.45);
      const deckm = wood('#c2a877', 0.55);
      // hull: overlapping flattened sections with ALIGNED tops for a smooth
      // sheer line, tapering to a bow point (+Z)
      sphere(g, hull, 66, 0, 30, -10, { sx: 0.95, sy: 0.42, sz: 2.2, seg: 26 });
      sphere(g, hull, 48, 0, 37.5, 90, { sx: 0.7, sy: 0.42, sz: 1.7, seg: 22 });
      sphere(g, hull, 54, 0, 35, -115, { sx: 0.85, sy: 0.42, sz: 1.25, seg: 22 });
      segment(g, hull, [0, 40, 145], [0, 52, 186], 9, 2, 14);        // bow point
      // teak deck caps sealing the hull top
      sphere(g, deckm, 62, 0, 56, -8, { sx: 0.78, sy: 0.1, sz: 2.35, seg: 24 });
      sphere(g, deckm, 36, 0, 56, 100, { sx: 0.55, sy: 0.09, sz: 1.9, seg: 18 });
      // low cabin trunk with side ports, cockpit well aft, tiller
      box(g, solid('#e8e2d4', 0.6), 54, 14, 66, 0, 61, 12, { r: 5 });
      for (const s of [-1, 1]) box(g, solid('#2b3a44', 0.4), 2, 5, 40, s * 27.5, 67, 12, { r: 1 });
      box(g, solid('#3a3d42', 0.7), 44, 6, 64, 0, 59, -95, { r: 8 });
      segment(g, wood('#8a5a2b', 0.5), [0, 66, -122], [0, 72, -88], 1.4, 1.1, 8);
      // rig: mast (trimmed to an honest daysailer proportion) + boom + stays
      const mast = metal('#d2d5d8', 0.35);
      cyl(g, mast, 3.2, 318, 0, 62, 40);
      cyl(g, mast, 2.2, 140, 0, 82, -30, { rx: Math.PI / 2 });
      segment(g, mast, [0, 376, 40], [0, 60, 178], 0.8, 0.8, 6);     // forestay
      segment(g, mast, [0, 376, 40], [0, 58, -152], 0.8, 0.8, 6);    // backstay
      // sails: taut thin triangles — main on the boom, jib on the forestay
      prism(g, solid('#f4f1e8', 0.9), 3, 282, 136, 0, 84, -28);
      prism(g, solid('#ece9df', 0.9), 3, 145, 108, 0, 66, 108);
      return g;
    }
  },

  // ---- pontoon boat --------------------------------------------------------
  {
    id: 'boat_pontoon', name: 'Pontoon Boat', cat: 'outdoor', w: 200, d: 480, h: 150,
    palettes: [
      { name: 'Tan Canopy', chip: '#c9a066', canopy: '#c9a066' },
      { name: 'Blue Canopy', chip: '#3a6b96', canopy: '#3a6b96' },
      { name: 'Green Canopy', chip: '#4a7a52', canopy: '#4a7a52' }
    ],
    plan: { type: 'boat' },
    build: (p) => {
      const g = G();
      const tube = metal('#b8bcc0', 0.35);
      // two pontoon tubes with tapered noses
      for (const x of [-70, 70]) {
        cyl(g, tube, 26, 440, x, 26, -10, { rx: Math.PI / 2, seg: 20 });
        sphere(g, tube, 26, x, 26, 220, { sz: 1.4 });
      }
      // deck
      box(g, tex('deck_wood', 2, 5), 190, 8, 440, 0, 52, 0);
      // rail fence around deck
      const rail = metal('#d5d9dd', 0.3);
      for (const x of [-92, 92]) box(g, rail, 4, 50, 430, x, 60, 0, { r: 2 });
      box(g, rail, 190, 50, 4, 0, 60, -218, { r: 2 });
      box(g, rail, 190, 50, 4, 0, 60, 218, { r: 2 });
      // seats + console
      for (const z of [-140, -80]) box(g, solid('#e6e1d5', 0.6), 60, 30, 50, -50, 60, z, { r: 8 });
      box(g, solid('#2b2d31', 0.5), 50, 40, 40, 60, 60, -120, { r: 6 });
      // bimini canopy
      for (const x of [-80, 80]) cyl(g, rail, 2.5, 78, x, 110, 40);
      box(g, solid(p.canopy, 0.7), 190, 8, 180, 0, 186, 40, { r: 6 });
      return g;
    }
  },

  // ---- jet ski -------------------------------------------------------------
  {
    id: 'boat_jetski', name: 'Jet Ski', cat: 'outdoor', w: 90, d: 260, h: 100,
    palettes: [
      { name: 'Blue', chip: '#1f6fc4', hull: '#1f6fc4' },
      { name: 'Red', chip: '#c0392b', hull: '#c0392b' },
      { name: 'Black', chip: '#26282c', hull: '#26282c' }
    ],
    plan: { type: 'boat' },
    build: (p) => {
      const g = G();
      const hull = solid(p.hull, 0.35);
      const dark = solid('#26282c', 0.5);
      // hull body
      sphere(g, hull, 44, 0, 34, 0, { sx: 0.95, sy: 0.6, sz: 2.7, seg: 24 });
      // pointed bow
      prism(g, hull, 60, 30, 60, 0, 20, 90);
      // seat / upper deck
      box(g, dark, 60, 26, 130, 0, 44, -20, { r: 16, seg: 4 });
      box(g, solid('#3a3d42', 0.7), 56, 8, 90, 0, 60, -30, { r: 12 });
      // handlebar column
      box(g, hull, 40, 34, 40, 0, 44, 60, { r: 10 });
      cyl(g, dark, 2.4, 44, 0, 88, 30, { rz: Math.PI / 2 });
      for (const x of [-22, 22]) cyl(g, dark, 3, 16, x, 88, 34);
      return g;
    }
  },

  // ---- dinghy (hard) -------------------------------------------------------
  {
    id: 'boat_dinghy', name: 'Dinghy', cat: 'outdoor', w: 110, d: 240, h: 48,
    palettes: [
      { name: 'White', chip: '#e6e1d5', hull: '#e6e1d5' },
      { name: 'Blue', chip: '#2f5a8c', hull: '#2f5a8c' },
      { name: 'Yellow', chip: '#d9b13a', hull: '#d9b13a' }
    ],
    plan: { type: 'boat' },
    build: (p) => {
      const g = G();
      const hullm = solid(p.hull, 0.5);
      const floor = solid('#d4cdbc', 0.6);
      const trim = wood('#6f4d31', 0.5);
      // flat bottom board
      box(g, floor, 66, 4, 168, 0, 0, -20, { r: 2 });
      for (const s of [-1, 1]) {
        // flared side planks
        box(g, hullm, 5, 36, 176, s * 37, 0, -22, { rz: -s * 0.2 });
        // converging bow planks
        box(g, hullm, 5, 34, 62, s * 18.5, 2, 89, { ry: -s * 0.68, rz: -s * 0.12 });
        // gunwale caps
        box(g, trim, 6, 3.5, 176, s * 40.5, 34, -22, { r: 1 });
        box(g, trim, 6, 3.5, 62, s * 21, 34, 89, { ry: -s * 0.68, r: 1 });
      }
      // bow stem
      segment(g, trim, [0, 0, 110], [0, 40, 117], 3.5, 2.5, 10);
      // flat transom + cap
      box(g, hullm, 78, 34, 6, 0, 1, -112, { r: 2 });
      box(g, trim, 82, 3.5, 8, 0, 35, -112, { r: 1 });
      // mid thwart + small bow seat
      box(g, wood('#8a5a2b', 0.55), 80, 5, 20, 0, 24, -20);
      box(g, wood('#8a5a2b', 0.55), 44, 5, 24, 0, 24, 72);
      // small outboard hung on the transom
      const dk = solid('#2b2d31', 0.5);
      box(g, dk, 20, 16, 22, 0, 30, -121, { r: 4 });               // powerhead
      segment(g, dk, [0, 30, -118], [0, 8, -123], 3, 2.4, 8);      // leg
      sphere(g, dk, 4.5, 0, 7, -123, { sz: 1.5, seg: 10 });        // gearcase
      cyl(g, dk, 1.3, 18, 4, 37, -104, { rx: Math.PI / 2, seg: 8 }); // tiller arm
      return g;
    }
  },

  // ---- inflatable dinghy ---------------------------------------------------
  {
    id: 'boat_inflatable', name: 'Inflatable Dinghy', cat: 'outdoor', w: 140, d: 260, h: 46,
    palettes: [
      { name: 'Gray', chip: '#9a9ba0', tube: '#9a9ba0' },
      { name: 'Orange', chip: '#dd6b20', tube: '#dd6b20' },
      { name: 'Black', chip: '#3a3d42', tube: '#3a3d42' }
    ],
    plan: { type: 'boat' },
    build: (p) => {
      const g = G();
      const tube = solid(p.tube, 0.55);
      // U-shaped inflatable pontoon: two side tubes + curved bow
      for (const x of [-56, 56]) cyl(g, tube, 22, 220, x, 22, -10, { rx: Math.PI / 2, seg: 18 });
      // rounded bow tube joining the sides
      sphere(g, tube, 22, -40, 22, 96, { sx: 1, sz: 0.9 });
      sphere(g, tube, 22, 40, 22, 96, { sx: 1, sz: 0.9 });
      cyl(g, tube, 22, 90, 0, 22, 100, { rz: Math.PI / 2, seg: 18 });
      // transom + floor
      box(g, solid('#2b2d31', 0.6), 100, 30, 10, 0, 8, -116, { r: 4 });
      box(g, solid('#c2b89f', 0.7), 96, 4, 200, 0, 12, -10);
      // bench + outboard
      box(g, solid('#d4cdbc', 0.6), 96, 6, 24, 0, 28, -20);
      box(g, solid('#26282c', 0.5), 22, 32, 18, 0, 22, -126, { r: 4 });
      return g;
    }
  },

  // ---- gondola -------------------------------------------------------------
  {
    id: 'boat_gondola', name: 'Gondola', cat: 'outdoor', w: 90, d: 440, h: 120,
    palettes: [
      { name: 'Black Lacquer', chip: '#1c1c1e', hull: '#1c1c1e' },
      { name: 'Deep Green', chip: '#183a2a', hull: '#183a2a' }
    ],
    plan: { type: 'boat' },
    build: (p) => {
      const g = G();
      const hull = solid(p.hull, 0.25);
      const gold = metal('#c9a94a', 0.35);
      const red = solid('#8a2a24', 0.6);
      // long slender lacquered hull
      sphere(g, hull, 44, 0, 22, 0, { sx: 0.9, sy: 0.55, sz: 5, seg: 26 });
      sphere(g, red, 38, 0, 28, 0, { sx: 0.8, sy: 0.5, sz: 4.9, seg: 22 });
      for (const x of [-30, 30]) box(g, gold, 3, 4, 380, x, 40, 0);
      // upswept bow with ferro ornament
      cyl(g, hull, 6, 90, 0, 30, 195, { rTop: 3, rx: -0.6 });
      box(g, gold, 6, 60, 30, 0, 62, 208, { r: 3 });
      for (let i = 0; i < 5; i++) box(g, gold, 8, 4, 8, 0, 70 + i * 6, 216 - i * 4);
      // upswept stern
      cyl(g, hull, 5, 70, 0, 30, -195, { rTop: 2.5, rx: 0.6 });
      // passenger seat
      box(g, red, 60, 14, 60, 0, 34, -30, { r: 8 });
      cyl(g, gold, 2, 6, 0, 46, -30, { rTop: 5, seg: 8 });
      return g;
    }
  }
];
