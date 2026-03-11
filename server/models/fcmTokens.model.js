/**
 * FCM Tokens Model
 * إدارة رموز FCM لأجهزة المستخدمين
 */

const { query } = require('../config/db');

const FcmTokenModel = {
  /**
   * Register or re-activate a token for a user.
   * If the token already exists (same device, different account), reassign it.
   */
  async upsert(userId, token, deviceInfo = null) {
    const result = await query(
      `INSERT INTO fcm_tokens (user_id, token, device_info, is_active, updated_at)
       VALUES ($1, $2, $3, TRUE, NOW())
       ON CONFLICT (token) DO UPDATE SET
         user_id = $1,
         is_active = TRUE,
         device_info = COALESCE($3, fcm_tokens.device_info),
         updated_at = NOW()
       RETURNING *`,
      [userId, token, deviceInfo]
    );
    return result.rows[0];
  },

  /**
   * Remove a specific token (user logged out or unsubscribed)
   */
  async remove(userId, token) {
    const result = await query('DELETE FROM fcm_tokens WHERE user_id = $1 AND token = $2', [
      userId,
      token,
    ]);
    return result.rowCount > 0;
  },

  /**
   * Remove all tokens for a user (full logout)
   */
  async removeAllForUser(userId) {
    const result = await query('DELETE FROM fcm_tokens WHERE user_id = $1', [userId]);
    return result.rowCount;
  },

  /**
   * Get active tokens for a user
   */
  async getActiveTokens(userId) {
    const result = await query(
      'SELECT id, token FROM fcm_tokens WHERE user_id = $1 AND is_active = TRUE',
      [userId]
    );
    return result.rows;
  },

  /**
   * Deactivate specific token IDs (stale tokens)
   */
  async deactivateTokens(tokenIds) {
    if (tokenIds.length === 0) return;
    await query('UPDATE fcm_tokens SET is_active = FALSE, updated_at = NOW() WHERE id = ANY($1)', [
      tokenIds,
    ]);
  },
};

module.exports = FcmTokenModel;
