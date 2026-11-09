// Firebase Cloud Messaging Service Worker for Masjid Mehmoodiya
// Handles background push notifications when the app is minimized or closed

importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

// Initialize Firebase in Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyCeYGGhOzvNXMhW_IgPmKT9TwU62Os7e1c",
  projectId: "masjid-mehmodiya",
  storageBucket: "masjid-mehmodiya.firebasestorage.app",
  messagingSenderId: "784920870780",
  appId: "1:784920870780:android:fbbf970fff7036ea772ef9"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || '🕌 Masjid Mehmoodiya – Prayer Reminder';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'Prayer time has commenced.',
    icon: '/masjid-logo.svg',
    badge: '/masjid-logo.svg',
    tag: payload.data?.tag || 'prayer-alert',
    data: payload.data || {},
    requireInteraction: payload.data?.type === 'adhan',
    actions: payload.data?.type === 'adhan' ? [
      { action: 'open_app', title: 'Open App (اذان سنیں)' },
      { action: 'stop_sound', title: 'Stop (بند کریں)' }
    ] : [
      { action: 'open_app', title: 'Open Schedule' }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and tell it to stop or view
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: action === 'stop_sound' ? 'STOP_SOUND' : 'PRAYER_ALERT',
            payload: data,
          });
          return;
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
