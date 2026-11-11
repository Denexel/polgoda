var CACHE = "polgoda-3";

self.addEventListener("install", function (event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (key) {
        return key !== CACHE;
      }).map(function (key) {
        return caches.delete(key);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

function fromNetwork(cache, request) {
  return fetch(request).then(function (res) {
    if (res && res.ok) cache.put(request, res.clone()).catch(function () {});
    return res;
  });
}

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;
  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (/\.(mp3|m4a|aac)$/i.test(url.pathname)) return;
  var shell = url.pathname.endsWith("/") || url.pathname.endsWith("/index.html") || url.pathname.endsWith("/sw.js");
  event.respondWith(caches.open(CACHE).then(function (cache) {
    if (shell) {
      return fromNetwork(cache, request).catch(function () {
        return cache.match(request);
      });
    }
    return cache.match(request).then(function (hit) {
      if (hit) return hit;
      return fromNetwork(cache, request);
    });
  }));
});
