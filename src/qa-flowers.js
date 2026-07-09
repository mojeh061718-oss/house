// QA lineup for the botanical library (src/catalog/flowers.js).
// ?az=<deg> orbits the whole lineup; ?zoom=<idx> frames one specimen.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { cyl, sphere, segment, solid } from './catalog/builders.js';
import {
  bloomRose, bloomDaisy, bloomSunflower, bloomTulip,
  spikeLavender, bloomHydrangea, flowerStem, bushMass, studBlooms,
} from './catalog/flowers.js';

const q = new URLSearchParams(location.search);
const az = parseFloat(q.get('az') || '35') * Math.PI / 180;
const zoom = q.get('zoom');

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
scene.add(new THREE.HemisphereLight('#dfeaf4', '#8a7f6a', 0.75));
const sun = new THREE.DirectionalLight('#fff4e0', 2.0);
sun.position.set(900, 1400, 600);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 100; sun.shadow.camera.far = 6000;
sun.shadow.camera.left = -800; sun.shadow.camera.right = 800;
sun.shadow.camera.top = 800; sun.shadow.camera.bottom = -800;
sun.shadow.bias = -0.0004; sun.shadow.radius = 4;
scene.add(sun, sun.target);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(4000, 4000),
  new THREE.MeshStandardMaterial({ color: '#b9c4bd', roughness: 0.95 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ---- specimens, spaced along X ----
const specs = [];
function station(name, w) {
  const g = new THREE.Group();
  const x = specs.length ? specs[specs.length - 1].x + specs[specs.length - 1].w / 2 + w / 2 + 40 : 0;
  g.position.x = x;
  scene.add(g);
  specs.push({ name, x, w, g });
  return g;
}

// 0: single large rose bloom on a stem (inspect the bloom itself)
{
  const g = station('rose-bloom', 60);
  const tip = flowerStem(g, 0, 0, 42, 3);
  bloomRose(g, '#c22c46', 9, tip.x, tip.y + 4, tip.z, 3);
}
// 1: rose bush — bushMass + roses studding the canopy
{
  const g = station('rose-bush', 110);
  bushMass(g, 100, 95, 100, { seed: 11, clusters: 8 });
  studBlooms(g, 100, 95, 100, 11, 41, (gg, x, y, z, i) =>
    bloomRose(gg, i % 3 ? '#c22c46' : '#d9556d', 5.5, x, y, z, i + 21));
}
// 2: daisy patch
{
  const g = station('daisies', 80);
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4, rr = 8 + (i % 4) * 9;
    const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    const tip = flowerStem(g, x, z, 26 + (i % 3) * 6, i + 5);
    bloomDaisy(g, '#f4f2ea', '#e8b520', 4.6, tip.x, tip.y + 2, tip.z, i + 5, (i % 3 - 1) * 0.18);
  }
}
// 3: sunflowers
{
  const g = station('sunflowers', 90);
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * 30, z = (i % 2) * 22 - 10, h = 120 + i * 18;
    segment(g, solid('#4e7a34', 0.85), [x, 0, z], [x + 4, h, z], 1.6, 1.0, 7);
    for (let L = 0; L < 3; L++) {
      const ly = h * (0.25 + L * 0.22);
      const leaf = sphere(g, solid('#41692c', 0.85), 14, x, ly, z, { sy: 0.14, sz: 0.5, seg: 8 });
      leaf.rotation.y = L * 2.2 + i;
      leaf.rotation.z = 0.45;
      leaf.translateX(11);
    }
    const head = bloomSunflower(g, 15, x + 4, h + 2, z, i + 2);
    head.rotation.x = 0.55;         // face slightly down/out like real heavy heads
    head.rotation.y = (i - 1) * 0.5;
  }
}
// 4: tulip bed
{
  const g = station('tulips', 70);
  const cols = ['#d8385e', '#e8b520', '#c9498f', '#d8385e', '#f0f0e8', '#e8b520'];
  for (let i = 0; i < 6; i++) {
    const x = (i % 3 - 1) * 22, z = (Math.floor(i / 3) - 0.5) * 20;
    const tip = flowerStem(g, x, z, 30 + (i % 2) * 5, i + 11);
    bloomTulip(g, cols[i], 5, tip.x, tip.y + 4, tip.z, i + 11);
  }
}
// 5: lavender row
{
  const g = station('lavender', 70);
  for (let i = 0; i < 12; i++) {
    spikeLavender(g, (i % 4 - 1.5) * 16, (Math.floor(i / 4) - 1) * 14, 24 + (i % 3) * 5, i + 3);
  }
}
// 6: hydrangea shrub — leafy mound + 4 mopheads
{
  const g = station('hydrangea', 90);
  bushMass(g, 80, 55, 80, { seed: 31, clusters: 6 });
  const hs = [[-18, 52, -8, '#7d9bd8'], [16, 58, 4, '#8fade2'], [2, 50, 20, '#b48fd0'], [-6, 62, 6, '#7d9bd8']];
  hs.forEach(([x, y, z, c], i) => bloomHydrangea(g, c, 11, x, y, z, i + 7));
}
// 7: plain bush (the sphere-read killer test)
{
  const g = station('bush', 120);
  bushMass(g, 110, 100, 105, { seed: 5, clusters: 8 });
}
// 8: hedge-ish wide bush
{
  const g = station('wide-bush', 150);
  bushMass(g, 150, 80, 70, { seed: 17, clusters: 9 });
  bushMass(g, 90, 70, 65, { seed: 23, clusters: 6, x: 20, z: 8 });
}

// pot under nothing — keep ground clean. Frame camera.
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 40000);
let target, dist;
if (zoom !== null && specs[+zoom]) {
  const s = specs[+zoom];
  const bb = new THREE.Box3().setFromObject(s.g);
  const c = bb.getCenter(new THREE.Vector3());
  const sz = bb.getSize(new THREE.Vector3());
  target = c;
  dist = Math.max(sz.x, sz.y, sz.z) * 1.6 + 60;
  document.title = 'QA-FLOWERS: ' + s.name;
} else {
  const bb = new THREE.Box3().setFromObject(scene);
  const c = new THREE.Vector3((specs[0].x + specs[specs.length - 1].x) / 2, 60, 0);
  target = c;
  dist = (specs[specs.length - 1].x - specs[0].x) * 0.62 + 260;
  document.title = 'QA-FLOWERS: lineup';
}
const el = 0.5;
camera.position.set(
  target.x + Math.cos(az) * Math.cos(el) * dist,
  target.y + Math.sin(el) * dist * 0.85,
  target.z + Math.sin(az) * Math.cos(el) * dist
);
camera.lookAt(target.x, target.y * 0.9, target.z);
sun.target.position.copy(target);

let frame = 0;
(function loop() {
  renderer.render(scene, camera);
  frame++;
  if (frame < 4) requestAnimationFrame(loop);
  else window.__qaReady = true;
})();
