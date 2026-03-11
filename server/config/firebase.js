/**
 * Firebase Admin SDK Configuration
 * تهيئة Firebase للإشعارات الدفعية (Push Notifications)
 */

const admin = require('firebase-admin');
const logger = require('./logger');

let firebaseApp = null;

function initializeFirebase() {
  if (firebaseApp) return firebaseApp;

  try {
    const credentialJSON = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!credentialJSON) {
      logger.warn('FIREBASE_SERVICE_ACCOUNT not set - push notifications disabled');
      return null;
    }

    const serviceAccount = JSON.parse(credentialJSON);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    logger.info('Firebase Admin SDK initialized - push notifications enabled');
    return firebaseApp;
  } catch (error) {
    logger.error('Failed to initialize Firebase:', error.message);
    return null;
  }
}

function getMessaging() {
  if (!firebaseApp) return null;
  return admin.messaging();
}

module.exports = { initializeFirebase, getMessaging };
