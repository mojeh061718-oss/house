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

// ---- working draft ----------------------------------------------------------
// Edits are no longer saved into the project automatically; they go to a
// single crash-recovery draft slot. The project itself is only written when
// the user chooses Save on leaving the studio.

const DRAFT_KEY = 'honeycutt.draft.v1';

export function saveDraft(projectId, data) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ projectId, at: Date.now(), data }));
  } catch { /* storage full — recovery draft is best-effort */ }
}

export function getDraft() {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY));
    return d && d.projectId && d.data ? d : null;
  } catch {
    return null;
  }
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

// ---- backup & restore -------------------------------------------------------

const BACKUP_AT_KEY = 'honeycutt.lastBackupAt';

/** Every saved project bundled into one portable JSON blob. */
export function exportBackup() {
  return JSON.stringify({
    app: 'honeycutt-home-studio',
    kind: 'backup',
    version: 1,
    exportedAt: Date.now(),
    projects: readAll()
  }, null, 2);
}

/** Is this parsed JSON one of our backup files? */
export function isBackup(data) {
  return !!(data && data.kind === 'backup' && data.projects && typeof data.projects === 'object');
}

/** Merge a backup into local storage (newer local edits win). Returns count. */
export function importBackup(data) {
  if (!isBackup(data)) return -1;
  const map = readAll();
  let n = 0;
  for (const [id, entry] of Object.entries(data.projects)) {
    if (!entry || typeof entry !== 'object' || !entry.data) continue;
    if (map[id] && (map[id].updatedAt || 0) >= (entry.updatedAt || 0)) continue;
    map[id] = { ...entry, id };
    n++;
  }
  writeAll(map);
  return n;
}

/** Days since the last backup, or Infinity if never backed up. */
export function daysSinceBackup() {
  const at = parseInt(localStorage.getItem(BACKUP_AT_KEY) || '0', 10);
  return at ? (Date.now() - at) / 86400000 : Infinity;
}

/**
 * Save all projects to a file. Uses the iOS share sheet when available
 * (→ Files, AirDrop, Messages...), otherwise a plain download.
 */
export async function backupToFile() {
  const stamp = new Date().toISOString().slice(0, 10);
  const name = `home-studio-backup-${stamp}.json`;
  const json = exportBackup();
  const file = new File([json], name, { type: 'application/json' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Home Studio backup' });
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      a.download = name;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  } catch (err) {
    if (err?.name === 'AbortError') return false; // user closed the sheet
    throw err;
  }
  localStorage.setItem(BACKUP_AT_KEY, String(Date.now()));
  return true;
}
