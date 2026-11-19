const SHELL_CACHE = "visorgis-tech-shell-v1";
const STATIC_CACHE = "visorgis-tech-static-v1";
const MAP_TILES_CACHE = "visorgis-map-tiles-v1";

const PRECACHE_ASSETS = [
  "/hero-icons/mis-asignaciones.webp",
  "/technician-routes/pending-assignment.webp",
  "/technician-routes/in-progress.webp",
  "/technician-routes/servicio-corte.webp",
  "/technician-routes/servicio-reconexion.webp",
  "/technician-routes/meter.webp",
  "/technician-routes/failed.webp",
  "/technician-routes/success.webp",
  "/technician-routes/stop-info.webp",
  "/stop-status/pending.webp",
  "/stop-status/completed.webp",
  "/stop-status/in_process.webp",
  "/stop-status/failed.webp",
  "/stop-status/in_transit.gif",
  "/navigation-map/vehicle.webp",
  "/navigation-map/start-point.webp",
  "/navigation-map/stop-point.webp",
  "/navigation-map/failed-stop.webp",
  "/navigation-map/observation-stop.webp",
  "/navigation-map/completed-stop.webp",
  "/assignment-route/corte.webp",
  "/assignment-route/reconexion.webp",
  "/assignment-route/fecha.webp",
  "/assignment-route/distancia.webp",
  "/assignment-route/casas.webp",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      await Promise.allSettled(
        PRECACHE_ASSETS.map((asset) =>
          fetch(asset, { credentials: "same-origin" })
            .then((res) => {
              if (res.ok) return cache.put(asset, res);
            })
            .catch(() => {})
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const validCaches = new Set([SHELL_CACHE, STATIC_CACHE, MAP_TILES_CACHE, "water-meter-yolo-model-v2"]);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !validCaches.has(k))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

function isTechnicianShellRoute(pathname) {
  return (
    pathname === "/mis-asignaciones" ||
    pathname.startsWith("/mis-asignaciones/")
  );
}

function isStaticCacheablePath(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/technician-routes/") ||
    pathname.startsWith("/stop-status/") ||
    pathname.startsWith("/navigation-map/") ||
    pathname.startsWith("/assignment-route/") ||
    pathname.startsWith("/hero-icons/") ||
    pathname.startsWith("/navigation-icons/") ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/models/") ||
    pathname.startsWith("/ort-wasm/")
  );
}

function isMapTileUrl(url) {
  return url.hostname.endsWith("tile.openstreetmap.org");
}

function getShellCacheKey(request, url) {
  const isRsc =
    url.searchParams.has("_rsc") ||
    request.headers.get("RSC") === "1";
  if (isRsc) {
    return `${url.origin}${url.pathname}?__rsc=1`;
  }
  return `${url.origin}${url.pathname}`;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Nunca interceptar llamadas API (las gestiona IndexedDB + Cola FIFO) ni auth endpoints
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/"))
  ) {
    return;
  }

  // 1. Tiles del mapa OpenStreetMap: Network-first con fallback a caché para mapa offline
  if (isMapTileUrl(url)) {
    event.respondWith(
      caches.open(MAP_TILES_CACHE).then(async (cache) => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && (networkResponse.ok || networkResponse.type === "opaque")) {
            cache.put(request, networkResponse.clone()).catch(() => {});
          }
          return networkResponse;
        } catch {
          const cached = await cache.match(request);
          if (cached) return cached;
          return new Response("", { status: 504, statusText: "Tile Offline" });
        }
      })
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // 2. Activos estáticos (chunks JS/CSS, iconos 3D, modelo ONNX, WASM): Cache-First con actualización de red si falta
  if (isStaticCacheablePath(url.pathname)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request, { ignoreSearch: url.pathname.startsWith("/icons/") });
        if (cached) return cached;
        try {
          const netRes = await fetch(request);
          if (netRes && netRes.ok) {
            cache.put(request, netRes.clone()).catch(() => {});
          }
          return netRes;
        } catch {
          return new Response("", { status: 504, statusText: "Asset Offline" });
        }
      })
    );
    return;
  }

  // 3. Apertura de PWA instalada desde start_url ("/") sin conexión: redirigir al portal cacheado del técnico
  if (url.pathname === "/" && request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const shellCache = await caches.open(SHELL_CACHE);
          const hasPortal = await shellCache.match(`${url.origin}/mis-asignaciones`);
          if (hasPortal) {
            return new Response(
              '<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/mis-asignaciones"></head><body><script>window.location.replace("/mis-asignaciones");</script></body></html>',
              {
                status: 200,
                headers: { "Content-Type": "text/html; charset=utf-8" },
              }
            );
          }
          return new Response("Sin conexión a internet.", { status: 503 });
        }
      })()
    );
    return;
  }

  // 4. Rutas del Técnico (/mis-asignaciones y /mis-asignaciones/[id]): Network-First + App Shell Cache Fallback
  if (isTechnicianShellRoute(url.pathname)) {
    const cacheKey = getShellCacheKey(request, url);

    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.ok && !networkResponse.redirected) {
            cache.put(cacheKey, networkResponse.clone()).catch(() => {});
          }
          return networkResponse;
        } catch {
          const exactCached = await cache.match(cacheKey);
          if (exactCached) return exactCached;

          // Fallback para navegación directa a un [id] si ya existe shell cacheado del mismo tipo
          if (request.mode === "navigate" && url.pathname.startsWith("/mis-asignaciones/")) {
            const keys = await cache.keys();
            const detailFallbackKey = keys.find(
              (k) =>
                k.url.startsWith(`${url.origin}/mis-asignaciones/`) &&
                !k.url.includes("?__rsc=1")
            );
            if (detailFallbackKey) {
              const fallbackRes = await cache.match(detailFallbackKey);
              if (fallbackRes) return fallbackRes;
            }
          }

          if (request.mode === "navigate") {
            const portalFallback = await cache.match(`${url.origin}/mis-asignaciones`);
            if (portalFallback) return portalFallback;
          }

          return new Response(
            JSON.stringify({ offline: true, message: "Recurso no cacheado sin conexión." }),
            {
              status: 503,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      })
    );
  }
});

self.addEventListener("message", (event) => {
  const payload = event.data;
  if (!payload || payload.type !== "WARM_URLS" || !Array.isArray(payload.urls)) {
    return;
  }

  const warmPromise = (async () => {
    const [shellCache, staticCache] = await Promise.all([
      caches.open(SHELL_CACHE),
      caches.open(STATIC_CACHE),
    ]);

    const uniqueUrls = Array.from(new Set(payload.urls.filter((u) => typeof u === "string")));

    await Promise.allSettled(
      uniqueUrls.map(async (rawUrl) => {
        let parsed;
        try {
          parsed = new URL(rawUrl, self.location.origin);
        } catch {
          return;
        }
        if (parsed.origin !== self.location.origin) return;

        if (isStaticCacheablePath(parsed.pathname)) {
          const existing = await staticCache.match(parsed.href);
          if (existing) return;
          const res = await fetch(parsed.href, { credentials: "same-origin" });
          if (res && res.ok) {
            await staticCache.put(parsed.href, res);
          }
          return;
        }

        if (isTechnicianShellRoute(parsed.pathname)) {
          const docUrl = `${parsed.origin}${parsed.pathname}`;
          const rscKey = `${docUrl}?__rsc=1`;

          const [docRes, rscRes] = await Promise.allSettled([
            fetch(docUrl, { credentials: "same-origin" }),
            fetch(docUrl, {
              credentials: "same-origin",
              headers: { RSC: "1" },
            }),
          ]);

          if (docRes.status === "fulfilled" && docRes.value.ok && !docRes.value.redirected) {
            await shellCache.put(docUrl, docRes.value);
          }
          if (rscRes.status === "fulfilled" && rscRes.value.ok && !rscRes.value.redirected) {
            await shellCache.put(rscKey, rscRes.value);
          }
        }
      })
    );
  })();

  event.waitUntil(warmPromise);
});
