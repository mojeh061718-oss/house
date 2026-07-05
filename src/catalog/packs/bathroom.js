import { G, box, cyl, sphere, legs4, glow, solid, wood, metal, chrome, glass, mirror, water, tex } from '../builders.js';

// Shared finish palettes ----------------------------------------------------
const TUB_FINISH = [
  { name: 'Gloss White', chip: '#f2f1ee', body: '#f2f1ee', rough: 0.14, hw: '#d5d9dd' },
  { name: 'Matte Black', chip: '#26262a', body: '#26262a', rough: 0.6, hw: '#d5d9dd' },
  { name: 'Stone Grey', chip: '#c7c4bd', body: '#c7c4bd', rough: 0.35, hw: '#c8a24a' }
];
const VANITY_FINISH = [
  { name: 'Walnut / Chrome', chip: '#6e4a2f', wood: '#6e4a2f', hw: '#d5d9dd' },
  { name: 'Espresso / Black', chip: '#3f2c20', wood: '#3f2c20', hw: '#2b2b2d' },
  { name: 'Blond Oak / Brass', chip: '#c39a63', wood: '#c39a63', hw: '#c8a24a' },
  { name: 'Matte White / Chrome', chip: '#e6e2d8', wood: '#e6e2d8', hw: '#c9ced4' }
];
const hwMat = (p) => (p.hw === '#c8a24a' ? metal('#c8a24a', 0.3) : chrome());

export const BATHROOM_ITEMS = [
  // ---- Freestanding soaking tub -------------------------------------------
  {
    id: 'bath_tub_soaking', name: 'Freestanding Soaking Tub', cat: 'bathroom', w: 172, d: 82, h: 60,
    palettes: TUB_FINISH, plan: { type: 'bathtub' },
    build: (p) => {
      const g = G();
      const body = solid(p.body, p.rough);
      // sculpted pill-shaped outer shell + narrower pedestal foot
      box(g, body, 150, 10, 60, 0, 0, 0, { r: 8 });        // base foot
      box(g, body, 170, 46, 80, 0, 9, 0, { r: 30 });       // main shell
      box(g, solid(p.body, Math.min(0.9, p.rough + 0.05)), 168, 8, 78, 0, 47, 0, { r: 28 }); // rolled rim
      // inner basin cavity + water
      box(g, solid('#e2e1de', 0.2), 142, 30, 54, 0, 22, 0, { r: 24 });
      box(g, water(), 138, 5, 50, 0, 40, 0, { r: 22 });
      // deck drain + overflow
      cyl(g, chrome(), 2.6, 1.4, 0, 44, 20, { seg: 20 });
      cyl(g, chrome(), 1.8, 1.2, 0, 41, -34, { rx: Math.PI / 2 });
      return g;
    }
  },
  // ---- Clawfoot tub --------------------------------------------------------
  {
    id: 'bath_tub_clawfoot', name: 'Clawfoot Roll-Top Tub', cat: 'bathroom', w: 168, d: 76, h: 66,
    palettes: TUB_FINISH, plan: { type: 'bathtub' },
    build: (p) => {
      const g = G();
      const body = solid(p.body, p.rough);
      const feetMat = p.hw === '#c8a24a' ? metal('#c8a24a', 0.3) : metal('#b8bcc0', 0.3);
      // four ornate ball-and-claw feet
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const fx = sx * 66, fz = sz * 26;
          sphere(g, feetMat, 6.5, fx, 7, fz, { sy: 1.1 });
          cyl(g, feetMat, 3.4, 14, fx, 12, fz, { rTop: 2.2 });
        }
      }
      // raised rolled-rim body
      box(g, body, 164, 40, 74, 0, 24, 0, { r: 28 });
      box(g, solid(p.body, Math.min(0.9, p.rough + 0.05)), 166, 9, 76, 0, 57, 0, { r: 30 }); // fat rolled rim
      box(g, solid('#e2e1de', 0.2), 140, 26, 52, 0, 34, 0, { r: 22 });
      box(g, water(), 136, 5, 48, 0, 52, 0, { r: 20 });
      // telephone-style faucet with cross handles at one end
      cyl(g, chrome(), 1.7, 26, -68, 62, -18);
      cyl(g, chrome(), 1.7, 26, -60, 62, -18);
      cyl(g, chrome(), 1.4, 22, -64, 88, -18, { rx: Math.PI / 2 });
      cyl(g, chrome(), 1.3, 12, -64, 84, -30, { rx: Math.PI / 2 });
      for (const hx of [-72, -56]) {
        cyl(g, chrome(), 3.2, 1.2, hx, 64, -18, { rx: Math.PI / 2 });
        box(g, chrome(), 7, 1, 1, hx, 64, -18);
        box(g, chrome(), 1, 1, 7, hx, 64, -18);
      }
      return g;
    }
  },
  // ---- Walk-in glass shower ------------------------------------------------
  {
    id: 'bath_shower_walkin', name: 'Walk-in Glass Shower', cat: 'bathroom', w: 100, d: 100, h: 216,
    palettes: null, plan: { type: 'shower' },
    build: () => {
      const g = G();
      // tiled base tray + tiled back walls
      box(g, tex('real_white_tile', 2, 2), 100, 6, 100, 0, 0, 0, { r: 1.5 });
      box(g, tex('real_mosaic_blue', 1.4, 3.2), 100, 208, 3, 0, 6, -48.5);
      box(g, tex('real_mosaic_blue', 1.4, 3.2), 3, 208, 100, -48.5, 6, 0);
      // recessed niche
      box(g, solid('#20343b', 0.4), 30, 40, 2, 20, 140, -47);
      // frameless glass: front panel + return + door
      box(g, glass(), 96, 200, 1.6, 0, 6, 48);
      box(g, glass(), 1.6, 200, 96, 48, 6, 0);
      const post = metal('#b0b4b8', 0.3);
      box(g, post, 3, 208, 3, -47, 5, 48);
      box(g, post, 3, 208, 3, 48, 5, 48);
      box(g, post, 3, 208, 3, 48, 5, -47);
      // door handle
      cyl(g, chrome(), 1, 34, -14, 108, 49, { seg: 12 });
      // rain head on ceiling arm + valve + handheld on slide bar
      cyl(g, chrome(), 1.6, 30, -20, 176, -46);
      cyl(g, chrome(), 1.6, 24, -20, 176, -46, { rx: Math.PI / 2 });
      cyl(g, chrome(), 11, 2, -20, 178, -34, { seg: 28 });
      cyl(g, chrome(), 3.4, 5, 26, 110, -46);       // thermostatic valve body
      box(g, chrome(), 2, 60, 2, 40, 96, -46);       // slide bar
      cyl(g, chrome(), 2, 20, 40, 150, -44, { rx: 0.5 });
      cyl(g, chrome(), 3, 3, 40, 150, -40, { rx: 0.5 });
      return g;
    }
  },
  // ---- Double-sink vanity, marble top -------------------------------------
  {
    id: 'bath_vanity_double', name: 'Double Vanity, Marble Top', cat: 'bathroom', w: 152, d: 56, h: 88,
    palettes: VANITY_FINISH, plan: { type: 'sink' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.5);
      const hw = hwMat(p);
      box(g, wd, 152, 78, 54, 0, 6, 0, { r: 1.5 });    // cabinet body (with toe kick gap)
      box(g, solid('#2b2b2d', 0.5), 138, 6, 48, 0, 0, -1); // recessed toe kick
      // drawer + door fronts
      for (const cx of [-38, 38]) {
        box(g, wood(p.wood, 0.42), 62, 20, 1.5, cx, 58, 27.2);
        box(g, wood(p.wood, 0.42), 30, 30, 1.5, cx - 15, 22, 27.2);
        box(g, wood(p.wood, 0.42), 30, 30, 1.5, cx + 15, 22, 27.2);
        box(g, hw, 22, 1.6, 1.6, cx, 68, 28);
        cyl(g, hw, 0.8, 6, cx - 8, 34, 28, { rx: Math.PI / 2 });
        cyl(g, hw, 0.8, 6, cx + 8, 34, 28, { rx: Math.PI / 2 });
      }
      // marble top + backsplash
      box(g, tex('real_marble', 1.2, 0.6), 156, 4, 58, 0, 84, 0, { r: 0.6 });
      box(g, tex('real_marble', 1.2, 0.2), 156, 9, 3, 0, 88, -27.5);
      // twin undermount basins, faucets, drains
      for (const cx of [-38, 38]) {
        const basin = sphere(g, solid('#f4f3f0', 0.18), 16, cx, 86, 2, { sy: 0.4 });
        basin.scale.x = 1.35;
        cyl(g, chrome(), 2, 1, cx, 84.5, 2, { seg: 16 });
        cyl(g, hw, 1.5, 20, cx, 88, -16);
        cyl(g, hw, 1.2, 13, cx, 107, -10, { rx: Math.PI / 2 });
        box(g, hw, 2, 6, 2, cx - 5, 90, -16, { rz: 0.3 });
      }
      return g;
    }
  },
  // ---- Single floating vanity ---------------------------------------------
  {
    id: 'bath_vanity_floating', name: 'Floating Vanity', cat: 'bathroom', w: 92, d: 48, h: 52,
    elevation: 56, mount: 'wall', palettes: VANITY_FINISH, plan: { type: 'sink' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.5);
      const hw = hwMat(p);
      box(g, wd, 92, 34, 46, 0, 0, 0, { r: 1.5 });     // wall-hung cabinet body
      box(g, wood(p.wood, 0.42), 84, 22, 1.5, 0, 6, 23.2); // long drawer front
      box(g, hw, 40, 1.6, 1.6, 0, 17, 24);              // linear pull
      // stone top + integrated basin
      box(g, tex('real_marble', 0.9, 0.5), 96, 4, 50, 0, 34, 0, { r: 0.6 });
      const basin = sphere(g, solid('#f4f3f0', 0.18), 15, -6, 36, 2, { sy: 0.42 });
      basin.scale.x = 1.5;
      cyl(g, chrome(), 1.9, 1, -6, 34.5, 2, { seg: 16 });
      cyl(g, hw, 1.5, 18, -6, 38, -15);
      cyl(g, hw, 1.2, 12, -6, 55, -9, { rx: Math.PI / 2 });
      return g;
    }
  },
  // ---- Pedestal sink -------------------------------------------------------
  {
    id: 'bath_pedestal_sink', name: 'Pedestal Sink', cat: 'bathroom', w: 56, d: 48, h: 86,
    palettes: null, plan: { type: 'sink' },
    build: () => {
      const g = G();
      const white = solid('#f2f1ee', 0.2);
      cyl(g, white, 13, 66, 0, 0, 0, { rTop: 10 });     // fluted pedestal column
      cyl(g, white, 16, 6, 0, 0, 0, { rTop: 14 });      // foot
      // basin bowl on top
      box(g, white, 56, 16, 46, 0, 68, 0, { r: 8 });
      const bowl = sphere(g, solid('#e6e5e2', 0.2), 18, 0, 78, 2, { sy: 0.5 });
      bowl.scale.x = 1.25;
      cyl(g, chrome(), 1.6, 1, 0, 76.5, 2, { seg: 14 });
      box(g, white, 30, 8, 6, 0, 80, -20, { r: 2 });    // faucet deck
      cyl(g, chrome(), 1.5, 16, 0, 84, -18);
      cyl(g, chrome(), 1.2, 11, 0, 100, -12, { rx: Math.PI / 2 });
      for (const hx of [-9, 9]) cyl(g, chrome(), 1.6, 4, hx, 84, -18);
      return g;
    }
  },
  // ---- Vessel-sink washstand ----------------------------------------------
  {
    id: 'bath_washstand_vessel', name: 'Vessel-Sink Washstand', cat: 'bathroom', w: 84, d: 50, h: 90,
    palettes: VANITY_FINISH, plan: { type: 'sink' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.5);
      const hw = hwMat(p);
      // open console frame with metal legs + lower shelf
      legs4(g, metal('#3a3d40', 0.35), 78, 44, 74, 2, 3, true);
      box(g, wd, 84, 5, 50, 0, 72, 0, { r: 1 });        // wood top
      box(g, wd, 74, 4, 42, 0, 22, 0, { r: 1 });        // lower shelf
      // rolled towel + folded towel on shelf
      cyl(g, solid('#dcd8cf', 0.85), 5, 30, -18, 30, 8, { rz: Math.PI / 2 });
      box(g, solid('#c8cdd2', 0.85), 26, 6, 26, 16, 26, 0, { r: 1 });
      // raised vessel bowl
      cyl(g, solid('#ecebe8', 0.15), 18, 15, 0, 77, 4, { rTop: 20, seg: 32 });
      cyl(g, solid('#d6d5d2', 0.2), 15, 3, 0, 84, 4, { seg: 32 });
      // tall vessel faucet
      cyl(g, hw, 1.6, 30, 0, 77, -16);
      cyl(g, hw, 1.3, 22, 0, 107, -10, { rx: Math.PI / 2 });
      cyl(g, hw, 2, 4, 0, 107, 2, { rx: Math.PI / 2 });
      box(g, hw, 3, 8, 2, 12, 82, -16, { rz: -0.3 });
      return g;
    }
  },
  // ---- Modern skirted toilet ----------------------------------------------
  {
    id: 'bath_toilet_skirted', name: 'Skirted Toilet', cat: 'bathroom', w: 40, d: 72, h: 62,
    palettes: null, plan: { type: 'toilet' },
    build: () => {
      const g = G();
      const white = solid('#f2f1ee', 0.22);
      // low concealed tank + skirted one-piece body
      box(g, white, 40, 40, 22, 0, 20, -26, { r: 5 });    // tank
      box(g, white, 34, 3, 20, 0, 60, -26, { r: 1.5 });   // lid top
      box(g, metal('#c4c8cc', 0.3), 9, 2, 6, 0, 62, -26, { r: 1 }); // dual flush plate
      box(g, white, 36, 40, 44, 0, 2, 4, { r: 10 });      // skirted base
      // seat + bowl
      box(g, white, 38, 5, 46, 0, 42, 6, { r: 12 });      // closed seat/lid
      sphere(g, solid('#e6e5e2', 0.25), 15, 0, 40, 8, { sy: 0.2, sx: 0.9, sz: 1.15 });
      return g;
    }
  },
  // ---- Wall-hung toilet ----------------------------------------------------
  {
    id: 'bath_toilet_wallhung', name: 'Wall-Hung Toilet', cat: 'bathroom', w: 38, d: 58, h: 42,
    elevation: 34, mount: 'wall', palettes: null, plan: { type: 'toilet' },
    build: () => {
      const g = G();
      const white = solid('#f2f1ee', 0.22);
      // cantilevered bowl (built low, lifted by elevation)
      box(g, white, 38, 30, 52, 0, 6, 6, { r: 12 });
      box(g, white, 36, 5, 50, 0, 34, 8, { r: 12 });      // seat
      sphere(g, solid('#e6e5e2', 0.25), 14, 0, 30, 10, { sy: 0.22, sx: 0.9, sz: 1.15 });
      // flush actuator plate above on the wall
      box(g, metal('#e8eaec', 0.3), 22, 15, 1.5, 0, 62, -28, { r: 1 });
      box(g, metal('#c4c8cc', 0.25), 9, 12, 1, 0, 63.5, -28, { r: 0.6 });
      return g;
    }
  },
  // ---- Bidet ---------------------------------------------------------------
  {
    id: 'bath_bidet', name: 'Bidet', cat: 'bathroom', w: 38, d: 58, h: 42,
    palettes: null, plan: { type: 'toilet' },
    build: () => {
      const g = G();
      const white = solid('#f2f1ee', 0.22);
      box(g, white, 26, 38, 30, 0, 2, 4, { r: 8 });       // pedestal
      box(g, white, 38, 10, 52, 0, 34, 6, { r: 14 });     // rim
      sphere(g, solid('#e6e5e2', 0.25), 15, 0, 38, 8, { sy: 0.24, sx: 0.9, sz: 1.15 });
      cyl(g, chrome(), 1.6, 1, 0, 34, 6, { seg: 14 });    // spray outlet
      // deck mixer + handles
      box(g, white, 22, 5, 7, 0, 40, -20, { r: 2 });
      cyl(g, chrome(), 1.3, 8, 0, 44, -19, { rx: 0.4 });
      for (const hx of [-7, 7]) cyl(g, chrome(), 1.4, 4, hx, 44, -19);
      return g;
    }
  },
  // ---- Towel-warmer ladder rail -------------------------------------------
  {
    id: 'bath_towel_warmer', name: 'Towel-Warmer Ladder Rail', cat: 'bathroom', w: 56, d: 14, h: 116,
    palettes: [
      { name: 'Polished Chrome', chip: '#d5d9dd', bar: '#d5d9dd' },
      { name: 'Matte Black', chip: '#2b2b2d', bar: '#2b2b2d' },
      { name: 'Brushed Brass', chip: '#c8a24a', bar: '#c8a24a' }
    ], plan: { type: 'box' },
    build: (p) => {
      const bar = p.bar === '#d5d9dd' ? chrome() : metal(p.bar, 0.3);
      const g = G();
      // two uprights + curved feet
      for (const sx of [-24, 24]) {
        cyl(g, bar, 2, 112, sx, 2, 0, { seg: 16 });
        cyl(g, bar, 3, 3, sx, 0, 0, { seg: 16 });
        cyl(g, bar, 2, 8, sx, 2, 0, { rx: Math.PI / 2 });
      }
      // horizontal heated rungs
      for (let i = 0; i < 9; i++) {
        const y = 14 + i * 11;
        cyl(g, bar, 1.5, 48, 0, y, 0, { rz: Math.PI / 2, seg: 12 });
      }
      // a plush towel draped over one rung
      box(g, solid('#eae6dd', 0.9), 40, 34, 5, 0, 40, 5, { r: 2 });
      box(g, solid('#eae6dd', 0.9), 40, 6, 9, 0, 74, 4, { r: 3 });
      return g;
    }
  },
  // ---- Tall linen tower ----------------------------------------------------
  {
    id: 'bath_linen_tower', name: 'Tall Linen Tower', cat: 'bathroom', w: 46, d: 40, h: 188,
    palettes: VANITY_FINISH, plan: { type: 'storage' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.55);
      const hw = hwMat(p);
      box(g, wd, 46, 180, 40, 0, 6, 0, { r: 1.5 });
      box(g, solid('#2b2b2d', 0.5), 40, 6, 36, 0, 0, -1);   // toe kick
      // upper cabinet doors + lower drawers
      box(g, wood(p.wood, 0.45), 40, 96, 1.5, 0, 84, 20.2);
      box(g, wood(p.wood, 0.45), 40, 22, 1.5, 0, 54, 20.2);
      box(g, wood(p.wood, 0.45), 40, 22, 1.5, 0, 30, 20.2);
      // open display shelf with folded towels
      box(g, solid('#c8cdd2', 0.85), 34, 10, 30, 0, 16, 4, { r: 1 });
      box(g, solid('#d8d4cb', 0.85), 34, 9, 30, 0, 26, 4, { r: 1 });
      // hardware
      box(g, hw, 1.6, 40, 1.6, 10, 108, 21);
      for (const y of [61, 37]) cyl(g, hw, 0.8, 12, 0, y, 21, { rz: Math.PI / 2 });
      return g;
    }
  },
  // ---- Backlit LED mirror --------------------------------------------------
  {
    id: 'bath_mirror_led', name: 'Backlit LED Mirror', cat: 'bathroom', w: 90, d: 6, h: 70,
    elevation: 105, mount: 'wall', palettes: null, plan: { type: 'wallDecor' },
    light: { y: 35, color: '#eaf2ff', intensity: 0.55, distance: 260 },
    build: () => {
      const g = G();
      // glowing halo panel slightly larger than the glass
      box(g, glow('#dcebff', 0.9, 0.5), 90, 70, 1, 0, 0, -2);
      box(g, solid('#26262a', 0.4), 84, 64, 2.5, 0, 3, -0.5); // backer
      box(g, mirror(), 80, 60, 1.2, 0, 5, 1);                  // mirror glass
      // thin edge glow strip framing the mirror
      box(g, glow('#eaf6ff', 1.2, 0.5), 84, 2, 1.4, 0, 65, 1);
      box(g, glow('#eaf6ff', 1.2, 0.5), 84, 2, 1.4, 0, 3, 1);
      return g;
    }
  },
  // ---- Medicine cabinet ----------------------------------------------------
  {
    id: 'bath_medicine_cabinet', name: 'Mirrored Medicine Cabinet', cat: 'bathroom', w: 60, d: 14, h: 76,
    elevation: 120, mount: 'wall', palettes: null, plan: { type: 'wallCabinet' },
    build: () => {
      const g = G();
      const cab = metal('#d9dbdd', 0.35);
      box(g, cab, 60, 76, 14, 0, 0, -2, { r: 1 });          // recessed body
      box(g, solid('#e8eaec', 0.5), 54, 68, 8, 0, 4, -1);    // interior
      box(g, solid('#f4f5f6', 0.6), 54, 1.5, 8, 0, 28, -1);  // glass shelf
      box(g, solid('#f4f5f6', 0.6), 54, 1.5, 8, 0, 50, -1);
      // two mirrored doors with a center gap
      for (const sx of [-1, 1]) {
        box(g, mirror(), 28, 72, 1.5, sx * 15, 2, 6.2);
        box(g, metal('#c4c8cc', 0.3), 1.2, 20, 1.5, sx * 1.5, 30, 7);
      }
      return g;
    }
  },
  // ---- Freestanding tub filler --------------------------------------------
  {
    id: 'bath_tub_filler', name: 'Freestanding Tub Filler', cat: 'bathroom', w: 26, d: 26, h: 118,
    palettes: [
      { name: 'Polished Chrome', chip: '#d5d9dd', hw: '#d5d9dd' },
      { name: 'Matte Black', chip: '#2b2b2d', hw: '#2b2b2d' },
      { name: 'Brushed Brass', chip: '#c8a24a', hw: '#c8a24a' }
    ], plan: { type: 'box' },
    build: (p) => {
      const m = p.hw === '#d5d9dd' ? chrome() : metal(p.hw, 0.3);
      const g = G();
      cyl(g, m, 6, 2.5, 0, 0, 0, { seg: 24 });          // floor flange
      cyl(g, m, 2.6, 100, 0, 2, 0, { seg: 20 });        // riser
      // gooseneck arc over the tub
      cyl(g, m, 2.4, 20, 0, 100, 0, { rz: -0.7 });
      cyl(g, m, 2.4, 18, 6, 112, 0, { rz: -1.4 });
      cyl(g, m, 2.4, 12, 14, 110, 0);                   // downspout
      cyl(g, m, 3.2, 3, 14, 98, 0, { seg: 18 });        // spout end
      // hand-shower cradle + wand
      cyl(g, m, 2, 10, -6, 60, 0, { rx: Math.PI / 2 });
      cyl(g, m, 1.8, 16, -6, 58, 8, { rx: 0.5 });
      cyl(g, m, 2.6, 3, -6, 58, 14, { rx: 0.5 });
      // lever handle
      box(g, m, 2, 12, 2, 6, 42, 0, { rz: -0.4 });
      return g;
    }
  },
  // ---- Bath stool / bench --------------------------------------------------
  {
    id: 'bath_stool', name: 'Teak Bath Bench', cat: 'bathroom', w: 70, d: 34, h: 44,
    palettes: [
      { name: 'Natural Teak', chip: '#b8895a', wood: '#b8895a' },
      { name: 'Walnut', chip: '#6e4a2f', wood: '#6e4a2f' },
      { name: 'Whitewash', chip: '#d8cdbd', wood: '#d8cdbd' }
    ], plan: { type: 'stool' },
    build: (p) => {
      const g = G();
      const wd = wood(p.wood, 0.5);
      // slatted seat top
      for (let i = 0; i < 6; i++) {
        box(g, wd, 70, 3, 3.6, 0, 41, -15 + i * 6, { r: 0.8 });
      }
      box(g, wd, 66, 3, 30, 0, 24, 0, { r: 0.6 });     // lower shelf
      legs4(g, wd, 64, 28, 41, 2.4, 4, true);
      // a folded towel on the seat
      box(g, solid('#eae6dd', 0.9), 34, 7, 26, 12, 44, 0, { r: 2 });
      return g;
    }
  },
  // ---- Toilet-paper stand --------------------------------------------------
  {
    id: 'bath_tp_stand', name: 'Toilet-Paper Stand', cat: 'bathroom', w: 20, d: 20, h: 66,
    palettes: [
      { name: 'Chrome', chip: '#d5d9dd', hw: '#d5d9dd' },
      { name: 'Matte Black', chip: '#2b2b2d', hw: '#2b2b2d' },
      { name: 'Brass', chip: '#c8a24a', hw: '#c8a24a' }
    ], plan: { type: 'box' },
    build: (p) => {
      const m = p.hw === '#d5d9dd' ? chrome() : metal(p.hw, 0.3);
      const g = G();
      cyl(g, m, 9, 1.6, 0, 0, 0, { seg: 24 });          // weighted base
      cyl(g, m, 1.4, 64, 0, 1, 0, { seg: 16 });         // post
      // top arm holding a roll + a reserve roll on the post
      cyl(g, m, 1.2, 12, 0, 62, 0, { rx: Math.PI / 2 });
      cyl(g, solid('#f4f2ee', 0.85), 5.5, 11, 0, 62, 8, { rx: Math.PI / 2, rTop: 5.5, seg: 24 });
      cyl(g, solid('#d8d4cc', 0.7), 2, 11.4, 0, 62, 8, { rx: Math.PI / 2, seg: 16 });
      cyl(g, solid('#f4f2ee', 0.85), 5.5, 10, 0, 20, 0, { rx: Math.PI / 2, seg: 24 });
      return g;
    }
  },
  // ---- Robe hook rail ------------------------------------------------------
  {
    id: 'bath_robe_hooks', name: 'Robe Hook Rail', cat: 'bathroom', w: 60, d: 8, h: 12,
    elevation: 150, mount: 'wall', palettes: [
      { name: 'Chrome', chip: '#d5d9dd', hw: '#d5d9dd' },
      { name: 'Matte Black', chip: '#2b2b2d', hw: '#2b2b2d' },
      { name: 'Brass', chip: '#c8a24a', hw: '#c8a24a' }
    ], plan: { type: 'wallDecor' },
    build: (p) => {
      const m = p.hw === '#d5d9dd' ? chrome() : metal(p.hw, 0.3);
      const g = G();
      box(g, wood('#3f2c20', 0.45), 60, 8, 3, 0, 2, -1.5, { r: 1 }); // wood back plate
      for (let i = 0; i < 4; i++) {
        const x = -22.5 + i * 15;
        cyl(g, m, 2.2, 2, x, 3, 0, { rx: Math.PI / 2, seg: 16 }); // base knob
        cyl(g, m, 1.2, 7, x, 3, 3, { rx: 0.5, seg: 12 });         // hook stem
        sphere(g, m, 1.8, x, 0.5, 6.5);                            // hook tip
      }
      return g;
    }
  },
  // ---- Bath rug ------------------------------------------------------------
  {
    id: 'bath_rug', name: 'Plush Bath Rug', cat: 'bathroom', w: 90, d: 58, h: 2.5, noShadow: true,
    palettes: [
      { name: 'Cloud Grey', chip: '#c4c8cc', fab: '#c4c8cc' },
      { name: 'Warm Sand', chip: '#d8cdb8', fab: '#d8cdb8' },
      { name: 'Sage', chip: '#a9b6a0', fab: '#a9b6a0' },
      { name: 'Charcoal', chip: '#4a4d51', fab: '#4a4d51' }
    ], plan: { type: 'rug' },
    build: (p) => {
      const g = G();
      const f = solid(p.fab, 0.95);
      box(g, f, 90, 2, 58, 0, 0, 0, { r: 3 });
      // plush pile texture via rows of soft ridges
      for (let i = 0; i < 9; i++) {
        box(g, solid(p.fab, 0.98), 84, 1.6, 3.2, 0, 1.6, -24 + i * 6, { r: 1.4 });
      }
      return g;
    }
  }
];
