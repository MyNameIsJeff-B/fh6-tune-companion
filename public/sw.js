const CACHE_PREFIX = "fh6-tune-";
const CACHE = `${CACHE_PREFIX}v8`;
const BASE = new URL(self.registration.scope).pathname;
const fromBase = (path = "") => `${BASE}${path}`;
const CORE_ASSETS = [
  "manifest.webmanifest",
  "icon.svg",
  "data/cars.json",
  "data/build-profiles.json",
  "fonts/barlow-condensed-500.ttf",
  "fonts/barlow-condensed-600.ttf",
  "fonts/barlow-condensed-700.ttf",
  "fonts/barlow-condensed-600-italic.ttf",
  "fonts/barlow-condensed-700-italic.ttf",
  "fonts/inter-400.ttf",
  "fonts/inter-500.ttf",
  "fonts/inter-600.ttf",
  "fonts/inter-700.ttf",
].map(fromBase);

const currentReleaseAssets = async (html) => {
  const urls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => new URL(match[1], self.registration.scope))
    .filter((url) => url.origin === self.location.origin)
    .map((url) => `${url.pathname}${url.search}`);
  return [...new Set([...CORE_ASSETS, ...urls])];
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const indexResponse = await fetch(fromBase("index.html"), {
        cache: "no-store",
      });
      if (!indexResponse.ok) {
        throw new Error(`Release-index kon niet worden geladen: ${indexResponse.status}`);
      }

      const html = await indexResponse.clone().text();
      await cache.put(fromBase(), indexResponse.clone());
      await cache.put(fromBase("index.html"), indexResponse);
      await cache.addAll(await currentReleaseAssets(html));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      await Promise.all(windows.map((client) => client.navigate(client.url)));
    })(),
  );
});

const cacheSuccessfulResponse = async (request, response) => {
  if (response.ok) {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
};

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((response) => cacheSuccessfulResponse(event.request, response))
        .catch(async () => {
          const cache = await caches.open(CACHE);
          return (
            (await cache.match(fromBase("index.html"))) ||
            Response.error()
          );
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((response) =>
          cacheSuccessfulResponse(event.request, response),
        ),
    ),
  );
});
