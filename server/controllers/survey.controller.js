const SurveyResponse = require('../models/surveyResponses.model');
const { asyncHandler, AppError } = require('../middlewares/error');
const { query } = require('../config/db');

// Submit a survey response (pre, post, or weekly)
const submitSurvey = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    surveyType,
    commuteMode,
    dailyCostIqd,
    commuteTimeMinutes,
    commuteDaysPerWeek,
    willingnessToShare,
    interpersonalTrust,
    platformTrust,
    genderComfort,
    technologyReadiness,
    satisfaction,
    npsScore,
    susScore,
    willingnessToContinue,
    openFeedback,
    studyWeek,
  } = req.body;

  if (!['pre', 'post', 'weekly'].includes(surveyType)) {
    throw new AppError('Invalid survey type. Must be pre, post, or weekly.', 400);
  }

  // Check for duplicate (pre/post only)
  if (surveyType !== 'weekly') {
    const existing = await SurveyResponse.hasCompleted(userId, surveyType);
    if (existing) {
      throw new AppError(`You have already completed the ${surveyType}-survey.`, 409);
    }
  }

  // Get user's study group
  const userResult = await query('SELECT study_group FROM users WHERE id = $1', [userId]);
  const studyGroup = userResult.rows[0]?.study_group || 'treatment';

  const response = await SurveyResponse.create({
    userId,
    surveyType,
    commuteMode,
    dailyCostIqd,
    commuteTimeMinutes,
    commuteDaysPerWeek,
    willingnessToShare,
    interpersonalTrust,
    platformTrust,
    genderComfort,
    technologyReadiness,
    satisfaction,
    npsScore,
    susScore,
    willingnessToContinue,
    openFeedback,
    studyGroup,
    studyWeek,
  });

  // Mark survey as completed on user record
  const flagField = surveyType === 'pre' ? 'survey_completed_pre' : surveyType === 'post' ? 'survey_completed_post' : null;
  if (flagField) {
    await query(`UPDATE users SET ${flagField} = true WHERE id = $1`, [userId]);
  }

  res.status(201).json({
    message: `${surveyType}-survey submitted successfully`,
    survey: response.toJSON(),
  });
});

// Get current user's survey status
const getSurveyStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const pre = await SurveyResponse.hasCompleted(userId, 'pre');
  const post = await SurveyResponse.hasCompleted(userId, 'post');

  const weeklyResult = await query(
    "SELECT study_week FROM survey_responses WHERE user_id = $1 AND survey_type = 'weekly' ORDER BY study_week",
    [userId]
  );
  const completedWeeks = weeklyResult.rows.map((r) => r.study_week);

  res.json({
    preCompleted: pre,
    postCompleted: post,
    completedWeeks,
  });
});

// Get user's own survey responses
const getMySurveys = asyncHandler(async (req, res) => {
  const surveys = await SurveyResponse.findByUserId(req.user.id);
  res.json({ surveys: surveys.map((s) => s.toJSON()) });
});

// Admin: get aggregate survey stats
const getSurveyStats = asyncHandler(async (req, res) => {
  const stats = await SurveyResponse.getStats();

  // Participation counts
  const participationResult = await query(`
    SELECT
      COUNT(*) FILTER (WHERE research_consent = true) as consented_users,
      COUNT(*) FILTER (WHERE survey_completed_pre = true) as pre_completed,
      COUNT(*) FILTER (WHERE survey_completed_post = true) as post_completed,
      COUNT(*) FILTER (WHERE study_group = 'treatment') as treatment_group,
      COUNT(*) FILTER (WHERE study_group = 'control') as control_group
    FROM users
    WHERE research_consent = true
  `);

  res.json({
    surveyStats: stats,
    participation: participationResult.rows[0],
  });
});

// Admin: export all survey data (CSV-ready JSON)
const exportSurveys = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const data = await SurveyResponse.exportAll(type || null);
  res.json({ data: data.map((s) => s.toJSON()) });
});

// Give research consent
const giveConsent = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  await query(
    'UPDATE users SET research_consent = true, research_consent_date = CURRENT_TIMESTAMP WHERE id = $1',
    [userId]
  );
  res.json({ message: 'Research consent recorded. Thank you for participating!' });
});

module.exports = {
  submitSurvey,
  getSurveyStatus,
  getMySurveys,
  getSurveyStats,
  exportSurveys,
  giveConsent,
};
