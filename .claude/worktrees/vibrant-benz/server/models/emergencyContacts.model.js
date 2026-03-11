/**
 * Emergency Contacts Model
 * Handles CRUD operations for user emergency contacts
 */

const { query } = require('../config/db');

class EmergencyContact {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.name = data.name;
    this.phone = data.phone;
    this.relationship = data.relationship;
    this.email = data.email;
    this.notifyOnTripStart = data.notify_on_trip_start;
    this.notifyOnSos = data.notify_on_sos;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Create a new emergency contact
   */
  static async create(contactData) {
    const {
      userId,
      name,
      phone,
      relationship = null,
      email = null,
      notifyOnTripStart = false,
      notifyOnSos = true,
    } = contactData;

    const result = await query(
      `INSERT INTO emergency_contacts (
        user_id, name, phone, relationship, email,
        notify_on_trip_start, notify_on_sos
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [userId, name, phone, relationship, email, notifyOnTripStart, notifyOnSos]
    );

    return new EmergencyContact(result.rows[0]);
  }

  /**
   * Find contact by ID
   */
  static async findById(id) {
    const result = await query('SELECT * FROM emergency_contacts WHERE id = $1', [id]);
    return result.rows.length > 0 ? new EmergencyContact(result.rows[0]) : null;
  }

  /**
   * Get all contacts for a user
   */
  static async findByUserId(userId) {
    const result = await query(
      `SELECT * FROM emergency_contacts
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [userId]
    );

    return result.rows.map((row) => new EmergencyContact(row));
  }

  /**
   * Update a contact
   */
  static async update(id, userId, updates) {
    const { name, phone, relationship, email, notifyOnTripStart, notifyOnSos } = updates;

    const result = await query(
      `UPDATE emergency_contacts
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           relationship = COALESCE($3, relationship),
           email = COALESCE($4, email),
           notify_on_trip_start = COALESCE($5, notify_on_trip_start),
           notify_on_sos = COALESCE($6, notify_on_sos),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [name, phone, relationship, email, notifyOnTripStart, notifyOnSos, id, userId]
    );

    return result.rows.length > 0 ? new EmergencyContact(result.rows[0]) : null;
  }

  /**
   * Delete a contact
   */
  static async delete(id, userId) {
    const result = await query(
      'DELETE FROM emergency_contacts WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rowCount > 0;
  }

  /**
   * Get contacts that should be notified on SOS
   */
  static async getSosContacts(userId) {
    const result = await query(
      `SELECT * FROM emergency_contacts
       WHERE user_id = $1 AND notify_on_sos = true`,
      [userId]
    );

    return result.rows.map((row) => new EmergencyContact(row));
  }

  /**
   * Count contacts for a user
   */
  static async countByUserId(userId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM emergency_contacts WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      phone: this.phone,
      relationship: this.relationship,
      email: this.email,
      notifyOnTripStart: this.notifyOnTripStart,
      notifyOnSos: this.notifyOnSos,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = EmergencyContact;
