// Resume Tailor Service Worker - v1.0.0
// Strict PWA security: Never cache sensitive user documents, Auth0 tokens, or API responses.

const CACHE_NAME = 'resume-tailor-v1';

const PRECACHE_ASSETS = [
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/icon.svg',
];

// Install Event: Precaches shell assets & immediately takes control
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate Event: Purges legacy caches & claims clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch Event: Robust caching with strict security boundaries
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Only handle same-origin GET requests
  if (request.method !== 'GET' || !url.origin.startsWith(self.location.origin)) {
    return;
  }

  // 2. CRITICAL SECURITY: Never cache API routes or Auth0 endpoints
  // All user data, resume downloads, tokens, and DB operations must remain network-only
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.includes('/_next/data/')
  ) {
    event.respondWith(
      fetch(request).catch(() => {
        // Return structured offline JSON response if user is offline during an API call
        return new Response(
          JSON.stringify({
            error: 'You are currently offline. Please reconnect to use AI and cloud sync.',
            offline: true,
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })
    );
    return;
  }

  // 3. Page Navigations: Network-first with graceful offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If valid response, return it directly
          if (response && response.status === 200) {
            return response;
          }
          return response;
        })
        .catch(() => {
          // Network failed, serve the beautiful offline fallback
          return caches.match('/offline.html');
        })
    );
    return;
  }

  // 4. Static assets (JS chunks, CSS, fonts, icons): Cache-first with network fallback
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|woff2|woff|ttf|css|js)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((networkResponse) => {
            if (
              !networkResponse ||
              networkResponse.status !== 200 ||
              networkResponse.type !== 'basic'
            ) {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });

            return networkResponse;
          })
          .catch(() => {
            // Return null or placeholder if image fails
            return null;
          });
      })
    );
    return;
  }

  // 5. Default fallback to network
  event.respondWith(fetch(request));
});
