import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { otpAPI } from '../services/api';
import './PhoneLogin.css';

const PhoneLogin = () => {
  const [step, setStep] = useState(1); // 1: phone, 2: password OR code, 3: set-password OR profile
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [verifiedOtpCode, setVerifiedOtpCode] = useState(''); // Store verified OTP for set-password step
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Toggle password visibility
  const [isDriver, setIsDriver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [channel, setChannel] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [requiresPassword, setRequiresPassword] = useState(false); // User has password, must login with it
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false); // Existing user needs to set password

  const navigate = useNavigate();
  const { login } = useAuth();
  const codeInputsRef = useRef([]);
  const countdownTimerRef = useRef(null);

  // Clear error when user starts typing
  useEffect(() => {
    if (error) {
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, code, name, password]);

  // Cleanup countdown timer on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // Format phone display (07X XXX XXXX)
  const formatPhoneDisplay = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    if (cleaned.length <= 10)
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
  };

  // Start resend countdown
  const startCountdown = () => {
    setCountdown(60);
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Send OTP or check if password is required
  const handleSendOTP = async () => {
    const cleanedPhone = phone.replace(/\D/g, '');
    if (!cleanedPhone || cleanedPhone.length < 10) {
      setError('الرجاء إدخال رقم هاتف صحيح');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await otpAPI.send(cleanedPhone);

      // User has password - must login with password
      if (response.requiresPassword || response.hasPassword) {
        console.log('User has password, require password login');
        setRequiresPassword(true);
        setStep(2); // Move to password input step
        return;
      }

      // Existing user WITHOUT password - need to set password via OTP
      if (response.userExists && !response.hasPassword) {
        console.log('Existing user without password, sending OTP to set password');
        setNeedsPasswordSetup(true);
        setChannel(response.channel);
        setStep(2); // Move to OTP verification step
        startCountdown();
        // Focus first code input after step change
        setTimeout(() => {
          if (codeInputsRef.current[0]) {
            codeInputsRef.current[0].focus();
          }
        }, 100);
        return;
      }

      // New user - proceed with OTP verification to register
      console.log('New user, sending OTP for registration');
      setChannel(response.channel);
      setStep(2);
      startCountdown();
      // Focus first code input after step change
      setTimeout(() => {
        if (codeInputsRef.current[0]) {
          codeInputsRef.current[0].focus();
        }
      }, 100);
    } catch (err) {
      setError(err.message || 'فشل في إرسال رمز التحقق');
    } finally {
      setLoading(false);
    }
  };

  // Handle code input
  const handleCodeChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      codeInputsRef.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (index === 5 && value) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        setTimeout(() => handleVerifyOTP(fullCode), 100);
      }
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length > 0) {
      const newCode = [...code];
      for (let i = 0; i < pastedData.length; i++) {
        newCode[i] = pastedData[i];
      }
      setCode(newCode);

      // Focus appropriate input
      if (pastedData.length === 6) {
        setTimeout(() => handleVerifyOTP(pastedData), 100);
      } else {
        codeInputsRef.current[pastedData.length]?.focus();
      }
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputsRef.current[index - 1]?.focus();
    }
  };

  // Login with password
  const handlePasswordLogin = async () => {
    if (!password || password.length < 5) {
      setError('الرجاء إدخال كلمة المرور (5 أحرف على الأقل)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const cleanedPhone = phone.replace(/\D/g, '');
      const response = await otpAPI.loginWithPassword(cleanedPhone, password);

      // Successful login
      login(response.token, response.user);
      navigate('/home');
    } catch (err) {
      setError(err.message || 'رقم الهاتف أو كلمة المرور غير صحيحة');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP (for new users or existing users setting password)
  const handleVerifyOTP = async (codeString = null) => {
    const otpCode = codeString || code.join('');
    if (otpCode.length !== 6) {
      setError('الرجاء إدخال رمز التحقق كاملاً');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const cleanedPhone = phone.replace(/\D/g, '');
      const response = await otpAPI.verify(cleanedPhone, otpCode);

      // Save verified OTP code for later use in set-password step
      setVerifiedOtpCode(otpCode);

      if (response.isNewUser) {
        // New user - go to registration profile step
        setStep(3);
      } else {
        // Existing user without password - go to set password step
        setStep(3);
        setNeedsPasswordSetup(true);
      }
    } catch (err) {
      setError(err.message || 'رمز التحقق غير صحيح');
      // Clear code inputs
      setCode(['', '', '', '', '', '']);
      codeInputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Complete registration (for new users)
  const handleCompleteRegistration = async () => {
    if (!name.trim()) {
      setError('الرجاء إدخال الاسم');
      return;
    }

    if (!password || password.length < 5) {
      setError('الرجاء إدخال كلمة المرور (5 أحرف على الأقل)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const cleanedPhone = phone.replace(/\D/g, '');
      const response = await otpAPI.completeRegistration(
        cleanedPhone,
        name.trim(),
        isDriver,
        password
      );
      console.log('[PHONELOG] ========================================');
      console.log('[PHONELOG] 📥 RAW API RESPONSE from completeRegistration:');
      console.log('[PHONELOG] Full response:', JSON.stringify(response, null, 2));
      console.log('[PHONELOG] User ID from response:', response.user?.id);
      console.log('[PHONELOG] User ID length:', response.user?.id?.length);
      console.log('[PHONELOG] User ID type:', typeof response.user?.id);
      console.log('[PHONELOG] ========================================');
      login(response.token, response.user);
      navigate('/home');
    } catch (err) {
      setError(err.message || 'فشل في إكمال التسجيل');
    } finally {
      setLoading(false);
    }
  };

  // Set password for existing users
  const handleSetPassword = async () => {
    if (!password || password.length < 5) {
      setError('الرجاء إدخال كلمة المرور (5 أحرف على الأقل)');
      return;
    }

    if (!verifiedOtpCode) {
      setError('خطأ: لم يتم العثور على رمز التحقق. يرجى المحاولة مرة أخرى');
      setStep(1); // Go back to start
      return;
    }

    setLoading(true);
    setError('');

    try {
      const cleanedPhone = phone.replace(/\D/g, '');
      const response = await otpAPI.setPassword(cleanedPhone, password, verifiedOtpCode);
      login(response.token, response.user);
      navigate('/home');
    } catch (err) {
      setError(err.message || 'فشل في تعيين كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  // Handle phone input change
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      setPhone(value);
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
        {/* Logo */}
        <div className="login-logo">
          <div className="logo-icon">🚗</div>
          <h1>توصيلة</h1>
          <p className="logo-subtitle">رحلات مشتركة آمنة وموثوقة</p>
        </div>

        {/* Step 1: Phone Number */}
        {step === 1 && (
          <div className="login-step">
            <h2>مرحباً بك</h2>
            <p>أدخل رقم هاتفك للمتابعة</p>

            <div className="phone-input-container">
              <div className="country-code">
                <span className="flag">🇮🇶</span>
                <span className="code">+964</span>
              </div>
              <input
                type="tel"
                value={formatPhoneDisplay(phone)}
                onChange={handlePhoneChange}
                onKeyPress={(e) => handleKeyPress(e, handleSendOTP)}
                placeholder="7XX XXX XXXX"
                maxLength={14}
                autoFocus
                dir="ltr"
              />
            </div>

            {error && <p className="error-message">{error}</p>}

            <button className="submit-btn" onClick={handleSendOTP} disabled={loading}>
              {loading ? (
                <span className="loading-spinner">
                  <span className="spinner"></span>
                  جاري الإرسال...
                </span>
              ) : (
                'إرسال رمز التحقق'
              )}
            </button>

            <p className="terms-text">
              بالمتابعة، أنت توافق على <a href="/privacy-policy">سياسة الخصوصية</a> و
              <a href="/about">شروط الاستخدام</a>
            </p>
          </div>
        )}

        {/* Step 2: Password Login OR OTP Code */}
        {step === 2 && requiresPassword && (
          <div className="login-step">
            <h2>تسجيل الدخول</h2>
            <p>
              أدخل كلمة المرور للرقم
              <br />
              <strong dir="ltr" className="phone-display">
                +964 {formatPhoneDisplay(phone)}
              </strong>
            </p>

            <div className="form-group">
              <label htmlFor="password">كلمة المرور</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handlePasswordLogin)}
                  placeholder="أدخل كلمة المرور"
                  autoFocus
                  style={{ paddingLeft: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    padding: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {error && <p className="error-message">{error}</p>}

            <button
              className="submit-btn"
              onClick={handlePasswordLogin}
              disabled={loading || !password}
            >
              {loading ? (
                <span className="loading-spinner">
                  <span className="spinner"></span>
                  جاري تسجيل الدخول...
                </span>
              ) : (
                'دخول'
              )}
            </button>

            <Link to="/forgot-password" className="forgot-password-link">
              نسيت كلمة المرور؟
            </Link>

            <button
              className="back-btn"
              onClick={() => {
                setStep(1);
                setPassword('');
                setShowPassword(false);
                setRequiresPassword(false);
                setError('');
              }}
            >
              ← تغيير رقم الهاتف
            </button>
          </div>
        )}

        {/* Step 2: OTP Code (for new users or existing users without password) */}
        {step === 2 && !requiresPassword && (
          <div className="login-step">
            <h2>رمز التحقق</h2>
            <p>
              تم إرسال رمز التحقق إلى
              <br />
              <strong dir="ltr" className="phone-display">
                +964 {formatPhoneDisplay(phone)}
              </strong>
              <br />
              <span className="channel-info">
                عبر {channel === 'whatsapp' ? 'واتساب 💬' : 'رسالة نصية 📱'}
              </span>
            </p>

            <div className="code-inputs" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (codeInputsRef.current[index] = el)}
                  type="tel"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  maxLength={1}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {error && <p className="error-message">{error}</p>}

            <button
              className="submit-btn"
              onClick={() => handleVerifyOTP()}
              disabled={loading || code.join('').length !== 6}
            >
              {loading ? (
                <span className="loading-spinner">
                  <span className="spinner"></span>
                  جاري التحقق...
                </span>
              ) : (
                'تأكيد'
              )}
            </button>

            <div className="resend-section">
              {countdown > 0 ? (
                <p className="countdown-text">
                  إعادة الإرسال بعد <span className="countdown-number">{countdown}</span> ثانية
                </p>
              ) : (
                <button className="resend-btn" onClick={handleSendOTP} disabled={loading}>
                  إعادة إرسال الرمز
                </button>
              )}
            </div>

            <button
              className="back-btn"
              onClick={() => {
                setStep(1);
                setCode(['', '', '', '', '', '']);
                setError('');
              }}
            >
              ← تغيير رقم الهاتف
            </button>
          </div>
        )}

        {/* Step 3: Set Password (for existing users) OR Complete Profile (new users) */}
        {step === 3 && needsPasswordSetup && (
          <div className="login-step">
            <h2>تعيين كلمة المرور</h2>
            <p>من فضلك قم بإنشاء كلمة مرور لحسابك لتأمين تسجيل الدخول</p>

            <div className="form-group">
              <label htmlFor="password">كلمة المرور الجديدة</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handleSetPassword)}
                  placeholder="5 أحرف على الأقل"
                  autoFocus
                  style={{ paddingLeft: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    padding: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <small className="input-hint">يجب أن تتكون من 5 أحرف على الأقل</small>
            </div>

            {error && <p className="error-message">{error}</p>}

            <button
              className="submit-btn"
              onClick={handleSetPassword}
              disabled={loading || !password || password.length < 5}
            >
              {loading ? (
                <span className="loading-spinner">
                  <span className="spinner"></span>
                  جاري حفظ كلمة المرور...
                </span>
              ) : (
                'حفظ وتسجيل الدخول'
              )}
            </button>
          </div>
        )}

        {/* Step 3: Complete Profile (for new users) */}
        {step === 3 && !needsPasswordSetup && (
          <div className="login-step">
            <h2>أكمل معلوماتك</h2>
            <p>مرحباً! أخبرنا المزيد عنك</p>

            <div className="form-group">
              <label htmlFor="name">الاسم الكامل</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل اسمك"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">كلمة المرور</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="reg-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="5 أحرف على الأقل"
                  style={{ paddingLeft: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    padding: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <small className="input-hint">يجب أن تتكون من 5 أحرف على الأقل</small>
            </div>

            <div className="user-type-selector">
              <label>كيف ستستخدم توصيلة؟</label>
              <div className="type-options">
                <button
                  type="button"
                  className={`type-option ${!isDriver ? 'active' : ''}`}
                  onClick={() => setIsDriver(false)}
                >
                  <span className="type-icon">👤</span>
                  <span className="type-label">راكب</span>
                  <span className="type-desc">أبحث عن رحلات</span>
                </button>
                <button
                  type="button"
                  className={`type-option ${isDriver ? 'active' : ''}`}
                  onClick={() => setIsDriver(true)}
                >
                  <span className="type-icon">🚗</span>
                  <span className="type-label">سائق</span>
                  <span className="type-desc">أقدم رحلات</span>
                </button>
              </div>
            </div>

            {error && <p className="error-message">{error}</p>}

            <button
              className="submit-btn"
              onClick={handleCompleteRegistration}
              disabled={loading || !name.trim() || !password || password.length < 5}
            >
              {loading ? (
                <span className="loading-spinner">
                  <span className="spinner"></span>
                  جاري التسجيل...
                </span>
              ) : (
                'ابدأ الآن 🚀'
              )}
            </button>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="step-indicator">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`}></div>
          <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`step-dot ${step >= 3 ? 'active' : ''}`}></div>
        </div>
      </div>
    </div>
  );
};

export default PhoneLogin;
