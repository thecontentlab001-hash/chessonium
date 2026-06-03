// Service Worker stub for PWA installation capabilities

self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker active.");
});

self.addEventListener("fetch", (event) => {
  // Pass-through network fetch handler
  event.respondWith(fetch(event.request));
});
