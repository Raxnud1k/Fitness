const PREFIX='fitness-shell:'+new URL(self.registration.scope).pathname+':';
const CACHE=PREFIX+"523a40c0cd5d8f02";
const ASSETS=["./_expo/static/js/web/index-6f6f84c0ebed9ddade9adbb80bd0ab67.js","./favicon.ico","./icons/icon.png","./index.html","./manifest.webmanifest","./metadata.json"];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys()){if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);}await self.clients.claim();})());});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
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
