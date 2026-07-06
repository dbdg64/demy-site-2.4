/* ════════════════════════════════════════
   ديمى — Service Worker
   Cache-First for static assets,
   Network-First for API calls.
   ════════════════════════════════════════ */
var CACHE_NAME = 'demy-cache-v2';

/* Core static assets to pre-cache on install */
var PRECACHE_URLS = [
  '/',
  '/css/style.css',
  '/js/main.js',
  '/structured-data.js',
  '/analytics.js',
  '/manifest.json'
];

/* ── Install: pre-cache core assets ── */
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  /* Activate immediately — don't wait for page reload */
  self.skipWaiting();
});

/* ── Activate: clean old caches, take control ── */
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names
          .filter(function (name) { return name !== CACHE_NAME; })
          .map(function (name) { return caches.delete(name); })
      );
    })
  );
  /* Claim all clients so SW handles fetches immediately */
  self.clients.claim();
});

/* ── Fetch: decide strategy based on request type ── */
self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url);

  /* Skip non-GET and cross-origin requests */
  if (event.request.method !== 'GET' || url.origin !== location.origin) return;

  /* ── Network-First for API calls ── */
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  /* ── Cache-First for everything else (CSS, JS, images, fonts) ── */
  event.respondWith(cacheFirst(event.request));
});

/* ── Cache-First strategy ── */
function cacheFirst(request) {
  return caches.match(request).then(function (cached) {
    if (cached) return cached;
    return fetch(request).then(function (response) {
      if (!response || response.status !== 200) return response;
      var clone = response.clone();
      caches.open(CACHE_NAME).then(function (cache) {
        cache.put(request, clone);
      });
      return response;
    });
  });
}

/* ── Network-First strategy ── */
function networkFirst(request) {
  return fetch(request).then(function (response) {
    if (response && response.status === 200) {
      var clone = response.clone();
      caches.open(CACHE_NAME).then(function (cache) {
        cache.put(request, clone);
      });
    }
    return response;
  }).catch(function () {
    return caches.match(request);
  });
}
