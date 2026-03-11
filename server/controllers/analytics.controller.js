const AnalyticsEvent = require('../models/analyticsEvents.model');
const { asyncHandler, AppError } = require('../middlewares/error');

// Track a single event
const trackEvent = asyncHandler(async (req, res) => {
  const { eventType, eventCategory, properties, sessionId, platform, appVersion, gridCell } = req.body;

  if (!eventType || !eventCategory) {
    throw new AppError('eventType and eventCategory are required', 400);
  }

  const event = await AnalyticsEvent.create({
    userId: req.user?.id || null,
    eventType,
    eventCategory,
    properties,
    sessionId,
    platform,
    appVersion,
    gridCell,
  });

  res.status(201).json({ id: event.id });
});

// Track a batch of events (client buffers and sends periodically)
const trackBatch = asyncHandler(async (req, res) => {
  const { events } = req.body;

  if (!Array.isArray(events) || events.length === 0) {
    throw new AppError('events array is required and must not be empty', 400);
  }

  if (events.length > 100) {
    throw new AppError('Maximum 100 events per batch', 400);
  }

  const userId = req.user?.id || null;
  const enrichedEvents = events.map((e) => ({
    ...e,
    userId: e.userId || userId,
  }));

  const created = await AnalyticsEvent.createBatch(enrichedEvents);
  res.status(201).json({ count: created.length });
});

// Admin: get event counts
const getEventCounts = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const counts = await AnalyticsEvent.getEventCounts(startDate || null, endDate || null);
  res.json({ counts });
});

// Admin: daily active users
const getDailyActiveUsers = asyncHandler(async (req, res) => {
  const { days = 42 } = req.query;
  const data = await AnalyticsEvent.getDailyActiveUsers(parseInt(days));
  res.json({ data });
});

// Admin: feature usage
const getFeatureUsage = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const data = await AnalyticsEvent.getFeatureUsage(startDate || null, endDate || null);
  res.json({ data });
});

// Admin: match rates
const getMatchRates = asyncHandler(async (req, res) => {
  const { days = 42 } = req.query;
  const data = await AnalyticsEvent.getMatchRates(parseInt(days));
  res.json({ data });
});

// Admin: export all events
const exportEvents = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const data = await AnalyticsEvent.exportAll(startDate || null, endDate || null);
  res.json({ data: data.map((e) => e.toJSON()) });
});

// Admin: research dashboard summary
const getResearchDashboard = asyncHandler(async (req, res) => {
  const [eventCounts, dau, features, matchRates] = await Promise.all([
    AnalyticsEvent.getEventCounts(),
    AnalyticsEvent.getDailyActiveUsers(42),
    AnalyticsEvent.getFeatureUsage(),
    AnalyticsEvent.getMatchRates(42),
  ]);

  res.json({
    eventCounts,
    dailyActiveUsers: dau,
    featureUsage: features,
    matchRates,
  });
});

module.exports = {
  trackEvent,
  trackBatch,
  getEventCounts,
  getDailyActiveUsers,
  getFeatureUsage,
  getMatchRates,
  exportEvents,
  getResearchDashboard,
};
