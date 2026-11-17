/* Service worker: lets the simulator be added to a phone's home screen and open like an app, and keeps it working
   with no signal once it has been opened once. The site's own files are always fetched fresh from the server first
   (so an update shows at once, as the no-cache launchers intend) and kept as a fallback for when the network is gone.
   Sounds and music (audio/) and byte-range requests go straight to the server and are never stored here: they are big,
   they stream, and the owner's soundtracks belong only on their own machine. Other sites (the live data, fonts) are left alone. */
const CACHE='park-sim-v1';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==location.origin||r.headers.has('range')||/\/audio\//.test(u.pathname))return;
 e.respondWith(fetch(r).then(res=>{if(res.ok&&res.status===200&&res.type==='basic'){const cp=res.clone();caches.open(CACHE).then(c=>c.put(u.origin+u.pathname,cp))}return res})
  .catch(()=>caches.match(u.origin+u.pathname).then(m=>m||(r.mode==='navigate'?caches.match(new URL('./',location).href):undefined)).then(m=>m||Response.error())))});
