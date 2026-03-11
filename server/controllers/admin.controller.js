/**
 * Admin Controller
 * Handles admin-only operations: user search, OTP history, password reset, phone verification
 */

const { query } = require('../config/db');
const axios = require('axios');
const config = require('../config/env');

// Get OTPIQ API key from environment
const OTPIQ_API_KEY = process.env.OTPIQ_API_KEY;

/**
 * Generate a random 6-digit OTP code
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Format Iraqi phone number to international format
 */
const formatIraqiPhone = (phone) => {
  if (!phone) return null;

  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // Handle different formats
  if (cleaned.startsWith('00964')) {
    cleaned = cleaned.substring(5);
  } else if (cleaned.startsWith('964')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Validate: should be 10 digits starting with 7
  if (cleaned.length !== 10 || !cleaned.startsWith('7')) {
    return null;
  }

  return '+964' + cleaned;
};

/**
 * Search users by phone, name, or email
 * GET /api/admin/users/search?q=searchTerm
 */
const searchUsers = async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح - يتطلب صلاحيات المدير',
      });
    }

    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'يرجى إدخال كلمة بحث (3 أحرف على الأقل)',
      });
    }

    const searchTerm = `%${q.trim()}%`;

    const result = await query(
      `
      SELECT 
        id, 
        name, 
        phone, 
        email, 
        role,
        phone_verified,
        is_driver,
        created_at,
        password IS NOT NULL as has_password
      FROM users 
      WHERE 
        phone ILIKE $1 OR 
        name ILIKE $1 OR 
        email ILIKE $1
      ORDER BY created_at DESC
      LIMIT 20
    `,
      [searchTerm]
    );

    res.json({
      success: true,
      users: result.rows.map((user) => ({
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        phoneVerified: user.phone_verified,
        isDriver: user.is_driver,
        hasPassword: user.has_password,
        createdAt: user.created_at,
      })),
    });
  } catch (error) {
    console.error('Search Users Error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في البحث',
    });
  }
};

/**
 * Get OTP history for a phone number
 * GET /api/admin/otp-requests?phone=07876027172
 */
const getOTPHistory = async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح - يتطلب صلاحيات المدير',
      });
    }

    let { phone } = req.query;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'رقم الهاتف مطلوب',
      });
    }

    // Format phone if provided in local format
    const formattedPhone = formatIraqiPhone(phone);
    const searchPhone = formattedPhone || `%${phone}%`;

    const result = await query(
      `
      SELECT 
        id, 
        phone, 
        CONCAT(SUBSTRING(code, 1, 2), '****') as code_masked,
        channel, 
        verified,
        expires_at,
        created_at,
        CASE WHEN expires_at > NOW() AND verified = false THEN true ELSE false END as is_valid
      FROM otp_requests 
      WHERE phone ILIKE $1
      ORDER BY created_at DESC
      LIMIT 20
    `,
      [formattedPhone ? formattedPhone : searchPhone]
    );

    res.json({
      success: true,
      otpRequests: result.rows.map((otp) => ({
        id: otp.id,
        phone: otp.phone,
        codeMasked: otp.code_masked,
        channel: otp.channel,
        verified: otp.verified,
        expiresAt: otp.expires_at,
        createdAt: otp.created_at,
        isValid: otp.is_valid,
      })),
    });
  } catch (error) {
    console.error('Get OTP History Error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب سجل OTP',
    });
  }
};

/**
 * Get user by ID (admin)
 * GET /api/admin/users/:id
 */
const getUserById = async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح - يتطلب صلاحيات المدير',
      });
    }

    const { id } = req.params;

    const result = await query(
      `
      SELECT 
        id, name, phone, email, role,
        phone_verified, is_driver, gender, city,
        created_at, updated_at,
        password IS NOT NULL as has_password,
        phone_verified_at,
        password_changed_at
      FROM users 
      WHERE id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'المستخدم غير موجود',
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        phoneVerified: user.phone_verified,
        isDriver: user.is_driver,
        gender: user.gender,
        city: user.city,
        hasPassword: user.has_password,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        phoneVerifiedAt: user.phone_verified_at,
        passwordChangedAt: user.password_changed_at,
      },
    });
  } catch (error) {
    console.error('Get User By ID Error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب بيانات المستخدم',
    });
  }
};

/**
 * Admin triggers password reset for a user (sends OTP)
 * POST /api/admin/users/:id/reset-password
 */
const adminResetPassword = async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح - يتطلب صلاحيات المدير',
      });
    }

    const { id } = req.params;

    // Get user
    const userResult = await query('SELECT id, phone, name FROM users WHERE id = $1', [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'المستخدم غير موجود',
      });
    }

    const user = userResult.rows[0];
    const phone = user.phone;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'المستخدم ليس لديه رقم هاتف مسجل',
      });
    }

    // Generate OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate previous OTPs
    await query(`UPDATE otp_requests SET verified = true WHERE phone = $1 AND verified = false`, [
      phone,
    ]);

    // Store OTP
    await query(
      `INSERT INTO otp_requests (phone, code, channel, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [phone, code, 'admin_reset', expiresAt]
    );

    // Send OTP via OTPIQ
    const phoneWithoutPlus = phone.replace('+', '');

    try {
      await axios.post(
        'https://api.otpiq.com/api/sms',
        {
          phoneNumber: phoneWithoutPlus,
          smsType: 'verification',
          verificationCode: code,
          provider: 'whatsapp-sms',
        },
        {
          headers: {
            Authorization: `Bearer ${OTPIQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      console.log(
        `Admin reset password OTP sent to ${phone.slice(0, 7)}**** for user ${user.name}`
      );

      res.json({
        success: true,
        message: `تم إرسال رمز إعادة تعيين كلمة المرور إلى ${phone.slice(0, 7)}****`,
      });
    } catch (otpError) {
      console.error('OTP Send Error:', otpError);

      // Still return success as OTP is in DB (they can check history)
      res.json({
        success: true,
        message: 'تم إنشاء رمز إعادة التعيين (قد يكون هناك مشكلة في إرسال الرسالة)',
        warning: 'فشل إرسال الرسالة - يمكن للمستخدم طلب رمز جديد',
      });
    }
  } catch (error) {
    console.error('Admin Reset Password Error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في إعادة تعيين كلمة المرور',
    });
  }
};

/**
 * Admin manually verifies user phone
 * POST /api/admin/users/:id/verify-phone
 */
const adminVerifyPhone = async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح - يتطلب صلاحيات المدير',
      });
    }

    const { id } = req.params;

    // Update user
    const result = await query(
      `UPDATE users 
       SET phone_verified = true, phone_verified_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, phone`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'المستخدم غير موجود',
      });
    }

    const user = result.rows[0];
    console.log(`Admin verified phone for user: ${user.name} (${user.phone})`);

    res.json({
      success: true,
      message: `تم التحقق من رقم هاتف المستخدم ${user.name}`,
    });
  } catch (error) {
    console.error('Admin Verify Phone Error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في التحقق من الهاتف',
    });
  }
};

module.exports = {
  searchUsers,
  getOTPHistory,
  getUserById,
  adminResetPassword,
  adminVerifyPhone,
};
