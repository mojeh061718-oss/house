// Modern / luxury LIVING ROOM catalog pack. Photo-real models built only from
// primitive helpers, using the app's photo textures on soft goods (p.fabric),
// wood and marble tops. All dimensions in cm; origin centered on floor; +Z front.
import { G, box, cyl, sphere, prism, legs4, shade, wavyPanel, blob, solid, glow, wood, metal, chrome, glass, tex, artMaterial } from '../builders.js';

// Seating palettes: photo fabric + coordinating leg/wood tone.
const SEAT = [
  { name: 'Dove Grey', chip: '#8e8e92', fabric: 'fabric_gray', wood: '#4a4038' },
  { name: 'Oat Beige', chip: '#c4b49a', fabric: 'fabric_beige', wood: '#6a4f36' },
  { name: 'Slate Blue', chip: '#5a6e8c', fabric: 'fabric_blue', wood: '#3a3735' },
  { name: 'Sage', chip: '#6d7d64', fabric: 'fabric_green', wood: '#5f4632' }
];
const WOODS = [
  { name: 'Walnut', chip: '#5f4632', wood: '#5f4632', tex: 'real_walnut_strip' },
  { name: 'Oak', chip: '#a07a4f', wood: '#a07a4f', tex: 'real_strip_oak' },
  { name: 'Caramel', chip: '#8a5a34', wood: '#8a5a34', tex: 'real_caramel_plank' },
  { name: 'Black', chip: '#3a3735', wood: '#3a3735', tex: 'real_walnut_strip' }
];
const LEATHER = [
  { name: 'Cognac', chip: '#8a5a34', fabric: '#8a5a34', wood: '#4a3826' },
  { name: 'Oxblood', chip: '#6a2e2a', fabric: '#6a2e2a', wood: '#3a2b20' },
  { name: 'Charcoal', chip: '#3c3a38', fabric: '#3c3a38', wood: '#2a2622' }
];
const dark = '#33312e';
const seatMat = (p) => (typeof p.fabric === 'string' && p.fabric.startsWith('#')) ? solid(p.fabric, 0.5) : tex(p.fabric, 2, 2);

// tapered round leg helper
function tleg(g, mat, x, z, h, r = 3) { cyl(g, mat, r, h, x, 0, z, { rTop: r * 0.6 }); }

export const LIVINGROOM_ITEMS = [
  // ---------------------------------------------------------------- L-sectional
  {
    id: 'liv_sectional_l', name: 'L-Shaped Sectional', cat: 'living', w: 300, d: 220, h: 82,
    palettes: SEAT, plan: { type: 'sofa', seats: 5 },
    build: (p) => {
      const g = G();
      const f = seatMat(p);
      const lm = metal(p.wood, 0.45);
      const baseH = 24;
      // plinth bases (long run along back-left; chaise arm to the right/front)
      box(g, solid('#3f3a34', 0.8), 296, 12, 96, 0, 0, -58, { r: 2 });
      box(g, solid('#3f3a34', 0.8), 96, 12, 122, 100, 0, 49, { r: 2 });
      // seat bases
      box(g, f, 296, baseH, 96, 0, 12, -58, { r: 6 });
      box(g, f, 96, baseH, 122, 100, 12, 49, { r: 6 });
      // back rest run + chaise low back
      box(g, f, 296, 40, 22, 0, 12 + baseH, -95, { r: 7 });
      box(g, f, 22, 30, 100, 148, 12 + baseH, -58, { r: 7 });
      // arms
      box(g, f, 22, 44, 96, -148, 12, -58, { r: 8 });
      box(g, f, 96, 28, 22, 100, 12, 99, { r: 8 });
      // seat cushions (3 across the run + 1 on chaise)
      for (let i = 0; i < 3; i++) box(g, f, 88, 16, 82, -96 + i * 96, baseH + 12, -54, { r: 6 });
      box(g, f, 90, 16, 110, 100, baseH + 12, 50, { r: 6 });
      // back cushions
      for (let i = 0; i < 3; i++) box(g, f, 84, 40, 16, -96 + i * 96, baseH + 20, -84, { r: 7, rx: -0.12 });
      // throw pillows
      box(g, tex('fabric_beige', 1, 1), 44, 44, 16, -150, baseH + 24, -50, { r: 10, ry: 0.3, rx: 0.2 });
      box(g, tex('fabric_blue', 1, 1), 42, 42, 15, 96, baseH + 22, 20, { r: 10, ry: -0.2, rx: 0.25 });
      // low tapered feet
      for (const [x, z] of [[-140, -20], [140, -95], [50, -20], [140, 95]]) tleg(g, lm, x, z, 8, 3.2);
      return g;
    }
  },
  // ---------------------------------------------------------------- deep 3-seat
  {
    id: 'liv_sofa_deep', name: 'Deep 3-Seat Sofa', cat: 'living', w: 240, d: 105, h: 84,
    palettes: SEAT, plan: { type: 'sofa', seats: 3 },
    build: (p) => {
      const f = seatMat(p);
      const g = G();
      const lm = metal(p.wood, 0.45), baseH = 26;
      box(g, solid('#3f3a34', 0.8), 236, 12, 100, 0, 0, 0, { r: 2 });
      box(g, f, 240, baseH, 105, 0, 12, 0, { r: 7 });         // base
      box(g, f, 204, 38, 24, 0, 12 + baseH, -40, { r: 8 });   // back rail
      for (const s of [-1, 1]) box(g, f, 22, 46, 105, s * 109, 12, 0, { r: 9 }); // arms
      for (let i = 0; i < 3; i++) {                            // seat + back cushions
        const x = -68 + i * 68;
        box(g, f, 64, 18, 84, x, baseH + 12, 6, { r: 6 });
        box(g, f, 62, 40, 18, x, baseH + 22, -38, { r: 8, rx: -0.1 });
      }
      // throw pillows
      box(g, tex('fabric_beige', 1, 1), 42, 42, 15, -78, baseH + 26, 4, { r: 10, ry: 0.25, rx: 0.2 });
      box(g, tex('fabric_green', 1, 1), 40, 40, 15, 78, baseH + 24, 4, { r: 10, ry: -0.25, rx: 0.2 });
      for (const [x, z] of [[-100, -38], [100, -38], [-100, 38], [100, 38]]) tleg(g, lm, x, z, 10, 3.4);
      return g;
    }
  },
  // ---------------------------------------------------------------- chesterfield
  {
    id: 'liv_chesterfield', name: 'Chesterfield Sofa', cat: 'living', w: 224, d: 96, h: 78,
    palettes: LEATHER, plan: { type: 'sofa', seats: 3 },
    build: (p) => {
      const g = G();
      const lth = solid(p.fabric, 0.42);
      box(g, lth, 220, 44, 90, 0, 0, 2, { r: 12 });                 // deep seat base
      box(g, lth, 220, 40, 22, 0, 40, -34, { r: 14 });             // rolled tufted back
      for (const s of [-1, 1]) box(g, lth, 24, 40, 90, s * 100, 34, 2, { r: 14 }); // rolled arms
      // seat cushions
      for (let i = 0; i < 3; i++) box(g, lth, 66, 14, 66, -66 + i * 66, 44, 8, { r: 8 });
      // button tufts on the back
      for (let r = 0; r < 2; r++)
        for (let i = 0; i < 7; i++) sphere(g, solid('#2a221e', 0.5), 1.5, -78 + i * 26, 52 + r * 12, -25);
      legs4(g, wood(p.wood, 0.4), 210, 84, 9, 3, 12);
      return g;
    }
  },
  // ---------------------------------------------------------------- mid-century loveseat
  {
    id: 'liv_loveseat_mid', name: 'Mid-Century Loveseat', cat: 'living', w: 162, d: 90, h: 80,
    palettes: SEAT, plan: { type: 'sofa', seats: 2 },
    build: (p) => {
      const g = G();
      const f = seatMat(p);
      const wl = wood(p.wood, 0.4), baseH = 22;
      box(g, f, 162, baseH, 90, 0, 16, 0, { r: 6 });               // floating base
      box(g, f, 138, 34, 20, 0, 16 + baseH, -33, { r: 7 });        // slim back
      for (const s of [-1, 1]) box(g, f, 14, 40, 88, s * 74, 16, 0, { r: 6 }); // slim arms
      for (const s of [-1, 1]) box(g, wl, 6, 42, 10, s * 74, 14, -34); // wood arm caps
      for (let i = 0; i < 2; i++) {
        const x = -35 + i * 70;
        box(g, f, 66, 16, 74, x, baseH + 12, 4, { r: 5 });
        box(g, f, 64, 34, 16, x, baseH + 20, -31, { r: 6, rx: -0.1 });
      }
      // splayed wood legs
      for (const [x, z] of [[-70, -34], [70, -34], [-70, 34], [70, 34]])
        cyl(g, wl, 3.2, 20, x, 0, z, { rTop: 1.6, rx: (z > 0 ? 0.16 : -0.16), rz: (x > 0 ? 0.16 : -0.16) });
      return g;
    }
  },
  // ---------------------------------------------------------------- wingback chair
  {
    id: 'liv_wingback', name: 'Wingback Accent Chair', cat: 'living', w: 82, d: 88, h: 108,
    palettes: SEAT, plan: { type: 'chair' },
    build: (p) => {
      const g = G();
      const f = seatMat(p);
      const wl = wood(p.wood, 0.4), baseH = 24;
      box(g, f, 78, baseH, 82, 0, 18, 4, { r: 6 });                // base
      box(g, f, 62, 16, 70, 0, 18 + baseH, 8, { r: 6 });          // seat cushion
      box(g, f, 74, 70, 18, 0, 18, -32, { r: 10 });               // tall back
      // wings
      for (const s of [-1, 1]) box(g, f, 16, 52, 26, s * 34, 36, -20, { r: 8, ry: s * -0.25 });
      // arms
      for (const s of [-1, 1]) box(g, f, 14, 26, 78, s * 36, 18, 6, { r: 7 });
      box(g, f, 60, 46, 16, 0, 30, -30, { r: 8, rx: -0.06 });     // lumbar cushion
      legs4(g, wl, 70, 74, 20, 3.2, 8);
      return g;
    }
  },
  // ---------------------------------------------------------------- swivel chair
  {
    id: 'liv_swivel', name: 'Swivel Accent Chair', cat: 'living', w: 82, d: 82, h: 78,
    palettes: SEAT, plan: { type: 'chair' },
    build: (p) => {
      const g = G();
      const f = seatMat(p);
      const m = metal('#2e3034', 0.3);
      // curved tub shell: base + wraparound back approximated with panels
      box(g, f, 78, 26, 78, 0, 30, 0, { r: 14 });                 // seat pod
      box(g, f, 60, 14, 60, 0, 56, 4, { r: 10 });                 // seat cushion
      box(g, f, 74, 40, 22, 0, 40, -30, { r: 16 });              // curved back
      for (const s of [-1, 1]) box(g, f, 22, 34, 60, s * 30, 38, 2, { r: 16 }); // curved arms
      // swivel base
      cyl(g, m, 5, 30, 0, 0, 0);
      cyl(g, chrome(), 34, 4, 0, 0, 0);
      cyl(g, chrome(), 30, 2, 0, 4, 0, { rTop: 34 });
      return g;
    }
  },
  // ---------------------------------------------------------------- chaise lounge
  {
    id: 'liv_chaise', name: 'Chaise Lounge', cat: 'living', w: 80, d: 165, h: 80,
    palettes: SEAT, plan: { type: 'sofa', seats: 1 },
    build: (p) => {
      const g = G();
      const f = seatMat(p);
      const lm = metal(p.wood, 0.45), baseH = 22;
      box(g, f, 78, baseH, 160, 0, 16, 0, { r: 6 });              // long base
      box(g, f, 70, 14, 150, 0, 16 + baseH, 2, { r: 6 });        // long cushion
      box(g, f, 74, 50, 18, 0, 16, -74, { r: 10, rx: -0.28 });   // reclined back
      for (const s of [-1, 1]) box(g, f, 14, 26, 150, s * 32, 16, 2, { r: 6 }); // low arms
      box(g, tex('fabric_beige', 1, 1), 40, 40, 15, 0, baseH + 24, -52, { r: 12, rx: 0.2 }); // pillow
      for (const [x, z] of [[-32, -68], [32, -68], [-32, 68], [32, 68]]) tleg(g, lm, x, z, 12, 3);
      return g;
    }
  },
  // ---------------------------------------------------------------- recliner
  {
    id: 'liv_recliner', name: 'Reclining Armchair', cat: 'living', w: 92, d: 100, h: 104,
    palettes: SEAT, plan: { type: 'chair' },
    build: (p) => {
      const g = G();
      const f = seatMat(p);
      const m = metal('#2e3034', 0.3);
      box(g, f, 86, 30, 82, 0, 6, 6, { r: 10 });                 // seat base
      box(g, f, 66, 16, 70, 0, 36, 10, { r: 8 });                // seat cushion
      box(g, f, 72, 60, 20, 0, 34, -32, { r: 12, rx: -0.22 });   // tall padded back
      for (const s of [-1, 1]) box(g, f, 18, 34, 80, s * 37, 20, 6, { r: 9 }); // padded arms
      box(g, f, 64, 12, 46, 0, 22, 56, { r: 6, rx: 0.3 });       // footrest
      box(g, f, 60, 46, 16, 0, 44, -30, { r: 8 });               // headrest cushion
      for (const s of [-1, 1]) box(g, m, 4, 20, 30, s * 20, 4, 30, { rx: 0.5 });
      return g;
    }
  },
  // ---------------------------------------------------------------- marble coffee table
  {
    id: 'liv_coffee_marble', name: 'Marble Coffee Table', cat: 'living', w: 120, d: 66, h: 40,
    palettes: [
      { name: 'Carrara', chip: '#e8e6e2', top: 'real_marble', base: '#8a8d90' },
      { name: 'Nero', chip: '#2a2a2c', top: 'real_nero', base: '#c9ccd0' }
    ],
    plan: { type: 'table' },
    build: (p) => {
      const g = G();
      box(g, tex(p.top, 1, 1), 120, 6, 66, 0, 34, 0, { r: 1.2 }); // marble slab
      // sculptural metal frame
      const m = metal(p.base, 0.3);
      for (const s of [-1, 1]) {
        box(g, m, 4, 34, 54, s * 54, 0, 0, { r: 1 });
        // round foot bar running along the side panel's depth (z), not out past
        // the ends — the old rz-rotated 100cm bar doubled the table's width
        cyl(g, m, 2, 54, s * 54, 8, 0, { rx: Math.PI / 2 });
      }
      box(g, m, 100, 3, 4, 0, 6, 24);
      box(g, m, 100, 3, 4, 0, 6, -24);
      // styling: stacked books + bowl
      box(g, solid('#7c4434', 0.7), 26, 3, 18, -28, 37, 8);
      box(g, solid('#39506b', 0.7), 23, 3, 16, -26, 40, 6, { ry: 0.2 });
      sphere(g, chrome(), 8, 30, 40, -6, { sy: 0.55 });
      return g;
    }
  },
  // ---------------------------------------------------------------- wood coffee table
  {
    id: 'liv_coffee_wood', name: 'Wood Coffee Table', cat: 'living', w: 115, d: 62, h: 42,
    palettes: WOODS, plan: { type: 'table' },
    build: (p) => {
      const g = G();
      const t = tex(p.tex, 1, 1), wd = wood(p.wood, 0.5);
      box(g, t, 115, 5, 62, 0, 37, 0, { r: 1.5 });               // plank top
      box(g, t, 105, 4, 52, 0, 14, 0, { r: 1 });                 // lower shelf
      legs4(g, wd, 108, 55, 37, 3, 5, true);
      // decor
      box(g, solid('#c96f4a', 0.7), 22, 3, 16, -24, 40, 6);
      cyl(g, solid('#d9cdb8', 0.7), 9, 3, 28, 42, -6);
      return g;
    }
  },
  // ---------------------------------------------------------------- nesting tables
  {
    id: 'liv_nesting', name: 'Nesting Side Tables', cat: 'living', w: 60, d: 45, h: 52,
    palettes: WOODS, plan: { type: 'tableRound' },
    build: (p) => {
      const g = G();
      const t = tex(p.tex, 1, 1);
      const m = metal('#2e3034', 0.3);
      // large table
      cyl(g, t, 22, 4, -8, 48, 0);
      cyl(g, m, 1.6, 48, -22, 0, -6); cyl(g, m, 1.6, 48, 6, 0, -6);
      cyl(g, m, 1.6, 48, -8, 0, 14);
      // small nested table (lower, offset)
      cyl(g, t, 17, 4, 18, 36, 6);
      cyl(g, m, 1.4, 36, 6, 0, 0); cyl(g, m, 1.4, 36, 30, 0, 0);
      cyl(g, m, 1.4, 36, 18, 0, 20);
      return g;
    }
  },
  // ---------------------------------------------------------------- media console
  {
    id: 'liv_media', name: 'Media Console', cat: 'living', w: 210, d: 44, h: 52,
    palettes: WOODS, plan: { type: 'storage' },
    build: (p) => {
      const g = G();
      const t = tex(p.tex, 2, 1), wd = wood(p.wood, 0.5);
      box(g, t, 210, 40, 44, 0, 10, 0, { r: 2 });                // carcass
      box(g, t, 210, 4, 44, 0, 48, 0, { r: 1 });                 // top
      // 3 doors with slim handles
      for (let i = 0; i < 3; i++) {
        const x = -66 + i * 66;
        box(g, wd, 60, 28, 2, x, 14, 22.5);
        cyl(g, metal('#c9ccd0', 0.3), 0.8, 18, x, 28, 23.5, { rz: Math.PI / 2 });
      }
      // tapered metal legs + a book stack on top
      for (const [x, z] of [[-96, -16], [96, -16], [-96, 16], [96, 16]]) tleg(g, metal(p.wood, 0.4), x, z, 10, 2.4);
      box(g, solid('#39506b', 0.7), 24, 4, 16, -60, 52, 4);
      box(g, solid('#7c4434', 0.7), 22, 4, 15, -60, 56, 4, { ry: 0.15 });
      return g;
    }
  },
  // ---------------------------------------------------------------- tall bookshelf
  {
    id: 'liv_bookshelf', name: 'Tall Bookshelf', cat: 'living', w: 90, d: 34, h: 200,
    palettes: WOODS, plan: { type: 'storage' },
    build: (p) => {
      const g = G();
      const t = tex(p.tex, 1, 2), wd = wood(p.wood, 0.5);
      // frame
      for (const s of [-1, 1]) box(g, t, 4, 200, 34, s * 43, 0, 0);
      box(g, t, 90, 4, 34, 0, 0, 0);
      box(g, t, 90, 4, 34, 0, 196, 0);
      box(g, t, 82, 3, 32, 0, 4, -1);                            // back-ish base
      // 4 shelves + book fills
      const bookCols = ['#7c4434', '#39506b', '#5d7a4c', '#c2b49a', '#8a5a34', '#40474f'];
      for (let s = 0; s < 4; s++) {
        const y = 38 + s * 40;
        box(g, wd, 82, 3, 32, 0, y, 0);
        for (let b = 0; b < 9; b++) {
          const h = 22 + (b % 3) * 4;
          box(g, solid(bookCols[(s + b) % bookCols.length], 0.7), 4.2, h, 26, -38 + b * 8.5, y + 3, 0, { ry: b === 8 ? 0.3 : 0 });
        }
      }
      // a plant + bowl for life
      cyl(g, solid('#c9c0ae', 0.7), 7, 12, 24, 155, 0);
      blob(g, '#4a6e3a', '#5d8348', 12, 24, 176, 0, { seed: 12, sy: 0.9 });
      return g;
    }
  },
  // ---------------------------------------------------------------- floating wall shelves
  {
    id: 'liv_wall_shelves', name: 'Floating Wall Shelves', cat: 'living', w: 100, d: 22, h: 60,
    elevation: 140, mount: 'wall', palettes: WOODS, plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      const t = tex(p.tex, 1, 1);
      // two staggered floating planks
      box(g, t, 100, 4, 22, 0, 0, 0, { r: 0.8 });
      box(g, t, 76, 4, 20, -8, 40, -1, { r: 0.8 });
      // decor: frame, vase, books, plant
      box(g, solid('#2e2b28', 0.6), 22, 26, 2, 26, 4, -8);
      box(g, artMaterial(4), 18, 22, 1, 26, 6, -6.6);
      cyl(g, solid('#c9bfa8', 0.6), 5, 16, -6, 4, 4);
      box(g, solid('#39506b', 0.7), 16, 3, 12, -34, 4, 2);
      cyl(g, solid('#b8977c', 0.7), 5, 10, 22, 44, -2, { rTop: 6 });
      blob(g, '#4a6e3a', '#5d8348', 9, 22, 52, -1, { seed: 5, sy: 0.9 });
      return g;
    }
  },
  // ---------------------------------------------------------------- credenza / sideboard
  {
    id: 'liv_credenza', name: 'Credenza Sideboard', cat: 'living', w: 180, d: 46, h: 76,
    palettes: WOODS, plan: { type: 'storage' },
    build: (p) => {
      const g = G();
      const t = tex(p.tex, 2, 1), wd = wood(p.wood, 0.5);
      box(g, t, 180, 56, 46, 0, 14, 0, { r: 2 });                // body
      box(g, t, 180, 4, 46, 0, 70, 0, { r: 1 });                 // top
      // 4 doors with angled slat detail + round knobs
      for (let i = 0; i < 4; i++) {
        const x = -66 + i * 44;
        box(g, wd, 40, 44, 2, x, 20, 23.5);
        sphere(g, metal('#c9ccd0', 0.3), 1.8, x + (i < 2 ? 16 : -16), 42, 24.5);
      }
      // splayed wood legs
      for (const [x, z] of [[-80, -16], [80, -16], [-80, 16], [80, 16]])
        cyl(g, wd, 3.4, 20, x, 0, z, { rTop: 1.8, rz: (x > 0 ? 0.14 : -0.14), rx: (z > 0 ? 0.14 : -0.14) });
      return g;
    }
  },
  // ---------------------------------------------------------------- ottoman / pouf
  {
    id: 'liv_pouf', name: 'Round Pouf Ottoman', cat: 'living', w: 55, d: 55, h: 40,
    palettes: SEAT, plan: { type: 'stool' },
    build: (p) => {
      const g = G();
      const f = seatMat(p);
      // plush drum with a cinched seam
      cyl(g, f, 27, 34, 0, 4, 0, { rTop: 26 });
      sphere(g, f, 27, 0, 38, 0, { sy: 0.32 });                  // domed top
      // stitched vertical seams
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        cyl(g, solid(p.chip, 0.6), 0.5, 34, Math.cos(a) * 26.4, 4, Math.sin(a) * 26.4);
      }
      cyl(g, metal(p.wood, 0.4), 26, 4, 0, 0, 0);                // base rim
      return g;
    }
  },
  // ---------------------------------------------------------------- console table
  {
    id: 'liv_console', name: 'Console Table', cat: 'living', w: 130, d: 36, h: 80,
    palettes: WOODS, plan: { type: 'table' },
    build: (p) => {
      const g = G();
      const t = tex(p.tex, 1, 1);
      const m = metal('#2e3034', 0.3);
      box(g, t, 130, 5, 36, 0, 75, 0, { r: 1.2 });              // top
      box(g, t, 118, 4, 30, 0, 34, 0, { r: 1 });                // lower shelf
      // slim metal frame legs (hairpin-ish)
      for (const s of [-1, 1]) {
        box(g, m, 3, 75, 3, s * 60, 0, -14);
        box(g, m, 3, 75, 3, s * 60, 0, 14);
        box(g, m, 3, 3, 32, s * 60, 74, 0);
      }
      // decor: lamp base vibe + tray
      cyl(g, solid('#c9bfa8', 0.6), 6, 20, -40, 80, 0, { rTop: 7 });
      box(g, solid('#7c4434', 0.7), 24, 4, 16, 36, 80, 0);
      return g;
    }
  },
  // ---------------------------------------------------------------- arc floor lamp
  {
    id: 'liv_arc_lamp', name: 'Arc Floor Lamp', cat: 'living', w: 40, d: 150, h: 200,
    palettes: null, plan: { type: 'lampRound' },
    light: { y: 175, z: 60, color: '#ffe0b0', intensity: 1.0, distance: 500 },
    build: () => {
      const g = G();
      const m = metal('#c9ccd0', 0.25);
      // weighted marble base
      cyl(g, tex('real_marble', 1, 1), 18, 8, 0, 0, -60);
      cyl(g, metal('#2e3034', 0.3), 6, 4, 0, 8, -60);
      // arcing arm: rising post + curved segments swinging out to +z
      cyl(g, m, 2, 90, 0, 10, -60);
      cyl(g, m, 2, 60, 0, 96, -54, { rx: 0.5 });
      cyl(g, m, 2, 55, 0, 148, -32, { rx: 1.0 });
      cyl(g, m, 2, 45, 0, 178, 6, { rx: 1.35 });
      // hanging dome shade over +z
      shade(g, '#efe7d6', 22, 12, 24, 0, 158, 56);
      sphere(g, glow('#fff2d8', 1.1), 6, 0, 164, 56);
      return g;
    }
  },
  // ---------------------------------------------------------------- tripod floor lamp
  {
    id: 'liv_tripod_lamp', name: 'Tripod Floor Lamp', cat: 'living', w: 60, d: 60, h: 165,
    palettes: null, plan: { type: 'lampRound' },
    light: { y: 140, color: '#ffd9a0', intensity: 0.9, distance: 440 },
    build: () => {
      const g = G();
      const wl = wood('#5f4632', 0.4);
      // three splayed wooden legs
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        cyl(g, wl, 2.4, 130, Math.cos(a) * 24, 0, Math.sin(a) * 24,
          { rTop: 1.4, rx: -Math.sin(a) * 0.32, rz: Math.cos(a) * 0.32 });
      }
      cyl(g, metal('#c9ccd0', 0.3), 3, 6, 0, 118, 0);           // collar
      shade(g, '#e8dcc4', 24, 18, 30, 0, 128, 0);
      sphere(g, glow('#fff2d8', 1.0), 5, 0, 138, 0);
      return g;
    }
  },
  // ---------------------------------------------------------------- area rug
  {
    id: 'liv_rug', name: 'Large Area Rug', cat: 'living', w: 300, d: 200, h: 3,
    palettes: [
      { name: 'Oat', chip: '#d8ccb4', tex: 'real_carpet_oat', border: '#b8a888' },
      { name: 'Navy', chip: '#2e3a52', tex: 'real_carpet_navy', border: '#6a7690' }
    ],
    plan: { type: 'rug' },
    build: (p) => {
      const g = G();
      box(g, solid(p.border, 0.95), 300, 2, 200, 0, 0, 0);      // border underlay
      box(g, tex(p.tex, 3, 2), 288, 2.6, 188, 0, 0.3, 0);       // pile field
      return g;
    }
  },
  // ---------------------------------------------------------------- tall floor vase
  {
    id: 'liv_vase', name: 'Tall Floor Vase', cat: 'living', w: 36, d: 36, h: 100,
    palettes: [
      { name: 'Stone', chip: '#c9bfa8', c: '#c9bfa8' },
      { name: 'Charcoal', chip: '#3a3735', c: '#3a3735' },
      { name: 'Terracotta', chip: '#b5654a', c: '#b5654a' }
    ],
    plan: { type: 'plant' },
    build: (p) => {
      const g = G();
      const cer = solid(p.c, 0.5);
      // bellied ceramic vessel
      cyl(g, cer, 8, 14, 0, 0, 0, { rTop: 15 });
      cyl(g, cer, 15, 46, 0, 14, 0, { rTop: 12 });
      cyl(g, cer, 12, 20, 0, 60, 0, { rTop: 7 });
      cyl(g, cer, 7, 6, 0, 80, 0, { rTop: 8 });
      // pampas / branch sprigs
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        cyl(g, wood('#8a7a5e', 0.7), 0.7, 40, Math.cos(a) * 3, 84, Math.sin(a) * 3,
          { rx: -Math.sin(a) * 0.4, rz: Math.cos(a) * 0.4 });
        blob(g, '#d9cbb0', '#e8dcc4', 6, Math.cos(a) * 14, 120, Math.sin(a) * 14, { seed: 20 + i, sy: 1.4 });
      }
      return g;
    }
  },
  // ---------------------------------------------------------------- gallery frame set
  {
    id: 'liv_gallery', name: 'Gallery Frame Set', cat: 'living', w: 150, d: 4, h: 100,
    elevation: 135, mount: 'wall', palettes: null, plan: { type: 'wallDecor' },
    build: () => {
      const g = G();
      const frame = (w, h, x, y, seed) => {
        box(g, solid('#2e2b28', 0.6), w, h, 3, x, y, -1);
        box(g, artMaterial(seed), w - 6, h - 6, 1.2, x, y + 3, 0.5);
      };
      // asymmetric salon arrangement
      frame(56, 72, -46, 8, 2);
      frame(46, 34, 8, 46, 5);
      frame(46, 30, 8, 4, 8);
      frame(40, 52, 58, 20, 11);
      frame(30, 26, 58, -18, 3);
      return g;
    }
  }
];
