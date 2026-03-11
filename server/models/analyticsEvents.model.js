const { query } = require('../config/db');

class AnalyticsEvent {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.eventType = data.event_type;
    this.eventCategory = data.event_category;
    this.properties = data.properties;
    this.sessionId = data.session_id;
    this.platform = data.platform;
    this.appVersion = data.app_version;
    this.gridCell = data.grid_cell;
    this.createdAt = data.created_at;
  }

  // Single event
  static async create(data) {
    const result = await query(
      `INSERT INTO analytics_events (
        user_id, event_type, event_category, properties,
        session_id, platform, app_version, grid_cell
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        data.userId || null,
        data.eventType,
        data.eventCategory,
        JSON.stringify(data.properties || {}),
        data.sessionId || null,
        data.platform || 'web',
        data.appVersion || null,
        data.gridCell || null,
      ]
    );
    return new AnalyticsEvent(result.rows[0]);
  }

  // Batch insert (for client-side buffered events)
  static async createBatch(events) {
    if (!events.length) return [];
    const values = [];
    const placeholders = [];
    let paramIdx = 1;

    for (const e of events) {
      placeholders.push(
        `($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5}, $${paramIdx + 6}, $${paramIdx + 7})`
      );
      values.push(
        e.userId || null,
        e.eventType,
        e.eventCategory,
        JSON.stringify(e.properties || {}),
        e.sessionId || null,
        e.platform || 'web',
        e.appVersion || null,
        e.gridCell || null
      );
      paramIdx += 8;
    }

    const result = await query(
      `INSERT INTO analytics_events (
        user_id, event_type, event_category, properties,
        session_id, platform, app_version, grid_cell
      ) VALUES ${placeholders.join(', ')}
      RETURNING *`,
      values
    );
    return result.rows.map((row) => new AnalyticsEvent(row));
  }

  // Research dashboard: event counts by type and category
  static async getEventCounts(startDate = null, endDate = null) {
    let whereClause = '';
    const params = [];
    if (startDate) {
      params.push(startDate);
      whereClause += ` WHERE created_at >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      whereClause += whereClause ? ` AND created_at <= $${params.length}` : ` WHERE created_at <= $${params.length}`;
    }

    const result = await query(
      `SELECT event_type, event_category, COUNT(*) as count
       FROM analytics_events ${whereClause}
       GROUP BY event_type, event_category
       ORDER BY count DESC`,
      params
    );
    return result.rows;
  }

  // Daily active users
  static async getDailyActiveUsers(days = 42) {
    const result = await query(
      `SELECT DATE(created_at) as date, COUNT(DISTINCT user_id) as active_users
       FROM analytics_events
       WHERE created_at >= NOW() - INTERVAL '1 day' * $1
         AND user_id IS NOT NULL
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [days]
    );
    return result.rows;
  }

  // Feature usage (gender filter, ladies-only, etc.)
  static async getFeatureUsage(startDate = null, endDate = null) {
    let whereClause = "WHERE event_category = 'feature'";
    const params = [];
    if (startDate) {
      params.push(startDate);
      whereClause += ` AND created_at >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      whereClause += ` AND created_at <= $${params.length}`;
    }

    const result = await query(
      `SELECT event_type, COUNT(*) as usage_count, COUNT(DISTINCT user_id) as unique_users
       FROM analytics_events ${whereClause}
       GROUP BY event_type
       ORDER BY usage_count DESC`,
      params
    );
    return result.rows;
  }

  // Match rate: offers vs successful bookings
  static async getMatchRates(days = 42) {
    const result = await query(
      `SELECT
        DATE(created_at) as date,
        COUNT(CASE WHEN event_type = 'offer_viewed' THEN 1 END) as offers_viewed,
        COUNT(CASE WHEN event_type = 'booking_created' THEN 1 END) as bookings_created,
        COUNT(CASE WHEN event_type = 'booking_accepted' THEN 1 END) as bookings_accepted
       FROM analytics_events
       WHERE created_at >= NOW() - INTERVAL '1 day' * $1
         AND event_category = 'ride'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [days]
    );
    return result.rows;
  }

  // User journey funnel
  static async getUserFunnel(userId) {
    const result = await query(
      `SELECT event_type, event_category, COUNT(*) as count,
              MIN(created_at) as first_occurrence,
              MAX(created_at) as last_occurrence
       FROM analytics_events
       WHERE user_id = $1
       GROUP BY event_type, event_category
       ORDER BY first_occurrence ASC`,
      [userId]
    );
    return result.rows;
  }

  // Export all events for research analysis
  static async exportAll(startDate = null, endDate = null) {
    let whereClause = '';
    const params = [];
    if (startDate) {
      params.push(startDate);
      whereClause += ` WHERE created_at >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      whereClause += whereClause ? ` AND created_at <= $${params.length}` : ` WHERE created_at <= $${params.length}`;
    }

    const result = await query(
      `SELECT * FROM analytics_events ${whereClause} ORDER BY created_at ASC`,
      params
    );
    return result.rows.map((row) => new AnalyticsEvent(row));
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      eventType: this.eventType,
      eventCategory: this.eventCategory,
      properties: this.properties,
      sessionId: this.sessionId,
      platform: this.platform,
      gridCell: this.gridCell,
      createdAt: this.createdAt,
    };
  }
}

module.exports = AnalyticsEvent;
