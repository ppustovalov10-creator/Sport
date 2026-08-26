// Minimal offline-shell service worker.
// Caches the app files so the interface loads even with no signal;
// the food-photo API call still needs internet to actually work.
const CACHE_NAME = 'coach-center-v1';
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './js/storage-polyfill.js',
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

self.addEventListener('fetch', (event) => {
  // Never cache API calls — always go to the network for those.
  if (event.request.url.includes('api.anthropic.com')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
