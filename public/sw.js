/**
 * Offline-first service worker (knowledge/12_OFFLINE_STRATEGY.md,
 * knowledge/26_CONNECTIVITY_AND_OFFLINE.md).
 *
 * - App routes are precached on install so the app opens in airplane mode.
 * - Hashed build assets are cached first-time-seen, then served cache-first.
 * - Everything else same-origin uses stale-while-revalidate.
 */
const CACHE_NAME = "sstg-v3";

// Free, keyless vector-tile host used by the trip map (see /map).
const TILE_ORIGIN = "https://tiles.openfreemap.org";

const PRECACHE_ROUTES = [
  "/",
  "/today",
  "/hotels",
  "/packing",
  "/map",
  "/memories",
  "/more",
  "/manifest.webmanifest",
  "/maplibre-gl-worker.mjs",
  "/maplibre-gl-shared.mjs",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ROUTES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await cache.match(fallbackUrl);
      if (fallback) return fallback;
    }
    throw new Error("offline and not cached");
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached ?? refresh;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Base-map assets: tiles/glyphs/sprites are effectively immutable, style
  // JSON may evolve. Cached tiles keep previously-viewed areas usable
  // offline; they never claim to reflect current road status.
  if (url.origin === TILE_ORIGIN) {
    if (url.pathname.startsWith("/styles/")) {
      event.respondWith(staleWhileRevalidate(request));
    } else {
      event.respondWith(cacheFirst(request));
    }
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, "/"));
    return;
  }

  // Hashed immutable build output and static trip assets.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/maps/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
