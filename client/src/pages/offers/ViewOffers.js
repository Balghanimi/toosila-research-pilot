import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { offersAPI, bookingsAPI, citiesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useMode } from '../../context/ModeContext';
import { useNotifications } from '../../context/NotificationContext';
import CollapsibleSearchForm from '../../components/offers/CollapsibleSearchForm';
import OfferCard from '../../components/offers/OfferCard';
import BookingModal from '../../components/BookingModal.jsx';
import { trackRide } from '../../utils/analyticsTracker';

// Default fallback cities (defined outside component for stability)
const DEFAULT_CITIES = [
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

// PERFORMANCE FIX: Added React.memo to prevent unnecessary re-renders
const ViewOffers = React.memo(function ViewOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAnimated, setIsAnimated] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [bookingMessage, setBookingMessage] = useState('');
  // Sorting is now handled server-side (newest first by default)

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    fromCity: '',
    toCity: '',
    departureDate: '',
    minPrice: '',
    maxPrice: '',
    minSeats: '',
    sortBy: 'date', // date, price, rating
    ladiesOnly: false,
  });

  // Dynamic cities from database
  const [availableCities, setAvailableCities] = useState([]);

  const { currentUser, user } = useAuth();
  const { mode } = useMode();
  const { showSuccess, showError } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if user is a driver
  const isDriver = user?.isDriver || currentUser?.isDriver || false;

  // Redirect to /demands when user switches to driver mode
  useEffect(() => {
    if (mode === 'driver') {
      navigate('/demands', { replace: true });
    }
  }, [mode, navigate]);

  // Fetch cities from database with caching
  useEffect(() => {
    const fetchCities = async () => {
      try {
        // Check cache first
        const cached = localStorage.getItem('cached_cities');
        const cacheTime = localStorage.getItem('cached_cities_time');
        const now = Date.now();
        const CACHE_TTL = 60 * 60 * 1000; // 1 hour cache (refresh when user creates new offer/demand)

        if (cached && cacheTime && now - parseInt(cacheTime) < CACHE_TTL) {
          setAvailableCities(JSON.parse(cached));
          return;
        }

        // Fetch fresh data from API
        const response = await citiesAPI.getAll();
        const cities = response.cities || [];
        setAvailableCities(cities);

        // Cache for next time
        localStorage.setItem('cached_cities', JSON.stringify(cities));
        localStorage.setItem('cached_cities_time', now.toString());
      } catch (error) {
        console.error('Error fetching cities:', error);
        // Use cached data if available
        const cached = localStorage.getItem('cached_cities');
        if (cached) {
          setAvailableCities(JSON.parse(cached));
        }
      }
    };
    fetchCities();
  }, []);

  useEffect(() => {
    // ✅ NO REDIRECT - ViewOffers shows driver offers for EVERYONE
    setIsAnimated(true);

    // استقبال معايير البحث من Home
    if (location.state) {
      const searchParams = location.state;
      setFilters((prev) => ({
        ...prev,
        fromCity: searchParams.fromCity || '',
        toCity: searchParams.toCity || '',
        departureDate: searchParams.departureDate || '',
      }));
      fetchOffers(searchParams);
    } else {
      fetchOffers();
    }
    // eslint-disable-next-line
  }, [location.state, isDriver, navigate]);

  const fetchOffers = async (filterParams = {}) => {
    setLoading(true);
    setError('');

    try {
      // Add page and limit to params - increased limit to show more offers
      filterParams.page = 1;
      filterParams.limit = 50;

      // ✅ ALWAYS fetch and show driver offers (for EVERYONE)
      const response = await offersAPI.getAll(filterParams);
      setOffers(response.offers || []);

      // Save pagination data
      setTotal(response.total || 0);
      setTotalPages(response.totalPages || 1);
      setPage(1);
    } catch (err) {
      console.error('Error fetching offers:', err);
      setError('حدث خطأ أثناء تحميل العروض');
    } finally {
      setLoading(false);
    }
  };

  // Load More function
  const loadMore = async () => {
    if (loadingMore || page >= totalPages) return;

    setLoadingMore(true);
    try {
      const filterParams = {};
      if (filters.fromCity) filterParams.fromCity = filters.fromCity;
      if (filters.toCity) filterParams.toCity = filters.toCity;
      if (filters.departureDate) filterParams.departureDate = filters.departureDate;
      if (filters.minPrice) filterParams.minPrice = filters.minPrice;
      if (filters.maxPrice) filterParams.maxPrice = filters.maxPrice;
      if (filters.minSeats) filterParams.minSeats = filters.minSeats;
      if (filters.sortBy) filterParams.sortBy = filters.sortBy;

      filterParams.page = page + 1;
      filterParams.limit = 50;

      // ✅ ALWAYS fetch driver offers (for EVERYONE)
      const response = await offersAPI.getAll(filterParams);
      setOffers((prev) => [...prev, ...(response.offers || [])]);

      setPage(page + 1);
      setTotal(response.total || 0);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      console.error('Error loading more:', err);
      showError('فشل تحميل المزيد');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleFilter = () => {
    const filterParams = {};
    if (filters.fromCity) filterParams.fromCity = filters.fromCity;
    if (filters.toCity) filterParams.toCity = filters.toCity;
    if (filters.departureDate) filterParams.departureDate = filters.departureDate;
    if (filters.minPrice) filterParams.minPrice = filters.minPrice;
    if (filters.maxPrice) filterParams.maxPrice = filters.maxPrice;
    if (filters.minSeats) filterParams.minSeats = filters.minSeats;
    if (filters.sortBy) filterParams.sortBy = filters.sortBy;
    if (filters.ladiesOnly) filterParams.ladies_only = 'true';

    trackRide.searchPerformed(filterParams);
    fetchOffers(filterParams);
  };

  const handleClearFilters = () => {
    // العودة للصفحة الرئيسية عند مسح الفلتر
    navigate('/home');
  };

  // PERFORMANCE FIX: Memoized expensive date/time formatting functions
  // FIXED: Use English numerals (0-9) instead of Arabic numerals (٠-٩)
  const formatDate = React.useCallback((dateString) => {
    if (!dateString) return 'غير محدد';

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) return 'غير محدد';

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateOnly = date.toISOString().split('T')[0];
    const todayOnly = today.toISOString().split('T')[0];
    const tomorrowOnly = tomorrow.toISOString().split('T')[0];

    if (dateOnly === todayOnly) return 'اليوم';
    if (dateOnly === tomorrowOnly) return 'غداً';

    // Use Arabic locale for text but extract numbers and convert to English
    const arabicFormatted = date.toLocaleDateString('ar-EG', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    // Convert Arabic numerals (٠-٩) to English numerals (0-9)
    return arabicFormatted.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  }, []);

  const formatTime = React.useCallback((dateString) => {
    if (!dateString) return '--:--';

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) return '--:--';

    // FIXED: Use 'en-US' locale to get English numerals (0-9) instead of Arabic (٠-٩)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }, []);

  const handleBookNow = (offer) => {
    if (!currentUser) {
      showError('⚠️ يجب تسجيل الدخول أولاً للحجز');
      // Scroll to top to show login button
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (mode === 'driver') {
      showError('⚠️ لا يمكن للسائقين حجز رحلات. يرجى التبديل إلى وضع الراكب');
      return;
    }

    trackRide.offerViewed(offer.id);
    setSelectedOffer(offer);
    setShowBookingModal(true);
  };

  const handleMessageDriver = (offer) => {
    if (!currentUser) {
      showError('⚠️ يجب تسجيل الدخول أولاً للمراسلة');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Navigate to messages page with offer context
    navigate('/messages', {
      state: {
        rideType: 'offer',
        rideId: offer.id,
        otherUserId: offer.driver_id || offer.driverId || offer.user_id,
        otherUserName: offer.driverName || offer.name || offer.userName,
        driverName: offer.driverName || offer.name,
        fromCity: offer.fromCity,
        toCity: offer.toCity,
      },
    });
  };

  const handleConfirmBooking = async (modalData) => {
    if (!selectedOffer) return;

    const seats = modalData?.seats || 1; // Get seats from modal

    console.log('Selected Offer:', selectedOffer);
    console.log('Offer ID:', selectedOffer.id);
    console.log('Seats requested:', seats);

    // Make sure we have a valid offerId
    const offerId = selectedOffer.id || selectedOffer.offerId;

    if (!offerId) {
      showError('خطأ: معرّف العرض غير موجود');
      return;
    }

    // Validate offerId - can be either integer or UUID string
    // If it's a UUID (contains hyphens), keep it as string
    // If it's a number string, convert to integer
    let validOfferId;
    if (typeof offerId === 'string' && offerId.includes('-')) {
      // It's a UUID - keep as string
      validOfferId = offerId;
    } else {
      // Try to convert to integer
      validOfferId = parseInt(offerId, 10);
      if (isNaN(validOfferId) || validOfferId < 1) {
        showError('خطأ: معرّف العرض غير صالح');
        console.error('Invalid offerId:', offerId);
        return;
      }
    }

    console.log('Valid Offer ID to send:', validOfferId);

    try {
      console.log('🎯 BOOKING ATTEMPT STARTED');
      console.log('📦 Booking Data:', {
        offerId: validOfferId,
        seats: seats,
        message: bookingMessage,
        offerRoute: `${selectedOffer.fromCity} → ${selectedOffer.toCity}`,
      });

      console.log('📤 Sending POST request to /api/bookings...');
      const startTime = Date.now();

      const response = await bookingsAPI.create({
        offerId: validOfferId,
        message: bookingMessage,
        seats: seats,
      });

      const duration = Date.now() - startTime;
      console.log(`✅ Response received in ${duration}ms`);
      console.log('📥 Response Data:', response);

      // CRITICAL FIX: Check if backend confirmed success
      if (response && response.success === true) {
        console.log('✅ Booking confirmed as successful by backend');
        console.log('📝 Booking ID:', response.data?.booking?.id);
        console.log('📝 Full Booking Object:', response.data?.booking);

        trackRide.bookingCreated(response.data?.booking?.id);
        setShowBookingModal(false);
        setBookingMessage('');
        setSelectedOffer(null);
        showSuccess('✅ تم إرسال طلب الحجز بنجاح! يمكنك متابعة حالته من صفحة الحجوزات');

        // Navigate to bookings page after brief delay
        setTimeout(() => {
          navigate('/bookings');
        }, 1500);
      } else {
        // Backend returned but success !== true
        console.error('❌ Backend returned success: false or missing');
        console.error('❌ Response:', response);
        const errorMsg =
          response?.error || response?.message || 'فشل إنشاء الحجز - لم يتم التأكيد من الخادم';
        showError(errorMsg);
      }
    } catch (err) {
      console.error('❌ BOOKING FAILED WITH EXCEPTION');
      console.error('❌ Error Type:', err.name);
      console.error('❌ Error Message:', err.message);
      console.error('❌ Full Error:', err);

      // Handle 409 Conflict (duplicate booking) specifically
      if (err.response?.status === 409 || err.message?.includes('409')) {
        showError('⚠️ لديك حجز مسبق على هذه الرحلة. يمكنك متابعة حالته من صفحة الحجوزات');
        setShowBookingModal(false);
        setBookingMessage('');
        setSelectedOffer(null);

        // Optionally navigate to bookings page
        setTimeout(() => {
          navigate('/bookings');
        }, 2000);
        return;
      }

      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'حدث خطأ أثناء الحجز';

      showError(errorMessage);
    }
  };

  // All cities from database, fallback to defaults if empty
  const IRAQ_CITIES = React.useMemo(() => {
    if (availableCities.length > 0) {
      return availableCities;
    }
    return DEFAULT_CITIES;
  }, [availableCities]);

  // Sorting is handled server-side (created_at DESC by default)

  return (
    <div
      className="offers-page-background"
      style={{
        minHeight: '100vh',
        background: `
        radial-gradient(circle at 20% 50%, rgba(52, 199, 89, 0.05) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(52, 199, 89, 0.04) 0%, transparent 50%),
        radial-gradient(circle at 40% 20%, rgba(52, 199, 89, 0.03) 0%, transparent 40%),
        linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)
      `,
        paddingBottom: '100px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative geometric shapes */}
      <div
        className="blur-circle-1"
        style={{
          position: 'absolute',
          top: '10%',
          right: '5%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(52, 199, 89, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        className="blur-circle-2"
        style={{
          position: 'absolute',
          bottom: '20%',
          left: '10%',
          width: '250px',
          height: '250px',
          background: 'radial-gradient(circle, rgba(52, 199, 89, 0.06) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(50px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Subtle dot pattern overlay */}
      <div
        className="dot-pattern"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `radial-gradient(circle, rgba(52, 199, 89, 0.08) 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
          opacity: 0.3,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        className="container"
        style={{
          paddingTop: 'var(--space-6)',
          transform: isAnimated ? 'translateY(0)' : 'translateY(20px)',
          opacity: isAnimated ? 1 : 0,
          transition: 'all 0.6s ease',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 'var(--space-6)',
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
            🚗 العروض المتاحة
          </h1>
          <p
            style={{
              color: 'var(--text-primary)',
              fontSize: 'var(--text-lg)',
              fontFamily: '"Cairo", sans-serif',
              fontWeight: '600',
            }}
          >
            ابحث عن رحلتك المثالية
          </p>
        </div>

        {/* Filters - Collapsible Search Form with Searchable City Dropdowns */}
        <CollapsibleSearchForm
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={handleFilter}
          onClearFilters={handleClearFilters}
          allCities={IRAQ_CITIES}
          isDriver={isDriver}
          currentUser={currentUser}
        />

        {/* Error */}
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
            }}
          >
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--space-8)',
              color: 'var(--text-secondary)',
              fontFamily: '"Cairo", sans-serif',
            }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                border: '4px solid var(--border-light)',
                borderTop: '4px solid var(--primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto var(--space-4) auto',
              }}
            />
            جاري التحميل...
          </div>
        )}

        {/* Offers List */}
        {!loading && offers.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--space-8)',
              background: 'var(--surface-primary)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>
              {isDriver ? '📋' : '🚗'}
            </div>
            <h3
              style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: '700',
                marginBottom: 'var(--space-2)',
                fontFamily: '"Cairo", sans-serif',
                color: 'var(--text-primary)',
              }}
            >
              {isDriver ? 'لا توجد طلبات متاحة' : 'لا توجد عروض متاحة'}
            </h3>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontFamily: '"Cairo", sans-serif',
                marginBottom: 'var(--space-4)',
              }}
            >
              {isDriver ? 'لم نعثر على طلبات تطابق بحثك' : 'لم نعثر على رحلات تطابق بحثك'}
            </p>
            {currentUser && currentUser.isDriver && (
              <button
                onClick={() => navigate('/home', { state: { mode: 'offer' } })}
                style={{
                  padding: 'var(--space-3) var(--space-6)',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--text-base)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: '"Cairo", sans-serif',
                }}
              >
                ➕ انشر رحلتك الآن
              </button>
            )}
          </div>
        )}

        {!loading && offers.length > 0 && (
          <div
            style={{
              display: 'grid',
              gap: 'var(--space-4)',
            }}
          >
            {offers.map((offer) => {
              // Normalize offer data for OfferCard component
              const normalizedOffer = {
                ...offer,
                availableSeats: offer.availableSeats ?? offer.seatsAvailable ?? offer.seats ?? 0,
                driverName: offer.name || offer.userName,
                driverRating: offer.ratingAvg ? Number(offer.ratingAvg) : null,
                driverId: offer.driverId || offer.driver_id,
              };

              return (
                <OfferCard
                  key={offer.id}
                  offer={normalizedOffer}
                  onBookNow={handleBookNow}
                  onMessageDriver={handleMessageDriver}
                  formatDate={formatDate}
                  formatTime={formatTime}
                  currentUser={currentUser}
                />
              );
            })}
          </div>
        )}

        {/* Pagination Info and Load More Button */}
        {!loading && offers.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-4)',
              marginTop: 'var(--space-6)',
              padding: 'var(--space-4)',
              background: 'var(--surface-primary)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--border-light)',
            }}
          >
            <p
              style={{
                fontSize: 'var(--text-base)',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                fontFamily: '"Cairo", sans-serif',
                margin: 0,
              }}
            >
              عرض {offers.length} من {total} نتيجة
            </p>

            {page < totalPages && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                style={{
                  padding: 'var(--space-3) var(--space-6)',
                  background: loadingMore
                    ? 'var(--surface-secondary)'
                    : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                  color: loadingMore ? 'var(--text-secondary)' : 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--text-base)',
                  fontWeight: '600',
                  cursor: loadingMore ? 'not-allowed' : 'pointer',
                  fontFamily: '"Cairo", sans-serif',
                  boxShadow: loadingMore ? 'none' : 'var(--shadow-md)',
                  transition: 'var(--transition)',
                  opacity: loadingMore ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loadingMore) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = 'var(--shadow-lg)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loadingMore) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'var(--shadow-md)';
                  }
                }}
              >
                {loadingMore ? '⏳ جاري التحميل...' : '📥 تحميل المزيد'}
              </button>
            )}
          </div>
        )}

        {/* Booking Modal - Using Portal-based BookingModal component for proper fixed positioning */}
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setBookingMessage('');
            setSelectedOffer(null);
          }}
          offerDetails={
            selectedOffer
              ? {
                  id: selectedOffer.id,
                  fromCity: selectedOffer.fromCity,
                  toCity: selectedOffer.toCity,
                  departureDate: selectedOffer.departureTime,
                  departureTime: selectedOffer.departureTime,
                  price: selectedOffer.price,
                  driverName: selectedOffer.name || 'غير متوفر',
                  availableSeats:
                    selectedOffer.availableSeats ??
                    selectedOffer.seatsAvailable ??
                    selectedOffer.seats ??
                    0,
                }
              : null
          }
          onConfirm={handleConfirmBooking}
        />
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Dark mode background adjustments */
        body.dark-mode .offers-page-background {
          background:
            radial-gradient(circle at 20% 50%, rgba(52, 199, 89, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(52, 199, 89, 0.06) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(52, 199, 89, 0.05) 0%, transparent 40%),
            linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important;
        }

        body.dark-mode .offers-page-background .dot-pattern {
          background-image: radial-gradient(circle, rgba(52, 199, 89, 0.12) 1px, transparent 1px) !important;
          opacity: 0.2 !important;
        }

        body.dark-mode .offers-page-background .blur-circle-1 {
          background: radial-gradient(circle, rgba(52, 199, 89, 0.12) 0%, transparent 70%) !important;
        }

        body.dark-mode .offers-page-background .blur-circle-2 {
          background: radial-gradient(circle, rgba(52, 199, 89, 0.10) 0%, transparent 70%) !important;
        }
      `}</style>
    </div>
  );
});

export default ViewOffers;
