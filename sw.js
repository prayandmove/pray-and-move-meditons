/* Méditons Ensemble · Pray and Move Generation — service worker (fonctionnement hors connexion) */
const VERSION = '1.9';
const CACHE = 'pamg-med-' + VERSION;
const LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).then(() => c.add(LIB).catch(() => {}))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('pamg-med-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // YouTube (vidéos intégrées) : toujours en direct
  if (/youtube|googlevideo|supabase/.test(url.hostname)) return;
  if (req.mode === 'navigate') {
    // l’app s’ouvre tout de suite depuis le cache, la mise à jour arrive en arrière-plan
    e.respondWith(caches.match('./index.html').then(cached => {
      const net = fetch(req).then(res => { if (res.ok) caches.open(CACHE).then(c => c.put('./index.html', res.clone())); return res; }).catch(() => cached);
      return cached || net;
    }));
    return;
  }
  e.respondWith(caches.match(req).then(cached => {
    const net = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => cached);
    return cached || net;
  }));
});
