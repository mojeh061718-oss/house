// Central application state: project data, selection, tools, undo/redo, persistence.
import { detectRooms, roomKey, uid } from './geometry.js';
import { saveProject } from './projects.js';

export const DEFAULTS = {
  wallHeight: 260,      // cm
  wallThickness: 12,    // cm
  exteriorThickness: 20,
  doorWidth: 90,
  doorHeight: 205,
  windowWidth: 120,
  windowHeight: 130,
  windowSill: 90
};

export function emptyProject(name = 'Untitled project') {
  return {
    version: 1,
    name,
    walls: [],       // {id, ax, ay, bx, by, thickness, height}
    openings: [],    // {id, wallId, type, t, width, height, sill, flip, swing}
    items: [],       // {id, defId, x, y, rotation, w, d, h, elevation, palette}
    roomStyles: {},  // roomKey -> {name, floor, wall, ceiling}
    settings: {
      wallHeight: DEFAULTS.wallHeight,
      defaultFloor: 'oak',
      defaultWall: 'paint_warmwhite',
      exteriorWall: 'plaster_light',
      groundType: 'grass',
      timeOfDay: 13
    }
  };
}

export class Store {
  constructor() {
    this.project = emptyProject();
    this.currentProjectId = null;
    this.rooms = [];
    this.selection = null;     // {kind:'item'|'wall'|'opening'|'room', id}
    this.tool = 'select';      // select | wall | room | door | window | place | paint
    this.placeDefId = null;    // catalog item being placed
    this.viewMode = '2d';      // 2d | 3d | split
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = new Map();
    this._dirtyTimer = null;
  }

  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(fn);
    return () => this.listeners.get(event).delete(fn);
  }

  emit(event, payload) {
    const set = this.listeners.get(event);
    if (set) for (const fn of set) fn(payload);
  }

  // ---- mutation lifecycle -------------------------------------------------

  /** Take an undo snapshot before a mutation (call once per user gesture). */
  checkpoint() {
    this.undoStack.push(JSON.stringify(this.project));
    if (this.undoStack.length > 100) this.undoStack.shift();
    this.redoStack.length = 0;
    this.emit('history');
  }

  /** Notify listeners that project data changed. structural=walls/openings changed. */
  commit(structural = true) {
    if (structural) this.refreshRooms();
    this.emit('change', { structural });
    this.scheduleAutosave();
  }

  refreshRooms() {
    const old = this.rooms || [];
    this.rooms = detectRooms(this.project.walls);
    for (const r of this.rooms) r.key = roomKey(r);
    // room keys derive from centroids; when geometry edits move a centroid,
    // carry the room's name/materials over to its nearest successor
    const styles = this.project.roomStyles;
    const liveKeys = new Set(this.rooms.map(r => r.key));
    for (const r of this.rooms) {
      if (styles[r.key]) continue;
      let best = null, bestD = 300; // cm
      for (const o of old) {
        if (o.key === r.key || !styles[o.key] || liveKeys.has(o.key)) continue;
        const d = Math.hypot(o.centroid.x - r.centroid.x, o.centroid.y - r.centroid.y);
        if (d < bestD) { bestD = d; best = o; }
      }
      if (best) {
        styles[r.key] = styles[best.key];
        delete styles[best.key];
      }
    }
  }

  undo() {
    if (!this.undoStack.length) return;
    this.redoStack.push(JSON.stringify(this.project));
    this.project = JSON.parse(this.undoStack.pop());
    this.selection = null;
    this.commit(true);
    this.emit('selection');
    this.emit('history');
  }

  redo() {
    if (!this.redoStack.length) return;
    this.undoStack.push(JSON.stringify(this.project));
    this.project = JSON.parse(this.redoStack.pop());
    this.selection = null;
    this.commit(true);
    this.emit('selection');
    this.emit('history');
  }

  // ---- selection & tools --------------------------------------------------

  select(sel) {
    this.selection = sel;
    this.emit('selection');
  }

  setTool(tool, placeDefId = null) {
    this.tool = tool;
    this.placeDefId = placeDefId;
    if (tool !== 'select') this.select(null);
    this.emit('tool');
  }

  setViewMode(mode) {
    this.viewMode = mode;
    this.emit('view');
  }

  // ---- entity accessors ---------------------------------------------------

  wall(id) { return this.project.walls.find(w => w.id === id); }
  opening(id) { return this.project.openings.find(o => o.id === id); }
  item(id) { return this.project.items.find(i => i.id === id); }
  room(key) { return this.rooms.find(r => r.key === key); }

  roomStyle(key) {
    let s = this.project.roomStyles[key];
    if (!s) {
      s = {
        name: '',
        floor: this.project.settings.defaultFloor,
        wall: this.project.settings.defaultWall
      };
      this.project.roomStyles[key] = s;
    }
    return s;
  }

  addWall(ax, ay, bx, by, thickness) {
    const w = {
      id: uid('w'), ax, ay, bx, by,
      thickness: thickness ?? DEFAULTS.wallThickness,
      height: this.project.settings.wallHeight
    };
    this.project.walls.push(w);
    return w;
  }

  addOpening(wallId, type, t, opts = {}) {
    const isDoor = type === 'door' || type === 'doorway' || type === 'slidingDoor';
    const o = {
      id: uid('o'), wallId, type, t,
      width: opts.width ?? (isDoor ? DEFAULTS.doorWidth : DEFAULTS.windowWidth),
      height: opts.height ?? (isDoor ? DEFAULTS.doorHeight : DEFAULTS.windowHeight),
      sill: isDoor ? 0 : (opts.sill ?? DEFAULTS.windowSill),
      flip: false,
      swing: false
    };
    this.project.openings.push(o);
    return o;
  }

  addItem(defId, x, y, rotation, def) {
    const it = {
      id: uid('i'), defId, x, y, rotation,
      w: def.w, d: def.d, h: def.h,
      elevation: def.elevation ?? 0,
      palette: def.palettes ? 0 : undefined
    };
    this.project.items.push(it);
    return it;
  }

  deleteSelection() {
    const sel = this.selection;
    if (!sel) return false;
    this.checkpoint();
    const p = this.project;
    if (sel.kind === 'item') {
      p.items = p.items.filter(i => i.id !== sel.id);
    } else if (sel.kind === 'opening') {
      p.openings = p.openings.filter(o => o.id !== sel.id);
    } else if (sel.kind === 'wall') {
      p.walls = p.walls.filter(w => w.id !== sel.id);
      p.openings = p.openings.filter(o => o.wallId !== sel.id);
    } else {
      return false;
    }
    this.select(null);
    this.commit(true);
    return true;
  }

  // ---- persistence ---------------------------------------------------------

  scheduleAutosave() {
    clearTimeout(this._dirtyTimer);
    this._dirtyTimer = setTimeout(() => this.saveNow(), 800);
  }

  saveNow() {
    clearTimeout(this._dirtyTimer);
    if (this.currentProjectId) {
      saveProject(this.currentProjectId, this.project);
    }
  }

  loadProject(data, projectId = null) {
    this.currentProjectId = projectId;
    const base = emptyProject();
    this.project = { ...base, ...data, settings: { ...base.settings, ...data.settings } };
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.selection = null;
    this.commit(true);
    this.emit('selection');
    this.emit('history');
    this.emit('projectLoaded');
  }

  exportJSON() {
    return JSON.stringify(this.project, null, 2);
  }
}
