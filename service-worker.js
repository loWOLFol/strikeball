const CACHE_NAME = 'vedomosti-cache-v1';
const urlsToCache = ['./', './index.html', './manifest.json', './app.js', './style.css'];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('fetch', event => {
    event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
});