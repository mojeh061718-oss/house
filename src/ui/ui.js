// Studio UI shell: slim top bar, left tool rail, catalog & properties
// drawers, floating action cluster, hint pill. Landscape-first, touch-first.
import { ICONS, icon } from './icons.js';
import { thumbnail } from './thumbs.js';
import pkg from '../../package.json';
import { CATEGORIES, ITEMS, ITEM_MAP } from '../catalog/items.js';
import { MATERIALS, getMaterialPreview, watchTextures, ensureTexture } from '../core/textures.js';
import { wallLength, wallAngle, pointInPolygon } from '../core/geometry.js';
import { fmtFtIn, fmtArea, parseFtIn } from '../core/units.js';
import { THEMES, applyTheme } from '../core/themes.js';
import { FURNISH_TYPES, guessType, furnishRoom } from '../core/autofurnish.js';
import { SHELLS, stampShell, drawShellPreview } from '../core/shells.js';
import { OPENING_TYPES, OPENING_MAP } from '../core/openings.js';
import { autoRoof } from '../core/autoroof.js';
import { onRotationChange } from '../core/orientation.js';
import { backupToFile, importBackup, isBackup } from '../core/projects.js';

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

    // compact chrome on short screens (phones, incl. the rotated-portrait
    // mode where CSS media queries see the wrong axis)
    this.syncCompact();
    window.addEventListener('resize', () => this.syncCompact());
    onRotationChange(() => setTimeout(() => this.syncCompact(), 50));

    // photo textures load lazily; refresh any visible swatches on arrival
    watchTextures((matId) => {
      document.querySelectorAll(`.mat-swatch img[data-mat="${matId}"]`).forEach(img => {
        img.src = getMaterialPreview(matId);
      });
    });

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
        <button id="mBackup">${icon('save')} Back up all projects</button>
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
    $('#mBackup').onclick = async () => {
      store.saveNow();
      try {
        if (await backupToFile()) this.toast('All projects backed up');
      } catch {
        this.toast('Backup failed — please try again');
      }
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
            if (isBackup(data)) {
              const n = importBackup(data);
              this.toast(n > 0
                ? `${n} project${n === 1 ? '' : 's'} restored — see Back to projects`
                : 'That backup is already fully on this device');
              return;
            }
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
      const drawTool = ['wall', 'room', 'multi'].includes(b.dataset.tool);
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
      ${tool('door', 'Door', 'Choose a door style & place it')}
      ${tool('window', 'Window', 'Choose a window style & place it')}
      ${tool('multi', 'Multi', 'Select several items at once')}
      <span class="rail-spacer"></span>`;
    rail.querySelectorAll('.tool').forEach(b => {
      b.onclick = () => {
        const t = b.dataset.tool;
        // drawing happens on the plan — jump back when a draw tool is picked in 3D
        if ((t === 'wall' || t === 'room' || t === 'multi') && store.viewMode === '3d') {
          store.setViewMode('2d');
        }
        if (t === 'door' || t === 'window') {
          // second tap on the active tool closes the picker & disarms
          if (store.tool === t && this._typePop) {
            this.closeTypePop();
            store.setTool('select');
            return;
          }
          store.setTool(t); // last-used style stays armed for instant placing
          this.openTypePop(t, b);
          return;
        }
        this.closeTypePop();
        store.setTool(t === store.tool ? 'select' : t);
      };
    });
    // fit-view floats in the viewport's top-right corner, easy to reach
    const fit = el('button', 'view-fit', ICONS.fit);
    fit.id = 'btnFit';
    fit.title = 'Reset & fit the view';
    fit.onclick = () => {
      this.editor.fitToContent();
      this.viewer.frameAll();
    };
    $('#viewport').appendChild(fit);
    document.addEventListener('pointerdown', (e) => {
      if (this._typePop && !this._typePop.contains(e.target) && !e.target.closest('#toolrail')) {
        this.closeTypePop();
      }
    });
  }

  /** Toggle compact chrome when the app's effective height is phone-sized. */
  syncCompact() {
    const app = document.getElementById('app');
    if (app) app.classList.toggle('compact', app.offsetHeight < 500);
  }

  // ---- door / window style picker -----------------------------------------

  openTypePop(kind, btn) {
    this.closeTypePop();
    const store = this.store;
    const pop = el('div', 'type-pop');
    const current = kind === 'door' ? store.doorType : store.windowType;
    for (const t of OPENING_TYPES.filter(t => t.kind === kind)) {
      const card = el('button', 'type-card' + (t.id === current ? ' active' : ''));
      const cv = document.createElement('canvas');
      cv.width = 192; cv.height = 112; // 2x for crisp lines on retina
      card.appendChild(cv);
      const name = el('span', '', t.name);
      card.appendChild(name);
      this.drawOpeningGlyph(cv, t.id);
      card.onclick = () => {
        if (kind === 'door') store.doorType = t.id;
        else store.windowType = t.id;
        this.closeTypePop();
        store.setTool(kind); // re-arm (also refreshes the hint)
        this.showHint();
        this.toast(`${t.name} ${kind} — tap a wall to place it`);
      };
      pop.appendChild(card);
    }
    const rail = $('#toolrail');
    const ws = $('#workspace');
    pop.style.left = rail.offsetLeft + rail.offsetWidth + 8 + 'px';
    // never taller than the workspace — it scrolls instead of clipping
    pop.style.maxHeight = ws.offsetHeight - 16 + 'px';
    ws.appendChild(pop);
    // clamp so the whole popover stays on screen (phones are short)
    const desired = rail.offsetTop + btn.offsetTop - 30;
    pop.style.top = Math.max(8, Math.min(desired, ws.offsetHeight - pop.offsetHeight - 8)) + 'px';
    this._typePop = pop;
  }

  closeTypePop() {
    if (this._typePop) {
      this._typePop.remove();
      this._typePop = null;
    }
  }

  /** Small architectural plan glyph for an opening type (picker cards). */
  drawOpeningGlyph(cv, typeId) {
    const g = cv.getContext('2d');
    // canvas is 2x the CSS size; draw in 96x56 logical space
    const W = cv.width / 2, H = cv.height / 2;
    g.setTransform(2, 0, 0, 2, 0, 0);
    const th = 5;                   // wall half-thickness in glyph px
    const cy = H * 0.62;
    const hw = W * 0.3;             // opening half-width
    g.clearRect(0, 0, W, H);
    // wall band with a gap
    g.fillStyle = '#aab3c0';
    g.fillRect(4, cy - th, W / 2 - hw - 4, th * 2);
    g.fillRect(W / 2 + hw, cy - th, W / 2 - hw - 4, th * 2);
    g.strokeStyle = '#dfe5ee';
    g.lineWidth = 1.6;
    const line = (x1, y1, x2, y2) => {
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    };
    const jambs = () => { line(W / 2 - hw, cy - th, W / 2 - hw, cy + th); line(W / 2 + hw, cy - th, W / 2 + hw, cy + th); };
    const arc = (hx, r, a0, a1) => {
      g.beginPath();
      g.setLineDash([3, 3]);
      g.arc(hx, cy - th, r, a0, a1);
      g.stroke();
      g.setLineDash([]);
    };
    const rect = () => { g.strokeRect(W / 2 - hw, cy - th, hw * 2, th * 2); };
    switch (typeId) {
      case 'door':
        jambs();
        line(W / 2 - hw, cy - th, W / 2 - hw, cy - th - hw * 2);
        arc(W / 2 - hw, hw * 2, -Math.PI / 2, 0);
        break;
      case 'double_door':
      case 'french_door':
        jambs();
        line(W / 2 - hw, cy - th, W / 2 - hw, cy - th - hw);
        line(W / 2 + hw, cy - th, W / 2 + hw, cy - th - hw);
        arc(W / 2 - hw, hw, -Math.PI / 2, 0);
        arc(W / 2 + hw, hw, Math.PI, Math.PI * 1.5);
        if (typeId === 'french_door') {
          g.fillStyle = 'rgba(150,200,230,0.5)';
          g.fillRect(W / 2 - hw + 2, cy - 2, hw * 2 - 4, 4);
        }
        break;
      case 'slidingDoor':
        rect();
        line(W / 2 - hw, cy - 2, W / 2 + hw * 0.15, cy - 2);
        line(W / 2 - hw * 0.15, cy + 2, W / 2 + hw, cy + 2);
        break;
      case 'pocket_door':
        jambs();
        line(W / 2 - hw, cy, W / 2, cy);
        g.setLineDash([3, 3]);
        line(W / 2 - hw, cy, W / 2 - hw * 1.9, cy);
        g.setLineDash([]);
        break;
      case 'doorway':
        g.setLineDash([3, 3]);
        jambs();
        g.setLineDash([]);
        break;
      case 'garage_door':
        rect();
        for (let i = 1; i < 4; i++) line(W / 2 - hw + (hw / 2) * i, cy - th, W / 2 - hw + (hw / 2) * i, cy + th);
        break;
      case 'window_picture':
        rect();
        g.fillStyle = 'rgba(150,200,230,0.5)';
        g.fillRect(W / 2 - hw + 2, cy - 2, hw * 2 - 4, 4);
        break;
      case 'window_sliding':
        rect();
        line(W / 2 - hw, cy - 2, W / 2 + hw * 0.15, cy - 2);
        line(W / 2 - hw * 0.15, cy + 2, W / 2 + hw, cy + 2);
        break;
      case 'window_casement':
        rect();
        line(W / 2 - hw, cy - th, W / 2 - hw + hw * 1.4, cy - th - hw * 1.2);
        arc(W / 2 - hw, hw * 1.8, -Math.PI / 2.6, 0);
        break;
      case 'window_bay':
        rect();
        line(W / 2 - hw, cy - th, W / 2 - hw * 0.5, cy - th - 9);
        line(W / 2 - hw * 0.5, cy - th - 9, W / 2 + hw * 0.5, cy - th - 9);
        line(W / 2 + hw * 0.5, cy - th - 9, W / 2 + hw, cy - th);
        break;
      default: // standard window
        rect();
        line(W / 2 - hw, cy, W / 2 + hw, cy);
    }
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
        <button class="fab mini" id="selLock" title="Lock in place">${ICONS.lock}<span>Lock</span></button>
        <button class="fab mini" id="selDup" title="Duplicate">${ICONS.copy}<span>Copy</span></button>
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
      if (it.locked) { this.toast('Locked — tap the padlock to unlock'); return; }
      store.checkpoint();
      fn(it);
      store.commit(false);
    };
    $('#selLock').onclick = () => this.toggleLock();
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
    $('#selDup').onclick = () => this.duplicateSelection();
    $('#selEdit').onclick = () => this.toggleDrawer('props');
    $('#selDel').onclick = () => {
      if (!store.deleteSelection() && this.selectionLocked()) {
        this.toast('Locked — tap the padlock to unlock');
      }
    };
  }

  /** Is the current selection a locked item (or all-locked group)? */
  selectionLocked() {
    const store = this.store;
    const sel = store.selection;
    if (sel?.kind === 'item') return !!store.item(sel.id)?.locked;
    if (sel?.kind === 'multi') return sel.ids.every(id => store.item(id)?.locked);
    return false;
  }

  /** Toggle the padlock on the selected item or group. */
  toggleLock() {
    const store = this.store;
    const sel = store.selection;
    if (sel?.kind === 'item') {
      const it = store.item(sel.id);
      if (!it) return;
      store.checkpoint();
      it.locked = !it.locked;
      store.commit(false);
      this.syncFabs();
      this.toast(it.locked ? 'Locked in place' : 'Unlocked');
    } else if (sel?.kind === 'multi') {
      const items = sel.ids.map(id => store.item(id)).filter(Boolean);
      if (!items.length) return;
      const lock = items.some(i => !i.locked); // any loose → lock all
      store.checkpoint();
      for (const i of items) i.locked = lock;
      store.commit(false);
      this.syncFabs();
      this.toast(lock ? `${items.length} items locked` : `${items.length} items unlocked`);
    }
  }

  /** Duplicate the current selection: item, room, multi group, opening or wall. */
  duplicateSelection() {
    const store = this.store;
    const sel = store.selection;
    if (sel?.kind === 'room') { this.duplicateRoom(sel.id); return; }
    if (sel?.kind === 'opening') {
      const o = store.opening(sel.id);
      const wall = o && store.wall(o.wallId);
      if (!wall) return;
      const len = wallLength(wall);
      if (len < o.width * 2 + 24) { this.toast('No room on this wall for a copy'); return; }
      store.checkpoint();
      // drop the copy next to the original, clamped inside the wall
      const shift = (o.width + 20) / len;
      let t = o.t + shift;
      if (t > 1 - (o.width / 2 + 6) / len) t = o.t - shift;
      const no = store.addOpening(o.wallId, o.type, t, { width: o.width, height: o.height, sill: o.sill });
      no.flip = o.flip;
      no.swing = o.swing;
      store.commit(true);
      store.select({ kind: 'opening', id: no.id });
      this.toast('Duplicated');
      return;
    }
    if (sel?.kind === 'wall') {
      const w = store.wall(sel.id);
      if (!w) return;
      store.checkpoint();
      // parallel copy one meter to the side
      const ang = wallAngle(w);
      const nx = Math.sin(ang) * 100, ny = -Math.cos(ang) * 100;
      const nw = store.addWall(w.ax + nx, w.ay + ny, w.bx + nx, w.by + ny, w.thickness);
      nw.height = w.height;
      store.commit(true);
      store.select({ kind: 'wall', id: nw.id });
      this.toast('Wall duplicated alongside');
      return;
    }
    if (sel?.kind === 'multi') {
      store.checkpoint();
      const ids = [];
      for (const id of sel.ids) {
        const it = store.item(id);
        const def = it && ITEM_MAP.get(it.defId);
        if (def) ids.push(store.cloneItem(it, def).id);
      }
      store.commit(false);
      if (ids.length) store.select({ kind: 'multi', ids });
      this.toast(`${ids.length} item${ids.length === 1 ? '' : 's'} duplicated`);
      return;
    }
    if (sel?.kind !== 'item') return;
    const it = store.item(sel.id);
    const def = ITEM_MAP.get(it.defId);
    store.checkpoint();
    const created = store.cloneItem(it, def);
    store.commit(false);
    store.select({ kind: 'item', id: created.id });
    this.toast('Duplicated');
  }

  syncFabs() {
    const sel = this.store.selection;
    const actions = $('#selActions');
    actions.classList.toggle('hidden', !sel);
    const isItem = sel?.kind === 'item';
    actions.querySelectorAll('.item-only').forEach(b => {
      b.style.display = isItem ? '' : 'none';
    });
    // padlock: items & groups only; icon mirrors the current state
    const lockBtn = $('#selLock');
    const lockable = isItem || sel?.kind === 'multi';
    lockBtn.style.display = lockable ? '' : 'none';
    if (lockable) {
      const locked = this.selectionLocked();
      lockBtn.innerHTML = `${locked ? ICONS.lock : ICONS.unlock}<span>${locked ? 'Locked' : 'Lock'}</span>`;
      lockBtn.classList.toggle('locked', locked);
    }
    // Copy sits next to Edit and Delete for everything selectable
    $('#selDup').style.display = sel ? '' : 'none';
    // wide screens: surface the details drawer automatically
    if (sel && this.wide.matches) {
      $('#props').classList.add('open');
      this.loadSwatchTextures('props');
    }
    if (!sel) this.closeDrawer('props');
  }

  // ============================ FLOORS ======================================

  buildLevelBar() {
    const bar = document.createElement('div');
    bar.id = 'levelBar';
    // lives in the top bar right beside the Plan/3D toggle
    $('#viewToggle').after(bar);
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
    if (n > 1) {
      html += `<button class="lvl-btn lvl-all${this.viewer.viewAll ? ' active' : ''}" id="lvlAll"
        title="Show the whole house in 3D">All</button>`;
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
    const all = $('#lvlAll');
    if (all) all.onclick = () => {
      this.viewer.setViewAll(!this.viewer.viewAll);
      this.syncLevels();
      this.toast(this.viewer.viewAll
        ? 'Showing the whole house — floors above stay visible'
        : 'Showing floors up to the one you are on');
    };
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
    for (const c of [{ id: 'all', name: 'All' }, { id: 'shells', name: 'Home Shells' }, ...CATEGORIES]) {
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
    if (this.activeCat === 'shells') {
      for (const shell of SHELLS) {
        const card = el('button', 'cat-card shell-card');
        card.innerHTML = `
          <span class="thumb"><canvas></canvas></span>
          <span class="cat-card-name">${shell.name}</span>
          <span class="cat-card-dims">${fmtFtIn(shell.size[0])} × ${fmtFtIn(shell.size[1])}</span>
          <span class="shell-desc">${shell.desc}</span>`;
        drawShellPreview(card.querySelector('canvas'), shell);
        card.onclick = () => this.addShell(shell);
        grid.appendChild(card);
      }
      return;
    }
    for (const def of ITEMS.filter(i => !i.hidden && (this.activeCat === 'all' || i.cat === this.activeCat))) {
      const card = el('button', 'cat-card');
      card.innerHTML = `
        <span class="thumb"><img alt="${def.name}" loading="lazy"/></span>
        <span class="cat-card-name">${def.name}</span>
        <span class="cat-card-dims">${fmtFtIn(def.w)} × ${fmtFtIn(def.d)} × ${fmtFtIn(def.h)}</span>`;
      card.onclick = () => {
        this.closeDrawer('catalog');
        // roofs fit themselves to the house — no hand-sizing
        if (def.autoFit && def.plan?.type === 'roof') {
          const roof = autoRoof(store, def.id);
          if (roof) {
            if (store.viewMode === '2d') store.setViewMode('3d');
            this.viewer.frameAll();
            this.toast(`${def.name} fitted over the whole house`);
            return;
          }
          // no walls yet — fall through to normal placement
        }
        // build mode: in 3D with a room chosen, drop it right in that room
        // and fly the camera to a working close-up — but paths and area
        // surfaces are always drawn with the finger, never auto-dropped
        if (store.viewMode === '3d' && !def.path && !def.areaDraw) {
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

  /** Stamp a preset home shell into a clear area of the plan. */
  addShell(shell) {
    const store = this.store;
    let ox = 100, oy = 100;
    const { walls, items } = store.project;
    if (walls.length || items.length) {
      let maxX = -1e9, minY = 1e9;
      for (const w of walls) { maxX = Math.max(maxX, w.ax, w.bx); minY = Math.min(minY, w.ay, w.by); }
      for (const it of items) { maxX = Math.max(maxX, it.x + (it.w || 0) / 2); minY = Math.min(minY, it.y - (it.d || 0) / 2); }
      ox = maxX + 400;
      oy = Math.max(minY, 0);
    }
    stampShell(store, shell, ox, oy);
    this.closeDrawer('catalog');
    store.setTool('select');
    if (shell.build2) this.viewer.setViewAll(true); // show both storeys in 3D
    if (store.viewMode !== '2d') store.setViewMode('2d');
    this.editor.fitToContent();
    this.syncLevels();
    this.toast(`${shell.name} added — every wall and room is editable`);
  }

  /** Duplicate a room: its walls, openings, furniture and style, offset right. */
  duplicateRoom(key) {
    const store = this.store;
    const room = store.room(key);
    if (!room) return;
    let minX = 1e9, maxX = -1e9;
    for (const p of room.polygon) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); }
    const dx = maxX - minX + 30, dy = 0;
    const poly = room.polygon;
    const onBoundary = (x, y) => {
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length];
        const t = Math.max(0, Math.min(1,
          ((x - a.x) * (b.x - a.x) + (y - a.y) * (b.y - a.y)) /
          Math.max((b.x - a.x) ** 2 + (b.y - a.y) ** 2, 1e-6)));
        const px = a.x + (b.x - a.x) * t, py = a.y + (b.y - a.y) * t;
        if (Math.hypot(x - px, y - py) < 3) return true;
      }
      return false;
    };
    store.checkpoint();
    const cloneMap = new Map();
    for (const w of store.project.walls.slice()) {
      const mx = (w.ax + w.bx) / 2, my = (w.ay + w.by) / 2;
      if (onBoundary(mx, my)) {
        const nw = store.addWall(w.ax + dx, w.ay + dy, w.bx + dx, w.by + dy, w.thickness);
        nw.height = w.height;
        cloneMap.set(w.id, nw);
      }
    }
    for (const o of store.project.openings.slice()) {
      if (!cloneMap.has(o.wallId)) continue;
      const no = store.addOpening(cloneMap.get(o.wallId).id, o.type, o.t,
        { width: o.width, height: o.height, sill: o.sill });
      no.flip = o.flip;
      no.swing = o.swing;
    }
    for (const it of store.project.items.slice()) {
      if (!pointInPolygon(it.x, it.y, poly)) continue;
      const def = ITEM_MAP.get(it.defId);
      if (!def) continue;
      store.cloneItem(it, def, dx, dy);
    }
    const oldStyle = store.project.roomStyles[key];
    store.commit(true);
    if (oldStyle) {
      const nr = store.rooms.find(r =>
        Math.abs(r.centroid.x - (room.centroid.x + dx)) < 25 &&
        Math.abs(r.centroid.y - (room.centroid.y + dy)) < 25);
      if (nr) {
        store.project.roomStyles[nr.key] = {
          ...oldStyle,
          name: oldStyle.name ? `${oldStyle.name} copy` : ''
        };
        store.commit(false);
        store.select({ kind: 'room', id: nr.key });
      }
    }
    this.toast('Room duplicated');
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
      const isPath = !!it.path;
      panel.innerHTML = `${head(def?.name || 'Item')}
        <div class="props-body">
          <div class="props-grid2">
            ${isPath ? this.lenRow('pPW', 'Path width', it.pw || def.path.width) : `
            ${this.lenRow('pW', 'Width', it.w)}
            ${this.lenRow('pD', 'Depth', it.d)}
            ${this.lenRow('pH', 'Height', it.h)}
            ${this.numRow('pRot', 'Rotation', deg(it.rotation), '°')}
            ${this.lenRow('pElev', 'Elevation', it.elevation || 0)}`}
          </div>
          ${isPath ? '<div class="props-section-title">Drag the path on the plan to move it. Duplicate to branch it.</div>' : ''}
          ${def?.palettes ? '<div class="props-section-title">Finish</div><div class="chip-row" id="palRow"></div>' : ''}
          <div class="btn-row">
            <button class="action" id="pDup">${icon('copy')} Duplicate</button>
            <button class="action danger" id="pDel">${icon('trash')} Delete</button>
          </div>
        </div>`;
      const commit = (fn) => { store.checkpoint(); fn(); store.commit(false); };
      if (isPath) {
        this.bindLen('pPW', v => commit(() => it.pw = Math.max(30, Math.min(600, Math.round(v)))));
      } else {
        this.bindLen('pW', v => commit(() => it.w = Math.max(10, Math.round(v))));
        this.bindLen('pD', v => commit(() => it.d = Math.max(10, Math.round(v))));
        this.bindLen('pH', v => commit(() => it.h = Math.max(10, Math.round(v))));
        this.bindNum('pRot', v => commit(() => it.rotation = v * Math.PI / 180));
        this.bindLen('pElev', v => commit(() => it.elevation = Math.max(0, Math.round(v))));
      }
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
      $('#pDup').onclick = () => this.duplicateSelection();
      $('#pDel').onclick = () => store.deleteSelection();
    } else if (sel.kind === 'multi') {
      const n = sel.ids.length;
      panel.innerHTML = `${head(`${n} item${n === 1 ? '' : 's'} selected`)}
        <div class="props-body">
          <div class="props-section-title">Drag any selected item to move the whole group.
            With the Multi tool, tap items to add or remove them, or sweep another box.</div>
          <div class="btn-row">
            <button class="action" id="pDup">${icon('copy')} Duplicate all</button>
            <button class="action danger" id="pDel">${icon('trash')} Delete all</button>
          </div>
        </div>`;
      $('#pDup').onclick = () => this.duplicateSelection();
      $('#pDel').onclick = () => store.deleteSelection();
    } else if (sel.kind === 'wall') {
      const w = store.wall(sel.id);
      if (!w) { store.select(null); return; }
      panel.innerHTML = `${head(sel.exterior ? 'Exterior wall' : 'Wall')}
        <div class="props-body">
          <div class="props-grid2">
            ${this.lenRow('pLen', 'Length', wallLength(w), true)}
            ${this.lenRow('pThick', 'Thickness', w.thickness)}
            ${this.lenRow('pWH', 'Height', w.height)}
          </div>
          <div class="props-section-title">Exterior siding — the outside face of this wall</div>
          <div class="mat-grid" id="matWallExt"></div>
          <div class="btn-row">
            <button class="action" id="pExtAll">${icon('paint')} Use on the whole exterior</button>
          </div>
          <div class="btn-row">
            <button class="action" id="pDup">${icon('copy')} Duplicate</button>
            <button class="action danger" id="pDel">${icon('trash')} Delete wall</button>
          </div>
        </div>`;
      this.bindLen('pThick', v => {
        store.checkpoint(); w.thickness = Math.max(5, Math.min(60, Math.round(v))); store.commit(true);
      });
      this.bindLen('pWH', v => {
        store.checkpoint(); w.height = Math.max(120, Math.min(400, Math.round(v))); store.commit(true);
      });
      this.matGrid('#matWallExt', 'wall', w.extMat || store.project.settings.exteriorWall, id => {
        store.checkpoint(); w.extMat = id; store.commit(true);
      }, ['Exterior Siding', 'Plaster & Concrete', 'Brick & Tile']);
      $('#pDup').onclick = () => this.duplicateSelection();
      $('#pExtAll').onclick = () => {
        store.checkpoint();
        store.project.settings.exteriorWall = w.extMat || store.project.settings.exteriorWall;
        for (const wall of store.project.walls) delete wall.extMat;
        store.commit(true);
        this.toast('Whole exterior updated');
        this.renderProps();
      };
      $('#pDel').onclick = () => store.deleteSelection();
    } else if (sel.kind === 'opening') {
      const o = store.opening(sel.id);
      if (!o) { store.select(null); return; }
      const tdef = OPENING_MAP.get(o.type);
      const isWin = tdef ? tdef.kind === 'window' : o.type === 'window';
      const types = OPENING_TYPES.filter(t => t.kind === (isWin ? 'window' : 'door'));
      const hasFlip = ['door', 'double_door', 'french_door', 'window_casement', 'window_bay', 'garage_door'].includes(o.type);
      const hasSwing = ['door', 'window_casement'].includes(o.type);
      panel.innerHTML = `${head(tdef ? `${tdef.name} ${isWin ? 'window' : 'door'}` : (isWin ? 'Window' : 'Door'))}
        <div class="props-body">
          <div class="props-section-title">Style</div>
          <div class="type-row" id="oType">
            ${types.map(t => `<button data-t="${t.id}"${t.id === o.type ? ' class="active"' : ''}>${t.name}</button>`).join('')}
          </div>
          <div class="props-grid2">
            ${this.lenRow('pOW', 'Width', o.width)}
            ${this.lenRow('pOH', 'Height', o.height)}
            ${isWin ? this.lenRow('pOS', 'Sill height', o.sill) : ''}
          </div>
          <div class="props-section-title">Drag the round handles on the plan to resize it in place.</div>
          ${hasFlip || hasSwing ? `
          <div class="btn-row">
            ${hasFlip ? `<button class="action" id="pFlip">${icon('rotate')} Flip side</button>` : ''}
            ${hasSwing ? `<button class="action" id="pSwing">${icon('rotate')} Flip hinge</button>` : ''}
          </div>` : ''}
          <div class="btn-row">
            <button class="action" id="pDup">${icon('copy')} Duplicate</button>
            <button class="action danger" id="pDel">${icon('trash')} Delete</button>
          </div>
        </div>`;
      const structural = fn => { store.checkpoint(); fn(); store.commit(true); };
      this.bindLen('pOW', v => structural(() => o.width = Math.max(40, Math.min(400, Math.round(v)))));
      this.bindLen('pOH', v => structural(() => o.height = Math.max(60, Math.min(280, Math.round(v)))));
      if (isWin) this.bindLen('pOS', v => structural(() => o.sill = Math.max(0, Math.min(200, Math.round(v)))));
      document.querySelectorAll('#oType button').forEach(b => {
        b.onclick = () => {
          structural(() => {
            o.type = b.dataset.t;
            if (isWin && o.type !== 'window' && OPENING_MAP.get(o.type)) {
              o.sill = OPENING_MAP.get(o.type).sill;
            }
          });
          // remember it as the armed style for the next placement too
          if (isWin) store.windowType = o.type;
          else store.doorType = o.type;
          this.renderProps();
        };
      });
      if (hasFlip) $('#pFlip').onclick = () => structural(() => o.flip = !o.flip);
      if (hasSwing) $('#pSwing').onclick = () => structural(() => o.swing = !o.swing);
      $('#pDup').onclick = () => this.duplicateSelection();
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
          <div class="btn-row">
            <button class="action" id="roomDup">${icon('copy')} Duplicate room</button>
          </div>
        </div>`;
      $('#roomDup').onclick = () => this.duplicateRoom(sel.id);
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
    this.loadSwatchTextures('props'); // grids were rebuilt — fetch visible photos
  }

  fillPropValues() {
    const store = this.store;
    const sel = store.selection;
    if (sel?.kind === 'item') {
      const it = store.item(sel.id);
      if (!it) return;
      this.setVal('pW', fmtFtIn(it.w)); this.setVal('pD', fmtFtIn(it.d)); this.setVal('pH', fmtFtIn(it.h));
      this.setVal('pRot', deg(it.rotation));
      this.setVal('pElev', fmtFtIn(it.elevation || 0));
      this.setVal('pPW', it.pw !== undefined ? fmtFtIn(it.pw) : undefined);
    } else if (sel?.kind === 'wall') {
      const w = store.wall(sel.id);
      if (!w) return;
      this.setVal('pLen', fmtFtIn(wallLength(w)));
      this.setVal('pThick', fmtFtIn(w.thickness));
      this.setVal('pWH', fmtFtIn(w.height));
    } else if (sel?.kind === 'opening') {
      const o = store.opening(sel.id);
      if (!o) return;
      this.setVal('pOW', fmtFtIn(o.width));
      this.setVal('pOH', fmtFtIn(o.height));
      this.setVal('pOS', fmtFtIn(o.sill || 0));
    }
  }

  setVal(id, v) {
    if (v === undefined) return;
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

  /** Length row: stored in cm, shown and edited as feet/inches (9'4"). */
  lenRow(id, label, cmValue, readonly = false) {
    return `<label class="field"><span>${label}</span>
      <span class="num-wrap"><input id="${id}" type="text" inputmode="text" autocapitalize="off"
        value="${fmtFtIn(cmValue).replace(/"/g, '&quot;')}" ${readonly ? 'readonly' : ''}/></span>
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

  /** Change handler for length rows: parses 9'4" / 9.5 / 30" → handler gets cm. */
  bindLen(id, fn) {
    const inp = document.getElementById(id);
    if (!inp) return;
    inp.addEventListener('change', () => {
      const cm = parseFtIn(inp.value);
      if (!Number.isNaN(cm) && cm >= 0) fn(cm);
      this.fillPropValues();
    });
  }

  matGrid(sel, use, current, onPick, onlyGroups = null) {
    const grid = $(sel);
    if (!grid) return;
    const list = MATERIALS.filter(m => m.use === use &&
      (!onlyGroups || onlyGroups.includes(m.group || '')));
    const groups = [...new Set(list.map(m => m.group || ''))];
    for (const g of groups) {
      if (g && groups.length > 1) grid.appendChild(el('div', 'mat-group-title', g));
      for (const m of list.filter(m => (m.group || '') === g)) {
        const b = el('button', 'mat-swatch' + (m.id === current ? ' active' : ''));
        b.title = m.name;
        b.innerHTML = `<img src="${getMaterialPreview(m.id)}" data-mat="${m.id}" alt="${m.name}"/><span>${m.name}</span>`;
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
    if (willOpen) {
      d.classList.add('open');
      this.loadSwatchTextures(which);
    }
  }

  /** Photo swatches download lazily — fetch the ones now on screen. */
  loadSwatchTextures(which) {
    const panel = $('#' + which);
    if (!panel?.classList.contains('open')) return;
    panel.querySelectorAll('.mat-swatch img[data-mat]').forEach(img => ensureTexture(img.dataset.mat));
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
      const def = ITEM_MAP.get(store.placeDefId);
      text = def?.path
        ? `Draw on the ground with your finger to lay the ${def.name.toLowerCase()}`
        : def?.areaDraw
          ? `Drag out the ${def.name.toLowerCase()} area on the ground`
          : `${tap} the ground or a floor to place ${def?.name ?? 'the item'}`;
    } else if (store.viewMode === '3d' && (store.tool === 'door' || store.tool === 'window')) {
      text = `${tap} a wall to place the ${store.tool}`;
    } else if (store.viewMode === '3d') {
      text = `Drag to orbit · ${zoom} · ${tap.toLowerCase()} furniture to select & move it`;
    } else {
      const hints = {
        select: store.project.walls.length
          ? `${tap} to select · drag to move · ${zoom}`
          : 'Start with the Wall or Room tool on the left',
        wall: 'Drag to draw a wall · start at the end of another to connect',
        room: 'Drag to draw a rectangular room',
        door: `${tap} a wall to place the door`,
        window: `${tap} a wall to place the window`,
        multi: `Drag a box around items, or ${tap.toLowerCase()} items to add them — then Copy or Delete`,
        place: ITEM_MAP.get(store.placeDefId)?.path
          ? `Drag along the plan to lay the ${ITEM_MAP.get(store.placeDefId).name.toLowerCase()}`
          : ITEM_MAP.get(store.placeDefId)?.areaDraw
            ? `Drag out the ${ITEM_MAP.get(store.placeDefId).name.toLowerCase()} area on the plan`
            : `${tap} the plan to place ${ITEM_MAP.get(store.placeDefId)?.name ?? 'the item'}`
      };
      text = hints[store.tool] || '';
    }
    pill.textContent = text;
    pill.classList.remove('hidden', 'fade');
    clearTimeout(this._hintTimer);
    this._hintTimer = setTimeout(() => pill.classList.add('fade'), 4200);
  }
}
