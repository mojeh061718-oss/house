// Garden & flowers pack — drawable garden beds, real roses / hydrangeas /
// peonies, flower beds and showpiece trees. Built on the botanical library in
// src/catalog/flowers.js (whorled blooms, real bush architecture) so flowers
// have petals and bushes have branches — never lone green spheres.
// All sizes cm, base at y=0, front +Z. Drawables (areaDraw) rebuild through
// buildSized(pal, w, d) with deterministic, size-scaled planting.
import {
  G, box, cyl, sphere, segment, strut, blob, lathe, torus,
  solid, wood, metal, buildTallGrass
} from '../builders.js';
import {
  bloomRose, bloomDaisy, bloomSunflower, bloomTulip, spikeLavender,
  bloomHydrangea, flowerStem, bushMass, studBlooms, shadeHex
} from '../flowers.js';

const rng = (seed) => {
  let s = (Math.round(seed) * 2654435761) >>> 0 || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
};

/** positioned sub-group — plants potted above y=0 build into one of these */
function sub(parent, x, y, z) {
  const s = G();
  s.position.set(x, y, z);
  parent.add(s);
  return s;
}

const soilMat = () => solid('#3a2d1f', 0.98);

/** small unopened rose bud on a canopy shell (2 meshes) */
function roseBud(g, hex, r, x, y, z) {
  sphere(g, solid('#33582a', 0.85), r * 0.72, x, y - r * 0.7, z, { sy: 1.2, seg: 8 });
  sphere(g, solid(hex, 0.62), r, x, y, z, { sy: 1.35, seg: 8 });
}

/** open field poppy: 4 cupped scarlet petals + dark eye (5 meshes) */
function bloomPoppy(g, r, x, y, z, seed = 1) {
  const rand = rng(seed);
  const p = solid('#c1372b', 0.6);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + rand() * 0.8;
    const m = sphere(g, p, r, x + Math.cos(a) * r * 0.55, y, z + Math.sin(a) * r * 0.55,
      { sx: 0.8, sy: 0.42, seg: 8 });
    m.rotation.y = -a;
    m.rotation.z = 0.3 + rand() * 0.25;
  }
  sphere(g, solid('#241c12', 0.9), r * 0.3, x, y + r * 0.14, z, { sy: 0.8, seg: 8 });
}

/** one leafy crop head (1 mesh) */
const lettuce = (g, r, x, z, seed, y0 = 0) =>
  blob(g, '#47702c', '#8fb54e', r, x, y0 + r * 0.55, z, { seed, sy: 0.72, amp: 0.09, detail: 3 });
const cabbage = (g, r, x, z, seed, y0 = 0) =>
  blob(g, '#4e7a63', '#98b89c', r, x, y0 + r * 0.58, z, { seed, sy: 0.78, amp: 0.07, detail: 3 });

// ---------------------------------------------------------------------------
// drawable builders
// ---------------------------------------------------------------------------

/** Raised bed: timber border, dark soil, a deterministic mixed planting of
 *  roses / daisies / tulips / leafy greens scaled to the dragged area. */
function buildGardenBed(p, w, d) {
  const g = G();
  const rand = rng(w * 7.3 + d * 13.7);
  const bw = wood(p.frame, 0.62);
  const t = 7, H = 26;
  box(g, bw, w, H, t, 0, 0, -(d - t) / 2, { r: 1.2 });                 // border rails
  box(g, bw, w, H, t, 0, 0, (d - t) / 2, { r: 1.2 });
  box(g, bw, t, H, d - t * 2 - 2, -(w - t) / 2, 0, 0, { r: 1.2 });
  box(g, bw, t, H, d - t * 2 - 2, (w - t) / 2, 0, 0, { r: 1.2 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1])                  // corner posts
    box(g, bw, t + 3.5, H + 4, t + 3.5, sx * (w - t) / 2, 0, sz * (d - t) / 2, { r: 1.4 });
  box(g, soilMat(), w - t * 2 - 3, 19, d - t * 2 - 3, 0, 0, 0, { r: 2 }); // soil, below rim
  const mr = Math.min(w, d);
  blob(g, '#33281a', '#57452d', mr * 0.16, -w * 0.22, 11, d * 0.14, { seed: 5, sy: 0.4, amp: 0.1 });
  blob(g, '#382c1c', '#5c4a30', mr * 0.13, w * 0.26, 11, -d * 0.16, { seed: 9, sy: 0.4, amp: 0.1 });
  if (w > 110 && d > 70) {                                             // trowel left in the dirt
    const tx = w / 2 - t - 13, tz = -d / 2 + t + 11;
    segment(g, wood('#7b5a38', 0.5), [tx - 5, 35, tz - 4], [tx, 26, tz], 1.5, 1.5, 8);
    segment(g, metal('#b8bcc0', 0.35), [tx, 26, tz], [tx + 3.5, 16, tz + 2.5], 2.4, 1.0, 8);
  }
  // planting: jittered grid spread over the WHOLE bed, mix cycles
  // rose → daisy → tulip → greens
  const pg = sub(g, 0, 18, 0);
  const iw = Math.max(30, w - t * 2 - 18), idp = Math.max(20, d - t * 2 - 18);
  const n = Math.max(8, Math.min(24, Math.round((iw * idp) / 1150)));
  const cols = Math.max(1, Math.round(Math.sqrt(n * iw / idp)));
  const rows = Math.max(1, Math.ceil(n / cols));
  const total = rows * cols;
  const mix = [0, 1, 2, 3, 2, 1, 3, 2, 1];
  const tulipCols = ['#d8385e', '#e8b520', '#e9e3d2'];
  let k = 0;
  for (let idx = 0; idx < total; idx++) {
    if (Math.round(idx * n / total) === Math.round((idx + 1) * n / total)) continue;
    const ri = Math.floor(idx / cols), ci = idx % cols;
    const x = -iw / 2 + (ci + 0.5) * iw / cols + (rand() - 0.5) * iw / cols * 0.5;
    const z = -idp / 2 + (ri + 0.5) * idp / rows + (rand() - 0.5) * idp / rows * 0.5;
    const kind = mix[k % mix.length];
    if (kind === 0) {
      const tip = flowerStem(pg, x, z, 26, k + 3);
      bloomRose(pg, '#c22c46', 6, tip.x, tip.y + 4, tip.z, k + 3);
    } else if (kind === 1) {
      const tip = flowerStem(pg, x, z, 19 + rand() * 8, k + 5);
      bloomDaisy(pg, '#f4f2ea', '#e8b520', 4.3, tip.x, tip.y + 2, tip.z, k + 5, (rand() - 0.5) * 0.4);
    } else if (kind === 2) {
      const tip = flowerStem(pg, x, z, 21 + rand() * 6, k + 7);
      bloomTulip(pg, tulipCols[k % 3], 4.5, tip.x, tip.y + 3.5, tip.z, k + 7);
    } else {
      lettuce(pg, 8.5 + rand() * 2.5, x, z, k + 31);
    }
    k++;
  }
  return g;
}

/** Meadow: instanced grasses with daisies and poppies nodding above them. */
function buildMeadow(p, w, d) {
  const g = G();
  g.add(buildTallGrass(p, w, d));
  const rand = rng(w * 3.1 + d * 17.9);
  const n = Math.max(6, Math.min(18, Math.round((w * d) / 6000)));
  for (let i = 0; i < n; i++) {
    const x = (rand() - 0.5) * (w - 26);
    const z = (rand() - 0.5) * (d - 26);
    const h = (p.height || 50) * (0.8 + rand() * 0.35) + 16;   // blooms clear the grass
    const tip = flowerStem(g, x, z, h, i + 3);
    if (i % 2) bloomDaisy(g, '#f4f2ea', '#e8b520', 4.8, tip.x, tip.y + 2, tip.z, i + 5, (rand() - 0.5) * 0.5);
    else bloomPoppy(g, 4.4, tip.x, tip.y + 2, tip.z, i + 11);
  }
  return g;
}

/** Kitchen garden: tilled plot, mounded crop rows — leafy greens, cabbages,
 *  and a back row of caged tomatoes. Row/plant counts follow the drag. */
function buildVeggie(p, w, d) {
  const g = G();
  const rand = rng(w * 5.7 + d * 11.3);
  const loam = p.loam || '#4a3826';
  box(g, solid(shadeHex(loam, -14), 0.98), w, 6, d, 0, 0, 0, { r: 2 });
  const rows = Math.max(2, Math.min(5, Math.floor(d / 55)));
  const gap = d / rows;
  for (let ri = 0; ri < rows; ri++) {
    const z = -d / 2 + (ri + 0.5) * gap;
    box(g, solid(loam, 0.95), w - 22, 8, Math.min(26, gap * 0.55), 0, 4, z, { r: 4 });
    const kind = ri === rows - 1 ? 2 : ri % 2;                         // tomatoes at the back
    if (kind === 2) {
      const nT = Math.max(2, Math.min(6, Math.floor((w - 50) / 60)));
      const sx = (w - 70) / Math.max(1, nT - 1);
      for (let i = 0; i < nT; i++) {
        const x = -(w - 70) / 2 + i * sx;
        cyl(g, wood('#8a6a44', 0.7), 1.4, 78, x, 8, z, { seg: 8 });    // stake
        const cage = metal('#9aa0a4', 0.4);
        torus(g, cage, 11, 0.7, x, 32, z, { seg: 20, tubeSeg: 6 });
        torus(g, cage, 9, 0.7, x, 56, z, { seg: 20, tubeSeg: 6 });
        blob(g, '#2f5a26', '#5d8f3a', 13, x, 42, z, { seed: ri * 31 + i * 7 + 3, sy: 1.3, amp: 0.12, detail: 3 });
        sphere(g, solid('#c0392b', 0.45), 3.4, x + 9, 36, z + 9, { seg: 10 });
        sphere(g, solid('#d3502e', 0.45), 3.0, x - 9.5, 47, z - 7, { seg: 10 });
      }
    } else {
      const nH = Math.max(3, Math.min(9, Math.floor((w - 40) / 34)));
      const sx = (w - 56) / Math.max(1, nH - 1);
      for (let i = 0; i < nH; i++) {
        const x = -(w - 56) / 2 + i * sx + (rand() - 0.5) * 5;
        const zz = z + (rand() - 0.5) * 5;
        if (kind === 0) lettuce(g, 8 + rand() * 2.5, x, zz, ri * 17 + i * 5 + 1, 8);
        else cabbage(g, 8.5 + rand() * 2, x, zz, ri * 19 + i * 3 + 2, 8);
      }
    }
  }
  return g;
}

// ---------------------------------------------------------------------------
// the pack
// ---------------------------------------------------------------------------

export const GARDEN_ITEMS = [
  // ---- 1. Raised garden bed (drag-to-size) ---------------------------------
  {
    id: 'garden_bed', name: 'Garden Bed', cat: 'garden', w: 240, d: 120, h: 55,
    areaDraw: true, plan: { type: 'grass' },
    palettes: [
      { name: 'Cedar', chip: '#8f6a44', frame: '#8f6a44' },
      { name: 'Weathered Grey', chip: '#8d8a80', frame: '#8d8a80' },
      { name: 'Dark Timber', chip: '#4a3b2c', frame: '#4a3b2c' }
    ],
    build: (p) => buildGardenBed(p, 240, 120),
    buildSized: (p, w, d) => buildGardenBed(p, w, d)
  },
  // ---- 2. Wildflower meadow (drag-to-size) ----------------------------------
  {
    id: 'wildflower_meadow', name: 'Wildflower Meadow', cat: 'garden', w: 300, d: 220, h: 68,
    areaDraw: true, plan: { type: 'grass' },
    palettes: [
      { name: 'Summer Meadow', chip: '#6d8a42', base: '#4b6330', tips: '#8fae54', height: 46 },
      { name: 'Golden Prairie', chip: '#9a8f52', base: '#6b6d38', tips: '#c2b46a', height: 54 }
    ],
    build: (p) => buildMeadow(p, 300, 220),
    buildSized: (p, w, d) => buildMeadow(p, w, d)
  },
  // ---- 3. Veggie garden (drag-to-size) ---------------------------------------
  {
    id: 'veggie_garden', name: 'Veggie Garden', cat: 'garden', w: 300, d: 200, h: 90,
    areaDraw: true, plan: { type: 'grass' },
    palettes: [
      { name: 'Rich Loam', chip: '#4a3826', loam: '#4a3826' },
      { name: 'Red Clay', chip: '#5f4030', loam: '#5f4030' }
    ],
    build: (p) => buildVeggie(p, 300, 200),
    buildSized: (p, w, d) => buildVeggie(p, w, d)
  },
  // ---- 4. Rose bush ------------------------------------------------------------
  {
    id: 'rose_bush', name: 'Rose Bush', cat: 'garden', w: 110, d: 110, h: 100,
    palettes: [
      { name: 'Crimson', chip: '#c22c46', bloom: '#c22c46' },
      { name: 'Pink', chip: '#dc6f93', bloom: '#dc6f93' },
      { name: 'White', chip: '#ede7da', bloom: '#ede7da' }
    ],
    plan: { type: 'plant' },
    build: (p) => {
      const g = G();
      bushMass(g, 102, 80, 102, { seed: 11, clusters: 6 });
      // hand-set blooms nesting into the sunlit crown so every angle shows roses
      bloomRose(g, p.bloom, 7.2, 28, 72, 22, 21);
      bloomRose(g, shadeHex(p.bloom, 16), 7, -25, 67, 13, 24);
      bloomRose(g, p.bloom, 6.8, -12, 73, -32, 27);
      bloomRose(g, shadeHex(p.bloom, 16), 7, 34, 63, -20, 30);
      studBlooms(g, 90, 74, 90, 6, 77, (gg, x, y, z) =>
        roseBud(gg, p.bloom, 2.6, x, y, z));
      return g;
    }
  },
  // ---- 5. Hydrangea shrub -------------------------------------------------------
  {
    id: 'hydrangea_shrub', name: 'Hydrangea', cat: 'garden', w: 130, d: 130, h: 92,
    palettes: [
      { name: 'Sky Blue', chip: '#7d9bd8', bloom: '#7d9bd8' },
      { name: 'Lilac', chip: '#a888d4', bloom: '#a888d4' },
      { name: 'Snowball', chip: '#e9ecdf', bloom: '#e9ecdf' }
    ],
    plan: { type: 'plant' },
    build: (p) => {
      const g = G();
      bushMass(g, 118, 46, 118, { seed: 31, clusters: 5 });
      // mopheads on short stems held fully PROUD of the leaf mound —
      // hydrangeas read as flowers first, foliage second
      const hs = [[-32, 64, 22, 17, 0], [36, 66, 8, 16, 14], [-6, 70, -30, 16, -12]];
      const stemM = solid('#4e7a34', 0.85);
      for (let i = 0; i < hs.length; i++) {
        const [hx, hy, hz, hr, sh] = hs[i];
        segment(g, stemM, [hx * 0.5, 26, hz * 0.5], [hx, hy - hr * 0.5, hz], 1.4, 1, 6);
        bloomHydrangea(g, sh ? shadeHex(p.bloom, sh) : p.bloom, hr, hx, hy, hz, i * 6 + 7);
      }
      blob(g, '#9ab365', '#c4d489', 8, -44, 38, -20, { seed: 51, amp: 0.09 }); // lime bud
      return g;
    }
  },
  // ---- 6. Peony bush --------------------------------------------------------------
  {
    id: 'peony_bush', name: 'Peony Bush', cat: 'garden', w: 95, d: 95, h: 78,
    palettes: [
      { name: 'Blush', chip: '#dd88a5', bloom: '#dd88a5' },
      { name: 'Coral', chip: '#d95f57', bloom: '#d95f57' },
      { name: 'Ivory', chip: '#efe8d8', bloom: '#efe8d8' }
    ],
    plan: { type: 'plant' },
    build: (p) => {
      const g = G();
      bushMass(g, 88, 54, 88, { seed: 11, clusters: 6 });
      bloomRose(g, p.bloom, 10, -22, 58, 16, 4);                       // fat ruffled peonies
      bloomRose(g, shadeHex(p.bloom, 14), 9.5, 26, 62, -10, 9);
      bloomRose(g, p.bloom, 9, 6, 54, 32, 14);
      bloomRose(g, shadeHex(p.bloom, -10), 8.5, -28, 50, -26, 17);
      roseBud(g, shadeHex(p.bloom, -18), 2.8, -36, 40, 10);
      roseBud(g, shadeHex(p.bloom, -18), 2.6, 18, 42, 30);
      roseBud(g, shadeHex(p.bloom, -18), 2.6, 34, 38, -14);
      return g;
    }
  },
  // ---- 7. Lavender row --------------------------------------------------------------
  {
    id: 'lavender_row', name: 'Lavender Row', cat: 'garden', w: 150, d: 55, h: 58,
    palettes: null, plan: { type: 'hedge' },
    build: () => {
      const g = G();
      // silvery mounded foliage base — four rounder, deeper cushions
      blob(g, '#4d5c42', '#78895f', 20, -52, 11, 0, { seed: 3, sy: 0.72, amp: 0.09 });
      blob(g, '#495842', '#728358', 22, -14, 12, 3, { seed: 7, sy: 0.7, amp: 0.09 });
      blob(g, '#4d5c42', '#7d8f66', 21, 22, 11, -3, { seed: 13, sy: 0.72, amp: 0.09 });
      blob(g, '#495842', '#75875e', 19, 54, 10, 2, { seed: 17, sy: 0.7, amp: 0.09 });
      const rand = rng(29);
      for (let i = 0; i < 16; i++) {
        const x = -62 + (i / 15) * 124 + (rand() - 0.5) * 10;
        const z = (rand() - 0.5) * 18;
        spikeLavender(g, x, z, 30 + rand() * 14, i + 3);
      }
      return g;
    }
  },
  // ---- 8. Tulip bed ------------------------------------------------------------------
  {
    id: 'tulip_bed', name: 'Tulip Bed', cat: 'garden', w: 110, d: 70, h: 50,
    palettes: [
      { name: 'Festival Mix', chip: '#d8385e', cols: ['#d8385e', '#e8b520', '#c9498f', '#efe9d8'] },
      { name: 'Red & Gold', chip: '#cf3227', cols: ['#cf3227', '#e8b520'] },
      { name: 'Blush & Ivory', chip: '#dc86b4', cols: ['#dc86b4', '#efe9d8'] }
    ],
    plan: { type: 'plant' },
    build: (p) => {
      const g = G();
      const mound = blob(g, '#33281a', '#57452d', 40, 0, 2, 0, { seed: 3, sy: 0.14, amp: 0.06 });
      mound.scale.x = 1.25;
      const rand = rng(17);
      for (let i = 0; i < 8; i++) {
        const x = (i % 4 - 1.5) * 24 + (rand() - 0.5) * 8;
        const z = (Math.floor(i / 4) - 0.5) * 26 + (rand() - 0.5) * 8;
        const tip = flowerStem(g, x, z, 24 + (i % 3) * 5, i + 11);
        bloomTulip(g, p.cols[i % p.cols.length], 4.8, tip.x, tip.y + 3.5, tip.z, i + 11);
      }
      return g;
    }
  },
  // ---- 9. Daisy patch ------------------------------------------------------------------
  {
    id: 'daisy_patch', name: 'Daisy Patch', cat: 'garden', w: 90, d: 90, h: 44,
    palettes: [
      { name: 'Shasta White', chip: '#f4f2ea', petal: '#f4f2ea', eye: '#e8b520' },
      { name: 'Golden', chip: '#eda23c', petal: '#eda23c', eye: '#8a5a1c' },
      { name: 'Pink Cosmos', chip: '#e394b8', petal: '#e394b8', eye: '#caa22c' }
    ],
    plan: { type: 'plant' },
    build: (p) => {
      const g = G();
      blob(g, '#375c28', '#5f8a3a', 11, -14, 3.5, 8, { seed: 3, sy: 0.45, amp: 0.1 });
      blob(g, '#33562a', '#578338', 10, 17, 3, -11, { seed: 9, sy: 0.45, amp: 0.1 });
      blob(g, '#375c28', '#638e3e', 9, -19, 2.8, -18, { seed: 15, sy: 0.45, amp: 0.1 });
      blob(g, '#33562a', '#5b8738', 8.5, 8, 2.6, 20, { seed: 21, sy: 0.45, amp: 0.1 });
      for (let i = 0; i < 6; i++) {
        const a = i * (Math.PI / 3) + 0.4, rr = 12 + (i % 3) * 11;
        const tip = flowerStem(g, Math.cos(a) * rr, Math.sin(a) * rr, 20 + (i % 3) * 5, i + 5);
        bloomDaisy(g, p.petal, p.eye, 5.2, tip.x, tip.y + 2, tip.z, i + 5, (i % 3 - 1) * 0.22);
      }
      return g;
    }
  },
  // ---- 10. Sunflower stand ------------------------------------------------------------
  {
    id: 'sunflower_stand', name: 'Sunflowers', cat: 'garden', w: 100, d: 80, h: 175,
    palettes: null, plan: { type: 'plant' },
    build: () => {
      const g = G();
      const stemM = solid('#4e7a34', 0.85);
      const leafM = solid('#41692c', 0.85);
      const spots = [[-30, -8, 126], [4, 14, 156], [34, -16, 140]];
      spots.forEach(([x, z, h], i) => {
        segment(g, stemM, [x, 0, z], [x + 4, h, z], 1.7, 1.0, 7);
        for (let L = 0; L < 3; L++) {
          const ly = h * (0.25 + L * 0.2);
          const leaf = sphere(g, leafM, 13, x, ly, z, { sy: 0.14, sz: 0.5, seg: 8 });
          leaf.rotation.y = L * 2.2 + i;
          leaf.rotation.z = 0.45;
          leaf.translateX(10);
        }
        const head = bloomSunflower(g, 14 + (i % 2) * 2, x + 4, h + 2, z, i + 2);
        head.rotation.y = 0.2 + (i - 1) * 0.35;      // the stand tracks the sun together
        head.rotation.x = 0.5 + (i % 3) * 0.12;      // heavy heads nod down and out
      });
      // one young stem still in bud
      segment(g, stemM, [-8, 0, -22], [-6, 86, -22], 1.4, 0.9, 7);
      sphere(g, leafM, 5.5, -6, 88, -22, { seg: 10 });
      const bl = sphere(g, leafM, 9, -8, 52, -22, { sy: 0.14, sz: 0.5, seg: 8 });
      bl.rotation.y = 2.6;
      bl.rotation.z = 0.45;
      bl.translateX(7);
      return g;
    }
  },
  // ---- 11. Flowering cherry --------------------------------------------------------------
  {
    id: 'flowering_cherry', name: 'Flowering Cherry', cat: 'garden', w: 300, d: 300, h: 310,
    palettes: null, plan: { type: 'plant' },
    build: () => {
      const g = G();
      const bark = solid('#463229', 0.9);
      segment(g, bark, [0, 0, 0], [3, 75, 2], 15, 10.5, 12);
      const arms = [[-98, 185, 30], [88, 200, -55], [20, 210, 95], [-45, 195, -90], [55, 235, 40]];
      for (const [tx, ty, tz] of arms) {
        segment(g, bark, [1, 62, 1], [tx * 0.55, 132, tz * 0.55], 7.5, 4.6, 8);
        segment(g, bark, [tx * 0.55, 132, tz * 0.55], [tx, ty, tz], 4.6, 2.2, 7);
      }
      // pink blossom clouds at the branch tips + a full center crown
      const A = '#c47a95', B = '#f2cdd9';
      arms.forEach(([tx, ty, tz], i) => {
        blob(g, A, B, 46 + (i % 3) * 5, tx * 0.92, ty + 8, tz * 0.92, { seed: 21 + i * 3, sy: 0.8, amp: 0.09 });
      });
      blob(g, '#b96e8a', '#eec3d2', 52, -4, 248, -4, { seed: 40, sy: 0.78, amp: 0.09 });
      blob(g, A, B, 38, -34, 170, 58, { seed: 44, sy: 0.75, amp: 0.1 });
      blob(g, A, B, 34, 48, 176, -64, { seed: 47, sy: 0.75, amp: 0.1 });
      // fallen petals drifted at the drip line
      sphere(g, solid('#ecc7d4', 0.85), 15, 92, 0.4, 42, { sy: 0.045, seg: 10 });
      sphere(g, solid('#f0d2dd', 0.85), 11, -70, 0.35, -58, { sy: 0.045, seg: 10 });
      sphere(g, solid('#ecc7d4', 0.85), 9, -12, 0.3, 96, { sy: 0.045, seg: 10 });
      return g;
    }
  },
  // ---- 12. Japanese maple -----------------------------------------------------------------
  {
    id: 'japanese_maple', name: 'Japanese Maple', cat: 'garden', w: 250, d: 250, h: 220,
    palettes: null, plan: { type: 'plant' },
    build: () => {
      const g = G();
      const bark = solid('#3e3230', 0.9);
      // sinuous low-branching multi-stem, KEPT VISIBLE below a raised canopy
      segment(g, bark, [0, 0, 0], [-8, 62, 4], 11, 7, 10);
      segment(g, bark, [-8, 62, 4], [-36, 122, 12], 7, 3.2, 8);
      segment(g, bark, [-6, 46, 2], [36, 114, -18], 6.5, 3.0, 8);
      segment(g, bark, [-8, 58, 4], [4, 152, 20], 5.5, 2.4, 8);
      segment(g, bark, [-5, 32, 2], [-48, 100, -36], 5.5, 2.6, 8);
      segment(g, bark, [-6, 38, 3], [50, 92, 36], 5, 2.4, 8);
      // layered tiers of deep crimson held clear of the trunk — the maple
      // signature: a broad, low dome floating over sinuous stems
      const A = '#4c130d', B = '#7e2317', C = '#96321d';
      blob(g, A, B, 54, -34, 118, 10, { seed: 3, sy: 0.52, amp: 0.09 });
      blob(g, A, B, 50, 34, 110, -16, { seed: 7, sy: 0.52, amp: 0.09 });
      blob(g, A, C, 44, 2, 146, 14, { seed: 11, sy: 0.56, amp: 0.09 });
      blob(g, A, B, 34, -48, 100, -34, { seed: 15, sy: 0.5, amp: 0.1 });
      blob(g, A, B, 32, 50, 94, 36, { seed: 19, sy: 0.5, amp: 0.1 });
      blob(g, A, C, 26, -6, 172, -2, { seed: 23, sy: 0.6, amp: 0.09 });
      return g;
    }
  },
  // ---- 13. Shade oak (clustered crown, not one blob) ---------------------------------------
  {
    id: 'shade_oak', name: 'Shade Oak', cat: 'garden', w: 340, d: 340, h: 360,
    palettes: null, plan: { type: 'plant' },
    build: () => {
      const g = G();
      const bark = solid('#4c3a28', 0.95);
      cyl(g, bark, 26, 30, 0, 0, 0, { rTop: 19, seg: 14 });            // root flare
      cyl(g, bark, 19, 145, 0, 25, 0, { rTop: 12, seg: 14 });          // main trunk
      // five scaffold limbs, each carrying its own irregular bushMass cluster
      const tips = [[95, 215, 55], [-100, 228, -30], [25, 240, -100], [-42, 222, 85], [5, 278, 5]];
      tips.forEach(([tx, ty, tz], i) => {
        segment(g, bark, [0, 138 + i * 5, 0], [tx * 0.6, ty - 55, tz * 0.6], 8, 5, 8);
        segment(g, bark, [tx * 0.6, ty - 55, tz * 0.6], [tx, ty, tz], 5, 2.6, 7);
        const c = sub(g, tx, ty - 62, tz);
        const cw = i === 4 ? 108 : 135;
        bushMass(c, cw, 112, cw, { seed: 5 + i * 9, clusters: 4, bark: '#4c3a28' });
      });
      // core filler so the clustered crown never reads as a donut
      blob(g, '#2e5220', '#5d8a36', 48, 0, 218, 0, { seed: 77, sy: 0.9, amp: 0.09 });
      return g;
    }
  },
  // ---- 14. Birch clump (3 white trunks) ------------------------------------------------------
  {
    id: 'birch_clump', name: 'Birch Clump', cat: 'garden', w: 230, d: 230, h: 380,
    palettes: null, plan: { type: 'plant' },
    build: () => {
      const g = G();
      const bark = solid('#dad3c4', 0.85);
      const scar = solid('#43413a', 0.9);
      const trunks = [[-26, -6, -88, -30, 328], [24, 14, 78, 40, 352], [8, -28, 42, -96, 292]];
      trunks.forEach(([x0, z0, x1, z1, th], ti) => {
        const mid = [x0 + (x1 - x0) * 0.4, th * 0.5, z0 + (z1 - z0) * 0.4];
        segment(g, bark, [x0, 0, z0], mid, 9, 6.2, 10);
        segment(g, bark, mid, [x1, th, z1], 6.2, 3, 9);
        for (let si = 0; si < 4; si++) {                               // dark bark scars
          const t = 0.1 + si * 0.17;
          const fx = t < 0.5 ? x0 + (x1 - x0) * 0.8 * t : mid[0] + (x1 - mid[0]) * (t - 0.5) * 2;
          const fz = t < 0.5 ? z0 + (z1 - z0) * 0.8 * t : mid[2] + (z1 - mid[2]) * (t - 0.5) * 2;
          const py = th * t;
          const rAt = 9 - t * 5.6, a = ti * 2.1 + si * 1.9;
          const m = box(g, scar, 4 + (si % 3) * 2.5, 2.2, 1.2,
            fx + Math.cos(a) * (rAt - 0.3), py, fz + Math.sin(a) * (rAt - 0.3), { r: 0.6 });
          m.rotation.y = -a + Math.PI / 2;
        }
        // fuller yellow-green crown filling the top third of each leader
        blob(g, '#557f33', '#a2c266', 44 - ti * 4, x1, th - 20, z1, { seed: 60 + ti * 7, sy: 1.0, amp: 0.1 });
        blob(g, '#4f7830', '#98ba5e', 34, x1 * 0.8 + 16, th - 70, z1 * 0.8 + 10, { seed: 63 + ti * 7, sy: 0.9, amp: 0.1 });
        blob(g, '#557f33', '#a6c46a', 30, x1 * 0.75 - 20, th - 48, z1 * 0.75 - 14, { seed: 66 + ti * 7, sy: 0.95, amp: 0.1 });
        blob(g, '#4f7830', '#9cbc60', 26, x1 * 0.6, th - 108, z1 * 0.6, { seed: 69 + ti * 7, sy: 0.85, amp: 0.1 });
      });
      blob(g, '#527c31', '#9cbc60', 46, 0, 280, -10, { seed: 71, sy: 0.95, amp: 0.1 }); // shared fill
      return g;
    }
  },
  // ---- 15. Window box (wall) -------------------------------------------------------------------
  {
    id: 'window_box', name: 'Window Box', cat: 'garden', w: 85, d: 26, h: 45,
    mount: 'wall', elevation: 95,
    palettes: [
      { name: 'White', chip: '#eae6da', body: '#eae6da', kind: 'paint' },
      { name: 'Cedar', chip: '#8f6a44', body: '#8f6a44', kind: 'wood' },
      { name: 'Charcoal', chip: '#3b3d3f', body: '#3b3d3f', kind: 'paint' }
    ],
    plan: { type: 'wallDecor' },
    build: (p) => {
      const g = G();
      const bw = p.kind === 'wood' ? wood(p.body, 0.6) : solid(p.body, 0.55);
      box(g, bw, 78, 20, 19, 0, 5, 11.5, { r: 1.2 });                  // trough
      box(g, bw, 82, 3.5, 22, 0, 25, 11.5, { r: 1 });                  // rim band
      const ir = metal('#333538', 0.45);
      for (const s of [-1, 1]) {                                       // iron brackets
        strut(g, ir, s * 30, 0, 1.5, s * 30, 5.5, 19, 1.2);
        strut(g, ir, s * 30, 0, 1.5, s * 30, 12, 2, 1.1);
      }
      box(g, soilMat(), 72, 2.5, 15, 0, 27.2, 11.5, { r: 1 });         // mounded soil
      const fg = sub(g, 0, 29, 11.5);
      // two daisies + three geranium clusters + ivy trailing over the front
      let tip = flowerStem(fg, -26, 2, 12, 3);
      bloomDaisy(fg, '#f4f2ea', '#e8b520', 3.6, tip.x, tip.y + 1.5, tip.z, 3, 0.2);
      tip = flowerStem(fg, 24, -3, 14, 7);
      bloomDaisy(fg, '#f4f2ea', '#e8b520', 3.4, tip.x, tip.y + 1.5, tip.z, 7, -0.25);
      const ger = solid('#c0392b', 0.55);
      const gLeaf = solid('#3f6b2e', 0.85);
      for (const [gx, gz, gh] of [[-10, -2, 8], [4, 3, 10], [13, -3, 7]]) {
        segment(fg, gLeaf, [gx, 0, gz], [gx + 1, gh, gz], 0.7, 0.5, 6);
        sphere(fg, gLeaf, 3.4, gx + 0.5, gh - 3.5, gz, { sy: 0.4, seg: 8 });   // leaf ruff
        sphere(fg, ger, 2.7, gx + 1, gh + 1.2, gz, { seg: 8 });                // tight umbel
        sphere(fg, ger, 2.0, gx + 2.8, gh + 0.2, gz + 1.0, { seg: 8 });
        sphere(fg, ger, 1.9, gx - 1.0, gh, gz - 1.2, { seg: 8 });
      }
      // ivy spilling over the front lip
      blob(g, '#31541f', '#6aa03e', 7, -22, 17, 21.5, { seed: 43, sy: 1.7, amp: 0.09 });
      blob(g, '#3a6626', '#7cb548', 6.2, 24, 15.5, 21.5, { seed: 47, sy: 1.8, amp: 0.09 });
      return g;
    }
  },
  // ---- 16. Hanging basket (ceiling) ---------------------------------------------------------------
  {
    id: 'hanging_basket', name: 'Hanging Blooms', cat: 'garden', w: 48, d: 48, h: 68,
    mount: 'ceiling',
    palettes: [
      { name: 'Fuchsia', chip: '#d84a8c', bloom: '#d84a8c' },
      { name: 'Violet', chip: '#9a6fd0', bloom: '#9a6fd0' },
      { name: 'Scarlet', chip: '#c53a2e', bloom: '#c53a2e' }
    ],
    plan: { type: 'plant' },
    build: (p) => {
      const g = G();
      const ch = metal('#5c5f63', 0.4);
      cyl(g, ch, 1, 3, 0, -3, 0, { seg: 8 });                          // hook stem
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + 0.4;
        strut(g, ch, 0, -4, 0, Math.cos(a) * 12.5, -32, Math.sin(a) * 12.5, 0.45);
      }
      torus(g, ch, 14.2, 0.7, 0, -32.5, 0, { seg: 26, tubeSeg: 8 });   // basket rim
      cyl(g, solid('#7a5a38', 0.95), 9, 11, 0, -44, 0, { rTop: 14, seg: 18 }); // coco liner
      blob(g, '#3a6626', '#7cb548', 11.5, 0, -30, 0, { seed: 7, sy: 0.7, amp: 0.08 });
      blob(g, '#437330', '#8cc258', 7, 6.5, -28.5, -5, { seed: 19, sy: 0.65, amp: 0.08 });
      // petunia trumpets studding the mound shell
      const rand = rng(23);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + rand() * 0.5;
        const rr = 9.5 + rand() * 3;
        sphere(g, solid(i % 3 ? p.bloom : shadeHex(p.bloom, 26), 0.6), 2.7,
          Math.cos(a) * rr, -27.5 - rand() * 5, Math.sin(a) * rr, { sy: 0.75, seg: 8 });
      }
      bloomDaisy(g, '#f4f2ea', '#e8b520', 3.2, -3, -21.5, 3, 5, 0.15);
      bloomDaisy(g, '#f4f2ea', '#e8b520', 3.0, 6, -23.5, -2, 9, -0.2);
      for (let i = 0; i < 5; i++) {                                    // trailing strands
        const a = (i / 5) * Math.PI * 2 + 0.7;
        blob(g, '#31541f', '#6aa03e', 4.6,
          Math.cos(a) * 13, -44 - (i % 3) * 6, Math.sin(a) * 13, { seed: 43 + i, sy: 2.1, amp: 0.08 });
      }
      return g;
    }
  },
  // ---- 17. Flower pot trio ---------------------------------------------------------------------
  {
    id: 'flower_pot_trio', name: 'Flower Pot Trio', cat: 'garden', w: 115, d: 55, h: 72,
    palettes: [
      { name: 'Terracotta', chip: '#b06a44', pot: '#b06a44', rough: 0.8 },
      { name: 'Glazed Cobalt', chip: '#3f5f96', pot: '#3f5f96', rough: 0.35 },
      { name: 'Aged Stone', chip: '#a8a294', pot: '#a8a294', rough: 0.85 }
    ],
    plan: { type: 'plant' },
    build: (p) => {
      const g = G();
      const potM = solid(p.pot, p.rough);
      const soil = soilMat();
      // tall pot — tulips
      lathe(g, potM, [[10, 0], [11.5, 2], [12.5, 24], [14.5, 25], [14.8, 31], [13.6, 31.5]], -36, 0, 0, { seg: 28 });
      cyl(g, soil, 12.8, 2, -36, 28.6, 0, { seg: 20 });
      const tg = sub(g, -36, 30.4, 0);
      let tip = flowerStem(tg, -3, 2, 26, 5);
      bloomTulip(tg, '#d8385e', 4.6, tip.x, tip.y + 3.5, tip.z, 5);
      tip = flowerStem(tg, 4, -3, 31, 9);
      bloomTulip(tg, '#e8b520', 4.4, tip.x, tip.y + 3.5, tip.z, 9);
      // middle pot — daisies
      lathe(g, potM, [[8.5, 0], [10, 1.5], [10.8, 16], [12.5, 17], [12.8, 21], [11.6, 21.5]], 10, 0, 6, { seg: 26 });
      cyl(g, soil, 10.8, 1.6, 10, 19, 6, { seg: 18 });
      const dg = sub(g, 10, 20.4, 6);
      tip = flowerStem(dg, -3, 1, 15, 3);
      bloomDaisy(dg, '#f4f2ea', '#e8b520', 4.0, tip.x, tip.y + 1.5, tip.z, 3, 0.18);
      tip = flowerStem(dg, 4, -3, 18, 11);
      bloomDaisy(dg, '#f4f2ea', '#e8b520', 3.8, tip.x, tip.y + 1.5, tip.z, 11, -0.2);
      // small pot — a single rose
      lathe(g, potM, [[6.5, 0], [7.5, 1], [8.2, 11], [9.6, 12], [9.8, 15], [8.8, 15.5]], 42, 0, -8, { seg: 24 });
      cyl(g, soil, 8.6, 1.5, 42, 13.2, -8, { seg: 16 });
      const rg = sub(g, 42, 14.4, -8);
      tip = flowerStem(rg, 0, 0, 17, 13);
      bloomRose(rg, '#c22c46', 5.2, tip.x, tip.y + 3, tip.z, 13);
      segment(rg, solid('#4e7a34', 0.85), [tip.x * 0.4, 7, tip.z * 0.4], [tip.x + 5, tip.y - 7.5, tip.z + 2.6], 0.6, 0.4, 6);
      roseBud(rg, '#c22c46', 1.9, tip.x + 5, tip.y - 6, tip.z + 2.6);
      return g;
    }
  }
];
