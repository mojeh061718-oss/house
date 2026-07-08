// Modern indoor decor & accents pack. Built only from primitive helpers.
import {
  G, box, cyl, sphere, shade, blob, foliage,
  solid, wood, metal, glass, mirror, glow, artMaterial,
  lathe, cushion, sweep, segment
} from '../builders.js';

export const DECOR_ITEMS = [
  // ===== MIRRORS =====
  {
    id: 'decor_mirror_floor', name: 'Full-Length Floor Mirror', cat: 'decor', w: 62, d: 40, h: 176,
    palettes: [
      { name: 'Brass', chip: '#c9a24a', frame: '#c9a24a', metal: true },
      { name: 'Matte Black', chip: '#2a2a2c', frame: '#2a2a2c', metal: false },
      { name: 'Walnut', chip: '#5a4433', frame: '#5a4433', metal: false },
      { name: 'Ivory', chip: '#ece7dd', frame: '#ece7dd', metal: false }
    ],
    plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const fm = p?.metal ? metal(p.frame, 0.35) : wood(p?.frame || '#5a4433');
      // stepped frame profile: back panel + four PROUD moulding rails; the
      // mirror glass sits inset ~1.7cm behind the rail fronts (no z-fight)
      box(g, fm, 58, 172, 2.5, 0, 2, -1.2, { r: 1 });          // back panel
      box(g, fm, 6, 176, 6, -28, 0, 0, { r: 1.6 });            // left rail
      box(g, fm, 6, 176, 6, 28, 0, 0, { r: 1.6 });             // right rail
      box(g, fm, 50, 6, 6, 0, 170, 0, { r: 1.6 });             // top rail
      box(g, fm, 50, 6, 6, 0, 0, 0, { r: 1.6 });               // bottom rail
      box(g, mirror(), 50, 162, 1, 0, 6.5, 0.8);               // inset glass
      // splayed easel feet + a real back brace running to the floor
      box(g, fm, 15, 4, 36, -19, 0, 0, { r: 1.5 });
      box(g, fm, 15, 4, 36, 19, 0, 0, { r: 1.5 });
      segment(g, fm, [0, 160, -1.5], [0, 3, -19], 2.2, 2.2, 8);
      box(g, fm, 12, 3, 8, 0, 0, -18.5, { r: 1 });             // brace foot pad
      return g;
    }
  },
  {
    id: 'decor_mirror_arch', name: 'Arched Leaning Mirror', cat: 'decor', w: 74, d: 14, h: 184,
    palettes: [
      { name: 'Brass', chip: '#c9a24a', frame: '#c9a24a', metal: true },
      { name: 'Matte Black', chip: '#2a2a2c', frame: '#2a2a2c', metal: false },
      { name: 'Oak', chip: '#b79363', frame: '#b79363', metal: false }
    ],
    plan: { type: 'box' },
    build: (p) => {
      const g = G();
      const fm = p?.metal ? metal(p.frame, 0.35) : wood(p?.frame || '#b79363');
      // a TRUE arch: rectangular body + semicircular crown, in three depth
      // steps (slab → moulding step → glass), leaning back as one group.
      // Disc depths are 0.1–0.16 shy of their slabs so no faces are coplanar.
      const lean = G();
      box(lean, fm, 74, 147, 3.5, 0, 0, -0.8);
      cyl(lean, fm, 37, 3.34, 0, 147, -0.8, { rx: Math.PI / 2, seg: 48 });
      box(lean, fm, 66, 143, 2, 0, 4, 1.9);
      cyl(lean, fm, 33, 1.86, 0, 147, 1.9, { rx: Math.PI / 2, seg: 44 });
      box(lean, mirror(), 58, 138, 1, 0, 9, 3.2);
      cyl(lean, mirror(), 29, 0.88, 0, 147, 3.2, { rx: Math.PI / 2, seg: 40 });
      lean.rotation.x = -0.06;
      lean.position.z = 4.5;
      g.add(lean);
      return g;
    }
  },

  // ===== WALL ART / SIGNS / CLOCK =====
  {
    id: 'decor_gallery_art', name: 'Framed Gallery Art', cat: 'decor', w: 92, d: 5, h: 72,
    mount: 'wall', elevation: 150,
    palettes: [
      { name: 'Black Frame', chip: '#2a2a2c', frame: '#2a2a2c', seed: 41 },
      { name: 'Oak Frame', chip: '#b79363', frame: '#b79363', seed: 43 },
      { name: 'Brass Frame', chip: '#c9a24a', frame: '#c9a24a', seed: 44 },
      { name: 'White Frame', chip: '#ece7dd', frame: '#ece7dd', seed: 46 }
    ],
    plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      box(g, wood(p?.frame || '#2a2a2c'), 92, 72, 4, 0, 0, 0, { r: 1 });
      box(g, solid('#f3efe6', 0.9), 82, 62, 3, 0, 5, 1.4);       // mat board
      box(g, artMaterial(p?.seed ?? 41), 66, 46, 2, 0, 13, 2.6); // canvas
      return g;
    }
  },
  {
    id: 'decor_neon_sign', name: 'Neon Wall Sign', cat: 'decor', w: 84, d: 6, h: 50,
    mount: 'wall', elevation: 165,
    palettes: [
      { name: 'Hot Pink', chip: '#ff4fb0', neon: '#ff4fb0' },
      { name: 'Cyan', chip: '#39d7ff', neon: '#39d7ff' },
      { name: 'Lime', chip: '#8cff5a', neon: '#8cff5a' },
      { name: 'Amber', chip: '#ffb23a', neon: '#ffb23a' }
    ],
    plan: { type: 'wallDecor' },
    light: { y: 0, color: '#ff7ad0', intensity: 0.9, distance: 300 },
    build: (p) => {
      const g = G();
      box(g, solid('#161619', 0.5), 84, 50, 3, 0, 0, -2, { r: 3 }); // backing
      const c = p?.neon || '#ff4fb0';
      const gm = glow(c, 1.8, 0.3);
      const N = 20;
      let prev = null;
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const x = -34 + t * 68;
        const y = 25 + Math.sin(t * Math.PI * 2.2) * 13;
        if (prev) {
          const dx = x - prev.x, dy = y - prev.y, len = Math.hypot(dx, dy);
          const seg = cyl(g, gm, 1.5, len, (x + prev.x) / 2, (y + prev.y) / 2 - len / 2, 3, { seg: 8 });
          seg.rotation.z = Math.atan2(dx, -dy);
        }
        prev = { x, y };
      }
      sphere(g, gm, 2, -34, 25, 3);
      sphere(g, gm, 2, 34, 25 + Math.sin(Math.PI * 2.2) * 13, 3);
      return g;
    }
  },
  {
    id: 'decor_wall_clock', name: 'Large Wall Clock', cat: 'decor', w: 60, d: 6, h: 60,
    mount: 'wall', elevation: 165,
    palettes: [
      { name: 'Black', chip: '#2a2a2c', rim: '#2a2a2c', face: '#f2ede2' },
      { name: 'Brass', chip: '#c9a24a', rim: '#c9a24a', face: '#faf6ec' },
      { name: 'Walnut', chip: '#5a4433', rim: '#5a4433', face: '#f2ede2' }
    ],
    plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      const rim = p?.rim === '#c9a24a' ? metal(p.rim, 0.35) : wood(p?.rim || '#2a2a2c');
      cyl(g, rim, 30, 5, 0, 0, 2, { rx: Math.PI / 2, seg: 40 });        // rim body
      cyl(g, solid(p?.face || '#f2ede2', 0.85), 27, 5.2, 0, 0, 2.4, { rx: Math.PI / 2, seg: 40 });
      const tick = solid('#33312e', 0.6);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        box(g, tick, i % 3 === 0 ? 2.4 : 1.2, 4, 1.2, Math.sin(a) * 23, Math.cos(a) * 23, 4.8);
      }
      const hands = solid('#26241f', 0.5);
      box(g, hands, 2, 15, 1, 0, 6, 5.2, { rz: -0.5 });   // hour
      box(g, hands, 1.4, 22, 1, 0, 8, 5.5, { rz: 1.9 });  // minute
      sphere(g, metal('#33312e', 0.4), 2, 0, 0, 5.6);
      return g;
    }
  },

  // ===== FURNITURE-STYLE PIECES =====
  {
    id: 'decor_record_console', name: 'Record Player Console', cat: 'living', w: 112, d: 42, h: 68,
    palettes: [
      { name: 'Walnut', chip: '#5a4130', wood: '#5a4130' },
      { name: 'Teak', chip: '#9a6f42', wood: '#9a6f42' },
      { name: 'Oak', chip: '#c0a06a', wood: '#c0a06a' }
    ],
    plan: { type: 'storage' },
    build: (p) => {
      const wd = wood(p?.wood || '#5a4130');
      const g = G();
      box(g, wd, 112, 34, 42, 0, 24, 0, { r: 2 });          // cabinet body
      box(g, solid('#d8cdb8', 0.85), 44, 26, 1, -30, 27, 21.4); // speaker grille L
      box(g, solid('#d8cdb8', 0.85), 44, 26, 1, 30, 27, 21.4);  // speaker grille R
      // splayed mid-century legs
      const lm = wood('#3a2b1f', 0.5);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const l = cyl(g, lm, 2.2, 24, sx * 48, 0, sz * 15, { rTop: 1.2, seg: 10 });
        l.rotation.z = sx * 0.16; l.rotation.x = -sz * 0.16;
      }
      // turntable on top
      box(g, solid('#2b2b2d', 0.5), 42, 3, 34, 0, 41, 0, { r: 1 });
      cyl(g, solid('#1a1a1c', 0.4), 15, 0.8, 0, 44, -2, { seg: 32 });   // platter
      cyl(g, solid('#c24a3a', 0.6), 3, 0.9, 0, 44, -2, { seg: 16 });    // label
      cyl(g, metal('#c8ccd0', 0.3), 0.6, 2, 12, 44, 12, { seg: 8 });    // tonearm pivot
      box(g, metal('#c8ccd0', 0.3), 1, 1, 20, 4, 45, 6, { ry: 0.5 });   // tonearm
      return g;
    }
  },
  {
    id: 'decor_bar_cart', name: 'Modern Bar Cart', cat: 'living', w: 78, d: 46, h: 84,
    palettes: [
      { name: 'Brass', chip: '#c9a24a', frame: '#c9a24a' },
      { name: 'Chrome', chip: '#cdd2d6', frame: '#cdd2d6' },
      { name: 'Matte Black', chip: '#2a2a2c', frame: '#2a2a2c' }
    ],
    plan: { type: 'storage' },
    build: (p) => {
      const g = G();
      const fr = metal(p?.frame || '#c9a24a', 0.3);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        cyl(g, fr, 1.4, 76, sx * 35, 4, sz * 20, { seg: 10 });
        sphere(g, solid('#2a2a2c', 0.4), 2.4, sx * 35, 2.4, sz * 20); // caster on the floor
      }
      // rails: long runs front/back + side gallery rails so bottles can't roll off
      for (const y of [8, 80]) for (const sz of [-1, 1]) cyl(g, fr, 1.2, 70, 0, y, sz * 20, { rz: Math.PI / 2, seg: 8 });
      for (const sx of [-1, 1]) cyl(g, fr, 1.2, 40, sx * 35, 80, 0, { rx: Math.PI / 2, seg: 8 });
      box(g, glass(), 74, 1.4, 42, 0, 78, 0);   // top glass shelf
      box(g, glass(), 74, 1.4, 42, 0, 26, 0);   // lower glass shelf
      const sy = 79.4;                          // items STAND ON the shelf surface
      // wine bottle: straight body, sloped shoulder, long neck, lipped mouth
      lathe(g, solid('#3d5a3a', 0.3), [
        [3.3, 0], [3.5, 0.4], [3.5, 15], [3.1, 16.6], [1.25, 20.5],
        [1.15, 26.2], [1.45, 26.8], [1.45, 28]
      ], -24, sy, 5, { seg: 20 });
      cyl(g, solid('#7a2230', 0.5), 1.5, 3.2, -24, sy + 25.4, 5, { seg: 12 }); // foil cap
      box(g, solid('#efe8d6', 0.8), 4.4, 6, 0.5, -24, sy + 5, 8.4);            // label
      // squat spirits bottle: wide shoulders, short neck, chunky black cap
      lathe(g, solid('#8a5a2e', 0.35), [
        [3.9, 0], [4.15, 0.5], [4.15, 11.5], [3.4, 13], [1.7, 14.8], [1.7, 17.6]
      ], -12, sy, -6, { seg: 20 });
      lathe(g, solid('#1d1d1f', 0.5), [[1.95, 0], [1.95, 2.6], [1.4, 3.1]], -12, sy + 16.6, -6, { seg: 14 });
      box(g, solid('#e8e2d2', 0.8), 4.8, 5, 0.5, -12, sy + 3.5, -2.1);         // label
      // crystal decanter: fat belly, slim neck, ball stopper, whisky inside
      lathe(g, glass(), [
        [2.4, 0], [4.9, 1.6], [5.7, 5.5], [4.9, 9.5], [2.6, 12], [1.5, 13.5],
        [1.5, 17], [2.3, 17.8], [2.1, 18.6]
      ], 0, sy, 6, { seg: 24 });
      lathe(g, solid('#9a5c20', 0.3), [
        [1.9, 0], [4.3, 1.2], [5, 4.9], [4.3, 7.9], [2.7, 9.4], [0.01, 9.2]
      ], 0, sy + 0.7, 6, { seg: 20 });                        // the whisky inside
      lathe(g, solid('#d8cfc2', 0.25), [
        [0.9, 0], [2, 0.9], [2.2, 2.2], [1.1, 3.4], [0.05, 4]
      ], 0, sy + 17.6, 6, { seg: 16 });                       // faceted stopper
      // two lowball glasses (real inner wall), one already poured
      for (const [gx, gz, fill] of [[13, 8, 1], [20, 0, 0]]) {
        lathe(g, glass(), [
          [2.5, 0], [2.75, 0.4], [2.85, 7], [2.6, 7], [2.45, 1.4], [0.01, 1.2]
        ], gx, sy, gz, { seg: 18 });
        if (fill) cyl(g, solid('#9a5c20', 0.3), 2.3, 2.6, gx, sy + 1.6, gz, { seg: 14 });
      }
      // a lemon waiting to be sliced, nubs and all
      const lem = sphere(g, solid('#e3c22e', 0.55), 2.3, 27, sy + 2.2, -10, { seg: 14 });
      lem.scale.set(1.3, 0.95, 1);
      sphere(g, solid('#c9a71f', 0.6), 0.55, 30.2, sy + 2.2, -10, { seg: 8 });
      sphere(g, solid('#c9a71f', 0.6), 0.55, 23.8, sy + 2.2, -10, { seg: 8 });
      // lower shelf: a stack of two books + a cocktail shaker
      const ls = 27.4;
      box(g, solid('#7c4434', 0.7), 20, 3, 14, -18, ls, 2, { r: 0.6 });
      box(g, solid('#39506b', 0.7), 18, 2.6, 13, -17, ls + 3, 1, { r: 0.6, ry: 0.22 });
      lathe(g, metal('#cdd2d6', 0.2), [
        [3.2, 0], [3.5, 0.6], [3.5, 9], [2.6, 12], [1.8, 13.5], [1.9, 15.5], [1.2, 16.4]
      ], 8, ls, -4, { seg: 20 });
      return g;
    }
  },
  {
    id: 'decor_wine_rack', name: 'Wine Rack', cat: 'living', w: 52, d: 32, h: 92,
    palettes: [
      { name: 'Walnut', chip: '#5a4130', wood: '#5a4130' },
      { name: 'Oak', chip: '#c0a06a', wood: '#c0a06a' },
      { name: 'Black Metal', chip: '#2a2a2c', wood: '#2a2a2c' }
    ],
    plan: { type: 'storage' },
    build: (p) => {
      const g = G();
      const wd = wood(p?.wood || '#5a4130');
      // side panels + top/bottom
      box(g, wd, 4, 92, 32, -24, 0, 0, { r: 1 });
      box(g, wd, 4, 92, 32, 24, 0, 0, { r: 1 });
      box(g, wd, 52, 4, 32, 0, 0, 0, { r: 1 });
      box(g, wd, 52, 4, 32, 0, 88, 0, { r: 1 });
      // diagonal X lattice divider slats
      for (const s of [-1, 1]) {
        box(g, wd, 66, 3, 3, 0, 44, 0, { rz: s * 0.72 });
      }
      // cradle shelves with bottles lying down
      for (const y of [22, 62]) {
        box(g, wd, 44, 3, 30, 0, y, 0);
        for (let i = 0; i < 3; i++) {
          const x = -14 + i * 14, col = ['#3d5a3a', '#7a3a2a', '#2f4a6a'][i];
          const b = cyl(g, glass(), 4, 26, x, y + 7, -3, { rx: Math.PI / 2, seg: 12 });
          const b2 = cyl(g, solid(col, 0.35), 4.05, 20, x, y + 7, -1, { rx: Math.PI / 2, seg: 12 });
        }
      }
      return g;
    }
  },
  {
    id: 'decor_ladder_shelf', name: 'Ladder Bookshelf', cat: 'living', w: 62, d: 40, h: 180,
    palettes: [
      { name: 'Oak', chip: '#c0a06a', wood: '#c0a06a' },
      { name: 'Walnut', chip: '#5a4130', wood: '#5a4130' },
      { name: 'White', chip: '#ece7dd', wood: '#ece7dd' }
    ],
    plan: { type: 'storage' },
    build: (p) => {
      const g = G();
      const wd = wood(p?.wood || '#c0a06a');
      // two leaning side rails (top tilts back toward -z)
      for (const sx of [-1, 1]) {
        const rail = box(g, wd, 5, 184, 5, sx * 28, 0, 6, { rx: 0.11 });
      }
      // shelves shrink toward the top, each set back a bit
      const shelves = [[58, 36, 20, 12], [50, 30, 62, 6], [42, 24, 104, 0], [34, 18, 146, -6]];
      shelves.forEach(([w2, d2, y, z]) => box(g, wd, w2, 4, d2, 0, y, z, { r: 1 }));
      // props: books on the bottom shelf + a plant on the second shelf
      for (let i = 0; i < 4; i++) box(g, solid(['#c24a3a', '#3d6b8a', '#d8b24a', '#4a7a4a'][i], 0.7), 4, 16 + i, 20, -20 + i * 5, 24, 12);
      cyl(g, solid('#c9c0ae', 0.7), 6, 9, 12, 66, 6, { rTop: 7 });
      foliage(g, '#55763f', '#68894e', 12, 78, 6, 9, 7, 9);
      return g;
    }
  },
  {
    id: 'decor_room_divider', name: 'Folding Room Divider', cat: 'living', w: 180, d: 40, h: 175,
    palettes: [
      { name: 'Walnut', chip: '#5a4130', wood: '#5a4130' },
      { name: 'Natural', chip: '#c0a06a', wood: '#c0a06a' },
      { name: 'Black', chip: '#2a2a2c', wood: '#2a2a2c' }
    ],
    plan: { type: 'wardrobe' },
    build: (p) => {
      const g = G();
      const wd = wood(p?.wood || '#5a4130');
      // three hinged panels arranged in a gentle zigzag
      const panels = [[-58, -12, 0.35], [0, 6, -0.28], [58, -12, 0.35]];
      panels.forEach(([x, z, ry]) => {
        const pg = G();
        // frame
        box(pg, wd, 58, 175, 4, 0, 0, 0, { r: 1 });
        box(pg, wd, 58, 6, 4, 0, 84, 0);
        box(pg, wd, 58, 6, 4, 0, 0, 0);
        // vertical slats
        for (let i = 0; i < 7; i++) box(pg, wd, 3, 160, 2.5, -24 + i * 8, 8, 1);
        pg.position.set(x, 0, z);
        pg.rotation.y = ry;
        g.add(pg);
      });
      return g;
    }
  },
  {
    id: 'decor_coat_rack', name: 'Coat Rack', cat: 'decor', w: 50, d: 50, h: 178,
    palettes: [
      { name: 'Walnut', chip: '#5a4130', wood: '#5a4130' },
      { name: 'Black', chip: '#2a2a2c', wood: '#2a2a2c' },
      { name: 'Brass', chip: '#c9a24a', wood: '#c9a24a', metal: true }
    ],
    plan: { type: 'plant' },
    build: (p) => {
      const g = G();
      const mt = p?.metal ? metal(p.wood, 0.35) : wood(p?.wood || '#5a4130');
      // tripod foot
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        const l = cyl(g, mt, 2, 30, Math.sin(a) * 16, 0, Math.cos(a) * 16, { rTop: 1.4, seg: 10 });
        l.rotation.z = -Math.sin(a) * 0.5; l.rotation.x = Math.cos(a) * 0.5;
      }
      cyl(g, mt, 2.2, 170, 0, 4, 0, { rTop: 1.8, seg: 12 });   // central pole
      // hooks near the top
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + 0.4;
        const y = 150 + (i % 2) * 14;
        const h = cyl(g, mt, 1, 12, 0, y, 0, { seg: 8 });
        h.position.set(Math.sin(a) * 4, y, Math.cos(a) * 4);
        h.rotation.z = -Math.sin(a) * 1.1; h.rotation.x = Math.cos(a) * 1.1;
        sphere(g, mt, 1.6, Math.sin(a) * 11, y + 4, Math.cos(a) * 11);
      }
      // a draped coat
      box(g, solid('#7a5a3a', 0.85), 26, 44, 14, 12, 116, 6, { r: 5 });
      return g;
    }
  },

  // ===== LAMPS =====
  {
    id: 'decor_floor_lamp_dome', name: 'Modern Dome Floor Lamp', cat: 'living', w: 44, d: 44, h: 162,
    palettes: [
      { name: 'Brass', chip: '#c9a24a', pole: '#c9a24a' },
      { name: 'Black', chip: '#2a2a2c', pole: '#2a2a2c' },
      { name: 'Chrome', chip: '#cdd2d6', pole: '#cdd2d6' }
    ],
    plan: { type: 'lampRound' },
    light: { y: 150, color: '#ffe1ad', intensity: 0.95, distance: 460 },
    build: (p) => {
      const g = G();
      const pm = metal(p?.pole || '#c9a24a', 0.3);
      // turned weighted base flowing up into the stem — one smooth profile
      lathe(g, solid('#2f2f31', 0.4), [
        [14.5, 0], [15, 1], [13.5, 2.6], [8, 4], [3.4, 5.5], [2.4, 8]
      ], 0, 0, 0, { seg: 32 });
      cyl(g, pm, 1.5, 142, 0, 7, 0, { seg: 14 });                   // pole
      lathe(g, pm, [[1.6, 0], [2.6, 1], [2.8, 3], [1.6, 4]], 0, 96, 0, { seg: 18 }); // collar
      // spun-metal dome shade: outer skin, rolled lip, real inner skin
      lathe(g, pm, [
        [20, 0], [20.4, 1.2], [19.4, 3.4], [16, 7.6], [9.5, 11], [2.2, 12.6],
        [1.4, 13.4], [1.2, 12.4], [8.8, 10.2], [15.2, 6.8], [18.6, 3], [19.2, 0.6]
      ], 0, 137, 0, { seg: 36 });
      sphere(g, glow('#ffe8c8', 1.2, 0.4), 5.5, 0, 141, 0, { seg: 14 }); // bulb peeking below the rim
      // intrigue: the power cord snakes across the floor to a foot switch
      const cord = solid('#3a3a3d', 0.6);
      sweep(g, cord, [[3, 1.2, 4], [10, 0.7, 9], [17, 0.7, 7], [23, 0.7, 10]], 0.45, { seg: 16, radialSeg: 6 });
      box(g, cord, 3.4, 1.6, 5.4, 25.5, 0, 10.4, { r: 0.7 });        // foot switch
      sweep(g, cord, [[27.8, 0.8, 10.7], [30, 0.7, 11.2]], 0.45, { seg: 6, radialSeg: 6 });
      return g;
    }
  },
  {
    id: 'decor_tripod_lamp', name: 'Tripod Floor Lamp', cat: 'living', w: 60, d: 60, h: 165,
    palettes: [
      { name: 'Oak Legs', chip: '#c0a06a', leg: '#c0a06a', shade: '#efe7d6' },
      { name: 'Walnut Legs', chip: '#5a4130', leg: '#5a4130', shade: '#e6dcc8' },
      { name: 'Black Legs', chip: '#2a2a2c', leg: '#2a2a2c', shade: '#f2ece0' }
    ],
    plan: { type: 'lampRound' },
    light: { y: 145, color: '#ffe6bf', intensity: 0.9, distance: 430 },
    build: (p) => {
      const g = G();
      const lm = wood(p?.leg || '#c0a06a', 0.5);
      // three tapered legs that genuinely MEET at a turned hub (no floating tops)
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        segment(g, lm, [Math.sin(a) * 26, 0, Math.cos(a) * 26],
          [Math.sin(a) * 3.2, 124, Math.cos(a) * 3.2], 2.3, 1.4, 10);
      }
      // turned hub the legs bolt into, flowing into the stem
      lathe(g, lm, [[5.4, 0], [5.8, 1.4], [5.4, 3.6], [3, 5.2], [2.2, 7.5], [2.4, 11]], 0, 118, 0, { seg: 22 });
      cyl(g, metal('#8a8f95', 0.4), 1, 10, 0, 128, 0, { seg: 10 });
      shade(g, p?.shade || '#efe7d6', 24, 20, 30, 0, 128, 0);
      sphere(g, glow('#ffe8c8', 1.0, 0.4), 6, 0, 138, 0, { seg: 12 });
      // brass stem rising from the socket to a turned finial above the shade
      cyl(g, metal('#c9a24a', 0.3), 0.5, 17, 0, 141, 0, { seg: 8 });
      lathe(g, metal('#c9a24a', 0.3), [[1.6, 0], [2, 1], [0.9, 2.2], [0.4, 3.2], [1.1, 4.4], [0.05, 5.8]], 0, 158, 0, { seg: 16 });
      return g;
    }
  },

  // ===== SEATING / SOFT =====
  {
    id: 'decor_pouf', name: 'Pouf Ottoman', cat: 'decor', w: 50, d: 50, h: 40,
    palettes: [
      { name: 'Mustard', chip: '#d8a63a', fab: '#d8a63a' },
      { name: 'Sage', chip: '#8a9a6f', fab: '#8a9a6f' },
      { name: 'Terracotta', chip: '#c26a4a', fab: '#c26a4a' },
      { name: 'Charcoal', chip: '#3d3d40', fab: '#3d3d40' }
    ],
    plan: { type: 'stool' },
    build: (p) => {
      const g = G();
      const fab = solid(p?.fab || '#d8a63a', 0.85);
      // one heavily-stuffed soft body with a real sit dimple
      cushion(g, fab, 45, 35, 45, 0, 0, 0, { puff: 0.3, dimple: 1.3 });
      sphere(g, solid('#2a2118', 0.9), 1.6, 0, 32.4, 0, { seg: 10 }); // center button in the dip
      // intrigue: a little ceramic tray with a lit candle resting in the dimple
      lathe(g, solid('#efe9dc', 0.5), [
        [7.2, 0], [7.8, 0.5], [8, 1.8], [7.2, 1.8], [7, 0.6]
      ], 1.5, 33, -1.5, { seg: 24 });
      cyl(g, solid('#e8ddc8', 0.6), 2.2, 3.4, 3.5, 34, -3.5, { seg: 14 });
      sphere(g, glow('#ffca6a', 1.6, 0.4), 0.7, 3.5, 38, -3.5, { seg: 8 });
      return g;
    }
  },
  {
    id: 'decor_beanbag', name: 'Bean Bag Chair', cat: 'decor', w: 90, d: 90, h: 78,
    palettes: [
      { name: 'Denim', chip: '#4a6a8a', fab: '#4a6a8a', fab2: '#37506a' },
      { name: 'Grey', chip: '#8a8d90', fab: '#8a8d90', fab2: '#6a6d70' },
      { name: 'Rust', chip: '#b85a3a', fab: '#b85a3a', fab2: '#8f4028' },
      { name: 'Olive', chip: '#7a7a4a', fab: '#7a7a4a', fab2: '#5c5c34' }
    ],
    plan: { type: 'stool' },
    build: (p) => {
      const g = G();
      const a = p?.fab || '#4a6a8a', b = p?.fab2 || '#37506a';
      const fa = solid(a, 0.9), fb = solid(b, 0.9);
      // one continuous slumped mass: heavy wide base with a sat-in dimple,
      // and a backrest lobe leaning away, deeply overlapped so they read as
      // a single bag of beans
      cushion(g, fa, 78, 40, 78, 0, 0, 2, { puff: 0.42, dimple: 0.7, ry: 0.15 });
      cushion(g, fa, 60, 42, 48, 0, 24, -14, { puff: 0.45, dimple: 0.25, rx: -0.34, ry: -0.1 });
      // intrigue: the little carry-handle tab on the side seam
      box(g, fb, 9, 2.6, 1.4, 26, 30, 18, { r: 0.7, ry: 0.55, rz: 0.2 });
      return g;
    }
  },

  // ===== SCULPTURE / GLOBE / VASES =====
  {
    id: 'decor_sculpture', name: 'Abstract Sculpture', cat: 'decor', w: 40, d: 40, h: 96,
    palettes: [
      { name: 'Bronze', chip: '#8a6a3a', a: '#6a4e28', b: '#b78a4a' },
      { name: 'Stone', chip: '#c8c2b4', a: '#a8a294', b: '#e0dccf' },
      { name: 'Terracotta', chip: '#c26a4a', a: '#9a4e34', b: '#d98a6a' }
    ],
    plan: { type: 'plant' },
    build: (p) => {
      const g = G();
      const a = p?.a || '#6a4e28', b = p?.b || '#b78a4a';
      box(g, solid('#2a2a2c', 0.5), 24, 6, 24, 0, 0, 0, { r: 1 }); // plinth
      // stacked, twisting organic masses
      const m1 = blob(g, a, b, 16, 0, 24, 0, { seed: 3, sy: 1.3, detail: 3 });
      m1.scale.set(1, 1, 0.7);
      const m2 = blob(g, a, b, 13, 4, 52, 2, { seed: 8, sy: 1.2, detail: 3 });
      m2.rotation.y = 0.8; m2.scale.set(1.1, 1, 0.6);
      const m3 = blob(g, a, b, 10, -2, 78, -2, { seed: 12, sy: 1.1, detail: 3 });
      m3.rotation.y = 1.7; m3.scale.set(1, 1, 0.55);
      return g;
    }
  },
  {
    id: 'decor_globe', name: 'Floor Globe', cat: 'decor', w: 46, d: 46, h: 108,
    palettes: [
      { name: 'Ocean Blue', chip: '#2f6d9a', ocean: '#2f6d9a', wood: '#5a4130' },
      { name: 'Antique', chip: '#b79a5a', ocean: '#b79a5a', wood: '#6a4a30' },
      { name: 'Slate', chip: '#4a5a66', ocean: '#4a5a66', wood: '#3a3a3c' }
    ],
    plan: { type: 'plant' },
    build: (p) => {
      const g = G();
      const wd = wood(p?.wood || '#5a4130');
      // splayed wooden tripod stand
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        const l = cyl(g, wd, 2, 46, Math.sin(a) * 15, 0, Math.cos(a) * 15, { rTop: 1.4, seg: 10 });
        l.rotation.z = -Math.sin(a) * 0.5; l.rotation.x = Math.cos(a) * 0.5;
      }
      cyl(g, wd, 3, 20, 0, 42, 0, { seg: 12 });                 // pedestal
      cyl(g, metal('#b8862f', 0.35), 5, 4, 0, 60, 0, { seg: 20 }); // brass cup
      // meridian half-ring
      for (let i = 0; i <= 12; i++) {
        const a = (i / 12) * Math.PI - Math.PI / 2;
        const seg = cyl(g, metal('#b8862f', 0.35), 0.8, 7, Math.sin(a) * 25, 84 + Math.cos(a) * 25, 0, { seg: 6 });
        seg.rotation.z = -a;
      }
      const globe = sphere(g, solid(p?.ocean || '#2f6d9a', 0.55), 23, 0, 84, 0, { seg: 28 });
      globe.rotation.z = 0.4;
      // continents as flat patches on the surface
      const land = solid('#5a7a4a', 0.75);
      [[8, 92, 15], [-12, 78, 12], [14, 80, -12], [-6, 96, -8], [18, 88, 6]].forEach(([x, y, z]) => {
        const c = sphere(g, land, 6, x, y, z, { sy: 0.35, seg: 10 });
        c.lookAt(0, 84, 0);
      });
      return g;
    }
  },
  {
    id: 'decor_vase_trio', name: 'Ceramic Vase Trio', cat: 'decor', w: 60, d: 30, h: 58,
    palettes: [
      { name: 'Cream', chip: '#e7ddc8', a: '#e7ddc8', b: '#c9b89a', c: '#d8cbb0' },
      { name: 'Sage', chip: '#9aa885', a: '#9aa885', b: '#7d8c6a', c: '#b3bfa0' },
      { name: 'Blush', chip: '#d8a89a', a: '#d8a89a', b: '#b98070', c: '#e6c2b6' }
    ],
    plan: { type: 'plant' },
    build: (p) => {
      const g = G();
      const a = solid(p?.a || '#e7ddc8', 0.55), b = solid(p?.b || '#c9b89a', 0.55), c = solid(p?.c || '#d8cbb0', 0.55);
      // tall bottle vase: foot, gentle belly, long neck, flared lip, inner wall
      lathe(g, a, [
        [4.2, 0], [5.6, 0.7], [6.4, 5], [6.6, 12], [5.6, 20], [3, 27], [2, 33],
        [1.9, 40], [2.6, 42.5], [2.7, 44], [1.8, 44], [1.7, 41.5]
      ], -20, 0, 0, { seg: 32 });
      // bulbous urn: tight foot, fat belly, pinched neck, rolled lip
      lathe(g, b, [
        [5, 0], [7.4, 1], [10.8, 6], [12.2, 12], [11, 19], [7, 24.5], [4.6, 26.5],
        [5.6, 28.5], [5.8, 30], [4.6, 30], [4.4, 27], [0.01, 26.4]
      ], 3, 0, 1, { seg: 36 });
      // low wide vase: flared silhouette, thick rolled rim, real inner bowl
      lathe(g, c, [
        [6.6, 0], [8.8, 0.8], [10.6, 5], [11.2, 11], [10.6, 15.5], [11.6, 16.8],
        [11.6, 18], [10.2, 18], [9.6, 13], [7.4, 9.6], [0.01, 9]
      ], 22, 0, 1, { seg: 36 });
      // dried stems arching naturally out of the tall vase's mouth
      const stem = wood('#a89268', 0.7);
      segment(g, stem, [-20, 41, 0], [-26, 54, 3], 0.5, 0.32, 6);
      segment(g, stem, [-20, 41, 0], [-15.5, 55, -2], 0.5, 0.32, 6);
      segment(g, stem, [-20, 41, 0], [-21.5, 56, 1.5], 0.5, 0.3, 6);
      // the showy one: a seeded stem sweeping over in a true arc
      sweep(g, stem, [[-20, 40, 0], [-19, 50, 0.8], [-15, 55.5, 1.6], [-10.4, 54, 2.4]], 0.42, { seg: 16, radialSeg: 6 });
      const seedHead = blob(g, '#c9b184', '#e0cf9f', 2.1, -10, 54, 2.5, { seed: 7, sy: 1.5, detail: 3 });
      seedHead.rotation.z = -0.5;
      return g;
    }
  },

  // ===== PLANTS =====
  {
    id: 'plant_fiddle_leaf', name: 'Fiddle-Leaf Fig Tree', cat: 'decor', w: 80, d: 80, h: 190,
    palettes: [
      { name: 'Terracotta Pot', chip: '#c07a4a', pot: '#c07a4a' },
      { name: 'White Pot', chip: '#ece7dd', pot: '#ece7dd' },
      { name: 'Woven Basket', chip: '#b79363', pot: '#b79363' }
    ],
    plan: { type: 'plant' },
    build: (p) => {
      const g = G();
      cyl(g, solid(p?.pot || '#c07a4a', 0.75), 17, 30, 0, 0, 0, { rTop: 20, seg: 22 });
      cyl(g, solid('#4a3626', 0.95), 16, 3, 0, 29, 0, { seg: 22 });
      // slender trunk with a couple of branches
      cyl(g, wood('#8a7a5a', 0.7), 3, 120, 0, 30, 0, { rTop: 2, seg: 10 });
      cyl(g, wood('#8a7a5a', 0.7), 2, 55, 0, 120, 0, { rz: 0.4, rTop: 1.4, seg: 8 });
      cyl(g, wood('#8a7a5a', 0.7), 2, 50, 0, 120, 0, { rz: -0.35, rTop: 1.4, seg: 8 });
      // big glossy upright oval leaves
      let sd = 71;
      const rnd = () => { sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; };
      for (let i = 0; i < 14; i++) {
        const a = rnd() * Math.PI * 2;
        const y = 120 + rnd() * 60;
        const rad = 22 + rnd() * 16;
        const leaf = sphere(g, solid(rnd() < 0.5 ? '#2f5b30' : '#3d7038', 0.55), 14 + rnd() * 5,
          Math.sin(a) * rad, y, Math.cos(a) * rad, { sx: 0.75, sz: 0.14, seg: 12 });
        leaf.lookAt(Math.sin(a) * rad * 2, y + 8, Math.cos(a) * rad * 2);
      }
      return g;
    }
  },
  {
    id: 'plant_snake', name: 'Snake Plant', cat: 'decor', w: 40, d: 40, h: 96,
    palettes: [
      { name: 'White Pot', chip: '#ece7dd', pot: '#ece7dd' },
      { name: 'Concrete', chip: '#b6b2a8', pot: '#b6b2a8' },
      { name: 'Terracotta', chip: '#c07a4a', pot: '#c07a4a' }
    ],
    plan: { type: 'plant' },
    build: (p) => {
      const g = G();
      cyl(g, solid(p?.pot || '#ece7dd', 0.7), 13, 26, 0, 0, 0, { rTop: 15, seg: 22 });
      cyl(g, solid('#4a3626', 0.95), 12.5, 2, 0, 26, 0, { seg: 22 });
      // stiff upright blade leaves radiating from the base
      let sd = 44;
      const rnd = () => { sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; };
      for (let i = 0; i < 11; i++) {
        const a = (i / 11) * Math.PI * 2 + rnd() * 0.3;
        const rad = 3 + rnd() * 7;
        const green = rnd() < 0.5 ? '#3f6b2e' : '#4e7a34';
        const l = cyl(g, solid(green, 0.7), 3, 46 + rnd() * 22, Math.sin(a) * rad, 26, Math.cos(a) * rad,
          { rTop: 0.4, seg: 8 });
        l.scale.z = 0.24;
        l.rotation.y = a;
        l.rotation.x = Math.cos(a) * 0.14; l.rotation.z = -Math.sin(a) * 0.14;
      }
      return g;
    }
  },
  {
    id: 'plant_pampas', name: 'Pampas Grass Vase', cat: 'decor', w: 44, d: 44, h: 150,
    palettes: [
      { name: 'Cream Vase', chip: '#e7ddc8', vase: '#e7ddc8', plume: '#e8dcc0' },
      { name: 'Black Vase', chip: '#2a2a2c', vase: '#2a2a2c', plume: '#e8dcc0' },
      { name: 'Blush Plumes', chip: '#d8b8a8', vase: '#e7ddc8', plume: '#d8b8a8' }
    ],
    plan: { type: 'plant' },
    build: (p) => {
      const g = G();
      const vase = solid(p?.vase || '#e7ddc8', 0.55);
      // one turned profile: footed base, waisted body, swelling shoulder,
      // rolled lip, inner wall turning back down into the mouth
      lathe(g, vase, [
        [7, 0], [9.6, 0.8], [10.4, 4], [9, 10], [7.4, 20], [7.8, 34],
        [9.4, 46], [10.2, 52], [10.6, 55], [9.2, 55], [8.9, 51], [7.6, 45]
      ], 0, 0, 0, { seg: 36 });
      const plume = p?.plume || '#e8dcc0';
      const stemMat = solid('#c7b88f', 0.7);
      let sd = 61;
      const rnd = () => { sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; };
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + rnd() * 0.5;
        const lean = 0.12 + rnd() * 0.5;
        const h = 62 + rnd() * 30;
        const bx = Math.sin(a) * 3, bz = Math.cos(a) * 3;          // rooted inside the mouth
        const mx = Math.sin(a) * lean * 13, mz = Math.cos(a) * lean * 13;
        const tx = Math.sin(a) * lean * 34, tz = Math.cos(a) * lean * 34;
        const ty = 50 + h - lean * 16;                             // taller stems droop more
        if (i % 3 === 0) {
          // the showy ones arch in one smooth sweep
          sweep(g, stemMat, [[bx, 50, bz], [mx, 50 + h * 0.55, mz], [tx, ty, tz]], 0.55, { seg: 12, radialSeg: 5 });
        } else {
          segment(g, stemMat, [bx, 50, bz], [mx, 50 + h * 0.55, mz], 0.65, 0.5, 5);
          segment(g, stemMat, [mx, 50 + h * 0.55, mz], [tx, ty, tz], 0.5, 0.35, 5);
        }
        // fluffy elongated plume aligned with the stem tip direction
        const ph = blob(g, '#d6c5a2', plume, 6 + rnd() * 1.5, tx, ty + 6, tz, { seed: 20 + i, sy: 2.1, detail: 3 });
        ph.rotation.z = -Math.sin(a) * lean * 0.8;
        ph.rotation.x = Math.cos(a) * lean * 0.8;
      }
      return g;
    }
  },
  {
    id: 'plant_hanging', name: 'Hanging Plant', cat: 'decor', w: 44, d: 44, h: 90,
    mount: 'ceiling',
    palettes: [
      { name: 'Terracotta', chip: '#c07a4a', pot: '#c07a4a' },
      { name: 'White', chip: '#ece7dd', pot: '#ece7dd' },
      { name: 'Woven', chip: '#b79363', pot: '#b79363' }
    ],
    plan: { type: 'plant' },
    build: (p) => {
      const g = G();
      // built hanging from y=0 downward
      cyl(g, metal('#9a9ea4', 0.4), 1, 2, 0, -2, 0, { seg: 8 });
      // three macrame cords down to the pot
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        const c = cyl(g, solid('#d8cdb8', 0.9), 0.4, 44, Math.sin(a) * 8, -46, Math.cos(a) * 8, { seg: 5 });
        c.rotation.z = Math.sin(a) * 0.18; c.rotation.x = -Math.cos(a) * 0.18;
      }
      cyl(g, solid(p?.pot || '#c07a4a', 0.75), 14, 16, 0, -66, 0, { rTop: 12, seg: 20 });
      // trailing foliage that spills over and hangs down
      foliage(g, '#3f6b2e', '#5a8a3c', 0, -58, 0, 18, 12, 33);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        foliage(g, '#3f6b2e', '#5a8a3c', Math.sin(a) * 13, -66 - i * 3 - 8, Math.cos(a) * 13, 7, 5, 40 + i);
      }
      return g;
    }
  }
];
