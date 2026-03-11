/**
 * Emergency Contacts Routes
 * مسارات جهات اتصال الطوارئ
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const {
  getContacts,
  addContact,
  updateContact,
  deleteContact,
} = require('../controllers/emergency.controller');

// All routes require authentication
router.use(authenticateToken);

// GET /api/emergency/contacts - Get user's emergency contacts
router.get('/contacts', getContacts);

// POST /api/emergency/contacts - Add a new emergency contact
router.post('/contacts', addContact);

// PUT /api/emergency/contacts/:id - Update an emergency contact
router.put('/contacts/:id', updateContact);

// DELETE /api/emergency/contacts/:id - Delete an emergency contact
router.delete('/contacts/:id', deleteContact);

module.exports = router;
