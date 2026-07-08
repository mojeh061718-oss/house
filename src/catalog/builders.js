// Shared helpers for constructing parametric furniture out of Three.js
// primitives. All dimensions in centimeters; +Y up; the item origin sits at
// floor level in the middle of the footprint; the "front" of items faces +Z.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { getTextureCanvases, MATERIAL_MAP, watchTextures } from '../core/textures.js';

const solidCache = new Map();
const texCache = new Map();
watchTextures((matId) => {
  for (const [key, m] of texCache) {
    if (key.startsWith(matId + '_')) {
      m.map.needsUpdate = true;
      m.bumpMap.needsUpdate = true;
    }
  }
});
const woodCache = new Map();

// shared micro-surface bump so plain materials don't read as flat plastic
let microBump = null;
function getMicroBump() {
  if (!microBump) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(128, 128);
    let s = 1234567;
    for (let i = 0; i < img.data.length; i += 4) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const v = 118 + (s % 21);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    microBump = new THREE.CanvasTexture(c);
    microBump.wrapS = microBump.wrapT = THREE.RepeatWrapping;
    microBump.repeat.set(3, 3);
  }
  return microBump;
}

// shared grayscale grain map — tinted by material color for any wood tone
let grainTex = null;
function getGrainTex() {
  if (!grainTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgb(228,228,228)';
    ctx.fillRect(0, 0, 256, 256);
    let s = 424243;
    const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    for (let i = 0; i < 90; i++) {
      const y = rand() * 256;
      const w = 0.5 + rand() * 1.8;
      const tone = 176 + rand() * 62;
      ctx.strokeStyle = `rgba(${tone | 0},${tone | 0},${tone | 0},${0.35 + rand() * 0.4})`;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(-10, y);
      ctx.bezierCurveTo(64, y + (rand() - 0.5) * 14, 192, y + (rand() - 0.5) * 14, 266, y + (rand() - 0.5) * 8);
      ctx.stroke();
    }
    grainTex = new THREE.CanvasTexture(c);
    grainTex.wrapS = grainTex.wrapT = THREE.RepeatWrapping;
    grainTex.colorSpace = THREE.SRGBColorSpace;
  }
  return grainTex;
}

export function solid(hex, rough = 0.8, metal = 0) {
  const key = `${hex}_${rough}_${metal}`;
  let m = solidCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color: hex, roughness: rough, metalness: metal,
      bumpMap: metal > 0.5 ? null : getMicroBump(),
      bumpScale: 0.25,
      // let metals/polished finishes catch the environment for a richer,
      // physically-lit look; matte surfaces stay subtle
      envMapIntensity: metal > 0.5 ? 1.35 : 0.85
    });
    solidCache.set(key, m);
  }
  return m;
}

/** Self-lit (emissive) material for lamps, bulbs, flames — NOT cached, so
 *  setting its glow never mutates a shared material. */
export function glow(hex, intensity = 1, rough = 0.4, emissiveHex = hex) {
  const m = new THREE.MeshStandardMaterial({
    color: hex, roughness: rough, emissive: emissiveHex, emissiveIntensity: intensity
  });
  m.userData.owned = true; // not cached — safe (and necessary) to dispose on rebuild
  return m;
}

/** Wood-grain material tinted to any tone — used for all wooden furniture. */
export function wood(hex, rough = 0.55) {
  const key = `${hex}_${rough}`;
  let m = woodCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color: hex, roughness: rough,
      map: getGrainTex(),
      bumpMap: getGrainTex(),
      bumpScale: 0.35,
      envMapIntensity: 0.6   // a soft satin sheen on wood
    });
    woodCache.set(key, m);
  }
  return m;
}

const TEX_CAP = 140; // most distinct sized surfaces a scene ever shows at once

/** Textured material from the procedural material registry. Each distinct
 *  (material, repeatX, repeatY) uploads its own GPU texture pair, so the repeats
 *  are QUANTIZED (a resized deck rebuilds at every intermediate size, and many
 *  similar surfaces would otherwise each mint a fresh ~2–10 MB texture) and the
 *  cache is an LRU that disposes what it evicts — without this the GPU textures
 *  grew without bound and crashed mobile Safari. */
export function tex(matId, repeatX = 1, repeatY = 1) {
  repeatX = Math.min(16, Math.max(0.5, Math.round(repeatX * 2) / 2));
  repeatY = Math.min(16, Math.max(0.5, Math.round(repeatY * 2) / 2));
  const key = `${matId}_${repeatX}_${repeatY}`;
  let m = texCache.get(key);
  if (m) {
    texCache.delete(key); texCache.set(key, m); // touch → most-recently-used
    return m;
  }
  const { color, bump } = getTextureCanvases(matId);
  const def = MATERIAL_MAP.get(matId);
  const map = new THREE.CanvasTexture(color);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeatX, repeatY);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  const bumpMap = new THREE.CanvasTexture(bump);
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(repeatX, repeatY);
  m = new THREE.MeshStandardMaterial({
    map, bumpMap, bumpScale: 0.6,
    roughness: def?.rough ?? 0.8,
    metalness: 0
  });
  texCache.set(key, m);
  // evict the least-recently-used entries and free their GPU textures
  while (texCache.size > TEX_CAP) {
    const oldest = texCache.keys().next().value;
    const dead = texCache.get(oldest);
    texCache.delete(oldest);
    dead.map?.dispose(); dead.bumpMap?.dispose(); dead.dispose();
  }
  return m;
}

export const metal = (hex = '#b8bcc0', rough = 0.35) => solid(hex, rough, 0.85);
export const chrome = () => solid('#d5d9dd', 0.15, 1);

/** Material showing a user photo (a data URL from their camera roll). Unique
 *  per item, so it's tagged owned + ownedMap to be disposed on rebuild. */
export function photoMaterial(dataUrl) {
  const t = new THREE.TextureLoader().load(dataUrl);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.5, metalness: 0 });
  m.userData.owned = true; m.userData.ownedMap = true;
  return m;
}

/** Material with rendered text — house numbers, signs. */
export function textMaterial(text, opts = {}) {
  const c = document.createElement('canvas');
  c.width = opts.w || 512; c.height = opts.h || 256;
  const g = c.getContext('2d');
  g.fillStyle = opts.bg || '#26292e';
  g.fillRect(0, 0, c.width, c.height);
  if (opts.border) { g.strokeStyle = opts.border; g.lineWidth = 10; g.strokeRect(8, 8, c.width - 16, c.height - 16); }
  g.fillStyle = opts.fg || '#ece7da';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `${opts.weight || 700} ${opts.size || 150}px ${opts.font || 'Georgia, "Times New Roman", serif'}`;
  g.fillText(String(text ?? '').slice(0, 14), c.width / 2, c.height / 2 + 6);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, metalness: 0.1 });
  m.userData.owned = true; m.userData.ownedMap = true;
  return m;
}

let glassMat = null;
export function glass() {
  if (!glassMat) {
    glassMat = new THREE.MeshPhysicalMaterial({
      color: '#cfe4ea', transparent: true, opacity: 0.28,
      roughness: 0.05, metalness: 0, side: THREE.DoubleSide
    });
  }
  return glassMat;
}

let mirrorMat = null;
export function mirror() {
  if (!mirrorMat) {
    mirrorMat = new THREE.MeshStandardMaterial({ color: '#c8d4dc', roughness: 0.04, metalness: 1 });
  }
  return mirrorMat;
}

let waterMat = null;
export function water() {
  if (!waterMat) {
    // A real water surface reads by how it bends the light, so drive it with a
    // proper tangent-space NORMAL map baked from a multi-octave ripple height
    // field (several wave trains at different scales + angles) rather than one
    // sine. Seamless (integer frequencies over 0..2π), 512px for crisp glints.
    const S = 512;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    const img = g.createImageData(S, S);
    const TAU = Math.PI * 2;
    const height = (x, y) => {
      const u = (x / S) * TAU, v = (y / S) * TAU;
      return (
        Math.sin(u * 3 + Math.sin(v * 2) * 1.4) * 0.50 +
        Math.sin(v * 4 + Math.cos(u * 2) * 1.1) * 0.34 +
        Math.sin((u + v) * 6 + 0.7) * 0.18 +
        Math.sin((u - v) * 9 + 1.3) * 0.12 +
        Math.sin(u * 15 + v * 4) * 0.07
      );
    };
    const eps = 1.2, str = 2.2;
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const hL = height((x - eps + S) % S, y), hR = height((x + eps) % S, y);
        const hD = height(x, (y - eps + S) % S), hU = height(x, (y + eps) % S);
        let nx = (hL - hR) * str, ny = (hD - hU) * str, nz = 1;
        const inv = 1 / Math.hypot(nx, ny, nz);
        nx *= inv; ny *= inv; nz *= inv;
        const idx = (y * S + x) * 4;
        img.data[idx] = (nx * 0.5 + 0.5) * 255;
        img.data[idx + 1] = (ny * 0.5 + 0.5) * 255;
        img.data[idx + 2] = (nz * 0.5 + 0.5) * 255;
        img.data[idx + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    const ripples = new THREE.CanvasTexture(c);
    ripples.wrapS = ripples.wrapT = THREE.RepeatWrapping;
    ripples.repeat.set(5, 5);
    ripples.colorSpace = THREE.NoColorSpace;
    waterMat = new THREE.MeshPhysicalMaterial({
      color: '#20718e', roughness: 0.05, metalness: 0,
      transparent: true, opacity: 0.86,
      clearcoat: 1, clearcoatRoughness: 0.04,
      normalMap: ripples, normalScale: new THREE.Vector2(0.55, 0.55),
      envMapIntensity: 1.25
    });
  }
  return waterMat;
}

/** Organic pond built at true size: wobbled shoreline, bed, water, rocks. */
export function buildPond(w, d) {
  const g = G();
  const rx = w / 2 - 14, rz = d / 2 - 14;
  const outline = (scale) => {
    const shape = new THREE.Shape();
    const n = 30;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const wob = 1 + 0.09 * Math.sin(a * 3 + 1.7) + 0.05 * Math.sin(a * 5 + 0.4) + 0.04 * Math.sin(a * 7 + 2.6);
      const px = Math.cos(a) * rx * wob * scale;
      const pz = Math.sin(a) * rz * wob * scale;
      if (i === 0) shape.moveTo(px, pz); else shape.lineTo(px, pz);
    }
    return shape;
  };
  const flat = (shape, mat, y) => {
    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, mat);
    m.position.y = y;
    m.receiveShadow = true;
    g.add(m);
    return m;
  };
  flat(outline(1.08), solid('#5c5244', 0.95), 1.2);        // muddy shore rim
  flat(outline(1.0), solid('#233b2c', 0.95), 2.2);         // dark bed
  flat(outline(0.97), water(), 5);                          // water surface
  // natural rock ring with size/tone jitter
  let sd = 91;
  const rand = () => { sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; };
  const rocks = [solid('#8a857c', 0.95), solid('#75705f', 0.95), solid('#9a948a', 0.95)];
  const n = Math.max(14, Math.round((rx + rz) / 22));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rand() * 0.2;
    const wob = 1 + 0.09 * Math.sin(a * 3 + 1.7) + 0.05 * Math.sin(a * 5 + 0.4) + 0.04 * Math.sin(a * 7 + 2.6);
    const r = 6 + rand() * 9;
    const m = sphere(g, rocks[i % 3], r,
      Math.cos(a) * rx * wob * 1.03, 2 + r * 0.25, Math.sin(a) * rz * wob * 1.03,
      { seg: 8, sy: 0.55 + rand() * 0.2 });
    m.rotation.y = rand() * Math.PI;
  }
  return g;
}

/** Field of instanced grass blades at true size — meadow / crop looks. */
export function buildTallGrass(pal, w, d) {
  const g = G();
  const H = pal.height || 60;
  const count = Math.min(2600, Math.max(160, Math.round((w * d) / 240)));
  const geo = new THREE.ConeGeometry(2.4, 1, 4, 1);
  geo.translate(0, 0.5, 0); // base at y=0 so height scaling grows upward
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95 });
  mat.userData.owned = true;
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();
  const cBase = new THREE.Color(pal.base), cTip = new THREE.Color(pal.tips), c = new THREE.Color();
  let sd = 137;
  const rand = () => { sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; };
  for (let i = 0; i < count; i++) {
    dummy.position.set((rand() - 0.5) * (w - 10), 0, (rand() - 0.5) * (d - 10));
    dummy.scale.set(0.8 + rand() * 0.8, H * (0.6 + rand() * 0.6), 0.8 + rand() * 0.8);
    dummy.rotation.set((rand() - 0.5) * 0.32, rand() * Math.PI, (rand() - 0.5) * 0.32);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, c.copy(cBase).lerp(cTip, rand()));
  }
  mesh.receiveShadow = true;
  g.add(mesh);
  return g;
}

export function G() {
  return new THREE.Group();
}

/** Box (optionally rounded) centered at x,z with its base at y. */
export function box(parent, mat, w, h, d, x = 0, y = 0, z = 0, opts = {}) {
  const geo = opts.r
    ? new RoundedBoxGeometry(w, h, d, opts.seg ?? 3, Math.min(opts.r, w / 2, h / 2, d / 2))
    : new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y + h / 2, z);
  if (opts.ry) mesh.rotation.y = opts.ry;
  if (opts.rx) mesh.rotation.x = opts.rx;
  if (opts.rz) mesh.rotation.z = opts.rz;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/** Cylinder with base at y (vertical) — or centered on y when laid horizontal. */
export function cyl(parent, mat, r, h, x = 0, y = 0, z = 0, opts = {}) {
  const geo = new THREE.CylinderGeometry(opts.rTop ?? r, r, h, opts.seg ?? 24, 1, opts.open || false);
  const mesh = new THREE.Mesh(geo, mat);
  const tilt = Math.max(Math.abs(opts.rx || 0), Math.abs(opts.rz || 0));
  const horizontal = Math.abs(tilt - Math.PI / 2) < 0.35;
  mesh.position.set(x, y + (horizontal ? 0 : h / 2), z);
  if (opts.rx) mesh.rotation.x = opts.rx;
  if (opts.rz) mesh.rotation.z = opts.rz;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function sphere(parent, mat, r, x, y, z, opts = {}) {
  const geo = new THREE.SphereGeometry(r, opts.seg ?? 18, opts.seg ?? 14);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  if (opts.sy) mesh.scale.y = opts.sy;
  if (opts.sx) mesh.scale.x = opts.sx;
  if (opts.sz) mesh.scale.z = opts.sz;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/** Triangular prism with the ridge running along x: base w×d, apex height h.
 *  Sloped faces + underside get `mat`; the two triangular gable ends get
 *  `capMat` (falls back to `mat`). Base sits at y. */
export function prism(parent, mat, w, h, d, x = 0, y = 0, z = 0, capMat = null, uvScale = 180) {
  const shape = new THREE.Shape();
  shape.moveTo(-d / 2, 0);
  shape.lineTo(d / 2, 0);
  shape.lineTo(0, h);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled: false });
  // extrude UVs are in cm — normalize to texture repeats
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, uv.getX(i) / uvScale, uv.getY(i) / uvScale);
  }
  // extrude runs along +z; swing it so the ridge runs along x, centered
  // (rotateY(-90°) maps the depth run onto -x, so shift back by +w/2)
  geo.rotateY(-Math.PI / 2);
  geo.translate(w / 2, 0, 0);
  const mesh = new THREE.Mesh(geo, [capMat || mat, mat]);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/** Four-sided pyramid (hip roof shape): rectangular base w×d, apex height h. */
export function pyramid(parent, mat, w, h, d, x = 0, y = 0, z = 0) {
  const geo = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1);
  geo.rotateY(Math.PI / 4);
  geo.translate(0, 0.5, 0);
  geo.scale(w, h, d);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/** Tapered cylinder spanning two 3D points a=[x,y,z] → b=[x,y,z]: radius r0 at
 *  a, tapering to r1 at b. The workhorse for organic forms — jointed animal
 *  legs, arched necks, tails, and tapered/branching tree limbs. */
export function segment(parent, mat, a, b, r0, r1 = r0, seg = 10) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
  const len = Math.hypot(dx, dy, dz) || 0.001;
  const geo = new THREE.CylinderGeometry(r1, r0, len, seg);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  // the cylinder is modelled along +Y — swing it to point from a toward b
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(dx, dy, dz).normalize()
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/** Four legs at footprint corners. */
export function legs4(parent, mat, w, d, h, r = 2.5, inset = 6, square = false) {
  const px = w / 2 - inset, pz = d / 2 - inset;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      if (square) box(parent, mat, r * 2, h, r * 2, sx * px, 0, sz * pz);
      else cyl(parent, mat, r, h, sx * px, 0, sz * pz);
    }
  }
}

/** Cylinder strut running between two 3D points — A-frames, angled rails,
 *  ladder stringers, chains. `r` is the base radius; opts.rTop tapers it. */
export function strut(parent, mat, ax, ay, az, bx, by, bz, r = 3, opts = {}) {
  const a = new THREE.Vector3(ax, ay, az);
  const b = new THREE.Vector3(bx, by, bz);
  const dir = b.clone().sub(a);
  const len = dir.length() || 0.0001;
  const geo = new THREE.CylinderGeometry(opts.rTop ?? r, r, len, opts.seg ?? 12);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/** Cabinet handle bar. */
export function handleBar(parent, x, y, z, len = 12, vertical = false, mat = null) {
  const m = mat || metal('#9a9ea4', 0.3);
  cyl(parent, m, 0.8, len, x, y - (vertical ? len / 2 : 0), z, vertical ? {} : { rz: Math.PI / 2 });
}

/** Round knob. */
export function knob(parent, x, y, z, r = 1.6) {
  sphere(parent, metal('#9a9ea4', 0.3), r, x, y, z);
}

/** Simple tapered lamp shade. */
export function shade(parent, hex, rBottom, rTop, h, x, y, z) {
  const mat = new THREE.MeshStandardMaterial({
    color: hex, roughness: 0.9, side: THREE.DoubleSide,
    emissive: hex, emissiveIntensity: 0.25
  });
  mat.userData.owned = true;
  const geo = new THREE.CylinderGeometry(rTop, rBottom, h, 24, 1, true);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

/** Extruded panel with a wavy (curtain-like) cross-section. */
export function wavyPanel(parent, mat, width, height, folds = 6, depth = 6) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  const n = folds * 8;
  for (let i = 1; i <= n; i++) {
    const x = -width / 2 + (width * i) / n;
    const y = Math.sin((i / n) * Math.PI * folds * 2) * depth * 0.5;
    shape.lineTo(x, y);
  }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, steps: 1 });
  geo.rotateX(Math.PI / 2);
  geo.translate(0, height, 0);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.material.side = THREE.DoubleSide;
  parent.add(mesh);
  return mesh;
}

/** Procedural abstract painting texture for wall art. */
const artCache = new Map();
export function artMaterial(seedNum) {
  if (artCache.has(seedNum)) return artCache.get(seedNum);
  const c = document.createElement('canvas');
  c.width = 256; c.height = 192;
  const ctx = c.getContext('2d');
  let s = seedNum >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const palettes = [
    ['#e9e4d9', '#c96f4a', '#39506b', '#d9b45f', '#7c8c74'],
    ['#f0ece4', '#8c9fae', '#40474f', '#c2b49a', '#a86450'],
    ['#efe8dc', '#5d7a6c', '#d8c8a8', '#31404a', '#b98a5e']
  ];
  const pal = palettes[seedNum % palettes.length];
  ctx.fillStyle = pal[0];
  ctx.fillRect(0, 0, 256, 192);
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = pal[1 + Math.floor(rand() * (pal.length - 1))];
    ctx.globalAlpha = 0.5 + rand() * 0.5;
    if (rand() < 0.5) {
      ctx.beginPath();
      ctx.arc(rand() * 256, rand() * 192, 12 + rand() * 55, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.save();
      ctx.translate(rand() * 256, rand() * 192);
      ctx.rotate(rand() * Math.PI);
      ctx.fillRect(-40 * rand() - 10, -14 * rand() - 4, 80 * rand() + 20, 28 * rand() + 8);
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshStandardMaterial({ map, roughness: 0.85 });
  artCache.set(seedNum, mat);
  return mat;
}

/**
 * Organic noise-displaced blob with dappled vertex colors — the building
 * block of realistic canopies, bushes and hedges. Sun-lit tops lean toward
 * hexB, shaded undersides toward hexA.
 */
export function blob(parent, hexA, hexB, r, x, y, z, opts = {}) {
  const seed = opts.seed ?? 1;
  const geo = new THREE.IcosahedronGeometry(r, opts.detail ?? 3);
  const pos = geo.attributes.position;
  const colA = new THREE.Color(hexA), colB = new THREE.Color(hexB);
  const colors = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3();
  const sy = opts.sy ?? 1;
  for (let i = 0; i < pos.count; i++) {
    v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    // deterministic lumpy displacement from overlapping waves
    const n =
      Math.sin(v.x * 0.13 + seed * 1.7) +
      Math.cos(v.y * 0.11 + seed * 2.3) +
      Math.sin(v.z * 0.15 + seed * 3.1) +
      Math.sin((v.x + v.z) * 0.07 + seed);
    v.multiplyScalar(1 + n * 0.055);
    pos.setXYZ(i, v.x, v.y * sy, v.z);
    // dappled light: higher & more outward → brighter
    const t = Math.min(1, Math.max(0, 0.45 + (v.y / r) * 0.38 + n * 0.06));
    const c = colA.clone().lerp(colB, t);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const blobMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 });
  blobMat.userData.owned = true; // unique per blob (vertex colours baked in)
  const mesh = new THREE.Mesh(geo, blobMat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

// ---- flags ----------------------------------------------------------------

const flagTexCache = new Map();

/** Canvas texture for a flag face. kind 'us' draws the Stars & Stripes; any
 *  other kind draws a simple two-tone banner using colors a/b. */
export function flagTexture(kind = 'us', a = '#b72436', b = '#f4efe2') {
  const key = `${kind}_${a}_${b}`;
  if (flagTexCache.has(key)) return flagTexCache.get(key);
  const c = document.createElement('canvas');
  c.width = 380; c.height = 200;
  const g = c.getContext('2d');
  if (kind === 'us') {
    const red = '#b22234', white = '#ffffff', blue = '#3c3b6e';
    const stripeH = c.height / 13;
    for (let i = 0; i < 13; i++) {
      g.fillStyle = i % 2 === 0 ? red : white;
      g.fillRect(0, i * stripeH, c.width, stripeH + 1);
    }
    const cantonW = c.width * 0.4, cantonH = stripeH * 7;
    g.fillStyle = blue;
    g.fillRect(0, 0, cantonW, cantonH);
    g.fillStyle = white;
    for (let row = 0; row < 9; row++) {
      const y = (row + 0.5) * (cantonH / 9);
      const cols = row % 2 === 0 ? 6 : 5;
      const off = row % 2 === 0 ? 0 : cantonW / 12;
      for (let col = 0; col < cols; col++) {
        const x = off + (col + 0.5) * (cantonW / 6);
        g.beginPath(); g.arc(x, y, 3.6, 0, Math.PI * 2); g.fill();
      }
    }
  } else {
    // simple decorative banner: field, a cream band, and a soft emblem
    g.fillStyle = a; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = b; g.fillRect(0, c.height * 0.42, c.width, c.height * 0.16);
    g.globalAlpha = 0.9;
    g.fillStyle = b;
    g.beginPath(); g.arc(c.width * 0.5, c.height * 0.5, 34, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 1;
    g.fillStyle = a;
    g.beginPath(); g.arc(c.width * 0.5, c.height * 0.5, 22, 0, Math.PI * 2); g.fill();
  }
  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.anisotropy = 4;
  flagTexCache.set(key, tx);
  return tx;
}

/** Waving flag plane. width w × height h, hoist (left) edge pinned at local
 *  x=0, flying toward +x, waving out of the XY plane. `tex` maps to both faces. */
export function buildFlag(parent, tex, w, h, x = 0, y = 0, z = 0, opts = {}) {
  const segX = 30, segY = 6;
  const geo = new THREE.PlaneGeometry(w, h, segX, segY);
  const pos = geo.attributes.position;
  const phase = opts.phase ?? 0;
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i);
    const t = (px + w / 2) / w;          // 0 at hoist, 1 at fly end
    const amp = h * 0.09 * t;            // free end waves more
    const zz = Math.sin(t * Math.PI * 3 + phase) * amp;
    pos.setZ(i, zz);
  }
  geo.translate(w / 2, 0, 0);           // pin the hoist edge to x=0
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({
    map: tex, side: THREE.DoubleSide, roughness: 0.85, metalness: 0
  });
  mat.userData.owned = true; // flag texture is shared/cached; only the material is unique
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  if (opts.ry) mesh.rotation.y = opts.ry;
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

/** Translucent safety-net material (mesh grid) — trampoline enclosures, sports
 *  nets, batting cages. Unique per call (canvas texture), so tagged owned. */
export function netMaterial(tint = '#eef3f7', repeatX = 20, repeatY = 5) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  x.clearRect(0, 0, 64, 64);
  x.strokeStyle = tint;
  x.lineWidth = 2.2;
  for (let i = 0; i <= 64; i += 8) {
    x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 64); x.stroke();
    x.beginPath(); x.moveTo(0, i); x.lineTo(64, i); x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  const m = new THREE.MeshStandardMaterial({
    map: t, transparent: true, alphaTest: 0.04, side: THREE.DoubleSide,
    roughness: 0.9, depthWrite: false, opacity: 0.92
  });
  m.userData.owned = true; m.userData.ownedMap = true;
  return m;
}

/** Organic foliage cluster for plants — lumpy dappled blobs, not plain balls. */
export function foliage(parent, hexA, hexB, cx, cy, cz, radius, count = 9, seed = 1) {
  let s = seed >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const blobs = Math.max(3, Math.round(count / 2));
  for (let i = 0; i < blobs; i++) {
    const r = radius * (0.42 + rand() * 0.34);
    const a = rand() * Math.PI * 2;
    const b = rand() * Math.PI - Math.PI / 2;
    const distR = radius * (0.12 + rand() * 0.5);
    blob(parent, hexA, hexB, r,
      cx + Math.cos(a) * Math.cos(b) * distR,
      cy + Math.sin(b) * distR * 0.7,
      cz + Math.sin(a) * Math.cos(b) * distR,
      { seed: seed + i * 7, sy: 0.8 + rand() * 0.3 });
  }
}
