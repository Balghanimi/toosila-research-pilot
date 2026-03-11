const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your input data',
      details: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  // Required fields
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 5 })
    .withMessage('كلمة المرور يجب أن تكون 5 أحرف أو أرقام على الأقل'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('isDriver').optional().isBoolean().withMessage('isDriver must be a boolean'),
  body('languagePreference')
    .optional()
    .isIn(['ar', 'en'])
    .withMessage('Language must be either ar or en'),

  // New optional fields - All users
  body('phone')
    .optional()
    .trim()
    .matches(/^(\+964|0)?7[0-9]{9}$/)
    .withMessage('رقم الهاتف غير صحيح - يجب أن يكون بصيغة عراقية'),
  // GENDER IS REQUIRED FOR ALL USERS (for ladies-only rides feature)
  body('gender')
    .notEmpty()
    .withMessage('الجنس مطلوب')
    .isIn(['male', 'female'])
    .withMessage('الجنس يجب أن يكون ذكر أو أنثى'),
  body('city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('اسم المدينة يجب أن يكون بين 2 و 100 حرف'),
  body('dateOfBirth').optional().isISO8601().withMessage('تاريخ الميلاد غير صحيح'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('العنوان يجب أن لا يتجاوز 500 حرف'),
  body('emergencyContactName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('اسم جهة الاتصال الطارئة يجب أن يكون بين 2 و 100 حرف'),
  body('emergencyContactPhone')
    .optional()
    .trim()
    .matches(/^(\+964|0)?7[0-9]{9}$/)
    .withMessage('رقم هاتف جهة الاتصال الطارئة غير صحيح'),

  // Driver-specific fields - Required when isDriver is true
  body('nationalId')
    .if(body('isDriver').equals(true))
    .notEmpty()
    .withMessage('الرقم الوطني مطلوب للسائقين')
    .bail()
    .isLength({ min: 10, max: 20 })
    .withMessage('الرقم الوطني يجب أن يكون بين 10 و 20 رقم'),
  // Driver's license is optional (recommended but not required)
  body('driverLicenseNumber')
    .optional()
    .isLength({ min: 5, max: 50 })
    .withMessage('رقم رخصة القيادة يجب أن يكون بين 5 و 50 حرف'),
  body('vehicleType')
    .if(body('isDriver').equals(true))
    .notEmpty()
    .withMessage('نوع المركبة مطلوب للسائقين')
    .bail()
    .isIn(['sedan', 'suv', 'van', 'truck', 'pickup'])
    .withMessage('نوع المركبة غير صحيح'),
  body('vehicleMake')
    .if(body('isDriver').equals(true))
    .notEmpty()
    .withMessage('شركة صنع المركبة مطلوبة للسائقين')
    .bail()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('شركة صنع المركبة يجب أن تكون بين 2 و 50 حرف'),
  body('vehicleModel')
    .if(body('isDriver').equals(true))
    .notEmpty()
    .withMessage('موديل المركبة مطلوب للسائقين')
    .bail()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('موديل المركبة يجب أن يكون بين 2 و 50 حرف'),
  body('vehicleYear')
    .if(body('isDriver').equals(true))
    .notEmpty()
    .withMessage('سنة صنع المركبة مطلوبة للسائقين')
    .bail()
    .isInt({ min: 2000, max: 2026 })
    .withMessage('سنة صنع المركبة يجب أن تكون بين 2000 و 2026'),
  body('vehicleColor')
    .if(body('isDriver').equals(true))
    .notEmpty()
    .withMessage('لون المركبة مطلوب للسائقين')
    .bail()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('لون المركبة يجب أن يكون بين 2 و 30 حرف'),
  body('licensePlate')
    .if(body('isDriver').equals(true))
    .notEmpty()
    .withMessage('رقم لوحة المركبة مطلوب للسائقين')
    .bail()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('رقم لوحة المركبة يجب أن يكون بين 3 و 20 حرف'),
  body('seatsAvailable')
    .if(body('isDriver').equals(true))
    .notEmpty()
    .withMessage('عدد المقاعد المتاحة مطلوب للسائقين')
    .bail()
    .isInt({ min: 1, max: 7 })
    .withMessage('عدد المقاعد يجب أن يكون بين 1 و 7'),

  handleValidationErrors,
];

const validateUserLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('languagePreference')
    .optional()
    .isIn(['ar', 'en'])
    .withMessage('Language must be either ar or en'),
  body('isDriver').optional().isBoolean().withMessage('isDriver must be a boolean value'),
  handleValidationErrors,
];

// Offer validation rules (for ride sharing offers)
const validateOfferCreation = [
  body('fromCity')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('From city must be between 2 and 100 characters'),
  body('toCity')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('To city must be between 2 and 100 characters'),
  body('departureTime').isISO8601().withMessage('Please provide a valid departure time'),
  body('seats').isInt({ min: 1, max: 7 }).withMessage('Seats must be between 1 and 7'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('fromLat').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('fromLng').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('toLat').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('toLng').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('fromAddress').optional().trim().isLength({ max: 500 }).withMessage('Address too long'),
  body('toAddress').optional().trim().isLength({ max: 500 }).withMessage('Address too long'),
  handleValidationErrors,
];

const validateOfferUpdate = [
  body('fromCity')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('From city must be between 2 and 100 characters'),
  body('toCity')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('To city must be between 2 and 100 characters'),
  body('departureTime').optional().isISO8601().withMessage('Please provide a valid departure time'),
  body('seats').optional().isInt({ min: 1, max: 7 }).withMessage('Seats must be between 1 and 7'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  handleValidationErrors,
];

// Demand validation rules
const validateDemandCreation = [
  body('fromCity')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('From city must be between 2 and 100 characters'),
  body('toCity')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('To city must be between 2 and 100 characters'),
  body('earliestTime').isISO8601().withMessage('Please provide a valid earliest time'),
  body('latestTime').isISO8601().withMessage('Please provide a valid latest time'),
  body('seats').isInt({ min: 1, max: 7 }).withMessage('Seats must be between 1 and 7'),
  body('budgetMax').isFloat({ min: 0 }).withMessage('Budget max must be a positive number'),
  body('fromLat').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('fromLng').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('toLat').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('toLng').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('fromAddress').optional().trim().isLength({ max: 500 }).withMessage('Address too long'),
  body('toAddress').optional().trim().isLength({ max: 500 }).withMessage('Address too long'),
  handleValidationErrors,
];

// Booking validation rules
const validateBookingCreation = [
  body('offerId').isUUID(4).withMessage('Invalid offer ID format / معرّف العرض غير صالح'),
  body('seats').optional().isInt({ min: 1, max: 7 }).withMessage('Seats must be between 1 and 7'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message must not exceed 500 characters'),
  handleValidationErrors,
];

// Message validation rules (ride-based messaging)
const validateMessageCreation = [
  body('rideType')
    .isIn(['offer', 'demand'])
    .withMessage('Invalid ride type. Must be "offer" or "demand"'),
  body('rideId').isUUID(4).withMessage('Invalid ride ID format / معرّف الرحلة غير صالح'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message content must be between 1 and 1000 characters'),
  handleValidationErrors,
];

// Rating validation rules
const validateRatingCreation = [
  body('targetUserId').isUUID(4).withMessage('Invalid user ID format / معرّف المستخدم غير صالح'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment must not exceed 500 characters'),
  handleValidationErrors,
];

// Parameter validation
const validateId = [
  param('id').isUUID(4).withMessage('Invalid ID format / معرّف غير صالح'),
  handleValidationErrors,
];

// User ID parameter validation
const validateUserId = [
  param('userId').isUUID(4).withMessage('Invalid ID format / معرّف غير صالح'),
  handleValidationErrors,
];

// Integer ID validation (for bookings, offers, etc.)
const validateIntId = [
  param('id').isInt({ min: 1 }).withMessage('Invalid ID format / معرّف غير صالح'),
  handleValidationErrors,
];

// Query validation
const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateOfferCreation,
  validateOfferUpdate,
  validateDemandCreation,
  validateBookingCreation,
  validateMessageCreation,
  validateRatingCreation,
  validateId,
  validateUserId,
  validateIntId,
  validatePagination,
};
