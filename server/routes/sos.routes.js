/**
 * SOS Routes
 * مسارات تنبيهات الطوارئ SOS
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middlewares/auth');
const {
  triggerSOS,
  getMyAlerts,
  cancelAlert,
  getAllAlerts,
  getActiveAlerts,
  getStats,
  acknowledgeAlert,
  resolveAlert,
  markFalseAlarm,
} = require('../controllers/sos.controller');

// All routes require authentication
router.use(authenticateToken);

// ===== User Routes =====

// POST /api/sos/trigger - Trigger SOS alert
router.post('/trigger', triggerSOS);

// GET /api/sos/my-alerts - Get user's SOS history
router.get('/my-alerts', getMyAlerts);

// PATCH /api/sos/:id/cancel - Cancel an active alert
router.patch('/:id/cancel', cancelAlert);

// ===== Admin Routes =====

// GET /api/sos/admin/all - Get all alerts (admin)
router.get('/admin/all', requireAdmin, getAllAlerts);

// GET /api/sos/admin/active - Get active alerts (admin)
router.get('/admin/active', requireAdmin, getActiveAlerts);

// GET /api/sos/admin/stats - Get SOS statistics (admin)
router.get('/admin/stats', requireAdmin, getStats);

// PATCH /api/sos/admin/:id/acknowledge - Acknowledge alert (admin)
router.patch('/admin/:id/acknowledge', requireAdmin, acknowledgeAlert);

// PATCH /api/sos/admin/:id/resolve - Resolve alert (admin)
router.patch('/admin/:id/resolve', requireAdmin, resolveAlert);

// PATCH /api/sos/admin/:id/false-alarm - Mark as false alarm (admin)
router.patch('/admin/:id/false-alarm', requireAdmin, markFalseAlarm);

module.exports = router;
