import {
  G, box, cyl, sphere, legs4, glow, solid, wood, metal, chrome, glass
} from '../builders.js';

// Games & recreation — indoor rec-room catalog.
// Origin at footprint center on the floor; +Y up; front faces +Z; units = cm.

export const GAMES_ITEMS = [
  // ---------------------------------------------------------- Ping-Pong Table
  {
    id: 'game_pingpong', name: 'Ping-Pong Table', cat: 'games', w: 152, d: 274, h: 76,
    palettes: [
      { name: 'Tournament Green', chip: '#1f6b4a', felt: '#1f6b4a' },
      { name: 'Olympic Blue', chip: '#215f9c', felt: '#215f9c' }
    ],
    plan: { type: 'table' },
    build: (p) => {
      const g = G();
      const top = solid(p.felt, 0.65);
      const white = solid('#f2f2ee', 0.6);
      const frame = metal('#2b2e33', 0.4);
      box(g, top, 152, 4, 274, 0, 72, 0, { r: 1 });
      // painted lines sitting just above the surface
      box(g, white, 3, 0.5, 274, -74.5, 75.8, 0);
      box(g, white, 3, 0.5, 274, 74.5, 75.8, 0);
      box(g, white, 2, 0.5, 274, 0, 75.8, 0);
      box(g, white, 152, 0.5, 3, 0, 75.8, -135.5);
      box(g, white, 152, 0.5, 3, 0, 75.8, 135.5);
      // net + posts across the middle
      box(g, solid('#dcdcda', 0.85), 152, 15, 1.4, 0, 72, 0);
      box(g, frame, 3, 20, 4, -76, 72, 0);
      box(g, frame, 3, 20, 4, 76, 72, 0);
      // apron + square legs
      box(g, frame, 140, 8, 6, 0, 64, 130);
      box(g, frame, 140, 8, 6, 0, 64, -130);
      box(g, frame, 6, 8, 244, 68, 64, 0);
      box(g, frame, 6, 8, 244, -68, 64, 0);
      legs4(g, frame, 136, 240, 64, 4, 12, true);
      return g;
    }
  },

  // ------------------------------------------------------------ Foosball Table
  {
    id: 'game_foosball', name: 'Foosball Table', cat: 'games', w: 78, d: 140, h: 90,
    palettes: [
      { name: 'Walnut', chip: '#5a4230', wood: '#5a4230' },
      { name: 'Maple', chip: '#b58a52', wood: '#b58a52' }
    ],
    plan: { type: 'table' },
    build: (p) => {
      const g = G();
      const cab = wood(p.wood, 0.55);
      const field = solid('#2f7d4a', 0.7);
      const rod = chrome();
      const white = solid('#eeeeea', 0.6);
      legs4(g, cab, 70, 132, 72, 4, 7, true);
      box(g, cab, 78, 20, 140, 0, 70, 0, { r: 3 });
      // recessed field with side rails + goals
      box(g, field, 64, 1, 128, 0, 89, 0);
      box(g, white, 64, 0.4, 2, 0, 89.6, 0);
      box(g, cab, 4, 6, 140, 36, 89, 0);
      box(g, cab, 4, 6, 140, -36, 89, 0);
      box(g, cab, 72, 6, 4, 0, 89, 68);
      box(g, cab, 72, 6, 4, 0, 89, -68);
      box(g, solid('#141414', 0.5), 22, 5, 3, 0, 89, 69);
      box(g, solid('#141414', 0.5), 22, 5, 3, 0, 89, -69);
      // rods with little players + handles
      const zs = [-48, -16, 16, 48];
      const grip = solid('#1c1c1e', 0.5);
      zs.forEach((z, i) => {
        cyl(g, rod, 1.2, 100, 0, 94, z, { rz: Math.PI / 2 });
        const men = solid(i % 2 === 0 ? '#b3352b' : '#215f9c', 0.5);
        for (const x of [-18, 18]) box(g, men, 3, 12, 5, x, 82, z);
        box(g, grip, 5, 5, 11, 52, 94, z);
      });
      // score counters
      box(g, grip, 18, 10, 3, 0, 78, 71);
      box(g, grip, 18, 10, 3, 0, 78, -71);
      return g;
    }
  },

  // --------------------------------------------------------- Air-Hockey Table
  {
    id: 'game_airhockey', name: 'Air-Hockey Table', cat: 'games', w: 120, d: 210, h: 80,
    palettes: [
      { name: 'Arctic White', chip: '#dfe4ea', body: '#dfe4ea' },
      { name: 'Neon Black', chip: '#26282c', body: '#26282c' }
    ],
    plan: { type: 'table' },
    build: (p) => {
      const g = G();
      const cab = solid(p.body, 0.5);
      const surface = solid('#eef3f7', 0.2);
      const rail = solid('#1f2933', 0.4);
      const line = solid('#c2352b', 0.6);
      box(g, cab, 116, 70, 206, 0, 0, 0, { r: 4 });
      box(g, surface, 112, 4, 202, 0, 70, 0);
      box(g, rail, 116, 8, 6, 0, 70, 103);
      box(g, rail, 116, 8, 6, 0, 70, -103);
      box(g, rail, 6, 8, 206, 58, 70, 0);
      box(g, rail, 6, 8, 206, -58, 70, 0);
      box(g, line, 112, 0.4, 2, 0, 74.2, 0);
      cyl(g, line, 16, 0.4, 0, 74, 0);
      box(g, solid('#111214', 0.5), 42, 6, 3, 0, 71, 102);
      box(g, solid('#111214', 0.5), 42, 6, 3, 0, 71, -102);
      // mallets + puck
      cyl(g, solid('#b3352b', 0.5), 7, 3, -22, 74, 58);
      cyl(g, solid('#b3352b', 0.5), 3.5, 5, -22, 77, 58);
      cyl(g, solid('#215f9c', 0.5), 7, 3, 22, 74, -58);
      cyl(g, solid('#215f9c', 0.5), 3.5, 5, 22, 77, -58);
      cyl(g, solid('#f2c12e', 0.4), 4.5, 2, 10, 74, -18);
      legs4(g, cab, 104, 194, 8, 4, 8, true);
      return g;
    }
  },

  // ------------------------------------------------------------ Pool Table
  {
    id: 'game_pool', name: 'Billiards Table', cat: 'games', w: 148, d: 258, h: 81,
    palettes: [
      { name: 'Classic Oak', chip: '#6a4b2e', wood: '#6a4b2e', felt: '#1f6b4a' },
      { name: 'Espresso Blue', chip: '#2c2622', wood: '#2c2622', felt: '#1f4f8a' }
    ],
    plan: { type: 'table' },
    build: (p) => {
      const g = G();
      const railw = wood(p.wood, 0.5);
      const felt = solid(p.felt, 0.85);
      const pocket = solid('#161616', 0.6);
      legs4(g, railw, 124, 234, 55, 7, 12, true);
      box(g, railw, 134, 24, 248, 0, 55, 0, { r: 3 });
      box(g, felt, 120, 4, 232, 0, 77, 0);
      // cushion rails
      box(g, railw, 134, 11, 9, 0, 76, 124);
      box(g, railw, 134, 11, 9, 0, 76, -124);
      box(g, railw, 9, 11, 250, 65, 76, 0);
      box(g, railw, 9, 11, 250, -65, 76, 0);
      // six pockets
      const pk = [[-60, -116], [60, -116], [-60, 116], [60, 116], [-64, 0], [64, 0]];
      for (const [x, z] of pk) cyl(g, pocket, 6, 6, x, 74, z);
      // racked balls
      const cols = ['#f2c12e', '#215f9c', '#b3352b', '#2f7d4a', '#5a2f7d', '#e8e8e8'];
      let n = 0;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c <= r; c++) {
          sphere(g, solid(cols[n % 6], 0.35), 3, (c - r / 2) * 6.4, 82, 60 + r * 5.6);
          n++;
        }
      }
      sphere(g, solid('#f4f4f0', 0.3), 3, 0, 82, -50);
      return g;
    }
  },

  // -------------------------------------------------------- Arcade Cabinet
  {
    id: 'game_arcade', name: 'Arcade Cabinet', cat: 'games', w: 70, d: 82, h: 178,
    palettes: [
      { name: 'Cabinet Red', chip: '#a8302a', body: '#a8302a', accent: '#ffcf3a' },
      { name: 'Cabinet Black', chip: '#1d1f23', body: '#1d1f23', accent: '#2fd9ff' }
    ],
    plan: { type: 'box' },
    light: { y: 120, color: '#6a9cff', intensity: 0.6, distance: 300 },
    build: (p) => {
      const g = G();
      const body = solid(p.body, 0.5);
      const black = solid('#111214', 0.4);
      box(g, body, 70, 118, 72, 0, 0, -3);
      // screen bezel + glowing CRT
      box(g, black, 62, 48, 6, 0, 108, 30);
      box(g, glow('#2c4a86', 0.8), 50, 38, 1, 0, 112, 33.5);
      // marquee
      box(g, body, 70, 22, 64, 0, 150, -3);
      box(g, glow(p.accent, 0.9), 62, 15, 2, 0, 153, 30);
      // slanted control panel + stick + buttons
      box(g, black, 66, 8, 34, 0, 86, 30, { rx: -0.42 });
      cyl(g, chrome(), 1.5, 11, -16, 92, 34);
      sphere(g, solid('#b3352b', 0.4), 3, -16, 103, 35);
      for (let i = 0; i < 4; i++) {
        sphere(g, glow(i % 2 ? '#ffcf3a' : '#2fd9ff', 0.7), 2.4, 4 + i * 10, 95, 36);
      }
      // coin door
      box(g, black, 26, 20, 2, 0, 30, 34);
      box(g, chrome(), 8, 4, 2, 0, 40, 35.2);
      return g;
    }
  },

  // ---------------------------------------------------------- Pinball Machine
  {
    id: 'game_pinball', name: 'Pinball Machine', cat: 'games', w: 76, d: 138, h: 122,
    palettes: [
      { name: 'Wildfire', chip: '#c23a2a', body: '#c23a2a', accent: '#ff3a4a' },
      { name: 'Midnight', chip: '#22242a', body: '#22242a', accent: '#2fd9ff' }
    ],
    plan: { type: 'box' },
    light: { y: 96, color: '#ff5a5a', intensity: 0.7, distance: 280 },
    build: (p) => {
      const g = G();
      const body = solid(p.body, 0.5);
      const black = solid('#141519', 0.4);
      legs4(g, black, 66, 108, 55, 4, 6, true);
      // slanted playfield deck + glass + glowing art
      box(g, body, 72, 12, 112, 0, 56, 8, { rx: -0.12 });
      box(g, glow('#22344f', 0.45), 66, 1, 104, 0, 62, 8, { rx: -0.12 });
      box(g, glass(), 68, 2, 106, 0, 66, 8, { rx: -0.12 });
      // bumpers + flippers
      for (const [x, z] of [[-14, -10], [16, 6], [0, -30]]) {
        cyl(g, glow('#ffd24a', 0.8), 5, 4, x, 64, z, { rx: -0.12 });
      }
      box(g, solid('#e8622a', 0.4), 14, 3, 4, -14, 62, 44, { ry: 0.4 });
      box(g, solid('#e8622a', 0.4), 14, 3, 4, 14, 62, 44, { ry: -0.4 });
      // vertical backbox with lit backglass
      box(g, body, 74, 58, 14, 0, 66, -60, { rx: 0.12 });
      box(g, glow(p.accent, 0.9), 64, 48, 2, 0, 72, -52);
      return g;
    }
  },

  // ------------------------------------------------------- Dartboard (wall)
  {
    id: 'game_dartboard', name: 'Dartboard Cabinet', cat: 'games', w: 48, d: 10, h: 48,
    elevation: 165, mount: 'wall',
    palettes: [
      { name: 'Walnut', chip: '#4a3524', wood: '#4a3524' },
      { name: 'Black', chip: '#26282c', wood: '#26282c' }
    ],
    plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      const cab = wood(p.wood, 0.5);
      const black = solid('#0d0d0d', 0.5);
      const red = solid('#b3352b', 0.5);
      const green = solid('#2f7d4a', 0.5);
      const cream = solid('#e6d8b4', 0.5);
      box(g, cab, 46, 46, 4, 0, 0, -3);
      // concentric board rings, each nudged forward in +Z
      cyl(g, black, 18, 1.5, 0, 0, -0.5, { rx: Math.PI / 2, seg: 32 });
      cyl(g, cream, 17, 0.4, 0, 0, 0.4, { rx: Math.PI / 2, seg: 32 });
      cyl(g, black, 15.5, 0.5, 0, 0, 0.6, { rx: Math.PI / 2, seg: 32 });
      cyl(g, red, 10, 0.5, 0, 0, 0.9, { rx: Math.PI / 2, seg: 32 });
      cyl(g, black, 8.5, 0.6, 0, 0, 1.1, { rx: Math.PI / 2, seg: 32 });
      cyl(g, green, 2.4, 0.7, 0, 0, 1.3, { rx: Math.PI / 2, seg: 24 });
      cyl(g, red, 1.1, 0.8, 0, 0, 1.5, { rx: Math.PI / 2, seg: 16 });
      // number ring + open cabinet doors
      cyl(g, metal('#9a9ea4', 0.3), 18.5, 0.6, 0, 0, 0.2, { rTop: 18.5, rx: Math.PI / 2, seg: 32 });
      box(g, cab, 22, 44, 3, -22, 0, 3, { ry: 0.5 });
      box(g, cab, 22, 44, 3, 22, 0, 3, { ry: -0.5 });
      // a couple of stuck darts
      cyl(g, chrome(), 0.5, 10, 5, 6, 6, { rx: Math.PI / 2 });
      cyl(g, solid('#ffcf3a', 0.5), 1.3, 4, 5, 6, 10, { rx: Math.PI / 2, seg: 6 });
      cyl(g, chrome(), 0.5, 10, -7, -4, 6, { rx: Math.PI / 2 });
      cyl(g, solid('#2fd9ff', 0.5), 1.3, 4, -7, -4, 10, { rx: Math.PI / 2, seg: 6 });
      return g;
    }
  },

  // ------------------------------------------------------------ Cornhole Set
  {
    id: 'game_cornhole', name: 'Cornhole Set', cat: 'games', w: 62, d: 250, h: 32,
    palettes: [
      { name: 'Cardinal', chip: '#b3352b', wood: '#c9b48a', paint: '#b3352b' },
      { name: 'Navy', chip: '#215f9c', wood: '#c9b48a', paint: '#215f9c' }
    ],
    plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const board = wood(p.wood, 0.5);
      const paint = solid(p.paint, 0.6);
      const hole = solid('#141414', 0.6);
      const buildBoard = (zc, sign) => {
        box(g, board, 61, 3, 122, 0, 16, zc, { rx: sign * 0.11 });
        box(g, paint, 61, 0.4, 30, 0, 22, zc - sign * 42, { rx: sign * 0.11 });
        cyl(g, hole, 8, 5, 0, 17, zc - sign * 34);
        // front + back legs
        box(g, board, 55, 8, 4, 0, 0, zc + sign * 58);
        box(g, board, 55, 24, 4, 0, 0, zc - sign * 58);
      };
      buildBoard(-64, 1);
      buildBoard(64, -1);
      // bean bags
      const bags = ['#b3352b', '#215f9c', '#b3352b', '#215f9c'];
      bags.forEach((c, i) => {
        box(g, solid(c, 0.85), 10, 3, 10, (i - 1.5) * 13, 18, -60 + (i % 2) * 8, { r: 2 });
      });
      return g;
    }
  },

  // ------------------------------------------------------------ Chess Table
  {
    id: 'game_chess', name: 'Chess Table', cat: 'games', w: 64, d: 64, h: 74,
    palettes: [
      { name: 'Walnut & Maple', chip: '#5a4230', wood: '#5a4230' },
      { name: 'Ebony', chip: '#2a2420', wood: '#2a2420' }
    ],
    plan: { type: 'table' },
    build: (p) => {
      const g = G();
      const frame = wood(p.wood, 0.5);
      const dark = wood('#3a2a1a', 0.4);
      const light = wood('#cbb488', 0.4);
      box(g, frame, 64, 4, 64, 0, 68, 0, { r: 1.5 });
      box(g, dark, 52, 1, 52, 0, 72, 0);
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          if ((i + j) % 2 === 0) {
            box(g, light, 5.6, 0.8, 5.6, (i - 3.5) * 6, 72.6, (j - 3.5) * 6);
          }
        }
      }
      // two representative pieces
      cyl(g, solid('#efe9dd', 0.4), 2.6, 6, -9, 73.4, -9, { rTop: 1.8 });
      sphere(g, solid('#efe9dd', 0.4), 2.2, -9, 79.4, -9);
      cyl(g, solid('#2a2724', 0.4), 2.6, 6, 9, 73.4, 9, { rTop: 1.8 });
      sphere(g, solid('#2a2724', 0.4), 2.2, 9, 79.4, 9);
      legs4(g, frame, 56, 56, 68, 3, 6, true);
      return g;
    }
  },

  // ------------------------------------------------------------ Poker Table
  {
    id: 'game_poker', name: 'Poker Table', cat: 'games', w: 150, d: 150, h: 76,
    palettes: [
      { name: 'Casino Green', chip: '#1f6b4a', felt: '#1f6b4a' },
      { name: 'Casino Red', chip: '#8a2a24', felt: '#8a2a24' }
    ],
    plan: { type: 'tableRound' },
    build: (p) => {
      const g = G();
      const felt = solid(p.felt, 0.85);
      const rail = solid('#3a2a1c', 0.4);
      const base = wood('#2c2622', 0.5);
      // padded outer rail + felt playfield
      cyl(g, rail, 75, 9, 0, 70, 0, { seg: 8 });
      cyl(g, felt, 66, 3, 0, 76, 0, { seg: 8 });
      // cup holders around the rail
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        cyl(g, chrome(), 3.2, 4, Math.cos(a) * 70, 74, Math.sin(a) * 70);
      }
      // pedestal column + cross feet
      cyl(g, base, 15, 66, 0, 4, 0, { rTop: 12 });
      box(g, base, 90, 8, 16, 0, 0, 0);
      box(g, base, 16, 8, 90, 0, 0, 0);
      // a few chips + cards
      for (let i = 0; i < 4; i++) cyl(g, solid(['#b3352b', '#215f9c', '#e8e8e8', '#2a2724'][i], 0.4), 3, 2, -20 + i * 3, 79, 10);
      box(g, solid('#f4f4f0', 0.4), 8, 0.6, 12, 18, 79.5, -6, { ry: 0.3 });
      return g;
    }
  },

  // ---------------------------------------------------- Basketball Arcade Game
  {
    id: 'game_basketball', name: 'Basketball Arcade', cat: 'games', w: 100, d: 210, h: 210,
    palettes: [
      { name: 'Court Blue', chip: '#215f9c', body: '#215f9c' },
      { name: 'Court Red', chip: '#a8302a', body: '#a8302a' }
    ],
    plan: { type: 'box' },
    light: { y: 180, color: '#ff9a3a', intensity: 0.7, distance: 320 },
    build: (p) => {
      const g = G();
      const body = solid(p.body, 0.5);
      const frame = metal('#2b2e33', 0.4);
      const board = solid('#f2f2ee', 0.4);
      // console base + ball ramp
      box(g, body, 100, 84, 100, 0, 0, 62, { r: 4 });
      box(g, body, 92, 4, 120, 0, 46, 40, { rx: -0.5 });
      box(g, frame, 96, 30, 6, 0, 84, 96);
      // uprights + backboard tower
      box(g, frame, 8, 200, 8, 44, 0, -95);
      box(g, frame, 8, 200, 8, -44, 0, -95);
      // scoreboard
      box(g, body, 100, 42, 20, 0, 168, -90);
      box(g, glow('#ff7a1a', 0.9), 82, 28, 2, 0, 179, -79);
      // two backboards + rims
      for (const x of [-24, 24]) {
        box(g, board, 42, 32, 2, x, 138, -88);
        box(g, solid('#c2352b', 0.6), 26, 3, 2, x, 132, -85);
        cyl(g, solid('#e8632a', 0.5), 9, 2, x, 130, -78, { rx: Math.PI / 2, seg: 18 });
      }
      // balls in the ramp tray
      for (let i = 0; i < 3; i++) sphere(g, solid('#e8632a', 0.6), 12, (i - 1) * 26, 96, 88);
      return g;
    }
  },

  // ------------------------------------------------------- Shuffleboard Table
  {
    id: 'game_shuffleboard', name: 'Shuffleboard Table', cat: 'games', w: 60, d: 360, h: 76,
    palettes: [
      { name: 'Oak', chip: '#8a6a44', wood: '#8a6a44' },
      { name: 'Walnut', chip: '#4a3524', wood: '#4a3524' }
    ],
    plan: { type: 'table' },
    build: (p) => {
      const g = G();
      const cab = wood(p.wood, 0.5);
      const play = wood('#c9a86a', 0.3);
      const line = solid('#b3352b', 0.6);
      // glossy playfield + climate gutters
      box(g, play, 44, 6, 352, 0, 70, 0);
      box(g, cab, 8, 12, 352, 26, 66, 0);
      box(g, cab, 8, 12, 352, -26, 66, 0);
      // scoring lines at each end
      for (const z of [150, 168, 186, -150, -168, -186]) box(g, line, 44, 0.4, 1.5, 0, 73.2, z);
      // cradle legs down both rails
      for (const z of [-160, 0, 160]) {
        box(g, cab, 12, 66, 14, 22, 0, z);
        box(g, cab, 12, 66, 14, -22, 0, z);
      }
      // pucks near one end
      for (let i = 0; i < 4; i++) cyl(g, solid(i < 2 ? '#b3352b' : '#215f9c', 0.4), 4, 3, (i - 1.5) * 9, 73.5, 130);
      return g;
    }
  },

  // ------------------------------------------------------------ Claw Machine
  {
    id: 'game_claw', name: 'Claw Machine', cat: 'games', w: 80, d: 80, h: 186,
    palettes: [
      { name: 'Bubblegum', chip: '#e0489a', body: '#e0489a', accent: '#ff6ad5' },
      { name: 'Cyan', chip: '#1f9ab5', body: '#1f9ab5', accent: '#2fd9ff' }
    ],
    plan: { type: 'box' },
    light: { y: 150, color: '#ff6ad5', intensity: 0.7, distance: 300 },
    build: (p) => {
      const g = G();
      const body = solid(p.body, 0.5);
      const frame = metal('#2b2e33', 0.4);
      box(g, body, 80, 80, 80, 0, 0, 0, { r: 4 });
      // glass cabinet + corner posts
      box(g, glass(), 74, 82, 74, 0, 82, 0);
      for (const x of [-36, 36]) for (const z of [-36, 36]) box(g, frame, 4, 84, 4, x, 80, z);
      box(g, body, 80, 18, 80, 0, 166, 0, { r: 4 });
      box(g, glow(p.accent, 0.9), 74, 10, 2, 0, 150, 38);
      // prizes piled at the bottom
      const cols = ['#f2c12e', '#b3352b', '#215f9c', '#2f7d4a', '#e0489a'];
      for (let i = 0; i < 6; i++) {
        sphere(g, solid(cols[i % 5], 0.6), 7, (i % 3 - 1) * 18, 90, (i < 3 ? -16 : 16), { sy: 0.85 });
      }
      // gantry rail + claw
      cyl(g, frame, 1.5, 74, 0, 158, 0, { rz: Math.PI / 2 });
      box(g, frame, 8, 8, 8, 10, 148, 0);
      for (const s of [-1, 1]) cyl(g, chrome(), 1, 12, 10 + s * 3, 138, 0, { rz: s * 0.5 });
      // coin + joystick on the front cabinet
      cyl(g, chrome(), 1.4, 8, 0, 40, 41);
      sphere(g, solid('#b3352b', 0.4), 2.5, 0, 48, 41);
      return g;
    }
  },

  // ------------------------------------------------------------ Jukebox
  {
    id: 'game_jukebox', name: 'Jukebox', cat: 'games', w: 90, d: 56, h: 150,
    palettes: [
      { name: 'Cherry Wood', chip: '#7a2e22', body: '#7a2e22' },
      { name: 'Blonde', chip: '#c19a5a', body: '#c19a5a' }
    ],
    plan: { type: 'box' },
    light: { y: 90, color: '#ff5a7a', intensity: 0.7, distance: 300 },
    build: (p) => {
      const g = G();
      const body = wood(p.body, 0.4);
      const chr = chrome();
      box(g, body, 90, 138, 50, 0, 0, 0, { r: 10 });
      // domed lit top approximated with a shallow glowing cap
      cyl(g, glow('#ff3a6a', 0.85), 34, 6, 0, 128, 6, { rx: Math.PI / 2, rTop: 34, seg: 24 });
      box(g, body, 76, 14, 46, 0, 122, 0, { r: 6 });
      // selection window + arch neon tubes
      box(g, glow('#ffd27a', 0.7), 56, 22, 2, 0, 92, 26);
      cyl(g, glow('#3affd2', 0.9), 1.6, 92, 40, 24, 24, { rz: 0.12 });
      cyl(g, glow('#3affd2', 0.9), 1.6, 92, -40, 24, 24, { rz: -0.12 });
      // speaker grille + chrome trim
      box(g, solid('#2a1f16', 0.5), 62, 34, 2, 0, 22, 26);
      for (let i = -2; i <= 2; i++) box(g, chr, 2, 34, 1, i * 12, 22, 27);
      box(g, chr, 76, 3, 2, 0, 60, 26);
      box(g, chr, 76, 3, 2, 0, 12, 26);
      // button row
      for (let i = 0; i < 5; i++) cyl(g, glow('#ffcf3a', 0.6), 1.6, 3, (i - 2) * 10, 74, 26, { rx: Math.PI / 2 });
      return g;
    }
  },

  // -------------------------------------------------------- Board-Game Table
  {
    id: 'game_boardtable', name: 'Board-Game Table', cat: 'games', w: 120, d: 90, h: 76,
    palettes: [
      { name: 'Oak', chip: '#8a6a44', wood: '#8a6a44', felt: '#2f4a6a' },
      { name: 'Walnut', chip: '#4a3524', wood: '#4a3524', felt: '#3a5a3a' }
    ],
    plan: { type: 'table' },
    build: (p) => {
      const g = G();
      const frame = wood(p.wood, 0.5);
      const felt = solid(p.felt, 0.85);
      // rail frame around a recessed felt play well
      box(g, felt, 96, 2, 66, 0, 64, 0);
      box(g, frame, 120, 6, 12, 0, 70, 39);
      box(g, frame, 120, 6, 12, 0, 70, -39);
      box(g, frame, 12, 6, 90, 54, 70, 0);
      box(g, frame, 12, 6, 90, -54, 70, 0);
      // corner cup holders
      for (const x of [-52, 52]) for (const z of [-37, 37]) cyl(g, solid('#2a2724', 0.5), 3, 4, x, 66, z);
      // scattered dice + meeples
      box(g, solid('#e8e8e4', 0.4), 5, 5, 5, -10, 65, 8, { r: 1, ry: 0.4 });
      box(g, solid('#b3352b', 0.4), 5, 5, 5, 4, 65, -6, { r: 1, ry: 0.8 });
      cyl(g, solid('#f2c12e', 0.4), 3, 5, 20, 65, 6, { rTop: 2 });
      cyl(g, solid('#215f9c', 0.4), 3, 5, -22, 65, -8, { rTop: 2 });
      legs4(g, frame, 108, 78, 64, 4, 8, true);
      return g;
    }
  },

  // ---------------------------------------------------- Retro Console Stand
  {
    id: 'game_console_stand', name: 'Retro Console Stand', cat: 'games', w: 140, d: 46, h: 110,
    palettes: [
      { name: 'Teak', chip: '#7a5a38', wood: '#7a5a38' },
      { name: 'Black Oak', chip: '#2a2622', wood: '#2a2622' }
    ],
    plan: { type: 'storage' },
    light: { y: 78, color: '#5a8aff', intensity: 0.4, distance: 220 },
    build: (p) => {
      const g = G();
      const cab = wood(p.wood, 0.5);
      // low media cabinet with two open shelves
      box(g, cab, 140, 6, 46, 0, 44, 0);
      box(g, cab, 140, 5, 46, 0, 22, 0);
      box(g, cab, 140, 5, 46, 0, 4, 0);
      box(g, cab, 5, 44, 46, 68, 0, 0);
      box(g, cab, 5, 44, 46, -68, 0, 0);
      box(g, cab, 5, 40, 46, 0, 4, 0);
      // CRT television on top
      box(g, solid('#3a3d42', 0.5), 62, 52, 50, -8, 50, -2, { r: 4 });
      box(g, solid('#111214', 0.4), 50, 40, 4, -8, 56, 22);
      box(g, glow('#4a6a9a', 0.7), 44, 34, 1, -8, 59, 24);
      // console + controllers on a shelf
      box(g, solid('#2a2d33', 0.4), 40, 8, 26, 46, 26, 4, { r: 2 });
      box(g, solid('#4a4d53', 0.4), 12, 4, 8, 40, 24, 20, { r: 1.5 });
      box(g, solid('#4a4d53', 0.4), 12, 4, 8, 54, 24, 20, { r: 1.5 });
      // cartridge row
      for (let i = 0; i < 5; i++) box(g, solid(['#b3352b', '#215f9c', '#2f7d4a', '#f2c12e', '#5a2f7d'][i], 0.5), 3, 12, 20, 30 + i * 5, 6, -6);
      return g;
    }
  },

  // ------------------------------------------------------------ Skee-Ball
  {
    id: 'game_skeeball', name: 'Skee-Ball Machine', cat: 'games', w: 72, d: 292, h: 200,
    palettes: [
      { name: 'Classic Cream', chip: '#d8c9a4', body: '#d8c9a4', accent: '#ffcf5a' },
      { name: 'Retro Red', chip: '#a8302a', body: '#a8302a', accent: '#ff7a3a' }
    ],
    plan: { type: 'box' },
    light: { y: 150, color: '#ffcf6a', intensity: 0.6, distance: 300 },
    build: (p) => {
      const g = G();
      const body = solid(p.body, 0.5);
      const wd = wood('#7a5a38', 0.5);
      // long lane with side rails
      box(g, wd, 60, 12, 200, 0, 0, 30, { rx: 0.05 });
      box(g, body, 6, 26, 200, 30, 0, 30);
      box(g, body, 6, 26, 200, -30, 0, 30);
      // jump ramp near the far end
      box(g, wd, 60, 6, 40, 0, 22, -78, { rx: -0.5 });
      // target backboard with lit scoring rings
      box(g, body, 66, 96, 24, 0, 44, -120, { rx: -0.12 });
      cyl(g, glow('#ffcf5a', 0.6), 12, 3, 0, 74, -112, { rx: Math.PI / 2, seg: 24 });
      for (const [x, y] of [[-18, 100], [18, 100], [-22, 66], [22, 66]]) {
        cyl(g, glow(p.accent, 0.55), 7, 3, x, y, -114, { rx: Math.PI / 2, seg: 20 });
      }
      // scoreboard hood
      box(g, body, 66, 30, 18, 0, 132, -118);
      box(g, glow('#fff2c4', 0.8), 54, 18, 2, 0, 138, -108);
      // ball tray + balls at the player end
      box(g, body, 60, 14, 26, 0, 6, 128);
      for (let i = 0; i < 3; i++) sphere(g, solid('#c8875a', 0.5), 6, (i - 1) * 16, 22, 128);
      return g;
    }
  },

  // ------------------------------------------------------------ Slot Machine
  {
    id: 'game_slot', name: 'Slot Machine', cat: 'games', w: 46, d: 54, h: 146,
    palettes: [
      { name: 'Gold', chip: '#c79a3a', body: '#c79a3a', accent: '#ff4a4a' },
      { name: 'Ruby', chip: '#8a2a24', body: '#8a2a24', accent: '#ffcf3a' }
    ],
    plan: { type: 'box' },
    light: { y: 110, color: '#ff5a5a', intensity: 0.6, distance: 250 },
    build: (p) => {
      const g = G();
      const body = solid(p.body, 0.45);
      const chr = chrome();
      box(g, body, 46, 62, 54, 0, 0, 0, { r: 4 });
      box(g, body, 46, 72, 50, 0, 62, 0, { r: 6 });
      // three reels behind glass
      for (let i = 0; i < 3; i++) box(g, glow('#fff2c4', 0.7), 9, 24, 2, (i - 1) * 11, 78, 26);
      box(g, glass(), 34, 26, 1, 0, 77, 27);
      // top display + slanted button panel
      box(g, glow(p.accent, 0.85), 40, 16, 2, 0, 116, 25);
      box(g, solid('#1d1f23', 0.4), 40, 6, 20, 0, 62, 30, { rx: -0.4 });
      for (let i = 0; i < 3; i++) cyl(g, glow(['#b3352b', '#2f7d4a', '#f2c12e'][i], 0.6), 2, 3, (i - 1) * 11, 66, 34, { rx: Math.PI / 2 });
      // pull lever + coin tray
      cyl(g, chr, 1.4, 28, 25, 78, 6);
      sphere(g, solid('#b3352b', 0.4), 3, 25, 107, 6);
      box(g, chr, 30, 5, 6, 0, 8, 28, { r: 1.5 });
      return g;
    }
  }
];
