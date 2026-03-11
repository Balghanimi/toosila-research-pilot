/**
 * Client-side analytics event tracker for research pilot.
 * Buffers events and sends in batches every 30 seconds,
 * or immediately when the buffer exceeds 20 events.
 */
import { analyticsAPI } from '../services/api';

const BUFFER_FLUSH_SIZE = 20;
const BUFFER_FLUSH_INTERVAL = 30000; // 30 seconds

let eventBuffer = [];
let flushTimer = null;

function startFlushTimer() {
  if (flushTimer) return;
  flushTimer = setInterval(flush, BUFFER_FLUSH_INTERVAL);
}

function stopFlushTimer() {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
}

async function flush() {
  if (eventBuffer.length === 0) return;
  const batch = [...eventBuffer];
  eventBuffer = [];
  try {
    await analyticsAPI.trackBatch(batch);
  } catch (err) {
    // Re-queue failed events (drop if buffer grows too large)
    if (eventBuffer.length < 200) {
      eventBuffer.push(...batch);
    }
    console.warn('[Analytics] Batch send failed, events re-queued:', err.message);
  }
}

/**
 * Track an analytics event.
 * @param {string} eventType - e.g., 'offer_viewed', 'booking_created', 'gender_filter_used'
 * @param {string} eventCategory - 'ride' | 'search' | 'feature' | 'engagement' | 'survey'
 * @param {object} properties - arbitrary key-value pairs
 */
export function trackEvent(eventType, eventCategory, properties = {}) {
  const token = localStorage.getItem('token');
  if (!token) return; // Don't track unauthenticated users

  eventBuffer.push({
    eventType,
    eventCategory,
    properties,
    timestamp: new Date().toISOString(),
  });

  startFlushTimer();

  if (eventBuffer.length >= BUFFER_FLUSH_SIZE) {
    flush();
  }
}

// Convenience helpers for common events
export const trackRide = {
  offerViewed: (offerId) => trackEvent('offer_viewed', 'ride', { offerId }),
  offerCreated: (offerId) => trackEvent('offer_created', 'ride', { offerId }),
  demandCreated: (demandId) => trackEvent('demand_created', 'ride', { demandId }),
  bookingCreated: (bookingId) => trackEvent('booking_created', 'ride', { bookingId }),
  bookingAccepted: (bookingId) => trackEvent('booking_accepted', 'ride', { bookingId }),
  bookingRejected: (bookingId) => trackEvent('booking_rejected', 'ride', { bookingId }),
  bookingCancelled: (bookingId) => trackEvent('booking_cancelled', 'ride', { bookingId }),
  searchPerformed: (filters) => trackEvent('search_performed', 'search', filters),
};

export const trackFeature = {
  genderFilterUsed: (value) => trackEvent('gender_filter_used', 'feature', { value }),
  ladiesOnlyToggled: (enabled) => trackEvent('ladies_only_toggled', 'feature', { enabled }),
  languageChanged: (lang) => trackEvent('language_changed', 'feature', { lang }),
  emergencyTriggered: () => trackEvent('emergency_triggered', 'feature', {}),
  lineViewed: (lineId) => trackEvent('line_viewed', 'feature', { lineId }),
  lineSubscribed: (lineId) => trackEvent('line_subscribed', 'feature', { lineId }),
};

export const trackEngagement = {
  sessionStarted: () => trackEvent('session_started', 'engagement', {}),
  pageViewed: (page) => trackEvent('page_viewed', 'engagement', { page }),
  messagesSent: (count) => trackEvent('messages_sent', 'engagement', { count }),
  ratingGiven: (rating) => trackEvent('rating_given', 'engagement', { rating }),
};

// Flush remaining events when the page is being unloaded
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flush();
    }
  });

  window.addEventListener('beforeunload', () => {
    flush();
  });
}
