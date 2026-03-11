/**
 * Firebase Cloud Messaging Service Worker
 * خدمة العمل في الخلفية للإشعارات الدفعية
 *
 * Note: Firebase config values are injected at build time by scripts/inject-sw-env.js
 * Do NOT hardcode API keys here.
 */

/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: '__FIREBASE_API_KEY__',
  authDomain: '__FIREBASE_AUTH_DOMAIN__',
  projectId: '__FIREBASE_PROJECT_ID__',
  messagingSenderId: '__FIREBASE_MESSAGING_SENDER_ID__',
  appId: '__FIREBASE_APP_ID__',
});

const messaging = firebase.messaging();

// Background message handler — delivers push when app is closed/backgrounded
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Background message:', payload);

  const data = payload.notification || payload.data || {};

  const options = {
    body: data.body || data.message || '',
    icon: '/logo-192.png',
    badge: '/logo-192.png',
    dir: 'rtl',
    lang: 'ar',
    vibrate: [200, 100, 200],
    tag: data.type || 'toosila-notification',
    renotify: true,
    data: payload.data || {},
    actions: [
      { action: 'open', title: 'فتح' },
      { action: 'close', title: 'إغلاق' },
    ],
  };

  self.registration.showNotification(data.title || 'توصيلة', options);
});

// Notification click handler
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  if (event.action === 'close') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        const url = event.notification.data?.url || '/notifications';
        return clients.openWindow(url);
      }
    })
  );
});
