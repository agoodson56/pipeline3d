const CACHE_NAME = 'pipeline3d-v2';
const STATIC_ASSETS = [
    '/',
    '/logo.png',
    '/manifest.json',
];

// Only cache files with hashed filenames (Vite build output) or known static assets
const CACHEABLE_EXTENSIONS = ['.js', '.css', '.png', '.jpg', '.svg', '.woff2', '.woff'];
function isCacheableAsset(url) {
    const path = url.pathname;
    // Always cache known static assets
    if (STATIC_ASSETS.includes(path)) return true;
    // Cache Vite build assets (contain hash in filename)
    if (path.startsWith('/assets/') && CACHEABLE_EXTENSIONS.some(ext => path.endsWith(ext))) return true;
    return false;
}

// Install — cache core shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch — network-first for API & HTML, cache-first for hashed assets only
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // API calls: network only (real-time data)
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(fetch(event.request).catch(() => new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } })));
        return;
    }

    // HTML (navigation requests): network-first, fallback to cache
    if (event.request.mode === 'navigate' || event.request.headers.get('Accept')?.includes('text/html')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    }
                    return response;
                })
                .catch(() => caches.match('/'))
        );
        return;
    }

    // Static assets: cache-first, but ONLY cache known safe assets
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
                if (response.ok && event.request.method === 'GET' && isCacheableAsset(url)) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            });
        }).catch(() => caches.match('/'))
    );
});
