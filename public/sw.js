const CACHE = "fh6-tune-v4";
const BASE = new URL(self.registration.scope).pathname;
const fromBase = (path = "") => `${BASE}${path}`;
const APP_SHELL = [
  fromBase(),
  fromBase("index.html"),
  fromBase("manifest.webmanifest"),
  fromBase("icon.svg"),
  fromBase("data/cars.json"),
  fromBase("fonts/barlow-condensed-500.ttf"),
  fromBase("fonts/barlow-condensed-600.ttf"),
  fromBase("fonts/barlow-condensed-700.ttf"),
  fromBase("fonts/barlow-condensed-600-italic.ttf"),
  fromBase("fonts/barlow-condensed-700-italic.ttf"),
  fromBase("fonts/inter-400.ttf"),
  fromBase("fonts/inter-500.ttf"),
  fromBase("fonts/inter-600.ttf"),
  fromBase("fonts/inter-700.ttf"),
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached ||
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(fromBase("index.html"))),
    ),
  );
});
