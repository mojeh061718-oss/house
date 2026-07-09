// Botanical builders — real flowers and real bush architecture.
// The old approach (one or two noise blobs) reads as green spheres; plants
// only read as plants when they have STRUCTURE: stems that arch, petals in
// whorls, branches that end in offset irregular clusters, asymmetry.
// Everything here is built from the cheap primitives and shared materials,
// sized in cm, base at y=0 of the given anchor.
import * as THREE from 'three';
import { sphere, segment, blob, solid } from './builders.js';

const rng = (seed) => {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
};

// shared petal/leaf tones (cached solids — never mutated)
const leafMat = (hex = '#3f6b2e') => solid(hex, 0.85);
const petalMat = (hex) => solid(hex, 0.62);

/** One curved petal: a squashed sphere, pinched at the base, tilted outward.
 *  The workhorse of every bloom below. */
function petal(g, mat, len, wid, x, y, z, yaw, tilt, opts = {}) {
  const m = sphere(g, mat, len / 2, 0, 0, 0, { sx: 1, sy: opts.thick ?? 0.16, sz: wid / len, seg: opts.seg ?? 10 });
  m.position.set(x, y, z);
  m.rotation.order = 'YXZ';
  m.rotation.y = yaw;
  m.rotation.z = tilt;                       // lift the outer edge
  m.translateX(len / 2 * (opts.reach ?? 0.72)); // pivot at the petal base
  return m;
}

/** Rose bloom: three whorls of petals — a tight furled center, a cupped mid
 *  ring, an open outer ring — over green sepals. Reads as a rose from 1m. */
export function bloomRose(g, hex, r, x, y, z, seed = 1) {
  const rand = rng(seed);
  const p = petalMat(hex);
  const deep = petalMat(shadeHex(hex, -28));
  // furled heart: tight vertical curls
  sphere(g, deep, r * 0.34, x, y, z, { sy: 1.15, seg: 10 });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + rand();
    petal(g, deep, r * 0.8, r * 0.62, x, y + r * 0.1, z, a, 1.15, { reach: 0.3, thick: 0.22 });
  }
  // cupped mid whorl
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.6 + rand() * 0.2;
    petal(g, p, r * 1.15, r * 0.95, x, y, z, a, 0.72 + rand() * 0.15);
  }
  // open outer whorl, slightly dropped
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.2 + rand() * 0.2;
    petal(g, p, r * 1.35, r * 1.05, x, y - r * 0.16, z, a, 0.3 + rand() * 0.18);
  }
  // sepals peeking under
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + rand();
    petal(g, leafMat('#2f5426'), r * 1.1, r * 0.4, x, y - r * 0.3, z, a, 0.15);
  }
}

/** Daisy: a ring of flat white ray petals around a domed yellow eye. */
export function bloomDaisy(g, petalHex, eyeHex, r, x, y, z, seed = 1, tilt = 0) {
  const rand = rng(seed);
  const holder = new THREE.Group();
  holder.position.set(x, y, z);
  holder.rotation.z = tilt;
  holder.rotation.y = rand() * Math.PI;
  g.add(holder);
  const p = petalMat(petalHex);
  const n = 11;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    petal(holder, p, r * 1.15, r * 0.34, 0, 0, 0, a, 0.08 + rand() * 0.1, { thick: 0.1 });
  }
  sphere(holder, petalMat(eyeHex), r * 0.34, 0, r * 0.05, 0, { sy: 0.5, seg: 12 });
}

/** Sunflower head: broad brown seed disc, double ring of golden rays, green
 *  bracts behind. Face direction +z of the returned group. */
export function bloomSunflower(g, r, x, y, z, seed = 1) {
  const rand = rng(seed);
  const head = new THREE.Group();
  head.position.set(x, y, z);
  g.add(head);
  const gold = petalMat('#e8b520');
  const goldDeep = petalMat('#c99413');
  // rays: two offset rings, lying almost flat in the head plane
  for (let i = 0; i < 15; i++) {
    const a = (i / 15) * Math.PI * 2;
    petal(head, gold, r * 1.05, r * 0.26, 0, 0, 0, a, 0.05 + rand() * 0.08, { thick: 0.09 });
  }
  for (let i = 0; i < 15; i++) {
    const a = ((i + 0.5) / 15) * Math.PI * 2;
    petal(head, goldDeep, r * 0.85, r * 0.24, 0, -r * 0.03, 0, a, 0.12 + rand() * 0.08, { thick: 0.09 });
  }
  // seed disc: dark center, subtly domed, ringed
  sphere(head, solid('#5a3d20', 0.95), r * 0.52, 0, r * 0.04, 0, { sy: 0.28, seg: 18 });
  sphere(head, solid('#3e2a15', 0.98), r * 0.34, 0, r * 0.09, 0, { sy: 0.22, seg: 14 });
  // bracts behind
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + rand() * 0.3;
    petal(head, leafMat('#41692c'), r * 0.7, r * 0.3, 0, -r * 0.12, 0, a, -0.05);
  }
  return head;
}

/** Tulip: a cup of upright petals with a slight outward flare at the lip. */
export function bloomTulip(g, hex, r, x, y, z, seed = 1) {
  const rand = rng(seed);
  const p = petalMat(hex);
  const inner = petalMat(shadeHex(hex, 22));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + rand() * 0.2;
    const m = sphere(g, p, r, x + Math.cos(a) * r * 0.34, y, z + Math.sin(a) * r * 0.34,
      { sy: 1.5, sx: 0.62, seg: 10 });
    m.rotation.y = -a;
    m.rotation.z = 0.12;
  }
  for (let i = 0; i < 3; i++) {
    const a = ((i + 0.5) / 3) * Math.PI * 2 + rand() * 0.2;
    const m = sphere(g, inner, r * 0.9, x + Math.cos(a) * r * 0.22, y + r * 0.12, z + Math.sin(a) * r * 0.22,
      { sy: 1.45, sx: 0.6, seg: 10 });
    m.rotation.y = -a;
  }
}

/** Lavender: a slim stem topped with a tapering violet floret spike. */
export function spikeLavender(g, x, z, h, seed = 1) {
  const rand = rng(seed);
  const lean = (rand() - 0.5) * 0.22;
  const stem = segment(g, leafMat('#5c7a4a'), [x, 0, z], [x + lean * h, h, z + (rand() - 0.5) * 6], 0.5, 0.35, 6);
  const tipX = x + lean * h, tipZ = z + (rand() - 0.5) * 4;
  const tones = ['#8a6fc4', '#7b5fb8', '#9a82d0'];
  for (let i = 0; i < 5; i++) {
    sphere(g, petalMat(tones[i % 3]), 1.8 - i * 0.24, tipX, h + i * 2.0, tipZ, { sy: 1.3, seg: 8 });
  }
  return stem;
}

/** Scatter bloom callbacks over the sunlit shell of a bush canopy so they sit
 *  ON the foliage instead of buried inside it. Treats the canopy as an
 *  ellipsoid centered at h*0.55 with semi-axes ~0.46 of the footprint (just
 *  proud of bushMass's cluster shells). fn(g, x, y, z, i) draws one bloom. */
export function studBlooms(g, w, h, d, n, seed, fn) {
  const rand = rng(seed);
  for (let i = 0; i < n; i++) {
    const th = (i / n) * Math.PI * 2 + rand() * 0.8;
    const ph = 0.25 + rand() * 1.05;            // 0 = crown, ~74 deg = shoulder
    const px = Math.sin(ph) * Math.cos(th) * w * 0.46;
    const py = h * 0.55 + Math.cos(ph) * h * 0.46;
    const pz = Math.sin(ph) * Math.sin(th) * d * 0.46;
    fn(g, px, py, pz, i);
  }
}

/** Hydrangea head: a mophead of little 4-petal florets over a core — NOT one
 *  smooth ball; the florets give it the crocheted surface hydrangeas have. */
export function bloomHydrangea(g, hex, r, x, y, z, seed = 1) {
  const rand = rng(seed);
  // core stops see-through
  sphere(g, petalMat(shadeHex(hex, -20)), r * 0.72, x, y, z, { seg: 12 });
  const p = petalMat(hex);
  const lite = petalMat(shadeHex(hex, 16));
  const n = 14;
  for (let i = 0; i < n; i++) {
    // fibonacci-ish scatter over the upper 2/3 of the sphere
    const t = i / n;
    const ay = Math.acos(1 - t * 1.35);
    const aa = i * 2.39996 + rand() * 0.3;
    const px = x + Math.sin(ay) * Math.cos(aa) * r * 0.82;
    const py = y + Math.cos(ay) * r * 0.82;
    const pz = z + Math.sin(ay) * Math.sin(aa) * r * 0.82;
    const mat = i % 3 ? p : lite;
    for (let k = 0; k < 4; k++) {
      const fa = (k / 4) * Math.PI * 2;
      sphere(g, mat, r * 0.16, px + Math.cos(fa) * r * 0.13, py + rand() * r * 0.04, pz + Math.sin(fa) * r * 0.13,
        { sy: 0.5, seg: 6 });
    }
  }
}

/** Flower stem with leaves: from ground (x,0,z) up to (tx, h, tz). */
export function flowerStem(g, x, z, h, seed = 1, hex = '#4e7a34') {
  const rand = rng(seed);
  const lean = (rand() - 0.5) * 0.3;
  const tx = x + lean * h * 0.5, tz = z + (rand() - 0.5) * h * 0.2;
  segment(g, leafMat(hex), [x, 0, z], [tx, h, tz], 0.8, 0.5, 6);
  // 1-2 blade leaves partway up
  for (let i = 0; i < 1 + (seed % 2); i++) {
    const ly = h * (0.3 + i * 0.25);
    const la = rand() * Math.PI * 2;
    const leaf = sphere(g, leafMat(hex), h * 0.13, x + (tx - x) * (ly / h), ly, z + (tz - z) * (ly / h),
      { sx: 1, sy: 0.12, sz: 0.34, seg: 8 });
    leaf.rotation.y = la;
    leaf.rotation.z = 0.5;
    leaf.translateX(h * 0.1);
  }
  return { x: tx, y: h, z: tz };
}

/** REAL bush architecture: woody stubs → radiating tapered branches → each
 *  ending in an OFFSET irregular leaf cluster, plus inner filler and droopers.
 *  Asymmetric by construction — this is what kills the "green sphere" read.
 *  w/h/d = the def footprint the bush must roughly fill (base at y=0). */
export function bushMass(g, w, h, d, opts = {}) {
  const seed = opts.seed ?? 1;
  const rand = rng(seed);
  const dark = opts.dark ?? '#2e5226';
  const mid = opts.mid ?? '#3f6b2e';
  const lite = opts.lite ?? '#5d8f3d';
  const bark = solid(opts.bark ?? '#4a3826', 0.95);
  const cx = opts.x ?? 0, cz = opts.z ?? 0;
  // woody stubs at the base
  const stubs = 2 + Math.floor(rand() * 2);
  for (let i = 0; i < stubs; i++) {
    const sx = cx + (rand() - 0.5) * w * 0.3, sz = cz + (rand() - 0.5) * d * 0.3;
    segment(g, bark, [sx, 0, sz], [sx + (rand() - 0.5) * 8, h * 0.28, sz + (rand() - 0.5) * 8], 2.2, 1.4, 7);
  }
  // inner dark filler so the bush is never see-through
  blob(g, dark, mid, Math.min(w, d) * 0.32, cx, h * 0.42, cz, { seed: seed * 3 + 1, detail: 2, amp: 0.08, sy: h / Math.min(w, d) * 0.75 });
  // branch-tip clusters: the silhouette makers — varied radii, offset tips,
  // upper ones lighter (sun), lower ones darker and drooping
  const clusters = opts.clusters ?? 7;
  for (let i = 0; i < clusters; i++) {
    const a = (i / clusters) * Math.PI * 2 + rand() * 0.9;
    const spread = 0.26 + rand() * 0.2;
    const bx = cx + Math.cos(a) * w * spread;
    const bz = cz + Math.sin(a) * d * spread;
    const by = h * (0.38 + rand() * 0.42);
    // the branch that carries it
    segment(g, bark, [cx + Math.cos(a) * w * 0.06, h * 0.2, cz + Math.sin(a) * d * 0.06],
      [bx, by, bz], 1.5, 0.8, 6);
    const cr = Math.min(w, d) * (0.16 + rand() * 0.12);
    const high = by > h * 0.55;
    blob(g, high ? mid : dark, high ? lite : mid, cr,
      bx + (rand() - 0.5) * 4, by + cr * 0.4, bz + (rand() - 0.5) * 4,
      { seed: seed * 7 + i, detail: 3, amp: 0.11, sy: 0.85 + rand() * 0.25 });
  }
  // one drooping skirt cluster near the base for age/asymmetry
  blob(g, dark, mid, Math.min(w, d) * 0.2, cx + w * 0.24, h * 0.22, cz - d * 0.1,
    { seed: seed * 13 + 5, detail: 3, amp: 0.1, sy: 0.6 });
}

/** tiny util: lighten/darken a hex by delta (-255..255) */
export function shadeHex(hex, delta) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, v + delta));
  const r = c((n >> 16) & 255), g2 = c((n >> 8) & 255), b = c(n & 255);
  return `#${((r << 16) | (g2 << 8) | b).toString(16).padStart(6, '0')}`;
}
