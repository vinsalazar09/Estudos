// SW v4.0 — cache para PWA
const CACHE_NAME = "v-estudos-cache-v4.0";
const urlsToCache = [
  "./","./index.html","./app.js","./pastaManager.js","./themeManager.js",
  "./statsManager.js","./userConfig.js","./scheduler.js","./manifest.json",
  "./tutorial.html","./tutorial.js"
];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(urlsToCache)));
  self.skipWaiting();
});
self.addEventListener("activate", e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e=>{
  e.respondWith(
    caches.match(e.request).then(r=> r || fetch(e.request).catch(()=> new Response("Offline.")))
  );
});
