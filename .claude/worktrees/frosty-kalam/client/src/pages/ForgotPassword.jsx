import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { otpAPI } from '../services/api';
import './PhoneLogin.css'; // Reuse the same styling

const ForgotPassword = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Step management: 1 = Enter Phone, 2 = Enter OTP, 3 = New Password
  const [step, setStep] = useState(1);

  // Form data
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Refs for OTP inputs
  const codeRefs = [
    React.useRef(null),
    React.useRef(null),
    React.useRef(null),
    React.useRef(null),
    React.useRef(null),
    React.useRef(null),
  ];

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Format phone for display
  const formatPhoneDisplay = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)} ${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 10)}`;
  };

  // Step 1: Send OTP
  const handleSendOTP = async () => {
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setError('يرجى إدخال رقم هاتف صحيح');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await otpAPI.forgotPassword(phone.replace(/\D/g, ''));

      if (response.success) {
        setSuccess(response.message || 'تم إرسال رمز التحقق');
        setStep(2);
        setCountdown(60);
        // Focus first OTP input
        setTimeout(() => codeRefs[0].current?.focus(), 100);
      } else {
        setError(response.error || 'فشل في إرسال رمز التحقق');
      }
    } catch (err) {
      setError(err.message || 'حدث خطأ. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input
  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      codeRefs[index + 1].current?.focus();
    }

    // Auto-submit when all filled
    if (newCode.every((c) => c) && newCode.join('').length === 6) {
      // Move to step 3 (new password)
      setStep(3);
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      setStep(3);
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeRefs[index - 1].current?.focus();
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (countdown > 0) return;

    setLoading(true);
    setError('');

    try {
      const response = await otpAPI.forgotPassword(phone.replace(/\D/g, ''));
      if (response.success) {
        setSuccess('تم إرسال رمز جديد');
        setCountdown(60);
        setCode(['', '', '', '', '', '']);
      }
    } catch (err) {
      setError(err.message || 'فشل في إعادة الإرسال');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('يرجى إدخال كلمة المرور الجديدة');
      return;
    }

    if (newPassword.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const otp = code.join('');
      const response = await otpAPI.resetPassword(phone.replace(/\D/g, ''), otp, newPassword);

      if (response.success) {
        // Auto-login
        if (response.token && response.user) {
          login(response.token, response.user);
          setSuccess('تم إعادة تعيين كلمة المرور بنجاح!');
          setTimeout(() => navigate('/'), 1500);
        } else {
          setSuccess('تم إعادة تعيين كلمة المرور. يرجى تسجيل الدخول.');
          setTimeout(() => navigate('/login'), 1500);
        }
      } else {
        setError(response.error || 'فشل في إعادة تعيين كلمة المرور');
      }
    } catch (err) {
      setError(err.message || 'حدث خطأ. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  return (
    <div className="phone-login-container">
      <div className="phone-login-card">
        {/* Header */}
        <div className="phone-login-header">
          <div className="phone-login-icon">🔐</div>
          <h1>نسيت كلمة المرور؟</h1>
          <p>
            {step === 1 && 'أدخل رقم هاتفك لإعادة تعيين كلمة المرور'}
            {step === 2 && 'أدخل رمز التحقق المرسل إلى هاتفك'}
            {step === 3 && 'أدخل كلمة المرور الجديدة'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="steps-indicator">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>

        {/* Error / Success Messages */}
        {error && (
          <div className="phone-login-error">
            <span>⚠️</span> {error}
          </div>
        )}
        {success && (
          <div className="phone-login-success">
            <span>✓</span> {success}
          </div>
        )}

        {/* Step 1: Phone Number */}
        {step === 1 && (
          <div className="phone-login-step">
            <div className="phone-input-wrapper">
              <span className="phone-prefix">🇮🇶 +964</span>
              <input
                type="tel"
                value={formatPhoneDisplay(phone)}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                onKeyPress={(e) => handleKeyPress(e, handleSendOTP)}
                placeholder="7XX XXX XXXX"
                className="phone-input"
                disabled={loading}
                autoFocus
              />
            </div>

            <button
              onClick={handleSendOTP}
              disabled={loading || phone.replace(/\D/g, '').length < 10}
              className="phone-login-btn primary"
            >
              {loading ? (
                <>
                  <span className="spinner"></span> جاري الإرسال...
                </>
              ) : (
                'إرسال رمز التحقق'
              )}
            </button>
          </div>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <div className="phone-login-step">
            <div className="phone-display">
              <span>📱</span> +964 {formatPhoneDisplay(phone)}
              <button onClick={() => setStep(1)} className="change-phone-btn">
                تغيير
              </button>
            </div>

            <div className="otp-input-container" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={codeRefs[index]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="otp-input"
                  disabled={loading}
                />
              ))}
            </div>

            <div className="otp-actions">
              <button
                onClick={handleResend}
                disabled={countdown > 0 || loading}
                className="resend-btn"
              >
                {countdown > 0 ? `إعادة الإرسال (${countdown}s)` : 'إعادة إرسال الرمز'}
              </button>
            </div>

            <button
              onClick={() => setStep(3)}
              disabled={loading || code.join('').length !== 6}
              className="phone-login-btn primary"
            >
              التالي
            </button>
          </div>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <div className="phone-login-step">
            <div className="password-inputs">
              <div className="input-group">
                <label>كلمة المرور الجديدة</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="8 أحرف على الأقل"
                  className="password-input"
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div className="input-group">
                <label>تأكيد كلمة المرور</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handleResetPassword)}
                  placeholder="أعد إدخال كلمة المرور"
                  className="password-input"
                  disabled={loading}
                />
              </div>

              {/* Password strength indicator */}
              {newPassword && (
                <div className="password-strength">
                  <div
                    className={`strength-bar ${
                      newPassword.length >= 12
                        ? 'strong'
                        : newPassword.length >= 8
                          ? 'medium'
                          : 'weak'
                    }`}
                  ></div>
                  <span>
                    {newPassword.length >= 12
                      ? 'قوية ✓'
                      : newPassword.length >= 8
                        ? 'متوسطة'
                        : 'ضعيفة'}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleResetPassword}
              disabled={loading || !newPassword || !confirmPassword}
              className="phone-login-btn primary"
            >
              {loading ? (
                <>
                  <span className="spinner"></span> جاري الحفظ...
                </>
              ) : (
                'إعادة تعيين كلمة المرور'
              )}
            </button>
          </div>
        )}

        {/* Back to Login */}
        <div className="phone-login-footer">
          <Link to="/login" className="back-link">
            ← العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
