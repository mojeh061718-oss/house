import { G, box, cyl, solid, wood, metal, glass, photoMaterial, textMaterial } from '../builders.js';

// Wall picture frames (drop in a photo from your camera roll) and signs /
// house-number plaques (type your own text). The photo/sign rides in on the
// palette as `p.photo` (a data URL) / `p.sign` (a string); see viewer3d.

const FRAME_TONES = [
  { name: 'Walnut', chip: '#5a3d28', wood: '#5a3d28' },
  { name: 'Black', chip: '#232326', wood: '#232326' },
  { name: 'Gold', chip: '#b8974a', wood: '#b8974a' },
  { name: 'White', chip: '#ece9e2', wood: '#ece9e2' }
];
const PLAQUE_TONES = [
  { name: 'Bronze', chip: '#4a3b2a', bg: '#4a3b2a', fg: '#e8dcc2' },
  { name: 'Slate', chip: '#2b2f34', bg: '#2b2f34', fg: '#eef0f2' },
  { name: 'Brushed Steel', chip: '#9aa0a6', bg: '#9aa0a6', fg: '#1c1f22' },
  { name: 'Black / Brass', chip: '#1c1c1e', bg: '#1c1c1e', fg: '#d9b45a' }
];

/** A framed picture with a REAL moulding profile: back panel, four proud
 *  trim rails, mat board, and the photo recessed ~1.6cm behind the rail
 *  fronts (no coplanar faces anywhere, nothing flush with the wall). */
function pictureFrame(g, w, h, p) {
  const fr = wood(p.wood || '#5a3d28', 0.4);
  box(g, fr, w - 4, h - 4, 1.6, 0, 2, -1.2);                     // back panel
  box(g, fr, w, 5, 4.4, 0, h - 5, 0.2, { r: 1.2 });              // top rail
  box(g, fr, w, 5, 4.4, 0, 0, 0.2, { r: 1.2 });                  // bottom rail
  box(g, fr, 5, h - 8, 4.4, -(w - 5) / 2, 4, 0.2, { r: 1.2 });   // left rail
  box(g, fr, 5, h - 8, 4.4, (w - 5) / 2, 4, 0.2, { r: 1.2 });    // right rail
  box(g, solid('#f4f1ea', 0.6), w - 9, h - 9, 1, 0, 4.5, -0.3);  // mat board
  const picW = w - 16, picH = h - 16;
  const pic = p.photo ? photoMaterial(p.photo) : solid('#aebac2', 0.55);
  box(g, pic, picW, picH, 0.8, 0, 8, 0.35);
  if (!p.photo) {
    // faint "photo" placeholder marks so an empty frame reads as a frame
    box(g, solid('#96a4ad', 0.6), picW * 0.5, picH * 0.28, 0.4, 0, h / 2 - picH * 0.2, 0.8);
    box(g, solid('#c7cfd4', 0.6), picW * 0.22, picW * 0.22, 0.4, picW * 0.22, h / 2 + picH * 0.14, 0.8);
  }
}

export const FRAMES_ITEMS = [
  // ---- Portrait picture frame ---------------------------------------------
  {
    id: 'photo_frame', name: 'Picture Frame', cat: 'decor', w: 46, d: 5, h: 58,
    elevation: 150, mount: 'wall', photo: true, palettes: FRAME_TONES, plan: { type: 'wallDecor' },
    build: (p) => { const g = G(); pictureFrame(g, 46, 58, p); return g; }
  },
  // ---- Landscape picture frame --------------------------------------------
  {
    id: 'photo_frame_wide', name: 'Picture Frame (Wide)', cat: 'decor', w: 64, d: 5, h: 46,
    elevation: 150, mount: 'wall', photo: true, palettes: FRAME_TONES, plan: { type: 'wallDecor' },
    build: (p) => { const g = G(); pictureFrame(g, 64, 46, p); return g; }
  },
  // ---- Big canvas / poster -------------------------------------------------
  {
    id: 'photo_canvas', name: 'Canvas Print', cat: 'decor', w: 90, d: 4, h: 64,
    elevation: 145, mount: 'wall', photo: true, palettes: FRAME_TONES, plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      // gallery-wrapped stretcher body; the print face floats slightly smaller
      // so the wrap edge reads (no shared planes with the body)
      box(g, solid('#e9e6df', 0.6), 90, 64, 3.4, 0, 0, -1.2, { r: 1 });
      const pic = p.photo ? photoMaterial(p.photo) : solid('#b3c0c8', 0.55);
      box(g, pic, 88.6, 62.6, 0.8, 0, 0.7, 0.7);
      return g;
    }
  },
  // ---- Three-up gallery set (one photo, repeated across three frames) ------
  {
    id: 'photo_gallery', name: 'Gallery Trio', cat: 'decor', w: 150, d: 5, h: 52,
    elevation: 150, mount: 'wall', photo: true, palettes: FRAME_TONES, plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      // intrigue: the middle frame hangs a touch crooked
      const tilts = [0, 0.04, 0];
      [-52, 0, 52].forEach((x, i) => {
        const sub = G(); pictureFrame(sub, 44, 52, p);
        sub.position.x = x;
        if (tilts[i]) sub.rotation.z = tilts[i];
        g.add(sub);
      });
      return g;
    }
  },
  // ---- Tabletop photo frame (sits on a surface) ---------------------------
  {
    id: 'photo_desk', name: 'Desk Photo Frame', cat: 'decor', w: 22, d: 12, h: 26,
    photo: true, palettes: FRAME_TONES, plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const fr = wood(p.wood || '#5a3d28', 0.4);
      box(g, fr, 22, 26, 2.5, 0, 0, 3, { r: 1 });
      box(g, solid('#f4f1ea', 0.6), 18, 22, 1, 0, 2, 4.4);
      const pic = p.photo ? photoMaterial(p.photo) : solid('#aebac2', 0.55);
      box(g, pic, 15, 19, 0.6, 0, 3.5, 5.1);
      // fold-out easel leg: hinged at the frame back, foot on the surface
      box(g, fr, 3.5, 24, 1.2, 0, -0.8, -3.2, { rx: 0.42, r: 0.4 });
      return g;
    }
  },
  // ---- House-number plaque (type your number) -----------------------------
  {
    id: 'house_number', name: 'House Number Plaque', cat: 'decor', w: 44, d: 3, h: 18,
    elevation: 135, mount: 'wall', sign: true, signDefault: '123', palettes: PLAQUE_TONES,
    plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      box(g, metal(p.bg === '#9aa0a6' ? '#9aa0a6' : '#3a3f45', 0.45), 44, 18, 3, 0, 0, -1, { r: 2 });
      const t = textMaterial(p.sign ?? '123', { w: 512, h: 200, bg: p.bg || '#2b2f34', fg: p.fg || '#ece7da', size: 150, weight: 800 });
      box(g, t, 40, 14, 0.8, 0, 0, 0.9);
      return g;
    }
  },
  // ---- Vertical number column ---------------------------------------------
  {
    id: 'house_number_tall', name: 'Number Column', cat: 'decor', w: 16, d: 3, h: 60,
    elevation: 120, mount: 'wall', sign: true, signDefault: '1234', palettes: PLAQUE_TONES,
    plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      box(g, metal('#33373c', 0.45), 16, 60, 3, 0, 0, -1, { r: 2 });
      const digits = String(p.sign ?? '1234').slice(0, 5).split('');
      const n = digits.length, step = 52 / n;
      digits.forEach((d, i) => {
        const t = textMaterial(d, { w: 160, h: 200, bg: p.bg || '#2b2f34', fg: p.fg || '#ece7da', size: 150, weight: 800 });
        box(g, t, 12, step - 3, 0.8, 0, 26 - step * (i + 0.5), 0.9);
      });
      return g;
    }
  },
  // ---- Address / name sign -------------------------------------------------
  {
    id: 'address_sign', name: 'Address / Name Sign', cat: 'decor', w: 70, d: 4, h: 24,
    elevation: 130, mount: 'wall', sign: true, signDefault: 'The Smiths', palettes: PLAQUE_TONES,
    plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      box(g, wood('#3a2c20', 0.5), 70, 24, 4, 0, 0, -1, { r: 2 });
      const t = textMaterial(p.sign ?? 'The Smiths', { w: 640, h: 200, bg: p.bg || '#3a2c20', fg: p.fg || '#e8dcc2', size: 88, weight: 700, border: p.fg || '#e8dcc2' });
      box(g, t, 64, 18, 0.8, 0, 0, 1.1);
      return g;
    }
  }
];
