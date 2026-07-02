// Studio UI shell: slim top bar, left tool rail, catalog & properties
// drawers, floating action cluster, hint pill. Landscape-first, touch-first.
import { ICONS, icon } from './icons.js';
import { thumbnail } from './thumbs.js';
import pkg from '../../package.json';
import { CATEGORIES, ITEMS, ITEM_MAP } from '../catalog/items.js';
import { MATERIALS, getMaterialPreview } from '../core/textures.js';
import { wallLength, pointInPolygon } from '../core/geometry.js';
import { fmtFtIn, fmtArea, inValue, inToCm } from '../core/units.js';
import { THEMES, applyTheme } from '../core/themes.js';
import { FURNISH_TYPES, guessType, furnishRoom } from '../core/autofurnish.js';

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
    this.coarse = window.matchMedia('(pointer: coarse)').matches;
    this._hintTimer = null;

    this.buildToolbar();
    this.buildToolRail();
    this.buildCatalog();
    this.buildFabs();
    this.buildLevelBar();

    store.on('selection', () => {
      if (store.selection?.kind === 'room') this._lastRoomKey = store.selection.id;
      this.renderProps();
      this.syncFabs();
    });
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
      this.syncLevels();
      this.showHint();
    });
    store.on('level', () => this.syncLevels());
    store.on('history', () => this.syncLevels());

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
        <button class="tb-btn" id="btnDay" title="Time of day">${ICONS.sun}<span class="only-wide">Sun</span></button>
        <button class="tb-btn" id="btnWalk" title="First-person walk">${ICONS.walk}<span class="only-wide">Walk</span></button>
        <button class="tb-btn" id="btnCeil" title="Toggle ceilings">${ICONS.ceiling}<span class="only-wide">Roof</span></button>
      </span>
      <button class="tb-btn only-wide" id="btnShot" title="Save 3D snapshot">${ICONS.camera}<span class="only-wide">Photo</span></button>
      <button class="tb-btn" id="btnFull" title="Fullscreen">${ICONS.expand}</button>
      <button class="tb-btn" id="btnMenu" title="Project menu">${ICONS.menu}</button>
      <div class="day-pop hidden" id="dayPop">
        <div class="day-head">${icon('sun')}<span id="dayLabel"></span></div>
        <input type="range" id="daySlider" min="5" max="22" step="0.25" aria-label="Time of day"/>
        <div class="day-scale"><span>Dawn</span><span>Noon</span><span>Dusk</span><span>Night</span></div>
      </div>
      <div class="menu hidden" id="fileMenu">
        <button id="mHome">${icon('logo')} Back to projects</button>
        <button id="mRename">${icon('file')} Rename project</button>
        <button id="mShot">${icon('camera')} 3D snapshot (PNG)</button>
        <button id="mSave">${icon('download')} Download project file</button>
        <button id="mOpen">${icon('open')} Open project file</button>
        <div class="menu-version">Honeycutt Home Studio v${pkg.version}
          <span id="vpDiag"></span></div>
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

    // time-of-day popover
    const dayPop = $('#dayPop');
    const daySlider = $('#daySlider');
    const fmtTime = (t) => {
      const h = Math.floor(t), m = Math.round((t - h) * 60);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hh = ((h + 11) % 12) + 1;
      return `${hh}:${String(m).padStart(2, '0')} ${ampm}`;
    };
    const syncDay = () => {
      const t = store.project.settings.timeOfDay ?? 13;
      daySlider.value = t;
      $('#dayLabel').textContent = fmtTime(t);
    };
    $('#btnDay').onclick = (e) => {
      e.stopPropagation();
      syncDay();
      dayPop.classList.toggle('hidden');
      $('#btnDay').classList.toggle('active', !dayPop.classList.contains('hidden'));
    };
    daySlider.addEventListener('input', () => {
      const t = parseFloat(daySlider.value);
      store.project.settings.timeOfDay = t;
      $('#dayLabel').textContent = fmtTime(t);
      this.viewer.applyTimeOfDay(t);
      store.scheduleAutosave();
    });
    document.addEventListener('pointerdown', (e) => {
      if (!dayPop.classList.contains('hidden') &&
          !dayPop.contains(e.target) && !e.target.closest('#btnDay')) {
        dayPop.classList.add('hidden');
        $('#btnDay').classList.remove('active');
      }
    });

    // fullscreen (supported on iPad/desktop; iOS hides the status bar
    // automatically for installed apps held in landscape)
    const fsRoot = document.documentElement;
    if (fsRoot.requestFullscreen || fsRoot.webkitRequestFullscreen) {
      $('#btnFull').onclick = () => {
        const active = document.fullscreenElement || document.webkitFullscreenElement;
        if (active) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        else (fsRoot.requestFullscreen || fsRoot.webkitRequestFullscreen).call(fsRoot);
      };
    } else {
      $('#btnFull').style.display = 'none';
    }
    const shoot = () => {
      const a = document.createElement('a');
      a.href = this.viewer.snapshot();
      a.download = `${store.project.name || 'design'}.png`;
      a.click();
      this.toast('Snapshot saved as PNG');
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
      // viewport diagnostics: lets us verify sizing on real devices
      const d = $('#vpDiag');
      if (d) {
        const app = document.getElementById('app');
        d.textContent = ` · view ${window.innerWidth}×${window.innerHeight}` +
          ` · screen ${screen.width}×${screen.height}` +
          ` · app ${Math.round(app.offsetWidth)}×${Math.round(app.offsetHeight)}`;
      }
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
            if (!Array.isArray(data.walls) && !Array.isArray(data.levels)) throw new Error('bad file');
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
    // rail stays in 3D too (doors/windows placeable there); drawing tools
    // switch back to the plan where drawing happens
    document.querySelectorAll('#toolrail .tool').forEach(b => {
      const drawTool = b.dataset.tool === 'wall' || b.dataset.tool === 'room';
      b.style.opacity = (mode === '3d' && drawTool) ? 0.45 : '';
    });
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
    const tool = (id, label, title) =>
      `<button class="rail-btn tool" data-tool="${id}" title="${title}">${ICONS[id]}<span>${label}</span></button>`;
    rail.innerHTML = `
      ${tool('select', 'Select', 'Select & move things')}
      ${tool('wall', 'Wall', 'Draw walls point to point')}
      ${tool('room', 'Room', 'Drag out a rectangular room')}
      ${tool('door', 'Door', 'Place a door on a wall')}
      ${tool('window', 'Window', 'Place a window on a wall')}
      <span class="rail-spacer"></span>
      <button class="rail-btn" id="btnFit" title="Fit plan to screen">${ICONS.fit}<span>Fit view</span></button>`;
    rail.querySelectorAll('.tool').forEach(b => {
      b.onclick = () => {
        const t = b.dataset.tool;
        // drawing happens on the plan — jump back when a draw tool is picked in 3D
        if ((t === 'wall' || t === 'room') && store.viewMode === '3d') {
          store.setViewMode('2d');
        }
        store.setTool(t === store.tool ? 'select' : t);
      };
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
        <button class="fab mini item-only" id="selRotL" title="Rotate left 45°">${ICONS.rotate}<span>−45°</span></button>
        <button class="fab mini flip item-only" id="selRotR" title="Rotate right 45°">${ICONS.rotate}<span>+45°</span></button>
        <button class="fab mini item-only" id="selShrink" title="Smaller">${ICONS.minus}<span>Smaller</span></button>
        <button class="fab mini item-only" id="selGrow" title="Bigger">${ICONS.plus}<span>Bigger</span></button>
        <button class="fab mini item-only" id="selDup" title="Duplicate">${ICONS.copy}<span>Copy</span></button>
        <button class="fab mini" id="selEdit" title="Edit details">${ICONS.sliders}<span>Edit</span></button>
        <button class="fab mini danger" id="selDel" title="Delete">${ICONS.trash}<span>Delete</span></button>
      </div>
      <button class="fab primary" id="fabAdd" title="Add furniture">${ICONS.plus}</button>`;
    $('#fabAdd').onclick = () => this.toggleDrawer('catalog');
    const withItem = (fn) => {
      const sel = store.selection;
      if (sel?.kind !== 'item') return;
      const it = store.item(sel.id);
      if (!it) return;
      store.checkpoint();
      fn(it);
      store.commit(false);
    };
    $('#selRotL').onclick = () => withItem(it => it.rotation -= Math.PI / 4);
    $('#selRotR').onclick = () => withItem(it => it.rotation += Math.PI / 4);
    $('#selGrow').onclick = () => withItem(it => {
      it.w = Math.min(2000, Math.round(it.w * 1.1));
      it.d = Math.min(2000, Math.round(it.d * 1.1));
      it.h = Math.min(1000, Math.round(it.h * 1.1));
    });
    $('#selShrink').onclick = () => withItem(it => {
      it.w = Math.max(10, Math.round(it.w / 1.1));
      it.d = Math.max(10, Math.round(it.d / 1.1));
      it.h = Math.max(10, Math.round(it.h / 1.1));
    });
    $('#selDup').onclick = () => {
      const sel = store.selection;
      if (sel?.kind !== 'item') return;
      const it = store.item(sel.id);
      const def = ITEM_MAP.get(it.defId);
      store.checkpoint();
      const created = store.addItem(it.defId, it.x + 40, it.y + 40, it.rotation, def);
      Object.assign(created, { w: it.w, d: it.d, h: it.h, elevation: it.elevation, palette: it.palette });
      store.commit(false);
      store.select({ kind: 'item', id: created.id });
      this.toast('Duplicated');
    };
    $('#selEdit').onclick = () => this.toggleDrawer('props');
    $('#selDel').onclick = () => store.deleteSelection();
  }

  syncFabs() {
    const sel = this.store.selection;
    const actions = $('#selActions');
    actions.classList.toggle('hidden', !sel);
    const isItem = sel?.kind === 'item';
    actions.querySelectorAll('.item-only').forEach(b => {
      b.style.display = isItem ? '' : 'none';
    });
    // wide screens: surface the details drawer automatically
    if (sel && this.wide.matches) $('#props').classList.add('open');
    if (!sel) this.closeDrawer('props');
  }

  // ============================ FLOORS ======================================

  buildLevelBar() {
    const bar = document.createElement('div');
    bar.id = 'levelBar';
    $('#viewport').appendChild(bar);
    this.syncLevels();
  }

  syncLevels() {
    const store = this.store;
    const bar = $('#levelBar');
    if (!bar) return;
    const p = store.project;
    const n = p.levels?.length ?? 1;
    const names = ['G', '1', '2', '3'];
    let html = `<span class="lvl-label">Floor</span>`;
    for (let i = 0; i < n; i++) {
      html += `<button class="lvl-btn${i === p.activeLevel ? ' active' : ''}" data-lvl="${i}"
        title="${i === 0 ? 'Ground floor' : `Floor ${i}`}">${names[i]}</button>`;
    }
    if (n < 4) html += `<button class="lvl-btn lvl-add" id="lvlAdd" title="Add a floor">${ICONS.plus}</button>`;
    bar.innerHTML = html;
    bar.querySelectorAll('[data-lvl]').forEach(b => {
      b.onclick = () => {
        const i = +b.dataset.lvl;
        if (i !== store.project.activeLevel) {
          store.setActiveLevel(i);
          this.toast(i === 0 ? 'Ground floor' : `Floor ${i}`);
        }
      };
    });
    const add = $('#lvlAdd');
    if (add) add.onclick = () => {
      if (store.addLevel()) {
        this.toast(`Floor ${store.project.activeLevel} added — the floor below shows as a gray guide`);
      }
    };
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
    for (const c of [{ id: 'all', name: 'All' }, ...CATEGORIES]) {
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
    for (const def of ITEMS.filter(i => this.activeCat === 'all' || i.cat === this.activeCat)) {
      const card = el('button', 'cat-card');
      card.innerHTML = `
        <span class="thumb"><img alt="${def.name}" loading="lazy"/></span>
        <span class="cat-card-name">${def.name}</span>
        <span class="cat-card-dims">${fmtFtIn(def.w)} × ${fmtFtIn(def.d)} × ${fmtFtIn(def.h)}</span>`;
      card.onclick = () => {
        this.closeDrawer('catalog');
        // build mode: in 3D with a room chosen, drop it right in that room
        // and fly the camera to a working close-up
        if (store.viewMode === '3d') {
          const key = store.selection?.kind === 'room' ? store.selection.id : this._lastRoomKey;
          const room = key && store.room(key);
          if (room && this.viewer.placeInRoom(def.id, room)) {
            this.toast(`${def.name} placed — drag to position`);
            return;
          }
        }
        store.setTool('place', def.id);
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
          ${this.lenRow('setWallH', 'Wall height', store.project.settings.wallHeight)}
          <div class="props-section-title">Style themes — one tap restyles the whole home</div>
          <div class="theme-list" id="themeList"></div>
          <div class="props-section-title">Yard / ground</div>
          <div class="mat-grid" id="matGround"></div>
          <div class="props-section-title">Default floor</div>
          <div class="mat-grid" id="matDefFloor"></div>
          <div class="props-section-title">Default wall paint</div>
          <div class="mat-grid" id="matDefWall"></div>
          <div class="props-section-title">Exterior finish</div>
          <div class="mat-grid" id="matExtWall"></div>
        </div>`;
      this.bindLen('setWallH', v => {
        store.checkpoint();
        store.project.settings.wallHeight = Math.max(180, Math.min(400, v));
        for (const w of store.project.walls) w.height = store.project.settings.wallHeight;
        store.commit(true);
      });
      const tl = $('#themeList');
      for (const th of THEMES) {
        const b = el('button', 'theme-btn',
          `<span class="theme-dots"><i style="background:${th.chips[0]}"></i><i style="background:${th.chips[1]}"></i></span>${th.name}`);
        b.onclick = () => {
          store.checkpoint();
          applyTheme(store.project, th);
          store.commit(true);
          this.toast(`${th.name} theme applied`);
        };
        tl.appendChild(b);
      }
      this.matGrid('#matGround', 'ground', store.project.settings.groundType || 'grass', id => {
        store.checkpoint(); store.project.settings.groundType = id; store.commit(true);
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
            ${this.lenRow('pW', 'Width', it.w)}
            ${this.lenRow('pD', 'Depth', it.d)}
            ${this.lenRow('pH', 'Height', it.h)}
            ${this.numRow('pRot', 'Rotation', deg(it.rotation), '°')}
            ${this.lenRow('pElev', 'Elevation', it.elevation || 0)}
          </div>
          ${def?.palettes ? '<div class="props-section-title">Finish</div><div class="chip-row" id="palRow"></div>' : ''}
          <div class="btn-row">
            <button class="action" id="pDup">${icon('copy')} Duplicate</button>
            <button class="action danger" id="pDel">${icon('trash')} Delete</button>
          </div>
        </div>`;
      const commit = (fn) => { store.checkpoint(); fn(); store.commit(false); };
      this.bindLen('pW', v => commit(() => it.w = Math.max(10, Math.round(v))));
      this.bindLen('pD', v => commit(() => it.d = Math.max(10, Math.round(v))));
      this.bindLen('pH', v => commit(() => it.h = Math.max(10, Math.round(v))));
      this.bindNum('pRot', v => commit(() => it.rotation = v * Math.PI / 180));
      this.bindLen('pElev', v => commit(() => it.elevation = Math.max(0, Math.round(v))));
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
            ${this.lenRow('pLen', 'Length', wallLength(w), true)}
            ${this.lenRow('pThick', 'Thickness', w.thickness)}
            ${this.lenRow('pWH', 'Height', w.height)}
          </div>
          <div class="btn-row">
            <button class="action danger" id="pDel">${icon('trash')} Delete wall</button>
          </div>
        </div>`;
      this.bindLen('pThick', v => {
        store.checkpoint(); w.thickness = Math.max(5, Math.min(60, Math.round(v))); store.commit(true);
      });
      this.bindLen('pWH', v => {
        store.checkpoint(); w.height = Math.max(120, Math.min(400, Math.round(v))); store.commit(true);
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
            ${this.lenRow('pOW', 'Width', o.width)}
            ${this.lenRow('pOH', 'Height', o.height)}
            ${isWin ? this.lenRow('pOS', 'Sill height', o.sill) : ''}
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
      this.bindLen('pOW', v => structural(() => o.width = Math.max(40, Math.min(300, Math.round(v)))));
      this.bindLen('pOH', v => structural(() => o.height = Math.max(60, Math.min(280, Math.round(v)))));
      if (isWin) this.bindLen('pOS', v => structural(() => o.sill = Math.max(0, Math.min(200, Math.round(v)))));
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
      const rect = this.roomRect(room);
      panel.innerHTML = `${head(style.name || 'Room')}
        <div class="props-body">
          <label class="field"><span>Room name</span>
            <input id="roomName" value="${style.name || ''}" placeholder="e.g. Living room"/>
          </label>
          ${rect ? `<div class="props-grid2">
            ${this.lenRow('pRW', 'Width', rect.maxX - rect.minX)}
            ${this.lenRow('pRD', 'Depth', rect.maxY - rect.minY)}
          </div>` : ''}
          <div class="props-stat">Area&ensp;<b>${fmtArea(room.area)}</b></div>
          ${rect ? `<div class="props-section-title">Auto-furnish</div>
          <div class="furnish-row" id="furnishRow"></div>` : ''}
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
      if (rect) {
        const resize = (newW, newD) => {
          store.checkpoint();
          this.resizeRoom(rect, newW, newD);
          store.commit(true);
          // room key may change after resize — reselect by center point
          const cx = rect.minX + newW / 2, cy = rect.minY + newD / 2;
          const r2 = store.rooms.find(r => pointInPolygon(cx, cy, r.polygon));
          if (r2) store.select({ kind: 'room', id: r2.key });
        };
        this.bindLen('pRW', v => resize(Math.max(100, Math.min(3000, Math.round(v))), Math.round(rect.maxY - rect.minY)));
        this.bindLen('pRD', v => resize(Math.round(rect.maxX - rect.minX), Math.max(100, Math.min(3000, Math.round(v)))));
      }
      if (rect) {
        const row = $('#furnishRow');
        const guessed = guessType(style.name);
        for (const ft of FURNISH_TYPES) {
          const b = el('button', 'furnish-btn' + (ft.id === guessed ? ' hinted' : ''), ft.name);
          b.onclick = () => {
            store.checkpoint();
            const n = furnishRoom(store, rect, ft.id);
            if (n > 0) {
              const st = store.roomStyle(sel.id);
              if (!st.name) st.name = ft.name;
              store.commit(false);
              this.toast(`Furnished as ${ft.name} — ${n} items placed`);
            } else {
              store.undoStack.pop();
              this.toast('Room is too small for that layout');
            }
          };
          row.appendChild(b);
        }
      }
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
      this.setVal('pW', inValue(it.w)); this.setVal('pD', inValue(it.d)); this.setVal('pH', inValue(it.h));
      this.setVal('pRot', deg(it.rotation));
      this.setVal('pElev', inValue(it.elevation || 0));
    } else if (sel?.kind === 'wall') {
      const w = store.wall(sel.id);
      if (!w) return;
      this.setVal('pLen', inValue(wallLength(w)));
    }
  }

  setVal(id, v) {
    const inp = document.getElementById(id);
    if (inp && document.activeElement !== inp) inp.value = v;
  }

  /** Axis-aligned bounding rect of a rectangular room, else null. */
  roomRect(room) {
    // collapse collinear vertices (T-junction split points along an edge)
    const raw = room.polygon;
    const poly = [];
    for (let i = 0; i < raw.length; i++) {
      const prev = raw[(i - 1 + raw.length) % raw.length];
      const cur = raw[i];
      const next = raw[(i + 1) % raw.length];
      const cross = (cur.x - prev.x) * (next.y - cur.y) - (cur.y - prev.y) * (next.x - cur.x);
      if (Math.abs(cross) > 1) poly.push(cur);
    }
    if (poly.length !== 4) return null;
    for (let i = 0; i < 4; i++) {
      const a = poly[i], b = poly[(i + 1) % 4];
      if (Math.abs(a.x - b.x) > 1 && Math.abs(a.y - b.y) > 1) return null;
    }
    const xs = poly.map(p => p.x), ys = poly.map(p => p.y);
    return {
      minX: Math.min(...xs), maxX: Math.max(...xs),
      minY: Math.min(...ys), maxY: Math.max(...ys)
    };
  }

  /** Resize a rectangular room by moving wall endpoints on its far edges. */
  resizeRoom(rect, newW, newD) {
    const nx = rect.minX + newW, ny = rect.minY + newD;
    for (const w of this.store.project.walls) {
      for (const end of ['a', 'b']) {
        const x = w[end + 'x'], y = w[end + 'y'];
        const onMaxX = Math.abs(x - rect.maxX) < 1.5 && y > rect.minY - 1.5 && y < rect.maxY + 1.5;
        const onMaxY = Math.abs(y - rect.maxY) < 1.5 && x > rect.minX - 1.5 && x < rect.maxX + 1.5;
        if (onMaxX) w[end + 'x'] = nx;
        if (onMaxY) w[end + 'y'] = ny;
      }
    }
  }

  numRow(id, label, value, unit, readonly = false) {
    return `<label class="field"><span>${label}</span>
      <span class="num-wrap"><input id="${id}" type="number" step="0.5" value="${value}" ${readonly ? 'readonly' : ''}/><i>${unit}</i></span>
    </label>`;
  }

  /** Length row: stored in cm, displayed/edited in inches. */
  lenRow(id, label, cmValue, readonly = false) {
    return this.numRow(id, label, inValue(cmValue), 'in', readonly);
  }

  bindNum(id, fn) {
    const inp = document.getElementById(id);
    if (!inp) return;
    inp.addEventListener('change', () => {
      const v = parseFloat(inp.value);
      if (!Number.isNaN(v)) fn(v);
    });
  }

  /** Change handler for length rows: input inches -> handler gets cm. */
  bindLen(id, fn) {
    this.bindNum(id, v => fn(inToCm(v)));
  }

  matGrid(sel, use, current, onPick) {
    const grid = $(sel);
    if (!grid) return;
    const list = MATERIALS.filter(m => m.use === use);
    const groups = [...new Set(list.map(m => m.group || ''))];
    for (const g of groups) {
      if (g && groups.length > 1) grid.appendChild(el('div', 'mat-group-title', g));
      for (const m of list.filter(m => (m.group || '') === g)) {
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

  toast(msg) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
  }

  showHint() {
    const pill = $('#hintPill');
    if (!pill) return;
    const store = this.store;
    const tap = this.coarse ? 'Tap' : 'Click';
    const zoom = this.coarse ? 'pinch to zoom' : 'scroll to zoom';
    let text;
    if (store.viewMode === '3d' && this.viewer.walkMode) {
      text = this.coarse
        ? 'Walk mode — left side: drag to walk · right side: drag to look'
        : 'Walk mode — WASD / arrows to move · drag to look';
    } else if (store.viewMode === '3d' && store.tool === 'place') {
      text = `${tap} the ground or a floor to place ${ITEM_MAP.get(store.placeDefId)?.name ?? 'the item'}`;
    } else if (store.viewMode === '3d' && (store.tool === 'door' || store.tool === 'window')) {
      text = `${tap} a wall to place a ${store.tool}`;
    } else if (store.viewMode === '3d') {
      text = `Drag to orbit · ${zoom} · ${tap.toLowerCase()} furniture to select & move it`;
    } else {
      const hints = {
        select: store.project.walls.length
          ? `${tap} to select · drag to move · ${zoom}`
          : 'Start with the Wall or Room tool on the left',
        wall: 'Drag to draw a wall · start at the end of another to connect',
        room: 'Drag to draw a rectangular room',
        door: `${tap} a wall to place a door`,
        window: `${tap} a wall to place a window`,
        place: `${tap} the plan to place ${ITEM_MAP.get(store.placeDefId)?.name ?? 'the item'}`
      };
      text = hints[store.tool] || '';
    }
    pill.textContent = text;
    pill.classList.remove('hidden', 'fade');
    clearTimeout(this._hintTimer);
    this._hintTimer = setTimeout(() => pill.classList.add('fade'), 4200);
  }
}
