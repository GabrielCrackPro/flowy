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
      const { title, body, url, tag } = payload;
      const options = {
        body: body ?? "",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        data: { url: url ?? "/dashboard" },
        tag,
        vibrate: [100, 50, 100],
      };

      // When the app is open and focused, skip the OS notification (the
      // in-app realtime banner already surfaces the alert) but message the
      // client so it refetches immediately as a fallback if realtime drops.
      // Test pushes always surface as OS notifications so the user can
      // verify end-to-end delivery even with the app focused.
      const isTest = typeof tag === "string" && tag.startsWith("flowy-test");
      const focused = windowClients.find((client) => client.focused);
      if (focused && !isTest) {
        focused.postMessage({
          type: "PUSH_RECEIVED",
          payload: { title, body, url, tag },
        });
        return;
      }

      await self.registration.showNotification(title ?? "Flowy", options);
    })(),
  );
});

// ── Background Sync ────────────────────────────────────────────────
// When connectivity returns, the browser fires a "sync" event for any
// registered tag. The SW reads pending offline mutations from IndexedDB
// and replays them — even if no client tab is open.

const SYNC_TAG = "flowy-offline-queue";

/** List all per-user offline databases by scanning IndexedDB names. */
async function listOfflineDbNames() {
  if (!("databases" in indexedDB)) return [];
  try {
    const dbs = await indexedDB.databases();
    return dbs
      .filter((db) => db.name?.startsWith("flowy-offline-"))
      .map((db) => db.name.slice("flowy-offline-".length));
  } catch {
    return [];
  }
}

/** Open a per-user offline database from the SW context. */
function openSwDb(userId) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(`flowy-offline-${userId}`, 2);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Read the stored Supabase session from the user's IDB. */
async function getSwSession(userId) {
  try {
    const db = await openSwDb(userId);
    try {
      return new Promise((resolve, reject) => {
        const tx = db.transaction("session", "readonly");
        const req = tx.objectStore("session").get("supabase");
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => reject(req.error);
      });
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

/** Get all pending mutations for a user. */
async function getSwPendingMutations(userId) {
  const db = await openSwDb(userId);
  try {
    return new Promise((resolve, reject) => {
      const tx = db.transaction("queue", "readonly");
      const idx = tx.objectStore("queue").index("status");
      const req = idx.getAll("pending");
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

/** Remove synced mutations by id. */
async function removeSwMutations(userId, ids) {
  if (ids.length === 0) return;
  const db = await openSwDb(userId);
  try {
    return new Promise((resolve, reject) => {
      const tx = db.transaction("queue", "readwrite");
      for (const id of ids) {
        tx.objectStore("queue").delete(id);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

/** Fetch an API endpoint with the stored auth token. */
async function swFetch(path, options, token) {
  const resp = await fetch(path, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!resp.ok) {
    throw new Error(`SW fetch failed: ${resp.status} ${path}`);
  }
  return resp.json();
}

self.addEventListener("sync", (event) => {
  if (event.tag !== SYNC_TAG) return;

  event.waitUntil(
    (async () => {
      const userIds = await listOfflineDbNames();
      for (const userId of userIds) {
        const session = await getSwSession(userId);
        if (!session || Date.now() > session.expiresAt * 1000) continue;

        const mutations = await getSwPendingMutations(userId);
        if (mutations.length === 0) continue;

        const synced = [];
        for (const m of mutations) {
          try {
            const base = `/api/${m.entityKey}`;
            if (m.type === "create") {
              await swFetch(
                base,
                { method: "POST", body: JSON.stringify(m.input) },
                session.accessToken,
              );
            } else if (m.type === "update") {
              const { id, data } = m.input;
              await swFetch(
                `${base}/${id}`,
                { method: "PATCH", body: JSON.stringify(data) },
                session.accessToken,
              );
            } else if (m.type === "delete") {
              await swFetch(
                `${base}/${m.input}`,
                { method: "DELETE" },
                session.accessToken,
              );
            }
            synced.push(m.id);
          } catch {
            // Individual mutation failure doesn't block others
          }
        }

        if (synced.length > 0) {
          await removeSwMutations(userId, synced);
        }
      }
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
