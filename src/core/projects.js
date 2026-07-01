// Multi-project repository backed by localStorage.
const KEY = 'honeycutt.projects.v1';
const LEGACY_AUTOSAVE = 'havenplan.autosave.v1';

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : {};
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

function writeAll(map) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
    return true;
  } catch {
    return false; // storage full — caller may retry after pruning
  }
}

export function newProjectId() {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** One-time migration of the single-project autosave from earlier versions. */
export function migrateLegacy() {
  try {
    const raw = localStorage.getItem(LEGACY_AUTOSAVE);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data && Array.isArray(data.walls) && data.walls.length) {
      const id = newProjectId();
      const map = readAll();
      map[id] = { id, name: data.name || 'My project', updatedAt: Date.now(), data };
      writeAll(map);
    }
    localStorage.removeItem(LEGACY_AUTOSAVE);
  } catch { /* ignore corrupt legacy data */ }
}

/** List projects, most recently edited first. */
export function listProjects() {
  return Object.values(readAll()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getProject(id) {
  return readAll()[id] || null;
}

export function saveProject(id, data) {
  const map = readAll();
  map[id] = { id, name: data.name || 'Untitled', updatedAt: Date.now(), data };
  if (!writeAll(map)) {
    // storage full: drop the oldest other project and retry once
    const oldest = Object.values(map)
      .filter(p => p.id !== id)
      .sort((a, b) => a.updatedAt - b.updatedAt)[0];
    if (oldest) {
      delete map[oldest.id];
      writeAll(map);
    }
  }
}

export function deleteProject(id) {
  const map = readAll();
  delete map[id];
  writeAll(map);
}
