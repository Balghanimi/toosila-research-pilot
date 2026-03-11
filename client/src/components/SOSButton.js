import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { sosAPI } from '../services/api';
import './SOSButton.css';

const ALERT_TYPES = [
  { key: 'sos', icon: '🆘', ar: 'طوارئ عامة', en: 'General SOS' },
  { key: 'accident', icon: '💥', ar: 'حادث', en: 'Accident' },
  { key: 'harassment', icon: '🚫', ar: 'تحرش', en: 'Harassment' },
  { key: 'other', icon: '⚠️', ar: 'أخرى', en: 'Other' },
];

const SOSButton = () => {
  const { user } = useAuth();
  const { isArabic } = useLanguage();

  const [showModal, setShowModal] = useState(false);
  const [alertType, setAlertType] = useState('sos');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sentAlert, setSentAlert] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle'); // idle, getting, got, failed
  const [error, setError] = useState(null);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('failed');
      return;
    }

    setLocationStatus('getting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLocationStatus('got');
      },
      () => {
        setLocationStatus('failed');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const handleOpen = () => {
    setShowModal(true);
    setAlertType('sos');
    setMessage('');
    setSentAlert(null);
    setError(null);
    getLocation();
  };

  const handleSend = async () => {
    try {
      setSending(true);
      setError(null);

      const alertData = {
        alertType,
        severity: alertType === 'harassment' ? 'critical' : 'high',
        message: message.trim() || null,
      };

      if (location) {
        alertData.latitude = location.latitude;
        alertData.longitude = location.longitude;
        alertData.locationAccuracy = location.accuracy;
      }

      const response = await sosAPI.trigger(alertData);
      setSentAlert(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleCancelAlert = async () => {
    if (!sentAlert?.alert?.id) return;

    const confirmMsg = isArabic
      ? 'هل أنت متأكد من إلغاء تنبيه الطوارئ؟'
      : 'Are you sure you want to cancel the SOS alert?';

    if (!window.confirm(confirmMsg)) return;

    try {
      await sosAPI.cancelAlert(sentAlert.alert.id);
      setSentAlert(null);
      setShowModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setSentAlert(null);
    setError(null);
  };

  // Don't show SOS button if not logged in
  if (!user) return null;

  return (
    <>
      <div className="sos-button-container">
        <button className="sos-trigger-btn" onClick={handleOpen} title="SOS">
          SOS
        </button>
      </div>

      {showModal && (
        <div className="sos-modal-overlay" onClick={handleClose}>
          <div className="sos-modal" onClick={(e) => e.stopPropagation()}>
            {sentAlert ? (
              /* Success State */
              <div className="sos-success">
                <div className="sos-success-icon">✅</div>
                <h3>{isArabic ? 'تم إرسال التنبيه!' : 'Alert Sent!'}</h3>
                <p>
                  {isArabic
                    ? `تم إبلاغ ${sentAlert.contactsNotified} جهة اتصال`
                    : `${sentAlert.contactsNotified} contacts notified`}
                </p>

                <button className="sos-cancel-alert-btn" onClick={handleCancelAlert}>
                  {isArabic ? 'إلغاء التنبيه (إنذار كاذب)' : 'Cancel Alert (False Alarm)'}
                </button>
                <button className="sos-cancel-btn" onClick={handleClose}>
                  {isArabic ? 'إغلاق' : 'Close'}
                </button>
              </div>
            ) : (
              /* Send Form */
              <>
                <div className="sos-modal-icon">🚨</div>
                <h3>{isArabic ? 'تنبيه طوارئ SOS' : 'SOS Emergency Alert'}</h3>
                <p>
                  {isArabic
                    ? 'اختر نوع الطوارئ وأرسل التنبيه'
                    : 'Select emergency type and send alert'}
                </p>

                {/* Location Status */}
                <div className="sos-location-status">
                  <span
                    className={`sos-location-dot ${locationStatus === 'got' ? 'active' : 'inactive'}`}
                  />
                  {locationStatus === 'getting' &&
                    (isArabic ? 'جاري تحديد الموقع...' : 'Getting location...')}
                  {locationStatus === 'got' && (isArabic ? 'تم تحديد الموقع' : 'Location acquired')}
                  {locationStatus === 'failed' &&
                    (isArabic ? 'الموقع غير متاح' : 'Location unavailable')}
                  {locationStatus === 'idle' && (isArabic ? 'الموقع' : 'Location')}
                </div>

                {/* Alert Types */}
                <div className="sos-types">
                  {ALERT_TYPES.map((type) => (
                    <button
                      key={type.key}
                      className={`sos-type-btn ${alertType === type.key ? 'selected' : ''}`}
                      onClick={() => setAlertType(type.key)}
                    >
                      <span className="sos-type-icon">{type.icon}</span>
                      <span className="sos-type-label">{isArabic ? type.ar : type.en}</span>
                    </button>
                  ))}
                </div>

                {/* Optional Message */}
                <textarea
                  className="sos-message-input"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    isArabic ? 'رسالة إضافية (اختياري)' : 'Additional message (optional)'
                  }
                  maxLength={500}
                />

                {error && <div className="ec-error">{error}</div>}

                <div className="sos-actions">
                  <button className="sos-send-btn" onClick={handleSend} disabled={sending}>
                    {sending
                      ? isArabic
                        ? 'جاري الإرسال...'
                        : 'Sending...'
                      : isArabic
                        ? '🚨 إرسال تنبيه الطوارئ'
                        : '🚨 Send SOS Alert'}
                  </button>
                  <button className="sos-cancel-btn" onClick={handleClose}>
                    {isArabic ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SOSButton;
