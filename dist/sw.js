"use strict";

const scope = self.registration.scope;
const cachePrefix = "ingles-em-10:" + scope;
const cacheName = cachePrefix + "v2";
const appHome = new URL("./", scope).href;
const appIndex = new URL("index.html", scope).href;
const appFiles = [
  "./", "index.html", "style.css", "app.js", "words.js", "vocabulary.js", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png"
].map((path) => new URL(path, scope).href);
const appFileUrls = new Set(appFiles);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(appFiles)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    const previous = names.filter((name) => name.startsWith(cachePrefix) && name !== cacheName);
    await Promise.all(previous.map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  url.search = "";
  const isHome = request.mode === "navigate" && (url.href === appHome || url.href === appIndex);
  const cacheKey = isHome ? url.href : request.url;
  if (!appFileUrls.has(cacheKey)) return;
  event.respondWith(loadAppFile(request, cacheKey));
});

async function loadAppFile(request, cacheKey) {
  const cache = await caches.open(cacheName);
  let response;
  try {
    response = await fetch(request);
  } catch {
    return await cache.match(cacheKey) || Response.error();
  }
  if (response.ok) {
    try {
      await cache.put(cacheKey, response.clone());
    } catch {
      // Storage limits should not prevent loading a successful network response.
    }
  }
  return response;
}
