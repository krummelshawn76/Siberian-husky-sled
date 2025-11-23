const CACHE_NAME = "husky-saga-v1";
const ASSETS = [
  "index.html",
  "fresh-bait.html",
  "hunter.html",
  "god.html",
  "store.html",
  "game.js",
  "main.css",
  "manifest.json",
  "Image/file_000000004eac71f58e0f324b6b863bc7.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});
