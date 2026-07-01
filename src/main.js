// App bootstrap: wire store, 2D editor, 3D viewer and UI together.
import { Store } from './core/state.js';
import { Editor2D } from './editor/editor2d.js';
import { Viewer3D } from './viewer/viewer3d.js';
import { UI } from './ui/ui.js';
import { demoProject } from './demo.js';

const store = new Store();

// restore last session, otherwise open the furnished sample apartment
if (!store.loadAutosave()) {
  store.project = demoProject();
  store.refreshRooms();
}

const editor = new Editor2D(document.getElementById('plan'), store);
const viewer = new Viewer3D(document.getElementById('view3d'), store);
const ui = new UI(store, editor, viewer);

editor.fitToContent();
viewer.frameAll();

window.addEventListener('resize', () => {
  editor.resize();
  viewer.resize();
});

// expose for debugging in the console
window.havenplan = { store, editor, viewer, ui };
