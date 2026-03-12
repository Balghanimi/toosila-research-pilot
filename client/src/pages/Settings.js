import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
  ChangePasswordModal,
  UpdateEmailModal,
  DeleteAccountModal,
  UserTypeModal,
} from '../components/SettingsModals';
import { trackFeature } from '../utils/analyticsTracker';

export default function Settings() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { language, changeLanguage } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();

  // Modals state
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showUpdateEmailModal, setShowUpdateEmailModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const settingsGroups = [
    {
      title: '⚙️ الإعدادات العامة',
      items: [
        {
          icon: isDarkMode ? '🌙' : '☀️',
          label: 'الوضع الليلي',
          value: isDarkMode ? 'مفعل' : 'معطل',
          action: toggleTheme,
        },
        {
          icon: '🌐',
          label: 'اللغة',
          value: language === 'ar' ? 'العربية' : 'English',
          action: () => {
            const newLang = language === 'ar' ? 'en' : 'ar';
            trackFeature.languageChanged(newLang);
            changeLanguage(newLang);
          },
        },
        {
          icon: '🔔',
          label: 'الإشعارات',
          value: 'مفعلة',
          action: () => console.log('Toggle notifications'),
        },
      ],
    },
    {
      title: '👤 إعدادات الحساب',
      items: [
        {
          icon: currentUser?.isDriver ? '🚗' : '👤',
          label: 'نوع الحساب',
          value: currentUser?.isDriver ? 'سائق' : 'راكب',
          action: () => setShowUserTypeModal(true),
          highlight: true,
        },
        {
          icon: '📧',
          label: 'البريد الإلكتروني',
          value: currentUser?.email || 'غير محدد',
          action: () => setShowUpdateEmailModal(true),
        },
        {
          icon: '🔑',
          label: 'تغيير كلمة المرور',
          value: '',
          action: () => setShowChangePasswordModal(true),
        },
        {
          icon: '🗑️',
          label: 'حذف الحساب',
          value: '',
          action: () => setShowDeleteAccountModal(true),
          danger: true,
        },
      ],
    },
    {
      title: '🚗 إعدادات السائق',
      items: currentUser?.isDriver
        ? [
            {
              icon: '🚙',
              label: 'معلومات السيارة',
              value: 'إدارة',
              action: () => console.log('Manage vehicle'),
            },
            {
              icon: '💳',
              label: 'طرق الدفع',
              value: 'إدارة',
              action: () => console.log('Payment methods'),
            },
          ]
        : [],
    },
    {
      title: '📋 أخرى',
      items: [
        {
          icon: '📞',
          label: 'اتصل بنا',
          value: '',
          action: () => navigate('/contact'),
        },
        {
          icon: '📜',
          label: 'الشروط والأحكام',
          value: '',
          action: () => console.log('Terms'),
        },
        {
          icon: '🔒',
          label: 'سياسة الخصوصية',
          value: '',
          action: () => navigate('/privacy-policy'),
        },
        {
          icon: 'ℹ️',
          label: 'عن التطبيق',
          value: 'v2.1.15',
          action: () => navigate('/about'),
        },
      ],
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--background)',
        paddingTop: '80px',
        paddingBottom: '100px',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: 'var(--space-4)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-6)',
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'var(--surface-primary)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-md)',
              fontSize: 'var(--text-lg)',
            }}
          >
            ←
          </button>
          <h1
            style={{
              fontSize: 'var(--text-3xl)',
              fontWeight: '800',
              color: 'var(--text-primary)',
              margin: 0,
              fontFamily: '"Cairo", sans-serif',
            }}
          >
            ⚙️ الإعدادات
          </h1>
        </div>

        {/* Settings Groups */}
        {settingsGroups.map(
          (group, groupIndex) =>
            group.items.length > 0 && (
              <div key={groupIndex} style={{ marginBottom: 'var(--space-6)' }}>
                <h2
                  style={{
                    fontSize: 'var(--text-lg)',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-3)',
                    fontFamily: '"Cairo", sans-serif',
                  }}
                >
                  {group.title}
                </h2>

                <div
                  style={{
                    background: 'var(--surface-primary)',
                    borderRadius: 'var(--radius-xl)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-md)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  {group.items.map((item, itemIndex) => (
                    <button
                      key={itemIndex}
                      onClick={item.action}
                      style={{
                        width: '100%',
                        padding: 'var(--space-4)',
                        background: 'transparent',
                        border: 'none',
                        borderBottom:
                          itemIndex < group.items.length - 1
                            ? '1px solid var(--border-light)'
                            : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                        fontFamily: '"Cairo", sans-serif',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--surface-secondary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-3)',
                        }}
                      >
                        <span style={{ fontSize: 'var(--text-xl)' }}>{item.icon}</span>
                        <span
                          style={{
                            fontSize: 'var(--text-base)',
                            fontWeight: '500',
                            color: item.danger ? '#dc2626' : 'var(--text-primary)',
                          }}
                        >
                          {item.label}
                        </span>
                      </div>

                      {item.value && (
                        <span
                          style={{
                            fontSize: 'var(--text-sm)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {item.value}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )
        )}

        {/* Success Message */}
        {successMessage && (
          <div
            style={{
              position: 'fixed',
              top: '100px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#10b981',
              color: 'white',
              padding: '16px 24px',
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              zIndex: 10000,
              fontFamily: '"Cairo", sans-serif',
              fontSize: '16px',
              fontWeight: '600',
              animation: 'slideDown 0.3s ease-out',
            }}
          >
            {successMessage}
          </div>
        )}

        {/* Modals */}
        {showChangePasswordModal && (
          <ChangePasswordModal
            onClose={() => setShowChangePasswordModal(false)}
            onSuccess={(msg) => {
              setSuccessMessage(msg);
              setTimeout(() => setSuccessMessage(''), 3000);
            }}
          />
        )}

        {showUpdateEmailModal && (
          <UpdateEmailModal
            onClose={() => setShowUpdateEmailModal(false)}
            onSuccess={(msg) => {
              setSuccessMessage(msg);
              setTimeout(() => setSuccessMessage(''), 3000);
            }}
          />
        )}

        {showDeleteAccountModal && (
          <DeleteAccountModal
            onClose={() => setShowDeleteAccountModal(false)}
            onSuccess={(msg) => {
              setSuccessMessage(msg);
              setTimeout(() => setSuccessMessage(''), 3000);
            }}
          />
        )}

        {showUserTypeModal && (
          <UserTypeModal
            onClose={() => setShowUserTypeModal(false)}
            onSuccess={(msg) => {
              setSuccessMessage(msg);
              setTimeout(() => setSuccessMessage(''), 3000);
            }}
          />
        )}

        <style>{`
          @keyframes slideDown {
            from {
              transform: translate(-50%, -20px);
              opacity: 0;
            }
            to {
              transform: translate(-50%, 0);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
