/* Motor Manager Pro — installation (PWA) et mode hors ligne. Nécessite http(s) ou localhost. */
const C='mmp-v3';
const SHELL=['./','index.html','styles.css','app.js','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png'];
const LIBS=['https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css','https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css','https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js','https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js','https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'];
self.addEventListener('install',e=>{e.waitUntil((async()=>{const c=await caches.open(C);await Promise.all([...SHELL.map(u=>c.add(u).catch(()=>{})),...LIBS.map(u=>fetch(u,{mode:'no-cors'}).then(r=>c.put(u,r)).catch(()=>{}))]);self.skipWaiting()})())});
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==C)await caches.delete(k);await clients.claim()})()));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.hostname==='api.github.com')return;
  e.respondWith((async()=>{
    const c=await caches.open(C),m=await c.match(e.request,{ignoreSearch:true});
    const n=fetch(e.request).then(r=>{if(r.ok||r.type==='opaque')c.put(e.request,r.clone());return r}).catch(()=>null);
    if(m){e.waitUntil(n);return m}
    const r=await n;if(r)return r;
    if(e.request.mode==='navigate'){const i=await c.match('index.html');if(i)return i}
    return new Response('Hors ligne',{status:503});
  })());
});
