const CACHE_NAME = "static-cache-v3";
const DATA_CACHE_NAME = "data-cache-v4";

const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/index.js",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
    "https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css",
    "https://cdn.jsdelivr.net/npm/chart.js@2.8.0",
];

// Service Worker Install
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => cache.addAll(FILES_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

// Service Worker Activate
self.addEventListener("activate", (event) => {
    const currentCache = [CACHE_NAME, DATA_CACHE_NAME];

    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) => {
                return cacheNames.filter((name) => !currentCache.includes(name));
            })
            .then((cachesToDelete) => {
                return Promise.all(cachesToDelete.map((name) => caches.delete(name)));
            })
            .then(() => self.clients.claim())
    );
});

// Service Worker Fetch
self.addEventListener("fetch", (event) => {
    if (
        event.request.method !== "GET" ||
        !event.request.url.startsWith(self.location.origin)
    ) {
        event.respondWith(fetch(event.request));
        return;
    }

    if (event.request.url.includes("/api/")) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return fetch(event.request)
                    .then((response) => {
                        cache.put(event.request, response.clone());

                        return response;
                    })
                    .catch(() => caches.match(event.request));
            })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            caches.open(CACHE_NAME).then((response) => {
                return response || fetch(event.request);
            });
        })
    );
});