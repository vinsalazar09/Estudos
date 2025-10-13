const CACHE='estudos-pwa-v1';
const ASSETS=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./cronograma.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(self.clients.claim())});
self.addEventListener('fetch',e=>{
  const req=e.request;
  e.respondWith(
    caches.match(req).then(cached=>cached||fetch(req).then(res=>{
      const copy=res.clone();
      if(req.method==='GET' && res.ok){
        caches.open(CACHE).then(c=>c.put(req, copy));
      }
      return res;
    }).catch(()=>caches.match('./')))
  );
});
