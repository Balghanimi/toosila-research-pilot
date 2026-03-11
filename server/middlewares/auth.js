const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { query } = require('../config/db');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required',
      message: 'Please provide a valid access token',
    });
  }

  jwt.verify(token, config.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({
        success: false,
        error: 'Token expired or invalid',
        message: 'Please login again',
      });
    }

    // Check if password was changed after token was issued
    try {
      const result = await query('SELECT password_changed_at FROM users WHERE id = $1', [
        decoded.id,
      ]);

      if (result.rows.length > 0 && result.rows[0].password_changed_at) {
        const passwordChangedAt = Math.floor(
          new Date(result.rows[0].password_changed_at).getTime() / 1000
        );

        if (decoded.iat && passwordChangedAt > decoded.iat) {
          return res.status(401).json({
            success: false,
            error: 'Password was changed. Please login again.',
          });
        }
      }

      req.user = decoded;
      next();
    } catch (dbError) {
      console.error('Auth middleware DB error:', dbError.message);
      req.user = decoded; // Fail open — don't break auth if DB is slow
      next();
    }
  });
};

// Middleware to verify refresh token
const authenticateRefreshToken = (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      error: 'Refresh token required',
      message: 'Please provide a valid refresh token',
    });
  }

  jwt.verify(refreshToken, config.JWT_REFRESH_SECRET, (err, user) => {
    if (err) {
      // Use 401 for token-related errors to trigger re-authentication
      return res.status(401).json({
        error: 'Invalid or expired refresh token',
        message: 'Please login again',
      });
    }

    req.user = user;
    next();
  });
};

// Optional authentication - sets req.user if token is valid, otherwise continues without user
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // No token provided - continue without user
    req.user = null;
    return next();
  }

  jwt.verify(token, config.JWT_SECRET, (err, user) => {
    if (err) {
      // Invalid token - continue without user
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Admin access required',
      message: 'This action requires admin privileges',
    });
  }
  next();
};

// Middleware to check if user owns the resource
const requireOwnership = (resourceUserIdField = 'user_id') => {
  return (req, res, next) => {
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];

    if (!req.user || req.user.id !== parseInt(resourceUserId)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own resources',
      });
    }
    next();
  };
};

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id }, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN,
  });
};

module.exports = {
  authenticateToken,
  authenticateRefreshToken,
  optionalAuth,
  requireAdmin,
  requireOwnership,
  generateAccessToken,
  generateRefreshToken,
};
