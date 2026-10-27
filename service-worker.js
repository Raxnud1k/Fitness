const PREFIX='fitness-shell:'+new URL(self.registration.scope).pathname+':';
const CACHE=PREFIX+"44c10565d90f01a9";
const ASSETS=["./.fitness-web-export","./_expo/static/js/web/index-f084ec7057650cb099ed947351422158.js","./favicon.ico","./icons/icon.png","./index.html","./manifest.webmanifest","./metadata.json"];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys()){if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);}await self.clients.claim();})());});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope)||url.pathname.endsWith('.apk'))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  if(event.request.mode==='navigate'){
   try{const response=await fetch(event.request);if(response.ok){await cache.put(new URL('./index.html',self.registration.scope),response.clone());return response;}}catch{}
   return (await cache.match(new URL('./index.html',self.registration.scope)))||Response.error();
  }
  const saved=await cache.match(event.request);if(saved)return saved;
  const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;
 })());
});
