import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export default function Login({ onSwitchToRegister: _onSwitchToRegister, onClose }) {
  const { login, loading, error } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateEmail = () => {
    if (!formData.email.trim()) {
      setFormErrors((prev) => ({ ...prev, email: 'البريد الإلكتروني أو رقم الهاتف مطلوب' }));
      return false;
    }
    // Basic validation for email or phone
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^07\d{9}$/;
    if (!emailPattern.test(formData.email) && !phonePattern.test(formData.email)) {
      setFormErrors((prev) => ({
        ...prev,
        email: 'الرجاء إدخال بريد إلكتروني صحيح أو رقم هاتف (07XXXXXXXXX)',
      }));
      return false;
    }
    setFormErrors((prev) => ({ ...prev, email: '' }));
    return true;
  };

  const validatePassword = () => {
    if (!formData.password) {
      setFormErrors((prev) => ({ ...prev, password: 'كلمة المرور مطلوبة' }));
      return false;
    }
    if (formData.password.length < 5) {
      setFormErrors((prev) => ({ ...prev, password: 'كلمة المرور يجب أن تكون 5 أحرف على الأقل' }));
      return false;
    }
    setFormErrors((prev) => ({ ...prev, password: '' }));
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields before submission
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    const result = await login(formData);
    if (result.success) {
      // Show welcome message with user role
      const userRole = result.user.isDriver ? 'سائق' : 'راكب';
      showSuccess(`مرحباً ${result.user.name}! تم تسجيل دخولك ك${userRole} 🎉`);
      onClose();
    } else if (result.error?.code === 'EMAIL_NOT_VERIFIED') {
      // Show resend verification button
      setShowResendButton(true);
      showError('Please verify your email address before logging in.');
    }
  };

  const handleResendVerification = async () => {
    // Store email and navigate to verification reminder
    localStorage.setItem('userEmail', formData.email);
    onClose();
    navigate('/email-verification-reminder', { state: { email: formData.email } });
  };

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        position: 'relative',
      }}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        aria-label="إغلاق"
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'none',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          color: '#6b7280',
          padding: '8px',
        }}
      >
        ×
      </button>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2
          style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#1f2937',
            margin: '0 0 8px 0',
          }}
        >
          تسجيل الدخول
        </h2>
        <p
          style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: '0',
          }}
        >
          أهلاً بك في توصيلة
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '14px',
            textAlign: 'center',
          }}
        >
          {error}
          {showResendButton && (
            <button
              type="button"
              onClick={handleResendVerification}
              style={{
                marginTop: '12px',
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Resend Verification Email / إعادة إرسال بريد التحقق
            </button>
          )}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
      >
        {/* Email/Phone Input */}
        <div>
          <label
            htmlFor="email"
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px',
            }}
          >
            البريد الإلكتروني أو رقم الهاتف
          </label>
          <input
            id="email"
            type="text"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={validateEmail}
            placeholder="example@email.com أو 07XXXXXXXXX"
            required
            aria-required="true"
            aria-invalid={!!formErrors.email}
            aria-describedby={formErrors.email ? 'email-error' : undefined}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: `2px solid ${formErrors.email ? '#dc2626' : '#e5e7eb'}`,
              borderRadius: '8px',
              fontSize: '16px',
              outline: 'none',
              transition: 'border-color 0.2s ease',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              if (!formErrors.email) e.target.style.borderColor = '#3b82f6';
            }}
          />
          {formErrors.email && (
            <div
              id="email-error"
              role="alert"
              style={{
                color: '#dc2626',
                fontSize: '12px',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>⚠️</span>
              {formErrors.email}
            </div>
          )}
        </div>

        {/* Password Input */}
        <div>
          <label
            htmlFor="password"
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px',
            }}
          >
            كلمة المرور
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={validatePassword}
              placeholder="أدخل كلمة المرور (5 أحرف أو أرقام على الأقل)"
              required
              aria-required="true"
              aria-invalid={!!formErrors.password}
              aria-describedby={
                formErrors.password ? 'password-error password-help' : 'password-help'
              }
              style={{
                width: '100%',
                padding: '12px 48px 12px 16px',
                border: `2px solid ${formErrors.password ? '#dc2626' : '#e5e7eb'}`,
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                if (!formErrors.password) e.target.style.borderColor = '#3b82f6';
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                color: '#6b7280',
                minWidth: '48px',
                minHeight: '48px',
              }}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          {formErrors.password && (
            <div
              id="password-error"
              role="alert"
              style={{
                color: '#dc2626',
                fontSize: '12px',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>⚠️</span>
              {formErrors.password}
            </div>
          )}
          <div
            id="password-help"
            style={{
              fontSize: '12px',
              color: '#6b7280',
              marginTop: '4px',
            }}
          >
            كلمة المرور يجب أن تكون 5 أحرف أو أرقام على الأقل
          </div>
        </div>

        {/* Forgot Password Link */}
        <div style={{ textAlign: 'left', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/forgot-password');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#3b82f6',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            نسيت كلمة المرور؟ / Forgot Password?
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            border: 'none',
            padding: '14px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            marginTop: '8px',
          }}
        >
          {loading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
        </button>
      </form>

      {/* Demo Users Info */}
      <div
        style={{
          marginTop: '24px',
          padding: '16px',
          background: '#f0f9ff',
          borderRadius: '8px',
          border: '1px solid #0ea5e9',
        }}
      >
        <h4
          style={{
            margin: '0 0 12px 0',
            fontSize: '14px',
            fontWeight: '600',
            color: '#0369a1',
          }}
        >
          🧪 مستخدمين تجريبيين:
        </h4>
        <div
          style={{
            fontSize: '13px',
            color: '#0369a1',
            lineHeight: '1.8',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '18px' }}>👤</span>
            <strong>راكب:</strong> passenger@test.com (أي كلمة مرور)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🚗</span>
            <strong>سائق:</strong> driver@test.com (أي كلمة مرور)
          </div>
        </div>
        <div
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #bae6fd',
            fontSize: '12px',
            color: '#0369a1',
            fontStyle: 'italic',
          }}
        >
          💡 نوع المستخدم يتم تحديده عند التسجيل
        </div>
      </div>

      {/* Switch to Register — DISABLED email registration, redirect to phone OTP page */}
      {/* TODO: To re-enable email registration, restore onClick={onSwitchToRegister} */}
      <div
        style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '14px',
          color: '#6b7280',
        }}
      >
        ليس لديك حساب؟{' '}
        <button
          type="button"
          onClick={() => {
            onClose();
            navigate('/login');
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#3b82f6',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          إنشاء حساب جديد
        </button>
      </div>
    </div>
  );
}
