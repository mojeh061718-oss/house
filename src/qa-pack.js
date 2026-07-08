// Isolated QA renderer for the porch pack (not yet wired into the catalog).
// ?id=<itemId> or ?i=<index>, &pal=<n>, &az=<deg>, &audit=1 for an all-items
// bbox/mesh-count audit (results in window.__auditResults + title).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { PORCH_ITEMS } from './catalog/packs/porch.js';

const q = new URLSearchParams(location.search);
const az = parseFloat(q.get('az') || '35') * Math.PI / 180;
const palIdx = parseInt(q.get('pal') || '0', 10);
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

const palFor = (def) => (def.palettes ? def.palettes[Math.min(palIdx, def.palettes.length - 1)] : {});

if (q.get('audit')) {
  // build every item, report raw bbox vs declared w/d/h + mesh count
  const results = PORCH_ITEMS.map((def) => {
    try {
      const obj = def.build(palFor(def));
      const b = new THREE.Box3().setFromObject(obj);
      const s = b.getSize(new THREE.Vector3());
      let meshes = 0;
      obj.traverse((o) => { if (o.isMesh) meshes++; });
      return {
        id: def.id, meshes,
        w: [Math.round(s.x), def.w, +(s.x / def.w).toFixed(2)],
        h: [Math.round(s.y), def.h, +(s.y / def.h).toFixed(2)],
        d: [Math.round(s.z), def.d, +(s.z / def.d).toFixed(2)],
        minY: +b.min.y.toFixed(1)
      };
    } catch (e) {
      return { id: def.id, error: e.message };
    }
  });
  window.__auditResults = results;
  document.title = 'QA-AUDIT-DONE';
  window.__qaReady = true;
} else {
  const id = q.get('id');
  const def = id
    ? PORCH_ITEMS.find((d) => d.id === id)
    : PORCH_ITEMS[parseInt(q.get('i') || '0', 10)];
  let obj, box3, size, center;
  if (!def) {
    document.title = 'QA-ERROR: no item ' + (id || q.get('i'));
  } else {
    try {
      obj = def.build(palFor(def));
      scene.add(obj);
      box3 = new THREE.Box3().setFromObject(obj);
      size = box3.getSize(new THREE.Vector3());
      document.title = 'QA-OK: ' + def.id + ' [' + Math.round(size.x) + 'x' + Math.round(size.y) + 'x' + Math.round(size.z) + ']';
      // stage mounted items believably: hang ceiling items, lift wall items
      // onto a backdrop wall — the raw (unstaged) bbox is what the title reports
      if (def.mount === 'ceiling') {
        obj.position.y = size.y + 40;
      } else if (def.mount === 'wall') {
        obj.position.y = def.elevation ?? 0;
        const wall = new THREE.Mesh(
          new THREE.BoxGeometry(Math.max(200, size.x + 120), Math.max(280, size.y + (def.elevation ?? 0) + 60), 8),
          new THREE.MeshStandardMaterial({ color: '#dcd7cb', roughness: 0.9 })
        );
        wall.position.set(0, wall.geometry.parameters.height / 2, box3.min.z - 4);
        wall.receiveShadow = true;
        scene.add(wall);
      }
      box3 = new THREE.Box3().setFromObject(obj);
      size = box3.getSize(new THREE.Vector3());
      center = box3.getCenter(new THREE.Vector3());
    } catch (e) {
      document.title = 'QA-THROW: ' + (def?.id ?? id) + ' :: ' + e.message;
      console.error(e);
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
  const loop = () => {
    renderer.render(scene, camera);
    frame++;
    if (frame < 4) requestAnimationFrame(loop);
    else window.__qaReady = true;
  };
  loop();
}
