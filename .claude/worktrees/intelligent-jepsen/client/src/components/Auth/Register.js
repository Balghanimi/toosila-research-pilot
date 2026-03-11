import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Iraqi Cities List
const IRAQI_CITIES = [
  'بغداد',
  'البصرة',
  'الموصل',
  'أربيل',
  'النجف',
  'كربلاء',
  'كركوك',
  'السليمانية',
  'الحلة',
  'الناصرية',
  'العمارة',
  'الديوانية',
  'الكوت',
  'رمادي',
  'بعقوبة',
  'السماوة',
  'دهوك',
];

// Vehicle Types
const VEHICLE_TYPES = [
  { value: 'sedan', label: 'سيدان (صالون)' },
  { value: 'suv', label: 'دفع رباعي (SUV)' },
  { value: 'van', label: 'فان / باص' },
  { value: 'truck', label: 'شاحنة صغيرة' },
];

export default function Register({ onSwitchToLogin, onClose }) {
  const navigate = useNavigate();
  const { register } = useAuth();

  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    userType: '', // 'passenger' or 'driver'

    // Basic Info
    name: '',
    phone: '',
    gender: 'male', // Default to male
    email: '',
    password: '',
    confirmPassword: '',
    city: '',
    dateOfBirth: '',

    // Driver Specific
    nationalId: '',
    driverLicenseNumber: '',
    licenseExpiryDate: '',

    // Vehicle Info (Driver only)
    vehicleType: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    licensePlate: '',
    seatsAvailable: '',

    acceptTerms: false,
  });

  const [formErrors, setFormErrors] = useState({});

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Validate current step
  const validateStep = (step) => {
    const errors = {};

    if (step === 1) {
      if (!formData.userType) {
        errors.userType = 'يرجى اختيار نوع الحساب';
      }
    }

    if (step === 2) {
      if (!formData.name.trim()) errors.name = 'الاسم مطلوب';

      // Phone validation (Iraqi format: 07xxxxxxxxx)
      const phoneRegex = /^07\d{9}$/;
      if (!formData.phone) {
        errors.phone = 'رقم الهاتف مطلوب';
      } else if (!phoneRegex.test(formData.phone)) {
        errors.phone = 'يرجى إدخال رقم هاتف عراقي صحيح (07xxxxxxxxx)';
      }

      if (!formData.gender) errors.gender = 'اختيار الجنس مطلوب';

      if (!formData.password) {
        errors.password = 'كلمة المرور مطلوبة';
      } else if (formData.password.length < 6) {
        errors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'كلمة المرور غير متطابقة';
      }

      // Email is optional, but validate if present
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'البريد الإلكتروني غير صحيح';
      }
    }

    if (step === 3 && formData.userType === 'driver') {
      if (!formData.nationalId) errors.nationalId = 'رقم الهوية الوطنية مطلوب';
      // License can be optional initially or required depending on business logic
      // verification usually happens later via uploaded photos
    }

    if (step === 4 && formData.userType === 'driver') {
      if (!formData.vehicleType) errors.vehicleType = 'نوع المركبة مطلوب';
      if (!formData.vehicleMake) errors.vehicleMake = 'صنع المركبة مطلوب';
      if (!formData.vehicleModel) errors.vehicleModel = 'موديل المركبة مطلوب';
      if (!formData.vehicleYear) errors.vehicleYear = 'سنة الصنع مطلوبة';
      if (!formData.vehicleColor) errors.vehicleColor = 'اللون مطلوب';
      if (!formData.licensePlate) errors.licensePlate = 'رقم اللوحة مطلوب';
      if (!formData.seatsAvailable) errors.seatsAvailable = 'عدد المقاعد مطلوب';
    }

    if (step === 5) {
      if (!formData.acceptTerms) {
        errors.acceptTerms = 'يجب الموافقة على الشروط والأحكام';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0; // Return true if no keys in errors
  };

  // Navigation
  const handleNext = () => {
    if (validateStep(currentStep)) {
      // Skip driver steps if passenger
      if (formData.userType === 'passenger' && currentStep === 2) {
        setCurrentStep(5);
      } else {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  const handleBack = () => {
    if (formData.userType === 'passenger' && currentStep === 5) {
      setCurrentStep(2);
    } else {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Submit Logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    setLoading(true);
    setError('');

    try {
      const registrationData = {
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
        userType: formData.userType,
        gender: formData.gender,
        email: formData.email || undefined,
        city: formData.city || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        isDriver: formData.userType === 'driver',
        languagePreference: 'ar',
      };

      if (formData.userType === 'driver') {
        Object.assign(registrationData, {
          nationalId: formData.nationalId,
          driverLicenseNumber: formData.driverLicenseNumber || undefined,
          licenseExpiryDate: formData.licenseExpiryDate || undefined,
          vehicleType: formData.vehicleType,
          vehicleMake: formData.vehicleMake,
          vehicleModel: formData.vehicleModel,
          vehicleYear: parseInt(formData.vehicleYear),
          vehicleColor: formData.vehicleColor,
          licensePlate: formData.licensePlate,
          seatsAvailable: parseInt(formData.seatsAvailable),
        });
      }

      const result = await register(registrationData);

      if (result.success) {
        if (onClose) onClose();
        navigate('/'); // OR where appropriate
      }
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء التسجيل');
    } finally {
      setLoading(false);
    }
  };

  // Render Functions
  const renderStepIndicator = () => (
    <div className="flex justify-between items-center mb-6 relative">
      {[1, 2, 3, 4, 5].map((step) => {
        // Hide steps 3 & 4 for passengers
        if (formData.userType === 'passenger' && (step === 3 || step === 4)) return null;

        const isActive = step === currentStep;
        const isCompleted = step < currentStep;

        return (
          <div key={step} className="flex flex-col items-center z-10">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                ${
                  isActive
                    ? 'bg-primary text-white scale-110 shadow-md'
                    : isCompleted
                      ? 'bg-green-100 text-green-600 border border-green-200'
                      : 'bg-gray-100 text-gray-400'
                }`}
            >
              {isCompleted ? '✓' : step}
            </div>
            <span
              className={`text-xs mt-1 ${isActive ? 'text-primary font-bold' : 'text-gray-400'}`}
            >
              {step === 1 && 'نوع الحساب'}
              {step === 2 && 'المعلومات'}
              {step === 3 && 'الوثائق'}
              {step === 4 && 'المركبة'}
              {step === 5 && 'المراجعة'}
            </span>
          </div>
        );
      })}
      {/* Progress Line */}
      <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-100 -z-0" />
    </div>
  );

  return (
    <div
      className="modal-content"
      style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'none',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          color: '#9ca3af',
          zIndex: 10,
        }}
      >
        ×
      </button>

      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">إنشاء حساب جديد</h2>
        <p className="text-gray-500 text-sm">
          خطوة {currentStep} من {formData.userType === 'driver' ? 5 : 3}
        </p>
      </div>

      {renderStepIndicator()}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center border border-red-100">
          {error}
        </div>
      )}

      {/* Form Steps */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Step 1: User Type */}
        {currentStep === 1 && (
          <div className="flex gap-4">
            <div
              onClick={() => setFormData({ ...formData, userType: 'passenger' })}
              className={`flex-1 p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 text-center
                ${
                  formData.userType === 'passenger'
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <div className="text-4xl mb-3">👤</div>
              <div
                className={`font-bold ${formData.userType === 'passenger' ? 'text-blue-600' : 'text-gray-600'}`}
              >
                راكب
              </div>
            </div>

            <div
              onClick={() => setFormData({ ...formData, userType: 'driver' })}
              className={`flex-1 p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 text-center
                ${
                  formData.userType === 'driver'
                    ? 'border-green-500 bg-green-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <div className="text-4xl mb-3">🚗</div>
              <div
                className={`font-bold ${formData.userType === 'driver' ? 'text-green-600' : 'text-gray-600'}`}
              >
                سائق
              </div>
            </div>
            {formErrors.userType && (
              <div className="text-red-500 text-xs mt-1 w-full text-center">
                {formErrors.userType}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Basic Info */}
        {currentStep === 2 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="أدخل اسمك الكامل"
              />
              {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="07xxxxxxxxx"
                dir="ltr"
              />
              {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الجنس *</label>
              <div className="flex gap-4">
                <label
                  className={`flex-1 flex items-center justify-center p-3 border rounded-lg cursor-pointer ${formData.gender === 'male' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300'}`}
                >
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={handleChange}
                    className="hidden"
                  />
                  <span>ذكر 👨</span>
                </label>
                <label
                  className={`flex-1 flex items-center justify-center p-3 border rounded-lg cursor-pointer ${formData.gender === 'female' ? 'bg-pink-50 border-pink-500 text-pink-700' : 'border-gray-300'}`}
                >
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={handleChange}
                    className="hidden"
                  />
                  <span>أنثى 👩</span>
                </label>
              </div>
              {formErrors.gender && (
                <p className="text-red-500 text-xs mt-1">{formErrors.gender}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3 text-gray-400"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تأكيد كلمة المرور *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-3 text-gray-400"
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المدينة (اختياري)
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">اختر المدينة</option>
                  {IRAQI_CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  البريد الإلكتروني (اختياري)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="user@example.com"
                  dir="ltr"
                />
                {formErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Step 3: Driver Documents (Driver Only) */}
        {currentStep === 3 && (
          <>
            <div className="bg-yellow-50 p-4 rounded-lg mb-2 text-yellow-800 text-sm border border-yellow-200">
              ⚠️ بيانات السائقين تخضع للتدقيق اليدوي لضمان الأمان.
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                رقم الهوية الوطنية (البطاقة الموحدة) *
              </label>
              <input
                type="text"
                name="nationalId"
                value={formData.nationalId}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="أدخل رقم الهوية"
              />
              {formErrors.nationalId && (
                <p className="text-red-500 text-xs mt-1">{formErrors.nationalId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                رقم رخصة القيادة (سنوية السوق)
              </label>
              <input
                type="text"
                name="driverLicenseNumber"
                value={formData.driverLicenseNumber}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="اختياري"
              />
            </div>
          </>
        )}

        {/* Step 4: Vehicle Info (Driver Only) */}
        {currentStep === 4 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نوع المركبة *</label>
              <select
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">اختر النوع</option>
                {VEHICLE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {formErrors.vehicleType && (
                <p className="text-red-500 text-xs mt-1">{formErrors.vehicleType}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  صنع المركبة *
                </label>
                <input
                  type="text"
                  name="vehicleMake"
                  value={formData.vehicleMake}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="مثال: Toyota"
                />
                {formErrors.vehicleMake && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.vehicleMake}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الموديل *</label>
                <input
                  type="text"
                  name="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="مثال: Corolla"
                />
                {formErrors.vehicleModel && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.vehicleModel}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">سنة الصنع *</label>
                <select
                  name="vehicleYear"
                  value={formData.vehicleYear}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">السنة</option>
                  {Array.from({ length: 27 }, (_, i) => 2000 + i)
                    .reverse()
                    .map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                </select>
                {formErrors.vehicleYear && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.vehicleYear}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اللون *</label>
                <input
                  type="text"
                  name="vehicleColor"
                  value={formData.vehicleColor}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="مثال: أبيض"
                />
                {formErrors.vehicleColor && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.vehicleColor}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم اللوحة *</label>
                <input
                  type="text"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="مثال: A12345"
                />
                {formErrors.licensePlate && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.licensePlate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  عدد المقاعد *
                </label>
                <select
                  name="seatsAvailable"
                  value={formData.seatsAvailable}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">اختر</option>
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
                {formErrors.seatsAvailable && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.seatsAvailable}</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Step 5: Review & Submit */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 border border-gray-100">
              <h3 className="font-bold border-b pb-2 mb-2 text-primary">ملخص البيانات</h3>
              <p className="flex justify-between text-sm">
                <span className="text-gray-500">الاسم:</span>{' '}
                <span className="font-medium">{formData.name}</span>
              </p>
              <p className="flex justify-between text-sm">
                <span className="text-gray-500">الهاتف:</span>{' '}
                <span className="font-medium" dir="ltr">
                  {formData.phone}
                </span>
              </p>
              <p className="flex justify-between text-sm">
                <span className="text-gray-500">نوع الحساب:</span>
                <span
                  className={`font-medium ${formData.userType === 'driver' ? 'text-green-600' : 'text-blue-600'}`}
                >
                  {formData.userType === 'driver' ? 'سائق' : 'راكب'}
                </span>
              </p>
              {formData.userType === 'driver' && (
                <p className="flex justify-between text-sm">
                  <span className="text-gray-500">المركبة:</span>
                  <span className="font-medium">
                    {formData.vehicleMake} {formData.vehicleModel} ({formData.vehicleYear})
                  </span>
                </p>
              )}
            </div>

            <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="mt-1"
              />
              <span className="text-sm text-gray-600 leading-relaxed">
                أوافق على{' '}
                <span
                  className="text-primary underline"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowTerms(true);
                  }}
                >
                  شروط الخدمة
                </span>{' '}
                و{' '}
                <span
                  className="text-primary underline"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowTerms(true);
                  }}
                >
                  سياسة الخصوصية
                </span>{' '}
                وأن جميع البيانات المدخلة صحيحة.
              </span>
            </label>
            {formErrors.acceptTerms && (
              <p className="text-red-500 text-xs">{formErrors.acceptTerms}</p>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              رجوع
            </button>
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg font-bold shadow-sm transition-all transform active:scale-95"
            >
              التالي
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-primary to-green-600 hover:from-green-500 hover:to-green-700 text-white py-3 rounded-lg font-bold shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              {loading ? 'جاري التسجيل...' : 'إنشاء الحساب ✅'}
            </button>
          )}
        </div>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-gray-500 text-sm hover:text-primary underline decoration-dashed"
          >
            لديك حساب بالفعل؟ تسجيل الدخول
          </button>
        </div>
      </form>

      {/* Terms Modal */}
      {showTerms && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflowY: 'auto',
              margin: '20px',
            }}
          >
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
              الشروط والأحكام
            </h3>
            <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#374151' }}>
              <p>مرحباً بك في توصيلة. باستخدامك للتطبيق، فإنك توافق على الشروط التالية:</p>
              <ul style={{ listStyle: 'disc', marginRight: '20px', marginTop: '10px' }}>
                <li>يجب أن تكون المعلومات المقدمة صحيحة ودقيقة.</li>
                <li>يمنع استخدام التطبيق لأغراض غير قانونية.</li>
                <li>نلتزم بحماية خصوصية بياناتك وعدم مشاركتها مع أطراف ثالثة دون إذنك.</li>
                <li>للسائقين: يجب تقديم وثائق سارية المفعول وصورة شخصية واضحة.</li>
              </ul>
            </div>
            <button
              onClick={() => setShowTerms(false)}
              style={{
                marginTop: '20px',
                width: '100%',
                padding: '12px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              موافق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
