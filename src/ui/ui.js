// UI shell: toolbar, catalog panel with 3D thumbnails, properties panel,
// status bar, file operations, responsive drawers.
import { ICONS, icon } from './icons.js';
import { thumbnail } from './thumbs.js';
import { CATEGORIES, ITEMS, ITEM_MAP } from '../catalog/items.js';
import { MATERIALS, getMaterialPreview } from '../core/textures.js';
import { wallLength } from '../core/geometry.js';
import { emptyProject } from '../core/state.js';
import { demoProject } from '../demo.js';

const $ = sel => document.querySelector(sel);

function el(tag, cls = '', html = '') {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

const deg = rad => Math.round((rad * 180 / Math.PI) % 360);

export class UI {
  constructor(store, editor, viewer) {
    this.store = store;
    this.editor = editor;
    this.viewer = viewer;
    this.activeCat = 'living';

    this.buildToolbar();
    this.buildCatalog();
    this.buildStatus();

    store.on('selection', () => this.renderProps());
    store.on('change', () => this.renderPropsSoft());
    store.on('tool', () => this.syncToolbar());
    store.on('view', () => this.syncView());
    store.on('history', () => this.syncHistory());
    store.on('status', pos => this.updateCoords(pos));
    store.on('projectLoaded', () => {
      $('#projectName').value = store.project.name || 'Untitled';
      this.renderProps();
    });

    this.renderProps();
    this.syncToolbar();
    this.syncView();
    this.syncHistory();
  }

  // ============================ TOOLBAR =====================================

  buildToolbar() {
    const store = this.store;
    const bar = $('#topbar');
    bar.innerHTML = `
      <div class="brand">${ICONS.logo}<span class="brand-name">Haven<b>Plan</b></span></div>
      <input id="projectName" class="project-name" value="${store.project.name || 'Untitled'}" spellcheck="false"/>
      <div class="tb-group">
        <button class="tb-btn" id="btnUndo" title="Undo (Ctrl+Z)">${ICONS.undo}</button>
        <button class="tb-btn" id="btnRedo" title="Redo (Ctrl+Y)">${ICONS.redo}</button>
      </div>
      <div class="tb-sep"></div>
      <div class="tb-group tools">
        <button class="tb-btn tool" data-tool="select" title="Select / move (Esc)">${ICONS.select}<span>Select</span></button>
        <button class="tb-btn tool" data-tool="wall" title="Draw walls — click to chain, double-click or Esc to finish">${ICONS.wall}<span>Wall</span></button>
        <button class="tb-btn tool" data-tool="room" title="Draw a rectangular room">${ICONS.room}<span>Room</span></button>
        <button class="tb-btn tool" data-tool="door" title="Place a door on a wall">${ICONS.door}<span>Door</span></button>
        <button class="tb-btn tool" data-tool="window" title="Place a window on a wall">${ICONS.window}<span>Window</span></button>
      </div>
      <div class="tb-sep"></div>
      <div class="tb-group view-toggle" id="viewToggle">
        <button class="tb-btn" data-view="2d" title="2D plan">${ICONS.d2}<span>2D</span></button>
        <button class="tb-btn" data-view="3d" title="3D view">${ICONS.d3}<span>3D</span></button>
        <button class="tb-btn only-wide" data-view="split" title="Side by side">${ICONS.split}<span>Split</span></button>
      </div>
      <div class="tb-group" id="threeDControls">
        <button class="tb-btn" id="btnWalk" title="First-person walk (WASD + drag)">${ICONS.walk}<span>Walk</span></button>
        <button class="tb-btn" id="btnCeil" title="Toggle ceilings">${ICONS.ceiling}<span>Ceiling</span></button>
      </div>
      <div class="tb-spacer"></div>
      <div class="tb-group">
        <button class="tb-btn" id="btnShot" title="Save 3D snapshot as PNG">${ICONS.camera}</button>
        <button class="tb-btn" id="btnMenu" title="Project menu">${ICONS.menu}</button>
      </div>
      <div class="menu hidden" id="fileMenu">
        <button id="mNew">${icon('file')} New project</button>
        <button id="mDemo">${icon('logo')} Load sample apartment</button>
        <button id="mOpen">${icon('open')} Open… <span class="hint">.json</span></button>
        <button id="mSave">${icon('download')} Download project</button>
      </div>`;

    $('#projectName').addEventListener('change', e => {
      store.project.name = e.target.value;
      store.scheduleAutosave();
    });
    $('#btnUndo').onclick = () => store.undo();
    $('#btnRedo').onclick = () => store.redo();
    bar.querySelectorAll('.tool').forEach(b => {
      b.onclick = () => store.setTool(b.dataset.tool === store.tool ? 'select' : b.dataset.tool);
    });
    bar.querySelectorAll('#viewToggle .tb-btn').forEach(b => {
      b.onclick = () => store.setViewMode(b.dataset.view);
    });
    $('#btnWalk').onclick = () => {
      this.viewer.setWalkMode(!this.viewer.walkMode);
      $('#btnWalk').classList.toggle('active', this.viewer.walkMode);
      if (this.viewer.walkMode && store.viewMode === '2d') store.setViewMode('3d');
      this.updateHint();
    };
    $('#btnCeil').onclick = () => {
      this.viewer.setCeilings(!this.viewer.showCeilings);
      $('#btnCeil').classList.toggle('active', this.viewer.showCeilings);
    };
    $('#btnShot').onclick = () => {
      const url = this.viewer.snapshot();
      const a = document.createElement('a');
      a.href = url;
      a.download = `${store.project.name || 'design'}.png`;
      a.click();
    };

    // file menu
    const menu = $('#fileMenu');
    $('#btnMenu').onclick = e => {
      e.stopPropagation();
      menu.classList.toggle('hidden');
    };
    document.addEventListener('click', () => menu.classList.add('hidden'));
    $('#mNew').onclick = () => {
      if (confirm('Start a new empty project? Unsaved work is kept in the browser autosave until you draw.')) {
        store.loadProject(emptyProject('Untitled project'));
      }
    };
    $('#mDemo').onclick = () => store.loadProject(demoProject());
    $('#mSave').onclick = () => {
      const blob = new Blob([store.exportJSON()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${(store.project.name || 'project').replace(/[^\w\- ]+/g, '')}.havenplan.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    };
    $('#mOpen').onclick = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = () => {
        const f = input.files[0];
        if (!f) return;
        f.text().then(txt => {
          try {
            const data = JSON.parse(txt);
            if (!Array.isArray(data.walls)) throw new Error('bad file');
            store.loadProject(data);
          } catch {
            alert('This file is not a valid HavenPlan project.');
          }
        });
      };
      input.click();
    };
  }

  syncToolbar() {
    document.querySelectorAll('#topbar .tool').forEach(b => {
      b.classList.toggle('active', b.dataset.tool === this.store.tool);
    });
    this.updateHint();
  }

  syncHistory() {
    $('#btnUndo').disabled = !this.store.undoStack.length;
    $('#btnRedo').disabled = !this.store.redoStack.length;
  }

  syncView() {
    const mode = this.store.viewMode;
    document.querySelectorAll('#viewToggle .tb-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.view === mode);
    });
    const vp = $('#viewport');
    vp.dataset.mode = mode;
    $('#threeDControls').style.display = mode === '2d' ? 'none' : '';
    requestAnimationFrame(() => {
      this.editor.resize();
      this.viewer.resize();
    });
    this.updateHint();
  }

  // ============================ CATALOG =====================================

  buildCatalog() {
    const store = this.store;
    const panel = $('#catalog');
    panel.innerHTML = `
      <div class="panel-head">
        <span>Catalog</span>
        <button class="tb-btn close-drawer" data-close="catalog">${ICONS.close}</button>
      </div>
      <div class="cat-tabs" id="catTabs"></div>
      <div class="cat-grid" id="catGrid"></div>`;

    const tabs = $('#catTabs');
    for (const c of CATEGORIES) {
      const b = el('button', 'cat-tab', c.name);
      b.dataset.cat = c.id;
      b.onclick = () => {
        this.activeCat = c.id;
        this.renderCatalogGrid();
      };
      tabs.appendChild(b);
    }
    this.renderCatalogGrid();
    void store;
  }

  renderCatalogGrid() {
    const store = this.store;
    document.querySelectorAll('.cat-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.cat === this.activeCat);
    });
    const grid = $('#catGrid');
    grid.innerHTML = '';
    const items = ITEMS.filter(i => i.cat === this.activeCat);
    for (const def of items) {
      const card = el('button', 'cat-card');
      card.innerHTML = `
        <span class="thumb"><img alt="${def.name}" loading="lazy"/></span>
        <span class="cat-card-name">${def.name}</span>
        <span class="cat-card-dims">${def.w} × ${def.d} × ${def.h} cm</span>`;
      card.onclick = () => {
        store.setTool('place', def.id);
        this.closeDrawer('catalog');
        if (store.viewMode === '3d') store.setViewMode('2d');
      };
      grid.appendChild(card);
      const img = card.querySelector('img');
      // render thumbnails asynchronously so the panel opens instantly
      setTimeout(() => { img.src = thumbnail(def.id); }, 0);
    }
  }

  // ============================ PROPERTIES ==================================

  renderPropsSoft() {
    // refresh values without rebuilding inputs while user drags in canvas
    if (this._propsKind !== this.selKind()) this.renderProps();
    else this.fillPropValues();
  }

  selKind() {
    const s = this.store.selection;
    return s ? `${s.kind}:${s.id}` : 'none';
  }

  renderProps() {
    const store = this.store;
    const panel = $('#props');
    const sel = store.selection;
    this._propsKind = this.selKind();
    const head = `
      <div class="panel-head">
        <span id="propsTitle"></span>
        <button class="tb-btn close-drawer" data-close="props">${ICONS.close}</button>
      </div>`;

    if (!sel) {
      panel.innerHTML = `${head}
        <div class="props-body">
          <div class="props-section-title">Project settings</div>
          ${this.numRow('setWallH', 'Wall height', store.project.settings.wallHeight, 'cm')}
          <div class="props-section-title">Default floor</div>
          <div class="mat-grid" id="matDefFloor"></div>
          <div class="props-section-title">Default wall paint</div>
          <div class="mat-grid" id="matDefWall"></div>
          <div class="props-section-title">Exterior finish</div>
          <div class="mat-grid" id="matExtWall"></div>
        </div>`;
      $('#propsTitle').textContent = 'No selection';
      this.bindNum('setWallH', v => {
        store.checkpoint();
        store.project.settings.wallHeight = Math.max(180, Math.min(400, v));
        for (const w of store.project.walls) w.height = store.project.settings.wallHeight;
        store.commit(true);
      });
      this.matGrid('#matDefFloor', 'floor', store.project.settings.defaultFloor, id => {
        store.checkpoint(); store.project.settings.defaultFloor = id; store.commit(true);
      });
      this.matGrid('#matDefWall', 'wall', store.project.settings.defaultWall, id => {
        store.checkpoint(); store.project.settings.defaultWall = id; store.commit(true);
      });
      this.matGrid('#matExtWall', 'wall', store.project.settings.exteriorWall, id => {
        store.checkpoint(); store.project.settings.exteriorWall = id; store.commit(true);
      });
    } else if (sel.kind === 'item') {
      const it = store.item(sel.id);
      if (!it) { store.select(null); return; }
      const def = ITEM_MAP.get(it.defId);
      panel.innerHTML = `${head}
        <div class="props-body">
          <div class="props-grid2">
            ${this.numRow('pW', 'Width', it.w, 'cm')}
            ${this.numRow('pD', 'Depth', it.d, 'cm')}
            ${this.numRow('pH', 'Height', it.h, 'cm')}
            ${this.numRow('pRot', 'Rotation', deg(it.rotation), '°')}
            ${this.numRow('pElev', 'Elevation', Math.round(it.elevation || 0), 'cm')}
          </div>
          ${def?.palettes ? '<div class="props-section-title">Finish</div><div class="chip-row" id="palRow"></div>' : ''}
          <div class="btn-row">
            <button class="action" id="pDup">${icon('copy')} Duplicate</button>
            <button class="action danger" id="pDel">${icon('trash')} Delete</button>
          </div>
        </div>`;
      $('#propsTitle').textContent = def?.name || 'Item';
      const commit = (fn) => { store.checkpoint(); fn(); store.commit(false); };
      this.bindNum('pW', v => commit(() => it.w = Math.max(10, v)));
      this.bindNum('pD', v => commit(() => it.d = Math.max(10, v)));
      this.bindNum('pH', v => commit(() => it.h = Math.max(10, v)));
      this.bindNum('pRot', v => commit(() => it.rotation = v * Math.PI / 180));
      this.bindNum('pElev', v => commit(() => it.elevation = Math.max(0, v)));
      if (def?.palettes) {
        const row = $('#palRow');
        def.palettes.forEach((pal, idx) => {
          const chip = el('button', 'chip' + ((it.palette ?? 0) === idx ? ' active' : ''));
          chip.title = pal.name;
          chip.style.background = pal.chip;
          chip.onclick = () => { commit(() => it.palette = idx); this.renderProps(); };
          row.appendChild(chip);
        });
      }
      $('#pDup').onclick = () => {
        store.checkpoint();
        const copy = { ...it, id: undefined, x: it.x + 40, y: it.y + 40 };
        const created = store.addItem(it.defId, copy.x, copy.y, it.rotation, def);
        Object.assign(created, { w: it.w, d: it.d, h: it.h, elevation: it.elevation, palette: it.palette });
        store.commit(false);
        store.select({ kind: 'item', id: created.id });
      };
      $('#pDel').onclick = () => store.deleteSelection();
    } else if (sel.kind === 'wall') {
      const w = store.wall(sel.id);
      if (!w) { store.select(null); return; }
      panel.innerHTML = `${head}
        <div class="props-body">
          <div class="props-grid2">
            ${this.numRow('pLen', 'Length', Math.round(wallLength(w)), 'cm', true)}
            ${this.numRow('pThick', 'Thickness', w.thickness, 'cm')}
            ${this.numRow('pWH', 'Height', w.height, 'cm')}
          </div>
          <div class="btn-row">
            <button class="action danger" id="pDel">${icon('trash')} Delete wall</button>
          </div>
        </div>`;
      $('#propsTitle').textContent = 'Wall';
      this.bindNum('pThick', v => {
        store.checkpoint(); w.thickness = Math.max(5, Math.min(60, v)); store.commit(true);
      });
      this.bindNum('pWH', v => {
        store.checkpoint(); w.height = Math.max(120, Math.min(400, v)); store.commit(true);
      });
      $('#pDel').onclick = () => store.deleteSelection();
    } else if (sel.kind === 'opening') {
      const o = store.opening(sel.id);
      if (!o) { store.select(null); return; }
      const isWin = o.type === 'window';
      panel.innerHTML = `${head}
        <div class="props-body">
          ${isWin ? '' : `
          <div class="props-section-title">Type</div>
          <div class="seg-row" id="doorType">
            <button data-t="door">Hinged</button>
            <button data-t="doorway">Opening</button>
            <button data-t="slidingDoor">Sliding</button>
          </div>`}
          <div class="props-grid2">
            ${this.numRow('pOW', 'Width', o.width, 'cm')}
            ${this.numRow('pOH', 'Height', o.height, 'cm')}
            ${isWin ? this.numRow('pOS', 'Sill height', o.sill, 'cm') : ''}
          </div>
          ${o.type === 'door' ? `
          <div class="btn-row">
            <button class="action" id="pFlip">${icon('rotate')} Flip side</button>
            <button class="action" id="pSwing">${icon('rotate')} Flip hinge</button>
          </div>` : ''}
          <div class="btn-row">
            <button class="action danger" id="pDel">${icon('trash')} Delete</button>
          </div>
        </div>`;
      $('#propsTitle').textContent = isWin ? 'Window' : 'Door';
      const structural = fn => { store.checkpoint(); fn(); store.commit(true); };
      this.bindNum('pOW', v => structural(() => o.width = Math.max(40, Math.min(300, v))));
      this.bindNum('pOH', v => structural(() => o.height = Math.max(60, Math.min(280, v))));
      if (isWin) this.bindNum('pOS', v => structural(() => o.sill = Math.max(0, Math.min(200, v))));
      if (!isWin) {
        document.querySelectorAll('#doorType button').forEach(b => {
          b.classList.toggle('active', b.dataset.t === o.type);
          b.onclick = () => { structural(() => o.type = b.dataset.t); this.renderProps(); };
        });
      }
      if (o.type === 'door') {
        $('#pFlip').onclick = () => structural(() => o.flip = !o.flip);
        $('#pSwing').onclick = () => structural(() => o.swing = !o.swing);
      }
      $('#pDel').onclick = () => store.deleteSelection();
    } else if (sel.kind === 'room') {
      const room = store.room(sel.id);
      if (!room) { store.select(null); return; }
      const style = store.roomStyle(sel.id);
      panel.innerHTML = `${head}
        <div class="props-body">
          <label class="field"><span>Room name</span>
            <input id="roomName" value="${style.name || ''}" placeholder="e.g. Living room"/>
          </label>
          <div class="props-stat">Area&ensp;<b>${(room.area / 10000).toFixed(2)} m²</b></div>
          <div class="props-section-title">Floor</div>
          <div class="mat-grid" id="matFloor"></div>
          <div class="props-section-title">Walls</div>
          <div class="mat-grid" id="matWall"></div>
        </div>`;
      $('#propsTitle').textContent = style.name || 'Room';
      $('#roomName').addEventListener('change', e => {
        store.checkpoint();
        store.roomStyle(sel.id).name = e.target.value;
        store.commit(false);
        $('#propsTitle').textContent = e.target.value || 'Room';
      });
      this.matGrid('#matFloor', 'floor', style.floor, id => {
        store.checkpoint(); store.roomStyle(sel.id).floor = id; store.commit(true);
      });
      this.matGrid('#matWall', 'wall', style.wall, id => {
        store.checkpoint(); store.roomStyle(sel.id).wall = id; store.commit(true);
      });
    }
    this.updateHint();
  }

  fillPropValues() {
    const store = this.store;
    const sel = store.selection;
    if (sel?.kind === 'item') {
      const it = store.item(sel.id);
      if (!it) return;
      this.setVal('pW', it.w); this.setVal('pD', it.d); this.setVal('pH', it.h);
      this.setVal('pRot', deg(it.rotation));
      this.setVal('pElev', Math.round(it.elevation || 0));
    } else if (sel?.kind === 'wall') {
      const w = store.wall(sel.id);
      if (!w) return;
      this.setVal('pLen', Math.round(wallLength(w)));
    }
  }

  setVal(id, v) {
    const inp = document.getElementById(id);
    if (inp && document.activeElement !== inp) inp.value = v;
  }

  numRow(id, label, value, unit, readonly = false) {
    return `<label class="field"><span>${label}</span>
      <span class="num-wrap"><input id="${id}" type="number" value="${value}" ${readonly ? 'readonly' : ''}/><i>${unit}</i></span>
    </label>`;
  }

  bindNum(id, fn) {
    const inp = document.getElementById(id);
    if (!inp) return;
    inp.addEventListener('change', () => {
      const v = parseFloat(inp.value);
      if (!Number.isNaN(v)) fn(v);
    });
  }

  matGrid(sel, use, current, onPick) {
    const grid = $(sel);
    if (!grid) return;
    for (const m of MATERIALS.filter(m => m.use === use)) {
      const b = el('button', 'mat-swatch' + (m.id === current ? ' active' : ''));
      b.title = m.name;
      b.innerHTML = `<img src="${getMaterialPreview(m.id)}" alt="${m.name}"/><span>${m.name}</span>`;
      b.onclick = () => {
        grid.querySelectorAll('.mat-swatch').forEach(s => s.classList.remove('active'));
        b.classList.add('active');
        onPick(m.id);
      };
      grid.appendChild(b);
    }
  }

  // ============================ STATUS BAR ==================================

  buildStatus() {
    const bar = $('#status');
    bar.innerHTML = `
      <button class="tb-btn drawer-btn" id="btnCatalog">${ICONS.plus}<span>Catalog</span></button>
      <span class="hint-text" id="hintText"></span>
      <span class="coords" id="coords"></span>
      <button class="tb-btn" id="btnFit" title="Fit plan to screen">${ICONS.fit}</button>
      <button class="tb-btn drawer-btn" id="btnProps">${ICONS.sliders}<span>Details</span></button>`;
    $('#btnFit').onclick = () => {
      this.editor.fitToContent();
      this.viewer.frameAll();
    };
    $('#btnCatalog').onclick = () => this.toggleDrawer('catalog');
    $('#btnProps').onclick = () => this.toggleDrawer('props');
    document.querySelectorAll('.close-drawer').forEach(b => {
      b.onclick = () => this.closeDrawer(b.dataset.close);
    });
    this.updateHint();
  }

  toggleDrawer(which) {
    $('#' + which).classList.toggle('open');
    const other = which === 'catalog' ? 'props' : 'catalog';
    $('#' + other).classList.remove('open');
    // drawers change layout → re-bind close buttons created after buildStatus
    document.querySelectorAll('.close-drawer').forEach(b => {
      b.onclick = () => this.closeDrawer(b.dataset.close);
    });
  }

  closeDrawer(which) {
    $('#' + which)?.classList.remove('open');
  }

  updateCoords(pos) {
    const c = $('#coords');
    if (c && pos) c.textContent = `${(pos.x / 100).toFixed(2)}, ${(pos.y / 100).toFixed(2)} m`;
  }

  updateHint() {
    const t = $('#hintText');
    if (!t) return;
    const store = this.store;
    if (store.viewMode === '3d' && this.viewer.walkMode) {
      t.textContent = 'Walk mode — WASD / arrows to move, drag to look around';
      return;
    }
    const hints = {
      select: 'Tap to select · drag to move · pinch or scroll to zoom',
      wall: 'Click to place wall points · double-click or Esc to finish',
      room: 'Drag to draw a rectangular room',
      door: 'Click on a wall to place a door',
      window: 'Click on a wall to place a window',
      place: `Tap the plan to place ${ITEM_MAP.get(store.placeDefId)?.name ?? 'item'}`
    };
    t.textContent = hints[store.tool] || '';
  }
}
