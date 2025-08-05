/**
 * Service Worker para Roteiros de Dispensação
 * Implementa cache offline e sincronização em segundo plano
 */

const CACHE_NAME = 'roteiros-dispensacao-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Assets essenciais para cache
const STATIC_ASSETS = [
  '/',
  '/chat',
  '/dashboard',
  '/modules',
  '/resources',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.webmanifest'
];

// APIs para cache dinâmico
const API_CACHE_PATTERNS = [
  /\/api\/personas/,
  /\/api\/chat/
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting(); // Ativar imediatamente
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Remover caches antigos
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim(); // Controlar todas as abas
      })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requisições não-GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Estratégia Cache First para assets estáticos
  if (STATIC_ASSETS.some(asset => url.pathname === asset) || 
      url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // Estratégia Network First para APIs
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Estratégia Stale While Revalidate para páginas
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  
  // Deixar outras requisições passarem normalmente
});

/**
 * Estratégia Cache First
 * Busca primeiro no cache, depois na rede
 */
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Estratégia Network First
 * Busca primeiro na rede, depois no cache
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback para APIs
    if (request.url.includes('/api/personas')) {
      return new Response(JSON.stringify({
        'dr-gasnelio': {
          name: 'Dr. Gasnelio',
          personality: 'Técnico e preciso',
          avatar: '👨‍⚕️'
        },
        'ga': {
          name: 'Gá',
          personality: 'Empático e acolhedor',
          avatar: '🤗'
        }
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    }
    
    return new Response('Offline - Tente novamente quando estiver conectado', { 
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * Estratégia Stale While Revalidate
 * Retorna do cache imediatamente e atualiza em segundo plano
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Buscar na rede em paralelo
  const networkPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);
  
  // Retornar cache imediatamente se disponível
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Esperar pela rede se não há cache
  return networkPromise || new Response('Offline', { status: 503 });
}

// Sincronização em segundo plano
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

/**
 * Sincronização de dados em segundo plano
 */
async function doBackgroundSync() {
  try {
    // Sincronizar dados críticos quando online
    console.log('[SW] Performing background sync');
    
    // Atualizar cache de personas
    const personas = await fetch('/api/personas');
    if (personas.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(new Request('/api/personas'), personas);
    }
    
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Notificações push (futuro)
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Nova mensagem disponível',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'roteiros-notification'
  };
  
  event.waitUntil(
    self.registration.showNotification('Roteiros de Dispensação', options)
  );
});

// Cleanup periódico do cache
setInterval(() => {
  cleanupCache();
}, 60 * 60 * 1000); // A cada hora

async function cleanupCache() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();
    
    // Remover entradas antigas (mais de 1 dia)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const dateHeader = response.headers.get('date');
        if (dateHeader && new Date(dateHeader).getTime() < oneDayAgo) {
          await cache.delete(request);
          console.log('[SW] Cleaned old cache entry:', request.url);
        }
      }
    }
  } catch (error) {
    console.error('[SW] Cache cleanup failed:', error);
  }
}