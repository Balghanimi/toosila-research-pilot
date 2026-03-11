const express = require('express');
const router = express.Router();

const {
  submitSurvey,
  getSurveyStatus,
  getMySurveys,
  getSurveyStats,
  exportSurveys,
  giveConsent,
} = require('../controllers/survey.controller');

const { authenticateToken, requireAdmin } = require('../middlewares/auth');

// All survey routes require authentication
router.use(authenticateToken);

// User routes
router.post('/consent', giveConsent);
router.get('/status', getSurveyStatus);
router.get('/my-surveys', getMySurveys);
router.post('/submit', submitSurvey);

// Admin/research routes
router.get('/stats', requireAdmin, getSurveyStats);
router.get('/export', requireAdmin, exportSurveys);

module.exports = router;
