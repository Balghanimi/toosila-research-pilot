import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useMode } from '../context/ModeContext';
import { demandsAPI, offersAPI, citiesAPI } from '../services/api';
import { formatLargeNumber, toEnglishNumber } from '../utils/formatters';
import SearchableCitySelect from '../components/UI/SearchableCitySelect';
import DateTimeSelector from '../components/DateTimeSelector';
import styles from './Home.module.css';

const Home = () => {
  const { currentUser } = useAuth();
  const { mode: globalMode } = useMode();
  // Default mode based on user's global mode
  const getDefaultMode = () => {
    if (globalMode === 'driver') return 'offer';
    if (globalMode === 'passenger') return 'demand';
    return currentUser?.isDriver ? 'offer' : 'demand';
  };
  const [mode, setMode] = useState(getDefaultMode());
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropLocation, setDropLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState('today');
  const [departureTime, setDepartureTime] = useState('');
  const [availableSeats, setAvailableSeats] = useState('1');
  const [pricePerSeat, setPricePerSeat] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [availableCities, setAvailableCities] = useState([]);
  const [isLadiesOnly, setIsLadiesOnly] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  // eslint-disable-next-line no-unused-vars
  const { t } = useLanguage();
  const { showSuccess, showError } = useNotifications();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update mode when global mode changes (from header toggle)
  useEffect(() => {
    console.log('Home: Global mode changed to:', globalMode);
    if (globalMode === 'driver') {
      setMode('offer');
    } else if (globalMode === 'passenger') {
      setMode('demand');
    }
  }, [globalMode]);

  // Update mode when user type changes (e.g., role switch)
  useEffect(() => {
    if (globalMode === 'driver') {
      setMode('offer');
    } else if (globalMode === 'passenger') {
      setMode('demand');
    } else {
      setMode(currentUser?.isDriver ? 'offer' : 'demand');
    }
  }, [currentUser?.isDriver, globalMode]);

  useEffect(() => {
    if (submitError && (pickupLocation || dropLocation || selectedDate)) {
      setSubmitError('');
    }
  }, [pickupLocation, dropLocation, selectedDate, submitError]);

  // PERFORMANCE FIX: Cache cities data in localStorage with 24-hour TTL
  useEffect(() => {
    const fetchCities = async () => {
      try {
        // Check cache first
        const cached = localStorage.getItem('cached_cities');
        const cacheTime = localStorage.getItem('cached_cities_time');
        const now = Date.now();
        const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

        if (cached && cacheTime && now - parseInt(cacheTime) < CACHE_TTL) {
          // Use cached data
          setAvailableCities(JSON.parse(cached));
          return;
        }

        // Fetch fresh data
        const response = await citiesAPI.getAll();
        const cities = response.cities || [];
        setAvailableCities(cities);

        // Cache for next time
        localStorage.setItem('cached_cities', JSON.stringify(cities));
        localStorage.setItem('cached_cities_time', now.toString());
      } catch (error) {
        console.error('Error fetching cities:', error);
        // Try to use stale cache if available
        const cached = localStorage.getItem('cached_cities');
        if (cached) {
          setAvailableCities(JSON.parse(cached));
        } else {
          setAvailableCities([]);
        }
      }
    };
    fetchCities();
  }, []);

  useEffect(() => {
    if (location.state?.mode) {
      setMode(location.state.mode);
      navigate(location.pathname, { replace: true, state: {} });
    }
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const timeString = now.toTimeString().slice(0, 5);
    setDepartureTime(timeString);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = async () => {
    let calculatedDate;
    if (selectedDate === 'today') {
      calculatedDate = new Date().toISOString().split('T')[0];
    } else if (selectedDate === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      calculatedDate = tomorrow.toISOString().split('T')[0];
    } else {
      calculatedDate = selectedDate;
    }

    if (mode === 'find') {
      const searchParams = {};
      if (pickupLocation) searchParams.fromCity = pickupLocation;
      if (dropLocation) searchParams.toCity = dropLocation;
      if (calculatedDate) searchParams.departureDate = calculatedDate;

      if (!pickupLocation && !dropLocation && !calculatedDate) {
        setSubmitError('يرجى اختيار نقطة الانطلاق أو نقطة الوصول أو التاريخ على الأقل للبحث');
        return;
      }

      if (globalMode === 'driver') {
        navigate('/demands', { state: searchParams });
      } else {
        navigate('/offers', { state: searchParams });
      }
    } else if (mode === 'offer') {
      setIsSubmitting(true);
      setSubmitError('');

      try {
        await saveNewCityIfNeeded(pickupLocation);
        await saveNewCityIfNeeded(dropLocation);

        // Combine date and time into ISO format
        const departureDateTime = new Date(`${calculatedDate}T${departureTime}:00`);

        const offerData = {
          fromCity: pickupLocation.trim(),
          toCity: dropLocation.trim(),
          departureTime: departureDateTime.toISOString(),
          seats: parseInt(availableSeats),
          price: parseFloat(pricePerSeat),
          isLadiesOnly: isLadiesOnly,
        };

        await offersAPI.create(offerData);
        showSuccess('تم نشر العرض بنجاح! ✅');
        clearForm();
        setIsSubmitting(false);
        // Optional: navigate to offers page after short delay
        setTimeout(() => {
          navigate('/bookings', { state: { tab: 'myOffers' } });
        }, 1500);
      } catch (err) {
        console.error('Error creating offer:', err);
        showError('حدث خطأ أثناء نشر العرض. حاول مرة أخرى.');
        setSubmitError(err.message || 'حدث خطأ أثناء نشر العرض. حاول مرة أخرى.');
        setIsSubmitting(false);
      }
    } else if (mode === 'demand') {
      setIsSubmitting(true);
      setSubmitError('');

      try {
        await saveNewCityIfNeeded(pickupLocation);
        await saveNewCityIfNeeded(dropLocation);

        const earliestDateTime = new Date(`${calculatedDate}T${departureTime}:00`);
        const latestDateTime = new Date(earliestDateTime);
        latestDateTime.setDate(latestDateTime.getDate() + 2);

        const demandData = {
          fromCity: pickupLocation.trim(),
          toCity: dropLocation.trim(),
          earliestTime: earliestDateTime.toISOString(),
          latestTime: latestDateTime.toISOString(),
          seats: parseInt(availableSeats),
          budgetMax: parseFloat(pricePerSeat),
        };

        await demandsAPI.create(demandData);
        showSuccess('تم نشر الطلب بنجاح! ✅');
        clearForm();
        setIsSubmitting(false);
        // Navigate to bookings page after short delay
        setTimeout(() => {
          navigate('/bookings', { state: { tab: 'demands' } });
        }, 1500);
      } catch (err) {
        console.error('Error creating demand:', err);
        showError('حدث خطأ أثناء نشر الطلب. حاول مرة أخرى.');
        setSubmitError(err.message || 'حدث خطأ أثناء نشر الطلب. حاول مرة أخرى.');
        setIsSubmitting(false);
      }
    }
  };

  const swapLocations = () => {
    setIsSwapping(true);
    setTimeout(() => {
      setPickupLocation(dropLocation);
      setDropLocation(pickupLocation);
      setIsSwapping(false);
    }, 200);
  };

  const saveNewCityIfNeeded = async (cityName) => {
    if (!cityName || cityName.trim().length < 2) return;
    const trimmedCity = cityName.trim();
    const cityExists = availableCities.some(
      (city) => city.toLowerCase() === trimmedCity.toLowerCase()
    );
    if (!cityExists) {
      try {
        const response = await citiesAPI.add(trimmedCity);
        if (!response.alreadyExists) {
          setAvailableCities((prev) => [...prev, trimmedCity].sort());
        }
      } catch (error) {
        console.error('Error saving city:', error);
      }
    }
  };

  // Clear form after successful submission
  const clearForm = () => {
    setPickupLocation('');
    setDropLocation('');
    setSelectedDate('today');
    setAvailableSeats('1');
    setPricePerSeat('');
    setIsLadiesOnly(false);
    // Reset departure time to one hour from now
    const now = new Date();
    now.setHours(now.getHours() + 1);
    setDepartureTime(now.toTimeString().slice(0, 5));
  };

  // Format the selected date in Arabic (kept for potential future use)
  const _getFormattedDate = () => {
    let dateObj;
    if (selectedDate === 'today') {
      dateObj = new Date();
    } else if (selectedDate === 'tomorrow') {
      dateObj = new Date();
      dateObj.setDate(dateObj.getDate() + 1);
    } else {
      dateObj = new Date(selectedDate);
    }

    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    return dateObj.toLocaleDateString('ar-IQ', options);
  };

  // Format time in Arabic (12-hour with صباحاً/مساءً) (kept for potential future use)
  const _getFormattedTime = () => {
    if (!departureTime) return '';

    const [hours, minutes] = departureTime.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'مساءً' : 'صباحاً';
    const hour12 = hour % 12 || 12;

    return `${toEnglishNumber(hour12)}:${toEnglishNumber(minutes)} ${period}`;
  };

  return (
    <div className={styles.homeContainer}>
      {/* Animated Background Blobs */}
      <div className={styles.backgroundBlob1} />
      <div className={styles.backgroundBlob2} />
      <div className={styles.backgroundBlob3} />

      {/* COMPACT HERO - Reduced whitespace */}
      <section
        className={styles.heroSection}
        style={{ minHeight: 'auto', paddingTop: '20px', paddingBottom: '16px' }}
      >
        <h1
          className={styles.heroTitle}
          style={{ fontSize: '2rem', marginBottom: '8px', marginTop: '0' }}
        >
          توصيلة
        </h1>
        <p className={styles.heroSubtitle} style={{ fontSize: '0.95rem', marginBottom: '0' }}>
          رحلات مشتركة آمنة وموثوقة في جميع أنحاء العراق
        </p>

        {/* Login/Signup Button - Only for guests */}
        {!currentUser && (
          <button
            onClick={() => navigate('/login')}
            style={{
              marginTop: '16px',
              padding: '12px 32px',
              background: 'linear-gradient(135deg, #34c759 0%, #28a745 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '700',
              fontFamily: '"Cairo", sans-serif',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(52, 199, 89, 0.3)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center',
              minWidth: '200px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(52, 199, 89, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(52, 199, 89, 0.3)';
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>🔐</span>
            تسجيل الدخول / إنشاء حساب
          </button>
        )}
      </section>

      {/* Error Message */}
      {submitError && (
        <div className={styles.errorMessage} role="alert" aria-live="assertive">
          ⚠️ {submitError}
        </div>
      )}

      {/* MAIN SEARCH FORM - Clean card design */}
      <div
        className={styles.mainCard}
        style={{
          maxWidth: '500px',
          margin: '0 auto 1.5rem',
          padding: '24px',
        }}
      >
        {/* Publish Button - Centered Green Button */}
        {/* Action Buttons Grid - 2 Cards Side-by-Side */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {/* Publish Button (Green) - Right in RTL */}
          <button
            onClick={() => setMode(globalMode === 'driver' ? 'offer' : 'demand')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '16px 8px',
              backgroundColor: '#34c759', // Green
              color: '#ffffff',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(52, 199, 89, 0.2)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              height: '120px',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(52, 199, 89, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(52, 199, 89, 0.2)';
            }}
          >
            {/* Plus/Publish Icon */}
            <div style={{ position: 'relative', width: '28px', height: '28px' }}>
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <span
              style={{
                fontSize: '16px',
                fontWeight: '700',
                fontFamily: '"Cairo", sans-serif',
                whiteSpace: 'nowrap',
              }}
            >
              {globalMode === 'driver' ? 'انشر الرحلة' : 'انشر الطلب'}
            </span>
          </button>

          {/* Search Button (White) - Left in RTL */}
          <button
            onClick={() => {
              if (globalMode === 'driver') {
                navigate('/demands');
              } else {
                navigate('/offers');
              }
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '16px 8px',
              backgroundColor: '#ffffff',
              color: '#1f2937',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              height: '120px',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.08)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.05)';
            }}
          >
            {/* Search Icon */}
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#34c759" // Green stroke
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span
              style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#1f2937', // Dark text
                fontFamily: '"Cairo", sans-serif',
                whiteSpace: 'nowrap',
              }}
            >
              {globalMode === 'driver' ? 'ابحث عن طلب' : 'ابحث عن رحلة'}
            </span>
          </button>
        </div>
        {/* Location Container - FROM and TO visible together */}
        <div className={styles.locationContainer}>
          {/* Pickup Location */}
          <div className={styles.locationRow}>
            <div className={`${styles.locationMarker} ${styles.locationMarkerFrom}`} />
            <div className={styles.locationInputWrapper}>
              <SearchableCitySelect
                value={pickupLocation}
                onChange={setPickupLocation}
                cities={availableCities}
                placeholder="اختر مدينة الانطلاق..."
                showAllOption={false}
                id="pickup-city"
              />
            </div>
          </div>

          {/* Swap Button */}
          <button
            onClick={swapLocations}
            className={styles.swapButton}
            style={{
              transform: isSwapping
                ? 'translateY(-50%) rotate(180deg) scale(1.1)'
                : 'translateY(-50%)',
            }}
            aria-label="تبديل نقطة الانطلاق والوصول"
          >
            ↕
          </button>

          {/* Drop Location */}
          <div className={styles.locationRow}>
            <div className={`${styles.locationMarker} ${styles.locationMarkerTo}`} />
            <div className={styles.locationInputWrapper}>
              <SearchableCitySelect
                value={dropLocation}
                onChange={setDropLocation}
                cities={availableCities}
                placeholder="اختر مدينة الوصول..."
                showAllOption={false}
                id="drop-city"
              />
            </div>
          </div>
        </div>

        {/* Date Time Section - Show only after both cities are selected */}
        {(mode === 'offer' || mode === 'demand') && pickupLocation && dropLocation && (
          <div style={{ marginTop: '20px' }}>
            <DateTimeSelector
              date={selectedDate}
              time={departureTime}
              onDateChange={setSelectedDate}
              onTimeChange={setDepartureTime}
              errors={{}}
            />
          </div>
        )}

        {/* Seats and Price - Show after BOTH locations AND Date/Time selected */}
        {pickupLocation && dropLocation && selectedDate && departureTime && mode !== 'find' && (
          <div
            className={styles.seatsPrice}
            style={{
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: '1px dashed var(--border-color)',
            }}
          >
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>المقاعد المتاحة</label>
              <select
                value={availableSeats}
                onChange={(e) => setAvailableSeats(e.target.value)}
                className={styles.select}
                aria-label="عدد المقاعد المتاحة"
              >
                <option value="1">1 مقعد</option>
                <option value="2">2 مقعد</option>
                <option value="3">3 مقعد</option>
                <option value="4">4 مقعد</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>السعر لكل مقعد (د.ع)</label>
              <input
                type="number"
                value={pricePerSeat}
                onChange={(e) => setPricePerSeat(e.target.value)}
                placeholder="أدخل السعر"
                min="1000"
                step="1000"
                className={styles.input}
                aria-label="السعر لكل مقعد بالدينار العراقي"
              />
            </div>

            {/* Ladies-Only Toggle - Only for female drivers in offer mode */}
            {mode === 'offer' && currentUser?.gender === 'female' && (
              <div className={styles.inputGroup} style={{ marginTop: '16px' }}>
                <label
                  className={styles.ladiesOnlyToggle}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    padding: '12px 16px',
                    background: isLadiesOnly
                      ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
                      : 'var(--surface-secondary, #f9fafb)',
                    borderRadius: '12px',
                    border: isLadiesOnly
                      ? '2px solid #ec4899'
                      : '2px solid var(--border-light, #e5e7eb)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isLadiesOnly}
                    onChange={(e) => setIsLadiesOnly(e.target.checked)}
                    style={{ display: 'none' }}
                  />
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: isLadiesOnly
                        ? 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)'
                        : 'white',
                      border: isLadiesOnly ? 'none' : '2px solid var(--border-medium, #d1d5db)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      color: 'white',
                      flexShrink: 0,
                    }}
                  >
                    {isLadiesOnly && '✓'}
                  </span>
                  <div style={{ direction: 'rtl', textAlign: 'right' }}>
                    <span
                      style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: isLadiesOnly ? '#ec4899' : 'var(--text-primary)',
                      }}
                    >
                      👩 رحلة للنساء فقط
                    </span>
                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        margin: '4px 0 0 0',
                      }}
                    >
                      الرحلة ستكون متاحة فقط للراكبات الإناث
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>
        )}

        {/* Submit Button - Show after ALL fields (Locations + Time + Seats/Price if post mode) */}
        {pickupLocation &&
          dropLocation &&
          selectedDate &&
          departureTime &&
          (mode === 'find' || (pricePerSeat && availableSeats)) && (
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className={styles.submitButton}
              style={{
                fontSize: '18px',
                padding: '16px 32px',
                fontWeight: '700',
                marginTop: '16px',
                borderRadius: '50px', // More rounded as per image
                background: '#34c759', // Solid green match
                boxShadow: '0 4px 15px rgba(52, 199, 89, 0.4)',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                border: 'none',
                cursor: 'pointer',
                fontFamily: '"Cairo", sans-serif',
              }}
              aria-label={
                mode === 'find'
                  ? 'البحث عن رحلات متاحة'
                  : mode === 'offer'
                    ? 'تأكيد ونشر الرحلة'
                    : 'تأكيد ونشر الطلب'
              }
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <span className={styles.loading}>
                  <span className={styles.spinner} role="status" aria-label="جاري التحميل" />
                  جاري المعالجة...
                </span>
              ) : (
                <>
                  {mode === 'find' ? (
                    <>
                      <span>🔍</span>
                      <span>ابحث الآن</span>
                    </>
                  ) : (
                    <>
                      {/* Car Icon */}
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ marginLeft: '4px' }}
                      >
                        <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"></path>
                        <circle cx="6.5" cy="16.5" r="2.5"></circle>
                        <circle cx="16.5" cy="16.5" r="2.5"></circle>
                      </svg>
                      <span>{mode === 'offer' ? 'تأكيد ونشر الرحلة' : 'تأكيد ونشر الطلب'}</span>
                    </>
                  )}
                </>
              )}
            </button>
          )}
      </div>

      {/* QUICK BENEFITS BADGES - Below Search */}
      <div
        className={styles.trustIndicators}
        style={{ margin: '2rem auto', justifyContent: 'center', maxWidth: '600px' }}
      >
        <div className={styles.trustItem}>
          <span className={styles.trustIcon}>✓</span>
          <span>آمن وموثوق</span>
        </div>
        <div className={styles.trustItem}>
          <span className={styles.trustIcon}>✓</span>
          <span>أسعار معقولة</span>
        </div>
        <div className={styles.trustItem}>
          <span className={styles.trustIcon}>✓</span>
          <span>تقييمات موثقة</span>
        </div>
      </div>

      {/* STATISTICS BAR - Below Benefits - WITH ENGLISH NUMERALS */}
      <div className={styles.statsBar} style={{ margin: '3rem auto', maxWidth: '800px' }}>
        <div className={styles.statItem}>
          <div className={styles.statNumber} style={{ direction: 'ltr', unicodeBidi: 'embed' }}>
            {toEnglishNumber('500+')}
          </div>
          <div className={styles.statLabel}>رحلة يومياً</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statNumber} style={{ direction: 'ltr', unicodeBidi: 'embed' }}>
            {formatLargeNumber(10000)}+
          </div>
          <div className={styles.statLabel}>مستخدم نشط</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statNumber} style={{ direction: 'ltr', unicodeBidi: 'embed' }}>
            {toEnglishNumber('98%')}
          </div>
          <div className={styles.statLabel}>تقييم إيجابي</div>
        </div>
      </div>

      {/* Features Section - Show only for non-authenticated users */}
      {!currentUser && (
        <section className={styles.featuresSection}>
          <h2 className={styles.sectionTitle}>لماذا تختار توصيلة؟</h2>
          <p className={styles.sectionSubtitle}>نوفر لك تجربة سفر آمنة ومريحة بأفضل الأسعار</p>

          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <span className={styles.featureIcon}>🛡️</span>
              <h3 className={styles.featureTitle}>آمن وموثوق</h3>
              <p className={styles.featureDescription}>
                جميع المستخدمين موثقون ومراجعين. نظام تقييم شامل لضمان أفضل تجربة.
              </p>
            </div>

            <div className={styles.featureCard}>
              <span className={styles.featureIcon}>💰</span>
              <h3 className={styles.featureTitle}>أسعار معقولة</h3>
              <p className={styles.featureDescription}>
                وفر حتى{' '}
                <span style={{ direction: 'ltr', unicodeBidi: 'embed' }}>
                  {toEnglishNumber('70%')}
                </span>{' '}
                من تكلفة النقل التقليدي مع رحلات مشتركة اقتصادية.
              </p>
            </div>

            <div className={styles.featureCard}>
              <span className={styles.featureIcon}>⚡</span>
              <h3 className={styles.featureTitle}>حجز فوري</h3>
              <p className={styles.featureDescription}>
                ابحث واحجز رحلتك في ثوانٍ. تأكيد فوري ودعم على مدار الساعة.
              </p>
            </div>

            <div className={styles.featureCard}>
              <span className={styles.featureIcon}>🌟</span>
              <h3 className={styles.featureTitle}>تقييمات موثوقة</h3>
              <p className={styles.featureDescription}>
                اقرأ تقييمات المستخدمين الحقيقية واختر أفضل الرحلات والسائقين.
              </p>
            </div>

            <div className={styles.featureCard}>
              <span className={styles.featureIcon}>💬</span>
              <h3 className={styles.featureTitle}>تواصل سهل</h3>
              <p className={styles.featureDescription}>
                نظام مراسلة مدمج للتواصل المباشر مع السائقين والركاب.
              </p>
            </div>

            <div className={styles.featureCard}>
              <span className={styles.featureIcon}>🗺️</span>
              <h3 className={styles.featureTitle}>تغطية شاملة</h3>
              <p className={styles.featureDescription}>
                رحلات إلى جميع المدن العراقية مع جدول واسع من الأوقات المتاحة.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* How It Works Section - Show only for non-authenticated users */}
      {!currentUser && (
        <section className={styles.howItWorksSection}>
          <h2 className={styles.sectionTitle}>كيف يعمل توصيلة؟</h2>
          <p className={styles.sectionSubtitle}>ثلاث خطوات بسيطة للوصول إلى وجهتك</p>

          <div className={styles.stepsGrid}>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>1</div>
              <h3 className={styles.stepTitle}>
                {globalMode === 'driver' ? 'ابحث عن طلب' : 'ابحث عن رحلة'}
              </h3>
              <p className={styles.stepDescription}>
                اختر مدينة الانطلاق والوجهة، وحدد التاريخ المناسب لك.
              </p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>2</div>
              <h3 className={styles.stepTitle}>احجز مقعدك</h3>
              <p className={styles.stepDescription}>
                اختر من بين العروض المتاحة واحجز مقعدك مع السائق المفضل.
              </p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>3</div>
              <h3 className={styles.stepTitle}>استمتع برحلتك</h3>
              <p className={styles.stepDescription}>تواصل مع السائق، وانطلق في رحلة آمنة ومريحة.</p>
            </div>
          </div>
        </section>
      )}

      {/* Trust Banner */}
      <div className={styles.trustBanner}>
        <span className={styles.trustBannerIcon}>🛡️</span>
        <div className={styles.trustBannerContent}>
          <h3 className={styles.trustBannerTitle}>تعرف على المزيد حول سياسة الاسترداد</h3>
          <p className={styles.trustBannerText}>وكيف نحمي أموالك وبياناتك الشخصية</p>
        </div>
        {!isMobile && <span style={{ fontSize: '32px', opacity: 0.8 }}>←</span>}
      </div>
    </div>
  );
};

export default React.memo(Home);
