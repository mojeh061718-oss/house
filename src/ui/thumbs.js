// Catalog thumbnails: each card image is an actual render of the item's 3D
// model, produced lazily with a shared offscreen WebGL renderer.
import * as THREE from 'three';
import { ITEM_MAP } from '../catalog/items.js';

let renderer = null, scene = null, camera = null;
const cache = new Map();
const SIZE = 220;

function ensure() {
  if (renderer) return;
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setSize(SIZE, SIZE);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  scene = new THREE.Scene();
  const hemi = new THREE.HemisphereLight('#eef2f8', '#9a8f7c', 1.0);
  scene.add(hemi);
  const key = new THREE.DirectionalLight('#fff2dd', 2.2);
  key.position.set(1.5, 2.2, 2.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#dfe8ff', 0.8);
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
  model.traverse(o => o.geometry?.dispose?.());
  cache.set(defId, url);
  return url;
}
