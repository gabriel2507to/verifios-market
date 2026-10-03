const CACHE_NAME = 'verifiosmarket-v1';
const ASSETS = [
  'index.html',
  'manifest.json',
  'img/logo-app.png',
  'img/logo-app-512.png'
];

// 1. Instalación: Guarda los archivos en caché
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting(); // Fuerza a que el nuevo Service Worker se active de inmediato
});

// 2. Activación: Limpia las cachés viejas si cambias de versión
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Borrando caché antigua:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Interceptar peticiones (Estrategia: Network First / Red primero)
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // IGNORAR: Si no es método GET (como los POST/PUT de Firebase) o es una API externa, no intentamos cachear
  if (e.request.method !== 'GET' || url.origin.includes('firestore.googleapis.com') || url.origin.includes('firebase')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Lógica normal para archivos estáticos de tu app
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        // Si hay internet, actualizamos la caché solo para peticiones GET válidas
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // Si NO hay internet, rescatamos la versión guardada en el caché
        return caches.match(e.request);
      })
  );
});
