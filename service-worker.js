// Minimal offline-shell service worker.
// Caches the app files so the interface loads even with no signal;
// the food-photo API call still needs internet to actually work.
const CACHE_NAME = 'coach-center-v3';
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
  const req = event.request;

  // Only ever touch same-origin GET requests for the app shell. Anything
  // else — Supabase auth, the Gemini API, any POST/PUT — must go straight
  // to the network untouched: routing a request with a body through
  // caches.match()+fetch() breaks it on Safari ("Load failed"), and none
  // of that traffic should be cached anyway.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // HTML shell: always prefer a fresh copy so design/logic fixes show up
  // immediately, falling back to cache only when offline.
  if (req.mode === 'navigate' || req.url.endsWith('index.html')) {
    event.respondWith(
      fetch(req)
        .then((fresh) => {
          const copy = fresh.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return fresh;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
