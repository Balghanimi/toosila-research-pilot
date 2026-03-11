/**
 * Authentication Controller
 * Handles HTTP requests for user authentication and profile management
 */

const User = require('../models/users.model');
const authService = require('../services/auth.service');
const logger = require('../config/logger');
const { catchAsync, sendSuccess, sendPaginatedResponse } = require('../utils/helpers');
const { NotFoundError } = require('../utils/errors');
const { RESPONSE_MESSAGES, HTTP_STATUS } = require('../constants');
const { auditLog } = require('../middlewares/audit');

/**
 * Register a new user
 * @route POST /api/auth/register
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.name - User's full name
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - User's password
 * @param {boolean} [req.body.isDriver=false] - Whether user is a driver
 * @param {string} [req.body.languagePreference='ar'] - User's language preference
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const register = catchAsync(async (req, res) => {
  const {
    name,
    email,
    password,
    isDriver = false,
    languagePreference = 'ar',
    // New fields - All users
    phone,
    gender,
    city,
    dateOfBirth,
    address,
    emergencyContactName,
    emergencyContactPhone,
    // Driver-specific fields
    nationalId,
    driverLicenseNumber,
    vehicleType,
    vehicleMake,
    vehicleModel,
    vehicleYear,
    vehicleColor,
    licensePlate,
    seatsAvailable,
  } = req.body;

  const result = await authService.registerUser({
    name,
    email,
    password,
    isDriver,
    languagePreference,
    // New fields - All users
    phone,
    gender,
    city,
    dateOfBirth,
    address,
    emergencyContactName,
    emergencyContactPhone,
    // Driver-specific fields
    nationalId,
    driverLicenseNumber,
    vehicleType,
    vehicleMake,
    vehicleModel,
    vehicleYear,
    vehicleColor,
    licensePlate,
    seatsAvailable,
  });

  sendSuccess(res, result, RESPONSE_MESSAGES.REGISTRATION_SUCCESS, HTTP_STATUS.CREATED);
});

/**
 * Login user
 * @route POST /api/auth/login
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.email - User's email
 * @param {string} req.body.password - User's password
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.loginUser(email, password);

  sendSuccess(res, result, RESPONSE_MESSAGES.LOGIN_SUCCESS);
});

/**
 * Get current user profile
 * @route GET /api/auth/profile
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user from middleware
 * @param {number} req.user.id - User ID
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getProfile = catchAsync(async (req, res) => {
  const user = await authService.getUserProfile(req.user.id);

  sendSuccess(res, { user }, RESPONSE_MESSAGES.SUCCESS);
});

/**
 * Update user profile
 * @route PUT /api/auth/profile
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user from middleware
 * @param {Object} req.body - Request body
 * @param {string} [req.body.name] - User's name
 * @param {string} [req.body.languagePreference] - Language preference
 * @param {boolean} [req.body.isDriver] - Driver status
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const updateProfile = catchAsync(async (req, res) => {
  const { name, languagePreference, isDriver } = req.body;

  // Get old profile data for audit
  const oldProfile = await authService.getUserProfile(req.user.id);

  const { user, token } = await authService.updateUserProfile(req.user.id, {
    name,
    languagePreference,
    isDriver,
  });

  // Audit log for profile update
  await auditLog(
    'users',
    req.user.id,
    'update',
    {
      name: oldProfile.name,
      languagePreference: oldProfile.languagePreference,
      isDriver: oldProfile.isDriver,
    },
    { name: user.name, languagePreference: user.languagePreference, isDriver: user.isDriver },
    req.user.id,
    req.ip
  );

  sendSuccess(res, { user, token }, RESPONSE_MESSAGES.PROFILE_UPDATED);
});

/**
 * Change user password
 * @route PUT /api/auth/password
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user from middleware
 * @param {Object} req.body - Request body
 * @param {string} req.body.currentPassword - Current password
 * @param {string} req.body.newPassword - New password
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  await authService.changePassword(req.user.id, req.user.email, currentPassword, newPassword);

  sendSuccess(res, null, RESPONSE_MESSAGES.PASSWORD_RESET_SUCCESS);
});

/**
 * Get user statistics
 * @route GET /api/auth/stats
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user from middleware
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getUserStats = catchAsync(async (req, res) => {
  const stats = await User.getStats(req.user.id);

  sendSuccess(res, { stats }, RESPONSE_MESSAGES.SUCCESS);
});

/**
 * Get all users (admin only)
 * @route GET /api/auth/users
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=10] - Items per page
 * @param {boolean} [req.query.isDriver] - Filter by driver status
 * @param {string} [req.query.languagePreference] - Filter by language
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getAllUsers = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, isDriver, languagePreference, role, isActive } = req.query;
  const filters = {};

  // Only apply filter if value is explicitly 'true' or 'false', not empty string
  if (isDriver === 'true' || isDriver === 'false') {
    filters.isDriver = isDriver === 'true';
  }
  if (languagePreference) filters.languagePreference = languagePreference;
  if (role) filters.role = role;
  if (isActive === 'true' || isActive === 'false') {
    filters.isActive = isActive === 'true';
  }

  const result = await User.findAll(page, limit, filters);

  const users = result.users.map((user) => user.toJSON());

  sendPaginatedResponse(res, users, result.total, result.page, result.limit);
});

/**
 * Get user by ID (admin only)
 * @route GET /api/auth/users/:id
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - User ID
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getUserById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user) {
    throw new NotFoundError('User');
  }

  sendSuccess(res, { user: user.toJSON() }, RESPONSE_MESSAGES.SUCCESS);
});

/**
 * Deactivate user (admin only)
 * @route PUT /api/auth/users/:id/deactivate
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - User ID
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const deactivateUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user) {
    throw new NotFoundError('User');
  }

  await user.deactivate();

  sendSuccess(res, null, 'User deactivated successfully');
});

/**
 * Permanently delete user (admin only)
 * @route DELETE /api/auth/users/:id
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - User ID
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { query } = require('../config/db');

  // Check if user exists
  const user = await User.findById(id);
  if (!user) {
    throw new NotFoundError('User');
  }

  // Prevent deleting admin users
  if (user.role === 'admin') {
    return res.status(403).json({
      success: false,
      message: 'لا يمكن حذف حساب المدير',
    });
  }

  // Delete all related data in order (due to foreign key constraints)
  // 1. Delete messages
  await query('DELETE FROM messages WHERE sender_id = $1', [id]);

  // 2. Delete notifications
  await query('DELETE FROM notifications WHERE user_id = $1', [id]);

  // 3. Delete ratings (given and received)
  await query('DELETE FROM ratings WHERE rater_id = $1 OR rated_user_id = $1', [id]);

  // 4. Delete bookings related to user's offers
  await query(
    `
    DELETE FROM bookings 
    WHERE offer_id IN (SELECT id FROM offers WHERE user_id = $1)
  `,
    [id]
  );

  // 5. Delete user's own bookings
  await query('DELETE FROM bookings WHERE user_id = $1', [id]);

  // 6. Delete demand responses (as driver)
  await query('DELETE FROM demand_responses WHERE driver_id = $1', [id]);

  // 7. Delete demand responses for user's demands
  await query(
    `
    DELETE FROM demand_responses 
    WHERE demand_id IN (SELECT id FROM demands WHERE user_id = $1)
  `,
    [id]
  );

  // 8. Delete demands
  await query('DELETE FROM demands WHERE user_id = $1', [id]);

  // 9. Delete offers
  await query('DELETE FROM offers WHERE user_id = $1', [id]);

  // 10. Delete line subscriptions
  await query('DELETE FROM line_subscriptions WHERE user_id = $1', [id]);

  // 11. Delete lines (if driver)
  await query('DELETE FROM lines WHERE driver_id = $1', [id]);

  // 12. Delete OTP requests
  await query('DELETE FROM otp_requests WHERE phone = $1', [user.phone]);

  // 13. Finally, delete the user
  await query('DELETE FROM users WHERE id = $1', [id]);

  // Audit log
  await auditLog(
    'users',
    id,
    'delete',
    { name: user.name, email: user.email, phone: user.phone },
    null,
    req.user.id,
    req.ip
  );

  logger.info(`User ${id} (${user.name}) permanently deleted by admin ${req.user.id}`);

  sendSuccess(res, null, 'تم حذف المستخدم نهائياً');
});

/**
 * Update email address
 * @route PUT /api/auth/email
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user from middleware
 * @param {Object} req.body - Request body
 * @param {string} req.body.newEmail - New email address
 * @param {string} req.body.password - Current password for verification
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const updateEmail = catchAsync(async (req, res) => {
  const { newEmail, password } = req.body;

  const email = await authService.updateEmail(req.user.id, req.user.email, newEmail, password);

  sendSuccess(res, { email }, 'Email updated successfully');
});

/**
 * Delete user account
 * @route DELETE /api/auth/account
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user from middleware
 * @param {Object} req.body - Request body
 * @param {string} req.body.password - Current password for verification
 * @param {string} req.body.confirmation - Confirmation text (must be 'DELETE')
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const deleteAccount = catchAsync(async (req, res) => {
  const { password, confirmation } = req.body;

  await authService.deleteAccount(req.user.id, req.user.email, password, confirmation);

  sendSuccess(res, null, 'Account deleted successfully');
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  updateEmail,
  deleteAccount,
  getUserStats,
  getAllUsers,
  getUserById,
  deactivateUser,
  deleteUser,
};
