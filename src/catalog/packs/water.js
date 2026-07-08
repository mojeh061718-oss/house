// Content pack: realistic ponds & water features. Built only from primitive
// helpers in builders.js — no external assets, no direct THREE use.
import { G, box, cyl, sphere, blob, foliage, solid, metal, water, glow, tex, buildPond } from '../builders.js';

// ---- local shape helpers (kept inside this pack) --------------------------

// Flat lily pad: a thin green disc floating just above the water surface,
// with a small notch-free top tone. r in cm, y is the pad's base height.
function lilyPad(g, x, z, r, y = 5.4, hex = '#3f7a43') {
  const pad = cyl(g, solid(hex, 0.7), r, 0.6, x, y, z, { seg: 16 });
  pad.rotation.y = (x * 0.7 + z) % Math.PI;
  return pad;
}

// A lotus / water-lily blossom sitting on the surface.
function lotus(g, x, z, y = 5.6) {
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const p = sphere(g, solid('#f2d6e2', 0.6), 3.2, x + Math.cos(a) * 3, y + 1.2, z + Math.sin(a) * 3, { seg: 8 });
    p.scale.set(0.7, 0.4, 1.5);
    p.rotation.y = -a;
  }
  sphere(g, glow('#f6d84a', 0.35, 0.6), 1.6, x, y + 1.6, z, { seg: 8 });
}

// A single koi: a stretched orange (or white) ellipsoid just under the surface.
function koi(g, x, z, hex = '#e8731d', y = 4.6) {
  const body = sphere(g, solid(hex, 0.35), 3, x, y, z, { seg: 10, sx: 0.7, sy: 0.45, sz: 2.1 });
  body.rotation.y = (x + z) * 0.5;
  return body;
}

// Cattail / reed stalk: slim green blade topped with a brown seed-head.
function cattail(g, x, z, h = 44, base = 5) {
  const stalk = cyl(g, solid('#3f6e30', 0.9), 0.9, h, x, base, z, { rTop: 0.5, seg: 6 });
  stalk.rotation.z = (x % 7 - 3) * 0.02;
  const head = sphere(g, solid('#5a3c22', 0.85), 2.1, x, base + h - 3, z, { seg: 8 });
  head.scale.set(1, 2.6, 1);
}

// A stone bowl (wider at the rim) with a recessed water disc inside it.
function bowl(g, stoneHex, rBot, rTop, h, y, waterR, waterY) {
  cyl(g, solid(stoneHex, 0.9), rBot, h, 0, y, 0, { rTop, seg: 28 });
  cyl(g, water(), waterR, 1.0, 0, waterY, 0, { seg: 28 });
}

// ---- catalog definitions --------------------------------------------------

export const WATER_ITEMS = [
  // 1. Koi pond — rock edge, lily pads, koi, reeds
  {
    id: 'pond_koi', name: 'Koi Pond', cat: 'outdoor', w: 240, d: 180, h: 72, noShadow: true,
    palettes: null, plan: { type: 'pond' },
    build: () => {
      const g = buildPond(240, 180);
      // extra shoreline boulders
      blob(g, '#6f6a5e', '#928c80', 16, -92, 6, 44, { seed: 3, sy: 0.7 });
      blob(g, '#77715f', '#9a9488', 20, 78, 7, -40, { seed: 8, sy: 0.65 });
      blob(g, '#6b665a', '#8d877b', 13, 40, 5, 66, { seed: 5, sy: 0.7 });
      // lily pads
      lilyPad(g, -30, 20, 13);
      lilyPad(g, 12, -14, 11, 5.4, '#37703c');
      lilyPad(g, 44, 30, 15);
      lilyPad(g, -58, -22, 10, 5.4, '#437f47');
      lotus(g, 12, -14);
      // koi
      koi(g, -10, 10, '#e8731d');
      koi(g, 26, -30, '#f2f0ea');
      koi(g, -44, 8, '#e08a2a');
      // reeds
      foliage(g, '#3c6b2e', '#6fa24a', -74, 6, 32, 22, 9, 4);
      cattail(g, -70, 40, 46); cattail(g, -64, 34, 40); cattail(g, -76, 30, 52);
      return g;
    }
  },

  // 2. Lily pond — dense pads and blossoms
  {
    id: 'pond_lily', name: 'Lily Pond', cat: 'outdoor', w: 210, d: 160, h: 32, noShadow: true,
    palettes: null, plan: { type: 'pond' },
    build: () => {
      const g = buildPond(210, 160);
      const pads = [[-40, 18, 14], [8, -10, 12], [42, 26, 15], [-14, 40, 11],
        [30, -34, 13], [-56, -18, 10], [60, -6, 12], [-6, -40, 11]];
      for (const [x, z, r] of pads) lilyPad(g, x, z, r, 5.4, (x + z) % 2 ? '#37703c' : '#458049');
      lotus(g, 8, -10); lotus(g, -40, 18); lotus(g, 42, 26);
      foliage(g, '#3c6b2e', '#6fa24a', -70, 6, 30, 18, 7, 6);
      return g;
    }
  },

  // 3. Natural pond with cattails
  {
    id: 'pond_natural', name: 'Natural Pond', cat: 'outdoor', w: 300, d: 220, h: 76, noShadow: true,
    palettes: null, plan: { type: 'pond' },
    build: () => {
      const g = buildPond(300, 220);
      // clumps of cattails around two shore pockets
      const clump = (cx, cz, n, seed) => {
        foliage(g, '#3a682c', '#6c9e46', cx, 6, cz, 24, 9, seed);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + seed;
          cattail(g, cx + Math.cos(a) * 10, cz + Math.sin(a) * 10, 40 + (i % 3) * 8);
        }
      };
      clump(-104, 60, 6, 2);
      clump(96, -70, 5, 5);
      lilyPad(g, -20, 10, 16); lilyPad(g, 30, 40, 13, 5.4, '#37703c');
      koi(g, 0, 0, '#e08a2a'); koi(g, -30, -20, '#e8731d');
      blob(g, '#6f6a5e', '#928c80', 22, 110, 8, 30, { seed: 9, sy: 0.6 });
      return g;
    }
  },

  // 4. Reflecting pool — formal rectangular basin with stone coping
  {
    id: 'pool_reflecting', name: 'Reflecting Pool', cat: 'outdoor', w: 320, d: 160, h: 16, noShadow: true,
    palettes: null, plan: { type: 'pond' },
    build: () => {
      const g = G();
      const stone = tex('pavement', 1.2, 0.6);
      const dark = solid('#22333a', 0.9);
      // sunken dark basin
      box(g, dark, 300, 12, 140, 0, 0, 0);
      // water sheet inset below the coping
      box(g, water(), 288, 2, 128, 0, 10, 0);
      // coping frame
      const cw = 16;
      box(g, stone, 320, 16, cw, 0, 0, 80 - cw / 2);
      box(g, stone, 320, 16, cw, 0, 0, -(80 - cw / 2));
      box(g, stone, cw, 16, 160 - cw * 2, 160 - cw / 2 - 144, 0, 0);
      box(g, stone, cw, 16, 160 - cw * 2, -(160 - cw / 2 - 144), 0, 0);
      return g;
    }
  },

  // 5. Garden stream segment — narrow rocky watercourse
  {
    id: 'pond_stream', name: 'Garden Stream', cat: 'outdoor', w: 300, d: 90, h: 28, noShadow: true,
    palettes: null, plan: { type: 'pond' },
    build: () => {
      const g = G();
      // bed and water channel
      box(g, solid('#33463a', 0.95), 300, 6, 54, 0, 0, 0, { r: 8 });
      box(g, water(), 288, 2, 42, 0, 5, 0);
      // boulders lining both banks
      let x = -132;
      for (let i = 0; x <= 132; i++, x += 24 + (i % 3) * 6) {
        const side = i % 2 ? 1 : -1;
        blob(g, '#6f6a5e', '#948e82', 8 + (i % 3) * 3, x, 4, side * 30, { seed: i + 2, sy: 0.65 });
      }
      foliage(g, '#3c6b2e', '#6fa24a', -110, 4, 34, 16, 7, 3);
      foliage(g, '#3c6b2e', '#6fa24a', 100, 4, -34, 14, 7, 8);
      return g;
    }
  },

  // 6. Three-tier garden fountain
  {
    id: 'fountain_tier3', name: 'Three-Tier Fountain', cat: 'outdoor', w: 130, d: 130, h: 124, noShadow: true,
    palettes: null, plan: { type: 'box' },
    light: { y: 40, color: '#bfe4f2', intensity: 0.4, distance: 200 },
    build: () => {
      const g = G();
      const s1 = '#b7b0a2', s2 = '#9a9384';
      // ground pool
      cyl(g, solid(s2, 0.9), 62, 16, 0, 0, 0, { seg: 30 });
      cyl(g, water(), 56, 1.2, 0, 15, 0, { seg: 30 });
      // column + tiers
      cyl(g, solid(s1, 0.9), 9, 40, 0, 16, 0);
      bowl(g, s1, 18, 40, 12, 56, 33, 67);
      cyl(g, solid(s1, 0.9), 6, 24, 0, 68, 0);
      bowl(g, s1, 11, 24, 10, 92, 19, 101);
      // finial + water spout column
      cyl(g, solid(s1, 0.9), 4, 8, 0, 102, 0, { rTop: 2 });
      cyl(g, water(), 1.6, 14, 0, 108, 0, { seg: 10 });
      return g;
    }
  },

  // 7. Two-tier garden fountain (classic bowl)
  {
    id: 'fountain_tier2', name: 'Two-Tier Fountain', cat: 'outdoor', w: 110, d: 110, h: 92, noShadow: true,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      const s1 = '#c2bcae', s2 = '#a49d8d';
      cyl(g, solid(s2, 0.9), 52, 16, 0, 0, 0, { seg: 30 });
      cyl(g, water(), 46, 1.2, 0, 15, 0, { seg: 30 });
      cyl(g, solid(s1, 0.9), 11, 46, 0, 16, 0, { rTop: 8 });
      bowl(g, s1, 16, 34, 11, 62, 27, 72);
      cyl(g, solid(s1, 0.9), 5, 8, 0, 73, 0, { rTop: 3 });
      cyl(g, water(), 1.4, 10, 0, 78, 0, { seg: 10 });
      return g;
    }
  },

  // 8. Bird bath
  {
    id: 'fountain_birdbath', name: 'Bird Bath', cat: 'outdoor', w: 60, d: 60, h: 78, noShadow: true,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      const st = '#b4ada0';
      cyl(g, solid('#9a9384', 0.9), 20, 6, 0, 0, 0, { seg: 24 });   // footing
      cyl(g, solid(st, 0.9), 8, 58, 0, 6, 0, { rTop: 10, seg: 20 }); // pedestal
      bowl(g, st, 18, 28, 9, 64, 23, 71);                            // shallow bowl
      // a little bird on the rim
      const bird = sphere(g, solid('#5c6b74', 0.7), 3.4, 20, 76, 4, { seg: 10 });
      bird.scale.set(1, 1.1, 1.5);
      sphere(g, solid('#5c6b74', 0.7), 2, 23, 79, 5, { seg: 8 });
      return g;
    }
  },

  // 9. Bubbling rock fountain
  {
    id: 'fountain_bubble_rock', name: 'Bubbling Rock Fountain', cat: 'outdoor', w: 110, d: 110, h: 66, noShadow: true,
    palettes: null, plan: { type: 'pond' },
    build: () => {
      const g = G();
      // gravel reservoir bed
      cyl(g, tex('gravel', 2, 2), 52, 4, 0, 0, 0, { seg: 30 });
      cyl(g, water(), 46, 0.8, 0, 3.5, 0, { seg: 30 });
      // drilled basalt boulders of varied height
      const cols = [[0, 0, 24, 62], [-26, 14, 15, 40], [22, -18, 13, 34]];
      for (const [x, z, r, h] of cols) {
        blob(g, '#4c4a48', '#6b6864', r, x, h - r, z, { seed: x + z + 3, sy: h / (r * 1.8) });
        // water welling out of the top
        sphere(g, water(), r * 0.4, x, h - r * 0.3, z, { seg: 12, sy: 0.4 });
        cyl(g, water(), r * 0.3, h * 0.5, x, 2, z, { seg: 12 });
      }
      // scattered smaller pebbles
      for (let i = 0; i < 6; i++) {
        const a = i * 1.1;
        blob(g, '#7a746a', '#989187', 5, Math.cos(a) * 40, 4, Math.sin(a) * 40, { seed: i, sy: 0.6 });
      }
      return g;
    }
  },

  // 10. Sphere / orb fountain
  {
    id: 'fountain_orb', name: 'Sphere Fountain', cat: 'outdoor', w: 90, d: 90, h: 82, noShadow: true,
    palettes: null, plan: { type: 'box' },
    light: { y: 60, color: '#cfeaf6', intensity: 0.35, distance: 160 },
    build: () => {
      const g = G();
      // basin
      cyl(g, solid('#8f8879', 0.9), 42, 14, 0, 0, 0, { seg: 30 });
      cyl(g, water(), 36, 1, 0, 13, 0, { seg: 30 });
      // short plinth
      cyl(g, solid('#6f6a5e', 0.85), 14, 10, 0, 14, 0, { seg: 20 });
      // polished granite orb with a thin sheeting water film over it
      sphere(g, solid('#3a3f45', 0.25, 0.2), 26, 0, 50, 0, { seg: 28 });
      const film = sphere(g, water(), 26.6, 0, 50, 0, { seg: 28 });
      film.scale.setScalar(1.01);
      return g;
    }
  },

  // 11. Modern water wall
  {
    id: 'fountain_water_wall', name: 'Modern Water Wall', cat: 'outdoor', w: 130, d: 44, h: 190, noShadow: true,
    palettes: null, plan: { type: 'box' },
    light: { y: 90, color: '#bfe0f0', intensity: 0.4, distance: 220 },
    build: () => {
      const g = G();
      // trough basin
      box(g, solid('#3a3f42', 0.6), 130, 22, 44, 0, 0, 0, { r: 3 });
      box(g, water(), 118, 2, 34, 0, 20, 0);
      // dark stone slab
      box(g, solid('#2b2f33', 0.5), 118, 158, 12, 0, 22, -6, { r: 2 });
      // thin water sheet running down the front face
      box(g, water(), 110, 150, 1.4, 0, 22, 1);
      // stainless top lip where water emerges
      box(g, metal('#c4c9cd', 0.3), 116, 4, 8, 0, 178, -4, { r: 1.5 });
      return g;
    }
  },

  // 12. Wall-spout fountain (courtyard trough)
  {
    id: 'fountain_wall_spout', name: 'Wall-Spout Fountain', cat: 'outdoor', w: 120, d: 40, h: 150, noShadow: true,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      // stone back panel
      box(g, tex('pavement', 1, 1.4), 108, 130, 12, 0, 16, -12, { r: 2 });
      box(g, solid('#8f8879', 0.9), 92, 8, 10, 0, 138, -12);   // cornice
      // trough basin catching the water
      box(g, solid('#9a9384', 0.9), 120, 20, 40, 0, 0, 4, { r: 3 });
      box(g, water(), 108, 2, 30, 0, 18, 4);
      // spout head + falling water column
      cyl(g, metal('#8a6a44', 0.5), 5, 12, 0, 96, -6, { rx: Math.PI / 2 });
      box(g, water(), 6, 78, 1.4, 0, 20, -3);
      return g;
    }
  },

  // 13. Japanese tsukubai basin
  {
    id: 'fountain_tsukubai', name: 'Tsukubai Basin', cat: 'outdoor', w: 120, d: 120, h: 70, noShadow: true,
    palettes: null, plan: { type: 'pond' },
    build: () => {
      const g = G();
      // raked gravel ground
      cyl(g, tex('gravel', 2.4, 2.4), 58, 3, 0, 0, 0, { seg: 30 });
      // carved stone water basin (chozubachi)
      cyl(g, solid('#6f6a5e', 0.92), 20, 26, -8, 3, -6, { seg: 8 });
      cyl(g, solid('#4a463d', 0.9), 15, 4, -8, 25, -6, { seg: 8 });     // hollow rim shadow
      cyl(g, water(), 14, 1.2, -8, 27, -6, { seg: 20 });
      // bamboo spout (kakei) pouring over the basin
      cyl(g, solid('#c7ad63', 0.6), 12, 40, -8, 3, 34, { seg: 8 });     // upright post
      cyl(g, solid('#cdb469', 0.55), 3, 34, -8, 38, 16, { rx: Math.PI / 2.4, seg: 10 }); // angled spout
      cyl(g, water(), 1.2, 14, -8, 28, -2, { seg: 8 });                 // thin water stream
      // surrounding accent stones
      blob(g, '#6b665a', '#8d877b', 12, 34, 4, 16, { seed: 4, sy: 0.6 });
      blob(g, '#726c60', '#948e82', 9, 24, 3, -30, { seed: 7, sy: 0.6 });
      foliage(g, '#3c6b2e', '#6fa24a', -34, 4, 24, 16, 7, 5);
      return g;
    }
  },

  // 14. Pondless waterfall
  {
    id: 'fountain_pondless_fall', name: 'Pondless Waterfall', cat: 'outdoor', w: 160, d: 130, h: 90, noShadow: true,
    palettes: null, plan: { type: 'pond' },
    build: () => {
      const g = G();
      // gravel catch basin (hidden reservoir look)
      cyl(g, tex('gravel', 2.4, 2.4), 60, 4, 0, 0, 40, { seg: 30 });
      cyl(g, water(), 40, 0.8, 0, 3.5, 44, { seg: 24 });
      // stacked boulder mound rising toward the back
      const rocks = [[0, -34, 30, 34], [-34, -22, 22, 24], [34, -20, 24, 26],
        [-14, -6, 20, 16], [18, -4, 18, 14], [0, 12, 22, 8]];
      for (const [x, z, r, h] of rocks) {
        blob(g, '#5f5a50', '#847e72', r, x, h, z, { seed: x - z + 5, sy: 0.7 });
      }
      // cascading water sheets down the face
      box(g, water(), 26, 30, 1.4, 0, 34, -14, { rx: -0.5 });
      box(g, water(), 30, 26, 1.4, 0, 14, 2, { rx: -0.35 });
      cyl(g, water(), 14, 12, 0, 3, 30, { seg: 20 });
      foliage(g, '#3c6b2e', '#6fa24a', -46, 6, 6, 18, 7, 2);
      foliage(g, '#3c6b2e', '#6fa24a', 46, 6, 10, 16, 7, 9);
      return g;
    }
  },

  // 15. Rain-chain basin
  {
    id: 'fountain_rain_chain', name: 'Rain Chain Basin', cat: 'outdoor', w: 70, d: 70, h: 150, noShadow: true,
    palettes: null, plan: { type: 'box' },
    build: () => {
      const g = G();
      // ground basin
      cyl(g, solid('#8f8879', 0.9), 32, 14, 0, 0, 0, { seg: 26 });
      cyl(g, water(), 26, 1, 0, 13, 0, { seg: 26 });
      // simple support arm the chain hangs from
      cyl(g, metal('#4b4f52', 0.4), 3, 132, -22, 14, 0);
      box(g, metal('#4b4f52', 0.4), 30, 4, 4, -8, 142, 0);
      // copper cups descending, linked by thin water threads
      const cop = metal('#9c6b3f', 0.4);
      for (let i = 0; i < 6; i++) {
        const y = 130 - i * 19;
        cyl(g, cop, 5, 6, 6, y, 0, { rTop: 7, seg: 12 });
        cyl(g, water(), 5.5, 1, 6, y + 5, 0, { seg: 12 });
        if (i < 5) cyl(g, water(), 1.1, 13, 6, y - 8, 0, { seg: 8 });
      }
      cyl(g, water(), 1.1, 12, 6, 22, 0, { seg: 8 });  // final drop into basin
      return g;
    }
  }
];
