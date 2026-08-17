// public/sw.js
//
// Two responsibilities, kept intentionally separate:
//   1. Push notification display (existing behavior — preserved)
//   2. Offline-first caching for the PWA/web build (new)
//
// Caching strategy is deliberately NOT "cache the whole site":
//   - App shell (built JS/CSS chunks, fonts, icons, manifest): cache-first,
//     populated on install from a small precache list + opportunistically
//     as pages are visited.
//   - Quran verse/page API responses (api.quran.com, verses.quran.foundation):
//     stale-while-revalidate — serve cached instantly, refresh in background.
//     Safe to cache: public Quran text, not user-specific, not sensitive.
//   - Auth, admin, and any mutating (non-GET) request: NEVER cached,
//     always network-only. This is the "no sensitive data cached" rule.
//   - Everything else (news/events/media/hadith/radio APIs): network-first
//     with a short cache fallback, so a page revisit while offline still
//     shows the last-seen data instead of nothing, but never blocks a
//     fresh load when online.

const CACHE_VERSION = "v1";
const SHELL_CACHE = `shell-${CACHE_VERSION}`;
const QURAN_CACHE = `quran-${CACHE_VERSION}`;
const CONTENT_CACHE = `content-${CACHE_VERSION}`;

const NEVER_CACHE_PATTERNS = [
  /\/api\/auth\//,
  /\/api\/admin\//,
  /\/api\/push\//,
  /\/api\/cron\//,
  /\/api\/media\/?$/, // POST uploads
];

const QURAN_HOST_PATTERNS = [
  /^https:\/\/api\.quran\.com\//,
  /^https:\/\/verses\.quran\.foundation\//,
];

// Minimal precache — offline.html-equivalent for the PWA (root shell) plus
// the manifest/icons. Next.js's hashed JS/CSS chunk filenames aren't known
// at this static file's write time, so those get cached opportunistically
// via the fetch handler below on first visit instead of listed here.
const PRECACHE_URLS = ["/", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => ![SHELL_CACHE, QURAN_CACHE, CONTENT_CACHE].includes(key),
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isNeverCache(url) {
  return NEVER_CACHE_PATTERNS.some((re) => re.test(url.pathname));
}

function isQuranApi(url) {
  return QURAN_HOST_PATTERNS.some((re) => re.test(url.href));
}

function isStaticAsset(url) {
  return (
    url.origin === self.location.origin &&
    (/^\/_next\/static\//.test(url.pathname) ||
      /^\/icons\//.test(url.pathname) ||
      /^\/audio\//.test(url.pathname) || // Adhan sound files
      /\.(?:woff2?|ttf|otf|png|jpg|jpeg|svg|ico)$/.test(url.pathname))
  );
}

function isAppApiRoute(url) {
  return url.origin === self.location.origin && /^\/api\//.test(url.pathname);
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  // Return cached immediately if present; otherwise wait for network.
  return cached || (await networkPromise) || Response.error();
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw new Error("offline and no cache available");
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only GET requests are cacheable; everything else (POST/PATCH/DELETE)
  // always goes straight to the network untouched.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (isNeverCache(url)) {
    return; // let it hit the network normally, no interception
  }

  if (isQuranApi(url)) {
    event.respondWith(staleWhileRevalidate(request, QURAN_CACHE));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  if (isAppApiRoute(url)) {
    // News/events/media/hadith proxy/radio metadata — best available
    // data, never blocks a fresh load, falls back to cache when offline.
    event.respondWith(networkFirst(request, CONTENT_CACHE));
    return;
  }

  // HTML navigations (page loads) — network-first so users always get the
  // latest build when online, falling back to the cached shell/page when
  // offline instead of a browser-level connection error.
  if (request.mode === "navigate") {
    event.respondWith(
      networkFirst(request, SHELL_CACHE).catch(async () => {
        const cache = await caches.open(SHELL_CACHE);
        return (await cache.match("/")) || Response.error();
      }),
    );
  }
});

// ── Push notifications (existing behavior, preserved) ──────────────────
//
// Payload shape matches PushPayload in src/lib/push-server.ts:
//   { title, body, tag }
// tag convention: suffix "-adhan" => stronger vibration + requireInteraction,
// everything else => lighter pulse, auto-dismiss normally.

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "مسجد نور الإيمان", body: event.data.text() };
  }

  const isAdhan =
    typeof payload.tag === "string" && payload.tag.endsWith("-adhan");

  const options = {
    body: payload.body || "",
    tag: payload.tag,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    vibrate: isAdhan ? [300, 150, 300, 150, 300] : [150],
    requireInteraction: isAdhan,
    dir: "rtl",
    lang: "ar",
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
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow("/");
      }),
  );
});
