/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST?: Array<{ url: string; revision?: string | null }> };

const manifest = Array.isArray(self.__WB_MANIFEST) ? self.__WB_MANIFEST : [];
precacheAndRoute(manifest);

self.skipWaiting();
self.clients.claim();

self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() ?? {};
  const scope = self.registration.scope.replace(/\/$/, '');
  const icon = `${scope}/pwa-192x192.png`;
  event.waitUntil(
    self.registration.showNotification(data.title || 'EdSchool', {
      body: data.body ?? '',
      icon,
      badge: icon,
      data: { url: data.url ?? '/' },
    })
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const url = event.notification.data?.url ?? self.registration.scope;
  const fullUrl = url.startsWith('http') ? url : self.location.origin + (url.startsWith('/') ? url : `/${url}`);
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.navigate(fullUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(fullUrl);
      }
    })
  );
});
