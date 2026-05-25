// Daily Word — Service Worker for Push Notifications

const CACHE_NAME = 'daily-word-v1';

// Install event
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Push notification received
self.addEventListener('push', (event) => {
  const defaultData = {
    title: '📖 Daily Word Reminder',
    body: "Have you spent time in God's Word today?",
    icon: '/icons/cross.svg',
    badge: '/icons/cross.svg',
    data: { url: '/' },
  };

  let notificationData = defaultData;

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        ...defaultData,
        ...payload,
      };
    } catch (e) {
      notificationData.body = event.data.text() || defaultData.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      vibrate: [200, 100, 200],
      tag: 'daily-word-reminder',
      renotify: true,
      data: notificationData.data,
      actions: [
        { action: 'open', title: '📖 Open Journal' },
        { action: 'dismiss', title: 'Later' },
      ],
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if available
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow(urlToOpen);
    })
  );
});
