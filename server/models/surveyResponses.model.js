const { query } = require('../config/db');

class SurveyResponse {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.surveyType = data.survey_type;
    this.commuteMode = data.commute_mode;
    this.dailyCostIqd = data.daily_cost_iqd;
    this.commuteTimeMinutes = data.commute_time_minutes;
    this.commuteDaysPerWeek = data.commute_days_per_week;
    this.willingnessToShare = data.willingness_to_share;
    this.interpersonalTrust = data.interpersonal_trust;
    this.platformTrust = data.platform_trust;
    this.genderComfort = data.gender_comfort;
    this.technologyReadiness = data.technology_readiness;
    this.satisfaction = data.satisfaction;
    this.npsScore = data.nps_score;
    this.susScore = data.sus_score;
    this.willingnessToContinue = data.willingness_to_continue;
    this.openFeedback = data.open_feedback;
    this.studyGroup = data.study_group;
    this.studyWeek = data.study_week;
    this.completedAt = data.completed_at;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  static async create(data) {
    const result = await query(
      `INSERT INTO survey_responses (
        user_id, survey_type, commute_mode, daily_cost_iqd, commute_time_minutes,
        commute_days_per_week, willingness_to_share, interpersonal_trust,
        platform_trust, gender_comfort, technology_readiness,
        satisfaction, nps_score, sus_score, willingness_to_continue,
        open_feedback, study_group, study_week
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        data.userId,
        data.surveyType,
        data.commuteMode,
        data.dailyCostIqd,
        data.commuteTimeMinutes,
        data.commuteDaysPerWeek,
        JSON.stringify(data.willingnessToShare || null),
        JSON.stringify(data.interpersonalTrust || null),
        JSON.stringify(data.platformTrust || null),
        JSON.stringify(data.genderComfort || null),
        JSON.stringify(data.technologyReadiness || null),
        JSON.stringify(data.satisfaction || null),
        data.npsScore || null,
        JSON.stringify(data.susScore || null),
        data.willingnessToContinue || null,
        data.openFeedback || null,
        data.studyGroup || 'treatment',
        data.studyWeek || null,
      ]
    );
    return new SurveyResponse(result.rows[0]);
  }

  static async findById(id) {
    const result = await query('SELECT * FROM survey_responses WHERE id = $1', [id]);
    return result.rows.length > 0 ? new SurveyResponse(result.rows[0]) : null;
  }

  static async findByUserId(userId) {
    const result = await query(
      'SELECT * FROM survey_responses WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows.map((row) => new SurveyResponse(row));
  }

  static async findByUserAndType(userId, surveyType) {
    const result = await query(
      'SELECT * FROM survey_responses WHERE user_id = $1 AND survey_type = $2',
      [userId, surveyType]
    );
    return result.rows.length > 0 ? new SurveyResponse(result.rows[0]) : null;
  }

  static async hasCompleted(userId, surveyType) {
    const result = await query(
      'SELECT id FROM survey_responses WHERE user_id = $1 AND survey_type = $2',
      [userId, surveyType]
    );
    return result.rows.length > 0;
  }

  // Aggregate stats for research dashboard
  static async getStats() {
    const result = await query(`
      SELECT
        survey_type,
        study_group,
        COUNT(*) as total_responses,
        AVG(daily_cost_iqd) as avg_daily_cost,
        AVG(commute_time_minutes) as avg_commute_time,
        AVG(nps_score) as avg_nps,
        COUNT(CASE WHEN commute_mode = 'private_car' THEN 1 END) as private_car_count,
        COUNT(CASE WHEN commute_mode = 'taxi' THEN 1 END) as taxi_count,
        COUNT(CASE WHEN commute_mode = 'minibus' THEN 1 END) as minibus_count,
        COUNT(CASE WHEN commute_mode = 'walking' THEN 1 END) as walking_count,
        COUNT(CASE WHEN commute_mode = 'motorcycle' THEN 1 END) as motorcycle_count
      FROM survey_responses
      GROUP BY survey_type, study_group
      ORDER BY survey_type, study_group
    `);
    return result.rows;
  }

  // Pre vs Post comparison for a user
  static async getPrePostComparison(userId) {
    const result = await query(
      `SELECT * FROM survey_responses
       WHERE user_id = $1 AND survey_type IN ('pre', 'post')
       ORDER BY survey_type`,
      [userId]
    );
    return result.rows.map((row) => new SurveyResponse(row));
  }

  // Get all responses for export (admin/research)
  static async exportAll(surveyType = null) {
    let sql = 'SELECT * FROM survey_responses';
    const params = [];
    if (surveyType) {
      sql += ' WHERE survey_type = $1';
      params.push(surveyType);
    }
    sql += ' ORDER BY created_at ASC';
    const result = await query(sql, params);
    return result.rows.map((row) => new SurveyResponse(row));
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      surveyType: this.surveyType,
      commuteMode: this.commuteMode,
      dailyCostIqd: this.dailyCostIqd,
      commuteTimeMinutes: this.commuteTimeMinutes,
      commuteDaysPerWeek: this.commuteDaysPerWeek,
      willingnessToShare: this.willingnessToShare,
      interpersonalTrust: this.interpersonalTrust,
      platformTrust: this.platformTrust,
      genderComfort: this.genderComfort,
      technologyReadiness: this.technologyReadiness,
      satisfaction: this.satisfaction,
      npsScore: this.npsScore,
      susScore: this.susScore,
      willingnessToContinue: this.willingnessToContinue,
      openFeedback: this.openFeedback,
      studyGroup: this.studyGroup,
      studyWeek: this.studyWeek,
      completedAt: this.completedAt,
      createdAt: this.createdAt,
    };
  }
}

module.exports = SurveyResponse;
