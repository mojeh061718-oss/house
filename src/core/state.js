// Central application state: project data, selection, tools, undo/redo, persistence.
import { detectRooms, roomKey, uid, pointInPolygon, collinearOverlapUnion } from './geometry.js';
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
    roomStyles: {},  // roomKey -> {name, floor, wall}
    dims: []         // {id, ax, ay, bx, by, off}  persistent measurement annotations
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
  project.dims = lvl.dims || (lvl.dims = []); // older levels predate dims
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
  // Deep-copy every level array/object so the store NEVER shares references with
  // the caller's record. Otherwise editing an opened project mutates the cached
  // home-screen copy in place, so "Don't save" can't discard and edits leak
  // between projects. Walls/openings are flat; items carry a nested path array.
  const cloneLevel = (l) => ({
    walls: (l.walls || []).map(w => ({ ...w })),
    openings: (l.openings || []).map(o => ({ ...o })),
    items: (l.items || []).map(it => it.path ? { ...it, path: it.path.map(pt => ({ ...pt })) } : { ...it }),
    roomStyles: Object.fromEntries(Object.entries(l.roomStyles || {}).map(([k, v]) => [k, { ...v }])),
    dims: (l.dims || []).map(d => ({ ...d }))
  });
  const levels = (data.levels?.length ? data.levels : [{
    walls: data.walls, openings: data.openings, items: data.items, roomStyles: data.roomStyles
  }]).map(cloneLevel);
  const p = {
    ...base,
    name: data.name ?? base.name,
    settings: { ...base.settings, ...data.settings },
    version: 2,
    activeLevel: Math.max(0, Math.min(data.activeLevel ?? 0, levels.length - 1)),
    levels
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
    this.drawWidthScale = 1;   // path/area draw width: 0.6 narrow | 1 std | 1.5 wide
    this.snapEnabled = true;   // when false, drop items exactly where tapped
    this.moveId = null;        // item id in tap-to-move mode (set from the FAB)
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

  /** Roll the live project back to the last checkpoint and drop that
   *  checkpoint — for gestures the OS cancelled mid-drag (edge swipe,
   *  notification pull). Leaves no undo or redo residue. */
  revertToCheckpoint() {
    if (!this.undoStack.length) return;
    this.project = hydrateProject(JSON.parse(this.undoStack.pop()));
    this.commit(false);
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
  dim(id) { return this.project.dims.find(d => d.id === id); }

  /** Add a persistent dimension annotation (a non-structural change). */
  addDim(ax, ay, bx, by, off = 40) {
    const d = { id: uid('d'), ax, ay, bx, by, off };
    this.project.dims.push(d);
    return d;
  }

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

  /** Merge walls that were snapped together so they overlap (two rooms sharing
   *  an edge, containers pushed together) into a single wall — openings move to
   *  the survivor with corrected positions. Returns how many walls were merged.
   *  Call after a structural gesture that could have stacked walls. */
  weldWalls() {
    const walls = this.project.walls;
    const ops = this.project.openings;
    let merged = 0, changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < walls.length && !changed; i++) {
        for (let j = i + 1; j < walls.length; j++) {
          const A = walls[i], B = walls[j];
          const u = collinearOverlapUnion(A, B, 2.5, 10);
          if (!u) continue;
          // remember every opening on A or B in world space before A changes
          const affected = ops.filter(o => o.wallId === A.id || o.wallId === B.id);
          const pos = affected.map(o => {
            const w = o.wallId === A.id ? A : B;
            return { o, x: w.ax + (w.bx - w.ax) * o.t, y: w.ay + (w.by - w.ay) * o.t };
          });
          A.ax = u.ax; A.ay = u.ay; A.bx = u.bx; A.by = u.by; // extend A to the union
          const dx = A.bx - A.ax, dy = A.by - A.ay, len2 = dx * dx + dy * dy || 1;
          for (const { o, x, y } of pos) {
            o.wallId = A.id;
            o.t = Math.max(0, Math.min(1, ((x - A.ax) * dx + (y - A.ay) * dy) / len2));
          }
          walls.splice(j, 1);
          merged++; changed = true; break;
        }
      }
    }
    return merged;
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

  /** Lock every asset, wall and opening on every floor in place. One-way: it
   *  never unlocks — a piece is freed by selecting it and tapping its padlock.
   *  Returns the number of newly-locked pieces (0 if everything was already
   *  locked, so the caller can skip an empty checkpoint). */
  lockAll() {
    let already = true;
    for (const lvl of this.project.levels) {
      for (const arr of [lvl.items, lvl.walls, lvl.openings]) {
        for (const el of (arr || [])) if (!el.locked) { already = false; break; }
      }
    }
    if (already) return 0;
    this.checkpoint();
    let n = 0;
    for (const lvl of this.project.levels) {
      for (const arr of [lvl.items, lvl.walls, lvl.openings]) {
        for (const el of (arr || [])) if (!el.locked) { el.locked = true; n++; }
      }
    }
    this.commit(false);
    return n;
  }

  deleteSelection() {
    const sel = this.selection;
    if (!sel) return false;
    const p = this.project;
    if (!['item', 'multi', 'opening', 'wall', 'room', 'dim'].includes(sel.kind)) return false;
    const room = sel.kind === 'room' ? this.room(sel.id) : null;

    // Decide whether anything can actually be removed BEFORE taking a
    // checkpoint, so a blocked delete (locked item, all-locked group, or a
    // missing target) is a true no-op: no wiped redo history, no empty undo
    // entry, selection kept — and the caller can show a "locked" hint.
    if (sel.kind === 'item') {
      const it = this.item(sel.id);
      if (!it || it.locked) return false;
    } else if (sel.kind === 'multi') {
      const ids = new Set(sel.ids);
      if (!p.items.some(i => ids.has(i.id) && !i.locked)) return false;
    } else if (sel.kind === 'opening') {
      const o = this.opening(sel.id);
      if (!o || o.locked) return false;
    } else if (sel.kind === 'wall') {
      const w = this.wall(sel.id);
      if (!w || w.locked) return false;
    } else if (sel.kind === 'room') {
      if (!room) return false;
    } else if (sel.kind === 'dim') {
      if (!this.dim(sel.id)) return false;
    }

    this.checkpoint();
    const cut = (arr, pred) => {
      for (let i = arr.length - 1; i >= 0; i--) if (pred(arr[i])) arr.splice(i, 1);
    };
    if (sel.kind === 'dim') {
      cut(p.dims, d => d.id === sel.id);
      this.select(null);
      this.commit(false);
      return true;
    } else if (sel.kind === 'item') {
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
      // locked walls survive a room delete, like locked items do
      const idSet = new Set(ids.filter(id => !this.wall(id)?.locked));
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

  /** Any edits since the project was last saved (or opened)? Which floor is
   *  active is a view preference, not an edit — without normalizing it, just
   *  browsing to Floor 1 triggered a spurious "Save changes?" on exit. */
  isDirty() {
    if (this._savedJson == null) return true;
    const a = serializeProject(this.project);
    let b;
    try { b = JSON.parse(this._savedJson); } catch { return true; }
    a.activeLevel = 0; b.activeLevel = 0;
    return JSON.stringify(a) !== JSON.stringify(b);
  }

  /** Edits go to a crash-recovery draft, not the saved project. */
  scheduleAutosave() {
    clearTimeout(this._dirtyTimer);
    this.emit('saveState', 'saving');
    this._dirtyTimer = setTimeout(() => this.saveDraftNow(), 800);
  }

  saveDraftNow() {
    clearTimeout(this._dirtyTimer);
    if (this.currentProjectId && this.isDirty()) {
      saveDraft(this.currentProjectId, serializeProject(this.project));
    }
    this.emit('saveState', 'saved');
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
    this.emit('saveState', 'saved');
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
    this.project.levels.push({ walls: [], openings: [], items: [], roomStyles: {}, dims: [] });
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
