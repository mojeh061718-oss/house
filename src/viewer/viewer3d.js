// Real-time 3D view: renders the project with lighting/shadows, orbit and
// first-person walk controls, and direct furniture editing (drag with wall
// snapping) in 3D. All pointer input goes through rotation-aware helpers so
// the forced-landscape mode on iPhone/iPad works identically.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildWalls, buildFloors, buildCeilings, buildGround } from './arch3d.js';
import { ITEM_MAP, paletteFor } from '../catalog/items.js';
import { clamp } from '../core/geometry.js';
import { snapPose } from '../core/placement.js';
import { localPos } from '../core/orientation.js';

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
    scene.add(sun);
    scene.add(sun.target);
    this.sun = sun;

    // gradient sky dome, driven by time of day
    this.skyCanvas = document.createElement('canvas');
    this.skyCanvas.width = 1;
    this.skyCanvas.height = 256;
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
    store.on('projectLoaded', () => {
      this.needsRebuild = true;
      this.frameAll();
      this.applyTimeOfDay(store.project.settings.timeOfDay ?? 13);
    });

    this.clock = new THREE.Clock();
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

  rebuild() {
    this.needsRebuild = false;
    const { project } = this.store;
    const rooms = this.store.rooms;
    this.disposeGroup(this.archGroup);
    this.disposeGroup(this.groundGroup);
    const guard = (fn, what) => {
      try { fn(); } catch (err) { console.warn(what + ' build failed', err); }
    };
    guard(() => this.archGroup.add(buildWalls(project, rooms)), 'walls');
    guard(() => this.archGroup.add(buildFloors(project, rooms)), 'floors');
    if (this.showCeilings || this.walkMode) {
      guard(() => this.archGroup.add(buildCeilings(project, rooms)), 'ceilings');
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
    for (const it of this.store.project.items) {
      const def = ITEM_MAP.get(it.defId);
      if (!def) continue;
      try {
        const model = def.build(paletteFor(it, def));
        model.scale.set(it.w / def.w, it.h / def.h, it.d / def.d);
        const outer = new THREE.Group();
        outer.add(model);
        outer.userData.itemId = it.id;
        this.poseItem(outer, it, def, wallH);
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
    this.updateSelBox();
  }

  poseItem(outer, it, def, wallH) {
    const baseY = def.mount === 'ceiling' ? wallH : (it.elevation || 0);
    outer.position.set(it.x, baseY, it.y);
    outer.rotation.y = -it.rotation;
  }

  /** Cheap update path for drags: reuse models, only update transforms. */
  syncItems() {
    const wallH = this.store.project.settings.wallHeight;
    const alive = new Set();
    let structuralChange = false;
    for (const it of this.store.project.items) {
      alive.add(it.id);
      const g = this.itemGroups.get(it.id);
      if (!g) { structuralChange = true; continue; }
      const def = ITEM_MAP.get(it.defId);
      const model = g.children[0];
      if (g.userData.palette !== it.palette || g.userData.w !== it.w || g.userData.d !== it.d || g.userData.h !== it.h) {
        structuralChange = true;
      }
      this.poseItem(g, it, def, wallH);
      if (model) model.scale.set(it.w / def.w, it.h / def.h, it.d / def.d);
    }
    for (const id of this.itemGroups.keys()) {
      if (!alive.has(id)) structuralChange = true;
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

  setWalkMode(on) {
    this.walkMode = on;
    if (on) {
      const c = this.center();
      this.walk.pos.set(this.camera.position.x, 160, this.camera.position.z);
      const dir = new THREE.Vector3().subVectors(this.orbit.target, this.camera.position);
      this.walk.yaw = Math.atan2(-dir.x, -dir.z) + Math.PI;
      this.walk.pitch = 0;
      if (Math.hypot(this.walk.pos.x - c.x, this.walk.pos.z - c.z) > c.span * 1.5) {
        this.walk.pos.set(c.x, 160, c.z);
      }
    }
    this.needsRebuild = true;
  }

  setCeilings(on) {
    this.showCeilings = on;
    this.needsRebuild = true;
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
        zenith: '#63a3e6', horizon: '#dcecf7', below: '#b9c9d4',
        sun: '#fff2dc', sunI: 2.0, hemiSky: '#dfeaf4', hemiGround: '#8a7f6a', hemiI: 0.75,
        exposure: 1.05, envI: 0.55
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

    // repaint the sky gradient
    const g = this.skyCanvas.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#' + s.zenith.getHexString());
    grad.addColorStop(0.52, '#' + s.horizon.getHexString());
    grad.addColorStop(0.62, '#' + s.below.getHexString());
    grad.addColorStop(1, '#' + s.below.getHexString());
    g.fillStyle = grad;
    g.fillRect(0, 0, 1, 256);
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
    this.raycaster.setFromCamera(this.toNDC(p), this.camera);
    const hits = this.raycaster.intersectObjects(this.itemsGroup.children, true);
    for (const h of hits) {
      let obj = h.object;
      while (obj && !obj.userData.itemId) obj = obj.parent;
      if (obj) return { itemId: obj.userData.itemId, point: h.point };
    }
    return null;
  }

  onDown(e) {
    const p = this.pos(e);
    this.pointers.set(e.pointerId, p);
    try { this.renderer.domElement.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }

    if (this.pointers.size === 2) {
      // pinch takes over: cancel single-pointer gestures (keep item drag)
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
      } else {
        this.gesture = { kind: 'look', id: e.pointerId, x: p.x, y: p.y, yaw: this.walk.yaw, pitch: this.walk.pitch };
      }
      return;
    }

    const hit = this.castItems(p);
    if (hit) {
      const it = this.store.item(hit.itemId);
      this.store.select({ kind: 'item', id: hit.itemId });
      const def = ITEM_MAP.get(it.defId);
      if (def?.mount === 'ceiling') return;
      this.store.checkpoint();
      this.drag = {
        id: hit.itemId,
        plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -(it.elevation || 0)),
        offX: hit.point.x - it.x,
        offZ: hit.point.z - it.y,
        moved: false
      };
    } else {
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

    if (g?.kind === 'look' && g.id === e.pointerId) {
      this.walk.yaw = g.yaw - (p.x - g.x) * 0.005;
      this.walk.pitch = clamp(g.pitch - (p.y - g.y) * 0.004, -1.2, 1.2);
      return;
    }

    if (g?.kind === 'joy' && g.id === e.pointerId) {
      this.walk.joy = {
        mx: clamp((p.x - g.x) / 70, -1, 1),
        mz: clamp((p.y - g.y) / 70, -1, 1)
      };
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
          const pose = snapPose(this.store.project.walls, def, target.x, target.y,
            { fine: true, rot: it.rotation, d: it.d });
          it.x = pose.x;
          it.y = pose.y;
          if (pose.snapped) it.rotation = pose.rot;
          this.drag.moved = true;
          this.store.commit(false);
        }
      }
    }
  }

  onUp(e) {
    this.pointers.delete(e.pointerId);
    const g = this.gesture;
    if (g?.kind === 'joy' && g.id === e.pointerId) this.walk.joy = null;
    if (g?.kind === 'pinch' && this.pointers.size === 1) {
      // hand back to single-finger rotate anchored at the remaining pointer
      const [id, p] = [...this.pointers.entries()][0];
      this.gesture = { kind: 'rotate', id, x: p.x, y: p.y, theta0: this.orbit.theta, phi0: this.orbit.phi, moved: true };
    } else if (g && (g.id === e.pointerId || this.pointers.size === 0)) {
      if (g.kind === 'rotate' && !g.moved && !this.walkMode) {
        this.store.select(null); // simple tap on empty space deselects
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
      this.camera.position.copy(this.walk.pos);
      const look = new THREE.Vector3(
        this.walk.pos.x - Math.sin(this.walk.yaw) * Math.cos(this.walk.pitch),
        this.walk.pos.y + Math.sin(this.walk.pitch),
        this.walk.pos.z - Math.cos(this.walk.yaw) * Math.cos(this.walk.pitch)
      );
      this.camera.lookAt(look);
    } else {
      this.applyOrbit();
    }
    this.renderer.render(this.scene, this.camera);
  }
}
