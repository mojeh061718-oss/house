// Studio UI shell: slim top bar, left tool rail, catalog & properties
// drawers, floating action cluster, hint pill. Landscape-first, touch-first.
import { ICONS, icon } from './icons.js';
import { thumbnail } from './thumbs.js';
import { CATEGORIES, ITEMS, ITEM_MAP } from '../catalog/items.js';
import { MATERIALS, getMaterialPreview } from '../core/textures.js';
import { wallLength } from '../core/geometry.js';

const $ = sel => document.querySelector(sel);

function el(tag, cls = '', html = '') {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

const deg = rad => Math.round((rad * 180 / Math.PI) % 360);

export class UI {
  constructor(store, editor, viewer, onHome) {
    this.store = store;
    this.editor = editor;
    this.viewer = viewer;
    this.onHome = onHome;
    this.activeCat = 'living';
    this.wide = window.matchMedia('(min-width: 1100px)');
    this._hintTimer = null;

    this.buildToolbar();
    this.buildToolRail();
    this.buildCatalog();
    this.buildFabs();

    store.on('selection', () => { this.renderProps(); this.syncFabs(); });
    store.on('change', () => this.renderPropsSoft());
    store.on('tool', () => { this.syncTools(); this.showHint(); });
    store.on('view', () => this.syncView());
    store.on('history', () => this.syncHistory());
    store.on('projectLoaded', () => {
      const inp = $('#projectName');
      if (inp) inp.value = store.project.name || 'Untitled';
      this.closeDrawer('catalog');
      this.closeDrawer('props');
      this.renderProps();
      this.syncFabs();
      this.showHint();
    });

    this.renderProps();
    this.syncTools();
    this.syncView();
    this.syncHistory();
    this.syncFabs();
  }

  // ============================ TOP BAR =====================================

  buildToolbar() {
    const store = this.store;
    const bar = $('#topbar');
    bar.innerHTML = `
      <button class="tb-btn" id="btnHome" title="Back to projects">${ICONS.logo}</button>
      <input id="projectName" class="project-name" value="${store.project.name || 'Untitled'}" spellcheck="false" aria-label="Project name"/>
      <button class="tb-btn" id="btnUndo" title="Undo">${ICONS.undo}</button>
      <button class="tb-btn" id="btnRedo" title="Redo">${ICONS.redo}</button>
      <div class="tb-spacer"></div>
      <div class="view-toggle" id="viewToggle">
        <button class="tb-btn" data-view="2d">${ICONS.d2}<span>Plan</span></button>
        <button class="tb-btn" data-view="3d">${ICONS.d3}<span>3D</span></button>
        <button class="tb-btn only-wide" data-view="split">${ICONS.split}<span>Split</span></button>
      </div>
      <span id="threeDControls">
        <button class="tb-btn" id="btnWalk" title="First-person walk">${ICONS.walk}</button>
        <button class="tb-btn" id="btnCeil" title="Toggle ceilings">${ICONS.ceiling}</button>
      </span>
      <button class="tb-btn only-wide" id="btnShot" title="Save 3D snapshot">${ICONS.camera}</button>
      <button class="tb-btn" id="btnMenu" title="Project menu">${ICONS.menu}</button>
      <div class="menu hidden" id="fileMenu">
        <button id="mHome">${icon('logo')} Back to projects</button>
        <button id="mRename">${icon('file')} Rename project</button>
        <button id="mShot">${icon('camera')} 3D snapshot (PNG)</button>
        <button id="mSave">${icon('download')} Download project file</button>
        <button id="mOpen">${icon('open')} Open project file</button>
      </div>`;

    $('#btnHome').onclick = () => this.onHome();
    $('#mHome').onclick = () => this.onHome();
    $('#projectName').addEventListener('change', e => {
      store.project.name = e.target.value;
      store.scheduleAutosave();
    });
    $('#btnUndo').onclick = () => store.undo();
    $('#btnRedo').onclick = () => store.redo();
    bar.querySelectorAll('#viewToggle .tb-btn').forEach(b => {
      b.onclick = () => store.setViewMode(b.dataset.view);
    });
    $('#btnWalk').onclick = () => {
      this.viewer.setWalkMode(!this.viewer.walkMode);
      $('#btnWalk').classList.toggle('active', this.viewer.walkMode);
      if (this.viewer.walkMode && store.viewMode === '2d') store.setViewMode('3d');
      this.showHint();
    };
    $('#btnCeil').onclick = () => {
      this.viewer.setCeilings(!this.viewer.showCeilings);
      $('#btnCeil').classList.toggle('active', this.viewer.showCeilings);
    };
    const shoot = () => {
      const a = document.createElement('a');
      a.href = this.viewer.snapshot();
      a.download = `${store.project.name || 'design'}.png`;
      a.click();
    };
    $('#btnShot').onclick = shoot;
    $('#mShot').onclick = shoot;
    $('#mRename').onclick = () => {
      const name = prompt('Project name', store.project.name || '');
      if (name) {
        store.project.name = name;
        const inp = $('#projectName');
        if (inp) inp.value = name;
        store.scheduleAutosave();
      }
    };

    const menu = $('#fileMenu');
    $('#btnMenu').onclick = e => {
      e.stopPropagation();
      menu.classList.toggle('hidden');
    };
    document.addEventListener('pointerdown', (e) => {
      if (!menu.classList.contains('hidden') && !menu.contains(e.target) && e.target.closest('#btnMenu') === null) {
        menu.classList.add('hidden');
      }
    });
    $('#mSave').onclick = () => {
      const blob = new Blob([store.exportJSON()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${(store.project.name || 'project').replace(/[^\w\- ]+/g, '')}.homestudio.json`;
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
            store.loadProject(data, store.currentProjectId);
          } catch {
            alert('This file is not a valid Home Studio project.');
          }
        });
      };
      input.click();
    };
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
    $('#viewport').dataset.mode = mode;
    $('#threeDControls').style.display = mode === '2d' ? 'none' : '';
    $('#toolrail').style.display = mode === '3d' ? 'none' : '';
    requestAnimationFrame(() => {
      this.editor.resize();
      this.viewer.resize();
    });
    this.showHint();
  }

  // ============================ TOOL RAIL ===================================

  buildToolRail() {
    const store = this.store;
    const rail = $('#toolrail');
    rail.innerHTML = `
      <button class="rail-btn tool" data-tool="select" title="Select & move">${ICONS.select}</button>
      <button class="rail-btn tool" data-tool="wall" title="Draw walls">${ICONS.wall}</button>
      <button class="rail-btn tool" data-tool="room" title="Draw a room">${ICONS.room}</button>
      <button class="rail-btn tool" data-tool="door" title="Add a door">${ICONS.door}</button>
      <button class="rail-btn tool" data-tool="window" title="Add a window">${ICONS.window}</button>
      <span class="rail-spacer"></span>
      <button class="rail-btn" id="btnFit" title="Fit to screen">${ICONS.fit}</button>`;
    rail.querySelectorAll('.tool').forEach(b => {
      b.onclick = () => store.setTool(b.dataset.tool === store.tool ? 'select' : b.dataset.tool);
    });
    $('#btnFit').onclick = () => {
      this.editor.fitToContent();
      this.viewer.frameAll();
    };
  }

  syncTools() {
    document.querySelectorAll('#toolrail .tool').forEach(b => {
      b.classList.toggle('active', b.dataset.tool === this.store.tool);
    });
  }

  // ============================ FABS ========================================

  buildFabs() {
    const store = this.store;
    const c = $('#fabCluster');
    c.innerHTML = `
      <div class="sel-actions hidden" id="selActions">
        <button class="fab mini" id="selRotL" title="Rotate left">${ICONS.rotate}</button>
        <button class="fab mini flip" id="selRotR" title="Rotate right">${ICONS.rotate}</button>
        <button class="fab mini" id="selEdit" title="Edit details">${ICONS.sliders}</button>
        <button class="fab mini danger" id="selDel" title="Delete">${ICONS.trash}</button>
      </div>
      <button class="fab primary" id="fabAdd" title="Add furniture">${ICONS.plus}</button>`;
    $('#fabAdd').onclick = () => this.toggleDrawer('catalog');
    const rotate = (dir) => {
      const sel = store.selection;
      if (sel?.kind !== 'item') return;
      const it = store.item(sel.id);
      store.checkpoint();
      it.rotation += dir * Math.PI / 12;
      store.commit(false);
    };
    $('#selRotL').onclick = () => rotate(-1);
    $('#selRotR').onclick = () => rotate(1);
    $('#selEdit').onclick = () => this.toggleDrawer('props');
    $('#selDel').onclick = () => store.deleteSelection();
  }

  syncFabs() {
    const sel = this.store.selection;
    const actions = $('#selActions');
    actions.classList.toggle('hidden', !sel);
    const isItem = sel?.kind === 'item';
    $('#selRotL').style.display = isItem ? '' : 'none';
    $('#selRotR').style.display = isItem ? '' : 'none';
    // wide screens: surface the details drawer automatically
    if (sel && this.wide.matches) $('#props').classList.add('open');
    if (!sel) this.closeDrawer('props');
  }

  // ============================ CATALOG =====================================

  buildCatalog() {
    const panel = $('#catalog');
    panel.innerHTML = `
      <div class="panel-head">
        <span>Add furniture</span>
        <button class="tb-btn" data-close="catalog">${ICONS.close}</button>
      </div>
      <div class="cat-tabs" id="catTabs"></div>
      <div class="cat-grid" id="catGrid"></div>`;
    panel.querySelector('[data-close]').onclick = () => this.closeDrawer('catalog');

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
  }

  renderCatalogGrid() {
    const store = this.store;
    document.querySelectorAll('.cat-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.cat === this.activeCat);
    });
    const grid = $('#catGrid');
    grid.innerHTML = '';
    for (const def of ITEMS.filter(i => i.cat === this.activeCat)) {
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
      setTimeout(() => { img.src = thumbnail(def.id); }, 0);
    }
  }

  // ============================ PROPERTIES ==================================

  renderPropsSoft() {
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
    const head = (title) => `
      <div class="panel-head">
        <span>${title}</span>
        <button class="tb-btn" data-close="props">${ICONS.close}</button>
      </div>`;

    if (!sel) {
      panel.innerHTML = `${head('Project settings')}
        <div class="props-body">
          ${this.numRow('setWallH', 'Wall height', store.project.settings.wallHeight, 'cm')}
          <div class="props-section-title">Default floor</div>
          <div class="mat-grid" id="matDefFloor"></div>
          <div class="props-section-title">Default wall paint</div>
          <div class="mat-grid" id="matDefWall"></div>
          <div class="props-section-title">Exterior finish</div>
          <div class="mat-grid" id="matExtWall"></div>
        </div>`;
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
      panel.innerHTML = `${head(def?.name || 'Item')}
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
        const created = store.addItem(it.defId, it.x + 40, it.y + 40, it.rotation, def);
        Object.assign(created, { w: it.w, d: it.d, h: it.h, elevation: it.elevation, palette: it.palette });
        store.commit(false);
        store.select({ kind: 'item', id: created.id });
      };
      $('#pDel').onclick = () => store.deleteSelection();
    } else if (sel.kind === 'wall') {
      const w = store.wall(sel.id);
      if (!w) { store.select(null); return; }
      panel.innerHTML = `${head('Wall')}
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
      panel.innerHTML = `${head(isWin ? 'Window' : 'Door')}
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
      panel.innerHTML = `${head(style.name || 'Room')}
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
      $('#roomName').addEventListener('change', e => {
        store.checkpoint();
        store.roomStyle(sel.id).name = e.target.value;
        store.commit(false);
      });
      this.matGrid('#matFloor', 'floor', style.floor, id => {
        store.checkpoint(); store.roomStyle(sel.id).floor = id; store.commit(true);
      });
      this.matGrid('#matWall', 'wall', style.wall, id => {
        store.checkpoint(); store.roomStyle(sel.id).wall = id; store.commit(true);
      });
    }
    const closeBtn = panel.querySelector('[data-close]');
    if (closeBtn) closeBtn.onclick = () => this.closeDrawer('props');
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

  // ============================ DRAWERS & HINTS =============================

  toggleDrawer(which) {
    const d = $('#' + which);
    const willOpen = !d.classList.contains('open');
    this.closeDrawer('catalog');
    this.closeDrawer('props');
    if (willOpen) d.classList.add('open');
  }

  closeDrawer(which) {
    $('#' + which)?.classList.remove('open');
  }

  showHint() {
    const pill = $('#hintPill');
    if (!pill) return;
    const store = this.store;
    let text;
    if (store.viewMode === '3d' && this.viewer.walkMode) {
      text = 'Walk mode — drag to look around · WASD / arrows to move';
    } else if (store.viewMode === '3d') {
      text = 'Drag to orbit · pinch to zoom · tap furniture to select & move it';
    } else {
      const hints = {
        select: store.project.walls.length
          ? 'Tap to select · drag to move · pinch to zoom'
          : 'Start with the Wall or Room tool on the left',
        wall: 'Tap to place wall points · double-tap or Esc to finish',
        room: 'Drag to draw a rectangular room',
        door: 'Tap a wall to place a door',
        window: 'Tap a wall to place a window',
        place: `Tap the plan to place ${ITEM_MAP.get(store.placeDefId)?.name ?? 'the item'}`
      };
      text = hints[store.tool] || '';
    }
    pill.textContent = text;
    pill.classList.remove('hidden', 'fade');
    clearTimeout(this._hintTimer);
    this._hintTimer = setTimeout(() => pill.classList.add('fade'), 4200);
  }
}
