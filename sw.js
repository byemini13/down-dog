const CACHE = "downdog-v4";

const ASSETS = [
  "./",
  "./index.html",
  "./routines.json",
  "./css/app.css",
  "./js/app.js",
  "./js/session.js",
  "./js/audio.js",
  "./js/poses.js",
  "./manifest.webmanifest",
  "./fonts/fraunces.woff2",
  "./fonts/instrument-sans.woff2",
  "./icons/icon.svg",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./poses/reclined_figure_4.svg",
  "./poses/low_lunge.svg",
  "./poses/lizard.svg",
  "./poses/pigeon.svg",
  "./poses/shoelace.svg",
  "./poses/knee_to_chest.svg",
  "./poses/supine_twist.svg",
  "./poses/seated_half_fold.svg",
  "./poses/open_book.svg",
  "./poses/seated_figure_4.svg",
  "./poses/half_split.svg",
  "./poses/reclined_hamstring.svg",
  "./poses/deep_lunge_quad.svg",
  "./poses/sleeping_swan.svg",
  "./poses/deer.svg",
  "./poses/dragon.svg",
  "./poses/seated_side_bend.svg",
  "./poses/reclined_twist.svg",
  "./poses/meditation.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
