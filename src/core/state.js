// Central application state: project data, selection, tools, undo/redo, persistence.
import { detectRooms, roomKey, uid, pointInPolygon } from './geometry.js';
import { openingDefaults, isDoorType } from './openings.js';
import { saveProject, saveDraft, clearDraft } from './projects.js';

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

export function emptyLevel() {
  return {
    walls: [],       // {id, ax, ay, bx, by, thickness, height}
    openings: [],    // {id, wallId, type, t, width, height, sill, flip, swing}
    items: [],       // {id, defId, x, y, rotation, w, d, h, elevation, palette}
    roomStyles: {}   // roomKey -> {name, floor, wall}
  };
}

/** Bind the active level's arrays onto the project root so all existing
 *  editor/viewer code keeps reading project.walls etc. unchanged. */
export function bindLevel(project) {
  const lvl = project.levels[project.activeLevel];
  project.walls = lvl.walls;
  project.openings = lvl.openings;
  project.items = lvl.items;
  project.roomStyles = lvl.roomStyles;
  return project;
}

export function emptyProject(name = 'Untitled project') {
  const p = {
    version: 2,
    name,
    activeLevel: 0,
    levels: [emptyLevel()],
    settings: {
      wallHeight: DEFAULTS.wallHeight,
      defaultFloor: 'oak',
      defaultWall: 'paint_warmwhite',
      exteriorWall: 'plaster_light',
      groundType: 'grass',
      timeOfDay: 13
    }
  };
  return bindLevel(p);
}

/** Normalize any saved shape (v1 flat or v2 levels) into a bound v2 project. */
export function hydrateProject(data, base = emptyProject()) {
  const p = {
    ...base,
    name: data.name ?? base.name,
    settings: { ...base.settings, ...data.settings },
    version: 2,
    activeLevel: Math.max(0, Math.min(data.activeLevel ?? 0, (data.levels?.length ?? 1) - 1)),
    levels: data.levels?.length
      ? data.levels.map(l => ({
          walls: l.walls || [], openings: l.openings || [],
          items: l.items || [], roomStyles: l.roomStyles || {}
        }))
      : [{
          walls: data.walls || [], openings: data.openings || [],
          items: data.items || [], roomStyles: data.roomStyles || {}
        }]
  };
  return bindLevel(p);
}

/** Serializable snapshot (drops the bound pointer duplicates). */
export function serializeProject(p) {
  return {
    version: 2,
    name: p.name,
    settings: p.settings,
    activeLevel: p.activeLevel,
    levels: p.levels
  };
}

export class Store {
  constructor() {
    this.project = emptyProject();
    this.currentProjectId = null;
    this.rooms = [];
    this.selection = null;     // {kind:'item'|'wall'|'opening'|'room', id} | {kind:'multi', ids:[]}
    this.tool = 'select';      // select | wall | room | door | window | multi | place | paint
    this.placeDefId = null;    // catalog item being placed
    this.doorType = 'door';    // last-used opening types stay armed
    this.windowType = 'window';
    this.drawShape = 'line';   // path draw mode: line | free | rect | circle
    this.viewMode = '2d';      // 2d | 3d | split
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = new Map();
    this._dirtyTimer = null;
    this._savedJson = null;   // last state written to the project store
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
    this.undoStack.push(JSON.stringify(serializeProject(this.project)));
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
    this.redoStack.push(JSON.stringify(serializeProject(this.project)));
    this.project = hydrateProject(JSON.parse(this.undoStack.pop()));
    this.selection = null;
    this.commit(true);
    this.emit('selection');
    this.emit('history');
  }

  redo() {
    if (!this.redoStack.length) return;
    this.undoStack.push(JSON.stringify(serializeProject(this.project)));
    this.project = hydrateProject(JSON.parse(this.redoStack.pop()));
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
    const def = openingDefaults(type);
    const o = {
      id: uid('o'), wallId, type, t,
      width: opts.width ?? def.width,
      height: opts.height ?? def.height,
      sill: isDoorType(type) ? 0 : (opts.sill ?? def.sill),
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

  /** Clone an item (including a drawn path stroke), offset by (dx, dy). */
  cloneItem(it, def, dx = 40, dy = 40) {
    const created = this.addItem(it.defId, it.x + dx, it.y + dy, it.rotation, def);
    Object.assign(created, { w: it.w, d: it.d, h: it.h, elevation: it.elevation, palette: it.palette });
    if (it.path) {
      created.path = it.path.map(p => ({ x: p.x + dx, y: p.y + dy }));
      created.pw = it.pw;
    }
    return created;
  }

  deleteSelection() {
    const sel = this.selection;
    if (!sel) return false;
    const p = this.project;
    const room = sel.kind === 'room' ? this.room(sel.id) : null;
    if (sel.kind === 'room' && !room) return false;
    if (!['item', 'multi', 'opening', 'wall', 'room'].includes(sel.kind)) return false;
    this.checkpoint();
    const cut = (arr, pred) => {
      for (let i = arr.length - 1; i >= 0; i--) if (pred(arr[i])) arr.splice(i, 1);
    };
    if (sel.kind === 'item') {
      const it = this.item(sel.id);
      if (it?.locked) { this.undoStack.pop(); this.emit('history'); return false; }
      cut(p.items, i => i.id === sel.id);
    } else if (sel.kind === 'multi') {
      const ids = new Set(sel.ids);
      cut(p.items, i => ids.has(i.id) && !i.locked);
    } else if (sel.kind === 'opening') {
      cut(p.openings, o => o.id === sel.id);
    } else if (sel.kind === 'wall') {
      cut(p.walls, w => w.id === sel.id);
      cut(p.openings, o => o.wallId === sel.id);
    } else if (sel.kind === 'room') {
      // walls unique to this room go; walls shared with a neighbor stay so
      // the neighbor keeps its shape — unless every wall is shared (a fully
      // interior room), then its partitions go and the spaces merge
      const others = this.rooms.filter(r => r !== room);
      const shared = id => others.some(r => r.wallIds.has(id));
      let ids = [...room.wallIds].filter(id => !shared(id));
      if (!ids.length) ids = [...room.wallIds];
      const idSet = new Set(ids);
      cut(p.walls, w => idSet.has(w.id));
      cut(p.openings, o => idSet.has(o.wallId));
      // furniture inside goes too; roof-level pieces (roofs, dormers,
      // chimneys — elevation at/above the wall top) belong to the whole
      // house, not this room
      cut(p.items, i => !i.locked && (i.elevation || 0) < 200 && pointInPolygon(i.x, i.y, room.polygon));
      delete p.roomStyles[sel.id];
    }
    this.select(null);
    this.commit(true);
    return true;
  }

  // ---- persistence ---------------------------------------------------------

  /** Any edits since the project was last saved (or opened)? */
  isDirty() {
    return JSON.stringify(serializeProject(this.project)) !== this._savedJson;
  }

  /** Edits go to a crash-recovery draft, not the saved project. */
  scheduleAutosave() {
    clearTimeout(this._dirtyTimer);
    this._dirtyTimer = setTimeout(() => this.saveDraftNow(), 800);
  }

  saveDraftNow() {
    clearTimeout(this._dirtyTimer);
    if (this.currentProjectId && this.isDirty()) {
      saveDraft(this.currentProjectId, serializeProject(this.project));
    }
  }

  /** Explicit save: write the project itself and drop the draft. */
  saveNow() {
    clearTimeout(this._dirtyTimer);
    if (this.currentProjectId) {
      const json = JSON.stringify(serializeProject(this.project));
      saveProject(this.currentProjectId, JSON.parse(json));
      this._savedJson = json;
      clearDraft(this.currentProjectId);
    }
  }

  /** Wipe every floor back to an empty plan (undoable). */
  clearPlan() {
    this.checkpoint();
    this.project.levels = [emptyLevel()];
    this.project.activeLevel = 0;
    bindLevel(this.project);
    this.select(null);
    this.commit(true);
    this.emit('level');
  }

  loadProject(data, projectId = null) {
    this.currentProjectId = projectId;
    this.project = hydrateProject(data);
    this._savedJson = JSON.stringify(serializeProject(this.project));
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.selection = null;
    this.commit(true);
    this.emit('selection');
    this.emit('history');
    this.emit('projectLoaded');
  }

  exportJSON() {
    return JSON.stringify(serializeProject(this.project), null, 2);
  }

  // ---- floors / levels ------------------------------------------------------

  addLevel() {
    if (this.project.levels.length >= 4) return false;
    this.checkpoint();
    this.project.levels.push({ walls: [], openings: [], items: [], roomStyles: {} });
    this.setActiveLevel(this.project.levels.length - 1, false);
    this.commit(true);
    return true;
  }

  setActiveLevel(i, emitChange = true) {
    if (i < 0 || i >= this.project.levels.length) return;
    this.project.activeLevel = i;
    bindLevel(this.project);
    this.select(null);
    this.refreshRooms();
    this.emit('level');
    if (emitChange) this.commit(true);
  }
}
