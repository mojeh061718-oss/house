// Minimal promise-based IndexedDB wrapper. One database, a few keyed stores.
// IndexedDB is the durable, async, high-quota store recommended for PWAs — and,
// unlike localStorage, it survives iOS storage eviction when the origin has been
// granted persistent storage (which an installed home-screen app gets).
const DB_NAME = 'honeycutt';
const DB_VERSION = 1;
const STORES = { projects: 'id', drafts: 'projectId', meta: 'k' };

let dbPromise = null;

export function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('no indexedDB')); return; }
    let req;
    try { req = indexedDB.open(DB_NAME, DB_VERSION); }
    catch (e) { reject(e); return; }
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const [name, keyPath] of Object.entries(STORES)) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('idb blocked'));
  });
  return dbPromise;
}

export function idbGetAll(db, store) {
  return new Promise((res, rej) => {
    const r = db.transaction(store, 'readonly').objectStore(store).getAll();
    r.onsuccess = () => res(r.result || []);
    r.onerror = () => rej(r.error);
  });
}

export function idbPut(db, store, val) {
  return new Promise((res, rej) => {
    const t = db.transaction(store, 'readwrite');
    t.objectStore(store).put(val);
    t.oncomplete = () => res(true);
    t.onerror = () => rej(t.error);
    t.onabort = () => rej(t.error || new Error('idb abort'));
  });
}

export function idbDelete(db, store, key) {
  return new Promise((res, rej) => {
    const t = db.transaction(store, 'readwrite');
    t.objectStore(store).delete(key);
    t.oncomplete = () => res(true);
    t.onerror = () => rej(t.error);
  });
}
