/**
 * Notifications Context
 * Context لإدارة الإشعارات على مستوى التطبيق
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { notificationsAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { getFcmToken, onForegroundMessage } from '../config/firebase';

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const prevUnreadCountRef = useRef(0);

  // جلب الإشعارات
  const loadNotifications = useCallback(async () => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await notificationsAPI.getNotifications(20, 0);
      setNotifications(response.data.notifications || []);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError(err.message || 'فشل تحميل الإشعارات');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // دالة تشغيل صوت الإشعار
  const playNotificationSound = useCallback(() => {
    try {
      // طريقة Web Audio API (أفضل توافق)
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // نغمة لطيفة
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;

      oscillator.start();

      // تدرج الصوت
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 300);

      console.log('[NOTIFICATION] 🔊 Sound played successfully');
    } catch (error) {
      console.error('[NOTIFICATION] Failed to play sound:', error);
    }
  }, []);

  // طلب إذن Push Notifications
  const requestPushPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      console.log('[NOTIFICATION] Permission result:', permission);
      return permission === 'granted';
    }

    return false;
  }, []);

  // إظهار Browser Notification
  const showBrowserNotification = useCallback((title, body, data = {}) => {
    if (Notification.permission === 'granted') {
      // تحقق إذا التطبيق في الخلفية
      if (document.hidden) {
        const notification = new Notification(title, {
          body,
          icon: '/logo-192.png',
          badge: '/logo-192.png',
          dir: 'rtl',
          lang: 'ar',
          tag: 'toosila-' + Date.now(),
          renotify: true,
          data,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
          // التنقل إلى الصفحة المناسبة
          if (data.url) {
            window.location.href = data.url;
          }
        };

        console.log('[NOTIFICATION] 📬 Browser notification shown');
      }
    }
  }, []);

  // جلب عدد الإشعارات غير المقروءة
  const loadUnreadCount = useCallback(async () => {
    console.log('[NOTIFICATIONS] loadUnreadCount called, currentUser:', currentUser?.id);
    if (!currentUser) {
      console.log('[NOTIFICATIONS] No currentUser, setting unreadCount to 0');
      prevUnreadCountRef.current = 0;
      setUnreadCount(0);
      return;
    }

    try {
      console.log('[NOTIFICATIONS] Fetching unread count from API...');
      const response = await notificationsAPI.getUnreadCount();
      console.log('[NOTIFICATIONS] API Response:', response);
      const count = response.data?.unreadCount || response.unreadCount || 0;
      console.log('[NOTIFICATIONS] Setting unreadCount to:', count);

      // إذا زاد العدد = إشعار جديد
      if (count > prevUnreadCountRef.current) {
        console.log('[NOTIFICATION] 🔔 New notification detected via polling!');
        playNotificationSound();
      }

      prevUnreadCountRef.current = count;
      setUnreadCount(count);
    } catch (err) {
      console.error('[NOTIFICATIONS] Error loading unread count:', err);
    }
  }, [currentUser, playNotificationSound]);

  // تحديد إشعار كمقروء
  const markAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);

      // تحديث الحالة المحلية
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === notificationId ? { ...notif, isRead: true } : notif))
      );

      // تقليل العداد
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  };

  // تحديد جميع الإشعارات كمقروءة
  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();

      // تحديث الحالة المحلية
      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));

      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
      throw err;
    }
  };

  // حذف إشعار
  const deleteNotification = async (notificationId) => {
    try {
      await notificationsAPI.delete(notificationId);

      // إزالة من القائمة المحلية
      const deletedNotif = notifications.find((n) => n.id === notificationId);
      setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));

      // إذا كان غير مقروء، تقليل العداد
      if (deletedNotif && !deletedNotif.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      throw err;
    }
  };

  // تحديث (refresh) الإشعارات
  const refresh = () => {
    loadNotifications();
    loadUnreadCount();
  };

  // تسجيل رمز FCM عند تسجيل الدخول
  const registerFcmToken = useCallback(async () => {
    if (!currentUser) return;

    const permitted = await requestPushPermission();
    if (!permitted) return;

    const token = await getFcmToken();
    if (!token) return;

    try {
      const deviceInfo = `${navigator.userAgent.substring(0, 100)}`;
      await notificationsAPI.registerFcmToken(token, deviceInfo);
      console.log('[FCM] Token registered');
    } catch (err) {
      console.error('[FCM] Token registration failed:', err);
    }
  }, [currentUser, requestPushPermission]);

  // طلب الإذن وتسجيل FCM عند تسجيل الدخول
  useEffect(() => {
    if (currentUser) {
      registerFcmToken();
    }
  }, [currentUser, registerFcmToken]);

  // الاستماع لرسائل FCM في المقدمة (عندما التطبيق مفتوح)
  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      console.log('[FCM] Foreground message:', payload);
      // Socket.io handles in-app notifications when visible,
      // only show browser notification if page is hidden
      if (document.hidden) {
        const { title, body } = payload.notification || {};
        if (title) {
          playNotificationSound();
          showBrowserNotification(title, body, payload.data);
        }
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [playNotificationSound, showBrowserNotification]);

  // الاستماع للإشعارات الفورية عبر Socket.IO
  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleNewNotification = (notification) => {
      console.log('[NOTIFICATION] 📬 New notification received via Socket:', notification);

      // تشغيل الصوت
      playNotificationSound();

      // تحديث القائمة
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      prevUnreadCountRef.current = prevUnreadCountRef.current + 1;

      // إظهار Browser Push Notification
      showBrowserNotification(
        notification.title || 'إشعار جديد',
        notification.message || notification.body,
        { url: '/notifications' }
      );
    };

    socket.on('notification', handleNewNotification);

    return () => {
      socket.off('notification', handleNewNotification);
    };
  }, [socket, currentUser, playNotificationSound, showBrowserNotification]);

  // جلب الإشعارات عند التحميل والتسجيل
  useEffect(() => {
    if (currentUser) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [currentUser, loadNotifications, loadUnreadCount]);

  // Polling: جلب العدد غير المقروء كل 30 ثانية
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000); // 30 ثانية

    return () => clearInterval(interval);
  }, [currentUser, loadUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    playNotificationSound,
    requestPushPermission,
    showBrowserNotification,
  };

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};

// Hook لاستخدام context
export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
};

export default NotificationsContext;
