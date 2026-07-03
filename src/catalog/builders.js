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
      bumpScale: 0.25
    });
    solidCache.set(key, m);
  }
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
      bumpScale: 0.35
    });
    woodCache.set(key, m);
  }
  return m;
}

/** Textured material from the procedural material registry. */
export function tex(matId, repeatX = 1, repeatY = 1) {
  const key = `${matId}_${repeatX}_${repeatY}`;
  let m = texCache.get(key);
  if (!m) {
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
  }
  return m;
}

export const metal = (hex = '#b8bcc0', rough = 0.35) => solid(hex, rough, 0.85);
export const chrome = () => solid('#d5d9dd', 0.15, 1);

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
    waterMat = new THREE.MeshStandardMaterial({
      color: '#2e6a86', roughness: 0.06, metalness: 0.45,
      transparent: true, opacity: 0.92
    });
  }
  return waterMat;
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
  const geo = new THREE.CylinderGeometry(opts.rTop ?? r, r, h, opts.seg ?? 24);
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

/** Organic foliage cluster for plants (irregular, not a plain ball). */
export function foliage(parent, hexA, hexB, cx, cy, cz, radius, count = 9, seed = 1) {
  let s = seed >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let i = 0; i < count; i++) {
    const mat = solid(rand() < 0.5 ? hexA : hexB, 0.95);
    const r = radius * (0.35 + rand() * 0.4);
    const a = rand() * Math.PI * 2;
    const b = rand() * Math.PI - Math.PI / 2;
    const dist = radius * (0.15 + rand() * 0.55);
    sphere(parent, mat, r,
      cx + Math.cos(a) * Math.cos(b) * dist,
      cy + Math.sin(b) * dist * 0.8,
      cz + Math.sin(a) * Math.cos(b) * dist,
      { seg: 10, sy: 0.75 + rand() * 0.4 });
  }
}
