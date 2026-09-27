// Camac SW — B-3: Cache frames for instant second load, reduce network lag
const CACHE_NAME = 'camac-frames-v3';
const FRAME_CACHE = 'camac-frames';
const STATIC_CACHE = 'camac-static-v3';

const STATIC_ASSETS = [
  './',
  './index.html',
  './assets/css/main.css',
  './assets/js/main.js',
  './assets/js/loader.js',
  './assets/js/hero.js',
  './assets/js/blueprint.js',
  './assets/js/frame-controller.js',
  './assets/js/data.js',
  './loading.mp4'
];

self.addEventListener('install', (e)=>{
  self.skipWaiting();
  e.waitUntil(
    caches.open(STATIC_CACHE).then(c=> c.addAll(STATIC_ASSETS.map(u=> new Request(u, {cache:'reload'}))).catch(()=>{}))
  );
});

self.addEventListener('activate', (e)=>{
  e.waitUntil(
    caches.keys().then(keys=> Promise.all(keys.filter(k=> k!==CACHE_NAME && k!==STATIC_CACHE && k!==FRAME_CACHE).map(k=> caches.delete(k))))
      .then(()=> self.clients.claim())
  );
});

self.addEventListener('fetch', (e)=>{
  const req = e.request;
  const url = new URL(req.url);
  // Only handle GET
  if (req.method !== 'GET') return;
  // Frames: cache-first, stale-while-revalidate
  if (url.pathname.includes('/assets/frames/') && url.pathname.endsWith('.webp')){
    e.respondWith(
      caches.open(FRAME_CACHE).then(async cache=>{
        const cached = await cache.match(req);
        if (cached) {
          // revalidate in background
          fetch(req).then(res=>{
            if (res && res.ok) cache.put(req, res.clone());
          }).catch(()=>{});
          return cached;
        }
        // not in cache, fetch and cache
        try {
          const res = await fetch(req);
          if (res && res.ok){
            cache.put(req, res.clone());
          }
          return res;
        } catch(err){
          // fallback to cache if fetch fails
          return cached || Response.error();
        }
      })
    );
    return;
  }
  // For other assets: network-first, fallback to cache
  if (url.origin === location.origin){
    if (req.destination === 'document' || req.destination === 'script' || req.destination === 'style' || req.destination === 'image'){
      e.respondWith(
        fetch(req).then(res=>{
          if (res && res.ok){
            const clone = res.clone();
            caches.open(STATIC_CACHE).then(c=> c.put(req, clone)).catch(()=>{});
          }
          return res;
        }).catch(()=> caches.match(req))
      );
    }
  }
});
