// App bootstrap: splash → project home → studio (2D editor + 3D viewer).
import { Store } from './core/state.js';
import { initOrientation } from './core/orientation.js';
import { Editor2D } from './editor/editor2d.js';
import { Viewer3D } from './viewer/viewer3d.js';
import { UI } from './ui/ui.js';
import { Home } from './ui/home.js';
import { clearDraft, initStorage, setStorageFullHandler } from './core/projects.js';
import pkg from '../package.json';

initOrientation();

const store = new Store();
const editor = new Editor2D(document.getElementById('plan'), store);
const viewer = new Viewer3D(document.getElementById('view3d'), store);

const home = new Home((data, projectId, opts = {}) => {
  store.loadProject(data, projectId);
  // resumed unsaved work: mark it dirty so leaving prompts to Save and it
  // can never silently vanish
  if (opts.dirty) store._savedJson = null;
  store.setTool('select');
  store.setViewMode('2d');
  requestAnimationFrame(() => {
    editor.resize();
    viewer.resize();
    editor.fitToContent();
    viewer.frameAll();
  });
});

const ui = new UI(store, editor, viewer, async () => {
  if (store.isDirty()) {
    const choice = await ui.askSave(store.project.name);
    if (choice === 'cancel') return;
    if (choice === 'save') store.saveNow();
    else clearDraft(store.currentProjectId);
  }
  home.show();
});

// warn (never silently delete) if a save is ever rejected for lack of space
setStorageFullHandler(() => ui.toast('Storage is full — back up & remove old projects'));

// Start the splash animation immediately (not gated on storage), then load
// durable storage in parallel; once it's ready — and the splash has had its
// full time on screen — fade to the home screen.
home.beginSplash();
initStorage().finally(() => home.endSplash());

// keep our projects out of eviction; iOS grants this to installed home-screen
// apps. Retry on the first interaction, which some browsers require.
const ensurePersisted = async () => {
  try {
    if (navigator.storage?.persisted && navigator.storage?.persist) {
      if (!(await navigator.storage.persisted())) await navigator.storage.persist();
    }
  } catch { /* best effort */ }
};
ensurePersisted();
window.addEventListener('pointerdown', function once() {
  ensurePersisted();
  window.removeEventListener('pointerdown', once);
}, { once: true });

window.addEventListener('resize', () => {
  editor.resize();
  viewer.resize();
});
// stash a recovery draft on every lifecycle signal iOS might kill us on
const stashDraft = () => store.saveDraftNow();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') stashDraft();
});
window.addEventListener('pagehide', stashDraft);
document.addEventListener('freeze', stashDraft);

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
import('./core/textures.js').then(m => {
  window.homestudio.MATERIALS = m.MATERIALS;
});

// PWA: register the service worker in production builds. The version in the
// URL makes every release a "new" worker so the browser installs it and the
// activate step purges the previous cache — otherwise a constant worker keeps
// serving a stale app shell (the "it went back to an old version" bug).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`./sw.js?v=${pkg.version}`)
      .catch(() => { /* offline support unavailable */ });
  });
}
