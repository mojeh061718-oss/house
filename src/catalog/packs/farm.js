// Farm & homestead pack — animals, structures and yard gear built entirely
// from primitive helpers (no external models). Animals face +Z (head forward),
// origin centered on the ground, all dimensions in centimeters.
import {
  G, box, cyl, sphere, prism, pyramid, blob, foliage,
  solid, wood, metal, glass, tex
} from '../builders.js';

// ---- local helpers --------------------------------------------------------
const HOOF = solid('#2b2622', 0.6);
// one straight leg with a dark hoof at the bottom
function leg(g, mat, x, z, h, r) {
  cyl(g, mat, r, h, x, 0, z, { rTop: r * 0.88, seg: 12 });
  cyl(g, HOOF, r * 1.02, h * 0.14, x, 0, z, { seg: 12 });
}
// a couple of galvanised carry-handles used on troughs / cans
function ring(g, mat, r, x, y, z) {
  cyl(g, mat, 0.9, r * 2, x, y, z, { rz: Math.PI / 2, seg: 10 });
}

export const FARM_ITEMS = [
  // ============================ ANIMALS ============================
  {
    id: 'farm_cow', name: 'Cow', cat: 'farm', w: 84, d: 244, h: 152,
    plan: { type: 'box' },
    palettes: [
      { name: 'Holstein', chip: '#f2efe9', body: '#f3f0ea', spot: '#26221e', horn: '#d8cfbf' },
      { name: 'Jersey Brown', chip: '#9c6b3f', body: '#9c6b3f', spot: null, horn: '#cdbfa6' },
      { name: 'Black Angus', chip: '#2a2622', body: '#2a2622', spot: null, horn: '#3a352f' }
    ],
    build: (p) => {
      const g = G();
      const hide = solid(p.body, 0.85);
      const legMat = solid(p.spot ? '#efece6' : p.body, 0.85);
      // legs
      for (const [x, z] of [[-27, 62], [27, 62], [-29, -66], [29, -66]]) leg(g, legMat, x, z, 70, 9.5);
      // barrel body
      sphere(g, hide, 52, 0, 100, -6, { sx: 0.74, sy: 0.82, sz: 1.35 });
      // brisket / shoulders
      sphere(g, hide, 40, 0, 104, 70, { sx: 0.7, sy: 0.78, sz: 0.9 });
      // neck up to the head
      cyl(g, hide, 20, 42, 0, 108, 96, { rx: 0.7, rTop: 17 });
      // head + muzzle
      sphere(g, hide, 22, 0, 120, 118, { sx: 0.8, sy: 0.9, sz: 1.05 });
      sphere(g, solid('#e6c9c2', 0.7), 14, 0, 112, 134, { sx: 0.9, sz: 0.7 });
      sphere(g, solid('#2b2622', 0.4), 2.4, -7, 120, 145);
      sphere(g, solid('#2b2622', 0.4), 2.4, 7, 120, 145);
      // ears + horns
      for (const s of [-1, 1]) {
        sphere(g, hide, 8, s * 22, 128, 112, { sx: 0.5, sz: 1.3 });
        cyl(g, solid(p.horn, 0.5), 3.2, 16, s * 9, 133, 118, { rTop: 0.6, rz: s * 0.5, rx: -0.4 });
      }
      // tail with tuft
      cyl(g, hide, 3, 66, 0, 96, -74, { rx: -0.28 });
      sphere(g, solid('#2b2622', 0.9), 6, 3, 34, -84);
      // udder
      sphere(g, solid('#e7b9b4', 0.7), 15, 0, 52, -34, { sy: 0.8 });
      // Holstein patches
      if (p.spot) {
        const sp = solid(p.spot, 0.85);
        sphere(g, sp, 22, 24, 112, 24, { sx: 0.55, sy: 0.9, sz: 1.1 });
        sphere(g, sp, 18, -28, 108, -34, { sx: 0.5, sy: 0.9, sz: 1 });
        sphere(g, sp, 15, 6, 130, -30, { sx: 0.7, sy: 0.7, sz: 1.1 });
        sphere(g, sp, 12, 0, 124, 122, { sx: 0.7, sy: 0.7 });
      }
      return g;
    }
  },
  {
    id: 'farm_horse', name: 'Horse', cat: 'farm', w: 68, d: 240, h: 172,
    plan: { type: 'box' },
    palettes: [
      { name: 'Chestnut', chip: '#7c4a2a', body: '#7c4a2a', mane: '#3a241a' },
      { name: 'Black', chip: '#241f1c', body: '#241f1c', mane: '#141110' },
      { name: 'White Grey', chip: '#e4e1da', body: '#e4e1da', mane: '#cfcabf' },
      { name: 'Palomino', chip: '#c79a56', body: '#c79a56', mane: '#f0ead6' }
    ],
    build: (p) => {
      const g = G();
      const hide = solid(p.body, 0.7);
      const mane = solid(p.mane, 0.8);
      for (const [x, z] of [[-22, 60], [22, 60], [-22, -64], [22, -64]]) leg(g, hide, x, z, 96, 7.5);
      // sleeker barrel
      sphere(g, hide, 46, 0, 122, -4, { sx: 0.66, sy: 0.86, sz: 1.28 });
      sphere(g, hide, 36, 0, 128, 60, { sx: 0.66, sy: 0.86, sz: 0.9 });
      // long arched neck
      cyl(g, hide, 16, 60, 0, 130, 78, { rx: 0.85, rTop: 12 });
      // head — long muzzle
      sphere(g, hide, 15, 0, 150, 116, { sx: 0.75, sy: 1.1, sz: 1.5 });
      sphere(g, hide, 9, 0, 138, 138, { sx: 0.8, sz: 0.9 });
      // ears
      for (const s of [-1, 1]) cyl(g, hide, 4, 12, s * 7, 160, 108, { rTop: 0.5, rz: s * 0.25 });
      // mane crest + forelock
      for (let i = 0; i < 7; i++) sphere(g, mane, 6, 0, 148 - i * 4, 92 - i * 6, { sx: 0.4, sz: 0.7 });
      // flowing tail
      cyl(g, mane, 6, 70, 0, 116, -70, { rx: -0.15, rTop: 3 });
      return g;
    }
  },
  {
    id: 'farm_pig', name: 'Pig', cat: 'farm', w: 56, d: 120, h: 66,
    plan: { type: 'box' },
    palettes: [
      { name: 'Pink', chip: '#e7a99e', body: '#e7a99e' },
      { name: 'Spotted', chip: '#d8b8a8', body: '#d8b8a8', spot: '#4a3f3a' },
      { name: 'Black Berkshire', chip: '#33302e', body: '#33302e' }
    ],
    build: (p) => {
      const g = G();
      const hide = solid(p.body, 0.75);
      for (const [x, z] of [[-18, 34], [18, 34], [-18, -36], [18, -36]]) leg(g, hide, x, z, 26, 6);
      sphere(g, hide, 34, 0, 44, 0, { sx: 0.72, sy: 0.82, sz: 1.35 });
      // head + flat snout
      sphere(g, hide, 20, 0, 46, 54, { sx: 0.85, sy: 0.9 });
      const snout = solid(p.body === '#33302e' ? '#5a4f4a' : '#d98f84', 0.6);
      cyl(g, snout, 9, 8, 0, 44, 72, { rx: Math.PI / 2, seg: 14 });
      sphere(g, solid('#2b2622', 0.4), 1.6, -8, 50, 66);
      sphere(g, solid('#2b2622', 0.4), 1.6, 8, 50, 66);
      // triangular ears
      for (const s of [-1, 1]) sphere(g, hide, 7, s * 11, 60, 50, { sx: 0.5, sy: 1, sz: 0.5 });
      // curly tail
      sphere(g, hide, 4, 0, 52, -40);
      cyl(g, hide, 1.6, 12, 0, 50, -46, { rx: -0.9 });
      if (p.spot) {
        const sp = solid(p.spot, 0.75);
        sphere(g, sp, 14, 16, 50, -8, { sx: 0.5, sy: 0.9, sz: 1 });
        sphere(g, sp, 10, -14, 46, 20, { sx: 0.5 });
      }
      return g;
    }
  },
  {
    id: 'farm_sheep', name: 'Sheep', cat: 'farm', w: 60, d: 128, h: 96,
    plan: { type: 'box' },
    palettes: [
      { name: 'Wool White', chip: '#efece4', wool: '#efece4', face: '#33302c' },
      { name: 'Suffolk', chip: '#e9e5dc', wool: '#e9e5dc', face: '#201d1a' },
      { name: 'Brown', chip: '#b9a789', wool: '#b9a789', face: '#4a3f34' }
    ],
    build: (p) => {
      const g = G();
      const face = solid(p.face, 0.7);
      const legMat = solid(p.face, 0.7);
      for (const [x, z] of [[-18, 36], [18, 36], [-18, -38], [18, -38]]) leg(g, legMat, x, z, 40, 5.5);
      // fluffy wool body (organic blob, lighter on top)
      blob(g, p.wool, '#ffffff', 40, 0, 62, -4, { seed: 5, sy: 0.9, detail: 3 });
      blob(g, p.wool, '#ffffff', 24, 0, 66, 34, { seed: 8, sy: 0.9 });
      // dark face + head
      sphere(g, face, 15, 0, 66, 54, { sx: 0.8, sy: 1, sz: 1.05 });
      sphere(g, face, 9, 0, 60, 66, { sx: 0.8, sz: 0.8 });
      for (const s of [-1, 1]) sphere(g, face, 6, s * 13, 66, 50, { sx: 0.4, sy: 0.6, sz: 1.1 });
      sphere(g, solid('#141210', 0.4), 1.8, -6, 68, 62);
      sphere(g, solid('#141210', 0.4), 1.8, 6, 68, 62);
      return g;
    }
  },
  {
    id: 'farm_goat', name: 'Goat', cat: 'farm', w: 52, d: 118, h: 92,
    plan: { type: 'box' },
    palettes: [
      { name: 'White', chip: '#eeece5', body: '#eeece5', horn: '#c7bca6' },
      { name: 'Brown', chip: '#8a6b48', body: '#8a6b48', horn: '#3f342a' },
      { name: 'Nubian', chip: '#5b4a3a', body: '#5b4a3a', horn: '#2c241d' }
    ],
    build: (p) => {
      const g = G();
      const hide = solid(p.body, 0.75);
      for (const [x, z] of [[-16, 34], [16, 34], [-16, -36], [16, -36]]) leg(g, hide, x, z, 42, 5);
      sphere(g, hide, 32, 0, 60, -4, { sx: 0.66, sy: 0.82, sz: 1.28 });
      cyl(g, hide, 12, 28, 0, 62, 40, { rx: 0.5, rTop: 10 });
      // wedge head
      sphere(g, hide, 14, 0, 74, 58, { sx: 0.8, sy: 0.95, sz: 1.2 });
      sphere(g, hide, 8, 0, 68, 70, { sx: 0.8 });
      // swept-back horns
      for (const s of [-1, 1]) {
        cyl(g, solid(p.horn, 0.5), 3, 22, s * 6, 84, 52, { rTop: 0.8, rx: -0.9, rz: s * 0.2 });
        sphere(g, hide, 5, s * 12, 76, 54, { sx: 0.4, sz: 1.1 });
      }
      // chin beard + perky tail
      cyl(g, hide, 2.5, 10, 0, 62, 66, { rx: -0.3, rTop: 0.5 });
      cyl(g, hide, 3, 12, 0, 66, -38, { rx: 0.9, rTop: 1.2 });
      return g;
    }
  },
  {
    id: 'farm_chicken', name: 'Chicken', cat: 'farm', w: 24, d: 44, h: 40,
    plan: { type: 'box' },
    palettes: [
      { name: 'White Leghorn', chip: '#f3f1ea', body: '#f3f1ea' },
      { name: 'Rhode Island Red', chip: '#8a3a26', body: '#8a3a26' },
      { name: 'Speckled', chip: '#5a4a3c', body: '#5a4a3c' }
    ],
    build: (p) => {
      const g = G();
      const feathers = solid(p.body, 0.8);
      const shank = solid('#d8a13a', 0.6);
      cyl(g, shank, 1.6, 14, -5, 0, -1);
      cyl(g, shank, 1.6, 14, 5, 0, -1);
      // plump body
      sphere(g, feathers, 15, 0, 20, -2, { sx: 0.85, sy: 1.05, sz: 1.15 });
      // head on short neck
      sphere(g, feathers, 8, 0, 32, 10, { sx: 0.9 });
      // comb + wattle + beak
      for (let i = 0; i < 3; i++) sphere(g, solid('#c0392b', 0.5), 2.6, -i * 2 + 2, 40 - i * 0.5, 8 + i * 2, { sy: 1.3 });
      sphere(g, solid('#c0392b', 0.5), 2, 0, 27, 16, { sy: 1.4 });
      cyl(g, solid('#e0a63a', 0.5), 2, 5, 0, 31, 18, { rx: Math.PI / 2, rTop: 0.3, seg: 8 });
      sphere(g, solid('#201d1a', 0.4), 1, -3, 34, 15);
      sphere(g, solid('#201d1a', 0.4), 1, 3, 34, 15);
      // upright tail feathers
      for (let i = 0; i < 3; i++) box(g, feathers, 3, 16, 2.4, (i - 1) * 3, 20, -16, { rx: -0.6 });
      return g;
    }
  },
  {
    id: 'farm_rooster', name: 'Rooster', cat: 'farm', w: 30, d: 54, h: 58,
    plan: { type: 'box' },
    palettes: [
      { name: 'Classic', chip: '#3a2a20', body: '#3a2a20', tail: '#1c3040' },
      { name: 'Red', chip: '#8a2e1e', body: '#8a2e1e', tail: '#2a1c14' }
    ],
    build: (p) => {
      const g = G();
      const feathers = solid(p.body, 0.75);
      const tailc = solid(p.tail, 0.7);
      const shank = solid('#d8a13a', 0.6);
      cyl(g, shank, 2, 20, -6, 0, -2);
      cyl(g, shank, 2, 20, 6, 0, -2);
      sphere(g, feathers, 17, 0, 30, -4, { sx: 0.85, sy: 1.15, sz: 1.1 });
      // proud upright neck + head
      cyl(g, solid('#a5502c', 0.7), 8, 22, 0, 36, 8, { rx: 0.2, rTop: 6 });
      sphere(g, feathers, 9, 0, 52, 14, { sx: 0.9 });
      // big comb + wattles
      for (let i = 0; i < 4; i++) sphere(g, solid('#c0392b', 0.5), 3.4, (i - 1.5) * 3, 62 - Math.abs(i - 1.5) * 1.5, 12, { sy: 1.4 });
      sphere(g, solid('#c0392b', 0.5), 3, 0, 46, 20, { sy: 1.6 });
      cyl(g, solid('#e0a63a', 0.5), 2.4, 7, 0, 51, 22, { rx: Math.PI / 2, rTop: 0.4, seg: 8 });
      // grand arched tail
      for (let i = 0; i < 5; i++) {
        const a = -0.4 - i * 0.18;
        box(g, tailc, 3.5, 34 - i * 3, 2.4, (i % 2 ? 1 : -1) * i, 26, -18 - i, { rx: a });
      }
      return g;
    }
  },
  {
    id: 'farm_duck', name: 'Duck', cat: 'farm', w: 26, d: 52, h: 42,
    plan: { type: 'box' },
    palettes: [
      { name: 'Pekin White', chip: '#f4f2ec', body: '#f4f2ec', head: '#f4f2ec' },
      { name: 'Mallard', chip: '#7c6a4a', body: '#7c6a4a', head: '#1f5a3a' }
    ],
    build: (p) => {
      const g = G();
      const feathers = solid(p.body, 0.7);
      const shank = solid('#e08a2a', 0.6);
      cyl(g, shank, 1.6, 10, -5, 0, -2);
      cyl(g, shank, 1.6, 10, 5, 0, -2);
      // low horizontal body, upturned tail
      sphere(g, feathers, 15, 0, 18, -4, { sx: 0.85, sy: 0.9, sz: 1.3 });
      sphere(g, feathers, 7, 0, 24, -20, { sx: 0.6, sy: 0.6, sz: 1 });
      // neck + head
      cyl(g, solid(p.head, 0.7), 6, 16, 0, 24, 12, { rx: 0.2, rTop: 6.5 });
      sphere(g, solid(p.head, 0.7), 8, 0, 38, 16, { sx: 0.9 });
      // flat bill
      box(g, solid('#e8a83a', 0.5), 8, 3, 11, 0, 36, 24, { r: 1.4 });
      sphere(g, solid('#201d1a', 0.4), 1, -3, 40, 18);
      sphere(g, solid('#201d1a', 0.4), 1, 3, 40, 18);
      return g;
    }
  },

  // ============================ FEED & HAY ============================
  {
    id: 'farm_trough', name: 'Feeding Trough', cat: 'farm', w: 60, d: 160, h: 45,
    plan: { type: 'box' },
    palettes: [
      { name: 'Weathered Wood', chip: '#8a7458', wood: '#8a7458' },
      { name: 'Galvanised', chip: '#b9bdc2', wood: null }
    ],
    build: (p) => {
      const g = G();
      const mat = p.wood ? wood(p.wood, 0.7) : metal('#b9bdc2', 0.4);
      // V-trough: two sloped sides + ends resting on cross legs
      for (const s of [-1, 1]) box(g, mat, 6, 34, 156, s * 24, 8, 0, { rz: s * 0.45 });
      box(g, mat, 54, 5, 156, 0, 6, 0);
      for (const z of [-72, 72]) box(g, mat, 58, 34, 6, 0, 8, z);
      // splayed leg pairs
      for (const z of [-60, 60]) for (const s of [-1, 1]) box(g, mat, 6, 30, 6, s * 24, 0, z, { rz: s * 0.2 });
      // a little feed inside
      box(g, solid('#c8a94e', 0.9), 46, 8, 148, 0, 8, 0);
      return g;
    }
  },
  {
    id: 'farm_hay_rack', name: 'Hay Feeder Rack', cat: 'farm', w: 90, d: 90, h: 120,
    plan: { type: 'box' },
    palettes: [{ name: 'Steel', chip: '#7c828a', steel: '#7c828a' }],
    build: (p) => {
      const g = G();
      const bar = metal(p.steel, 0.4);
      // square hoop frame with slanted rail sides
      for (const x of [-40, 40]) for (const z of [-40, 40]) cyl(g, bar, 3, 118, x, 0, z, { seg: 10 });
      for (const y of [30, 110]) for (const [a, b, c, d] of [[-40, -40, 40, -40], [40, -40, 40, 40], [40, 40, -40, 40], [-40, 40, -40, -40]]) {
        const mx = (a + c) / 2, mz = (b + d) / 2, len = Math.hypot(c - a, d - b);
        box(g, bar, len, 3, 3, mx, y, mz, { ry: Math.atan2(d - b, c - a) });
      }
      // vertical feed slats on all faces
      for (const s of [-1, 1]) for (let i = -1; i <= 1; i++) {
        cyl(g, bar, 1.4, 78, i * 22, 30, s * 40, { seg: 6 });
        cyl(g, bar, 1.4, 78, s * 40, 30, i * 22, { seg: 6 });
      }
      // hay stuffed inside + poking through
      blob(g, '#c8a94e', '#e4cf86', 42, 0, 74, 0, { seed: 3, sy: 0.9 });
      return g;
    }
  },
  {
    id: 'farm_round_bale', name: 'Round Hay Bale', cat: 'farm', w: 150, d: 130, h: 130,
    plan: { type: 'rock' },
    palettes: [
      { name: 'Straw', chip: '#c8a94e', hay: '#c8a94e', tip: '#e4cf86' },
      { name: 'Wrapped White', chip: '#e8e6df', hay: '#e2ddcf', tip: '#f2efe7' }
    ],
    build: (p) => {
      const g = G();
      // big cylinder lying on its side (axis along x so it can roll)
      cyl(g, solid(p.hay, 0.95), 64, 148, 0, 64, 0, { rz: Math.PI / 2, seg: 26 });
      // rolled-straw texture as concentric end rings
      for (const s of [-1, 1]) for (let r = 54; r > 8; r -= 16) cyl(g, solid(p.tip, 0.95), r, 2, s * 75, 64, 0, { rz: Math.PI / 2, seg: 26 });
      // frizzy top
      blob(g, p.hay, p.tip, 60, 0, 96, 0, { seed: 6, sy: 0.4, detail: 2 });
      return g;
    }
  },
  {
    id: 'farm_square_bale', name: 'Square Hay Bale', cat: 'farm', w: 45, d: 90, h: 40,
    plan: { type: 'rock' },
    palettes: [{ name: 'Straw', chip: '#cbab4e', hay: '#cbab4e' }],
    build: (p) => {
      const g = G();
      box(g, solid(p.hay, 0.95), 45, 40, 90, 0, 0, 0, { r: 3 });
      // frayed straw ends
      for (const z of [-46, 46]) blob(g, p.hay, '#e4cf86', 22, 0, 20, z, { seed: z, sy: 0.85, detail: 2 });
      // baling twine
      for (const x of [-13, 13]) {
        box(g, solid('#c86a2a', 0.7), 1.6, 42, 1.6, x, 0, 0);
        box(g, solid('#c86a2a', 0.7), 47, 1.6, 1.6, 0, 22, x * 2);
      }
      return g;
    }
  },
  {
    id: 'farm_feed_bin', name: 'Feed Bin', cat: 'farm', w: 70, d: 70, h: 95,
    plan: { type: 'box' },
    palettes: [
      { name: 'Galvanised', chip: '#b4b8bd', metal: '#b4b8bd' },
      { name: 'Green', chip: '#3c6b3e', metal: '#3c6b3e' }
    ],
    build: (p) => {
      const g = G();
      const m = metal(p.metal, 0.4);
      cyl(g, m, 34, 82, 0, 0, 0, { seg: 26 });
      // ribbed bands
      for (const y of [24, 48]) cyl(g, m, 35, 3, 0, y, 0, { seg: 26 });
      // sloped lid + handle
      cyl(g, m, 36, 10, 0, 82, 0, { rTop: 22, seg: 26 });
      cyl(g, metal('#8a8f96', 0.4), 3, 4, 0, 92, 0, { seg: 10 });
      ring(g, metal('#8a8f96', 0.4), 8, 0, 96, 0);
      return g;
    }
  },

  // ============================ STRUCTURES ============================
  {
    id: 'farm_barn', name: 'Small Red Barn', cat: 'farm', w: 400, d: 500, h: 400,
    plan: { type: 'box' },
    palettes: [
      { name: 'Classic Red', chip: '#a3312a', wall: '#a3312a', trim: '#efeae0' },
      { name: 'Barnwood', chip: '#6f5a44', wall: null, trim: '#d8cdbb' },
      { name: 'Grey', chip: '#6f747a', wall: '#6f747a', trim: '#e4e0d6' }
    ],
    build: (p) => {
      const g = G();
      const wall = p.wall ? solid(p.wall, 0.8) : tex('real_barnwood_siding', 3, 2);
      const trim = solid(p.trim, 0.7);
      const roof = solid('#5a5f66', 0.6);
      // main walls
      box(g, wall, 360, 230, 460, 0, 0, 0);
      // gambrel roof from four slanted panels (ridge runs along x)
      const A = Math.atan2(70, 60), B = Math.atan2(45, 120);
      for (const s of [-1, 1]) {
        box(g, roof, 380, 12, 96, 0, 259, s * 150, { rx: s * A });     // steep lower
        box(g, roof, 380, 12, 132, 0, 316, s * 60, { rx: s * B });     // shallow upper
      }
      box(g, trim, 388, 8, 20, 0, 344, 0);                             // ridge cap
      // gable-end infill triangles
      for (const s of [-1, 1]) prism(g, wall, 8, 115, 360, s * 180, 230, 0, wall);
      // big sliding door with white X-brace
      box(g, solid('#7a2620', 0.7), 130, 175, 6, 0, 0, 232);
      box(g, trim, 138, 8, 8, 0, 172, 234);
      for (const r of [0.72, -0.72]) box(g, trim, 190, 8, 4, 0, 88, 236, { rz: r });
      for (const s of [-1, 1]) box(g, trim, 8, 175, 4, s * 62, 0, 236);
      // hay-loft window + cupola with weathervane
      box(g, solid('#2a2622', 0.4), 40, 40, 6, 0, 150, 232);
      box(g, trim, 60, 60, 60, 0, 350, 0);
      pyramid(g, roof, 78, 46, 78, 0, 410, 0);
      cyl(g, metal('#2a2622', 0.4), 1.6, 40, 0, 456, 0, { seg: 8 });
      sphere(g, metal('#caa63a', 0.4), 5, 0, 500, 0);
      return g;
    }
  },
  {
    id: 'farm_coop', name: 'Chicken Coop', cat: 'farm', w: 150, d: 120, h: 140,
    plan: { type: 'box' },
    palettes: [
      { name: 'Red & White', chip: '#a3402e', wall: '#a3402e', trim: '#efe9dd' },
      { name: 'Natural Wood', chip: '#9a7a52', wall: '#9a7a52', trim: '#c9b596' }
    ],
    build: (p) => {
      const g = G();
      const wall = wood(p.wall, 0.75);
      const trim = wood(p.trim, 0.7);
      // raised house on stubby legs
      for (const [x, z] of [[-60, 45], [60, 45], [-60, -45], [60, -45]]) cyl(g, trim, 4, 34, x, 0, z, { seg: 8 });
      box(g, wall, 130, 62, 100, 0, 34, 0);
      // gable roof
      prism(g, solid('#4a4f55', 0.6), 140, 42, 108, 0, 96, 0, trim);
      // nesting-box bump-out on the side
      box(g, wall, 24, 34, 70, -66, 40, 0);
      prism(g, solid('#4a4f55', 0.6), 24, 14, 74, -66, 74, 0);
      // pop-hole door + ramp
      box(g, solid('#3a2a20', 0.7), 30, 34, 5, 40, 34, 51);
      box(g, trim, 26, 4, 46, 40, 12, 74, { rx: 0.55 });
      // ventilation window with cross bars
      box(g, solid('#2a2622', 0.4), 34, 26, 5, -30, 50, 51);
      for (const x of [-30]) { box(g, trim, 34, 3, 3, x, 62, 53); box(g, trim, 3, 26, 3, x, 50, 53); }
      // little perch bar
      cyl(g, trim, 2, 60, 30, 34, 40, { rz: Math.PI / 2, seg: 8 });
      return g;
    }
  },
  {
    id: 'farm_silo', name: 'Grain Silo', cat: 'farm', w: 240, d: 240, h: 620,
    plan: { type: 'box' },
    palettes: [
      { name: 'Galvanised', chip: '#c9ced4', metal: '#c9ced4' },
      { name: 'Blue Harvestore', chip: '#2f5f86', metal: '#2f5f86' }
    ],
    build: (p) => {
      const g = G();
      const m = metal(p.metal, 0.4);
      cyl(g, m, 112, 540, 0, 0, 0, { seg: 40 });
      // corrugation bands
      for (let y = 40; y < 540; y += 60) cyl(g, m, 114, 5, 0, y, 0, { seg: 40 });
      // domed cap + vent
      sphere(g, m, 112, 0, 540, 0, { sy: 0.5, seg: 40 });
      cyl(g, m, 20, 26, 0, 588, 0, { rTop: 12, seg: 20 });
      cyl(g, m, 14, 8, 0, 612, 0, { seg: 16 });
      // exterior ladder
      for (let y = 20; y < 540; y += 26) box(g, metal('#8a8f96', 0.4), 20, 2.4, 2.4, 0, y, 114);
      for (const x of [-8, 8]) cyl(g, metal('#8a8f96', 0.4), 1.2, 520, x, 10, 114, { seg: 6 });
      // discharge chute
      box(g, m, 40, 120, 20, 0, 0, 108, { rx: 0.15 });
      return g;
    }
  },
  {
    id: 'farm_windmill', name: 'Windmill', cat: 'farm', w: 180, d: 180, h: 520,
    plan: { type: 'box' },
    palettes: [{ name: 'Galvanised', chip: '#9aa0a6', steel: '#9aa0a6' }],
    build: (p) => {
      const g = G();
      const steel = metal(p.steel, 0.4);
      // tapered 4-post lattice tower
      const base = 70, top = 14, H = 400;
      const foot = (sx, sz) => [sx * base, sz * base];
      const head = (sx, sz) => [sx * top, sz * top];
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      for (const [sx, sz] of corners) {
        const [bx, bz] = foot(sx, sz), [tx, tz] = head(sx, sz);
        const mx = (bx + tx) / 2, mz = (bz + tz) / 2;
        const len = Math.hypot(tx - bx, H, tz - bz);
        const post = cyl(g, steel, 2.4, len, mx, 0, mz, { seg: 6 });
        post.rotation.z = Math.atan2(bx - tx, H);
        post.rotation.x = Math.atan2(tz - bz, H);
        post.position.y = H / 2;
      }
      // cross bracing rings
      for (const y of [90, 200, 310]) {
        const r = base - (base - top) * (y / H);
        for (let i = 0; i < 4; i++) {
          const a = i * Math.PI / 2, b = a + Math.PI / 2;
          box(g, steel, Math.hypot(Math.cos(a) - Math.cos(b), Math.sin(a) - Math.sin(b)) * r, 1.6, 1.6,
            (Math.cos(a) + Math.cos(b)) / 2 * r, y, (Math.sin(a) + Math.sin(b)) / 2 * r,
            { ry: -a - Math.PI / 4 });
        }
      }
      // platform + hub
      box(g, steel, 34, 4, 34, 0, H, 0);
      const hub = cyl(g, steel, 8, 14, 0, H + 26, 8, { rx: Math.PI / 2, seg: 12 });
      // multi-blade fan wheel
      const blades = 18, R = 78;
      for (let i = 0; i < blades; i++) {
        const a = (i / blades) * Math.PI * 2;
        const bl = box(g, metal('#c2c6cc', 0.4), 9, 62, 1, 0, H + 26, 12);
        bl.position.set(Math.cos(a) * R * 0.5, H + 26 + Math.sin(a) * R * 0.5, 12);
        bl.rotation.z = a + 0.35;
      }
      cyl(g, metal('#c2c6cc', 0.4), R, 3, 0, H + 26, 11.5, { rx: Math.PI / 2, seg: 40 });
      cyl(g, metal('#8a2e1e', 0.5), 6, 6, 0, H + 26, 14, { rx: Math.PI / 2, seg: 14 });
      // tail vane
      box(g, metal('#8a2e1e', 0.5), 2, 40, 70, 0, H + 26, -34);
      box(g, steel, 60, 5, 5, -20, H + 26, -8, { ry: 0.5 });
      return g;
    }
  },

  // ============================ YARD GEAR ============================
  {
    id: 'farm_water_trough', name: 'Water Trough', cat: 'farm', w: 90, d: 180, h: 55,
    plan: { type: 'box' },
    palettes: [
      { name: 'Galvanised', chip: '#b4b8bd', metal: '#b4b8bd' },
      { name: 'Green Poly', chip: '#3f6b45', metal: '#3f6b45' }
    ],
    build: (p) => {
      const g = G();
      const m = metal(p.metal, 0.4);
      // oval tank walls
      cyl(g, m, 45, 52, 0, 0, 60, { seg: 24 });
      cyl(g, m, 45, 52, 0, 0, -60, { seg: 24 });
      box(g, m, 90, 52, 120, 0, 0, 0);
      // water surface
      cyl(g, glass(), 40, 2, 0, 46, 60, { seg: 24 });
      cyl(g, glass(), 40, 2, 0, 46, -60, { seg: 24 });
      box(g, glass(), 80, 2, 120, 0, 46, 0);
      // rolled rim
      for (const z of [60, -60]) cyl(g, m, 46, 4, 0, 50, z, { seg: 24 });
      return g;
    }
  },
  {
    id: 'farm_wheelbarrow', name: 'Wheelbarrow', cat: 'farm', w: 70, d: 150, h: 70,
    plan: { type: 'box' },
    palettes: [
      { name: 'Green', chip: '#3c6b3e', tub: '#3c6b3e' },
      { name: 'Red', chip: '#a3312a', tub: '#a3312a' }
    ],
    build: (p) => {
      const g = G();
      const tub = metal(p.tub, 0.45);
      const steel = metal('#8a8f96', 0.4);
      // sloped tray
      box(g, tub, 62, 34, 90, 0, 26, -6, { r: 6 });
      box(g, tub, 62, 8, 30, 0, 16, 42, { rx: -0.4 });
      // handles
      for (const s of [-1, 1]) cyl(g, wood('#8a6b44', 0.6), 3, 130, s * 26, 22, -18, { rx: Math.PI / 2, seg: 10 });
      // front leg stand
      for (const s of [-1, 1]) cyl(g, steel, 2.4, 26, s * 24, 0, -40, { seg: 8 });
      // single front wheel
      cyl(g, solid('#2a2622', 0.9), 20, 12, 0, 20, 60, { rz: Math.PI / 2, seg: 20 });
      cyl(g, steel, 8, 13, 0, 20, 60, { rz: Math.PI / 2, seg: 12 });
      // dirt load
      blob(g, '#5a4436', '#6f5644', 30, 0, 44, -6, { seed: 4, sy: 0.5, detail: 2 });
      return g;
    }
  },
  {
    id: 'farm_scarecrow', name: 'Scarecrow', cat: 'farm', w: 120, d: 30, h: 210,
    plan: { type: 'box' },
    palettes: [
      { name: 'Plaid', chip: '#8a3b2e', shirt: '#8a3b2e', pants: '#3a4f6b' },
      { name: 'Overalls', chip: '#3a4f6b', shirt: '#7a2e24', pants: '#3a4f6b' }
    ],
    build: (p) => {
      const g = G();
      const post = wood('#7a5f40', 0.7);
      // cross frame
      cyl(g, post, 4, 200, 0, 0, 0, { seg: 8 });
      box(g, post, 118, 6, 6, 0, 150, 0);
      // straw-stuffed body
      box(g, solid(p.shirt, 0.85), 46, 60, 24, 0, 120, 0, { r: 6 });
      box(g, solid(p.pants, 0.85), 42, 50, 22, 0, 74, 0, { r: 5 });
      for (const s of [-1, 1]) {
        box(g, solid(p.shirt, 0.85), 46, 12, 12, s * 34, 150, 0);   // sleeves
        box(g, solid(p.pants, 0.85), 12, 44, 12, s * 12, 34, 0);    // legs
      }
      // burlap head + hat
      sphere(g, solid('#cbb487', 0.85), 16, 0, 172, 0);
      sphere(g, solid('#2a2622', 0.4), 1.6, -6, 174, 12);
      sphere(g, solid('#2a2622', 0.4), 1.6, 6, 174, 12);
      cyl(g, wood('#9a7a44', 0.7), 24, 4, 0, 184, 0, { seg: 18 });
      cyl(g, wood('#9a7a44', 0.7), 12, 16, 0, 186, 0, { seg: 18 });
      // straw poking from sleeves, collar and hat
      foliage(g, '#c8a94e', '#e4cf86', 0, 178, 0, 22, 8, 2);
      for (const s of [-1, 1]) foliage(g, '#c8a94e', '#e4cf86', s * 56, 150, 0, 12, 6, s + 3);
      return g;
    }
  },
  {
    id: 'farm_weathervane', name: 'Rooster Weathervane', cat: 'farm', w: 60, d: 60, h: 150,
    plan: { type: 'box' },
    palettes: [
      { name: 'Aged Copper', chip: '#5a8f78', metal: '#5a8f78' },
      { name: 'Black Iron', chip: '#2c2e32', metal: '#2c2e32' }
    ],
    build: (p) => {
      const g = G();
      const m = metal(p.metal, 0.45);
      cyl(g, m, 4, 110, 0, 0, 0, { seg: 10 });
      sphere(g, m, 6, 0, 112, 0);
      // N-S-E-W direction arms + letters as little bars
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2;
        const arm = box(g, m, 3, 3, 44, 0, 122, 0, { ry: a });
        box(g, m, 6, 6, 6, Math.sin(a) * 24, 132, Math.cos(a) * 24);
      }
      // rooster silhouette on top (body, tail, head, comb, legs)
      const y = 138;
      sphere(g, m, 12, 0, y, 2, { sx: 0.5, sy: 1, sz: 1.2 });
      for (let i = 0; i < 4; i++) box(g, m, 1.5, 20 - i * 3, 3, 0, y, -8 - i, { rx: -0.5 - i * 0.12 }); // tail
      sphere(g, m, 6, 0, y + 12, 10, { sx: 0.5 });                                                       // head
      for (let i = 0; i < 3; i++) sphere(g, m, 2.4, 0, y + 18 + i, 8 + i, { sx: 0.4, sy: 1.3 });        // comb
      cyl(g, m, 1, 12, 0, y - 12, 4, { rx: 0.2, seg: 6 });                                               // leg
      return g;
    }
  },
  {
    id: 'farm_milk_can', name: 'Milk Can', cat: 'farm', w: 42, d: 42, h: 74,
    plan: { type: 'box' },
    palettes: [
      { name: 'Galvanised', chip: '#aeb2b7', metal: '#aeb2b7' },
      { name: 'Vintage Red', chip: '#9a352a', metal: '#9a352a' }
    ],
    build: (p) => {
      const g = G();
      const m = metal(p.metal, 0.4);
      cyl(g, m, 19, 48, 0, 0, 0, { seg: 24 });                 // body
      cyl(g, m, 19, 8, 0, 48, 0, { rTop: 11, seg: 24 });       // shoulder
      cyl(g, m, 11, 12, 0, 56, 0, { seg: 20 });                // neck
      cyl(g, m, 12, 5, 0, 68, 0, { rTop: 12, seg: 20 });       // lid
      cyl(g, metal('#8a8f96', 0.4), 4, 5, 0, 73, 0, { seg: 12 });
      // side handles
      for (const s of [-1, 1]) ring(g, m, 6, s * 19, 58, 0);
      // rim bands
      for (const y of [10, 34]) cyl(g, m, 19.5, 2.4, 0, y, 0, { seg: 24 });
      return g;
    }
  },
  {
    id: 'farm_pallet', name: 'Wooden Pallet', cat: 'farm', w: 120, d: 100, h: 15,
    plan: { type: 'slab' },
    palettes: [{ name: 'Pine', chip: '#c4a678', wood: '#c4a678' }],
    build: (p) => {
      const g = G();
      const w = wood(p.wood, 0.7);
      // three bottom stringers
      for (const z of [-44, 0, 44]) box(g, w, 118, 6, 8, 0, 0, z);
      // blocks / feet
      for (const x of [-52, 0, 52]) for (const z of [-44, 0, 44]) box(g, w, 10, 5, 10, x, 6, z);
      // top deck boards with gaps
      for (let i = 0; i < 7; i++) box(g, w, 118, 4, 11, 0, 11, -45 + i * 15);
      return g;
    }
  },
  {
    id: 'farm_tractor', name: 'Tractor', cat: 'farm', w: 160, d: 300, h: 200,
    plan: { type: 'car' },
    palettes: [
      { name: 'Green', chip: '#357a3a', body: '#357a3a', trim: '#f0c81e' },
      { name: 'Red', chip: '#a3312a', body: '#a3312a', trim: '#e4e0d6' },
      { name: 'Blue', chip: '#2f5f86', body: '#2f5f86', trim: '#efe9dd' }
    ],
    build: (p) => {
      const g = G();
      const paint = solid(p.body, 0.4);
      const trim = solid(p.trim, 0.4);
      const tire = solid('#1c1c1e', 0.9);
      const rim = metal('#c2c6cc', 0.3);
      // big rear wheels + small front wheels (axles along x)
      for (const s of [-1, 1]) {
        cyl(g, tire, 52, 34, s * 70, 52, -70, { rz: Math.PI / 2, seg: 24 });
        cyl(g, trim, 22, 35, s * 70, 52, -70, { rz: Math.PI / 2, seg: 20 });
        cyl(g, tire, 30, 26, s * 62, 30, 100, { rz: Math.PI / 2, seg: 22 });
        cyl(g, rim, 12, 27, s * 62, 30, 100, { rz: Math.PI / 2, seg: 16 });
      }
      // chassis + hood + grille
      box(g, paint, 72, 44, 150, 0, 44, 10, { r: 8 });
      box(g, paint, 66, 54, 96, 0, 60, 74, { r: 10 });         // hood
      box(g, trim, 60, 40, 6, 0, 62, 122);                     // grille
      box(g, solid('#f4f0d8', 0.3), 12, 12, 5, -22, 88, 121);  // headlights
      box(g, solid('#f4f0d8', 0.3), 12, 12, 5, 22, 88, 121);
      // exhaust stack
      cyl(g, metal('#5a5f66', 0.5), 4, 60, 24, 88, 96, { seg: 12 });
      cyl(g, metal('#5a5f66', 0.5), 5, 6, 24, 148, 96, { seg: 12 });
      // fenders over rear wheels
      for (const s of [-1, 1]) cyl(g, paint, 58, 40, s * 62, 52, -70, { rz: Math.PI / 2, rTop: 58, seg: 16 });
      // ROPS cab frame + seat + wheel
      for (const s of [-1, 1]) for (const z of [-30, 6]) cyl(g, metal('#3a3f45', 0.4), 3, 96, s * 34, 88, z, { seg: 8 });
      box(g, metal('#3a3f45', 0.4), 74, 4, 44, 0, 184, -12);
      box(g, glass(), 70, 60, 4, 0, 120, -30);
      box(g, solid('#26221e', 0.7), 26, 10, 26, 0, 96, -10, { r: 4 });   // seat
      box(g, solid('#26221e', 0.7), 26, 22, 8, 0, 106, -22, { r: 4 });
      cyl(g, solid('#26221e', 0.7), 11, 2, 0, 108, 34, { rx: 0.5, seg: 16 });  // steering wheel
      return g;
    }
  },
  {
    id: 'farm_produce_stand', name: 'Farm Produce Stand', cat: 'farm', w: 200, d: 120, h: 210,
    plan: { type: 'box' },
    palettes: [
      { name: 'Rustic', chip: '#9a7a4e', wood: '#9a7a4e', sign: '#7a2e24' },
      { name: 'Whitewash', chip: '#d8cdba', wood: '#d8cdba', sign: '#3c6b3e' }
    ],
    build: (p) => {
      const g = G();
      const w = wood(p.wood, 0.7);
      // posts
      for (const [x, z] of [[-90, -50], [90, -50], [-90, 50], [90, 50]]) cyl(g, w, 5, 150, x, 0, z, { seg: 8 });
      // slanted display counter
      box(g, w, 190, 8, 100, 0, 78, 0, { rx: -0.18 });
      box(g, w, 190, 40, 8, 0, 40, 48);
      // slatted lean-to roof
      box(g, tex('real_barnwood_siding', 2, 1), 210, 8, 116, 0, 150, -6, { rx: -0.2 });
      // sign board
      box(g, solid(p.sign, 0.7), 150, 34, 4, 0, 176, -52);
      box(g, w, 158, 6, 6, 0, 196, -52);
      // crates on the counter
      for (const x of [-58, 0, 58]) {
        box(g, wood('#b08a52', 0.7), 42, 26, 42, x, 86, 6, { r: 2 });
        for (const [ex, ez] of [[-12, -12], [12, -12], [-12, 12], [12, 12], [0, 0]]) box(g, wood('#b08a52', 0.75), 4, 26, 42, x + ex, 86, 6);
      }
      // heaped produce (apples / squash / greens)
      const veg = [
        ['#b8321f', '#d85a3a', -58], ['#e0932a', '#f0b451', 0], ['#4f7a2e', '#6ea044', 58]
      ];
      for (const [a, b, x] of veg) foliage(g, a, b, x, 106, 6, 24, 12, x + 9);
      return g;
    }
  }
];
