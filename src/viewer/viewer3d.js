// Real-time 3D view: renders the project with lighting/shadows, orbit and
// first-person walk controls, and direct furniture dragging in 3D.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildWalls, buildFloors, buildCeilings, buildGround } from './arch3d.js';
import { ITEM_MAP, paletteFor } from '../catalog/items.js';
import { clamp } from '../core/geometry.js';

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
    scene.background = new THREE.Color('#bfd5e4');
    scene.fog = new THREE.Fog('#bfd5e4', 3500, 9000);
    this.scene = scene;

    this.camera = new THREE.PerspectiveCamera(50, 1, 5, 20000);
    this.camera.position.set(600, 550, 750);

    this.controls = new OrbitControls(this.camera, renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.09;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
    this.controls.minDistance = 60;
    this.controls.maxDistance = 5000;

    // lighting
    const hemi = new THREE.HemisphereLight('#dfeaf4', '#8a7f6a', 0.75);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight('#fff4e0', 2.0);
    sun.position.set(900, 1400, 600);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 100;
    sun.shadow.camera.far = 5000;
    sun.shadow.bias = -0.0004;
    scene.add(sun);
    scene.add(sun.target);
    this.sun = sun;

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
    this.drag = null;
    this.pointers = new Map();

    const el = renderer.domElement;
    el.addEventListener('pointerdown', e => this.onDown(e));
    el.addEventListener('pointermove', e => this.onMove(e));
    el.addEventListener('pointerup', e => this.onUp(e));
    el.addEventListener('pointercancel', e => this.onUp(e));
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
    store.on('projectLoaded', () => { this.needsRebuild = true; this.frameAll(); });

    this.clock = new THREE.Clock();
    renderer.setAnimationLoop(() => this.tick());
  }

  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
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
    this.controls.target.set(c.x, 60, c.z);
    const d = c.span * 1.15;
    this.camera.position.set(c.x + d * 0.55, d * 0.75, c.z + d * 0.9);
    this.sun.target.position.set(c.x, 0, c.z);
    const s = this.sun.shadow.camera;
    s.left = -c.span; s.right = c.span; s.top = c.span; s.bottom = -c.span;
    s.updateProjectionMatrix();
    this.walk.pos.set(c.x, 160, c.z + 100);
  }

  rebuild() {
    this.needsRebuild = false;
    const { project } = this.store;
    const rooms = this.store.rooms;
    this.disposeGroup(this.archGroup);
    this.disposeGroup(this.groundGroup);
    this.archGroup.add(buildWalls(project, rooms));
    this.archGroup.add(buildFloors(project, rooms));
    if (this.showCeilings || this.walkMode) {
      this.archGroup.add(buildCeilings(project, rooms));
    }
    this.groundGroup.add(buildGround(project));
    this.rebuildItems();
    const c = this.center();
    this.sun.target.position.set(c.x, 0, c.z);
    const s = this.sun.shadow.camera;
    const span = Math.max(c.span, 600);
    s.left = -span; s.right = span; s.top = span; s.bottom = -span;
    s.updateProjectionMatrix();
  }

  rebuildItems() {
    this.disposeGroup(this.itemsGroup);
    this.itemGroups.clear();
    const wallH = this.store.project.settings.wallHeight;
    for (const it of this.store.project.items) {
      const def = ITEM_MAP.get(it.defId);
      if (!def) continue;
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
        // stash palette/size so syncItems can detect appearance changes
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
    this.controls.enabled = !on;
    if (on) {
      const c = this.center();
      this.walk.pos.set(this.camera.position.x, 160, this.camera.position.z);
      const dir = new THREE.Vector3().subVectors(this.controls.target, this.camera.position);
      this.walk.yaw = Math.atan2(-dir.x, -dir.z) + Math.PI;
      this.walk.pitch = 0;
      // if far outside, walk in from the center's edge
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

  /** Render one frame and return it as a PNG data-URL. */
  snapshot() {
    this.resize();
    if (this.needsRebuild) this.rebuild();
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  // ---- input ---------------------------------------------------------------

  castItems(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.itemsGroup.children, true);
    for (const h of hits) {
      let obj = h.object;
      while (obj && !obj.userData.itemId) obj = obj.parent;
      if (obj) return { itemId: obj.userData.itemId, point: h.point };
    }
    return null;
  }

  onDown(e) {
    this.pointers.set(e.pointerId, true);
    if (this.walkMode) {
      this.lookFrom = { x: e.clientX, y: e.clientY, yaw: this.walk.yaw, pitch: this.walk.pitch, id: e.pointerId };
      return;
    }
    if (this.pointers.size > 1) return;
    const hit = this.castItems(e);
    if (hit) {
      const it = this.store.item(hit.itemId);
      this.store.select({ kind: 'item', id: hit.itemId });
      const def = ITEM_MAP.get(it.defId);
      if (def?.mount === 'ceiling') return; // don't drag ceiling lights on floor plane
      this.store.checkpoint();
      this.drag = {
        id: hit.itemId,
        plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -(it.elevation || 0)),
        offX: hit.point.x - it.x,
        offZ: hit.point.z - it.y,
        moved: false
      };
      this.controls.enabled = false;
      this.renderer.domElement.setPointerCapture(e.pointerId);
    }
  }

  onMove(e) {
    if (this.walkMode && this.lookFrom && this.lookFrom.id === e.pointerId) {
      const dx = e.clientX - this.lookFrom.x, dy = e.clientY - this.lookFrom.y;
      this.walk.yaw = this.lookFrom.yaw - dx * 0.004;
      this.walk.pitch = clamp(this.lookFrom.pitch - dy * 0.003, -1.2, 1.2);
      return;
    }
    if (!this.drag) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const pt = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.drag.plane, pt)) {
      const it = this.store.item(this.drag.id);
      if (it) {
        it.x = Math.round((pt.x - this.drag.offX) / 2) * 2;
        it.y = Math.round((pt.z - this.drag.offZ) / 2) * 2;
        this.drag.moved = true;
        this.store.commit(false);
      }
    }
  }

  onUp(e) {
    this.pointers.delete(e.pointerId);
    if (this.lookFrom?.id === e.pointerId) this.lookFrom = null;
    if (this.drag) {
      if (!this.drag.moved) {
        this.store.undoStack.pop();
        this.store.emit('history');
      }
      this.drag = null;
      this.store.commit(false);
    }
    if (!this.walkMode) this.controls.enabled = true;
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
      this.controls.update();
    }
    this.renderer.render(this.scene, this.camera);
  }
}
