const CACHE_VERSION = "laund-shell-v2";
const SHELL_URLS = ["/login", "/manifest.json"];

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
  const url = new URL(request.url);

  // Never touch mutations/server actions or any Next.js data traffic (RSC
  // navigations, prefetches, server-action POSTs). Let the browser + Next
  // client runtime handle these directly so nothing is served stale or
  // mishandled — financial data must always come from the network.
  if (
    request.method !== "GET" ||
    url.search.includes("_rsc") ||
    request.headers.get("RSC") ||
    request.headers.get("Next-Router-Prefetch") ||
    request.headers.get("Next-Action")
  ) {
    return;
  }

  // Full-page navigations: network-first, but if the network fails OR returns a
  // server error, fall back to the cached app shell instead of letting iOS show
  // its native "This page couldn't load" screen.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (!res || res.status >= 500) {
            throw new Error("bad status");
          }
          return res;
        })
        .catch(async () => {
          const cached =
            (await caches.match(request)) || (await caches.match("/login"));
          return (
            cached ||
            new Response("Offline", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            })
          );
        }),
    );
    return;
  }

  // Static shell assets: cache-first.
  const isShellAsset =
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/icons/") ||
      url.pathname.startsWith("/splash/") ||
      url.pathname === "/manifest.json" ||
      url.pathname.startsWith("/_next/static/"));

  if (isShellAsset) {
    event.respondWith(
      caches.match(request).then((cached) => cached ?? fetch(request)),
    );
  }
});
