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
// The photo-texture library is large and stable, so it lives in its OWN cache
// that survives app updates — download the design library once, keep it offline
// across every future release instead of re-fetching ~50 JPGs each deploy.
const LIB = `honeycutt-lib::${self.location.pathname}`;

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
      // keep this build's shell cache AND the persistent library cache
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== LIB).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// The app asks the worker to download the whole texture library for offline use.
// We fetch in small chunks and report progress back so the UI can show a bar.
self.addEventListener('message', (e) => {
  const msg = e.data || {};
  if (msg.type === 'CACHE_LIBRARY') {
    e.waitUntil(cacheLibrary(msg.urls || []));
  }
});

async function cacheLibrary(urls) {
  const cache = await caches.open(LIB);
  let done = 0, failed = 0;
  const total = urls.length;
  const post = (extra) => broadcast({ type: 'LIBRARY_PROGRESS', done, total, failed, ...extra });
  // small concurrency so a phone on cellular isn't hammered
  const queue = urls.slice();
  async function worker() {
    while (queue.length) {
      const url = queue.shift();
      try {
        const hit = await cache.match(url);
        if (!hit) {
          const res = await fetch(url, { cache: 'reload' });
          if (res.ok) await cache.put(url, res.clone());
          else failed++;
        }
      } catch { failed++; /* leave it for a retry next time */ }
      done++;
      post();
    }
  }
  await Promise.all([worker(), worker(), worker()]);
  // report failures honestly — the app only marks the library "installed"
  // when every file made it, so a flaky connection can't fake "offline ready"
  broadcast({ type: 'LIBRARY_DONE', done, total, failed });
}

async function broadcast(data) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  for (const c of clients) c.postMessage(data);
}

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

  // texture JPGs: serve from the persistent library cache first so a downloaded
  // library keeps working fully offline and across app updates
  if (/\/tex\/.+\.(jpg|jpeg|png|webp)$/i.test(url.pathname)) {
    e.respondWith(
      caches.open(LIB).then((lib) =>
        lib.match(request).then((hit) =>
          hit || fetch(request).then((res) => {
            if (res.ok && (res.type === 'basic' || res.type === 'default')) lib.put(request, res.clone());
            return res;
          }).catch(() => caches.open(CACHE).then((c) => c.match(request)))
        )
      )
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
