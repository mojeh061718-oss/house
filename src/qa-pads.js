// Isolated QA renderer for the PATHS & PADS pack. Loads ?id=<itemId>&pal=<n>
// &az=<deg> and renders that pack item with the real viewer lighting rig.
// - areaDraw pads render via def.buildSized(pal, def.w, def.d, def.h)
// - def.path items render through arch3d's real buildPathModel with a fake
//   3-point stroke, so the screenshot shows the true dragged-path geometry.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { PATHSPADS_ITEMS } from './catalog/packs/pathspads.js';
import { buildPathModel } from './viewer/arch3d.js';

const q = new URLSearchParams(location.search);
const id = q.get('id');
const palIdx = parseInt(q.get('pal') || '0', 10);
const az = parseFloat(q.get('az') || '35') * Math.PI / 180;
const showGrid = q.get('grid') !== '0';

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

// ground
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

const def = PATHSPADS_ITEMS.find(it => it.id === id);
let obj, box3, size, center;
if (!def) {
  document.title = 'QA-ERROR: no item ' + id;
} else {
  try {
    const pal = def.palettes ? def.palettes[Math.min(palIdx, def.palettes.length - 1)] : {};
    if (def.path) {
      const fakeIt = { x: 0, y: 0, path: [{ x: -150, y: 0 }, { x: 0, y: 20 }, { x: 150, y: 0 }] };
      obj = buildPathModel(fakeIt, def);
    } else if (def.areaDraw && def.buildSized) {
      obj = def.buildSized(pal, def.w, def.d, def.h);
    } else {
      obj = def.build(pal);
    }
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

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 40000);
if (size) {
  const radius = Math.max(size.x, size.y, size.z);
  const dist = radius * 1.35 + 120;
  const el = 0.72; // higher elevation — these are flat ground surfaces
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

// Keep re-rendering for a few seconds so async photo textures (JPG-backed
// materials swap in after load) appear in the screenshot.
const t0 = performance.now();
let frame = 0;
function loop() {
  renderer.render(scene, camera);
  frame++;
  if (frame >= 4) window.__qaReady = true;
  if (performance.now() - t0 < 6000) requestAnimationFrame(loop);
}
loop();
