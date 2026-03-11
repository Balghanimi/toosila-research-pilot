import React, { useState, useEffect, useRef } from 'react';
import { useMessages } from '../../context/MessagesContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import MessageSearch from './MessageSearch';
import SkeletonLoader from '../UI/SkeletonLoader';

const ConversationList = ({ onSelectConversation, selectedConversation, loading }) => {
  const { conversations, fetchConversations, deleteConversation } = useMessages();
  const { user } = useAuth();
  const { showError, showSuccess } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [longPressConversation, setLongPressConversation] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const longPressTimerRef = useRef(null);

  // Load conversations
  useEffect(() => {
    if (user?.id) {
      fetchConversations();
    }
  }, [user?.id, fetchConversations]);

  // Handle long press start
  const handleTouchStart = (conversation, tripId, rideType, otherUserId, otherUserName) => {
    longPressTimerRef.current = setTimeout(() => {
      // Vibrate on mobile if supported
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      setLongPressConversation({
        ...conversation,
        tripId,
        rideType,
        otherUserId,
        otherUserName,
      });
      setShowDeleteModal(true);
    }, 500); // 500ms long press
  };

  // Handle long press end
  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Handle delete conversation
  const handleDeleteConversation = async () => {
    if (!longPressConversation) return;

    const { tripId, rideType } = longPressConversation;

    if (!tripId || !rideType) {
      showError('لا يمكن حذف المحادثة - معرف الرحلة غير موجود');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteConversation(rideType, tripId);
      showSuccess('تم حذف المحادثة بنجاح');
      setShowDeleteModal(false);
      setLongPressConversation(null);
    } catch (err) {
      console.error('Error deleting conversation:', err);
      showError('فشل في حذف المحادثة. حاول مرة أخرى.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter conversations based on search
  const filteredConversations = searchTerm
    ? conversations.filter(
        (conv) =>
          (conv.otherUserName || conv.other_user_name || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (conv.lastMessage?.content || conv.last_message || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      )
    : conversations;

  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);

      if (diffInHours < 1) {
        return 'الآن';
      } else if (diffInHours < 24) {
        return date.toLocaleTimeString('ar-IQ', {
          hour: '2-digit',
          minute: '2-digit',
        });
      } else if (diffInHours < 48) {
        return 'أمس';
      } else {
        return date.toLocaleDateString('ar-IQ', {
          month: 'short',
          day: 'numeric',
        });
      }
    } catch {
      return timestamp;
    }
  };

  const truncateMessage = (content, maxLength = 50) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // Show loading skeletons
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
          padding: 'var(--space-4)',
        }}
      >
        <SkeletonLoader variant="Message" />
        <SkeletonLoader variant="Message" />
        <SkeletonLoader variant="Message" />
        <SkeletonLoader variant="Message" />
        <SkeletonLoader variant="Message" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '300px',
          color: 'var(--text-muted)',
          fontSize: 'var(--text-base)',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          padding: 'var(--space-6)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>💬</div>
          <div
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: '600',
              marginBottom: 'var(--space-2)',
            }}
          >
            لا توجد محادثات بعد
          </div>
          <div style={{ fontSize: 'var(--text-sm)' }}>
            ابدأ محادثة جديدة من صفحة العروض أو الطلبات
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--surface-primary)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-light)',
        overflow: 'hidden',
        direction: 'rtl',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: 'var(--space-4)',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
          color: 'white',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-3)',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 'var(--text-lg)',
              fontWeight: '700',
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            }}
          >
            المحادثات ({conversations.length})
          </h3>
          <button
            onClick={() => setShowAdvancedSearch(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-2)',
              cursor: 'pointer',
              color: 'white',
              fontSize: 'var(--text-sm)',
              fontWeight: '600',
              transition: 'var(--transition)',
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            🔍 بحث متقدم
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="البحث في المحادثات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: 'var(--space-3) var(--space-4) var(--space-3) var(--space-10)',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--text-base)',
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              background: 'rgba(255, 255, 255, 0.9)',
              color: 'var(--text-primary)',
              outline: 'none',
              direction: 'rtl',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 'var(--space-3)',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 'var(--text-lg)',
              color: 'var(--text-muted)',
            }}
          >
            🔍
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div
        style={{
          maxHeight: '400px',
          overflowY: 'auto',
        }}
      >
        {filteredConversations
          .filter((conv) => conv !== null && conv !== undefined)
          .map((conversation, index) => {
            // Handle field name variations from backend (snake_case vs camelCase)
            const tripId = conversation.tripId || conversation.ride_id;
            const rideType = conversation.rideType || conversation.ride_type || 'offer';
            const otherUserId = conversation.otherUserId || conversation.other_user_id;
            const otherUserName =
              conversation.otherUserName || conversation.other_user_name || 'مستخدم';
            const lastMessageContent =
              conversation.lastMessage?.content || conversation.last_message || '';
            const timestamp =
              conversation.lastMessage?.timestamp ||
              conversation.lastMessage?.created_at ||
              conversation.last_message_time ||
              null;

            const isSelected =
              selectedConversation?.tripId === tripId || selectedConversation?.ride_id === tripId;
            const hasUnread = conversation.unreadCount > 0 || conversation.unread_count > 0;

            return (
              <div
                key={`${tripId}_${otherUserId}_${index}`}
                onClick={() =>
                  onSelectConversation({
                    tripId,
                    rideId: tripId,
                    rideType,
                    otherUserId,
                    otherUserName,
                    fromCity: conversation.from_city || conversation.fromCity,
                    toCity: conversation.to_city || conversation.toCity,
                    tripInfo: {
                      from: conversation.from_city || conversation.fromCity || '',
                      to: conversation.to_city || conversation.toCity || '',
                    },
                  })
                }
                onTouchStart={() =>
                  handleTouchStart(conversation, tripId, rideType, otherUserId, otherUserName)
                }
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchEnd}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setLongPressConversation({
                    ...conversation,
                    tripId,
                    rideType,
                    otherUserId,
                    otherUserName,
                  });
                  setShowDeleteModal(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: 'var(--space-4)',
                  borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--surface-secondary)' : 'transparent',
                  transition: 'var(--transition)',
                  animationDelay: `${index * 0.05}s`,
                  animation: 'fadeInUp 0.3s ease-out',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTouchCallout: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.target.style.background = 'var(--surface-secondary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                {/* User Avatar */}
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: hasUnread
                      ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)'
                      : 'var(--surface-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--text-lg)',
                    fontWeight: '700',
                    color: hasUnread ? 'white' : 'var(--text-primary)',
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                    marginLeft: 'var(--space-3)',
                    flexShrink: 0,
                    position: 'relative',
                  }}
                >
                  {otherUserName?.charAt(0) || '👤'}

                  {/* Unread indicator */}
                  {hasUnread && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        width: '16px',
                        height: '16px',
                        background: 'var(--error)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'var(--text-xs)',
                        fontWeight: '700',
                        color: 'white',
                        border: '2px solid white',
                      }}
                    >
                      {(conversation.unreadCount || conversation.unread_count || 0) > 9
                        ? '9+'
                        : conversation.unreadCount || conversation.unread_count || 0}
                    </div>
                  )}
                </div>

                {/* Conversation Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    <h4
                      style={{
                        margin: 0,
                        fontSize: 'var(--text-base)',
                        fontWeight: hasUnread ? '700' : '600',
                        color: hasUnread ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontFamily:
                          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {otherUserName}
                    </h4>

                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: hasUnread ? 'var(--primary)' : 'var(--text-muted)',
                        fontFamily:
                          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                        fontWeight: hasUnread ? '600' : '500',
                        flexShrink: 0,
                        marginRight: 'var(--space-2)',
                      }}
                    >
                      {timestamp ? formatTime(timestamp) : ''}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: 0,
                      fontSize: 'var(--text-sm)',
                      color: hasUnread ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontFamily:
                        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                      fontWeight: hasUnread ? '600' : '500',
                      lineHeight: '1.4',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {truncateMessage(lastMessageContent)}
                  </p>
                </div>

                {/* Status Indicator */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                    marginRight: 'var(--space-2)',
                  }}
                >
                  {(conversation.lastMessage?.senderId || conversation.last_sender_id) ===
                    user?.id && (
                    <div
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      ✓
                    </div>
                  )}

                  {hasUnread && (
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        background: 'var(--primary)',
                        borderRadius: '50%',
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Empty State for Search */}
      {filteredConversations.length === 0 && searchTerm && (
        <div
          style={{
            padding: 'var(--space-8)',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>🔍</div>
          <div>لم يتم العثور على محادثات</div>
          <div style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
            جرب مصطلحات بحث مختلفة
          </div>
        </div>
      )}

      {/* Advanced Search Modal */}
      {showAdvancedSearch && (
        <MessageSearch
          onSelectMessage={(result) => {
            // Handle message selection
            if (result.conversationKey) {
              const [, otherUserId, tripId] = result.conversationKey.split('_');
              const conversation = {
                tripId,
                otherUserId,
                otherUserName: result.otherUserId,
                lastMessage: result,
              };
              onSelectConversation(conversation);
            }
          }}
          onClose={() => setShowAdvancedSearch(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && longPressConversation && (
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
          onClick={() => !isDeleting && setShowDeleteModal(false)}
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
                margin: '0 0 var(--space-2) 0',
                fontSize: 'var(--text-base)',
                color: 'var(--text-secondary)',
                fontFamily: '"Cairo", sans-serif',
              }}
            >
              مع: {longPressConversation.otherUserName || 'مستخدم'}
            </p>
            <p
              style={{
                margin: '0 0 var(--space-5) 0',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-muted)',
                fontFamily: '"Cairo", sans-serif',
              }}
            >
              هل أنت متأكد من حذف هذه المحادثة؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
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

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ConversationList;
