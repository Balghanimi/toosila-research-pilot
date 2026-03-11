import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import { Card, Button, Badge } from '../../components/UI';

/**
 * User Management Page - Enhanced with phone search, OTP history, and admin actions
 */
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    role: '',
    isDriver: '',
    isActive: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState('local'); // 'local' or 'phone'

  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // OTP History Modal State
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [otpHistory, setOtpHistory] = useState([]);
  const [otpLoading, setOtpLoading] = useState(false);

  // Action loading states
  const [actionLoading, setActionLoading] = useState({});

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminAPI.getAllUsers(page, 20, filters);
      setUsers(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'فشل في تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    if (searchMode === 'local') {
      fetchUsers();
    }
  }, [fetchUsers, searchMode]);

  // Phone/Name/Email Search (Server-side)
  const handlePhoneSearch = async () => {
    if (!searchTerm || searchTerm.length < 2) {
      setError('يرجى إدخال 2 أحرف على الأقل للبحث');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSearchMode('phone');

      const response = await adminAPI.searchUsers(searchTerm);
      setUsers(response.users || []);
      setTotalPages(1); // Search doesn't paginate
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'فشل في البحث');
    } finally {
      setLoading(false);
    }
  };

  // Clear search and reload all users
  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchMode('local');
    setPage(1);
    fetchUsers();
  };

  // Fetch OTP History for a user
  const handleViewOTPHistory = async (user) => {
    setSelectedUser(user);
    setShowOTPModal(true);
    setOtpLoading(true);
    setOtpHistory([]);

    try {
      const response = await adminAPI.getOTPHistory(user.phone);
      setOtpHistory(response.otpRequests || []);
    } catch (err) {
      console.error('OTP history error:', err);
      setOtpHistory([]);
    } finally {
      setOtpLoading(false);
    }
  };

  // Admin Reset Password
  const handleResetPassword = async (user) => {
    if (!window.confirm(`هل أنت متأكد من إرسال رمز إعادة تعيين كلمة المرور إلى ${user.name}؟`)) {
      return;
    }

    setActionLoading((prev) => ({ ...prev, [user.id]: 'reset' }));

    try {
      const response = await adminAPI.adminResetPassword(user.id);
      alert(response.message || 'تم إرسال رمز إعادة التعيين');
    } catch (err) {
      alert(err.message || 'فشل في إرسال رمز إعادة التعيين');
    } finally {
      setActionLoading((prev) => ({ ...prev, [user.id]: null }));
    }
  };

  // Admin Verify Phone
  const handleVerifyPhone = async (user) => {
    if (!window.confirm(`هل أنت متأكد من التحقق من رقم هاتف ${user.name}؟`)) {
      return;
    }

    setActionLoading((prev) => ({ ...prev, [user.id]: 'verify' }));

    try {
      const response = await adminAPI.adminVerifyPhone(user.id);
      alert(response.message || 'تم التحقق من الهاتف');
      // Refresh user data
      if (searchMode === 'phone') {
        handlePhoneSearch();
      } else {
        fetchUsers();
      }
    } catch (err) {
      alert(err.message || 'فشل في التحقق من الهاتف');
    } finally {
      setActionLoading((prev) => ({ ...prev, [user.id]: null }));
    }
  };

  // Deactivate user
  const handleDeactivateUser = async (userId) => {
    if (!window.confirm('هل أنت متأكد من تعطيل هذا المستخدم؟')) {
      return;
    }

    setActionLoading((prev) => ({ ...prev, [userId]: 'deactivate' }));

    try {
      await adminAPI.deactivateUser(userId);
      alert('تم تعطيل المستخدم بنجاح');
      fetchUsers();
    } catch (err) {
      alert(err.message || 'فشل في تعطيل المستخدم');
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: null }));
    }
  };

  // Delete user permanently
  const handleDeleteUser = async (user) => {
    const confirmText = `هل أنت متأكد من حذف المستخدم "${user.name}" نهائياً؟\n\nسيتم حذف جميع بياناته (الرسائل، الحجوزات، العروض، الطلبات، التقييمات).\n\nهذا الإجراء لا يمكن التراجع عنه!`;

    if (!window.confirm(confirmText)) {
      return;
    }

    // Double confirmation for safety
    if (!window.confirm('تأكيد نهائي: هل تريد حذف هذا المستخدم بشكل دائم؟')) {
      return;
    }

    setActionLoading((prev) => ({ ...prev, [user.id]: 'delete' }));

    try {
      await adminAPI.deleteUser(user.id);
      alert('تم حذف المستخدم نهائياً');
      if (searchMode === 'phone') {
        handlePhoneSearch();
      } else {
        fetchUsers();
      }
    } catch (err) {
      alert(err.message || 'فشل في حذف المستخدم');
    } finally {
      setActionLoading((prev) => ({ ...prev, [user.id]: null }));
    }
  };

  // Local filter for search
  const filteredUsers =
    searchMode === 'local'
      ? users.filter(
          (user) =>
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.phone?.includes(searchTerm)
        )
      : users;

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && users.length === 0) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>جاري تحميل المستخدمين...</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      {/* Page Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">إدارة المستخدمين</h1>
        <p className="admin-page-subtitle">البحث وإدارة جميع مستخدمي المنصة</p>
      </div>

      {/* Search & Filters */}
      <Card className="filters-card">
        <div className="filters-container">
          {/* Search */}
          <div className="filter-item filter-search">
            <div
              className="search-input-wrapper"
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: '12px',
                alignItems: isMobile ? 'stretch' : 'center',
              }}
            >
              <input
                type="text"
                placeholder="البحث برقم الهاتف، الاسم، أو البريد..."
                className="input-pro"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePhoneSearch()}
                style={{ fontSize: '16px' }} // Prevent iOS zoom
              />
              <div className="search-buttons">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handlePhoneSearch}
                  loading={loading && searchMode === 'phone'}
                >
                  🔍 بحث
                </Button>
                {searchMode === 'phone' && (
                  <Button variant="secondary" size="sm" onClick={handleClearSearch}>
                    ✕ مسح
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Filters (only in local mode) */}
          {searchMode === 'local' && (
            <>
              <div className="filter-item">
                <select
                  className="input-pro"
                  value={filters.role}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                >
                  <option value="">جميع الأدوار</option>
                  <option value="user">مستخدم</option>
                  <option value="admin">مدير</option>
                  <option value="moderator">مشرف</option>
                </select>
              </div>

              <div className="filter-item">
                <select
                  className="input-pro"
                  value={filters.isDriver}
                  onChange={(e) => setFilters({ ...filters, isDriver: e.target.value })}
                >
                  <option value="">الجميع</option>
                  <option value="true">سائقون</option>
                  <option value="false">ركاب</option>
                </select>
              </div>

              <Button variant="secondary" onClick={fetchUsers} loading={loading}>
                تحديث
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="alert-pro alert-pro-error" style={{ marginTop: '20px' }}>
          {error}
        </div>
      )}

      {/* Users Table */}
      <Card className="users-table-card">
        <div className="table-header">
          <h2 className="table-title">
            المستخدمون ({filteredUsers.length})
            {searchMode === 'phone' && <span className="search-badge">نتائج البحث</span>}
          </h2>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <p>لا توجد مستخدمين</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="table-responsive desktop-only">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>الاسم</th>
                    <th>الهاتف</th>
                    <th>البريد</th>
                    <th>النوع</th>
                    <th>الهاتف ✓</th>
                    <th>كلمة المرور</th>
                    <th>تاريخ التسجيل</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <span className="user-name">{user.name}</span>
                            {user.role === 'admin' && (
                              <Badge variant="error" size="sm">
                                مدير
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="phone-cell">
                        <span className="phone-number">{user.phone || '-'}</span>
                        {user.phone && (
                          <button
                            className="otp-history-btn"
                            onClick={() => handleViewOTPHistory(user)}
                            title="عرض سجل OTP"
                          >
                            📋
                          </button>
                        )}
                      </td>
                      <td>{user.email || '-'}</td>
                      <td>
                        {user.isDriver ? (
                          <Badge variant="primary">سائق</Badge>
                        ) : (
                          <Badge variant="neutral">راكب</Badge>
                        )}
                      </td>
                      <td>
                        {user.phoneVerified ? (
                          <span className="verified-badge">✓ موثق</span>
                        ) : (
                          <span className="unverified-badge">✗ غير موثق</span>
                        )}
                      </td>
                      <td>
                        {user.hasPassword ? (
                          <span className="has-password">✓ نعم</span>
                        ) : (
                          <span className="no-password">✗ لا</span>
                        )}
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <div className="action-buttons">
                          {/* Reset Password */}
                          {user.phone && (
                            <Button
                              variant="warning"
                              size="sm"
                              onClick={() => handleResetPassword(user)}
                              loading={actionLoading[user.id] === 'reset'}
                              disabled={!!actionLoading[user.id]}
                            >
                              🔑 إعادة تعيين
                            </Button>
                          )}
                          {/* Verify Phone */}
                          {user.phone && !user.phoneVerified && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleVerifyPhone(user)}
                              loading={actionLoading[user.id] === 'verify'}
                              disabled={!!actionLoading[user.id]}
                            >
                              ✓ توثيق
                            </Button>
                          )}
                          {/* Deactivate */}
                          {user.role !== 'admin' && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeactivateUser(user.id)}
                              loading={actionLoading[user.id] === 'deactivate'}
                              disabled={!!actionLoading[user.id]}
                            >
                              تعطيل
                            </Button>
                          )}
                          {/* Delete Permanently */}
                          {user.role !== 'admin' && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteUser(user)}
                              loading={actionLoading[user.id] === 'delete'}
                              disabled={!!actionLoading[user.id]}
                              style={{ background: '#7f1d1d' }}
                            >
                              🗑️ حذف نهائي
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="mobile-only users-cards">
              {filteredUsers.map((user) => (
                <div key={user.id} className="user-card-mobile">
                  <div className="user-card-header">
                    <div className="user-cell">
                      <div className="user-avatar">{user.name?.charAt(0).toUpperCase() || 'U'}</div>
                      <div>
                        <div className="user-name">{user.name}</div>
                        <div className="user-phone">{user.phone || '-'}</div>
                      </div>
                    </div>
                    {user.phoneVerified ? (
                      <span className="verified-badge">✓ موثق</span>
                    ) : (
                      <span className="unverified-badge">✗ غير موثق</span>
                    )}
                  </div>

                  <div className="user-card-body">
                    <div className="user-info-row">
                      <span className="label">النوع:</span>
                      {user.isDriver ? (
                        <Badge variant="primary">سائق</Badge>
                      ) : (
                        <Badge variant="neutral">راكب</Badge>
                      )}
                    </div>
                    <div className="user-info-row">
                      <span className="label">كلمة المرور:</span>
                      <span>{user.hasPassword ? '✓ نعم' : '✗ لا'}</span>
                    </div>
                    <div className="user-info-row">
                      <span className="label">تاريخ التسجيل:</span>
                      <span>{formatDate(user.createdAt)}</span>
                    </div>
                  </div>

                  <div className="user-card-footer">
                    <div className="action-buttons-mobile">
                      {user.phone && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleViewOTPHistory(user)}
                        >
                          📋 OTP
                        </Button>
                      )}
                      {user.phone && (
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => handleResetPassword(user)}
                          loading={actionLoading[user.id] === 'reset'}
                        >
                          🔑
                        </Button>
                      )}
                      {user.phone && !user.phoneVerified && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleVerifyPhone(user)}
                          loading={actionLoading[user.id] === 'verify'}
                        >
                          ✓
                        </Button>
                      )}
                      {/* Delete Permanently (Mobile) */}
                      {user.role !== 'admin' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          loading={actionLoading[user.id] === 'delete'}
                          style={{ background: '#7f1d1d' }}
                        >
                          🗑️
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Pagination (only in local mode) */}
      {searchMode === 'local' && totalPages > 1 && (
        <div className="pagination">
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            السابق
          </Button>
          <span className="pagination-info">
            صفحة {page} من {totalPages}
          </span>
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            التالي
          </Button>
        </div>
      )}

      {/* OTP History Modal */}
      {showOTPModal && (
        <div className="modal-overlay" onClick={() => setShowOTPModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>سجل رموز التحقق (OTP)</h3>
              <button className="modal-close" onClick={() => setShowOTPModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {selectedUser && (
                <div className="modal-user-info">
                  <strong>{selectedUser.name}</strong>
                  <span>{selectedUser.phone}</span>
                </div>
              )}

              {otpLoading ? (
                <div className="modal-loading">
                  <div className="admin-spinner"></div>
                  <p>جاري التحميل...</p>
                </div>
              ) : otpHistory.length === 0 ? (
                <div className="modal-empty">
                  <p>لا يوجد سجل OTP لهذا الرقم</p>
                </div>
              ) : (
                <table className="otp-table">
                  <thead>
                    <tr>
                      <th>الرمز</th>
                      <th>القناة</th>
                      <th>الحالة</th>
                      <th>تاريخ الإنشاء</th>
                      <th>صلاحية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {otpHistory.map((otp) => (
                      <tr key={otp.id}>
                        <td className="otp-code">{otp.codeMasked}</td>
                        <td>
                          <Badge variant={otp.channel === 'whatsapp' ? 'success' : 'primary'}>
                            {otp.channel === 'whatsapp'
                              ? 'واتساب'
                              : otp.channel === 'sms'
                                ? 'SMS'
                                : otp.channel}
                          </Badge>
                        </td>
                        <td>
                          {otp.verified ? (
                            <span className="verified-badge">✓ مستخدم</span>
                          ) : otp.isValid ? (
                            <span className="pending-badge">⏳ ساري</span>
                          ) : (
                            <span className="expired-badge">✗ منتهي</span>
                          )}
                        </td>
                        <td>{formatDate(otp.createdAt)}</td>
                        <td>{formatDate(otp.expiresAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .user-management {
          animation: fadeIn 0.4s ease-in-out;
        }

        .filters-card {
          margin-bottom: 24px;
        }

        .filters-container {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
        }

        .filter-search {
          flex: 1;
          min-width: 300px;
        }

        .search-input-wrapper {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .search-input-wrapper .input-pro {
          flex: 1;
        }

        .search-buttons {
          display: flex;
          gap: 4px;
        }

        .search-badge {
          background: var(--primary, #34c759);
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          margin-right: 8px;
        }

        .users-table-card {
          margin-top: 24px;
        }

        .table-header {
          padding-bottom: 16px;
          border-bottom: 2px solid var(--color-slate-200, #e2e8f0);
          margin-bottom: 20px;
        }

        .table-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--color-slate-800, #1e293b);
          margin: 0;
          font-family: 'Cairo', sans-serif;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-table th {
          text-align: right;
          padding: 12px 16px;
          background: var(--color-slate-100, #f1f5f9);
          color: var(--color-slate-700, #334155);
          font-weight: 700;
          font-size: 13px;
          font-family: 'Cairo', sans-serif;
          border-bottom: 2px solid var(--color-slate-200, #e2e8f0);
          white-space: nowrap;
        }

        .admin-table td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--color-slate-200, #e2e8f0);
          color: var(--color-slate-700, #334155);
          font-size: 14px;
          font-family: 'Cairo', sans-serif;
        }

        .admin-table tr:hover {
          background: var(--color-slate-50, #f8fafc);
        }

        .user-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, var(--primary, #34c759), var(--primary-dark, #28a745));
          color: white;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
        }

        .user-name {
          font-weight: 600;
          color: var(--color-slate-900, #0f172a);
        }

        .phone-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .phone-number {
          direction: ltr;
          font-family: monospace;
        }

        .otp-history-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          padding: 4px;
          opacity: 0.6;
          transition: opacity 0.2s;
        }

        .otp-history-btn:hover {
          opacity: 1;
        }

        .verified-badge {
          color: #22c55e;
          font-weight: 600;
        }

        .unverified-badge {
          color: #ef4444;
          font-weight: 600;
        }

        .has-password {
          color: #22c55e;
        }

        .no-password {
          color: #f59e0b;
        }

        .action-buttons {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .action-buttons-mobile {
          display: flex;
          gap: 8px;
          justify-content: center;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin-top: 24px;
        }

        .pagination-info {
          font-family: 'Cairo', sans-serif;
          font-weight: 600;
          color: var(--color-slate-700, #334155);
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          max-width: 700px;
          width: 100%;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--color-slate-200, #e2e8f0);
        }

        .modal-header h3 {
          margin: 0;
          font-family: 'Cairo', sans-serif;
          font-weight: 700;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--color-slate-500);
          padding: 4px 8px;
        }

        .modal-body {
          padding: 24px;
          overflow-y: auto;
        }

        .modal-user-info {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 16px;
          background: var(--color-slate-100, #f1f5f9);
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .modal-user-info strong {
          font-family: 'Cairo', sans-serif;
        }

        .modal-user-info span {
          direction: ltr;
          color: var(--color-slate-600);
        }

        .modal-loading,
        .modal-empty {
          text-align: center;
          padding: 40px;
          color: var(--color-slate-500);
        }

        .otp-table {
          width: 100%;
          border-collapse: collapse;
        }

        .otp-table th,
        .otp-table td {
          padding: 12px;
          text-align: right;
          border-bottom: 1px solid var(--color-slate-200, #e2e8f0);
          font-size: 13px;
        }

        .otp-table th {
          background: var(--color-slate-100, #f1f5f9);
          font-weight: 700;
        }

        .otp-code {
          font-family: monospace;
          font-size: 14px;
          letter-spacing: 2px;
        }

        .pending-badge {
          color: #f59e0b;
          font-weight: 600;
        }

        .expired-badge {
          color: #94a3b8;
        }

        /* Mobile/Desktop visibility */
        .desktop-only {
          display: block;
        }

        .mobile-only {
          display: none;
        }

        /* Mobile User Cards */
        .users-cards {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .user-card-mobile {
          background: white;
          border: 1px solid var(--color-slate-200, #e2e8f0);
          border-radius: 12px;
          overflow: hidden;
        }

        .user-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: var(--color-slate-50, #f8fafc);
          border-bottom: 1px solid var(--color-slate-200, #e2e8f0);
        }

        .user-phone {
          font-size: 12px;
          color: var(--color-slate-500);
          direction: ltr;
          text-align: right;
        }

        .user-card-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .user-info-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 14px;
        }

        .user-info-row .label {
          font-weight: 600;
          color: var(--color-slate-600);
        }

        .user-card-footer {
          padding: 12px 16px;
          background: var(--color-slate-50, #f8fafc);
          border-top: 1px solid var(--color-slate-200, #e2e8f0);
        }

        @media (max-width: 768px) {
          .desktop-only {
            display: none;
          }

          .mobile-only {
            display: block;
          }

          .filters-container {
            flex-direction: column;
          }

          .filter-search {
            width: 100%;
          }

          .search-input-wrapper {
            flex-direction: column;
          }

          .search-buttons {
            width: 100%;
            justify-content: stretch;
          }

          .search-buttons button {
            flex: 1;
          }

          .modal-content {
            max-height: 90vh;
          }

          .otp-table {
            font-size: 12px;
          }

          .otp-table th,
          .otp-table td {
            padding: 8px 6px;
          }
        }
      `}</style>
    </div>
  );
};

export default UserManagement;
