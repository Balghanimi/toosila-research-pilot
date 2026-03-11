import React, { useState, useEffect, useCallback } from 'react';
import { sosAPI } from '../../services/api';
import './SOSManagement.css';

const SOSManagement = () => {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  // Resolve modal state
  const [resolveModal, setResolveModal] = useState(null);
  const [resolveNotes, setResolveNotes] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const response = await sosAPI.adminGetStats();
      setStats(response.data?.stats || null);
    } catch (err) {
      console.error('Error fetching SOS stats:', err);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (showActiveOnly) {
        response = await sosAPI.adminGetActive(page, 20);
      } else {
        const filters = {};
        if (statusFilter) filters.status = statusFilter;
        response = await sosAPI.adminGetAll(page, 20, filters);
      }

      setAlerts(response.data?.alerts || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.message || 'فشل في تحميل التنبيهات');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, showActiveOnly]);

  useEffect(() => {
    fetchStats();
    fetchAlerts();
  }, [fetchStats, fetchAlerts]);

  const handleAcknowledge = async (alertId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [alertId]: 'acknowledge' }));
      await sosAPI.adminAcknowledge(alertId);
      await fetchAlerts();
      await fetchStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [alertId]: null }));
    }
  };

  const handleResolve = async () => {
    if (!resolveModal) return;
    try {
      setActionLoading((prev) => ({ ...prev, [resolveModal]: 'resolve' }));
      await sosAPI.adminResolve(resolveModal, resolveNotes);
      setResolveModal(null);
      setResolveNotes('');
      await fetchAlerts();
      await fetchStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [resolveModal]: null }));
    }
  };

  const handleFalseAlarm = async (alertId) => {
    if (!window.confirm('هل أنت متأكد من تحديد هذا التنبيه كإنذار كاذب؟')) return;
    try {
      setActionLoading((prev) => ({ ...prev, [alertId]: 'false-alarm' }));
      await sosAPI.adminFalseAlarm(alertId, 'إنذار كاذب - حدد بواسطة المشرف');
      await fetchAlerts();
      await fetchStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [alertId]: null }));
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAlertTypeLabel = (type) => {
    const types = {
      sos: 'طوارئ',
      panic: 'ذعر',
      accident: 'حادث',
      harassment: 'تحرش',
      other: 'أخرى',
    };
    return types[type] || type;
  };

  const getStatusLabel = (status) => {
    const statuses = {
      active: 'نشط',
      acknowledged: 'تم الإقرار',
      resolved: 'تم الحل',
      false_alarm: 'إنذار كاذب',
    };
    return statuses[status] || status;
  };

  return (
    <div className="sos-management">
      <h2>🚨 إدارة تنبيهات الطوارئ</h2>

      {/* Stats */}
      {stats && (
        <div className="sos-stats-grid">
          <div className="sos-stat-card">
            <div className="stat-value">{stats.total_alerts || 0}</div>
            <div className="stat-label">إجمالي التنبيهات</div>
          </div>
          <div className="sos-stat-card active">
            <div className="stat-value">{stats.active_count || 0}</div>
            <div className="stat-label">نشط</div>
          </div>
          <div className="sos-stat-card critical">
            <div className="stat-value">{stats.critical_count || 0}</div>
            <div className="stat-label">حرج</div>
          </div>
          <div className="sos-stat-card resolved">
            <div className="stat-value">{stats.resolved_count || 0}</div>
            <div className="stat-label">تم الحل</div>
          </div>
          <div className="sos-stat-card">
            <div className="stat-value">{stats.today_count || 0}</div>
            <div className="stat-label">اليوم</div>
          </div>
          <div className="sos-stat-card">
            <div className="stat-value">{stats.false_alarm_count || 0}</div>
            <div className="stat-label">إنذار كاذب</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="sos-filters">
        <button
          className={`sos-filter-btn ${showActiveOnly ? 'active' : ''}`}
          onClick={() => {
            setShowActiveOnly(!showActiveOnly);
            setStatusFilter('');
            setPage(1);
          }}
        >
          🔴 النشطة فقط
        </button>

        {!showActiveOnly && (
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="acknowledged">تم الإقرار</option>
            <option value="resolved">تم الحل</option>
            <option value="false_alarm">إنذار كاذب</option>
          </select>
        )}
      </div>

      {error && <div className="sos-error">{error}</div>}

      {loading ? (
        <div className="sos-loading">جاري التحميل...</div>
      ) : alerts.length === 0 ? (
        <div className="sos-empty">
          <div className="sos-empty-icon">✅</div>
          <h3>لا توجد تنبيهات</h3>
          <p>لا توجد تنبيهات طوارئ مطابقة للفلاتر المحددة</p>
        </div>
      ) : (
        <>
          <div className="sos-alert-list">
            {alerts.map((alert) => (
              <div key={alert.id} className={`sos-alert-card severity-${alert.severity || 'high'}`}>
                <div className="sos-alert-header">
                  <span className="sos-alert-user">
                    👤 {alert.userName || alert.userEmail || 'مستخدم'}
                  </span>
                  <div className="sos-alert-badges">
                    <span className={`sos-badge status-${alert.status}`}>
                      {getStatusLabel(alert.status)}
                    </span>
                    <span className="sos-badge type-badge">
                      {getAlertTypeLabel(alert.alertType || alert.alert_type)}
                    </span>
                  </div>
                </div>

                <div className="sos-alert-meta">
                  <span>📅 {formatDate(alert.createdAt || alert.created_at)}</span>
                  {alert.userPhone && <span>📞 {alert.userPhone}</span>}
                  {(alert.latitude || alert.lat) && (
                    <span>
                      📍 {alert.latitude || alert.lat}, {alert.longitude || alert.lng}
                    </span>
                  )}
                </div>

                {alert.message && <div className="sos-alert-message">💬 {alert.message}</div>}

                {alert.resolutionNotes && (
                  <div className="sos-alert-message">
                    📝 {alert.resolutionNotes || alert.resolution_notes}
                  </div>
                )}

                {(alert.status === 'active' || alert.status === 'acknowledged') && (
                  <div className="sos-alert-actions">
                    {alert.status === 'active' && (
                      <button
                        className="sos-action-btn acknowledge"
                        onClick={() => handleAcknowledge(alert.id)}
                        disabled={!!actionLoading[alert.id]}
                      >
                        {actionLoading[alert.id] === 'acknowledge' ? '...' : '👁️ إقرار'}
                      </button>
                    )}
                    <button
                      className="sos-action-btn resolve"
                      onClick={() => {
                        setResolveModal(alert.id);
                        setResolveNotes('');
                      }}
                      disabled={!!actionLoading[alert.id]}
                    >
                      ✅ حل
                    </button>
                    <button
                      className="sos-action-btn false-alarm"
                      onClick={() => handleFalseAlarm(alert.id)}
                      disabled={!!actionLoading[alert.id]}
                    >
                      ❌ إنذار كاذب
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="sos-pagination">
              <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
                السابق
              </button>
              <span>
                {page} / {totalPages}
              </span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
                التالي
              </button>
            </div>
          )}
        </>
      )}

      {/* Resolve Modal */}
      {resolveModal && (
        <div className="sos-resolve-modal" onClick={() => setResolveModal(null)}>
          <div className="sos-resolve-content" onClick={(e) => e.stopPropagation()}>
            <h3>حل التنبيه</h3>
            <textarea
              value={resolveNotes}
              onChange={(e) => setResolveNotes(e.target.value)}
              placeholder="ملاحظات الحل (اختياري)"
            />
            <div className="sos-resolve-actions">
              <button
                style={{ background: '#dcfce7', color: '#166534' }}
                onClick={handleResolve}
                disabled={!!actionLoading[resolveModal]}
              >
                {actionLoading[resolveModal] === 'resolve' ? '...' : 'حل التنبيه'}
              </button>
              <button
                style={{ background: '#f3f4f6', color: '#374151' }}
                onClick={() => setResolveModal(null)}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SOSManagement;
