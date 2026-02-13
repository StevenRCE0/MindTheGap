/// <reference types="@sveltejs/kit" />
import { build, files, version } from "$service-worker";
import { londonGuides } from "$lib/guides";

declare let self: ServiceWorkerGlobalScope;

const CACHE_NAME = `mind-the-gap-${version}`;
const GUIDE_ROUTES = londonGuides.map((guide) => `/guide/${guide.id}`);
const APP_SHELL = Array.from(
  new Set([
    "/",
    "/achievements",
    "/download",
    "/manifest.webmanifest",
    ...GUIDE_ROUTES,
    ...build,
    ...files,
  ]),
);
const APP_SHELL_SET = new Set(APP_SHELL);

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(APP_SHELL);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) => key.startsWith("mind-the-gap-") && key !== CACHE_NAME,
          )
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
          return networkResponse;
        } catch {
          return (
            (await caches.match(request)) ??
            (await caches.match("/")) ??
            new Response("Offline", {
              status: 503,
              headers: { "Content-Type": "text/plain;charset=utf-8" },
            })
          );
        }
      })(),
    );
    return;
  }

  if (APP_SHELL_SET.has(url.pathname)) {
    event.respondWith(
      (async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        const networkResponse = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
        return networkResponse;
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(request);
      const networkPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => null);

      return (
        cachedResponse ??
        (await networkPromise) ??
        new Response("", { status: 504 })
      );
    })(),
  );
});
