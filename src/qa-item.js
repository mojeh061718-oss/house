// Isolated single-item QA renderer. Loads ?id=<itemId>&pal=<n>&az=<deg>&h=1
// and renders that catalog item with the same lighting rig as the real viewer
// (RoomEnvironment IBL + hemi + sun + ACES). Used for before/after screenshots.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ITEM_MAP, paletteFor } from './catalog/items.js';

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

const def = ITEM_MAP.get(id);
let obj, box3, size, center;
if (!def) {
  document.title = 'QA-ERROR: no item ' + id;
} else {
  try {
    const pal = def.palettes ? paletteFor({ defId: id, palette: palIdx }, def) : {};
    obj = def.build(pal);
    scene.add(obj);
    box3 = new THREE.Box3().setFromObject(obj);
    size = box3.getSize(new THREE.Vector3());
    center = box3.getCenter(new THREE.Vector3());
    document.title = 'QA-OK: ' + id + ' [' + Math.round(size.x) + 'x' + Math.round(size.y) + 'x' + Math.round(size.z) + ']';
  } catch (e) {
    document.title = 'QA-THROW: ' + id + ' :: ' + e.message;
    console.error(e);
  }
}

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 40000);
if (size) {
  const radius = Math.max(size.x, size.y, size.z);
  const dist = radius * 2.1 + 120;
  const el = 0.62; // elevation angle
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
