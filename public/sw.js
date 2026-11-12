/* GYMRAT · service worker.
 * Regla de seguridad: solo guarda archivos estáticos (la carpeta de Next, iconos, fuentes e imágenes).
 * NUNCA guarda páginas privadas, respuestas de /api ni nada con cookies de sesión: en un dispositivo
 * compartido, eso podría mostrar los datos de una cuenta a otra persona. */

const VERSION = "gymrat-v1";
const STATIC_CACHE = `${VERSION}-static`;
const SHELL = ["/icons/icon-192.png", "/icons/icon-512.png", "/icons/apple-touch-icon.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("gymrat-") && k !== STATIC_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/** ¿Es un archivo que se puede guardar sin riesgo? */
function isStatic(url) {
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/api/")) return false;
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname === "/manifest.webmanifest"
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (!isStatic(url)) return; // todo lo demás va directo a la red

  event.respondWith(
    caches.open(STATIC_CACHE).then(async (cache) => {
      const hit = await cache.match(request);
      if (hit) return hit;
      const response = await fetch(request);
      if (response.ok && response.type === "basic") cache.put(request, response.clone());
      return response;
    }),
  );
});

/* Recordatorios: la app le pide a la página que muestre la notificación, y aquí la mostramos. */
self.addEventListener("message", (event) => {
  if (event.data?.type !== "show-reminder") return;
  const { title, body, tag, url } = event.data;
  self.registration.showNotification(String(title || "GYMRAT").slice(0, 60), {
    body: String(body || "").slice(0, 160),
    tag: String(tag || "gymrat").slice(0, 60),
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: typeof url === "string" && url.startsWith("/") ? url : "/panel" },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/panel";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const open = clients.find((c) => c.url.includes(target));
      if (open) return open.focus();
      return self.clients.openWindow(target);
    }),
  );
});
