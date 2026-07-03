// Builds the architectural 3D geometry (walls, floors, ceilings, doors,
// windows, ground) from the project data. Units: centimeters, +Y up.
// Plan (x, y) maps to 3D (x, z).
import * as THREE from 'three';
import { wallLength, wallAngle, pointInPolygon } from '../core/geometry.js';
import { getTextureCanvases, MATERIAL_MAP, watchTextures } from '../core/textures.js';

const matCache = new Map();
watchTextures((matId) => {
  for (const [key, m] of matCache) {
    if (key.startsWith(matId + '_')) {
      m.map.needsUpdate = true;
      m.bumpMap.needsUpdate = true;
    }
  }
});

/** Standard material for a registry material id; UVs are expected in repeat units. */
export function archMat(matId, opts = {}) {
  const key = `${matId}_${opts.side || 0}`;
  let m = matCache.get(key);
  if (!m) {
    const def = MATERIAL_MAP.get(matId) || MATERIAL_MAP.get('paint_warmwhite');
    const { color, bump } = getTextureCanvases(def.id);
    const map = new THREE.CanvasTexture(color);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    const bumpMap = new THREE.CanvasTexture(bump);
    bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
    m = new THREE.MeshStandardMaterial({
      map, bumpMap, bumpScale: 0.9,
      roughness: def.rough, metalness: 0,
      side: opts.side || THREE.FrontSide
    });
    matCache.set(key, m);
  }
  return m;
}

/** 3D model for a dragged path item (sidewalk/driveway/gravel/water stream).
 *  Geometry is built relative to the item's center so the usual item posing
 *  (and drag translation) applies unchanged. */
export function buildPathModel(it, def) {
  const g = new THREE.Group();
  const width = it.pw || def.path.width;
  const isWater = def.path.surface === 'water';
  const h = isWater ? 6 : Math.max(def.h || 4, 3);
  const rel = it.path.map(p => ({ x: p.x - it.x, y: p.y - it.y }));
  const mat = isWater ? waterMat() : archMat(def.path.mat);
  const scale = MATERIAL_MAP.get(def.path.mat)?.scale ?? 200;
  const topY = isWater ? h - 2 : h; // water sits slightly recessed
  const add = (mesh) => {
    mesh.receiveShadow = true;
    g.add(mesh);
    return mesh;
  };
  let u0 = 0; // cumulative run length so the texture flows across segments
  for (let i = 1; i < rel.length; i++) {
    const a = rel[i - 1], b = rel[i];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len < 1) continue;
    const geo = new THREE.BoxGeometry(len, topY, width);
    if (!isWater) pathBoxUV(geo, len, u0, scale);
    const mesh = add(new THREE.Mesh(geo, mat));
    mesh.position.set((a.x + b.x) / 2, topY / 2, (a.y + b.y) / 2);
    mesh.rotation.y = -Math.atan2(b.y - a.y, b.x - a.x);
    u0 += len;
  }
  // round caps and elbows, oriented along the local run direction
  let d0 = 0;
  for (let i = 0; i < rel.length; i++) {
    const p = rel[i];
    const prev = rel[i - 1], next = rel[i + 1];
    if (prev) d0 += Math.hypot(p.x - prev.x, p.y - prev.y);
    const aIn = prev ? Math.atan2(p.y - prev.y, p.x - prev.x) : null;
    const aOut = next ? Math.atan2(next.y - p.y, next.x - p.x) : null;
    let ang = aIn ?? aOut ?? 0;
    if (aIn !== null && aOut !== null) {
      ang = Math.atan2(Math.sin(aIn) + Math.sin(aOut), Math.cos(aIn) + Math.cos(aOut));
    }
    const geo = new THREE.CylinderGeometry(width / 2, width / 2, topY - 0.2, 22);
    if (!isWater) cylinderRunUV(geo, d0, scale);
    const mesh = add(new THREE.Mesh(geo, mat));
    mesh.position.set(p.x, (topY - 0.2) / 2, p.y);
    mesh.rotation.y = -ang;
  }
  if (isWater) {
    // dark stream bed under the water surface
    const bed = solidMat('#22394a');
    for (let i = 1; i < rel.length; i++) {
      const a = rel[i - 1], b = rel[i];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len < 1) continue;
      const mesh = add(new THREE.Mesh(new THREE.BoxGeometry(len + 6, 1.6, width + 6), bed));
      mesh.position.set((a.x + b.x) / 2, 0.8, (a.y + b.y) / 2);
      mesh.rotation.y = -Math.atan2(b.y - a.y, b.x - a.x);
    }
  }
  return g;
}

let _waterMat = null;
function waterMat() {
  if (!_waterMat) {
    _waterMat = new THREE.MeshStandardMaterial({
      color: '#2e6a86', roughness: 0.06, metalness: 0.45,
      transparent: true, opacity: 0.92
    });
  }
  return _waterMat;
}

let _bedMat = null;
function solidMat(hex) {
  if (!_bedMat) _bedMat = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.95 });
  return _bedMat;
}

/** UVs for a path segment box: U runs along the segment (local x) with the
 *  cumulative run distance u0 carried in, so the texture follows the stroke. */
function pathBoxUV(geo, len, u0, scaleCm) {
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + len / 2 + u0, y = pos.getY(i), z = pos.getZ(i);
    const nx = Math.abs(nor.getX(i)), ny = Math.abs(nor.getY(i)), nz = Math.abs(nor.getZ(i));
    let u = x, v;
    if (ny >= nx && ny >= nz) v = z;        // top/bottom
    else if (nz >= nx) v = y;               // long sides
    else { u = z; v = y; }                  // end caps
    uv.setXY(i, u / scaleCm, v / scaleCm);
  }
  uv.needsUpdate = true;
  return geo;
}

/** Planar top-down UVs for a path joint cylinder, phase-aligned to the run. */
function cylinderRunUV(geo, d0, scaleCm) {
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) + d0) / scaleCm, pos.getZ(i) / scaleCm);
  }
  uv.needsUpdate = true;
  return geo;
}

/** Remap a BoxGeometry's UVs to world units / textureScale (planar per axis). */
function boxWorldUV(geo, offset, scaleCm) {
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + offset.x, y = pos.getY(i) + offset.y, z = pos.getZ(i) + offset.z;
    const nx = Math.abs(nor.getX(i)), ny = Math.abs(nor.getY(i)), nz = Math.abs(nor.getZ(i));
    let u, v;
    if (nx >= ny && nx >= nz) { u = z; v = y; }
    else if (ny >= nx && ny >= nz) { u = x; v = z; }
    else { u = x; v = y; }
    uv.setXY(i, u / scaleCm, v / scaleCm);
  }
  uv.needsUpdate = true;
  return geo;
}

function wallBox(parent, mat, matId, w, h, d, x, y, z, ry) {
  const def = MATERIAL_MAP.get(matId);
  const geo = new THREE.BoxGeometry(w, h, d);
  boxWorldUV(geo, new THREE.Vector3(x, y + h / 2, z), def?.scale ?? 200);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y + h / 2, z);
  if (ry) mesh.rotation.y = ry;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/** Which room contains a probe point? Returns its style-key or null. */
function roomAt(rooms, x, y) {
  for (const r of rooms) {
    if (pointInPolygon(x, y, r.polygon)) return r;
  }
  return null;
}

const FRAME = () => new THREE.MeshStandardMaterial({ color: '#ede9e2', roughness: 0.55 });
let frameMat = null, doorMat = null, glassMat = null, handleMat = null;
function doorMats() {
  if (!frameMat) {
    frameMat = FRAME();
    doorMat = new THREE.MeshStandardMaterial({ color: '#dcd6ca', roughness: 0.5 });
    glassMat = new THREE.MeshPhysicalMaterial({
      color: '#bcd8e2', transparent: true, opacity: 0.22, roughness: 0.04, side: THREE.DoubleSide
    });
    handleMat = new THREE.MeshStandardMaterial({ color: '#8e9296', roughness: 0.3, metalness: 0.9 });
  }
  return { frameMat, doorMat, glassMat, handleMat };
}

function bar(parent, mat, w, h, d, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/** 3D model for an opening, built in wall-local space (x along wall, z across). */
function buildOpeningModel(o, thickness) {
  const g = new THREE.Group();
  const { frameMat, doorMat, glassMat, handleMat } = doorMats();
  const w = o.width, h = o.height, sill = o.sill || 0;
  const jamb = 5, t = thickness + 2;
  const isWin = o.type.startsWith('window');

  const windowFrame = (withGlass = true) => {
    bar(g, frameMat, w + 4, jamb, t, 0, sill + h - jamb / 2, 0);       // header
    bar(g, frameMat, w + 8, jamb, t + 4, 0, sill + jamb / 2 - 1, 0);   // sill
    bar(g, frameMat, jamb, h, t, -w / 2 + jamb / 2, sill + h / 2, 0);
    bar(g, frameMat, jamb, h, t, w / 2 - jamb / 2, sill + h / 2, 0);
    if (withGlass) bar(g, glassMat, w - jamb, h - jamb, 1, 0, sill + h / 2, 0);
  };
  const doorFrame = () => {
    bar(g, frameMat, w + 6, jamb, t, 0, h - jamb / 2 + 2, 0);
    bar(g, frameMat, jamb, h, t, -w / 2 - 0.5, h / 2, 0);
    bar(g, frameMat, jamb, h, t, w / 2 + 0.5, h / 2, 0);
  };
  /** Hinged panel with the hinge at local x=0, extending toward +x. */
  const makeLeaf = (lw, glass = false) => {
    const leaf = new THREE.Group();
    if (glass) {
      // French style: a real glass lite cut through the leaf, seen from
      // both sides — border rails/stiles around it plus a slim grid
      const lh = h - jamb;
      const gw = lw - 16, gh = lh - 26;
      bar(leaf, doorMat, lw, 16, 4.5, lw / 2, 8, 0);                    // bottom rail
      bar(leaf, doorMat, lw, 10, 4.5, lw / 2, lh - 5, 0);               // top rail
      bar(leaf, doorMat, 8, lh, 4.5, 4, lh / 2, 0);                     // hinge stile
      bar(leaf, doorMat, 8, lh, 4.5, lw - 4, lh / 2, 0);                // lock stile
      bar(leaf, glassMat, gw, gh, 1, lw / 2, 16 + gh / 2, 0);
      bar(leaf, frameMat, 2.4, gh, 1.6, lw / 2, 16 + gh / 2, 0);        // grid: vertical
      for (let i = 1; i < 4; i++) {
        bar(leaf, frameMat, gw, 2.4, 1.6, lw / 2, 16 + gh * (i / 4), 0);
      }
    } else {
      bar(leaf, doorMat, lw, h - jamb, 4.5, lw / 2, (h - jamb) / 2, 0);
      for (let i = 0; i < 2; i++) {
        bar(leaf, new THREE.MeshStandardMaterial({ color: '#d2ccc0', roughness: 0.5 }),
          lw - 18, (h - jamb) / 2 - 22, 1.2, lw / 2, (h - jamb) * (0.28 + i * 0.47), 2.8);
      }
    }
    const knobY = 96;
    bar(leaf, handleMat, 3, 3, 3, lw - 8, knobY, 4);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(3.4, 14, 10), handleMat);
    knob.position.set(lw - 8, knobY, 6.5);
    leaf.add(knob);
    return leaf;
  };
  const slidingPanels = (y0, hh) => {
    bar(g, glassMat, w * 0.52, hh, 1.2, -w * 0.24, y0 + hh / 2, 2.4);
    bar(g, glassMat, w * 0.52, hh, 1.2, w * 0.24, y0 + hh / 2, -2.4);
    for (const [px, pz] of [[-w * 0.24, 2.4], [w * 0.24, -2.4]]) {
      bar(g, frameMat, w * 0.52, 4, 3, px, y0 + hh - 2, pz);
      bar(g, frameMat, w * 0.52, 4, 3, px, y0 + 2, pz);
      bar(g, frameMat, 4, hh, 3, px - w * 0.26 + 2, y0 + hh / 2, pz);
      bar(g, frameMat, 4, hh, 3, px + w * 0.26 - 2, y0 + hh / 2, pz);
    }
  };

  switch (o.type) {
    case 'window': {
      windowFrame();
      bar(g, frameMat, 3, h - jamb, 4, 0, sill + h / 2, 0);            // mullion
      bar(g, frameMat, w - jamb, 3, 4, 0, sill + h / 2, 0);            // transom
      break;
    }
    case 'window_picture': {
      windowFrame(); // one clean uninterrupted pane
      break;
    }
    case 'window_sliding': {
      windowFrame(false);
      slidingPanels(sill + jamb / 2, h - jamb);
      break;
    }
    case 'window_casement': {
      windowFrame(false);
      // sash hinged at a jamb, cracked open: border frame around real glass
      const sash = new THREE.Group();
      const sw = w - jamb * 2, sh = h - jamb;
      bar(sash, frameMat, sw, 6, 3, sw / 2, 3, 0);                      // bottom
      bar(sash, frameMat, sw, 6, 3, sw / 2, sh - 3, 0);                 // top
      bar(sash, frameMat, 6, sh - 12, 3, 3, sh / 2, 0);                 // hinge side
      bar(sash, frameMat, 6, sh - 12, 3, sw - 3, sh / 2, 0);            // free side
      bar(sash, glassMat, sw - 10, sh - 10, 1, sw / 2, sh / 2, 0);
      sash.position.set((o.swing ? 1 : -1) * (w / 2 - jamb), sill + jamb / 2, 0);
      if (o.swing) sash.scale.x = -1;
      sash.rotation.y = (o.swing ? 1 : -1) * (o.flip ? -0.3 : 0.3);
      g.add(sash);
      break;
    }
    case 'window_bay': {
      windowFrame(false);
      // bay assembly protruding outward: angled side panes + a wide front pane
      const out = o.flip ? 1 : -1;
      const depth = Math.min(60, w * 0.28);
      const frontW = w * 0.56;
      const bayH = h - jamb;
      const y0 = sill + jamb / 2;
      const bay = new THREE.Group();
      // shelf + top board
      for (const y of [y0 - 3, y0 + bayH + 1]) {
        const board = new THREE.Mesh(new THREE.BoxGeometry(w + 8, 5, depth + 10), frameMat);
        board.position.set(0, y, out * (depth / 2 + 1));
        board.castShadow = board.receiveShadow = true;
        bay.add(board);
      }
      const pane = (pw, x, z, ry) => {
        const seg = new THREE.Group();
        bar(seg, frameMat, pw, 4, 3, pw / 2, bayH - 2, 0);
        bar(seg, frameMat, pw, 4, 3, pw / 2, 2, 0);
        bar(seg, frameMat, 4, bayH, 3, 2, bayH / 2, 0);
        bar(seg, frameMat, 4, bayH, 3, pw - 2, bayH / 2, 0);
        bar(seg, glassMat, pw - 6, bayH - 8, 1, pw / 2, bayH / 2, 0);
        seg.position.set(x, y0, z);
        seg.rotation.y = ry;
        bay.add(seg);
      };
      const sideLen = Math.hypot((w - frontW) / 2, depth);
      const sideAng = Math.atan2(depth, (w - frontW) / 2);
      pane(frontW, -frontW / 2, out * depth, 0);
      pane(sideLen, -w / 2, 0, out * -sideAng);
      pane(sideLen, frontW / 2, out * depth, out * sideAng);
      g.add(bay);
      break;
    }
    case 'doorway': {
      doorFrame(); // cased opening only
      break;
    }
    case 'door': {
      doorFrame();
      const leaf = makeLeaf(w - jamb);
      leaf.position.set(-w / 2 + jamb / 2, 0, (o.flip ? -1 : 1) * 1);
      leaf.rotation.y = (o.flip ? 1 : -1) * (o.swing ? -0.45 : 0.45);
      if (o.swing) { leaf.position.x = w / 2 - jamb / 2; leaf.scale.x = -1; }
      g.add(leaf);
      break;
    }
    case 'double_door':
    case 'french_door': {
      doorFrame();
      const lw = (w - jamb) / 2;
      const glass = o.type === 'french_door';
      const left = makeLeaf(lw, glass);
      left.position.set(-w / 2 + jamb / 2, 0, (o.flip ? -1 : 1) * 1);
      left.rotation.y = (o.flip ? 1 : -1) * 0.4;
      const right = makeLeaf(lw, glass);
      right.position.set(w / 2 - jamb / 2, 0, (o.flip ? -1 : 1) * 1);
      right.scale.x = -1;
      right.rotation.y = (o.flip ? -1 : 1) * 0.4;
      g.add(left, right);
      break;
    }
    case 'pocket_door': {
      doorFrame();
      // panel half retracted into its wall pocket
      const lw = w - jamb;
      bar(g, doorMat, lw * 0.55, h - jamb, 4, -w / 2 + lw * 0.275 + jamb / 2, (h - jamb) / 2, 0);
      bar(g, handleMat, 2.5, 14, 5.5, -w / 2 + lw * 0.55 + 1, 100, 0);
      break;
    }
    case 'garage_door': {
      doorFrame();
      // sectional slat panel, slightly recessed (slats run right up to the
      // header so no daylight gap shows above the door)
      const slats = 4;
      const sh = (h - 1) / slats;
      const slatMat = new THREE.MeshStandardMaterial({ color: '#e3dfd6', roughness: 0.6 });
      const slatMat2 = new THREE.MeshStandardMaterial({ color: '#d6d2c8', roughness: 0.6 });
      for (let i = 0; i < slats; i++) {
        bar(g, i % 2 ? slatMat2 : slatMat, w - jamb, sh - 1.2, 4.5, 0, sh * i + sh / 2, 0);
      }
      // top row of little windows
      for (let i = 0; i < 4; i++) {
        bar(g, glassMat, (w - jamb) / 4 - 14, sh * 0.45, 1.2,
          -(w - jamb) / 2 + (w - jamb) * ((i + 0.5) / 4), sh * (slats - 0.5), 3);
      }
      bar(g, handleMat, 24, 3.5, 3.5, 0, sh * 0.5, 3.5);
      break;
    }
    default: {
      if (isWin) windowFrame();
      else doorFrame();
    }
  }
  return g;
}

/**
 * Build all walls. Each wall is built as two half-thickness slabs so each
 * face can carry the paint/material of the room it looks into.
 */
export function buildWalls(project, rooms) {
  const group = new THREE.Group();
  const { walls, openings, roomStyles, settings } = project;

  for (const wall of walls) {
    const len = wallLength(wall);
    if (len < 2) continue;
    const ang = wallAngle(wall);
    const H = wall.height || settings.wallHeight;
    const th = wall.thickness;
    const cx = (wall.ax + wall.bx) / 2, cy = (wall.ay + wall.by) / 2;
    // wall-local group: x along wall, z across
    const wg = new THREE.Group();
    wg.position.set(cx, 0, cy);
    wg.rotation.y = -ang;

    // normal in plan space
    const nx = Math.sin(ang), ny = -Math.cos(ang);

    // openings on this wall sorted along it
    const ops = openings
      .filter(o => o.wallId === wall.id)
      .map(o => ({ o, c: o.t * len }))
      .sort((a, b) => a.c - b.c);

    // material per side, from the room each side faces
    for (const side of [1, -1]) {
      const probeX = cx + nx * (th / 2 + 6) * side;
      const probeY = cy + ny * (th / 2 + 6) * side;
      const room = roomAt(rooms, probeX, probeY);
      const matId = room
        ? (roomStyles[room.key]?.wall || settings.defaultWall)
        : (wall.extMat || settings.exteriorWall);
      const mat = archMat(matId);
      const roomKey = room?.key || null;
      // z offset of this slab in local space: local +z corresponds to plan normal?
      // local x axis = wall direction, local z = (sin, -cos) rotated... With
      // wg.rotation.y=-ang, local +x maps to (cos, sin), local +z maps to (-sin? )
      // Actually rotY(-ang) maps +x→(cosang, 0, sinang) in (x,z) plan = along wall ✓,
      // and +z→(-sin(-ang)?) — compute: rotY(θ): x' = x cosθ + z sinθ; z' = -x sinθ + z cosθ.
      // θ=-ang, local z=1: x' = sin(-(-ang))? Use: x' = z sinθ = -sin(ang)? => plan dx=-sin(ang), dz=cos(ang).
      // Plan normal side +1 is (sin, -cos) → equals local z = -1.
      const zLocal = -side * th / 4;

      const segs = [];
      let x0 = -len / 2;
      for (const { o, c } of ops) {
        const oc = c - len / 2;
        const left = oc - o.width / 2, right = oc + o.width / 2;
        if (left > x0 + 0.5) segs.push({ x0, x1: left, y0: 0, y1: H });
        // above opening
        const topY = (o.sill || 0) + o.height;
        if (topY < H - 0.5) segs.push({ x0: left, x1: right, y0: topY, y1: H });
        // below window
        if ((o.sill || 0) > 0.5) segs.push({ x0: left, x1: right, y0: 0, y1: o.sill });
        x0 = right;
      }
      if (x0 < len / 2 - 0.5) segs.push({ x0, x1: len / 2, y0: 0, y1: H });

      for (const s of segs) {
        const mesh = wallBox(wg, mat, matId, s.x1 - s.x0, s.y1 - s.y0, th / 2,
          (s.x0 + s.x1) / 2, s.y0, zLocal);
        mesh.userData.roomKey = roomKey;
        mesh.userData.wallId = wall.id;
        if (!room) mesh.userData.exterior = true;
      }
    }

    // top cap
    const capId = wall.extMat || settings.exteriorWall;
    wallBox(wg, archMat(capId), capId, len, 2.5, th, 0, H, 0);

    // opening models (tagged so taps on a door/window still find the wall)
    for (const { o, c } of ops) {
      const om = buildOpeningModel(o, th);
      om.position.set(c - len / 2, 0, 0);
      om.userData.wallId = wall.id;
      om.userData.openingId = o.id;
      wg.add(om);
    }

    group.add(wg);
  }
  return group;
}

/** Room polygon → THREE.Shape in plan coords (x, -y), with cut-out holes
 *  (stairwell openings) whose centers fall inside that polygon. */
function roomShape(polygon, holes) {
  const shape = new THREE.Shape();
  polygon.forEach((p, i) => {
    if (i === 0) shape.moveTo(p.x, -p.y);
    else shape.lineTo(p.x, -p.y);
  });
  for (const hole of holes || []) {
    let cx = 0, cy = 0;
    for (const p of hole) { cx += p.x; cy += p.y; }
    cx /= hole.length; cy /= hole.length;
    if (!pointInPolygon(cx, cy, polygon)) continue;
    const path = new THREE.Path();
    hole.forEach((p, i) => {
      if (i === 0) path.moveTo(p.x, -p.y);
      else path.lineTo(p.x, -p.y);
    });
    shape.holes.push(path);
  }
  return shape;
}

export function buildFloors(project, rooms, holes = []) {
  const group = new THREE.Group();
  for (const r of rooms) {
    const style = project.roomStyles[r.key];
    const matId = style?.floor || project.settings.defaultFloor;
    const def = MATERIAL_MAP.get(matId);
    const geo = new THREE.ShapeGeometry(roomShape(r.polygon, holes));
    // scale UVs (which equal shape coords) into texture repeats
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, uv.getX(i) / (def?.scale ?? 200), uv.getY(i) / (def?.scale ?? 200));
    }
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, archMat(matId));
    mesh.position.y = 0.6;
    mesh.receiveShadow = true;
    mesh.userData.roomKey = r.key;
    mesh.userData.walkable = true;
    group.add(mesh);
  }
  return group;
}

export function buildCeilings(project, rooms, holes = []) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: '#f0ede6', roughness: 0.95, side: THREE.DoubleSide });
  for (const r of rooms) {
    const geo = new THREE.ShapeGeometry(roomShape(r.polygon, holes));
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = project.settings.wallHeight - 0.5;
    group.add(mesh);
  }
  return group;
}

export function buildGround(project) {
  const group = new THREE.Group();
  const matId = project.settings.groundType || 'grass';
  const geo = new THREE.CircleGeometry(4000, 64);
  const def = MATERIAL_MAP.get(matId);
  const uv = geo.attributes.uv;
  const pos = geo.attributes.position;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, pos.getX(i) / (def?.scale ?? 300), pos.getY(i) / (def?.scale ?? 300));
  }
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, archMat(matId));
  mesh.position.y = -1;
  mesh.receiveShadow = true;
  mesh.userData.walkable = true;
  group.add(mesh);
  return group;
}
