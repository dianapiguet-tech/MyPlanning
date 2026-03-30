/* =================================================================
   MyPlanning App
   File: sw.js  (Service Worker)
   What it does: Makes the app work offline by caching all files
                 locally on the device after the first visit.
   Author: Diana (built with Claude)
   Version: 1.0 — Base Camp 1

   A Service Worker is a background script that sits between the
   app and the network. When you open the app, it serves files
   from the local cache instead of downloading them again.
   ================================================================= */


/* The cache has a name so we can update it cleanly later */
const CACHE_NAME = 'myplanning-v1';

/* The files we want to store offline */
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/manifest.json'
];


/* ── INSTALL ──────────────────────────────────────────────────────
   Runs once when the Service Worker is first registered.
   Downloads and caches all our files.                             */

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  /* Activate immediately without waiting */
  self.skipWaiting();
});


/* ── ACTIVATE ─────────────────────────────────────────────────────
   Runs when this Service Worker takes over.
   Cleans up any old caches from previous versions.               */

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keyList) {
      return Promise.all(
        keyList.map(function (key) {
          if (key !== CACHE_NAME) {
            return caches.delete(key);  /* remove old cache */
          }
        })
      );
    })
  );
  self.clients.claim();
});


/* ── FETCH ────────────────────────────────────────────────────────
   Intercepts every network request.
   Strategy: serve from cache first, fall back to network.
   This makes the app load instantly, even without internet.      */

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      /* Return cached version if available, otherwise fetch from network */
      return response || fetch(event.request);
    })
  );
});
