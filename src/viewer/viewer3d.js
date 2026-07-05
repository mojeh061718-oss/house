// Real-time 3D view: renders the project with lighting/shadows, orbit and
// first-person walk controls, and direct furniture editing (drag with wall
// snapping) in 3D. All pointer input goes through rotation-aware helpers so
// the forced-landscape mode on iPhone/iPad works identically.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildWalls, buildFloors, buildCeilings, buildGround, buildPathModel, buildFloorSlab } from './arch3d.js';
import { ITEM_MAP, paletteFor } from '../catalog/items.js';
import { clamp, wallLength } from '../core/geometry.js';
import { snapPose, createPathItem, shapePolyline, anchorWallItem } from '../core/placement.js';
import { openingDefaults } from '../core/openings.js';
import { localPos } from '../core/orientation.js';
import { detectRooms, roomKey } from '../core/geometry.js';

const SLAB = 30; // structural slab between stacked floors (cm)

export class Viewer3D {
  constructor(container, store) {
    this.container = container;
    this.store = store;
    this.walkMode = false;
    this.showCeilings = false;
    this.hideRoof = false;      // "Roof" button hides roof items to peek inside
    this.needsRebuild = true;
    this.itemGroups = new Map();

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);
    this.renderer = renderer;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog('#bfd5e4', 3500, 12000);
    this.scene = scene;

    // image-based environment lighting: materials pick up soft realistic
    // reflections instead of looking flat
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.55;

    this.camera = new THREE.PerspectiveCamera(50, 1, 5, 30000);
    this.camera.position.set(600, 550, 750);

    // custom orbit rig (rotation-aware, touch-first)
    this.orbit = {
      target: new THREE.Vector3(0, 60, 0),
      theta: 0.6, phi: 1.0, radius: 900,
      enabled: true
    };

    // lighting
    const hemi = new THREE.HemisphereLight('#dfeaf4', '#8a7f6a', 0.75);
    scene.add(hemi);
    this.hemi = hemi;
    const sun = new THREE.DirectionalLight('#fff4e0', 2.0);
    sun.position.set(900, 1400, 600);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 100;
    sun.shadow.camera.far = 6000;
    sun.shadow.bias = -0.0004;
    sun.shadow.radius = 4;
    scene.add(sun);
    scene.add(sun.target);
    this.sun = sun;

    // crisp stars as point sprites (canvas stars blur on the huge dome)
    {
      const starGeo = new THREE.BufferGeometry();
      const pos = new Float32Array(420 * 3);
      let sr = 24681357;
      const rnd = () => { sr = (sr * 1664525 + 1013904223) >>> 0; return sr / 4294967296; };
      for (let i = 0; i < 420; i++) {
        const az = rnd() * Math.PI * 2;
        const el = Math.asin(rnd() * 0.96 + 0.03);
        const r = 11000;
        pos[i * 3] = Math.cos(az) * Math.cos(el) * r;
        pos[i * 3 + 1] = Math.sin(el) * r;
        pos[i * 3 + 2] = Math.sin(az) * Math.cos(el) * r;
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      this.stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
        color: '#ffffff', size: 2.2, sizeAttenuation: false,
        transparent: true, opacity: 0, depthWrite: false, fog: false
      }));
      scene.add(this.stars);
    }

    // sky dome: gradient + clouds by day, moon at night
    this.skyCanvas = document.createElement('canvas');
    this.skyCanvas.width = 1024;
    this.skyCanvas.height = 512;
    this.skyTexture = new THREE.CanvasTexture(this.skyCanvas);
    this.skyTexture.colorSpace = THREE.SRGBColorSpace;
    const skyGeo = new THREE.SphereGeometry(12000, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({ map: this.skyTexture, side: THREE.BackSide, fog: false });
    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    scene.add(this.skyDome);
    this.applyTimeOfDay(13);

    this.archGroup = new THREE.Group();
    this.itemsGroup = new THREE.Group();
    this.groundGroup = new THREE.Group();
    scene.add(this.archGroup, this.itemsGroup, this.groundGroup);

    this.selBox = new THREE.Box3Helper(new THREE.Box3(), new THREE.Color('#3884ff'));
    this.selBox.visible = false;
    scene.add(this.selBox);

    // walk state
    this.walk = { yaw: 0, pitch: 0, keys: new Set(), pos: new THREE.Vector3(0, 160, 400) };

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.drag = null;       // item drag
    this.gesture = null;    // orbit / pinch / walk-look
    this.pointers = new Map();

    const el = renderer.domElement;
    el.addEventListener('pointerdown', e => this.onDown(e));
    el.addEventListener('pointermove', e => this.onMove(e));
    el.addEventListener('pointerup', e => this.onUp(e));
    el.addEventListener('pointercancel', e => this.onUp(e));
    el.addEventListener('wheel', e => this.onWheel(e), { passive: false });
    el.style.touchAction = 'none';
    window.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      this.walk.keys.add(e.code);
    });
    window.addEventListener('keyup', e => this.walk.keys.delete(e.code));

    store.on('change', ({ structural }) => {
      if (structural) this.needsRebuild = true;
      else this.syncItems();
    });
    store.on('selection', () => this.updateSelBox());
    store.on('level', () => { this.needsRebuild = true; });
    store.on('projectLoaded', () => {
      this.needsRebuild = true;
      this.frameAll();
      this.applyTimeOfDay(store.project.settings.timeOfDay ?? 13);
    });

    this.clock = new THREE.Clock();

    // performance overlay for real-device debugging (?debug=1)
    if (/[?&]debug=1/.test(location.search)) {
      const d = document.createElement('div');
      d.style.cssText = 'position:absolute;left:8px;top:8px;z-index:99;background:rgba(0,0,0,0.65);' +
        'color:#7fff9a;font:10px monospace;padding:6px 8px;border-radius:6px;pointer-events:none;white-space:pre';
      container.appendChild(d);
      this.debugEl = d;
      this._frames = 0;
      this._lastFpsAt = performance.now();
      setInterval(() => {
        const now = performance.now();
        const fps = Math.round((this._frames * 1000) / (now - this._lastFpsAt));
        this._frames = 0;
        this._lastFpsAt = now;
        const i = this.renderer.info;
        d.textContent =
          `fps ${fps}\ncalls ${i.render.calls}\ntris ${(i.render.triangles / 1000).toFixed(1)}k` +
          `\ngeo ${i.memory.geometries} tex ${i.memory.textures}`;
      }, 1000);
    }

    renderer.setAnimationLoop(() => this.tick());
  }

  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return;
    const c = this.renderer.domElement;
    if (c.width !== Math.floor(w * this.renderer.getPixelRatio()) ||
        c.height !== Math.floor(h * this.renderer.getPixelRatio())) {
      this.renderer.setSize(w, h, false);
    }
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  center() {
    const p = this.store.project;
    let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9, n = 0;
    for (const w of p.walls) {
      minX = Math.min(minX, w.ax, w.bx); maxX = Math.max(maxX, w.ax, w.bx);
      minY = Math.min(minY, w.ay, w.by); maxY = Math.max(maxY, w.ay, w.by);
      n++;
    }
    if (!n) return { x: 0, z: 0, span: 800 };
    return {
      x: (minX + maxX) / 2, z: (minY + maxY) / 2,
      span: Math.max(maxX - minX, maxY - minY, 400)
    };
  }

  frameAll() {
    const c = this.center();
    this.orbit.target.set(c.x, 60, c.z);
    this.orbit.radius = clamp(c.span * 1.6, 300, 4000);
    this.orbit.theta = 0.55;
    this.orbit.phi = 0.95;
    this.applyOrbit();
    this.sun.target.position.set(c.x, 0, c.z);
    const s = this.sun.shadow.camera;
    s.left = -c.span; s.right = c.span; s.top = c.span; s.bottom = -c.span;
    s.updateProjectionMatrix();
    this.walk.pos.set(c.x, 160, c.z + 100);
  }

  applyOrbit() {
    const o = this.orbit;
    // room-focus mode: keep the camera locked onto the room so panning & zoom
    // stay contained instead of wandering off across the house
    if (this.focusRoomKey && this._focusBounds) {
      const b = this._focusBounds;
      o.target.x = clamp(o.target.x, b.minX, b.maxX);
      o.target.z = clamp(o.target.z, b.minZ, b.maxZ);
      const fit = this._focusFit || 800;
      o.radius = clamp(o.radius, fit * 0.45, fit * 1.5); // zoom in/out but stay on the room
    }
    o.phi = clamp(o.phi, 0.08, Math.PI / 2 - 0.02);
    o.radius = clamp(o.radius, 80, 6000);
    const sp = Math.sin(o.phi), cp = Math.cos(o.phi);
    this.camera.position.set(
      o.target.x + o.radius * sp * Math.sin(o.theta),
      o.target.y + o.radius * cp,
      o.target.z + o.radius * sp * Math.cos(o.theta)
    );
    this.camera.lookAt(o.target);
  }

  /** Y offset of a stacked level's base. */
  levelY(i) {
    return i * (this.store.project.settings.wallHeight + SLAB);
  }

  /** Stairwell cut-outs cast by a level's stairs/elevators (world rects). */
  /** A rectangular pseudo-room spanning the bounding box of a level's walls,
   *  used to give open-plan upper storeys a floor when no closed room exists. */
  floorFootprintRoom(walls) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const w of walls) {
      minX = Math.min(minX, w.ax, w.bx); maxX = Math.max(maxX, w.ax, w.bx);
      minY = Math.min(minY, w.ay, w.by); maxY = Math.max(maxY, w.ay, w.by);
    }
    if (!isFinite(minX) || maxX - minX < 1 || maxY - minY < 1) return null;
    return {
      key: '__footprint__',
      polygon: [
        { x: minX, y: minY }, { x: maxX, y: minY },
        { x: maxX, y: maxY }, { x: minX, y: maxY }
      ],
      centroid: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
      area: (maxX - minX) * (maxY - minY),
      wallIds: new Set()
    };
  }

  stairHoles(lvl) {
    const holes = [];
    for (const it of lvl.items) {
      const def = ITEM_MAP.get(it.defId);
      const t = def?.plan?.type;
      if (t !== 'stairs' && t !== 'elevator') continue;
      const cos = Math.cos(it.rotation || 0), sin = Math.sin(it.rotation || 0);
      const hw = it.w / 2, hd = it.d / 2;
      holes.push([[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([lx, ly]) => ({
        x: it.x + lx * cos - ly * sin,
        y: it.y + lx * sin + ly * cos
      })));
    }
    return holes;
  }

  rebuild() {
    this.needsRebuild = false;
    const { project } = this.store;
    const active = project.activeLevel ?? 0;
    this.disposeGroup(this.archGroup);
    this.disposeGroup(this.groundGroup);
    const guard = (fn, what) => {
      try { fn(); } catch (err) { console.warn(what + ' build failed', err); }
    };
    // render every level up to the active one — or the whole house in
    // view-all mode — stacked
    const top = this.topLevel();
    for (let i = 0; i <= top; i++) {
      const lvl = project.levels[i];
      const shim = {
        walls: lvl.walls, openings: lvl.openings,
        roomStyles: lvl.roomStyles, settings: project.settings
      };
      const rooms = i === active ? this.store.rooms
        : detectRooms(lvl.walls).map(r => (r.key = roomKey(r), r));
      // open-plan upper storeys whose walls don't close into a room would
      // otherwise get NO floor and appear to float over a gap — fall back to a
      // slab spanning the level's wall footprint so there's always ground to
      // stand on (floors + structural slab only; walls/ceilings stay as-is)
      let floorRooms = rooms;
      if (i > 0 && !rooms.length && lvl.walls.length) {
        const fb = this.floorFootprintRoom(lvl.walls);
        if (fb) floorRooms = [fb];
      }
      // stairs on the level below cut an opening in this level's floor;
      // stairs on this level cut its ceiling (when a floor exists above)
      const floorHoles = i > 0 ? this.stairHoles(project.levels[i - 1]) : [];
      const g = new THREE.Group();
      g.position.y = this.levelY(i);
      g.userData.level = i;
      guard(() => g.add(buildWalls(shim, rooms)), 'walls');
      guard(() => g.add(buildFloors(shim, floorRooms, floorHoles)), 'floors');
      if ((this.showCeilings || this.walkMode) && i === active) {
        const ceilHoles = i < project.levels.length - 1 ? this.stairHoles(lvl) : [];
        guard(() => g.add(buildCeilings(shim, rooms, ceilHoles)), 'ceilings');
      }
      // upper levels sit on a solid structural slab that fills the gap down to
      // the storey below, so the floors read as one connected building
      if (i > 0) {
        guard(() => g.add(buildFloorSlab(shim, floorRooms, floorHoles, SLAB)), 'slab');
      }
      this.archGroup.add(g);
    }
    guard(() => this.groundGroup.add(buildGround(project)), 'ground');
    this.rebuildItems();
    const c = this.center();
    this.sun.target.position.set(c.x, 0, c.z);
    const s = this.sun.shadow.camera;
    const span = Math.max(c.span, 600);
    s.left = -span; s.right = span; s.top = span; s.bottom = -span;
    s.updateProjectionMatrix();
    this.applyTimeOfDay(this.timeOfDay ?? 13);
  }

  rebuildItems() {
    this.disposeGroup(this.itemsGroup);
    this.itemGroups.clear();
    const wallH = this.store.project.settings.wallHeight;
    const top = this.topLevel();
    // Real PointLights are capped so a yard full of fixtures can't blow the
    // WebGL light budget on a phone. Every fixture still GLOWS (emissive), but
    // only the nearest MAX cast an actual light pool. Re-picked on each rebuild.
    this._litItems = this.pickLitItems(top);
    for (let li = 0; li <= top; li++) {
    for (const it of this.store.project.levels[li].items) {
      const def = ITEM_MAP.get(it.defId);
      if (!def) continue;
      if (this.hideRoof && def.plan?.type === 'roof') continue; // peek inside
      // room-focus: show only the furniture that belongs to the focused room
      if (this.focusRoomKey && this._focusBounds && li === (this.store.project.activeLevel ?? 0)) {
        const b = this._focusBounds;
        if (it.x < b.minX - 40 || it.x > b.maxX + 40 || it.y < b.minZ - 40 || it.y > b.maxZ + 40) continue;
      }
      try {
        const isPath = def.path && it.path?.length >= 2;
        // a user-chosen surface texture (patio/deck "any material") overrides the
        // palette's mat/scale that the surface builders read
        let pal = paletteFor(it, def);
        if (it.mat) pal = { ...pal, mat: it.mat, scale: it.matScale || pal.scale || 200 };
        // a user's photo (picture frames) or sign text (house numbers) rides in
        // on the palette so the builder can render it
        if (it.photo) pal = { ...pal, photo: it.photo };
        if (it.sign != null) pal = { ...pal, sign: it.sign };
        // size-true builders (decks, pools, pads) rebuild at the item's real
        // dimensions so surface textures never stretch
        const model = isPath ? buildPathModel(it, def)
          : def.buildSized ? def.buildSized(pal, it.w, it.d, it.h)
            : def.build(pal);
        if (!isPath && !def.buildSized) model.scale.set(it.w / def.w, it.h / def.h, it.d / def.d);
        const outer = new THREE.Group();
        outer.add(model);
        outer.userData.itemId = it.id;
        outer.userData.level = li;
        outer.userData.palette = it.palette;
        if (def.plan?.type === 'stairs') outer.userData.walkable = true;
        outer.userData.w = it.w; outer.userData.d = it.d; outer.userData.h = it.h;
        outer.userData.pw = it.pw;
        outer.userData.mat = it.mat;
        outer.userData.photo = it.photo;
        outer.userData.sign = it.sign;
        this.poseItem(outer, it, def, wallH, this.levelY(li));
        if (def.light && this._litItems.has(it.id)) {
          const l = new THREE.PointLight(def.light.color, def.light.intensity, def.light.distance, 1.6);
          l.position.set(0, def.mount === 'ceiling' ? wallH + def.light.y : def.light.y, 0);
          outer.add(l);
        }
        this.itemsGroup.add(outer);
        this.itemGroups.set(it.id, outer);
      } catch (err) {
        // never let one bad item wipe the whole furniture pass
        console.warn('item build failed', it.defId, err);
      }
    }
    }
    this.updateSelBox();
  }

  /** Choose which light fixtures get a real PointLight (nearest to the camera
   *  first), capped so a scene packed with fixtures stays within the GPU's
   *  light budget. Returns a Set of item ids. */
  pickLitItems(top) {
    const MAX = 26;
    const cam = this.camera?.position;
    const lit = [];
    for (let li = 0; li <= top; li++) {
      for (const it of this.store.project.levels[li].items) {
        const def = ITEM_MAP.get(it.defId);
        if (!def?.light) continue;
        if (this.hideRoof && def.plan?.type === 'roof') continue;
        const d = cam ? (it.x - cam.x) ** 2 + (it.y - cam.z) ** 2 : 0;
        lit.push({ id: it.id, d });
      }
    }
    if (lit.length > MAX) lit.sort((a, b) => a.d - b.d);
    return new Set(lit.slice(0, MAX).map(l => l.id));
  }

  poseItem(outer, it, def, wallH, lvlY = 0) {
    const baseY = (def.mount === 'ceiling' ? wallH : (it.elevation || 0)) + lvlY;
    outer.position.set(it.x, baseY, it.y);
    outer.rotation.y = -it.rotation;
  }

  /** Cheap update path for drags: reuse models, only update transforms. */
  syncItems() {
    const wallH = this.store.project.settings.wallHeight;
    const active = this.store.project.activeLevel ?? 0;
    const lvlY = this.levelY(active);
    const alive = new Set();
    let structuralChange = false;
    for (const it of this.store.project.items) {
      alive.add(it.id);
      const g = this.itemGroups.get(it.id);
      if (!g) { structuralChange = true; continue; }
      const def = ITEM_MAP.get(it.defId);
      const model = g.children[0];
      if (g.userData.palette !== it.palette || g.userData.w !== it.w || g.userData.d !== it.d || g.userData.h !== it.h ||
          g.userData.pw !== it.pw || g.userData.mat !== it.mat ||
          g.userData.photo !== it.photo || g.userData.sign !== it.sign) {
        structuralChange = true;
      }
      this.poseItem(g, it, def, wallH, lvlY);
      if (model && !it.path && !def?.buildSized) model.scale.set(it.w / def.w, it.h / def.h, it.d / def.d);
    }
    for (const [id, g] of this.itemGroups) {
      if (g.userData.level === active && !alive.has(id)) structuralChange = true;
    }
    if (structuralChange) this.rebuildItems();
    else this.updateSelBox();
  }

  disposeGroup(group) {
    group.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      // shared cached materials (solid/wood/tex/…) must survive; only per-build
      // ones tagged `owned` (glow/foliage/grass/flags/shades) are freed here, or
      // they'd leak on every rebuild and eventually crash the tab
      const mats = Array.isArray(obj.material) ? obj.material : (obj.material ? [obj.material] : []);
      for (const m of mats) if (m?.userData?.owned) {
        if (m.userData.ownedMap) m.map?.dispose(); // unique photo/sign texture
        m.dispose();
      }
      if (obj.isInstancedMesh) obj.dispose();
    });
    group.clear();
  }

  updateSelBox() {
    const sel = this.store.selection;
    if (sel?.kind === 'multi') {
      const box = new THREE.Box3();
      let any = false;
      for (const id of sel.ids) {
        const g = this.itemGroups.get(id);
        if (g) { box.expandByObject(g); any = true; }
      }
      if (any) {
        this.selBox.box.copy(box);
        this.selBox.visible = true;
        return;
      }
    }
    if (sel?.kind === 'item') {
      const g = this.itemGroups.get(sel.id);
      if (g) {
        this.selBox.box.setFromObject(g);
        this.selBox.visible = true;
        // amber box = locked in place
        this.selBox.material.color.set(this.store.item(sel.id)?.locked ? '#d9a514' : '#3884ff');
        const it = this.store.item(sel.id);
        if (it) {
          g.userData.palette = it.palette;
          g.userData.w = it.w; g.userData.d = it.d; g.userData.h = it.h;
        }
        return;
      }
    }
    this.selBox.visible = false;
  }

  // ---- live 3D path-draw preview --------------------------------------------

  startPathPreview(def) {
    this.endPathPreview();
    const g = new THREE.Group();
    const color = def.path.surface === 'water' ? '#5aa8c8' : '#cfc9bd';
    g.userData.mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72 });
    this.scene.add(g);
    this.pathPreview = g;
  }

  addPathPreviewDot(x, y, width) {
    if (!this.pathPreview) return;
    const lvlY = this.levelY(this.store.project.activeLevel ?? 0);
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(width / 2, width / 2, 2, 16),
      this.pathPreview.userData.mat
    );
    m.position.set(x, lvlY + 2.5, y);
    this.pathPreview.add(m);
  }

  /** Rebuild the preview as a run of dots along an arbitrary polyline. */
  updatePathPreview(pts, width) {
    if (!this.pathPreview) return;
    for (let i = this.pathPreview.children.length - 1; i >= 0; i--) {
      const c = this.pathPreview.children[i];
      c.geometry?.dispose();
      this.pathPreview.remove(c);
    }
    const step = Math.max(20, width / 4);
    for (let s = 1; s < pts.length; s++) {
      const a = pts[s - 1], b = pts[s];
      const n = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / step));
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        this.addPathPreviewDot(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, width);
      }
    }
  }

  /** Resolve a path-draw gesture into a polyline for preview/commit. */
  pathGesturePolyline(g) {
    if (g.shape === 'free') return g.cur ? [...g.pts, g.cur] : g.pts;
    if (g.shape === 'line') return [g.start, g.cur];
    return shapePolyline(g.shape, g.start, g.cur);
  }

  /** Straight, angle-snapped ground endpoint for a drawn path (matches 2D). */
  straightPathEnd(start, end) {
    const dx = end.x - start.x, dy = end.y - start.y;
    const len = Math.round(Math.hypot(dx, dy) / 10) * 10;
    let ang = Math.atan2(dy, dx);
    const step = Math.PI / 4;
    const snapped = Math.round(ang / step) * step;
    if (Math.abs(ang - snapped) <= 0.12) ang = snapped;
    return { x: start.x + Math.cos(ang) * len, y: start.y + Math.sin(ang) * len };
  }

  endPathPreview() {
    if (!this.pathPreview) return;
    this.disposeGroup(this.pathPreview);
    this.scene.remove(this.pathPreview);
    this.pathPreview = null;
  }

  // ---- live 3D area-draw preview (patios, pools) ----------------------------

  startAreaPreview(def) {
    this.endAreaPreview();
    const color = def.plan?.type === 'pool' ? '#4d9fc4' : '#c9a877';
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(1, 3, 1),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6 })
    );
    m.visible = false;
    this.scene.add(m);
    this.areaPreview = m;
  }

  updateAreaPreview(s, c) {
    if (!this.areaPreview) return;
    const w = Math.abs(c.x - s.x), d = Math.abs(c.y - s.y);
    if (w < 4 || d < 4) { this.areaPreview.visible = false; return; }
    const lvlY = this.levelY(this.store.project.activeLevel ?? 0);
    this.areaPreview.visible = true;
    this.areaPreview.scale.set(w, 1, d);
    this.areaPreview.position.set((s.x + c.x) / 2, lvlY + 2.5, (s.y + c.y) / 2);
  }

  endAreaPreview() {
    if (!this.areaPreview) return;
    this.areaPreview.geometry.dispose();
    this.scene.remove(this.areaPreview);
    this.areaPreview = null;
  }

  // ---- walk joystick visual + camera flight --------------------------------

  showJoystick(x, y) {
    if (!this.joyEl) {
      const base = document.createElement('div');
      base.style.cssText = 'position:absolute;width:110px;height:110px;border-radius:50%;' +
        'border:2px solid rgba(255,255,255,0.35);background:rgba(255,255,255,0.08);' +
        'pointer-events:none;z-index:30;transform:translate(-50%,-50%)';
      const thumb = document.createElement('div');
      thumb.style.cssText = 'position:absolute;width:46px;height:46px;border-radius:50%;' +
        'background:rgba(255,255,255,0.55);pointer-events:none;z-index:31;transform:translate(-50%,-50%)';
      this.container.appendChild(base);
      this.container.appendChild(thumb);
      this.joyEl = { base, thumb };
    }
    this.joyEl.base.style.display = this.joyEl.thumb.style.display = 'block';
    this.joyEl.base.style.left = x + 'px';
    this.joyEl.base.style.top = y + 'px';
    this.moveJoystickThumb(x, y);
  }

  moveJoystickThumb(x, y) {
    if (!this.joyEl) return;
    this.joyEl.thumb.style.left = x + 'px';
    this.joyEl.thumb.style.top = y + 'px';
  }

  hideJoystick() {
    if (this.joyEl) this.joyEl.base.style.display = this.joyEl.thumb.style.display = 'none';
  }

  /** Smoothly fly the orbit camera to frame a point (build-mode close-up). */
  flyTo(cx, cz, radius, phi = 0.85, targetY = 60) {
    this.flight = {
      from: {
        target: this.orbit.target.clone(),
        radius: this.orbit.radius, phi: this.orbit.phi
      },
      to: { x: cx, y: targetY, z: cz, radius, phi },
      t: 0
    };
  }

  /** Frame an item up close, ready to be positioned. */
  flyToItem(it) {
    const size = Math.max(it.w, it.d, it.h, 60);
    const lvlY = this.levelY(this.store.project.activeLevel ?? 0);
    this.flyTo(it.x, it.y, clamp(size * 3.2, 220, 900), 0.8, lvlY + Math.min(it.h * 0.5, 120));
  }

  setWalkMode(on) {
    this.walkMode = on;
    if (on) {
      const c = this.center();
      const eyeY = 160 + this.levelY(this.store.project.activeLevel ?? 0);
      this.walk.pos.set(this.camera.position.x, eyeY, this.camera.position.z);
      const dir = new THREE.Vector3().subVectors(this.orbit.target, this.camera.position);
      this.walk.yaw = Math.atan2(-dir.x, -dir.z) + Math.PI;
      this.walk.pitch = 0;
      this.walk.targetYaw = this.walk.yaw;
      this.walk.targetPitch = 0;
      if (Math.hypot(this.walk.pos.x - c.x, this.walk.pos.z - c.z) > c.span * 1.5) {
        this.walk.pos.set(c.x, eyeY, c.z);
      }
    }
    this.needsRebuild = true;
  }

  setCeilings(on) {
    this.showCeilings = on;
    this.needsRebuild = true;
  }

  setHideRoof(on) {
    this.hideRoof = on;
    this.needsRebuild = true;
  }

  /** Drop into a close, contained view of ONE room for furnishing: the roof
   *  comes off, other rooms' furniture is hidden, and the camera is locked to
   *  this room so panning/zoom can't wander off — easy to place & arrange
   *  pieces without the rest of the house getting in the way. */
  focusRoom(room) {
    if (!room?.polygon?.length) return false;
    this.focusRoomKey = room.key;
    this.walkMode = false;
    this.hideRoof = true;
    let minX = 1e9, minZ = 1e9, maxX = -1e9, maxZ = -1e9;
    for (const p of room.polygon) {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minZ = Math.min(minZ, p.y); maxZ = Math.max(maxZ, p.y);
    }
    this._focusBounds = { minX, minZ, maxX, maxZ };
    const span = Math.max(maxX - minX, maxZ - minZ, 200);
    this.flight = null;
    // an angled, roof-off "open room" view framed to fit the room — distance is
    // derived from the CURRENT camera fov + aspect so it frames correctly on a
    // tall phone (portrait) just as well as a wide screen
    const R = span * 0.72;                       // room bounding radius-ish
    const vHalf = (this.camera.fov * Math.PI / 180) / 2;
    const hHalf = Math.atan(Math.tan(vHalf) * this.camera.aspect);
    const fit = R / Math.sin(Math.max(0.12, Math.min(vHalf, hHalf))) * 1.08;
    this._focusFit = fit;
    this.orbit.target.set(room.centroid.x, 50, room.centroid.y);
    this.orbit.radius = clamp(fit, 260, 3600);
    this.orbit.phi = 0.82;
    this.orbit.theta = 0.6;
    this.applyOrbit();
    this.needsRebuild = true;
    return true;
  }

  exitFocus() {
    if (!this.focusRoomKey) return;
    this.focusRoomKey = null;
    this._focusBounds = null;
    this.hideRoof = false;
    this.frameAll();
    this.needsRebuild = true;
  }

  /** Show every storey of the house, not just up to the active floor. */
  setViewAll(on) {
    this.viewAll = on;
    this.needsRebuild = true;
  }

  /** Highest level index to render right now. */
  topLevel() {
    const p = this.store.project;
    return this.viewAll ? p.levels.length - 1 : (p.activeLevel ?? 0);
  }

  /**
   * Set lighting/sky for an hour of day (5..22). Blends between night,
   * golden hour and midday keyframes; the setting persists per project.
   */
  applyTimeOfDay(t) {
    this.timeOfDay = t;
    const c = this.center();
    const sunrise = 6.2, sunset = 20.3;
    const f = (t - sunrise) / (sunset - sunrise);
    const elev = Math.sin(Math.PI * Math.min(Math.max(f, 0), 1)) *
      (f >= 0 && f <= 1 ? 1 : 0) + (f < 0 ? f * 0.5 : 0) + (f > 1 ? (1 - f) * 0.5 : 0);

    const K = {
      night: {
        zenith: '#0a111e', horizon: '#182338', below: '#10161f',
        sun: '#8fa5d0', sunI: 0.12, hemiSky: '#24304a', hemiGround: '#12161e', hemiI: 0.18,
        exposure: 0.7, envI: 0.05
      },
      golden: {
        zenith: '#41609a', horizon: '#f2a660', below: '#8a6a4a',
        sun: '#ff9648', sunI: 1.35, hemiSky: '#8ca0c8', hemiGround: '#7a6a52', hemiI: 0.5,
        exposure: 1.0, envI: 0.4
      },
      day: {
        zenith: '#1c5ecf', horizon: '#8ec2ec', below: '#93b0c4',
        sun: '#fff0d6', sunI: 2.6, hemiSky: '#cfe0ee', hemiGround: '#7d7361', hemiI: 0.48,
        exposure: 1.0, envI: 0.34
      }
    };
    const lerpHex = (a, b, k) =>
      new THREE.Color(a).lerp(new THREE.Color(b), k);
    const blend = (a, b, k) => ({
      zenith: lerpHex(a.zenith, b.zenith, k), horizon: lerpHex(a.horizon, b.horizon, k),
      below: lerpHex(a.below, b.below, k), sun: lerpHex(a.sun, b.sun, k),
      sunI: a.sunI + (b.sunI - a.sunI) * k,
      hemiSky: lerpHex(a.hemiSky, b.hemiSky, k), hemiGround: lerpHex(a.hemiGround, b.hemiGround, k),
      hemiI: a.hemiI + (b.hemiI - a.hemiI) * k,
      exposure: a.exposure + (b.exposure - a.exposure) * k,
      envI: a.envI + (b.envI - a.envI) * k
    });
    let s;
    if (elev <= 0) {
      s = blend(K.night, K.golden, Math.max(0, 1 + elev / 0.08) * 0.3);
    } else if (elev < 0.55) {
      s = blend(K.golden, K.day, elev / 0.55);
    } else {
      s = blend(K.day, K.day, 0);
    }

    // sun position along its arc, centered on the plan
    const az = -Math.PI * 0.62 + Math.min(Math.max(f, 0), 1) * Math.PI * 1.24;
    const up = Math.max(elev, 0.05);
    this.sun.position.set(
      c.x + Math.sin(az) * 2400 * (1 - up * 0.45),
      up * 2600 + 150,
      c.z + Math.cos(az) * 2400 * (1 - up * 0.45)
    );
    this.sun.color.copy(s.sun);
    this.sun.intensity = elev > 0 ? s.sunI : 0.1;
    this.sun.castShadow = elev > 0.02;
    this.hemi.color.copy(s.hemiSky);
    this.hemi.groundColor.copy(s.hemiGround);
    this.hemi.intensity = s.hemiI;
    this.renderer.toneMappingExposure = s.exposure;
    this.scene.environmentIntensity = s.envI;
    this.scene.fog.color.copy(s.horizon);

    // repaint the sky: gradient base, clouds by day, moon at night
    const g = this.skyCanvas.getContext('2d');
    const W = 1024, H = 512;
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#' + s.zenith.getHexString());
    grad.addColorStop(0.34, '#' + s.zenith.clone().lerp(s.horizon, 0.45).getHexString());
    grad.addColorStop(0.56, '#' + s.horizon.getHexString());
    grad.addColorStop(0.63, '#' + s.below.getHexString());
    grad.addColorStop(1, '#' + s.below.getHexString());
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);

    let seed = 987654;
    const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const dayness = clamp(elev / 0.3, 0, 1);
    const nightness = clamp(-elev / 0.05, 0, 1);

    if (dayness > 0.05) {
      // puffy cumulus: clusters of shaded lobes with a flat gray base,
      // drawn thrice so clouds crossing the dome seam wrap cleanly
      const goldT = 1 - clamp((elev - 0.12) / 0.35, 0, 1);
      const lit = [255 - goldT * 8, 255 - goldT * 26, 255 - goldT * 62];
      const shade = [186 + goldT * 30, 198 + goldT * 4, 216 - goldT * 52];
      const puffCloud = (cx, cy, sc, alpha) => {
        // one cloud = flat shaded underside + a random row of bright lobes
        const lobes = [];
        const n = 4 + Math.floor(rand() * 3);
        let lx = -n * 14;
        for (let i = 0; i < n; i++) {
          lobes.push([lx, -6 - rand() * 16, 20 + rand() * 16]);
          lx += 22 + rand() * 12;
        }
        lobes.push([0, 4, 30 + rand() * 10]); // full-width belly lobe
        for (const off of [-W, 0, W]) {
          const bx = cx + off;
          if (bx < -220 * sc || bx > W + 220 * sc) continue;
          g.save();
          g.translate(bx, cy);
          g.scale(sc, sc * 0.6);
          let grd = g.createRadialGradient(0, 12, 2, 0, 12, 64);
          grd.addColorStop(0, `rgba(${shade[0]},${shade[1]},${shade[2]},${0.55 * alpha})`);
          grd.addColorStop(1, `rgba(${shade[0]},${shade[1]},${shade[2]},0)`);
          g.fillStyle = grd;
          g.beginPath();
          g.ellipse(0, 12, 66, 26, 0, 0, Math.PI * 2);
          g.fill();
          for (const [px, py, pr] of lobes) {
            grd = g.createRadialGradient(px - pr * 0.3, py - pr * 0.4, pr * 0.1, px, py, pr);
            grd.addColorStop(0, `rgba(${lit[0]},${lit[1]},${lit[2]},${0.96 * alpha})`);
            grd.addColorStop(0.72, `rgba(${lit[0]},${lit[1]},${lit[2]},${0.5 * alpha})`);
            grd.addColorStop(1, `rgba(${lit[0]},${lit[1]},${lit[2]},0)`);
            g.fillStyle = grd;
            g.beginPath();
            g.arc(px, py, pr, 0, Math.PI * 2);
            g.fill();
          }
          g.restore();
        }
      };
      // big cumulus through the band the camera actually sees...
      for (let i = 0; i < 8; i++) {
        puffCloud(rand() * W, 128 + rand() * 128, 1.15 + rand() * 0.95, (0.85 + rand() * 0.15) * dayness);
      }
      // ...and smaller, fainter ones stacked near the horizon for depth
      for (let i = 0; i < 6; i++) {
        puffCloud(rand() * W, 252 + rand() * 36, 0.45 + rand() * 0.3, (0.5 + rand() * 0.2) * dayness);
      }
    }

    if (nightness > 0.05) {
      // moon with halo (stars are separate crisp point sprites)
      g.save();
      g.globalAlpha = nightness;
      const mx = W * 0.72, my = H * 0.16;
      const halo = g.createRadialGradient(mx, my, 4, mx, my, 60);
      halo.addColorStop(0, 'rgba(240,240,255,0.9)');
      halo.addColorStop(0.3, 'rgba(220,225,245,0.35)');
      halo.addColorStop(1, 'rgba(220,225,245,0)');
      g.fillStyle = halo;
      g.beginPath();
      g.arc(mx, my, 60, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = 'rgba(246,246,252,0.96)';
      g.beginPath();
      g.arc(mx, my, 15, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
    if (this.stars) this.stars.material.opacity = nightness * 0.95;
    this.skyTexture.needsUpdate = true;
  }

  /** Render one frame and return it as a PNG data-URL. */
  snapshot() {
    this.resize();
    if (this.needsRebuild) this.rebuild();
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  // ---- input ---------------------------------------------------------------

  pos(e) {
    return localPos(e, this.container);
  }

  toNDC(p) {
    return new THREE.Vector2(
      (p.x / this.container.clientWidth) * 2 - 1,
      -(p.y / this.container.clientHeight) * 2 + 1
    );
  }

  castItems(p) {
    const active = this.store.project.activeLevel ?? 0;
    this.raycaster.setFromCamera(this.toNDC(p), this.camera);
    const hits = this.raycaster.intersectObjects(this.itemsGroup.children, true);
    for (const h of hits) {
      let obj = h.object;
      while (obj && !obj.userData.itemId) obj = obj.parent;
      if (obj && obj.userData.level === active) {
        return { itemId: obj.userData.itemId, point: h.point };
      }
    }
    return null;
  }

  /** Architecture under the pointer: a door/window model, a room surface,
   *  or the outside face of a wall. */
  castArch(p) {
    const active = this.store.project.activeLevel ?? 0;
    this.raycaster.setFromCamera(this.toNDC(p), this.camera);
    const hits = this.raycaster.intersectObjects(this.archGroup.children, true);
    for (const h of hits) {
      let obj = h.object, openingId, level;
      while (obj) {
        if (openingId === undefined && obj.userData.openingId !== undefined) openingId = obj.userData.openingId;
        if (obj.userData.level !== undefined) level = obj.userData.level;
        obj = obj.parent;
      }
      if (level !== active) continue;
      if (openingId !== undefined) return { openingId };
      if (h.object.userData.roomKey) return { roomKey: h.object.userData.roomKey };
      if (h.object.userData.exterior) return { exteriorWallId: h.object.userData.wallId };
      if (h.object.userData.wallId !== undefined) return null;
    }
    return null;
  }

  /** Wall surface under the pointer: { wallId, point } or null. */
  castWall(p) {
    const active = this.store.project.activeLevel ?? 0;
    this.raycaster.setFromCamera(this.toNDC(p), this.camera);
    const hits = this.raycaster.intersectObjects(this.archGroup.children, true);
    for (const h of hits) {
      let obj = h.object, wallId, level;
      while (obj) {
        if (wallId === undefined && obj.userData.wallId !== undefined) wallId = obj.userData.wallId;
        if (obj.userData.level !== undefined) level = obj.userData.level;
        obj = obj.parent;
      }
      if (wallId !== undefined && level === active) {
        return { wallId, point: h.point };
      }
    }
    return null;
  }

  /** Walkable surface height under a walk-mode position: floors, ground and
   *  stair treads. Casts down from just above knee height so the next tread
   *  up is caught, but the storey above is not. Returns null when nothing
   *  walkable is below. */
  walkSurfaceY(x, z, eyeY) {
    if (!this._downRay) this._downRay = new THREE.Raycaster();
    const feet = eyeY - 160;
    this._downRay.set(new THREE.Vector3(x, feet + 80, z), new THREE.Vector3(0, -1, 0));
    this._downRay.far = 3000;
    const stairs = [];
    for (const g of this.itemsGroup.children) {
      if (g.userData.walkable) stairs.push(g);
    }
    const hits = this._downRay.intersectObjects([this.archGroup, this.groundGroup, ...stairs], true);
    for (const h of hits) {
      let o = h.object;
      while (o) {
        if (o.userData.walkable) return h.point.y;
        o = o.parent;
      }
    }
    return null;
  }

  /** Ground-plane point under the pointer (world cm in plan coords). */
  castGround(p) {
    this.raycaster.setFromCamera(this.toNDC(p), this.camera);
    const pt = new THREE.Vector3();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0),
      -this.levelY(this.store.project.activeLevel ?? 0));
    if (this.raycaster.ray.intersectPlane(plane, pt)) return { x: pt.x, y: pt.z };
    return null;
  }

  /** Move-mode: relocate an existing item's center to the tapped ground point. */
  moveItemTo(id, p) {
    const store = this.store;
    const it = store.item(id);
    if (!it) return false;
    const def = ITEM_MAP.get(it.defId);
    let target = null;
    if (def?.mount === 'wall') {
      const hit = this.castWall(p);
      if (hit) target = { x: hit.point.x, y: hit.point.z };
    }
    if (!target) target = this.castGround(p);
    if (!target) return false;
    store.checkpoint();
    const pose = snapPose(store.project.walls, def, target.x, target.y,
      store.snapEnabled ? { rot: it.rotation } : { noSnap: true, rot: it.rotation });
    if (it.path) {
      const dx = pose.x - it.x, dy = pose.y - it.y;
      it.x = pose.x; it.y = pose.y;
      for (const pp of it.path) { pp.x += dx; pp.y += dy; }
    } else {
      it.x = pose.x; it.y = pose.y;
    }
    anchorWallItem(store.project.walls, it, def); // wall pieces re-remember their host
    store.commit(true);
    store.select({ kind: 'item', id: it.id }); // keep it selected & in move mode
    return true;
  }

  /** Tap-to-place in 3D: furniture on the ground/floor, wall items on walls. */
  placeItemAt(p) {
    const store = this.store;
    const def = ITEM_MAP.get(store.placeDefId);
    if (!def) return false;
    let target = null;
    if (def.mount === 'wall') {
      const hit = this.castWall(p);
      if (hit) target = { x: hit.point.x, y: hit.point.z };
    }
    if (!target) target = this.castGround(p);
    if (!target) return false;
    const pose = snapPose(store.project.walls, def, target.x, target.y, {});
    store.checkpoint();
    const it = store.addItem(def.id, pose.x, pose.y, pose.rot, def);
    if (def.path) this.seedDefaultPath(it, def);
    anchorWallItem(store.project.walls, it, def);
    store.commit(false);
    store.setTool('select');
    store.select({ kind: 'item', id: it.id });
    this.flyToItem(it);
    return true;
  }

  /**
   * Build mode: drop an item in the middle of a room and fly the camera to a
   * close working angle so it can be nudged into place immediately.
   */
  placeInRoom(defId, room) {
    const store = this.store;
    const def = ITEM_MAP.get(defId);
    if (!def || !room) return false;
    const pose = snapPose(store.project.walls, def, room.centroid.x, room.centroid.y, {});
    store.checkpoint();
    const it = store.addItem(defId, pose.x, pose.y, pose.rot, def);
    if (def.path) this.seedDefaultPath(it, def);
    store.commit(false);
    store.setTool('select');
    store.select({ kind: 'item', id: it.id });
    this.flyToItem(it);
    return true;
  }

  /** Paths placed by a 3D tap start as a short straight run (drawn freely in 2D). */
  seedDefaultPath(it, def) {
    const L = Math.max(def.w, 240);
    const pw = Math.max(4, Math.min(600, Math.round(def.path.width * (this.store.drawWidthScale || 1))));
    it.path = [{ x: Math.round(it.x - L / 2), y: Math.round(it.y) },
               { x: Math.round(it.x + L / 2), y: Math.round(it.y) }];
    it.pw = pw;
    it.rotation = 0;
    it.w = L + pw;
    it.d = pw;
  }

  /** Tap-to-place doors/windows on a wall in 3D. */
  placeOpeningAt(p, type) {
    const store = this.store;
    const hit = this.castWall(p);
    if (!hit) return false;
    const wall = store.wall(hit.wallId);
    if (!wall) return false;
    const len = wallLength(wall);
    const width = openingDefaults(type).width;
    if (len < width + 12) return false;
    // parametric position of the tap along the wall
    const dx = wall.bx - wall.ax, dy = wall.by - wall.ay;
    let t = ((hit.point.x - wall.ax) * dx + (hit.point.z - wall.ay) * dy) / (len * len);
    t = clamp(t, (width / 2 + 6) / len, 1 - (width / 2 + 6) / len);
    store.checkpoint();
    const o = store.addOpening(wall.id, type, t);
    store.commit(true);
    store.setTool('select');
    store.select({ kind: 'opening', id: o.id });
    return true;
  }

  onDown(e) {
    // a primary pointer means no other real touches are down — clear any
    // ghost pointer left by a missed pointerup (iOS), which otherwise turns
    // every one-finger drag into a phantom pinch (camera "stuck on zoom")
    if (e.isPrimary && this.pointers.size) {
      this.pointers.clear();
      if (this.gesture?.kind === 'pinch' || this.gesture?.kind === 'rotate') this.gesture = null;
    }
    const p = this.pos(e);
    this.pointers.set(e.pointerId, p);
    try { this.renderer.domElement.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }

    if (this.pointers.size === 2) {
      // pinch takes over: cancel single-pointer gestures (keep item drag)
      if (this.gesture?.kind === 'pathDraw') this.endPathPreview();
      if (this.gesture?.kind === 'areaDraw') this.endAreaPreview();
      const pts = [...this.pointers.values()];
      this.gesture = {
        kind: 'pinch',
        d0: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
        mid0: { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 },
        radius0: this.orbit.radius,
        target0: this.orbit.target.clone()
      };
      return;
    }
    if (this.pointers.size > 2) return;

    if (this.walkMode) {
      // touch: left half of the screen is a move joystick, right half looks
      if (e.pointerType === 'touch' && p.x < this.container.clientWidth * 0.42) {
        this.gesture = { kind: 'joy', id: e.pointerId, x: p.x, y: p.y };
        this.walk.joy = { mx: 0, mz: 0 };
        this.showJoystick(p.x, p.y);
      } else {
        this.gesture = { kind: 'look', id: e.pointerId, x: p.x, y: p.y, yaw: this.walk.yaw, pitch: this.walk.pitch };
      }
      return;
    }

    // paths and area surfaces are drawn, not tapped: finger down on the
    // ground starts drawing immediately and follows until the finger lifts
    if (this.store.tool === 'place') {
      const def = ITEM_MAP.get(this.store.placeDefId);
      if (def?.path) {
        const gpt = this.castGround(p);
        if (gpt) {
          this.flight = null;
          this.gesture = {
            kind: 'pathDraw', id: e.pointerId, def, shape: this.store.drawShape,
            start: gpt, cur: gpt, pts: [gpt]
          };
          this.startPathPreview(def);
          this.addPathPreviewDot(gpt.x, gpt.y, def.path.width);
          return;
        }
      }
      if (def?.areaDraw) {
        const gpt = this.castGround(p);
        if (gpt) {
          this.flight = null;
          this.gesture = { kind: 'areaDraw', id: e.pointerId, def, start: gpt, cur: gpt };
          this.startAreaPreview(def);
          return;
        }
      }
    }

    // CUT / WINDOW / DOOR: draw the opening straight onto a wall. Press on a
    // wall and drag out the rectangle you want — width along the wall, height
    // up it. We cast against the wall's fixed vertical plane (not the mesh) so
    // the growing hole never breaks the drag.
    if (this.store.tool === 'cut' || this.store.tool === 'window' || this.store.tool === 'door') {
      const hit = this.castWall(p);
      if (hit) {
        const wall = this.store.wall(hit.wallId);
        if (wall) {
          const tool = this.store.tool;
          const type = tool === 'cut' ? 'gap' : tool === 'door' ? this.store.doorType : this.store.windowType;
          const dx = wall.bx - wall.ax, dy = wall.by - wall.ay;
          const len = Math.hypot(dx, dy) || 1;
          const H = wall.height || this.store.project.settings.wallHeight;
          const lvlY = this.levelY(this.store.project.activeLevel ?? 0);
          const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
            new THREE.Vector3(dy, 0, -dx).normalize(),
            new THREE.Vector3(wall.ax, 0, wall.ay));
          const t0 = clamp(((hit.point.x - wall.ax) * dx + (hit.point.z - wall.ay) * dy) / (len * len), 0, 1);
          const y0 = clamp(hit.point.y - lvlY, 0, H);
          this.store.checkpoint();
          const o = this.store.addOpening(wall.id, type, t0);
          o.width = 20; o.sill = tool === 'door' ? 0 : y0; o.height = 20; // grows with the drag
          this.store.commit(true);
          this.store.select({ kind: 'opening', id: o.id });
          this.flight = null;
          this.gesture = {
            kind: 'wallOpening', id: e.pointerId, oid: o.id, tool,
            plane, ax: wall.ax, ay: wall.ay, dx, dy, len, lvlY, H,
            t0, y0, moved: false
          };
          return;
        }
      }
      // pressed off any wall → fall through to a normal camera orbit
    }

    // placement tools claim the tap; only the select tool grabs items
    const hit = this.store.tool === 'select' ? this.castItems(p) : null;
    const it = hit && this.store.item(hit.itemId);
    const def = it && ITEM_MAP.get(it.defId);
    // ground-cover surfaces (grass, pads, patios, pools, ponds, laid paths) are
    // big and easy to land on while orbiting — so they never grab a plain tap;
    // you long-press to select/edit them. Regular furniture stays tap-to-select.
    const groundish = !!def && (def.areaDraw || !!def.path);
    const already = this.store.selection?.kind === 'item' && this.store.selection.id === hit?.itemId;
    // in move mode the chosen item drags freely (even ground-cover pieces)
    const inMove = !!this.store.moveId && hit?.itemId === this.store.moveId;
    // Only an ALREADY-selected, movable piece begins a move-drag on press.
    // Landing on anything else starts a camera orbit, so dragging never yanks
    // an asset you were only trying to swipe past.
    if (hit && (already || inMove) && (!groundish || inMove) && def?.mount !== 'ceiling' && !it.locked) {
      this.store.checkpoint();
      this.drag = {
        id: hit.itemId,
        plane: new THREE.Plane(new THREE.Vector3(0, 1, 0),
          -((it.elevation || 0) + this.levelY(this.store.project.activeLevel ?? 0))),
        offX: hit.point.x - it.x,
        offZ: hit.point.z - it.y,
        moved: false
      };
    } else {
      this.flight = null; // user takes over the camera
      this.gesture = {
        kind: 'rotate', id: e.pointerId, x: p.x, y: p.y,
        theta0: this.orbit.theta, phi0: this.orbit.phi, moved: false,
        downT: (typeof performance !== 'undefined' ? performance.now() : 0),
        tapItemId: hit ? hit.itemId : null, tapGroundish: groundish
      };
    }
  }

  onMove(e) {
    if (!this.pointers.has(e.pointerId)) return;
    const p = this.pos(e);
    this.pointers.set(e.pointerId, p);
    const g = this.gesture;

    if (g?.kind === 'wallOpening' && g.id === e.pointerId) {
      this.raycaster.setFromCamera(this.toNDC(p), this.camera);
      const pt = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(g.plane, pt)) {
        const o = this.store.opening(g.oid);
        if (o) {
          const t1 = clamp(((pt.x - g.ax) * g.dx + (pt.z - g.ay) * g.dy) / (g.len * g.len), 0, 1);
          const y1 = clamp(pt.y - g.lvlY, 0, g.H);
          const width = clamp(Math.round(Math.abs(t1 - g.t0) * g.len), 20, Math.max(20, g.len - 12));
          let tC = (g.t0 + t1) / 2;
          tC = clamp(tC, (width / 2 + 6) / g.len, 1 - (width / 2 + 6) / g.len);
          let bottom = Math.min(g.y0, y1);
          let top = Math.max(g.y0, y1);
          if (g.tool === 'door') bottom = 0; // doors sit on the floor
          if (g.tool === 'cut') {
            // snap to floor / ceiling so a cut removes the wall cleanly in that
            // spot — no thin sliver at the bottom or a header hanging at the top
            const SNAP = Math.min(30, g.H * 0.12);
            if (bottom < SNAP) bottom = 0;
            if (top > g.H - SNAP) top = g.H;
          }
          const sill = clamp(Math.round(bottom), 0, g.H - 10);
          const height = clamp(Math.round(top - bottom), 10, g.H - sill);
          o.t = tC; o.width = width; o.sill = sill; o.height = height;
          if (Math.abs(t1 - g.t0) * g.len > 15 || Math.abs(y1 - g.y0) > 15) g.moved = true;
          this.store.commit(true);
        }
      }
      return;
    }

    if (g?.kind === 'pinch' && this.pointers.size >= 2) {
      const pts = [...this.pointers.values()];
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      this.orbit.radius = clamp(g.radius0 * (g.d0 / Math.max(d, 1)), 80, 6000);
      // pan with the midpoint: move target in the camera's screen plane
      const dx = mid.x - g.mid0.x, dy = mid.y - g.mid0.y;
      const panScale = this.orbit.radius * 0.0016;
      const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 0);
      const up = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 1);
      this.orbit.target.copy(g.target0)
        .addScaledVector(right, -dx * panScale)
        .addScaledVector(up, dy * panScale);
      return;
    }

    if (g?.kind === 'pathDraw' && g.id === e.pointerId) {
      const gpt = this.castGround(p);
      if (gpt) {
        if (g.shape === 'free') {
          const last = g.pts[g.pts.length - 1];
          const step = Math.max(20, g.def.path.width / 4);
          if (Math.hypot(gpt.x - last.x, gpt.y - last.y) >= step) g.pts.push(gpt);
          g.cur = gpt;
        } else if (g.shape === 'line') {
          g.cur = this.straightPathEnd(g.start, gpt);
        } else {
          g.cur = gpt;
        }
        this.updatePathPreview(this.pathGesturePolyline(g), g.def.path.width);
      }
      return;
    }

    if (g?.kind === 'areaDraw' && g.id === e.pointerId) {
      const gpt = this.castGround(p);
      if (gpt) {
        g.cur = gpt;
        this.updateAreaPreview(g.start, g.cur);
      }
      return;
    }

    if (g?.kind === 'look' && g.id === e.pointerId) {
      // gentler sensitivity; tick() eases toward these targets for smoothness
      this.walk.targetYaw = g.yaw - (p.x - g.x) * 0.0032;
      this.walk.targetPitch = clamp(g.pitch - (p.y - g.y) * 0.0026, -1.15, 1.15);
      return;
    }

    if (g?.kind === 'joy' && g.id === e.pointerId) {
      this.walk.joy = {
        mx: clamp((p.x - g.x) / 70, -1, 1),
        mz: clamp((p.y - g.y) / 70, -1, 1)
      };
      this.moveJoystickThumb(
        g.x + clamp(p.x - g.x, -55, 55),
        g.y + clamp(p.y - g.y, -55, 55)
      );
      return;
    }

    if (g?.kind === 'rotate' && g.id === e.pointerId) {
      const dx = p.x - g.x, dy = p.y - g.y;
      if (Math.hypot(dx, dy) > 4) g.moved = true;
      this.orbit.theta = g.theta0 - dx * 0.0055;
      this.orbit.phi = clamp(g.phi0 - dy * 0.0045, 0.08, Math.PI / 2 - 0.02);
      return;
    }

    if (this.drag) {
      this.raycaster.setFromCamera(this.toNDC(p), this.camera);
      const pt = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(this.drag.plane, pt)) {
        const it = this.store.item(this.drag.id);
        if (it) {
          const def = ITEM_MAP.get(it.defId);
          const target = def?.mount === 'wall'
            ? { x: pt.x, y: pt.z }
            : { x: pt.x - this.drag.offX, y: pt.z - this.drag.offZ };
          if (it.path) {
            const dx = target.x - it.x, dy = target.y - it.y;
            it.x = target.x; it.y = target.y;
            for (const pp of it.path) { pp.x += dx; pp.y += dy; }
          } else {
            const pose = snapPose(this.store.project.walls, def, target.x, target.y,
              { fine: true, rot: it.rotation, d: it.d });
            it.x = pose.x;
            it.y = pose.y;
            if (pose.snapped) it.rotation = pose.rot;
          }
          this.drag.moved = true;
          this.store.commit(false);
        }
      }
    }
  }

  onUp(e) {
    this.pointers.delete(e.pointerId);
    const g = this.gesture;
    if (g?.kind === 'joy' && g.id === e.pointerId) {
      this.walk.joy = null;
      this.hideJoystick();
    }
    if (g?.kind === 'wallOpening' && (g.id === e.pointerId || this.pointers.size === 0)) {
      const o = this.store.opening(g.oid);
      if (o && !g.moved) {
        // a tap (no real drag) → drop the default size for that opening type
        // (a cut defaults to full height; doors/windows to their standard size)
        const d = openingDefaults(o.type);
        const defW = clamp(d.width, 20, Math.max(20, g.len - 12));
        o.width = defW;
        o.sill = g.tool === 'cut' ? 0 : (d.sill || 0);
        o.height = g.tool === 'cut' ? g.H : d.height;
        o.t = clamp(g.t0, (defW / 2 + 6) / g.len, 1 - (defW / 2 + 6) / g.len);
        this.store.commit(true);
      }
      this.store.setTool('select');
      if (o) this.store.select({ kind: 'opening', id: g.oid });
      this.gesture = null;
      return;
    }
    if (g?.kind === 'pinch' && this.pointers.size === 1) {
      // hand back to single-finger rotate anchored at the remaining pointer
      const [id, p] = [...this.pointers.entries()][0];
      this.gesture = { kind: 'rotate', id, x: p.x, y: p.y, theta0: this.orbit.theta, phi0: this.orbit.phi, moved: true };
    } else if (g && (g.id === e.pointerId || this.pointers.size === 0)) {
      if (g.kind === 'areaDraw') {
        this.endAreaPreview();
        const store = this.store;
        const { start: s, cur: c, def } = g;
        store.checkpoint();
        let it;
        if (c && Math.abs(c.x - s.x) > 40 && Math.abs(c.y - s.y) > 40) {
          it = store.addItem(def.id, Math.round((s.x + c.x) / 2), Math.round((s.y + c.y) / 2), 0, def);
          it.w = Math.round(Math.abs(c.x - s.x));
          it.d = Math.round(Math.abs(c.y - s.y));
        } else {
          it = store.addItem(def.id, Math.round(s.x), Math.round(s.y), 0, def);
        }
        store.commit(false);
        store.setTool('select');
        store.select({ kind: 'item', id: it.id });
        this.flyToItem(it);
      }
      if (g.kind === 'pathDraw') {
        this.endPathPreview();
        const pts = this.pathGesturePolyline(g);
        let len = 0;
        for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
        if (pts.length >= 2 && len > 50) {
          const it = createPathItem(this.store, g.def, pts);
          this.flyToItem(it);
        } else {
          // a plain tap: drop a short straight starter run there
          const store = this.store;
          store.checkpoint();
          const it = store.addItem(g.def.id, Math.round(g.start.x), Math.round(g.start.y), 0, g.def);
          this.seedDefaultPath(it, g.def);
          store.commit(false);
          store.setTool('select');
          store.select({ kind: 'item', id: it.id });
          this.flyToItem(it);
        }
      }
      if (g.kind === 'rotate' && !g.moved && !this.walkMode) {
        const tap = { x: g.x, y: g.y };
        const tool = this.store.tool;
        const now = (typeof performance !== 'undefined' ? performance.now() : 0);
        const longPress = now - (g.downT || 0) >= 450;
        // Double-tap is an easier alternative to the long-press for grabbing big
        // ground-cover surfaces (patios, decks, the yard): two quick taps in
        // roughly the same spot. A single drag still orbits, so this never
        // fights the camera.
        const near = this._lastTap && Math.abs(g.x - this._lastTap.x) < 40 && Math.abs(g.y - this._lastTap.y) < 40;
        const doubleTap = !!this._lastTap && near && (now - this._lastTap.t) < 320;
        this._lastTap = { x: g.x, y: g.y, t: now };
        const surfaceSelect = longPress || doubleTap;
        // MOVE MODE: a tap drops the item being moved onto the tapped point
        if (this.store.moveId && this.store.item(this.store.moveId)) {
          this.moveItemTo(this.store.moveId, tap);
          this.gesture = null;
          return;
        }
        if (tool === 'place' && this.store.placeDefId) {
          this.placeItemAt(tap);
        } else if (tool === 'door' || tool === 'window' || tool === 'cut') {
          this.placeOpeningAt(tap, tool === 'cut' ? 'gap' : tool === 'door' ? this.store.doorType : this.store.windowType);
        } else if (g.tapItemId && this.store.item(g.tapItemId)) {
          // a piece of furniture selects on a plain tap; big ground-cover
          // surfaces only select on a long-press so orbiting past them is free
          if (!g.tapGroundish || surfaceSelect) {
            this.store.select({ kind: 'item', id: g.tapItemId });
          } else {
            this.store.select(null);
          }
        } else {
          // simple tap: select what the finger landed on — a door/window,
          // the room a floor/wall belongs to, or an exterior wall face
          const arch = this.castArch(tap);
          if (arch?.openingId && this.store.opening(arch.openingId)) {
            this.store.select({ kind: 'opening', id: arch.openingId });
          } else if (arch?.roomKey && this.store.room(arch.roomKey)) {
            this.store.select({ kind: 'room', id: arch.roomKey });
          } else if (arch?.exteriorWallId && this.store.wall(arch.exteriorWallId)) {
            this.store.select({ kind: 'wall', id: arch.exteriorWallId, exterior: true });
          } else if (surfaceSelect && this.castGround(tap)) {
            // long-press or double-tap the yard/grass → edit the ground cover (a quick tap
            // just clears the selection so it reads as a navigation gesture)
            this.store.select({ kind: 'ground' });
          } else {
            this.store.select(null);
          }
        }
      }
      this.gesture = null;
    }
    if (this.drag) {
      if (!this.drag.moved) {
        this.store.undoStack.pop();
        this.store.emit('history');
      }
      this.drag = null;
      this.store.commit(false);
    }
  }

  onWheel(e) {
    e.preventDefault();
    this.orbit.radius = clamp(this.orbit.radius * Math.exp(e.deltaY * 0.0012), 80, 6000);
  }

  // ---- frame loop ------------------------------------------------------------

  tick() {
    if (this.container.offsetParent === null) return; // hidden
    const dt = Math.min(this.clock.getDelta(), 0.1);
    this.resize();
    if (this.needsRebuild) this.rebuild();

    if (this.debugEl) this._frames++;
    if (this.walkMode) {
      const k = this.walk.keys;
      const speed = (k.has('ShiftLeft') ? 450 : 220) * dt;
      let mx = 0, mz = 0;
      if (k.has('KeyW') || k.has('ArrowUp')) mz -= 1;
      if (k.has('KeyS') || k.has('ArrowDown')) mz += 1;
      if (k.has('KeyA') || k.has('ArrowLeft')) mx -= 1;
      if (k.has('KeyD') || k.has('ArrowRight')) mx += 1;
      if (this.walk.joy) { mx += this.walk.joy.mx; mz += this.walk.joy.mz; }
      if (mx || mz) {
        const yaw = this.walk.yaw;
        const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
        const rx = Math.cos(yaw), rz = -Math.sin(yaw);
        this.walk.pos.x += (fx * -mz + rx * mx) * speed;
        this.walk.pos.z += (fz * -mz + rz * mx) * speed;
      }
      // follow walkable surfaces: climbing stairs raises the eye onto the
      // floor above through its stairwell opening
      const surf = this.walkSurfaceY(this.walk.pos.x, this.walk.pos.z, this.walk.pos.y);
      if (surf !== null) {
        this.walk.pos.y += (surf + 160 - this.walk.pos.y) * Math.min(1, dt * 9);
      }
      // eased look for comfortable navigation
      if (this.walk.targetYaw !== undefined) {
        const k = Math.min(1, dt * 11);
        this.walk.yaw += (this.walk.targetYaw - this.walk.yaw) * k;
        this.walk.pitch += (this.walk.targetPitch - this.walk.pitch) * k;
      }
      this.camera.position.copy(this.walk.pos);
      const look = new THREE.Vector3(
        this.walk.pos.x - Math.sin(this.walk.yaw) * Math.cos(this.walk.pitch),
        this.walk.pos.y + Math.sin(this.walk.pitch),
        this.walk.pos.z - Math.cos(this.walk.yaw) * Math.cos(this.walk.pitch)
      );
      this.camera.lookAt(look);
    } else {
      if (this.flight) {
        const f = this.flight;
        f.t = Math.min(1, f.t + dt / 0.65);
        const k = f.t * f.t * (3 - 2 * f.t); // smoothstep
        this.orbit.target.set(
          f.from.target.x + (f.to.x - f.from.target.x) * k,
          f.from.target.y + (f.to.y - f.from.target.y) * k,
          f.from.target.z + (f.to.z - f.from.target.z) * k
        );
        this.orbit.radius = f.from.radius + (f.to.radius - f.from.radius) * k;
        this.orbit.phi = f.from.phi + (f.to.phi - f.from.phi) * k;
        if (f.t >= 1) this.flight = null;
      }
      this.applyOrbit();
    }
    this.renderer.render(this.scene, this.camera);
  }
}
