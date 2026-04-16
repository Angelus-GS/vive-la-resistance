/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

declare let self: ServiceWorkerGlobalScope;

// Workbox precaching (injected by vite-plugin-pwa)
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Runtime caching for Google Fonts
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: "google-fonts-cache",
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: "gstatic-fonts-cache",
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

registerRoute(
  /^https:\/\/.*\.manus\.storage\..*/i,
  new CacheFirst({
    cacheName: "image-cache",
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// ============================================================
// Rest Timer Notification via Service Worker
// The SW timer context is less aggressively throttled than page
// timers on most mobile browsers, making notifications more reliable.
// ============================================================

let restTimerId: ReturnType<typeof setTimeout> | null = null;

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || !data.type) return;

  if (data.type === "SCHEDULE_REST_NOTIFICATION") {
    // Cancel any existing timer
    if (restTimerId !== null) {
      clearTimeout(restTimerId);
      restTimerId = null;
    }

    const delayMs = (data.seconds || 0) * 1000;
    if (delayMs <= 0) return;

    restTimerId = setTimeout(() => {
      restTimerId = null;
      self.registration.showNotification("Vive la Résistance!", {
        body: "Rest timer complete — time for your next set!",
        tag: "rest-timer-done",
        requireInteraction: false,
        icon: "/icon-192x192.png",
      });
      // Also notify all clients so they can play the bell sound
      self.clients.matchAll({ type: "window" }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "REST_TIMER_DONE" });
        });
      });
    }, delayMs);
  }

  if (data.type === "CANCEL_REST_NOTIFICATION") {
    if (restTimerId !== null) {
      clearTimeout(restTimerId);
      restTimerId = null;
    }
  }
});

// Handle notification click — focus the app window
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if ("focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow("/");
    })
  );
});
