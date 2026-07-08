import { G, box, cyl, sphere, legs4, glow, solid, wood, metal, chrome, glass, mirror, water, tex, lathe, cushion, drape, sweep, torus } from '../builders.js';

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

// Compact deck-mounted gooseneck: lathe escutcheon + ONE smooth sweep arc
// (spout toward +z) + aerator; optional side lever. s scales the arc height.
function bathFaucet(g, m, x, y, z, s = 1, lever = true) {
  lathe(g, m, [[2.8, 0], [2.6, 0.6], [1.9, 1.2], [1.7, 2.2]], x, y - 0.3, z, { seg: 20 });
  sweep(g, m, [
    [x, y + 1.5, z], [x, y + 13 * s, z], [x, y + 17.5 * s, z + 2],
    [x, y + 19 * s, z + 6], [x, y + 16 * s, z + 10.5], [x, y + 12 * s, z + 11.5]
  ], 1.4, { seg: 32 });
  cyl(g, m, 1.6, 1.6, x, y + 10.4 * s, z + 11.5, { seg: 14 });
  if (lever) {
    cyl(g, m, 1.0, 2.6, x + 4.4, y, z, { seg: 12 });
    box(g, m, 5.5, 1.1, 1.4, x + 6.8, y + 2.5, z, { r: 0.5, rz: -0.2 });
  }
}

export const BATHROOM_ITEMS = [
  // ---- Freestanding soaking tub -------------------------------------------
  {
    id: 'bath_tub_soaking', name: 'Freestanding Soaking Tub', cat: 'bathroom', w: 172, d: 82, h: 60,
    palettes: TUB_FINISH, plan: { type: 'bathtub' },
    build: (p) => {
      const g = G();
      const body = solid(p.body, p.rough);
      const ox = 172 / 84; // stretch the circular lathe into the oval footprint
      // ONE smooth lathe shell: sculpted foot, belly, rolled rim, inner wall
      const shell = lathe(g, body, [
        [1, 0], [24, 0.4], [30, 1.2], [37, 6], [40.5, 16], [41.5, 30],
        [40.5, 42], [38, 48], [34, 51.4], [30.5, 52], [27.5, 50.5], [26.5, 45], [26, 36], [26, 30]
      ], 0, 0, 0, { seg: 48 });
      shell.scale.x = ox;
      // white inner liner + bath water
      const liner = lathe(g, solid('#e9e8e5', 0.18), [
        [1, 31], [20, 31.8], [24, 34.5], [25, 42], [25.2, 48]
      ], 0, 0, 0, { seg: 40 });
      liner.scale.x = ox;
      const wtr = cyl(g, water(), 25.5, 2.2, 0, 43.2, 0, { seg: 40 });
      wtr.scale.x = ox;
      // teak caddy across the rim with a soap bar + rolled washcloth (intrigue)
      box(g, wood('#8a6a48', 0.5), 15, 2.4, 52, 44, 51.6, 0, { r: 0.8 });
      cushion(g, solid('#dfe7e9', 0.4), 8.5, 2.8, 5.5, 44, 54.1, -9, { puff: 0.35, dimple: 0.1 });
      cyl(g, solid('#e6e2d8', 0.9), 3.2, 11, 44, 57.1, 10, { rx: Math.PI / 2, seg: 18 });
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
          const fx = sx * 58, fz = sz * 22;
          sphere(g, feetMat, 6.5, fx, 7, fz, { sy: 1.1 });
          cyl(g, feetMat, 3.4, 14, fx, 12, fz, { rTop: 2.2 });
        }
      }
      // ONE smooth lathe shell with a real roll-top rim + open basin
      const ox = 166 / 75;
      const shell = lathe(g, body, [
        [1, 12], [24, 12.6], [31, 13.5], [34.5, 18], [35.5, 34], [35, 52], [34.5, 57],
        [36.5, 59.5], [37.5, 62], [36.5, 65], [33, 66], [30, 64.5], [28.7, 59], [28.2, 44], [28, 28]
      ], 0, 0, 0, { seg: 44 });
      shell.scale.x = ox;
      const liner = lathe(g, solid('#e9e8e5', 0.18), [[1, 26], [22, 27], [26.3, 30], [27.2, 40], [27.4, 60]], 0, 0, 0, { seg: 36 });
      liner.scale.x = ox;
      const wtr = cyl(g, water(), 27.6, 2, 0, 55, 0, { seg: 40 });
      wtr.scale.x = ox;
      // bridge-style telephone faucet: smooth sweeps, turned escutcheons
      const ch = chrome();
      for (const rx of [-68, -56]) {
        lathe(g, ch, [[3, 0], [2.8, 0.7], [2, 1.4]], rx, 65.5, -18, { seg: 16 }); // rim escutcheon
        cyl(g, ch, 1.7, 22, rx, 62, -18, { seg: 18 });                            // supply riser
        cyl(g, ch, 0.9, 5, rx, 78, -15.5, { rx: Math.PI / 2, seg: 12 });          // handle stem
        box(g, ch, 7, 1.1, 1.1, rx, 77.45, -12.8, { r: 0.4 });                    // cross handle
        box(g, ch, 1.1, 7, 1.1, rx, 74.5, -12.8, { r: 0.4 });
        sphere(g, ch, 1.3, rx, 78, -12.6);
      }
      sweep(g, ch, [[-68, 84, -18], [-68, 88, -18], [-62, 90.5, -18], [-56, 88, -18], [-56, 84, -18]], 1.6, { seg: 32 }); // bridge
      sweep(g, ch, [[-62, 90, -18], [-59, 91.5, -13], [-55, 90, -5], [-52.5, 85, -1], [-52, 81, 0]], 1.5, { seg: 32 });   // spout into the tub
      cyl(g, ch, 1.8, 1.6, -52, 79.4, 0, { seg: 14 });
      // telephone handshower hanging from a hook off the bridge
      sweep(g, ch, [[-62, 90, -19], [-62, 88, -25], [-62, 84.5, -27]], 1, { seg: 14 });
      lathe(g, ch, [[3.3, 0], [2.9, 1.6], [1.4, 3.6], [1.05, 15], [1.4, 16.5]], -62, 68, -27, { seg: 18 });
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
      // rain head on ONE smooth swept arm + valve + handheld on slide bar
      sweep(g, chrome(), [[-20, 206, -47], [-20, 188, -47], [-20, 181, -42], [-20, 179, -34]], 1.6, { seg: 24 });
      lathe(g, chrome(), [[0.5, 0], [11, 0.15], [11.3, 0.9], [2, 1.7], [1.5, 3.4]], -20, 175.8, -34, { seg: 32 }); // rain head disc
      cyl(g, chrome(), 3.4, 5, 26, 110, -46);        // thermostatic valve body
      box(g, chrome(), 2, 60, 2, 40, 96, -46);       // slide bar
      const hh = lathe(g, chrome(), [[1.1, 0], [1.05, 14], [1.6, 16], [3.1, 19], [3.4, 20.5]], 40, 138, -44, { seg: 18 });
      hh.rotation.x = 0.15;
      box(g, chrome(), 2.4, 3, 3, 40, 148, -45.5);   // slide-bar clamp
      sweep(g, solid('#c0c4c8', 0.35), [[40, 139, -44], [41, 122, -40], [38, 108, -38], [34, 100, -42], [30, 96, -46]], 0.7, { seg: 28 }); // hose
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
        bathFaucet(g, hw, cx, 88, -16, 1.1);
      }
      // rolled guest towel with a woven band, set between the basins
      cyl(g, solid('#e6e2d8', 0.9), 4.2, 17, 0, 92.2, 6, { rz: Math.PI / 2, seg: 22 });
      torus(g, solid('#b9a27c', 0.6), 3.1, 0.8, 5.5, 92.2, 6, { rx: 0, ry: Math.PI / 2 });
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
      bathFaucet(g, hw, -6, 38, -15, 0.95);
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
      // turned pedestal column — foot, waist and capital in ONE lathe profile
      lathe(g, white, [[17, 0], [15, 1.5], [11.5, 4], [9.8, 14], [9, 34], [9.4, 52], [11, 62], [13.5, 66]], 0, 0, 0, { seg: 36 });
      // basin bowl on top
      box(g, white, 56, 16, 46, 0, 68, 0, { r: 8 });
      const bowl = sphere(g, solid('#e6e5e2', 0.2), 18, 0, 78, 2, { sy: 0.5 });
      bowl.scale.x = 1.25;
      cyl(g, chrome(), 1.6, 1, 0, 76.5, 2, { seg: 14 });
      box(g, white, 30, 8, 6, 0, 80, -20, { r: 2 });    // faucet deck
      bathFaucet(g, chrome(), 0, 88, -19, 0.8, false);
      for (const hx of [-9, 9]) {                       // turned cross handles
        lathe(g, chrome(), [[1.7, 0], [1.3, 1], [0.8, 2.4], [1.5, 3.2], [0.9, 4]], hx, 88, -19, { seg: 16 });
        box(g, chrome(), 5, 0.9, 0.9, hx, 90.9, -19, { r: 0.4 });
        box(g, chrome(), 0.9, 0.9, 5, hx, 90.9, -19, { r: 0.4 });
      }
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
      // rolled towel + soft folded towel on the shelf
      cyl(g, solid('#dcd8cf', 0.85), 5, 30, -18, 30, 8, { rz: Math.PI / 2 });
      cushion(g, solid('#c8cdd2', 0.85), 26, 6.5, 26, 16, 26, 0, { puff: 0.3, dimple: 0.12 });
      // raised vessel bowl — flared lip in one lathe profile
      lathe(g, solid('#ecebe8', 0.15), [[3.5, 0], [10, 1], [15.5, 5], [18, 10.5], [18.4, 13.5], [17, 15], [14.5, 13], [13, 8], [5, 6], [0.6, 6.2]], 0, 77, 4, { seg: 40 });
      // tall vessel gooseneck: escutcheon + one smooth arc over the rim
      lathe(g, hw, [[2.9, 0], [2.7, 0.6], [2, 1.4], [1.8, 2.4]], 0, 77, -16, { seg: 20 });
      sweep(g, hw, [[0, 78, -16], [0, 100, -16], [0, 105, -14], [0, 106.5, -9], [0, 103, -4.5], [0, 98.5, -3.5]], 1.5, { seg: 36 });
      cyl(g, hw, 1.7, 1.8, 0, 96.6, -3.5, { seg: 14 });
      cyl(g, hw, 1.05, 2.6, 5, 77, -16, { seg: 12 });
      box(g, hw, 5.5, 1.1, 1.4, 7.6, 79.5, -16, { r: 0.5, rz: -0.2 });
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
    id: 'bath_toilet_wallhung', name: 'Wall-Hung Toilet', cat: 'bathroom', w: 38, d: 58, h: 72,
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
      // a real plush towel folded over the top rung: fold cap + two drape panels
      const tw = solid('#eae6dd', 0.9);
      cyl(g, tw, 2.7, 40, 0, 80, 0.6, { rz: Math.PI / 2, seg: 18 });
      drape(g, tw, 40, 37, 0, 80.6, 3, { sag: 3, wave: 2.2, folds: 4, seed: 2 });
      drape(g, tw, 40, 26, 0, 80.6, -2, { sag: 2.5, wave: 2, folds: 3, seed: 5, ry: Math.PI });
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
      // turned floor flange + slender riser (one smooth column)
      lathe(g, m, [[7, 0], [6.4, 1], [3.6, 2.4], [2.9, 4.5], [2.7, 8]], 0, 0, 0, { seg: 28 });
      cyl(g, m, 2.7, 92, 0, 6, 0, { seg: 24 });
      // ONE smooth swept gooseneck + aerator
      sweep(g, m, [[0, 94, 0], [0, 105, 0], [3, 111, 0], [8.5, 113, 0], [13.5, 109.5, 0], [15.3, 103, 0], [15.5, 98, 0]], 2.3, { seg: 40 });
      cyl(g, m, 2.7, 2, 15.5, 96.2, 0, { seg: 16 });
      // lever handle on a side boss
      cyl(g, m, 1.4, 3.5, -4.5, 46, 0, { rz: Math.PI / 2, seg: 14 });
      box(g, m, 1.6, 9, 1.6, -6.3, 45.5, 0, { r: 0.6, rz: 0.3 });
      // handshower wand hanging from a riser-mounted holder
      cyl(g, m, 1, 5, 0, 62, 2.5, { rx: Math.PI / 2, seg: 12 });
      lathe(g, m, [[3.2, 0], [2.8, 1.6], [1.3, 3.6], [1, 15.5], [1.5, 17]], 0, 46, 5.5, { seg: 18 });
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
      // a soft folded towel on the seat (cushion, not a hard box)
      cushion(g, solid('#eae6dd', 0.9), 34, 7, 26, 12, 44, 0, { puff: 0.35, dimple: 0.18 });
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
