// Eva: guarda la app para abrirla sin conexión. Las notas viven en el teléfono (localStorage); plan.json siempre intenta traer lo más nuevo.
const VERSION = "eva-v10";
const SHELL = ["./", "index.html", "app.js", "manifest.json", "plan.json", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];
const DATA = ["plan.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isData = url.origin === location.origin && DATA.some(d => url.pathname.endsWith("/" + d));
  if (isData) { // red primero, copia guardada si no hay conexión
    e.respondWith(fetch(req).then(r => { const k = r.clone(); caches.open(VERSION).then(c => c.put(url.pathname, k)); return r; })
      .catch(() => caches.match(url.pathname).then(r => r || Response.error())));
    return;
  }
  // la app y sus piezas: red primero para estrenar cambios, copia guardada sin conexión
  e.respondWith(fetch(req).then(r => { if (r && (r.ok || r.type === "opaque")) { const k = r.clone(); caches.open(VERSION).then(c => c.put(req, k)); } return r; })
    .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || Response.error())));
});
