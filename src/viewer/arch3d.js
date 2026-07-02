// Builds the architectural 3D geometry (walls, floors, ceilings, doors,
// windows, ground) from the project data. Units: centimeters, +Y up.
// Plan (x, y) maps to 3D (x, z).
import * as THREE from 'three';
import { wallLength, wallAngle, pointInPolygon } from '../core/geometry.js';
import { getTextureCanvases, MATERIAL_MAP } from '../core/textures.js';

const matCache = new Map();

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
      map, bumpMap, bumpScale: 0.5,
      roughness: def.rough, metalness: 0,
      side: opts.side || THREE.FrontSide
    });
    matCache.set(key, m);
  }
  return m;
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

  if (o.type === 'window') {
    bar(g, frameMat, w + 4, jamb, t, 0, sill + h - jamb / 2, 0);       // header
    bar(g, frameMat, w + 8, jamb, t + 4, 0, sill + jamb / 2 - 1, 0);   // sill
    bar(g, frameMat, jamb, h, t, -w / 2 + jamb / 2, sill + h / 2, 0);
    bar(g, frameMat, jamb, h, t, w / 2 - jamb / 2, sill + h / 2, 0);
    bar(g, glassMat, w - jamb, h - jamb, 1, 0, sill + h / 2, 0);
    bar(g, frameMat, 3, h - jamb, 4, 0, sill + h / 2, 0);              // mullion
    bar(g, frameMat, w - jamb, 3, 4, 0, sill + h / 2, 0);              // transom
  } else {
    // door family: jambs + header
    bar(g, frameMat, w + 6, jamb, t, 0, h - jamb / 2 + 2, 0);
    bar(g, frameMat, jamb, h, t, -w / 2 - 0.5, h / 2, 0);
    bar(g, frameMat, jamb, h, t, w / 2 + 0.5, h / 2, 0);
    if (o.type === 'door') {
      // hinged panel, slightly ajar
      const leaf = new THREE.Group();
      const lw = w - jamb;
      bar(leaf, doorMat, lw, h - jamb, 4.5, lw / 2, (h - jamb) / 2, 0);
      // inset panels
      for (let i = 0; i < 2; i++) {
        bar(leaf, new THREE.MeshStandardMaterial({ color: '#d2ccc0', roughness: 0.5 }),
          lw - 18, (h - jamb) / 2 - 22, 1.2, lw / 2, (h - jamb) * (0.28 + i * 0.47), 2.8);
      }
      const knobY = 96;
      bar(leaf, handleMat, 3, 3, 3, lw - 8, knobY, 4);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(3.4, 14, 10), handleMat);
      knob.position.set(lw - 8, knobY, 6.5);
      leaf.add(knob);
      leaf.position.set(-w / 2 + jamb / 2, 0, (o.flip ? -1 : 1) * 1);
      leaf.rotation.y = (o.flip ? 1 : -1) * (o.swing ? -0.45 : 0.45);
      if (o.swing) { leaf.position.x = w / 2 - jamb / 2; leaf.scale.x = -1; }
      g.add(leaf);
    } else if (o.type === 'slidingDoor') {
      bar(g, glassMat, w * 0.52, h - jamb, 1.2, -w * 0.24, (h - jamb) / 2, 2.4);
      bar(g, glassMat, w * 0.52, h - jamb, 1.2, w * 0.24, (h - jamb) / 2, -2.4);
      bar(g, frameMat, w * 0.52, 4, 3, -w * 0.24, h - jamb - 2, 2.4);
      bar(g, frameMat, w * 0.52, 4, 3, w * 0.24, h - jamb - 2, -2.4);
      bar(g, frameMat, w * 0.52, 4, 3, -w * 0.24, 2, 2.4);
      bar(g, frameMat, w * 0.52, 4, 3, w * 0.24, 2, -2.4);
    }
    // doorway: frame only
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
        : settings.exteriorWall;
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
      }
    }

    // top cap
    const capMat = archMat(settings.exteriorWall);
    wallBox(wg, capMat, settings.exteriorWall, len, 2.5, th, 0, H, 0);

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

export function buildFloors(project, rooms) {
  const group = new THREE.Group();
  for (const r of rooms) {
    const style = project.roomStyles[r.key];
    const matId = style?.floor || project.settings.defaultFloor;
    const def = MATERIAL_MAP.get(matId);
    const shape = new THREE.Shape();
    r.polygon.forEach((p, i) => {
      if (i === 0) shape.moveTo(p.x, -p.y);
      else shape.lineTo(p.x, -p.y);
    });
    const geo = new THREE.ShapeGeometry(shape);
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
    group.add(mesh);
  }
  return group;
}

export function buildCeilings(project, rooms) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: '#f0ede6', roughness: 0.95, side: THREE.DoubleSide });
  for (const r of rooms) {
    const shape = new THREE.Shape();
    r.polygon.forEach((p, i) => {
      if (i === 0) shape.moveTo(p.x, -p.y);
      else shape.lineTo(p.x, -p.y);
    });
    const geo = new THREE.ShapeGeometry(shape);
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
  group.add(mesh);
  return group;
}
