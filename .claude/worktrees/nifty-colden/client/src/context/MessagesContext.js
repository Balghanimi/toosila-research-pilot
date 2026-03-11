/**
 * MessagesContext.js - Real-time Messaging Context
 *
 * FINAL VERSION with all fixes:
 * 1. ✅ Fixed "Disappearing Message" by ignoring self-sent socket events
 * 2. ✅ Optimistic UI for instant Delete/Edit
 * 3. ✅ Fixed Prettier/Formatting errors (parentheses in ternary)
 * 4. ✅ Robust ID comparison (String vs Number)
 * 5. ✅ Socket handlers don't conflict with optimistic updates
 *
 * @author Toosila Team
 * @version 2.1.0
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import PropTypes from 'prop-types';
import { useAuth } from './AuthContext';
import { messagesAPI } from '../services/api';

// ============================================================
// CONFIGURATION CONSTANTS
// ============================================================
const CONFIG = {
  RETRY: {
    MAX_ATTEMPTS: 3,
    BASE_DELAY_MS: 1000,
    BACKOFF_MULTIPLIER: 2,
  },
  DEBOUNCE: {
    SOCKET_EVENTS_MS: 100,
    FETCH_CONVERSATIONS_MS: 500,
  },
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 50,
    INITIAL_PAGE: 1,
  },
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Retry a function with exponential backoff
 */
const retryWithBackoff = async (fn, maxAttempts = 3, baseDelay = 1000) => {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`[MESSAGES] Attempt ${attempt}/${maxAttempts} failed:`, error.message);

      if (attempt < maxAttempts) {
        const delay = baseDelay * Math.pow(CONFIG.RETRY.BACKOFF_MULTIPLIER, attempt - 1);
        console.log(`[MESSAGES] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

/**
 * Debounce function to limit rapid calls
 */
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Compare IDs safely (handles string/number mismatch)
 */
const idsMatch = (id1, id2) => {
  if (id1 === null || id1 === undefined || id2 === null || id2 === undefined) return false;
  return String(id1) === String(id2);
};

/**
 * Normalize message data to consistent format
 */
const normalizeMessage = (msg) => ({
  ...msg,
  id: msg.id,
  content: msg.content,
  senderId: msg.sender_id || msg.senderId,
  sender_id: msg.sender_id || msg.senderId,
  senderName: msg.sender_name || msg.senderName,
  sender_name: msg.sender_name || msg.senderName,
  createdAt: msg.created_at || msg.createdAt,
  created_at: msg.created_at || msg.createdAt,
  rideType: msg.ride_type || msg.rideType,
  ride_type: msg.ride_type || msg.rideType,
  rideId: msg.ride_id || msg.rideId,
  ride_id: msg.ride_id || msg.rideId,
  receiverId: msg.receiver_id || msg.receiverId,
  receiver_id: msg.receiver_id || msg.receiverId,
  isEdited: msg.is_edited || msg.isEdited || false,
  is_edited: msg.is_edited || msg.isEdited || false,
  isDeleted: msg.is_deleted || msg.isDeleted || false,
  is_deleted: msg.is_deleted || msg.isDeleted || false,
  deletedForEveryone: msg.deleted_for_everyone || msg.deletedForEveryone || false,
});

/**
 * 🔥 CRITICAL FIX: Merge server messages with optimistic messages
 * This prevents the "disappearing message" bug by preserving optimistic
 * messages that haven't been confirmed from the server yet.
 *
 * @param {Array} existingMessages - Current messages in state (may include optimistic)
 * @param {Array} serverMessages - Messages fetched from the server
 * @returns {Array} Merged messages array, sorted by creation time
 */
const mergeMessagesWithOptimistic = (existingMessages, serverMessages) => {
  // 1. Identify optimistic/pending messages (not yet confirmed from server)
  const optimisticMessages = existingMessages.filter(
    (msg) => msg.isOptimistic || msg.isSending || (msg.tempId && !msg.id.toString().match(/^\d+$/))
  );

  // 2. Check which optimistic messages have been confirmed by the server
  const pendingOptimistic = optimisticMessages.filter((optMsg) => {
    // Look for a matching server message (same content + sender)
    const matchInServer = serverMessages.find(
      (serverMsg) =>
        serverMsg.content === optMsg.content &&
        idsMatch(serverMsg.sender_id || serverMsg.senderId, optMsg.sender_id || optMsg.senderId) &&
        // Within 30 seconds of each other (to handle timing differences)
        Math.abs(
          new Date(serverMsg.created_at || serverMsg.createdAt).getTime() -
            new Date(optMsg.created_at || optMsg.createdAt).getTime()
        ) < 30000
    );
    // Keep only optimistic messages NOT yet on server
    return !matchInServer;
  });

  if (pendingOptimistic.length > 0) {
    console.log('[MESSAGES] 🔄 Preserving optimistic messages:', pendingOptimistic.length);
  }

  // 3. Merge server messages with pending optimistic messages
  const merged = [...serverMessages, ...pendingOptimistic];

  // 4. Sort by creation time
  return merged.sort(
    (a, b) =>
      new Date(a.created_at || a.createdAt).getTime() -
      new Date(b.created_at || b.createdAt).getTime()
  );
};

/**
 * 🔥 CRITICAL FIX: Update conversation list with STRICT ID MATCHING
 * This ensures message previews NEVER appear on the wrong user's card
 * @param {Array} conversations - Current conversations array
 * @param {Object} message - The new/updated message
 * @returns {Object} { updated: boolean, conversations: Array }
 */
const updateConversationListWithMessage = (conversations, message) => {
  // 🔥 FIX: Safely normalize IDs - return null for undefined/null instead of "undefined" string
  const safeStringify = (val) => {
    if (val === null || val === undefined || val === '') return null;
    return String(val);
  };

  const messageRideId = safeStringify(message.rideId) || safeStringify(message.ride_id);
  const messageReceiverId = safeStringify(message.receiverId) || safeStringify(message.receiver_id);
  const messageSenderId = safeStringify(message.senderId) || safeStringify(message.sender_id);
  const messageContent = message.content;
  const messageDate = message.createdAt || message.created_at || new Date().toISOString();

  // 🔥 DEBUG: Comprehensive logging for conversation matching
  console.log('=== 🔍 CONVERSATION MATCHING DEBUG ===');
  console.log('Searching for:', {
    rideId: messageRideId,
    rideIdType: typeof messageRideId,
    receiverId: messageReceiverId,
    receiverIdType: typeof messageReceiverId,
    senderId: messageSenderId,
    senderIdType: typeof messageSenderId,
  });
  console.log('Available conversations:', conversations.length);
  conversations.forEach((conv, index) => {
    const convRideId = safeStringify(conv.rideId) || safeStringify(conv.ride_id);
    const convOtherUserId = safeStringify(conv.otherUserId) || safeStringify(conv.other_user_id);
    const rideMatch = convRideId === messageRideId;
    const userMatchReceiver = convOtherUserId === messageReceiverId;
    const userMatchSender = convOtherUserId === messageSenderId;

    console.log(`[${index}]`, {
      convRideId,
      convRideIdType: typeof convRideId,
      convOtherUserId,
      convOtherUserIdType: typeof convOtherUserId,
      rideMatch,
      userMatchReceiver,
      userMatchSender,
    });
  });
  console.log('=====================================');

  // Find the matching conversation by rideId (primary) or sender/receiver (fallback)
  const matchIndex = conversations.findIndex((conv) => {
    const convRideId = safeStringify(conv.rideId) || safeStringify(conv.ride_id);
    const convOtherUserId = safeStringify(conv.otherUserId) || safeStringify(conv.other_user_id);

    // Primary match: same ride (both must have valid rideId)
    if (convRideId && messageRideId && convRideId === messageRideId) {
      console.log('[MESSAGES] ✅ Matched by rideId:', convRideId);
      return true;
    }

    // Fallback match: same user conversation (no rideId case)
    if (convOtherUserId) {
      if (messageReceiverId && convOtherUserId === messageReceiverId) {
        console.log('[MESSAGES] ✅ Matched by receiverId:', convOtherUserId);
        return true;
      }
      if (messageSenderId && convOtherUserId === messageSenderId) {
        console.log('[MESSAGES] ✅ Matched by senderId:', convOtherUserId);
        return true;
      }
    }

    return false;
  });

  if (matchIndex === -1) {
    console.log('[MESSAGES] ⚠️ No matching conversation found, will fetch fresh list');
    return { updated: false, conversations };
  }

  console.log('[MESSAGES] ✅ Found match at index:', matchIndex, 'Updating...');

  // Create updated conversation with new last message
  const updatedConversation = {
    ...conversations[matchIndex],
    lastMessage: messageContent,
    last_message: messageContent,
    lastMessageDate: messageDate,
    last_message_date: messageDate,
    lastMessageTime: messageDate,
  };

  // Remove from current position and add to top (index 0)
  const newConversations = [
    updatedConversation,
    ...conversations.slice(0, matchIndex),
    ...conversations.slice(matchIndex + 1),
  ];

  console.log('[MESSAGES] ✅ Conversation moved to top with updated preview');

  return { updated: true, conversations: newConversations };
};

// ============================================================
// SAFE SOCKET HOOK (follows React Hooks rules)
// ============================================================
let useSocketHook = null;
try {
  const SocketContextModule = require('./SocketContext');
  if (SocketContextModule && SocketContextModule.useSocket) {
    useSocketHook = SocketContextModule.useSocket;
  }
} catch (e) {
  // SocketContext doesn't exist in this environment
}

const useDummySocket = () => ({ socket: null, isConnected: false });
const useSocketSafe = useSocketHook || useDummySocket;

// ============================================================
// CONTEXT CREATION
// ============================================================
const MessagesContext = createContext();

export const useMessages = () => {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
};

// ============================================================
// MESSAGES PROVIDER COMPONENT
// ============================================================
export const MessagesProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { socket } = useSocketSafe();

  // ========================================
  // STATE MANAGEMENT
  // ========================================
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState([]);
  const [currentConversationKey, setCurrentConversationKey] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loadingStates, setLoadingStates] = useState({
    conversations: false,
    messages: false,
    sending: false,
    loadingMore: false,
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasMore: false,
    total: 0,
  });

  // ========================================
  // REFS (for stable references in callbacks)
  // ========================================
  const currentConversationKeyRef = useRef(null);
  const currentUserRef = useRef(null);
  const fetchConversationsRef = useRef(null);
  const mountedRef = useRef(true);

  const setLoading = useCallback((key, value) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  }, []);

  const loading = useMemo(() => Object.values(loadingStates).some(Boolean), [loadingStates]);

  // ========================================
  // UPDATE REFS WHEN STATE CHANGES
  // ========================================
  useEffect(() => {
    currentConversationKeyRef.current = currentConversationKey;
  }, [currentConversationKey]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ========================================
  // CORE API FUNCTIONS
  // ========================================

  const fetchConversations = useCallback(async () => {
    if (!currentUser) {
      setConversations([]);
      return;
    }

    try {
      setLoading('conversations', true);
      console.log('[MESSAGES] 📥 Fetching conversations list...');

      const response = await retryWithBackoff(
        () => messagesAPI.getConversations(),
        CONFIG.RETRY.MAX_ATTEMPTS,
        CONFIG.RETRY.BASE_DELAY_MS
      );

      if (mountedRef.current) {
        console.log('[MESSAGES] 📨 Conversations fetched:', response.conversations?.length || 0);
        setConversations(response.conversations || []);
      }
    } catch (error) {
      console.error('[MESSAGES] ❌ Error fetching conversations:', error);
      if (mountedRef.current) {
        setConversations([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading('conversations', false);
      }
    }
  }, [currentUser, setLoading]);

  useEffect(() => {
    fetchConversationsRef.current = fetchConversations;
  }, [fetchConversations]);

  const fetchUnreadCount = useCallback(async () => {
    if (!currentUser) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await messagesAPI.getUnreadCount();
      if (mountedRef.current) {
        setUnreadCount(response.count || 0);
      }
    } catch (error) {
      if (mountedRef.current) {
        setUnreadCount(0);
      }
    }
  }, [currentUser]);

  const clearCurrentConversation = useCallback(() => {
    console.log('[MESSAGES] 🧹 Clearing current conversation state');
    setCurrentConversation([]);
    setCurrentConversationKey(null);
    setPagination({
      currentPage: 1,
      totalPages: 1,
      hasMore: false,
      total: 0,
    });
  }, []);

  const fetchConversation = useCallback(
    async (userId) => {
      if (!currentUser) return;

      try {
        setLoading('messages', true);
        const response = await retryWithBackoff(
          () => messagesAPI.getConversation(userId),
          CONFIG.RETRY.MAX_ATTEMPTS,
          CONFIG.RETRY.BASE_DELAY_MS
        );

        if (mountedRef.current) {
          setCurrentConversation((response.messages || []).map(normalizeMessage));

          if (response.messages?.length > 0) {
            const unreadMessages = response.messages.filter(
              (msg) => !idsMatch(msg.sender_id, currentUser.id) && !msg.read
            );
            for (const msg of unreadMessages) {
              await messagesAPI.markAsRead(msg.id);
            }
            fetchUnreadCount();
          }
        }
      } catch (error) {
        console.error('[MESSAGES] Error fetching conversation:', error);
      } finally {
        if (mountedRef.current) {
          setLoading('messages', false);
        }
      }
    },
    [currentUser, fetchUnreadCount, setLoading]
  );

  const fetchRideConversation = useCallback(
    async (rideType, rideId, otherUserId = null, page = 1, append = false) => {
      if (!currentUser) return;

      const conversationKey = `${rideType}-${rideId}-${otherUserId || 'all'}`;

      if (!append) {
        setCurrentConversationKey((prevKey) => {
          if (prevKey && prevKey !== conversationKey) {
            console.log('[MESSAGES] 🧹 Switching conversation:', prevKey, '->', conversationKey);
            setCurrentConversation([]);
            setPagination({ currentPage: 1, totalPages: 1, hasMore: false, total: 0 });
          }
          return conversationKey;
        });
      }

      try {
        setLoading(append ? 'loadingMore' : 'messages', true);

        console.log('[MESSAGES] 📥 Fetching ride conversation:', { rideType, rideId, page });

        const response = await retryWithBackoff(
          () =>
            messagesAPI.getRideMessages(
              rideType,
              rideId,
              page,
              CONFIG.PAGINATION.DEFAULT_PAGE_SIZE,
              otherUserId
            ),
          CONFIG.RETRY.MAX_ATTEMPTS,
          CONFIG.RETRY.BASE_DELAY_MS
        );

        if (mountedRef.current) {
          setCurrentConversationKey((prevKey) => {
            if (prevKey === conversationKey) {
              const normalizedMessages = (response.messages || []).map(normalizeMessage);

              if (append) {
                setCurrentConversation((prev) => {
                  const existingIds = new Set(prev.map((m) => String(m.id)));
                  const newMessages = normalizedMessages.filter(
                    (m) => !existingIds.has(String(m.id))
                  );
                  return [...prev, ...newMessages];
                });
              } else {
                // 🔥 CRITICAL FIX: Merge instead of replace to preserve optimistic messages
                setCurrentConversation((prev) =>
                  mergeMessagesWithOptimistic(prev, normalizedMessages)
                );
              }

              setPagination({
                currentPage: response.page || page,
                totalPages: response.totalPages || 1,
                hasMore: (response.page || page) < (response.totalPages || 1),
                total: response.total || normalizedMessages.length,
              });
            }
            return prevKey;
          });
        }

        if (!append && response.messages?.length > 0) {
          try {
            await messagesAPI.markConversationAsRead(rideType, rideId);
            fetchUnreadCount();
          } catch (markError) {
            console.warn('[MESSAGES] Could not mark as read:', markError);
          }
        }
      } catch (error) {
        console.error('[MESSAGES] ❌ Error fetching ride conversation:', error);
        if (!append && mountedRef.current) {
          setCurrentConversationKey((prevKey) => {
            if (prevKey === conversationKey) {
              setCurrentConversation([]);
            }
            return prevKey;
          });
        }
      } finally {
        if (mountedRef.current) {
          setLoading(append ? 'loadingMore' : 'messages', false);
        }
      }
    },
    [currentUser, fetchUnreadCount, setLoading]
  );

  const loadMoreMessages = useCallback(
    async (rideType, rideId, otherUserId = null) => {
      if (!pagination.hasMore || loadingStates.loadingMore) return;

      const nextPage = pagination.currentPage + 1;
      await fetchRideConversation(rideType, rideId, otherUserId, nextPage, true);
    },
    [pagination, loadingStates.loadingMore, fetchRideConversation]
  );

  // ========================================
  // SOCKET.IO REAL-TIME MESSAGE HANDLING
  // ========================================
  useEffect(() => {
    if (!socket) return;

    const debouncedFetchConversations = debounce(() => {
      if (fetchConversationsRef.current) {
        fetchConversationsRef.current();
      }
    }, CONFIG.DEBOUNCE.FETCH_CONVERSATIONS_MS);

    /**
     * Handle new message from socket
     * CRITICAL FIX: Ignore self-sent messages to prevent disappearing/flickering
     * CRITICAL FIX 2: Use strict ID matching for conversation list updates
     */
    const handleNewMessage = (data) => {
      console.log('[MESSAGES] 🔔 Real-time new message received:', data);

      const messageData = data.messageData || data;
      const messageSenderId = messageData.sender_id || messageData.senderId;
      const user = currentUserRef.current;

      // 🔥 CRITICAL FIX: Ignore messages sent by ME
      // The sendMessage function already adds my own messages optimistically
      if (user && idsMatch(messageSenderId, user.id)) {
        console.log('[MESSAGES] 🚫 Ignoring self-sent socket message');
        return;
      }

      const messageRideId = String(messageData.rideId || messageData.ride_id);
      const currentKey = currentConversationKeyRef.current;

      // Add message to current conversation if it matches
      if (currentKey) {
        const keyParts = currentKey.split('-');
        const keyRideId = keyParts[1];

        if (keyRideId === messageRideId) {
          console.log('[MESSAGES] ✅ Adding message to current conversation');

          setCurrentConversation((prev) => {
            // Enhanced duplicate detection using idsMatch
            const exists = prev.some(
              (msg) =>
                idsMatch(msg.id, messageData.id) ||
                (msg.isOptimistic &&
                  msg.content === messageData.content &&
                  idsMatch(msg.senderId, messageSenderId))
            );

            if (exists) {
              console.log('[MESSAGES] ⚠️ Message already exists, skipping');
              return prev;
            }

            return [...prev, normalizeMessage(messageData)];
          });
        }
      }

      // 🔥 CRITICAL FIX: Update conversation list with STRICT ID MATCHING
      setConversations((prev) => {
        const result = updateConversationListWithMessage(prev, messageData);
        if (!result.updated) {
          // New conversation from someone - fetch fresh list
          console.log('[MESSAGES] 🔄 New incoming conversation, fetching fresh list');
          debouncedFetchConversations();
        }
        return result.conversations;
      });
    };

    /**
     * Handle message edited from socket
     * FIXED: Robust extraction of messageId and content
     */
    const handleMessageEdited = (data) => {
      console.log('[MESSAGES] ✏️ Message edited via socket:', data);

      const messageData = data.messageData || data;
      const messageId = messageData.id || messageData.messageId || data.messageId || data.id;
      const newContent = messageData.content || data.content;

      if (!messageId) {
        console.warn('[MESSAGES] ⚠️ No messageId in edit event, ignoring');
        return;
      }

      setCurrentConversation((prev) =>
        prev.map((msg) =>
          idsMatch(msg.id, messageId)
            ? { ...msg, content: newContent, isEdited: true, is_edited: true }
            : msg
        )
      );
    };

    /**
     * Handle message deleted from socket
     * FIXED: Robust extraction of messageId and deleteForAll flag
     */
    const handleMessageDeleted = (data) => {
      console.log('[MESSAGES] 🗑️ Message deleted via socket:', data);

      const messageId = data.messageId || data.id || data.messageData?.id;
      const deleteForAll = data.deleteForAll !== undefined ? data.deleteForAll : true;

      if (!messageId) {
        console.warn('[MESSAGES] ⚠️ No messageId in delete event, ignoring');
        return;
      }

      setCurrentConversation((prev) => {
        if (deleteForAll) {
          // Show "Message deleted" placeholder for all users
          return prev.map((msg) =>
            idsMatch(msg.id, messageId)
              ? { ...msg, content: 'تم حذف هذه الرسالة', isDeleted: true, is_deleted: true }
              : msg
          );
        } else {
          // Delete for me: Filter it out completely
          return prev.filter((msg) => !idsMatch(msg.id, messageId));
        }
      });
    };

    // Register event listeners
    socket.on('new-message', handleNewMessage);
    socket.on('message-edited', handleMessageEdited);
    socket.on('message-deleted', handleMessageDeleted);

    // Cleanup on unmount or socket change
    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('message-edited', handleMessageEdited);
      socket.off('message-deleted', handleMessageDeleted);
    };
  }, [socket]);

  // ========================================
  // INITIAL DATA LOADING
  // ========================================
  useEffect(() => {
    if (currentUser) {
      fetchConversations();
      fetchUnreadCount();
    }
  }, [currentUser, fetchConversations, fetchUnreadCount]);

  // ========================================
  // MESSAGE OPERATIONS (OPTIMISTIC UI)
  // ========================================

  /**
   * Send a message with optimistic update
   */
  const sendMessage = useCallback(
    async (rideType, rideId, content) => {
      if (!currentUser) return null;

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const optimisticMessage = {
        id: tempId,
        content,
        senderId: currentUser.id,
        sender_id: currentUser.id,
        senderName: currentUser.name || `${currentUser.firstName} ${currentUser.lastName}`,
        sender_name: currentUser.name || `${currentUser.firstName} ${currentUser.lastName}`,
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString(),
        rideType,
        ride_type: rideType,
        rideId,
        ride_id: rideId,
        isOptimistic: true,
        isSending: true,
      };

      console.log('[MESSAGES] 📤 Adding optimistic message:', tempId);

      // Optimistic: Add message immediately to current conversation
      setCurrentConversation((prev) => [...prev, optimisticMessage]);

      // 🔥 CRITICAL FIX: Update conversation list with STRICT ID MATCHING
      // If no existing conversation found, create an optimistic one for first message
      setConversations((prev) => {
        const result = updateConversationListWithMessage(prev, optimisticMessage);
        if (!result.updated) {
          // 🆕 FIRST MESSAGE FIX: Create optimistic conversation entry
          console.log('[MESSAGES] 🆕 Creating optimistic conversation for first message');
          const newOptimisticConversation = {
            id: `temp-conv-${rideId}`,
            rideId: rideId,
            ride_id: rideId,
            rideType: rideType,
            ride_type: rideType,
            lastMessage: content,
            last_message: content,
            lastMessageDate: new Date().toISOString(),
            last_message_date: new Date().toISOString(),
            lastMessageTime: new Date().toISOString(),
            isOptimistic: true,
          };
          return [newOptimisticConversation, ...prev];
        }
        return result.conversations;
      });

      setLoading('sending', true);

      try {
        const response = await retryWithBackoff(
          () => messagesAPI.sendMessage(rideType, rideId, content),
          CONFIG.RETRY.MAX_ATTEMPTS,
          CONFIG.RETRY.BASE_DELAY_MS
        );

        console.log('[MESSAGES] ✅ Server response received:', response);

        const serverMessage = response?.messageData || response?.message || response;

        if (serverMessage?.id) {
          setCurrentConversation((prev) => {
            // Remove optimistic message
            const filtered = prev.filter((msg) => !idsMatch(msg.id, tempId));

            // Check for duplicates
            if (filtered.some((msg) => idsMatch(msg.id, serverMessage.id))) {
              console.log('[MESSAGES] ⚠️ Server message exists, removing optimistic');
              return filtered;
            }

            // Add real message
            console.log('[MESSAGES] ✅ Replaced optimistic with real:', serverMessage.id);
            return [...filtered, { ...normalizeMessage(serverMessage), isOptimistic: false }];
          });

          // 🔥 Update conversation list with real server message
          setConversations((prev) => {
            const result = updateConversationListWithMessage(prev, serverMessage);
            if (!result.updated) {
              // Only fetch if we couldn't find the conversation (new conversation case)
              console.log('[MESSAGES] 🔄 New conversation detected, fetching fresh list');
              fetchConversations();
            }
            return result.conversations;
          });
        }

        return response;
      } catch (error) {
        console.error('[MESSAGES] ❌ Error sending message:', error);

        // Mark optimistic message as failed
        setCurrentConversation((prev) =>
          prev.map((msg) =>
            idsMatch(msg.id, tempId) ? { ...msg, isSending: false, isFailed: true } : msg
          )
        );

        throw error;
      } finally {
        setLoading('sending', false);
      }
    },
    [currentUser, fetchConversations, setLoading]
  );

  /**
   * Retry sending a failed message
   */
  const retrySendMessage = useCallback(
    async (failedMessageId, rideType, rideId, content) => {
      setCurrentConversation((prev) => prev.filter((msg) => !idsMatch(msg.id, failedMessageId)));
      return sendMessage(rideType, rideId, content);
    },
    [sendMessage]
  );

  /**
   * Edit a message with optimistic update
   */
  const editMessage = useCallback(async (messageId, content) => {
    let originalMessage = null;

    // ⚡ INSTANT UI UPDATE (before API call)
    setCurrentConversation((prev) =>
      prev.map((msg) => {
        if (idsMatch(msg.id, messageId)) {
          originalMessage = { ...msg }; // Save for rollback
          return {
            ...msg,
            content,
            isEdited: true,
            is_edited: true,
            lastEditedAt: new Date().toISOString(),
          };
        }
        return msg;
      })
    );

    try {
      const response = await retryWithBackoff(
        () => messagesAPI.editMessage(messageId, content),
        CONFIG.RETRY.MAX_ATTEMPTS,
        CONFIG.RETRY.BASE_DELAY_MS
      );

      console.log('[MESSAGES] ✅ Message edited successfully:', messageId);
      return response;
    } catch (error) {
      console.error('[MESSAGES] ❌ Error editing message, reverting:', error);

      // Rollback on failure
      if (originalMessage) {
        setCurrentConversation((prev) =>
          prev.map((msg) => (idsMatch(msg.id, messageId) ? originalMessage : msg))
        );
      }

      throw error;
    }
  }, []);

  /**
   * Delete a message with optimistic update
   */
  const deleteMessage = useCallback(async (messageId, deleteForAll = false) => {
    let originalMessage = null;

    // ⚡ INSTANT UI UPDATE (before API call)
    setCurrentConversation((prev) => {
      if (deleteForAll) {
        // Show "Message deleted" placeholder immediately
        return prev.map((msg) => {
          if (idsMatch(msg.id, messageId)) {
            originalMessage = { ...msg }; // Save for rollback
            return {
              ...msg,
              content: 'تم حذف هذه الرسالة',
              isDeleted: true,
              is_deleted: true,
              deletedForEveryone: true,
            };
          }
          return msg;
        });
      } else {
        // Delete for me: Remove immediately
        const msgToRemove = prev.find((msg) => idsMatch(msg.id, messageId));
        if (msgToRemove) {
          originalMessage = { ...msgToRemove };
        }
        return prev.filter((msg) => !idsMatch(msg.id, messageId));
      }
    });

    try {
      const response = await messagesAPI.deleteMessage(messageId, deleteForAll);
      console.log('[MESSAGES] ✅ Message deleted successfully:', messageId);
      return response;
    } catch (error) {
      console.error('[MESSAGES] ❌ Error deleting message, reverting:', error);

      // Rollback on failure
      if (originalMessage) {
        if (deleteForAll) {
          setCurrentConversation((prev) =>
            prev.map((msg) => (idsMatch(msg.id, messageId) ? originalMessage : msg))
          );
        } else {
          // Re-add message in correct order
          setCurrentConversation((prev) => {
            const newConversation = [...prev, originalMessage];
            return newConversation.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          });
        }
      }

      throw error;
    }
  }, []);

  /**
   * Delete entire conversation with optimistic update
   */
  const deleteConversation = useCallback(
    async (rideType, rideId) => {
      let originalConversations = null;
      let originalConversation = null;
      let originalKey = null;

      console.log('[MESSAGES] 🗑️ Deleting conversation:', { rideType, rideId });

      // ⚡ INSTANT UI CLEAR - Remove from conversations list immediately
      setConversations((prev) => {
        originalConversations = [...prev];
        // Filter out the deleted conversation using safeStringify pattern
        const filtered = prev.filter((conv) => {
          const convRideId = String(conv.rideId || conv.ride_id || '');
          const convRideType = conv.rideType || conv.ride_type || '';
          const matches = convRideId === String(rideId) && convRideType === rideType;
          return !matches;
        });
        console.log(
          '[MESSAGES] 🧹 Optimistically removed conversation from list:',
          prev.length,
          '→',
          filtered.length
        );
        return filtered;
      });

      // ⚡ Also clear current conversation if it matches
      if (currentConversationKey?.startsWith(`${rideType}-${rideId}`)) {
        setCurrentConversation((prev) => {
          originalConversation = [...prev];
          return [];
        });
        originalKey = currentConversationKey;
        console.log('[MESSAGES] 🧹 Optimistic clear of current conversation');
      }

      try {
        const response = await messagesAPI.deleteConversation(rideType, rideId);
        console.log(
          '[MESSAGES] ✅ Conversation deleted successfully from server:',
          rideType,
          rideId
        );

        // Clear state and update unread count
        clearCurrentConversation();
        fetchUnreadCount();

        // Optionally refresh list from server in background (without blocking)
        fetchConversations();

        return response;
      } catch (error) {
        console.error('[MESSAGES] ❌ Error deleting conversation, reverting:', error);

        // Rollback conversations list on failure
        if (originalConversations) {
          setConversations(originalConversations);
          console.log('[MESSAGES] 🔄 Restored conversations list after failure');
        }

        // Rollback current conversation on failure
        if (originalConversation && originalKey === currentConversationKey) {
          setCurrentConversation(originalConversation);
          console.log('[MESSAGES] 🔄 Restored current conversation after failure');
        }

        throw error;
      }
    },
    [currentConversationKey, clearCurrentConversation, fetchConversations, fetchUnreadCount]
  );

  /**
   * Update message in conversation (for socket events)
   */
  const updateMessageInConversation = useCallback((updatedMessage) => {
    setCurrentConversation((prev) =>
      prev.map((msg) =>
        idsMatch(msg.id, updatedMessage.id) ? { ...msg, ...normalizeMessage(updatedMessage) } : msg
      )
    );
  }, []);

  /**
   * Remove message from conversation (for socket delete events)
   */
  const removeMessageFromConversation = useCallback((messageId) => {
    setCurrentConversation((prev) =>
      prev.map((msg) =>
        idsMatch(msg.id, messageId)
          ? { ...msg, content: 'تم حذف هذه الرسالة', isDeleted: true }
          : msg
      )
    );
  }, []);

  /**
   * Mark message as read
   */
  const markAsRead = useCallback(
    async (messageId) => {
      try {
        await messagesAPI.markAsRead(messageId);
        fetchUnreadCount();
      } catch (error) {
        console.error('[MESSAGES] Error marking as read:', error);
      }
    },
    [fetchUnreadCount]
  );

  // ========================================
  // BACKWARD COMPATIBILITY WRAPPERS
  // ========================================
  const getMessages = useCallback(() => currentConversation, [currentConversation]);
  const getUnreadCount = useCallback(() => unreadCount, [unreadCount]);
  const getUserConversations = useCallback(() => conversations, [conversations]);
  const getTotalUnreadCount = useCallback(() => unreadCount, [unreadCount]);

  // ========================================
  // CONTEXT VALUE (memoized for performance)
  // ========================================
  const value = useMemo(
    () => ({
      // State
      conversations,
      currentConversation,
      currentConversationKey,
      unreadCount,
      loading,
      loadingStates,
      pagination,

      // Core functions
      sendMessage,
      editMessage,
      deleteMessage,
      deleteConversation,
      markAsRead,
      fetchConversations,
      fetchConversation,
      fetchRideConversation,
      fetchUnreadCount,
      clearCurrentConversation,
      loadMoreMessages,
      retrySendMessage,

      // Socket update handlers
      updateMessageInConversation,
      removeMessageFromConversation,

      // Backward compatibility
      getMessages,
      getUnreadCount,
      getTotalUnreadCount,
      getUserConversations,
    }),
    [
      conversations,
      currentConversation,
      currentConversationKey,
      unreadCount,
      loading,
      loadingStates,
      pagination,
      sendMessage,
      editMessage,
      deleteMessage,
      deleteConversation,
      markAsRead,
      fetchConversations,
      fetchConversation,
      fetchRideConversation,
      fetchUnreadCount,
      clearCurrentConversation,
      loadMoreMessages,
      retrySendMessage,
      updateMessageInConversation,
      removeMessageFromConversation,
      getMessages,
      getUnreadCount,
      getTotalUnreadCount,
      getUserConversations,
    ]
  );

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
};

// ============================================================
// PROP TYPES
// ============================================================
MessagesProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Default export for convenience
export default MessagesContext;
