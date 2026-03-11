/**
 * Simple Audit Log Middleware
 * Records data modifications for compliance and debugging
 */

const { query: dbQuery } = require('../config/db');
const logger = require('../config/logger');

/**
 * Log an audit event to the audit_log table
 * @param {string} tableName - The database table being modified
 * @param {number|string} recordId - The ID of the record being modified
 * @param {string} action - The action being performed (create/update/delete)
 * @param {Object|null} oldData - The previous data (null for create)
 * @param {Object|null} newData - The new data (null for delete)
 * @param {number|string} userId - The ID of the user performing the action
 * @param {string} ip - The IP address of the request
 */
const auditLog = async (tableName, recordId, action, oldData, newData, userId, ip) => {
  try {
    await dbQuery(
      `INSERT INTO audit_log (table_name, record_id, action, old_data, new_data, user_id, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        tableName,
        recordId,
        action,
        oldData ? JSON.stringify(oldData) : null,
        newData ? JSON.stringify(newData) : null,
        userId,
        ip,
      ]
    );

    logger.info('Audit log created', {
      tableName,
      recordId,
      action,
      userId,
    });
  } catch (error) {
    // Never fail the request due to audit logging issues
    logger.error('Failed to create audit log', {
      error: error.message,
      tableName,
      recordId,
      action,
    });
  }
};

/**
 * Initialize audit_log table if it doesn't exist
 */
const initializeAuditTable = async () => {
  try {
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        table_name VARCHAR(100) NOT NULL,
        record_id INTEGER,
        action VARCHAR(50) NOT NULL,
        old_data JSONB,
        new_data JSONB,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        ip_address VARCHAR(45),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create indexes for better query performance
    await dbQuery(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);
      CREATE INDEX IF NOT EXISTS idx_audit_log_record_id ON audit_log(record_id);
      CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
      CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
    `);

    logger.info('Audit log table initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize audit log table', {
      error: error.message,
    });
  }
};

module.exports = {
  auditLog,
  initializeAuditTable,
};
