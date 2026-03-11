/**
 * NotificationPermissionButton Component
 * زر تفعيل إشعارات الموبايل
 */

import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationsContext';
import '../../styles/NotificationBadge.css';

const NotificationPermissionButton = () => {
  const { requestPushPermission } = useNotifications();
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // تحديث الحالة عند تغيير الإذن
    const checkPermission = () => {
      if (typeof Notification !== 'undefined') {
        setPermission(Notification.permission);
      }
    };

    checkPermission();
    // تحقق كل 5 ثواني
    const interval = setInterval(checkPermission, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRequest = async () => {
    setIsRequesting(true);
    try {
      const granted = await requestPushPermission();
      setPermission(granted ? 'granted' : Notification.permission);

      if (granted) {
        // إظهار إشعار تجريبي
        if (typeof Notification !== 'undefined') {
          new Notification('توصيلة 🚗', {
            body: 'تم تفعيل الإشعارات بنجاح!',
            icon: '/logo-192.png',
            dir: 'rtl',
            lang: 'ar',
          });
        }
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  if (permission === 'granted') {
    return (
      <div
        style={{
          padding: '16px',
          background: 'linear-gradient(135deg, #34c759 0%, #28a745 100%)',
          borderRadius: '12px',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontFamily: '"Cairo", sans-serif',
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(52, 199, 89, 0.25)',
        }}
      >
        <span style={{ fontSize: '24px' }}>✅</span>
        <div>
          <div style={{ fontWeight: '700', marginBottom: '4px' }}>الإشعارات مفعّلة</div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>ستصلك إشعارات فورية عند وجود تحديثات</div>
        </div>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div
        style={{
          padding: '16px',
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          borderRadius: '12px',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontFamily: '"Cairo", sans-serif',
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
        }}
      >
        <span style={{ fontSize: '24px' }}>❌</span>
        <div>
          <div style={{ fontWeight: '700', marginBottom: '4px' }}>الإشعارات محظورة</div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>يرجى تفعيلها من إعدادات المتصفح</div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleRequest}
      disabled={isRequesting}
      style={{
        width: '100%',
        padding: '16px',
        background: isRequesting
          ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
          : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        border: 'none',
        borderRadius: '12px',
        color: 'white',
        fontSize: '16px',
        fontWeight: '700',
        cursor: isRequesting ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        fontFamily: '"Cairo", sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
      }}
      onMouseEnter={(e) => {
        if (!isRequesting) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isRequesting) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
        }
      }}
    >
      {isRequesting ? (
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
          <span>جاري الطلب...</span>
        </>
      ) : (
        <>
          <span style={{ fontSize: '24px' }}>🔔</span>
          <span>تفعيل إشعارات الموبايل</span>
        </>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};

export default NotificationPermissionButton;
