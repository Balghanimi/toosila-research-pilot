/**
 * Push Notification Service
 * خدمة إرسال الإشعارات الدفعية عبر Firebase Cloud Messaging
 */

const { getMessaging } = require('../config/firebase');
const FcmTokenModel = require('../models/fcmTokens.model');
const logger = require('../config/logger');

/**
 * Send push notification to a user (all their active devices).
 * Fire-and-forget — never throws, never blocks.
 *
 * @param {string} userId - Target user ID
 * @param {object} notification - { title, body }
 * @param {object} data - Additional data payload (all values will be stringified)
 */
async function sendPushToUser(userId, notification, data = {}) {
  const messaging = getMessaging();
  if (!messaging) return;

  try {
    const tokenRows = await FcmTokenModel.getActiveTokens(userId);
    if (tokenRows.length === 0) return;

    const tokens = tokenRows.map((r) => r.token);

    // FCM requires all data values to be strings
    const stringData = {};
    for (const [key, value] of Object.entries(data)) {
      if (value != null) {
        stringData[key] = String(value);
      }
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: stringData,
      webpush: {
        notification: {
          dir: 'rtl',
          lang: 'ar',
          icon: '/logo192.png',
          badge: '/logo192.png',
          vibrate: [200, 100, 200],
          tag: stringData.type || 'toosila-notification',
          renotify: true,
        },
      },
      tokens,
    };

    const response = await messaging.sendEachForMulticast(message);

    // Deactivate stale tokens
    if (response.failureCount > 0) {
      const staleTokenIds = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/registration-token-not-registered'
          ) {
            staleTokenIds.push(tokenRows[idx].id);
          }
        }
      });

      if (staleTokenIds.length > 0) {
        await FcmTokenModel.deactivateTokens(staleTokenIds);
        logger.info(`Deactivated ${staleTokenIds.length} stale FCM tokens for user ${userId}`);
      }
    }

    logger.debug(
      `Push sent to user ${userId}: ${response.successCount}/${tokens.length} succeeded`
    );
  } catch (error) {
    logger.error(`Push notification error for user ${userId}:`, error.message);
  }
}

module.exports = { sendPushToUser };
