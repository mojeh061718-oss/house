// Multi-project repository. Durable storage lives in IndexedDB; an in-memory
// cache keeps the read API synchronous for the editor/home screen, while writes
// persist asynchronously. Falls back to localStorage if IndexedDB is
// unavailable (e.g. private mode). Existing localStorage data migrates once.
import { openDB, idbGetAll, idbPut, idbDelete } from './idb.js';

const KEY = 'honeycutt.projects.v1';
const DRAFT_KEY = 'honeycutt.draft.v1';
const BACKUP_AT_KEY = 'honeycutt.lastBackupAt';
const LEGACY_AUTOSAVE = 'havenplan.autosave.v1';

let db = null;                 // IDBDatabase, or null → localStorage fallback
const projects = new Map();    // id -> { id, name, updatedAt, data }
const drafts = new Map();      // projectId -> { projectId, at, data }
const meta = new Map();        // k -> v
let onStorageFull = null;      // invoked when a write is rejected (quota)

export function setStorageFullHandler(fn) { onStorageFull = fn; }
function storageFull() { try { onStorageFull?.(); } catch { /* ignore */ } }

// ---- startup: load everything into memory once ------------------------------

/** Open the store, migrate any legacy localStorage data, and populate the cache.
 *  Must be awaited before the home screen reads projects. */
export async function initStorage() {
  try { db = await openDB(); } catch { db = null; }

  if (db) {
    try {
      const metaRows = await idbGetAll(db, 'meta');
      if (!metaRows.some(m => m.k === 'migrated')) {
        await migrateFromLocalStorage();
        await idbPut(db, 'meta', { k: 'migrated', v: 1 });
      }
      for (const p of await idbGetAll(db, 'projects')) projects.set(p.id, p);
      for (const d of await idbGetAll(db, 'drafts')) drafts.set(d.projectId, d);
      for (const m of await idbGetAll(db, 'meta')) meta.set(m.k, m.v);
      // a pagehide-synced localStorage draft can be NEWER than what IndexedDB
      // managed to commit before iOS killed the process — prefer it
      try {
        const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
        if (d?.projectId && d.data && (!drafts.has(d.projectId) || d.at > drafts.get(d.projectId).at)) {
          drafts.set(d.projectId, d);
        }
      } catch { /* corrupt */ }
      return;
    } catch {
      db = null; // any IndexedDB failure → fall back to localStorage
    }
  }
  loadFromLocalStorage();
}

function loadFromLocalStorage() {
  try {
    const map = JSON.parse(localStorage.getItem(KEY) || '{}');
    for (const [id, p] of Object.entries(map)) if (p && p.data) projects.set(id, { ...p, id });
  } catch { /* corrupt */ }
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    if (d && d.projectId && d.data) drafts.set(d.projectId, d);
  } catch { /* corrupt */ }
  const at = parseInt(localStorage.getItem(BACKUP_AT_KEY) || '0', 10);
  if (at) meta.set('lastBackupAt', at);
}

async function migrateFromLocalStorage() {
  // legacy single-project autosave from very early versions
  try {
    const raw = localStorage.getItem(LEGACY_AUTOSAVE);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.walls) && data.walls.length) {
        const id = newProjectId();
        await idbPut(db, 'projects', { id, name: data.name || 'My project', updatedAt: Date.now(), data });
      }
      localStorage.removeItem(LEGACY_AUTOSAVE);
    }
  } catch { /* ignore */ }
  try {
    const map = JSON.parse(localStorage.getItem(KEY) || '{}');
    for (const [id, p] of Object.entries(map)) if (p && p.data) await idbPut(db, 'projects', { ...p, id });
  } catch { /* ignore */ }
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    if (d && d.projectId && d.data) await idbPut(db, 'drafts', d);
  } catch { /* ignore */ }
  const at = parseInt(localStorage.getItem(BACKUP_AT_KEY) || '0', 10);
  if (at) await idbPut(db, 'meta', { k: 'lastBackupAt', v: at });
  // the localStorage copy is left in place as a passive fallback — not deleted.
}

// ---- localStorage fallback flushers -----------------------------------------

function flushProjectsLS() {
  try {
    const obj = {};
    for (const [id, p] of projects) obj[id] = p;
    localStorage.setItem(KEY, JSON.stringify(obj));
    return true;
  } catch { return false; }
}
function flushDraftsLS() {
  // fallback keeps only the most recent draft (localStorage is tight)
  try {
    let latest = null;
    for (const d of drafts.values()) if (!latest || d.at > latest.at) latest = d;
    if (latest) localStorage.setItem(DRAFT_KEY, JSON.stringify(latest));
    else localStorage.removeItem(DRAFT_KEY);
    return true;
  } catch { return false; }
}

// ---- ids & legacy no-op -----------------------------------------------------

export function newProjectId() {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Migration now happens inside initStorage(); kept for call-site compatibility. */
export function migrateLegacy() { /* no-op */ }

// ---- projects ---------------------------------------------------------------

export function listProjects() {
  return [...projects.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getProject(id) { return projects.get(id) || null; }

export function saveProject(id, data) {
  const rec = { id, name: data.name || 'Untitled', updatedAt: Date.now(), data };
  projects.set(id, rec);
  if (db) idbPut(db, 'projects', rec).catch(storageFull);
  else if (!flushProjectsLS()) storageFull(); // never silently delete a project
  return rec;
}

export function deleteProject(id) {
  projects.delete(id);
  if (db) idbDelete(db, 'projects', id).catch(() => {});
  else flushProjectsLS();
  if (drafts.has(id)) clearDraft(id);
}

// ---- crash-recovery drafts (per project) ------------------------------------

export function saveDraft(projectId, data, sync = false) {
  if (!projectId) return;
  const rec = { projectId, at: Date.now(), data };
  drafts.set(projectId, rec);
  if (db) idbPut(db, 'drafts', rec).catch(() => {});
  else flushDraftsLS();
  // belt-and-braces for pagehide/freeze: iOS can kill the process before the
  // async IndexedDB transaction commits, so also write the latest draft
  // SYNCHRONOUSLY to localStorage (recovery prefers the newer of the two)
  if (sync && db) flushDraftsLS();
}

/** A specific project's draft, or (no id) the most recently edited draft. */
export function getDraft(projectId) {
  if (projectId) return drafts.get(projectId) || null;
  let latest = null;
  for (const d of drafts.values()) if (!latest || d.at > latest.at) latest = d;
  return latest;
}

export function clearDraft(projectId) {
  if (projectId) {
    if (!drafts.delete(projectId)) return;
    if (db) idbDelete(db, 'drafts', projectId).catch(() => {});
    flushDraftsLS(); // keep the pagehide-synced LS copy in step, or a stale
                     // draft would resurrect on the next boot after a save
  } else {
    const ids = [...drafts.keys()];
    drafts.clear();
    if (db) ids.forEach(k => idbDelete(db, 'drafts', k).catch(() => {}));
    flushDraftsLS();
  }
}

// ---- backup & restore -------------------------------------------------------

function projectsObject() {
  const obj = {};
  for (const [id, p] of projects) obj[id] = p;
  return obj;
}

/** Every saved project bundled into one portable JSON blob. */
export function exportBackup() {
  return JSON.stringify({
    app: 'honeycutt-home-studio',
    kind: 'backup',
    version: 1,
    exportedAt: Date.now(),
    projects: projectsObject()
  }, null, 2);
}

/** Is this parsed JSON one of our backup files? */
export function isBackup(data) {
  return !!(data && data.kind === 'backup' && data.projects && typeof data.projects === 'object');
}

/** Merge a backup into storage (newer local edits win). Returns count added. */
export function importBackup(data) {
  if (!isBackup(data)) return -1;
  let n = 0;
  for (const [id, entry] of Object.entries(data.projects)) {
    if (!entry || typeof entry !== 'object' || !entry.data) continue;
    const cur = projects.get(id);
    if (cur && (cur.updatedAt || 0) >= (entry.updatedAt || 0)) continue;
    const rec = { ...entry, id };
    projects.set(id, rec);
    if (db) idbPut(db, 'projects', rec).catch(storageFull);
    n++;
  }
  if (!db && n) flushProjectsLS();
  return n;
}

function setMeta(k, v) {
  meta.set(k, v);
  if (db) idbPut(db, 'meta', { k, v }).catch(() => {});
  else if (k === 'lastBackupAt') { try { localStorage.setItem(BACKUP_AT_KEY, String(v)); } catch { /* ignore */ } }
}

/** Days since the last backup, or Infinity if never backed up. */
export function daysSinceBackup() {
  const at = meta.get('lastBackupAt') || 0;
  return at ? (Date.now() - at) / 86400000 : Infinity;
}

/**
 * Save all projects to a file. Uses the iOS share sheet when available
 * (→ Files, iCloud Drive, AirDrop...), otherwise a plain download.
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
  setMeta('lastBackupAt', Date.now());
  return true;
}

/** Approximate storage usage/health for a settings readout, if supported. */
export async function storageEstimate() {
  try {
    const persisted = navigator.storage?.persisted ? await navigator.storage.persisted() : false;
    const est = navigator.storage?.estimate ? await navigator.storage.estimate() : null;
    return { persisted, usage: est?.usage ?? null, quota: est?.quota ?? null, engine: db ? 'indexeddb' : 'localstorage' };
  } catch {
    return { persisted: false, usage: null, quota: null, engine: db ? 'indexeddb' : 'localstorage' };
  }
}
