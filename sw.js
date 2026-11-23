/* Motor Manager Pro — service worker.
   Fichiers de l'app : réseau d'abord (mises à jour immédiates), cache en secours hors ligne.
   Bibliothèques CDN : cache d'abord. Ne touche qu'à ses propres caches (préfixe « mmp- »),
   pour ne jamais effacer ceux d'une autre application hébergée sur la même adresse. */
const PREFIX = 'mmp-', CACHE = 'mmp-v13';
const LOCAL = ['./', './index.html', './styles.css', './app.js', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-192.png', './icon-maskable-512.png', './apple-touch-icon.png'];
const LIBS = ['https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css', 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'];
const own = (req, opt) => caches.open(CACHE).then(c => c.match(req, opt));

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all([
      ...LOCAL.map(u => c.add(u).catch(() => {})),
      ...LIBS.map(u => fetch(u, { mode: 'no-cors' }).then(r => c.put(u, r)).catch(() => {}))
    ]);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith(PREFIX) && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.hostname === 'api.github.com') return;
  const store = res => {
    /* on ne met jamais en cache une réponse redirigée ou en erreur : elle empêcherait l'ouverture de l'app */
    if (res && (res.ok || res.type === 'opaque') && !res.redirected) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)).catch(() => {}); }
    return res;
  };
  if (u.origin === location.origin) {
    e.respondWith(fetch(r).then(store).catch(async () =>
      (await own(r, { ignoreSearch: true })) ||
      (r.mode === 'navigate' ? await own('./index.html') : undefined) ||
      new Response('Hors ligne', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })));
  } else {
    e.respondWith(own(r).then(h => h || fetch(r).then(store)));
  }
});
