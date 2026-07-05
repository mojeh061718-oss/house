// Honeycutt Home Studio service worker: app-shell caching for offline use.
// Hashed build assets are cached first-hit (immutable); the HTML shell is
// network-first so new deployments show up immediately when online.
//
// The cache name is versioned per build (from the ?v= param main.js registers
// with) AND per scope (the worker's own path). That means:
//   • a new release ⇒ a new cache name ⇒ activate() deletes the old cache, so a
//     stale shell can never be served after an update (fixes "it reverted to an
//     old version"), and
//   • the dev preview (/house/dev/) and live app (/house/) never share a cache.
const V = new URL(self.location).searchParams.get('v') || 'dev';
const CACHE = `honeycutt::${self.location.pathname}::${V}`;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(['./', 'manifest.webmanifest']))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  if (request.mode === 'navigate') {
    // network-first for the shell; fall back to the cached shell only offline
    e.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./', copy));
          return res;
        })
        .catch(() => caches.open(CACHE).then((c) => c.match('./')))
    );
    return;
  }

  // cache-first for hashed assets, scoped to THIS build's cache so a not-yet-
  // purged old cache can never serve a stale asset
  e.respondWith(
    caches.open(CACHE).then((c) =>
      c.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok && (res.type === 'basic' || res.type === 'default')) {
              c.put(request, res.clone());
            }
            return res;
          })
      )
    )
  );
});
