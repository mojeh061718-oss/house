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

// show the current version on the logo screen as early as possible
{
  const verEl = document.getElementById('splashVer');
  if (verEl) verEl.textContent = 'v' + pkg.version;
}

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

// ---- Loading sequence -------------------------------------------------------
// The splash animates on its own (CSS, no JS gate) so it can never sit blank or
// pop straight to the finished logo. Behind it we load durable storage plus the
// heavy studio modules (three.js, the catalog, textures) and VERIFY each one
// finished, then reveal the home screen once storage is ready and the splash
// has shown for its full run. Any failure is logged (not swallowed); if the app
// never reaches the home screen the inline splash failsafe (index.html)
// surfaces a reload button instead of a blank screen.
home.beginSplash();

(async function boot() {
  // Load everything the app needs behind the splash and VERIFY each finished.
  // Home only needs storage; the studio needs three.js + the catalog + textures,
  // so we warm them now (covered by the splash) instead of stalling later. Any
  // failure is logged, not swallowed silently.
  const steps = {
    storage: initStorage(),
    three: import('three'),
    catalog: import('./catalog/items.js'),
    textures: import('./core/textures.js'),
  };
  const names = Object.keys(steps);
  const results = await Promise.allSettled(names.map(n => steps[n]));
  const failed = [];
  results.forEach((r, i) => {
    if (r.status === 'rejected') { failed.push(names[i]); console.error('[boot] failed to load "' + names[i] + '":', r.reason); }
  });
  if (failed.length) window.__bootFailed = failed;   // the splash failsafe can surface this

  home.endSplash();      // internally holds until the splash has had its full time, then fades
})().catch(e => console.error('[boot] fatal:', e));   // inline failsafe shows a reload button

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

// expose for debugging in the console (viewer is filled in by ensureViewer)
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
  window.homestudio.getTextureCanvases = m.getTextureCanvases;
});
import('three').then(m => { window.homestudio.THREE = m; });

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
