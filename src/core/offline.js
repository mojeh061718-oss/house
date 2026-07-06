// Offline design library. The photo-scanned textures are the only assets the
// app streams on demand; this downloads them all into a persistent service-
// worker cache so the studio runs fully offline (airplane mode, no signal)
// with the same instant, reliable feel as the procedural content.
import { photoTextureUrls, warmAllTextures } from './textures.js';

const FLAG = 'hhs.offlineLibrary.v1';

export function libraryInstalled() {
  try { return localStorage.getItem(FLAG) === 'done'; } catch { return false; }
}
export function libraryCount() { return photoTextureUrls().length; }
/** Rough download size for the prompt (~180 KB average per photo JPG). */
export function librarySizeMB() { return Math.round(libraryCount() * 0.18 * 10) / 10; }

function markInstalled() { try { localStorage.setItem(FLAG, 'done'); } catch { /* private mode */ } }

async function controller() {
  if (!('serviceWorker' in navigator)) return null;
  if (navigator.serviceWorker.controller) return navigator.serviceWorker.controller;
  // On the very first load the SW installs but doesn't control the page until it
  // claims clients — wait briefly for that so the first download still uses the
  // persistent SW cache rather than the fallback.
  try {
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller) return navigator.serviceWorker.controller;
    await new Promise((resolve) => {
      const done = () => { navigator.serviceWorker.removeEventListener('controllerchange', done); resolve(); };
      navigator.serviceWorker.addEventListener('controllerchange', done);
      setTimeout(done, 3000);
    });
    return navigator.serviceWorker.controller;
  } catch { return null; }
}

/**
 * Download the whole library. Reports {done,total} through onProgress and
 * resolves when complete. Uses the service worker when available (true offline
 * caching); otherwise falls back to warming the in-page cache so the current
 * session at least has everything loaded.
 */
export async function installLibrary(onProgress) {
  const urls = photoTextureUrls();
  const total = urls.length;
  const sw = await controller();

  if (sw && navigator.serviceWorker) {
    return new Promise((resolve) => {
      let settled = false;
      // Only a real LIBRARY_DONE marks the library installed. If the worker
      // never reports back (it was replaced, the connection stalled), we must
      // NOT claim "Available offline" — that would suppress the prompt forever
      // with nothing actually cached. Resolve false instead so the UI stays
      // honest and a later load can retry.
      const finish = (ok) => { if (settled) return; settled = true; navigator.serviceWorker.removeEventListener('message', onMsg); if (ok) markInstalled(); resolve(ok); };
      const onMsg = (e) => {
        const m = e.data || {};
        if (m.type === 'LIBRARY_PROGRESS') onProgress?.(m.done, m.total || total);
        if (m.type === 'LIBRARY_DONE') { onProgress?.(m.total || total, m.total || total); finish(true); }
      };
      navigator.serviceWorker.addEventListener('message', onMsg);
      sw.postMessage({ type: 'CACHE_LIBRARY', urls });
      // safety net if the worker never reports done — resolve honestly (not installed)
      setTimeout(() => finish(false), 180000);
    });
  }

  // No controlling service worker (unsupported browser). We can warm this
  // session's in-memory cache, but we canNOT persist for true offline use — so
  // do NOT mark it installed (that would falsely claim "Available offline" and
  // suppress the prompt forever). Return false so the UI stays honest and a
  // later, SW-controlled load can do the real install.
  return new Promise((resolve) => {
    warmAllTextures((done) => onProgress?.(done, total));
    resolve(false);
  });
}
