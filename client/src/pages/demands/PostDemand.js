import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMode } from '../../context/ModeContext';
import { demandsAPI } from '../../services/api';
import LocationPicker from '../../components/UI/LocationPicker';

export default function PostDemand() {
  const [isAnimated, setIsAnimated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    fromCity: '',
    toCity: '',
    earliestDate: '',
    earliestTime: '',
    latestDate: '',
    latestTime: '',
    seats: '1',
    budgetMax: '',
  });

  // GPS location state
  const [fromLocation, setFromLocation] = useState({ lat: null, lng: null, address: null });
  const [toLocation, setToLocation] = useState({ lat: null, lng: null, address: null });

  const [errors, setErrors] = useState({});
  const { currentUser } = useAuth();
  const { mode } = useMode();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect drivers to demands page
  useEffect(() => {
    if (mode === 'driver') {
      navigate('/demands', { replace: true });
    }
  }, [mode, navigate]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    setIsAnimated(true);

    // استقبال البيانات من الصفحة الرئيسية إذا كانت موجودة
    if (location.state && location.state.fromCity && location.state.toCity) {
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      const newFormData = {
        fromCity: location.state.fromCity || '',
        toCity: location.state.toCity || '',
        earliestDate: location.state.departureDate || '',
        earliestTime: location.state.departureTime || '',
        latestDate: dayAfter.toISOString().split('T')[0],
        latestTime: '20:00',
        seats: location.state.seats || '1',
        budgetMax: location.state.price || '',
      };

      setFormData((prev) => ({
        ...prev,
        ...newFormData,
      }));

      // إذا كانت جميع البيانات المطلوبة موجودة، نشر الطلب تلقائياً
      console.log('PostDemand - Checking data completeness:', newFormData);
      const isComplete =
        newFormData.fromCity &&
        newFormData.toCity &&
        newFormData.earliestDate &&
        newFormData.earliestTime &&
        newFormData.budgetMax &&
        newFormData.fromCity !== newFormData.toCity;

      console.log('PostDemand - Is complete?', isComplete);
      console.log('PostDemand - Breakdown:', {
        fromCity: !!newFormData.fromCity,
        toCity: !!newFormData.toCity,
        earliestDate: !!newFormData.earliestDate,
        earliestTime: !!newFormData.earliestTime,
        budgetMax: !!newFormData.budgetMax,
        notSameCity: newFormData.fromCity !== newFormData.toCity,
      });

      // البيانات تم تعبئتها من الصفحة الرئيسية
      // المستخدم يمكنه الآن تعديل البيانات قبل النشر
      // (تم إزالة النشر التلقائي للسماح بتعديل التاريخ والوقت)
      console.log('PostDemand - Data pre-filled, user can edit before submitting');
    } else {
      // إذا لم تكن هناك بيانات من الصفحة الرئيسية، ارجع للصفحة الرئيسية
      console.log('PostDemand - No data from home page, redirecting...');
      navigate('/', { replace: true });
      return;
    }
    // eslint-disable-next-line
  }, [currentUser, navigate]);

  // Check if user is a passenger (not driver) - using mode for consistency
  if (currentUser && mode === 'driver') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-4)',
        }}
      >
        <div
          style={{
            background: 'var(--surface-primary)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-8)',
            boxShadow: 'var(--shadow-xl)',
            textAlign: 'center',
            maxWidth: '500px',
            border: '2px solid #fbbf24',
          }}
        >
          <div
            style={{
              fontSize: '4rem',
              marginBottom: 'var(--space-4)',
            }}
          >
            🚫
          </div>
          <h2
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: '800',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-3)',
              fontFamily: '"Cairo", sans-serif',
            }}
          >
            هذه الصفحة للركاب فقط
          </h2>
          <p
            style={{
              fontSize: 'var(--text-lg)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-6)',
              fontFamily: '"Cairo", sans-serif',
            }}
          >
            يجب التبديل إلى وضع الراكب لنشر طلب رحلة
          </p>
          <button
            onClick={() => navigate('/profile')}
            style={{
              padding: 'var(--space-4) var(--space-6)',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--text-lg)',
              fontWeight: '700',
              cursor: 'pointer',
              fontFamily: '"Cairo", sans-serif',
              boxShadow: 'var(--shadow-lg)',
              width: '100%',
            }}
          >
            الذهاب إلى الملف الشخصي للتبديل 🔄
          </button>
        </div>
      </div>
    );
  }

  const IRAQ_CITIES = [
    'بغداد',
    'البصرة',
    'النجف',
    'أربيل',
    'الموصل',
    'كربلاء',
    'ذي قار',
    'ديالى',
    'الأنبار',
    'واسط',
    'ميسان',
  ];

  const updateField = (field, value) => {
    console.log(`PostDemand - Updating field "${field}" to:`, value);
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      console.log('PostDemand - FormData after update:', updated);
      return updated;
    });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    setError('');
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.fromCity) newErrors.fromCity = 'اختر مدينة الانطلاق';
    if (!formData.toCity) newErrors.toCity = 'اختر مدينة الوصول';
    if (formData.fromCity === formData.toCity) {
      newErrors.toCity = 'مدينة الوصول يجب أن تختلف عن مدينة الانطلاق';
    }
    if (!formData.earliestDate) newErrors.earliestDate = 'اختر تاريخ البداية';
    if (!formData.earliestTime) newErrors.earliestTime = 'اختر وقت البداية';
    if (!formData.latestDate) newErrors.latestDate = 'اختر تاريخ النهاية';
    if (!formData.latestTime) newErrors.latestTime = 'اختر وقت النهاية';

    // Check that latest is after earliest
    if (formData.earliestDate && formData.latestDate) {
      const earliest = new Date(`${formData.earliestDate}T${formData.earliestTime}`);
      const latest = new Date(`${formData.latestDate}T${formData.latestTime}`);
      if (latest <= earliest) {
        newErrors.latestDate = 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية';
      }
    }

    if (!formData.seats || parseInt(formData.seats) < 1) {
      newErrors.seats = 'أدخل عدد مقاعد صحيح';
    }
    if (!formData.budgetMax || parseFloat(formData.budgetMax) < 1000) {
      newErrors.budgetMax = 'أدخل ميزانية صحيحة (الحد الأدنى 1000 د.ع)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // دالة منفصلة للنشر يمكن استدعاؤها من useEffect أو من الزر
  const submitDemand = async (data = formData) => {
    setIsSubmitting(true);
    setError('');

    try {
      console.log('PostDemand - Submitting with data:', data);

      // Combine date and time into ISO format
      const earliestDateTime = new Date(`${data.earliestDate}T${data.earliestTime}:00`);
      const latestDateTime = new Date(`${data.latestDate}T${data.latestTime}:00`);

      console.log('PostDemand - Parsed dates:', {
        earliest: earliestDateTime.toISOString(),
        latest: latestDateTime.toISOString(),
      });

      const demandData = {
        fromCity: data.fromCity,
        toCity: data.toCity,
        earliestTime: earliestDateTime.toISOString(),
        latestTime: latestDateTime.toISOString(),
        seats: parseInt(data.seats),
        budgetMax: parseFloat(data.budgetMax),
        fromLat: fromLocation.lat,
        fromLng: fromLocation.lng,
        fromAddress: fromLocation.address,
        toLat: toLocation.lat,
        toLng: toLocation.lng,
        toAddress: toLocation.address,
      };

      console.log('PostDemand - Sending to API:', demandData);
      const response = await demandsAPI.create(demandData);
      console.log('✅ Demand created successfully:', response);
      setSuccess(true);

      setTimeout(() => {
        navigate('/bookings', { state: { tab: 'demands' } });
      }, 3000);
    } catch (err) {
      console.error('Error creating demand:', err);
      setError(err.message || 'حدث خطأ أثناء نشر الطلب. حاول مرة أخرى.');
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    await submitDemand();
  };

  if (success) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-4)',
        }}
      >
        <div
          style={{
            background: 'var(--surface-primary)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-8)',
            boxShadow: 'var(--shadow-xl)',
            textAlign: 'center',
            maxWidth: '500px',
            animation: 'fadeInUp 0.5s ease-out',
          }}
        >
          <div
            style={{
              fontSize: '5rem',
              marginBottom: 'var(--space-4)',
              animation: 'bounce 1s infinite',
            }}
          >
            ✅
          </div>
          <h2
            style={{
              fontSize: 'var(--text-3xl)',
              fontWeight: '800',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-3)',
              fontFamily: '"Cairo", sans-serif',
            }}
          >
            تم نشر طلبك بنجاح! 🎉
          </h2>
          <p
            style={{
              fontSize: 'var(--text-lg)',
              color: 'var(--text-secondary)',
              fontFamily: '"Cairo", sans-serif',
            }}
          >
            جاري تحويلك إلى صفحة الطلبات...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        paddingBottom: '100px',
      }}
    >
      <div
        className="container"
        style={{
          paddingTop: 'var(--space-6)',
          maxWidth: '600px',
          margin: '0 auto',
          transform: isAnimated ? 'translateY(0)' : 'translateY(20px)',
          opacity: isAnimated ? 1 : 0,
          transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 'var(--space-8)',
          }}
        >
          <h1
            style={{
              fontSize: 'var(--text-3xl)',
              fontWeight: '800',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-2)',
              fontFamily: '"Cairo", sans-serif',
            }}
          >
            🙋 نشر طلب رحلة
          </h1>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-lg)',
              fontFamily: '"Cairo", sans-serif',
            }}
          >
            اطلب رحلتك واعثر على سائق
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              background: '#fee',
              border: '2px solid #f88',
              borderRadius: 'var(--radius)',
              padding: 'var(--space-4)',
              marginBottom: 'var(--space-6)',
              color: '#c00',
              fontFamily: '"Cairo", sans-serif',
              fontSize: 'var(--text-base)',
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div
            style={{
              background: 'var(--surface-primary)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border-light)',
              display: 'grid',
              gap: 'var(--space-6)',
            }}
          >
            {/* Route */}
            <div>
              <h3
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: '600',
                  marginBottom: 'var(--space-4)',
                  fontFamily: '"Cairo", sans-serif',
                  color: 'var(--text-primary)',
                }}
              >
                🛣️ المسار
              </h3>

              <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 'var(--text-sm)',
                      fontWeight: '600',
                      marginBottom: 'var(--space-2)',
                      fontFamily: '"Cairo", sans-serif',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    من (مدينة الانطلاق)
                  </label>
                  <LocationPicker
                    city={formData.fromCity}
                    onCityChange={(val) => updateField('fromCity', val)}
                    lat={fromLocation.lat}
                    lng={fromLocation.lng}
                    address={fromLocation.address}
                    onLocationChange={setFromLocation}
                    cities={IRAQ_CITIES}
                    placeholder="اختر مدينة الانطلاق"
                    id="fromCity"
                    markerColor="green"
                  />
                  {errors.fromCity && (
                    <p
                      style={{
                        color: '#c00',
                        fontSize: 'var(--text-sm)',
                        marginTop: 'var(--space-1)',
                        fontFamily: '"Cairo", sans-serif',
                      }}
                    >
                      {errors.fromCity}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 'var(--text-sm)',
                      fontWeight: '600',
                      marginBottom: 'var(--space-2)',
                      fontFamily: '"Cairo", sans-serif',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    إلى (مدينة الوصول)
                  </label>
                  <LocationPicker
                    city={formData.toCity}
                    onCityChange={(val) => updateField('toCity', val)}
                    lat={toLocation.lat}
                    lng={toLocation.lng}
                    address={toLocation.address}
                    onLocationChange={setToLocation}
                    cities={IRAQ_CITIES}
                    placeholder="اختر مدينة الوصول"
                    id="toCity"
                    markerColor="red"
                  />
                  {errors.toCity && (
                    <p
                      style={{
                        color: '#c00',
                        fontSize: 'var(--text-sm)',
                        marginTop: 'var(--space-1)',
                        fontFamily: '"Cairo", sans-serif',
                      }}
                    >
                      {errors.toCity}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Time Window */}
            <div>
              <h3
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: '600',
                  marginBottom: 'var(--space-4)',
                  fontFamily: '"Cairo", sans-serif',
                  color: 'var(--text-primary)',
                }}
              >
                📅 نطاق الوقت المطلوب
              </h3>

              <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                {/* Earliest */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 'var(--text-sm)',
                      fontWeight: '600',
                      marginBottom: 'var(--space-2)',
                      fontFamily: '"Cairo", sans-serif',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    من تاريخ (أقرب وقت)
                  </label>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <input
                      type="date"
                      value={formData.earliestDate}
                      onChange={(e) => updateField('earliestDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      style={{
                        width: '100%',
                        padding: 'var(--space-3)',
                        border: `2px solid ${errors.earliestDate ? '#f88' : 'var(--border-light)'}`,
                        borderRadius: 'var(--radius)',
                        fontSize: 'var(--text-base)',
                        fontFamily: '"Cairo", sans-serif',
                        background: 'var(--surface-primary)',
                      }}
                    />
                    <input
                      type="time"
                      value={formData.earliestTime}
                      onChange={(e) => updateField('earliestTime', e.target.value)}
                      style={{
                        width: '100%',
                        padding: 'var(--space-3)',
                        border: `2px solid ${errors.earliestTime ? '#f88' : 'var(--border-light)'}`,
                        borderRadius: 'var(--radius)',
                        fontSize: 'var(--text-base)',
                        fontFamily: '"Cairo", sans-serif',
                        background: 'var(--surface-primary)',
                      }}
                    />
                  </div>
                  {(errors.earliestDate || errors.earliestTime) && (
                    <p
                      style={{
                        color: '#c00',
                        fontSize: 'var(--text-sm)',
                        marginTop: 'var(--space-1)',
                        fontFamily: '"Cairo", sans-serif',
                      }}
                    >
                      {errors.earliestDate || errors.earliestTime}
                    </p>
                  )}
                </div>

                {/* Latest */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 'var(--text-sm)',
                      fontWeight: '600',
                      marginBottom: 'var(--space-2)',
                      fontFamily: '"Cairo", sans-serif',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    إلى تاريخ (آخر وقت)
                  </label>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <input
                      type="date"
                      value={formData.latestDate}
                      onChange={(e) => updateField('latestDate', e.target.value)}
                      min={formData.earliestDate || new Date().toISOString().split('T')[0]}
                      style={{
                        width: '100%',
                        padding: 'var(--space-3)',
                        border: `2px solid ${errors.latestDate ? '#f88' : 'var(--border-light)'}`,
                        borderRadius: 'var(--radius)',
                        fontSize: 'var(--text-base)',
                        fontFamily: '"Cairo", sans-serif',
                        background: 'var(--surface-primary)',
                      }}
                    />
                    <input
                      type="time"
                      value={formData.latestTime}
                      onChange={(e) => updateField('latestTime', e.target.value)}
                      style={{
                        width: '100%',
                        padding: 'var(--space-3)',
                        border: `2px solid ${errors.latestTime ? '#f88' : 'var(--border-light)'}`,
                        borderRadius: 'var(--radius)',
                        fontSize: 'var(--text-base)',
                        fontFamily: '"Cairo", sans-serif',
                        background: 'var(--surface-primary)',
                      }}
                    />
                  </div>
                  {(errors.latestDate || errors.latestTime) && (
                    <p
                      style={{
                        color: '#c00',
                        fontSize: 'var(--text-sm)',
                        marginTop: 'var(--space-1)',
                        fontFamily: '"Cairo", sans-serif',
                      }}
                    >
                      {errors.latestDate || errors.latestTime}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Seats & Budget */}
            <div>
              <h3
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: '600',
                  marginBottom: 'var(--space-4)',
                  fontFamily: '"Cairo", sans-serif',
                  color: 'var(--text-primary)',
                }}
              >
                💺 التفاصيل
              </h3>

              <div
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 'var(--text-sm)',
                      fontWeight: '600',
                      marginBottom: 'var(--space-2)',
                      fontFamily: '"Cairo", sans-serif',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    عدد المقاعد
                  </label>
                  <select
                    value={formData.seats}
                    onChange={(e) => updateField('seats', e.target.value)}
                    style={{
                      width: '100%',
                      padding: 'var(--space-3)',
                      border: `2px solid ${errors.seats ? '#f88' : 'var(--border-light)'}`,
                      borderRadius: 'var(--radius)',
                      fontSize: 'var(--text-base)',
                      fontFamily: '"Cairo", sans-serif',
                      background: 'var(--surface-primary)',
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <option key={num} value={num}>
                        {num} مقعد
                      </option>
                    ))}
                  </select>
                  {errors.seats && (
                    <p
                      style={{
                        color: '#c00',
                        fontSize: 'var(--text-sm)',
                        marginTop: 'var(--space-1)',
                        fontFamily: '"Cairo", sans-serif',
                      }}
                    >
                      {errors.seats}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 'var(--text-sm)',
                      fontWeight: '600',
                      marginBottom: 'var(--space-2)',
                      fontFamily: '"Cairo", sans-serif',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    الميزانية القصوى (د.ع)
                  </label>
                  <input
                    type="number"
                    value={formData.budgetMax}
                    onChange={(e) => updateField('budgetMax', e.target.value)}
                    placeholder="20000"
                    min="1000"
                    step="1000"
                    style={{
                      width: '100%',
                      padding: 'var(--space-3)',
                      border: `2px solid ${errors.budgetMax ? '#f88' : 'var(--border-light)'}`,
                      borderRadius: 'var(--radius)',
                      fontSize: 'var(--text-base)',
                      fontFamily: '"Cairo", sans-serif',
                      background: 'var(--surface-primary)',
                    }}
                  />
                  {errors.budgetMax && (
                    <p
                      style={{
                        color: '#c00',
                        fontSize: 'var(--text-sm)',
                        marginTop: 'var(--space-1)',
                        fontFamily: '"Cairo", sans-serif',
                      }}
                    >
                      {errors.budgetMax}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: 'var(--space-4)',
                background: isSubmitting
                  ? 'var(--text-muted)'
                  : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--text-lg)',
                fontWeight: '700',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontFamily: '"Cairo", sans-serif',
                boxShadow: isSubmitting ? 'none' : 'var(--shadow-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-2)',
                width: '100%',
              }}
            >
              {isSubmitting ? (
                <>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                  جاري النشر...
                </>
              ) : (
                '🙋 نشر الطلب'
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0,0,0);
          }
          40%, 43% {
            transform: translate3d(0,-15px,0);
          }
          70% {
            transform: translate3d(0,-7px,0);
          }
          90% {
            transform: translate3d(0,-2px,0);
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
