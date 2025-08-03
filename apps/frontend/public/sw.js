// Service Worker v3.0 - Robust and Error-Free
const CACHE_VERSION = 'v3';
const CACHE_NAME = `dispensacao-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

// Essential assets for offline functionality
const ESSENTIAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.tsx',
  '/src/styles/globals.css'
];

// Cache strategies by URL pattern
const CACHE_STRATEGIES = {
  networkFirst: [
    /\/api\//,
    /\.json$/,
    /\/src\//
  ],
  cacheFirst: [
    /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
    /\.(?:woff|woff2|ttf|otf|eot)$/,
    /\.(?:css|js|tsx|ts)$/
  ],
  networkOnly: [
    /\/auth\//,
    /\/admin\//,
    /google-analytics/,
    /gtag/
  ]
};

// Installation
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker v3.0...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching essential assets');
        return cache.addAll(ESSENTIAL_ASSETS).catch(error => {
          console.warn('[SW] Failed to cache some assets:', error);
          // Continue installation even if some assets fail
          return Promise.resolve();
        });
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// Activation
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker v3.0...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('[SW] Removing old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
    .then(() => {
      console.log('[SW] Activation complete');
    })
    .catch(error => {
      console.error('[SW] Activation failed:', error);
    })
  );
});

// Fetch with intelligent strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests unless they're assets
  if (url.origin !== location.origin && !isAssetRequest(url)) {
    return;
  }
  
  // Skip chrome-extension and other special protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Determine strategy based on URL
  const strategy = getStrategy(url);
  
  event.respondWith(handleRequest(request, strategy));
});

// Strategy determination
function getStrategy(url) {
  const pathname = url.pathname;
  
  // Check networkOnly patterns first
  for (const pattern of CACHE_STRATEGIES.networkOnly) {
    if (pattern.test(pathname)) {
      return 'networkOnly';
    }
  }
  
  // Check cacheFirst patterns
  for (const pattern of CACHE_STRATEGIES.cacheFirst) {
    if (pattern.test(pathname)) {
      return 'cacheFirst';
    }
  }
  
  // Check networkFirst patterns
  for (const pattern of CACHE_STRATEGIES.networkFirst) {
    if (pattern.test(pathname)) {
      return 'networkFirst';
    }
  }
  
  // Default strategy
  return 'networkFirst';
}

// Request handlers
async function handleRequest(request, strategy) {
  try {
    switch (strategy) {
      case 'networkFirst':
        return await networkFirst(request);
      case 'cacheFirst':
        return await cacheFirst(request);
      case 'networkOnly':
        return await fetch(request);
      default:
        return await networkFirst(request);
    }
  } catch (error) {
    console.error('[SW] Request handling failed:', error);
    return createErrorResponse();
  }
}

// Network First strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request.clone(), networkResponse.clone()).catch(error => {
        console.warn('[SW] Failed to cache response:', error);
      });
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // No cache available, return error response
    if (request.mode === 'navigate') {
      return createOfflineResponse();
    }
    
    throw error;
  }
}

// Cache First strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background (stale-while-revalidate)
    fetch(request).then(response => {
      if (response.ok) {
        caches.open(RUNTIME_CACHE).then(cache => {
          cache.put(request, response);
        });
      }
    }).catch(() => {
      // Ignore background update errors
    });
    
    return cachedResponse;
  }
  
  // Not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request.clone(), networkResponse.clone()).catch(() => {
        // Ignore cache errors
      });
    }
    
    return networkResponse;
  } catch (error) {
    // Return placeholder for images
    if (isImageRequest(request)) {
      return createImagePlaceholder();
    }
    
    throw error;
  }
}

// Utility functions
function isAssetRequest(url) {
  return /\.(css|js|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|otf|ico)$/i.test(url.pathname);
}

function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(png|jpg|jpeg|svg|gif|webp)$/i.test(new URL(request.url).pathname);
}

function createErrorResponse() {
  return new Response('Service Worker Error', {
    status: 500,
    statusText: 'Service Worker Error',
    headers: { 'Content-Type': 'text/plain' }
  });
}

function createOfflineResponse() {
  const offlineHTML = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - Roteiro de Dispensação</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: #f5f5f5;
          color: #333;
        }
        .offline-container {
          text-align: center;
          padding: 2rem;
          max-width: 500px;
        }
        .offline-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        h1 {
          color: #1976d2;
          margin-bottom: 1rem;
        }
        p {
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }
        .retry-btn {
          background: #1976d2;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
        }
        .retry-btn:hover {
          background: #1565c0;
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-icon">📡</div>
        <h1>Você está offline</h1>
        <p>Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.</p>
        <button class="retry-btn" onclick="window.location.reload()">Tentar Novamente</button>
      </div>
    </body>
    </html>
  `;
  
  return new Response(offlineHTML, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

function createImagePlaceholder() {
  // Simple 1x1 transparent PNG
  const transparentPNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  return fetch(transparentPNG);
}

// Background sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  console.log('[SW] Synchronizing data...');
  try {
    // Implement your data sync logic here
    // For example, sync offline actions, analytics, etc.
    console.log('[SW] Data sync completed');
  } catch (error) {
    console.error('[SW] Data sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nova atualização disponível',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Abrir App',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icons/icon-96x96.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Roteiro de Dispensação', options)
  );
});

// Notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Error handling
self.addEventListener('error', event => {
  console.error('[SW] Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

console.log('[SW] Service Worker v3.0 loaded successfully');