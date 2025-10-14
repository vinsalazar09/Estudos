// V Estudos — Cronograma Inteligente v3.1
// Service Worker — cache inteligente com atualização automática

const CACHE_NAME = "v-estudos-cache-v3.1";
const urlsToCache = [
  "./",
  "./index.html",
  "./app.js",
  "./manifest.json",
  "./tutorial.html",
  "./tutorial.js",
  "./assets/tutorial.mp4"
];

// Instalação e cache inicial
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("💾 Arquivos armazenados no cache inicial");
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Ativação — limpa versões antigas
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Interceptar requisições (modo offline)
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return (
        response ||
        fetch(event.request).catch(() =>
          new Response("Você está offline. Verifique sua conexão.")
        )
      );
    })
  );
});
