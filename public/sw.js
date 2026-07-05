// public/sw.js

const CACHE_NAME = "masjid-noor-v1";
const STATIC_ASSETS = [
  "/ar",
  "/ar/prayer-times",
  "/ar/adhkar",
  "/ar/radio",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only handle http/https — skip chrome-extension, data, etc.
  if (!url.protocol.startsWith("http")) return;
  if (event.request.method !== "GET") return;
  if (url.pathname.startsWith("/api/")) return;

  // Range requests (audio/video seeking) always get a 206 back, and the
  // Cache API refuses to store partial responses. Just pass these straight
  // through the network without ever touching the cache.
  if (event.request.headers.has("range")) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache full, successful, basic (same-origin) responses.
        // Opaque cross-origin responses and any non-200 (including 206
        // partial content) must never be passed to cache.put().
        if (
          response.ok &&
          response.status === 200 &&
          response.type === "basic"
        ) {
          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone))
            .catch(() => {
              // Ignore cache write failures — the response is still
              // returned to the page either way.
            });
        }
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});

// ── Push notifications (prayer times) ──────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "مسجد نور الإيمان", body: event.data.text() };
  }

  const isAdhan = payload.tag?.endsWith("-adhan");

  const options = {
    body: payload.body || "",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    tag: payload.tag,
    dir: "rtl",
    lang: "ar",
    // Distinct pulse pattern for the Adhan moment vs. the 10-min heads-up / iqamah
    vibrate: isAdhan ? [300, 100, 300, 100, 300, 100, 300] : [200, 100, 200],
    // Adhan notification stays on screen until the user dismisses it —
    // heads-up/iqamah ones can auto-dismiss as usual
    requireInteraction: isAdhan,
    renotify: true, // makes the vibration/alert re-trigger even if tag repeats
  };

  event.waitUntil(
    self.registration.showNotification(
      payload.title || "مسجد نور الإيمان",
      options,
    ),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/");
    }),
  );
});
