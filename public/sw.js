// Perkakas service worker
// - Pages: network first, fall back to cache, then to /offline
// - Static assets (/_next/static, icons, fonts): stale-while-revalidate
// Bump VERSION to force every client to drop old caches.
const VERSION = "v1";
const PAGES = `perkakas-pages-${VERSION}`;
const ASSETS = `perkakas-assets-${VERSION}`;

const PRECACHE = [
  "/offline",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== PAGES && k !== ASSETS).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Same-origin only: leave APIs, analytics and the AI model CDN alone
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Page navigations
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(PAGES).then((c) => c.put(req, copy));
          return res;
        })
        .catch(async () => (await caches.match(req)) || (await caches.match("/offline")))
    );
    return;
  }

  // Static assets
  const isAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:js|css|woff2?|png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname);

  if (isAsset) {
    event.respondWith(
      caches.open(ASSETS).then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});

// Let the page ask a waiting worker to activate right away
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
