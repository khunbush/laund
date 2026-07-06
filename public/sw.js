const CACHE_VERSION = "laund-shell-v1";
const SHELL_URLS = ["/", "/login", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Never cache data mutations/actions or API-like requests — financial data
  // must always come from the network.
  if (request.method !== "GET") {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/") ?? caches.match(request)),
    );
    return;
  }

  const url = new URL(request.url);
  const isShellAsset =
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/icons/") ||
      url.pathname === "/manifest.json" ||
      url.pathname.startsWith("/_next/static/"));

  if (isShellAsset) {
    event.respondWith(
      caches.match(request).then((cached) => cached ?? fetch(request)),
    );
  }
});
