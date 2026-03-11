/**
 * Firebase Web SDK Configuration
 * تهيئة Firebase للإشعارات الدفعية على العميل
 */

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

let app = null;
let messaging = null;

export function initFirebase() {
  if (app) return { app, messaging };

  try {
    // Skip if Firebase config is not set
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.warn('[Firebase] Config not set - push notifications disabled');
      return { app: null, messaging: null };
    }

    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    return { app, messaging };
  } catch (error) {
    console.error('[Firebase] Init failed:', error);
    return { app: null, messaging: null };
  }
}

/**
 * Get FCM registration token for this device
 */
export async function getFcmToken() {
  try {
    const { messaging: msg } = initFirebase();
    if (!msg) return null;

    const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn('[Firebase] VAPID key not set');
      return null;
    }

    const token = await getToken(msg, {
      vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.getRegistration(
        '/firebase-messaging-sw.js'
      ),
    });
    return token;
  } catch (error) {
    console.error('[Firebase] Failed to get token:', error);
    return null;
  }
}

/**
 * Listen for foreground messages (when app is open)
 */
export function onForegroundMessage(callback) {
  const { messaging: msg } = initFirebase();
  if (!msg) return () => {};
  return onMessage(msg, callback);
}
