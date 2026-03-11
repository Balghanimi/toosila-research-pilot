const express = require('express');
const router = express.Router();

const {
  trackEvent,
  trackBatch,
  getEventCounts,
  getDailyActiveUsers,
  getFeatureUsage,
  getMatchRates,
  exportEvents,
  getResearchDashboard,
} = require('../controllers/analytics.controller');

const { authenticateToken, requireAdmin } = require('../middlewares/auth');

// Event tracking (authenticated users — attaches user_id automatically)
router.post('/track', authenticateToken, trackEvent);
router.post('/track/batch', authenticateToken, trackBatch);

// Admin/research dashboard routes
router.get('/counts', authenticateToken, requireAdmin, getEventCounts);
router.get('/dau', authenticateToken, requireAdmin, getDailyActiveUsers);
router.get('/features', authenticateToken, requireAdmin, getFeatureUsage);
router.get('/match-rates', authenticateToken, requireAdmin, getMatchRates);
router.get('/export', authenticateToken, requireAdmin, exportEvents);
router.get('/dashboard', authenticateToken, requireAdmin, getResearchDashboard);

module.exports = router;
