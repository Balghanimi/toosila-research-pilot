/**
 * SOS Controller
 * Handles SOS alert triggering and admin management
 */

const EmergencyAlert = require('../models/emergencyAlerts.model');
const EmergencyContact = require('../models/emergencyContacts.model');
const NotificationModel = require('../models/notifications.model');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

/**
 * Trigger SOS alert
 * POST /api/sos/trigger
 */
exports.triggerSOS = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    alertType = 'sos',
    severity = 'high',
    latitude,
    longitude,
    locationAccuracy,
    message,
    bookingId,
  } = req.body;

  // Validate alert type
  const validTypes = ['sos', 'panic', 'accident', 'harassment', 'other'];
  if (!validTypes.includes(alertType)) {
    throw new AppError('نوع التنبيه غير صحيح', 400);
  }

  // Create the alert
  const alert = await EmergencyAlert.create({
    userId,
    bookingId: bookingId || null,
    alertType,
    severity,
    latitude: latitude || null,
    longitude: longitude || null,
    locationAccuracy: locationAccuracy || null,
    message: message || null,
  });

  // Get user's SOS contacts to notify
  const sosContacts = await EmergencyContact.getSosContacts(userId);

  // Create notification for the user (confirmation)
  await NotificationModel.create(
    userId,
    'system',
    'تم إرسال تنبيه الطوارئ',
    'تم إرسال تنبيه SOS بنجاح. سيتم إعلام جهات الاتصال الخاصة بك.',
    { alertId: alert.id, alertType }
  );

  res.status(201).json({
    success: true,
    message: 'تم إرسال تنبيه الطوارئ بنجاح',
    data: {
      alert: alert.toJSON(),
      contactsNotified: sosContacts.length,
    },
  });
});

/**
 * Get user's own SOS history
 * GET /api/sos/my-alerts
 */
exports.getMyAlerts = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const result = await EmergencyAlert.findByUserId(userId, page, limit);

  res.status(200).json({
    success: true,
    data: {
      alerts: result.alerts.map((a) => a.toJSON()),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    },
  });
});

/**
 * Cancel an active SOS alert (user action)
 * PATCH /api/sos/:id/cancel
 */
exports.cancelAlert = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const alertId = req.params.id;

  const alert = await EmergencyAlert.findById(alertId);

  if (!alert) {
    throw new AppError('التنبيه غير موجود', 404);
  }

  if (alert.userId !== userId) {
    throw new AppError('ليس لديك صلاحية لإلغاء هذا التنبيه', 403);
  }

  if (alert.status !== 'active') {
    throw new AppError('لا يمكن إلغاء تنبيه غير نشط', 400);
  }

  const resolved = await EmergencyAlert.markFalseAlarm(alertId, userId, 'ألغاه المستخدم');

  res.status(200).json({
    success: true,
    message: 'تم إلغاء تنبيه الطوارئ',
    data: { alert: resolved.toJSON() },
  });
});

// ============ Admin Endpoints ============

/**
 * Get all SOS alerts (admin)
 * GET /api/sos/admin/all
 */
exports.getAllAlerts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const { status, severity, alertType } = req.query;

  const filters = {};
  if (status) filters.status = status;
  if (severity) filters.severity = severity;
  if (alertType) filters.alertType = alertType;

  const result = await EmergencyAlert.findAll(filters, page, limit);

  res.status(200).json({
    success: true,
    data: {
      alerts: result.alerts,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    },
  });
});

/**
 * Get active SOS alerts (admin)
 * GET /api/sos/admin/active
 */
exports.getActiveAlerts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;

  const result = await EmergencyAlert.findActive(page, limit);

  res.status(200).json({
    success: true,
    data: {
      alerts: result.alerts,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    },
  });
});

/**
 * Get SOS statistics (admin)
 * GET /api/sos/admin/stats
 */
exports.getStats = asyncHandler(async (req, res) => {
  const stats = await EmergencyAlert.getStats();

  res.status(200).json({
    success: true,
    data: { stats },
  });
});

/**
 * Acknowledge an SOS alert (admin)
 * PATCH /api/sos/admin/:id/acknowledge
 */
exports.acknowledgeAlert = asyncHandler(async (req, res) => {
  const adminId = req.user.id;
  const alertId = req.params.id;

  const alert = await EmergencyAlert.acknowledge(alertId, adminId);

  if (!alert) {
    throw new AppError('التنبيه غير موجود أو تم التعامل معه مسبقاً', 404);
  }

  res.status(200).json({
    success: true,
    message: 'تم الإقرار بالتنبيه',
    data: { alert: alert.toJSON() },
  });
});

/**
 * Resolve an SOS alert (admin)
 * PATCH /api/sos/admin/:id/resolve
 */
exports.resolveAlert = asyncHandler(async (req, res) => {
  const adminId = req.user.id;
  const alertId = req.params.id;
  const { resolutionNotes } = req.body;

  const alert = await EmergencyAlert.resolve(alertId, adminId, resolutionNotes || null);

  if (!alert) {
    throw new AppError('التنبيه غير موجود أو تم حله مسبقاً', 404);
  }

  // Notify the user that their alert was resolved
  await NotificationModel.create(
    alert.userId,
    'system',
    'تم حل تنبيه الطوارئ',
    'تم التعامل مع تنبيه الطوارئ الخاص بك وحله.',
    { alertId: alert.id }
  );

  res.status(200).json({
    success: true,
    message: 'تم حل التنبيه بنجاح',
    data: { alert: alert.toJSON() },
  });
});

/**
 * Mark alert as false alarm (admin)
 * PATCH /api/sos/admin/:id/false-alarm
 */
exports.markFalseAlarm = asyncHandler(async (req, res) => {
  const adminId = req.user.id;
  const alertId = req.params.id;
  const { notes } = req.body;

  const alert = await EmergencyAlert.markFalseAlarm(alertId, adminId, notes || null);

  if (!alert) {
    throw new AppError('التنبيه غير موجود', 404);
  }

  res.status(200).json({
    success: true,
    message: 'تم تحديد التنبيه كإنذار كاذب',
    data: { alert: alert.toJSON() },
  });
});
