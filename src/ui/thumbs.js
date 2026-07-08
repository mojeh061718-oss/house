// Catalog thumbnails: each card image is an actual render of the item's 3D
// model, produced lazily with a shared offscreen WebGL renderer.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ITEM_MAP } from '../catalog/items.js';
import { watchTextures } from '../core/textures.js';

let renderer = null, scene = null, camera = null;
const cache = new Map();
const SIZE = 220;

// Photo-based materials load after the first thumbnails are built; without
// this, a card snapshotted against the flat placeholder keeps it forever.
// Coalesce the burst of texture arrivals into one cache flush + UI refresh.
let refreshCb = null, refreshTimer = 0;
watchTextures(() => {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => { cache.clear(); refreshCb && refreshCb(); }, 400);
});
export function onThumbsRefresh(fn) { refreshCb = fn; }

function ensure() {
  if (renderer) return;
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setSize(SIZE, SIZE);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  scene = new THREE.Scene();
  // same image-based lighting as the main viewer — without an environment map
  // every metal/chrome/mirror item rendered near-black in its card
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const hemi = new THREE.HemisphereLight('#eef2f8', '#9a8f7c', 0.7);
  scene.add(hemi);
  const key = new THREE.DirectionalLight('#fff2dd', 1.9);
  key.position.set(1.5, 2.2, 2.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#dfe8ff', 0.7);
  rim.position.set(-2, 1, -1.5);
  scene.add(rim);
  camera = new THREE.PerspectiveCamera(34, 1, 1, 5000);
}

export function thumbnail(defId) {
  if (cache.has(defId)) return cache.get(defId);
  const def = ITEM_MAP.get(defId);
  if (!def) return '';
  ensure();
  const palette = def.palettes ? def.palettes[0] : {};
  const model = def.build(palette);
  scene.add(model);

  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z) * 0.5;
  const dist = radius / Math.tan((camera.fov * Math.PI) / 360) * 1.22;
  camera.position.set(center.x + dist * 0.72, center.y + dist * 0.5, center.z + dist * 0.78);
  camera.lookAt(center);
  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL();
  scene.remove(model);
  // dispose geometry AND per-item unique (owned) materials/textures — otherwise
  // building a card for every catalog item leaks GPU textures and OOM-crashes
  // mobile. Cached/shared materials (solid/wood/tex) are left for their caches.
  model.traverse(o => {
    o.geometry?.dispose?.();
    const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
    for (const mt of mats) {
      if (mt?.userData?.owned) {
        if (mt.userData.ownedMap) {
          mt.map?.dispose?.(); mt.bumpMap?.dispose?.(); mt.alphaMap?.dispose?.();
        }
        mt.dispose?.();
      }
    }
  });
  cache.set(defId, url);
  return url;
}
