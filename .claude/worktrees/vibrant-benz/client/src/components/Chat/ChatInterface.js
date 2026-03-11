import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMessages } from '../../context/MessagesContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { offersAPI, demandsAPI } from '../../services/api';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import RideDetailsModal from './RideDetailsModal';

const ChatInterface = ({
  tripId,
  rideType = 'offer',
  otherUserId: propOtherUserId,
  otherUserName,
  tripInfo,
  onClose,
}) => {
  const {
    sendMessage,
    currentConversation,
    fetchConversation,
    fetchRideConversation,
    clearCurrentConversation,
    deleteConversation,
  } = useMessages();
  const { user } = useAuth();
  const { showError } = useNotifications();
  const location = useLocation(); // Hook to access state passed via navigation
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showRideDetails, setShowRideDetails] = useState(false);
  const [rideDetails, setRideDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Determine the effective otherUserId from props or location state
  // This fixes the issue where messages don't load if otherUserId is missing from props
  const otherUserId =
    propOtherUserId || location.state?.otherUserId || location.state?.other_user_id;

  // Debug log to trace where otherUserId is coming from
  useEffect(() => {
    if (!otherUserId) {
      console.warn('[CHAT INTERFACE] ⚠️ otherUserId is missing!', {
        prop: propOtherUserId,
        state: location.state,
      });
    }
  }, [otherUserId, propOtherUserId, location.state]);

  // Handle click on header to show ride details modal
  const handleHeaderClick = async () => {
    if (!tripId) return;

    setLoadingDetails(true);
    try {
      let response;
      if (rideType === 'offer') {
        response = await offersAPI.getById(tripId);
      } else {
        response = await demandsAPI.getById(tripId);
      }

      // Extract the data from the response
      const data = response?.data || response?.offer || response?.demand || response;
      setRideDetails(data);
      setShowRideDetails(true);
    } catch (err) {
      console.error('Error fetching ride details:', err);
      // Fallback to navigation if API fails
      if (rideType === 'offer') {
        navigate('/offers', { state: { highlightOfferId: tripId } });
      } else {
        navigate('/demands', { state: { highlightDemandId: tripId } });
      }
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handle delete conversation
  const handleDeleteConversation = async () => {
    console.log('[CHAT INTERFACE] handleDeleteConversation called with:', {
      tripId,
      rideType,
      deleteConversationExists: typeof deleteConversation === 'function',
    });

    if (!tripId) {
      console.error('[CHAT INTERFACE] ❌ Cannot delete: tripId is missing!');
      showError('لا يمكن حذف المحادثة - معرف الرحلة غير موجود');
      return;
    }

    if (typeof deleteConversation !== 'function') {
      console.error('[CHAT INTERFACE] ❌ deleteConversation is not a function!');
      showError('لا يمكن حذف المحادثة - الدالة غير متوفرة');
      return;
    }

    setIsDeleting(true);
    try {
      console.log('[CHAT INTERFACE] 🗑️ Calling deleteConversation...');
      await deleteConversation(rideType, tripId);
      console.log('[CHAT INTERFACE] ✅ Conversation deleted successfully');
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      console.error('[CHAT INTERFACE] ❌ Error deleting conversation:', err);
      showError('فشل في حذف المحادثة. حاول مرة أخرى.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle booking from the details modal
  const handleBookFromModal = (rideData) => {
    // Navigate to offers page with booking intent
    navigate('/offers', { state: { bookOfferId: rideData.id } });
  };

  // Load messages for this conversation
  useEffect(() => {
    // NOTE: clearCurrentConversation is now handled inside fetchRideConversation
    // when the conversation key actually changes (prevKey !== conversationKey)
    // Removing the call here prevents optimistic messages from disappearing on re-render

    console.log('[CHAT INTERFACE] Loading conversation with:', {
      tripId,
      rideType,
      otherUserId,
      otherUserName,
      currentUserId: user?.id,
    });

    if (tripId && user?.id) {
      // Use ride-based conversation fetching WITH privacy filter by otherUserId
      console.log('[CHAT INTERFACE] Calling fetchRideConversation with otherUserId:', otherUserId);
      fetchRideConversation(rideType, tripId, otherUserId);
    } else if (otherUserId && user?.id) {
      // Fallback to user-based conversation (deprecated)
      console.log('[CHAT INTERFACE] Calling fetchConversation (deprecated)');
      fetchConversation(otherUserId);
    }

    // Cleanup on unmount
    return () => {
      console.log('[CHAT INTERFACE] 🧹 Component unmounting - clearing state');
      if (clearCurrentConversation) {
        clearCurrentConversation();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tripId,
    rideType,
    otherUserId,
    user?.id,
    fetchRideConversation,
    fetchConversation,
    clearCurrentConversation,
  ]);

  // REAL-TIME POLLING: Auto-refresh messages every 3 seconds when chat is open
  useEffect(() => {
    if (!tripId || !user?.id) return;

    // Create expected conversation key for this chat
    const expectedKey = `${rideType}-${tripId}-${otherUserId || 'all'}`;
    console.log('[CHAT INTERFACE] Starting message polling for:', expectedKey);
    let isActive = true; // Track if component is still mounted

    // Polling function
    const pollMessages = async () => {
      if (!isActive) return;

      try {
        if (tripId) {
          await fetchRideConversation(rideType, tripId, otherUserId);
        } else if (otherUserId) {
          await fetchConversation(otherUserId);
        }
      } catch (error) {
        console.error('[CHAT INTERFACE] Polling error:', error);
        // Continue polling even on error - don't break the interval
      }
    };

    // Initial fetch (after a small delay to ensure state is updated)
    const initialFetchTimeout = setTimeout(pollMessages, 100);

    // Set up interval for subsequent fetches
    const pollInterval = setInterval(pollMessages, 3000); // Poll every 3 seconds

    // Cleanup on unmount
    return () => {
      console.log('[CHAT INTERFACE] Stopping message polling for:', expectedKey);
      isActive = false; // Prevent state updates after unmount
      clearTimeout(initialFetchTimeout);
      clearInterval(pollInterval);
    };
    // 🔥 FIX: Removed currentConversationKey from deps to prevent polling restart loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, rideType, otherUserId, user?.id, fetchRideConversation, fetchConversation]);

  // Handle sending a message (with optimistic update - no loading overlay needed)
  const handleSendMessage = async (content) => {
    if (!user?.id || !tripId || !content.trim()) {
      return;
    }

    setError('');

    try {
      // sendMessage in MessagesContext now handles optimistic updates
      // Message appears instantly, no need to block UI or refetch
      // WhatsApp-style: Silent send - no success notification
      await sendMessage(rideType, tripId, content);
    } catch (err) {
      const errorMsg = err.message || 'فشل في إرسال الرسالة. حاول مرة أخرى.';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error sending message:', err);
    }
  };

  // Format trip info for display
  const formatTripInfo = () => {
    if (!tripInfo) return '';

    const { from, to, date, time } = tripInfo;

    // Build route string
    const route = from && to ? `${from} → ${to}` : '';

    // Safely format date
    let formattedDate = '';
    if (date) {
      try {
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
          formattedDate = parsedDate.toLocaleDateString('ar-IQ', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });
        }
      } catch {
        formattedDate = '';
      }
    }

    // Build the display string, only including parts that exist
    const parts = [route, formattedDate, time].filter(Boolean);
    return parts.join(' • ');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh', // Dynamic viewport height for mobile
        width: '100%',
        background: 'var(--surface-primary)',
        overflow: 'hidden', // Parent NEVER scrolls
        direction: 'rtl',
      }}
      className="chat-interface-container"
    >
      {/* Chat Header */}
      <div
        style={{
          flexShrink: 0, // Never shrink
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-4)',
          paddingTop: 'calc(var(--space-4) + env(safe-area-inset-top, 0px))',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
          color: 'white',
        }}
      >
        <div
          onClick={handleHeaderClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            cursor: 'pointer',
            padding: 'var(--space-2)',
            marginRight: 'calc(-1 * var(--space-2))',
            borderRadius: 'var(--radius-lg)',
            transition: 'var(--transition)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
          title={rideType === 'offer' ? 'عرض تفاصيل العرض' : 'عرض تفاصيل الطلب'}
        >
          {/* User Avatar */}
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--text-lg)',
              fontWeight: '700',
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            }}
          >
            {otherUserName?.charAt(0) || '👤'}
          </div>

          {/* User Info */}
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 'var(--text-lg)',
                fontWeight: '700',
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              {otherUserName || 'مستخدم'}
              <span style={{ fontSize: 'var(--text-sm)', opacity: 0.8 }}>🔗</span>
            </h3>
            {tripInfo && (
              <p
                style={{
                  margin: 0,
                  fontSize: 'var(--text-sm)',
                  opacity: 0.9,
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                }}
              >
                {formatTripInfo()}
              </p>
            )}
          </div>
        </div>

        {/* Header Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {/* Delete Conversation Button */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            title="حذف المحادثة"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--text-base)',
              transition: 'var(--transition)',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(239, 68, 68, 0.8)';
              e.target.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            🗑️
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--text-lg)',
              transition: 'var(--transition)',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.3)';
              e.target.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: 'var(--space-2) var(--space-4)',
            background: 'var(--error-light)',
            color: 'var(--error)',
            fontSize: 'var(--text-sm)',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            textAlign: 'center',
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          {error}
        </div>
      )}

      {/* Messages Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <MessageList messages={currentConversation} currentUserId={user?.id} />
      </div>

      {/* Message Input - Always visible at bottom */}
      <div
        style={{
          flexShrink: 0, // Never shrink
          padding: 'var(--space-4)',
          paddingBottom: 'calc(var(--space-4) + env(safe-area-inset-bottom, 0px))',
          background: 'var(--surface-primary)',
          borderTop: '1px solid var(--border-light)',
          zIndex: 10,
        }}
      >
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={false}
          placeholder="اكتب رسالتك هنا..."
        />
      </div>

      {/* Loading Details Overlay */}
      {loadingDetails && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--surface-primary)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-md)',
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
            }}
          >
            <div
              style={{
                width: '16px',
                height: '16px',
                border: '2px solid var(--border-light)',
                borderTop: '2px solid var(--primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            جاري تحميل التفاصيل...
          </div>
        </div>
      )}

      {/* Ride Details Modal */}
      <RideDetailsModal
        isOpen={showRideDetails}
        onClose={() => setShowRideDetails(false)}
        rideType={rideType}
        rideData={rideDetails}
        onBook={rideType === 'offer' ? handleBookFromModal : null}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            direction: 'rtl',
          }}
          onClick={() => !isDeleting && setShowDeleteConfirm(false)}
        >
          <div
            style={{
              background: 'var(--surface-primary)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-6)',
              maxWidth: '360px',
              width: '90%',
              boxShadow: 'var(--shadow-xl)',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>🗑️</div>
            <h3
              style={{
                margin: '0 0 var(--space-2) 0',
                fontSize: 'var(--text-lg)',
                fontWeight: '700',
                color: 'var(--text-primary)',
                fontFamily: '"Cairo", sans-serif',
              }}
            >
              حذف المحادثة
            </h3>
            <p
              style={{
                margin: '0 0 var(--space-5) 0',
                fontSize: 'var(--text-base)',
                color: 'var(--text-secondary)',
                fontFamily: '"Cairo", sans-serif',
              }}
            >
              هل أنت متأكد من حذف هذه المحادثة؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                style={{
                  padding: 'var(--space-3) var(--space-5)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-light)',
                  background: 'var(--surface-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: '600',
                  fontFamily: '"Cairo", sans-serif',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.5 : 1,
                }}
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteConversation}
                disabled={isDeleting}
                style={{
                  padding: 'var(--space-3) var(--space-5)',
                  borderRadius: 'var(--radius-lg)',
                  border: 'none',
                  background: isDeleting ? 'var(--error-light)' : 'var(--error)',
                  color: 'white',
                  fontSize: 'var(--text-base)',
                  fontWeight: '600',
                  fontFamily: '"Cairo", sans-serif',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                {isDeleting ? (
                  <>
                    <span
                      style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                      }}
                    />
                    جاري الحذف...
                  </>
                ) : (
                  'حذف'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
