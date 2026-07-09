// Customizable signs pack — 15 sign styles that render the user's text
// (sign: true, up to 25 chars). textMaterial() shrinks the font to fit and
// ui.js auto-grows the plaque width with text length (unless signAdaptive
// is false), so builds here just draw the geometry + a text face.
import {
  G, box, cyl, sphere, pyramid, solid, wood, metal, glow,
  textMaterial, torus, strut, blob
} from '../builders.js';

// A short run of alternating chain links between two heights.
function chain(g, mat, x, yTop, yBot, z) {
  const n = Math.max(2, Math.round((yTop - yBot) / 3.2));
  const step = (yTop - yBot) / n;
  for (let i = 0; i < n; i++) {
    torus(g, mat, 1.4, 0.38, x, yTop - step * (i + 0.5), z,
      { rx: 0, ry: i % 2 ? Math.PI / 2 : 0, seg: 16, tubeSeg: 7 });
  }
}

export const SIGNS2_ITEMS = [
  // ---- 1. Hanging shingle sign (scroll bracket + chains) --------------------
  {
    id: 'sign2_shingle', name: 'Hanging Shingle Sign', cat: 'decor', w: 70, d: 6, h: 48,
    mount: 'wall', elevation: 185, sign: true, signDefault: 'The Hollow Inn',
    palettes: [
      { name: 'Tavern Oak', chip: '#5a3d28', bd: '#5a3d28', bg: '#3a2c20', fg: '#e8d9b0' },
      { name: 'Forest', chip: '#2f4a38', bd: '#33503c', bg: '#24382b', fg: '#e6ddc4' },
      { name: 'Harbor Navy', chip: '#22364a', bd: '#2b3d52', bg: '#22364a', fg: '#e8e2d0' },
      { name: 'TEST', chip: '#000', bd: '#5a3d28', bg: '#3a2c20', fg: '#e8d9b0', sign: 'Wilkersons Lakeside Lodge' }
    ],
    plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      const iron = metal('#2e3033', 0.5);
      // wall plate + scrolled bracket arm
      box(g, iron, 6, 26, 2, -32, 20, 0.8, { r: 1 });
      sphere(g, iron, 1.9, -32, 47.5, 0.8, { seg: 12 });
      for (const y of [23, 43]) sphere(g, iron, 1, -32, y, 2, { seg: 10 });
      strut(g, iron, -32, 42.5, 1.8, 31, 42.5, 1.8, 1.2);
      sphere(g, iron, 1.8, 32, 42.5, 1.8, { seg: 12 });          // arm finial
      strut(g, iron, -32, 26, 1.8, 4, 42, 1.8, 0.9);             // diagonal brace
      // chains down to the board
      chain(g, iron, -14, 42.5, 27, 2);
      chain(g, iron, 14, 42.5, 27, 2);
      // hanging board: wood core, proud trim rails, text face
      const bd = wood(p.bd, 0.5);
      box(g, bd, 62, 26, 2.4, 0, 0, 2, { r: 1 });
      for (const s of [-1, 1]) {
        box(g, bd, 62, 2.6, 3.4, 0, s > 0 ? 23.4 : 0, 2, { r: 0.9 });
        box(g, bd, 2.6, 26, 3.4, s * 29.7, 0, 2, { r: 0.9 });
        torus(g, iron, 1.5, 0.4, s * 14, 26.6, 2, { rx: 0, seg: 16, tubeSeg: 7 }); // hanger eyes
      }
      const t = textMaterial(p.sign ?? 'The Hollow Inn',
        { w: 768, h: 288, bg: p.bg, fg: p.fg, size: 92, weight: 700, border: p.fg });
      box(g, t, 55, 19.5, 0.8, 0, 3.2, 3.4);
      return g;
    }
  },
  // ---- 2. Post-mounted yard sign --------------------------------------------
  {
    id: 'sign2_yard_post', name: 'Yard Sign (Two Posts)', cat: 'yard', w: 90, d: 10, h: 120,
    sign: true, signDefault: 'Honeycutt Farm',
    palettes: [
      { name: 'White / Green', chip: '#e9e6dd', post: '#e9e6dd', bg: '#31513a', fg: '#eee9d8' },
      { name: 'Cedar / Cream', chip: '#8a5a34', post: '#8a5a34', bg: '#efe8d4', fg: '#3a3226' },
      { name: 'Black / Gold', chip: '#26272b', post: '#26272b', bg: '#26272b', fg: '#d9b45a' }
    ],
    plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const post = wood(p.post, 0.55);
      for (const s of [-1, 1]) {
        box(g, post, 7, 112, 7, s * 40, 0, 0, { r: 0.8 });
        pyramid(g, post, 9, 5, 9, s * 40, 112, 0);
      }
      // framed panel between the posts + top/bottom rails
      box(g, post, 88, 44, 3, 0, 60, 1, { r: 1 });
      box(g, post, 88, 4, 3, 0, 104, 1, { r: 1 });
      box(g, post, 88, 4, 3, 0, 56, 1, { r: 1 });
      for (const s of [-1, 1]) sphere(g, post, 2.2, s * 40, 118.5, 0, { seg: 12 });
      const t = textMaterial(p.sign ?? 'Honeycutt Farm',
        { w: 832, h: 384, bg: p.bg, fg: p.fg, size: 110, weight: 700, border: p.fg });
      box(g, t, 70, 36, 0.8, 0, 64, 2.9);
      return g;
    }
  },
  // ---- 3. Farmhouse vertical porch sign (stacked letters) -------------------
  {
    id: 'sign2_porch_board', name: 'Vertical Porch Sign', cat: 'porch', w: 40, d: 16, h: 150,
    sign: true, signDefault: 'WELCOME', signAdaptive: false,
    palettes: [
      { name: 'Whitewash', chip: '#ece7db', bd: '#ece7db', bg: '#e7e1d2', fg: '#33322e' },
      { name: 'Ink', chip: '#2b2c2e', bd: '#2b2c2e', bg: '#2b2c2e', fg: '#efe9da' },
      { name: 'Sage', chip: '#8e9a82', bd: '#8e9a82', bg: '#87937b', fg: '#f4f1e6' },
      { name: 'TEST', chip: '#000', bd: '#ece7db', bg: '#e7e1d2', fg: '#33322e', sign: 'Wilkersons Lakeside Lodge' }
    ],
    plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const bd = wood(p.bd, 0.6);
      box(g, bd, 34, 146, 3.5, 0, 0, 0, { r: 1 });
      // trim frame on the face
      box(g, bd, 34, 5, 1.6, 0, 139, 2.35, { r: 0.6 });
      box(g, bd, 34, 5, 1.6, 0, 2, 2.35, { r: 0.6 });
      for (const s of [-1, 1]) box(g, bd, 4, 130, 1.6, s * 15, 8, 2.35, { r: 0.6 });
      // kickstand brace so it stands proud of the porch wall
      strut(g, wood('#6b5136', 0.6), 0, 112, -1.9, 0, 3, -13.5, 1.6);
      box(g, wood('#6b5136', 0.6), 6, 3, 6, 0, 0, -13.5, { r: 0.8 });
      // the name runs top-to-bottom, one letter per tile
      const chars = String(p.sign ?? 'WELCOME').slice(0, 25).split('');
      const n = Math.max(1, chars.length), step = 129 / n;
      chars.forEach((ch, i) => {
        const t = textMaterial(ch, { w: 200, h: 200, bg: p.bg, fg: p.fg, size: 150, weight: 800 });
        box(g, t, 22, Math.min(24, step - 1.6), 0.8, 0, 137.5 - step * (i + 1) + 0.8, 1.8);
      });
      return g;
    }
  },
  // ---- 4. A-frame chalkboard -------------------------------------------------
  {
    id: 'sign2_aframe', name: 'A-Frame Chalkboard', cat: 'yard', w: 62, d: 58, h: 92,
    sign: true, signDefault: 'Fresh Lemonade',
    palettes: [
      { name: 'Walnut', chip: '#5a3d28', bd: '#5a3d28', bg: '#2e3230', fg: '#eceadf' },
      { name: 'White Frame', chip: '#e9e6dd', bd: '#e9e6dd', bg: '#2c3032', fg: '#f2efe4' },
      { name: 'Barn Red', chip: '#8e3b32', bd: '#8e3b32', bg: '#30342f', fg: '#efe9d6' }
    ],
    plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const bd = wood(p.bd, 0.55);
      const a = 0.31;
      box(g, bd, 58, 90, 3, 0, -1.8, 15.5, { rx: -a, r: 1 });   // front leaf
      box(g, bd, 58, 90, 3, 0, -1.8, -15.5, { rx: a, r: 1 });   // back leaf
      cyl(g, metal('#3a3d40', 0.5), 1.2, 58, 0, 86.6, 0, { rz: Math.PI / 2, seg: 12 }); // hinge bar
      for (const s of [-1, 1]) {
        sphere(g, metal('#3a3d40', 0.5), 1.7, s * 29, 86.6, 0, { seg: 12 });
        strut(g, solid('#8a7a5c', 0.9), s * 24, 40, 16, s * 24, 40, -16, 0.55); // stay ropes
      }
      // chalk writing on both leaves (back face flipped so it reads correctly)
      const chalkOpts = {
        w: 640, h: 704, bg: p.bg, fg: p.fg, size: 88, weight: 600,
        border: p.fg, font: '"Segoe Print", "Comic Sans MS", cursive'
      };
      const tf = textMaterial(p.sign ?? 'Fresh Lemonade', chalkOpts);
      box(g, tf, 46, 60, 0.8, 0, 13.8, 17.4, { rx: -a });
      const tb = textMaterial(p.sign ?? 'Fresh Lemonade', chalkOpts);
      box(g, tb, 46, 60, 0.8, 0, 13.8, -17.4, { rx: a, ry: Math.PI });
      // chalk tray + two stubs of chalk
      box(g, bd, 40, 3, 5.5, 0, 7.2, 27.2, { r: 0.8 });
      box(g, bd, 40, 3.2, 1.4, 0, 7.8, 30.1, { r: 0.5 });
      cyl(g, solid('#f2f0ea', 0.9), 0.8, 6.5, -9, 11, 27.4, { rz: Math.PI / 2, seg: 10 });
      cyl(g, solid('#e8b7c2', 0.9), 0.8, 5, 7, 11, 27.4, { rz: Math.PI / 2, seg: 10 });
      return g;
    }
  },
  // ---- 5. Neon script wall sign ----------------------------------------------
  {
    id: 'sign2_neon', name: 'Neon Sign', cat: 'decor', w: 80, d: 8, h: 40,
    mount: 'wall', elevation: 160, sign: true, signDefault: 'good vibes',
    palettes: [
      { name: 'Hot Pink', chip: '#ff5fa2', fg: '#ff7ab5' },
      { name: 'Electric Blue', chip: '#37e0e8', fg: '#4be6ec' },
      { name: 'Sunset Amber', chip: '#ffb03a', fg: '#ffbd57' }
    ],
    plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      box(g, solid('#17181c', 0.6), 80, 36, 2.5, 0, 0, 0, { r: 2 });
      // the lettering glows: reuse the text canvas as its own emissive map
      const t = textMaterial(p.sign ?? 'good vibes', {
        w: 832, h: 352, bg: '#101114', fg: p.fg, size: 120, weight: 600,
        font: '"Brush Script MT", "Segoe Script", cursive'
      });
      t.emissive.set('#ffffff'); t.emissiveMap = t.map; t.emissiveIntensity = 1.15;
      box(g, t, 70, 27, 0.8, 0, 4.5, 2.7);
      // neon border tube
      const tube = glow(p.fg, 2.1, 0.3);
      cyl(g, tube, 0.9, 69, 0, 33, 3.8, { rz: Math.PI / 2, seg: 10 });
      cyl(g, tube, 0.9, 69, 0, 3, 3.8, { rz: Math.PI / 2, seg: 10 });
      for (const s of [-1, 1]) {
        cyl(g, tube, 0.9, 27, s * 34.5, 4.5, 3.8, { seg: 10 });
        sphere(g, tube, 1, s * 34.5, 33, 3.8, { seg: 10 });
        sphere(g, tube, 1, s * 34.5, 3, 3.8, { seg: 10 });
        cyl(g, metal('#8f959c', 0.35), 0.7, 2, s * 34.5, 18, 2.6, { rx: Math.PI / 2, seg: 8 }); // standoffs
      }
      strut(g, solid('#232427', 0.7), 38, 2.5, 2.5, 39.5, 0.2, 0.8, 0.5); // power lead
      return g;
    }
  },
  // ---- 6. LED marquee lightbox -----------------------------------------------
  {
    id: 'sign2_marquee', name: 'Marquee Lightbox', cat: 'decor', w: 90, d: 10, h: 60,
    mount: 'wall', elevation: 170, sign: true, signDefault: 'MOVIE NIGHT',
    palettes: [
      { name: 'Classic Black', chip: '#26272b', bd: '#26272b', bg: '#f2efe4', fg: '#26282c' },
      { name: 'Theater Red', chip: '#7e2f2c', bd: '#7e2f2c', bg: '#f4f0e2', fg: '#5c211f' },
      { name: 'Steel', chip: '#8d9298', bd: '#6d7278', bg: '#eef0ee', fg: '#23262a' }
    ],
    plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      const frame = metal(p.bd, 0.45);
      box(g, frame, 90, 56, 5, 0, 0, 0, { r: 2 });
      // lit letter panel: the whole face glows softly like a real lightbox
      const t = textMaterial(p.sign ?? 'MOVIE NIGHT', {
        w: 896, h: 448, bg: p.bg, fg: p.fg, size: 120, weight: 800,
        font: '"Arial Black", Arial, sans-serif'
      });
      t.emissive.set('#ffffff'); t.emissiveMap = t.map; t.emissiveIntensity = 0.38;
      box(g, t, 78, 44, 1, 0, 6, 3);
      // warm marquee bulbs around the border
      const bulb = glow('#ffd98f', 1.9, 0.3);
      for (let i = 0; i < 7; i++) {
        const x = -37.5 + i * 12.5;
        sphere(g, bulb, 1.5, x, 52.6, 3.4, { seg: 10 });
        sphere(g, bulb, 1.5, x, 3.4, 3.4, { seg: 10 });
      }
      for (const s of [-1, 1]) for (const y of [16, 28, 40]) {
        sphere(g, bulb, 1.5, s * 41.6, y, 3.4, { seg: 10 });
      }
      return g;
    }
  },
  // ---- 7. Backlit modern address plaque ---------------------------------------
  {
    id: 'sign2_address_glow', name: 'Backlit Address Plaque', cat: 'decor', w: 50, d: 6, h: 24,
    mount: 'wall', elevation: 145, sign: true, signDefault: '2481',
    palettes: [
      { name: 'Charcoal / Warm', chip: '#2b2e33', bg: '#2b2e33', fg: '#f2ede0', halo: '#ffd9a0' },
      { name: 'Bronze / Ivory', chip: '#4a3b2a', bg: '#4a3b2a', fg: '#efe6cf', halo: '#ffcf8f' },
      { name: 'Slate / Ice', chip: '#3a4148', bg: '#3a4148', fg: '#eef2f5', halo: '#cfe6ff' }
    ],
    plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      box(g, glow(p.halo, 1.5, 0.5), 48, 24, 0.6, 0, 0, 0.3, { r: 2 });  // halo wash
      box(g, metal(p.bg, 0.4), 44, 20, 1.6, 0, 2, 2.6, { r: 1.2 });      // floating panel
      for (const sx of [-1, 1]) for (const y of [6, 18]) {
        cyl(g, chromeStandoff(), 0.7, 2.2, sx * 18, y, 1.3, { rx: Math.PI / 2, seg: 10 });
      }
      const t = textMaterial(p.sign ?? '2481',
        { w: 640, h: 256, bg: p.bg, fg: p.fg, size: 150, weight: 800, font: 'Arial, sans-serif' });
      box(g, t, 40, 16, 0.8, 0, 4, 3.6);
      return g;
    }
  },
  // ---- 8. Mailbox with name board ---------------------------------------------
  {
    id: 'sign2_mailbox', name: 'Mailbox & Name Board', cat: 'yard', w: 55, d: 25, h: 132,
    sign: true, signDefault: 'The Parkers',
    palettes: [
      { name: 'Black / Cedar', chip: '#26272b', mb: '#26272b', post: '#8a5a34', bg: '#3a2c20', fg: '#e8d9b0' },
      { name: 'Green / White', chip: '#31513a', mb: '#31513a', post: '#e9e6dd', bg: '#e9e6dd', fg: '#31513a' },
      { name: 'Galvanized', chip: '#9aa0a6', mb: '#9aa0a6', post: '#6b5136', bg: '#26272b', fg: '#e8e2d0' }
    ],
    plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const post = wood(p.post, 0.6);
      const mb = metal(p.mb, 0.45);
      box(g, post, 8, 102, 8, -10, 0, 0, { r: 0.8 });
      box(g, post, 44, 6, 12, 2, 102, 0, { r: 1 });            // cross arm
      strut(g, post, -10, 84, 0, 14, 101, 0, 2);               // knee brace
      // mailbox: box body + rounded roof + door + latch + red flag
      box(g, mb, 46, 10, 20, 2, 108, 0, { r: 0.8 });
      cyl(g, mb, 10, 46, 2, 118, 0, { rz: Math.PI / 2, seg: 24 });
      cyl(g, mb, 9.6, 1.6, 25.6, 118, 0, { rz: Math.PI / 2, seg: 24 });  // door disc
      box(g, mb, 1.6, 10, 19.2, 25.6, 108, 0);
      sphere(g, metal('#c9cdd2', 0.3), 1.1, 26.7, 112, 0, { seg: 10 }); // latch knob
      box(g, metal('#b33a30', 0.5), 2.2, 13, 1, 12, 116, 10.6, { r: 0.6 }); // flag arm
      box(g, metal('#b33a30', 0.5), 7, 5, 1, 15.5, 127, 10.6, { r: 0.6 }); // flag
      // name board swinging under the arm on two chains
      const iron = metal('#2e3033', 0.5);
      chain(g, iron, -14, 102.5, 96, 5);
      chain(g, iron, 18, 102.5, 96, 5);
      box(g, wood(p.post, 0.55), 40, 11, 2, 2, 85, 6, { r: 0.8 });
      const opts = { w: 704, h: 208, bg: p.bg, fg: p.fg, size: 92, weight: 700, border: p.fg };
      const tf = textMaterial(p.sign ?? 'The Parkers', opts);
      box(g, tf, 36, 8.6, 0.7, 2, 86.2, 7.15);
      const tb = textMaterial(p.sign ?? 'The Parkers', opts);
      box(g, tb, 36, 8.6, 0.7, 2, 86.2, 4.85, { ry: Math.PI });
      return g;
    }
  },
  // ---- 9. Directional arrow post ------------------------------------------------
  {
    id: 'sign2_arrows', name: 'Directional Arrow Post', cat: 'yard', w: 100, d: 14, h: 190,
    sign: true, signDefault: 'LAKE HOUSE',
    palettes: [
      { name: 'Driftwood', chip: '#8c7a62', post: '#6b5c48', bg: '#8c7a62', fg: '#f2ecdc' },
      { name: 'White Post', chip: '#e9e6dd', post: '#e9e6dd', bg: '#37596e', fg: '#eef2f0' },
      { name: 'Ebony', chip: '#2b2c2e', post: '#2b2c2e', bg: '#3d3e42', fg: '#e6c96a' }
    ],
    plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const post = wood(p.post, 0.6);
      box(g, post, 9, 180, 9, 0, 0, 0, { r: 0.9 });
      pyramid(g, post, 11, 8, 11, 0, 180, 0);
      const arrow = (bg, fg, text, y, len, dir, th) => {
        const bd = wood(bg, 0.55);
        const bodyW = len - 12;
        box(g, bd, bodyW, th, 3, 0, y, 6.2, { r: 0.8 });
        const tip = pyramid(g, bd, th, 12, 3, dir * bodyW / 2, y + th / 2, 6.2);
        tip.rotation.z = dir > 0 ? -Math.PI / 2 : Math.PI / 2;
        const t = textMaterial(text, {
          w: 128 * Math.round(bodyW / 8), h: 160, bg, fg, size: 92, weight: 700
        });
        box(g, t, bodyW - 10, th - 3.6, 0.8, 0, y + 1.8, 7.85);
      };
      arrow(p.bg, p.fg, p.sign ?? 'LAKE HOUSE', 132, 90, 1, 16);
      arrow('#3e5d78', '#f0ead8', 'BEACH', 107, 62, -1, 13);
      arrow('#7a4a2b', '#f0e6d0', 'CAMPFIRE', 84, 56, 1, 13);
      return g;
    }
  },
  // ---- 10. Carved stone garden plaque --------------------------------------------
  {
    id: 'sign2_stone', name: 'Garden Stone Plaque', cat: 'yard', w: 60, d: 45, h: 40,
    sign: true, signDefault: 'Rose Garden',
    palettes: [
      { name: 'Granite', chip: '#6e6b64', rockA: '#45423c', rockB: '#75726a', bg: '#6e6b64', fg: '#26231d' },
      { name: 'Sandstone', chip: '#997f58', rockA: '#77653f', rockB: '#a8926a', bg: '#997f58', fg: '#3a2d17' },
      { name: 'Slate', chip: '#454c53', rockA: '#33383e', rockB: '#585f67', bg: '#454c53', fg: '#12151a' }
    ],
    plan: { type: 'box' },
    build: (p) => {
      const g = G();
      // weathered boulder + a smaller shoulder stone
      const rock = blob(g, p.rockA, p.rockB, 24, -2, 17, -6, { seed: 7, sy: 0.72, amp: 0.045 });
      rock.scale.z = 0.75;
      blob(g, p.rockA, p.rockB, 10, 23, 6, 0, { seed: 19, sy: 0.7, amp: 0.04 });
      blob(g, '#4a6b30', '#7fa04a', 6.5, -25, 1.5, 12, { seed: 31, sy: 0.55, amp: 0.07 }); // moss
      // leaning engraved tablet on a low stone sill
      const slate = solid(p.bg, 0.9);
      box(g, slate, 30, 6, 8, 0, 0, 19, { r: 2 });
      box(g, slate, 38, 26, 3.5, 0, 2, 15, { rx: -0.45, r: 1.4 });
      const t = textMaterial(p.sign ?? 'Rose Garden', {
        w: 704, h: 384, bg: p.bg, fg: p.fg, size: 96, weight: 700,
        border: p.fg, font: 'Georgia, "Times New Roman", serif'
      });
      t.roughness = 0.9; t.metalness = 0;
      box(g, t, 33, 20, 0.8, 0, 6, 17.2, { rx: -0.45 });
      return g;
    }
  },
  // ---- 11. Barn name board ---------------------------------------------------------
  {
    id: 'sign2_barn', name: 'Barn Name Board', cat: 'decor', w: 170, d: 6, h: 42,
    mount: 'wall', elevation: 300, sign: true, signDefault: 'HONEYCUTT FARMS',
    palettes: [
      { name: 'Barn Red', chip: '#8e3b32', bd: '#8e3b32', trim: '#efe9d6', fg: '#efe9d6' },
      { name: 'Weathered Gray', chip: '#7b7f80', bd: '#6e7274', trim: '#e8e4d8', fg: '#e8e4d8' },
      { name: 'Hunter', chip: '#31513a', bd: '#31513a', trim: '#e6ddc4', fg: '#e6ddc4' }
    ],
    plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      const bd = wood(p.bd, 0.6);
      const trim = wood(p.trim, 0.6);
      box(g, bd, 170, 38, 3.5, 0, 0, 1, { r: 1 });
      box(g, trim, 170, 5, 1.2, 0, 33, 2.9, { r: 0.5 });
      box(g, trim, 170, 5, 1.2, 0, 0, 2.9, { r: 0.5 });
      for (const s of [-1, 1]) {
        box(g, trim, 5, 28, 1.2, s * 82.5, 5, 2.9, { r: 0.5 });
        for (const y of [4, 34]) sphere(g, metal('#3a3d40', 0.5), 1, s * 78, y, 3, { seg: 10 });
      }
      // painted hex-sign wheel on the left end
      torus(g, trim, 9, 1.5, -67, 19, 2.6, { rx: 0, seg: 32, tubeSeg: 8 });
      for (const rz of [0, Math.PI / 3, -Math.PI / 3]) {
        box(g, trim, 2, 16, 1, -67, 11, 2.6, { rz });
      }
      const t = textMaterial(p.sign ?? 'HONEYCUTT FARMS', {
        w: 1024, h: 224, bg: p.bd, fg: p.fg, size: 96, weight: 800,
        font: 'Georgia, "Times New Roman", serif'
      });
      box(g, t, 116, 24, 0.8, 14, 7, 2.85);
      return g;
    }
  },
  // ---- 12. Bar / man-cave sign -------------------------------------------------------
  {
    id: 'sign2_bar', name: 'Bar Sign', cat: 'decor', w: 90, d: 8, h: 56,
    mount: 'wall', elevation: 150, sign: true, signDefault: "DAD'S TAP ROOM",
    palettes: [
      { name: 'Walnut / Brass', chip: '#4a3322', bd: '#4a3322', bg: '#3a2818', fg: '#d9b45a' },
      { name: 'Ebony / Copper', chip: '#26221f', bd: '#26221f', bg: '#201d1a', fg: '#c98a4b' },
      { name: 'Oak / Cream', chip: '#7a5a38', bd: '#7a5a38', bg: '#66492c', fg: '#efe6cf' }
    ],
    plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      const bd = wood(p.bd, 0.45);
      const brass = metal('#c8a44a', 0.35);
      box(g, bd, 90, 40, 4, 0, 0, 0, { r: 2 });
      box(g, brass, 86, 2.4, 1, 0, 34.5, 3.2, { r: 0.5 });
      box(g, brass, 86, 2.4, 1, 0, 3, 3.2, { r: 0.5 });
      for (const s of [-1, 1]) {
        box(g, brass, 2.4, 29, 1, s * 41.8, 5.5, 3.2, { r: 0.5 });
        sphere(g, brass, 1.2, s * 41.8, 35.7, 3.4, { seg: 10 });
        // a pair of stout little bottles perched on the top edge
        cyl(g, solid('#2e5d3a', 0.25), 2.6, 8.5, s * 33, 40, 0, { seg: 14 });
        cyl(g, solid('#2e5d3a', 0.25), 1, 4.2, s * 33, 48.4, 0, { rTop: 0.9, seg: 10 });
        cyl(g, metal('#b8862f', 0.4), 1.1, 1.2, s * 33, 52.4, 0, { seg: 10 });
      }
      const t = textMaterial(p.sign ?? "DAD'S TAP ROOM", {
        w: 896, h: 320, bg: p.bg, fg: p.fg, size: 100, weight: 800,
        font: 'Georgia, "Times New Roman", serif'
      });
      box(g, t, 76, 26, 0.8, 0, 6, 2.6);
      // amber under-glow tube, pub style
      cyl(g, glow('#ffb03a', 2, 0.3), 0.9, 80, 0, 1, 4.4, { rz: Math.PI / 2, seg: 10 });
      return g;
    }
  },
  // ---- 13. Kids' cloud door sign ------------------------------------------------------
  {
    id: 'sign2_kids', name: "Kids' Door Sign", cat: 'decor', w: 45, d: 8, h: 35,
    mount: 'wall', elevation: 120, sign: true, signDefault: "Ellie's Room",
    palettes: [
      { name: 'Bubblegum', chip: '#f2a3bd', bg: '#f2a3bd', fg: '#5c3542', cloud: '#f7f3ec' },
      { name: 'Sky', chip: '#9cc8ea', bg: '#9cc8ea', fg: '#2e4a63', cloud: '#f7f5ef' },
      { name: 'Mint', chip: '#a8d8bb', bg: '#a8d8bb', fg: '#2f5540', cloud: '#f8f5ee' }
    ],
    plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      const cloud = solid(p.cloud, 0.7);
      // puffy cloud crown
      sphere(g, cloud, 11, -8, 24, 0, { sy: 0.85, sz: 0.4, seg: 20 });
      sphere(g, cloud, 9, 6, 26, 0.5, { sy: 0.9, sz: 0.42, seg: 20 });
      sphere(g, cloud, 7, 15, 22, 0, { sy: 0.9, sz: 0.45, seg: 18 });
      sphere(g, cloud, 6.5, -17, 21, 0, { sy: 0.85, sz: 0.45, seg: 18 });
      // rounded name plate hanging below
      box(g, solid(p.bg, 0.6), 36, 16, 2, 0, 0, 1.5, { r: 4 });
      const t = textMaterial(p.sign ?? "Ellie's Room", {
        w: 704, h: 256, bg: p.bg, fg: p.fg, size: 92, weight: 700,
        font: '"Comic Sans MS", "Segoe Print", cursive'
      });
      box(g, t, 30, 11, 0.8, 0, 2.5, 2.8, { r: 0 });
      // little glow "stars" drifting around the cloud
      const star = glow('#ffd98f', 1.6, 0.4);
      sphere(g, star, 1.3, -20, 30, 1.5, { seg: 8 });
      sphere(g, star, 1, 20, 31, 1.5, { seg: 8 });
      sphere(g, star, 0.9, 21, 12, 2, { seg: 8 });
      return g;
    }
  },
  // ---- 14. Round welcome plaque with wreath ring -----------------------------------------
  {
    id: 'sign2_wreath', name: 'Wreath Welcome Plaque', cat: 'decor', w: 58, d: 10, h: 58,
    mount: 'wall', elevation: 140, sign: true, signDefault: 'Welcome', signAdaptive: false,
    palettes: [
      { name: 'Cream', chip: '#efe9da', bg: '#efe9da', fg: '#3a3a34' },
      { name: 'Charcoal', chip: '#33352f', bg: '#33352f', fg: '#efe9da' },
      { name: 'Terracotta', chip: '#b06a44', bg: '#b06a44', fg: '#f4ede0' }
    ],
    plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      cyl(g, wood(p.bg, 0.6), 20, 2.5, 0, 30, 0.5, { rx: Math.PI / 2, seg: 40 }); // round board
      const t = textMaterial(p.sign ?? 'Welcome', {
        w: 512, h: 352, bg: p.bg, fg: p.fg, size: 96, weight: 700,
        font: 'Georgia, "Times New Roman", serif'
      });
      box(g, t, 27, 18, 0.8, 0, 21, 1.9);
      // eucalyptus-style wreath hugging the rim
      for (let i = 0; i < 11; i++) {
        const a = (i / 11) * Math.PI * 2 + 0.3;
        const dark = i % 2 === 0;
        blob(g, dark ? '#2f4d1d' : '#3a5c24', dark ? '#6d9c40' : '#86b455', 5.4,
          Math.cos(a) * 23.5, 30 + Math.sin(a) * 23.5, 2, { seed: 5 + i * 7, amp: 0.07 });
      }
      for (let i = 0; i < 5; i++) {
        const a = 0.8 + i * 1.25;
        sphere(g, solid('#a2382e', 0.55), 1.15,
          Math.cos(a) * 22, 30 + Math.sin(a) * 22, 5.6, { seg: 10 });
      }
      // ribbon bow at the bottom of the ring
      const ribbon = solid('#8e3b32', 0.55);
      box(g, ribbon, 7, 5, 2, -4.4, 2.5, 6.6, { r: 2, rz: 0.5 });
      box(g, ribbon, 7, 5, 2, 4.4, 2.5, 6.6, { r: 2, rz: -0.5 });
      box(g, ribbon, 3.6, 3.6, 2.4, 0, 3.4, 7, { r: 1.2 });
      return g;
    }
  },
  // ---- 15. Pool rules board -----------------------------------------------------------
  {
    id: 'sign2_pool_rules', name: 'Pool Rules Board', cat: 'yard', w: 70, d: 12, h: 150,
    sign: true, signDefault: 'POOL RULES',
    palettes: [
      { name: 'Resort White', chip: '#eef0ee', post: '#eef0ee', bg: '#2e6f9e', fg: '#f2f6f8', board: '#eef0ee', rule: '#3d454c' },
      { name: 'Navy', chip: '#22364a', post: '#22364a', bg: '#22364a', fg: '#eef2f5', board: '#e9ecec', rule: '#3a444e' },
      { name: 'Teak', chip: '#8a5a34', post: '#8a5a34', bg: '#2d6b60', fg: '#f0f4ef', board: '#efe8d4', rule: '#4c4436' }
    ],
    plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const post = wood(p.post, 0.55);
      for (const s of [-1, 1]) box(g, post, 6, 96, 6, s * 26, 0, 0, { r: 0.7 });
      box(g, solid(p.board, 0.6), 64, 52, 3, 0, 92, 2, { r: 1.5 });
      // header carries the user's text; fixed rule lines beneath
      const th = textMaterial(p.sign ?? 'POOL RULES',
        { w: 768, h: 192, bg: p.bg, fg: p.fg, size: 100, weight: 800, font: 'Arial, sans-serif' });
      box(g, th, 58, 14, 0.8, 0, 126, 3.85);
      const rules = ['NO RUNNING', 'NO DIVING', 'SWIM AT YOUR OWN RISK'];
      rules.forEach((r, i) => {
        const t = textMaterial(r, {
          w: 640, h: 104, bg: p.board, fg: p.rule, size: 58, weight: 700, font: 'Arial, sans-serif'
        });
        box(g, t, 48, 7.5, 0.7, 0, 113.5 - i * 10.5, 3.8);
      });
      // life ring hung between the posts
      const ring = torus(g, solid('#f2f3f0', 0.6), 8, 2.5, 0, 62, 6, { rx: 0, seg: 30, tubeSeg: 12 });
      ring.rotation.x = 0.08;
      for (const [x, y, w2, h2] of [[0, 70, 6.5, 5], [0, 54, 6.5, 5], [-8, 62, 5, 6.5], [8, 62, 5, 6.5]]) {
        box(g, solid('#c2453a', 0.6), w2, h2, 5.6, x, y - h2 / 2, 6, { r: 1.8 });
      }
      strut(g, solid('#d8cfae', 0.9), 0, 93, 2, 0, 72.2, 5.6, 0.55); // hanging rope
      return g;
    }
  }
];

// tiny helper so every plaque standoff shares one chrome material
function chromeStandoff() { return metal('#d5d9dd', 0.2); }
