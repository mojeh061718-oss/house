// App bootstrap: splash → project home → studio (2D editor + 3D viewer).
import { Store } from './core/state.js';
import { initOrientation } from './core/orientation.js';
import { Editor2D } from './editor/editor2d.js';
import { Viewer3D } from './viewer/viewer3d.js';
import { UI } from './ui/ui.js';
import { Home } from './ui/home.js';

initOrientation();

const store = new Store();
const editor = new Editor2D(document.getElementById('plan'), store);
const viewer = new Viewer3D(document.getElementById('view3d'), store);

const home = new Home((data, projectId) => {
  store.loadProject(data, projectId);
  store.setTool('select');
  store.setViewMode('2d');
  store.saveNow();
  requestAnimationFrame(() => {
    editor.resize();
    viewer.resize();
    editor.fitToContent();
    viewer.frameAll();
  });
});

const ui = new UI(store, editor, viewer, () => {
  store.saveNow();
  home.show();
});

home.showSplash();
// photo textures load lazily on first use (cellular-friendly); ask the
// browser to keep our saved projects out of storage eviction
navigator.storage?.persist?.().catch(() => { /* best effort */ });

window.addEventListener('resize', () => {
  editor.resize();
  viewer.resize();
});
// save when the app is backgrounded (iOS PWA lifecycle)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') store.saveNow();
});

// expose for debugging in the console
window.homestudio = { store, editor, viewer, ui, home };
import('./catalog/items.js').then(m => {
  window.homestudio.ITEMS = m.ITEMS;
  window.homestudio.ITEM_MAP = m.ITEM_MAP;
});
import('./core/openings.js').then(m => {
  window.homestudio.OPENING_TYPES = m.OPENING_TYPES;
});
import('./core/autoroof.js').then(m => {
  window.homestudio.autoRoof = m.autoRoof;
});

// PWA: register the service worker in production builds
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* offline support unavailable */ });
  });
}
