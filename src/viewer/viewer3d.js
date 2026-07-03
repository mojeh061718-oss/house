// Real-time 3D view: renders the project with lighting/shadows, orbit and
// first-person walk controls, and direct furniture editing (drag with wall
// snapping) in 3D. All pointer input goes through rotation-aware helpers so
// the forced-landscape mode on iPhone/iPad works identically.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildWalls, buildFloors, buildCeilings, buildGround, buildPathModel } from './arch3d.js';
import { ITEM_MAP, paletteFor } from '../catalog/items.js';
import { clamp, wallLength } from '../core/geometry.js';
import { snapPose, createPathItem } from '../core/placement.js';
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
      // stairs on the level below cut an opening in this level's floor;
      // stairs on this level cut its ceiling (when a floor exists above)
      const floorHoles = i > 0 ? this.stairHoles(project.levels[i - 1]) : [];
      const g = new THREE.Group();
      g.position.y = this.levelY(i);
      g.userData.level = i;
      guard(() => g.add(buildWalls(shim, rooms)), 'walls');
      guard(() => g.add(buildFloors(shim, rooms, floorHoles)), 'floors');
      if ((this.showCeilings || this.walkMode) && i === active) {
        const ceilHoles = i < project.levels.length - 1 ? this.stairHoles(lvl) : [];
        guard(() => g.add(buildCeilings(shim, rooms, ceilHoles)), 'ceilings');
      }
      // upper levels sit on a visible structural slab
      if (i > 0) {
        guard(() => {
          const slab = buildFloors(shim, rooms, floorHoles);
          slab.traverse(o => {
            if (o.isMesh) {
              o.material = o.material.clone();
              o.material.map = null;
              o.material.color = new THREE.Color('#c9c3b8');
            }
          });
          slab.scale.y = 1;
          slab.position.y = -SLAB + 1;
          g.add(slab);
        }, 'slab');
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
    for (let li = 0; li <= top; li++) {
    for (const it of this.store.project.levels[li].items) {
      const def = ITEM_MAP.get(it.defId);
      if (!def) continue;
      try {
        const isPath = def.path && it.path?.length >= 2;
        // size-true builders (decks, pools, pads) rebuild at the item's real
        // dimensions so surface textures never stretch
        const model = isPath ? buildPathModel(it, def)
          : def.buildSized ? def.buildSized(paletteFor(it, def), it.w, it.d, it.h)
            : def.build(paletteFor(it, def));
        if (!isPath && !def.buildSized) model.scale.set(it.w / def.w, it.h / def.h, it.d / def.d);
        const outer = new THREE.Group();
        outer.add(model);
        outer.userData.itemId = it.id;
        outer.userData.level = li;
        outer.userData.palette = it.palette;
        if (def.plan?.type === 'stairs') outer.userData.walkable = true;
        outer.userData.w = it.w; outer.userData.d = it.d; outer.userData.h = it.h;
        outer.userData.pw = it.pw;
        this.poseItem(outer, it, def, wallH, this.levelY(li));
        if (def.light) {
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
          g.userData.pw !== it.pw) {
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
    it.path = [{ x: Math.round(it.x - L / 2), y: Math.round(it.y) },
               { x: Math.round(it.x + L / 2), y: Math.round(it.y) }];
    it.pw = def.path.width;
    it.rotation = 0;
    it.w = L + def.path.width;
    it.d = def.path.width;
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
          this.gesture = { kind: 'pathDraw', id: e.pointerId, def, pts: [gpt] };
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

    // placement tools claim the tap; only the select tool grabs items
    const hit = this.store.tool === 'select' ? this.castItems(p) : null;
    if (hit) {
      const it = this.store.item(hit.itemId);
      this.store.select({ kind: 'item', id: hit.itemId });
      const def = ITEM_MAP.get(it.defId);
      if (def?.mount === 'ceiling') return;
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
        theta0: this.orbit.theta, phi0: this.orbit.phi, moved: false
      };
    }
  }

  onMove(e) {
    if (!this.pointers.has(e.pointerId)) return;
    const p = this.pos(e);
    this.pointers.set(e.pointerId, p);
    const g = this.gesture;

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
        const last = g.pts[g.pts.length - 1];
        const step = Math.max(24, g.def.path.width / 4);
        if (Math.hypot(gpt.x - last.x, gpt.y - last.y) >= step) {
          g.pts.push(gpt);
          this.addPathPreviewDot(gpt.x, gpt.y, g.def.path.width);
        }
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
        let len = 0;
        for (let i = 1; i < g.pts.length; i++) {
          len += Math.hypot(g.pts[i].x - g.pts[i - 1].x, g.pts[i].y - g.pts[i - 1].y);
        }
        if (g.pts.length >= 2 && len > 50) {
          const it = createPathItem(this.store, g.def, g.pts);
          this.flyToItem(it);
        } else {
          // a plain tap: drop a short straight starter run there
          const store = this.store;
          store.checkpoint();
          const it = store.addItem(g.def.id, Math.round(g.pts[0].x), Math.round(g.pts[0].y), 0, g.def);
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
        if (tool === 'place' && this.store.placeDefId) {
          this.placeItemAt(tap);
        } else if (tool === 'door' || tool === 'window') {
          this.placeOpeningAt(tap, tool === 'door' ? this.store.doorType : this.store.windowType);
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
