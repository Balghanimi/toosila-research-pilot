// Service Worker for Push Notifications
// توصيلة - Toosila

self.addEventListener('push', function (event) {
    console.log('[SW] Push notification received');

    let data = {};
    try {
        data = event.data.json();
    } catch (e) {
        data = {
            title: 'توصيلة',
            body: event.data.text(),
            icon: '/logo192.png'
        };
    }

    const options = {
        body: data.body || data.message,
        icon: data.icon || '/logo192.png',
        badge: '/logo192.png',
        dir: 'rtl',
        lang: 'ar',
        vibrate: [200, 100, 200],
        tag: data.tag || 'toosila-notification',
        renotify: true,
        data: data.data || {},
        actions: [
            { action: 'open', title: 'فتح', icon: '/logo192.png' },
            { action: 'close', title: 'إغلاق' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'توصيلة', options)
    );
});

// عند النقر على الإشعار
self.addEventListener('notificationclick', function (event) {
    console.log('[SW] Notification clicked');
    event.notification.close();

    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
                // إذا التطبيق مفتوح، ركز عليه
                for (let client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // إذا مغلق، افتح صفحة جديدة
                if (clients.openWindow) {
                    const url = event.notification.data?.url || '/notifications';
                    return clients.openWindow(url);
                }
            })
        );
    }
});

// Install event
self.addEventListener('install', function (event) {
    console.log('[SW] Service Worker installing...');
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', function (event) {
    console.log('[SW] Service Worker activating...');
    event.waitUntil(clients.claim());
});
