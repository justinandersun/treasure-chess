/*
 * Offline support. Pages load from the network when possible (so updates arrive normally) and from
 * the cache when offline. Built files under /assets have content-hashed names, so a cached copy
 * never goes stale; other static files are served from the cache and refreshed in the background.
 * Bump CACHE to drop everything cached by an older version.
 */

const CACHE = 'treasure-chess-v1';
const SHELL = ['/', '/manifest.webmanifest', '/favicon.svg', '/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    // Network first; every page is the same app, so the cached "/" serves any path offline.
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put('/', copy));
          return response;
        })
        .catch(() => caches.match('/')),
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const refresh = fetch(request).then((response) => {
        if (response.ok) cache.put(request, response.clone());
        return response;
      });
      if (url.pathname.startsWith('/assets/')) return cached ?? refresh;
      refresh.catch(() => {});
      return cached ?? refresh;
    }),
  );
});
