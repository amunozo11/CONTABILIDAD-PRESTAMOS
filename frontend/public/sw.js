// Service Worker — GotaGota PWA
// Estrategia: Cache-First para estáticos, Network-First para API

const CACHE_NAME = 'gotagota-v1';
const API_CACHE = 'gotagota-api-v1';

const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
];

// ─── Instalación ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// ─── Activación ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch Strategy ───────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar WebSocket y extensiones de Chrome
  if (request.url.includes('socket.io') || url.protocol === 'chrome-extension:') return;

  // API calls — Network First con fallback
  if (url.pathname.startsWith('/api/') || url.hostname.includes('api-prestamos')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && request.method === 'GET') {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Next.js static assets — Cache First
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Páginas — Network First
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request) || caches.match('/offline'))
    );
    return;
  }
});

// ─── Background Sync — Cola offline de cobros ────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-cobros') {
    event.waitUntil(syncCobros());
  }
});

async function syncCobros() {
  const db = await openDB();
  const pendientes = await getAllPendientes(db);

  for (const cobro of pendientes) {
    try {
      const response = await fetch('/api/cobros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cobro.token}` },
        body: JSON.stringify(cobro.data),
      });

      if (response.ok) {
        await deletePendiente(db, cobro.id);
        // Notificar al cliente
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
          client.postMessage({ type: 'COBRO_SYNCED', data: cobro.data });
        });
      }
    } catch (err) {
      console.error('Error sync cobro:', err);
    }
  }
}

// ─── Push Notifications ───────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const options = {
    body: data.body || 'Tienes notificaciones pendientes',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Abrir app' },
      { action: 'close', title: 'Cerrar' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'GotaGota', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'open' || !event.action) {
    const url = event.notification.data?.url || '/';
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        for (const client of clients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      })
    );
  }
});

// ─── IndexedDB helpers ────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('gotagota-offline', 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('cobros_pendientes')) {
        db.createObjectStore('cobros_pendientes', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllPendientes(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cobros_pendientes', 'readonly');
    const store = tx.objectStore('cobros_pendientes');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function deletePendiente(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cobros_pendientes', 'readwrite');
    const store = tx.objectStore('cobros_pendientes');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
