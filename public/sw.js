const CACHE_NAME = 'pipeline3d-v3';
const STATIC_ASSETS = [
    '/',
    '/logo.png',
    '/manifest.json',
    '/offline.html',
];

// Only cache files with hashed filenames (Vite build output) or known static assets
const CACHEABLE_EXTENSIONS = ['.js', '.css', '.png', '.jpg', '.svg', '.woff2', '.woff'];
function isCacheableAsset(url) {
    const path = url.pathname;
    if (STATIC_ASSETS.includes(path)) return true;
    if (path.startsWith('/assets/') && CACHEABLE_EXTENSIONS.some(ext => path.endsWith(ext))) return true;
    return false;
}

// ═══ INSTALL — cache core shell + offline page ═══
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

// ═══ ACTIVATE — clean old caches ═══
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// ═══ FETCH — offline-capable strategy ═══
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // API calls: network-first, cache fallback for GET requests (offline mode)
    if (url.pathname.startsWith('/api/')) {
        if (event.request.method === 'GET') {
            event.respondWith(
                fetch(event.request)
                    .then((response) => {
                        if (response.ok) {
                            const clone = response.clone();
                            caches.open(CACHE_NAME + '-api').then((cache) => cache.put(event.request, clone));
                        }
                        return response;
                    })
                    .catch(() =>
                        caches.open(CACHE_NAME + '-api').then((cache) =>
                            cache.match(event.request).then((cached) =>
                                cached || new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } })
                            )
                        )
                    )
            );
        } else {
            // POST/PUT/DELETE: try network, if offline queue for later
            event.respondWith(
                fetch(event.request).catch(() =>
                    new Response(JSON.stringify({ error: 'You are offline. Changes will sync when reconnected.' }), {
                        status: 503,
                        headers: { 'Content-Type': 'application/json' },
                    })
                )
            );
        }
        return;
    }

    // HTML (navigation requests): network-first, fallback to cached app shell, then offline page
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
                .catch(() => caches.match('/').then((cached) => cached || caches.match('/offline.html')))
        );
        return;
    }

    // Static assets: cache-first for hashed build assets
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

// ═══ PUSH NOTIFICATIONS ═══
self.addEventListener('push', (event) => {
    let data = { title: 'Pipeline3D', body: 'You have a new notification', icon: '/logo.png' };
    try {
        if (event.data) data = { ...data, ...event.data.json() };
    } catch { }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon || '/logo.png',
            badge: '/logo.png',
            data: data.url || '/',
            vibrate: [100, 50, 100],
        })
    );
});

// Click notification → open/focus the app
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                clientList[0].focus();
                return;
            }
            clients.openWindow(event.notification.data || '/');
        })
    );
});

// ═══ BACKGROUND SYNC (when back online) ═══
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        event.waitUntil(
            // Notify all clients to refresh data
            self.clients.matchAll().then((clients) => {
                clients.forEach((client) => client.postMessage({ type: 'SYNC_DATA' }));
            })
        );
    }
});
