// Isolated QA renderer for the OUTDOORPLUS pack (copy of qa-item.js pattern,
// importing the pack directly). ?id=<itemId>&pal=<n>&az=<deg>&grid=0
// ?audit=1 builds every item and reports bbox/grounding in the title + window.__audit.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { OUTDOORPLUS_ITEMS } from './catalog/packs/outdoorplus.js';

const MAP = new Map(OUTDOORPLUS_ITEMS.map((d) => [d.id, d]));
const q = new URLSearchParams(location.search);
const id = q.get('id');
const palIdx = parseInt(q.get('pal') || '0', 10);
const az = parseFloat(q.get('az') || '35') * Math.PI / 180;
const showGrid = q.get('grid') !== '0';
const audit = q.get('audit') === '1';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.getElementById('c').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#c9d6e0');
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;

const hemi = new THREE.HemisphereLight('#dfeaf4', '#8a7f6a', 0.75);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff4e0', 2.0);
sun.position.set(900, 1400, 600);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 100;
sun.shadow.camera.far = 6000;
sun.shadow.bias = -0.0004;
sun.shadow.radius = 4;
scene.add(sun, sun.target);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(4000, 4000),
  new THREE.MeshStandardMaterial({ color: '#b9c4bd', roughness: 0.95 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
if (showGrid) {
  const grid = new THREE.GridHelper(2000, 40, '#8fa0a8', '#a6b3ba');
  grid.position.y = 0.2;
  scene.add(grid);
}

function palFor(def, idx) {
  return def.palettes ? def.palettes[((idx % def.palettes.length) + def.palettes.length) % def.palettes.length] : {};
}

let obj, box3, size, center;

if (audit) {
  // Build every item, measure bbox vs declared size + grounding.
  const rows = [];
  for (const def of OUTDOORPLUS_ITEMS) {
    try {
      const o = def.build(palFor(def, 0));
      const b = new THREE.Box3().setFromObject(o);
      const s = b.getSize(new THREE.Vector3());
      let meshes = 0;
      o.traverse((n) => { if (n.isMesh) meshes++; });
      const ratio = (a, b2) => a / b2;
      const rx = ratio(s.x, def.w), ry = ratio(s.y, def.h), rz = ratio(s.z, def.d);
      const inRange = (r) => r >= 0.35 && r <= 1.45;
      const grounded = b.min.y > -6 && b.min.y < 8;
      const ok = inRange(rx) && inRange(ry) && inRange(rz) && grounded;
      rows.push({
        id: def.id, ok, meshes, minY: +b.min.y.toFixed(1),
        bbox: [+s.x.toFixed(0), +s.y.toFixed(0), +s.z.toFixed(0)],
        def: [def.w, def.h, def.d],
        ratios: [+rx.toFixed(2), +ry.toFixed(2), +rz.toFixed(2)]
      });
    } catch (e) {
      rows.push({ id: def.id, ok: false, error: e.message });
    }
  }
  window.__audit = rows;
  const bad = rows.filter((r) => !r.ok).map((r) => r.id);
  document.title = bad.length ? 'AUDIT-FAIL: ' + bad.join(',') : 'AUDIT-OK: ' + rows.length + ' items';
} else {
  const def = MAP.get(id);
  if (!def) {
    document.title = 'QA-ERROR: no item ' + id;
  } else {
    try {
      obj = def.build(palFor(def, palIdx));
      scene.add(obj);
      box3 = new THREE.Box3().setFromObject(obj);
      size = box3.getSize(new THREE.Vector3());
      center = box3.getCenter(new THREE.Vector3());
      document.title = 'QA-OK: ' + id + ' [' + Math.round(size.x) + 'x' + Math.round(size.y) + 'x' + Math.round(size.z) + '] minY=' + box3.min.y.toFixed(1);
    } catch (e) {
      document.title = 'QA-THROW: ' + id + ' :: ' + e.message;
      console.error(e);
    }
  }
}

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 40000);
if (size) {
  const radius = Math.max(size.x, size.y, size.z);
  const dist = radius * 2.1 + 120;
  const el = 0.62;
  camera.position.set(
    center.x + Math.cos(az) * Math.cos(el) * dist,
    center.y + Math.sin(el) * dist * 0.9 + size.y * 0.1,
    center.z + Math.sin(az) * Math.cos(el) * dist
  );
  camera.lookAt(center.x, center.y * 0.92, center.z);
  sun.target.position.copy(center);
} else {
  camera.position.set(300, 300, 400);
  camera.lookAt(0, 60, 0);
}

let frame = 0;
function loop() {
  renderer.render(scene, camera);
  frame++;
  if (frame < 4) requestAnimationFrame(loop);
  else window.__qaReady = true;
}
loop();
