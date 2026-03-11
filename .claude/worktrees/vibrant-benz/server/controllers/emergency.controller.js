/**
 * Emergency Contacts Controller
 * Handles CRUD operations for user emergency contacts
 */

const EmergencyContact = require('../models/emergencyContacts.model');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const MAX_CONTACTS = 5;

/**
 * Get all emergency contacts for the current user
 * GET /api/emergency/contacts
 */
exports.getContacts = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const contacts = await EmergencyContact.findByUserId(userId);

  res.status(200).json({
    success: true,
    data: {
      contacts: contacts.map((c) => c.toJSON()),
      count: contacts.length,
    },
  });
});

/**
 * Add a new emergency contact
 * POST /api/emergency/contacts
 */
exports.addContact = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { name, phone, relationship, email, notifyOnTripStart, notifyOnSos } = req.body;

  if (!name || !phone) {
    throw new AppError('الاسم ورقم الهاتف مطلوبان', 400);
  }

  // Check max contacts limit
  const count = await EmergencyContact.countByUserId(userId);
  if (count >= MAX_CONTACTS) {
    throw new AppError(`لا يمكن إضافة أكثر من ${MAX_CONTACTS} جهات اتصال طوارئ`, 400);
  }

  const contact = await EmergencyContact.create({
    userId,
    name: name.trim(),
    phone: phone.trim(),
    relationship: relationship?.trim() || null,
    email: email?.trim() || null,
    notifyOnTripStart: notifyOnTripStart || false,
    notifyOnSos: notifyOnSos !== false, // default true
  });

  res.status(201).json({
    success: true,
    message: 'تم إضافة جهة اتصال الطوارئ بنجاح',
    data: { contact: contact.toJSON() },
  });
});

/**
 * Update an emergency contact
 * PUT /api/emergency/contacts/:id
 */
exports.updateContact = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const contactId = req.params.id;
  const { name, phone, relationship, email, notifyOnTripStart, notifyOnSos } = req.body;

  const contact = await EmergencyContact.update(contactId, userId, {
    name: name?.trim(),
    phone: phone?.trim(),
    relationship: relationship?.trim(),
    email: email?.trim(),
    notifyOnTripStart,
    notifyOnSos,
  });

  if (!contact) {
    throw new AppError('جهة الاتصال غير موجودة أو ليس لديك صلاحية لتعديلها', 404);
  }

  res.status(200).json({
    success: true,
    message: 'تم تحديث جهة اتصال الطوارئ بنجاح',
    data: { contact: contact.toJSON() },
  });
});

/**
 * Delete an emergency contact
 * DELETE /api/emergency/contacts/:id
 */
exports.deleteContact = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const contactId = req.params.id;

  const deleted = await EmergencyContact.delete(contactId, userId);

  if (!deleted) {
    throw new AppError('جهة الاتصال غير موجودة أو ليس لديك صلاحية لحذفها', 404);
  }

  res.status(200).json({
    success: true,
    message: 'تم حذف جهة اتصال الطوارئ بنجاح',
  });
});
