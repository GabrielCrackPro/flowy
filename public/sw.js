// Flowy PWA service worker.
// Strategy:
// - Precaches static assets (icons, manifest, offline page) at install.
// - Navigations: network-first, falling back to the last good shell page.
// - Immutable hashed build assets, icons and the manifest: cache-first.
// - API calls (authenticated financial data) are never intercepted.

const CACHE_VERSION = "1.0.0";
const STATIC_CACHE = `flowy-static-${CACHE_VERSION}`;
const SHELL_CACHE = `flowy-shell-${CACHE_VERSION}`;

// Static, non-essential assets to precache at install time.
const PRECACHE_URLS = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-192.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon-180.png",
  "/favicon-dark.svg",
  "/favicon-light.svg",
  "/offline.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // Individual failures (e.g. a missing asset) must not abort the install.
      await Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)));
    })(),
  );
});

// On updates the new worker waits for the page to apply it explicitly, so the
// app can prompt the user instead of taking over mid-session.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith("flowy-") &&
              key !== STATIC_CACHE &&
              key !== SHELL_CACHE,
          )
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only same-origin GET requests are handled by the service worker.
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept API calls (authenticated financial data).
  if (url.pathname.startsWith("/api/")) return;

  // Navigations: network-first, falling back to the last good shell page.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            const cache = await caches.open(SHELL_CACHE);
            await cache.put("/shell", response.clone());
          }
          return response;
        } catch {
          const cache = await caches.open(SHELL_CACHE);
          const shell = await cache.match("/shell");
          if (shell) return shell;
          const staticCache = await caches.open(STATIC_CACHE);
          const offline = await staticCache.match("/offline.html");
          return offline ?? Response.error();
        }
      })(),
    );
    return;
  }

  // Immutable hashed build assets, icons, the manifest and the offline page.
  const isStatic =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/favicon-") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/offline.html";
  if (!isStatic) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(request);
      if (cached) {
        // Background refresh keeps non-hashed assets current.
        if (!url.pathname.startsWith("/_next/static/")) {
          void fetch(request)
            .then((response) => {
              if (response.ok) {
                void cache.put(request, response).catch(() => undefined);
              }
            })
            .catch(() => undefined);
        }
        return cached;
      }
      try {
        const response = await fetch(request);
        if (response.ok) {
          void cache.put(request, response.clone()).catch(() => undefined);
        }
        return response;
      } catch {
        return Response.error();
      }
    })(),
  );
});

// Push notifications: display financial alerts sent by the server via web-push.
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  event.waitUntil(
    (async () => {
      // Skip when the app is open and focused: the in-app alert banner already
      // surfaces the alert, so an OS notification would be a duplicate.
      const windowClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      if (windowClients.some((client) => client.focused)) {
        return;
      }

      const { title, body, url, tag } = payload;
      const options = {
        body: body ?? "",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        data: { url: url ?? "/dashboard" },
        tag,
        vibrate: [100, 50, 100],
      };

      await self.registration.showNotification(title ?? "Flowy", options);
    })(),
  );
});

// Open the relevant page when the user taps a notification.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/dashboard";

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clients) {
        if ("focus" in client) {
          await client.focus();
          const navigated = await client.navigate(url).catch(() => null);
          if (navigated) return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
