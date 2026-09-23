importScripts("./js/offline-assets.js");
const CACHE = "downdog-v5";
const ASSETS = [
  "./", "./index.html", "./routines.json", "./css/app.css",
  "./js/app.js", "./js/session.js", "./js/audio.js", "./js/cues.js",
  "./js/poses.js", "./js/offline-assets.js", "./manifest.webmanifest",
  "./fonts/fraunces.woff2", "./fonts/instrument-sans.woff2",
  "./icons/icon.svg", "./icons/icon-180.png", "./icons/icon-192.png", "./icons/icon-512.png",
  ...self.OFFLINE_MEDIA,
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE)
    .then((cache) => cache.addAll(ASSETS))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys
      .filter((key) => key.startsWith("downdog-") && key !== CACHE)
      .map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

// Safari asks for byte ranges when playing media, including cached audio.
async function rangedResponse(response, range) {
  const data = await response.arrayBuffer();
  const size = data.byteLength;
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  let start = NaN;
  let end = NaN;
  if (match && (match[1] || match[2])) {
    start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
    end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }
  const headers = new Headers(response.headers);
  headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Content-Length", String(end - start + 1));
  headers.set("Accept-Ranges", "bytes");
  return new Response(data.slice(start, end + 1), { status: 206, headers });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request.url);
    if (cached) {
      const range = request.headers.get("Range");
      return range ? rangedResponse(cached, range) : cached;
    }
    try {
      const response = await fetch(request);
      if (response.status === 200 && response.type === "basic") {
        event.waitUntil(cache.put(request, response.clone()));
      }
      return response;
    } catch {
      if (request.mode === "navigate") {
        const page = await cache.match("./index.html");
        if (page) return page;
      }
      return Response.error();
    }
  })());
});
