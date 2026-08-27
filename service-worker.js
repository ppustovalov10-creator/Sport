// Minimal offline-shell service worker.
// Caches the app files as a fallback for offline use — API calls still
// need internet to actually work.
const CACHE_NAME = 'coach-center-v3';
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './js/storage-supabase.js',
  './js/api-config.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Network-first: always serve the latest deployed files when online, so a
// new deploy shows up right away instead of being stuck behind whatever was
// cached on a previous visit. Cache is only a fallback for offline use.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return; // never intercept API calls (Supabase/Gemini are POST)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
